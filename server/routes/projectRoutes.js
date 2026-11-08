const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const mongoose = require("mongoose");
const authenticateToken = require("../middleware/authMiddleware");
const { optionalAuthenticateToken } = require("../middleware/authMiddleware");

const {
  PROJECTS_CATALOG,
  getProjectById,
  getPublicProjectSpec,
} = require("../data/projectsCatalog");
const ProjectWorkspaceState = require("../models/ProjectWorkspaceState");
const ProjectSubmission = require("../models/ProjectSubmission");
const Progress = require("../models/ProgressSchema");
const CodingProgress = require("../models/CodingProgress");
const User = require("../models/User");
const { pushNotification } = require("../utils/notificationService");
const { pushAdminNotification } = require("../utils/adminNotificationService");
const { sendSubmissionEvaluationEmail, dispatchMailBackground, isGuestAccount } = require("../utils/mailer");

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

const PYTHON_BIN = fs.existsSync("/usr/bin/python3") ? "/usr/bin/python3" : "python3";
const NODE_BIN = fs.existsSync("/usr/local/bin/node") ? "/usr/local/bin/node" : "node";

function resolveUserId(req) {
  return String(req.user?.userId || req.user?.id || req.user?._id || "").trim();
}

function calculateGrade(pct) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

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

function normalizeFilesList(project, rawFiles) {
  if (Array.isArray(rawFiles) && rawFiles.length > 0) {
    return rawFiles.map((f, idx) => ({
      id: f.id || `file_${idx}`,
      name: path.basename(String(f.name || `file_${idx}.txt`).trim()),
      language: f.language || project.starterLanguage || "javascript",
      content: typeof f.content === "string" ? f.content : "",
    }));
  }
  return (project.files || []).map((f, idx) => ({
    id: `file_${idx}`,
    name: f.name,
    language: f.language || project.starterLanguage || "javascript",
    content: f.content,
  }));
}

function stripCommentsAndWhitespace(code) {
  return String(code || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/#.*$/gm, "")
    .replace(/\s+/g, "");
}

function isStarterOrEmpty(project, submittedFiles) {
  const starterJoined = (project.files || [])
    .map((f) => stripCommentsAndWhitespace(f.content))
    .join("||");
  const submittedJoined = (submittedFiles || [])
    .map((f) => stripCommentsAndWhitespace(f.content))
    .join("||");
  if (!submittedJoined || submittedJoined.length < 15) return true;
  return starterJoined === submittedJoined;
}

/**
 * Compiles/Prepares a multi-file project inside a sandboxed temp directory
 * and provides a runner function `runWithInput(stdin)` for fast multi-test execution.
 */
async function prepareMultiFileSandbox(project, files) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mz_proj_"));
  const lang = String(project.starterLanguage || "javascript").toLowerCase();

  try {
    for (const file of files) {
      const safeName = path.basename(file.name);
      fs.writeFileSync(path.join(tmpDir, safeName), file.content || "", "utf8");
    }

    if (lang === "python") {
      const pyFiles = files.filter((f) => f.name.endsWith(".py")).map((f) => path.join(tmpDir, path.basename(f.name)));
      for (const pyPath of pyFiles) {
        const check = await runSandboxedProcess(PYTHON_BIN, ["-m", "py_compile", pyPath], "", 4000, tmpDir);
        if (check.exitCode !== 0) {
          return {
            ok: false,
            compileError: `Syntax Error in ${path.basename(pyPath)}:\n${check.error || check.output}`,
            cleanup: () => fs.rmSync(tmpDir, { recursive: true, force: true }),
          };
        }
      }
      const entryFile =
        files.find((f) => f.name === "main.py" || f.name === "app.py" || f.name === "server.py")?.name ||
        files[0]?.name ||
        "main.py";

      return {
        ok: true,
        runInput: (stdin) =>
          runSandboxedProcess(PYTHON_BIN, ["-u", path.join(tmpDir, path.basename(entryFile))], stdin, 4000, tmpDir),
        cleanup: () => {
          try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
          } catch {}
        },
      };
    }

    if (lang === "java") {
      const javaFiles = files
        .filter((f) => f.name.endsWith(".java"))
        .map((f) => path.join(tmpDir, path.basename(f.name)));
      const compileRes = await runSandboxedProcess(JAVAC_BIN, javaFiles, "", 6000, tmpDir);
      if (compileRes.exitCode !== 0) {
        return {
          ok: false,
          compileError: `Compilation Error (Java):\n${compileRes.error || compileRes.output}`,
          cleanup: () => {
            try {
              fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch {}
          },
        };
      }
      return {
        ok: true,
        runInput: (stdin) => runSandboxedProcess(JAVA_BIN, ["-cp", tmpDir, "Main"], stdin, 4000, tmpDir),
        cleanup: () => {
          try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
          } catch {}
        },
      };
    }

    // Default: JavaScript / Node.js
    const jsFiles = files
      .filter((f) => f.name.endsWith(".js"))
      .map((f) => path.join(tmpDir, path.basename(f.name)));
    for (const jsPath of jsFiles) {
      const check = await runSandboxedProcess(NODE_BIN, ["--check", jsPath], "", 4000, tmpDir);
      if (check.exitCode !== 0) {
        return {
          ok: false,
          compileError: `Syntax Error in ${path.basename(jsPath)}:\n${check.error || check.output}`,
          cleanup: () => {
            try {
              fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch {}
          },
        };
      }
    }
    const entryFile =
      files.find((f) => f.name === "main.js" || f.name === "server.js" || f.name === "app.js")?.name ||
      files[0]?.name ||
      "main.js";

    return {
      ok: true,
      runInput: (stdin) =>
        runSandboxedProcess(NODE_BIN, [path.join(tmpDir, path.basename(entryFile))], stdin, 4000, tmpDir),
      cleanup: () => {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {}
      },
    };
  } catch (err) {
    return {
      ok: false,
      compileError: err.message,
      cleanup: () => {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {}
      },
    };
  }
}

function checkPatternsInFiles(files, patterns = [], targetFile = "") {
  if (!patterns || patterns.length === 0) return { ratio: 1, matched: [], missing: [] };
  const targetContent = targetFile
    ? files.find((f) => f.name === targetFile)?.content || files.map((f) => f.content).join("\n")
    : files.map((f) => f.content).join("\n");

  const matched = [];
  const missing = [];
  for (const pat of patterns) {
    if (targetContent.toLowerCase().includes(String(pat).toLowerCase())) {
      matched.push(pat);
    } else {
      missing.push(pat);
    }
  }
  return {
    ratio: matched.length / patterns.length,
    matched,
    missing,
  };
}

/**
 * Full 100-Mark Rubric + Multi-File Test Suite Evaluation
 */
async function evaluateFullProject(project, rawFiles) {
  const files = normalizeFilesList(project, rawFiles);
  const unmodifiedStarter = isStarterOrEmpty(project, files);
  const testCases = project.testCases || [];

  const sandbox = await prepareMultiFileSandbox(project, files);
  const testResults = [];

  try {
    if (!sandbox.ok) {
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        testResults.push({
          testIndex: i + 1,
          name: tc.name,
          input: tc.isHidden ? "[Hidden Edge-Case Input]" : tc.input,
          expectedOutput: tc.isHidden ? "[Hidden Expected Output]" : tc.expectedOutput,
          actualOutput: "",
          passed: false,
          durationMs: 0,
          isHidden: Boolean(tc.isHidden),
          isEdgeCase: Boolean(tc.isEdgeCase),
          error: sandbox.compileError,
        });
      }
    } else {
      const parallelResults = await Promise.all(
        testCases.map(async (tc, i) => {
          const res = await sandbox.runInput(tc.input);
          const actualClean = (res.output || "").trim().replace(/\r\n/g, "\n");
          const expectedClean = (tc.expectedOutput || "").trim().replace(/\r\n/g, "\n");
          const passed = res.exitCode === 0 && actualClean === expectedClean;

          return {
            testIndex: i + 1,
            name: tc.name,
            input: tc.isHidden ? "[Hidden Edge-Case Input]" : tc.input,
            expectedOutput: tc.isHidden ? "[Hidden Expected Output]" : expectedClean,
            actualOutput: tc.isHidden ? (passed ? "[Verified Match]" : actualClean || "[Mismatch]") : actualClean,
            passed,
            durationMs: res.duration || 1,
            isHidden: Boolean(tc.isHidden),
            isEdgeCase: Boolean(tc.isEdgeCase),
            error: passed ? null : res.error || (actualClean ? "Output mismatch against specification" : "No output produced"),
          };
        })
      );
      testResults.push(...parallelResults);
    }
  } finally {
    sandbox.cleanup();
  }

  const totalTests = testResults.length || 6;
  const passedTests = testResults.filter((r) => r.passed).length;
  const functionalTests = testResults.filter((r) => !r.isEdgeCase);
  const passedFunctionalTests = functionalTests.filter((r) => r.passed).length;
  const edgeTests = testResults.filter((r) => r.isEdgeCase);
  const passedEdgeTests = edgeTests.filter((r) => r.passed).length;

  const funcTestRatio = functionalTests.length > 0 ? passedFunctionalTests / functionalTests.length : 0;
  const edgeTestRatio = edgeTests.length > 0 ? passedEdgeTests / edgeTests.length : 0;
  const overallTestRatio = totalTests > 0 ? passedTests / totalTests : 0;

  // Evaluate Milestones / Tasks
  const tasksEvaluation = (project.milestones || []).map((m) => {
    const patCheck = checkPatternsInFiles(files, m.validationPatterns, m.targetFile);
    const codeImplemented = !unmodifiedStarter && sandbox.ok && patCheck.ratio >= 0.65;
    const taskFactor = codeImplemented ? 0.35 * patCheck.ratio + 0.65 * overallTestRatio : 0;
    const marksAwarded = Math.round((m.marksAllocated || 25) * taskFactor);
    const satisfied = codeImplemented && overallTestRatio >= 0.75;

    return {
      taskId: m.id,
      stepNumber: m.stepNumber,
      title: m.title,
      targetFile: m.targetFile,
      marksAwarded,
      maxMarks: m.marksAllocated || 25,
      marksAllocated: m.marksAllocated || 25,
      satisfied,
      completed: satisfied,
      feedback: satisfied
        ? `Verified in ${m.targetFile} and confirmed by automated test suite.`
        : !sandbox.ok
        ? `Compilation/Syntax failure prevented verification of ${m.title}.`
        : unmodifiedStarter
        ? `Task not implemented yet (${m.targetFile} still contains starter skeleton).`
        : patCheck.missing.length > 0
        ? `Missing expected implementation constructs in ${m.targetFile}: ${patCheck.missing.join(", ")}.`
        : `Implementation present in ${m.targetFile}, but ${totalTests - passedTests} automated test case(s) failed.`,
    };
  });

  // Evaluate Functional & Technical Requirements
  const requirementsEvaluation = [
    ...(project.functionalRequirements || []).map((fr) => {
      const patCheck = checkPatternsInFiles(files, fr.validationPatterns);
      const satisfied = !unmodifiedStarter && sandbox.ok && patCheck.ratio >= 0.65 && funcTestRatio >= 0.75;
      return {
        reqId: fr.id,
        category: "functional",
        title: fr.title,
        description: fr.description,
        mandatory: fr.mandatory !== false,
        satisfied,
        evidence: satisfied
          ? `Verified code constructs (${patCheck.matched.join(", ")}) & passed functional tests.`
          : `Requirement not satisfied (${passedFunctionalTests}/${functionalTests.length} functional tests passed).`,
      };
    }),
    ...(project.technicalRequirements || []).map((tr) => {
      const patCheck = checkPatternsInFiles(files, tr.validationPatterns);
      const satisfied = !unmodifiedStarter && sandbox.ok && patCheck.ratio >= 0.65 && passedTests >= 1;
      return {
        reqId: tr.id,
        category: "technical",
        title: tr.title,
        description: tr.constraint,
        mandatory: tr.mandatory !== false,
        satisfied,
        evidence: satisfied
          ? `Verified technical constraint (${patCheck.matched.join(", ")}).`
          : `Technical constraint not demonstrated in executable code.`,
      };
    }),
  ];

  // Calculate 100-Mark Rubric
  const funcReqs = requirementsEvaluation.filter((r) => r.category === "functional");
  const satisfiedFuncReqs = funcReqs.filter((r) => r.satisfied).length;
  const techReqs = requirementsEvaluation.filter((r) => r.category === "technical");
  const satisfiedTechReqs = techReqs.filter((r) => r.satisfied).length;

  // 1. Functional Correctness (40 Marks)
  const functionalCorrectnessObtained = unmodifiedStarter || !sandbox.ok
    ? 0
    : Math.round(
        25 * funcTestRatio +
          15 * (funcReqs.length > 0 ? satisfiedFuncReqs / funcReqs.length : funcTestRatio)
      );

  // 2. Test Case Execution (20 Marks)
  const testCaseExecutionObtained = Math.round(20 * overallTestRatio);

  // 3. Code Quality & Structure (15 Marks)
  const nonEmptyFilesCount = files.filter((f) => stripCommentsAndWhitespace(f.content).length > 20).length;
  const modularityScore = files.length > 0 ? Math.round(5 * (nonEmptyFilesCount / files.length)) : 0;
  const compileHealthScore = sandbox.ok && !unmodifiedStarter ? 5 : 0;
  const structureScore = !unmodifiedStarter && sandbox.ok && passedTests > 0 ? 5 : 0;
  const codeQualityObtained = unmodifiedStarter ? 0 : modularityScore + compileHealthScore + structureScore;

  // 4. Technical Requirements (15 Marks)
  const technicalRequirementsObtained =
    unmodifiedStarter || !sandbox.ok
      ? 0
      : Math.round(15 * (techReqs.length > 0 ? satisfiedTechReqs / techReqs.length : overallTestRatio));

  // 5. Error Handling & Edge Cases (10 Marks)
  const hasDefensiveConstructs = checkPatternsInFiles(files, [
    "try",
    "catch",
    "except",
    "error",
    "invalid",
    "null",
    "none",
    "empty",
    "if not",
  ]).matched.length >= 2;
  const errorHandlingObtained =
    unmodifiedStarter || !sandbox.ok
      ? 0
      : Math.round(7 * edgeTestRatio + (hasDefensiveConstructs && passedEdgeTests > 0 ? 3 : 0));

  const marksObtained = Math.min(
    100,
    functionalCorrectnessObtained +
      testCaseExecutionObtained +
      codeQualityObtained +
      technicalRequirementsObtained +
      errorHandlingObtained
  );

  const totalMarks = project.totalMarks || 100;
  const passingMarks = project.passingMarks || 80;
  const percentage = Math.round((marksObtained / totalMarks) * 100);
  const allMandatoryPassed = requirementsEvaluation
    .filter((r) => r.mandatory)
    .every((r) => r.satisfied);

  // STRICT PASSING RULES
  const passed =
    !unmodifiedStarter &&
    sandbox.ok &&
    marksObtained >= passingMarks &&
    passedTests >= Math.ceil(totalTests * 0.8) &&
    allMandatoryPassed;

  const grade = calculateGrade(percentage);

  const strengths = [];
  const deductions = [];
  const recommendations = [];

  if (sandbox.ok && !unmodifiedStarter) {
    strengths.push(`Multi-file ${project.starterLanguage.toUpperCase()} project compiled and executed without syntax errors.`);
  }
  if (passedFunctionalTests === functionalTests.length && functionalTests.length > 0) {
    strengths.push(`Passed all ${functionalTests.length}/${functionalTests.length} core functional specification test cases.`);
  }
  if (passedEdgeTests === edgeTests.length && edgeTests.length > 0) {
    strengths.push(`Passed all ${edgeTests.length}/${edgeTests.length} edge-case & error-handling boundary checks.`);
  }

  if (unmodifiedStarter) {
    deductions.push("(-100 Marks): Project files contain unmodified starter template or empty scaffolding.");
    recommendations.push("Complete all project milestones across the workspace files and run the automated test suite before submitting.");
  } else if (!sandbox.ok) {
    deductions.push(`(-${100 - marksObtained} Marks): Project failed syntax/compilation check: ${sandbox.compileError}`);
    recommendations.push("Resolve the syntax/compilation errors shown in the console output and verify with Run Tests.");
  } else {
    if (functionalCorrectnessObtained < 40) {
      deductions.push(
        `Functional Correctness (-${40 - functionalCorrectnessObtained} marks): ${passedFunctionalTests}/${functionalTests.length} functional tests passed; ${satisfiedFuncReqs}/${funcReqs.length} functional requirements verified.`
      );
    }
    if (testCaseExecutionObtained < 20) {
      deductions.push(
        `Test Case Execution (-${20 - testCaseExecutionObtained} marks): ${passedTests}/${totalTests} total automated test cases passed.`
      );
    }
    if (codeQualityObtained < 15) {
      deductions.push(
        `Code Quality & Structure (-${15 - codeQualityObtained} marks): Ensure all project modules are implemented modularly without stubs.`
      );
    }
    if (technicalRequirementsObtained < 15) {
      deductions.push(
        `Technical Requirements (-${15 - technicalRequirementsObtained} marks): ${satisfiedTechReqs}/${techReqs.length} technical constraints verified.`
      );
    }
    if (errorHandlingObtained < 10) {
      deductions.push(
        `Error Handling & Edge Cases (-${10 - errorHandlingObtained} marks): ${passedEdgeTests}/${edgeTests.length} edge-case tests passed.`
      );
    }
  }

  if (!passed && !unmodifiedStarter && sandbox.ok) {
    recommendations.push(
      `Review failed test cases and unsatisfied requirements to reach the ${passingMarks}/100 passing threshold.`
    );
  }

  const rubricBreakdown = {
    functionalCorrectness: {
      obtained: functionalCorrectnessObtained,
      max: 40,
      details: `${satisfiedFuncReqs}/${funcReqs.length} functional requirements & ${passedFunctionalTests}/${functionalTests.length} core tests passed.`,
    },
    testCaseExecution: {
      obtained: testCaseExecutionObtained,
      max: 20,
      details: `${passedTests}/${totalTests} total automated sandbox test cases passed.`,
    },
    codeQualityAndStructure: {
      obtained: codeQualityObtained,
      max: 15,
      details: `${nonEmptyFilesCount}/${files.length} modular project files verified.`,
    },
    technicalRequirements: {
      obtained: technicalRequirementsObtained,
      max: 15,
      details: `${satisfiedTechReqs}/${techReqs.length} technical architecture constraints satisfied.`,
    },
    errorHandlingAndEdgeCases: {
      obtained: errorHandlingObtained,
      max: 10,
      details: `${passedEdgeTests}/${edgeTests.length} hidden edge-case & invalid-input tests passed.`,
    },
  };

  const summary = passed
    ? `Project Passed (${marksObtained}/${totalMarks}, Grade ${grade}). All mandatory functional requirements, technical specifications, and automated test cases were verified.`
    : `Needs Improvement (${marksObtained}/${totalMarks}, Grade ${grade}). A minimum of ${passingMarks}/100 and all mandatory requirements are required to earn the PROJECT COMPLETED badge.`;

  return {
    files,
    rubricBreakdown,
    totalMarks,
    marksObtained,
    percentage,
    passingMarks,
    grade,
    passed,
    status: passed ? "PASSED" : "NEEDS_IMPROVEMENT",
    badgeAwarded: passed,
    tasksEvaluation,
    requirementsEvaluation,
    testResults,
    passedTests,
    totalTests,
    evaluationFeedback: {
      summary,
      strengths,
      deductions,
      recommendations,
    },
  };
}

/**
 * Formats a ProjectSubmission document into a unified report compatible with
 * AssessmentReportPage.jsx AND dedicated Project Report sections.
 */
function formatSubmissionAsReport(sub, project) {
  const files = sub.files || [];
  const submittedFiles = files.map((file, idx) => ({
    path: file.name || `file_${idx + 1}`,
    name: file.name || `file_${idx + 1}`,
    language: file.language || sub.starterLanguage || project?.starterLanguage || "javascript",
    content: file.content || "",
  }));

  const hasCompileError = (sub.testResults || []).some((tr) =>
    /SyntaxError|Compilation Error|Syntax Error/i.test(String(tr.error || ""))
  );
  const avgRuntimeMs =
    (sub.testResults || []).length > 0
      ? Math.max(
          1,
          Math.round(
            (sub.testResults || []).reduce((acc, r) => acc + (Number(r.durationMs) || 1), 0) /
              sub.testResults.length
          )
        )
      : 12;

  const isCodeEmpty = files.every((f) => !String(f.content || "").trim());
  const passingCutoff = sub.passingMarks || project?.passingMarks || 80;
  const totalMarksVal = sub.totalMarks || project?.totalMarks || 100;
  const marksObtainedVal = sub.marksObtained || 0;
  const percentageVal = sub.percentage !== undefined ? sub.percentage : Math.round((marksObtainedVal / totalMarksVal) * 100);
  const isPassed = Boolean(sub.passed && marksObtainedVal >= passingCutoff);

  const questions = [
    {
      questionId: sub.projectId || "project_1",
      title: sub.projectTitle || project?.title || "Project Implementation",
      difficulty: sub.difficulty || project?.difficulty || "Intermediate",
      category: sub.projectCategory || project?.category || "Full-Stack Project",
      description: project?.problemStatement || project?.description || "",
      constraints: (project?.technicalRequirements || []).map((tr) => `${tr.title}: ${tr.constraint}`),
      submittedCode: sub.combinedCodeSnapshot || (files[0]?.content || ""),
      isCodeEmpty,
      language: sub.starterLanguage || project?.starterLanguage || "javascript",
      status: isPassed ? "passed" : marksObtainedVal > 0 ? "partially_passed" : "failed",
      score: percentageVal,
      marksObtained: marksObtainedVal,
      totalMarks: totalMarksVal,
      passedTests: sub.passedTests || 0,
      totalTests: sub.totalTests || 6,
      compilationStatus: isCodeEmpty
        ? "Not Executed (Empty Code)"
        : hasCompileError
        ? "Compilation Error"
        : "Compiled Successfully",
      executionStatus: isCodeEmpty
        ? "No Code Submitted"
        : isPassed
        ? "All Mandatory Specifications Verified"
        : hasCompileError
        ? "Compilation Failed"
        : (sub.passedTests || 0) > 0
        ? `Partially Verified (${sub.passedTests}/${sub.totalTests} Tests)`
        : "Test Cases Failed",
      runtimeMs: isCodeEmpty ? 0 : avgRuntimeMs,
      memoryMb: isCodeEmpty ? "0.0" : "18.4",
      durationSeconds: sub.durationSeconds || 60,
      testResults: sub.testResults || [],
      attempted: !isCodeEmpty,
      submittedAt: sub.submittedAt,
    },
  ];

  const tasksSatisfiedCount = (sub.tasksEvaluation || []).filter((t) => t.satisfied).length;
  const totalTasksCount = (sub.tasksEvaluation || []).length;
  const reqsSatisfiedCount = (sub.requirementsEvaluation || []).filter((r) => r.satisfied).length;
  const totalReqsCount = (sub.requirementsEvaluation || []).length;

  const rawRubric = sub.rubricBreakdown || {};
  const rubricBreakdownArray = Array.isArray(rawRubric)
    ? rawRubric
    : [
        {
          key: "functionalCorrectness",
          label: "Functional Correctness",
          earnedMarks: rawRubric.functionalCorrectness?.obtained ?? 0,
          maxMarks: rawRubric.functionalCorrectness?.max ?? 40,
          obtained: rawRubric.functionalCorrectness?.obtained ?? 0,
          max: rawRubric.functionalCorrectness?.max ?? 40,
          details: rawRubric.functionalCorrectness?.details || "Core functional specification verification.",
        },
        {
          key: "testCaseExecution",
          label: "Automated Test Execution",
          earnedMarks: rawRubric.testCaseExecution?.obtained ?? 0,
          maxMarks: rawRubric.testCaseExecution?.max ?? 20,
          obtained: rawRubric.testCaseExecution?.obtained ?? 0,
          max: rawRubric.testCaseExecution?.max ?? 20,
          details: rawRubric.testCaseExecution?.details || "Deterministic sandbox test cases.",
        },
        {
          key: "codeQualityAndStructure",
          label: "Code Quality & Structure",
          earnedMarks: rawRubric.codeQualityAndStructure?.obtained ?? 0,
          maxMarks: rawRubric.codeQualityAndStructure?.max ?? 15,
          obtained: rawRubric.codeQualityAndStructure?.obtained ?? 0,
          max: rawRubric.codeQualityAndStructure?.max ?? 15,
          details: rawRubric.codeQualityAndStructure?.details || "Multi-file modularity and clean compilation.",
        },
        {
          key: "technicalRequirements",
          label: "Technical Requirements",
          earnedMarks: rawRubric.technicalRequirements?.obtained ?? 0,
          maxMarks: rawRubric.technicalRequirements?.max ?? 15,
          obtained: rawRubric.technicalRequirements?.obtained ?? 0,
          max: rawRubric.technicalRequirements?.max ?? 15,
          details: rawRubric.technicalRequirements?.details || "Architecture and technical constraints.",
        },
        {
          key: "errorHandlingAndEdgeCases",
          label: "Error Handling & Edge Cases",
          earnedMarks: rawRubric.errorHandlingAndEdgeCases?.obtained ?? 0,
          maxMarks: rawRubric.errorHandlingAndEdgeCases?.max ?? 10,
          obtained: rawRubric.errorHandlingAndEdgeCases?.obtained ?? 0,
          max: rawRubric.errorHandlingAndEdgeCases?.max ?? 10,
          details: rawRubric.errorHandlingAndEdgeCases?.details || "Boundary conditions and invalid input guards.",
        },
      ];

  const evFeedback = sub.evaluationFeedback || {};
  const mergedImprovements = [
    ...(evFeedback.deductions || []),
    ...(evFeedback.recommendations || []),
    ...(evFeedback.improvements || []),
  ];

  return {
    sessionId: sub.sessionId,
    submissionId: sub._id ? sub._id.toString() : sub.sessionId,
    reportType: "project_assessment",
    isProjectReport: true,
    isReadOnly: true,
    assessmentType: "project_assessment",
    subjectKey: "coding",
    trackId: sub.starterLanguage || project?.starterLanguage || "javascript",
    language: sub.starterLanguage || project?.starterLanguage || "javascript",
    projectId: sub.projectId,
    assessmentTitle: `${sub.projectTitle} — Project Assessment Report`,
    projectTitle: sub.projectTitle,
    projectCategory: sub.projectCategory,
    difficulty: sub.difficulty,
    passingMarks: passingCutoff,
    cutoffPercentage: passingCutoff,
    technologies: sub.technologies || project?.technologies || [],
    problemStatement: project?.problemStatement || project?.description || "",
    realWorldScenario: project?.realWorldScenario || "",
    objectives: project?.objectives || [],
    deliverables: project?.deliverables || [],
    problemData: {
      questionId: sub.projectId,
      title: sub.projectTitle,
      difficulty: sub.difficulty || project?.difficulty || "Intermediate",
      category: sub.projectCategory || project?.category || "Full-Stack Project",
      description: project?.problemStatement || project?.description || "",
      constraints: (project?.technicalRequirements || []).map((tr) => `${tr.title}: ${tr.constraint}`),
    },
    attemptNumber: sub.attemptNumber || 1,
    status: "submitted",
    passed: isPassed,
    badgeAwarded: Boolean(sub.badgeAwarded && isPassed),
    xpAwarded: sub.xpAwarded || 0,
    candidateDetails: sub.candidateDetails || {
      fullName: "Candidate",
      email: "",
      candidateId: `MZ-${String(sub.userId).slice(-6).toUpperCase()}`,
    },
    startTime: sub.startedAt,
    submittedAt: sub.submittedAt,
    submissionTime: sub.submittedAt,
    durationSeconds: sub.durationSeconds || 60,
    timeLimitSeconds: 3600 * 2,
    violationsCount: 0,
    recoveryChancesUsed: 0,
    recoveryChancesRemaining: 5,
    integrityStatus: "Standard Sandbox Evaluation (No Proctoring Telemetry)",
    scorecard: {
      totalQuestions: 1,
      questionsAttempted: isCodeEmpty ? 0 : 1,
      questionsUnanswered: isCodeEmpty ? 1 : 0,
      totalMarks: totalMarksVal,
      marksObtained: marksObtainedVal,
      passingMarks: passingCutoff,
      cutoffPercentage: passingCutoff,
      overallPercentage: percentageVal,
      accuracy: sub.totalTests > 0 ? Math.round(((sub.passedTests || 0) / sub.totalTests) * 100) : percentageVal,
      totalTestCases: sub.totalTests || 6,
      totalPassedTests: sub.passedTests || 0,
      totalFailedTests: Math.max(0, (sub.totalTests || 6) - (sub.passedTests || 0)),
      durationSeconds: sub.durationSeconds || 60,
      startTime: sub.startedAt,
      submissionTime: sub.submittedAt,
      grade: sub.grade || "F",
      passed: isPassed,
      partiallyPassed: !isPassed && marksObtainedVal > 0,
      status: isPassed ? "PASSED" : "NEEDS_IMPROVEMENT",
      violationsCount: 0,
      integrityStatus: "Standard Sandbox Evaluation (No Proctoring Telemetry)",
      tasksCompleted: tasksSatisfiedCount,
      totalTasks: totalTasksCount,
      requirementsSatisfied: reqsSatisfiedCount,
      totalRequirements: totalReqsCount,
    },
    performance: {
      score: percentageVal,
      marksObtained: marksObtainedVal,
      totalMarks: totalMarksVal,
      passingMarks: passingCutoff,
      grade: sub.grade || "F",
      accuracy: sub.totalTests > 0 ? Math.round(((sub.passedTests || 0) / sub.totalTests) * 100) : percentageVal,
      passedTests: sub.passedTests || 0,
      totalTests: sub.totalTests || 6,
      passed: isPassed,
      partiallyPassed: !isPassed && marksObtainedVal > 0,
      status: isPassed ? "PASSED" : "NEEDS_IMPROVEMENT",
    },
    rubricBreakdown: rubricBreakdownArray,
    rubricBreakdownMap: rawRubric,
    tasksEvaluation: sub.tasksEvaluation || [],
    requirementsEvaluation: sub.requirementsEvaluation || [],
    files: sub.files || [],
    submittedFiles,
    submittedCode: sub.combinedCodeSnapshot || (files[0]?.content || ""),
    testResults: sub.testResults || [],
    evaluationFeedback: {
      ...evFeedback,
      improvements: mergedImprovements,
    },
    proctoringAudit: {
      telemetryAvailable: false,
      integrityStatus: "Standard Sandbox Evaluation (No Proctoring Telemetry)",
      maxChances: 5,
      chancesUsed: 0,
      chancesRemaining: 5,
      violationsCount: 0,
      violationsTimeline: [],
    },
    questions,
    submissionResult: {
      code: sub.combinedCodeSnapshot || (files[0]?.content || ""),
      language: sub.starterLanguage || "javascript",
      score: percentageVal,
      marksObtained: marksObtainedVal,
      totalMarks: totalMarksVal,
      passingMarks: passingCutoff,
      grade: sub.grade || "F",
      accuracy: sub.totalTests > 0 ? Math.round(((sub.passedTests || 0) / sub.totalTests) * 100) : 0,
      passed: isPassed,
      status: isPassed ? "PASSED" : "NEEDS_IMPROVEMENT",
      passedTests: sub.passedTests || 0,
      totalTests: sub.totalTests || 6,
      durationSeconds: sub.durationSeconds || 60,
      submittedAt: sub.submittedAt,
      testResults: sub.testResults || [],
      evaluationFeedback: {
        ...evFeedback,
        improvements: mergedImprovements,
      },
    },
  };
}

// ============================================================================
// 1. GET /api/projects — List all 14 projects enriched with student progress
// ============================================================================
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const isValidId = userId && mongoose.Types.ObjectId.isValid(userId);
    const states = isValidId
      ? await ProjectWorkspaceState.find({ userId: new mongoose.Types.ObjectId(userId) }).lean()
      : [];
    const stateMap = new Map(states.map((s) => [s.projectId, s]));

    const enrichedProjects = PROJECTS_CATALOG.map((proj) => {
      const st = stateMap.get(proj.id);
      const spec = getPublicProjectSpec(proj);
      const totalTasks = spec.milestones.length;
      const checkedCount = st?.checkedTasks?.length || 0;

      const passingMarks = spec.passingMarks || 80;
      const bestScore = st?.bestScore || st?.lastScore || 0;
      const isPassed = Boolean(st?.passed && st?.badgeAwarded && bestScore >= passingMarks);

      let status = "not_started";
      let progressPct = 0;

      if (st) {
        if (isPassed) {
          status = "passed";
          progressPct = 100;
        } else if (st.status === "needs_improvement" || (st.attemptsCount > 0 && !isPassed)) {
          status = "needs_improvement";
          progressPct = Math.max(40, Math.min(90, st.lastScore || st.bestScore || 50));
        } else if (st.status === "in_progress" || checkedCount > 0 || st.attemptsCount > 0) {
          status = "in_progress";
          progressPct = Math.min(
            90,
            Math.max(15, Math.round((checkedCount / Math.max(1, totalTasks)) * 80))
          );
        }
      }

      return {
        ...spec,
        userState: {
          status,
          progressPct,
          checkedTasks: st?.checkedTasks || [],
          attemptsCount: st?.attemptsCount || 0,
          bestScore,
          bestGrade: st?.bestGrade || "",
          lastScore: st?.lastScore ?? null,
          passed: isPassed,
          badgeAwarded: isPassed,
          completedAt: st?.completedAt || null,
          latestReportSessionId: st?.latestReportSessionId || "",
          latestReportUrl: st?.latestReportSessionId
            ? `/assessment-report/${st.latestReportSessionId}`
            : "",
        },
      };
    });

    const completedCount = enrichedProjects.filter((p) => p.userState.passed).length;
    const inProgressCount = enrichedProjects.filter(
      (p) => p.userState.status === "in_progress" || p.userState.status === "needs_improvement"
    ).length;
    const earnedProjectXp = enrichedProjects
      .filter((p) => p.userState.passed)
      .reduce((acc, p) => acc + (p.xpReward || 400), 0);

    res.json({
      success: true,
      summary: {
        totalProjects: enrichedProjects.length,
        completedCount,
        inProgressCount,
        notStartedCount: enrichedProjects.length - completedCount - inProgressCount,
        earnedProjectXp,
      },
      projects: enrichedProjects,
    });
  } catch (err) {
    console.error("GET /api/projects error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 2. GET /api/projects/submissions/:sessionId/report — Fetch permanent report
// ============================================================================
router.get("/submissions/:sessionId/report", optionalAuthenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    let sub = await ProjectSubmission.findOne({ sessionId }).lean();
    if (!sub && mongoose.Types.ObjectId.isValid(sessionId)) {
      sub = await ProjectSubmission.findById(sessionId).lean();
    }
    if (!sub) {
      return res.status(404).json({ error: "Project assessment report not found" });
    }

    const userId = resolveUserId(req);
    const isPrivileged = req.user?.role === "admin" || req.user?.role === "SUPER_ADMIN";
    const subUid = String(sub.userId || "");
    if (subUid && !subUid.startsWith("guest_") && subUid !== "guest") {
      if (!userId || (!isPrivileged && String(userId) !== subUid)) {
        return res.status(403).json({ error: "Access denied. You do not have permission to view this project report." });
      }
    }

    const project = getProjectById(sub.projectId);
    return res.json({
      success: true,
      report: formatSubmissionAsReport(sub, project),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 3. GET /api/projects/:projectId — Load workspace, saved files & attempts
// ============================================================================
router.get("/:projectId", authenticateToken, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { projectId } = req.params;
    const project = getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const spec = getPublicProjectSpec(project);
    const isValidId = userId && mongoose.Types.ObjectId.isValid(userId);
    const userObjId = isValidId ? new mongoose.Types.ObjectId(userId) : null;
    const [workspace, submissions] = await Promise.all([
      userObjId ? ProjectWorkspaceState.findOne({ userId: userObjId, projectId }).lean() : null,
      userObjId
        ? ProjectSubmission.find({ userId: userObjId, projectId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select(
              "sessionId attemptNumber marksObtained totalMarks percentage grade passed status badgeAwarded passedTests totalTests submittedAt durationSeconds"
            )
            .lean()
        : [],
    ]);

    const activeFiles =
      workspace?.files && workspace.files.length > 0 ? workspace.files : spec.files;

    res.json({
      success: true,
      project: spec,
      workspace: {
        status: workspace?.status || "not_started",
        files: activeFiles,
        checkedTasks: workspace?.checkedTasks || [],
        lastRunSummary: workspace?.lastRunSummary || null,
        startedAt: workspace?.startedAt || new Date(),
        timeSpentSeconds: workspace?.timeSpentSeconds || 0,
        attemptsCount: workspace?.attemptsCount || 0,
        bestScore: workspace?.bestScore || 0,
        bestGrade: workspace?.bestGrade || "",
        passed: Boolean(workspace?.passed && workspace?.badgeAwarded),
        badgeAwarded: Boolean(workspace?.passed && workspace?.badgeAwarded),
        latestReportSessionId: workspace?.latestReportSessionId || "",
      },
      submissions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 4. POST /api/projects/:projectId/save — Save multi-file workspace & checklist
// ============================================================================
router.post("/:projectId/save", authenticateToken, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { projectId } = req.params;
    const project = getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const { files, checkedTasks, timeSpentSeconds } = req.body;
    const normalizedFiles = normalizeFilesList(project, files);

    const isValidId = userId && mongoose.Types.ObjectId.isValid(userId);
    if (!isValidId) {
      return res.status(401).json({ error: "Invalid user session" });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);
    let ws = await ProjectWorkspaceState.findOne({ userId: userObjId, projectId });
    if (!ws) {
      ws = new ProjectWorkspaceState({
        userId: userObjId,
        projectId,
        status: "in_progress",
        startedAt: new Date(),
      });
    }

    ws.files = normalizedFiles;
    if (Array.isArray(checkedTasks)) {
      ws.checkedTasks = checkedTasks;
    }
    if (typeof timeSpentSeconds === "number" && timeSpentSeconds > (ws.timeSpentSeconds || 0)) {
      ws.timeSpentSeconds = timeSpentSeconds;
    }
    if (ws.status === "not_started") {
      ws.status = "in_progress";
    }
    ws.lastUpdatedAt = new Date();
    await ws.save();

    res.json({
      success: true,
      workspace: ws,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. POST /api/projects/:projectId/run — Execute custom input or test cases
// ============================================================================
router.post("/:projectId/run", authenticateToken, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { projectId } = req.params;
    const project = getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const { files, mode = "tests", customInput = "", checkedTasks } = req.body;
    const normalizedFiles = normalizeFilesList(project, files);

    if (mode === "custom") {
      const sandbox = await prepareMultiFileSandbox(project, normalizedFiles);
      try {
        if (!sandbox.ok) {
          return res.json({
            success: false,
            mode: "custom",
            output: "",
            error: sandbox.compileError,
            durationMs: 0,
          });
        }
        const inputToRun =
          customInput !== undefined && String(customInput).trim() !== ""
            ? String(customInput)
            : project.testCases?.[0]?.input || "";
        const runRes = await sandbox.runInput(inputToRun);
        return res.json({
          success: runRes.exitCode === 0,
          ok: runRes.exitCode === 0,
          mode: "custom",
          inputUsed: inputToRun,
          output: runRes.output || "",
          error: runRes.error || "",
          durationMs: runRes.duration || 1,
        });
      } finally {
        sandbox.cleanup();
      }
    }

    // Full live test & rubric preview without creating a final submission
    const evaluation = await evaluateFullProject(project, normalizedFiles);

    // Persist workspace draft & lastRunSummary
    const isValidId = userId && mongoose.Types.ObjectId.isValid(userId);
    if (!isValidId) {
      return res.status(401).json({ error: "Invalid user session" });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);
    let ws = await ProjectWorkspaceState.findOne({ userId: userObjId, projectId });
    if (!ws) {
      ws = new ProjectWorkspaceState({
        userId: userObjId,
        projectId,
        status: "in_progress",
        startedAt: new Date(),
      });
    }
    ws.files = normalizedFiles;
    if (Array.isArray(checkedTasks)) {
      ws.checkedTasks = checkedTasks;
    }
    ws.lastRunSummary = {
      marksObtained: evaluation.marksObtained,
      totalMarks: evaluation.totalMarks,
      passedTests: evaluation.passedTests,
      totalTests: evaluation.totalTests,
      rubricBreakdown: evaluation.rubricBreakdown,
      timestamp: new Date(),
    };
    ws.lastUpdatedAt = new Date();
    await ws.save();

    const firstTest = evaluation.testResults?.[0] || {};
    res.json({
      success: true,
      ok: !firstTest.error || firstTest.passed,
      mode: "tests",
      output: firstTest.actualOutput || "",
      error: firstTest.passed ? "" : firstTest.error || "",
      durationMs: firstTest.durationMs || 1,
      testResults: evaluation.testResults || [],
      passedTests: evaluation.passedTests || 0,
      totalTests: evaluation.totalTests || 0,
      evaluation,
    });
  } catch (err) {
    console.error("POST /api/projects/:projectId/run error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 6. POST /api/projects/:projectId/submit — Strict Evaluation & Permanent Report
// ============================================================================
router.post("/:projectId/submit", authenticateToken, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { projectId } = req.params;
    const project = getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const { files, checkedTasks, timeSpentSeconds, durationSeconds: bodyDuration } = req.body;
    const evaluation = await evaluateFullProject(project, files);

    const isValidId = userId && mongoose.Types.ObjectId.isValid(userId);
    if (!isValidId) {
      return res.status(401).json({ error: "Invalid user session" });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(userObjId).lean();
    let ws = await ProjectWorkspaceState.findOne({ userId: userObjId, projectId });
    if (!ws) {
      ws = new ProjectWorkspaceState({
        userId: userObjId,
        projectId,
        startedAt: new Date(Date.now() - 180000),
      });
    }

    const existingPassedSub = await ProjectSubmission.findOne({
      userId: userObjId,
      projectId: project.id,
      passed: true,
    }).lean();
    const wasAlreadyPassed = Boolean((ws.passed && ws.badgeAwarded) || existingPassedSub);
    const attemptNumber = (ws.attemptsCount || 0) + 1;
    const now = new Date();
    const durationSeconds = Math.max(
      15,
      Number(timeSpentSeconds) ||
        Number(bodyDuration) ||
        ws.timeSpentSeconds ||
        Math.round((now.getTime() - new Date(ws.startedAt || now).getTime()) / 1000) ||
        120
    );

    const sessionId = `proj_sub_${projectId}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    const combinedCodeSnapshot = evaluation.files
      .map((f) => `// ==========================================\n// FILE: ${f.name}\n// ==========================================\n${f.content}`)
      .join("\n\n");

    const xpAwarded = evaluation.passed && !wasAlreadyPassed ? project.xpReward || 400 : 0;

    const submissionDoc = await ProjectSubmission.create({
      sessionId,
      userId: userObjId,
      candidateDetails: {
        fullName: user?.fullName || user?.username || "Candidate",
        email: user?.email || "candidate@masteryzone.com",
        candidateId: `MZ-${String(userId).slice(-6).toUpperCase()}`,
      },
      projectId: project.id,
      projectTitle: project.title,
      projectCategory: project.category,
      track: project.track,
      difficulty: project.difficulty,
      starterLanguage: project.starterLanguage,
      technologies: project.technologies || [],
      attemptNumber,
      files: evaluation.files.map((f) => ({
        name: f.name,
        language: f.language,
        content: f.content,
        sizeBytes: Buffer.byteLength(f.content || "", "utf8"),
      })),
      combinedCodeSnapshot,
      rubricBreakdown: evaluation.rubricBreakdown,
      totalMarks: evaluation.totalMarks,
      marksObtained: evaluation.marksObtained,
      percentage: evaluation.percentage,
      passingMarks: evaluation.passingMarks,
      grade: evaluation.grade,
      passed: evaluation.passed,
      status: evaluation.status,
      badgeAwarded: evaluation.passed,
      xpAwarded,
      tasksEvaluation: evaluation.tasksEvaluation,
      requirementsEvaluation: evaluation.requirementsEvaluation,
      testResults: evaluation.testResults,
      passedTests: evaluation.passedTests,
      totalTests: evaluation.totalTests,
      evaluationFeedback: evaluation.evaluationFeedback,
      startedAt: ws.startedAt || new Date(now.getTime() - durationSeconds * 1000),
      submittedAt: now,
      durationSeconds,
    });

    // Update workspace state
    ws.files = evaluation.files;
    if (Array.isArray(checkedTasks)) {
      ws.checkedTasks = checkedTasks;
    } else if (evaluation.passed) {
      ws.checkedTasks = (project.milestones || []).map((m) => m.id);
    }
    ws.attemptsCount = attemptNumber;
    ws.lastScore = evaluation.marksObtained;
    if (evaluation.marksObtained >= (ws.bestScore || 0)) {
      ws.bestScore = evaluation.marksObtained;
      ws.bestGrade = evaluation.grade;
    }
    if (evaluation.passed) {
      ws.passed = true;
      ws.badgeAwarded = true;
      ws.status = "passed";
      ws.completedAt = ws.completedAt || now;
    } else if (!ws.passed) {
      ws.status = "needs_improvement";
    }
    ws.latestSubmissionId = submissionDoc._id.toString();
    ws.latestReportSessionId = sessionId;
    ws.lastUpdatedAt = now;
    await ws.save();

    // If PASSED for the first time, record in Homepage -> Progress & CodingProgress
    if (evaluation.passed && !wasAlreadyPassed) {
      try {
        await Progress.create({
          userId,
          track: "CODING",
          task: `Completed Project: ${project.title} (${evaluation.marksObtained}/100, Grade ${evaluation.grade})`,
          moduleName: `${project.category} •PROJECT COMPLETED`,
          hoursSpent: 1.5,
          xpEarned: xpAwarded,
          score: evaluation.marksObtained,
          notes: `Session: ${sessionId}`,
          status: "completed",
          date: now,
        });
      } catch (progErr) {
        console.warn("Could not log project completion to Progress:", progErr.message);
      }

      try {
        let cProg = await CodingProgress.findOne({ userId });
        if (!cProg) cProg = new CodingProgress({ userId });
        cProg.totalScore = (cProg.totalScore || 0) + xpAwarded;
        cProg.hoursSpent = Math.round(((cProg.hoursSpent || 0) + 1.5) * 10) / 10;
        await cProg.save();
      } catch (cpErr) {
        console.warn("Could not update CodingProgress:", cpErr.message);
      }
    }

    // Real-time bell notification
    await pushNotification(req.app, {
      userId,
      title: evaluation.passed
        ? "Project Passed — PROJECT COMPLETED Badge Earned!"
        : "Project Evaluated — Needs Improvement",
      message: `${project.title}: Scored ${evaluation.marksObtained}/100 (${evaluation.passedTests}/${evaluation.totalTests} tests passed, Grade ${evaluation.grade}).`,
      type: "assessment",
      severity: evaluation.passed ? "success" : "warning",
      actionUrl: `/assessment-report/${sessionId}`,
      actionLabel: "View Project Report",
      meta: {
        projectId: project.id,
        sessionId,
        marksObtained: evaluation.marksObtained,
        passed: evaluation.passed,
        badgeAwarded: evaluation.passed,
      },
    });

    // Notify Super Admin of Project Submission and Report Generation
    pushAdminNotification({
      title: evaluation.passed ? "Project Completed & Passed!" : "Project Assessment Evaluated",
      message: `${user?.fullName || user?.username || "Candidate"} completed ${project.title} — ${evaluation.passed ? "PASSED (Completed Badge Awarded)" : "NEEDS IMPROVEMENT"} (${evaluation.marksObtained}/100 Marks, Grade ${evaluation.grade}).`,
      type: "project",
      severity: evaluation.passed ? "success" : "info",
      targetId: String(submissionDoc._id),
      actionUrl: `/assessment-report/${sessionId}`,
      io: req.app.get("io"),
    }).catch(() => {});

    // Real-time socket broadcast to Super Admin Centralized Reports
    try {
      const io = req.app.get("io");
      if (io) {
        const adminProjectReport = {
          id: submissionDoc._id,
          rawId: submissionDoc._id,
          itemType: "project",
          sessionId,
          title: `${project.title} — Project Assessment Report`,
          type: "Project Assessment Report",
          recipient: user?.fullName || user?.username || submissionDoc.candidateDetails?.fullName || "Candidate",
          email: user?.email || submissionDoc.candidateDetails?.email || "",
          score: `${evaluation.marksObtained}/100 (${evaluation.marksObtained}%)`,
          rawScore: evaluation.marksObtained,
          maxScore: 100,
          grade: evaluation.grade || (evaluation.passed ? "Passed" : "Needs Improvement"),
          verificationCode: String(sessionId || submissionDoc._id).slice(-8).toUpperCase(),
          date: now,
          status: evaluation.passed ? "PASSED" : "NEEDS_IMPROVEMENT",
          reportUrl: `/assessment-report/${sessionId}`,
        };
        io.emit("NEW_REPORT", adminProjectReport);
        io.emit("NEW_SUBMISSION", {
          type: "project",
          sessionId,
          userId: String(userId),
          passed: evaluation.passed,
        });
      }
    } catch (socketErr) {
      console.warn("Socket notification warning for project:", socketErr.message);
    }

    try {
      const recipientEmail = user?.email || submissionDoc?.candidateDetails?.email;
      const recipientName = user?.fullName || user?.username || submissionDoc?.candidateDetails?.fullName || "Candidate";
      if (recipientEmail && !isGuestAccount(recipientEmail, user?.role)) {
        dispatchMailBackground(async () => {
          return await sendSubmissionEvaluationEmail({
            userEmail: recipientEmail,
            userName: recipientName,
            assessmentTitle: project.title,
            assessmentType: "project",
            score: evaluation.marksObtained,
            maxScore: 100,
            percentage: evaluation.marksObtained,
            verdict: evaluation.passed ? "PASSED" : "FAILED",
            reportUrl: `/assessment-report/${sessionId}`,
            req,
          });
        }, { type: "project_evaluated", recipient: recipientEmail });
      }
    } catch (mailDispatchErr) {
      console.warn("Project evaluation email dispatch warning:", mailDispatchErr.message);
    }

    res.status(201).json({
      success: true,
      sessionId,
      reportUrl: `/assessment-report/${sessionId}`,
      attemptNumber,
      xpAwarded,
      evaluation,
      submission: {
        ...evaluation,
        sessionId,
        reportUrl: `/assessment-report/${sessionId}`,
        attemptNumber,
        xpAwarded,
        submittedAt: now.toISOString(),
      },
      report: formatSubmissionAsReport(submissionDoc.toObject(), project),
    });
  } catch (err) {
    console.error("POST /api/projects/:projectId/submit error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = {
  router,
  evaluateFullProject,
  formatSubmissionAsReport,
};
