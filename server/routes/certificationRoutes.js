const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Certification = require("../models/CertificationSchema");
const CertificationAttempt = require("../models/CertificationAttempt");
const IssuedCertificate = require("../models/IssuedCertificate");
const User = require("../models/User");
const Progress = require("../models/ProgressSchema");
const authenticateToken = require("../middleware/authMiddleware");
const { optionalAuthenticateToken } = require("../middleware/authMiddleware");
const { pushNotification } = require("../utils/notificationService");
const { pushAdminNotification } = require("../utils/adminNotificationService");
const { sendCertificateAwardedEmail } = require("../utils/mailer");
const { DSA_MCQ_BANK } = require("../data/dsaQuestionsBank");
const CHALLENGES_CATALOG = require("../data/challengesCatalog");
const { CURRICULUM } = require("../data/codingCurriculum");
const { generateCertificatePDF, CERTIFICATES_DIR } = require("../utils/certificateGenerator");
const codingRoutes = require("./codingRoutes");
const evaluateSingleTestCase = codingRoutes.evaluateSingleTestCase;
const runSandboxedProcess = codingRoutes.runSandboxedProcess;

// Supported Coding Binaries
const PYTHON_BIN = fs.existsSync("/usr/bin/python3") ? "/usr/bin/python3" : "python3";
const NODE_BIN = fs.existsSync("/usr/local/bin/node") ? "/usr/local/bin/node" : "node";

// -------------------------------------------------------------
// HELPER: Shuffle array without replacement (Fisher-Yates)
// -------------------------------------------------------------
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// -------------------------------------------------------------
// 1. GET /api/certifications
// Returns certification catalog with dynamic module counts and user progress
// -------------------------------------------------------------
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userCerts = await Certification.find({ userId });
    const userCertMap = new Map(userCerts.map((c) => [c.certId, c]));

    const catalog = [
      {
        id: "dsa_cert",
        name: "Data Structures & Algorithms (DSA)",
        desc: "Comprehensive assessment of problem-solving skills, data structures, algorithms, complexity analysis, and competitive programming.",
        modules: CURRICULUM.dsa ? CURRICULUM.dsa.length : 5,
        icon: "dsa",
        zone: "CODING",
        passingThreshold: "80% (16/20 MCQs + 2/2 Coding Questions Solved)",
        examFormat: "20 MCQs • 2 Practical Coding Challenges • Proctored",
      },
      {
        id: "fullstack_cert",
        name: "Full-Stack Web Development Mastery",
        desc: "Comprehensive assessment covering HTML5, CSS3, React component architectures, Node.js REST APIs, and database modeling.",
        modules: CURRICULUM.webdev ? CURRICULUM.webdev.length : 4,
        icon: "webdev",
        zone: "CODING",
        passingThreshold: "80% Minimum",
        examFormat: "Curriculum Practical Assessment",
      },
      {
        id: "python_cert",
        name: "Python Systems & Automation Pro",
        desc: "Advanced certification in Pythonic architecture, concurrency, algorithmic pipelines, and automated script engineering.",
        modules: CURRICULUM.python ? CURRICULUM.python.length : 5,
        icon: "python",
        zone: "CODING",
        passingThreshold: "80% Minimum",
        examFormat: "Curriculum Practical Assessment",
      },
      {
        id: "java_cert",
        name: "Java Enterprise Architecture Specialist",
        desc: "Enterprise verification covering OOP design patterns, multithreaded concurrency, JVM optimization, and robust APIs.",
        modules: CURRICULUM.java ? CURRICULUM.java.length : 5,
        icon: "java",
        zone: "CODING",
        passingThreshold: "80% Minimum",
        examFormat: "Curriculum Practical Assessment",
      },
      {
        id: "cpp_cert",
        name: "Modern C++ Systems Architecture",
        desc: "High-performance verification covering memory safety, RAII, STL algorithms, move semantics, and systems compilation.",
        modules: CURRICULUM.cpp ? CURRICULUM.cpp.length : 4,
        icon: "cpp",
        zone: "CODING",
        passingThreshold: "80% Minimum",
        examFormat: "Curriculum Practical Assessment",
      },
    ];

    const enriched = catalog.map((cert) => {
      const userState = userCertMap.get(cert.id);
      return {
        ...cert,
        status: userState ? userState.status : "not_started",
        progress: userState ? userState.progress : 0,
        currentModule: userState ? userState.currentModule : 0,
        enrolledAt: userState ? userState.createdAt : null,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// -------------------------------------------------------------
// 2. POST /api/certifications/attempt/start
// Initiates or resumes a real proctored certification attempt
// -------------------------------------------------------------
router.post("/attempt/start", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { certId = "dsa_cert" } = req.body;

    // Fetch user profile for candidate identity
    const user = await User.findById(userId);
    const candidateName = user ? (user.fullName || user.name || "Candidate") : "Candidate";
    const candidateEmail = user ? (user.email || "") : "";

    // 0. Check if candidate has already cleared the cutoff and earned a certificate (disallow retaking or attending completed exam)
    const earnedCert = await IssuedCertificate.findOne({
      userId,
      certificationId: certId,
      status: "VALID",
    });

    const passedAttempt = await CertificationAttempt.findOne({
      userId,
      certId,
      status: "PASSED",
    }).sort({ submittedAt: -1, createdAt: -1 });

    if (earnedCert || passedAttempt) {
      const certIdToUse = earnedCert ? earnedCert.certificateId : (passedAttempt?.certificateId || "");
      const attemptIdToUse = passedAttempt ? passedAttempt.attemptId : (earnedCert?.attemptId || "");
      return res.status(403).json({
        success: false,
        alreadyCertified: true,
        isCompleted: true,
        isPassed: true,
        certId,
        certificateId: certIdToUse,
        attemptId: attemptIdToUse,
        reportUrl: `/assessment-report/${attemptIdToUse}`,
        verificationUrl: `/verify/${certIdToUse}`,
        message: "You have already passed this certification examination and earned your verified certificate. Completed certifications cannot be attended again.",
      });
    }

    // 1. Check if candidate already has an IN_PROGRESS attempt
    const activeAttempt = await CertificationAttempt.findOne({
      userId,
      certId,
      status: "IN_PROGRESS",
    });

    if (activeAttempt) {
      // Return existing attempt state (stable on page refresh)
      const sanitizedMcqs = activeAttempt.selectedMcqs.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        topic: q.topic,
        difficulty: q.difficulty,
      }));

      const sanitizedCoding = activeAttempt.selectedCodingQuestions.map((q) => {
        const testCases = [
          ...(q.publicTests || []).map((t, idx) => ({
            index: idx + 1,
            input: t.input,
            expectedOutput: t.expectedOutput,
            isHidden: false,
          })),
          ...(q.hiddenTests || []).map((t, idx) => ({
            index: (q.publicTests || []).length + idx + 1,
            input: `[Hidden Test Case #${(q.publicTests || []).length + idx + 1}]`,
            expectedOutput: `[Hidden Output #${(q.publicTests || []).length + idx + 1}]`,
            isHidden: true,
          })),
        ];

        return {
          questionId: q.questionId,
          id: q.questionId,
          title: q.title,
          difficulty: q.difficulty,
          category: q.category,
          description: q.description,
          inputFormat: q.inputFormat,
          outputFormat: q.outputFormat,
          constraints: q.constraints,
          examples: q.examples,
          starterCode: q.starterCode,
          publicTests: q.publicTests,
          testCases,
        };
      });

      return res.json({
        success: true,
        resumed: true,
        attemptId: activeAttempt.attemptId,
        certId: activeAttempt.certId,
        certTitle: activeAttempt.certTitle,
        attemptNumber: activeAttempt.attemptNumber,
        status: activeAttempt.status,
        startTime: activeAttempt.startTime,
        durationMinutes: activeAttempt.durationMinutes,
        candidateName: activeAttempt.candidateName,
        selectedMcqs: sanitizedMcqs,
        mcqAnswers: Object.fromEntries(activeAttempt.mcqAnswers || new Map()),
        selectedCodingQuestions: sanitizedCoding,
        codingSubmissions: activeAttempt.codingSubmissions,
        proctoring: activeAttempt.proctoring,
      });
    }

    // 2. Determine attempt number
    const pastAttemptsCount = await CertificationAttempt.countDocuments({
      userId,
      certId,
    });
    const attemptNumber = pastAttemptsCount + 1;

    // 3. Select 20 MCQs randomly without replacement
    if (DSA_MCQ_BANK.length < 20) {
      return res.status(500).json({ error: "Insufficient MCQs in question bank" });
    }
    const shuffledMcqs = shuffleArray(DSA_MCQ_BANK).slice(0, 20);

    // 4. Select 2 Coding Challenges randomly without replacement from CHALLENGES_CATALOG
    const eligibleChallenges = CHALLENGES_CATALOG.filter(
      (c) => c.testCases && c.testCases.length >= 5
    );
    if (eligibleChallenges.length < 2) {
      return res.status(500).json({ error: "Insufficient coding questions available" });
    }
    const selectedTwoChallenges = shuffleArray(eligibleChallenges).slice(0, 2);

    const formattedCodingQuestions = selectedTwoChallenges.map((c) => {
      const publicTests = (c.testCases || []).filter((tc) => !tc.isHidden).slice(0, 3);
      const hiddenTests = (c.testCases || []).filter((tc) => tc.isHidden);

      // Default starter code if missing
      const starterCode = c.starterCode || {
        python: `# Enter your solution below\ndef solve():\n    pass\n`,
        javascript: `// Enter your solution below\nfunction solve() {\n}\n`,
      };

      return {
        questionId: c.id,
        title: c.title,
        difficulty: c.difficulty || "Medium",
        category: c.category || "Algorithms",
        description: c.description || "",
        inputFormat: c.inputFormat || "",
        outputFormat: c.outputFormat || "",
        constraints: c.constraints || [],
        examples: c.examples || [],
        starterCode,
        publicTests,
        hiddenTests: hiddenTests.length > 0 ? hiddenTests : (c.testCases || []).slice(3),
      };
    });

    const attemptId = `cert_att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newAttempt = new CertificationAttempt({
      attemptId,
      userId,
      candidateName,
      candidateEmail,
      certId,
      certTitle: "Data Structures & Algorithms (DSA)",
      attemptNumber,
      status: "IN_PROGRESS",
      startTime: new Date(),
      durationMinutes: 90,
      selectedMcqs: shuffledMcqs,
      mcqAnswers: {},
      selectedCodingQuestions: formattedCodingQuestions,
      codingSubmissions: formattedCodingQuestions.map((q) => ({
        questionId: q.questionId,
        code: q.starterCode?.python || "# Enter your solution below\n",
        language: "python",
        solved: false,
        passedTests: 0,
        totalTests: (q.publicTests.length + q.hiddenTests.length),
        testResults: [],
        runtimeMs: 0,
      })),
      proctoring: {
        status: "COMPLIANT",
        violationsCount: 0,
        tabSwitches: 0,
        fullscreenExits: 0,
        candidatePhoto: req.body.candidatePhoto || null,
        events: [],
      },
    });

    await newAttempt.save();

    // Sanitize for response (never reveal correctAnswer or hiddenTests)
    const sanitizedMcqs = newAttempt.selectedMcqs.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
    }));

    const sanitizedCoding = newAttempt.selectedCodingQuestions.map((q) => {
      const testCases = [
        ...(q.publicTests || []).map((t, idx) => ({
          index: idx + 1,
          input: t.input,
          expectedOutput: t.expectedOutput,
          isHidden: false,
        })),
        ...(q.hiddenTests || []).map((t, idx) => ({
          index: (q.publicTests || []).length + idx + 1,
          input: `[Hidden Test Case #${(q.publicTests || []).length + idx + 1}]`,
          expectedOutput: `[Hidden Output #${(q.publicTests || []).length + idx + 1}]`,
          isHidden: true,
        })),
      ];

      return {
        questionId: q.questionId,
        id: q.questionId,
        title: q.title,
        difficulty: q.difficulty,
        category: q.category,
        description: q.description,
        inputFormat: q.inputFormat,
        outputFormat: q.outputFormat,
        constraints: q.constraints,
        examples: q.examples,
        starterCode: q.starterCode,
        publicTests: q.publicTests,
        testCases,
      };
    });

    res.status(201).json({
      success: true,
      resumed: false,
      attemptId: newAttempt.attemptId,
      certId: newAttempt.certId,
      certTitle: newAttempt.certTitle,
      attemptNumber: newAttempt.attemptNumber,
      status: newAttempt.status,
      startTime: newAttempt.startTime,
      durationMinutes: newAttempt.durationMinutes,
      candidateName: newAttempt.candidateName,
      selectedMcqs: sanitizedMcqs,
      mcqAnswers: {},
      selectedCodingQuestions: sanitizedCoding,
      codingSubmissions: newAttempt.codingSubmissions,
      proctoring: newAttempt.proctoring,
    });
  } catch (err) {
    console.error("Attempt start error:", err);
    res.status(500).json({ error: err.message || "Failed to start certification attempt" });
  }
});

// -------------------------------------------------------------
// 3. GET /api/certifications/attempt/:attemptId
// Retrieves candidate's active or submitted attempt
// -------------------------------------------------------------
router.get("/attempt/:attemptId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const attempt = await CertificationAttempt.findOne({
      attemptId: req.params.attemptId,
      userId,
    });

    if (!attempt) {
      return res.status(404).json({ error: "Certification attempt not found" });
    }

    const sanitizedMcqs = attempt.selectedMcqs.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
    }));

    const sanitizedCoding = attempt.selectedCodingQuestions.map((q) => {
      const testCases = [
        ...(q.publicTests || []).map((t, idx) => ({
          index: idx + 1,
          input: t.input,
          expectedOutput: t.expectedOutput,
          isHidden: false,
        })),
        ...(q.hiddenTests || []).map((t, idx) => ({
          index: (q.publicTests || []).length + idx + 1,
          input: `[Hidden Test Case #${(q.publicTests || []).length + idx + 1}]`,
          expectedOutput: `[Hidden Output #${(q.publicTests || []).length + idx + 1}]`,
          isHidden: true,
        })),
      ];

      return {
        questionId: q.questionId,
        id: q.questionId,
        title: q.title,
        difficulty: q.difficulty,
        category: q.category,
        description: q.description,
        inputFormat: q.inputFormat,
        outputFormat: q.outputFormat,
        constraints: q.constraints,
        examples: q.examples,
        starterCode: q.starterCode,
        publicTests: q.publicTests,
        testCases,
      };
    });

    res.json({
      success: true,
      attemptId: attempt.attemptId,
      certId: attempt.certId,
      certTitle: attempt.certTitle,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startTime: attempt.startTime,
      submittedAt: attempt.submittedAt,
      durationMinutes: attempt.durationMinutes,
      candidateName: attempt.candidateName,
      selectedMcqs: sanitizedMcqs,
      mcqAnswers: Object.fromEntries(attempt.mcqAnswers || new Map()),
      selectedCodingQuestions: sanitizedCoding,
      codingSubmissions: attempt.codingSubmissions,
      proctoring: attempt.proctoring,
      mcqScore: attempt.status !== "IN_PROGRESS" ? attempt.mcqScore : undefined,
      finalVerdict: attempt.finalVerdict,
      certificateId: attempt.certificateId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. POST /api/certifications/attempt/:attemptId/save-mcq
// Autosaves candidate's MCQ responses
// -------------------------------------------------------------
router.post("/attempt/:attemptId/save-mcq", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { questionId, selectedOptionIndex } = req.body;

    const attempt = await CertificationAttempt.findOne({
      attemptId: req.params.attemptId,
      userId,
      status: "IN_PROGRESS",
    });

    if (!attempt) {
      return res.status(404).json({ error: "Active attempt not found or already finalized" });
    }

    if (!attempt.mcqAnswers) {
      attempt.mcqAnswers = new Map();
    }

    attempt.mcqAnswers.set(String(questionId), Number(selectedOptionIndex));
    await attempt.save();

    res.json({
      success: true,
      answeredCount: attempt.mcqAnswers.size,
      totalCount: attempt.selectedMcqs.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. POST /api/certifications/attempt/:attemptId/run-code
// Executes code in sandbox against sample tests or custom stdin
// -------------------------------------------------------------
router.post("/attempt/:attemptId/run-code", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { questionIndex = 0, code, language = "python", stdin = "", customInput } = req.body;

    const attempt = await CertificationAttempt.findOne({
      attemptId: req.params.attemptId,
      userId,
    });

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    const question = attempt.selectedCodingQuestions[questionIndex];
    if (!question) {
      return res.status(400).json({ error: "Invalid question index" });
    }

    const activeStdin = (customInput !== undefined && customInput !== null && customInput.trim() !== "")
      ? customInput
      : stdin;

    if (activeStdin) {
      const outcome = await evaluateSingleTestCase(language, code, activeStdin, "");
      return res.json({
        isCustom: true,
        output: outcome.actual || "",
        error: outcome.error || null,
        duration: outcome.duration || 0,
      });
    }

    // Evaluate against public visible test cases
    const testCasesToRun = question.publicTests || [];
    const testResults = [];

    for (let i = 0; i < testCasesToRun.length; i++) {
      const tc = testCasesToRun[i];
      const outcome = await evaluateSingleTestCase(language, code, tc.input, tc.expectedOutput);
      testResults.push({
        testIndex: i + 1,
        index: i + 1,
        input: tc.input,
        expected: tc.expectedOutput,
        expectedOutput: tc.expectedOutput,
        actual: outcome.actual,
        actualOutput: outcome.actual,
        passed: outcome.passed,
        duration: outcome.duration,
        durationMs: outcome.duration,
        error: outcome.error,
        isHidden: false,
      });
    }

    const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);

    res.json({
      success: true,
      status: allPassed ? "ACCEPTED" : "WRONG_ANSWER",
      results: testResults,
      testResults,
      total: testResults.length,
      passedCount: testResults.filter((r) => r.passed).length,
      allPublicPassed: allPassed,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 6. POST /api/certifications/attempt/:attemptId/submit-code
// Evaluates code against ALL tests (public + hidden) on server
// -------------------------------------------------------------
router.post("/attempt/:attemptId/submit-code", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { questionIndex = 0, code, language = "python" } = req.body;

    const attempt = await CertificationAttempt.findOne({
      attemptId: req.params.attemptId,
      userId,
      status: "IN_PROGRESS",
    });

    if (!attempt) {
      return res.status(404).json({ error: "Active attempt not found" });
    }

    const question = attempt.selectedCodingQuestions[questionIndex];
    if (!question) {
      return res.status(400).json({ error: "Invalid question index" });
    }

    // Combine all test cases (public + hidden)
    const allTests = [...(question.publicTests || []), ...(question.hiddenTests || [])];
    const testResults = [];
    let passedCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < allTests.length; i++) {
      const tc = allTests[i];
      const isHidden = i >= (question.publicTests || []).length;
      const outcome = await evaluateSingleTestCase(language, code, tc.input, tc.expectedOutput);

      if (outcome.passed) passedCount++;

      testResults.push({
        testIndex: i + 1,
        index: i + 1,
        isHidden,
        passed: outcome.passed,
        duration: outcome.duration,
        durationMs: outcome.duration,
        error: outcome.passed ? null : (isHidden ? "Test failed" : outcome.error),
        input: isHidden ? `[Hidden Test Case #${i + 1}]` : tc.input,
        expected: isHidden ? `[Hidden Output #${i + 1}]` : tc.expectedOutput,
        expectedOutput: isHidden ? `[Hidden Output #${i + 1}]` : tc.expectedOutput,
        actual: isHidden ? (outcome.passed ? "[Passed]" : "[Failed Output]") : outcome.actual,
        actualOutput: isHidden ? (outcome.passed ? "[Passed]" : "[Failed Output]") : outcome.actual,
      });
    }

    const totalTests = allTests.length;
    const isSolved = passedCount === totalTests && totalTests > 0;
    const totalRuntimeMs = Date.now() - startTime;

    // Persist code and submission in attempt
    if (!attempt.codingSubmissions[questionIndex]) {
      attempt.codingSubmissions[questionIndex] = {};
    }

    attempt.codingSubmissions[questionIndex] = {
      questionId: question.questionId,
      code,
      language,
      solved: isSolved,
      passedTests: passedCount,
      totalTests,
      testResults,
      runtimeMs: totalRuntimeMs,
      submittedAt: new Date(),
    };

    attempt.markModified("codingSubmissions");
    await attempt.save();

    res.json({
      success: true,
      status: isSolved ? "ACCEPTED" : "WRONG_ANSWER",
      isSolved,
      solved: isSolved,
      results: testResults,
      testResults,
      passedCount,
      passedTests: passedCount,
      total: totalTests,
      totalTests,
      questionIndex,
      message: isSolved
        ? `🎉 Question ${questionIndex + 1} solved! All ${totalTests}/${totalTests} tests passed.`
        : `${passedCount}/${totalTests} tests passed. You must pass every test to satisfy the certification requirement.`,
    });
  } catch (err) {
    console.error("Code submission error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. POST /api/certifications/attempt/:attemptId/proctoring-event
// Records telemetry violations
// -------------------------------------------------------------
router.post("/attempt/:attemptId/proctoring-event", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { type, details } = req.body;

    const attempt = await CertificationAttempt.findOne({
      attemptId: req.params.attemptId,
      userId,
      status: "IN_PROGRESS",
    });

    if (!attempt) {
      return res.status(404).json({ error: "Active attempt not found" });
    }

    const now = new Date();
    const events = attempt.proctoring.events || [];
    const lastEvent = events.length > 0 ? events[events.length - 1] : null;

    // Deduplicate rapid repeat events from browser of exact same type within 800ms
    if (
      lastEvent &&
      lastEvent.type === type &&
      lastEvent.timestamp &&
      now.getTime() - new Date(lastEvent.timestamp).getTime() < 800
    ) {
      return res.json({
        success: true,
        duplicateIgnored: true,
        violationsCount: attempt.proctoring.violationsCount,
        chancesRemaining: Math.max(0, 5 - (attempt.proctoring.violationsCount || 0)),
        status: attempt.proctoring.status,
      });
    }

    attempt.proctoring.violationsCount = (attempt.proctoring.violationsCount || 0) + 1;
    if (type === "TAB_SWITCH" || type === "VISIBILITY_LOST" || type === "WINDOW_BLUR") {
      attempt.proctoring.tabSwitches = (attempt.proctoring.tabSwitches || 0) + 1;
    } else if (type === "FULLSCREEN_EXIT") {
      attempt.proctoring.fullscreenExits = (attempt.proctoring.fullscreenExits || 0) + 1;
    }

    attempt.proctoring.events.push({
      type: type || "VIOLATION",
      details: details || "Proctoring anomaly recorded",
      timestamp: now,
    });

    // Flag attempt if violations exhaust all 5 chances
    if (attempt.proctoring.violationsCount >= 5) {
      attempt.proctoring.status = "FLAGGED";
      pushAdminNotification({
        title: "Proctoring Integrity Flagged — 5 Violations",
        message: `${attempt.candidateName || "Candidate"} (${attempt.candidateEmail || "Student"}) exhausted all 5 recovery chances during ${attempt.certTitle || "Certification Exam"}. Assessment auto-locked.`,
        type: "certification",
        severity: "warning",
        targetId: String(attempt._id),
        actionUrl: "/admin/assessments",
        io: req.app.get("io"),
      }).catch(() => {});
    }

    await attempt.save();

    res.json({
      success: true,
      violationsCount: attempt.proctoring.violationsCount,
      chancesRemaining: Math.max(0, 5 - attempt.proctoring.violationsCount),
      status: attempt.proctoring.status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 8. POST /api/certifications/attempt/:attemptId/finalize
// Evaluates entire assessment, determines pass/fail, and issues certificate
// -------------------------------------------------------------
router.post("/attempt/:attemptId/finalize", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const attempt = await CertificationAttempt.findOne({
      attemptId: req.params.attemptId,
      userId,
    });

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    // Merge any latest client-side submitted MCQ answers if provided in payload
    if (req.body.mcqAnswers && typeof req.body.mcqAnswers === "object") {
      Object.entries(req.body.mcqAnswers).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== -1) {
          if (attempt.mcqAnswers && typeof attempt.mcqAnswers.set === "function") {
            attempt.mcqAnswers.set(String(k), Number(v));
          } else {
            if (!attempt.mcqAnswers) attempt.mcqAnswers = {};
            attempt.mcqAnswers[String(k)] = Number(v);
          }
        }
      });
      attempt.markModified("mcqAnswers");
    }

    // Merge any latest coding submissions if provided in payload
    if (Array.isArray(req.body.codingSubmissions) && req.body.codingSubmissions.length > 0) {
      req.body.codingSubmissions.forEach((sub, idx) => {
        if (sub && sub.code) {
          if (!attempt.codingSubmissions[idx]) attempt.codingSubmissions[idx] = {};
          attempt.codingSubmissions[idx] = {
            ...attempt.codingSubmissions[idx],
            questionId: sub.questionId || attempt.selectedCodingQuestions[idx]?.questionId,
            code: sub.code,
            language: sub.language || "python",
            solved: Boolean(sub.solved),
            passedTests: sub.passedTests !== undefined ? sub.passedTests : attempt.codingSubmissions[idx]?.passedTests || 0,
            totalTests: sub.totalTests !== undefined ? sub.totalTests : 10,
            testResults: sub.testResults || attempt.codingSubmissions[idx]?.testResults || [],
            submittedAt: new Date(),
          };
        }
      });
      attempt.markModified("codingSubmissions");
    }

    // Merge violations count if provided in payload
    if (req.body.violationsCount !== undefined && Number(req.body.violationsCount) > (attempt.proctoring.violationsCount || 0)) {
      attempt.proctoring.violationsCount = Number(req.body.violationsCount);
      if (attempt.proctoring.violationsCount >= 5) {
        attempt.proctoring.status = "FLAGGED";
      }
    }

    // Idempotency: if already submitted, return the final result
    if (attempt.status === "PASSED" || attempt.status === "FAILED") {
      const existingCert = attempt.certificateId
        ? await IssuedCertificate.findOne({ certificateId: attempt.certificateId })
        : null;

      return res.json({
        success: true,
        alreadyFinalized: true,
        attemptId: attempt.attemptId,
        finalVerdict: attempt.finalVerdict,
        score: attempt.score || attempt.totalMarksObtained,
        percentage: attempt.percentage || attempt.finalScorePercentage,
        mcqScore: attempt.mcqScore,
        mcqPassed: attempt.mcqPassed,
        codingPassed: attempt.codingSubmissions.every((s) => s.solved),
        proctoringPassed: attempt.proctoring.status === "COMPLIANT",
        certificate: existingCert,
      });
    }

    // 1. Grade MCQs against server-side stored answer keys (20 MCQs = 20 Marks)
    let mcqScore = 0;
    const totalMcqs = attempt.selectedMcqs.length || 20;
    const mcqAnswersMap = attempt.mcqAnswers || new Map();

    attempt.selectedMcqs.forEach((q) => {
      const candidateAns = mcqAnswersMap.get ? mcqAnswersMap.get(String(q.id)) : mcqAnswersMap[String(q.id)];
      if (candidateAns !== undefined && candidateAns !== null && Number(candidateAns) === Number(q.correctAnswer)) {
        mcqScore++;
      }
    });

    const mcqPercentage = Math.round((mcqScore / totalMcqs) * 100);

    // 2. Grade Coding Questions (2 Coding Questions with 10 Test Cases each = 20 Marks)
    const codingSubmissions = attempt.codingSubmissions || [];
    let passedCodingTests = 0;
    codingSubmissions.forEach((s) => {
      passedCodingTests += Number(s.passedTests || 0);
    });

    // 3. Combined Grading (20 MCQs + 20 Coding Tests = 40 Total Marks)
    const totalMaxMarks = 40;
    const totalMarksObtained = mcqScore + passedCodingTests;
    const finalScorePercentage = Math.round((totalMarksObtained / totalMaxMarks) * 100);

    // 4. Combined Passing Threshold: Combined Result >= 80% (>= 32/40 marks) + Proctoring <= 5 violations
    const proctoringPassed = attempt.proctoring.status !== "FLAGGED" && (attempt.proctoring.violationsCount || 0) <= 5;
    const passed = finalScorePercentage >= 80 && proctoringPassed;
    const finalVerdict = passed ? "PASSED" : "FAILED";

    const mcqPassed = mcqScore >= 16;
    const codingPassed = passedCodingTests >= 16;
    attempt.status = finalVerdict;
    attempt.finalVerdict = finalVerdict;
    attempt.mcqScore = mcqScore;
    attempt.mcqPassed = mcqPassed;
    attempt.codingPassed = codingPassed;
    attempt.score = totalMarksObtained;
    attempt.percentage = finalScorePercentage;
    attempt.totalMarksObtained = totalMarksObtained;
    attempt.totalMaxMarks = totalMaxMarks;
    attempt.finalScorePercentage = finalScorePercentage;
    attempt.submittedAt = new Date();

    let issuedCert = null;

    if (passed) {
      // 5. Issue Certificate (Idempotent: check if already exists for this attempt)
      let certificate = await IssuedCertificate.findOne({ attemptId: attempt.attemptId });

      if (!certificate) {
        const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const certificateId = `MZ-DSA-2026-${uniqueSuffix}`;
        const verificationUrl = `${req.protocol}://${req.get("host")}/verify/${certificateId}`;

        certificate = new IssuedCertificate({
          certificateId,
          attemptId: attempt.attemptId,
          userId,
          recipientName: attempt.candidateName,
          certificationId: attempt.certId,
          certificationTitle: attempt.certTitle,
          issueDate: new Date(),
          mcqScore,
          mcqScorePercentage: mcqPercentage,
          codingScore: `${passedCodingTests}/20 Tests Passed`,
          finalGradePercentage: finalScorePercentage,
          verificationUrl,
          status: "VALID",
        });

        await certificate.save();

        // Generate the PDF file asynchronously in the background (non-blocking)
        generateCertificatePDF({
          certificateId,
          userId: attempt.userId,
          recipientName: attempt.candidateName,
          certificationTitle: attempt.certTitle,
          issueDate: certificate.issueDate,
          mcqScore,
          mcqPercentage,
          codingScore: `${passedCodingTests}/20 Tests Passed`,
          finalGradePercentage: finalScorePercentage,
          verificationUrl,
        }).catch((pdfErr) => {
          console.warn("PDF generation background note:", pdfErr.message);
        });
      }

      attempt.certificateId = certificate.certificateId;
      issuedCert = certificate;

      // Update Certification model record
      await Certification.findOneAndUpdate(
        { userId, certId: attempt.certId },
        {
          zone: "CODING",
          name: attempt.certTitle,
          totalModules: CURRICULUM.dsa ? CURRICULUM.dsa.length : 5,
          currentModule: CURRICULUM.dsa ? CURRICULUM.dsa.length : 5,
          progress: 100,
          status: "completed",
        },
        { upsert: true, new: true }
      );

      // Log progress achievement
      try {
        await Progress.create({
          userId,
          track: "CODING",
          task: `Earned Credential: ${attempt.certTitle}`,
          moduleName: "Credential Assessment",
          hoursSpent: 2.5,
          xpEarned: 350,
          score: mcqPercentage,
          status: "completed",
          date: new Date(),
        });
      } catch (progErr) {
        console.warn("Progress log note:", progErr.message);
      }

      // Send real-time notification
      await pushNotification(req.app, {
        userId,
        title: "Official Certification Achieved!",
        message: `Congratulations! You scored ${mcqScore}/20 on MCQs and solved 2/2 coding challenges to earn the verified ${attempt.certTitle} credential.`,
        type: "certification",
        severity: "success",
        actionUrl: `/verify/${certificate.certificateId}`,
        actionLabel: "View Verified Certificate",
        meta: { certificateId: certificate.certificateId },
      });

      // Dispatch Official Certificate Email in background
      try {
        const userObj = await User.findById(userId).select("fullName username email").lean();
        const recipientEmail = attempt.candidateEmail || userObj?.email || req.user.email;
        const recipientName = attempt.candidateName || userObj?.fullName || userObj?.username || "Candidate";
        sendCertificateAwardedEmail({
          candidateEmail: recipientEmail,
          candidateName: recipientName,
          certTitle: attempt.certTitle,
          certificateId: certificate.certificateId,
          score: finalScorePercentage,
          req,
        }).catch((emailErr) => {
          console.warn("Certificate email notification note:", emailErr?.message);
        });
      } catch (userErr) {
        console.warn("User lookup note for email:", userErr.message);
      }
    }

    await attempt.save();

    // Notify Super Admin of examination completion
    pushAdminNotification({
      title: passed ? "Certification Exam Passed" : "Certification Exam Completed",
      message: `${attempt.candidateName || "Candidate"} (${attempt.candidateEmail || "Student"}) completed ${attempt.certTitle} — Verdict: ${finalVerdict} (MCQ: ${mcqScore}/20, Coding: ${passedCodingTests}/20 tests).`,
      type: "certification",
      severity: passed ? "success" : "warning",
      targetId: String(attempt._id),
      actionUrl: "/admin/assessments",
      io: req.app.get("io"),
    }).catch(() => {});

    res.json({
      success: true,
      alreadyFinalized: false,
      attemptId: attempt.attemptId,
      finalVerdict,
      score: totalMarksObtained,
      percentage: finalScorePercentage,
      totalMarksObtained,
      totalMaxMarks,
      finalScorePercentage,
      mcqScore,
      mcqPercentage,
      mcqPassed,
      codingPassed,
      proctoringPassed,
      scores: {
        mcqScore,
        mcqTotal: 20,
        mcqPercentage,
        mcqPassed,
        codingSolvedCount: codingSubmissions.filter((s) => s.solved).length,
        codingPassed,
        passedAll: passed,
      },
      proctoringAudit: attempt.proctoring,
      codingSubmissions: attempt.codingSubmissions.map((s) => ({
        questionId: s.questionId,
        solved: s.solved,
        passedTests: s.passedTests,
        totalTests: s.totalTests,
      })),
      certificate: issuedCert,
      message: passed
        ? `Congratulations ${attempt.candidateName}! You have successfully earned your official ${attempt.certTitle} credential.`
        : `Assessment not passed. You scored ${mcqScore}/20 on MCQs (min 16 required) and solved ${codingSubmissions.filter((s) => s.solved).length}/2 coding challenges. Review the syllabus and try again.`,
    });
  } catch (err) {
    console.error("Finalization error:", err);
    res.status(500).json({ error: err.message || "Failed to finalize certification attempt" });
  }
});

// -------------------------------------------------------------
// 9. GET /api/certifications/attempt/:attemptId/report
// Returns complete verified assessment report
// -------------------------------------------------------------
router.get("/attempt/:attemptId/report", optionalAuthenticateToken, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const rawAttemptId = (req.params.attemptId || "").trim();
    let attempt = await CertificationAttempt.findOne({
      $or: [
        { attemptId: rawAttemptId },
        { certificateId: rawAttemptId },
      ],
    });

    if (!attempt && mongoose.Types.ObjectId.isValid(rawAttemptId)) {
      attempt = await CertificationAttempt.findById(rawAttemptId);
    }

    if (!attempt) {
      return res.status(404).json({ error: "Assessment report not found" });
    }

    // Enrich candidate details with actual registered user if available
    let resolvedCandidateName = attempt.candidateName || "Verified Candidate";
    let resolvedCandidateEmail = attempt.candidateEmail || "candidate@masteryzone.edu";
    let targetUid = attempt.userId;
    if (!targetUid && req.user) {
      targetUid = req.user.userId || req.user.id || req.user._id;
    }

    if (targetUid && mongoose.Types.ObjectId.isValid(targetUid)) {
      const u = await User.findById(targetUid).select("fullName username email").lean();
      if (u) {
        resolvedCandidateName = u.fullName || u.username || resolvedCandidateName;
        resolvedCandidateEmail = u.email || resolvedCandidateEmail;
      }
    }

    const certificate = attempt.certificateId
      ? await IssuedCertificate.findOne({ certificateId: attempt.certificateId })
      : null;

    // Rich coding questions list for AssessmentReportPage
    const codingQuestionsReport = attempt.selectedCodingQuestions.map((q, idx) => {
      const sub = attempt.codingSubmissions[idx] || {};
      const tResults = Array.isArray(sub.testResults) ? sub.testResults : [];
      return {
        questionId: q.questionId,
        title: q.title,
        difficulty: q.difficulty || "Medium",
        category: q.category || "Algorithms",
        description: q.description || "",
        inputFormat: q.inputFormat || "",
        outputFormat: q.outputFormat || "",
        constraints: q.constraints || [],
        examples: q.examples || [],
        submittedCode: sub.code || "",
        language: sub.language || "python",
        status: sub.solved ? "passed" : "failed",
        score: Math.round(((sub.passedTests || 0) / Math.max(1, sub.totalTests || 10)) * 100),
        marksObtained: Math.round(((sub.passedTests || 0) / Math.max(1, sub.totalTests || 10)) * 50),
        totalMarks: 50,
        passedTests: sub.passedTests || 0,
        totalTests: sub.totalTests || 10,
        testResults: tResults.map((tr, tIdx) => ({
          testIndex: tr.testIndex || tIdx + 1,
          passed: Boolean(tr.passed),
          input: tr.input || "Hidden evaluation input",
          expectedOutput: tr.expectedOutput || "Hidden expected output",
          actualOutput: tr.actualOutput || (tr.passed ? tr.expectedOutput : "Failed output"),
          durationMs: tr.durationMs || 12,
          isHidden: Boolean(tr.isHidden),
        })),
        submittedAt: attempt.submittedAt || new Date(),
      };
    });

    // Rich MCQ breakdown for AssessmentReportPage
    const reviewBreakdown = attempt.selectedMcqs.map((mcq, idx) => {
      const answersMap = attempt.mcqAnswers;
      const selected =
        answersMap instanceof Map
          ? answersMap.get(String(mcq.id))
          : answersMap
          ? answersMap[String(mcq.id)]
          : undefined;
      const isUnanswered = selected === undefined || selected === null || selected === -1;
      const isCorrect = !isUnanswered && Number(selected) === Number(mcq.correctAnswer);
      return {
        questionId: mcq.id,
        question: mcq.question,
        options: mcq.options,
        userSelected: isUnanswered ? null : Number(selected),
        selectedOption: isUnanswered ? null : Number(selected),
        correctIndex: Number(mcq.correctAnswer),
        correctOption: Number(mcq.correctAnswer),
        isCorrect: Boolean(isCorrect),
        topic: mcq.topic || "Algorithm & Complexity",
        explanation: mcq.explanation || "Review fundamental concepts of algorithm analysis and data structures.",
        codeSnippet: mcq.codeSnippet || "",
        marksAwarded: isCorrect ? 1 : 0,
        maxMarks: 1,
      };
    });

    const isPassed = attempt.status === "PASSED" || attempt.finalVerdict === "PASSED";
    const totalPassedCodingTests = attempt.codingSubmissions.reduce((acc, s) => acc + (s.passedTests || 0), 0);
    const totalCodingTests = attempt.codingSubmissions.reduce((acc, s) => acc + (s.totalTests || 10), 0);
    const calculatedMarks = (attempt.mcqScore || 0) + totalPassedCodingTests;
    const totalMaxMarks = 40;
    const calculatedPct = Math.round((calculatedMarks / totalMaxMarks) * 100);
    const overallPercentage =
      attempt.finalScorePercentage != null && attempt.finalScorePercentage > 0
        ? attempt.finalScorePercentage
        : attempt.percentage != null && attempt.percentage > 0
        ? attempt.percentage
        : calculatedPct;
    const marksObtainedFinal =
      attempt.totalMarksObtained != null && attempt.totalMarksObtained > 0
        ? attempt.totalMarksObtained
        : attempt.score != null && attempt.score > 0
        ? attempt.score
        : calculatedMarks;

    const answeredMcqsCount = attempt.selectedMcqs.filter((m) => {
      const answersMap = attempt.mcqAnswers;
      const sel =
        answersMap instanceof Map
          ? answersMap.get(String(m.id))
          : answersMap
          ? answersMap[String(m.id)]
          : undefined;
      return sel !== undefined && sel !== null && sel !== -1;
    }).length;
    const answeredCodingCount = attempt.codingSubmissions.filter((s) => s.solved || s.passedTests > 0).length;
    const totalAttemptedQuestions = answeredMcqsCount + answeredCodingCount;
    const totalQuestionsCount = attempt.selectedMcqs.length + attempt.selectedCodingQuestions.length;

    res.json({
      success: true,
      report: {
        sessionId: attempt.attemptId,
        attemptId: attempt.attemptId,
        certId: attempt.certId,
        assessmentTitle: `${attempt.certTitle} — Proctored Credential Examination`,
        certTitle: attempt.certTitle,
        attemptNumber: attempt.attemptNumber,
        candidateName: resolvedCandidateName,
        candidateEmail: resolvedCandidateEmail,
        candidateDetails: {
          fullName: resolvedCandidateName,
          email: resolvedCandidateEmail,
          candidateId: attempt.userId ? `CAND-${attempt.userId.toString().slice(-6).toUpperCase()}` : "CAND-CERT",
        },
        startTime: attempt.startTime,
        submissionTime: attempt.submittedAt || attempt.updatedAt || new Date(),
        submittedAt: attempt.submittedAt,
        durationSeconds: (attempt.durationMinutes || 90) * 60,
        timeLimitMinutes: attempt.durationMinutes || 90,
        status: isPassed ? "passed" : "failed",
        finalVerdict: attempt.finalVerdict,
        scorecard: {
          totalQuestions: totalQuestionsCount,
          questionsAttempted: totalAttemptedQuestions,
          questionsUnanswered: Math.max(0, totalQuestionsCount - totalAttemptedQuestions),
          totalMarks: totalMaxMarks,
          marksObtained: marksObtainedFinal,
          overallPercentage,
          totalTestCases: totalCodingTests,
          totalPassedTests: totalPassedCodingTests,
          passed: isPassed,
          grade:
            overallPercentage >= 90
              ? "A+"
              : overallPercentage >= 80
              ? "A"
              : overallPercentage >= 70
              ? "B"
              : overallPercentage >= 60
              ? "C"
              : "F",
        },
        performance: {
          score: overallPercentage,
          passed: isPassed,
          passedTests: totalPassedCodingTests,
          totalTests: totalCodingTests,
          marksObtained: marksObtainedFinal,
          totalMarks: totalMaxMarks,
          mcqScore: attempt.mcqScore,
          mcqTotal: attempt.selectedMcqs.length,
          codingSolvedCount: attempt.codingSubmissions.filter((s) => s.solved).length,
          passingThreshold: 80,
        },
        adminNote: attempt.adminNote || "",
        adminModifiedAt: attempt.adminModifiedAt || null,
        adminModifiedBy: attempt.adminModifiedBy || "",
        isMcq: false,
        questions: codingQuestionsReport,
        reviewBreakdown,
        proctoring: {
          status: (attempt.proctoring?.violationsCount || 0) === 0 ? "Compliant" : "Audit Flagged",
          violationsCount: attempt.proctoring?.violationsCount || 0,
          tabSwitches: attempt.proctoring?.tabSwitches || 0,
          fullscreenExits: attempt.proctoring?.fullscreenExits || 0,
          candidatePhoto: attempt.proctoring?.candidatePhoto || null,
          deviceVerified: true,
          integrityRating: Math.max(50, 100 - (attempt.proctoring?.violationsCount || 0) * 10),
        },
        certificate: certificate
          ? {
              certificateId: certificate.certificateId,
              issueDate: certificate.issueDate,
              verificationUrl: certificate.verificationUrl,
              downloadUrl: `/api/certifications/certificate/${certificate.certificateId}/download`,
              status: certificate.status,
            }
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 10. GET /api/certifications/my-history
// Returns authenticated user's attempts and earned certificates
// -------------------------------------------------------------
router.get("/my-history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const attempts = await CertificationAttempt.find({ userId })
      .sort({ createdAt: -1 })
      .select("attemptId certId certTitle attemptNumber status percentage score adminNote mcqScore mcqPassed finalVerdict certificateId startTime submittedAt codingSubmissions proctoring");

    const certificates = await IssuedCertificate.find({ userId, status: "VALID" })
      .sort({ createdAt: -1 });

    const formattedAttempts = attempts.map((att) => ({
      attemptId: att.attemptId,
      certId: att.certId,
      certTitle: att.certTitle,
      attemptNumber: att.attemptNumber,
      status: att.status,
      finalVerdict: att.finalVerdict,
      mcqScore: att.mcqScore,
      mcqPercentage: att.percentage != null ? att.percentage : Math.round(((att.mcqScore || 0) / 20) * 100),
      percentage: att.percentage != null ? att.percentage : Math.round(((att.mcqScore || 0) / 20) * 100),
      score: {
        mcqScore: att.mcqScore ?? 0,
        mcqTotal: 20,
        mcqPercentage: att.percentage != null ? att.percentage : Math.round(((att.mcqScore || 0) / 20) * 100),
        mcqPassed: (att.percentage != null ? att.percentage >= 70 : Boolean(att.mcqPassed)),
        codingPassed: (att.codingSubmissions || []).some((s) => s.solved),
        codingQ1Solved: Boolean(att.codingSubmissions?.[0]?.solved),
        codingQ2Solved: Boolean(att.codingSubmissions?.[1]?.solved),
      },
      adminNote: att.adminNote || "",
      codingQuestion1Solved: Boolean(att.codingSubmissions?.[0]?.solved),
      codingQuestion2Solved: Boolean(att.codingSubmissions?.[1]?.solved),
      proctoringStatus: att.proctoring?.status || "COMPLIANT",
      violationsCount: att.proctoring?.violationsCount || 0,
      certificateId: att.certificateId,
      startTime: att.startTime,
      submittedAt: att.submittedAt,
    }));

    res.json({
      success: true,
      attempts: formattedAttempts,
      certificates,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 11. GET /api/certifications/verify/:certificateId
// Public verification endpoint
// -------------------------------------------------------------
router.get("/verify/:certificateId", async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await IssuedCertificate.findOne({ certificateId });

    if (!cert) {
      return res.status(404).json({
        valid: false,
        message: "No credential found with this ID. Verification failed.",
      });
    }

    res.json({
      valid: cert.status === "VALID",
      certificateId: cert.certificateId,
      recipientName: cert.recipientName,
      certificationTitle: cert.certificationTitle,
      issueDate: cert.issueDate,
      issuingOrganization: cert.issuingOrganization,
      mcqScore: cert.mcqScore,
      codingScore: cert.codingScore,
      status: cert.status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 12. GET /api/certifications/certificate/:certificateId/download (and alias /download/:certificateId)
// Downloads the high-resolution vector PDF certificate
// -------------------------------------------------------------
router.get(["/certificate/:certificateId/download", "/download/:certificateId"], async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await IssuedCertificate.findOne({ certificateId, status: "VALID" });

    if (!cert) {
      return res.status(404).send("Valid certificate record not found.");
    }

    const userScopedDir = cert.userId ? path.join(CERTIFICATES_DIR, String(cert.userId)) : null;
    const userScopedPath = userScopedDir ? path.join(userScopedDir, `${certificateId}.pdf`) : null;
    const flatPath = path.join(CERTIFICATES_DIR, `${certificateId}.pdf`);

    let pdfPath = (userScopedPath && fs.existsSync(userScopedPath))
      ? userScopedPath
      : flatPath;

    // If PDF file does not exist on disk, regenerate it on the fly
    if (!fs.existsSync(pdfPath)) {
      await generateCertificatePDF({
        certificateId: cert.certificateId,
        userId: cert.userId,
        recipientName: cert.recipientName,
        certificationTitle: cert.certificationTitle,
        issueDate: cert.issueDate,
        mcqScore: cert.mcqScore,
        mcqPercentage: cert.mcqScorePercentage,
        codingScore: cert.codingScore,
        verificationUrl: cert.verificationUrl,
      });
      pdfPath = (userScopedPath && fs.existsSync(userScopedPath)) ? userScopedPath : flatPath;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="MasteryZone_${cert.certificationId}_${cert.certificateId}.pdf"`
    );

    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);
  } catch (err) {
    console.error("PDF download error:", err);
    res.status(500).send("Error generating certificate download.");
  }
});

// -------------------------------------------------------------
// LEGACY COMPATIBILITY: Enroll & Progress for Fitness, Language, Driving
// -------------------------------------------------------------
router.post("/enroll", authenticateToken, async (req, res) => {
  try {
    const { zone, certId, name, totalModules, isTrial } = req.body;
    const existing = await Certification.findOne({ userId: req.user.userId, certId });
    if (existing) {
      return res.status(400).json({ message: "Already enrolled in this certification" });
    }

    const trialExpiresAt = isTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;
    const status = isTrial ? "active" : "completed";
    const progress = isTrial ? 0 : 100;
    const currentModule = isTrial ? 1 : totalModules;

    const newCert = new Certification({
      userId: req.user.userId,
      zone,
      certId,
      name,
      totalModules,
      isTrial,
      trialExpiresAt,
      status,
      progress,
      currentModule,
    });

    await newCert.save();
    res.status(201).json({ message: "Successfully enrolled", certification: newCert });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

router.put("/progress", authenticateToken, async (req, res) => {
  try {
    const { certId } = req.body;
    const cert = await Certification.findOne({ userId: req.user.userId, certId });
    if (!cert) return res.status(404).json({ message: "Certification not found" });

    cert.currentModule += 1;
    cert.progress = Math.min((cert.currentModule / cert.totalModules) * 100, 100);
    if (cert.progress >= 100) cert.status = "completed";
    await cert.save();

    res.json({ message: "Progress updated", certification: cert });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = router;
