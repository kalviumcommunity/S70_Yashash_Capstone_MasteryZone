const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { optionalAuthenticateToken } = require("../middleware/authMiddleware");
const { ALL_CURRICULA, getCurriculumFor, getSubjectModule } = require("../data/curriculumRegistry");
const SubjectProgress = require("../models/SubjectProgress");
const CodingProgress = require("../models/CodingProgress");
const ModuleAssessmentAttempt = require("../models/ModuleAssessmentAttempt");
const ProctoredCodingSession = require("../models/ProctoredCodingSession");
const Progress = require("../models/ProgressSchema");
const User = require("../models/User");
const { pushNotification } = require("../utils/notificationService");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Toolchain path helpers
const PYTHON_BIN = fs.existsSync("/usr/bin/python3") ? "/usr/bin/python3" : "python3";
const NODE_BIN = fs.existsSync("/usr/local/bin/node") ? "/usr/local/bin/node" : "node";
const JAVAC_BIN = fs.existsSync("/opt/homebrew/opt/openjdk/bin/javac")
  ? "/opt/homebrew/opt/openjdk/bin/javac"
  : fs.existsSync("/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/javac")
  ? "/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/javac"
  : "javac";
const JAVA_BIN = fs.existsSync("/opt/homebrew/opt/openjdk/bin/java")
  ? "/opt/homebrew/opt/openjdk/bin/java"
  : fs.existsSync("/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/java")
  ? "/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/java"
  : "java";
const GPP_BIN = fs.existsSync("/usr/bin/clang++")
  ? "/usr/bin/clang++"
  : fs.existsSync("/usr/bin/g++")
  ? "/usr/bin/g++"
  : "g++";

// Sandboxed execution helper for coding exercises
function executeInSandbox(language, code, stdinInput = "", timeoutMs = 8000) {
  return new Promise((resolve) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mz_curriculum_sandbox_"));
    let cmd = "";
    let args = [];
    let codeFilePath = "";

    const cleanUp = () => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    };

    try {
      if (language === "python" || language === "py") {
        codeFilePath = path.join(tempDir, "solution.py");
        fs.writeFileSync(codeFilePath, code);
        cmd = PYTHON_BIN;
        args = [codeFilePath];
      } else if (language === "javascript" || language === "js" || language === "node") {
        codeFilePath = path.join(tempDir, "solution.js");
        fs.writeFileSync(codeFilePath, code);
        cmd = NODE_BIN;
        args = [codeFilePath];
      } else if (language === "java") {
        let className = "Main";
        const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
        if (classMatch && classMatch[1]) className = classMatch[1];
        codeFilePath = path.join(tempDir, `${className}.java`);
        fs.writeFileSync(codeFilePath, code);
        try {
          const { execSync } = require("child_process");
          execSync(`${JAVAC_BIN} "${codeFilePath}"`, { timeout: 6000 });
        } catch (compileErr) {
          cleanUp();
          return resolve({
            output: "",
            error: `Compilation Error:\n${compileErr.stderr?.toString() || compileErr.message}`,
            duration: 0,
            exitCode: 1,
          });
        }
        cmd = JAVA_BIN;
        args = ["-cp", tempDir, className];
      } else if (language === "cpp" || language === "c++") {
        codeFilePath = path.join(tempDir, "solution.cpp");
        const binPath = path.join(tempDir, "solution_bin");
        fs.writeFileSync(codeFilePath, code);
        try {
          const { execSync } = require("child_process");
          execSync(`${GPP_BIN} -std=c++17 "${codeFilePath}" -O2 -o "${binPath}"`, { timeout: 6000 });
        } catch (compileErr) {
          cleanUp();
          return resolve({
            output: "",
            error: `C++ Compilation Error:\n${compileErr.stderr?.toString() || compileErr.message}`,
            duration: 0,
            exitCode: 1,
          });
        }
        cmd = binPath;
        args = [];
      } else {
        cleanUp();
        return resolve({ output: "", error: `Unsupported language: ${language}`, duration: 0, exitCode: 1 });
      }
    } catch (writeErr) {
      cleanUp();
      return resolve({ output: "", error: `Setup error: ${writeErr.message}`, duration: 0, exitCode: 1 });
    }

    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let isSettled = false;

    const proc = spawn(cmd, args, { cwd: tempDir, env: { PATH: process.env.PATH, HOME: os.tmpdir() } });

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        proc.kill("SIGKILL");
        cleanUp();
        resolve({ output: stdout, error: "Time Limit Exceeded (> 8.0s)", duration: 8000, exitCode: 124 });
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
      if (stdout.length < 1024 * 512) stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk) => {
      if (stderr.length < 1024 * 512) stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        cleanUp();
        resolve({ output: stdout, error: err.message, duration: Date.now() - startTime, exitCode: 1 });
      }
    });

    proc.on("close", (code) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        cleanUp();
        resolve({ output: stdout, error: stderr, duration: Date.now() - startTime, exitCode: code || 0 });
      }
    });
  });
}

// -------------------------------------------------------------
// GET /api/curriculum/reports
// Returns centralized, multi-subject examination and assessment reports
// (Placed BEFORE parameterized routes to prevent route collision)
// -------------------------------------------------------------
router.get("/reports", authenticateToken, async (req, res) => {
  const userId = req.user.userId || req.user.id || req.user._id;
  const { subject, type, status } = req.query;

  try {
    const mongoose = require("mongoose");
    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    // 1. Fetch MCQ Proctored Exam Attempts
    const mcqAttempts = await ModuleAssessmentAttempt.find({
      $or: [{ userId }, { userId: userObjId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedMcq = mcqAttempts.map((a) => {
      const isPass = a.passed || a.percentage >= (a.passingScore || 80);
      const totalQ = a.totalQuestions || 10;
      const totalM = a.totalMarks || totalQ;
      const marksObt = a.marksObtained !== undefined ? a.marksObtained : a.score;
      const pct = a.percentage !== undefined ? a.percentage : Math.round((marksObt / totalM) * 100);
      const grade = a.grade || (pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "F");
      const attemptedCount = a.questionsAttempted ?? (a.userAnswers ? Object.keys(a.userAnswers).length : a.score);
      const accuracy = a.accuracy ?? (attemptedCount > 0 ? Math.round(((a.score || 0) / attemptedCount) * 100) : pct);

      return {
        id: a._id.toString(),
        sessionId: a.sessionId || `attempt_${a._id}`,
        attemptId: a._id.toString(),
        subjectKey: a.subjectKey || "coding",
        trackId: a.trackId || "python",
        moduleIndex: a.moduleIndex ?? 0,
        assessmentTitle: a.assessmentTitle || `${a.moduleTitle || "Curriculum Module"} — ${totalQ}-Question Proctored Exam`,
        questionTitle: a.moduleTitle || "Accreditation Examination",
        difficulty: a.moduleIndex <= 1 ? "Fundamentals" : a.moduleIndex <= 3 ? "Intermediate" : "Advanced",
        category: `${(a.subjectKey || "coding").toUpperCase()} Proctored Exam`,
        type: "mcq_exam",
        typeLabel: `${totalQ}-MCQ Proctored Exam`,
        submittedAt: a.submittedAt || a.createdAt,
        score: marksObt,
        marksObtained: marksObt,
        totalMarks: totalM,
        percentage: pct,
        rawScore: a.score || 0,
        grade,
        accuracy,
        passedTests: a.score || 0,
        totalTests: totalQ,
        totalQuestions: totalQ,
        questionsAttempted: attemptedCount,
        questionsUnanswered: a.questionsUnanswered ?? Math.max(0, totalQ - attemptedCount),
        durationSeconds: a.timeSpentSeconds || 0,
        passed: isPass,
        violationsCount: a.violationsCount || 0,
        reportUrl: `/assessment-report/${a.sessionId || `attempt_${a._id}`}`,
      };
    });

    // 2. Fetch Practical Coding Proctored Sessions
    let formattedCoding = [];
    try {
      const codingSessions = await ProctoredCodingSession.find({
        $or: [{ userId }, { userId: userObjId }],
        $and: [{ $or: [{ status: "submitted" }, { "submissionResult.submittedAt": { $exists: true } }] }],
      })
        .sort({ "submissionResult.submittedAt": -1, updatedAt: -1 })
        .lean();

      formattedCoding = codingSessions.map((s) => {
        const isPass = !!s.submissionResult?.passed || (s.submissionResult?.score || 0) >= 80;
        return {
          id: s.sessionId,
          sessionId: s.sessionId,
          subjectKey: "coding",
          trackId: s.questionId || "python",
          moduleIndex: 0,
          assessmentTitle: s.assessmentTitle || "MZ-ASM Coding Assessment",
          questionTitle: s.assessmentTitle || "Algorithmic Challenge",
          difficulty: "Challenge",
          category: "CODING Practical Assessment",
          type: "coding_assessment",
          typeLabel: "Practical Coding Assessment",
          candidateDetails: s.candidateDetails || {},
          submittedAt: s.submissionResult?.submittedAt || s.updatedAt || s.createdAt,
          score: s.submissionResult?.score || 0,
          percentage: s.submissionResult?.score || 0,
          grade: s.submissionResult?.grade || (isPass ? "A" : "F"),
          accuracy: s.submissionResult?.accuracy || (s.submissionResult?.score || 0),
          passedTests: s.submissionResult?.passedTests || 0,
          totalTests: s.submissionResult?.totalTests || 10,
          durationSeconds: s.submissionResult?.durationSeconds || 0,
          language: s.submissionResult?.language || s.draftLanguage || "python",
          passed: isPass,
          violationsCount: s.violationsCount || 0,
          reportUrl: `/assessment-report/${s.sessionId}`,
        };
      });
    } catch {}

    // 3. Fetch Real-World Project Submissions
    let formattedProjects = [];
    try {
      const ProjectSubmission = require("../models/ProjectSubmission");
      const projectSubs = await ProjectSubmission.find({
        $or: [{ userId }, { userId: String(userId) }],
      })
        .sort({ submittedAt: -1, createdAt: -1 })
        .lean();

      formattedProjects = projectSubs.map((ps) => {
        const passedTestsCount = (ps.testResults || []).filter((t) => t.passed).length;
        const totalTestsCount = (ps.testResults || []).length || 6;
        return {
          id: ps.sessionId,
          sessionId: ps.sessionId,
          projectId: ps.projectId,
          subjectKey: "coding",
          trackId: ps.language || "javascript",
          moduleIndex: 0,
          assessmentTitle: `${ps.projectTitle} — Project Evaluation`,
          questionTitle: ps.projectTitle,
          difficulty: ps.difficulty || "Intermediate",
          category: ps.projectCategory || "Project Assessment",
          type: "project_assessment",
          typeLabel: "Project Assessment",
          candidateDetails: ps.candidateDetails || {},
          submittedAt: ps.submittedAt || ps.createdAt,
          score: ps.marksObtained || 0,
          marksObtained: ps.marksObtained || 0,
          totalMarks: ps.totalMarks || 100,
          percentage: ps.percentage || 0,
          grade: ps.grade || (ps.passed ? "A" : "F"),
          accuracy: totalTestsCount > 0 ? Math.round((passedTestsCount / totalTestsCount) * 100) : ps.percentage || 0,
          passedTests: passedTestsCount,
          totalTests: totalTestsCount,
          durationSeconds: ps.durationSeconds || 0,
          language: ps.language || "javascript",
          passed: Boolean(ps.passed),
          badgeAwarded: Boolean(ps.badgeAwarded),
          attemptNumber: ps.attemptNumber || 1,
          violationsCount: 0,
          reportUrl: `/assessment-report/${ps.sessionId}`,
        };
      });
    } catch {}

    // 4. Fetch Certification Exam Attempts
    let formattedCerts = [];
    try {
      const CertificationAttempt = require("../models/CertificationAttempt");
      const userMatchOr = [{ userId }];
      if (userObjId) userMatchOr.push({ userId: userObjId });
      if (req.user?.email) userMatchOr.push({ candidateEmail: req.user.email });

      const certAttempts = await CertificationAttempt.find({
        $or: userMatchOr,
      })
        .sort({ submittedAt: -1, createdAt: -1 })
        .lean();

      formattedCerts = certAttempts.map((ca) => {
        const isPass = ca.status === "PASSED" || ca.finalVerdict === "PASSED";
        const totalMarks = ca.maxScore || 100;
        const pct = ca.percentage != null ? ca.percentage : (ca.finalPercentage || 0);
        const marksObtained = ca.score != null ? ca.score : pct;
        return {
          id: ca.attemptId,
          sessionId: ca.attemptId,
          attemptId: ca.attemptId,
          certificateId: ca.certificateId,
          subjectKey: "coding",
          trackId: ca.certId || "python",
          moduleIndex: 0,
          assessmentTitle: `${ca.certTitle} — Proctored Credential Examination`,
          questionTitle: ca.certTitle,
          difficulty: "Professional",
          category: "CODING Professional Certification",
          type: "certification_exam",
          typeLabel: "Professional Certification Exam",
          candidateDetails: {
            fullName: ca.candidateName,
            email: ca.candidateEmail,
            candidateId: String(ca.userId),
          },
          submittedAt: ca.submittedAt || ca.updatedAt || ca.createdAt,
          score: marksObtained,
          marksObtained,
          totalMarks,
          percentage: pct,
          adminNote: ca.adminNote || "",
          grade: ca.grade || (pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : "F"),
          accuracy: pct,
          passedTests: ca.codingScore || 0,
          totalTests: 20,
          durationSeconds: ca.timeSpentSeconds || 0,
          passed: isPass,
          violationsCount: ca.interruptionCount || 0,
          reportUrl: `/assessment-report/${ca.attemptId}`,
        };
      });
    } catch {}

    // Combine and apply filters
    let allReports = [...formattedMcq, ...formattedCoding, ...formattedProjects, ...formattedCerts].sort(
      (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
    );

    if (subject && subject.toUpperCase() !== "ALL") {
      const sLower = subject.toLowerCase();
      allReports = allReports.filter((r) => r.subjectKey?.toLowerCase() === sLower);
    }

    if (type && type.toUpperCase() !== "ALL") {
      const tLower = type.toLowerCase();
      allReports = allReports.filter((r) => {
        const rType = (r.type || "").toLowerCase();
        if (tLower === "mcq_exam" || tLower === "exam_mcq") return rType.includes("mcq") || rType.includes("exam");
        if (tLower === "coding_assessment" || tLower === "practical_code") return rType.includes("code") || rType.includes("practical") || rType.includes("coding");
        if (tLower === "project_assessment" || tLower === "project") return rType.includes("project");
        return rType === tLower;
      });
    }

    if (status && status.toUpperCase() !== "ALL") {
      if (status.toUpperCase() === "PASSED") {
        allReports = allReports.filter((r) => r.passed);
      } else if (status.toUpperCase() === "FAILED") {
        allReports = allReports.filter((r) => !r.passed);
      }
    }

    res.json({
      success: true,
      count: allReports.length,
      reports: allReports,
    });
  } catch (err) {
    console.error("Centralized reports error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/curriculum/assessment-attempt/:attemptId
// Returns detailed read-only audit attempt report for an MCQ exam
// (Placed BEFORE parameterized routes to prevent route collision)
// -------------------------------------------------------------
router.get("/assessment-attempt/:attemptId", optionalAuthenticateToken, async (req, res) => {
  const userId = req.user ? (req.user.userId || req.user.id || req.user._id) : null;
  const rawId = (req.params.attemptId || "").trim();
  const cleanId = rawId.startsWith("attempt_") ? rawId.replace("attempt_", "") : rawId;

  try {
    const mongoose = require("mongoose");
    let attempt = null;

    // 1. Search by ObjectId in ModuleAssessmentAttempt
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        attempt = await ModuleAssessmentAttempt.findOne({
          _id: cleanId,
          userId: new mongoose.Types.ObjectId(userId),
        }).lean();
      }

      if (!attempt) {
        attempt = await ModuleAssessmentAttempt.findById(cleanId).lean();
      }
    }

    // 2. Search by sessionId in ModuleAssessmentAttempt
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

    // 3. Fallback: check ProctoredCodingSession in case it is a coding session ID
    if (!attempt) {
      const codingSession = await ProctoredCodingSession.findOne({
        $or: [{ sessionId: rawId }, { sessionId: cleanId }],
      }).lean();

      if (codingSession) {
        return res.redirect(`/api/coding/proctored-session/${codingSession.sessionId}/report`);
      }

      // 4. Fallback: check CertificationAttempt
      const CertificationAttempt = require("../models/CertificationAttempt");
      const certAttempt = await CertificationAttempt.findOne({
        $or: [{ attemptId: rawId }, { attemptId: cleanId }, { certificateId: rawId }, { certificateId: cleanId }],
      }).lean();

      if (certAttempt) {
        return res.redirect(`/api/certifications/attempt/${certAttempt.attemptId}/report`);
      }

      return res.status(404).json({ error: "Assessment attempt not found" });
    }

    let user = null;
    const targetUserId = attempt.userId || userId;
    if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
      user = await User.findById(targetUserId).lean();
    }
    if (!user && req.user) {
      const authUid = req.user.userId || req.user.id || req.user._id;
      if (authUid && mongoose.Types.ObjectId.isValid(authUid)) {
        user = await User.findById(authUid).lean();
      }
    }
    const module = getSubjectModule(attempt.subjectKey, attempt.trackId, attempt.moduleIndex);
    const questions = (Array.isArray(attempt.questions) && attempt.questions.length > 0)
      ? attempt.questions
      : (module?.assessment?.questions || []);

    // Build comprehensive, accurate review breakdown
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
      reviewBreakdown = questions.map((q, qIdx) => {
        let userSelected = null;
        if (attempt.userAnswers) {
          if (typeof attempt.userAnswers.get === "function") {
            userSelected = attempt.userAnswers.get(String(qIdx)) ?? attempt.userAnswers.get(qIdx);
          } else {
            userSelected = attempt.userAnswers[qIdx] ?? attempt.userAnswers[String(qIdx)];
          }
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

    const totalQ = attempt.totalQuestions || questions.length || 10;
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

    const pKey = `${attempt.trackId}_${attempt.moduleIndex}`;
    const subProg = await SubjectProgress.findOne({ userId: attempt.userId || userId, subjectKey: attempt.subjectKey }).lean();
    const rawMod = subProg?.moduleProgress?.[pKey] || (subProg?.moduleProgress?.get ? subProg.moduleProgress.get(pKey) : null);
    const modProg = rawMod || {};

    let codingModProg = {};
    if (attempt.subjectKey === "coding") {
      const cp = await CodingProgress.findOne({ userId: attempt.userId || userId }).lean();
      const rawCp = cp?.moduleProgress?.[pKey] || (cp?.moduleProgress?.get ? cp.moduleProgress.get(pKey) : null);
      codingModProg = rawCp || {};
    }

    const isTheoryCompleted = Boolean(modProg.isStudied || codingModProg.isStudied);
    const theoryStudiedAt = modProg.studiedAt || codingModProg.studiedAt;
    const isExercisePassed = Boolean(modProg.exercisePassed || codingModProg.exercisePassed || modProg.assignmentPassed);
    const exerciseScore = modProg.exerciseScore ?? codingModProg.exerciseScore ?? (isExercisePassed ? 100 : 0);
    const exerciseCode = modProg.exerciseCode || codingModProg.exerciseCode || modProg.exerciseDraftCode || codingModProg.exerciseDraftCode || "";
    const exercisePassedAt = modProg.exercisePassedAt || codingModProg.exercisePassedAt;

    const unifiedMatrix = {
      theory: {
        completed: isTheoryCompleted,
        completedAt: theoryStudiedAt,
        title: `${attempt.moduleTitle} — Interactive Theory`,
        description: "Subject Fundamentals, Conceptual Architecture, and Practical Blueprints",
      },
      coding: {
        passed: isExercisePassed,
        score: exerciseScore,
        passedAt: exercisePassedAt,
        submittedCode: exerciseCode,
        taskTitle: module?.codingExercise?.taskTitle || module?.assignment?.title || "Practical Implementation Exercise",
        totalTests: module?.codingExercise?.testCases?.length || 10,
        passedTests: isExercisePassed ? (module?.codingExercise?.testCases?.length || 10) : Math.round(((exerciseScore || 0) / 100) * 10),
      },
      mcq: {
        score: marksObt,
        totalMarks: totalM,
        totalQuestions: totalQ,
        percentage: attempt.percentage,
        accuracy: accuracyPct,
        passed: isPass,
      },
      proctoring: {
        chancesRemaining: Math.max(0, 5 - (attempt.violationsCount || 0)),
        violationsCount: attempt.violationsCount || 0,
        camera: true,
        microphone: true,
        screenShare: true,
        fullscreen: true,
      },
      overall: {
        score: isExercisePassed ? Math.round((exerciseScore + attempt.percentage) / 2) : attempt.percentage,
        grade: gradeVal,
        passed: isPass && (attempt.subjectKey !== "coding" || isExercisePassed),
      },
    };

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
        fullName: user?.fullName || user?.name || user?.username || "Verified Candidate",
        email: user?.email || "candidate@masteryzone.edu",
        candidateId: `CAND-${(attempt.userId || userId || attempt._id || "GUEST").toString().slice(-6).toUpperCase()}`,
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
      submittedCode: exerciseCode,
      language: attempt.subjectKey === "coding" ? (attempt.trackId || "python") : "text",
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
      unifiedMatrix,
      isReadOnly: true,
    };

    res.json({ success: true, report });
  } catch (err) {
    console.error("Assessment attempt report fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/curriculum/:subjectKey/:trackId
// Retrieves all modules in a track for any subject
// -------------------------------------------------------------
router.get("/:subjectKey/:trackId", authenticateToken, async (req, res, next) => {
  const VALID_SUBJECTS = ["coding", "language", "driving", "fitness"];
  const normSubject = (req.params.subjectKey || "coding").toLowerCase();
  if (!VALID_SUBJECTS.includes(normSubject)) {
    return next();
  }
  try {
    const { subjectKey, trackId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;
    const normSubject = (subjectKey || "coding").toLowerCase();
    const normTrack = (trackId || "python").toLowerCase();

    const modules = getCurriculumFor(normSubject, normTrack);

    // Retrieve or initialize subject progress
    let subProg = await SubjectProgress.findOne({ userId, subjectKey: normSubject });
    if (!subProg) {
      subProg = await SubjectProgress.create({
        userId,
        subjectKey: normSubject,
        activeTrack: normTrack,
        trackUnlocks: { [normTrack]: 0 },
        trackLessons: { [normTrack]: 0 },
      });
    }

    // Also sync with CodingProgress if subject is coding
    let codingProg = null;
    if (normSubject === "coding") {
      codingProg = await CodingProgress.findOne({ userId });
      if (!codingProg) {
        codingProg = await CodingProgress.create({
          userId,
          activeTrack: `${normTrack.charAt(0).toUpperCase() + normTrack.slice(1)} Track`,
          trackUnlocks: { [normTrack]: 0 },
          trackLessons: { [normTrack]: 0 },
        });
      }
    }

    const unlockLevel =
      subProg.trackUnlocks?.get(normTrack) ??
      (codingProg ? codingProg.trackUnlocks?.get(normTrack) : 0) ??
      0;

    const modProgressMap = subProg.moduleProgress || new Map();
    const codingModMap = codingProg ? codingProg.moduleProgress || new Map() : new Map();

    const annotatedModules = modules.map((m) => {
      const pKey = `${normTrack}_${m.moduleIndex}`;
      const state = modProgressMap.get ? modProgressMap.get(pKey) : modProgressMap[pKey];
      const codingState = codingModMap.get ? codingModMap.get(pKey) : codingModMap[pKey];

      const isUnlocked = true; // All modules unlocked
      const isStudied = !!(state?.isStudied || codingState?.isStudied);
      const assignmentPassed = !!(
        state?.assignmentPassed ||
        state?.exercisePassed ||
        codingState?.exercisePassed
      );
      const assessmentPassed = !!(state?.assessmentPassed || codingState?.assessmentPassed);
      const bestScore = Math.max(state?.bestScore || 0, codingState?.bestScore || 0);
      const attemptsCount = Math.max(state?.attemptsCount || 0, codingState?.attemptsCount || 0);

      // Safe questions without exposing answer keys
      const safeQuestions = (m.assessment?.questions || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      }));

      return {
        id: m.id,
        trackId: m.trackId,
        subjectKey: normSubject,
        moduleIndex: m.moduleIndex,
        title: m.title,
        subtitle: m.subtitle,
        estimatedTime: m.estimatedTime,
        icon: m.icon,
        isUnlocked,
        isStudied,
        assignmentPassed,
        exercisePassed: assignmentPassed, // for backward compatibility
        assessmentPassed,
        bestScore,
        attemptsCount,
        totalQuestions: m.assessment?.questions?.length || 10,
        passingScore: m.assessment?.passingScore || 80,
        timeLimitSeconds: m.assessment?.timeLimitSeconds || 3600,
        safeQuestions,
        questions: safeQuestions, // dual alias
        assessment: {
          timeLimitSeconds: m.assessment?.timeLimitSeconds || 3600,
          passingScore: m.assessment?.passingScore || 80,
          totalQuestions: safeQuestions.length,
          questions: safeQuestions,
        },
      };
    });

    res.json({
      subjectKey: normSubject,
      trackId: normTrack,
      unlockLevel,
      modules: annotatedModules,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/curriculum/:subjectKey/:trackId/:moduleIndex
// Detailed module instructional content, practical assignment & assessment info
// -------------------------------------------------------------
router.get("/:subjectKey/:trackId/:moduleIndex", authenticateToken, async (req, res) => {
  try {
    const { subjectKey, trackId, moduleIndex } = req.params;
    const idx = parseInt(moduleIndex, 10);
    const userId = req.user.userId || req.user.id || req.user._id;
    const normSubject = (subjectKey || "coding").toLowerCase();
    const normTrack = (trackId || "python").toLowerCase();

    const module = getSubjectModule(normSubject, normTrack, idx);
    if (!module) {
      return res.status(404).json({ error: "Module not found in this curriculum" });
    }

    const subProg = await SubjectProgress.findOne({ userId, subjectKey: normSubject });

    const safeQuestions = (module.assessment?.questions || []).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    res.json({
      id: module.id,
      subjectKey: normSubject,
      trackId: normTrack,
      moduleIndex: module.moduleIndex,
      title: module.title,
      subtitle: module.subtitle,
      estimatedTime: module.estimatedTime,
      icon: module.icon,
      overview: module.overview,
      sections: module.sections,
      practicalAssignment: module.practicalAssignment || null,
      codingExercise: module.codingExercise
        ? {
            taskTitle: module.codingExercise.taskTitle,
            instructions: module.codingExercise.instructions,
            starterCode: module.codingExercise.starterCode,
            testCases: module.codingExercise.testCases.map((tc) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: !!tc.isHidden,
            })),
          }
        : null,
      assessmentInfo: {
        totalQuestions: safeQuestions.length,
        passingScore: module.assessment?.passingScore || 80,
        timeLimitSeconds: module.assessment?.timeLimitSeconds || 3600,
        questions: safeQuestions,
      },
      safeQuestions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/curriculum/study
// Records verified lesson study duration
// -------------------------------------------------------------
router.post("/study", authenticateToken, async (req, res) => {
  const { subjectKey = "coding", trackId, moduleIndex, studyTimeSeconds = 30 } = req.body;
  const userId = req.user.userId || req.user.id || req.user._id;
  const idx = parseInt(moduleIndex, 10);
  const normSubject = subjectKey.toLowerCase();
  const normTrack = trackId.toLowerCase();

  try {
    let subProg = await SubjectProgress.findOne({ userId, subjectKey: normSubject });
    if (!subProg) {
      subProg = new SubjectProgress({ userId, subjectKey: normSubject, activeTrack: normTrack });
    }

    const pKey = `${normTrack}_${idx}`;
    const rawCur = subProg.moduleProgress.get(pKey);
    const current = rawCur && rawCur.toObject ? rawCur.toObject() : (rawCur || {});

    subProg.moduleProgress.set(pKey, {
      ...current,
      isStudied: true,
      studiedAt: new Date(),
      studyTimeSeconds: (current.studyTimeSeconds || 0) + studyTimeSeconds,
    });
    subProg.markModified("moduleProgress");

    const module = getSubjectModule(normSubject, normTrack, idx);
    subProg.lastActivity = {
      type: "study",
      trackId: normTrack,
      moduleIndex: idx,
      title: module?.title || `Module ${idx + 1}`,
      timestamp: new Date(),
    };

    await subProg.save();

    // If coding, sync with CodingProgress too
    if (normSubject === "coding") {
      let cp = await CodingProgress.findOne({ userId });
      if (cp) {
        const cRaw = cp.moduleProgress.get(pKey);
        const cCur = cRaw && cRaw.toObject ? cRaw.toObject() : (cRaw || {});
        cp.moduleProgress.set(pKey, {
          ...cCur,
          isStudied: true,
          studiedAt: new Date(),
          studyTimeSeconds: (cCur.studyTimeSeconds || 0) + studyTimeSeconds,
        });
        cp.markModified("moduleProgress");
        await cp.save();
      }
    }

    // Socket.IO broadcast
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${userId}`).emit("curriculum_progress_updated", {
        type: "study",
        subjectKey: normSubject,
        trackId: normTrack,
        moduleIndex: idx,
        isStudied: true,
      });
      if (normSubject === "coding") {
        io.to(`user_${userId}`).emit("coding_progress_updated", {
          type: "study",
          trackId: normTrack,
          moduleIndex: idx,
          isStudied: true,
        });
      }
    }

    await pushNotification(req.app, {
      userId,
      title: "Module Theory Completed",
      message: `Completed study materials for "${module?.title || `Module ${idx + 1}`}" (${normSubject.toUpperCase()}).`,
      type: "curriculum",
      severity: "info",
      actionUrl: `/${normSubject}`,
      actionLabel: "Continue Module",
    });

    res.json({ success: true, isStudied: true, studyTimeSeconds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/curriculum/assignment/submit
// Evaluates practical assignment (code execution or domain task)
// -------------------------------------------------------------
router.post("/assignment/submit", authenticateToken, async (req, res) => {
  const { subjectKey = "coding", trackId, moduleIndex, code, submissionData } = req.body;
  const userId = req.user.userId || req.user.id || req.user._id;
  const idx = parseInt(moduleIndex, 10);
  const normSubject = subjectKey.toLowerCase();
  const normTrack = trackId.toLowerCase();

  const module = getSubjectModule(normSubject, normTrack, idx);
  if (!module) {
    return res.status(404).json({ error: "Module not found" });
  }

  try {
    let isAccepted = false;
    let feedback = "";
    let testResults = [];
    let passedCount = 0;
    let totalTests = 0;

    // A) Coding subject: sandboxed code execution
    if (normSubject === "coding" || module.codingExercise) {
      if (!code || !code.trim()) {
        return res.status(400).json({ error: "Code submission cannot be empty" });
      }
      const testCases = module.codingExercise?.testCases || [];
      totalTests = testCases.length;
      const lang = normTrack === "cpp" ? "cpp" : normTrack === "java" ? "java" : normTrack === "python" ? "python" : "javascript";

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const isHidden = tc.isHidden || i >= 2;
        const execRes = await executeInSandbox(lang, code, tc.input, 7000);
        const actualOut = (execRes.output || "").trim();
        const expected = (tc.expectedOutput || "").trim();
        const passed = actualOut === expected && !execRes.error;

        if (passed) passedCount++;

        testResults.push({
          testNumber: i + 1,
          testIndex: i + 1,
          isHidden,
          passed,
          input: isHidden ? "[Hidden Test Case]" : tc.input,
          expectedOutput: isHidden ? "[Hidden Test Case]" : expected,
          actualOutput: isHidden ? (passed ? "[Passed]" : "[Output Hidden]") : actualOut,
          error: isHidden ? (passed ? null : "Hidden Test Case Failed") : (execRes.error || null),
          durationMs: execRes.duration,
          duration: execRes.duration,
        });
      }
      const score = totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0;
      isAccepted = score >= 80 && totalTests > 0;
      feedback = isAccepted
        ? `🎉 Exercise verified with ${score}%! (${passedCount}/${totalTests} tests passed).`
        : `Score: ${score}% (${passedCount}/${totalTests} tests passed). Minimum 80% required to pass.`;
    }
    // B) Other subjects: practical assignment evaluation (Language, Driving, Fitness)
    else if (module.practicalAssignment) {
      const userText = (typeof submissionData === "string" ? submissionData : JSON.stringify(submissionData || code || "")).toLowerCase();
      const requiredKeywords = (module.practicalAssignment.solutionKeywords || []).map((k) => k.toLowerCase());
      
      let matchedCount = 0;
      for (const kw of requiredKeywords) {
        if (userText.includes(kw)) {
          matchedCount++;
        }
      }

      totalTests = requiredKeywords.length;
      passedCount = matchedCount;
      // Require at least 60% keyword/criteria match
      const threshold = Math.ceil(totalTests * 0.6);
      isAccepted = matchedCount >= threshold;

      feedback = isAccepted
        ? `✅ Practical assignment approved! Satisfied ${matchedCount} / ${totalTests} key evaluation criteria.`
        : `Assignment needs revision. Found ${matchedCount} / ${totalTests} required criteria. Review instructional notes and refine your submission.`;
    }

    if (isAccepted) {
      let subProg = await SubjectProgress.findOne({ userId, subjectKey: normSubject });
      if (!subProg) subProg = new SubjectProgress({ userId, subjectKey: normSubject, activeTrack: normTrack });

      const pKey = `${normTrack}_${idx}`;
      const rawCur = subProg.moduleProgress.get(pKey);
      const cur = rawCur && rawCur.toObject ? rawCur.toObject() : (rawCur || {});
      subProg.moduleProgress.set(pKey, {
        ...cur,
        assignmentPassed: true,
        exercisePassed: true,
        assignmentPassedAt: new Date(),
        assignmentFeedback: feedback,
      });
      subProg.markModified("moduleProgress");
      await subProg.save();

      // If coding, update CodingProgress too
      if (normSubject === "coding") {
        let cp = await CodingProgress.findOne({ userId });
        if (cp) {
          const cRaw = cp.moduleProgress.get(pKey);
          const cCur = cRaw && cRaw.toObject ? cRaw.toObject() : (cRaw || {});
          cp.moduleProgress.set(pKey, {
            ...cCur,
            exercisePassed: true,
            exercisePassedAt: new Date(),
            exerciseCode: code || "",
          });
          cp.markModified("moduleProgress");
          await cp.save();
        }
      }

      // Record XP in user general progress
      const progressTrack = normSubject === "driving" ? "VEHICLES" : normSubject.toUpperCase();
      await Progress.create({
        userId,
        track: progressTrack,
        task: `Passed Practical Assignment: ${module.title}`,
        moduleName: `${module.title} - Practical`,
        hoursSpent: 0.5,
        xpEarned: 25,
        status: "completed",
      });

      // Socket.IO broadcast
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${userId}`).emit("curriculum_progress_updated", {
          type: "assignment_passed",
          subjectKey: normSubject,
          trackId: normTrack,
          moduleIndex: idx,
          assignmentPassed: true,
        });
        if (normSubject === "coding") {
          io.to(`user_${userId}`).emit("coding_progress_updated", {
            type: "exercise_passed",
            trackId: normTrack,
            moduleIndex: idx,
            exercisePassed: true,
          });
        }
      }

      await pushNotification(req.app, {
        userId,
        title: "Practical Assignment Passed",
        message: `Cleared "${module.title}" practical assignment (+25 XP). Proctored exam is ready!`,
        type: "curriculum",
        severity: "success",
        actionUrl: `/${normSubject}`,
        actionLabel: "Take Proctored Exam",
      });
    }

    res.json({
      status: isAccepted ? "PASSED" : "FAILED",
      passed: isAccepted,
      score: totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0,
      passedCount,
      totalTests,
      results: testResults,
      message: feedback,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/curriculum/proctoring/start
// Mandatory 5-Step Proctoring Gate Authorization
// -------------------------------------------------------------
router.post("/proctoring/start", authenticateToken, async (req, res) => {
  const {
    subjectKey = "coding",
    trackId,
    moduleIndex,
    cameraVerified,
    micVerified,
    screenShareVerified,
    displaySurface,
    fullscreenVerified,
  } = req.body;
  const userId = req.user.userId || req.user.id || req.user._id;
  const idx = parseInt(moduleIndex, 10);
  const normSubject = subjectKey.toLowerCase();
  const normTrack = trackId.toLowerCase();

  const module = getSubjectModule(normSubject, normTrack, idx);
  if (!module || !module.assessment) {
    return res.status(404).json({ error: "Assessment not found" });
  }

  // 1. Verify Prerequisites (Lesson studied AND practical assignment completed)
  const subProg = await SubjectProgress.findOne({ userId, subjectKey: normSubject });
  const pKey = `${normTrack}_${idx}`;
  const rawState = subProg?.moduleProgress?.get(pKey);
  const modState = rawState && rawState.toObject ? rawState.toObject() : (rawState || {});

  // If coding, check CodingProgress as fallback
  let isStudied = !!modState?.isStudied;
  let isAssigned = !!(modState?.assignmentPassed || modState?.exercisePassed);

  if (normSubject === "coding") {
    const cp = await CodingProgress.findOne({ userId });
    const cpRaw = cp?.moduleProgress?.get(pKey);
    const cpState = cpRaw && cpRaw.toObject ? cpRaw.toObject() : (cpRaw || {});
    isStudied = isStudied || !!cpState?.isStudied;
    isAssigned = isAssigned || !!cpState?.exercisePassed;
  }

  if (!isStudied) {
    return res.status(400).json({
      error: "Prerequisite incomplete: You must study the lesson sections before launching the assessment.",
      stage: "study",
    });
  }

  if (!isAssigned) {
    return res.status(400).json({
      error: "Prerequisite incomplete: You must pass the practical assignment / coding exercise before launching the assessment.",
      stage: "assignment",
    });
  }

  // 2. Strict Proctoring Gate Verification
  if (!cameraVerified) {
    return res.status(400).json({ error: "Proctoring gate failure: Camera access must be active and verified." });
  }
  if (!micVerified) {
    return res.status(400).json({ error: "Proctoring gate failure: Microphone stream must be active and verified." });
  }
  if (!screenShareVerified) {
    return res.status(400).json({ error: "Proctoring gate failure: Screen sharing must be active." });
  }
  if (displaySurface === "browser" || displaySurface === "window") {
    return res.status(400).json({
      error: "Proctoring violation: You must share your entire screen/display. Single tabs or windows are rejected.",
    });
  }
  if (!fullscreenVerified) {
    return res.status(400).json({ error: "Proctoring gate failure: Fullscreen mode must be engaged." });
  }

  // Create authorized assessment session token/ID
  const sessionId = `proc_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  res.json({
    authorized: true,
    sessionId,
    timeLimitSeconds: module.assessment.timeLimitSeconds || 3600,
    totalQuestions: module.assessment.questions.length,
    passingScore: module.assessment.passingScore || 80,
    message: "Proctoring gate verified. 10-Question assessment authorized.",
  });
});

// -------------------------------------------------------------
// POST /api/curriculum/assessment/submit
// 10-Question Server-Side Evaluation & Module Unlock
// -------------------------------------------------------------
router.post("/assessment/submit", authenticateToken, async (req, res) => {
  const {
    subjectKey = "coding",
    trackId,
    moduleIndex,
    answers = {},
    timeSpentSeconds = 0,
    violationsCount = 0,
    violationsLog = [],
    proctoringVerified = {},
  } = req.body;

  const userId = req.user.userId || req.user.id || req.user._id;
  const idx = parseInt(moduleIndex, 10);
  const normSubject = subjectKey.toLowerCase();
  const normTrack = trackId.toLowerCase();

  const module = getSubjectModule(normSubject, normTrack, idx);
  if (!module || !module.assessment) {
    return res.status(404).json({ error: "Module assessment not found" });
  }

  try {
    let subProg = await SubjectProgress.findOne({ userId, subjectKey: normSubject });
    if (!subProg) subProg = new SubjectProgress({ userId, subjectKey: normSubject, activeTrack: normTrack });

    const questions = module.assessment.questions || [];
    let correctCount = 0;
    let questionsAttempted = 0;
    let marksObtained = 0;
    let totalMarks = 0;
    const defaultMarksPerQ = Number(module.assessment.marksPerQuestion || 1);

    const reviewBreakdown = [];

    // Calculate marks and review breakdown dynamically
    questions.forEach((q, qIdx) => {
      let selected = null;
      if (answers) {
        const raw = answers[qIdx] !== undefined ? answers[qIdx] : answers[String(qIdx)];
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
      } else if (selected !== null && q.negativeMarks) {
        awarded = -Math.abs(Number(q.negativeMarks));
        marksObtained += awarded;
      }

      reviewBreakdown.push({
        id: q.id || `q_${qIdx + 1}`,
        questionIndex: qIdx,
        question: q.question,
        options: q.options,
        userSelected: selected,
        userAnswer: selected, // synonym for frontend compatibility
        correctIndex: q.correctIndex,
        correctAnswer: q.correctIndex, // synonym for frontend compatibility
        isCorrect,
        marksAwarded: awarded,
        maxMarks: qMarks,
        explanation: q.explanation || "Review the core concepts for this question.",
      });
    });

    if (totalMarks <= 0) totalMarks = questions.length || 10;
    marksObtained = Math.max(0, marksObtained);
    const questionsUnanswered = Math.max(0, questions.length - questionsAttempted);
    const percentage = Math.round((marksObtained / totalMarks) * 100);
    const accuracy = questionsAttempted > 0 ? Math.round((correctCount / questionsAttempted) * 100) : 0;
    const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : "F";
    const passed = percentage >= (module.assessment.passingScore || 80);

    // Compute attempt number for this specific module
    const priorAttemptsCount = await ModuleAssessmentAttempt.countDocuments({
      userId,
      subjectKey: normSubject,
      trackId: normTrack,
      moduleIndex: idx,
    });
    const attemptNumber = priorAttemptsCount + 1;

    const submittedAt = new Date();
    const startTime = new Date(Date.now() - (Math.max(1, timeSpentSeconds) * 1000));

    // Save comprehensive audit attempt
    const attemptDoc = await ModuleAssessmentAttempt.create({
      userId,
      subjectKey: normSubject,
      trackId: normTrack,
      moduleIndex: idx,
      moduleTitle: module.title,
      assessmentTitle: `${module.title} — Proctored Accreditation Exam`,
      attemptNumber,
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
      proctoringVerified,
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

    // Update SubjectProgress
    const pKey = `${normTrack}_${idx}`;
    const rawCurState = subProg.moduleProgress.get(pKey);
    const curState = rawCurState && rawCurState.toObject ? rawCurState.toObject() : (rawCurState || {});
    const prevBest = curState.bestScore || 0;
    const newBest = Math.max(prevBest, percentage);
    const attempts = (curState.attemptsCount || 0) + 1;

    subProg.moduleProgress.set(pKey, {
      ...curState,
      assessmentPassed: passed || !!curState.assessmentPassed,
      assessmentScore: percentage,
      assessmentPassedAt: passed ? new Date() : curState.assessmentPassedAt,
      bestScore: newBest,
      attemptsCount: attempts,
    });
    subProg.markModified("moduleProgress");

    subProg.assessmentAttempts.push({
      attemptId: attemptDoc._id,
      trackId: normTrack,
      moduleIndex: idx,
      score: correctCount,
      percentage,
      passed,
      timeSpentSeconds,
      violationsCount,
      attemptedAt: new Date(),
    });

    const currentUnlock = subProg.trackUnlocks?.get(normTrack) || 0;
    let nextUnlockedModule = currentUnlock;
    if (passed) {
      const nextLevel = Math.max(currentUnlock, idx + 1);
      subProg.trackUnlocks.set(normTrack, nextLevel);
      nextUnlockedModule = nextLevel;
      subProg.markModified("trackUnlocks");

      // Count completed
      const allMods = getCurriculumFor(normSubject, normTrack);
      let completedCount = 0;
      for (const m of allMods) {
        const k = `${normTrack}_${m.moduleIndex}`;
        const st = subProg.moduleProgress.get(k);
        if (st?.assessmentPassed) completedCount++;
      }
      subProg.trackLessons.set(normTrack, completedCount);
      subProg.markModified("trackLessons");

      // Record XP & streak in user Progress
      const progressTrack = normSubject === "driving" ? "VEHICLES" : normSubject.toUpperCase();
      await Progress.create({
        userId,
        track: progressTrack,
        task: `Passed 10-Question Proctored Assessment: ${module.title}`,
        moduleName: module.title,
        hoursSpent: Number((timeSpentSeconds / 3600).toFixed(2)),
        xpEarned: 50,
        status: "completed",
      });
    }

    subProg.lastActivity = {
      type: "assessment",
      trackId: normTrack,
      moduleIndex: idx,
      title: module.title,
      timestamp: new Date(),
    };

    await subProg.save();

    // If coding, sync with CodingProgress too
    if (normSubject === "coding") {
      let cp = await CodingProgress.findOne({ userId });
      if (!cp) cp = new CodingProgress({ userId });
      const cCur = cp.moduleProgress.get(pKey) || {};
      cp.moduleProgress.set(pKey, {
        ...cCur,
        assessmentPassed: passed || !!cCur.assessmentPassed,
        assessmentScore: percentage,
        assessmentPassedAt: passed ? new Date() : cCur.assessmentPassedAt,
        bestScore: newBest,
        attemptsCount: attempts,
      });
      if (passed) {
        const nextLevel = Math.max(cp.trackUnlocks.get(normTrack) || 0, idx + 1);
        cp.trackUnlocks.set(normTrack, nextLevel);
        const allMods = getCurriculumFor("coding", normTrack);
        let cCount = 0;
        for (const m of allMods) {
          const k = `${normTrack}_${m.moduleIndex}`;
          if (cp.moduleProgress.get(k)?.assessmentPassed) cCount++;
        }
        cp.trackLessons.set(normTrack, cCount);
      }
      await cp.save();
    }

    // Socket.IO Broadcast
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${userId}`).emit("curriculum_progress_updated", {
        type: "assessment_result",
        subjectKey: normSubject,
        trackId: normTrack,
        moduleIndex: idx,
        passed,
        percentage,
        unlockedLevel: nextUnlockedModule,
      });

      if (normSubject === "coding") {
        io.to(`user_${userId}`).emit("coding_progress_updated", {
          type: "assessment_result",
          trackId: normTrack,
          moduleIndex: idx,
          passed,
          percentage,
          unlockedLevel: nextUnlockedModule,
        });
      }

      const user = await User.findById(userId);
      io.emit("coding_activity_feed", {
        userName: user?.fullName || "Learner",
        action: passed
          ? `passed the proctored assessment for ${module.title} (${normSubject.toUpperCase()})`
          : `attempted assessment for ${module.title}`,
        trackId: normTrack,
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

    res.json({
      success: true,
      attemptId: attemptDoc._id.toString(),
      sessionId: `attempt_${attemptDoc._id}`,
      reportUrl: `/assessment-report/attempt_${attemptDoc._id}`,
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
      attemptNumber,
      startTime,
      submittedAt,
      passingScore: module.assessment.passingScore || 80,
      nextUnlockedModule,
      reviewBreakdown,
      message: passed
        ? `🏆 Congratulations! You scored ${marksObtained}/${totalMarks} marks (${percentage}%). Module ${idx + 2} is now unlocked!`
        : `Assessment not passed. You scored ${marksObtained}/${totalMarks} marks (${percentage}%). A minimum score of 80% is required to clear accreditation. Review the feedback and try again!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// -------------------------------------------------------------
// POST /api/curriculum/:subjectKey/reset
// Resets learning process, modules, tests, and assessment attempts
// -------------------------------------------------------------
router.post("/:subjectKey/reset", authenticateToken, async (req, res) => {
  const { subjectKey } = req.params;
  const { trackId, resetAllTracks = false } = req.body;
  const userId = req.user.userId || req.user.id || req.user._id;

  try {
    const sKey = (subjectKey || "coding").toLowerCase();

    // 1. Reset SubjectProgress
    let progress = await SubjectProgress.findOne({ userId, subjectKey: sKey });
    if (progress) {
      if (!resetAllTracks && trackId) {
        if (progress.trackUnlocks) progress.trackUnlocks.delete(trackId);
        if (progress.trackLessons) progress.trackLessons.delete(trackId);
        if (progress.moduleProgress) {
          for (const key of Array.from(progress.moduleProgress.keys())) {
            if (key.startsWith(`${trackId}_`)) {
              progress.moduleProgress.delete(key);
            }
          }
        }
        if (progress.assessmentAttempts) {
          progress.assessmentAttempts = progress.assessmentAttempts.filter(
            (a) => a.trackId !== trackId
          );
        }
      } else {
        progress.trackUnlocks = new Map();
        progress.trackLessons = new Map();
        progress.moduleProgress = new Map();
        progress.assessmentAttempts = [];
        progress.lastActivity = {};
      }
      await progress.save();
    }

    // 2. Delete test assessment attempts
    const attemptQuery = { userId, subjectKey: sKey };
    if (!resetAllTracks && trackId) {
      attemptQuery.trackId = trackId;
    }
    await ModuleAssessmentAttempt.deleteMany(attemptQuery);

    // 3. If coding, also reset CodingProgress
    if (sKey === "coding") {
      let cProg = await CodingProgress.findOne({ userId });
      if (cProg) {
        if (!resetAllTracks && trackId) {
          if (cProg.trackUnlocks) cProg.trackUnlocks.set(trackId, 0);
          if (cProg.trackLessons) cProg.trackLessons.set(trackId, 0);
          if (cProg.moduleProgress) {
            for (const key of Array.from(cProg.moduleProgress.keys())) {
              if (key.startsWith(`${trackId}_`)) {
                cProg.moduleProgress.delete(key);
              }
            }
          }
          if (cProg.assessmentAttempts) {
            cProg.assessmentAttempts = cProg.assessmentAttempts.filter(
              (a) => a.trackId !== trackId
            );
          }
        } else {
          cProg.trackUnlocks = new Map([
            ["python", 0],
            ["javascript", 0],
            ["java", 0],
            ["cpp", 0],
            ["webdev", 0],
            ["dsa", 0],
          ]);
          cProg.trackLessons = new Map([
            ["python", 0],
            ["javascript", 0],
            ["java", 0],
            ["cpp", 0],
            ["webdev", 0],
            ["dsa", 0],
          ]);
          cProg.moduleProgress = new Map();
          cProg.assessmentAttempts = [];
          cProg.challengesSolved = [];
        }
        await cProg.save();
      }
    }

    // 4. Delete corresponding activity records
    const progressTrackName = sKey === "coding" ? "CODING" : sKey === "language" ? "LANGUAGE" : sKey === "driving" ? "DRIVING" : sKey === "fitness" ? "FITNESS" : "GENERAL";
    await Progress.deleteMany({ userId, track: progressTrackName });

    res.json({
      success: true,
      message: `${subjectKey.toUpperCase()} learning process, tests, and module states reset successfully.`,
      subjectKey: sKey,
      trackId: trackId || "all",
    });
  } catch (err) {
    console.error("Subject reset error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
