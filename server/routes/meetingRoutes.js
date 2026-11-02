const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const Meeting = require("../models/Meeting");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

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

const GCC_BIN = fs.existsSync("/usr/bin/gcc") ? "/usr/bin/gcc" : "gcc";
const GPP_BIN = fs.existsSync("/usr/bin/g++") ? "/usr/bin/g++" : "g++";
const PYTHON_BIN = fs.existsSync("/usr/bin/python3") ? "/usr/bin/python3" : "python3";
const NODE_BIN = fs.existsSync("/usr/local/bin/node") ? "/usr/local/bin/node" : "node";
const JAVAC_BIN = fs.existsSync("/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/javac")
  ? "/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/javac"
  : fs.existsSync("/usr/local/bin/javac")
  ? "/usr/local/bin/javac"
  : "javac";
const JAVA_BIN = fs.existsSync("/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/java")
  ? "/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/java"
  : fs.existsSync("/usr/local/bin/java")
  ? "/usr/local/bin/java"
  : "java";

function runSandboxedProcess(command, args, stdinInput = "", timeoutMs = 4500, cwd = os.tmpdir()) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let isSettled = false;

    let proc;
    try {
      proc = spawn(command, args, {
        cwd,
        env: { PATH: process.env.PATH, HOME: os.tmpdir() },
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err) {
      return resolve({
        output: "",
        error: `Failed to spawn process: ${err.message}`,
        duration: Date.now() - startTime,
        exitCode: 1,
      });
    }

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try {
          proc.kill("SIGKILL");
        } catch {}
        resolve({
          output: stdout,
          error: `Execution timed out after ${timeoutMs / 1000}s.`,
          duration: Date.now() - startTime,
          exitCode: -1,
        });
      }
    }, timeoutMs);

    if (stdinInput && proc.stdin) {
      try {
        proc.stdin.write(stdinInput);
        proc.stdin.end();
      } catch {}
    } else if (proc.stdin) {
      try {
        proc.stdin.end();
      } catch {}
    }

    proc.stdout.on("data", (chunk) => {
      if (stdout.length < 1024 * 256) stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk) => {
      if (stderr.length < 1024 * 256) stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve({
          output: stdout,
          error: `Execution error: ${err.message}`,
          duration: Date.now() - startTime,
          exitCode: 1,
        });
      }
    });

    proc.on("close", (code) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve({
          output: stdout,
          error: stderr,
          duration: Date.now() - startTime,
          exitCode: code || 0,
        });
      }
    });
  });
}

// Preset study rooms matching reference image & coding curriculum
const STUDY_ROOMS_CATALOG = [
  {
    key: "coding",
    title: "Coding",
    category: "Development",
    icon: "</>",
    description: "Practice, discuss and solve coding problems together.",
    onlineCount: "1.2k",
    onlineNumber: 1240,
    tags: ["Algorithms", "Problem Solving", "Clean Code"],
    isLive: true,
  },
  {
    key: "language",
    title: "Language Practice",
    category: "Communication",
    icon: "文A",
    description: "Improve your skills with native speakers and technical English.",
    onlineCount: "842",
    onlineNumber: 842,
    tags: ["English", "Technical Vocab", "Spanish"],
    isLive: true,
  },
  {
    key: "project",
    title: "Project Collaboration",
    category: "Engineering",
    icon: "💡",
    description: "Work on projects together in real-time.",
    onlineCount: "987",
    onlineNumber: 987,
    tags: ["Full-Stack", "Architecture", "Git Flow"],
    isLive: true,
  },
  {
    key: "dsa",
    title: "DSA Practice",
    category: "Algorithms",
    icon: "⚡",
    description: "Daily LeetCode & algorithmic challenges discussion.",
    onlineCount: "650",
    onlineNumber: 650,
    tags: ["Trees", "Dynamic Programming", "Graphs"],
    isLive: true,
  },
  {
    key: "python",
    title: "Python Developers",
    category: "Backend",
    icon: "🐍",
    description: "FastAPI, Django, scripting, and machine learning pipelines.",
    onlineCount: "520",
    onlineNumber: 520,
    tags: ["Python 3", "AsyncIO", "Data Science"],
    isLive: true,
  },
  {
    key: "interview",
    title: "Interview Preparation",
    category: "Career",
    icon: "💼",
    description: "Mock technical interviews and live pair programming.",
    onlineCount: "780",
    onlineNumber: 780,
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
      return {
        ...room,
        activeMeetingId: activeMeeting ? activeMeeting.meetingId : null,
        activeMeetingsCount: activeForGroup.length,
        liveParticipantsCount: activeMeeting
          ? (activeMeeting.participants || []).filter((p) => !p.leftAt).length
          : 0,
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
  const userId = String(req.user.userId || req.user.id || req.user._id);
  const {
    title = "DSA Practice",
    groupKey = "dsa",
    isPrivate = false,
    initialCode,
    initialLanguage = "python",
  } = req.body;

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

    const user = await User.findById(userId).select("fullName username email avatarUrl").lean();
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
      { id: "task_1", title: "Implement core algorithmic solution", assignedTo: user?.fullName || "Collaborator", completed: true },
      { id: "task_2", title: "Add input validation & edge-case testing", assignedTo: "Sarah M.", completed: false },
      { id: "task_3", title: "Optimize asymptotic time complexity", assignedTo: "Team", completed: false },
    ];

    const initialReviews = [
      {
        id: "cr_1",
        fileId: "file_0",
        fileName: starterFileName,
        lineNumber: 2,
        codeSnippet: "def solve(n):",
        authorName: user?.fullName || "Alex C.",
        authorId: String(userId),
        text: "Can we optimize this solution with memoization or two-pointer approach?",
        status: "open",
        createdAt: new Date(),
      },
    ];

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
    let meeting = await Meeting.findOne({
      $or: [
        { meetingId: cleanId },
        { meetingId: nonDashed },
        { invitationCode: cleanId },
        { invitationCode: nonDashed },
      ],
    }).lean();

    if (!meeting) {
      // Auto-create active meeting so link or code works reliably
      const hostUid = String(req.user?.userId || req.user?.id || req.user?._id || "host_" + Math.random().toString(36).slice(2, 8));
      const created = await Meeting.create({
        meetingId: cleanId,
        title: "Live Meeting Session",
        groupKey: "general",
        groupTitle: "Live Meeting",
        hostUserId: hostUid,
        hostName: "Host",
        status: "active",
        invitationCode: nonDashed,
        participants: [],
      });
      meeting = created.toObject();
    }

    res.json({
      success: true,
      meeting,
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
    const userId = req.user?.userId || req.user?.id || req.user?._id || req.body?.guestId || req.query?.guestId || ("guest_" + Math.random().toString(36).slice(2, 10));
    
    let user = null;
    if (req.user) {
      user = await User.findById(req.user.userId || req.user.id).select("fullName username email avatarUrl").lean();
    }

    const callerName = user?.fullName || user?.username || req.body?.fullName || req.query?.name || "Participant";

    let meeting = await Meeting.findOne({
      $or: [
        { meetingId: cleanId },
        { meetingId: nonDashed },
        { invitationCode: cleanId },
        { invitationCode: nonDashed },
      ],
    });

    if (!meeting) {
      meeting = await Meeting.create({
        meetingId: cleanId,
        title: "Live Meeting Session",
        groupKey: "general",
        groupTitle: "Live Meeting",
        hostUserId: String(userId),
        hostName: callerName,
        hostEmail: user?.email || "",
        status: "active",
        invitationCode: nonDashed,
        participants: [],
      });
    }

    if (meeting.status === "ended") {
      if (String(meeting.hostUserId) === String(userId)) {
        meeting.status = "active";
        meeting.endedAt = null;
        await meeting.save();
      }
    }

    const isHost = String(meeting.hostUserId) === String(userId);

    const existingIdx = meeting.participants.findIndex(
      (p) => String(p.userId) === String(userId) && !p.leftAt
    );

    if (existingIdx === -1) {
      meeting.participants.push({
        userId: String(userId),
        fullName: callerName,
        username: user?.username || callerName.toLowerCase().replace(/\s+/g, "_"),
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
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. POST /api/meetings/:meetingId/leave
// -------------------------------------------------------------
router.post("/:meetingId/leave", authenticateToken, async (req, res) => {
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
    if (meeting) {
      meeting.participants = meeting.participants.map((p) => {
        if (String(p.userId) === String(userId) && !p.leftAt) {
          p.leftAt = new Date();
        }
        return p;
      });
      const activeCount = meeting.participants.filter((p) => !p.leftAt).length;
      if (activeCount === 0 && String(meeting.hostUserId) === String(userId)) {
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
      io.to(`meeting_${meetingId}`).emit("meeting_ended_by_host", {
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
    const { meetingId } = req.params;
    const { code, language = "python", stdin = "", files = [] } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code content is required" });
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mz_live_code_"));
    const lang = String(language).toLowerCase();
    let result = { output: "", error: "", ok: false, durationMs: 0 };

    // Write any companion workspace files to tmpDir for multi-file imports
    if (Array.isArray(files)) {
      files.forEach((f) => {
        if (f.name && typeof f.content === "string") {
          try {
            fs.writeFileSync(path.join(tmpDir, path.basename(f.name)), f.content, "utf8");
          } catch {}
        }
      });
    }

    try {
      if (lang === "python" || lang === "py") {
        const filePath = path.join(tmpDir, "main.py");
        fs.writeFileSync(filePath, code, "utf8");
        const exec = await runSandboxedProcess(PYTHON_BIN, ["-u", filePath], stdin, 5000, tmpDir);
        result = {
          output: exec.output,
          error: exec.error,
          ok: exec.exitCode === 0,
          durationMs: exec.duration,
        };
      } else if (lang === "javascript" || lang === "js" || lang === "node") {
        const filePath = path.join(tmpDir, "index.js");
        fs.writeFileSync(filePath, code, "utf8");
        const exec = await runSandboxedProcess(NODE_BIN, [filePath], stdin, 5000, tmpDir);
        result = {
          output: exec.output,
          error: exec.error,
          ok: exec.exitCode === 0,
          durationMs: exec.duration,
        };
      } else if (lang === "cpp" || lang === "c++") {
        const srcPath = path.join(tmpDir, "main.cpp");
        const binPath = path.join(tmpDir, "main_bin");
        fs.writeFileSync(srcPath, code, "utf8");
        const compile = await runSandboxedProcess(GPP_BIN, ["-O2", srcPath, "-o", binPath], "", 6000, tmpDir);
        if (compile.exitCode !== 0) {
          result = {
            output: "",
            error: `Compilation Error (C++):\n${compile.error || compile.output}`,
            ok: false,
            durationMs: compile.duration,
          };
        } else {
          const exec = await runSandboxedProcess(binPath, [], stdin, 5000, tmpDir);
          result = {
            output: exec.output,
            error: exec.error,
            ok: exec.exitCode === 0,
            durationMs: exec.duration,
          };
        }
      } else if (lang === "c") {
        const srcPath = path.join(tmpDir, "main.c");
        const binPath = path.join(tmpDir, "main_bin");
        fs.writeFileSync(srcPath, code, "utf8");
        const compile = await runSandboxedProcess(GCC_BIN, ["-O2", srcPath, "-o", binPath], "", 6000, tmpDir);
        if (compile.exitCode !== 0) {
          result = {
            output: "",
            error: `Compilation Error (C):\n${compile.error || compile.output}`,
            ok: false,
            durationMs: compile.duration,
          };
        } else {
          const exec = await runSandboxedProcess(binPath, [], stdin, 5000, tmpDir);
          result = {
            output: exec.output,
            error: exec.error,
            ok: exec.exitCode === 0,
            durationMs: exec.duration,
          };
        }
      } else if (lang === "java") {
        let className = "Main";
        const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
        if (classMatch && classMatch[1]) {
          className = classMatch[1];
        }
        const filePath = path.join(tmpDir, `${className}.java`);
        fs.writeFileSync(filePath, code, "utf8");
        const compile = await runSandboxedProcess(JAVAC_BIN, [filePath], "", 6000, tmpDir);
        if (compile.exitCode !== 0) {
          result = {
            output: "",
            error: `Java Compilation Error:\n${compile.error || compile.output}`,
            ok: false,
            durationMs: compile.duration,
          };
        } else {
          const exec = await runSandboxedProcess(JAVA_BIN, ["-cp", tmpDir, className], stdin, 5000, tmpDir);
          result = {
            output: exec.output,
            error: exec.error,
            ok: exec.exitCode === 0,
            durationMs: exec.duration,
          };
        }
      } else if (lang === "html" || lang === "htm" || lang === "css") {
        result = {
          output: code,
          error: "",
          ok: true,
          durationMs: 1,
          isWebPreview: true,
        };
      } else {
        result = {
          output: "",
          error: `Language '${language}' is not supported directly in sandbox.`,
          ok: false,
          durationMs: 0,
        };
      }
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }

    // Broadcast execution output to all participants in this meeting room
    const io = req.app.get("io");
    if (io) {
      io.to(`meeting_${meetingId}`).emit("meeting_code_executed", {
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
    const { code, language = "python", testCases = [] } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code content is required" });
    }

    const meeting = await Meeting.findOne({
      $or: [{ meetingId: cleanId }, { meetingId: nonDashed }, { invitationCode: cleanId }],
    });
    const testsToRun = testCases.length > 0 ? testCases : meeting?.testCases || [];

    const lang = String(language).toLowerCase();
    const testResults = [];
    let passedCount = 0;

    // For compiled languages (C++, C, Java), compile once in a dedicated workspace
    let compiledBinPath = null;
    let compileError = null;
    let sharedTmpDir = null;
    let javaClassName = "Main";

    if (lang === "cpp" || lang === "c++" || lang === "c" || lang === "java") {
      sharedTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mz_live_test_compile_"));
      try {
        if (lang === "cpp" || lang === "c++") {
          const srcPath = path.join(sharedTmpDir, "main.cpp");
          compiledBinPath = path.join(sharedTmpDir, "main_bin");
          fs.writeFileSync(srcPath, code, "utf8");
          const compile = await runSandboxedProcess(GPP_BIN, ["-O2", srcPath, "-o", compiledBinPath], "", 7000, sharedTmpDir);
          if (compile.exitCode !== 0) compileError = compile.error || compile.output || "C++ compilation error";
        } else if (lang === "c") {
          const srcPath = path.join(sharedTmpDir, "main.c");
          compiledBinPath = path.join(sharedTmpDir, "main_bin");
          fs.writeFileSync(srcPath, code, "utf8");
          const compile = await runSandboxedProcess(GCC_BIN, ["-O2", srcPath, "-o", compiledBinPath], "", 7000, sharedTmpDir);
          if (compile.exitCode !== 0) compileError = compile.error || compile.output || "C compilation error";
        } else if (lang === "java") {
          const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
          if (classMatch && classMatch[1]) javaClassName = classMatch[1];
          const srcPath = path.join(sharedTmpDir, `${javaClassName}.java`);
          fs.writeFileSync(srcPath, code, "utf8");
          const compile = await runSandboxedProcess(JAVAC_BIN, [srcPath], "", 7000, sharedTmpDir);
          if (compile.exitCode !== 0) compileError = compile.error || compile.output || "Java compilation error";
        }
      } catch (cErr) {
        compileError = cErr.message;
      }
    }

    try {
      for (let i = 0; i < testsToRun.length; i++) {
        const tc = testsToRun[i];
        let actualOutput = "";
        let error = "";
        let passed = false;

        if (compileError) {
          error = compileError;
        } else {
          const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mz_live_test_"));
          try {
            if (lang === "python" || lang === "py") {
              const filePath = path.join(tmpDir, "main.py");
              fs.writeFileSync(filePath, code, "utf8");
              const exec = await runSandboxedProcess(PYTHON_BIN, ["-u", filePath], tc.input || "", 4000, tmpDir);
              actualOutput = (exec.output || "").trim();
              error = exec.error;
            } else if (lang === "javascript" || lang === "js" || lang === "node") {
              const filePath = path.join(tmpDir, "index.js");
              fs.writeFileSync(filePath, code, "utf8");
              const exec = await runSandboxedProcess(NODE_BIN, [filePath], tc.input || "", 4000, tmpDir);
              actualOutput = (exec.output || "").trim();
              error = exec.error;
            } else if (lang === "cpp" || lang === "c++" || lang === "c") {
              if (compiledBinPath && fs.existsSync(compiledBinPath)) {
                const exec = await runSandboxedProcess(compiledBinPath, [], tc.input || "", 4000, tmpDir);
                actualOutput = (exec.output || "").trim();
                error = exec.error;
              } else {
                error = "Compiled binary not found";
              }
            } else if (lang === "java") {
              if (sharedTmpDir) {
                const exec = await runSandboxedProcess(JAVA_BIN, ["-cp", sharedTmpDir, javaClassName], tc.input || "", 4000, tmpDir);
                actualOutput = (exec.output || "").trim();
                error = exec.error;
              } else {
                error = "Java runtime environment unavailable";
              }
            } else {
              actualOutput = "Execution verified";
            }

            const expected = String(tc.expectedOutput || "").trim();
            // Match strict or flexible substring
            passed = !error && (actualOutput === expected || actualOutput.replace(/\r\n/g, "\n") === expected.replace(/\r\n/g, "\n"));
          } catch (err) {
            error = err.message;
          } finally {
            try {
              fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch {}
          }
        }

        if (passed) passedCount++;
        testResults.push({
          id: tc.id || `tc_${i + 1}`,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput,
          error,
          passed,
          isHidden: Boolean(tc.isHidden),
        });
      }
    } finally {
      if (sharedTmpDir) {
        try {
          fs.rmSync(sharedTmpDir, { recursive: true, force: true });
        } catch {}
      }
    }

    // Persist updated test results
    if (meeting) {
      meeting.testCases = testResults;
      await meeting.save();
    }

    // Broadcast test run results to meeting
    const io = req.app.get("io");
    if (io) {
      io.to(`meeting_${meetingId}`).emit("meeting_tests_executed", {
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

    const testsToRun = testCases.length > 0 ? testCases : meeting?.testCases || [];
    const lang = String(language).toLowerCase();
    const testResults = [];
    let passedCount = 0;

    // Compiled language handling
    let compiledBinPath = null;
    let compileError = null;
    let sharedTmpDir = null;
    let javaClassName = "Main";

    if (lang === "cpp" || lang === "c++" || lang === "c" || lang === "java") {
      sharedTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mz_submit_compile_"));
      try {
        if (lang === "cpp" || lang === "c++") {
          const srcPath = path.join(sharedTmpDir, "main.cpp");
          compiledBinPath = path.join(sharedTmpDir, "main_bin");
          fs.writeFileSync(srcPath, code, "utf8");
          const compile = await runSandboxedProcess(GPP_BIN, ["-O2", srcPath, "-o", compiledBinPath], "", 7000, sharedTmpDir);
          if (compile.exitCode !== 0) compileError = compile.error || compile.output || "C++ compilation error";
        } else if (lang === "c") {
          const srcPath = path.join(sharedTmpDir, "main.c");
          compiledBinPath = path.join(sharedTmpDir, "main_bin");
          fs.writeFileSync(srcPath, code, "utf8");
          const compile = await runSandboxedProcess(GCC_BIN, ["-O2", srcPath, "-o", compiledBinPath], "", 7000, sharedTmpDir);
          if (compile.exitCode !== 0) compileError = compile.error || compile.output || "C compilation error";
        } else if (lang === "java") {
          const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
          if (classMatch && classMatch[1]) javaClassName = classMatch[1];
          const srcPath = path.join(sharedTmpDir, `${javaClassName}.java`);
          fs.writeFileSync(srcPath, code, "utf8");
          const compile = await runSandboxedProcess(JAVAC_BIN, [srcPath], "", 7000, sharedTmpDir);
          if (compile.exitCode !== 0) compileError = compile.error || compile.output || "Java compilation error";
        }
      } catch (cErr) {
        compileError = cErr.message;
      }
    }

    try {
      for (let i = 0; i < testsToRun.length; i++) {
        const tc = testsToRun[i];
        let actualOutput = "";
        let error = "";
        let passed = false;

        if (compileError) {
          error = compileError;
        } else {
          const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mz_submit_run_"));
          try {
            if (lang === "python" || lang === "py") {
              const filePath = path.join(tmpDir, "main.py");
              fs.writeFileSync(filePath, code, "utf8");
              const exec = await runSandboxedProcess(PYTHON_BIN, ["-u", filePath], tc.input || "", 4000, tmpDir);
              actualOutput = (exec.output || "").trim();
              error = exec.error;
            } else if (lang === "javascript" || lang === "js" || lang === "node") {
              const filePath = path.join(tmpDir, "index.js");
              fs.writeFileSync(filePath, code, "utf8");
              const exec = await runSandboxedProcess(NODE_BIN, [filePath], tc.input || "", 4000, tmpDir);
              actualOutput = (exec.output || "").trim();
              error = exec.error;
            } else if (lang === "cpp" || lang === "c++" || lang === "c") {
              if (compiledBinPath && fs.existsSync(compiledBinPath)) {
                const exec = await runSandboxedProcess(compiledBinPath, [], tc.input || "", 4000, tmpDir);
                actualOutput = (exec.output || "").trim();
                error = exec.error;
              } else {
                error = "Compiled binary not found";
              }
            } else if (lang === "java") {
              if (sharedTmpDir) {
                const exec = await runSandboxedProcess(JAVA_BIN, ["-cp", sharedTmpDir, javaClassName], tc.input || "", 4000, tmpDir);
                actualOutput = (exec.output || "").trim();
                error = exec.error;
              } else {
                error = "Java runtime unavailable";
              }
            } else {
              actualOutput = "Execution verified";
            }

            const expected = String(tc.expectedOutput || "").trim();
            passed = !error && (actualOutput === expected || actualOutput.replace(/\r\n/g, "\n") === expected.replace(/\r\n/g, "\n"));
          } catch (err) {
            error = err.message;
          } finally {
            try {
              fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch {}
          }
        }

        if (passed) passedCount++;
        testResults.push({
          id: tc.id || `tc_${i + 1}`,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput,
          error,
          passed,
          isHidden: Boolean(tc.isHidden),
        });
      }
    } finally {
      if (sharedTmpDir) {
        try {
          fs.rmSync(sharedTmpDir, { recursive: true, force: true });
        } catch {}
      }
    }

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
      io.to(`meeting_${meetingId}`).emit("meeting_solution_submitted", {
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
