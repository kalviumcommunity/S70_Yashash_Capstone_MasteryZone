const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { execFile } = require("child_process");
const busboy = require("busboy");
const Recording = require("../models/Recording");
const authenticateToken = require("../middleware/authMiddleware");

// Uploads directory path (Supports persistent cloud disk mount via RECORDINGS_STORAGE_PATH)
const {
  getRecordingsDir,
  resolveRecordingFilePath,
  safeDeleteRecordingFile,
} = require("../config/recordingStorage");
const RECORDINGS_DIR = getRecordingsDir();

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

function getFfprobeBinary() {
  if (process.env.FFPROBE_PATH) return process.env.FFPROBE_PATH;
  try {
    const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
    if (ffprobeInstaller && ffprobeInstaller.path && fs.existsSync(ffprobeInstaller.path)) {
      return ffprobeInstaller.path;
    }
  } catch {}
  return "ffprobe";
}

async function verifyFrameDecodability(filePath) {
  return new Promise((resolve) => {
    execFile(
      getFfmpegBinary(),
      [
        "-v", "error",
        "-i", filePath,
        "-frames:v", "1",
        "-f", "null",
        "-",
      ],
      { timeout: 5000 },
      (err) => {
        if (err) {
          if (err.code !== "ENOENT") {
            return resolve({ valid: false, error: "ffmpeg frame decode failed: corrupted media stream" });
          }
          return resolve(null); // ffmpeg not installed on host
        }
        resolve({ valid: true });
      }
    );
  });
}

async function probeWithFfprobe(filePath) {
  return new Promise((resolve) => {
    execFile(
      getFfprobeBinary(),
      [
        "-v", "error",
        "-show_streams",
        "-show_format",
        "-of", "json",
        filePath,
      ],
      { timeout: 5000 },
      (err, stdout) => {
        if (err) {
          // If ffprobe binary exists but failed to decode, treat as decoding failure
          if (err.code !== "ENOENT") {
            return resolve({ error: err.message || "ffprobe decoding error: invalid or corrupted media file" });
          }
          // ffprobe is not installed on the host
          return resolve(null);
        }
        if (!stdout) return resolve(null);
        try {
          const parsed = JSON.parse(stdout);
          resolve(parsed);
        } catch {
          resolve({ error: "ffprobe output parse error: corrupted media header" });
        }
      }
    );
  });
}

function inspectMediaBinary(buffer, expectedDuration = null) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { valid: false, error: "Invalid media buffer payload" };
  }

  if (buffer.length < 500) {
    return { valid: false, error: "Media file too small to contain valid video stream" };
  }

  if (expectedDuration !== null && expectedDuration !== undefined) {
    const dur = Number(expectedDuration);
    if (!Number.isFinite(dur) || dur <= 0) {
      return { valid: false, error: "Recording duration must be a valid positive number of seconds." };
    }
  }

  // 1. WebM EBML Check
  const isWebM =
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3;

  if (isWebM) {
    let hasTracks = false;
    let hasCluster = false;
    let hasVideoTrack = false;
    let hasAudioTrack = false;
    let hasWebmDocType = false;
    let hasSegment = false;

    const scanLimit = Math.min(buffer.length - 4, 65536);
    for (let i = 0; i < scanLimit; i++) {
      if (
        buffer[i] === 0x42 &&
        buffer[i + 1] === 0x82 &&
        buffer[i + 2] === 0x84 &&
        buffer.toString("ascii", i + 3, i + 7) === "webm"
      ) {
        hasWebmDocType = true;
      }
      if (
        buffer[i] === 0x18 &&
        buffer[i + 1] === 0x53 &&
        buffer[i + 2] === 0x80 &&
        buffer[i + 3] === 0x67
      ) {
        hasSegment = true;
      }
      if (
        buffer[i] === 0x16 &&
        buffer[i + 1] === 0x54 &&
        buffer[i + 2] === 0xae &&
        buffer[i + 3] === 0x6b
      ) {
        hasTracks = true;
      }
      if (
        buffer[i] === 0x1f &&
        buffer[i + 1] === 0x43 &&
        buffer[i + 2] === 0xb6 &&
        buffer[i + 3] === 0x75
      ) {
        hasCluster = true;
      }
      if (buffer[i] === 0x83 && (buffer[i + 1] === 0x01 || buffer[i + 1] === 0x81)) {
        if (buffer[i + 2] === 0x01 || buffer[i + 1] === 0x01) {
          hasVideoTrack = true;
        }
      }
      if (buffer[i] === 0x83 && (buffer[i + 1] === 0x02 || buffer[i + 1] === 0x81)) {
        if (buffer[i + 2] === 0x02 || buffer[i + 1] === 0x02) {
          hasAudioTrack = true;
        }
      }
      if (buffer.toString("ascii", i, i + 5) === "V_VP8" || buffer.toString("ascii", i, i + 5) === "V_VP9" || buffer.toString("ascii", i, i + 5) === "V_AV1") {
        hasVideoTrack = true;
      }
      if (buffer.toString("ascii", i, i + 6) === "A_OPUS" || buffer.toString("ascii", i, i + 8) === "A_VORBIS" || buffer.toString("ascii", i, i + 5) === "A_AAC") {
        hasAudioTrack = true;
      }
    }

    if (!hasSegment || !hasTracks || !hasCluster) {
      return { valid: false, error: "WebM container is missing track headers or cluster data" };
    }
    if (!hasVideoTrack) {
      return { valid: false, error: "Recording missing required video stream. Audio-only uploads are not accepted as meeting video recordings." };
    }
    if (!hasAudioTrack) {
      return { valid: false, error: "Recording missing required audio stream. Meeting recordings require both audio and video streams." };
    }

    return { valid: true, container: "webm", hasVideo: true, hasAudio: true };
  }

  // 2. MP4 Check
  const isMp4 = buffer.length >= 8 && buffer.toString("ascii", 4, 8) === "ftyp";
  if (isMp4) {
    const scanLimit = Math.min(buffer.length - 4, 65536);
    let hasMoov = false;
    let hasMdat = false;
    let hasVideoTrack = false;
    let hasAudioTrack = false;
    for (let i = 0; i < scanLimit; i++) {
      const box = buffer.toString("ascii", i, i + 4);
      if (box === "moov" || box === "moof") {
        hasMoov = true;
      }
      if (box === "mdat") {
        hasMdat = true;
      }
      if (box === "vide" || box === "avc1" || box === "hev1" || box === "mp4v") {
        hasVideoTrack = true;
      }
      if (box === "soun" || box === "mp4a") {
        hasAudioTrack = true;
      }
    }
    if (!hasMoov && !hasMdat) {
      return { valid: false, error: "MP4 container is missing moov/mdat payload atoms" };
    }
    if (!hasVideoTrack) {
      return { valid: false, error: "Recording missing required video stream. Audio-only uploads are not accepted as meeting video recordings." };
    }
    if (!hasAudioTrack) {
      return { valid: false, error: "Recording missing required audio stream. Meeting recordings require both audio and video streams." };
    }
    return { valid: true, container: "mp4", hasVideo: true, hasAudio: true };
  }

  return { valid: false, error: "Unrecognized or corrupted video container" };
}

async function validateMediaIntegrity(filePath, buffer, expectedDuration = null) {
  const probeData = await probeWithFfprobe(filePath);
  if (probeData) {
    if (probeData.error) {
      return { valid: false, error: `Media decoding failed: ${probeData.error}` };
    }
    if (Array.isArray(probeData.streams) && probeData.streams.length > 0) {
      const hasVideo = probeData.streams.some((s) => s.codec_type === "video");
      const hasAudio = probeData.streams.some((s) => s.codec_type === "audio");
      if (!hasVideo) {
        return { valid: false, error: "Recording missing required video stream. Audio-only uploads are not accepted as meeting video recordings." };
      }
      if (!hasAudio) {
        return { valid: false, error: "Recording missing required audio stream. Meeting recordings require both audio and video streams." };
      }
      const rawDur = probeData.format?.duration !== undefined ? probeData.format.duration : expectedDuration;
      const duration = Number(rawDur);
      if (rawDur === undefined || rawDur === null || !Number.isFinite(duration) || duration <= 0) {
        return { valid: false, error: "Recording duration must be greater than zero seconds." };
      }
      const frameCheck = await verifyFrameDecodability(filePath);
      if (frameCheck && !frameCheck.valid) {
        return { valid: false, error: frameCheck.error };
      }
      return {
        valid: true,
        hasVideo,
        hasAudio,
        duration,
        format: probeData.format?.format_name || "webm",
      };
    }
    return { valid: false, error: "No decodable media streams found in recording." };
  }

  if (process.env.NODE_ENV === "production") {
    return {
      valid: false,
      error: "Media integrity inspection service unavailable: Production media validation requires FFprobe/FFmpeg. Binary fallback disabled in production.",
    };
  }

  let checkBuf = buffer;
  if (!checkBuf && filePath && fs.existsSync(filePath)) {
    try {
      const stats = fs.statSync(filePath);
      const readSize = Math.min(stats.size, 65536);
      const fd = fs.openSync(filePath, "r");
      checkBuf = Buffer.alloc(readSize);
      fs.readSync(fd, checkBuf, 0, readSize, 0);
      fs.closeSync(fd);
    } catch {}
  }

  return inspectMediaBinary(checkBuf, expectedDuration);
}

const MAX_RECORDING_SIZE = 100 * 1024 * 1024; // 100 MB Limit

/**
 * Streams incoming upload payload directly into a secure temporary file on disk.
 * Supports:
 *   1. multipart/form-data streaming via busboy
 *   2. raw binary video streaming (video/*, application/octet-stream)
 *   3. base64 JSON payload (legacy proxy fallback)
 * Avoids loading full recording files into memory.
 */
function streamUploadToTempFile(req, targetDir, fileName) {
  return new Promise((resolve, reject) => {
    const tempFileName = `${fileName}.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tempFilePath = path.join(targetDir, tempFileName);
    const contentType = (req.headers["content-type"] || "").toLowerCase();

    const cleanupTemp = () => {
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      } catch {}
    };

    // Case 1: Pre-buffered raw buffer
    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      if (req.body.length > MAX_RECORDING_SIZE) {
        return reject({ status: 413, message: "Recording exceeds maximum allowed upload size (100 MB)." });
      }
      const isWebM = req.body.length >= 4 && req.body[0] === 0x1a && req.body[1] === 0x45 && req.body[2] === 0xdf && req.body[3] === 0xa3;
      const isMp4 = req.body.length >= 8 && req.body.toString("ascii", 4, 8) === "ftyp";
      if (!isWebM && !isMp4) {
        return reject({ status: 400, message: "Invalid video media format. Only genuine WebM and MP4 video recordings are supported." });
      }
      fs.writeFile(tempFilePath, req.body, (err) => {
        if (err) {
          cleanupTemp();
          return reject(err);
        }
        resolve({
          tempFilePath,
          fileSize: req.body.length,
          mimeType: req.headers["content-type"] || "video/webm",
          meetingId: req.headers["x-meeting-id"] || req.query.meetingId,
          title: req.headers["x-title"] ? decodeURIComponent(req.headers["x-title"]) : req.query.title,
          durationSeconds: Number(req.headers["x-duration-seconds"] || req.query.durationSeconds || 0),
          participantNames: req.headers["x-participant-names"] ? JSON.parse(decodeURIComponent(req.headers["x-participant-names"])) : [],
          thumbnailUrl: req.headers["x-thumbnail-url"] || "",
        });
      });
      return;
    }

    // Case 2: JSON payload with base64 data (Backward compatibility, subject to upload size limit)
    if (contentType.includes("application/json") && req.body && req.body.base64Data) {
      const cleanBase64 = req.body.base64Data.includes(";base64,")
        ? req.body.base64Data.split(";base64,").pop()
        : req.body.base64Data;
      const buf = Buffer.from(cleanBase64, "base64");
      if (buf.length > MAX_RECORDING_SIZE) {
        cleanupTemp();
        return reject({ status: 413, message: "Recording exceeds maximum allowed upload size (100 MB)." });
      }
      fs.writeFile(tempFilePath, buf, (err) => {
        if (err) {
          cleanupTemp();
          return reject(err);
        }
        resolve({
          tempFilePath,
          fileSize: buf.length,
          mimeType: req.body.mimeType || "video/webm",
          meetingId: req.body.meetingId,
          title: req.body.title,
          durationSeconds: Number(req.body.durationSeconds || 0),
          participantNames: req.body.participantNames || [],
          thumbnailUrl: req.body.thumbnailUrl || "",
        });
      });
      return;
    }

    // Case 3: Multipart Form-Data Streaming
    if (contentType.includes("multipart/form-data")) {
      let meetingId = req.headers["x-meeting-id"] || req.query.meetingId || "";
      let title = req.headers["x-title"] ? decodeURIComponent(req.headers["x-title"]) : (req.query.title || "");
      let durationSeconds = Number(req.headers["x-duration-seconds"] || req.query.durationSeconds || 0);
      let participantNames = [];
      let mimeType = "video/webm";
      let totalBytes = 0;
      let firstChunk = null;
      let fileFound = false;
      let writeStream = null;
      let isAborted = false;

      const bb = busboy({ headers: req.headers, limits: { fileSize: MAX_RECORDING_SIZE, files: 1 } });

      bb.on("field", (name, val) => {
        if (name === "meetingId") meetingId = val;
        else if (name === "title") title = val;
        else if (name === "durationSeconds") durationSeconds = Number(val) || 0;
        else if (name === "participantNames") {
          try { participantNames = JSON.parse(val); } catch { participantNames = [val]; }
        }
      });

      bb.on("file", (name, fileStream, info) => {
        fileFound = true;
        if (info && info.mimeType) mimeType = info.mimeType;
        writeStream = fs.createWriteStream(tempFilePath);

        fileStream.on("data", (chunk) => {
          if (isAborted) return;
          totalBytes += chunk.length;
          if (!firstChunk) {
            firstChunk = chunk.slice(0, 32);
            const isWebM = firstChunk.length >= 4 && firstChunk[0] === 0x1a && firstChunk[1] === 0x45 && firstChunk[2] === 0xdf && firstChunk[3] === 0xa3;
            const isMp4 = firstChunk.length >= 8 && firstChunk.toString("ascii", 4, 8) === "ftyp";
            if (!isWebM && !isMp4) {
              isAborted = true;
              writeStream.destroy();
              cleanupTemp();
              return reject({ status: 400, message: "Invalid video media format. Only genuine WebM and MP4 video recordings are supported." });
            }
          }
          if (totalBytes > MAX_RECORDING_SIZE) {
            isAborted = true;
            writeStream.destroy();
            cleanupTemp();
            return reject({ status: 413, message: "Recording exceeds maximum allowed upload size (100 MB)." });
          }
          const canWrite = writeStream.write(chunk);
          if (!canWrite) {
            fileStream.pause();
            writeStream.once("drain", () => {
              if (!isAborted) fileStream.resume();
            });
          }
        });

        fileStream.on("limit", () => {
          isAborted = true;
          if (writeStream) writeStream.destroy();
          cleanupTemp();
          reject({ status: 413, message: "Recording exceeds maximum allowed upload size (100 MB)." });
        });

        fileStream.on("end", () => {
          if (!isAborted && writeStream) {
            writeStream.end();
          }
        });

        writeStream.on("error", (err) => {
          isAborted = true;
          cleanupTemp();
          reject(err);
        });
      });

      bb.on("finish", () => {
        if (isAborted) return;
        if (!fileFound) {
          cleanupTemp();
          return reject({ status: 400, message: "Missing recording video data in multipart stream." });
        }
        if (writeStream) {
          writeStream.on("finish", () => {
            resolve({
              tempFilePath,
              fileSize: totalBytes,
              mimeType,
              meetingId,
              title,
              durationSeconds,
              participantNames,
              thumbnailUrl: "",
            });
          });
        }
      });

      bb.on("error", (err) => {
        isAborted = true;
        if (writeStream) writeStream.destroy();
        cleanupTemp();
        reject(err);
      });

      req.on("aborted", () => {
        isAborted = true;
        if (writeStream) writeStream.destroy();
        cleanupTemp();
      });

      req.on("close", () => {
        if (!req.complete) {
          isAborted = true;
          if (writeStream) writeStream.destroy();
          cleanupTemp();
        }
      });

      req.pipe(bb);
      return;
    }

    // Case 4: Raw Binary Stream (video/* or application/octet-stream)
    if (contentType.includes("video/") || contentType.includes("application/octet-stream")) {
      const meetingId = req.headers["x-meeting-id"] || req.query.meetingId;
      const title = req.headers["x-title"] ? decodeURIComponent(req.headers["x-title"]) : (req.query.title || "");
      const durationSeconds = Number(req.headers["x-duration-seconds"] || req.query.durationSeconds || 0);
      let participantNames = [];
      if (req.headers["x-participant-names"]) {
        try { participantNames = JSON.parse(decodeURIComponent(req.headers["x-participant-names"])); } catch {}
      }
      const mimeType = req.headers["content-type"] || "video/webm";

      let totalBytes = 0;
      let firstChunk = null;
      let isAborted = false;
      const writeStream = fs.createWriteStream(tempFilePath);

      req.on("data", (chunk) => {
        if (isAborted) return;
        totalBytes += chunk.length;
        if (!firstChunk) {
          firstChunk = chunk.slice(0, 32);
          const isWebM = firstChunk.length >= 4 && firstChunk[0] === 0x1a && firstChunk[1] === 0x45 && firstChunk[2] === 0xdf && firstChunk[3] === 0xa3;
          const isMp4 = firstChunk.length >= 8 && firstChunk.toString("ascii", 4, 8) === "ftyp";
          if (!isWebM && !isMp4) {
            isAborted = true;
            writeStream.destroy();
            cleanupTemp();
            return reject({ status: 400, message: "Invalid video media format. Only genuine WebM and MP4 video recordings are supported." });
          }
        }
        if (totalBytes > MAX_RECORDING_SIZE) {
          isAborted = true;
          writeStream.destroy();
          cleanupTemp();
          return reject({ status: 413, message: "Recording exceeds maximum allowed upload size (100 MB)." });
        }
        const canWrite = writeStream.write(chunk);
        if (!canWrite) {
          req.pause();
          writeStream.once("drain", () => {
            if (!isAborted) req.resume();
          });
        }
      });

      req.on("end", () => {
        if (!isAborted) {
          writeStream.end();
        }
      });

      req.on("aborted", () => {
        isAborted = true;
        writeStream.destroy();
        cleanupTemp();
      });

      req.on("close", () => {
        if (!req.complete) {
          isAborted = true;
          writeStream.destroy();
          cleanupTemp();
        }
      });

      writeStream.on("error", (err) => {
        isAborted = true;
        cleanupTemp();
        reject(err);
      });

      req.on("error", (err) => {
        isAborted = true;
        writeStream.destroy();
        cleanupTemp();
        reject(err);
      });

      writeStream.on("finish", () => {
        if (isAborted) return;
        resolve({
          tempFilePath,
          fileSize: totalBytes,
          mimeType,
          meetingId,
          title,
          durationSeconds,
          participantNames,
          thumbnailUrl: req.headers["x-thumbnail-url"] || "",
        });
      });
      return;
    }

    return reject({ status: 400, message: "Missing recording video data or unsupported Content-Type" });
  });
}

// 1. Upload a new recording (Supports streaming multipart and raw binary stream with backpressure and 100MB limit)
router.post(
  "/upload",
  authenticateToken,
  async (req, res, next) => {
    // Authenticate and verify meeting authorization BEFORE writing or streaming file
    const meetingId = (
      req.headers["x-meeting-id"] ||
      req.query.meetingId ||
      (req.body && typeof req.body === "object" ? req.body.meetingId : "") ||
      ""
    ).trim();

    if (!meetingId) {
      if (req.headers["content-type"]?.includes("multipart/form-data")) {
        return next();
      }
      return res.status(400).json({ error: "meetingId is required in headers (x-meeting-id) or query parameter before uploading recording." });
    }

    try {
      const Meeting = require("../models/Meeting");
      const cleanMeetingId = meetingId;
      const meeting = await Meeting.findOne({
        $or: [
          { meetingId: cleanMeetingId },
          { meetingId: cleanMeetingId.replace(/-/g, "") },
          { invitationCode: cleanMeetingId },
        ],
      }).lean();

      if (!meeting) {
        return res.status(404).json({ error: "Invalid meeting reference. Meeting does not exist." });
      }

      const reqUserId = String(req.user?.userId || req.user?._id || req.user?.id || "");
      const hostUserId = String(meeting.hostUserId || meeting.userId || "");
      const isSuperAdmin = req.user?.role === "superadmin" || req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin;
      if (!isSuperAdmin && hostUserId && reqUserId !== hostUserId) {
        return res.status(403).json({ error: "Unauthorized: Only the meeting host can upload recordings for this meeting." });
      }
      req.validatedMeeting = meeting;
    } catch (err) {
      return res.status(500).json({ error: `Pre-upload meeting verification failed: ${err.message}` });
    }
    next();
  },
  async (req, res) => {
    let createdFilePath = null;
    try {
      const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const targetDir = getRecordingsDir();

      let uploadResult;
      try {
        uploadResult = await streamUploadToTempFile(req, targetDir, recordingId);
      } catch (streamErr) {
        if (streamErr.status) {
          return res.status(streamErr.status).json({ error: streamErr.message });
        }
        throw streamErr;
      }

      const {
        tempFilePath,
        fileSize,
        mimeType,
        meetingId,
        title,
        durationSeconds,
        participantNames,
        thumbnailUrl,
      } = uploadResult;

      createdFilePath = tempFilePath;

      if (!meetingId || typeof meetingId !== "string" || !meetingId.trim()) {
        try { fs.unlinkSync(tempFilePath); } catch {}
        createdFilePath = null;
        return res.status(400).json({ error: "meetingId is required to associate and authorize the recording." });
      }

      const hostUserId = String(req.user?.userId || req.user?.id || req.user?._id || "guest");
      const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);

      // Pre-Upload Authorization & Meeting Existence Validation
      const Meeting = require("../models/Meeting");
      const cleanMeetingId = meetingId.trim();
      const meeting = await Meeting.findOne({
        $or: [
          { meetingId: cleanMeetingId },
          { meetingId: cleanMeetingId.replace(/-/g, "") },
          { invitationCode: cleanMeetingId },
        ],
      }).lean();

      if (!meeting) {
        try { fs.unlinkSync(tempFilePath); } catch {}
        createdFilePath = null;
        return res.status(404).json({ error: "Invalid meeting reference. Meeting does not exist." });
      }

      const isHost = meeting.hostUserId && String(meeting.hostUserId) === hostUserId;
      if (!isAdmin && !isHost) {
        try { fs.unlinkSync(tempFilePath); } catch {}
        createdFilePath = null;
        return res.status(403).json({ error: "Access denied. Only the meeting host can record and upload meeting recordings." });
      }

      if (fileSize < 500) {
        try { fs.unlinkSync(tempFilePath); } catch {}
        createdFilePath = null;
        return res.status(400).json({ error: "Recording video data is empty or too short to contain valid video frames." });
      }

      // Check for recent duplicate upload within 10 seconds for the same meeting and user
      const existingRecent = await Recording.findOne({
        meetingId,
        hostUserId,
        createdAt: { $gte: new Date(Date.now() - 10000) },
        fileSize,
      }).lean();

      if (existingRecent) {
        try { fs.unlinkSync(tempFilePath); } catch {}
        createdFilePath = null;
        return res.status(200).json({
          success: true,
          message: "Recording already processed (duplicate upload prevented)",
          recording: existingRecent,
        });
      }

      // Media Stream Validation (Verify playable video/audio integrity)
      const mediaCheck = await validateMediaIntegrity(tempFilePath, null, durationSeconds);
      if (!mediaCheck.valid) {
        try { fs.unlinkSync(tempFilePath); } catch {}
        createdFilePath = null;
        return res.status(400).json({ error: mediaCheck.error || "Corrupted media file: Missing decodable video stream." });
      }

      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const fileName = `${recordingId}.${ext}`;
      const filePath = path.join(targetDir, fileName);

      // Atomically promote temporary file to final path upon verification
      fs.renameSync(tempFilePath, filePath);
      createdFilePath = filePath;

      let participantUserIds = [];
      if (Array.isArray(meeting.participants)) {
        participantUserIds = meeting.participants
          .map((p) => String(p.userId || p._id || ""))
          .filter(Boolean);
      }
      if (hostUserId && !participantUserIds.includes(hostUserId)) {
        participantUserIds.push(hostUserId);
      }

      const User = require("../models/User");
      let hostName = req.user?.fullName || req.user?.name || req.body?.hostName || "";
      let hostEmail = req.user?.email || req.body?.hostEmail || "";
      if ((!hostName || !hostEmail) && hostUserId && mongoose.Types.ObjectId.isValid(hostUserId)) {
        try {
          const u = await User.findById(hostUserId).select("fullName username email").lean();
          if (u) {
            if (!hostName) hostName = u.fullName || u.username || "Host";
            if (!hostEmail) hostEmail = u.email || "";
          }
        } catch {}
      }
      if (!hostName) hostName = "Host";

      const streamUrl = `/api/recordings/stream/${fileName}`;
      const fileUrl = `/recordings/${fileName}`;

      const recording = new Recording({
        recordingId,
        meetingId: meetingId || "",
        title: title || `Meeting Recording - ${new Date().toLocaleDateString()}`,
        hostUserId,
        hostName,
        hostEmail,
        recordingType: req.body?.recordingType || "Meeting",
        durationSeconds: Math.round(Number(durationSeconds) || Number(mediaCheck.duration) || 0),
        filePath,
        fileUrl,
        streamUrl,
        fileSize,
        mimeType,
        status: "ready",
        startTime: new Date(Date.now() - (Math.round(Number(durationSeconds) || 0) * 1000)),
        endTime: new Date(),
        participantsCount: Math.max(1, participantNames.length),
        participantUserIds,
        participantNames: Array.isArray(participantNames) ? participantNames : [],
        thumbnailUrl: thumbnailUrl || "",
        chapters: [
          { timestampSeconds: 0, title: "Meeting Started & Introductions" },
          ...(Number(durationSeconds) > 60
            ? [{ timestampSeconds: Math.floor(Number(durationSeconds) / 2), title: "Core Discussion & Presentation" }]
            : []),
        ],
      });

      await recording.save();

      // Broadcast socket event if meetingId exists
      const io = req.app.get("io");
      if (io) {
        if (meetingId) {
          io.to(`meeting_${meetingId}`).emit("meeting_recording_saved", {
            recordingId,
            title: recording.title,
            fileUrl,
            durationSeconds: recording.durationSeconds,
          });
        }
        // Broadcast real-time synchronization to Super Admin dashboard
        io.emit("NEW_RECORDING_SAVED", recording);

        // Real-time synchronization to host and participant personal accounts across all active devices
        if (hostUserId && hostUserId !== "guest") {
          io.to(`user_${hostUserId}`).emit("RECORDING_SAVED", recording);
        }
        if (Array.isArray(participantUserIds)) {
          participantUserIds.forEach((pId) => {
            if (pId && pId !== hostUserId && pId !== "guest") {
              io.to(`user_${pId}`).emit("RECORDING_SAVED", recording);
            }
          });
        }
      }

      res.status(201).json({
        success: true,
        message: "Recording uploaded and saved successfully",
        recording,
      });
    } catch (err) {
      if (createdFilePath && fs.existsSync(createdFilePath)) {
        try { fs.unlinkSync(createdFilePath); } catch {}
      }
      console.error("Recording upload error:", err);
      res.status(500).json({ error: err.message || "Failed to save recording" });
    }
  }
);

// Dedicated video chunk streaming route with HTTP 206 Partial Content (Strictly Authenticated & Authorized)
router.get("/stream/:filename", async (req, res) => {
  try {
    const rawFilename = req.params.filename || "";
    // 1. Strict Path Traversal Prevention
    if (!rawFilename || rawFilename.includes("..") || rawFilename.includes("/") || rawFilename.includes("\\")) {
      return res.status(400).send("Invalid filename");
    }
    const filename = path.basename(rawFilename);

    // 2. Authorize Requesting User (via Bearer header or ?token= query parameter)
    const authHeader = req.headers["authorization"];
    const rawToken = (authHeader && authHeader.split(" ")[1]) || req.query.token;
    if (!rawToken) {
      return res.status(401).send("Authentication required to stream recording");
    }

    let decoded;
    try {
      const jwt = require("jsonwebtoken");
      const { getJwtSecret } = require("../config/jwtConfig");
      decoded = jwt.verify(rawToken, getJwtSecret());
    } catch (authErr) {
      return res.status(401).send("Invalid or expired session token");
    }

    const currentUserId = String(decoded.userId || decoded.id || decoded._id || "");
    const isAdmin = Boolean(decoded.role === "admin" || decoded.role === "SUPER_ADMIN" || decoded.isMainAdmin);

    // 3. Database Ownership & Participant Relationship Verification (Exact non-ambiguous lookup)
    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const recording = await Recording.findOne({
      $or: [
        { streamUrl: `/api/recordings/stream/${filename}` },
        { fileUrl: `/recordings/${filename}` },
        { fileUrl: `/uploads/recordings/${filename}` },
        { filePath: { $regex: `(^|[\\\\/])${escapedFilename}$` } },
        { fileName: filename },
        { recordingId: filename.replace(/\.[^/.]+$/, "") },
      ],
    }).lean();

    const filePath = resolveRecordingFilePath(filename, recording);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).send("Video file not found");
    }

    if (!recording) {
      if (!isAdmin) {
        return res.status(404).send("Recording record not found");
      }
    } else if (!isAdmin) {
      const isHost = String(recording.hostUserId) === currentUserId;
      const isParticipant = (recording.participantUserIds || []).includes(currentUserId);
      let isMeetingAttendee = false;
      if (recording.meetingId) {
        try {
          const Meeting = require("../models/Meeting");
          const meeting = await Meeting.findOne({
            meetingId: recording.meetingId,
            $or: [{ hostUserId: currentUserId }, { "participants.userId": currentUserId }],
          }).lean();
          if (meeting) isMeetingAttendee = true;
        } catch {}
      }

      if (!isHost && !isParticipant && !isMeetingAttendee) {
        return res.status(403).send("Forbidden: You do not have permission to stream this recording");
      }
    }

    // 4. Stream Partial / Full HTTP Content (Cross-OS & Safari HTTP 206 / Range support)
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === ".mp4" ? "video/mp4" : "video/webm";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Range, Authorization, Content-Type");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length, Content-Type");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    if (req.method === "HEAD") {
      res.writeHead(200, {
        "Accept-Ranges": "bytes",
        "Content-Length": fileSize,
        "Content-Type": contentType,
      });
      return res.end();
    }

    if (range && fileSize > 0) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5MB chunk window for smooth streaming without buffer starvation
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE - 1, fileSize - 1);

      if (start >= fileSize) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`).send(`Requested range not satisfiable: ${start} >= ${fileSize}`);
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      file.on("error", () => {
        if (!res.headersSent) res.status(500).end();
      });
      req.on("close", () => {
        file.destroy();
      });

      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      };
      res.writeHead(200, head);
      const file = fs.createReadStream(filePath);
      file.on("error", () => {
        if (!res.headersSent) res.status(500).end();
      });
      req.on("close", () => {
        file.destroy();
      });
      file.pipe(res);
    }
  } catch (streamErr) {
    console.error("Stream error:", streamErr);
    res.status(500).send("Streaming error");
  }
});

// Dedicated video download route with strict authorization and path-traversal prevention
router.get("/download/:filename", async (req, res) => {
  try {
    const rawFilename = req.params.filename || "";
    if (!rawFilename || rawFilename.includes("..") || rawFilename.includes("/") || rawFilename.includes("\\")) {
      return res.status(400).send("Invalid filename");
    }
    const filename = path.basename(rawFilename);

    const authHeader = req.headers["authorization"];
    const rawToken = (authHeader && authHeader.split(" ")[1]) || req.query.token;
    if (!rawToken) {
      return res.status(401).send("Authentication required to download recording");
    }

    let decoded;
    try {
      const jwt = require("jsonwebtoken");
      const { getJwtSecret } = require("../config/jwtConfig");
      decoded = jwt.verify(rawToken, getJwtSecret());
    } catch {
      return res.status(401).send("Invalid or expired session token");
    }

    const currentUserId = String(decoded.userId || decoded.id || decoded._id || "");
    const isAdmin = Boolean(decoded.role === "admin" || decoded.role === "SUPER_ADMIN" || decoded.isMainAdmin);

    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const recording = await Recording.findOne({
      $or: [
        { streamUrl: `/api/recordings/stream/${filename}` },
        { fileUrl: `/recordings/${filename}` },
        { fileUrl: `/uploads/recordings/${filename}` },
        { filePath: { $regex: `(^|[\\\\/])${escapedFilename}$` } },
        { fileName: filename },
        { recordingId: filename.replace(/\.[^/.]+$/, "") },
      ],
    }).lean();

    const filePath = resolveRecordingFilePath(filename, recording);

    if (!recording) {
      if (!isAdmin) return res.status(404).send("Recording record not found");
    } else if (!isAdmin) {
      const isHost = String(recording.hostUserId) === currentUserId;
      const isParticipant = (recording.participantUserIds || []).includes(currentUserId);
      let isMeetingAttendee = false;
      if (recording.meetingId) {
        try {
          const Meeting = require("../models/Meeting");
          const meeting = await Meeting.findOne({
            meetingId: recording.meetingId,
            $or: [{ hostUserId: currentUserId }, { "participants.userId": currentUserId }],
          }).lean();
          if (meeting) isMeetingAttendee = true;
        } catch {}
      }

      if (!isHost && !isParticipant && !isMeetingAttendee) {
        return res.status(403).send("Forbidden: You do not have permission to download this recording");
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Video file not found");
    }

    res.download(filePath, filename);
  } catch (downloadErr) {
    console.error("Download error:", downloadErr);
    res.status(500).send("Download error");
  }
});

// 2. Get list of recordings with Search, Filter & Sort (Strictly isolated to logged-in user)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const currentUserId = String(req.user?.userId || req.user?.id || req.user?._id || "");
    if (!currentUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { q, dateFilter, sort = "newest", scope = "all" } = req.query;

    const User = require("../models/User");
    const Meeting = require("../models/Meeting");

    const currentUserDoc = mongoose.Types.ObjectId.isValid(currentUserId)
      ? await User.findById(currentUserId).select("fullName username email").lean()
      : null;
    const userNames = [currentUserDoc?.fullName, currentUserDoc?.username].filter(Boolean);

    // Identify all meetings created by or attended by this user
    let userMeetingIds = [];
    try {
      const userMeetings = await Meeting.find({
        $or: [
          { hostUserId: currentUserId },
          { "participants.userId": currentUserId },
        ],
      }).select("meetingId").lean();
      userMeetingIds = userMeetings.map((m) => m.meetingId).filter(Boolean);
    } catch {}

    // Support personal and shared recordings strictly bounded by database user IDs and meetings
    let filter = {};
    if (scope === "personal") {
      filter = { hostUserId: currentUserId };
    } else if (scope === "shared") {
      filter = {
        hostUserId: { $ne: currentUserId },
        $or: [
          { participantUserIds: currentUserId },
          ...(userMeetingIds.length > 0 ? [{ meetingId: { $in: userMeetingIds } }] : []),
        ],
      };
    } else {
      filter = {
        $or: [
          { hostUserId: currentUserId },
          { participantUserIds: currentUserId },
          ...(userMeetingIds.length > 0 ? [{ meetingId: { $in: userMeetingIds } }] : []),
        ],
      };
    }

    // Search query within the user's personal recordings
    if (q && q.trim()) {
      const reg = new RegExp(q.trim(), "i");
      filter.$and = [
        {
          $or: [
            { title: reg },
            { hostName: reg },
            { participantNames: reg },
          ],
        },
      ];
    }

    // Date filter
    if (dateFilter && dateFilter !== "all") {
      const now = new Date();
      let startRange = new Date();
      if (dateFilter === "today") {
        startRange.setHours(0, 0, 0, 0);
      } else if (dateFilter === "week") {
        startRange.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        startRange.setMonth(now.getMonth() - 1);
      }
      filter.createdAt = { $gte: startRange };
    }

    // Sort order
    let sortObj = { createdAt: -1 };
    if (sort === "oldest") sortObj = { createdAt: 1 };
    else if (sort === "duration_desc") sortObj = { durationSeconds: -1 };
    else if (sort === "duration_asc") sortObj = { durationSeconds: 1 };

    const recordings = await Recording.find(filter).sort(sortObj).limit(200);

    // Compute storage analytics strictly for this user's records
    const allUserRecs = await Recording.find({
      $or: [{ hostUserId: currentUserId }, { hostUserId: String(currentUserId) }],
    });
    const totalSizeBytes = allUserRecs.reduce((acc, r) => acc + (r.fileSize || 0), 0);

    res.json({
      success: true,
      recordings,
      analytics: {
        totalRecordings: allUserRecs.length,
        totalSizeBytes,
        storageQuotaBytes: 5 * 1024 * 1024 * 1024, // 5 GB
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Add chapter to recording (Host or Admin only)
router.post("/:recordingId/chapters", authenticateToken, async (req, res) => {
  try {
    const { timestampSeconds, title } = req.body;
    if (timestampSeconds === undefined || !title || !title.trim()) {
      return res.status(400).json({ error: "Timestamp and chapter title required" });
    }

    const currentUserId = String(req.user?.userId || req.user?.id || req.user?._id || "");
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);

    const recording = await Recording.findOne({ recordingId: req.params.recordingId });
    if (!recording) return res.status(404).json({ error: "Recording not found" });

    const isHost = String(recording.hostUserId) === currentUserId;
    if (!isAdmin && !isHost) {
      return res.status(403).json({ error: "Access denied. Only the meeting host or administrator can add chapters." });
    }

    const newChapter = { timestampSeconds: Number(timestampSeconds), title: title.trim() };
    recording.chapters.push(newChapter);
    recording.chapters.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    await recording.save();

    res.json({ success: true, chapters: recording.chapters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Add personal bookmark (Authorized participants, host, or admin)
router.post("/:recordingId/bookmarks", authenticateToken, async (req, res) => {
  try {
    const { timestampSeconds, note } = req.body;
    const currentUserId = String(req.user?.userId || req.user?.id || req.user?._id || "");
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);

    const recording = await Recording.findOne({ recordingId: req.params.recordingId });
    if (!recording) return res.status(404).json({ error: "Recording not found" });

    const isHost = String(recording.hostUserId) === currentUserId;
    const isParticipant = (recording.participantUserIds || []).includes(currentUserId);

    if (!isAdmin && !isHost && !isParticipant) {
      return res.status(403).json({ error: "Access denied. You do not have permission to bookmark this recording." });
    }

    const newBookmark = {
      userId: currentUserId,
      timestampSeconds: Number(timestampSeconds) || 0,
      note: (note || "").trim(),
      createdAt: new Date(),
    };
    recording.bookmarks.push(newBookmark);
    await recording.save();

    const userBookmarks = isAdmin
      ? recording.bookmarks
      : recording.bookmarks.filter((b) => String(b.userId) === currentUserId);

    res.json({ success: true, bookmarks: userBookmarks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get single recording (strictly individual access for host, participants, or admin)
router.get("/:recordingId", authenticateToken, async (req, res) => {
  try {
    const currentUserId = String(req.user?.userId || req.user?.id || req.user?._id || "");
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
    const recording = await Recording.findOne({ recordingId: req.params.recordingId }).lean();

    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    const Meeting = require("../models/Meeting");
    let isMeetingParticipant = false;
    if (recording.meetingId) {
      try {
        const meeting = await Meeting.findOne({
          meetingId: recording.meetingId,
          $or: [{ hostUserId: currentUserId }, { "participants.userId": currentUserId }],
        }).lean();
        if (meeting) isMeetingParticipant = true;
      } catch {}
    }

    const isHost = String(recording.hostUserId) === currentUserId;
    const isParticipant = (recording.participantUserIds || []).includes(currentUserId);

    if (!isAdmin && !isHost && !isParticipant && !isMeetingParticipant) {
      return res.status(403).json({ error: "Access denied. You do not have permission to view this private recording." });
    }

    // Isolate bookmarks so users only see their own private notes unless admin
    if (!isAdmin && Array.isArray(recording.bookmarks)) {
      recording.bookmarks = recording.bookmarks.filter((b) => String(b.userId) === currentUserId);
    }

    res.json({ success: true, recording });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Rename recording
router.patch("/:recordingId/rename", authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const recording = await Recording.findOne({ recordingId: req.params.recordingId });
    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    // Permission check: host or admin can rename
    const currentUserId = String(req.user?.userId || req.user?.id || req.user?._id || "");
    const isOwner = recording.hostUserId && String(recording.hostUserId) === currentUserId;
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin || req.user?.isAdmin);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only the recording host or an administrator can rename this video" });
    }

    recording.title = title.trim();
    await recording.save();

    // Broadcast real-time update to host and participants across all active sessions
    const io = req.app.get("io");
    if (io) {
      io.emit("RECORDING_UPDATED", recording);
      if (recording.hostUserId && recording.hostUserId !== "guest") {
        io.to(`user_${recording.hostUserId}`).emit("RECORDING_UPDATED", recording);
      }
      if (Array.isArray(recording.participantUserIds)) {
        recording.participantUserIds.forEach((pId) => {
          if (pId && pId !== String(recording.hostUserId) && pId !== "guest") {
            io.to(`user_${pId}`).emit("RECORDING_UPDATED", recording);
          }
        });
      }
    }

    res.json({ success: true, message: "Recording renamed", recording });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete recording
router.delete("/:recordingId", authenticateToken, async (req, res) => {
  try {
    const rawId = String(req.params.recordingId || "").trim();
    if (!rawId) {
      return res.status(400).json({ error: "Recording ID is required" });
    }

    const recording = await Recording.findOne({ recordingId: rawId });
    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    const currentUserId = String(req.user?.userId || req.user?.id || req.user?._id || "").trim();
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
    const hostUserId = recording.hostUserId ? String(recording.hostUserId).trim() : "";

    // Ownership authorization:
    // Administrators can manage and delete any recording (including orphaned recordings).
    // Normal users can ONLY delete recordings where they are the verified owner.
    // A missing or invalid hostUserId must NEVER bypass ownership validation.
    if (!isAdmin) {
      if (!hostUserId || !currentUserId || hostUserId !== currentUserId) {
        return res.status(403).json({ error: "Only the recording host or an administrator can delete this video" });
      }
    }

    // Safely delete physical file first via centralized storage service
    const delResult = safeDeleteRecordingFile(recording);
    if (!delResult.success) {
      // Physical file remains on disk and could not be removed!
      // Do not silently delete the database record when the file remains on disk.
      recording.status = "deletion_failed";
      recording.deletionError = delResult.error || "Filesystem unlink error";
      await recording.save();

      return res.status(500).json({
        error: `Failed to safely delete recording file: ${delResult.error}. Database record retained for recovery.`,
        recordingId: recording.recordingId,
      });
    }

    // Only after physical file is safely removed (or was already missing on disk), remove the MongoDB record
    await Recording.deleteOne({ _id: recording._id });

    // Broadcast real-time deletion to host and participants across all active sessions
    const io = req.app.get("io");
    if (io) {
      const payload = { recordingId: recording.recordingId };
      io.emit("RECORDING_DELETED", payload);
      if (recording.hostUserId && recording.hostUserId !== "guest") {
        io.to(`user_${recording.hostUserId}`).emit("RECORDING_DELETED", payload);
      }
      if (Array.isArray(recording.participantUserIds)) {
        recording.participantUserIds.forEach((pId) => {
          if (pId && pId !== String(recording.hostUserId) && pId !== "guest") {
            io.to(`user_${pId}`).emit("RECORDING_DELETED", payload);
          }
        });
      }
    }

    res.json({ success: true, message: "Recording deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.validateMediaIntegrity = validateMediaIntegrity;
router.probeWithFfprobe = probeWithFfprobe;
router.inspectMediaBinary = inspectMediaBinary;
router.verifyFrameDecodability = verifyFrameDecodability;
router.getFfmpegBinary = getFfmpegBinary;
router.getFfprobeBinary = getFfprobeBinary;

module.exports = router;
