const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { execFile } = require("child_process");
const Recording = require("../models/Recording");
const authenticateToken = require("../middleware/authMiddleware");

// Uploads directory path (Supports persistent cloud disk mount via RECORDINGS_STORAGE_PATH)
const { getRecordingsDir, resolveRecordingFilePath } = require("../config/recordingStorage");
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

  return inspectMediaBinary(buffer, expectedDuration);
}

// 1. Upload a new recording (Dedicated 100mb limit for video payload)
router.post("/upload", express.json({ limit: "100mb" }), authenticateToken, async (req, res) => {
  let createdFilePath = null;
  try {
    const {
      meetingId,
      title,
      durationSeconds = 0,
      participantNames = [],
      base64Data,
      mimeType = "video/webm",
      thumbnailUrl = "",
    } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: "Missing recording video data" });
    }

    const hostUserId = String(req.user?.userId || req.user?.id || req.user?._id || "guest");
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);

    // 1. Pre-Upload Authorization & Meeting Existence Validation (BEFORE writing file)
    let participantUserIds = [];
    if (meetingId) {
      const Meeting = require("../models/Meeting");
      const meeting = await Meeting.findOne({
        $or: [
          { meetingId: meetingId },
          { meetingId: meetingId.replace(/-/g, "") },
        ],
      }).lean();

      if (!meeting) {
        return res.status(404).json({ error: "Invalid meeting reference. Meeting does not exist." });
      }

      const isHost = String(meeting.hostUserId) === hostUserId;
      const isParticipant = Array.isArray(meeting.participants) && meeting.participants.some(
        (p) => String(p.userId || p._id || "") === hostUserId
      );

      if (!isAdmin && !isHost && !isParticipant) {
        return res.status(403).json({ error: "Access denied. You were not an authorized host or participant of this meeting." });
      }

      if (Array.isArray(meeting.participants)) {
        participantUserIds = meeting.participants
          .map((p) => String(p.userId || p._id || ""))
          .filter(Boolean);
      }
    }
    if (hostUserId && !participantUserIds.includes(hostUserId)) {
      participantUserIds.push(hostUserId);
    }

    const User = require("../models/User");
    let hostName = req.user?.fullName || req.user?.name || req.body.hostName || "";
    let hostEmail = req.user?.email || req.body.hostEmail || "";
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

    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const fileName = `${recordingId}.${ext}`;
    const targetDir = getRecordingsDir();
    const filePath = path.join(targetDir, fileName);

    // Strip data URL header safely (handles video/webm;codecs=vp9,opus, video/webm, video/mp4, etc.)
    const cleanBase64 = base64Data.includes(";base64,") ? base64Data.split(";base64,").pop() : base64Data;
    const buffer = Buffer.from(cleanBase64, "base64");

    if (buffer.length < 500) {
      return res.status(400).json({ error: "Recording video data is empty or too short to contain valid video frames." });
    }

    // Validate container format and magic bytes
    const isWebM = buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    const isMp4 = buffer.length >= 8 && buffer.toString("ascii", 4, 8) === "ftyp";
    if (!isWebM && !isMp4) {
      return res.status(400).json({ error: "Invalid video media format. Only genuine WebM and MP4 video recordings are supported." });
    }

    // Check for recent duplicate upload within 10 seconds for the same meeting and user
    if (meetingId) {
      const existingRecent = await Recording.findOne({
        meetingId,
        hostUserId,
        createdAt: { $gte: new Date(Date.now() - 10000) },
        fileSize: buffer.length,
      }).lean();
      if (existingRecent) {
        return res.status(200).json({
          success: true,
          message: "Recording already processed (duplicate upload prevented)",
          recording: existingRecent,
        });
      }
    }

    // 2. Write file to disk only after all authorization and header checks succeed
    fs.writeFileSync(filePath, buffer);
    createdFilePath = filePath;

    // 3. Media Stream Validation (Verify playable video/audio integrity)
    const mediaCheck = await validateMediaIntegrity(filePath, buffer, durationSeconds);
    if (!mediaCheck.valid) {
      try { fs.unlinkSync(filePath); } catch {}
      createdFilePath = null;
      return res.status(400).json({ error: mediaCheck.error || "Corrupted media file: Missing decodable video stream." });
    }

    const streamUrl = `/api/recordings/stream/${fileName}`;
    const fileUrl = `/recordings/${fileName}`;
    const fileSize = buffer.length;

    const recording = new Recording({
      recordingId,
      meetingId: meetingId || "",
      title: title || `Meeting Recording - ${new Date().toLocaleDateString()}`,
      hostUserId,
      hostName,
      hostEmail,
      recordingType: req.body.recordingType || "Meeting",
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
});

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

    // 4. Stream Partial / Full HTTP Content
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === ".mp4" ? "video/mp4" : "video/webm";

    if (range && fileSize > 0) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send(`Requested range not satisfiable: ${start} >= ${fileSize}`);
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
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
      fs.createReadStream(filePath).pipe(res);
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

    res.json({ success: true, message: "Recording renamed", recording });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete recording
router.delete("/:recordingId", authenticateToken, async (req, res) => {
  try {
    const recording = await Recording.findOne({ recordingId: req.params.recordingId });
    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    const currentUserId = String(req.user?.userId || req.user?.id || req.user?._id || "");
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
    if (!isAdmin && recording.hostUserId && String(recording.hostUserId) !== currentUserId) {
      return res.status(403).json({ error: "Only the recording host or an administrator can delete this video" });
    }

    // Remove file from disk
    const diskPath = path.join(__dirname, "../uploads", recording.filePath.replace("/recordings/", "recordings/"));
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (e) {
        console.warn("Could not delete file from disk:", e.message);
      }
    }

    await Recording.deleteOne({ recordingId: req.params.recordingId });

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
