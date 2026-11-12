/**
 * Mastery Zone — Unified Recording Playback Engine
 *
 * Single source of truth for authenticating, authorizing and streaming recorded
 * meeting / proctoring videos. Used by:
 *   - GET /api/recordings/stream/:filename
 *   - GET /api/recordings/download/:filename
 *   - GET /recordings/:filename            (legacy URLs stored on older records)
 *
 * Guarantees:
 *   - Works for legacy records (fileUrl "/recordings/x.webm", no streamUrl) and new ones.
 *   - Authorization is resolved from the DATABASE (fresh role / email), so recordings keep
 *     opening after re-login, on another device / OS, or after a role change.
 *   - Owners are matched by userId OR email (re-registered / OAuth-linked accounts).
 *   - RFC 7233 compliant byte ranges (open, closed and suffix ranges) for Safari/iOS/Chrome/Firefox.
 *   - Optional on-demand MP4 (H.264/AAC, faststart) rendition via ?format=mp4 for browsers
 *     that cannot decode WebM (older Safari / iOS). Renditions are cached on disk.
 *   - Path traversal protection via resolveRecordingFilePath / isPathInsideRecordingsDir.
 */
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { getJwtSecret } = require("../config/jwtConfig");
const {
  getRecordingsDir,
  resolveRecordingFilePath,
  isPathInsideRecordingsDir,
} = require("../config/recordingStorage");

const ADMIN_ROLES = new Set(["admin", "super_admin", "superadmin"]);

function getFfmpegBinary() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
    if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
      return ffmpegInstaller.path;
    }
  } catch {}
  return "ffmpeg";
}

/** Extracts a safe bare filename from a raw param / URL / recordingId. Returns "" if unsafe. */
function sanitizeFilename(raw) {
  let value = String(raw || "").trim();
  try {
    value = decodeURIComponent(value);
  } catch {}
  value = value.split("?")[0].split("#")[0];
  if (!value || value.includes("..") || value.includes("/") || value.includes("\\") || value.includes("\0")) {
    return "";
  }
  return path.basename(value);
}

function extractToken(req) {
  const authHeader = req.headers["authorization"];
  const headerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const candidates = [headerToken, req.query?.token, req.cookies?.token].filter(
    (t) => typeof t === "string" && t && t !== "null" && t !== "undefined"
  );
  return candidates[0] || null;
}

/**
 * Verifies the JWT and enriches it with the live database user so that admin status
 * and email are always current (never trusting stale token claims alone).
 */
async function resolveViewer(rawToken) {
  if (!rawToken) return { error: 401, message: "Authentication required to access recording" };
  let decoded;
  try {
    decoded = jwt.verify(rawToken, getJwtSecret());
  } catch {
    return { error: 401, message: "Invalid or expired session token" };
  }

  const userId = String(decoded.userId || decoded.id || decoded._id || "");
  let email = String(decoded.email || "").toLowerCase().trim();
  let role = String(decoded.role || "").toLowerCase();
  let isMainAdmin = decoded.isMainAdmin === true;

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      const User = require("../models/User");
      const user = await User.findById(userId).select("email role isMainAdmin").lean();
      if (user) {
        email = String(user.email || email).toLowerCase().trim();
        role = String(user.role || role).toLowerCase();
        isMainAdmin = isMainAdmin || user.isMainAdmin === true;
      }
    } catch {}
  }

  const mainAdminEmail = String(process.env.MAIN_ADMIN_EMAIL || "").toLowerCase().trim();
  if (mainAdminEmail && email && email === mainAdminEmail) isMainAdmin = true;

  const isAdmin = Boolean(isMainAdmin || ADMIN_ROLES.has(role));
  return { userId, email, isAdmin };
}

async function findRecordingByFilename(filename) {
  const Recording = require("../models/Recording");
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const baseId = filename.replace(/\.[^/.]+$/, "");
  return Recording.findOne({
    $or: [
      { streamUrl: `/api/recordings/stream/${filename}` },
      { fileUrl: `/recordings/${filename}` },
      { fileUrl: `/uploads/recordings/${filename}` },
      { fileUrl: { $regex: `(^|/)${escaped}(\\?.*)?$` } },
      { streamUrl: { $regex: `(^|/)${escaped}(\\?.*)?$` } },
      { filePath: { $regex: `(^|[\\\\/])${escaped}$` } },
      { fileName: filename },
      { recordingId: baseId },
      { recordingId: filename },
    ],
  }).lean();
}

/** Proctoring recordings live on ProctoredCodingSession / CertificationAttempt docs (recordingUrl). */
async function findProctoringOwnerId(filename) {
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const query = { recordingUrl: { $regex: `(^|/)${escaped}(\\?.*)?$` } };
  for (const modelName of ["ProctoredCodingSession", "CertificationAttempt"]) {
    try {
      const Model = require(`../models/${modelName}`);
      const doc = await Model.findOne(query).select("userId").lean();
      if (doc && doc.userId) return String(doc.userId);
    } catch {}
  }
  return null;
}

async function canViewRecording(viewer, recording) {
  if (viewer.isAdmin) return true;
  if (!recording || !viewer.userId) return false;

  const uid = viewer.userId;
  if (String(recording.hostUserId || "") === uid) return true;
  if ((recording.participantUserIds || []).map(String).includes(uid)) return true;
  if (viewer.email && String(recording.hostEmail || "").toLowerCase().trim() === viewer.email) return true;

  if (recording.meetingId) {
    try {
      const Meeting = require("../models/Meeting");
      const meeting = await Meeting.findOne({
        meetingId: recording.meetingId,
        $or: [{ hostUserId: uid }, { "participants.userId": uid }],
      }).lean();
      if (meeting) return true;
    } catch {}
  }
  return false;
}

// ---------- MP4 rendition (cross-OS compatibility for browsers without WebM) ----------
const inFlightRenditions = new Map();

function getRenditionPath(sourcePath) {
  const cacheDir = path.join(getRecordingsDir(), ".renditions");
  try {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  } catch {}
  return path.join(cacheDir, `${path.basename(sourcePath, path.extname(sourcePath))}.mp4`);
}

function ensureMp4Rendition(sourcePath) {
  const target = getRenditionPath(sourcePath);
  try {
    if (fs.existsSync(target)) {
      const src = fs.statSync(sourcePath);
      const dst = fs.statSync(target);
      if (dst.size > 0 && dst.mtimeMs >= src.mtimeMs) return Promise.resolve(target);
    }
  } catch {}
  if (inFlightRenditions.has(target)) return inFlightRenditions.get(target);

  const tmp = `${target}.${process.pid}.tmp.mp4`;
  const job = new Promise((resolve) => {
    execFile(
      getFfmpegBinary(),
      [
        "-y", "-v", "error",
        "-i", sourcePath,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-pix_fmt", "yuv420p",
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        tmp,
      ],
      { timeout: 10 * 60 * 1000, maxBuffer: 8 * 1024 * 1024 },
      (err) => {
        if (err) {
          try { fs.existsSync(tmp) && fs.unlinkSync(tmp); } catch {}
          console.warn("[recordings] MP4 rendition failed, serving original:", err.message);
          return resolve(null);
        }
        try {
          fs.renameSync(tmp, target);
          resolve(target);
        } catch {
          resolve(null);
        }
      }
    );
  }).finally(() => inFlightRenditions.delete(target));

  inFlightRenditions.set(target, job);
  return job;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".mp4" || ext === ".m4v") return "video/mp4";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".mkv") return "video/x-matroska";
  return "video/webm";
}

/** RFC 7233 byte-range parser: supports "a-b", "a-" and suffix "-n". */
function parseRange(rangeHeader, fileSize) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(rangeHeader || "").split(",")[0].trim());
  if (!match) return null;
  const [, startStr, endStr] = match;
  let start;
  let end;
  if (startStr === "" && endStr === "") return null;
  if (startStr === "") {
    const suffix = parseInt(endStr, 10);
    start = Math.max(0, fileSize - suffix);
    end = fileSize - 1;
  } else {
    start = parseInt(startStr, 10);
    if (endStr === "") {
      const CHUNK_SIZE = 1.5 * 1024 * 1024;
      end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
    } else {
      end = Math.min(parseInt(endStr, 10), fileSize - 1);
    }
  }
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
    return { unsatisfiable: true };
  }
  return { start, end };
}

function sendVideoFile(req, res, filePath, { download = false, downloadName } = {}) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const contentType = contentTypeFor(filePath);

  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Range, Authorization, Content-Type");
  res.setHeader("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length, Content-Type");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cache-Control", "private, no-cache, must-revalidate");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", contentType);
  res.setHeader("Last-Modified", stat.mtime.toUTCString());
  if (download) {
    const name = String(downloadName || path.basename(filePath)).replace(/["\r\n]/g, "");
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  } else {
    res.setHeader("Content-Disposition", "inline");
  }

  if (req.method === "HEAD") {
    res.setHeader("Content-Length", fileSize);
    return res.status(200).end();
  }

  const pipeStream = (stream) => {
    stream.on("error", () => {
      if (!res.headersSent) res.status(500).end();
      else res.destroy();
    });
    res.on("close", () => stream.destroy());
    stream.pipe(res);
  };

  if (req.headers.range && fileSize > 0) {
    const range = parseRange(req.headers.range, fileSize);
    if (range && range.unsatisfiable) {
      res.setHeader("Content-Range", `bytes */${fileSize}`);
      return res.status(416).send("Requested range not satisfiable");
    }
    if (range) {
      const { start, end } = range;
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": end - start + 1,
      });
      return pipeStream(fs.createReadStream(filePath, { start, end }));
    }
  }

  res.writeHead(200, { "Content-Length": fileSize });
  return pipeStream(fs.createReadStream(filePath));
}

/**
 * Full request handler. `rawName` can be a filename, a recordingId, or a URL tail.
 */
async function handleRecordingRequest(req, res, rawName, { download = false } = {}) {
  try {
    const filename = sanitizeFilename(rawName);
    if (!filename) return res.status(400).send("Invalid filename");

    const viewer = await resolveViewer(extractToken(req));
    if (viewer.error) return res.status(viewer.error).send(viewer.message);

    let recording = await findRecordingByFilename(filename);

    // Accept bare recordingId (no extension) by resolving to the stored file name.
    let lookupName = filename;
    if (recording && !path.extname(filename)) {
      const stored = recording.fileName || recording.fileUrl || recording.streamUrl || recording.filePath || "";
      lookupName = sanitizeFilename(String(stored).split(/[\\/]/).pop()) || `${filename}.webm`;
    }

    const filePath = resolveRecordingFilePath(lookupName, recording);
    if (!filePath || !fs.existsSync(filePath) || !isPathInsideRecordingsDir(filePath)) {
      return res.status(404).send("Recording file not found");
    }

    let allowed = await canViewRecording(viewer, recording);
    if (!allowed && !recording && viewer.userId) {
      // Proctoring recordings (no Recording document): owner of the proctored session may view.
      const ownerId = await findProctoringOwnerId(lookupName);
      allowed = Boolean(ownerId && ownerId === viewer.userId);
    }
    if (!allowed) {
      if (!recording) return res.status(404).send("Recording record not found");
      return res.status(403).send("Forbidden: You do not have permission to access this recording");
    }

    let servePath = filePath;
    const wantsMp4 = String(req.query.format || "").toLowerCase() === "mp4";
    if (wantsMp4 && contentTypeFor(filePath) !== "video/mp4") {
      const rendition = await ensureMp4Rendition(filePath);
      if (rendition && isPathInsideRecordingsDir(rendition)) servePath = rendition;
    }

    const titleBase = String(recording?.title || path.basename(servePath, path.extname(servePath)))
      .replace(/[^\w\- ]+/g, "")
      .trim() || "recording";
    return sendVideoFile(req, res, servePath, {
      download,
      downloadName: download ? `${titleBase}${path.extname(servePath)}` : undefined,
    });
  } catch (err) {
    console.error("[recordings] playback error:", err);
    if (!res.headersSent) res.status(500).send("Streaming error");
  }
}

module.exports = {
  handleRecordingRequest,
  sanitizeFilename,
  resolveViewer,
  canViewRecording,
  findRecordingByFilename,
  parseRange,
  sendVideoFile,
  ensureMp4Rendition,
};
