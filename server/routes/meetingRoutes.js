const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/jwtConfig");
const JWT_SECRET = getJwtSecret();
const Meeting = require("../models/Meeting");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");
const fs = require("fs");
const path = require("path");
const os = require("os");


function optionalAuthToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch {
    req.user = null;
  }
  next();
}

const {
  executeCode,
  evaluateTestCasesBatch,
  validateCodeSafety,
  isProductionExecutionRestricted,
} = require("../services/codeExecutionService");
const { getProblemExecutionConfig } = require("../data/problemExecutionConfig");

// Preset study rooms matching reference image & coding curriculum
const STUDY_ROOMS_CATALOG = [
  {
    key: "coding",
    title: "Coding",
    category: "Development",
    icon: "</>",
    description: "Practice, discuss and solve coding problems together.",
    tags: ["Algorithms", "Problem Solving", "Clean Code"],
    isLive: true,
  },
  {
    key: "system-design",
    title: "System Design & Architecture",
    category: "Architecture",
    icon: "🏗️",
    description: "Discuss distributed systems, scalability, and backend architecture.",
    tags: ["Microservices", "Caching", "System Design"],
    isLive: true,
  },
  {
    key: "project",
    title: "Project Collaboration",
    category: "Engineering",
    icon: "💡",
    description: "Work on projects together in real-time.",
    tags: ["Full-Stack", "Architecture", "Git Flow"],
    isLive: true,
  },
  {
    key: "dsa",
    title: "DSA Practice",
    category: "Algorithms",
    icon: "⚡",
    description: "Daily LeetCode & algorithmic challenges discussion.",
    tags: ["Trees", "Dynamic Programming", "Graphs"],
    isLive: true,
  },
  {
    key: "python",
    title: "Python Developers",
    category: "Backend",
    icon: "🐍",
    description: "FastAPI, Django, scripting, and machine learning pipelines.",
    tags: ["Python 3", "AsyncIO", "Data Science"],
    isLive: true,
  },
  {
    key: "interview",
    title: "Interview Preparation",
    category: "Career",
    icon: "💼",
    description: "Mock technical interviews and live pair programming.",
    tags: ["Mock Rounds", "System Design", "Behavioral"],
    isLive: true,
  },
];

// Alphabet for Google Meet-style 10-character human-readable unique IDs
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

// In-flight creation locks to prevent duplicate calls from rapid double-clicks
const creationLocks = new Map();

// Normalizes meeting ID (handles dashed "xxx-yyyy-zzz", non-dashed "xxxyyyyzzz", uppercase, and full URLs)
function normalizeMeetingId(rawInput = "") {
  let clean = String(rawInput || "").trim().toLowerCase();
  if (clean.includes("/meeting/")) {
    clean = clean.split("/meeting/").pop().split("?")[0].split("/")[0];
  }
  const alphanumeric = clean.replace(/[^a-z0-9]/g, "");
  if (alphanumeric.length === 10) {
    return `${alphanumeric.slice(0, 3)}-${alphanumeric.slice(3, 7)}-${alphanumeric.slice(7, 10)}`;
  }
  return clean;
}

// Generates cryptographically secure, collision-free Google Meet-style meeting IDs
async function generateUniqueMeetingId() {
  const getRandomChars = (len) => {
    let result = "";
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
      result += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return result;
  };

  let uniqueId = "";
  let exists = true;
  let attempts = 0;

  // Format: xxx-yyyy-zzz (e.g. "mzt-kpwq-dxj"), identical to Google Meet standard (141+ trillion combinations)
  while (exists && attempts < 25) {
    attempts++;
    const seg1 = getRandomChars(3);
    const seg2 = getRandomChars(4);
    const seg3 = getRandomChars(3);
    uniqueId = `${seg1}-${seg2}-${seg3}`;

    // Verify against database that no active or past meeting has this ID
    const found = await Meeting.exists({
      $or: [
        { meetingId: uniqueId },
        { meetingId: uniqueId.replace(/-/g, "") },
        { invitationCode: uniqueId },
      ],
    });
    if (!found) {
      exists = false;
    }
  }

  return uniqueId;
}

// -------------------------------------------------------------
// 0. GET /api/meetings/ice-config (STUN + Configurable TURN Servers)
// -------------------------------------------------------------
function buildIceServersConfig() {
  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ];

  const turnUrlsRaw = (process.env.TURN_URLS || process.env.TURN_URL || "").trim();
  const turnUsername = (process.env.TURN_USERNAME || "").trim();
  const turnCredential = (process.env.TURN_CREDENTIAL || process.env.TURN_PASSWORD || "").trim();

  if (turnUrlsRaw) {
    const urls = turnUrlsRaw
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length > 0) {
      const turnEntry = { urls: urls.length === 1 ? urls[0] : urls };
      if (turnUsername) turnEntry.username = turnUsername;
      if (turnCredential) turnEntry.credential = turnCredential;
      iceServers.push(turnEntry);
    }
  }

  return {
    iceServers,
    turnConfigured: Boolean(turnUrlsRaw),
  };
}

router.get("/ice-config", optionalAuthToken, (req, res) => {
  try {
    const config = buildIceServersConfig();
    res.json({
      success: true,
      ...config,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 1. GET /api/meetings/study-rooms
// -------------------------------------------------------------
router.get("/study-rooms", async (req, res) => {
  try {
    const activeMeetings = await Meeting.find({ status: "active" })
      .select("meetingId title groupKey participants createdAt")
      .lean();

    const rooms = STUDY_ROOMS_CATALOG.map((room) => {
      const activeForGroup = activeMeetings.filter((m) => m.groupKey === room.key);
      const activeMeeting = activeForGroup[0] || null;
      const totalLive = activeForGroup.reduce((sum, m) => {
        return sum + (Array.isArray(m.participants) ? m.participants.filter((p) => !p.leftAt).length : 0);
      }, 0);
      return {
        ...room,
        activeMeetingId: activeMeeting ? activeMeeting.meetingId : null,
        activeMeetingsCount: activeForGroup.length,
        liveParticipantsCount: totalLive,
        onlineCount: totalLive > 0 ? String(totalLive) : "0",
        onlineNumber: totalLive,
      };
    });

    res.json({
      success: true,
      rooms,
      totalActiveMeetings: activeMeetings.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. POST /api/meetings/create
// -------------------------------------------------------------
router.post("/create", authenticateToken, async (req, res) => {
  const mongoose = require("mongoose");
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Verified authentication required to create a meeting session.",
    });
  }
  // Derive user identity strictly from verified token; never trust client-supplied userId
  const userId = String(req.user.userId || req.user.id || req.user._id);
  const {
    title = "DSA Practice",
    groupKey = "dsa",
    isPrivate = false,
    initialCode,
    initialLanguage = "python",
  } = req.body;

  if (isPrivate && !req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required to create a private meeting.",
    });
  }

  const cleanTitle = (title || "DSA Practice").trim();
  const lockKey = `${userId}_${cleanTitle.toLowerCase()}`;

  // 1. If a creation request for this exact user and title is currently in-flight, await it synchronously
  if (creationLocks.has(lockKey)) {
    try {
      const lockedResult = await creationLocks.get(lockKey);
      return res.status(200).json({
        success: true,
        message: "Active meeting session reused (concurrent lock resolved)",
        meeting: lockedResult.meeting,
        meetingId: lockedResult.meetingId,
        joinUrl: `/meeting/${lockedResult.meetingId}`,
      });
    } catch {}
  }

  // Reserve lock synchronously BEFORE any async await to prevent race conditions
  let resolveLock;
  let rejectLock;
  const lockPromise = new Promise((resolve, reject) => {
    resolveLock = resolve;
    rejectLock = reject;
  });
  creationLocks.set(lockKey, lockPromise);

  try {
    // 2. Check if user created an active meeting with the same title in the last 15 seconds
    const recentDuplicate = await Meeting.findOne({
      hostUserId: userId,
      title: cleanTitle,
      status: "active",
      createdAt: { $gte: new Date(Date.now() - 15000) },
    }).lean();

    if (recentDuplicate) {
      resolveLock({ meeting: recentDuplicate, meetingId: recentDuplicate.meetingId });
      setTimeout(() => creationLocks.delete(lockKey), 12000);
      return res.status(200).json({
        success: true,
        message: "Active meeting session reused",
        meetingId: recentDuplicate.meetingId,
        meeting: recentDuplicate,
        joinUrl: `/meeting/${recentDuplicate.meetingId}`,
      });
    }

    const user = mongoose.Types.ObjectId.isValid(userId)
      ? await User.findById(userId).select("fullName username email avatarUrl").lean()
      : null;
    const meetingId = await generateUniqueMeetingId();

    const starterFileName =
      initialLanguage === "python"
        ? "main.py"
        : initialLanguage === "java"
        ? "Main.java"
        : initialLanguage === "cpp"
        ? "main.cpp"
        : initialLanguage === "c"
        ? "main.c"
        : "index.js";

    const defaultCodeContent =
      initialCode ||
      (initialLanguage === "python"
        ? `# Welcome to Mastery Zone Live — ${title}\ndef solve(n):\n    """Calculate square of n"""\n    return n * n\n\nif __name__ == "__main__":\n    for x in range(1, 6):\n        print(f"solve({x}) = {solve(x)}")\n`
        : initialLanguage === "java"
        ? `// Welcome to Mastery Zone Live — ${title}\npublic class Main {\n    public static int solve(int n) {\n        return n * n;\n    }\n    public static void main(String[] args) {\n        for (int i = 1; i <= 5; i++) {\n            System.out.println("solve(" + i + ") = " + solve(i));\n        }\n    }\n}\n`
        : initialLanguage === "cpp"
        ? `// Welcome to Mastery Zone Live — ${title}\n#include <iostream>\nusing namespace std;\n\nint solve(int n) {\n    return n * n;\n}\n\nint main() {\n    for (int i = 1; i <= 5; i++) {\n        cout << "solve(" << i << ") = " << solve(i) << endl;\n    }\n    return 0;\n}\n`
        : `// Welcome to Mastery Zone Live — ${title}\nfunction solve(n) {\n    return n * n;\n}\n\nfor (let i = 1; i <= 5; i++) {\n    console.log(\`solve(\${i}) = \${solve(i)}\`);\n}\n`);

    const initialFiles = [
      {
        id: "file_0",
        name: starterFileName,
        language: initialLanguage,
        content: defaultCodeContent,
        lastModifiedBy: user?.fullName || "Host",
      },
      {
        id: "file_1",
        name: "helpers.py",
        language: "python",
        content: `# Shared Helper Functions & Utilities\ndef is_prime(num):\n    if num < 2: return False\n    for i in range(2, int(num**0.5) + 1):\n        if num % i == 0: return False\n    return True\n`,
        lastModifiedBy: user?.fullName || "Host",
      },
      {
        id: "file_2",
        name: "README.md",
        language: "markdown",
        content: `# ${title} — Live Shared Workspace\n\nReal-time collaborative development and compiler sandbox.\nUse 'Run Code' or 'Run Test Cases' to verify implementations.\n`,
        lastModifiedBy: user?.fullName || "Host",
      },
    ];

    const initialTestCases = [
      { id: "tc_1", input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]", actualOutput: "", passed: false, isHidden: false },
      { id: "tc_2", input: "[3, 2, 4]\n6", expectedOutput: "[1, 2]", actualOutput: "", passed: false, isHidden: false },
      { id: "tc_3", input: "[3, 3]\n6", expectedOutput: "[0, 1]", actualOutput: "", passed: false, isHidden: false },
      { id: "tc_4", input: "[1, 5, 7, 12, 19]\n20", expectedOutput: "[0, 4]", actualOutput: "", passed: false, isHidden: true },
      { id: "tc_5", input: "[-3, 4, 3, 90]\n0", expectedOutput: "[0, 2]", actualOutput: "", passed: false, isHidden: true },
      { id: "tc_6", input: "[0, 4, 3, 0]\n0", expectedOutput: "[0, 3]", actualOutput: "", passed: false, isHidden: true },
      { id: "tc_7", input: "[-1, -2, -3, -4, -5]\n-8", expectedOutput: "[2, 4]", actualOutput: "", passed: false, isHidden: true },
      { id: "tc_8", input: "[1000000000, 3, 5, 1000000000]\n2000000000", expectedOutput: "[0, 3]", actualOutput: "", passed: false, isHidden: true },
      { id: "tc_9", input: "[2, 5, 5, 11]\n10", expectedOutput: "[1, 2]", actualOutput: "", passed: false, isHidden: true },
      { id: "tc_10", input: "[1, 2, 3, 4, 6]\n10", expectedOutput: "[3, 4]", actualOutput: "", passed: false, isHidden: true },
    ];

    const initialTasks = [
      { id: "task_1", title: "Implement core algorithmic solution", assignedTo: user?.fullName || "Host", completed: false },
      { id: "task_2", title: "Add input validation & edge-case testing", assignedTo: "Unassigned", completed: false },
      { id: "task_3", title: "Optimize asymptotic time complexity", assignedTo: "Team", completed: false },
    ];

    const initialReviews = [];

    const newMeeting = new Meeting({
      meetingId,
      title,
      groupKey,
      groupTitle:
        STUDY_ROOMS_CATALOG.find((r) => r.key === groupKey)?.title || title,
      hostUserId: String(userId),
      hostName: user?.fullName || user?.username || "Host",
      hostEmail: user?.email || "",
      invitationCode: meetingId,
      isPrivate,
      codingPermission: "collaborative",
      workspaceFiles: initialFiles,
      activeFileId: "file_0",
      testCases: initialTestCases,
      sharedTasks: initialTasks,
      codeReviews: initialReviews,
      whiteboardData: "[]",
      participants: [],
      sharedCode: {
        code: defaultCodeContent,
        language: initialLanguage,
        lastModifiedBy: user?.fullName || "Host",
        lastUpdatedAt: new Date(),
      },
      notes: {
        content: `# Meeting Notes — ${title}\n\n- Welcome to the real-time collaboration session!\n- Shared coding and live problem discussion.\n`,
        lastModifiedBy: user?.fullName || "Host",
        lastUpdatedAt: new Date(),
      },
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: "system",
          senderName: "Mastery Zone Live",
          senderAvatar: "",
          text: `Welcome to ${title}! Real-time video, audio, shared coding, and chat are active.`,
          timeString: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          timestamp: new Date(),
        },
      ],
    });

    await newMeeting.save();
    resolveLock({ meeting: newMeeting, meetingId: newMeeting.meetingId });
    setTimeout(() => {
      creationLocks.delete(lockKey);
    }, 12000);

    res.status(201).json({
      success: true,
      meeting: newMeeting,
      meetingId: newMeeting.meetingId,
      joinUrl: `/meeting/${newMeeting.meetingId}`,
    });
  } catch (err) {
    creationLocks.delete(lockKey);
    if (rejectLock) rejectLock(err);
    console.error("Meeting create error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. GET /api/meetings/:meetingId
// -------------------------------------------------------------
router.get("/:meetingId", optionalAuthToken, async (req, res) => {
  try {
    const cleanId = normalizeMeetingId(req.params.meetingId);
    const nonDashed = cleanId.replace(/-/g, "");
    const meeting = await Meeting.findOne({
      $or: [
        { meetingId: cleanId },
        { meetingId: nonDashed },
        { invitationCode: cleanId },
        { invitationCode: nonDashed },
      ],
    }).lean();

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found. The meeting link or code is invalid or does not exist.",
      });
    }

    const currentUserId = String(req.user?.userId || req.user?.id || req.user?._id || "");
    const isHost = Boolean(currentUserId && String(meeting.hostUserId) === currentUserId);
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
    const isParticipant = (meeting.participants || []).some((p) => String(p.userId) === currentUserId);

    if (meeting.isPrivate && !isHost && !isParticipant && !isAdmin) {
      return res.status(403).json({
        success: false,
        isPrivate: true,
        message: "This is a private meeting. You are not authorized to view or join it.",
      });
    }

    if (meeting.status === "ended" || meeting.isEnded === true) {
      return res.status(200).json({
        success: true,
        meeting,
        isEnded: true,
        isHost,
        message: "This meeting session has ended and is no longer active.",
      });
    }

    res.json({
      success: true,
      meeting,
      isEnded: false,
      isHost,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. POST /api/meetings/:meetingId/join
// -------------------------------------------------------------
router.post("/:meetingId/join", optionalAuthToken, async (req, res) => {
  try {
    const cleanId = normalizeMeetingId(req.params.meetingId);
    const nonDashed = cleanId.replace(/-/g, "");

    const meeting = await Meeting.findOne({
      $or: [
        { meetingId: cleanId },
        { meetingId: nonDashed },
        { invitationCode: cleanId },
        { invitationCode: nonDashed },
      ],
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found. The meeting code or link is invalid.",
      });
    }

    let userId;
    let callerName;
    let user = null;
    let isHost = false;

    if (req.user) {
      userId = String(req.user.userId || req.user.id || req.user?._id);
      user = await User.findById(userId).select("fullName username email avatarUrl").lean();
      callerName = user?.fullName || user?.username || req.user?.name || "Participant";
      isHost = String(meeting.hostUserId) === String(userId);
    } else {
      // Unauthenticated caller: preserve a valid guest_* identifier for session continuity, but NEVER allow host privileges
      const rawGuestId = String(req.body?.guestId || "").trim();
      if (/^guest_[a-zA-Z0-9_-]{4,32}$/.test(rawGuestId)) {
        userId = rawGuestId;
      } else {
        userId = "guest_" + crypto.randomBytes(6).toString("hex");
      }
      callerName = String(req.body?.fullName || req.query?.name || "Guest").trim() || "Guest";
      isHost = false; // Unauthenticated guest can NEVER claim host privileges
    }

    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
    const isExistingParticipant = (meeting.participants || []).some((p) => String(p.userId) === String(userId));

    if (meeting.isPrivate && !isHost && !isExistingParticipant && !isAdmin) {
      return res.status(403).json({
        success: false,
        isPrivate: true,
        message: "This is a private meeting. You are not authorized to join it.",
      });
    }

    if (meeting.status === "ended") {
      if (isHost) {
        // Host re-activating their active session upon page refresh / reconnection
        meeting.status = "active";
        meeting.endedAt = null;
        await meeting.save();
      } else {
        return res.status(410).json({
          success: false,
          isEnded: true,
          message: "This meeting has ended and is no longer accepting participants.",
        });
      }
    }

    const existingIdx = meeting.participants.findIndex(
      (p) => !p.leftAt && (String(p.userId) === String(userId) || (callerName !== "Guest" && p.fullName === callerName))
    );

    if (existingIdx === -1) {
      meeting.participants.push({
        userId: String(userId),
        fullName: callerName,
        username: user?.username || callerName.toLowerCase().replace(/\s+/g, "_"),
        email: user?.email || "",
        avatarUrl: user?.avatarUrl || "",
        role: isHost ? "host" : "participant",
        isMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
        isHandRaised: false,
        joinedAt: new Date(),
      });
      await meeting.save();
    }

    res.json({
      success: true,
      meeting,
      isHost,
      participantId: String(userId),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. POST /api/meetings/:meetingId/leave
// -------------------------------------------------------------
router.post("/:meetingId/leave", optionalAuthToken, async (req, res) => {
  try {
    const cleanId = normalizeMeetingId(req.params.meetingId);
    const nonDashed = cleanId.replace(/-/g, "");

    // Only derive userId from authenticated token; never trust client-supplied userId
    const authenticatedUserId = req.user ? String(req.user.userId || req.user.id || req.user._id) : null;
    const guestId = !authenticatedUserId && req.body?.guestId && String(req.body.guestId).startsWith("guest_")
      ? String(req.body.guestId)
      : null;
    const effectiveUserId = authenticatedUserId || guestId;

    if (!effectiveUserId) {
      return res.json({ success: true });
    }

    const meeting = await Meeting.findOne({
      $or: [
        { meetingId: cleanId },
        { meetingId: nonDashed },
        { invitationCode: cleanId },
        { invitationCode: nonDashed },
      ],
    });
    if (meeting) {
      meeting.participants = meeting.participants.map((p) => {
        if (String(p.userId) === String(effectiveUserId) && !p.leftAt) {
          p.leftAt = new Date();
        }
        return p;
      });
      const activeCount = meeting.participants.filter((p) => !p.leftAt).length;
      // Only authenticated host can trigger meeting status = "ended" upon leave
      if (activeCount === 0 && authenticatedUserId && String(meeting.hostUserId) === authenticatedUserId) {
        meeting.status = "ended";
        meeting.endedAt = new Date();
      }
      await meeting.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 6. POST /api/meetings/:meetingId/end (Host only)
// -------------------------------------------------------------
router.post("/:meetingId/end", authenticateToken, async (req, res) => {
  try {
    const cleanId = normalizeMeetingId(req.params.meetingId);
    const nonDashed = cleanId.replace(/-/g, "");
    const userId = req.user.userId || req.user.id || req.user._id;

    const meeting = await Meeting.findOne({
      $or: [
        { meetingId: cleanId },
        { meetingId: nonDashed },
        { invitationCode: cleanId },
        { invitationCode: nonDashed },
      ],
    });
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });

    if (String(meeting.hostUserId) !== String(userId)) {
      return res.status(403).json({ error: "Only the meeting host can end the meeting for all." });
    }

    meeting.status = "ended";
    meeting.endedAt = new Date();
    await meeting.save();

    // Broadcast end event via socket if mounted
    const io = req.app.get("io");
    if (io) {
      io.to(`meeting_${meeting.meetingId}`).emit("meeting_ended_by_host", {
        message: "The host has ended this meeting.",
      });
    }

    res.json({ success: true, message: "Meeting ended successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. POST /api/meetings/:meetingId/run-code (Sandboxed execution)
// -------------------------------------------------------------
router.post("/:meetingId/run-code", authenticateToken, async (req, res) => {
  try {
    const cleanId = normalizeMeetingId(req.params.meetingId);
    const nonDashed = cleanId.replace(/-/g, "");
    const { code, language = "python", stdin = "", files = [] } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code content is required" });
    }

    const meeting = await Meeting.findOne({
      $or: [{ meetingId: cleanId }, { meetingId: nonDashed }, { invitationCode: cleanId }],
    });
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const callerId = String(req.user?.userId || req.user?.id || req.user?._id || "");
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
    const isHost = meeting.hostUserId && String(meeting.hostUserId) === callerId;
    const isParticipant = Array.isArray(meeting.participants) && meeting.participants.some((p) => String(p.userId || "") === callerId);

    if (!isAdmin && !isHost && !isParticipant) {
      return res.status(403).json({ error: "Access denied: you are not an authorized member of this meeting." });
    }

    const lang = String(language).toLowerCase();
    let result = { output: "", error: "", ok: false, durationMs: 0 };

    if (lang === "html" || lang === "htm" || lang === "css") {
      result = {
        output: code,
        error: "",
        ok: true,
        durationMs: 1,
        isWebPreview: true,
      };
    } else {
      const execRes = await executeCode({ language: lang, code, stdin, timeoutMs: 5000, files });
      if (execRes.isSecurityViolation) {
        return res.status(400).json({ output: "", error: `Security Violation: ${execRes.error}`, ok: false, durationMs: 0 });
      }
      if (execRes.isUnavailable) {
        return res.status(503).json({
          success: false,
          error: execRes.error || "Production execution requires a configured isolated execution environment (Judge0).",
        });
      }
      result = {
        output: execRes.output || "",
        error: execRes.error || "",
        ok: execRes.exitCode === 0,
        durationMs: execRes.duration || 0,
      };
    }

    // Broadcast execution output to all participants in this meeting room
    const io = req.app.get("io");
    if (io) {
      io.to(`meeting_${meeting.meetingId}`).emit("meeting_code_executed", {
        language,
        result,
        executedBy: req.user?.username || req.user?.fullName || "A participant",
      });
    }

    res.json({
      success: true,
      output: result.output,
      error: result.error,
      duration: result.durationMs,
      exitCode: result.ok ? 0 : 1,
      result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 8. POST /api/meetings/:meetingId/run-tests (Collaborative Test Runner)
// -------------------------------------------------------------
router.post("/:meetingId/run-tests", authenticateToken, async (req, res) => {
  try {
    const cleanId = normalizeMeetingId(req.params.meetingId);
    const nonDashed = cleanId.replace(/-/g, "");
    const { code, language = "python", testCases = [], problemId, functionName } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code content is required" });
    }

    const meeting = await Meeting.findOne({
      $or: [{ meetingId: cleanId }, { meetingId: nonDashed }, { invitationCode: cleanId }],
    });
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const callerId = String(req.user?.userId || req.user?.id || req.user?._id || "");
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
    const isHost = meeting.hostUserId && String(meeting.hostUserId) === callerId;
    const isParticipant = Array.isArray(meeting.participants) && meeting.participants.some((p) => String(p.userId || "") === callerId);

    if (!isAdmin && !isHost && !isParticipant) {
      return res.status(403).json({ error: "Access denied: you are not an authorized member of this meeting." });
    }

    const lang = String(language).toLowerCase();
    const safety = validateCodeSafety(lang, code);
    if (!safety.safe) {
      return res.status(400).json({ error: `Security Violation: ${safety.reason}`, passedCount: 0, testResults: [] });
    }

    if (isProductionExecutionRestricted && isProductionExecutionRestricted()) {
      return res.status(503).json({
        success: false,
        error: "Production execution requires a configured isolated execution environment (Judge0).",
        passedCount: 0,
        testResults: [],
      });
    }

    const testsToRun = testCases.length > 0 ? testCases : meeting?.testCases || [];
    const execConfig = getProblemExecutionConfig(problemId || functionName || meeting.problemId || meeting.functionName);
    const resolvedFunctionName = functionName || execConfig.functionName || "";
    const evaluated = await evaluateTestCasesBatch(lang, code, testsToRun, {
      functionName: resolvedFunctionName,
      problemId: problemId || execConfig.problemId || meeting.problemId,
    });
    const testResults = evaluated.map((item, i) => {
      const tc = testsToRun[i] || {};
      const actualOutput = item.actual !== undefined ? item.actual : (item.actualOutput || "");
      const expectedOutput = item.expected !== undefined ? item.expected : (tc.expectedOutput || "");
      return {
        id: tc.id || `tc_${i + 1}`,
        input: tc.input,
        expectedOutput,
        actualOutput,
        error: item.error || "",
        passed: Boolean(item.passed),
      };
    });
    const passedCount = testResults.filter((r) => r.passed).length;

    // Persist updated test results
    if (meeting) {
      meeting.testCases = testResults;
      await meeting.save();
    }

    // Broadcast test run results to meeting
    const io = req.app.get("io");
    if (io) {
      io.to(`meeting_${meeting.meetingId}`).emit("meeting_tests_executed", {
        passedCount,
        totalCount: testResults.length,
        results: testResults,
        executedBy: req.user?.username || req.user?.fullName || "A participant",
      });
    }

    res.json({
      success: true,
      passedCount,
      totalCount: testResults.length,
      results: testResults,
      testResults,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 9. POST /api/meetings/:meetingId/submit-solution (Collaborative Solution Grading)
// -------------------------------------------------------------
router.post("/:meetingId/submit-solution", authenticateToken, async (req, res) => {
  try {
    const cleanId = normalizeMeetingId(req.params.meetingId);
    const nonDashed = cleanId.replace(/-/g, "");
    const {
      code,
      language = "python",
      challengeTitle = "Two Sum",
      testCases = [],
      passingPercentage = 80,
    } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code content is required" });
    }

    const meeting = await Meeting.findOne({
      $or: [{ meetingId: cleanId }, { meetingId: nonDashed }, { invitationCode: cleanId }],
    });
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const callerId = String(req.user?.userId || req.user?.id || req.user?._id || "");
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
    const isHost = meeting.hostUserId && String(meeting.hostUserId) === callerId;
    const isParticipant = Array.isArray(meeting.participants) && meeting.participants.some((p) => String(p.userId || "") === callerId);

    if (!isAdmin && !isHost && !isParticipant) {
      return res.status(403).json({ error: "Access denied: you are not an authorized member of this meeting." });
    }

    const lang = String(language).toLowerCase();
    const safety = validateCodeSafety(lang, code);
    if (!safety.safe) {
      return res.status(400).json({ error: `Security Violation: ${safety.reason}`, passed: false, passedPercentage: 0, testResults: [] });
    }

    if (isProductionExecutionRestricted && isProductionExecutionRestricted()) {
      return res.status(503).json({
        success: false,
        error: "Production execution requires a configured isolated execution environment (Judge0).",
        passed: false,
        passedPercentage: 0,
        testResults: [],
      });
    }

    const testsToRun = testCases.length > 0 ? testCases : meeting?.testCases || [];
    const execConfig = getProblemExecutionConfig(meeting.problemId || meeting.functionName || challengeTitle);
    const resolvedFunctionName = meeting.functionName || execConfig.functionName || "";
    const evaluated = await evaluateTestCasesBatch(lang, code, testsToRun, {
      functionName: resolvedFunctionName,
      problemId: meeting.problemId || execConfig.problemId,
    });

    const testResults = evaluated.map((item, i) => {
      const tc = testsToRun[i] || {};
      const actualOutput = item.actual !== undefined ? item.actual : (item.actualOutput || "");
      const expectedOutput = item.expected !== undefined ? item.expected : (tc.expectedOutput || "");
      return {
        id: tc.id || `tc_${i + 1}`,
        input: tc.input,
        expectedOutput,
        actualOutput,
        error: item.error || "",
        passed: Boolean(item.passed),
      };
    });
    const passedCount = testResults.filter((r) => r.passed).length;

    const totalCount = testResults.length || 1;
    const scorePercentage = Math.round((passedCount / totalCount) * 100);
    const isPassing = scorePercentage >= passingPercentage;

    const evaluationResult = {
      challengeTitle,
      passedCount,
      totalCount,
      scorePercentage,
      isPassing,
      submittedBy: req.user?.fullName || req.user?.username || "Collaborator",
      submittedAt: new Date().toISOString(),
    };

    // Broadcast submission result to all participants in meeting room
    const io = req.app.get("io");
    if (io) {
      io.to(`meeting_${meeting.meetingId}`).emit("meeting_solution_submitted", {
        result: evaluationResult,
        user: { fullName: evaluationResult.submittedBy },
      });
    }

    res.json({
      success: true,
      ...evaluationResult,
      testResults,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
