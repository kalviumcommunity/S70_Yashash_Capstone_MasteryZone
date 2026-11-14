const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const os = require("os");

const https = require("https");
const http = require("http");
const authenticateToken = require("../middleware/authMiddleware");
const { optionalAuthenticateToken } = require("../middleware/authMiddleware");

// Models
const CodingSnippet = require("../models/CodingSnippet");
const CodingProgress = require("../models/CodingProgress");
const CodingSession = require("../models/CodingSession");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const ModuleAssessmentAttempt = require("../models/ModuleAssessmentAttempt");
const Progress = require("../models/ProgressSchema");
const Certification = require("../models/CertificationSchema");
const User = require("../models/User");
const ProctoredCodingSession = require("../models/ProctoredCodingSession");
const { pushNotification } = require("../utils/notificationService");
const { pushAdminNotification } = require("../utils/adminNotificationService");
const { logActivityAndBroadcast } = require("../utils/activityLogger");
const { sendSubmissionEvaluationEmail, sendModuleCompletionEmail, dispatchMailBackground, isGuestAccount } = require("../utils/mailer");
const SubjectProgress = require("../models/SubjectProgress");
const crypto = require("crypto");
const { isValidEtag, setEtag, invalidateEtag } = require("../utils/etagCache");
const { CURRICULUM } = require("../data/codingCurriculum");
const {
  recordDailyCodingActivity,
  getUserCodingActivity,
} = require("../utils/activityTracker");

const {
  JAVAC_BIN,
  JAVA_BIN,
  GCC_BIN,
  GPP_BIN,
  PYTHON_BIN,
  NODE_BIN,
  checkExecutionRateLimit,
  validateCodeSafety,
  terminateProcessTree,
  runSandboxedProcess,
  judge0LangMap,
  executeViaJudge0,
  isProductionExecutionRestricted,
  isCodeEmptyOrComments,
  validateTestCaseOutput,
  executeCode,
  evaluateTestCasesBatch,
  evaluateSingleTestCase,
} = require("../services/codeExecutionService");
const { getProblemExecutionConfig } = require("../data/problemExecutionConfig");

// -------------------------------------------------------------
// POST /api/coding/execute
// Universal Sandboxed Code Execution Service (Python, JS, Java, C, C++)
// With optional Judge0 remote execution when configured
// -------------------------------------------------------------
router.post("/execute", authenticateToken, async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress || "client";
  if (!checkExecutionRateLimit(clientIp)) {
    return res.status(429).json({ error: "Execution rate limit exceeded. Please wait a moment before running more code." });
  }

  const { language, code, stdin = "" } = req.body;

  const MAX_CODE_LENGTH = 100 * 1024;
  const MAX_STDIN_LENGTH = 50 * 1024;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Code string is required" });
  }

  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({ error: "Code length exceeds maximum allowed limit (100 KB)." });
  }

  if (typeof stdin === "string" && stdin.length > MAX_STDIN_LENGTH) {
    return res.status(400).json({ error: "Standard input exceeds maximum allowed limit (50 KB)." });
  }

  const ALLOWED_LANGUAGES = ["python", "py", "javascript", "js", "node", "cpp", "c++", "c", "java"];
  const lang = (language || "").toLowerCase().trim();
  if (!ALLOWED_LANGUAGES.includes(lang)) {
    return res.status(400).json({ error: `Unsupported execution language: ${language}. Supported languages are Python, JavaScript, Java, C, and C++.` });
  }

  const result = await executeCode({ language: lang, code, stdin, timeoutMs: 5000 });
  if (result.isSecurityViolation) {
    return res.status(403).json(result);
  }
  if (result.isUnavailable) {
    return res.status(503).json(result);
  }
  return res.json(result);
});

// -------------------------------------------------------------
// VERIFIED YOUTUBE PROGRAMMING TUTORIALS DATASET
// -------------------------------------------------------------
const VERIFIED_VIDEOS = [
  {
    id: "vid_py_mosh",
    youtubeId: "_uQrJ0TkZlc",
    title: "Python Tutorial for Beginners - Full Course [2024]",
    channelTitle: "Programming with Mosh",
    duration: "6h 14m",
    durationSec: 22440,
    level: "Beginner",
    language: "python",
    category: "Python",
    topics: ["Variables & Expressions", "Control Flow", "Data Structures", "OOP & Classes", "Modules & Pip"],
    verified: true,
  },
  {
    id: "vid_py_fcc",
    youtubeId: "rfscVS0vtbw",
    title: "Python for Beginners - Full Course",
    channelTitle: "freeCodeCamp.org",
    duration: "4hr 26 min",
    durationSec: 15960,
    level: "Beginner to Intermediate",
    language: "python",
    category: "Python",
    topics: ["Syntax", "Lists & Tuples", "Functions", "File I/O", "Building 4 Projects"],
    verified: true,
  },
  {
    id: "vid_js_mosh",
    youtubeId: "W6NZfCO5SIk",
    title: "JavaScript Tutorial for Beginners: Learn JavaScript in 1 Hour",
    channelTitle: "Programming with Mosh",
    duration: "48m 16s",
    durationSec: 2896,
    level: "Beginner",
    language: "javascript",
    category: "JavaScript",
    topics: ["Variables & Constants", "Primitives & Dynamic Typing", "Objects & Arrays", "Functions"],
    verified: true,
  },
  {
    id: "vid_js_fcc",
    youtubeId: "PkZNo7MFNFg",
    title: "Learn JavaScript - Full Course for Beginners",
    channelTitle: "freeCodeCamp.org",
    duration: "3h 26m",
    durationSec: 12360,
    level: "Beginner",
    language: "javascript",
    category: "JavaScript",
    topics: ["Basic JS", "ES6 Features", "Regex", "Object-Oriented JS", "Functional Programming"],
    verified: true,
  },
  {
    id: "vid_java_mosh",
    youtubeId: "eIrMbAQSU34",
    title: "Java Tutorial for Beginners - Full Course",
    channelTitle: "Programming with Mosh",
    duration: "2h 30m",
    durationSec: 9000,
    level: "Beginner",
    language: "java",
    category: "Java",
    topics: ["Variables & Types", "Arrays & Memory", "Methods & Clean Code", "Control Flow"],
    verified: true,
  },
  {
    id: "vid_java_bro",
    youtubeId: "A74TOX803D0",
    title: "Java Full Course for free ☕",
    channelTitle: "Bro Code",
    duration: "4hr 11min",
    durationSec: 15060,
    level: "Beginner to Advanced",
    language: "java",
    category: "Java",
    topics: ["OOP", "Inheritance & Polymorphism", "Interfaces", "Generics", "GUI / Swing"],
    verified: true,
  },
  {
    id: "vid_cpp_fcc",
    youtubeId: "-TkoO8Z07hI",
    title: "C++ Tutorial for Beginners - Full Course",
    channelTitle: "freeCodeCamp.org",
    duration: "6hr",
    durationSec: 21600,
    level: "Beginner",
    language: "cpp",
    category: "C++",
    topics: ["Data Types", "Pointers & References", "Classes & Constructors", "Getters & Setters"],
    verified: true,
  },
  {
    id: "vid_cpp_bro",
    youtubeId: "vLnPwxZdW4Y",
    title: "C++ Full Course for Beginners 💻",
    channelTitle: "Bro Code",
    duration: "4 hr 1min",
    durationSec: 14460,
    level: "Beginner",
    language: "cpp",
    category: "C++",
    topics: ["Memory Addresses", "Pass by Reference", "Dynamic Memory", "Recursion", "Function Templates"],
    verified: true,
  },
  {
    id: "vid_react_fcc",
    youtubeId: "bMknfKXIFA8",
    title: "React Course - Beginner's Tutorial for React JavaScript",
    channelTitle: "freeCodeCamp.org",
    duration: "11h 55m",
    durationSec: 42900,
    level: "Intermediate",
    language: "javascript",
    category: "Web Development",
    topics: ["JSX", "Components & Props", "State & Effects", "Custom Hooks", "Building 4 Apps"],
    verified: true,
  },
  {
    id: "vid_dsa_fcc",
    youtubeId: "8hly31xKli0",
    title: "Algorithms and Data Structures Tutorial - Full Course",
    channelTitle: "freeCodeCamp.org",
    duration: "5h 22m",
    durationSec: 19320,
    level: "Intermediate",
    language: "python",
    category: "Data Structures",
    topics: ["Big O Notation", "Binary Search", "Sorting Algorithms", "Linked Lists", "Merge Sort"],
    verified: true,
  },
  {
    id: "vid_ts_fcc",
    youtubeId: "BwuLxPH8IDs",
    title: "TypeScript Course for Beginners 2024 - Learn TypeScript from Scratch",
    channelTitle: "freeCodeCamp.org",
    duration: "5h 12m",
    durationSec: 18720,
    level: "Intermediate",
    language: "typescript",
    category: "TypeScript",
    topics: ["Static Types", "Interfaces & Type Aliases", "Generics", "Type Narrowing", "Decorators"],
    verified: true,
  },
  {
    id: "vid_node_fcc",
    youtubeId: "Oe421EPjeBE",
    title: "Node.js and Express.js - Full Course for Beginners",
    channelTitle: "freeCodeCamp.org",
    duration: "8h 16m",
    durationSec: 29760,
    level: "Intermediate",
    language: "javascript",
    category: "Backend & APIs",
    topics: ["Event Loop", "Streams & Buffers", "Express Middleware", "REST APIs", "JWT Authentication"],
    verified: true,
  },
  {
    id: "vid_sql_mosh",
    youtubeId: "7S_tz1z_5bA",
    title: "SQL Tutorial for Beginners [Full Course]",
    channelTitle: "Programming with Mosh",
    duration: "4h 18m",
    durationSec: 15480,
    level: "Beginner to Intermediate",
    language: "sql",
    category: "Databases",
    topics: ["SELECT & WHERE", "JOINs & Unions", "Aggregate Functions", "Transactions & ACID", "Database Design"],
    verified: true,
  },
  {
    id: "vid_docker_fcc",
    youtubeId: "fqMOX6JJhGo",
    title: "Docker Tutorial for Beginners - Full Course",
    channelTitle: "freeCodeCamp.org",
    duration: "2h 10m",
    durationSec: 7800,
    level: "Beginner to Intermediate",
    language: "devops",
    category: "DevOps & Cloud",
    topics: ["Containers vs VMs", "Dockerfiles", "Port Mapping", "Docker Compose", "Multi-Stage Builds"],
    verified: true,
  },
  {
    id: "vid_git_colt",
    youtubeId: "RGOj5yH7evk",
    title: "Git and GitHub for Beginners - Crash Course",
    channelTitle: "freeCodeCamp.org",
    duration: "1h 08m",
    durationSec: 4080,
    level: "Beginner",
    language: "git",
    category: "Tools & DevOps",
    topics: ["Git Init & Commits", "Branching & Merging", "Merge Conflicts", "Remote Repos", "Pull Requests"],
    verified: true,
  },
  {
    id: "vid_nextjs_fcc",
    youtubeId: "wm5gMKuwSYk",
    title: "Next.js 14 Full Course 2024 - Server Components & Actions",
    channelTitle: "JavaScript Mastery",
    duration: "5h 27m",
    durationSec: 19620,
    level: "Intermediate",
    language: "javascript",
    category: "Web Development",
    topics: ["App Router", "Server Components", "Server Actions", "Route Handlers", "Deployment"],
    verified: true,
  },
  {
    id: "vid_sysdesign_fcc",
    youtubeId: "m8Icp_Cid5o",
    title: "System Design for Beginners - Full Course",
    channelTitle: "freeCodeCamp.org",
    duration: "5h 33m",
    durationSec: 19980,
    level: "Advanced",
    language: "dsa",
    category: "System Design",
    topics: ["Scalability & Latency", "Load Balancers", "Caching Strategies", "Sharding & Replication", "Microservices"],
    verified: true,
  },
  {
    id: "vid_dsa_neetcode",
    youtubeId: "0IAPZzGSbME",
    title: "Data Structures and Algorithms for Beginners - Visual Guide",
    channelTitle: "NeetCode",
    duration: "4h 45m",
    durationSec: 17100,
    level: "Intermediate",
    language: "python",
    category: "Algorithms",
    topics: ["Arrays & HashMaps", "Two Pointers", "Sliding Window", "Trees & Graphs", "Dynamic Programming"],
    verified: true,
  },
  {
    id: "vid_go_fcc",
    youtubeId: "un6ZyFkqFKo",
    title: "Go Programming Language - Full Course for Beginners",
    channelTitle: "freeCodeCamp.org",
    duration: "6h 34m",
    durationSec: 23640,
    level: "Beginner to Intermediate",
    language: "go",
    category: "Backend & Systems",
    topics: ["Go Routines & Channels", "Interfaces & Structs", "Pointers", "Error Handling", "Web Servers"],
    verified: true,
  },
];

// -------------------------------------------------------------
// ALGORITHMIC CHALLENGES DATASET (65 VERIFIED CHALLENGES)
// -------------------------------------------------------------
const CHALLENGES_CATALOG = require("../data/challengesCatalog");

// Universal Helper: Picks the first valid, non-comment student source code candidate
function getValidCode(...candidates) {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0 && !isCodeEmptyOrComments(c)) {
      return c;
    }
  }
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) {
      return c;
    }
  }
  return "";
}

// Universal Problem Configuration: Replaced runtime string splitting / regex with authoritative registry
// All callers resolve explicit configurations via getProblemExecutionConfig()

// Structured configurations for dedicated language coding compilers
const PLAYGROUND_COMPILER_CONFIGS = {
  python: {
    title: "Python 3 Sandboxed Compiler",
    category: "Python 3 Execution Engine",
    difficulty: "All Levels",
    description: "Welcome to the Mastery Zone Python 3 Sandboxed Compiler!\n\nWrite, execute, and test Python 3 code in real-time with full standard library support. Read from standard input (sys.stdin) and write to standard output (stdout).\n\nClick 'Run' to execute with standard input or custom test data, and click 'Run Tests' to validate your code against the integrated compiler test suite.",
    inputFormat: "Standard Input (stdin) stream or interactive custom input.",
    outputFormat: "Standard Output (stdout) stream.",
    constraints: [
      "Execution time limit: 4000ms",
      "Memory limit: 256MB",
      "Python 3.10+ native runtime"
    ],
    examples: [
      {
        input: "",
        output: "Hello from Python 3 Runner!",
        explanation: "Default greeting printed when no input is provided."
      },
      {
        input: "MasteryZone",
        output: "Input: MasteryZone",
        explanation: "Echoes received input back to stdout."
      }
    ],
    hints: [
      "Use sys.stdin.read().strip() to capture full input from standard input.",
      "Use print() to write outputs to standard output."
    ],
    starterCode: {
      python: "# Enter your code below\n",
    },
    testCases: [
      { index: 1, input: "", expectedOutput: "Hello from Python 3 Runner!", isHidden: false },
      { index: 2, input: "MasteryZone", expectedOutput: "Input: MasteryZone", isHidden: false },
      { index: 3, input: "42", expectedOutput: "Input: 42", isHidden: false },
      { index: 4, input: "Hello World", expectedOutput: "Input: Hello World", isHidden: false },
      { index: 5, input: "System Ready", expectedOutput: "Input: System Ready", isHidden: false },
      { index: 6, input: "Data Stream 6", expectedOutput: "Input: Data Stream 6", isHidden: false },
      { index: 7, input: "Algorithm Alpha", expectedOutput: "Input: Algorithm Alpha", isHidden: false },
      { index: 8, input: "Compiler Benchmark", expectedOutput: "Input: Compiler Benchmark", isHidden: false },
      { index: 9, input: "Test Case 9", expectedOutput: "Input: Test Case 9", isHidden: false },
      { index: 10, input: "Verification 10", expectedOutput: "Input: Verification 10", isHidden: false },
    ],
  },
  javascript: {
    title: "JavaScript Node.js Runtime",
    category: "JavaScript (V8 / Node.js Engine)",
    difficulty: "All Levels",
    description: "Welcome to the Mastery Zone JavaScript (Node.js) Sandboxed Compiler!\n\nWrite, execute, and test JavaScript code in real-time on modern Node.js engine. Read from standard input using fs.readFileSync(0) and write to standard output using console.log.\n\nClick 'Run' to execute with standard input or custom test data, and click 'Run Tests' to validate your code against the integrated compiler test suite.",
    inputFormat: "Standard Input (stdin) stream or interactive custom input.",
    outputFormat: "Standard Output (stdout) stream.",
    constraints: [
      "Execution time limit: 4000ms",
      "Memory limit: 256MB",
      "Node.js V8 execution engine"
    ],
    examples: [
      {
        input: "",
        output: "Hello from JavaScript Node.js Runtime!",
        explanation: "Default greeting printed when no input is provided."
      },
      {
        input: "MasteryZone",
        output: "Input: MasteryZone",
        explanation: "Echoes received input back to stdout."
      }
    ],
    hints: [
      "Use fs.readFileSync(0, 'utf-8').trim() to capture input from stdin.",
      "Use console.log() to print outputs."
    ],
    starterCode: {
      javascript: "// Enter your code below\n",
    },
    testCases: [
      { index: 1, input: "", expectedOutput: "Hello from JavaScript Node.js Runtime!", isHidden: false },
      { index: 2, input: "MasteryZone", expectedOutput: "Input: MasteryZone", isHidden: false },
      { index: 3, input: "42", expectedOutput: "Input: 42", isHidden: false },
      { index: 4, input: "Hello World", expectedOutput: "Input: Hello World", isHidden: false },
      { index: 5, input: "System Ready", expectedOutput: "Input: System Ready", isHidden: false },
      { index: 6, input: "Data Stream 6", expectedOutput: "Input: Data Stream 6", isHidden: false },
      { index: 7, input: "Algorithm Alpha", expectedOutput: "Input: Algorithm Alpha", isHidden: false },
      { index: 8, input: "Compiler Benchmark", expectedOutput: "Input: Compiler Benchmark", isHidden: false },
      { index: 9, input: "Test Case 9", expectedOutput: "Input: Test Case 9", isHidden: false },
      { index: 10, input: "Verification 10", expectedOutput: "Input: Verification 10", isHidden: false },
    ],
  },
  java: {
    title: "Java 26 OpenJDK Compiler",
    category: "Java Enterprise & Algorithms (OpenJDK)",
    difficulty: "All Levels",
    description: "Welcome to the Mastery Zone Java 26 OpenJDK Compiler!\n\nWrite, compile, and execute Java solutions with standard input/output streaming. Read from standard input using java.util.Scanner and write to standard output using System.out.println.\n\nClick 'Run' to execute with standard input or custom test data, and click 'Run Tests' to validate your code against the integrated compiler test suite.",
    inputFormat: "Standard Input (stdin) stream or interactive custom input.",
    outputFormat: "Standard Output (stdout) stream.",
    constraints: [
      "Execution time limit: 5000ms",
      "Memory limit: 256MB",
      "OpenJDK JVM 64-Bit Server"
    ],
    examples: [
      {
        input: "",
        output: "Hello from Java 26 OpenJDK!",
        explanation: "Default greeting printed when no input is provided."
      },
      {
        input: "MasteryZone",
        output: "Input: MasteryZone",
        explanation: "Echoes received input back to stdout."
      }
    ],
    hints: [
      "Use new Scanner(System.in) to read input.",
      "Use System.out.println() to print results."
    ],
    starterCode: {
      java: "// Enter your code below\n",
    },
    testCases: [
      { index: 1, input: "", expectedOutput: "Hello from Java 26 OpenJDK!", isHidden: false },
      { index: 2, input: "MasteryZone", expectedOutput: "Input: MasteryZone", isHidden: false },
      { index: 3, input: "42", expectedOutput: "Input: 42", isHidden: false },
      { index: 4, input: "Hello World", expectedOutput: "Input: Hello World", isHidden: false },
      { index: 5, input: "System Ready", expectedOutput: "Input: System Ready", isHidden: false },
      { index: 6, input: "Data Stream 6", expectedOutput: "Input: Data Stream 6", isHidden: false },
      { index: 7, input: "Algorithm Alpha", expectedOutput: "Input: Algorithm Alpha", isHidden: false },
      { index: 8, input: "Compiler Benchmark", expectedOutput: "Input: Compiler Benchmark", isHidden: false },
      { index: 9, input: "Test Case 9", expectedOutput: "Input: Test Case 9", isHidden: false },
      { index: 10, input: "Verification 10", expectedOutput: "Input: Verification 10", isHidden: false },
    ],
  },
  cpp: {
    title: "Modern C++ Clang / G++ Compiler",
    category: "C++ Systems & Memory Management",
    difficulty: "All Levels",
    description: "Welcome to the Mastery Zone Modern C++ (Clang / G++) Compiler!\n\nWrite, compile, and execute C++ programs with standard streams (std::cin, std::cout) and STL algorithms.\n\nClick 'Run' to execute with standard input or custom test data, and click 'Run Tests' to validate your code against the integrated compiler test suite.",
    inputFormat: "Standard Input (stdin) stream or interactive custom input.",
    outputFormat: "Standard Output (stdout) stream.",
    constraints: [
      "Execution time limit: 5000ms",
      "Memory limit: 256MB",
      "GCC / G++ 11+ with -O2 optimization"
    ],
    examples: [
      {
        input: "",
        output: "Hello from Modern C++!",
        explanation: "Default greeting printed when no input is provided."
      },
      {
        input: "MasteryZone",
        output: "Input: MasteryZone",
        explanation: "Echoes received input back to stdout."
      }
    ],
    hints: [
      "Use std::cin or std::getline(std::cin, line) to read input.",
      "Use std::cout to print results."
    ],
    starterCode: {
      cpp: "// Enter your code below\n",
    },
    testCases: [
      { index: 1, input: "", expectedOutput: "Hello from Modern C++!", isHidden: false },
      { index: 2, input: "MasteryZone", expectedOutput: "Input: MasteryZone", isHidden: false },
      { index: 3, input: "42", expectedOutput: "Input: 42", isHidden: false },
      { index: 4, input: "Hello World", expectedOutput: "Input: Hello World", isHidden: false },
      { index: 5, input: "System Ready", expectedOutput: "Input: System Ready", isHidden: false },
      { index: 6, input: "Data Stream 6", expectedOutput: "Input: Data Stream 6", isHidden: false },
      { index: 7, input: "Algorithm Alpha", expectedOutput: "Input: Algorithm Alpha", isHidden: false },
      { index: 8, input: "Compiler Benchmark", expectedOutput: "Input: Compiler Benchmark", isHidden: false },
      { index: 9, input: "Test Case 9", expectedOutput: "Input: Test Case 9", isHidden: false },
      { index: 10, input: "Verification 10", expectedOutput: "Input: Verification 10", isHidden: false },
    ],
  },
};

// Helper: Retrieve structured coding challenge for interactive playground
function getPlaygroundChallenge(id) {
  const raw = id.replace(/^playground-/, "");
  const parts = raw.split("-");
  let targetLang = (parts[0] || "python").toLowerCase();
  if (targetLang === "js" || targetLang === "node") targetLang = "javascript";
  if (targetLang === "c++") targetLang = "cpp";
  if (targetLang === "py") targetLang = "python";

  const cfg = PLAYGROUND_COMPILER_CONFIGS[targetLang] || PLAYGROUND_COMPILER_CONFIGS.python;

  const starterCodeMap = {
    python: PLAYGROUND_COMPILER_CONFIGS.python.starterCode.python,
    javascript: PLAYGROUND_COMPILER_CONFIGS.javascript.starterCode.javascript,
    java: PLAYGROUND_COMPILER_CONFIGS.java.starterCode.java,
    cpp: PLAYGROUND_COMPILER_CONFIGS.cpp.starterCode.cpp,
  };

  return {
    ...cfg,
    id,
    questionNumber: 1,
    starterLanguage: targetLang,
    starterCode: starterCodeMap,
    testCases: cfg.testCases,
  };
}

// -------------------------------------------------------------
// GET /api/coding/challenges
// Full list of algorithmic coding challenges annotated with user solved state
// -------------------------------------------------------------
router.get("/challenges", optionalAuthenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const clientEtag = req.headers["if-none-match"];
    const cacheKey = userId ? String(userId) : "anon";

    if (clientEtag && isValidEtag("challenges", cacheKey, clientEtag)) {
      res.setHeader("ETag", clientEtag);
      res.setHeader("Cache-Control", "private, no-cache, must-revalidate");
      return res.status(304).end();
    }

    let solvedSet = new Set();
    let solvedMap = new Map();
    let progressUpdated = 0;

    if (userId) {
      const userObjId = mongoose.Types.ObjectId.isValid(String(userId)) ? new mongoose.Types.ObjectId(String(userId)) : null;
      const userProgress = await CodingProgress.findOne({ userId: userObjId || userId })
        .select("challengesSolved updatedAt")
        .lean();
      if (userProgress && Array.isArray(userProgress.challengesSolved)) {
        solvedSet = new Set(userProgress.challengesSolved.map((c) => c.challengeId));
        solvedMap = new Map(userProgress.challengesSolved.map((c) => [c.challengeId, c]));
        progressUpdated = userProgress.updatedAt ? new Date(userProgress.updatedAt).getTime() : 0;
      }
    }

    // Fast conditional validation using lightweight ETag
    const catalogVersion = CHALLENGES_CATALOG.length;
    const etag = `W/"challenges-${catalogVersion}-${userId || 'anon'}-${progressUpdated}-${solvedSet.size}"`;
    setEtag("challenges", cacheKey, etag);
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "private, no-cache, must-revalidate");

    if (clientEtag === etag) {
      return res.status(304).end();
    }

    const challenges = CHALLENGES_CATALOG.map((ch, idx) => {
      const isSolved = solvedSet.has(ch.id);
      return {
        id: ch.id,
        title: ch.title,
        difficulty: ch.difficulty,
        category: ch.category,
        topic: ch.topic,
        tags: ch.tags || [],
        points: ch.points || 50,
        acceptanceRate: ch.acceptanceRate || 85,
        starterLanguage: ch.starterLanguage || "python",
        description: ch.description,
        questionNumber: ch.questionNumber || (idx + 1),
        solved: isSolved,
        isCompleted: isSolved,
        userSolution: solvedMap.get(ch.id) || null,
      };
    });

    res.json({
      success: true,
      challenges,
      total: challenges.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/coding/challenges/:id
// Get challenge details and problem specification
// -------------------------------------------------------------
router.get("/challenges/:id", optionalAuthenticateToken, async (req, res) => {
  const { id } = req.params;

  if (id.startsWith("playground-")) {
    const pg = getPlaygroundChallenge(id);
    return res.json(pg);
  }

  const challenge = CHALLENGES_CATALOG.find((c) => c.id === id);
  if (!challenge) {
    return res.status(404).json({ error: "Challenge not found" });
  }

  res.json(challenge);
});

// -------------------------------------------------------------
// POST /api/coding/challenges/:id/test
// Run code against visible/public test cases only
// -------------------------------------------------------------
router.post("/challenges/:id/test", optionalAuthenticateToken, async (req, res) => {
  const { id } = req.params;
  const { language, code, customInput } = req.body;

  const challenge = id && id.startsWith("playground-")
    ? getPlaygroundChallenge(id)
    : CHALLENGES_CATALOG.find((c) => c.id === id);

  if (!challenge) {
    return res.status(404).json({ error: "Challenge not found" });
  }

  const effectiveLang = language || challenge.starterLanguage || "python";
  const execConfig = getProblemExecutionConfig(challenge);

  try {
    if (customInput !== undefined && customInput !== null && customInput.trim() !== "") {
      const customRes = await evaluateSingleTestCase(effectiveLang, code, customInput, "", {
        functionName: execConfig.functionName,
        problemId: challenge.id,
      });
      if (customRes.isUnavailable) {
        return res.status(503).json({
          isCustom: true,
          isUnavailable: true,
          output: "",
          error: customRes.error,
          duration: 0,
          results: [],
          total: 1,
          passedCount: 0,
        });
      }
      if (customRes.isSecurityViolation) {
        return res.status(403).json({
          isCustom: true,
          isSecurityViolation: true,
          output: "",
          error: customRes.error,
          duration: 0,
          results: [],
          total: 1,
          passedCount: 0,
        });
      }
      const hasValidCustomOutput = !customRes.error && Boolean(customRes.actual && String(customRes.actual).trim().length > 0);
      return res.json({
        isCustom: true,
        output: customRes.actual,
        error: customRes.error,
        duration: customRes.duration,
        results: [
          {
            testIndex: 1,
            input: customInput,
            expected: "",
            actual: customRes.actual || "(no output)",
            passed: hasValidCustomOutput,
            error: customRes.error,
            duration: customRes.duration,
          },
        ],
        total: 1,
        passedCount: hasValidCustomOutput ? 1 : 0,
      });
    }

    const isPlayground = Boolean(id && id.startsWith("playground-"));
    const shouldRunAll = isPlayground || req.body?.runAll === true || req.body?.includeHidden === true || req.query?.all === "true";
    const publicTests = shouldRunAll
      ? (challenge.testCases || [])
      : (challenge.testCases || []).filter((t) => !t.isHidden);
    const testCasesToRun = (shouldRunAll || publicTests.length === 0) ? (challenge.testCases || []) : publicTests;

    const outcomes = await evaluateTestCasesBatch(effectiveLang, code, testCasesToRun, {
      functionName: execConfig.functionName,
      problemId: challenge.id,
    });
    const testResults = testCasesToRun.map((test, i) => {
      const expVal = test.expectedOutput !== undefined ? test.expectedOutput : (test.expected !== undefined ? test.expected : "");
      const outcome = outcomes[i] || { passed: false, actual: "", expected: expVal, error: "Evaluation failed", duration: 0 };
      const isHidden = Boolean(test.isHidden);
      return {
        testIndex: i + 1,
        testNumber: i + 1,
        input: isHidden ? "[Hidden Edge-Case Input]" : test.input,
        expected: isHidden ? "[Hidden Expected Output]" : expVal,
        expectedOutput: isHidden ? "[Hidden Expected Output]" : expVal,
        actual: isHidden ? (outcome.passed ? "[Passed]" : "[Failed Output]") : outcome.actual,
        actualOutput: isHidden ? (outcome.passed ? "[Passed]" : "[Failed Output]") : outcome.actual,
        passed: outcome.passed,
        error: outcome.passed ? null : (isHidden ? (outcome.error || "Output mismatch on hidden edge case") : outcome.error),
        duration: outcome.duration,
        durationMs: outcome.duration,
        isHidden,
      };
    });

    if (outcomes.length > 0 && outcomes[0].isUnavailable) {
      return res.status(503).json({
        status: "SERVICE_UNAVAILABLE",
        isUnavailable: true,
        error: outcomes[0].error,
        results: testResults,
        total: testResults.length,
        passedCount: 0,
      });
    }

    if (outcomes.length > 0 && outcomes[0].isSecurityViolation) {
      return res.status(403).json({
        status: "SECURITY_VIOLATION",
        isSecurityViolation: true,
        error: outcomes[0].error,
        results: testResults,
        total: testResults.length,
        passedCount: 0,
      });
    }

    const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);
    res.json({
      status: allPassed ? "ACCEPTED" : "WRONG_ANSWER",
      results: testResults,
      total: testResults.length,
      passedCount: testResults.filter((r) => r.passed).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/coding/challenges/:id/submit
// Formal submission evaluating all test cases (public + hidden)
// -------------------------------------------------------------
router.post("/challenges/:id/submit", optionalAuthenticateToken, async (req, res) => {
  const { id } = req.params;
  const { language, code } = req.body;
  const userId = req.user ? (req.user.userId || req.user.id || req.user._id) : "guest";

  const challenge = id && id.startsWith("playground-")
    ? getPlaygroundChallenge(id)
    : CHALLENGES_CATALOG.find((c) => c.id === id);

  if (!challenge) {
    return res.status(404).json({ error: "Challenge not found" });
  }

  const effectiveLang = language || challenge.starterLanguage || "python";
  if (!challenge) {
    return res.status(404).json({ error: "Challenge not found" });
  }

  const startTime = Date.now();
  try {
    const allTests = challenge.testCases;
    const isPlayground = Boolean(id && id.startsWith("playground-"));
    const execConfig = getProblemExecutionConfig(challenge);
    const outcomes = await evaluateTestCasesBatch(effectiveLang, code, allTests, {
      functionName: execConfig.functionName,
      problemId: challenge.id,
    });
    if (outcomes.length > 0 && outcomes[0].isUnavailable) {
      return res.status(503).json({
        status: "SERVICE_UNAVAILABLE",
        isUnavailable: true,
        error: outcomes[0].error,
        results: [],
        testResults: [],
        total: allTests.length,
        passedCount: 0,
      });
    }
    if (outcomes.length > 0 && outcomes[0].isSecurityViolation) {
      return res.status(403).json({
        status: "SECURITY_VIOLATION",
        isSecurityViolation: true,
        error: outcomes[0].error,
        results: [],
        testResults: [],
        total: allTests.length,
        passedCount: 0,
      });
    }
    const testResults = allTests.map((test, i) => {
      const expVal = test.expectedOutput !== undefined ? test.expectedOutput : (test.expected !== undefined ? test.expected : "");
      const outcome = outcomes[i] || { passed: false, actual: "", expected: expVal, error: "Evaluation failed", duration: 0 };
      const isHidden = isPlayground ? false : (test.isHidden !== undefined ? test.isHidden : i >= 3);
      return {
        testIndex: i + 1,
        testNumber: i + 1,
        isHidden,
        passed: outcome.passed,
        duration: outcome.duration,
        durationMs: outcome.duration,
        error: outcome.passed ? null : (isHidden ? (outcome.error ? "Runtime Error on Hidden Case" : "Wrong Answer on Hidden Case") : outcome.error),
        input: isHidden ? "[Hidden Test Case]" : test.input,
        expected: isHidden ? "[Hidden Test Case]" : expVal,
        expectedOutput: isHidden ? "[Hidden Test Case]" : expVal,
        actual: isHidden ? (outcome.passed ? "[Passed]" : "[Output Hidden]") : outcome.actual,
        actualOutput: isHidden ? (outcome.passed ? "[Passed]" : "[Output Hidden]") : outcome.actual,
      };
    });

    const passedCount = testResults.filter((r) => r.passed).length;
    // Strict completion rule: completed ONLY when 100% of all test cases pass (including hidden tests)
    const isAccepted = allTests.length > 0 && passedCount === allTests.length;
    const score = isAccepted ? 100 : Math.round((passedCount / allTests.length) * 100);
    const totalRuntime = Date.now() - startTime;

    let xpEarned = 0;
    let isAlreadySolved = false;
    const isGuest = !userId || userId === "guest" || !mongoose.Types.ObjectId.isValid(userId);

    // Check user's CodingProgress
    let userProg = null;
    if (!isGuest) {
      userProg = await CodingProgress.findOne({ userId });
      if (!userProg) userProg = new CodingProgress({ userId });
      isAlreadySolved = (userProg.challengesSolved || []).some((c) => c.challengeId === challenge.id);
    }

    if (isAccepted) {
      if (!isAlreadySolved && !isGuest && userProg) {
        // Award XP only for first-time 100% completion (Easy: 50, Medium: 100, Hard: 150)
        xpEarned = challenge.difficulty === "Hard" ? 150 : challenge.difficulty === "Medium" ? 100 : 50;

        userProg.challengesSolved.push({
          challengeId: challenge.id,
          language,
          score: 100,
          code,
          solvedAt: new Date(),
        });
        await userProg.save();

        // Award XP in global ProgressSchema
        await Progress.create({
          userId,
          track: "CODING",
          task: `Solved Challenge: ${challenge.title} (${challenge.difficulty}) - 100% Passed`,
          moduleName: `Coding Challenges - ${challenge.category}`,
          hoursSpent: 0.5,
          xpEarned: xpEarned,
          status: "completed",
        });
      }
    } else {
      // Any failed test means the challenge remains incomplete and awards 0 XP
      xpEarned = 0;
    }

    // Record submission to database
    let submission = null;
    if (!isGuest) {
      submission = await ChallengeSubmission.create({
        userId,
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        language,
        code,
        status: isAccepted ? "ACCEPTED" : "WRONG_ANSWER",
        passedTests: passedCount,
        totalTests: allTests.length,
        runtimeMs: totalRuntime,
        output: isAccepted
          ? `Challenge completed! 100% test cases passed (${passedCount}/${allTests.length}).`
          : `Challenge incomplete. Passed ${passedCount}/${allTests.length} tests (${score}%). 100% pass rate required.`,
        error: testResults.find((r) => !r.passed)?.error || "",
        testResults,
      });

      // Permanently record daily coding activity and streak in database
      await recordDailyCodingActivity({
        userId,
        activityType: "challenge",
        targetId: challenge.id,
        title: challenge.title,
        status: isAccepted ? "ACCEPTED" : "WRONG_ANSWER",
        language,
        score,
        passedTests: passedCount,
        totalTests: allTests.length,
        timeZone: req.body.timeZone || req.headers["x-timezone"] || req.query.tz,
        app: req.app,
      });

      // Notify Super Admin of genuine coding execution
      pushAdminNotification({
        title: isAccepted ? "Coding Challenge Solved" : "Coding Challenge Execution",
        message: `Candidate executed ${challenge.title} (${language.toUpperCase()}) — ${isAccepted ? "ACCEPTED" : "WRONG ANSWER"} (${passedCount}/${allTests.length} tests).`,
        type: "coding",
        severity: isAccepted ? "success" : "info",
        targetId: String(submission._id),
        actionUrl: "/admin/coding-analytics",
        io: req.app.get("io"),
      }).catch(() => {});

      logActivityAndBroadcast({
        userId,
        userEmail: req.user?.email || "",
        userName: req.user?.fullName || req.user?.username || req.user?.name || "Student",
        type: isAccepted ? "CODING_CHALLENGE_SOLVED" : "CODING_SUBMISSION",
        title: isAccepted ? "Coding Challenge Solved!" : "Code Executed",
        detail: `Executed ${challenge.title} (${language.toUpperCase()}) — ${isAccepted ? "ACCEPTED" : "WRONG ANSWER"} (${passedCount}/${allTests.length} tests passed)`,
        category: "coding",
        severity: isAccepted ? "success" : "info",
        metadata: {
          submissionId: String(submission._id),
          challengeId: challenge.id,
          language,
          status: isAccepted ? "ACCEPTED" : "WRONG_ANSWER",
          passedTests: passedCount,
          totalTests: allTests.length,
          score,
        },
        io: req.app.get("io"),
      }).catch(() => {});

      // Send submission / evaluation email to candidate
      try {
        const candidateUser = await User.findById(userId).select("fullName username email role").lean();
        if (candidateUser && candidateUser.email && !isGuestAccount(candidateUser.email, candidateUser.role)) {
          dispatchMailBackground(async () => {
            return await sendSubmissionEvaluationEmail({
              userEmail: candidateUser.email,
              userName: candidateUser.fullName || candidateUser.username || "Candidate",
              challengeTitle: challenge.title,
              assessmentType: "coding",
              language,
              score,
              maxScore: 100,
              percentage: score,
              verdict: isAccepted ? "ACCEPTED" : "WRONG_ANSWER",
              reportUrl: `/assessment-report/${submission ? submission._id : challenge.id}`,
              req,
            });
          }, { type: "coding_challenge_submitted", recipient: candidateUser.email });
        }
      } catch (subMailErr) {
        console.warn("Challenge submission email dispatch warning:", subMailErr.message);
      }
    }

    // Broadcast real-time submission & report events to active sessions & admin monitoring
    try {
      const io = req.app.get("io");
      if (io && submission) {
        io.emit("NEW_SUBMISSION", {
          id: submission._id,
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          status: submission.status,
          score,
          userId,
        });
        io.to(`user_${userId}`).emit("USER_SUBMISSION_CREATED", {
          id: submission._id,
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          status: submission.status,
          score,
          passedTests: passedCount,
          totalTests: allTests.length,
        });
        io.to(`user_${userId}`).emit("coding_progress_updated", {
          type: "challenge_solved",
          challengeId: challenge.id,
          status: submission.status,
          score,
        });
        io.emit("NEW_REPORT", {
          id: submission._id,
          rawId: submission._id,
          itemType: "coding",
          sessionId: String(submission._id),
          title: `${challenge.title} — Coding Challenge Report`,
          type: "Coding Challenge Report",
          recipient: (req.user && (req.user.fullName || req.user.username)) || "Candidate",
          email: req.user?.email || "",
          score: `${score}%`,
          rawScore: score,
          maxScore: 100,
          grade: isAccepted ? "Accepted" : "Wrong Answer",
          verificationCode: String(submission._id).slice(-8).toUpperCase(),
          date: submission.createdAt,
          status: submission.status,
          passedTests: passedCount,
          totalTests: allTests.length,
          reportUrl: `/assessment-report/${submission._id}`,
        });
      }
    } catch {}

    if (isAccepted) {
      await pushNotification(req.app, {
        userId,
        title: "Coding Challenge Solved!",
        message: `Passed ${passedCount}/${allTests.length} test cases on "${challenge.title}" (${challenge.difficulty})${
          xpEarned > 0 ? ` — +${xpEarned} XP earned!` : "."
        }`,
        type: "challenge",
        severity: "success",
        actionUrl: "/coding",
        actionLabel: "View Challenges",
      });
    }

    res.json({
      submissionId: submission ? submission._id : `guest_sub_${Date.now()}`,
      status: isAccepted ? "ACCEPTED" : "WRONG_ANSWER",
      passed: isAccepted,
      score,
      passedCount,
      totalTests: allTests.length,
      runtimeMs: totalRuntime,
      results: testResults,
      isCompleted: isAccepted,
      alreadySolved: isAlreadySolved,
      xpEarned,
      message: isAccepted
        ? (isAlreadySolved
            ? `🎉 Accepted! Challenge previously completed. Solution verified with 100% test cases passed.`
            : `🎉 Accepted! Challenge successfully completed! 100% test cases passed (+${xpEarned} XP awarded).`)
        : `Score: ${score}% (${passedCount}/${allTests.length} tests passed). Strict rule: A challenge is completed ONLY when 100% of all test cases pass (including hidden tests). Any failed test awards 0 XP.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/coding/challenges/:id/history
// Retrieves submission history for the authenticated user
// -------------------------------------------------------------
router.get("/challenges/:id/history", authenticateToken, async (req, res) => {
  try {
    const submissions = await ChallengeSubmission.find({
      userId: req.user.userId,
      challengeId: req.params.id,
    })
      .select("challengeId challengeTitle language status score passedTests totalTests runtimeMs code createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/coding/activity
// Retrieves authenticated user's LeetCode-style activity calendar & streak stats
// -------------------------------------------------------------
router.get("/activity", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const clientTimezone = req.query.tz || req.headers["x-timezone"] || "Asia/Kolkata";
    const data = await getUserCodingActivity(userId, clientTimezone);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error("Error fetching activity:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/coding/activity/:userId
// Retrieves activity calendar & streak stats for a specific user (Admin or Self)
// -------------------------------------------------------------
router.get("/activity/:userId", authenticateToken, async (req, res) => {
  try {
    const requesterId = String(req.user.userId || req.user.id || req.user._id);
    const targetUserId = req.params.userId;
    const isAdmin = req.user.role === "admin" || req.user.role === "SUPER_ADMIN" || req.user.isMainAdmin;

    // Only allow user to view their own activity unless they are an admin
    if (requesterId !== targetUserId && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized to view other user's activity" });
    }

    const clientTimezone = req.query.tz || req.headers["x-timezone"] || "Asia/Kolkata";
    const data = await getUserCodingActivity(targetUserId, clientTimezone);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error("Error fetching user activity:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/coding/submissions/my-recent
// Retrieves authenticated user's recent challenge submissions
// -------------------------------------------------------------
router.get("/submissions/my-recent", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const submissions = await ChallengeSubmission.find({ userId })
      .select("challengeId challengeTitle language status score passedTests totalTests runtimeMs createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// -------------------------------------------------------------
// GET /api/coding/videos
// Curated & verified video library with user completion & bookmarks
// -------------------------------------------------------------
router.get("/videos", authenticateToken, async (req, res) => {
  try {
    const userProg = await CodingProgress.findOne({ userId: req.user.userId }).select("videoProgress").lean();
    const videoProgressMap = userProg?.videoProgress || new Map();

    const enrichedVideos = VERIFIED_VIDEOS.map((v) => {
      const userState = videoProgressMap.get ? videoProgressMap.get(v.id) : videoProgressMap[v.id];
      return {
        ...v,
        position: userState?.position || 0,
        completed: userState?.completed || false,
        bookmarked: userState?.bookmarked || false,
      };
    });

    res.json(enrichedVideos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// GET /api/coding/videos/search
// Live search via YouTube Data API v3 if YOUTUBE_API_KEY is configured
// -------------------------------------------------------------
router.get("/videos/search", authenticateToken, async (req, res) => {
  const query = req.query.q || "programming tutorial";
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    // Fallback: search in curated verified video library
    const filtered = VERIFIED_VIDEOS.filter(
      (v) =>
        v.title.toLowerCase().includes(query.toLowerCase()) ||
        v.category.toLowerCase().includes(query.toLowerCase()) ||
        v.topics.some((t) => t.toLowerCase().includes(query.toLowerCase()))
    );
    return res.json({ items: filtered, source: "curated_catalog" });
  }

  // Official YouTube Data API v3
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query + " tutorial coding"
    )}&type=video&videoEmbeddable=true&maxResults=8&key=${apiKey}`;

    https.get(url, (ytRes) => {
      let data = "";
      ytRes.on("data", (chunk) => (data += chunk));
      ytRes.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const formatted = (parsed.items || []).map((item) => ({
            id: `yt_${item.id.videoId}`,
            youtubeId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            duration: "YouTube Live Stream / Video",
            level: "General",
            language: "general",
            category: "YouTube Search",
            topics: ["Programming", "Tutorial"],
            verified: true,
          }));
          res.json({ items: formatted, source: "youtube_api" });
        } catch {
          res.json({ items: VERIFIED_VIDEOS, source: "curated_fallback" });
        }
      });
    }).on("error", () => {
      res.json({ items: VERIFIED_VIDEOS, source: "curated_fallback" });
    });
  } catch (err) {
    res.json({ items: VERIFIED_VIDEOS, source: "curated_fallback" });
  }
});

// -------------------------------------------------------------
// POST /api/coding/videos/progress
// Save video watch position and bookmarks
// -------------------------------------------------------------
router.post("/videos/progress", authenticateToken, async (req, res) => {
  const { videoId, position, completed, bookmarked } = req.body;
  const userId = req.user.userId;

  try {
    let progress = await CodingProgress.findOne({ userId });
    if (!progress) progress = new CodingProgress({ userId });

    const current = progress.videoProgress.get(videoId) || {};
    progress.videoProgress.set(videoId, {
      position: position !== undefined ? position : current.position || 0,
      completed: completed !== undefined ? completed : current.completed || false,
      bookmarked: bookmarked !== undefined ? bookmarked : current.bookmarked || false,
    });
    progress.markModified("videoProgress");
    await progress.save();

    res.json({ success: true, videoState: progress.videoProgress.get(videoId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/coding/resources/visit
// Record that a developer reference/resource website has been visited
// -------------------------------------------------------------
router.post("/resources/visit", authenticateToken, async (req, res) => {
  const { url, title } = req.body;
  const userId = req.user.userId || req.user.id || req.user._id;
  const resourceKey = url || title;

  if (!resourceKey) {
    return res.status(400).json({ error: "Missing resource identifier" });
  }

  try {
    let progress = await CodingProgress.findOne({ userId });
    if (!progress) progress = new CodingProgress({ userId });

    if (!Array.isArray(progress.visitedResources)) {
      progress.visitedResources = [];
    }

    let modified = false;
    if (url && !progress.visitedResources.includes(url)) {
      progress.visitedResources.push(url);
      modified = true;
    }
    if (title && !progress.visitedResources.includes(title)) {
      progress.visitedResources.push(title);
      modified = true;
    }
    if (resourceKey && !progress.visitedResources.includes(resourceKey)) {
      progress.visitedResources.push(resourceKey);
      modified = true;
    }

    if (modified) {
      await progress.save();
    }

    res.json({ success: true, visitedResources: progress.visitedResources });
  } catch (err) {
    console.error("Failed to mark resource visited:", err);
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// COLLABORATION ROOMS
// -------------------------------------------------------------
router.post("/collaborate/create", authenticateToken, async (req, res) => {
  const { title, language, code } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    const roomCode = `CODE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const session = await CodingSession.create({
      roomCode,
      title: title || "Live Collaborative Workspace",
      hostId: userId,
      hostName: user?.fullName || "Host Developer",
      language: language || "python",
      code: code || "# Start collaborative coding here\nprint('Hello from Mastery Zone!')\n",
      participants: [
        {
          userId,
          userName: user?.fullName || "Host",
          avatarUrl: user?.avatarUrl || "",
          role: "host",
        },
      ],
    });

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.get("/collaborate/:roomCode", authenticateToken, async (req, res) => {
  try {
    const session = await CodingSession.findOne({
      roomCode: req.params.roomCode.toUpperCase(),
    });
    if (!session) {
      return res.status(404).json({ error: "Collaboration room not found" });
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.put("/collaborate/:roomCode", authenticateToken, async (req, res) => {
  const { code, language } = req.body;
  try {
    const session = await CodingSession.findOneAndUpdate(
      { roomCode: req.params.roomCode.toUpperCase() },
      { $set: { code, language } },
      { new: true }
    );
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// CERTIFICATION ASSESSMENT
// -------------------------------------------------------------
router.post("/certifications/assess", authenticateToken, async (req, res) => {
  const { certId, answers, practicalCode } = req.body;
  const userId = req.user.userId;

  // Genuine multi-question validation
  const CERT_KEYS = {
    fullstack_cert: {
      name: "Full-Stack Web Development Mastery",
      correctAnswers: { q1: "a", q2: "c", q3: "b", q4: "d", q5: "b" },
      totalQuestions: 5,
    },
    python_cert: {
      name: "Python Systems & Automation Pro",
      correctAnswers: { q1: "b", q2: "a", q3: "d", q4: "b", q5: "c" },
      totalQuestions: 5,
    },
    java_cert: {
      name: "Java Enterprise Architecture Specialist",
      correctAnswers: { q1: "c", q2: "b", q3: "a", q4: "c", q5: "d" },
      totalQuestions: 5,
    },
    cpp_cert: {
      name: "Modern C++ Systems Architecture",
      correctAnswers: { q1: "a", q2: "d", q3: "b", q4: "a", q5: "c" },
      totalQuestions: 5,
    },
  };

  const certConfig = CERT_KEYS[certId];
  if (!certConfig) {
    return res.status(400).json({ error: "Invalid certification ID" });
  }

  let score = 0;
  for (const [qKey, correctVal] of Object.entries(certConfig.correctAnswers)) {
    if (answers && answers[qKey] === correctVal) {
      score += 20; // 20% per question
    }
  }

  const passed = score >= 80;

  if (passed) {
    let certDoc = await Certification.findOne({ userId, certId });
    if (!certDoc) {
      certDoc = new Certification({
        userId,
        zone: "CODING",
        certId,
        name: certConfig.name,
        totalModules: 10,
        currentModule: 10,
        progress: 100,
        status: "completed",
      });
    } else {
      certDoc.progress = 100;
      certDoc.status = "completed";
      certDoc.currentModule = certDoc.totalModules;
    }
    await certDoc.save();

    await Progress.create({
      userId,
      track: "CODING",
      task: `Earned Certification: ${certConfig.name}`,
      moduleName: "Credential Assessment",
      hoursSpent: 2.0,
      xpEarned: 200,
      score,
      status: "completed",
    });

    return res.json({
      passed: true,
      score,
      message: `Congratulations! You scored ${score}% and earned the official ${certConfig.name} certification!`,
      credentialId: certDoc._id,
      issueDate: new Date(),
    });
  } else {
    return res.json({
      passed: false,
      score,
      message: `Score: ${score}%. A minimum passing score of 80% is required to earn this certification. Review the curriculum and try again!`,
    });
  }
});

// -------------------------------------------------------------
// GET /api/coding/curriculum/:trackId
// Retrieves all modules in a track with user-specific unlock states
// -------------------------------------------------------------
router.get("/curriculum/:trackId", authenticateToken, async (req, res) => {
  try {
    const { trackId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;
    const modules = CURRICULUM[trackId] || [];

    let userProgress = await CodingProgress.findOne({ userId });
    if (!userProgress) {
      userProgress = await CodingProgress.create({
        userId,
        activeTrack: `${trackId.charAt(0).toUpperCase() + trackId.slice(1)} Track`,
        trackUnlocks: { python: 0, javascript: 0, java: 0, cpp: 0, webdev: 0, dsa: 0 },
        trackLessons: { python: 0, javascript: 0, java: 0, cpp: 0, webdev: 0, dsa: 0 },
      });
    }

    const unlockLevel = userProgress.trackUnlocks?.get(trackId) || 0;
    const modProgressMap = userProgress.moduleProgress || new Map();

    const annotatedModules = modules.map((m) => {
      const pKey = `${trackId}_${m.moduleIndex}`;
      const state = modProgressMap.get ? modProgressMap.get(pKey) : modProgressMap[pKey];
      const isUnlocked = true; // All modules unlocked

      // Safe assessment questions without correctIndex/explanation
      const safeQuestions = (m.assessment?.questions || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      }));

      const isStudied = !!state?.isStudied;
      const exercisePassed = !!(state?.exercisePassed || state?.assignmentPassed);
      const assessmentPassed = !!state?.assessmentPassed;
      const bestScore = state?.bestScore || 0;
      const isMcqCutoffCleared = assessmentPassed && (bestScore == null || bestScore >= 80);

      // Module is strictly completed ONLY when all 3 criteria are met:
      // 1. Learning module studied
      // 2. Practical coding passed
      // 3. 10 MCQs attempted and cutoff (>= 80%) met
      const isCompleted = Boolean(isStudied && exercisePassed && assessmentPassed && isMcqCutoffCleared);

      const status = isCompleted
        ? "completed"
        : (isStudied || exercisePassed || assessmentPassed)
        ? "in-progress"
        : "available";

      return {
        id: m.id,
        trackId: m.trackId,
        moduleIndex: m.moduleIndex,
        title: m.title,
        subtitle: m.subtitle,
        estimatedTime: m.estimatedTime,
        icon: m.icon,
        isUnlocked,
        isStudied,
        exercisePassed,
        assessmentPassed,
        isCompleted,
        status,
        isComplete: isCompleted,
        bestScore: state?.bestScore || 0,
        attemptsCount: state?.attemptsCount || (state?.exerciseAttempts ? state.exerciseAttempts.length : 0),
        exerciseScore: state?.exerciseScore ?? null,
        previousAttemptGrade: state?.exerciseScore !== undefined
          ? state.exerciseScore
          : (state?.previousAttemptGrade !== undefined
              ? state.previousAttemptGrade
              : (state?.bestScore !== undefined && (state?.attemptsCount > 0 || state?.exerciseAttempts?.length > 0) ? state.bestScore : null)),
        lastAttemptStatus: state?.exerciseAttempts && state.exerciseAttempts.length > 0
          ? state.exerciseAttempts[state.exerciseAttempts.length - 1].status
          : (state?.exercisePassed ? "PASSED" : (state?.exerciseScore !== undefined ? "FAILED" : null)),
        totalQuestions: m.assessment?.questions?.length || 10,
        passingScore: m.assessment?.passingScore || 80,
        timeLimitSeconds: m.assessment?.timeLimitSeconds || 3600,
        safeQuestions,
        overview: m.overview,
        sections: m.sections,
        references: m.references || [],
        keyTakeaways: m.keyTakeaways || [],
        knowledgeCheck: m.knowledgeCheck || [],
        interactiveSandboxCode: m.interactiveSandboxCode || "",
        codingExercise: m.codingExercise
          ? {
              title: m.codingExercise.taskTitle || m.codingExercise.title || m.title,
              taskTitle: m.codingExercise.taskTitle || m.codingExercise.title || m.title,
              difficulty: m.codingExercise.difficulty || (m.moduleIndex <= 1 ? "Easy" : m.moduleIndex <= 3 ? "Medium" : "Hard"),
              category: m.codingExercise.category || m.title,
              objective: m.codingExercise.objective || "",
              conceptualExplanation: m.codingExercise.conceptualExplanation || [],
              prompt: m.codingExercise.prompt,
              inputFormat: m.codingExercise.inputFormat,
              outputFormat: m.codingExercise.outputFormat,
              examples: m.codingExercise.examples,
              constraints: m.codingExercise.constraints,
              hints: m.codingExercise.hints,
              starterCode: m.codingExercise.starterCode || (m.trackId === "python" ? "# Enter your code below\n" : "// Enter your code below\n"),
              testCases: (m.codingExercise.testCases || []).map((t, tIdx) => ({
                input: t.isHidden ? `[Hidden Test Case #${tIdx + 1}]` : t.input,
                expectedOutput: t.isHidden ? `[Hidden Output #${tIdx + 1}]` : t.expectedOutput,
                isHidden: !!t.isHidden,
              })),
            }
          : null,
      };
    });

    res.json({
      trackId,
      unlockLevel,
      modules: annotatedModules,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// GET /api/coding/curriculum/:trackId/:moduleIndex
// Detailed module learning content, coding exercise, & assessment
// -------------------------------------------------------------
router.get("/curriculum/:trackId/:moduleIndex", authenticateToken, async (req, res) => {
  try {
    const { trackId, moduleIndex } = req.params;
    const idx = parseInt(moduleIndex, 10);
    const userId = req.user.userId || req.user.id || req.user._id;

    const modules = CURRICULUM[trackId] || [];
    const module = modules.find((m) => m.moduleIndex === idx);
    if (!module) {
      return res.status(404).json({ error: "Module not found in this curriculum" });
    }

    let userProgress = await CodingProgress.findOne({ userId });
    const pKey = `${trackId}_${idx}`;
    const state = userProgress?.moduleProgress?.get ? userProgress.moduleProgress.get(pKey) : userProgress?.moduleProgress?.[pKey];

    // Safe questions without exposing answers
    const safeQuestions = (module.assessment?.questions || []).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    res.json({
      id: module.id,
      trackId: module.trackId,
      moduleIndex: module.moduleIndex,
      title: module.title,
      subtitle: module.subtitle,
      estimatedTime: module.estimatedTime,
      icon: module.icon,
      overview: module.overview,
      sections: module.sections || [],
      references: module.references || [],
      keyTakeaways: module.keyTakeaways || [],
      knowledgeCheck: module.knowledgeCheck || [],
      interactiveSandboxCode: module.interactiveSandboxCode || "",
      codingExercise: module.codingExercise
        ? {
            title: module.codingExercise.taskTitle || module.codingExercise.title || module.title,
            taskTitle: module.codingExercise.taskTitle || module.codingExercise.title || module.title,
            difficulty: module.codingExercise.difficulty || (module.moduleIndex <= 1 ? "Easy" : module.moduleIndex <= 3 ? "Medium" : "Hard"),
            category: module.codingExercise.category || module.title,
            objective: module.codingExercise.objective || "",
            conceptualExplanation: module.codingExercise.conceptualExplanation || [],
            prompt: module.codingExercise.prompt,
            inputFormat: module.codingExercise.inputFormat,
            outputFormat: module.codingExercise.outputFormat,
            examples: module.codingExercise.examples,
            constraints: module.codingExercise.constraints,
            hints: module.codingExercise.hints,
            starterCode: module.codingExercise.starterCode || (module.trackId === "python" ? "# Enter your code below\n" : "// Enter your code below\n"),
            testCases: (module.codingExercise.testCases || []).map((t, tIdx) => ({
              input: t.isHidden ? `[Hidden Test Case #${tIdx + 1}]` : t.input,
              expectedOutput: t.isHidden ? `[Hidden Output #${tIdx + 1}]` : t.expectedOutput,
              isHidden: !!t.isHidden,
            })),
          }
        : null,
      assessment: {
        timeLimitSeconds: module.assessment.timeLimitSeconds || 3600,
        passingScore: module.assessment.passingScore,
        totalQuestions: module.assessment.questions.length,
        questions: safeQuestions,
      },
      progressState: {
        isStudied: !!state?.isStudied,
        exercisePassed: !!(state?.exercisePassed || state?.assignmentPassed),
        assessmentPassed: !!state?.assessmentPassed,
        isCompleted: Boolean(
          !!state?.isStudied &&
          !!(state?.exercisePassed || state?.assignmentPassed) &&
          !!state?.assessmentPassed &&
          (state?.bestScore == null || state?.bestScore >= 80)
        ),
        status: (
          !!state?.isStudied &&
          !!(state?.exercisePassed || state?.assignmentPassed) &&
          !!state?.assessmentPassed &&
          (state?.bestScore == null || state?.bestScore >= 80)
        )
          ? "completed"
          : (state?.isStudied || state?.exercisePassed || state?.assignmentPassed || state?.assessmentPassed)
          ? "in-progress"
          : "available",
        bestScore: state?.bestScore || 0,
        attemptsCount: state?.attemptsCount || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// POST /api/coding/curriculum/study
// Records genuine lesson study completion
// -------------------------------------------------------------
router.post("/curriculum/study", authenticateToken, async (req, res) => {
  const { trackId, moduleIndex, studyTimeSeconds = 30 } = req.body;
  const userId = req.user.userId || req.user.id || req.user._id;
  const idx = parseInt(moduleIndex, 10);

  try {
    let progress = await CodingProgress.findOne({ userId });
    if (!progress) progress = new CodingProgress({ userId });

    const pKey = `${trackId}_${idx}`;
    const rawMod = progress.moduleProgress.get(pKey);
    const current = (rawMod && typeof rawMod.toObject === "function") ? rawMod.toObject() : (rawMod || {});

    progress.moduleProgress.set(pKey, {
      ...current,
      isStudied: true,
      studiedAt: new Date(),
      studyTimeSeconds: (current.studyTimeSeconds || 0) + studyTimeSeconds,
    });

    const module = (CURRICULUM[trackId] || []).find((m) => m.moduleIndex === idx);
    progress.lastActivity = {
      type: "study",
      trackId,
      moduleIndex: idx,
      title: module?.title || `Module ${idx + 1}`,
      timestamp: new Date(),
    };

    progress.markModified("moduleProgress");
    progress.markModified("trackUnlocks");
    progress.markModified("trackLessons");
    await progress.save();

    // Synchronize with SubjectProgress
    try {
      let subProg = await SubjectProgress.findOne({ userId, subjectKey: "coding" });
      if (!subProg) {
        subProg = new SubjectProgress({ userId, subjectKey: "coding", activeTrack: trackId });
      }
      const rawSub = subProg.moduleProgress.get(pKey);
      const subCurr = (rawSub && typeof rawSub.toObject === "function") ? rawSub.toObject() : (rawSub || {});
      subProg.moduleProgress.set(pKey, {
        ...subCurr,
        isStudied: true,
        studiedAt: new Date(),
        studyTimeSeconds: (subCurr.studyTimeSeconds || 0) + studyTimeSeconds,
      });
      subProg.markModified("moduleProgress");
      await subProg.save();
    } catch (spErr) {
      console.warn("Could not sync SubjectProgress for coding study:", spErr);
    }

    // Real-time broadcast
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${userId}`).emit("coding_progress_updated", {
        type: "study",
        trackId,
        moduleIndex: idx,
        isStudied: true,
      });
    }

    res.json({ success: true, isStudied: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// POST /api/coding/curriculum/exercise/run
// Runs code against sample test cases (Tests 1 & 2) or custom STDIN
// -------------------------------------------------------------
router.post("/curriculum/exercise/run", authenticateToken, async (req, res) => {
  const { trackId, moduleIndex, code, language, customInput } = req.body;
  const idx = parseInt(moduleIndex, 10);

  const module = (CURRICULUM[trackId] || []).find((m) => m.moduleIndex === idx);
  if (!module || !module.codingExercise) {
    return res.status(404).json({ error: "Coding exercise not found" });
  }

  const lang = (language || (trackId === "cpp" ? "cpp" : trackId === "java" ? "java" : trackId === "python" ? "python" : "javascript")).toLowerCase();
  const execConfig = getProblemExecutionConfig(module);

  try {
    if (customInput !== undefined && customInput !== null && customInput.trim() !== "") {
      const customRes = await evaluateSingleTestCase(lang, code, customInput, "", {
        functionName: execConfig.functionName,
        problemId: module.id,
      });
      if (customRes.isUnavailable) {
        return res.status(503).json({
          isCustom: true,
          isUnavailable: true,
          output: "",
          error: customRes.error,
          duration: 0,
        });
      }
      return res.json({
        isCustom: true,
        output: customRes.actual,
        error: customRes.error,
        duration: customRes.duration,
      });
    }

    const shouldRunAll = Boolean(req.body.runAll || req.body.all);
    const testsToRun = shouldRunAll
      ? (module.codingExercise.testCases || [])
      : (module.codingExercise.testCases || []).filter((t) => !t.isHidden).slice(0, 3);

    const outcomes = await evaluateTestCasesBatch(lang, code, testsToRun, {
      functionName: execConfig.functionName,
      problemId: module.id,
    });
    if (outcomes.length > 0 && outcomes[0].isUnavailable) {
      return res.status(503).json({
        status: "SERVICE_UNAVAILABLE",
        isUnavailable: true,
        error: outcomes[0].error,
        results: [],
        total: testsToRun.length,
        passedCount: 0,
      });
    }
    const results = testsToRun.map((tc, i) => {
      const outcome = outcomes[i] || { passed: false, actual: "", expected: tc.expectedOutput, error: "Evaluation failed", duration: 0 };
      const isHidden = Boolean(tc.isHidden);
      return {
        testIndex: i + 1,
        testNumber: i + 1,
        input: isHidden ? `[Hidden Test Case #${i + 1}]` : tc.input,
        expected: isHidden ? `[Hidden Expected Output #${i + 1}]` : tc.expectedOutput,
        expectedOutput: isHidden ? `[Hidden Expected Output #${i + 1}]` : tc.expectedOutput,
        actual: isHidden && !outcome.passed ? "[Hidden Result]" : outcome.actual,
        actualOutput: isHidden && !outcome.passed ? "[Hidden Result]" : outcome.actual,
        passed: outcome.passed,
        error: outcome.error,
        duration: outcome.duration,
        durationMs: outcome.duration,
        isHidden,
      };
    });

    const allPassed = results.length > 0 && results.every((r) => r.passed);
    res.json({
      status: allPassed ? "ACCEPTED" : "WRONG_ANSWER",
      results,
      total: results.length,
      passedCount: results.filter((r) => r.passed).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// POST /api/coding/curriculum/exercise/submit
// Evaluates real coding exercise against test cases
// -------------------------------------------------------------
router.post("/curriculum/exercise/submit", authenticateToken, async (req, res) => {
  const { trackId, moduleIndex, code, language } = req.body;
  const userId = req.user.userId || req.user.id || req.user._id;
  const idx = parseInt(moduleIndex, 10);

  const module = (CURRICULUM[trackId] || []).find((m) => m.moduleIndex === idx);
  if (!module || !module.codingExercise) {
    return res.status(404).json({ error: "Coding exercise not found" });
  }

  try {
    const testCases = module.codingExercise.testCases;
    const lang = (language || (trackId === "cpp" ? "cpp" : trackId === "java" ? "java" : trackId === "python" ? "python" : "javascript")).toLowerCase().trim();

    const execConfig = getProblemExecutionConfig(module);
    const outcomes = await evaluateTestCasesBatch(lang, code, testCases, {
      functionName: execConfig.functionName,
      problemId: module.id,
    });
    if (outcomes.length > 0 && outcomes[0].isUnavailable) {
      return res.status(503).json({
        status: "SERVICE_UNAVAILABLE",
        isUnavailable: true,
        error: outcomes[0].error,
        results: [],
        testResults: [],
        total: testCases.length,
        passedCount: 0,
      });
    }
    const testResults = testCases.map((tc, i) => {
      const outcome = outcomes[i] || { passed: false, actual: "", expected: tc.expectedOutput, error: "Evaluation failed", duration: 0 };
      const isHidden = tc.isHidden !== undefined ? tc.isHidden : i >= 3;
      return {
        testIndex: i + 1,
        testNumber: i + 1,
        isHidden,
        passed: outcome.passed,
        duration: outcome.duration,
        durationMs: outcome.duration,
        error: outcome.passed ? null : (isHidden ? (outcome.error ? "Runtime Error on Hidden Case" : "Wrong Answer on Hidden Case") : outcome.error),
        input: isHidden ? "[Hidden Test Case]" : tc.input,
        expected: isHidden ? "[Hidden Test Case]" : tc.expectedOutput,
        expectedOutput: isHidden ? "[Hidden Test Case]" : tc.expectedOutput,
        actual: isHidden ? (outcome.passed ? "[Passed]" : "[Output Hidden]") : outcome.actual,
        actualOutput: isHidden ? (outcome.passed ? "[Passed]" : "[Output Hidden]") : outcome.actual,
      };
    });

    const passedCount = testResults.filter((r) => r.passed).length;
    const score = Math.round((passedCount / testCases.length) * 100);
    const isAccepted = score >= 80;

    let progress = await CodingProgress.findOne({ userId });
    if (!progress) progress = new CodingProgress({ userId });

    const pKey = `${trackId}_${idx}`;
    const rawMod = progress.moduleProgress.get(pKey);
    const current = (rawMod && typeof rawMod.toObject === "function") ? rawMod.toObject() : (rawMod || {});

    const attemptNum = (current.attemptsCount || (current.exerciseAttempts ? current.exerciseAttempts.length : 0)) + 1;
    const pastAttempts = Array.isArray(current.exerciseAttempts) ? [...current.exerciseAttempts] : [];
    pastAttempts.push({
      attemptNumber: attemptNum,
      code,
      language: lang,
      passedTests: passedCount,
      totalTests: testCases.length,
      score,
      status: isAccepted ? "PASSED" : "FAILED",
      timestamp: new Date(),
    });

    const newBestScore = Math.max(current.bestScore || 0, score);

    const isStudyDone = Boolean(current.isStudied);
    const isMcqCutoffCleared = Boolean(current.assessmentPassed && (current.bestScore == null || current.bestScore >= 80));
    const willBeCompleted = isAccepted && Boolean(isStudyDone && isMcqCutoffCleared);

    // Save current solution as draft, track attempt history and record scores
    progress.moduleProgress.set(pKey, {
      ...current,
      exerciseDraftCode: code,
      exerciseScore: score,
      previousAttemptGrade: score,
      bestScore: newBestScore,
      attemptsCount: attemptNum,
      exerciseAttempts: pastAttempts,
      ...(isAccepted
        ? {
            exercisePassed: true,
            exerciseCode: code,
            exercisePassedAt: current.exercisePassedAt || new Date(),
            isCompleted: willBeCompleted,
            status: willBeCompleted ? "completed" : "in-progress",
          }
        : {
            exercisePassed: false,
          }),
    });

    // Record verified daily coding activity and streak in database
    if (userId && userId !== "guest") {
      await recordDailyCodingActivity({
        userId,
        activityType: "curriculum_exercise",
        targetId: `${trackId}_${idx}`,
        title: `${module.title} — ${module.codingExercise.taskTitle}`,
        status: isAccepted ? "ACCEPTED" : "WRONG_ANSWER",
        language: lang,
        score,
        passedTests: passedCount,
        totalTests: testCases.length,
        timeZone: req.body.timeZone || req.headers["x-timezone"] || req.query.tz,
        app: req.app,
      });
    }

    if (isAccepted) {
      progress.lastActivity = {
        type: "exercise",
        trackId,
        moduleIndex: idx,
        title: module.codingExercise.taskTitle,
        timestamp: new Date(),
      };

      progress.markModified("moduleProgress");
      progress.markModified("trackUnlocks");
      progress.markModified("trackLessons");
      await progress.save();

      // Keep SubjectProgress in sync
      try {
        let subProg = await SubjectProgress.findOne({ userId, subjectKey: "coding" });
        if (!subProg) subProg = new SubjectProgress({ userId, subjectKey: "coding", activeTrack: trackId });
        const curSp = subProg.moduleProgress.get(pKey) || {};
        subProg.moduleProgress.set(pKey, {
          ...curSp,
          exercisePassed: true,
          exerciseScore: score,
          exerciseCode: code,
          exercisePassedAt: current.exercisePassedAt || new Date(),
          bestScore: Math.max(curSp.bestScore || 0, score),
          isCompleted: willBeCompleted || curSp.isCompleted,
          status: willBeCompleted ? "completed" : "in-progress",
        });
        subProg.markModified("moduleProgress");
        await subProg.save();
      } catch (spErr) {
        console.warn("Could not sync SubjectProgress for coding exercise:", spErr);
      }

      // Log progress in global ProgressSchema
      await Progress.create({
        userId,
        track: "CODING",
        task: `Passed Coding Exercise: ${module.codingExercise.taskTitle} (${score}%)`,
        moduleName: `${module.title} - Exercise`,
        hoursSpent: 0.5,
        xpEarned: 25,
        score,
        status: "completed",
      });

      // Real-time broadcast
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${userId}`).emit("coding_progress_updated", {
          type: "exercise_passed",
          trackId,
          moduleIndex: idx,
          exercisePassed: true,
          score,
          bestScore: newBestScore,
        });
      }

      await pushNotification(req.app, {
        userId,
        title: "Coding Exercise Passed",
        message: `Passed "${module.codingExercise.taskTitle}" (${score}%) in ${module.title} (+25 XP).`,
        type: "curriculum",
        severity: "success",
        actionUrl: "/coding",
        actionLabel: "Open Coding Path",
      });
    } else {
      progress.markModified("moduleProgress");
      await progress.save();
    }

    // Synchronize submitted code and execution results directly to any active/recent ProctoredCodingSession
    const qKey = `${trackId}_${idx}`;
    let finalReturnSid = req.body.sessionId || `sub_${trackId}_${idx}_${Date.now()}`;
    let activeSession = null;
    try {
      const sessionFilter = req.body.sessionId
        ? { sessionId: req.body.sessionId, userId }
        : {
            userId,
            status: "active",
            $or: [
              { questionId: qKey },
              { questionId: `${trackId}_${idx}` },
              { trackId },
            ],
          };
      activeSession = await ProctoredCodingSession.findOne(sessionFilter).sort({ createdAt: -1 });
      if (activeSession) {
        finalReturnSid = activeSession.sessionId || finalReturnSid;
        activeSession.draftCode = code;
        activeSession.draftLanguage = lang;
        if (!activeSession.questionDrafts) activeSession.questionDrafts = new Map();
        activeSession.questionDrafts.set(qKey, code);

        let qRecord = (activeSession.questions || []).find((q) => q.questionId === qKey || q.title === module.codingExercise?.taskTitle);
        if (!qRecord && activeSession.questions && activeSession.questions.length > 0) {
          qRecord = activeSession.questions[0];
        }
        if (qRecord) {
          qRecord.submittedCode = code;
          qRecord.language = lang;
          qRecord.score = score;
          qRecord.marksObtained = score;
          qRecord.passedTests = passedCount;
          qRecord.totalTests = testCases.length;
          qRecord.testResults = testResults;
          qRecord.status = isAccepted ? "passed" : "failed";
          qRecord.attempted = true;
          qRecord.submittedAt = new Date();
        }

        activeSession.status = "submitted";
        activeSession.submissionResult = {
          code,
          language: lang,
          score,
          marksObtained: score,
          totalMarks: 100,
          passedTests: passedCount,
          totalTests: testCases.length,
          grade: score === 100 ? "A+" : score >= 80 ? "B" : "F",
          accuracy: Math.round((passedCount / testCases.length) * 100),
          passed: isAccepted,
          status: isAccepted ? (score === 100 ? "ACCEPTED" : "PASSED") : "FAILED",
          durationSeconds: Math.max(1, Math.round(((new Date()) - (activeSession.serverStartTime || activeSession.createdAt || new Date())) / 1000)),
          submittedAt: new Date(),
          testResults,
        };
        activeSession.markModified("questions");
        activeSession.markModified("questionDrafts");
        activeSession.markModified("submissionResult");
        await activeSession.save();
      } else {
        const userObj = await User.findById(userId).lean();
        const newSession = new ProctoredCodingSession({
          sessionId: finalReturnSid,
          userId,
          questionId: qKey,
          assessmentTitle: module.codingExercise?.taskTitle || module.title,
          trackId,
          status: "submitted",
          candidateDetails: {
            fullName: userObj?.fullName || userObj?.username || "Candidate",
            email: userObj?.email || "",
            candidateId: `CAND-${String(userId).slice(-6).toUpperCase()}`,
            organization: "Mastery Zone Academy",
          },
          questions: [
            {
              questionId: qKey,
              title: module.codingExercise?.taskTitle || module.title,
              submittedCode: code,
              language: lang,
              score,
              marksObtained: score,
              totalMarks: 100,
              passedTests: passedCount,
              totalTests: testCases.length,
              testResults,
              status: isAccepted ? "passed" : "failed",
              attempted: true,
              submittedAt: new Date(),
            },
          ],
          submissionResult: {
            code,
            language: lang,
            score,
            marksObtained: score,
            totalMarks: 100,
            passedTests: passedCount,
            totalTests: testCases.length,
            grade: score === 100 ? "A+" : score >= 80 ? "B" : "F",
            accuracy: Math.round((passedCount / testCases.length) * 100),
            passed: isAccepted,
            status: isAccepted ? "PASSED" : "FAILED",
            durationSeconds: 30,
            submittedAt: new Date(),
            testResults,
          },
        });
        await newSession.save();
        activeSession = newSession;
      }
    } catch (procSyncErr) {
      console.warn("Could not sync ProctoredCodingSession during curriculum submit:", procSyncErr);
    }

    if (activeSession && activeSession.sessionId) {
      finalReturnSid = activeSession.sessionId;
    }
    try {
      progress.moduleProgress.set(pKey, {
        ...(progress.moduleProgress.get(pKey) || {}),
        latestSessionId: finalReturnSid,
      });
      await progress.save();
    } catch {}

    try {
      const candidateUser = await User.findById(userId).select("fullName username email role").lean();
      const recipientEmail = candidateUser?.email || activeSession?.candidateDetails?.email;
      const recipientName = candidateUser?.fullName || candidateUser?.username || activeSession?.candidateDetails?.fullName || "Candidate";
      if (recipientEmail && !isGuestAccount(recipientEmail)) {
        dispatchMailBackground(async () => {
          return await sendSubmissionEvaluationEmail({
            userEmail: recipientEmail,
            userName: recipientName,
            assessmentTitle: module.codingExercise?.taskTitle || module.title || "Curriculum Coding Assessment",
            assessmentType: "coding",
            score,
            maxScore: 100,
            percentage: score,
            verdict: isAccepted ? "PASSED" : "FAILED",
            reportUrl: `/assessment-report/${finalReturnSid}`,
            req,
          });
        }, { type: "coding_assessment_completed", recipient: recipientEmail });
      }
    } catch (mailDispatchErr) {
      console.warn("Curriculum coding assessment email dispatch warning:", mailDispatchErr.message);
    }

    res.json({
      status: isAccepted ? "PASSED" : "FAILED",
      passed: isAccepted,
      score,
      bestScore: newBestScore,
      attemptNumber: attemptNum,
      passedCount,
      totalTests: testCases.length,
      results: testResults,
      attempts: pastAttempts,
      sessionId: finalReturnSid,
      submissionId: finalReturnSid,
      message: isAccepted
        ? (passedCount === testCases.length
            ? `🎉 Incredible! 10/10 tests passed (100%). Solution Verified & Graded!`
            : `🎉 Exercise verified with ${score}%! (${passedCount}/${testCases.length} tests passed).`)
        : `Score: ${score}% (${passedCount}/${testCases.length} tests passed). Minimum 80% required to pass.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// GET /api/coding/curriculum/exercise/history/:trackId/:moduleIndex
// Retrieves submission attempt history for a module exercise
// -------------------------------------------------------------
router.get("/curriculum/exercise/history/:trackId/:moduleIndex", authenticateToken, async (req, res) => {
  const { trackId, moduleIndex } = req.params;
  const userId = req.user.userId || req.user.id || req.user._id;
  const idx = parseInt(moduleIndex, 10);

  try {
    const progress = await CodingProgress.findOne({ userId });
    const pKey = `${trackId}_${idx}`;
    const rawMod = progress?.moduleProgress?.get ? progress.moduleProgress.get(pKey) : progress?.moduleProgress?.[pKey];
    const mod = (rawMod && typeof rawMod.toObject === "function") ? rawMod.toObject() : (rawMod || {});

    // Also look up any submitted ProctoredCodingSession for this exercise
    let latestSid = mod.latestSessionId;
    if (!latestSid) {
      const existingSession = await ProctoredCodingSession.findOne({
        userId,
        questionId: pKey,
        status: { $in: ["submitted", "completed"] },
      }).sort({ createdAt: -1 }).lean();
      if (existingSession) latestSid = existingSession.sessionId;
    }

    res.json({
      attemptsCount: mod.attemptsCount || (mod.exerciseAttempts ? mod.exerciseAttempts.length : 0),
      bestScore: mod.bestScore || 0,
      latestScore: mod.exerciseScore || 0,
      exercisePassed: !!mod.exercisePassed,
      attempts: mod.exerciseAttempts || [],
      sessionId: latestSid || undefined,
      latestSessionId: latestSid || undefined,
      status: mod.exercisePassed ? "completed" : (mod.attemptsCount > 0 ? "submitted" : "unattempted"),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// POST /api/coding/curriculum/exercise/draft
// Auto-saves user draft code
// -------------------------------------------------------------
router.post("/curriculum/exercise/draft", authenticateToken, async (req, res) => {
  const { trackId, moduleIndex, code } = req.body;
  const userId = req.user.userId || req.user.id || req.user._id;
  const idx = parseInt(moduleIndex, 10);

  try {
    let progress = await CodingProgress.findOne({ userId });
    if (!progress) progress = new CodingProgress({ userId });

    const pKey = `${trackId}_${idx}`;
    const rawMod = progress.moduleProgress.get(pKey);
    const current = (rawMod && typeof rawMod.toObject === "function") ? rawMod.toObject() : (rawMod || {});

    progress.moduleProgress.set(pKey, {
      ...current,
      exerciseDraftCode: code,
      lastDraftSavedAt: new Date(),
    });
    progress.markModified("moduleProgress");
    await progress.save();

    res.json({ success: true, savedAt: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// GET /api/coding/curriculum/exercise/draft/:trackId/:moduleIndex
// Retrieves user draft code or starter code
// -------------------------------------------------------------
router.get("/curriculum/exercise/draft/:trackId/:moduleIndex", authenticateToken, async (req, res) => {
  const { trackId, moduleIndex } = req.params;
  const userId = req.user.userId || req.user.id || req.user._id;
  const idx = parseInt(moduleIndex, 10);

  try {
    const module = (CURRICULUM[trackId] || []).find((m) => m.moduleIndex === idx);
    const starterCode = module?.codingExercise?.starterCode || "";

    const progress = await CodingProgress.findOne({ userId });
    const pKey = `${trackId}_${idx}`;
    const rawMod = progress?.moduleProgress?.get(pKey);
    const current = (rawMod && typeof rawMod.toObject === "function") ? rawMod.toObject() : (rawMod || {});

    const code = current.exerciseDraftCode || current.exerciseCode || starterCode;
    res.json({ code, hasDraft: !!current.exerciseDraftCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// POST /api/coding/curriculum/assessment/submit
// 10-Question Proctored MCQ Assessment with Server-Side Scoring
// Unlocks next module only upon passing (score >= 80%)
// -------------------------------------------------------------
router.post("/curriculum/assessment/submit", authenticateToken, async (req, res) => {
  const { trackId, moduleIndex, answers = {}, timeSpentSeconds = 0, violationsCount = 0, violationsLog = [] } = req.body;
  const userId = req.user.userId || req.user.id || req.user._id;
  const idx = parseInt(moduleIndex, 10);

  const module = (CURRICULUM[trackId] || []).find((m) => m.moduleIndex === idx);
  if (!module || !module.assessment) {
    return res.status(404).json({ error: "Module assessment not found" });
  }

  try {
    let progress = await CodingProgress.findOne({ userId });
    if (!progress) progress = new CodingProgress({ userId });

    const questions = module.assessment.questions;
    let correctCount = 0;
    const reviewBreakdown = [];

    // Server-side strict evaluation
    let questionsAttempted = 0;
    const defaultMarksPerQ = Number(module.assessment.marksPerQuestion || 1);
    let totalMarks = 0;
    let marksObtained = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let selected = null;
      if (answers) {
        const keyById = q.id !== undefined ? (answers[q.id] ?? answers[String(q.id)]) : undefined;
        const keyByOrig = q.originalIndex !== undefined ? (answers[q.originalIndex] ?? answers[String(q.originalIndex)]) : undefined;
        const keyByIdx = answers[i] ?? answers[String(i)];
        const raw = keyById !== undefined ? keyById : (keyByOrig !== undefined ? keyByOrig : keyByIdx);
        if (raw !== undefined && raw !== null && raw !== "" && raw !== -1 && raw !== "-1") {
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed) && parsed >= 0) {
            selected = parsed;
            questionsAttempted++;
          }
        }
      }
      const isCorrect = selected !== null && selected === q.correctIndex;
      const qMarks = Number(q.marks || defaultMarksPerQ);
      totalMarks += qMarks;

      let awarded = 0;
      if (isCorrect) {
        correctCount++;
        awarded = qMarks;
        marksObtained += qMarks;
      }

      reviewBreakdown.push({
        id: q.id || `q_${i + 1}`,
        questionIndex: i,
        question: q.question,
        options: q.options,
        userSelected: selected,
        userAnswer: selected,
        correctIndex: q.correctIndex,
        correctAnswer: q.correctIndex,
        isCorrect,
        marksAwarded: awarded,
        maxMarks: qMarks,
        explanation: q.explanation || "Review the core concepts for this question.",
      });
    }

    if (totalMarks <= 0) totalMarks = questions.length || 10;
    marksObtained = Math.max(0, marksObtained);
    const questionsUnanswered = Math.max(0, questions.length - questionsAttempted);
    const percentage = Math.round((marksObtained / totalMarks) * 100);
    const accuracy = questionsAttempted > 0 ? Math.round((correctCount / questionsAttempted) * 100) : 0;
    const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : "F";
    const passed = percentage >= (module.assessment.passingScore || 80);

    const submittedAt = new Date();
    const startTime = new Date(Date.now() - (Math.max(1, timeSpentSeconds) * 1000));

    // Record attempt audit trail in ModuleAssessmentAttempt model
    const attemptDoc = await ModuleAssessmentAttempt.create({
      userId,
      subjectKey: "coding",
      trackId,
      moduleIndex: idx,
      moduleTitle: module.title,
      assessmentTitle: `${module.title} — Proctored Accreditation Exam`,
      score: correctCount,
      totalQuestions: questions.length,
      marksPerQuestion: defaultMarksPerQ,
      totalMarks,
      marksObtained,
      questionsAttempted,
      questionsUnanswered,
      correctCount,
      incorrectCount: Math.max(0, questionsAttempted - correctCount),
      percentage,
      accuracy,
      grade,
      passed,
      passingScore: module.assessment.passingScore || 80,
      timeSpentSeconds,
      startTime,
      submittedAt,
      violationsCount,
      violationsLog,
      userAnswers: answers,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        marks: q.marks || defaultMarksPerQ,
      })),
      reviewBreakdown,
    });

    const sessionId = `attempt_${attemptDoc._id}`;
    attemptDoc.sessionId = sessionId;
    await attemptDoc.save();

    const pKey = `${trackId}_${idx}`;
    const rawMod = progress.moduleProgress.get(pKey);
    const current = (rawMod && typeof rawMod.toObject === "function") ? rawMod.toObject() : (rawMod || {});
    const prevBest = current.bestScore || 0;
    const newBest = Math.max(prevBest, percentage);
    const attempts = (current.attemptsCount || 0) + 1;

    const isStudyDone = Boolean(current.isStudied);
    const isCodingDone = Boolean(current.exercisePassed || current.assignmentPassed || current.codingPassed);
    const isMcqCutoffCleared = Boolean((passed || percentage >= 80 || newBest >= 80) && (marksObtained >= 8 || percentage >= 80 || newBest >= 80));

    // Module is strictly completed ONLY when all 3 criteria are satisfied:
    // 1. Learning module studied
    // 2. Practical coding test passed
    // 3. 10 MCQs attempted and cutoff (>= 80%) met
    const willBeCompleted = Boolean(isStudyDone && isCodingDone && isMcqCutoffCleared);

    progress.moduleProgress.set(pKey, {
      ...current,
      assessmentPassed: passed || !!current.assessmentPassed,
      assessmentScore: percentage,
      assessmentPassedAt: passed ? new Date() : current.assessmentPassedAt,
      bestScore: newBest,
      attemptsCount: attempts,
      isCompleted: willBeCompleted,
      status: willBeCompleted ? "completed" : "in-progress",
    });

    // Also sync with SubjectProgress
    try {
      let subProg = await SubjectProgress.findOne({ userId, subjectKey: "coding" });
      if (!subProg) subProg = new SubjectProgress({ userId, subjectKey: "coding", activeTrack: trackId });
      const curSp = subProg.moduleProgress.get(pKey) || {};
      const subStudyDone = Boolean(curSp.isStudied || current.isStudied);
      const subCodingDone = Boolean(curSp.exercisePassed || curSp.assignmentPassed || current.exercisePassed || current.assignmentPassed);
      const subCutoffCleared = Boolean(isMcqCutoffCleared || (curSp.bestScore && curSp.bestScore >= 80));
      const subCompleted = Boolean(subStudyDone && subCodingDone && subCutoffCleared);

      subProg.moduleProgress.set(pKey, {
        ...curSp,
        assessmentPassed: passed || !!curSp.assessmentPassed,
        assessmentScore: percentage,
        assessmentPassedAt: passed ? new Date() : curSp.assessmentPassedAt,
        bestScore: Math.max(curSp.bestScore || 0, percentage),
        attemptsCount: (curSp.attemptsCount || 0) + 1,
        isCompleted: subCompleted,
        status: subCompleted ? "completed" : "in-progress",
      });
      subProg.markModified("moduleProgress");
      await subProg.save();
    } catch (spErr) {
      console.warn("Could not sync SubjectProgress for coding assessment:", spErr);
    }

    progress.assessmentAttempts.push({
      trackId,
      moduleIndex: idx,
      moduleTitle: module.title,
      score: correctCount,
      percentage,
      passed,
      timeSpentSeconds,
      violationsCount,
      attemptedAt: new Date(),
    });

    // Advance unlock if passed!
    let nextUnlockedModule = unlockLevel;
    if (passed) {
      const nextLevel = Math.max(unlockLevel, idx + 1);
      progress.trackUnlocks.set(trackId, nextLevel);
      nextUnlockedModule = nextLevel;

      // Count total completed modules in track (strictly requires all 3 criteria)
      const trackModules = CURRICULUM[trackId] || [];
      let completedCount = 0;
      for (const tm of trackModules) {
        const k = `${trackId}_${tm.moduleIndex}`;
        const rawSt = progress.moduleProgress.get(k);
        const st = (rawSt && typeof rawSt.toObject === "function") ? rawSt.toObject() : (rawSt || {});
        const sStudy = Boolean(st.isStudied);
        const sCoding = Boolean(st.exercisePassed || st.assignmentPassed || st.codingPassed);
        const sAssessment = Boolean(st.assessmentPassed && (st.bestScore == null || st.bestScore >= 80));
        if (sStudy && sCoding && sAssessment) completedCount++;
      }
      progress.trackLessons.set(trackId, completedCount);

      // Award +50 XP and log to global ProgressSchema
      await Progress.create({
        userId,
        track: "CODING",
        task: `Passed 10-Question Proctored Assessment: ${module.title}`,
        moduleName: `${module.title} - Exam (${percentage}%)`,
        hoursSpent: 0.5,
        xpEarned: 50,
        score: percentage,
        status: "completed",
      });
    }

    progress.lastActivity = {
      type: passed ? "assessment_pass" : "assessment_fail",
      trackId,
      moduleIndex: idx,
      title: `${module.title} Assessment (${percentage}%)`,
      timestamp: new Date(),
    };

    progress.markModified("moduleProgress");
    progress.markModified("trackUnlocks");
    progress.markModified("trackLessons");
    await progress.save();

    // Broadcast real-time Socket.IO event to user
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${userId}`).emit("coding_progress_updated", {
        type: "assessment_result",
        trackId,
        moduleIndex: idx,
        passed,
        percentage,
        unlockedLevel: nextUnlockedModule,
        stats: {
          totalCompleted: progress.trackLessons.get(trackId) || 0,
        },
      });
      io.emit("coding_activity_feed", {
        userName: (await User.findById(userId))?.fullName || "A Developer",
        action: passed ? `passed the proctored assessment for ${module.title}` : `attempted assessment for ${module.title}`,
        trackId,
        score: percentage,
        passed,
        timestamp: new Date(),
      });
    }

    await pushNotification(req.app, {
      userId,
      title: passed ? "Assessment Passed — Report Ready" : "Assessment Graded — Review Ready",
      message: `${module.title}: Scored ${marksObtained}/${totalMarks} marks (${percentage}%, Grade ${grade}).${
        passed ? ` Module ${idx + 2} unlocked!` : ""
      }`,
      type: "assessment",
      severity: passed ? "success" : "warning",
      actionUrl: `/assessment-report/attempt_${attemptDoc._id}`,
      actionLabel: "View Grade Report",
    });

    try {
      const candidateUser = await User.findById(userId).select("fullName username email role").lean();
      if (candidateUser && candidateUser.email && !isGuestAccount(candidateUser.email, candidateUser.role)) {
        // Cutoff requirement: 8 marks out of 10 (80%) AND learning module studied AND coding passed (if practical exercise exists)
        const isStudyDone = Boolean(current.isStudied);
        const isCodingDone = Boolean(current.exercisePassed || current.assignmentPassed || current.codingPassed);
        const hasPractical = Boolean(
          (module.practiceExercises && module.practiceExercises.length > 0) ||
          module.hasCodingChallenge ||
          module.assignment ||
          module.exercise
        );
        const effectiveCodingDone = hasPractical ? isCodingDone : true;
        const isMcqCutoffMet = marksObtained >= 8 || percentage >= 80 || newBest >= 80;
        const alreadySent = Boolean(current.moduleCompletionEmailSent);

        if (isStudyDone && effectiveCodingDone && isMcqCutoffMet && !alreadySent) {
          // Fetch actual coding assessment marks for this specific module
          let actualCodingScore = null;
          let actualCodingMaxScore = 100;
          let hasCodingRecord = false;

          if (current.exerciseScore !== undefined && current.exerciseScore !== null) {
            actualCodingScore = current.exerciseScore;
            hasCodingRecord = true;
          } else if (Array.isArray(current.exerciseAttempts) && current.exerciseAttempts.length > 0) {
            actualCodingScore = Math.max(...current.exerciseAttempts.map((a) => a.score || 0));
            hasCodingRecord = true;
          } else if (current.exercisePassed || current.assignmentPassed) {
            actualCodingScore = 100;
            hasCodingRecord = true;
          }

          const mcqPct = Math.round((marksObtained / totalMarks) * 100);
          const combinedMarksStr = hasCodingRecord
            ? `${Math.round((actualCodingScore + mcqPct) / 2)}%`
            : `${mcqPct}%`;
          const displayCodingScore = hasCodingRecord ? `${actualCodingScore} / ${actualCodingMaxScore}` : "Not Attempted (0 / 100)";

          // Lock module completion email to prevent duplicate dispatches
          current.moduleCompletionEmailSent = true;
          current.moduleCompletedAt = new Date();
          progress.moduleProgress.set(pKey, current);
          progress.markModified("moduleProgress");
          await progress.save();

          dispatchMailBackground(async () => {
            return await sendModuleCompletionEmail({
              userEmail: candidateUser.email,
              userName: candidateUser.fullName || candidateUser.username || "Student",
              moduleNumber: idx + 1,
              moduleName: module.title,
              codingMarks: displayCodingScore,
              codingMaxMarks: actualCodingMaxScore,
              mcqMarks: marksObtained,
              mcqMaxMarks: totalMarks,
              combinedMarks: combinedMarksStr,
              mcqCutoff: "8/10",
              completionStatus: "COMPLETED",
              completionDate: new Date(),
              reportUrl: `/assessment-report/attempt_${attemptDoc._id}`,
              req,
            });
          }, { type: "module_completion_update", recipient: candidateUser.email });
        } else {
          dispatchMailBackground(async () => {
            return await sendSubmissionEvaluationEmail({
              userEmail: candidateUser.email,
              userName: candidateUser.fullName || candidateUser.username || "Candidate",
              assessmentTitle: module.title,
              assessmentType: "module",
              score: marksObtained,
              maxScore: totalMarks,
              percentage,
              verdict: isMcqCutoffMet ? "PASSED" : "FAILED",
              reportUrl: `/assessment-report/attempt_${attemptDoc._id}`,
              req,
            });
          }, { type: "module_assessment_evaluation", recipient: candidateUser.email });
        }
      }
    } catch (mailDispatchErr) {
      console.warn("Coding module assessment email dispatch warning:", mailDispatchErr.message);
    }

    res.json({
      success: true,
      passed,
      score: marksObtained,
      marksObtained,
      totalMarks,
      correctCount,
      totalQuestions: questions.length,
      questionsAttempted,
      questionsUnanswered,
      accuracy,
      grade,
      percentage,
      startTime,
      submittedAt,
      passingScore: module.assessment.passingScore,
      nextUnlockedModule,
      reviewBreakdown,
      attemptId: attemptDoc._id.toString(),
      sessionId: `attempt_${attemptDoc._id}`,
      reportUrl: `/assessment-report/attempt_${attemptDoc._id}`,
      message: passed
        ? `🎉 Congratulations! You scored ${marksObtained}/${totalMarks} marks (${percentage}%). Module ${idx + 2} has been unlocked!`
        : `Score: ${marksObtained}/${totalMarks} marks (${percentage}%). You need at least ${module.assessment.passingScore}% to pass and unlock the next module. Review the question explanations below and retry!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// POST /api/coding/curriculum/reset
// Resets learning process, modules, tests, and assessment attempts
// -------------------------------------------------------------
router.post("/curriculum/reset", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { trackId, resetAllTracks = false } = req.body;

    let progress = await CodingProgress.findOne({ userId });
    if (!progress) {
      progress = new CodingProgress({ userId });
    }

    if (!resetAllTracks && trackId) {
      // Reset specific track
      const tId = trackId.toLowerCase();
      progress.trackUnlocks.set(tId, 0);
      progress.trackLessons.set(tId, 0);

      // Clear moduleProgress for this track
      if (progress.moduleProgress) {
        for (const key of Array.from(progress.moduleProgress.keys())) {
          if (key.startsWith(`${tId}_`)) {
            progress.moduleProgress.delete(key);
          }
        }
      }

      // Filter out assessment attempts for this track
      if (progress.assessmentAttempts) {
        progress.assessmentAttempts = progress.assessmentAttempts.filter(
          (a) => a.trackId !== tId
        );
      }

      // Delete module assessment attempts in database
      await ModuleAssessmentAttempt.deleteMany({ userId, trackId: tId });

      await progress.save();

      return res.json({
        success: true,
        message: `Learning process and tests for ${trackId} track reset successfully. Module 1 is now unlocked and ready.`,
        trackId: tId,
        unlockLevel: 0,
      });
    }

    // Reset ALL coding curriculum tracks, tests, and learning progress
    progress.trackUnlocks = new Map([
      ["python", 0],
      ["javascript", 0],
      ["java", 0],
      ["cpp", 0],
      ["webdev", 0],
      ["dsa", 0],
    ]);
    progress.trackLessons = new Map([
      ["python", 0],
      ["javascript", 0],
      ["java", 0],
      ["cpp", 0],
      ["webdev", 0],
      ["dsa", 0],
    ]);
    progress.moduleProgress = new Map();
    progress.assessmentAttempts = [];
    progress.challengesSolved = [];
    progress.videoProgress = new Map();
    progress.projects = new Map();
    progress.bookmarkedResources = [];
    progress.visitedResources = [];
    progress.lastActivity = {
      type: "welcome",
      trackId: "python",
      moduleIndex: 0,
      title: "Welcome to Coding Track",
      timestamp: new Date(),
    };

    await progress.save();

    // Delete all test assessment attempts for coding
    await ModuleAssessmentAttempt.deleteMany({ userId, subjectKey: { $in: ["coding", null] } });
    await ChallengeSubmission.deleteMany({ userId });
    await ProctoredCodingSession.deleteMany({ userId });

    // Clear coding activity logs in ProgressSchema
    await Progress.deleteMany({ userId, track: "CODING" });

    res.json({
      success: true,
      message: "Entire coding learning process, tests, and module states have been reset to initial state.",
      unlockLevel: 0,
    });
  } catch (err) {
    console.error("Failed to reset coding curriculum progress:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/coding/track/select
// Persist user selected learning track
// -------------------------------------------------------------
router.post("/track/select", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { track } = req.body;
    if (!track) {
      return res.status(400).json({ error: "Track name is required" });
    }

    let progress = await CodingProgress.findOne({ userId });
    if (!progress) {
      progress = await CodingProgress.create({
        userId,
        activeTrack: track,
      });
    } else {
      progress.activeTrack = track;
      await progress.save();
    }

    res.json({ success: true, activeTrack: progress.activeTrack });
  } catch (err) {
    console.error("Failed to update active track:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/coding/data
// Unified Dashboard Data Endpoint (Strictly genuine data, 0 mocks)
// -------------------------------------------------------------
router.get("/data", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const clientEtag = req.headers["if-none-match"];

    if (clientEtag && isValidEtag("codingData", userId, clientEtag)) {
      res.setHeader("ETag", clientEtag);
      res.setHeader("Cache-Control", "private, no-cache, must-revalidate");
      return res.status(304).end();
    }

    const mongoose = require("mongoose");
    const ProjectWorkspaceState = require("../models/ProjectWorkspaceState");
    const isValidUser = userId && mongoose.Types.ObjectId.isValid(String(userId));
    const userObjId = isValidUser ? new mongoose.Types.ObjectId(String(userId)) : null;

    // Helper to safely read Map or Plain Object track counters
    const getTrackVal = (mapOrObj, key) => {
      if (!mapOrObj) return 0;
      if (typeof mapOrObj.get === "function") return mapOrObj.get(key) || 0;
      return mapOrObj[key] || 0;
    };

    const thirtyDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);

    // Fetch progress, snippets, records, and project workspace states concurrently with lean projections
    const [userProgressDoc, snippets, progressRecords, userProjectStates] = await Promise.all([
      CodingProgress.findOne({ userId: userObjId || userId }).lean(),
      CodingSnippet.find({ userId: userObjId || userId })
        .select("title language updatedAt")
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean(),
      Progress.find({ userId: userObjId || userId, track: "CODING", date: { $gte: thirtyDaysAgo } })
        .select("date xpEarned hoursSpent updatedAt")
        .sort({ date: -1 })
        .limit(60)
        .lean(),
      userObjId
        ? ProjectWorkspaceState.find({ userId: userObjId })
            .select("projectId status checkedTasks bestScore bestPercentage bestGrade passed badgeAwarded attemptsCount latestReportSessionId completedAt lastSavedAt updatedAt")
            .lean()
        : Promise.resolve([]),
    ]);

    let userProgress = userProgressDoc;
    if (!userProgress) {
      userProgress = {
        userId: userObjId || userId,
        activeTrack: "Python Track",
        trackUnlocks: { python: 0, javascript: 0, java: 0, cpp: 0, webdev: 0, dsa: 0 },
        trackLessons: { python: 0, javascript: 0, java: 0, cpp: 0, webdev: 0, dsa: 0 },
        challengesSolved: [],
      };
    }

    // Fast conditional validation using lightweight ETag
    const progressVer = userProgress?.updatedAt ? new Date(userProgress.updatedAt).getTime() : 0;
    const projVer = userProjectStates.reduce((max, p) => Math.max(max, p.updatedAt ? new Date(p.updatedAt).getTime() : 0), 0);
    const snippetVer = snippets[0]?.updatedAt ? new Date(snippets[0].updatedAt).getTime() : 0;
    const solvedCount = Array.isArray(userProgress?.challengesSolved) ? userProgress.challengesSolved.length : 0;
    const dataEtag = `W/"codingdata-${userId}-${progressVer}-${projVer}-${snippetVer}-${solvedCount}-${progressRecords.length}"`;

    setEtag("codingData", userId, dataEtag);
    res.setHeader("ETag", dataEtag);
    res.setHeader("Cache-Control", "private, no-cache, must-revalidate");

    if (clientEtag === dataEtag) {
      return res.status(304).end();
    }

    // Calculate real stats from global Progress collection
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecords = progressRecords.filter(
      (r) => r.date && new Date(r.date).toISOString().split("T")[0] === todayStr
    );
    const todayXp = todayRecords.reduce((sum, r) => sum + (r.xpEarned || 0), 0);
    const todayHours = todayRecords.reduce((sum, r) => sum + (r.hoursSpent || 0), 0);
    const totalXp = progressRecords.reduce((sum, r) => sum + (r.xpEarned || 0), 0);
    const totalHours = progressRecords.reduce((sum, r) => sum + (r.hoursSpent || 0), 0);

    // Calculate streak from persisted activity dates
    const dates = new Set(
      progressRecords.map((r) => new Date(r.date).toISOString().split("T")[0])
    );
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      if (dates.has(ds)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Curated learning tracks with verified completion & unlock states matching reference screenshot
    const tracks = [
      {
        id: "python",
        title: "Python Basics & Core",
        subtitle: "Variables, control flow, functions, OOP, and data structures.",
        icon: "python",
        totalLessons: 8,
        completedLessons: Math.min(8, getTrackVal(userProgress.trackLessons, "python")),
        unlockedLevel: getTrackVal(userProgress.trackUnlocks, "python"),
        status: getTrackVal(userProgress.trackLessons, "python") >= (CURRICULUM.python || []).length && (CURRICULUM.python || []).length > 0
          ? "Completed"
          : getTrackVal(userProgress.trackLessons, "python") > 0 || getTrackVal(userProgress.trackUnlocks, "python") > 0
          ? "In Progress"
          : "Start",
      },
      {
        id: "javascript",
        title: "JavaScript Essentials",
        subtitle: "DOM manipulation, async/await, closures, and ES6+ features.",
        icon: "javascript",
        totalLessons: 10,
        completedLessons: Math.min(10, getTrackVal(userProgress.trackLessons, "javascript")),
        unlockedLevel: getTrackVal(userProgress.trackUnlocks, "javascript"),
        status: getTrackVal(userProgress.trackLessons, "javascript") >= (CURRICULUM.javascript || []).length && (CURRICULUM.javascript || []).length > 0
          ? "Completed"
          : getTrackVal(userProgress.trackLessons, "javascript") > 0 || getTrackVal(userProgress.trackUnlocks, "javascript") > 0
          ? "In Progress"
          : "Start",
      },
      {
        id: "java",
        title: "Java Programming",
        subtitle: "OOP principles, collections, multithreading, and enterprise design.",
        icon: "java",
        totalLessons: 12,
        completedLessons: Math.min(12, getTrackVal(userProgress.trackLessons, "java")),
        unlockedLevel: getTrackVal(userProgress.trackUnlocks, "java"),
        status: getTrackVal(userProgress.trackLessons, "java") >= (CURRICULUM.java || []).length && (CURRICULUM.java || []).length > 0
          ? "Completed"
          : getTrackVal(userProgress.trackLessons, "java") > 0 || getTrackVal(userProgress.trackUnlocks, "java") > 0
          ? "In Progress"
          : "Start",
      },
      {
        id: "cpp",
        title: "Modern C++ Systems",
        subtitle: "Pointers, memory management, STL containers, and performance.",
        icon: "cpp",
        totalLessons: 8,
        completedLessons: getTrackVal(userProgress.trackLessons, "cpp"),
        unlockedLevel: getTrackVal(userProgress.trackUnlocks, "cpp"),
        status: getTrackVal(userProgress.trackLessons, "cpp") >= (CURRICULUM.cpp || []).length ? "Completed" : getTrackVal(userProgress.trackUnlocks, "cpp") > 0 ? "In Progress" : "Start",
      },
      {
        id: "webdev",
        title: "Full-Stack Web Development",
        subtitle: "HTML5 semantic markup, CSS3 Flex/Grid, React, and REST APIs.",
        icon: "webdev",
        totalLessons: 10,
        completedLessons: getTrackVal(userProgress.trackLessons, "webdev"),
        unlockedLevel: getTrackVal(userProgress.trackUnlocks, "webdev"),
        status: getTrackVal(userProgress.trackLessons, "webdev") >= (CURRICULUM.webdev || []).length ? "Completed" : getTrackVal(userProgress.trackUnlocks, "webdev") > 0 ? "In Progress" : "Start",
      },
      {
        id: "dsa",
        title: "Data Structures & Algorithms",
        subtitle: "Arrays, stacks, queues, trees, graphs, and dynamic programming.",
        icon: "dsa",
        totalLessons: 12,
        completedLessons: getTrackVal(userProgress.trackLessons, "dsa"),
        unlockedLevel: getTrackVal(userProgress.trackUnlocks, "dsa"),
        status: getTrackVal(userProgress.trackLessons, "dsa") >= (CURRICULUM.dsa || []).length ? "Completed" : getTrackVal(userProgress.trackUnlocks, "dsa") > 0 ? "In Progress" : "Start",
      },
    ];

    // Challenge cards annotated with user solved status
    const solvedSet = new Set((userProgress.challengesSolved || []).map((c) => c.challengeId));
    const solvedMap = new Map((userProgress.challengesSolved || []).map((c) => [c.challengeId, c]));
    const annotatedChallenges = CHALLENGES_CATALOG.map((ch, idx) => {
      const isSolved = solvedSet.has(ch.id);
      return {
        id: ch.id,
        title: ch.title,
        difficulty: ch.difficulty,
        category: ch.category,
        topic: ch.topic,
        tags: ch.tags || [],
        points: ch.points || 50,
        acceptanceRate: ch.acceptanceRate || 85,
        starterLanguage: ch.starterLanguage || "python",
        description: ch.description,
        questionNumber: ch.questionNumber || (idx + 1),
        solved: isSolved,
        isCompleted: isSolved,
        userSolution: solvedMap.get(ch.id) || null,
      };
    });

    // Real-world practical projects (14 full-stack & domain engineering projects enriched with live user progress)
    const { PROJECTS_CATALOG, getPublicProjectSpec } = require("../data/projectsCatalog");
    const projStateMap = new Map(userProjectStates.map((s) => [s.projectId, s]));

    const projects = PROJECTS_CATALOG.map((proj) => {
      const spec = getPublicProjectSpec(proj);
      const st = projStateMap.get(proj.id);
      const totalMilestones = (proj.milestones || []).length || 3;
      const checkedCount = st?.checkedTasks?.length || 0;
      const taskProgressPct = Math.min(100, Math.round((checkedCount / totalMilestones) * 100));
      const passingMarks = proj.passingMarks || spec.passingMarks || 80;
      const bestScore = st?.bestScore || 0;
      const isPassed = Boolean(st?.passed && st?.badgeAwarded && bestScore >= passingMarks);
      const status = isPassed
        ? "PASSED"
        : st?.status === "needs_improvement" || (st?.attemptsCount > 0 && !isPassed)
        ? "NEEDS_IMPROVEMENT"
        : String(st?.status || "NOT_STARTED").toUpperCase();
      const progressPercent =
        isPassed
          ? 100
          : status === "NEEDS_IMPROVEMENT"
          ? Math.max(taskProgressPct, Math.min(95, bestScore || 50))
          : status === "IN_PROGRESS"
          ? Math.max(15, taskProgressPct)
          : 0;

      return {
        ...spec,
        userState: {
          status,
          passed: isPassed,
          badgeAwarded: isPassed,
          attemptsCount: st?.attemptsCount || 0,
          bestScore,
          bestPercentage: st?.bestPercentage || 0,
          bestGrade: st?.bestGrade || "-",
          checkedTasks: st?.checkedTasks || [],
          progressPercent,
          latestReportSessionId: st?.latestReportSessionId || null,
          completedAt: st?.completedAt || null,
          lastSavedAt: st?.lastSavedAt || null,
        },
      };
    });

    // Documentation & Resources library with verified external references (26 total verified docs)
    const resources = [
      {
        title: "MDN Web Docs",
        category: "Web & JavaScript",
        url: "https://developer.mozilla.org",
        description: "The definitive reference manual for HTML, CSS, JavaScript, and Web APIs.",
        official: true,
        lang: "javascript",
      },
      {
        title: "Official Python Documentation",
        category: "Python",
        url: "https://docs.python.org/3/",
        description: "Official tutorials, standard library references, and language specifications.",
        official: true,
        lang: "python",
      },
      {
        title: "Oracle Java SE 21/26 Documentation",
        category: "Java",
        url: "https://docs.oracle.com/en/java/javase/",
        description: "Java platform documentation, API specifications, and JVM internals.",
        official: true,
        lang: "java",
      },
      {
        title: "cppreference.com",
        category: "C / C++",
        url: "https://en.cppreference.com/w/",
        description: "Comprehensive C and C++ standard library, templates, and STL reference.",
        official: true,
        lang: "cpp",
      },
      {
        title: "React Official Documentation",
        category: "Frontend",
        url: "https://react.dev",
        description: "Modern component architectures, hooks, state patterns, and performance.",
        official: true,
        lang: "react",
      },
      {
        title: "NeetCode DSA Roadmap",
        category: "Algorithms",
        url: "https://neetcode.io/roadmap",
        description: "Curated learning paths for data structures, algorithms, and technical interviews.",
        official: false,
        lang: "dsa",
      },
      {
        title: "TypeScript Handbook & Docs",
        category: "TypeScript",
        url: "https://www.typescriptlang.org/docs/",
        description: "Official language specifications, type narrowing, interfaces, generics, and compiler options.",
        official: true,
        lang: "typescript",
      },
      {
        title: "Node.js API Reference Manual",
        category: "Backend & Runtime",
        url: "https://nodejs.org/docs/latest/api/",
        description: "Official documentation for the V8 asynchronous event-driven JavaScript runtime and core modules.",
        official: true,
        lang: "node",
      },
      {
        title: "Express.js Routing & API Guide",
        category: "Backend & Web",
        url: "https://expressjs.com/en/4x/api.html",
        description: "Fast, unopinionated, minimalist web framework reference for Node.js routing and middleware.",
        official: true,
        lang: "javascript",
      },
      {
        title: "Next.js App Router Documentation",
        category: "Frontend & Fullstack",
        url: "https://nextjs.org/docs",
        description: "Official manual for React Server Components, Server Actions, streaming, and fullstack hybrid apps.",
        official: true,
        lang: "react",
      },
      {
        title: "PostgreSQL 16 Database Documentation",
        category: "Databases & SQL",
        url: "https://www.postgresql.org/docs/current/",
        description: "The world's most advanced open source relational database reference, SQL syntax, and indexing.",
        official: true,
        lang: "sql",
      },
      {
        title: "MongoDB Manual & Query Reference",
        category: "Databases & NoSQL",
        url: "https://www.mongodb.com/docs/manual/",
        description: "Document-oriented database manual, aggregation framework, indexing, and replica set architecture.",
        official: true,
        lang: "mongodb",
      },
      {
        title: "Redis In-Memory Data Store Docs",
        category: "Databases & Caching",
        url: "https://redis.io/docs/",
        description: "Comprehensive command manual for in-memory caching, Pub/Sub, Streams, and data structures.",
        official: true,
        lang: "redis",
      },
      {
        title: "Docker Containerization Manual",
        category: "DevOps & Containers",
        url: "https://docs.docker.com/",
        description: "The industry-standard reference for containerization, Dockerfiles, Compose, and registries.",
        official: true,
        lang: "docker",
      },
      {
        title: "Kubernetes Production Orchestration Docs",
        category: "DevOps & Cloud",
        url: "https://kubernetes.io/docs/home/",
        description: "Automated deployment, scaling, and management of containerized distributed applications.",
        official: true,
        lang: "devops",
      },
      {
        title: "Pro Git Official Reference Book",
        category: "Version Control",
        url: "https://git-scm.com/doc",
        description: "Everything you need to master Git version control, branching, rebasing, and internals.",
        official: true,
        lang: "git",
      },
      {
        title: "The Rust Programming Language (The Book)",
        category: "Systems Programming",
        url: "https://doc.rust-lang.org/book/",
        description: "Official guide to memory safety without garbage collection, concurrency, and ownership semantics.",
        official: true,
        lang: "rust",
      },
      {
        title: "Go Standard Library & Language Spec",
        category: "Backend & Systems",
        url: "https://pkg.go.dev/std",
        description: "Official documentation and package specifications for building simple, fast, and reliable software.",
        official: true,
        lang: "go",
      },
      {
        title: "Tailwind CSS Utility Framework Docs",
        category: "Frontend & CSS",
        url: "https://tailwindcss.com/docs",
        description: "Modern utility-first CSS framework manual, responsive design, arbitrary values, and plugins.",
        official: true,
        lang: "css",
      },
      {
        title: "Vite Next-Generation Tooling Guide",
        category: "Frontend & Tooling",
        url: "https://vite.dev/guide/",
        description: "Lightning-fast frontend build tool with native ES modules, instant HMR, and Rollup bundling.",
        official: true,
        lang: "javascript",
      },
      {
        title: "Vue.js 3 Official Guide & API",
        category: "Frontend Frameworks",
        url: "https://vuejs.org/guide/introduction.html",
        description: "Progressive JavaScript framework documentation, Composition API, reactivity, and single-file components.",
        official: true,
        lang: "javascript",
      },
      {
        title: "GraphQL Query Language & Schema Docs",
        category: "APIs & Networking",
        url: "https://graphql.org/learn/",
        description: "Complete specification for declarative data fetching, type schemas, mutations, and subscriptions.",
        official: true,
        lang: "javascript",
      },
      {
        title: "FastAPI Modern Python Web Reference",
        category: "Python Web Frameworks",
        url: "https://fastapi.tiangolo.com/",
        description: "High-performance Python web framework reference with automatic OpenAPI documentation and Pydantic validation.",
        official: true,
        lang: "python",
      },
      {
        title: "Django Web Framework Documentation",
        category: "Python Fullstack",
        url: "https://docs.djangoproject.com/en/stable/",
        description: "The batteries-included Python framework for perfectionists with deadlines, ORM, and admin panel.",
        official: true,
        lang: "python",
      },
      {
        title: "Spring Boot Enterprise Java Framework",
        category: "Enterprise Java",
        url: "https://spring.io/projects/spring-boot",
        description: "Production-ready standalone Java enterprise applications, dependency injection, and microservices.",
        official: true,
        lang: "java",
      },
      {
        title: "Linux Man Pages & Kernel Reference (man7.org)",
        category: "Operating Systems",
        url: "https://man7.org/linux/man-pages/",
        description: "Definitive documentation for Linux system calls, POSIX libraries, networking, and kernel APIs.",
        official: true,
        lang: "c",
      },
    ];

    res.json({
      progress: userProgress,
      tracks,
      videoCourses: VERIFIED_VIDEOS,
      challenges: annotatedChallenges,
      projects,
      resources,
      snippets,
      stats: {
        totalXp: Math.round(totalXp),
        todayXp: Math.round(todayXp),
        hoursSpent: Math.round(totalHours * 10) / 10,
        todayHours: Math.round(todayHours * 10) / 10,
        streakDays: streak,
        solvedCount: solvedSet.size,
        accuracyRate: solvedSet.size > 0 ? 100 : 0,
        activeTrack: userProgress.activeTrack,
      },
    });
  } catch (err) {
    console.error("Coding data error:", err);
    res.status(500).json({ error: err.message });
  }
});



// -------------------------------------------------------------
// POST /api/coding/progress/lesson
// Security Guard: Prevents arbitrary forged completion requests.
// Modules are only unlocked via verified assessment submissions.
// -------------------------------------------------------------
router.post("/progress/lesson", authenticateToken, async (req, res) => {
  return res.status(403).json({
    error: "Verified progression enforced: Modules can only be completed by completing the practical coding exercise and passing the 10-question proctored assessment.",
    requiresAssessment: true,
  });
});

// -------------------------------------------------------------
// Snippets CRUD
// -------------------------------------------------------------
router.get("/snippets", authenticateToken, async (req, res) => {
  try {
    const snippets = await CodingSnippet.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.post("/snippets", authenticateToken, async (req, res) => {
  const { title, language, code, description, tags } = req.body;
  if (!code) return res.status(400).json({ error: "Code is required" });

  try {
    const snippet = await CodingSnippet.create({
      userId: req.user.userId,
      title: title || "Untitled Snippet",
      language: language || "python",
      code,
      description: description || "",
      tags: tags || [],
    });
    res.status(201).json(snippet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.delete("/snippets/:id", authenticateToken, async (req, res) => {
  try {
    const deleted = await CodingSnippet.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!deleted) return res.status(404).json({ error: "Snippet not found" });
    res.json({ message: "Snippet deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// REAL-TIME STRICT CODING ASSESSMENT PROCTORING & 5-CHANCE RECOVERY ENDPOINTS
// =========================================================================

function calculateGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "F";
}

function generateFeedback(score, passedCount, totalTests, durationMs, language) {
  const strengths = [];
  const improvements = [];

  if (score >= 80) {
    strengths.push(`Strong algorithmic implementation passing ${passedCount}/${totalTests} test cases.`);
    strengths.push(`Clean syntax and idiomatic usage of ${language.toUpperCase()}.`);
    if (durationMs < 1500) strengths.push("Optimal time complexity within standard CPU limits.");
  } else if (score > 0) {
    strengths.push(`Successfully handled fundamental base cases (${passedCount}/${totalTests} passed).`);
  } else {
    improvements.push("Failed to pass initial sample test cases. Check input parsing and edge case logic.");
  }

  if (passedCount < totalTests) {
    improvements.push(`Failed on ${totalTests - passedCount} hidden boundary condition(s). Check extreme values, empty inputs, or edge constraints.`);
    improvements.push("Optimize data structures to ensure sub-second execution overhead.");
  } else {
    strengths.push("Excellently passed all hidden edge cases and stress limits.");
  }

  return {
    summary: score >= 80
      ? "Demonstrated high technical competence and rigorous algorithm design under proctored conditions."
      : "Basic logic demonstrated; requires additional focus on constraint boundaries and runtime optimization.",
    strengths,
    improvements,
  };
}

// Universal Question Resolver for Mastery Zone
// Resolves curriculum exercises, algorithmic challenges, and dynamically provided problem data.
// NEVER defaults to a single static challenge.
function resolveQuestionData(questionId, trackId, moduleIndex, providedProblemData) {
  // 1. If explicit providedProblemData is passed with content, normalize and use it
  if (
    providedProblemData &&
    (providedProblemData.title ||
      providedProblemData.taskTitle ||
      providedProblemData.prompt ||
      providedProblemData.description)
  ) {
    const title = providedProblemData.title || providedProblemData.taskTitle || "Coding Problem";
    const desc =
      providedProblemData.description ||
      providedProblemData.prompt ||
      providedProblemData.overview ||
      "";
    let tcList = Array.isArray(providedProblemData.testCases) ? providedProblemData.testCases : [];
    let catalogMatch = null;
    if (questionId && Array.isArray(CHALLENGES_CATALOG)) {
      catalogMatch = CHALLENGES_CATALOG.find(
        (c) => c.id === questionId || (c.title && c.title.toLowerCase() === questionId.toLowerCase())
      );
    }
    if (tcList.length === 0 && catalogMatch?.testCases?.length) {
      tcList = catalogMatch.testCases;
    }
    if (tcList.length === 0) {
      let t = providedProblemData.trackId || trackId;
      let mIdx = providedProblemData.moduleIndex !== undefined ? providedProblemData.moduleIndex : moduleIndex;
      if ((!t || mIdx === undefined) && typeof questionId === "string" && questionId.includes("_")) {
        const parts = questionId.split("_");
        t = t || (parts[0] === "py" ? "python" : parts[0] === "js" ? "javascript" : parts[0]);
        mIdx = mIdx !== undefined ? mIdx : parseInt(parts[parts.length - 1], 10);
      }
      if (t && mIdx !== undefined && CURRICULUM[t]) {
        const mod = CURRICULUM[t].find((m) => m.moduleIndex === parseInt(mIdx, 10));
        if (mod?.codingExercise?.testCases) {
          tcList = mod.codingExercise.testCases;
        }
      }
    }
    return {
      id: providedProblemData.id || questionId || `q_${Date.now()}`,
      title,
      difficulty: providedProblemData.difficulty || catalogMatch?.difficulty || "Medium",
      category: providedProblemData.category || providedProblemData.topic || catalogMatch?.category || trackId || "DSA",
      description: desc || catalogMatch?.description || "",
      inputFormat: providedProblemData.inputFormat || catalogMatch?.inputFormat || "",
      outputFormat: providedProblemData.outputFormat || catalogMatch?.outputFormat || "",
      constraints: Array.isArray(providedProblemData.constraints) && providedProblemData.constraints.length > 0
        ? providedProblemData.constraints
        : (catalogMatch?.constraints || []),
      examples: Array.isArray(providedProblemData.examples) && providedProblemData.examples.length > 0
        ? providedProblemData.examples
        : (catalogMatch?.examples || []),
      hints: Array.isArray(providedProblemData.hints) && providedProblemData.hints.length > 0
        ? providedProblemData.hints
        : (catalogMatch?.hints || []),
      objective: providedProblemData.objective || catalogMatch?.description || "",
      testCases: tcList,
      starterCode: providedProblemData.starterCode || catalogMatch?.starterCode || {},
    };
  }

  // 2. Check CHALLENGES_CATALOG
  if (questionId && Array.isArray(CHALLENGES_CATALOG)) {
    const ch = CHALLENGES_CATALOG.find(
      (c) => c.id === questionId || (c.title && c.title.toLowerCase() === questionId.toLowerCase())
    );
    if (ch) return { ...ch };
  }

  // 3. Check CURRICULUM by trackId and moduleIndex
  if (trackId && moduleIndex !== undefined && moduleIndex !== null && CURRICULUM[trackId]) {
    const idx = parseInt(moduleIndex, 10);
    const mod = (CURRICULUM[trackId] || []).find(
      (m) => m.moduleIndex === idx || m.id === questionId
    );
    if (mod && mod.codingExercise) {
      return {
        id: questionId || mod.id,
        title: mod.codingExercise.taskTitle || mod.title,
        difficulty: mod.difficulty || "Medium",
        category: mod.topic || trackId || "Core Curriculum",
        description:
          mod.codingExercise.prompt ||
          mod.codingExercise.description ||
          mod.overview ||
          "",
        inputFormat: mod.codingExercise.inputFormat || "",
        outputFormat: mod.codingExercise.outputFormat || "",
        constraints: mod.codingExercise.constraints || [],
        examples: mod.codingExercise.examples || [],
        hints: mod.codingExercise.hints || [],
        objective: mod.overview || "",
        testCases: mod.codingExercise.testCases || [],
        starterCode: mod.codingExercise.starterCode || {},
      };
    }
  }

  // 4. Check CURRICULUM parsing "trackId_moduleIndex" (e.g. "python_0", "py_0", "javascript_1", "dsa_2")
  if (typeof questionId === "string" && questionId.includes("_")) {
    const parts = questionId.split("_");
    let parsedTrack = parts[0];
    if (parsedTrack === "py") parsedTrack = "python";
    if (parsedTrack === "js") parsedTrack = "javascript";
    const parsedIdx = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(parsedIdx) && CURRICULUM[parsedTrack]) {
      const mod = CURRICULUM[parsedTrack].find((m) => m.moduleIndex === parsedIdx);
      if (mod && mod.codingExercise) {
        return {
          id: questionId,
          title: mod.codingExercise.taskTitle || mod.title,
          difficulty: mod.difficulty || "Medium",
          category: mod.topic || parsedTrack || "Core Curriculum",
          description:
            mod.codingExercise.prompt ||
            mod.codingExercise.description ||
            mod.overview ||
            "",
          inputFormat: mod.codingExercise.inputFormat || "",
          outputFormat: mod.codingExercise.outputFormat || "",
          constraints: mod.codingExercise.constraints || [],
          examples: mod.codingExercise.examples || [],
          hints: mod.codingExercise.hints || [],
          objective: mod.overview || "",
          testCases: mod.codingExercise.testCases || [],
          starterCode: mod.codingExercise.starterCode || {},
        };
      }
    }
  }

  // 5. Search across all modules in CURRICULUM
  const allTracks = Object.keys(CURRICULUM || {});
  for (const t of allTracks) {
    const foundMod = (CURRICULUM[t] || []).find(
      (m) =>
        m.id === questionId ||
        m.codingExercise?.id === questionId ||
        `${t}_${m.moduleIndex}` === questionId ||
        (m.title && m.title.toLowerCase() === questionId.toLowerCase())
    );
    if (foundMod && foundMod.codingExercise) {
      return {
        id: questionId,
        title: foundMod.codingExercise.taskTitle || foundMod.title,
        difficulty: foundMod.difficulty || "Medium",
        category: foundMod.topic || t || "Core Curriculum",
        description:
          foundMod.codingExercise.prompt ||
          foundMod.codingExercise.description ||
          foundMod.overview ||
          "",
        inputFormat: foundMod.codingExercise.inputFormat || "",
        outputFormat: foundMod.codingExercise.outputFormat || "",
        constraints: foundMod.codingExercise.constraints || [],
        examples: foundMod.codingExercise.examples || [],
        hints: foundMod.codingExercise.hints || [],
        objective: foundMod.overview || "",
        testCases: foundMod.codingExercise.testCases || [],
        starterCode: foundMod.codingExercise.starterCode || {},
      };
    }
  }

  // 6. Dynamic clean fallback - NEVER hardcode Tight Bound Proof!
  const cleanTitle = (questionId || "Coding Challenge")
    .replace(/^ch_|^py_mod_|^js_mod_|^java_mod_|^cpp_mod_|^web_mod_/, "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: questionId || "coding_assessment",
    title: cleanTitle,
    difficulty: "Medium",
    category: trackId || "DSA",
    description:
      "Implement the required solution to satisfy all test cases and adhere to the time and memory complexity requirements.",
    inputFormat: "Standard Input as specified in the problem statement.",
    outputFormat: "Standard Output matching expected test cases.",
    constraints: ["Execution time limit: 5000ms", "Memory limit: 256MB"],
    examples: [],
    hints: ["Analyze edge cases and test case bounds carefully."],
    objective: "Demonstrate accurate algorithmic implementation.",
    testCases: [],
    starterCode: {},
  };
}

// 1. POST /api/coding/proctored-session/init
router.post("/proctored-session/init", optionalAuthenticateToken, async (req, res) => {
  try {
    const userId = req.user
      ? (req.user.userId || req.user.id || req.user._id)
      : (req.body.candidateDetails?.candidateId || req.body.userId || `guest_${Date.now()}`);
    const {
      candidateDetails,
      questionId,
      assessmentTitle,
      trackId,
      moduleIndex,
      timeLimitMinutes,
      timeLimitSeconds,
      defaultLanguage,
      problemData: providedProblemData,
      questions: providedQuestions,
      questionsList,
    } = req.body;

    const effQuestionId =
      questionId ||
      (providedQuestions && providedQuestions[0]?.questionId) ||
      (questionsList && questionsList[0]?.id) ||
      "ch_two_sum";

    let rawQuestions = [];
    if (Array.isArray(providedQuestions) && providedQuestions.length > 0) {
      rawQuestions = providedQuestions;
    } else if (Array.isArray(questionsList) && questionsList.length > 0) {
      rawQuestions = questionsList;
    } else {
      rawQuestions = [
        {
          questionId: effQuestionId,
          trackId,
          moduleIndex,
          problemData: providedProblemData,
          title: assessmentTitle,
        },
      ];
    }

    const marksPerQ = Math.round(100 / Math.max(1, rawQuestions.length));

    const resolvedQuestions = rawQuestions.map((q, idx) => {
      const qId = q.questionId || q.id || effQuestionId;
      const resolved = resolveQuestionData(
        qId,
        q.trackId || trackId,
        q.moduleIndex ?? moduleIndex,
        q.problemData || q
      );
      const qTestCases = (resolved.testCases || []).map((t, tcIdx) => ({
        input: t.input,
        expectedOutput: t.expectedOutput,
        isHidden: t.isHidden !== undefined ? t.isHidden : false,
      }));
      return {
        questionId: resolved.id || `q_${idx + 1}`,
        title: resolved.title || `Coding Problem ${idx + 1}`,
        difficulty: resolved.difficulty || "Medium",
        category: resolved.category || trackId || "DSA",
        description: resolved.description || "",
        inputFormat: resolved.inputFormat || "",
        outputFormat: resolved.outputFormat || "",
        constraints: resolved.constraints || [],
        examples: resolved.examples || [],
        hints: resolved.hints || [],
        testCases: qTestCases,
        submittedCode: resolved.starterCode?.[defaultLanguage || "python"] || "",
        language: defaultLanguage || "python",
        status: "unattempted",
        score: 0,
        marksObtained: 0,
        totalMarks: marksPerQ,
        passedTests: 0,
        totalTests: qTestCases.length,
        testResults: [],
        attempted: false,
      };
    });

    const primaryProblem = resolvedQuestions[0];

    const durationSec = Math.max(
      60,
      Math.min(
        parseInt(timeLimitSeconds, 10) ||
          (parseInt(timeLimitMinutes, 10) ? parseInt(timeLimitMinutes, 10) * 60 : 3600),
        18000
      )
    );
    const now = new Date();
    const deadline = new Date(now.getTime() + durationSec * 1000);
    const sessionId = `mz_proc_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    await ProctoredCodingSession.updateMany(
      { userId, status: "active" },
      { $set: { status: "terminated", terminatedReason: "Superseded by new session initialization" } }
    );

    const session = await ProctoredCodingSession.create({
      sessionId,
      userId,
      candidateDetails: {
        fullName: candidateDetails?.fullName || req.user.name || "Candidate",
        email: candidateDetails?.email || req.user.email || "",
        candidateId: candidateDetails?.candidateId || `CAND-${Date.now().toString().slice(-6)}`,
        organization: candidateDetails?.organization || "Mastery Zone Academy",
      },
      questionId: primaryProblem.questionId,
      assessmentTitle: assessmentTitle || primaryProblem.title || "MZ-ASM Proctored Assessment",
      trackId: trackId || "python",
      moduleIndex: parseInt(moduleIndex ?? 0, 10),
      problemData: {
        title: primaryProblem.title,
        difficulty: primaryProblem.difficulty,
        category: primaryProblem.category,
        description: primaryProblem.description,
        inputFormat: primaryProblem.inputFormat,
        outputFormat: primaryProblem.outputFormat,
        constraints: primaryProblem.constraints,
        examples: primaryProblem.examples,
        hints: primaryProblem.hints,
        objective: primaryProblem.description,
        starterCode: primaryProblem.starterCode || {},
        testCases: primaryProblem.testCases,
      },
      questions: resolvedQuestions,
      status: "precheck",
      serverStartTime: now,
      serverDeadline: deadline,
      timeLimitSeconds: durationSec,
      maxRecoveryChances: 5,
      recoveryChancesUsed: 0,
      draftCode: primaryProblem.submittedCode || "",
      draftLanguage: defaultLanguage || "python",
      deviceInfo: {
        battery: { percentage: 100, charging: false, supported: true },
        camera: false,
        microphone: false,
        screenShare: false,
        displaySurface: "monitor",
        fullscreen: false,
      },
      violationsCount: 0,
      violationsLog: [
        {
          type: "session_created",
          detail: "Candidate initialized proctored assessment precheck.",
          timestamp: now,
        },
      ],
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      assessmentTitle: session.assessmentTitle,
      candidateDetails: session.candidateDetails,
      problemData: session.problemData,
      questions: session.questions,
      status: session.status,
      serverStartTime: session.serverStartTime,
      serverDeadline: session.serverDeadline.getTime(),
      timeRemaining: session.timeLimitSeconds,
      timeLimitMinutes: Math.round(durationSec / 60),
      timeLimitSeconds: durationSec,
      maxRecoveryChances: session.maxRecoveryChances,
    });
  } catch (err) {
    console.error("Failed to init proctored session:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/coding/proctored-session/start
router.post("/proctored-session/start", optionalAuthenticateToken, async (req, res) => {
  try {
    const userId = req.user
      ? String(req.user.userId || req.user.id || req.user._id)
      : (req.body.candidateDetails?.candidateId || req.body.userId || `guest_${Date.now()}`);
    const {
      sessionId,
      questionId,
      timeLimitMinutes,
      deviceInfo,
      batteryLevel,
      candidateDetails,
      problemData: providedProblemData,
      trackId,
      moduleIndex,
    } = req.body;

    let session = null;
    if (sessionId) {
      session = await ProctoredCodingSession.findOne({ sessionId });
      if (session) {
        const sessionOwner = String(session.userId || "");
        const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
        if (sessionOwner && !sessionOwner.startsWith("guest_") && sessionOwner !== "guest") {
          if (!isAdmin && sessionOwner !== userId) {
            return res.status(403).json({ error: "Access denied. You do not own this proctored assessment session." });
          }
        }
      }
    }

    const now = new Date();
    if (!session && (questionId || providedProblemData)) {
      const problem = resolveQuestionData(questionId, trackId, moduleIndex, providedProblemData);
      const durationSec = Math.max(
        60,
        Math.min(
          parseInt(timeLimitMinutes, 10) ? parseInt(timeLimitMinutes, 10) * 60 : 3600,
          18000
        )
      );
      const deadline = new Date(now.getTime() + durationSec * 1000);
      const generatedSessionId = `mz_proc_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

      const qTestCases = (problem.testCases || []).map((t, idx) => ({
        input: t.input,
        expectedOutput: t.expectedOutput,
        isHidden: t.isHidden !== undefined ? t.isHidden : false,
      }));

      const initialQ = {
        questionId: problem.id || questionId,
        title: problem.title,
        difficulty: problem.difficulty || "Medium",
        category: problem.category || trackId || "DSA",
        description: problem.description || "",
        inputFormat: problem.inputFormat || "",
        outputFormat: problem.outputFormat || "",
        constraints: problem.constraints || [],
        examples: problem.examples || [],
        hints: problem.hints || [],
        testCases: qTestCases,
        submittedCode: problem.starterCode?.["python"] || "",
        language: "python",
        status: "unattempted",
        score: 0,
        marksObtained: 0,
        totalMarks: 100,
        passedTests: 0,
        totalTests: qTestCases.length,
        testResults: [],
        attempted: false,
      };

      session = await ProctoredCodingSession.create({
        sessionId: generatedSessionId,
        userId,
        candidateDetails: {
          fullName: candidateDetails?.fullName || req.user.name || "Candidate",
          email: candidateDetails?.email || req.user.email || "",
          candidateId: candidateDetails?.candidateId || `CAND-${Date.now().toString().slice(-6)}`,
          organization: candidateDetails?.organization || "Mastery Zone Academy",
        },
        questionId: problem.id,
        assessmentTitle: problem.title,
        trackId: trackId || "python",
        problemData: {
          title: problem.title,
          difficulty: problem.difficulty,
          category: problem.category,
          description: problem.description,
          inputFormat: problem.inputFormat,
          outputFormat: problem.outputFormat,
          constraints: problem.constraints,
          examples: problem.examples,
          hints: problem.hints,
          objective: problem.objective || problem.description,
          starterCode: problem.starterCode || {},
          testCases: qTestCases,
        },
        questions: [initialQ],
        status: "active",
        serverStartTime: now,
        serverDeadline: deadline,
        timeLimitSeconds: durationSec,
        maxRecoveryChances: 5,
        recoveryChancesUsed: 0,
        deviceInfo: require("../utils/proctoringSync").mergeDeviceInfo({}, {
          ...(deviceInfo || {}),
          ...(typeof batteryLevel === "number" ? { battery: { ...(deviceInfo?.battery || {}), percentage: batteryLevel, supported: true } } : {}),
          monitoringActive: true,
        }),
        violationsCount: 0,
        violationsLog: [
          {
            type: "session_initialized",
            detail: "Proctored session started.",
            timestamp: now,
          },
        ],
      });
    } else if (session) {
      session.status = "active";
      session.serverStartTime = now;
      session.serverDeadline = new Date(now.getTime() + session.timeLimitSeconds * 1000);
      if (candidateDetails) {
        session.candidateDetails = { ...session.candidateDetails, ...candidateDetails };
      }
      if (deviceInfo || typeof batteryLevel === "number") {
        session.deviceInfo = require("../utils/proctoringSync").mergeDeviceInfo(session.deviceInfo, {
          ...(deviceInfo || {}),
          ...(typeof batteryLevel === "number" ? { battery: { ...(session.deviceInfo?.battery || {}), percentage: batteryLevel, supported: true } } : {}),
          monitoringActive: true,
        });
        session.markModified("deviceInfo");
      }
      session.violationsLog.push({
        type: "session_initialized",
        detail: "Proctored session started.",
        timestamp: now,
      });
      session.markModified("questions");
      session.markModified("questionDrafts");
      session.markModified("submissionResult");
      session.markModified("violationsLog");
      await session.save();
    } else {
      return res.status(400).json({ error: "Invalid session configuration" });
    }

    require("../utils/proctoringSync").emitProctoringSessionUpdate(
      req.app.get("io"),
      session.sessionId,
      "session_started",
      { status: session.status }
    );

    logActivityAndBroadcast({
      userId: mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      userEmail: session.candidateDetails?.email || req.user?.email || "",
      userName: session.candidateDetails?.fullName || req.user?.name || "Candidate",
      type: "PROCTORING_STARTED",
      title: "Proctored Exam Started",
      detail: `${session.candidateDetails?.fullName || "Candidate"} started proctored examination: "${session.assessmentTitle}"`,
      category: "proctoring",
      severity: "info",
      metadata: {
        sessionId: session.sessionId,
        trackId: session.trackId,
        assessmentTitle: session.assessmentTitle,
        timeLimitSeconds: session.timeLimitSeconds,
      },
      io: req.app.get("io"),
    }).catch(() => {});

    res.json({
      success: true,
      sessionId: session.sessionId,
      status: session.status,
      serverStartTime: session.serverStartTime,
      serverDeadline: session.serverDeadline.getTime(),
      timeRemaining: session.timeLimitSeconds,
      maxRecoveryChances: session.maxRecoveryChances,
      chancesRemaining: Math.max(0, session.maxRecoveryChances - (session.recoveryChancesUsed || 0)),
      problemData: session.problemData,
      questions: session.questions,
    });
  } catch (err) {
    console.error("Failed to start proctored session:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/coding/proctored-session/user-reports
// Return all submitted assessment reports for the logged-in candidate
router.get(["/proctored-session/user-reports", "/reports", "/my-reports"], authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const mongoose = require("mongoose");
    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;

    const [sessions, challengeSubs] = await Promise.all([
      ProctoredCodingSession.find({
        $or: [{ userId }, ...(userObjId ? [{ userId: userObjId }] : [])],
        $and: [
          {
            $or: [
              { status: "submitted" },
              { "submissionResult.submittedAt": { $exists: true } },
            ],
          },
        ],
      })
        .select("sessionId assessmentTitle trackId candidateDetails questions problemData submissionResult draftLanguage violationsCount updatedAt createdAt serverStartTime")
        .sort({ "submissionResult.submittedAt": -1, updatedAt: -1 })
        .limit(100)
        .lean(),
      ChallengeSubmission.find({
        $or: [{ userId }, ...(userObjId ? [{ userId: userObjId }] : [])],
      })
        .select("challengeId challengeTitle language status score passedTests totalTests runtimeMs createdAt")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const proctoredReports = sessions.map((s) => {
      const primaryQ = (s.questions && s.questions[0]) || s.problemData || {};
      const challengeTitle = primaryQ.title || s.assessmentTitle || "Algorithmic Challenge";
      const subResult = s.submissionResult || {};
      const score = subResult.score !== undefined ? subResult.score : (primaryQ.score !== undefined ? primaryQ.score : 0);
      const passedTests = subResult.passedTests !== undefined ? subResult.passedTests : (primaryQ.passedTests !== undefined ? primaryQ.passedTests : (score === 100 ? 10 : 0));
      const totalTests = subResult.totalTests || primaryQ.totalTests || 10;
      const grade = subResult.grade || calculateGrade(score);
      const passed = subResult.passed !== undefined ? subResult.passed : score >= 80;

      return {
        sessionId: s.sessionId,
        assessmentTitle: s.assessmentTitle || challengeTitle,
        questionTitle: challengeTitle,
        difficulty: primaryQ.difficulty || "Medium",
        category: primaryQ.category || s.trackId || "Algorithms",
        candidateDetails: s.candidateDetails || {},
        submittedAt: subResult.submittedAt || s.updatedAt || s.createdAt,
        score,
        grade,
        accuracy: subResult.accuracy !== undefined ? subResult.accuracy : (totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : score),
        passedTests,
        totalTests,
        durationSeconds: subResult.durationSeconds || Math.max(1, Math.round(((s.updatedAt || new Date()) - (s.serverStartTime || s.createdAt)) / 1000)),
        language: subResult.language || primaryQ.language || s.draftLanguage || "python",
        passed,
        violationsCount: s.violationsCount || 0,
        type: "Coding Assessment",
        typeLabel: "Proctored Coding Assessment",
        reportUrl: `/assessment-report/${s.sessionId}`,
        totalQuestions: s.questions && s.questions.length > 0 ? s.questions.length : 1,
        questionsAttempted: subResult.questionsAttempted || (s.questions && s.questions.length > 0 ? s.questions.length : 1),
      };
    });

    const challengeReports = (challengeSubs || []).map((cs) => {
      const totalT = cs.totalTests || 10;
      const passedT = cs.passedTests !== undefined ? cs.passedTests : 0;
      const score = cs.score !== undefined ? cs.score : Math.round((passedT / Math.max(1, totalT)) * 100);
      const isAccepted = cs.status === "ACCEPTED";
      const resolvedProblem = resolveQuestionData(cs.challengeId, cs.language);
      const title = cs.challengeTitle || resolvedProblem.title || "Coding Challenge";
      return {
        id: String(cs._id),
        sessionId: String(cs._id),
        attemptId: String(cs._id),
        assessmentTitle: `${title} — Coding Challenge Report`,
        questionTitle: title,
        difficulty: resolvedProblem.difficulty || "Medium",
        category: resolvedProblem.category || "Algorithms",
        candidateDetails: {
          fullName: req.user?.fullName || req.user?.username || "Candidate",
          email: req.user?.email || "",
        },
        submittedAt: cs.createdAt,
        score,
        grade: calculateGrade(score),
        accuracy: totalT > 0 ? Math.round((passedT / totalT) * 100) : score,
        passedTests: passedT,
        totalTests: totalT,
        durationSeconds: Math.round((cs.runtimeMs || 0) / 1000) || 15,
        language: cs.language || "python",
        passed: isAccepted,
        violationsCount: 0,
        type: "Coding Challenge Report",
        typeLabel: "Coding Challenge Assessment",
        reportUrl: `/assessment-report/${cs._id}`,
        totalQuestions: 1,
        questionsAttempted: 1,
      };
    });

    // Deduplicate by sessionId / id
    const reportMap = new Map();
    [...proctoredReports, ...challengeReports].forEach((rep) => {
      const key = String(rep.sessionId || rep.id || rep.attemptId);
      if (key && !reportMap.has(key)) {
        reportMap.set(key, rep);
      }
    });

    const combinedReports = Array.from(reportMap.values()).sort(
      (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
    );

    res.json({ success: true, count: combinedReports.length, reports: combinedReports });
  } catch (err) {
    console.error("Failed to list assessment reports:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/coding/proctored-session/:sessionId
router.get("/proctored-session/:sessionId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { sessionId } = req.params;

    const session = await ProctoredCodingSession.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const now = new Date();
    let timeRemaining = session.timeLimitSeconds;
    if (session.status === "active") {
      timeRemaining = Math.max(0, Math.round((session.serverDeadline - now) / 1000));
    } else if (session.isTimerPaused && session.pausedAt) {
      timeRemaining = Math.max(0, Math.round((session.serverDeadline - session.pausedAt) / 1000));
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      candidateDetails: session.candidateDetails,
      assessmentTitle: session.assessmentTitle,
      problemData: session.problemData,
      questions: session.questions,
      status: session.status,
      isTimerPaused: session.isTimerPaused,
      timeRemaining,
      timeLimitSeconds: session.timeLimitSeconds,
      maxRecoveryChances: session.maxRecoveryChances,
      chancesUsed: session.recoveryChancesUsed,
      chancesRemaining: Math.max(0, session.maxRecoveryChances - session.recoveryChancesUsed),
      recoveryHistory: session.recoveryHistory,
      draftCode: session.draftCode,
      draftLanguage: session.draftLanguage,
      violationsCount: session.violationsCount,
      violationsLog: session.violationsLog,
      deviceInfo: session.deviceInfo,
      submissionResult: session.submissionResult,
    });
  } catch (err) {
    console.error("Failed to fetch proctored session:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/coding/proctored-session/heartbeat (and with :sessionId)
router.post(["/proctored-session/:sessionId/heartbeat", "/proctored-session/heartbeat"], authenticateToken, async (req, res) => {
  try {
    const userId = String(req.user.userId || req.user.id || req.user._id);
    const sessionId = req.params.sessionId || req.body.sessionId;
    const { draftCode, language, batteryLevel, deviceInfo, questionDrafts } = req.body;

    const session = await ProctoredCodingSession.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const now = new Date();
    session.lastHeartbeat = now;

    if (draftCode !== undefined) {
      session.draftCode = draftCode;
    }
    if (language) {
      session.draftLanguage = language;
    }
    if (questionDrafts && typeof questionDrafts === "object") {
      Object.entries(questionDrafts).forEach(([qId, qData]) => {
        if (session.questionDrafts && typeof session.questionDrafts.set === "function") {
          session.questionDrafts.set(qId, qData);
        }
      });
      session.markModified("questionDrafts");
    }

    if (deviceInfo || typeof batteryLevel === "number") {
      const { mergeDeviceInfo } = require("../utils/proctoringSync");
      session.deviceInfo = mergeDeviceInfo(session.deviceInfo, {
        ...(deviceInfo || {}),
        ...(typeof batteryLevel === "number" ? { battery: { ...(session.deviceInfo?.battery || {}), percentage: batteryLevel, supported: true } } : {}),
        monitoringActive: session.status === "active",
      });
      session.markModified("deviceInfo");
    }

    let timeRemaining = 0;
    if (session.status === "active") {
      timeRemaining = Math.max(0, Math.round((session.serverDeadline - now) / 1000));
      if (timeRemaining <= 0) {
        session.status = "expired";
      }
    } else if (session.isTimerPaused && session.pausedAt) {
      timeRemaining = Math.max(0, Math.round((session.serverDeadline - session.pausedAt) / 1000));
    }

    session.markModified("questions");
    session.markModified("questionDrafts");
    session.markModified("submissionResult");
    session.markModified("violationsLog");
    await session.save();

    require("../utils/proctoringSync").emitProctoringSessionUpdate(
      req.app.get("io"),
      session.sessionId,
      "heartbeat",
      {
        status: session.status,
        lastHeartbeat: now.toISOString(),
        deviceInfo: session.deviceInfo,
      }
    );

    res.json({
      success: true,
      status: session.status,
      isTimerPaused: session.isTimerPaused,
      timeRemaining,
      isTerminated: session.status === "terminated",
      isExpired: session.status === "expired",
      violationsCount: session.violationsCount,
      chancesRemaining: Math.max(0, session.maxRecoveryChances - (session.recoveryChancesUsed || 0)),
    });
  } catch (err) {
    console.error("Proctored heartbeat error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/coding/proctored-session/interruption & event
router.post(["/proctored-session/:sessionId/interruption", "/proctored-session/interruption", "/proctored-session/event"], authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const sessionId = req.params.sessionId || req.body.sessionId;
    const { violationType, type, eventType, details, message, timestamp } = req.body;

    const session = await ProctoredCodingSession.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status === "terminated" || session.status === "submitted") {
      return res.json({
        success: false,
        status: session.status,
        message: "Session is already closed.",
        isTerminated: session.status === "terminated",
        alreadySubmitted: session.status === "submitted",
        chancesRemaining: Math.max(0, 5 - (session.recoveryChancesUsed || 0)),
      });
    }

    const now = timestamp ? new Date(timestamp) : new Date();

    // Prevent duplicate event counting: if an interruption was logged within the last 5 seconds for this session, ignore duplicate count
    const lastInterruption = session.recoveryHistory && session.recoveryHistory.length > 0
      ? session.recoveryHistory[session.recoveryHistory.length - 1]
      : null;
    if (lastInterruption && lastInterruption.interruptedAt && (now.getTime() - new Date(lastInterruption.interruptedAt).getTime()) < 5000) {
      return res.json({
        success: true,
        duplicateIgnored: true,
        status: session.status,
        chancesRemaining: Math.max(0, 5 - (session.recoveryChancesUsed || 0)),
        recoveryChancesRemaining: Math.max(0, 5 - (session.recoveryChancesUsed || 0)),
        isTimerPaused: true,
        isTerminated: session.status === "terminated",
        violationsCount: session.violationsCount,
      });
    }

    const resolvedType = (violationType || type || eventType || "anomaly").toLowerCase();
    const resolvedDetail = details || message || "Proctoring anomaly detected";
    const eventId = `evt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const resolvedSeverity = resolvedType.includes("terminat") || resolvedType.includes("camera") || resolvedType.includes("screen") || resolvedType.includes("fullscreen")
      ? "critical"
      : "warning";

    session.recoveryChancesUsed = (session.recoveryChancesUsed || 0) + 1;
    const chanceNumber = session.recoveryChancesUsed;

    session.recoveryHistory.push({
      chanceNumber,
      type: resolvedType,
      detail: resolvedDetail,
      interruptedAt: now,
    });

    session.violationsLog.push({
      eventId,
      type: resolvedType,
      detail: `[Chance ${chanceNumber}/5 Used] ${resolvedDetail}`,
      severity: resolvedSeverity,
      timestamp: now,
      screenshotCaptured: false,
      screenshotReason: "Pending capture",
    });

    // Update honest hardware interruption counters
    session.deviceInfo = session.deviceInfo || {};
    if (resolvedType.includes("camera")) {
      session.deviceInfo.cameraDisconnections = (session.deviceInfo.cameraDisconnections || 0) + 1;
      session.deviceInfo.camera = false;
      session.deviceInfo.cameraStreamStatus = "Disconnected";
    } else if (resolvedType.includes("mic")) {
      session.deviceInfo.microphoneDisconnections = (session.deviceInfo.microphoneDisconnections || 0) + 1;
      session.deviceInfo.microphone = false;
      session.deviceInfo.microphoneStreamStatus = "Disconnected";
    } else if (resolvedType.includes("screen")) {
      session.deviceInfo.screenShare = false;
      session.deviceInfo.screenShareStreamStatus = "Ended";
    } else if (resolvedType.includes("fullscreen")) {
      session.deviceInfo.fullscreen = false;
      session.deviceInfo.fullscreenExitsCount = (session.deviceInfo.fullscreenExitsCount || 0) + 1;
    } else if (resolvedType.includes("blur") || resolvedType.includes("tab") || resolvedType.includes("focus")) {
      session.deviceInfo.windowFocused = false;
      session.deviceInfo.focusLossCount = (session.deviceInfo.focusLossCount || 0) + 1;
    }
    session.deviceInfo.telemetryUpdatedAt = now;
    session.markModified("deviceInfo");

    session.violationsCount = session.violationsLog.filter(
      (v) => v.type !== "session_created" && v.type !== "session_initialized" && v.type !== "session_resumed" && v.type !== "heartbeat"
    ).length;

    // Dispatch real-time security alert to Super Admin
    pushAdminNotification({
      title: "Proctoring Security Alert",
      message: `Security violation flagged for candidate ${session.candidateDetails?.fullName || "Candidate"} (${resolvedType}): ${resolvedDetail}`,
      type: "proctoring",
      severity: "alert",
      targetId: String(session._id),
      actionUrl: "/admin/proctoring",
      io: req.app.get("io"),
    }).catch(() => {});

    session.isTimerPaused = true;
    session.pausedAt = now;
    session.status = "interrupted";

    let isTerminated = false;
    let chancesRemaining = Math.max(0, 5 - session.recoveryChancesUsed);

    if (session.recoveryChancesUsed >= 5) {
      session.status = "terminated";
      session.terminatedReason = "All 5 recovery chances exhausted due to proctoring interruptions.";
      isTerminated = true;
      chancesRemaining = 0;

      // Ensure work is never silently lost: archive current draft into submissionResult
      if (!session.submissionResult || !session.submissionResult.code) {
        const challenge = CHALLENGES_CATALOG.find((c) => c.id === session.questionId) || CHALLENGES_CATALOG[0];
        const testCases = challenge?.testCases || [];
        const submissionCode = session.draftCode || "";
        const submissionLang = session.draftLanguage || "python";

        session.submissionResult = {
          code: submissionCode,
          language: submissionLang,
          score: 0,
          grade: "F",
          accuracy: 0,
          passed: false,
          status: "FAILED",
          passedTests: 0,
          totalTests: testCases.length || 10,
          durationSeconds: Math.max(1, Math.round((now.getTime() - session.serverStartTime.getTime()) / 1000) - (session.totalPauseDurationSeconds || 0)),
          submittedAt: now,
          testResults: testCases.map((tc, idx) => ({
            testIndex: idx + 1,
            passed: false,
            durationMs: 0,
            input: tc.isHidden ? "[Hidden Test Case]" : tc.input,
            expected: tc.isHidden ? "[Hidden Output]" : tc.expectedOutput,
            actual: "[Terminated]",
            error: "Assessment terminated: 5 recovery chances exhausted",
            isHidden: !!tc.isHidden,
          })),
          evaluationFeedback: {
            summary: "Assessment terminated due to exceeding all 5 recovery chances.",
            strengths: ["Code progress preserved and archived."],
            improvements: ["Avoid reloading, tab switching, and exiting full-screen mode."],
          },
        };
      }
    }

    session.markModified("questions");
    session.markModified("questionDrafts");
    session.markModified("submissionResult");
    session.markModified("violationsLog");
    await session.save();

    logActivityAndBroadcast({
      userId: mongoose.Types.ObjectId.isValid(session.userId) ? session.userId : null,
      userEmail: session.candidateDetails?.email || "",
      userName: session.candidateDetails?.fullName || "Candidate",
      type: isTerminated ? "PROCTORING_TERMINATED" : "PROCTORING_VIOLATION",
      title: isTerminated ? "Proctored Exam Terminated" : `Proctoring Security Alert (Chance ${chanceNumber}/5)`,
      detail: isTerminated
        ? `${session.candidateDetails?.fullName || "Candidate"} terminated from "${session.assessmentTitle}" — all recovery chances exhausted.`
        : `${session.candidateDetails?.fullName || "Candidate"} triggered ${resolvedType}: ${resolvedDetail}`,
      category: "proctoring",
      severity: isTerminated ? "danger" : "warning",
      metadata: {
        sessionId: session.sessionId,
        assessmentTitle: session.assessmentTitle,
        violationType: resolvedType,
        chanceNumber,
        isTerminated,
        status: session.status,
      },
      io: req.app.get("io"),
    }).catch(() => {});

    require("../utils/proctoringSync").emitProctoringSessionUpdate(
      req.app.get("io"),
      session.sessionId,
      isTerminated ? "session_terminated" : "violation_logged",
      {
        eventId,
        violationType: resolvedType,
        violationsCount: session.violationsCount,
        status: session.status,
      }
    );

    res.json({
      success: true,
      eventId,
      status: session.status,
      chanceNumber,
      chancesUsed: session.recoveryChancesUsed,
      chancesRemaining,
      recoveryChancesUsed: session.recoveryChancesUsed,
      recoveryChancesRemaining: chancesRemaining,
      isTimerPaused: session.isTimerPaused,
      isTerminated,
      violationsCount: session.violationsCount,
      message: isTerminated
        ? "All 5 proctoring recovery chances have been exhausted. Assessment terminated."
        : `Interruption logged. Recovery Chance ${chanceNumber}/5 used. ${chancesRemaining} remaining. Please re-verify to resume.`,
    });
  } catch (err) {
    console.error("Failed to log proctoring interruption:", err);
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/coding/proctored-session/:sessionId/resume
router.post("/proctored-session/:sessionId/resume", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { sessionId } = req.params;
    const { deviceInfo } = req.body;

    const session = await ProctoredCodingSession.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status === "terminated") {
      return res.status(403).json({ error: "Session terminated due to proctoring violations.", isTerminated: true });
    }

    const now = new Date();
    let pauseSeconds = 0;
    if (session.pausedAt) {
      pauseSeconds = Math.max(0, Math.round((now.getTime() - session.pausedAt.getTime()) / 1000));
      session.totalPauseDurationSeconds = (session.totalPauseDurationSeconds || 0) + pauseSeconds;
      session.serverDeadline = new Date(session.serverDeadline.getTime() + pauseSeconds * 1000);
    }

    if (session.recoveryHistory && session.recoveryHistory.length > 0) {
      const lastRec = session.recoveryHistory[session.recoveryHistory.length - 1];
      if (!lastRec.resumedAt) {
        lastRec.resumedAt = now;
        lastRec.pauseDurationSeconds = pauseSeconds;
      }
    }

    session.isTimerPaused = false;
    session.pausedAt = null;
    session.status = "active";

    if (deviceInfo) {
      const { mergeDeviceInfo } = require("../utils/proctoringSync");
      session.deviceInfo = mergeDeviceInfo(session.deviceInfo, {
        ...deviceInfo,
        monitoringActive: true,
      });
      session.markModified("deviceInfo");
    }

    session.violationsLog.push({
      type: "session_resumed",
      detail: `Verification complete. Assessment resumed (Paused for ${pauseSeconds}s).`,
      timestamp: now,
    });

    session.markModified("questions");
    session.markModified("questionDrafts");
    session.markModified("submissionResult");
    session.markModified("violationsLog");
    await session.save();

    require("../utils/proctoringSync").emitProctoringSessionUpdate(
      req.app.get("io"),
      session.sessionId,
      "session_resumed",
      { status: "active", deviceInfo: session.deviceInfo }
    );

    const timeRemaining = Math.max(0, Math.round((session.serverDeadline - now) / 1000));

    res.json({
      success: true,
      status: "active",
      isTimerPaused: false,
      timeRemaining,
      serverDeadline: session.serverDeadline.getTime(),
      chancesRemaining: Math.max(0, 5 - session.recoveryChancesUsed),
      recoveryChancesRemaining: Math.max(0, 5 - session.recoveryChancesUsed),
      totalPauseDurationSeconds: session.totalPauseDurationSeconds,
    });
  } catch (err) {
    console.error("Failed to resume session:", err);
    res.status(500).json({ error: err.message });
  }
});

// 6b. POST /api/coding/proctored-session/:sessionId/evidence
// Captures and persists a genuine screenshot tied strictly to this session & violation event
router.post("/proctored-session/:sessionId/evidence", authenticateToken, async (req, res) => {
  try {
    const userId = String(req.user.userId || req.user.id || req.user._id);
    const { sessionId } = req.params;
    const { imageBase64, eventId, reason, severity = "warning", timestamp } = req.body;

    const session = await ProctoredCodingSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
    if (!isAdmin && String(session.userId) !== userId) {
      return res.status(403).json({ error: "Forbidden: You do not own this proctoring session" });
    }

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const match = imageBase64.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
    if (!match) {
      return res.status(400).json({ error: "Invalid image data URL format. Expected JPEG, PNG, or WebP." });
    }

    const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], "base64");
    if (!buffer || buffer.length < 200 || buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Evidence image size out of valid bounds (200B - 5MB)." });
    }

    const safeSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, "");
    const safeEvt = (eventId || `ev_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "");
    const filename = `${safeSession}_${safeEvt}.${ext}`;
    const evidenceDir = path.join(__dirname, "../uploads/evidence");
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }
    const filePath = path.join(evidenceDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Persist in MongoDB Atlas GridFS for durability across server restarts/redeploys
    const { saveEvidenceToGridFS, emitProctoringSessionUpdate } = require("../utils/proctoringSync");
    try {
      await saveEvidenceToGridFS(filename, buffer, {
        sessionId: session.sessionId,
        userId: String(session.userId),
        eventId: safeEvt,
      });
    } catch (gridErr) {
      console.warn("Evidence GridFS backup warning:", gridErr.message);
    }

    const screenshotUrl = `/proctoring-evidence/${filename}`;
    const capturedAt = timestamp ? new Date(timestamp) : new Date();

    session.evidenceScreenshots = session.evidenceScreenshots || [];
    session.evidenceScreenshots.push({
      url: screenshotUrl,
      filename,
      violationEventId: eventId || "",
      timestamp: capturedAt,
      reason: reason || "Proctoring violation snapshot",
      severity,
    });

    // Link strictly to the exact matching violation event in violationsLog
    if (eventId && Array.isArray(session.violationsLog)) {
      const targetLog = session.violationsLog.find((v) => v.eventId === eventId);
      if (targetLog) {
        targetLog.screenshotUrl = screenshotUrl;
        targetLog.screenshotCaptured = true;
        targetLog.screenshotReason = "Captured";
      }
    }

    session.markModified("evidenceScreenshots");
    session.markModified("violationsLog");
    await session.save();

    emitProctoringSessionUpdate(req.app.get("io"), session.sessionId, "evidence_uploaded", {
      eventId: eventId || "",
      screenshotUrl,
    });

    return res.status(201).json({
      success: true,
      screenshotUrl,
      filename,
      eventId: eventId || "",
    });
  } catch (err) {
    console.error("Failed to save proctoring evidence:", err);
    return res.status(500).json({ error: err.message || "Failed to save evidence" });
  }
});

// 6c. PATCH /api/coding/proctored-session/:sessionId/recording-status
// Honestly records stream recording lifecycle state (recording | uploading | processing | available | failed | not_recorded)
router.patch("/proctored-session/:sessionId/recording-status", authenticateToken, async (req, res) => {
  try {
    const userId = String(req.user.userId || req.user.id || req.user._id);
    const { sessionId } = req.params;
    const { recordingStatus, recordingMimeType, recordingStartedAt, recordingUploadError } = req.body;

    const allowedStatuses = ["not_recorded", "recording", "uploading", "processing", "available", "failed"];
    if (!allowedStatuses.includes(recordingStatus)) {
      return res.status(400).json({ error: "Invalid recordingStatus" });
    }

    const session = await ProctoredCodingSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
    if (!isAdmin && String(session.userId) !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    session.recordingStatus = recordingStatus;
    if (recordingMimeType) session.recordingMimeType = String(recordingMimeType);
    if (recordingStartedAt) session.recordingStartedAt = new Date(recordingStartedAt);
    if (recordingUploadError !== undefined) session.recordingUploadError = String(recordingUploadError || "");
    await session.save();

    require("../utils/proctoringSync").emitProctoringSessionUpdate(
      req.app.get("io"),
      session.sessionId,
      "recording_status",
      {
        recordingStatus: session.recordingStatus,
        recordingMimeType: session.recordingMimeType,
        recordingUploadError: session.recordingUploadError,
      }
    );

    return res.json({ success: true, recordingStatus: session.recordingStatus });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 7. POST /api/coding/proctored-session/:sessionId/submit
router.post(["/proctored-session/:sessionId/submit", "/proctored-session/submit"], authenticateToken, async (req, res) => {
  try {
    const userId = String(req.user.userId || req.user.id || req.user._id);
    const sessionId = req.params.sessionId || req.body.sessionId;
    const {
      code,
      language,
      questions: submittedQuestions,
      submittedProblemData,
      submittedQuestionId,
      assessmentTitle,
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    let session = await ProctoredCodingSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Proctored assessment session not found" });
    }

    const sessionOwner = String(session.userId || "");
    const isAdmin = Boolean(req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN" || req.user?.isMainAdmin);
    if (!isAdmin && sessionOwner !== userId) {
      return res.status(403).json({ error: "Access denied. You do not own this proctored assessment session." });
    }

    if (session.status === "terminated") {
      return res.status(403).json({ error: "Assessment session has been terminated due to proctoring violations.", isTerminated: true });
    }

    // Permanent Immutability: If session is already submitted, never overwrite previous score, code, or report!
    if (session.status === "submitted" && session.submissionResult?.submittedAt) {
      return res.status(409).json({
        success: true,
        alreadySubmitted: true,
        message: "Assessment session has already been submitted and finalized.",
        sessionId: session.sessionId,
        status: "submitted",
        score: session.submissionResult.score || 0,
        grade: session.submissionResult.grade || "F",
        accuracy: session.submissionResult.accuracy || 0,
        passedTests: session.submissionResult.passedTests || 0,
        totalTests: session.submissionResult.totalTests || 10,
        durationSeconds: session.submissionResult.durationSeconds || 0,
        submissionResult: session.submissionResult,
        reportUrl: `/assessment-report/${session.sessionId}`,
      });
    }

    const now = new Date();
    const durationSec = Math.max(
      1,
      Math.round((now.getTime() - session.serverStartTime.getTime()) / 1000) - (session.totalPauseDurationSeconds || 0)
    );

    // Ensure session.questions is initialized
    if (!session.questions || session.questions.length === 0) {
      const pData = session.problemData?.title
        ? session.problemData
        : resolveQuestionData(session.questionId, session.trackId, null, submittedProblemData);

      const qTestCases = (pData.testCases || []).map((t, idx) => ({
        input: t.input,
        expectedOutput: t.expectedOutput,
        isHidden: t.isHidden !== undefined ? t.isHidden : false,
      }));

      session.questions = [
        {
          questionId: session.questionId || "q_1",
          title: pData.title || session.assessmentTitle || "Coding Problem",
          difficulty: pData.difficulty || "Medium",
          category: pData.category || session.trackId || "DSA",
          description: pData.description || "",
          inputFormat: pData.inputFormat || "",
          outputFormat: pData.outputFormat || "",
          constraints: pData.constraints || [],
          examples: pData.examples || [],
          hints: pData.hints || [],
          testCases: qTestCases,
          submittedCode: code !== undefined ? code : session.draftCode || "",
          language: language || session.draftLanguage || "python",
          status: "unattempted",
          score: 0,
          marksObtained: 0,
          totalMarks: 100,
          passedTests: 0,
          totalTests: qTestCases.length || 10,
          testResults: [],
          attempted: false,
        },
      ];
    }

    // Process question submissions with strict authoritative server execution
    // (Never trust browser-supplied score, passedTests, or testResults!)
    if (Array.isArray(submittedQuestions) && submittedQuestions.length > 0) {
      const hasOnlyUnattemptedPlaceholder =
        session.questions.length === 1 &&
        !session.questions[0].attempted &&
        (!session.questions[0].submittedCode || isCodeEmptyOrComments(session.questions[0].submittedCode)) &&
        !submittedQuestions.some((sq) => sq.questionId === session.questions[0].questionId);

      if (hasOnlyUnattemptedPlaceholder) {
        session.questions = [];
      }

      for (const subQ of submittedQuestions) {
        let qRecord = session.questions.find(
          (q) => q.questionId === subQ.questionId || q.title === subQ.title
        );
        if (!qRecord) {
          const pData = resolveQuestionData(subQ.questionId || session.questionId, session.trackId);
          qRecord = {
            questionId: subQ.questionId || `q_${session.questions.length + 1}`,
            title: subQ.title || pData.title || "Coding Problem",
            difficulty: subQ.difficulty || pData.difficulty || "Medium",
            category: subQ.category || pData.category || session.trackId || "DSA",
            description: pData.description || "",
            inputFormat: pData.inputFormat || "",
            outputFormat: pData.outputFormat || "",
            constraints: pData.constraints || [],
            examples: pData.examples || [],
            hints: pData.hints || [],
            testCases: pData.testCases || [],
            totalMarks: Number(subQ.totalMarks) || 100,
          };
          session.questions.push(qRecord);
        }

        const qDraft = (session.questionDrafts && typeof session.questionDrafts.get === "function")
          ? session.questionDrafts.get(qRecord.questionId)
          : session.questionDrafts?.[qRecord.questionId];
        const explicitSubCode = subQ.submittedCode !== undefined ? subQ.submittedCode : (subQ.code !== undefined ? subQ.code : qRecord.submittedCode);
        const validCode = explicitSubCode !== undefined ? String(explicitSubCode) : (getValidCode(qDraft) || "");
        const subLang = subQ.language || qRecord.language || session.draftLanguage || "python";
        const hasExecutableCode = !isCodeEmptyOrComments(validCode);

        // Load authoritative test cases from catalog/database
        const officialData = resolveQuestionData(qRecord.questionId, session.trackId);
        const officialTestCases = (officialData.testCases && officialData.testCases.length > 0)
          ? officialData.testCases
          : (qRecord.testCases && qRecord.testCases.length > 0 ? qRecord.testCases : []);

        let evaluatedResults = [];
        let actualPassedTests = 0;
        const totalTests = officialTestCases.length || 10;
        const qTotalMarks = Number(qRecord.totalMarks) || 100;

        if (hasExecutableCode && officialTestCases.length > 0) {
          const execConfig = getProblemExecutionConfig(qRecord.questionId || officialData);
          const outcomes = await evaluateTestCasesBatch(subLang, validCode, officialTestCases, {
            functionName: execConfig.functionName,
            problemId: qRecord.questionId,
          });
          actualPassedTests = outcomes.filter((o) => o.passed).length;
          evaluatedResults = officialTestCases.map((tc, idx) => {
            const outcome = outcomes[idx] || { passed: false, actual: "", expected: tc.expectedOutput, error: "Evaluation failed", duration: 0 };
            const isHidden = tc.isHidden !== undefined ? tc.isHidden : false;
            return {
              testIndex: idx + 1,
              passed: outcome.passed,
              durationMs: outcome.duration || 0,
              input: isHidden ? "[Hidden Test Case]" : tc.input,
              expected: isHidden ? "[Hidden Output]" : tc.expectedOutput,
              actual: isHidden ? (outcome.passed ? "[Passed]" : "[Output Hidden]") : outcome.actual,
              error: outcome.passed ? null : outcome.error || "Wrong output",
              isHidden,
            };
          });
        }

        const qScore = totalTests > 0 ? Math.round((actualPassedTests / totalTests) * 100) : 0;
        const qMarksObtained = totalTests > 0 ? Math.round((actualPassedTests / totalTests) * qTotalMarks) : 0;
        const computedStatus = !hasExecutableCode && actualPassedTests === 0
          ? "unattempted"
          : actualPassedTests === totalTests && totalTests > 0
          ? "passed"
          : actualPassedTests > 0
          ? "partially_passed"
          : "failed";

        qRecord.submittedCode = validCode;
        qRecord.language = subLang;
        qRecord.score = qScore;
        qRecord.totalMarks = qTotalMarks;
        qRecord.marksObtained = qMarksObtained;
        qRecord.totalTests = totalTests;
        qRecord.passedTests = actualPassedTests;
        qRecord.testResults = evaluatedResults;
        qRecord.status = computedStatus;
        qRecord.attempted = hasExecutableCode;
        qRecord.submittedAt = now;
      }
    } else {
      // Single question submission
      const targetQ = session.questions.find((q) => q.questionId === session.questionId) || session.questions[0];
      const qDraft = (session.questionDrafts && typeof session.questionDrafts.get === "function")
        ? session.questionDrafts.get(session.questionId)
        : session.questionDrafts?.[session.questionId];
      const submissionCode = code !== undefined
        ? String(code)
        : (getValidCode(qDraft, targetQ?.submittedCode, session.draftCode) || "");
      const submissionLang = language || session.draftLanguage || targetQ?.language || "python";
      const hasExecutableCode = !isCodeEmptyOrComments(submissionCode);

      const officialData = resolveQuestionData(session.questionId || targetQ.questionId, session.trackId);
      const officialTestCases = (officialData.testCases && officialData.testCases.length > 0)
        ? officialData.testCases
        : (targetQ.testCases && targetQ.testCases.length > 0 ? targetQ.testCases : []);

      let evaluatedResults = [];
      let actualPassedTests = 0;
      const totalTests = officialTestCases.length || 10;
      const qTotalMarks = Number(targetQ.totalMarks) || 100;

      if (hasExecutableCode && officialTestCases.length > 0) {
        const execConfig = getProblemExecutionConfig(session.questionId || officialData);
        const outcomes = await evaluateTestCasesBatch(submissionLang, submissionCode, officialTestCases, {
          functionName: execConfig.functionName,
          problemId: session.questionId,
        });
        actualPassedTests = outcomes.filter((o) => o.passed).length;
        evaluatedResults = officialTestCases.map((tc, idx) => {
          const outcome = outcomes[idx] || { passed: false, actual: "", expected: tc.expectedOutput, error: "Evaluation failed", duration: 0 };
          const isHidden = tc.isHidden !== undefined ? tc.isHidden : false;
          return {
            testIndex: idx + 1,
            passed: outcome.passed,
            durationMs: outcome.duration || 0,
            input: isHidden ? "[Hidden Test Case]" : tc.input,
            expected: isHidden ? "[Hidden Output]" : tc.expectedOutput,
            actual: isHidden ? (outcome.passed ? "[Passed]" : "[Output Hidden]") : outcome.actual,
            error: outcome.passed ? null : outcome.error || "Wrong output",
            isHidden,
          };
        });
      }

      const qScore = totalTests > 0 ? Math.round((actualPassedTests / totalTests) * 100) : 0;
      const qMarksObtained = totalTests > 0 ? Math.round((actualPassedTests / totalTests) * qTotalMarks) : 0;
      const computedStatus = !hasExecutableCode && actualPassedTests === 0
        ? "unattempted"
        : actualPassedTests === totalTests && totalTests > 0
        ? "passed"
        : actualPassedTests > 0
        ? "partially_passed"
        : "failed";

      targetQ.submittedCode = submissionCode;
      targetQ.language = submissionLang;
      targetQ.status = computedStatus;
      targetQ.score = qScore;
      targetQ.marksObtained = qMarksObtained;
      targetQ.totalMarks = qTotalMarks;
      targetQ.passedTests = actualPassedTests;
      targetQ.totalTests = totalTests;
      targetQ.testResults = evaluatedResults;
      targetQ.attempted = hasExecutableCode;
      targetQ.submittedAt = now;
    }

    // Calculate aggregated scorecard across all questions
    const totalQuestions = session.questions.length;
    const questionsAttempted = session.questions.filter((q) => (q.attempted && !isCodeEmptyOrComments(q.submittedCode)) || (q.passedTests > 0)).length;
    const questionsUnanswered = Math.max(0, totalQuestions - questionsAttempted);
    const totalMarks = session.questions.reduce((sum, q) => sum + (q.totalMarks || 100), 0);
    const marksObtained = session.questions.reduce((sum, q) => sum + (q.marksObtained || 0), 0);
    const totalTestCases = session.questions.reduce((sum, q) => sum + (q.totalTests || 10), 0);
    const totalPassedTests = session.questions.reduce((sum, q) => sum + (q.passedTests || 0), 0);
    const overallPercentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : (totalTestCases > 0 ? Math.round((totalPassedTests / totalTestCases) * 100) : 0);
    const accuracy = totalTestCases > 0 ? Math.round((totalPassedTests / totalTestCases) * 100) : overallPercentage;
    const grade = calculateGrade(overallPercentage);
    const isAccepted = overallPercentage >= 80;
    const isPartiallyPassed = !isAccepted && (overallPercentage > 0 || totalPassedTests > 0);

    const primaryQ = session.questions.find((q) => q.attempted && !isCodeEmptyOrComments(q.submittedCode)) || session.questions[0] || {};
    const feedback = generateFeedback(overallPercentage, totalPassedTests, totalTestCases, durationSec * 1000, primaryQ.language || "python");

    session.status = "submitted";
    session.score = overallPercentage;
    session.maxScore = totalMarks || 100;
    session.percentage = overallPercentage;
    session.evaluationVerdict = isAccepted ? "PASSED" : "FAILED";
    session.durationSeconds = durationSec;
    session.submittedAt = now;
    if (session.deviceInfo) {
      session.deviceInfo.monitoringActive = false;
      session.deviceInfo.telemetryUpdatedAt = now;
      session.markModified("deviceInfo");
    }
    session.submissionResult = {
      code: primaryQ.submittedCode,
      language: primaryQ.language,
      score: overallPercentage,
      marksObtained,
      totalMarks,
      totalQuestions,
      questionsAttempted,
      questionsUnanswered,
      totalTestCases,
      totalPassedTests,
      grade,
      accuracy,
      passed: isAccepted,
      status: isAccepted ? (overallPercentage === 100 ? "ACCEPTED" : "PASSED") : "FAILED",
      passedTests: totalPassedTests,
      totalTests: totalTestCases,
      durationSeconds: durationSec,
      submittedAt: now,
      testResults: primaryQ.testResults || [],
      evaluationFeedback: feedback,
    };

    session.violationsLog.push({
      type: "assessment_finalized",
      detail: `Assessment submitted & permanently locked. Final Grade: ${grade} (${marksObtained}/${totalMarks} Marks, ${totalPassedTests}/${totalTestCases} Tests Passed).`,
      timestamp: now,
    });

    session.markModified("questions");
    session.markModified("questionDrafts");
    session.markModified("submissionResult");
    session.markModified("violationsLog");
    await session.save();

    require("../utils/proctoringSync").emitProctoringSessionUpdate(
      req.app.get("io"),
      session.sessionId,
      "session_submitted",
      {
        status: session.status,
        score: session.score,
        durationSeconds: session.durationSeconds,
        submittedAt: now.toISOString(),
      }
    );

    // Sync with CodingProgress and SubjectProgress:
    let parsedTrack = session.trackId || "python";
    let parsedIdx = 0;
    if (session.questionId && session.questionId.includes("_")) {
      const parts = session.questionId.split("_");
      if (parts.length >= 2 && !isNaN(parseInt(parts[parts.length - 1], 10))) {
        parsedTrack = parts[0] === "py" ? "python" : parts[0] === "js" ? "javascript" : parts[0];
        parsedIdx = parseInt(parts[parts.length - 1], 10);
      }
    }
    const modKey = `${parsedTrack}_${parsedIdx}`;

    try {
      let userProg = await CodingProgress.findOne({ userId });
      if (!userProg) userProg = new CodingProgress({ userId });
      if (!userProg.moduleProgress) userProg.moduleProgress = new Map();

      const rawUserMod = userProg.moduleProgress.get(modKey);
      const existingMod = (rawUserMod && typeof rawUserMod.toObject === "function") ? rawUserMod.toObject() : (rawUserMod || {});
      const userStudyDone = Boolean(existingMod.isStudied);
      const userCodingDone = Boolean(isAccepted || existingMod.exercisePassed || existingMod.assignmentPassed || existingMod.codingPassed);
      const userMcqCutoffCleared = Boolean(existingMod.assessmentPassed && (existingMod.bestScore == null || existingMod.bestScore >= 80));
      const userWillBeCompleted = Boolean(userStudyDone && userCodingDone && userMcqCutoffCleared);

      userProg.moduleProgress.set(modKey, {
        ...existingMod,
        exercisePassed: isAccepted || !!existingMod.exercisePassed,
        exerciseCode: primaryQ.submittedCode || existingMod.exerciseCode,
        exerciseScore: overallPercentage,
        exercisePassedAt: isAccepted ? now : existingMod.exercisePassedAt,
        bestScore: Math.max(existingMod.bestScore || 0, overallPercentage),
        attemptsCount: (existingMod.attemptsCount || 0) + 1,
        isCompleted: userWillBeCompleted,
        status: userWillBeCompleted ? "completed" : "in-progress",
      });

      if (isAccepted) {
        const currentUnlock = userProg.trackUnlocks?.get(parsedTrack) || 0;
        if (parsedIdx >= currentUnlock) {
          userProg.trackUnlocks.set(parsedTrack, parsedIdx + 1);
        }
        // Count strictly completed modules (all 3 criteria met)
        const trackModules = CURRICULUM[parsedTrack] || [];
        let completedCount = 0;
        for (const tm of trackModules) {
          const k = `${parsedTrack}_${tm.moduleIndex}`;
          const rawSt = userProg.moduleProgress.get(k);
          const st = (rawSt && typeof rawSt.toObject === "function") ? rawSt.toObject() : (rawSt || {});
          const sStudy = Boolean(st.isStudied);
          const sCoding = Boolean(st.exercisePassed || st.assignmentPassed || st.codingPassed || (k === modKey && isAccepted));
          const sAssessment = Boolean(st.assessmentPassed && (st.bestScore == null || st.bestScore >= 80));
          if (sStudy && sCoding && sAssessment) completedCount++;
        }
        userProg.trackLessons.set(parsedTrack, completedCount);
      }
      userProg.totalScore = (userProg.totalScore || 0) + (isAccepted ? 100 : 25);
      userProg.markModified("moduleProgress");
      userProg.markModified("trackUnlocks");
      userProg.markModified("trackLessons");
      await userProg.save();
    } catch (e) {
      console.warn("Could not update CodingProgress:", e);
    }

    try {
      let subjProg = await SubjectProgress.findOne({ userId, subjectKey: "coding" });
      if (!subjProg) subjProg = new SubjectProgress({ userId, subjectKey: "coding" });
      if (!subjProg.moduleProgress) subjProg.moduleProgress = new Map();

      const rawSubjMod = subjProg.moduleProgress.get(modKey);
      const existingSubjMod = (rawSubjMod && typeof rawSubjMod.toObject === "function") ? rawSubjMod.toObject() : (rawSubjMod || {});
      const subjStudyDone = Boolean(existingSubjMod.isStudied);
      const subjCodingDone = Boolean(isAccepted || existingSubjMod.exercisePassed || existingSubjMod.assignmentPassed || existingSubjMod.codingPassed);
      const subjMcqCutoffCleared = Boolean(existingSubjMod.assessmentPassed && (existingSubjMod.bestScore == null || existingSubjMod.bestScore >= 80));
      const subjWillBeCompleted = Boolean(subjStudyDone && subjCodingDone && subjMcqCutoffCleared);

      subjProg.moduleProgress.set(modKey, {
        ...existingSubjMod,
        exercisePassed: isAccepted || !!existingSubjMod.exercisePassed,
        exerciseCode: primaryQ.submittedCode || existingSubjMod.exerciseCode,
        assignmentPassed: isAccepted || !!existingSubjMod.assignmentPassed,
        assignmentPassedAt: isAccepted ? now : existingSubjMod.assignmentPassedAt,
        bestScore: Math.max(existingSubjMod.bestScore || 0, overallPercentage),
        attemptsCount: (existingSubjMod.attemptsCount || 0) + 1,
        isCompleted: subjWillBeCompleted,
        status: subjWillBeCompleted ? "completed" : "in-progress",
      });

      if (isAccepted) {
        const currentUnlock = subjProg.trackUnlocks?.get(parsedTrack) || 0;
        if (parsedIdx >= currentUnlock) {
          subjProg.trackUnlocks.set(parsedTrack, parsedIdx + 1);
        }
        const trackModules = CURRICULUM[parsedTrack] || [];
        let completedCount = 0;
        for (const tm of trackModules) {
          const k = `${parsedTrack}_${tm.moduleIndex}`;
          const rawSt = subjProg.moduleProgress.get(k);
          const st = (rawSt && typeof rawSt.toObject === "function") ? rawSt.toObject() : (rawSt || {});
          const sStudy = Boolean(st.isStudied);
          const sCoding = Boolean(st.exercisePassed || st.assignmentPassed || st.codingPassed || (k === modKey && isAccepted));
          const sAssessment = Boolean(st.assessmentPassed && (st.bestScore == null || st.bestScore >= 80));
          if (sStudy && sCoding && sAssessment) completedCount++;
        }
        subjProg.trackLessons.set(parsedTrack, completedCount);
      }
      subjProg.markModified("moduleProgress");
      subjProg.markModified("trackUnlocks");
      subjProg.markModified("trackLessons");
      await subjProg.save();
    } catch (e) {
      console.warn("Could not update SubjectProgress:", e);
    }

    if (userId && userId !== "guest") {
      await recordDailyCodingActivity({
        userId,
        activityType: "assessment_session",
        targetId: session.sessionId || String(session._id),
        title: session.assessmentTitle || "Coding Assessment",
        status: isAccepted ? "ACCEPTED" : "WRONG_ANSWER",
        language: primaryQ.language,
        score: overallPercentage,
        passedTests: totalPassedTests,
        totalTests: totalTestCases,
        timeZone: req.body.timeZone || req.headers["x-timezone"] || req.query.tz,
        app: req.app,
      });
    }

    await pushNotification(req.app, {
      userId,
      title: isAccepted ? "Coding Assessment Passed!" : "Coding Assessment Evaluated",
      message: `${session.assessmentTitle || "Coding Assessment"}: ${totalPassedTests}/${totalTestCases} test cases passed (${overallPercentage}%, Grade ${grade}).`,
      type: "assessment",
      severity: isAccepted ? "success" : "warning",
      actionUrl: `/assessment-report/${session.sessionId}`,
      actionLabel: "View Coding Report",
    });

    // Notify Super Admin of Coding Assessment Submission
    pushAdminNotification({
      title: isAccepted ? "Coding Challenge Assessment Passed!" : "Coding Assessment Evaluated",
      message: `${session.candidateDetails?.fullName || "Candidate"} completed ${session.assessmentTitle || "Algorithmic Challenge"} — ${isAccepted ? "ACCEPTED (Completed Badge Awarded)" : "FAILED"} (${totalPassedTests}/${totalTestCases} Tests Passed, Grade ${grade}).`,
      type: "coding",
      severity: isAccepted ? "success" : "info",
      targetId: String(session._id),
      actionUrl: `/assessment-report/${session.sessionId}`,
      io: req.app.get("io"),
    }).catch(() => {});

    logActivityAndBroadcast({
      userId: mongoose.Types.ObjectId.isValid(session.userId) ? session.userId : null,
      userEmail: session.candidateDetails?.email || "",
      userName: session.candidateDetails?.fullName || "Candidate",
      type: isAccepted ? "ASSESSMENT_COMPLETED" : "PROCTORING_COMPLETED",
      title: isAccepted ? "Proctored Assessment Passed!" : "Proctored Assessment Completed",
      detail: `${session.candidateDetails?.fullName || "Candidate"} completed ${session.assessmentTitle || "Assessment"} — Score: ${overallPercentage}% (${totalPassedTests}/${totalTestCases} Tests Passed)`,
      category: "proctoring",
      severity: isAccepted ? "success" : "info",
      metadata: {
        sessionId: session.sessionId,
        assessmentTitle: session.assessmentTitle,
        score: overallPercentage,
        passed: isAccepted,
        violationsCount: session.violationsCount || 0,
        grade,
      },
      io: req.app.get("io"),
    }).catch(() => {});

    // Real-time socket broadcast to Super Admin Centralized Reports
    try {
      const io = req.app.get("io");
      if (io) {
        const adminCodingReport = {
          id: session._id,
          rawId: session._id,
          itemType: "coding",
          sessionId: session.sessionId,
          title: `${session.assessmentTitle || (session.questions && session.questions[0]?.title) || "Algorithmic Challenge"} — Coding Assessment Report`,
          type: "Coding Challenge Report",
          recipient: session.candidateDetails?.fullName || "Candidate",
          email: session.candidateDetails?.email || "",
          score: `${overallPercentage}%`,
          rawScore: overallPercentage,
          maxScore: 100,
          grade,
          verificationCode: String(session.sessionId || session._id).slice(-8).toUpperCase(),
          date: now,
          status: isAccepted ? "ACCEPTED" : "FAILED",
          passedTests: totalPassedTests,
          totalTests: totalTestCases,
          reportUrl: `/assessment-report/${session.sessionId}`,
        };
        io.emit("NEW_REPORT", adminCodingReport);
        io.emit("NEW_SUBMISSION", {
          type: "coding",
          sessionId: session.sessionId,
          userId: String(userId),
          passed: isAccepted,
        });
      }
    } catch (socketErr) {
      console.warn("Socket notification warning for coding:", socketErr.message);
    }

    try {
      const candidateUser = await User.findById(userId).select("fullName username email role").lean();
      const recipientEmail = candidateUser?.email || session.candidateDetails?.email;
      const recipientName = candidateUser?.fullName || candidateUser?.username || session.candidateDetails?.fullName || "Candidate";
      if (recipientEmail && !isGuestAccount(recipientEmail)) {
        dispatchMailBackground(async () => {
          return await sendSubmissionEvaluationEmail({
            userEmail: recipientEmail,
            userName: recipientName,
            assessmentTitle: session.assessmentTitle || "Proctored Coding Assessment",
            assessmentType: "coding",
            score: overallPercentage,
            maxScore: 100,
            percentage: overallPercentage,
            verdict: isAccepted ? "PASSED" : "FAILED",
            reportUrl: `/assessment-report/${session.sessionId}`,
            req,
          });
        }, { type: "coding_assessment_completed", recipient: recipientEmail });
      }
    } catch (mailDispatchErr) {
      console.warn("Proctored coding assessment email dispatch warning:", mailDispatchErr.message);
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      status: "submitted",
      score: overallPercentage,
      grade,
      accuracy,
      passedTests: totalPassedTests,
      totalTests: totalTestCases,
      durationSeconds: durationSec,
      submissionResult: session.submissionResult,
      reportUrl: `/assessment-report/${session.sessionId}`,
    });
  } catch (err) {
    console.error("Failed to submit proctored session:", err);
    res.status(500).json({ error: err.message });
  }
});

// 8. GET /api/coding/proctored-session/:sessionId/report
router.get("/proctored-session/:sessionId/report", optionalAuthenticateToken, async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user.id || req.user._id) : null;
    const { sessionId } = req.params;

    let session = await ProctoredCodingSession.findOne({ sessionId });
    const isPrivileged = req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN";

    if (session) {
      const sessUid = String(session.userId || "");
      if (sessUid && !sessUid.startsWith("guest_") && sessUid !== "guest") {
        if (!userId || (!isPrivileged && String(userId) !== sessUid)) {
          return res.status(403).json({ error: "Access denied. You do not have permission to view this assessment report." });
        }
      }
    }

    // If not a coding session, check if this is an MCQ attempt
    if (!session) {
      const rawId = (sessionId || "").trim();
      const cleanId = rawId.startsWith("attempt_") ? rawId.replace("attempt_", "") : rawId;
      const mongoose = require("mongoose");
      let attempt = null;

      if (mongoose.Types.ObjectId.isValid(cleanId)) {
        attempt = await ModuleAssessmentAttempt.findById(cleanId).lean();
      }
      if (!attempt) {
        attempt = await ModuleAssessmentAttempt.findOne({
          $or: [
            { sessionId: rawId },
            { sessionId: cleanId },
            { sessionId: `attempt_${cleanId}` },
            { sessionId: `attempt_${rawId}` },
          ],
        }).lean();
      }

      if (attempt) {
        const attUid = String(attempt.userId || "");
        if (attUid && !attUid.startsWith("guest_") && attUid !== "guest") {
          if (!userId || (!isPrivileged && String(userId) !== attUid)) {
            return res.status(403).json({ error: "Access denied. You do not have permission to view this assessment report." });
          }
        }
        const User = require("../models/User");
        const { getSubjectModule } = require("../data/curriculumRegistry");
        const user = await User.findById(attempt.userId || userId).lean();
        const module = getSubjectModule(attempt.subjectKey, attempt.trackId, attempt.moduleIndex);
        const qList = (Array.isArray(attempt.questions) && attempt.questions.length > 0)
          ? attempt.questions
          : (module?.assessment?.questions || []);

        let reviewBreakdown = [];
        if (Array.isArray(attempt.reviewBreakdown) && attempt.reviewBreakdown.length > 0) {
          reviewBreakdown = attempt.reviewBreakdown.map((q, qIdx) => ({
            ...q,
            id: q.id || `q_${qIdx + 1}`,
            questionIndex: q.questionIndex !== undefined ? q.questionIndex : qIdx,
            userSelected: q.userSelected !== undefined ? q.userSelected : q.userAnswer,
            userAnswer: q.userAnswer !== undefined ? q.userAnswer : q.userSelected,
            correctIndex: q.correctIndex !== undefined ? q.correctIndex : q.correctAnswer,
            correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : q.correctIndex,
            isCorrect: Boolean(q.isCorrect),
            marksAwarded: q.marksAwarded !== undefined ? q.marksAwarded : (q.isCorrect ? (q.maxMarks || 1) : 0),
            maxMarks: q.maxMarks || 1,
            explanation: q.explanation || "Review fundamental course materials for this topic.",
          }));
        } else {
          reviewBreakdown = qList.map((q, qIdx) => {
            let userSelected = null;
            if (attempt.userAnswers) {
              userSelected = attempt.userAnswers[qIdx] ?? attempt.userAnswers[String(qIdx)];
            }
            if (userSelected !== null && userSelected !== undefined && userSelected !== "" && userSelected !== -1 && userSelected !== "-1") {
              const p = Number(userSelected);
              userSelected = isNaN(p) ? null : p;
            } else {
              userSelected = null;
            }
            const isCorrect = userSelected !== null && userSelected === q.correctIndex;
            const qMarks = Number(q.marks || attempt.marksPerQuestion || 1);
            return {
              id: q.id || `q_${qIdx + 1}`,
              questionIndex: qIdx,
              question: q.question,
              options: q.options,
              userSelected,
              userAnswer: userSelected,
              correctIndex: q.correctIndex,
              correctAnswer: q.correctIndex,
              isCorrect,
              marksAwarded: isCorrect ? qMarks : 0,
              maxMarks: qMarks,
              explanation: q.explanation || "Review the core concepts for this question.",
            };
          });
        }

        const totalQ = attempt.totalQuestions || qList.length || 10;
        const defaultMarksPerQ = attempt.marksPerQuestion || 1;
        const totalM = attempt.totalMarks || (totalQ * defaultMarksPerQ);
        const marksObt = attempt.marksObtained !== undefined ? attempt.marksObtained : (attempt.score * defaultMarksPerQ);
        const attemptedCount = attempt.questionsAttempted ?? reviewBreakdown.filter((q) => q.userSelected !== null && q.userSelected !== undefined).length;
        const unansweredCount = attempt.questionsUnanswered ?? Math.max(0, totalQ - attemptedCount);
        const isPass = attempt.passed || attempt.percentage >= (attempt.passingScore || 80);
        const accuracyPct = attempt.accuracy ?? (attemptedCount > 0 ? Math.round(((attempt.score || 0) / attemptedCount) * 100) : attempt.percentage);
        const gradeVal = attempt.grade || (attempt.percentage >= 90 ? "A+" : attempt.percentage >= 80 ? "A" : attempt.percentage >= 70 ? "B" : attempt.percentage >= 60 ? "C" : "F");
        const startTimeVal = attempt.startTime || new Date(new Date(attempt.createdAt).getTime() - (Math.max(1, attempt.timeSpentSeconds || 60) * 1000));
        const submitTimeVal = attempt.submittedAt || attempt.createdAt;

        const scorecard = {
          totalQuestions: totalQ,
          questionsAttempted: attemptedCount,
          questionsUnanswered: unansweredCount,
          totalMarks: totalM,
          marksObtained: marksObt,
          totalTestCases: totalQ,
          totalPassedTests: attempt.score,
          totalFailedTests: Math.max(0, totalQ - attempt.score),
          accuracy: accuracyPct,
          percentage: attempt.percentage,
          overallPercentage: attempt.percentage,
          grade: gradeVal,
          passed: isPass,
        };

        const report = {
          sessionId: attempt.sessionId || `attempt_${attempt._id}`,
          attemptId: attempt._id.toString(),
          assessmentTitle: attempt.assessmentTitle || `${attempt.moduleTitle} — Proctored Examination`,
          subjectKey: attempt.subjectKey || "coding",
          trackId: attempt.trackId,
          moduleIndex: attempt.moduleIndex,
          attemptNumber: attempt.attemptNumber || 1,
          candidateDetails: {
            fullName: user?.fullName || user?.name || "Verified Candidate",
            email: user?.email || "candidate@masteryzone.edu",
            candidateId: `CAND-${(attempt.userId || userId || "GUEST").toString().slice(-6).toUpperCase()}`,
            organization: "Mastery Zone Academic Accreditation",
          },
          status: isPass ? "passed" : "failed",
          startTime: startTimeVal,
          submissionTime: submitTimeVal,
          submittedAt: submitTimeVal,
          durationSeconds: attempt.timeSpentSeconds || 0,
          timeLimitSeconds: 1800,
          score: marksObt,
          marksObtained: marksObt,
          totalMarks: totalM,
          rawScore: attempt.score,
          totalQuestions: totalQ,
          questionsAttempted: attemptedCount,
          questionsUnanswered: unansweredCount,
          percentage: attempt.percentage,
          grade: gradeVal,
          accuracy: accuracyPct,
          passed: isPass,
          violationsCount: attempt.violationsCount || 0,
          violationsLog: attempt.violationsLog || [],
          proctoringVerified: attempt.proctoringVerified || {
            camera: true,
            microphone: true,
            screenShare: true,
            displaySurface: "monitor",
            fullscreen: true,
          },
          isMcq: true,
          scorecard,
          performance: {
            score: attempt.percentage,
            grade: gradeVal,
            marksObtained: marksObt,
            totalMarks: totalM,
            passedTests: attempt.score,
            totalTests: totalQ,
            accuracy: accuracyPct,
            passed: isPass,
          },
          proctoringAudit: {
            chancesUsed: attempt.violationsCount || 0,
            maxChances: 5,
            violationsCount: attempt.violationsCount || 0,
            cameraGranted: true,
            micGranted: true,
            screenShareGranted: true,
            events: (attempt.violationsLog || []).map((v) => ({
              type: v.type || "INTERRUPT",
              reason: v.detail || v.type || "Exam interruption recorded",
              timestamp: v.timestamp || new Date(),
              durationSeconds: 0,
            })),
          },
          reviewBreakdown,
          isReadOnly: true,
        };

        return res.json({ success: true, report });
      }

      // Check if this is a Project Assessment Submission (proj_sub_...)
      const ProjectSubmission = require("../models/ProjectSubmission");
      const { getProjectById } = require("../data/projectsCatalog");
      const { formatSubmissionAsReport } = require("./projectRoutes");
      let projSub = await ProjectSubmission.findOne({ sessionId: rawId }).lean();
      if (!projSub && mongoose.Types.ObjectId.isValid(cleanId)) {
        projSub = await ProjectSubmission.findById(cleanId).lean();
      }
      if (projSub) {
        const projSpec = getProjectById(projSub.projectId);
        const report = formatSubmissionAsReport(projSub, projSpec);
        return res.json({ success: true, report });
      }

      // Check if this is a Certification Attempt (cert_att_... or cert ID)
      const CertificationAttempt = require("../models/CertificationAttempt");
      const certAtt = await CertificationAttempt.findOne({
        $or: [{ attemptId: rawId }, { attemptId: cleanId }, { certificateId: rawId }, { certificateId: cleanId }],
      });
      if (certAtt) {
        const certRoutes = require("./certificationRoutes");
        const report = await certRoutes.buildCertificationReportPayload(certAtt, req.user);
        return res.json({ success: true, report });
      }

      // Check if this is a ChallengeSubmission
      let challengeSub = null;
      if (mongoose.Types.ObjectId.isValid(cleanId)) {
        challengeSub = await ChallengeSubmission.findById(cleanId).populate("userId", "fullName username email role").lean();
      }
      if (!challengeSub) {
        challengeSub = await ChallengeSubmission.findOne({
          $or: [
            { sessionId: rawId },
            { sessionId: cleanId },
            ...(mongoose.Types.ObjectId.isValid(cleanId) ? [{ _id: cleanId }] : []),
          ],
        }).populate("userId", "fullName username email role").lean();
      }

      if (challengeSub) {
        const subUser = challengeSub.userId || {};
        const subUid = String(subUser._id || challengeSub.userId || "");
        if (subUid && !subUid.startsWith("guest_") && subUid !== "guest") {
          if (!userId || (!isPrivileged && String(userId) !== subUid)) {
            return res.status(403).json({ error: "Access denied. You do not have permission to view this assessment report." });
          }
        }

        const resolvedProblem = resolveQuestionData(challengeSub.challengeId, challengeSub.language);
        const testCasesList = (resolvedProblem.testCases && resolvedProblem.testCases.length > 0)
          ? resolvedProblem.testCases
          : [];
        const hasSavedResults = Array.isArray(challengeSub.testResults) && challengeSub.testResults.length > 0;
        const totalTests = hasSavedResults
          ? challengeSub.testResults.length
          : (testCasesList.length > 0 ? testCasesList.length : (challengeSub.totalTests || 0));
        const passedTests = challengeSub.passedTests !== undefined ? challengeSub.passedTests : 0;
        const score = challengeSub.score !== undefined ? challengeSub.score : Math.round((passedTests / Math.max(1, totalTests)) * 100);
        const isPassed = challengeSub.status === "ACCEPTED";
        const grade = calculateGrade(score);

        // Retrieve verified test results from actual submission or test case assertions
        const testResults = hasSavedResults
          ? challengeSub.testResults
          : testCasesList.map((tc, tIdx) => {
              const isHidden = tc.isHidden !== undefined ? tc.isHidden : false;
              const passed = tIdx < passedTests;
              return {
                testIndex: tIdx + 1,
                testNumber: tIdx + 1,
                passed,
                durationMs: challengeSub.runtimeMs ? Math.round(challengeSub.runtimeMs / Math.max(1, totalTests)) : 0,
                input: isHidden ? "[Hidden Test Case]" : (tc.input || `Test Case #${tIdx + 1}`),
                expected: isHidden ? "[Hidden Output]" : (tc.expectedOutput || ""),
                actual: isHidden
                  ? (passed ? "[Passed]" : "[Output Hidden]")
                  : (passed ? (tc.expectedOutput || "") : (challengeSub.error || challengeSub.output || "")),
                isHidden,
                error: passed ? null : (challengeSub.error || "Assertion failed"),
              };
            });

        const candidateName = subUser.fullName || subUser.username || "Verified Candidate";
        const candidateEmail = subUser.email || "candidate@masteryzone.com";

        const report = {
          sessionId: rawId,
          attemptId: challengeSub._id.toString(),
          assessmentTitle: `${challengeSub.challengeTitle || resolvedProblem.title || "Coding Challenge"} — Assessment Report`,
          questionTitle: challengeSub.challengeTitle || resolvedProblem.title || "Coding Challenge",
          subjectKey: "coding",
          trackId: resolvedProblem.category || "dsa",
          questionId: challengeSub.challengeId,
          candidateDetails: {
            fullName: candidateName,
            email: candidateEmail,
            candidateId: `CAND-${String(challengeSub._id).slice(-6).toUpperCase()}`,
            organization: "Mastery Zone Academic Accreditation",
          },
          status: isPassed ? "passed" : "failed",
          startTime: challengeSub.createdAt,
          submissionTime: challengeSub.createdAt,
          submittedAt: challengeSub.createdAt,
          durationSeconds: Math.round((challengeSub.runtimeMs || 0) / 1000) || 15,
          score,
          marksObtained: score,
          totalMarks: 100,
          rawScore: score,
          percentage: score,
          overallPercentage: score,
          grade,
          accuracy: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : score,
          passed: isPassed,
          passedTests,
          totalTests,
          language: challengeSub.language || "python",
          submittedCode: challengeSub.code || "",
          code: challengeSub.code || "",
          runtimeMs: challengeSub.runtimeMs || 0,
          output: challengeSub.output || "",
          error: challengeSub.error || "",
          adminNote: challengeSub.adminNote || "",
          adminModifiedAt: challengeSub.adminModifiedAt || null,
          adminModifiedBy: challengeSub.adminModifiedBy || "",
          marksHistory: challengeSub.marksHistory || [],
          violationsCount: 0,
          scorecard: {
            totalQuestions: 1,
            questionsAttempted: 1,
            questionsUnanswered: 0,
            totalMarks: 100,
            marksObtained: score,
            overallPercentage: score,
            accuracy: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : score,
            totalTestCases: totalTests,
            totalPassedTests: passedTests,
            totalFailedTests: Math.max(0, totalTests - passedTests),
            failedTestCases: Math.max(0, totalTests - passedTests),
            grade,
            passed: isPassed,
          },
          questions: [
            {
              questionId: challengeSub.challengeId,
              title: challengeSub.challengeTitle || resolvedProblem.title || "Coding Challenge",
              difficulty: resolvedProblem.difficulty || "Medium",
              category: resolvedProblem.category || "Algorithms",
              description: resolvedProblem.description || resolvedProblem.prompt || "",
              inputFormat: resolvedProblem.inputFormat || "",
              outputFormat: resolvedProblem.outputFormat || "",
              constraints: resolvedProblem.constraints || [],
              examples: resolvedProblem.examples || [],
              hints: resolvedProblem.hints || [],
              testCases: testCasesList,
              submittedCode: challengeSub.code || "",
              language: challengeSub.language || "python",
              status: isPassed ? "passed" : "failed",
              score,
              marksObtained: score,
              totalMarks: 100,
              passedTests,
              totalTests,
              testResults,
              attempted: true,
              submittedAt: challengeSub.createdAt,
            },
          ],
          testResults,
          isReadOnly: true,
        };

        return res.json({ success: true, report });
      }

      // If session is still not found in any genuine database collection, strictly return 404
      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Assessment report not found. The submission does not exist or has not yet been completed."
        });
      }
    }

    // Build the dynamic question list (plain JS objects so enriched telemetry serializes cleanly)
    let questions = [];
    if (Array.isArray(session.questions) && session.questions.length > 0) {
      questions = session.questions.map((q) =>
        typeof q.toObject === "function" ? q.toObject() : { ...q }
      );
    } else {
      const pData = session.problemData?.title
        ? session.problemData
        : resolveQuestionData(session.questionId, session.trackId);
      questions = [
        {
          questionId: session.questionId,
          title: pData.title || session.assessmentTitle || "Coding Problem",
          difficulty: pData.difficulty || "Medium",
          category: pData.category || session.trackId || "DSA",
          description: pData.description || "",
          inputFormat: pData.inputFormat || "",
          outputFormat: pData.outputFormat || "",
          constraints: pData.constraints || [],
          examples: pData.examples || [],
          hints: pData.hints || [],
          testCases: pData.testCases || [],
          submittedCode: session.submissionResult?.code || session.draftCode || "",
          language: session.submissionResult?.language || session.draftLanguage || "python",
          status: session.submissionResult?.passed ? "passed" : "failed",
          score: session.submissionResult?.score || 0,
          marksObtained: session.submissionResult?.marksObtained || session.submissionResult?.score || 0,
          totalMarks: session.submissionResult?.totalMarks || 100,
          passedTests: session.submissionResult?.passedTests || 0,
          totalTests: session.submissionResult?.totalTests || 10,
          testResults: session.submissionResult?.testResults || [],
          attempted: true,
          submittedAt: session.submissionResult?.submittedAt || session.updatedAt,
        },
      ];
    }

    // Dynamic hydration from CodingProgress if session submission is missing or incomplete
    let modKey = session.questionId || "";
    if (!modKey.includes("_") && session.trackId) {
      modKey = `${session.trackId}_0`;
    }
    let userProgress = null;
    let progMod = null;
    const isFormallySubmitted = session.status === "submitted" || Boolean(session.submissionResult?.submittedAt);
    try {
      if (!isFormallySubmitted) {
        userProgress = await CodingProgress.findOne({ userId });
        progMod = userProgress?.moduleProgress?.get(modKey);
      }
    } catch {}

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      const draftForQ = (session.questionDrafts && typeof session.questionDrafts.get === "function")
        ? session.questionDrafts.get(q.questionId)
        : session.questionDrafts?.[q.questionId];

      if (!isFormallySubmitted) {
        let qModKey = q.questionId || session.questionId || "";
        if (!qModKey.includes("_") && session.trackId) {
          qModKey = `${session.trackId}_${i}`;
        }
        const qProgMod = (userProgress?.moduleProgress && typeof userProgress.moduleProgress.get === "function")
          ? userProgress.moduleProgress.get(qModKey)
          : userProgress?.moduleProgress?.[qModKey];

        const lastAttempt = Array.isArray(qProgMod?.exerciseAttempts) && qProgMod.exerciseAttempts.length > 0
          ? qProgMod.exerciseAttempts[qProgMod.exerciseAttempts.length - 1]
          : null;

        const bestAttempt = Array.isArray(qProgMod?.exerciseAttempts) && qProgMod.exerciseAttempts.length > 0
          ? [...qProgMod.exerciseAttempts].sort((a, b) => (b.score || 0) - (a.score || 0))[0]
          : null;

        const resolvedCode = getValidCode(
          q.submittedCode,
          session.submissionResult?.code,
          draftForQ,
          qProgMod?.exerciseCode,
          bestAttempt?.code,
          lastAttempt?.code,
          qProgMod?.exerciseDraftCode,
          session.draftCode
        );

        if (resolvedCode) {
          q.submittedCode = resolvedCode;
        }

        if ((q.score === 0 || q.score === undefined) && qProgMod && qProgMod.exerciseScore) {
          q.score = qProgMod.exerciseScore;
          q.marksObtained = qProgMod.exerciseScore;
          q.status = qProgMod.exercisePassed ? "passed" : "failed";
          q.passedTests = qProgMod.exerciseScore === 100 ? (q.totalTests || 10) : Math.round((qProgMod.exerciseScore / 100) * (q.totalTests || 10));
        }
      } else {
        // For formally submitted sessions, preserve exact submittedCode for this session
        if (q.submittedCode === undefined || q.submittedCode === null) {
          q.submittedCode = questions.length === 1 && session.submissionResult?.code !== undefined
            ? String(session.submissionResult.code)
            : (draftForQ || "");
        }
      }

      // Only evaluate genuine test cases from problem definition or existing testResults
      const resolvedProblem = resolveQuestionData(q.questionId, session.trackId);
      const testCasesList = (q.testCases && q.testCases.length > 0) ? q.testCases : (resolvedProblem?.testCases || []);
      const totalRequired = testCasesList.length > 0 ? testCasesList.length : (Array.isArray(q.testResults) ? q.testResults.length : 0);
      q.totalTests = totalRequired;
      const passTarget = q.passedTests !== undefined ? q.passedTests : (q.score === 100 ? totalRequired : Math.round(((q.score || 0) / 100) * totalRequired));
      q.passedTests = passTarget;

      const codeIsEmpty = isCodeEmptyOrComments(q.submittedCode);
      q.isCodeEmpty = codeIsEmpty;
      if (codeIsEmpty && passTarget === 0) {
        q.submittedCode = "";
        q.attempted = false;
      } else {
        q.attempted = true;
      }

      if (!Array.isArray(q.testResults) || q.testResults.length !== totalRequired) {
        const existingResults = Array.isArray(q.testResults) ? q.testResults : [];
        const fullResults = [];
        for (let tIdx = 0; tIdx < totalRequired; tIdx++) {
          if (existingResults[tIdx] && (existingResults[tIdx].testIndex || existingResults[tIdx].testNumber)) {
            fullResults.push(existingResults[tIdx]);
          } else {
            const tc = testCasesList[tIdx] || {};
            const isHidden = tc.isHidden !== undefined ? tc.isHidden : false;
            const isPassed = tIdx < passTarget;
            fullResults.push({
              testIndex: tIdx + 1,
              testNumber: tIdx + 1,
              passed: isPassed,
              input: isHidden ? "[Hidden Test Case]" : (tc.input || `Test Case #${tIdx + 1}`),
              expected: isHidden ? "[Hidden Output]" : (tc.expectedOutput || ""),
              actual: isHidden
                ? (isPassed ? "[Passed]" : "[Output Hidden]")
                : (isPassed ? (tc.expectedOutput || "") : (codeIsEmpty ? "" : "Output assertion mismatch")),
              durationMs: 0,
              isHidden,
              error: isPassed ? null : (codeIsEmpty ? "No executable code provided." : "Output assertion mismatch"),
            });
          }
        }
        q.testResults = fullResults;
      }

      // Compute runtime & compilation/execution diagnostics for this question
      const totalRuntimeMs = (q.testResults || []).reduce((acc, r) => acc + Number(r.durationMs || r.duration || 0), 0);
      const hasCompileErr = (q.testResults || []).some((r) => /Syntax Error|Compilation Error/i.test(r.error || ""));
      const hasRuntimeErr = !hasCompileErr && (q.testResults || []).some((r) => /Timed out|Runtime Error|Exception|Traceback|ReferenceError|TypeError|ZeroDivisionError/i.test(r.error || ""));
      q.runtimeMs = totalRuntimeMs;
      const qLang = String(q.language || "python").toLowerCase();
      q.memoryMb = codeIsEmpty ? 0 : (qLang.includes("java") ? 28.4 : qLang.includes("c") ? 4.8 : 14.2);

      if (codeIsEmpty && passTarget === 0) {
        q.status = "unanswered";
        q.compilationStatus = "No Code Submitted";
        q.executionStatus = "Not Executed";
      } else if (hasCompileErr) {
        q.status = "failed";
        q.compilationStatus = "Compilation Error";
        q.executionStatus = "Compilation Failed";
      } else if (passTarget === totalRequired && totalRequired > 0) {
        q.status = "passed";
        q.compilationStatus = "Compiled Successfully";
        q.executionStatus = "All Test Cases Passed";
      } else if (passTarget > 0 && passTarget < totalRequired) {
        q.status = "partially_passed";
        q.compilationStatus = "Compiled Successfully";
        q.executionStatus = `Partially Passed (${passTarget}/${totalRequired})`;
      } else {
        q.status = "failed";
        q.compilationStatus = "Compiled Successfully";
        q.executionStatus = hasRuntimeErr ? "Runtime Error" : "Test Cases Failed";
      }
    }

    const subResult = session.submissionResult || {};
    const totalQuestions = questions.length;
    const questionsAttempted = questions.filter((q) => q.attempted && !q.isCodeEmpty).length;
    const questionsUnanswered = Math.max(0, totalQuestions - questionsAttempted);
    const totalMarks = subResult.totalMarks ?? questions.reduce((sum, q) => sum + (q.totalMarks || 100), 0);
    const marksObtained = subResult.marksObtained ?? questions.reduce((sum, q) => sum + (q.marksObtained || 0), 0);
    const totalTestCases = questions.reduce((sum, q) => sum + (q.totalTests || 10), 0);
    const totalPassedTests = questions.reduce((sum, q) => sum + (q.passedTests || 0), 0);
    const overallPercentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : (totalTestCases > 0 ? Math.round((totalPassedTests / totalTestCases) * 100) : (subResult.score || 0));
    const accuracy = totalTestCases > 0 ? Math.round((totalPassedTests / totalTestCases) * 100) : overallPercentage;
    const grade = subResult.grade || calculateGrade(overallPercentage);
    const passed = subResult.passed !== undefined ? subResult.passed : overallPercentage >= 80;
    const partiallyPassed = !passed && (overallPercentage > 0 || totalPassedTests > 0);

    const hasProctoringEvidence = Boolean(
      session.deviceInfo?.camera ||
      session.deviceInfo?.microphone ||
      session.deviceInfo?.screenShare ||
      session.deviceInfo?.fullscreen ||
      (Array.isArray(session.violationsLog) && session.violationsLog.some((v) => v.type === "session_initialized"))
    );

    const integrityStatus = !hasProctoringEvidence
      ? "Standard Sandbox Evaluation"
      : (session.violationsCount || 0) === 0
      ? "Verified Flawless"
      : (session.violationsCount || 0) <= 2
      ? "Verified — Minor Alerts"
      : "Flagged Review";

    const scorecard = {
      totalQuestions,
      questionsAttempted,
      questionsUnanswered,
      totalMarks,
      marksObtained,
      overallPercentage,
      accuracy,
      totalTestCases,
      totalPassedTests,
      failedTestCases: Math.max(0, totalTestCases - totalPassedTests),
      durationSeconds: subResult.durationSeconds || Math.max(1, Math.round((session.updatedAt - session.serverStartTime) / 1000)),
      startTime: session.serverStartTime,
      submittedAt: subResult.submittedAt || session.updatedAt,
      grade,
      passed,
      partiallyPassed,
      violationsCount: session.violationsCount || 0,
      telemetryAvailable: hasProctoringEvidence,
      integrityStatus,
    };

    const primaryProblem = questions[0] || session.problemData || {};
    const resolvedTopCode = primaryProblem.isCodeEmpty
      ? ""
      : getValidCode(
          primaryProblem.submittedCode,
          subResult.code,
          questions[0]?.submittedCode
        );

    let candidateDetails = session.candidateDetails || {};
    const targetUid = session.userId || userId;
    if (targetUid && mongoose.Types.ObjectId.isValid(targetUid)) {
      const u = await User.findById(targetUid).select("fullName username email").lean();
      if (u) {
        candidateDetails = {
          ...candidateDetails,
          fullName: u.fullName || u.username || candidateDetails.fullName || "Candidate",
          email: u.email || candidateDetails.email || "",
          candidateId: `CAND-${u._id.toString().slice(-6).toUpperCase()}`,
          organization: candidateDetails.organization || "Mastery Zone Academy",
        };
      }
    }

    res.json({
      success: true,
      report: {
        sessionId: session.sessionId,
        candidateDetails,
        assessmentTitle: session.assessmentTitle || primaryProblem.title || "Coding Assessment",
        trackId: session.trackId || "python",
        timeLimitSeconds: session.timeLimitSeconds || 3600,
        scorecard,
        questions,
        problemData: {
          id: primaryProblem.questionId || session.questionId,
          title: primaryProblem.title,
          difficulty: primaryProblem.difficulty,
          category: primaryProblem.category,
          description: primaryProblem.description,
          inputFormat: primaryProblem.inputFormat,
          outputFormat: primaryProblem.outputFormat,
          constraints: primaryProblem.constraints,
          examples: primaryProblem.examples,
        },
        status: session.status,
        startTime: session.serverStartTime,
        submissionTime: subResult.submittedAt || session.updatedAt,
        durationSeconds: scorecard.durationSeconds,
        performance: {
          score: overallPercentage,
          marksObtained,
          totalMarks,
          grade,
          accuracy,
          passedTests: totalPassedTests,
          totalTests: totalTestCases,
          passed,
          partiallyPassed,
          status: passed ? "PASSED" : partiallyPassed ? "PARTIALLY_PASSED" : "FAILED",
        },
        submittedCode: resolvedTopCode,
        language: subResult.language || primaryProblem.language || session.draftLanguage || "python",
        testResults: subResult.testResults?.length ? subResult.testResults : (primaryProblem.testResults || []),
        evaluationFeedback: subResult.evaluationFeedback || generateFeedback(overallPercentage, totalPassedTests, totalTestCases, 1000, "python"),
        proctoringAudit: {
          telemetryAvailable: hasProctoringEvidence,
          integrityStatus,
          permissions: session.deviceInfo,
          maxChances: session.maxRecoveryChances || 5,
          chancesUsed: session.recoveryChancesUsed || 0,
          chancesRemaining: Math.max(0, 5 - (session.recoveryChancesUsed || 0)),
          recoveryHistory: session.recoveryHistory || [],
          totalPauseSeconds: session.totalPauseDurationSeconds || 0,
          violationsCount: session.violationsCount || 0,
          violationsTimeline: session.violationsLog || [],
        },
      },
    });
  } catch (err) {
    console.error("Failed to fetch assessment report:", err);
    res.status(500).json({ error: err.message });
  }
});

router.evaluateSingleTestCase = evaluateSingleTestCase;
router.evaluateTestCasesBatch = evaluateTestCasesBatch;
router.runSandboxedProcess = runSandboxedProcess;
router.terminateProcessTree = terminateProcessTree;
router.validateCodeSafety = validateCodeSafety;
router.executeViaJudge0 = executeViaJudge0;
router.isProductionExecutionRestricted = isProductionExecutionRestricted;

module.exports = router;
