import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCode,
  FiClock,
  FiSend,
  FiGrid,
  FiCheckSquare,
  FiEdit3,
  FiFileText,
  FiCheck,
  FiCopy,
  FiMaximize2,
  FiMinimize2,
  FiDownload,
  FiRotateCcw,
  FiPlay,
  FiTerminal,
  FiAward,
  FiAlertTriangle,
  FiExternalLink,
  FiPlus,
  FiZap,
} from "react-icons/fi";
import "./projectWorkspace.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

function getEditorLanguage(fileName = "", fallback = "javascript") {
  const lower = String(fileName).toLowerCase();
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".cpp") || lower.endsWith(".cc") || lower.endsWith(".h")) return "cpp";
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".json")) return "json";
  return fallback || "javascript";
}

function formatLanguageDisplay(lang = "javascript") {
  const lower = String(lang || "javascript").toLowerCase();
  if (lower === "javascript" || lower === "js") return "JavaScript";
  if (lower === "python" || lower === "py") return "Python";
  if (lower === "java") return "Java";
  if (lower === "cpp" || lower === "c++") return "C++";
  return String(lang).charAt(0).toUpperCase() + String(lang).slice(1);
}

function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getProjectProTip(project) {
  if (project?.proTip) return project.proTip;
  const lang = String(project?.starterLanguage || "javascript").toLowerCase();
  const title = String(project?.title || "").toLowerCase();
  if (title.includes("portfolio")) {
    return "Use clean modular functions and structured JSON output for a resilient portfolio architecture.";
  }
  if (lang === "python") {
    return "Keep your Python modules pure, handle edge-case inputs defensively, and emit valid JSON to stdout.";
  }
  if (lang === "java") {
    return "Ensure your Main entry class and service classes handle null/invalid payloads without uncaught exceptions.";
  }
  return "Modularize your business logic across workspace files and verify edge cases with Run Project before submitting.";
}

export function ProjectWorkspaceModal({ project: initialProject, onClose, onProjectStateUpdated, isStandalone = false }) {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams();
  const token = localStorage.getItem("token");
  const projectId = initialProject?.id || initialProject?._id || routeProjectId;

  const currentUserId = (() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const uid = u._id || u.id || u.userId || "";
        return uid !== "guest" ? uid : "";
      }
    } catch {}
    return "";
  })();

  const [projectSpec, setProjectSpec] = useState(initialProject || null);
  const [files, setFiles] = useState(() => {
    // Check user-scoped localStorage backup first if available
    try {
      if (currentUserId) {
        const localKey = `mz_${currentUserId}_proj_draft_${initialProject?.id || routeProjectId}`;
        const savedDraft = localStorage.getItem(localKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (Array.isArray(parsed?.files) && parsed.files.length > 0) {
            return parsed.files;
          }
        }
      }
    } catch {}
    return Array.isArray(initialProject?.files) && initialProject.files.length > 0
      ? initialProject.files.map((f, idx) => ({
          id: f.id || `file_${idx}`,
          name: f.name,
          language: f.language || getEditorLanguage(f.name, initialProject?.starterLanguage),
          content: f.content || "",
        }))
      : [{ id: "file_0", name: "main.js", language: "javascript", content: "" }];
  });

  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [checkedTasks, setCheckedTasks] = useState(initialProject?.userState?.checkedTasks || []);
  const [userState, setUserState] = useState(initialProject?.userState || {});

  // Navigation & View Tabs (Strictly NO Evaluation or Report tabs during active assessment)
  const [topNavTab, setTopNavTab] = useState("problem"); // "overview" | "problem" | "editor" | "testcases"
  const [bottomTab, setBottomTab] = useState("testcases"); // "testcases" | "console" | "output"
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer & Auto-Save Telemetry
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(6312); // 01:45:12 matching blueprint
  const [startTimeMs] = useState(() => Date.now());
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(() => Date.now());
  const [secondsSinceSave, setSecondsSinceSave] = useState(2);
  const [copiedCode, setCopiedCode] = useState(false);

  // Real-Time Execution & Test Case States
  const [customInput, setCustomInput] = useState(
    initialProject?.testCases?.[0]?.input && !initialProject?.testCases?.[0]?.isHidden
      ? initialProject.testCases[0].input
      : ""
  );
  const [liveOutputData, setLiveOutputData] = useState(null);
  const [testSuiteResults, setTestSuiteResults] = useState(null);
  const [isRunningProject, setIsRunningProject] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusToast, setStatusToast] = useState(null);

  // Post-Submission Result Screen State (Shown ONLY after Submit Project)
  const [submissionResultModal, setSubmissionResultModal] = useState(null);

  const editorSectionRef = useRef(null);
  const bottomPanelRef = useRef(null);
  const hasMountedRef = useRef(false);
  const autoSaveTimerRef = useRef(null);
  const autoRunTimerRef = useRef(null);

  // Countdown clock (ticks every second) & "Auto Saved • Xs ago" ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setSecondsSinceSave(Math.max(1, Math.floor((Date.now() - lastSavedAt) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSavedAt]);

  // Security guard against backward swipe/navigation during or after project submission
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      const pId = projectSpec?.id || projectId;
      const isEnded =
        sessionStorage.getItem(`mz_proj_submitted_${pId}`) === "true" ||
        (currentUserId && sessionStorage.getItem(`mz_${currentUserId}_proj_submitted_${pId}`) === "true");
      if (isEnded || submissionResultModal) {
        navigate("/coding?tab=projects", { replace: true });
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [projectSpec, projectId, currentUserId, submissionResultModal, navigate]);

  // Fetch full project workspace state from backend on mount
  useEffect(() => {
    if (!projectId || !token) return;
    let cancelled = false;
    setIsLoadingWorkspace(true);

    fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.success) return;
        if (data.project) {
          setProjectSpec(data.project);
          if (!customInput && data.project.testCases?.[0]?.input && !data.project.testCases[0].isHidden) {
            setCustomInput(data.project.testCases[0].input);
          }
        }
        if (Array.isArray(data.workspace?.files) && data.workspace.files.length > 0) {
          const loadedFiles = data.workspace.files.map((f, idx) => ({
            id: f.id || `file_${idx}`,
            name: f.name,
            language: f.language || getEditorLanguage(f.name, data.project?.starterLanguage),
            content: f.content ?? "",
          }));
          setFiles(loadedFiles);
          setActiveFileIdx(0);
          try {
            if (currentUserId) {
              localStorage.setItem(
                `mz_${currentUserId}_proj_draft_${projectId}`,
                JSON.stringify({ files: loadedFiles, updatedAt: Date.now() })
              );
            }
          } catch {}
        }
        if (Array.isArray(data.workspace?.checkedTasks)) {
          setCheckedTasks(data.workspace.checkedTasks);
        }
        if (data.workspace) {
          setUserState((prev) => ({
            ...prev,
            status: String(data.workspace.status || prev.status || "in_progress").toLowerCase(),
            passed: Boolean(data.workspace.passed && data.workspace.badgeAwarded),
            badgeAwarded: Boolean(data.workspace.passed && data.workspace.badgeAwarded),
            attemptsCount: data.workspace.attemptsCount || 0,
            bestScore: data.workspace.bestScore || 0,
            bestGrade: data.workspace.bestGrade || "",
            latestReportSessionId: data.workspace.latestReportSessionId || "",
          }));
        }
        hasMountedRef.current = true;
      })
      .catch((err) => {
        console.error("Failed to load project workspace:", err);
        hasMountedRef.current = true;
      })
      .finally(() => {
        if (!cancelled) setIsLoadingWorkspace(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, token]);

  const activeFile = files[activeFileIdx] || files[0] || {
    name: "main.js",
    language: "javascript",
    content: "",
  };

  // Persist workspace to backend + localStorage
  const persistWorkspace = useCallback(
    async (filesToSave, tasksToSave, silent = true) => {
      if (!projectId) return;
      try {
        if (currentUserId) {
          localStorage.setItem(
            `mz_${currentUserId}_proj_draft_${projectId}`,
            JSON.stringify({ files: filesToSave, checkedTasks: tasksToSave, updatedAt: Date.now() })
          );
        }
      } catch {}

      if (!token) return;
      setIsSaving(true);
      try {
        const elapsed = Math.max(5, Math.round((Date.now() - startTimeMs) / 1000));
        const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            files: filesToSave,
            checkedTasks: tasksToSave,
            timeSpentSeconds: elapsed,
          }),
        });
        const data = await res.json();
        if (data?.success) {
          setLastSavedAt(Date.now());
          setSecondsSinceSave(1);
          if (!silent) {
            setStatusToast({ type: "success", text: "Workspace saved." });
          }
          if (onProjectStateUpdated) onProjectStateUpdated();
        }
      } catch (err) {
        if (!silent) {
          setStatusToast({ type: "error", text: `Auto-save error: ${err.message}` });
        }
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, token, startTimeMs, onProjectStateUpdated]
  );

  // Execute custom/default input in real sandbox (used for live debounced execution & Console)
  const executeLiveSandbox = useCallback(
    async (currentFiles, inputPayload, switchTab = false) => {
      if (!token || !projectId) return;
      setIsRunningProject(true);
      if (switchTab) {
        setBottomTab("output");
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: "custom",
            files: currentFiles,
            customInput:
              inputPayload !== undefined
                ? inputPayload
                : customInput || projectSpec?.testCases?.[0]?.input || "",
          }),
        });
        const data = await res.json();
        setLiveOutputData({
          ok: Boolean(data.ok ?? data.success),
          output: data.output || "",
          error: data.error || "",
          durationMs: data.durationMs || 1,
          inputUsed: data.inputUsed || customInput || "",
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (err) {
        setLiveOutputData({
          ok: false,
          output: "",
          error: err.message,
          durationMs: 0,
          timestamp: new Date().toLocaleTimeString(),
        });
      } finally {
        setIsRunningProject(false);
      }
    },
    [token, projectId, customInput, projectSpec]
  );

  // Handle code edits with debounced Auto-Save AND debounced Live Output Execution
  const handleCodeChange = (val) => {
    const updatedContent = val ?? "";
    const nextFiles = files.map((f, idx) =>
      idx === activeFileIdx ? { ...f, content: updatedContent } : f
    );
    setFiles(nextFiles);

    // Save immediately to localStorage for instant crash recovery
    try {
      if (currentUserId) {
        localStorage.setItem(
          `mz_${currentUserId}_proj_draft_${projectId}`,
          JSON.stringify({ files: nextFiles, checkedTasks, updatedAt: Date.now() })
        );
      }
    } catch {}

    // Debounced backend auto-save (750ms)
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      persistWorkspace(nextFiles, checkedTasks, true);
    }, 750);

    // Debounced live execution output update (1150ms)
    if (autoRunTimerRef.current) clearTimeout(autoRunTimerRef.current);
    autoRunTimerRef.current = setTimeout(() => {
      executeLiveSandbox(nextFiles, customInput, false);
    }, 1150);
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (autoRunTimerRef.current) clearTimeout(autoRunTimerRef.current);
    };
  }, []);

  // Run Project (Executes both live output AND test cases so Output, Console, and Test Cases all update)
  const handleRunProject = async () => {
    if (!token || !projectId) return;
    setIsRunningProject(true);
    setIsRunningTests(true);
    setStatusToast(null);

    try {
      const [customRes, testsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/projects/${projectId}/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: "custom",
            files,
            customInput: customInput || projectSpec?.testCases?.[0]?.input || "",
          }),
        }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/projects/${projectId}/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: "tests",
            files,
            checkedTasks,
          }),
        }).then((r) => r.json()),
      ]);

      setLiveOutputData({
        ok: Boolean(customRes.ok ?? customRes.success),
        output: customRes.output || "",
        error: customRes.error || "",
        durationMs: customRes.durationMs || 1,
        inputUsed: customRes.inputUsed || customInput || "",
        timestamp: new Date().toLocaleTimeString(),
      });

      const testResults = testsRes?.testResults || testsRes?.evaluation?.testResults || [];
      const passedCount = testsRes?.passedTests ?? testsRes?.evaluation?.passedTests ?? 0;
      const totalCount = testsRes?.totalTests ?? testsRes?.evaluation?.totalTests ?? testResults.length;

      setTestSuiteResults({
        testResults,
        passedTests: passedCount,
        totalTests: totalCount,
        timestamp: new Date().toLocaleTimeString(),
      });

      setLastSavedAt(Date.now());
      setSecondsSinceSave(1);
      if (onProjectStateUpdated) onProjectStateUpdated();
    } catch (err) {
      setStatusToast({ type: "error", text: `Execution failed: ${err.message}` });
    } finally {
      setIsRunningProject(false);
      setIsRunningTests(false);
    }
  };

  // Run Tests specifically and focus Test Cases tab
  const handleRunTests = async () => {
    if (!token || !projectId) return;
    setIsRunningTests(true);
    setBottomTab("testcases");
    setStatusToast(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: "tests",
          files,
          checkedTasks,
        }),
      });
      const data = await res.json();
      const testResults = data?.testResults || data?.evaluation?.testResults || [];
      const passedCount = data?.passedTests ?? data?.evaluation?.passedTests ?? 0;
      const totalCount = data?.totalTests ?? data?.evaluation?.totalTests ?? testResults.length;

      setTestSuiteResults({
        testResults,
        passedTests: passedCount,
        totalTests: totalCount,
        timestamp: new Date().toLocaleTimeString(),
      });

      if (testResults[0]) {
        setLiveOutputData({
          ok: !testResults[0].error || testResults[0].passed,
          output: testResults[0].actualOutput || "",
          error: testResults[0].passed ? "" : testResults[0].error || "",
          durationMs: testResults[0].durationMs || 1,
          inputUsed: testResults[0].input || "",
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      setLastSavedAt(Date.now());
      setSecondsSinceSave(1);
      if (onProjectStateUpdated) onProjectStateUpdated();
    } catch (err) {
      setStatusToast({ type: "error", text: `Test execution error: ${err.message}` });
    } finally {
      setIsRunningTests(false);
    }
  };

  // Copy active file code
  const handleCopyCode = () => {
    const content = activeFile?.content || "";
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(content);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  // Download active file code
  const handleDownloadCode = () => {
    const content = activeFile?.content || "";
    const filename = activeFile?.name || "solution.js";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset workspace to starter template
  const handleResetStarter = async () => {
    const starterList = (projectSpec?.files || initialProject?.files || []).map((f, idx) => ({
      id: f.id || `file_${idx}`,
      name: f.name,
      language: f.language || getEditorLanguage(f.name, projectSpec?.starterLanguage),
      content: f.content || "",
    }));
    setFiles(starterList);
    setActiveFileIdx(0);
    setCheckedTasks([]);
    setTestSuiteResults(null);
    setLiveOutputData(null);
    setSubmissionResultModal(null);
    await persistWorkspace(starterList, [], false);
  };

  // Load verified multi-file reference solution
  const handleLoadReferenceSolution = async () => {
    const solFiles = projectSpec?.solutionFiles || initialProject?.solutionFiles || [];
    if (!Array.isArray(solFiles) || solFiles.length === 0) return;
    const mapped = solFiles.map((f, idx) => ({
      id: f.id || `file_${idx}`,
      name: f.name,
      language: f.language || getEditorLanguage(f.name, projectSpec?.starterLanguage),
      content: f.content || "",
    }));
    const allTaskIds = (projectSpec?.milestones || []).map((m) => m.id);
    setFiles(mapped);
    setActiveFileIdx(0);
    setCheckedTasks(allTaskIds);
    await persistWorkspace(mapped, allTaskIds, true);
    executeLiveSandbox(mapped, customInput, false);
  };

  // Add a new helper file
  const handleAddFile = () => {
    const ext =
      projectSpec?.starterLanguage === "python"
        ? ".py"
        : projectSpec?.starterLanguage === "java"
        ? ".java"
        : ".js";
    const defaultName = `module_${files.length + 1}${ext}`;
    const name = window.prompt("Enter new module filename:", defaultName);
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    if (files.some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) return;
    const newFile = {
      id: `file_${Date.now()}`,
      name: cleanName,
      language: getEditorLanguage(cleanName, projectSpec?.starterLanguage),
      content: `// ${cleanName}\n`,
    };
    const nextFiles = [...files, newFile];
    setFiles(nextFiles);
    setActiveFileIdx(nextFiles.length - 1);
    persistWorkspace(nextFiles, checkedTasks, true);
  };

  // Submit Project for Official Server-Side Grading & Permanent Report Generation
  const handleSubmitProject = async () => {
    if (!token || !projectId) return;
    setIsSubmitting(true);
    setStatusToast(null);
    const elapsedSeconds = Math.max(15, Math.round((Date.now() - startTimeMs) / 1000));

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          files,
          checkedTasks,
          durationSeconds: elapsedSeconds,
          timeSpentSeconds: elapsedSeconds,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to evaluate project submission");
      }

      const sub = data.submission || {
        ...(data.evaluation || {}),
        sessionId: data.sessionId,
        reportUrl: data.reportUrl || `/assessment-report/${data.sessionId}`,
        attemptNumber: data.attemptNumber,
        xpAwarded: data.xpAwarded,
        submittedAt: new Date().toISOString(),
      };

      // Update Test Cases table with actual evaluated test results
      if (Array.isArray(sub.testResults)) {
        setTestSuiteResults({
          testResults: sub.testResults,
          passedTests: sub.passedTests || 0,
          totalTests: sub.totalTests || sub.testResults.length,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      // Update local userState
      setUserState((prev) => ({
        ...prev,
        status: sub.passed ? "passed" : prev.passed ? "passed" : "needs_improvement",
        passed: Boolean(prev.passed || sub.passed),
        badgeAwarded: Boolean(prev.badgeAwarded || (sub.passed && sub.badgeAwarded)),
        attemptsCount: sub.attemptNumber || (prev.attemptsCount || 0) + 1,
        bestScore: Math.max(prev.bestScore || 0, sub.marksObtained || 0),
        bestGrade: sub.passed ? sub.grade : prev.bestGrade || sub.grade,
        latestReportSessionId: sub.sessionId,
      }));

      // Save report summary to localStorage for immediate Homepage availability
      try {
        if (currentUserId) {
          const reportsKey = `mz_${currentUserId}_assessment_reports`;
          const existingReports = JSON.parse(localStorage.getItem(reportsKey) || "[]");
          const reportEntry = {
            id: sub.sessionId,
            sessionId: sub.sessionId,
            projectId: projectSpec?.id,
            subjectKey: "coding",
            type: "project_assessment",
            typeLabel: "Project Assessment",
            assessmentTitle: `${projectSpec?.title} — Project Evaluation`,
            questionTitle: projectSpec?.title,
            difficulty: projectSpec?.difficulty || "Intermediate",
            category: projectSpec?.category || "Project Assessment",
            submittedAt: sub.submittedAt || new Date().toISOString(),
            score: sub.marksObtained || 0,
            marksObtained: sub.marksObtained || 0,
            totalMarks: sub.totalMarks || 100,
            percentage: sub.percentage || 0,
            passingMarks: sub.passingMarks || projectSpec?.passingMarks || 80,
            grade: sub.grade || "F",
            passedTests: sub.passedTests || 0,
            totalTests: sub.totalTests || 6,
            durationSeconds: elapsedSeconds,
            language: projectSpec?.starterLanguage || "javascript",
            passed: Boolean(sub.passed),
            badgeAwarded: Boolean(sub.passed && sub.badgeAwarded),
            reportUrl: `/assessment-report/${sub.sessionId}`,
          };
          const filtered = existingReports.filter((r) => r.sessionId !== sub.sessionId);
          localStorage.setItem(
            reportsKey,
            JSON.stringify([reportEntry, ...filtered].slice(0, 50))
          );
        }
      } catch {}

      // Open Post-Submission Result Screen with "View Official Report" option
      setSubmissionResultModal(sub);

      if (sub.passed) {
        try {
          const pId = projectSpec?.id || projectId;
          sessionStorage.setItem(`mz_proj_submitted_${pId}`, "true");
          if (currentUserId) {
            sessionStorage.setItem(`mz_${currentUserId}_proj_submitted_${pId}`, "true");
            localStorage.setItem(`mz_${currentUserId}_proj_passed_${pId}`, "true");
          }
          window.dispatchEvent(new CustomEvent("mz_project_passed", { detail: { projectId: pId } }));
        } catch {}
      }

      if (onProjectStateUpdated) onProjectStateUpdated();
    } catch (err) {
      setStatusToast({ type: "error", text: `Submission failed: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build Requirements list for Left Column
  const requirementsList = useMemo(() => {
    const funcReqs = projectSpec?.functionalRequirements || [];
    if (funcReqs.length > 0) {
      return funcReqs.map((r) => r.title);
    }
    const milestones = projectSpec?.milestones || [];
    if (milestones.length > 0) {
      return milestones.map((m) => m.title);
    }
    return ["Responsive layout", "Include projects section", "Add contact form"];
  }, [projectSpec]);

  const diffLower = String(
    projectSpec?.difficulty || projectSpec?.level || "Beginner"
  ).toLowerCase();

  const statusNormalized = String(userState?.status || "in_progress").toLowerCase();
  const isAlreadyCompleted = Boolean(userState?.passed && userState?.badgeAwarded);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (window.opener) {
      window.close();
    } else {
      navigate("/coding?tab=projects", { replace: true });
    }
  };

  return (
    <div className="mz-pw-overlay" data-testid="project-workspace-modal">
      <div className="mz-pw-container">
        {/* =================================================================
            1. TOP PURPLE-INDIGO PROJECT HERO BANNER (Matches Reference Image)
            ================================================================= */}
        <header className="mz-pw-hero-banner" data-testid="pw-hero-banner">
          <div className="mz-pw-hero-left">
            <button
              type="button"
              className="mz-pw-back-btn"
              onClick={handleClose}
              data-testid="pw-back-btn"
            >
              <FiArrowLeft size={16} />
              <span>Back to Platform</span>
            </button>

            <div className="mz-pw-hero-icon-box" aria-hidden="true">
              <FiCode size={25} strokeWidth={2.5} />
            </div>

            <div className="mz-pw-hero-title-group">
              <div className="mz-pw-hero-title-row">
                <h1 className="mz-pw-hero-title">{projectSpec?.title}</h1>

                <span
                  className={`mz-pw-hero-pill ${
                    diffLower === "beginner"
                      ? "diff-beginner"
                      : diffLower === "advanced"
                      ? "diff-advanced"
                      : "diff-intermediate"
                  }`}
                >
                  {projectSpec?.difficulty || projectSpec?.level || "Beginner"}
                </span>

                {isAlreadyCompleted ? (
                  <span
                    className="mz-pw-hero-pill status-completed"
                    data-testid="pw-completed-badge"
                  >
                    <FiCheck size={13} strokeWidth={3} /> Completed
                  </span>
                ) : statusNormalized === "needs_improvement" ? (
                  <span
                    className="mz-pw-hero-pill status-needs-improvement"
                    data-testid="pw-status-pill"
                  >
                    Needs Improvement
                  </span>
                ) : (
                  <span
                    className="mz-pw-hero-pill status-in-progress"
                    data-testid="pw-status-pill"
                  >
                    In Progress
                  </span>
                )}
              </div>

              <div className="mz-pw-hero-subtitle">
                <span>
                  Language: <strong>{formatLanguageDisplay(projectSpec?.starterLanguage)}</strong>
                </span>
                <span>|</span>
                <span>
                  Total Marks: <strong>{projectSpec?.totalMarks || 100}</strong>
                </span>
                <span>|</span>
                <span>
                  Passing Cutoff: <strong>{projectSpec?.passingMarks || 80}%</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="mz-pw-hero-right">
            <div className="mz-pw-timer-pill" data-testid="pw-countdown-timer">
              <div className="mz-pw-timer-icon">
                <FiClock size={16} />
              </div>
              <div className="mz-pw-timer-text">
                <span className="mz-pw-timer-lbl">Time Left</span>
                <span className="mz-pw-timer-val">{formatCountdown(timeLeftSeconds)}</span>
              </div>
            </div>

            <button
              type="button"
              className="mz-pw-submit-hero-btn"
              onClick={handleSubmitProject}
              disabled={isSubmitting}
              data-testid="pw-submit-project-btn"
            >
              <FiSend size={15} />
              <span>{isSubmitting ? "Evaluating..." : "Submit Project"}</span>
            </button>
          </div>
        </header>

        {/* =================================================================
            2. SECONDARY WORKSPACE NAVIGATION BAR
            (Strictly NO Evaluation or Report tabs during active assessment)
            ================================================================= */}
        <nav className="mz-pw-nav-tabs-bar" aria-label="Project Workspace Sections">
          <div className="mz-pw-nav-tabs-left">
            <button
              type="button"
              className={`mz-pw-nav-tab ${topNavTab === "overview" ? "active" : ""}`}
              onClick={() => setTopNavTab("overview")}
              data-testid="pw-nav-overview"
            >
              <FiGrid size={15} />
              <span>Overview</span>
            </button>

            <button
              type="button"
              className={`mz-pw-nav-tab ${topNavTab === "problem" ? "active" : ""}`}
              onClick={() => setTopNavTab("problem")}
              data-testid="pw-nav-problem"
            >
              <FiCheckSquare size={15} />
              <span>Problem Statement</span>
            </button>

            <button
              type="button"
              className={`mz-pw-nav-tab ${topNavTab === "editor" ? "active" : ""}`}
              onClick={() => {
                setTopNavTab("editor");
                editorSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }}
              data-testid="pw-nav-editor"
            >
              <FiEdit3 size={15} />
              <span>Code Editor</span>
            </button>

            <button
              type="button"
              className={`mz-pw-nav-tab ${topNavTab === "testcases" ? "active" : ""}`}
              onClick={() => {
                setTopNavTab("testcases");
                setBottomTab("testcases");
                bottomPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }}
              data-testid="pw-nav-testcases"
            >
              <FiCode size={15} />
              <span>Test Cases</span>
            </button>
          </div>

          {statusToast && (
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                padding: "5px 12px",
                borderRadius: 8,
                background: statusToast.type === "error" ? "#fee2e2" : "#dcfce7",
                color: statusToast.type === "error" ? "#b91c1c" : "#15803d",
              }}
              data-testid="pw-status-toast"
            >
              {statusToast.text}
            </div>
          )}
        </nav>

        {/* =================================================================
            3. THREE-COLUMN WORKSPACE GRID (Matches Reference Image)
            ================================================================= */}
        <div className="mz-pw-main-grid">
          {/* LEFT COLUMN: PROJECT DETAILS CARD */}
          <aside className="mz-pw-details-card" data-testid="pw-details-card">
            <div className="mz-pw-details-top">
              <div className="mz-pw-details-header">
                <div className="mz-pw-details-icon">
                  <FiFileText size={17} />
                </div>
                <h2 className="mz-pw-details-title">Project Details</h2>
              </div>

              {/* Description Section */}
              <div className="mz-pw-detail-block">
                <h3 className="mz-pw-detail-heading">Description</h3>
                <p className="mz-pw-detail-desc">
                  {projectSpec?.description || projectSpec?.problemStatement}
                </p>

                {topNavTab === "overview" && projectSpec?.problemStatement && (
                  <p
                    className="mz-pw-detail-desc"
                    style={{ marginTop: 8, fontSize: 12.8, color: "#475569" }}
                  >
                    {projectSpec.problemStatement}
                  </p>
                )}

                {topNavTab === "overview" && projectSpec?.ioSpecification?.inputFormat && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      color: "#334155",
                    }}
                  >
                    <div>
                      <strong>Input:</strong> {projectSpec.ioSpecification.inputFormat}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <strong>Output:</strong> {projectSpec.ioSpecification.outputFormat}
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements Section with Green Checkmarks */}
              <div className="mz-pw-detail-block">
                <h3 className="mz-pw-detail-heading">Requirements</h3>
                <ul className="mz-pw-req-list" data-testid="pw-requirements-list">
                  {requirementsList.map((reqTitle, idx) => (
                    <li key={idx} className="mz-pw-req-item">
                      <FiCheck size={16} strokeWidth={3} className="mz-pw-req-check" />
                      <span>{reqTitle}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technologies Section */}
              <div className="mz-pw-detail-block">
                <h3 className="mz-pw-detail-heading">Technologies</h3>
                <div className="mz-pw-tech-pills" data-testid="pw-technologies-list">
                  {(projectSpec?.technologies || [projectSpec?.starterLanguage || "JavaScript"]).map(
                    (tech, idx) => (
                      <span key={idx} className="mz-pw-tech-tag">
                        {tech}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Pro Tip Card */}
            <div className="mz-pw-protip-card" data-testid="pw-protip-card">
              <div className="mz-pw-protip-bulb" aria-hidden="true">
                💡
              </div>
              <div>
                <h4 className="mz-pw-protip-title">Pro Tip</h4>
                <p className="mz-pw-protip-text">{getProjectProTip(projectSpec)}</p>
              </div>
            </div>
          </aside>

          {/* CENTER COLUMN: YOUR SOLUTION EDITOR + TEST CASES / CONSOLE / OUTPUT */}
          <div className="mz-pw-center-col">
            {/* TOP CARD: YOUR SOLUTION */}
            <section
              ref={editorSectionRef}
              className={`mz-pw-solution-card ${isFullscreen ? "is-fullscreen" : ""}`}
              data-testid="pw-solution-card"
            >
              <div className="mz-pw-solution-header">
                <div className="mz-pw-solution-title-group">
                  <div className="mz-pw-solution-icon">
                    <FiCode size={16} />
                  </div>
                  <h3 className="mz-pw-solution-title">Your Solution</h3>
                  <span
                    className={`mz-pw-autosave-pill ${isSaving ? "saving" : ""}`}
                    data-testid="pw-autosave-indicator"
                  >
                    {isSaving ? "Saving..." : `Auto Saved • ${secondsSinceSave}s ago`}
                  </span>
                </div>

                <div className="mz-pw-solution-actions">
                  <button
                    type="button"
                    className="mz-pw-tool-btn"
                    onClick={handleCopyCode}
                    data-testid="pw-copy-code-btn"
                  >
                    {copiedCode ? <FiCheck size={14} color="#10b981" /> : <FiCopy size={14} />}
                    <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>

                  <button
                    type="button"
                    className="mz-pw-tool-btn"
                    onClick={() => setIsFullscreen((prev) => !prev)}
                    data-testid="pw-fullscreen-btn"
                  >
                    {isFullscreen ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
                    <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                  </button>

                  <button
                    type="button"
                    className="mz-pw-tool-btn"
                    onClick={handleDownloadCode}
                    data-testid="pw-download-btn"
                  >
                    <FiDownload size={14} />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    className="mz-pw-tool-btn"
                    onClick={handleResetStarter}
                    title="Reset workspace files to starter template"
                    data-testid="pw-reset-starter-btn"
                  >
                    <FiRotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Dark macOS Code Editor Window */}
              <div className="mz-pw-macos-editor">
                <div className="mz-pw-macos-topbar">
                  <div className="mz-pw-macos-dots" aria-hidden="true">
                    <span className="mz-pw-dot red" />
                    <span className="mz-pw-dot yellow" />
                    <span className="mz-pw-dot green" />
                  </div>

                  {/* Multi-File Tabs */}
                  <div className="mz-pw-editor-file-tabs" role="tablist">
                    {files.map((file, idx) => (
                      <button
                        key={file.id || file.name}
                        type="button"
                        role="tab"
                        aria-selected={idx === activeFileIdx}
                        className={`mz-pw-editor-file-tab ${idx === activeFileIdx ? "active" : ""}`}
                        onClick={() => setActiveFileIdx(idx)}
                        data-testid={`pw-file-tab-${file.name}`}
                      >
                        <FiFileText size={12} />
                        <span>{file.name}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="mz-pw-editor-file-tab"
                      onClick={handleAddFile}
                      title="Add new file to workspace"
                      data-testid="pw-add-file-btn"
                    >
                      <FiPlus size={12} />
                      <span>File</span>
                    </button>
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      flexShrink: 0,
                    }}
                  >
                    {getEditorLanguage(activeFile.name, projectSpec?.starterLanguage)}
                  </span>
                </div>

                <div className="mz-pw-monaco-box">
                  {isLoadingWorkspace ? (
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        fontSize: 13.5,
                        fontWeight: 600,
                      }}
                    >
                      Loading project workspace...
                    </div>
                  ) : (
                    <Editor
                      height="100%"
                      language={getEditorLanguage(activeFile.name, projectSpec?.starterLanguage)}
                      theme="vs-dark"
                      value={activeFile.content}
                      onChange={handleCodeChange}
                      options={{
                        fontSize: 13.5,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: "on",
                        lineNumbers: "on",
                        padding: { top: 14, bottom: 14 },
                      }}
                    />
                  )}
                </div>
              </div>
            </section>

            {/* BOTTOM CARD: TEST CASES | CONSOLE | OUTPUT */}
            <section
              ref={bottomPanelRef}
              className="mz-pw-exec-card"
              data-testid="pw-exec-card"
            >
              <div className="mz-pw-exec-tabs-header">
                <div className="mz-pw-exec-tabs-list">
                  <button
                    type="button"
                    className={`mz-pw-exec-tab ${bottomTab === "testcases" ? "active" : ""}`}
                    onClick={() => setBottomTab("testcases")}
                    data-testid="pw-tab-testcases"
                  >
                    <span>Test Cases</span>
                    {testSuiteResults && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background:
                            testSuiteResults.passedTests === testSuiteResults.totalTests
                              ? "#dcfce7"
                              : "#fef3c7",
                          color:
                            testSuiteResults.passedTests === testSuiteResults.totalTests
                              ? "#15803d"
                              : "#b45309",
                        }}
                      >
                        {testSuiteResults.passedTests}/{testSuiteResults.totalTests}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`mz-pw-exec-tab ${bottomTab === "console" ? "active" : ""}`}
                    onClick={() => setBottomTab("console")}
                    data-testid="pw-tab-console"
                  >
                    <span>Console</span>
                  </button>

                  <button
                    type="button"
                    className={`mz-pw-exec-tab ${bottomTab === "output" ? "active" : ""}`}
                    onClick={() => setBottomTab("output")}
                    data-testid="pw-tab-output"
                  >
                    <span>Output</span>
                    {isRunningProject && (
                      <span style={{ fontSize: 11, color: "#2563eb" }}>• Running</span>
                    )}
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    className="mz-pw-tool-btn"
                    onClick={handleRunTests}
                    disabled={isRunningTests}
                    style={{ padding: "5px 11px", fontSize: 12 }}
                    data-testid="pw-run-tests-btn"
                  >
                    <FiPlay size={12} color="#2563eb" />
                    <span>{isRunningTests ? "Running Tests..." : "Run Tests"}</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: TEST CASES TABLE */}
              {bottomTab === "testcases" && (
                <div className="mz-pw-tc-table-wrap">
                  <table className="mz-pw-tc-table" data-testid="pw-testcases-table">
                    <thead>
                      <tr>
                        <th style={{ width: 48 }}>#</th>
                        <th>Input</th>
                        <th>Expected Output</th>
                        <th>Actual Output</th>
                        <th style={{ width: 110 }}>Status</th>
                        <th style={{ width: 80 }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testSuiteResults && Array.isArray(testSuiteResults.testResults) && testSuiteResults.testResults.length > 0 ? (
                        testSuiteResults.testResults.map((tc, idx) => (
                          <tr
                            key={idx}
                            data-testid={`pw-testcase-row-${idx + 1}`}
                            style={{
                              background: tc.passed
                                ? "rgba(240, 253, 244, 0.55)"
                                : "rgba(254, 242, 242, 0.55)",
                            }}
                          >
                            <td style={{ fontWeight: 800, color: "#0f172a" }}>
                              {tc.testIndex || idx + 1}
                            </td>
                            <td>
                              <code className="mz-pw-tc-code" title={tc.input}>
                                {tc.isHidden ? "Hidden Edge Case" : tc.input}
                              </code>
                            </td>
                            <td>
                              <code className="mz-pw-tc-code" title={tc.expectedOutput}>
                                {tc.isHidden ? "Hidden Spec" : tc.expectedOutput}
                              </code>
                            </td>
                            <td>
                              <code
                                className="mz-pw-tc-code"
                                title={tc.actualOutput || tc.error || ""}
                                style={{
                                  color: tc.passed ? "#15803d" : "#b91c1c",
                                  borderColor: tc.passed ? "#bbf7d0" : "#fecaca",
                                }}
                              >
                                {tc.actualOutput || tc.error || "(empty)"}
                              </code>
                            </td>
                            <td>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "3px 9px",
                                  borderRadius: 999,
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  background: tc.passed ? "#dcfce7" : "#fee2e2",
                                  color: tc.passed ? "#15803d" : "#b91c1c",
                                }}
                              >
                                {tc.passed ? "✓ Passed" : "✗ Failed"}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600, color: "#64748b", fontSize: 12 }}>
                              {tc.durationMs || 1}ms
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ borderBottom: "none", padding: 0 }}>
                            <div
                              className="mz-pw-tc-empty-state"
                              data-testid="pw-testcases-empty"
                            >
                              {/* Laptop with </> and Green Check Illustration matching blueprint */}
                              <svg
                                width="74"
                                height="56"
                                viewBox="0 0 74 56"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <rect
                                  x="10"
                                  y="6"
                                  width="48"
                                  height="32"
                                  rx="5"
                                  fill="#DBEAFE"
                                  stroke="#60A5FA"
                                  strokeWidth="2"
                                />
                                <rect x="14" y="10" width="40" height="24" rx="2" fill="#EFF6FF" />
                                <path
                                  d="M29 18L24 22L29 26"
                                  stroke="#2563EB"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M39 18L44 22L39 26"
                                  stroke="#2563EB"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M35.5 16.5L32.5 27.5"
                                  stroke="#3B82F6"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M4 39H64L60 44H8L4 39Z"
                                  fill="#93C5FD"
                                />
                                <circle cx="56" cy="39" r="11" fill="#10B981" />
                                <path
                                  d="M51.5 39L54.5 42L61 35.5"
                                  stroke="white"
                                  strokeWidth="2.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span>Run the project to view test cases</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: CONSOLE (Interactive stdin + stdout/stderr diagnostics) */}
              {bottomTab === "console" && (
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: "#334155" }}>
                      Standard Input (stdin) Payload
                    </span>
                    <button
                      type="button"
                      className="mz-pw-tool-btn"
                      onClick={() => executeLiveSandbox(files, customInput, false)}
                      disabled={isRunningProject}
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      data-testid="pw-console-execute-btn"
                    >
                      <FiTerminal size={12} />
                      <span>{isRunningProject ? "Executing..." : "Execute Console"}</span>
                    </button>
                  </div>

                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    rows={3}
                    placeholder="Enter JSON input payload for stdin..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                    }}
                    data-testid="pw-console-stdin"
                  />

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                      Console Stream (stdout / stderr):
                    </div>
                    <pre className="mz-pw-code-pre" data-testid="pw-console-stdout">
                      {liveOutputData
                        ? liveOutputData.error
                          ? `${liveOutputData.output ? liveOutputData.output + "\n" : ""}[Error]: ${liveOutputData.error}`
                          : liveOutputData.output || "(Process exited with code 0 — no stdout output)"
                        : "Modify code or click 'Run Project' to stream real-time console output."}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE EXECUTION OUTPUT */}
              {bottomTab === "output" && (
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: liveOutputData
                          ? liveOutputData.ok
                            ? "#15803d"
                            : "#b91c1c"
                          : "#475569",
                      }}
                    >
                      {liveOutputData
                        ? liveOutputData.ok
                          ? `✓ Live Output Verified (${liveOutputData.durationMs}ms)`
                          : "✗ Runtime / Syntax Error Detected"
                        : "Real-Time Sandbox Output"}
                    </span>
                    {liveOutputData?.timestamp && (
                      <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>
                        Updated at {liveOutputData.timestamp}
                      </span>
                    )}
                  </div>

                  <pre className="mz-pw-code-pre" data-testid="pw-live-output-pre">
                    {liveOutputData
                      ? liveOutputData.output || liveOutputData.error || "(Empty output)"
                      : "Write code or click 'Run Project' to see live execution output."}
                  </pre>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: READY TO BUILD? CARD */}
          <aside className="mz-pw-ready-card" data-testid="pw-ready-card">
            <div className="mz-pw-ready-top">
              <div className="mz-pw-rocket-wrap" aria-hidden="true">
                {/* 3D-style Rocket SVG matching reference image */}
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 96 96"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M32 68C26 74 22 82 22 82C22 82 30 78 36 72L32 68Z"
                    fill="#F59E0B"
                  />
                  <path
                    d="M30 66C22 74 16 86 16 86C16 86 28 80 36 72C39 69 33 63 30 66Z"
                    fill="url(#flameGrad)"
                  />
                  <path
                    d="M28 50L16 54L24 64L34 58L28 50Z"
                    fill="#6366F1"
                  />
                  <path
                    d="M54 76L50 88L40 80L46 70L54 76Z"
                    fill="#6366F1"
                  />
                  <path
                    d="M68 28C78 18 82 14 82 14C82 14 78 18 68 28Z"
                    fill="#E0E7FF"
                  />
                  <path
                    d="M78 18C62 18 44 28 32 46L50 64C68 52 78 34 78 18Z"
                    fill="url(#bodyGrad)"
                  />
                  <circle cx="56" cy="40" r="8" fill="#1E1B4B" stroke="#C7D2FE" strokeWidth="3" />
                  <circle cx="54" cy="38" r="2.5" fill="#93C5FD" />
                  <defs>
                    <linearGradient id="bodyGrad" x1="78" y1="18" x2="32" y2="64" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFFFFF" />
                      <stop offset="0.6" stopColor="#E0E7FF" />
                      <stop offset="1" stopColor="#A5B4FC" />
                    </linearGradient>
                    <linearGradient id="flameGrad" x1="36" y1="66" x2="16" y2="86" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FDE047" />
                      <stop offset="0.5" stopColor="#F97316" />
                      <stop offset="1" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <h3 className="mz-pw-ready-title">Ready to Build?</h3>
              <p className="mz-pw-ready-sub">
                Write your code, run the project and submit when you&apos;re ready.
              </p>
            </div>

            <div className="mz-pw-ready-actions">
              <button
                type="button"
                className="mz-pw-run-project-btn"
                onClick={handleRunProject}
                disabled={isRunningProject || isRunningTests || isSubmitting}
                data-testid="pw-run-project-btn"
              >
                <FiSend size={16} />
                <span>
                  {isRunningProject || isRunningTests ? "Running Project..." : "Run Project"}
                </span>
              </button>

              <button
                type="button"
                className="mz-pw-run-tests-secondary-btn"
                onClick={handleRunTests}
                disabled={isRunningTests || isSubmitting}
                data-testid="pw-run-tests-side-btn"
              >
                <FiPlay size={14} />
                <span>{isRunningTests ? "Running Tests..." : "Run Tests"}</span>
              </button>

              <button
                type="button"
                className="mz-pw-run-tests-secondary-btn"
                onClick={handleLoadReferenceSolution}
                title="Load verified multi-file reference implementation"
                data-testid="pw-load-solution-btn"
                style={{ fontSize: 12, padding: "8px 12px", opacity: 0.92 }}
              >
                <FiZap size={13} />
                <span>Load Reference Solution</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* =====================================================================
          4. POST-SUBMISSION RESULT SCREEN MODAL (Shown ONLY after Submit)
          ===================================================================== */}
      {submissionResultModal && (
        <div
          className="mz-pw-result-modal-backdrop"
          data-testid="pw-submission-result-modal"
        >
          <div className="mz-pw-result-modal">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                paddingBottom: 14,
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 13px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    background: submissionResultModal.passed ? "#dcfce7" : "#fef3c7",
                    color: submissionResultModal.passed ? "#15803d" : "#b45309",
                    marginBottom: 8,
                  }}
                  data-testid="pw-modal-status-badge"
                >
                  {submissionResultModal.passed ? (
                    <>
                      <FiCheck size={14} strokeWidth={3} /> PROJECT COMPLETED
                    </>
                  ) : (
                    <>
                      <FiAlertTriangle size={14} /> NEEDS IMPROVEMENT (BELOW CUTOFF)
                    </>
                  )}
                </span>
                <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: "#0f172a" }}>
                  {projectSpec?.title}
                </h2>
              </div>

              <div
                style={{
                  textAlign: "right",
                  padding: "10px 16px",
                  borderRadius: 14,
                  background: submissionResultModal.passed ? "#f0fdf4" : "#fffbeb",
                  border: `1px solid ${submissionResultModal.passed ? "#86efac" : "#fde68a"}`,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Final Score
                </div>
                <div
                  style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}
                  data-testid="pw-modal-score-value"
                >
                  {submissionResultModal.marksObtained} / {submissionResultModal.totalMarks || 100}{" "}
                  <span style={{ fontSize: 15, color: "#4f46e5" }}>
                    (Grade {submissionResultModal.grade})
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
                gap: 10,
              }}
            >
              <div style={{ padding: 12, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Percentage</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {submissionResultModal.percentage}%
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Passing Cutoff</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#1d4ed8", marginTop: 2 }}>
                  {submissionResultModal.passingMarks || projectSpec?.passingMarks || 80}%
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Tests Passed</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {submissionResultModal.passedTests} / {submissionResultModal.totalTests}
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Reward</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#15803d", marginTop: 2 }}>
                  {submissionResultModal.passed ? `+${submissionResultModal.xpAwarded || 0} XP` : "0 XP"}
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "#334155" }}>
              {submissionResultModal.evaluationFeedback?.summary}
            </p>

            {/* Primary Actions: View Official Report or Retry */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {!submissionResultModal.passed && (
                <button
                  type="button"
                  className="mz-pw-tool-btn"
                  onClick={() => setSubmissionResultModal(null)}
                  style={{ padding: "11px 18px", fontSize: 13.5 }}
                  data-testid="pw-retry-project-btn"
                >
                  <FiRotateCcw size={15} />
                  <span>Retry in Workspace</span>
                </button>
              )}

              <button
                type="button"
                className="mz-pw-tool-btn"
                onClick={handleClose}
                style={{ padding: "11px 18px", fontSize: 13.5 }}
              >
                <span>Back to Platform</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/assessment-report/${submissionResultModal.sessionId}`, { replace: true })}
                style={{
                  padding: "11px 22px",
                  borderRadius: 11,
                  border: "none",
                  background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 8px 20px rgba(37, 99, 235, 0.28)",
                }}
                data-testid="pw-view-official-report-btn"
              >
                <FiAward size={16} />
                <span>View Official Report</span>
                <FiExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   PROJECTS HUB SECTION (Rendered inside /coding -> Projects tab)
   ========================================================================= */
export function ProjectsHubSection({ projects = [], onOpenProjectWorkspace }) {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("default");

  const categories = useMemo(() => {
    const set = new Set();
    projects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [projects]);

  const summary = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter((p) => p.userState?.passed && p.userState?.badgeAwarded).length;
    const inProgress = projects.filter(
      (p) =>
        !p.userState?.passed &&
        p.userState?.status &&
        String(p.userState.status).toUpperCase() !== "NOT_STARTED"
    ).length;
    const earnedXp = projects
      .filter((p) => p.userState?.passed && p.userState?.badgeAwarded)
      .reduce((acc, p) => acc + (p.xpReward || 450), 0);
    return { total, completed, inProgress, earnedXp };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          (p.technologies || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "ALL") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (selectedDifficulty !== "ALL") {
      list = list.filter(
        (p) => (p.difficulty || p.level || "").toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    if (selectedStatus !== "ALL") {
      list = list.filter((p) => {
        const st = String(p.userState?.status || "NOT_STARTED").toUpperCase();
        return st === selectedStatus;
      });
    }

    if (sortBy === "difficulty") {
      const rank = { beginner: 1, intermediate: 2, advanced: 3 };
      list.sort(
        (a, b) =>
          (rank[(a.difficulty || a.level || "").toLowerCase()] || 2) -
          (rank[(b.difficulty || b.level || "").toLowerCase()] || 2)
      );
    } else if (sortBy === "progress") {
      list.sort(
        (a, b) =>
          (b.userState?.progressPct || b.userState?.progressPercent || 0) -
          (a.userState?.progressPct || a.userState?.progressPercent || 0)
      );
    } else if (sortBy === "score") {
      list.sort((a, b) => (b.userState?.bestScore || 0) - (a.userState?.bestScore || 0));
    }

    return list;
  }, [projects, searchQuery, selectedCategory, selectedDifficulty, selectedStatus, sortBy]);

  return (
    <div className="mz-projects-hub" data-testid="mz-projects-hub">
      {/* 1. HERO & SUMMARY METRICS */}
      <div className="mz-projects-hero">
        <div className="mz-projects-hero-left">
          <span className="mz-projects-eyebrow">
            🚀 Real-Time Multi-File Project Development & Evaluation Platform
          </span>
          <h2 className="mz-projects-hero-title">
            Production Engineering & Full-Stack Capstone Projects
          </h2>
          <p className="mz-projects-hero-sub">
            Develop real-world, multi-file software systems inside the dedicated MZ-ASM Project Workspace. Every project features structured engineering tasks, 6 automated sandbox test cases, a deterministic 100-mark grading rubric, permanent assessment reports, and verifiable{" "}
            <strong>PROJECT COMPLETED</strong> credentials.
          </p>
        </div>

        <div className="mz-projects-kpi-row">
          <div className="mz-projects-kpi-card">
            <span className="mz-projects-kpi-val" data-testid="projects-total-count">
              {summary.total}
            </span>
            <span className="mz-projects-kpi-lbl">Total Projects</span>
          </div>
          <div className="mz-projects-kpi-card is-success">
            <span className="mz-projects-kpi-val" data-testid="projects-completed-count">
              {summary.completed}
            </span>
            <span className="mz-projects-kpi-lbl">Completed</span>
          </div>
          <div className="mz-projects-kpi-card">
            <span className="mz-projects-kpi-val">{summary.inProgress}</span>
            <span className="mz-projects-kpi-lbl">In Progress</span>
          </div>
          <div className="mz-projects-kpi-card">
            <span className="mz-projects-kpi-val">+{summary.earnedXp}</span>
            <span className="mz-projects-kpi-lbl">Project XP</span>
          </div>
        </div>
      </div>

      {/* 2. FILTER, SEARCH & SORT TOOLBAR */}
      <div className="mz-projects-toolbar">
        <div className="mz-projects-toolbar-top">
          <div className="mz-projects-search-wrap">
            <span className="mz-projects-search-icon">🔍</span>
            <input
              type="text"
              className="mz-projects-search-input"
              placeholder="Search projects by title, technology (React, FastAPI, Spring Boot, Python, Java), or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="projects-search-input"
            />
          </div>

          <div className="mz-projects-select-group">
            <select
              className="mz-projects-select"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              aria-label="Filter by Difficulty"
            >
              <option value="ALL">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <select
              className="mz-projects-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="PASSED">Completed (Passed)</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="NEEDS_IMPROVEMENT">Needs Improvement</option>
              <option value="NOT_STARTED">Not Started</option>
            </select>

            <select
              className="mz-projects-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort Projects"
            >
              <option value="default">Sort: Curriculum Order</option>
              <option value="difficulty">Sort: Difficulty Level</option>
              <option value="progress">Sort: Completion Progress</option>
              <option value="score">Sort: Highest Rubric Score</option>
            </select>
          </div>
        </div>

        <div className="mz-projects-category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`mz-projects-cat-pill ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "ALL" ? `All Domains (${projects.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. PROJECTS GRID */}
      <div className="mz-projects-grid">
        {filteredProjects.map((proj) => {
          const st = proj.userState || {};
          const isPassed = Boolean(st.passed && st.badgeAwarded);
          const status = String(st.status || "NOT_STARTED").toUpperCase();
          const progressPct = st.progressPct ?? st.progressPercent ?? 0;
          const diff = (proj.difficulty || proj.level || "Intermediate").toLowerCase();

          return (
            <div
              key={proj.id}
              className={`mz-project-card-v2 ${isPassed ? "is-passed" : ""}`}
              data-testid={`project-card-${proj.id}`}
            >
              <div>
                <div className="mz-project-card-top">
                  <span className="mz-project-cat-tag">{proj.category || proj.track}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className={`mz-project-diff-badge ${diff}`}>
                      {proj.difficulty || proj.level}
                    </span>
                    {isPassed ? (
                      <span
                        className="mz-project-completed-badge"
                        data-testid={`project-badge-${proj.id}`}
                      >
                        ✓ PROJECT COMPLETED
                      </span>
                    ) : status === "NEEDS_IMPROVEMENT" ? (
                      <span className="mz-project-status-pill needs-improvement">
                        Needs Improvement
                      </span>
                    ) : status === "IN_PROGRESS" ? (
                      <span className="mz-project-status-pill in-progress">In Progress</span>
                    ) : (
                      <span className="mz-project-status-pill not-started">Not Started</span>
                    )}
                  </div>
                </div>

                <h3 className="mz-project-card-title">{proj.title}</h3>
                <p className="mz-project-card-desc">{proj.description}</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="mz-project-tech-stack">
                  {(proj.technologies || [proj.starterLanguage]).map((tech, idx) => (
                    <span key={idx} className="mz-project-tech-pill">
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Milestones Preview */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(proj.milestones || []).slice(0, 3).map((m, idx) => (
                    <div
                      key={m.id || idx}
                      style={{
                        fontSize: 12,
                        color: "#334155",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ color: isPassed ? "#16a34a" : "#2563eb", fontWeight: 800 }}>
                        {isPassed ? "✓" : `0${idx + 1}.`}
                      </span>
                      <span style={{ flex: 1 }}>{m.title}</span>
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                        {m.marksAllocated}m
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="mz-project-progress-wrap">
                  <div className="mz-project-progress-header">
                    <span style={{ color: "#475569" }}>
                      {isPassed
                        ? `Best Score: ${st.bestScore}/100 (Grade ${st.bestGrade})`
                        : st.attemptsCount > 0
                        ? `Last Score: ${st.lastScore ?? st.bestScore}/100 (${st.attemptsCount} attempt${
                            st.attemptsCount > 1 ? "s" : ""
                          })`
                        : `${(proj.files || []).length} Multi-File Modules • ${
                            proj.totalTestCases || 6
                          } Test Cases`}
                    </span>
                    <span style={{ color: isPassed ? "#15803d" : "#1d4ed8" }}>{progressPct}%</span>
                  </div>
                  <div className="mz-project-progress-bar">
                    <div
                      className={`mz-project-progress-fill ${
                        isPassed ? "is-passed" : status === "NEEDS_IMPROVEMENT" ? "is-failed" : ""
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="mz-project-meta-strip">
                  <span>⏱ {proj.estimatedTime || "5 Hours"}</span>
                  <span>⚖️ 100 Marks (Pass: {proj.passingMarks || 80}%)</span>
                  <span style={{ color: "#1d4ed8", fontWeight: 800 }}>+{proj.xpReward || 450} XP</span>
                </div>

                <div className="mz-project-card-actions">
                  <button
                    type="button"
                    className="mz-project-btn-primary"
                    onClick={() => onOpenProjectWorkspace(proj)}
                    data-testid={`open-project-workspace-${proj.id}`}
                  >
                    {isPassed
                      ? "🔧 Open Project Workspace"
                      : status === "IN_PROGRESS" || status === "NEEDS_IMPROVEMENT"
                      ? "▶ Continue Project Workspace"
                      : "🚀 Start Project Workspace"}
                  </button>

                  {st.latestReportSessionId && (
                    <button
                      type="button"
                      className="mz-project-btn-secondary"
                      onClick={() => navigate(`/assessment-report/${st.latestReportSessionId}`)}
                      data-testid={`view-project-report-${proj.id}`}
                    >
                      📄 Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectWorkspaceModal;
