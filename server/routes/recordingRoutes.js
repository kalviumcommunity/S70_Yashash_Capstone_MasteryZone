const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
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

    const hostUserId = req.user?.userId || req.user?.id || req.body.hostUserId;
    const hostName = req.user?.fullName || req.user?.name || req.body.hostName || "Host";

    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const fileName = `${recordingId}.${ext}`;
    const filePath = path.join(RECORDINGS_DIR, fileName);

    // Strip data URL header if present (e.g. data:video/webm;base64,...)
    const cleanBase64 = base64Data.replace(/^data:video\/[a-z0-9.-]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/recordings/${fileName}`;
    const fileSize = buffer.length;

    const recording = new Recording({
      recordingId,
      meetingId: meetingId || "",
      title: title || `Meeting Recording - ${new Date().toLocaleDateString()}`,
      hostUserId,
      hostName,
      durationSeconds: Math.round(Number(durationSeconds) || 0),
      filePath: fileUrl,
      fileUrl,
      fileSize,
      mimeType,
      status: "ready",
      startTime: new Date(Date.now() - (Math.round(Number(durationSeconds) || 0) * 1000)),
      endTime: new Date(),
      participantsCount: Math.max(1, participantNames.length),
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
    if (io && meetingId) {
      io.to(`meeting_${meetingId}`).emit("meeting_recording_saved", {
        recordingId,
        title: recording.title,
        fileUrl,
        durationSeconds: recording.durationSeconds,
      });
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

// 2. Get list of recordings with Search, Filter & Sort
router.get("/", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user?.userId || req.user?.id;
    const { q, dateFilter, sort = "newest", scope = "all" } = req.query;

    const filter = {};

    // Scope filter (personal vs shared)
    if (scope === "personal" && currentUserId) {
      filter.$or = [{ hostUserId: currentUserId }, { hostUserId: String(currentUserId) }];
    } else if (scope === "shared" && currentUserId) {
      filter.hostUserId = { $ne: String(currentUserId) };
    }

    // Search query
    if (q && q.trim()) {
      const reg = new RegExp(q.trim(), "i");
      filter.$or = [
        { title: reg },
        { hostName: reg },
        { participantNames: reg },
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

    // Compute storage analytics
    const allUserRecs = await Recording.find(currentUserId ? { $or: [{ hostUserId: currentUserId }, { hostUserId: String(currentUserId) }] } : {});
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

// 3. Get single recording
router.get("/:recordingId", async (req, res) => {
  try {
    const recording = await Recording.findOne({ recordingId: req.params.recordingId });
    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
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

    // Permission check: host can rename
    const currentUserId = req.user?.userId || req.user?.id;
    if (recording.hostUserId && String(recording.hostUserId) !== String(currentUserId)) {
      return res.status(403).json({ error: "Only the recording host can rename this video" });
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
