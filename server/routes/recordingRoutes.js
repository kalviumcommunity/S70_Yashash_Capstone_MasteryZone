const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Recording = require("../models/Recording");
const authenticateToken = require("../middleware/authMiddleware");

// Uploads directory path
const RECORDINGS_DIR = path.join(__dirname, "../uploads/recordings");
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// 1. Upload a new recording
router.post("/upload", authenticateToken, async (req, res) => {
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
    const filePath = path.join(RECORDINGS_DIR, fileName);

    // Strip data URL header safely (handles video/webm;codecs=vp9,opus, video/webm, video/mp4, etc.)
    const cleanBase64 = base64Data.includes(";base64,") ? base64Data.split(";base64,").pop() : base64Data;
    const buffer = Buffer.from(cleanBase64, "base64");

    if (buffer.length < 50) {
      return res.status(400).json({ error: "Recording video data is empty or too short." });
    }

    // Validate container format
    const isWebM = buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    const isMp4 = buffer.length >= 8 && buffer.toString("ascii", 4, 8) === "ftyp";
    if (!isWebM && !isMp4) {
      console.warn(`[Recording Upload] Recording header not standard WebM/MP4 (first 4 bytes: ${buffer.slice(0, 4).toString("hex")}).`);
    }

    fs.writeFileSync(filePath, buffer);

    // Retrieve active meeting participants to attach verified participantUserIds
    const Meeting = require("../models/Meeting");
    let participantUserIds = [];
    if (meetingId) {
      try {
        const meeting = await Meeting.findOne({ meetingId }).lean();
        if (meeting && Array.isArray(meeting.participants)) {
          participantUserIds = meeting.participants
            .map((p) => String(p.userId || p._id || ""))
            .filter(Boolean);
        }
      } catch (mErr) {
        console.warn("Could not retrieve meeting participants:", mErr);
      }
    }
    if (hostUserId && !participantUserIds.includes(hostUserId)) {
      participantUserIds.push(hostUserId);
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
      durationSeconds: Math.round(Number(durationSeconds) || 0),
      filePath: fileUrl,
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
    const filePath = path.join(RECORDINGS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Video file not found");
    }

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

    // 3. Database Ownership & Participant Relationship Verification
    const recording = await Recording.findOne({
      $or: [
        { streamUrl: { $regex: filename } },
        { filePath: { $regex: filename } },
        { fileUrl: { $regex: filename } },
      ],
    }).lean();

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

    // Support personal and shared recordings with strict account boundaries
    let filter = {};
    if (scope === "personal") {
      filter = { hostUserId: currentUserId };
    } else if (scope === "shared") {
      filter = {
        hostUserId: { $ne: currentUserId },
        $or: [
          { participantUserIds: currentUserId },
          ...(userMeetingIds.length > 0 ? [{ meetingId: { $in: userMeetingIds } }] : []),
          ...(currentUserDoc?.email ? [{ hostEmail: currentUserDoc.email }] : []),
          ...(userNames.length > 0 ? [{ participantNames: { $in: userNames } }] : []),
        ],
      };
    } else {
      filter = {
        $or: [
          { hostUserId: currentUserId },
          { participantUserIds: currentUserId },
          ...(userMeetingIds.length > 0 ? [{ meetingId: { $in: userMeetingIds } }] : []),
          ...(currentUserDoc?.email ? [{ hostEmail: currentUserDoc.email }] : []),
          ...(userNames.length > 0 ? [{ participantNames: { $in: userNames } }] : []),
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

// 3. Add chapter to recording
router.post("/:recordingId/chapters", authenticateToken, async (req, res) => {
  try {
    const { timestampSeconds, title } = req.body;
    if (timestampSeconds === undefined || !title || !title.trim()) {
      return res.status(400).json({ error: "Timestamp and chapter title required" });
    }

    const recording = await Recording.findOne({ recordingId: req.params.recordingId });
    if (!recording) return res.status(404).json({ error: "Recording not found" });

    const newChapter = { timestampSeconds: Number(timestampSeconds), title: title.trim() };
    recording.chapters.push(newChapter);
    recording.chapters.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    await recording.save();

    res.json({ success: true, chapters: recording.chapters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Add personal bookmark
router.post("/:recordingId/bookmarks", authenticateToken, async (req, res) => {
  try {
    const { timestampSeconds, note } = req.body;
    const currentUserId = req.user?.userId || req.user?.id || "user";

    const recording = await Recording.findOne({ recordingId: req.params.recordingId });
    if (!recording) return res.status(404).json({ error: "Recording not found" });

    const newBookmark = {
      userId: String(currentUserId),
      timestampSeconds: Number(timestampSeconds) || 0,
      note: (note || "").trim(),
      createdAt: new Date(),
    };
    recording.bookmarks.push(newBookmark);
    await recording.save();

    res.json({ success: true, bookmarks: recording.bookmarks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get single recording (strictly individual access for host, participants, or admin)
router.get("/:recordingId", authenticateToken, async (req, res) => {
  try {
    const currentUserId = String(req.user?.userId || req.user?.id || req.user?._id || "");
    const isPrivileged = req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN";
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

    if (!isPrivileged && !isHost && !isParticipant && !isMeetingParticipant) {
      return res.status(403).json({ error: "Access denied. You do not have permission to view this private recording." });
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
    const currentUserId = req.user?.userId || req.user?.id;
    const isOwner = recording.hostUserId && String(recording.hostUserId) === String(currentUserId);
    const isAdmin = req.user?.role === "admin" || req.user?.isAdmin;
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

    const currentUserId = req.user?.userId || req.user?.id;
    if (recording.hostUserId && String(recording.hostUserId) !== String(currentUserId)) {
      return res.status(403).json({ error: "Only the recording host can delete this video" });
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

module.exports = router;
