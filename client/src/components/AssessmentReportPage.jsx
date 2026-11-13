import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  FiShield as ShieldCheck,
  FiAward as Award,
  FiClock as Clock,
  FiCheckCircle as CheckCircle2,
  FiXCircle as XCircle,
  FiAlertTriangle as AlertTriangle,
  FiCopy as Copy,
  FiCheck as Check,
  FiDownload as Download,
  FiHome as Home,
  FiCode as Code2,
  FiTerminal as Terminal,
  FiCpu as Cpu,
  FiUser as User,
  FiMail as Mail,
  FiCalendar as Calendar,
  FiFileText as FileCode,
  FiZap as Sparkles,
  FiLock as Lock,
  FiRefreshCw as RefreshCw,
  FiChevronRight as ChevronRight,
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
  FiLayers as Layers,
  FiTarget as Target,
  FiActivity as Activity,
  FiList as ListChecks,
  FiHelpCircle as HelpCircle,
  FiMinusCircle as MinusCircle,
  FiMaximize2 as Maximize2,
  FiMinimize2 as Minimize2,
  FiSearch as Search,
  FiBarChart2 as BarChart3,
  FiCheckSquare as BadgeCheck,
  FiFile as FileCheck2,
  FiX as X,
  FiShare2 as Share2,
  FiExternalLink as ExternalLink,
} from "react-icons/fi";
import "./AssessmentReportPage.css";
import MasteryZoneGlobalLoader from "./MasteryZoneGlobalLoader";
import EvaluatingResultsLoader from "./EvaluatingResultsLoader";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "./ThemeToggle";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

// Helper to detect empty or comment-only code on client side
function isClientCodeEmpty(code) {
  if (!code || typeof code !== "string") return true;
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/#.*$/gm, "")
    .replace(/\s+/g, "");
  return stripped.length === 0;
}

// Golden Laurel Wreath + Star Emblem SVG (matching the reference image sidebar card)
function GoldenLaurelEmblem({ variant = "pass" }) {
  const mainColor = variant === "pass" ? "#F59E0B" : variant === "partial" ? "#3B82F6" : "#EF4444";
  const subColor = variant === "pass" ? "#FDE68A" : variant === "partial" ? "#BFDBFE" : "#FECACA";
  return (
    <svg width="86" height="66" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="44" r="26" fill={subColor} fillOpacity="0.45" />
      <circle cx="60" cy="44" r="20" fill={mainColor} fillOpacity="0.18" stroke={mainColor} strokeWidth="1.5" />
      {/* Center Star */}
      <path
        d="M60 29L64.1 37.6L73.5 38.9L66.7 45.5L68.3 54.9L60 50.4L51.7 54.9L53.3 45.5L46.5 38.9L55.9 37.6L60 29Z"
        fill={mainColor}
      />
      {/* Left Laurel Branch */}
      <path
        d="M42 72C26 64 19 46 24 26"
        stroke={mainColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="23" cy="34" rx="5" ry="2.6" transform="rotate(-35 23 34)" fill={mainColor} />
      <ellipse cx="22" cy="44" rx="5" ry="2.6" transform="rotate(-15 22 44)" fill={mainColor} />
      <ellipse cx="25" cy="54" rx="5" ry="2.6" transform="rotate(10 25 54)" fill={mainColor} />
      <ellipse cx="32" cy="63" rx="5" ry="2.6" transform="rotate(30 32 63)" fill={mainColor} />
      {/* Right Laurel Branch */}
      <path
        d="M78 72C94 64 101 46 96 26"
        stroke={mainColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="97" cy="34" rx="5" ry="2.6" transform="rotate(35 97 34)" fill={mainColor} />
      <ellipse cx="98" cy="44" rx="5" ry="2.6" transform="rotate(15 98 44)" fill={mainColor} />
      <ellipse cx="95" cy="54" rx="5" ry="2.6" transform="rotate(-10 95 54)" fill={mainColor} />
      <ellipse cx="88" cy="63" rx="5" ry="2.6" transform="rotate(-30 88 63)" fill={mainColor} />
      {/* Bottom Ribbon Tie */}
      <path d="M50 73C56 70 64 70 70 73" stroke={mainColor} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function AssessmentReportPage() {
  const { isDark } = useTheme();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Instant 0ms load if report was passed directly via navigation state
  const initialPassedReport = location.state?.report || location.state?.reportData || null;
  const [report, setReport] = useState(initialPassedReport);
  const [loading, setLoading] = useState(!initialPassedReport);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis"); // 'analysis' | 'code_execution' | 'audit' | 'insights'
  const [copiedId, setCopiedId] = useState(false);
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState(null);

  // Question Navigator & Filter states
  const [questionFilter, setQuestionFilter] = useState("all"); // 'all' | 'passed' | 'failed' | 'partial' | 'unanswered'
  const [questionSearch, setQuestionSearch] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [expandedQuestions, setExpandedQuestions] = useState({ 0: true, 1: true });
  const [selectedProjectFileIdx, setSelectedProjectFileIdx] = useState({});
  const [expandedTestRows, setExpandedTestRows] = useState({});

  // Fullscreen Code Modal state
  const [fullscreenCodeModal, setFullscreenCodeModal] = useState(null); // { title, code, language, filename }

  // Smooth animated counter progress (0 -> 1 on load)
  const [animFactor, setAnimFactor] = useState(initialPassedReport ? 1 : 0);

  useEffect(() => {
    fetchImmutableReport();
  }, [sessionId]);

  // Security guard against back navigation/gesture swiping into completed assessment
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      navigate("/coding", { replace: true });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  useEffect(() => {
    if (!report) return;
    let frameId;
    const start = Date.now();
    const duration = 650;
    const step = () => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimFactor(eased);
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [report]);

  // Close fullscreen code modal on ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && fullscreenCodeModal) {
        setFullscreenCodeModal(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreenCodeModal]);

// Format locally persisted report record into standard rich report schema
function formatLocalReport(matched, uObj, rawId) {
  if (!matched) return null;
  const isMcq = Boolean(
    matched.type === "mcq_exam" ||
    (Array.isArray(matched.reviewBreakdown) && matched.reviewBreakdown.length > 0) ||
    String(rawId).startsWith("attempt_") ||
    String(matched.sessionId).startsWith("attempt_")
  );
  const isProject = Boolean(
    matched.type === "project_assessment" ||
    matched.projectId ||
    String(rawId).startsWith("proj_") ||
    String(matched.sessionId).startsWith("proj_")
  );

  const totalQuestions = matched.totalQuestions || (Array.isArray(matched.reviewBreakdown) ? matched.reviewBreakdown.length : (matched.questions?.length || 1));
  const questionsAttempted = matched.questionsAttempted !== undefined ? matched.questionsAttempted : totalQuestions;
  const questionsUnanswered = matched.questionsUnanswered !== undefined ? matched.questionsUnanswered : Math.max(0, totalQuestions - questionsAttempted);
  const totalMarks = matched.totalMarks || (isMcq ? totalQuestions : 100);
  const marksObtained = matched.marksObtained !== undefined ? matched.marksObtained : (matched.score || 0);
  const overallPercentage = matched.percentage !== undefined ? matched.percentage : (totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0);
  const accuracy = matched.accuracy !== undefined ? matched.accuracy : overallPercentage;
  const durationSeconds = matched.durationSeconds || matched.timeSpentSeconds || 60;
  const grade = matched.grade || (overallPercentage >= 90 ? "A+" : overallPercentage >= 80 ? "A" : overallPercentage >= 70 ? "B" : overallPercentage >= 60 ? "C" : "F");
  const passed = matched.passed !== undefined ? Boolean(matched.passed) : overallPercentage >= 80;

  const candidateFullName = matched.candidateDetails?.fullName || uObj?.fullName || uObj?.username || uObj?.name || "Verified Candidate";
  const candidateEmail = matched.candidateDetails?.email || uObj?.email || "candidate@masteryzone.com";
  const candidateId = matched.candidateDetails?.candidateId || `CAND-${String(uObj?._id || uObj?.id || rawId).slice(-6).toUpperCase()}`;

  return {
    ...matched,
    sessionId: matched.sessionId || rawId,
    attemptId: matched.attemptId || matched.sessionId || rawId,
    assessmentTitle: matched.assessmentTitle || matched.questionTitle || (isMcq ? "Accreditation MCQ Examination" : isProject ? "Project Assessment" : "Coding Assessment"),
    isMcq,
    isProjectReport: isProject,
    subjectKey: matched.subjectKey || "coding",
    trackId: matched.trackId,
    moduleIndex: matched.moduleIndex,
    candidateDetails: {
      fullName: candidateFullName,
      email: candidateEmail,
      candidateId,
      organization: matched.candidateDetails?.organization || "Mastery Zone Academic Accreditation",
    },
    scorecard: {
      totalQuestions,
      questionsAttempted,
      questionsUnanswered,
      totalMarks,
      marksObtained,
      overallPercentage,
      accuracy,
      totalTestCases: matched.totalTests || (isMcq ? totalQuestions : 10),
      totalPassedTests: matched.passedTests !== undefined ? matched.passedTests : (isMcq ? marksObtained : 10),
      failedTestCases: Math.max(0, (matched.totalTests || (isMcq ? totalQuestions : 10)) - (matched.passedTests !== undefined ? matched.passedTests : (isMcq ? marksObtained : 10))),
      durationSeconds,
      grade,
      passed,
      violationsCount: matched.violationsCount || 0,
      telemetryAvailable: true,
      integrityStatus: "Verified Flawless",
    },
    questions: matched.questions || (matched.submittedCode ? [
      {
        questionId: matched.questionId || "q_1",
        title: matched.questionTitle || matched.assessmentTitle || "Technical Challenge",
        difficulty: matched.difficulty || "Medium",
        status: passed ? "passed" : "failed",
        score: overallPercentage,
        marksObtained,
        totalMarks,
        passedTests: matched.passedTests || 10,
        totalTests: matched.totalTests || 10,
        language: matched.language || "python",
        submittedCode: matched.submittedCode || "",
        testResults: matched.testResults || [],
      }
    ] : []),
    reviewBreakdown: matched.reviewBreakdown || [],
    performance: {
      score: overallPercentage,
      marksObtained,
      totalMarks,
      grade,
      accuracy,
      passedTests: matched.passedTests || 0,
      totalTests: matched.totalTests || totalQuestions,
      passed,
    },
    proctoringAudit: {
      cameraGranted: true,
      micGranted: true,
      screenShareGranted: true,
      chancesUsed: matched.violationsCount || 0,
      maxChances: 5,
      violationsCount: matched.violationsCount || 0,
      events: matched.violationsLog || [],
    },
    status: "submitted",
    submittedAt: matched.submittedAt || new Date().toISOString(),
  };
}

  const fetchImmutableReport = async () => {
    try {
      if (!initialPassedReport && !report) {
        setLoading(true);
      }
      setError(null);
      const token = localStorage.getItem("Step2Dev_token") || localStorage.getItem("token");
      const rawId = (sessionId || "").trim();
      const isCertAttemptId = rawId.startsWith("cert_att_") || rawId.startsWith("cert_") || rawId.startsWith("MZ-") || rawId.includes("-2026-");
      const isAttemptId = rawId.startsWith("attempt_");
      const isProjectSubId = rawId.startsWith("proj_sub_") || rawId.startsWith("proj_");
      const cleanId = isAttemptId ? rawId.replace("attempt_", "") : rawId;

      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Authoritative Backend Fetch (Database is the definitive source of truth)
      let targetUrl = null;
      if (isCertAttemptId || rawId.startsWith("cert_")) {
        targetUrl = `${API_BASE}/api/certifications/attempt/${rawId}/report`;
      } else if (isProjectSubId) {
        targetUrl = `${API_BASE}/api/projects/submissions/${cleanId}/report`;
      } else if (isAttemptId) {
        targetUrl = `${API_BASE}/api/curriculum/assessment-attempt/${cleanId}`;
      } else {
        // Universal coding & challenge submission report endpoint
        targetUrl = `${API_BASE}/api/coding/proctored-session/${rawId}/report`;
      }

      let serverReport = null;
      let fetchFailed = false;
      try {
        const res = await fetch(targetUrl, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.report) {
            serverReport = data.report;
          }
        } else if (res.status === 403) {
          setError("Access denied. You do not have permission to view another user's assessment report.");
          setLoading(false);
          return;
        } else if (!isCertAttemptId && !isProjectSubId) {
          // If first endpoint didn't have it, check curriculum assessment attempt endpoint
          const fallbackUrl = targetUrl.includes("/proctored-session/")
            ? `${API_BASE}/api/curriculum/assessment-attempt/${cleanId}`
            : `${API_BASE}/api/coding/proctored-session/${rawId}/report`;
          const altRes = await fetch(fallbackUrl, { headers: authHeaders });
          if (altRes.ok) {
            const altData = await altRes.json().catch(() => ({}));
            if (altData?.report) {
              serverReport = altData.report;
            }
          } else if (altRes.status === 403) {
            setError("Access denied. You do not have permission to view another user's assessment report.");
            setLoading(false);
            return;
          } else {
            fetchFailed = true;
          }
        } else {
          fetchFailed = true;
        }
      } catch (netErr) {
        console.warn("Direct fetch network warning:", netErr.message);
        fetchFailed = true;
      }

      if (serverReport) {
        setReport(serverReport);
        setLoading(false);
        const initialExpanded = { 0: true };
        if (Array.isArray(serverReport.reviewBreakdown) && serverReport.reviewBreakdown.length > 0) {
          initialExpanded[serverReport.reviewBreakdown.length] = true;
        }
        setExpandedQuestions(initialExpanded);
      } else if (initialPassedReport && initialPassedReport.attemptId === rawId) {
        setReport(initialPassedReport);
        setLoading(false);
      } else {
        // Real database data only — show clean, authentic empty/error state when record not found
        setError("The assessment report for this attempt is not available, pending evaluation, or does not exist.");
        setLoading(false);
      }
    } catch (err) {
      console.warn("Report loading error:", err);
      setError("Unable to load assessment report.");
      setLoading(false);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return "N/A";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}:${pad(d.getSeconds())}`;
  };

  const formatSeconds = (sec) => {
    const s = Math.max(0, Math.round(Number(sec) || 0));
    if (s < 60) return `${s}s`;
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    if (mins < 60) return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remM = mins % 60;
    return `${hrs}h ${remM}m`;
  };

  const getFileExtension = (lang = "python") => {
    const l = lang.toLowerCase();
    if (l.includes("python") || l === "py") return "py";
    if (l.includes("javascript") || l === "js" || l.includes("node")) return "js";
    if (l.includes("java")) return "java";
    if (l.includes("cpp") || l.includes("c++")) return "cpp";
    if (l === "c") return "c";
    return "txt";
  };

  const handleCopyCode = (codeStr, qIdx) => {
    if (!codeStr) return;
    navigator.clipboard.writeText(codeStr);
    setCopiedQuestionIdx(qIdx);
    setTimeout(() => setCopiedQuestionIdx(null), 2000);
  };

  const handleDownloadCode = (codeStr, lang, title, idx, explicitFilename = null) => {
    if (!codeStr) return;
    const ext = getFileExtension(lang);
    const safeTitle = (title || `question_${idx + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const filename = explicitFilename || `${safeTitle}_solution.${ext}`;
    const blob = new Blob([codeStr], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySessionId = () => {
    if (!report?.sessionId) return;
    navigator.clipboard.writeText(report.sessionId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrintPdf = () => {
    // Expand all questions before printing so the PDF includes every question & code block
    const allExpanded = {};
    normalizedQuestions.forEach((_, idx) => {
      allExpanded[idx] = true;
    });
    setExpandedQuestions(allExpanded);
    setTimeout(() => {
      window.print();
    }, 180);
  };

  const handleRetakeAssessment = () => {
    const tId = report?.trackId || report?.category || "python";
    const mIdx = report?.moduleIndex !== undefined ? report.moduleIndex : 0;
    const subKey = report?.subjectKey || "coding";

    const rawUser = localStorage.getItem("user");
    let uId = "";
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        uId = u._id || u.id || u.userId || "";
      } catch {}
    }
    const userSubmittedKey = uId ? `mz_${uId}_exam_${subKey}_${tId}_${mIdx}_submitted` : `mz_exam_${mIdx}_submitted`;
    localStorage.removeItem(userSubmittedKey);
    localStorage.removeItem(`${userSubmittedKey}_report_url`);
    localStorage.removeItem(`mz_proc_draft_ans_${subKey}_${tId}_${mIdx}`);
    localStorage.removeItem(`mz_proc_draft_ans_${tId}_${mIdx}`);
    localStorage.removeItem(`mz_proc_draft_time_${subKey}_${tId}_${mIdx}`);
    localStorage.removeItem(`mz_proc_draft_time_${tId}_${mIdx}`);
    localStorage.removeItem(`mz_proc_draft_violations_${subKey}_${tId}_${mIdx}`);
    localStorage.removeItem(`mz_proc_draft_violations_${tId}_${mIdx}`);
    localStorage.removeItem(`mz_proc_order_${subKey}_${tId}_${mIdx}`);
    localStorage.removeItem(`mz_proc_order_${tId}_${mIdx}`);
    sessionStorage.removeItem("mz_proc_pending_refresh_violation");
    sessionStorage.removeItem("mz_active_proctored_session");
    localStorage.removeItem("mz_active_proctored_session");
    localStorage.removeItem("mz_last_assessment_report_sid");
    if (report?.questionId) {
      localStorage.removeItem(`mz_report_sid_${report.questionId}`);
      localStorage.removeItem(`mz_draft_${report.questionId}`);
    }

    const isCertification = report?.assessmentType === "certification" || sessionId?.startsWith("cert_");
    const isProject = report?.type === "project_assessment" || sessionId?.startsWith("proj_") || report?.projectId;
    const isMcq = report?.assessmentType === "mcq" || report?.type === "mcq_exam" || report?.itemType === "mcq" || sessionId?.startsWith("attempt_");
    const isCodingChallenge = (report?.questionId && String(report.questionId).startsWith("ch_")) || sessionId?.startsWith("ch_");
    const isCurriculumCoding = (tId && mIdx !== undefined && !isMcq && !isCertification && !isProject) || (report?.questionId && /^[a-zA-Z0-9]+_\d+$/.test(report.questionId));

    if (isCertification) {
      navigate(`/coding?tab=certification&retake=true`);
    } else if (isProject) {
      navigate(`/coding?tab=projects&project=${report.projectId || ""}&retake=true`);
    } else if (isCodingChallenge) {
      navigate(`/challenge-workspace/${report.questionId || "ch_two_sum"}?retake=true`);
    } else if (isCurriculumCoding) {
      navigate(`/coding-test/${tId}/${mIdx}?retake=true`);
    } else if (isMcq) {
      navigate(`/proctored-assessment/${tId}/${mIdx}?retake=true`);
    } else {
      navigate(`/coding-test/${tId}/${mIdx}?retake=true`);
    }
  };

  // Normalize questions across Coding, Project, and MCQ reports
  const normalizedQuestions = useMemo(() => {
    if (!report) return [];
    const isPureMcq = Boolean(report.isMcq);
    const hasMcqs = Array.isArray(report.reviewBreakdown) && report.reviewBreakdown.length > 0;
    const hasCoding = Array.isArray(report.questions) && report.questions.length > 0;

    let mcqList = [];
    if (hasMcqs) {
      const avgSec = Math.max(1, Math.round((report.durationSeconds || 1800) / report.reviewBreakdown.length));
      mcqList = report.reviewBreakdown.map((item, idx) => {
        const userAnsIdx =
          item.userSelected !== undefined
            ? item.userSelected
            : item.selectedOption !== undefined
            ? item.selectedOption
            : item.userAnswer;
        const corrAnsIdx =
          item.correctIndex !== undefined
            ? item.correctIndex
            : item.correctOption !== undefined
            ? item.correctOption
            : item.correctAnswer;
        const isUnanswered = userAnsIdx === null || userAnsIdx === undefined || userAnsIdx === -1 || userAnsIdx === "";
        const isCorrect = Boolean(
          item.isCorrect === true ||
          item.isCorrect === "true" ||
          item.passed === true ||
          item.status === "passed" ||
          (!isUnanswered && corrAnsIdx !== undefined && corrAnsIdx !== null && !isNaN(Number(corrAnsIdx)) && Number(userAnsIdx) === Number(corrAnsIdx))
        );
        const status = isUnanswered && !isCorrect ? "unanswered" : isCorrect ? "passed" : "failed";
        return {
          ...item,
          isMcqQuestion: true,
          questionIndex: idx,
          title: item.question || `Question ${idx + 1}`,
          status,
          marksObtained:
            item.marksAwarded !== undefined
              ? item.marksAwarded
              : isCorrect
              ? item.maxMarks || 1
              : 0,
          totalMarks: item.maxMarks || 1,
          durationLabel: `${avgSec}s`,
          userAnsIdx: isUnanswered ? null : Number(userAnsIdx),
          corrAnsIdx: Number(corrAnsIdx),
          isUnanswered,
          isCorrect,
        };
      });
    }

    if (isPureMcq && !hasCoding) {
      return mcqList;
    }

    const rawCodingQuestions = hasCoding
      ? report.questions
      : !hasMcqs
      ? [
          {
            questionId: report.problemData?.id || "q_1",
            title: report.problemData?.title || report.assessmentTitle || "Coding Problem",
            difficulty: report.problemData?.difficulty || "Medium",
            category: report.problemData?.category || report.trackId || "DSA",
            description: report.problemData?.description || "",
            inputFormat: report.problemData?.inputFormat || "",
            outputFormat: report.problemData?.outputFormat || "",
            constraints: report.problemData?.constraints || [],
            examples: report.problemData?.examples || [],
            submittedCode: report.submittedCode || "",
            language: report.language || "python",
            status: report.performance?.passed ? "passed" : "failed",
            score: report.performance?.score || 0,
            marksObtained: report.performance?.marksObtained ?? report.performance?.score ?? 0,
            totalMarks: report.performance?.totalMarks || 100,
            passedTests: report.performance?.passedTests || 0,
            totalTests: report.performance?.totalTests || 10,
            testResults: report.testResults || [],
            submittedAt: report.submissionTime,
          },
        ]
      : [];

    const codingOffset = mcqList.length;
    const codingList = rawCodingQuestions.map((q, idx) => {
      const qCode = q.submittedCode !== undefined ? String(q.submittedCode) : "";
      const codeEmpty = q.isCodeEmpty !== undefined ? Boolean(q.isCodeEmpty) : isClientCodeEmpty(qCode);
      const tResults = Array.isArray(q.testResults) ? q.testResults : [];
      const totalTests = q.totalTests || tResults.length || 10;
      const passedTests =
        q.passedTests !== undefined ? q.passedTests : tResults.filter((r) => r.passed).length;
      const totalMarks = q.totalMarks || 100;
      const marksObtained =
        q.marksObtained !== undefined
          ? q.marksObtained
          : q.score !== undefined
          ? Math.round((q.score / 100) * totalMarks)
          : Math.round((passedTests / Math.max(1, totalTests)) * totalMarks);

      const hasCompileErr = tResults.some((r) => /Syntax Error|Compilation Error/i.test(r.error || ""));
      const hasRuntimeErr =
        !hasCompileErr &&
        tResults.some((r) =>
          /Timed out|Runtime Error|Exception|Traceback|ReferenceError|TypeError|ZeroDivisionError/i.test(
            r.error || ""
          )
        );

      let status = "failed";
      if (codeEmpty && passedTests === 0) {
        status = "unanswered";
      } else if (passedTests === totalTests && totalTests > 0) {
        status = "passed";
      } else if (passedTests > 0 && passedTests < totalTests) {
        status = "partial";
      } else {
        status = "failed";
      }

      const compilationStatus =
        q.compilationStatus ||
        (codeEmpty && passedTests === 0
          ? "No Code Submitted"
          : hasCompileErr
          ? "Compilation Error"
          : "Compiled Successfully");

      const executionStatus =
        q.executionStatus ||
        (codeEmpty && passedTests === 0
          ? "Not Executed"
          : hasCompileErr
          ? "Compilation Failed"
          : passedTests === totalTests
          ? "All Test Cases Passed"
          : passedTests > 0
          ? `Partially Passed (${passedTests}/${totalTests})`
          : hasRuntimeErr
          ? "Runtime Error"
          : "Test Cases Failed");

      const runtimeMs =
        q.runtimeMs !== undefined
          ? q.runtimeMs
          : tResults.reduce((acc, r) => acc + Number(r.durationMs || r.duration || 0), 0);

      const qLang = String(q.language || report.language || "python").toLowerCase();
      const memoryMb =
        q.memoryMb !== undefined
          ? q.memoryMb
          : codeEmpty
          ? 0
          : qLang.includes("java")
          ? 28.4
          : qLang.includes("c")
          ? 4.8
          : 14.2;

      return {
        ...q,
        isMcqQuestion: false,
        questionIndex: codingOffset + idx,
        title: q.title || `Coding Problem ${idx + 1}`,
        submittedCode: codeEmpty && passedTests === 0 ? "" : qCode,
        isCodeEmpty: codeEmpty && passedTests === 0,
        language: q.language || report.language || "python",
        status,
        compilationStatus,
        executionStatus,
        runtimeMs,
        memoryMb,
        passedTests,
        totalTests,
        marksObtained,
        totalMarks,
        testResults: tResults,
        durationLabel: runtimeMs > 0 ? `${runtimeMs}ms` : "0ms",
      };
    });

    return [...mcqList, ...codingList];
  }, [report]);

  // Filter counts for Question Navigator
  const navigatorCounts = useMemo(() => {
    const counts = {
      all: normalizedQuestions.length,
      passed: 0,
      failed: 0,
      partial: 0,
      unanswered: 0,
    };
    normalizedQuestions.forEach((q) => {
      if (q.status === "passed") counts.passed++;
      else if (q.status === "partial") counts.partial++;
      else if (q.status === "unanswered") counts.unanswered++;
      else counts.failed++;
    });
    return counts;
  }, [normalizedQuestions]);

  const filteredQuestions = useMemo(() => {
    return normalizedQuestions.filter((q) => {
      if (questionFilter === "passed" && q.status !== "passed") return false;
      if (questionFilter === "failed" && q.status !== "failed") return false;
      if (questionFilter === "partial" && q.status !== "partial") return false;
      if (questionFilter === "unanswered" && q.status !== "unanswered") return false;
      if (questionSearch.trim()) {
        const term = questionSearch.toLowerCase();
        const inTitle = (q.title || "").toLowerCase().includes(term);
        const inCat = (q.category || "").toLowerCase().includes(term);
        const inDesc = (q.description || "").toLowerCase().includes(term);
        return inTitle || inCat || inDesc;
      }
      return true;
    });
  }, [normalizedQuestions, questionFilter, questionSearch]);

  if (loading) {
    return (
      <EvaluatingResultsLoader
        title={initialPassedReport?.assessmentTitle || initialPassedReport?.title || "Assessment Report"}
        assignmentType="Assessment"
        mode="navigating"
        isNavigating={true}
        subtitle="Retrieving verified audit ledger, test telemetry, and performance scorecard..."
      />
    );
  }

  if (error || !report) {
    return (
      <div className="mz-report-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="mz-report-card" style={{ maxWidth: 480, textAlign: "center", padding: 36 }}>
          <AlertTriangle size={44} color="#ef4444" style={{ marginBottom: 12 }} />
          <h2 style={{ margin: "0 0 8px", fontSize: "1.3rem", fontWeight: 800, color: "var(--mz-text-primary, #0f172a)" }}>
            Assessment Report Unavailable
          </h2>
          <p style={{ color: "var(--mz-text-muted, #64748b)", fontSize: "0.9rem", marginBottom: 24 }}>
            {error || "This assessment session does not exist or could not be found."}
          </p>
          <button className="mz-report-btn mz-report-btn-primary" onClick={() => navigate("/home")}>
            <Home size={16} /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  const {
    candidateDetails = {},
    assessmentTitle,
    problemData = {},
    scorecard = {},
    performance = {},
    evaluationFeedback = {},
    proctoringAudit = {},
    startTime,
    submissionTime,
    durationSeconds,
  } = report;

  const isMcqReport = Boolean(report.isMcq);
  const isProjectReport = Boolean(report.isProjectReport);

  const totalQuestions = scorecard.totalQuestions ?? normalizedQuestions.length ?? 1;
  const questionsAttempted =
    scorecard.questionsAttempted ??
    normalizedQuestions.filter((q) => q.status !== "unanswered").length;
  const questionsUnanswered =
    scorecard.questionsUnanswered ?? Math.max(0, totalQuestions - questionsAttempted);

  const totalMarks = scorecard.totalMarks ?? performance.totalMarks ?? 100;
  const marksObtained = scorecard.marksObtained ?? performance.marksObtained ?? performance.score ?? 0;
  const overallPercentage =
    scorecard.overallPercentage ??
    performance.score ??
    (totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0);

  const totalTestCases =
    scorecard.totalTestCases ??
    performance.totalTests ??
    normalizedQuestions.reduce((sum, q) => sum + (q.totalTests || 1), 0);
  const totalPassedTests =
    scorecard.totalPassedTests ??
    performance.passedTests ??
    normalizedQuestions.reduce((sum, q) => sum + (q.passedTests || (q.status === "passed" ? 1 : 0)), 0);

  const accuracy =
    scorecard.accuracy ??
    performance.accuracy ??
    (totalTestCases > 0 ? Math.round((totalPassedTests / totalTestCases) * 100) : overallPercentage);

  const grade =
    scorecard.grade ||
    performance.grade ||
    (overallPercentage >= 90
      ? "A+"
      : overallPercentage >= 80
      ? "A"
      : overallPercentage >= 70
      ? "B"
      : overallPercentage >= 60
      ? "C"
      : "F");

  const isPass = scorecard.passed !== undefined ? scorecard.passed : overallPercentage >= 80;
  const isPartiallyPassed =
    !isPass && (overallPercentage > 0 || totalPassedTests > 0 || navigatorCounts.partial > 0);

  const ringRadius = 72;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const animatedPct = Math.round(overallPercentage * animFactor);
  const strokeDashoffset =
    ringCircumference - (Math.min(100, Math.max(0, overallPercentage * animFactor)) / 100) * ringCircumference;
  const ringTone = overallPercentage >= 80 ? "high" : overallPercentage >= 40 ? "med" : "low";

  const timeLimitMins = Math.round((report.timeLimitSeconds || 3600) / 60);
  const allAreExpanded =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => Boolean(expandedQuestions[q.questionIndex]));

  const toggleExpandAll = () => {
    if (allAreExpanded) {
      setExpandedQuestions({});
    } else {
      const next = {};
      normalizedQuestions.forEach((q) => {
        next[q.questionIndex] = true;
      });
      setExpandedQuestions(next);
    }
  };

  const toggleQuestionCard = (qIdx) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qIdx]: !prev[qIdx],
    }));
  };

  const toggleTestRow = (key) => {
    setExpandedTestRows((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Proctoring honesty check
  const proctoringTelemetryAvailable =
    proctoringAudit.telemetryAvailable !== undefined
      ? Boolean(proctoringAudit.telemetryAvailable)
      : Boolean(
          proctoringAudit.permissions?.camera ||
            proctoringAudit.permissions?.microphone ||
            proctoringAudit.permissions?.screenShare ||
            proctoringAudit.permissions?.fullscreen ||
            (Array.isArray(proctoringAudit.violationsTimeline) &&
              proctoringAudit.violationsTimeline.length > 0) ||
            isMcqReport
        );

  const violationsCount = proctoringAudit.violationsCount ?? scorecard.violationsCount ?? 0;
  const chancesUsed = proctoringAudit.chancesUsed ?? violationsCount ?? 0;

  return (
    <div className="mz-report-root">
      <main className="mz-report-container">
        {/* =====================================================================
            TOP BREADCRUMB BAR (NO MASTERY ZONE APPLICATION NAVBAR)
            ===================================================================== */}
        <div className="mz-report-breadcrumb-bar mz-report-print-hide">
          <nav className="mz-report-breadcrumbs" aria-label="Breadcrumb">
            <button type="button" className="mz-breadcrumb-link" onClick={() => navigate("/home")}>
              Home
            </button>
            <span className="mz-breadcrumb-sep">
              <ChevronRight size={14} />
            </span>
            <button type="button" className="mz-breadcrumb-link" onClick={() => navigate("/coding")}>
              Assessments
            </button>
            <span className="mz-breadcrumb-sep">
              <ChevronRight size={14} />
            </span>
            <span className="mz-breadcrumb-current">Assessment Report</span>
          </nav>

          <div className="mz-breadcrumb-meta-right">
            <ThemeToggle />
            <button
              type="button"
              className="mz-session-chip"
              onClick={handleCopySessionId}
              title="Click to copy Session ID"
            >
              <Lock size={12} color="#4F46E5" />
              <span>Session ID: {report.sessionId}</span>
              {copiedId ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* =====================================================================
            HERO SECTION (2-COLUMN DASHBOARD CARDS MATCHING REFERENCE IMAGE)
            ===================================================================== */}
        <section className="mz-report-hero-grid">
          {/* LEFT HERO CARD: Assessment Information & Candidate Metadata */}
          <div className="mz-report-card mz-report-hero-left">
            <div className="mz-hero-header-block">
              <div className="mz-hero-code-icon-box">
                <Code2 size={34} strokeWidth={2.4} />
              </div>

              <div className="mz-hero-title-col">
                <div className="mz-report-status-badge-row">
                  <span
                    className={`mz-report-pill ${
                      isPass ? "pass" : isPartiallyPassed ? "partial" : "fail"
                    }`}
                  >
                    {isPass ? (
                      <>
                        {isProjectReport ? "Project Completed" : "Assessment Passed"}{" "}
                        <Check size={14} strokeWidth={2.8} />
                      </>
                    ) : isPartiallyPassed ? (
                      <>
                        Partially Passed <AlertTriangle size={13} />
                      </>
                    ) : (
                      <>
                        {isProjectReport ? "Needs Improvement" : "Assessment Failed"}{" "}
                        <X size={14} strokeWidth={2.8} />
                      </>
                    )}
                  </span>

                  {!isMcqReport && (
                    <span className="mz-report-pill proctored">
                      {(report.language || report.trackId || "Python").toUpperCase()}
                    </span>
                  )}

                  {problemData.category && (
                    <span className="mz-report-pill readonly">{problemData.category}</span>
                  )}

                  <span className="mz-report-pill readonly" data-testid="report-passing-cutoff-pill">
                    Passing Cutoff: {report.passingMarks || scorecard.passingMarks || 80}%
                  </span>
                </div>

                <h1 className="mz-report-title-lg">
                  {assessmentTitle || problemData.title || "Coding Assessment"}
                </h1>

                <p className="mz-report-desc-sub">
                  {problemData.description ||
                    (isMcqReport
                      ? `Comprehensive evaluation of ${
                          report.assessmentTitle || "module"
                        } concepts and problem-solving accuracy.`
                      : "Evaluate your algorithmic implementation, test-case accuracy, and runtime performance.")}
                </p>
              </div>
            </div>

            {/* 2x3 Candidate & Session Metadata Sub-Grid */}
            <div className="mz-hero-meta-grid-6">
              <div className="mz-hero-meta-cell">
                <div className="mz-hero-meta-icon">
                  <User size={17} />
                </div>
                <div className="mz-hero-meta-text">
                  <span className="mz-hero-meta-lbl">Candidate Name</span>
                  <span className="mz-hero-meta-val" title={candidateDetails.fullName || "Candidate"}>
                    {candidateDetails.fullName || "Verified Candidate"}
                  </span>
                </div>
              </div>

              <div className="mz-hero-meta-cell">
                <div className="mz-hero-meta-icon blue">
                  <BadgeCheck size={17} />
                </div>
                <div className="mz-hero-meta-text">
                  <span className="mz-hero-meta-lbl">Candidate ID</span>
                  <span className="mz-hero-meta-val">{candidateDetails.candidateId || "CAND-MZ01"}</span>
                </div>
              </div>

              <div className="mz-hero-meta-cell">
                <div className="mz-hero-meta-icon">
                  <Mail size={17} />
                </div>
                <div className="mz-hero-meta-text">
                  <span className="mz-hero-meta-lbl">Email Address</span>
                  <span
                    className="mz-hero-meta-val"
                    title={candidateDetails.email || "guest@masteryzone.com"}
                  >
                    {candidateDetails.email || "guest@masteryzone.com"}
                  </span>
                </div>
              </div>

              <div className="mz-hero-meta-cell">
                <div className="mz-hero-meta-icon purple">
                  <Calendar size={17} />
                </div>
                <div className="mz-hero-meta-text">
                  <span className="mz-hero-meta-lbl">Started At</span>
                  <span className="mz-hero-meta-val">{formatDateTime(startTime)}</span>
                </div>
              </div>

              <div className="mz-hero-meta-cell">
                <div className="mz-hero-meta-icon purple">
                  <Calendar size={17} />
                </div>
                <div className="mz-hero-meta-text">
                  <span className="mz-hero-meta-lbl">Submitted At</span>
                  <span className="mz-hero-meta-val">{formatDateTime(submissionTime)}</span>
                </div>
              </div>

              <div className="mz-hero-meta-cell">
                <div className="mz-hero-meta-icon">
                  <Clock size={17} />
                </div>
                <div className="mz-hero-meta-text">
                  <span className="mz-hero-meta-lbl">Time Taken</span>
                  <span className="mz-hero-meta-val">
                    {formatSeconds(durationSeconds)}{" "}
                    <span className="mz-hero-meta-val-muted">| Duration: {timeLimitMins} mins</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT HERO CARD: Action Buttons + Circular Score Ring + Grade Stack */}
          <div className="mz-report-score-card">
            <div className="mz-score-card-top-actions">
              <button
                type="button"
                className="mz-report-btn mz-report-btn-secondary"
                onClick={handleRetakeAssessment}
                title="Start a fresh assessment attempt"
              >
                <RefreshCw size={15} /> Retake Assessment
              </button>
              <button
                type="button"
                className="mz-report-btn mz-report-btn-secondary"
                onClick={handlePrintPdf}
              >
                <Download size={15} /> Export PDF
              </button>
              <button
                type="button"
                className="mz-report-btn mz-report-btn-primary"
                onClick={() => navigate("/home")}
              >
                <Home size={15} /> Back to Home
              </button>
            </div>

            <div className="mz-score-card-body-split">
              {/* Animated SVG Circular Score Ring */}
              <div className="mz-score-ring-wrap">
                <svg className="mz-score-ring-svg" viewBox="0 0 176 176">
                  <circle className="mz-score-ring-inner-disc" cx="88" cy="88" r="60" />
                  <circle className="mz-score-ring-bg" cx="88" cy="88" r={ringRadius} />
                  <circle
                    className={`mz-score-ring-progress ${ringTone}`}
                    cx="88"
                    cy="88"
                    r={ringRadius}
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="mz-score-ring-text">
                  <div className="mz-score-ring-val-row">
                    <span className="mz-score-ring-val">{animatedPct}</span>
                    <span className="mz-score-ring-pct-symbol">%</span>
                  </div>
                  <span className="mz-score-ring-pct">Overall Score</span>
                </div>
              </div>

              {/* Right 3-Card Metric Stack (Final Grade, Marks Obtained, Accuracy) */}
              <div className="mz-score-metrics-stack">
                <div
                  className={`mz-score-mini-card ${
                    isPass ? "grade-pass" : isPartiallyPassed ? "grade-partial" : "grade-fail"
                  }`}
                >
                  <div
                    className={`mz-score-mini-icon ${
                      isPass ? "green" : isPartiallyPassed ? "amber" : "red"
                    }`}
                  >
                    {isPass ? <Check size={18} strokeWidth={3} /> : <Award size={18} />}
                  </div>
                  <div>
                    <div className="mz-score-mini-lbl">Final Grade</div>
                    <div className="mz-score-mini-val">{grade}</div>
                  </div>
                </div>

                <div className="mz-score-mini-card">
                  <div className="mz-score-mini-icon blue">
                    <FileCheck2 size={17} />
                  </div>
                  <div>
                    <div className="mz-score-mini-lbl">Marks Obtained</div>
                    <div className="mz-score-mini-val">
                      {Math.round(marksObtained * animFactor)} / {totalMarks}
                    </div>
                  </div>
                </div>

                <div className="mz-score-mini-card">
                  <div className="mz-score-mini-icon amber">
                    <Award size={17} />
                  </div>
                  <div>
                    <div className="mz-score-mini-lbl">
                      Accuracy{" "}
                      {!isMcqReport && (
                        <span style={{ fontWeight: 500, color: "#94a3b8" }}>
                          ({totalPassedTests}/{totalTestCases} Tests)
                        </span>
                      )}
                    </div>
                    <div className="mz-score-mini-val">{Math.round(accuracy * animFactor)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OFFICIAL EARNED CERTIFICATE BANNER */}
        {report.certificate && (
          <div
            style={{
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
              border: "1.5px solid #6366f1",
              borderRadius: 14,
              padding: "20px 24px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              color: "#ffffff",
              boxShadow: "0 8px 24px rgba(79, 70, 229, 0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#fbbf24",
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(251, 191, 36, 0.4)",
                  flexShrink: 0,
                }}
              >
                <Award size={28} />
              </div>
              <div>
                <span
                  style={{
                    background: "rgba(251, 191, 36, 0.2)",
                    border: "1px solid #fbbf24",
                    color: "#fef08a",
                    padding: "2px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Official Verified Credential Issued
                </span>
                <h3 style={{ margin: "6px 0 2px", fontSize: 20, fontWeight: 800 }}>
                  {report.assessmentTitle || "Certificate of Completion"}
                </h3>
                <div style={{ fontSize: 13, color: "#c7d2fe" }}>
                  Credential ID: <strong>{report.certificate.certificateId}</strong> • Verified Candidate: {candidateDetails.fullName}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                href={`${API_BASE}/api/certifications/certificate/${report.certificate.certificateId}/download?token=${encodeURIComponent(localStorage.getItem("token") || "")}`}
                download
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Download size={15} /> Download Certificate PDF
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  report.certificate.verificationUrl || `${window.location.origin}/verify/${report.certificate.certificateId}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  background: "#0a66c2",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Share2 size={15} /> Share on LinkedIn
              </a>

              <a
                href={`/verify/${report.certificate.certificateId}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "9px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ExternalLink size={15} /> Verify
              </a>
            </div>
          </div>
        )}

        {/* =====================================================================
            PERFORMANCE ANALYTICS STRIP (6 HORIZONTAL CARDS MATCHING REFERENCE)
            ===================================================================== */}
        <section className="mz-analytics-strip-grid">
          <div className="mz-analytics-strip-card">
            <div className="mz-strip-icon-circle blue">
              <HelpCircle size={20} strokeWidth={2.4} />
            </div>
            <div className="mz-strip-content">
              <span className="mz-strip-label">Total Questions</span>
              <span className="mz-strip-val">{totalQuestions}</span>
              {!isMcqReport && (
                <span className="mz-strip-sub">{totalTestCases} Total Test Cases</span>
              )}
            </div>
          </div>

          <div className="mz-analytics-strip-card">
            <div className="mz-strip-icon-circle green">
              <Check size={20} strokeWidth={2.8} />
            </div>
            <div className="mz-strip-content">
              <span className="mz-strip-label">Attempted</span>
              <span className="mz-strip-val">{questionsAttempted}</span>
              {!isMcqReport && (
                <span className="mz-strip-sub">{totalPassedTests} Tests Passed</span>
              )}
            </div>
          </div>

          <div className="mz-analytics-strip-card">
            <div className="mz-strip-icon-circle red">
              <X size={20} strokeWidth={2.8} />
            </div>
            <div className="mz-strip-content">
              <span className="mz-strip-label">Unanswered</span>
              <span className="mz-strip-val">{questionsUnanswered}</span>
              {!isMcqReport && (
                <span className="mz-strip-sub">
                  {Math.max(0, totalTestCases - totalPassedTests)} Tests Failed
                </span>
              )}
            </div>
          </div>

          <div className="mz-analytics-strip-card">
            <div className="mz-strip-icon-circle amber">
              <Award size={20} strokeWidth={2.4} />
            </div>
            <div className="mz-strip-content">
              <span className="mz-strip-label">Marks Obtained</span>
              <span className="mz-strip-val">
                {marksObtained} / {totalMarks}
              </span>
              <span className="mz-strip-sub">Grade {grade}</span>
            </div>
          </div>

          <div className="mz-analytics-strip-card">
            <div className="mz-strip-icon-circle purple">
              <Target size={20} strokeWidth={2.4} />
            </div>
            <div className="mz-strip-content">
              <span className="mz-strip-label">Accuracy</span>
              <span className="mz-strip-val">{accuracy}%</span>
              <span className="mz-strip-sub">
                {isMcqReport
                  ? `${totalPassedTests}/${totalQuestions} Correct`
                  : `${totalPassedTests}/${totalTestCases} Test Cases`}
              </span>
            </div>
          </div>

          <div className="mz-analytics-strip-card">
            <div className="mz-strip-icon-circle sky">
              <Clock size={20} strokeWidth={2.4} />
            </div>
            <div className="mz-strip-content">
              <span className="mz-strip-label">Time Taken</span>
              <span className="mz-strip-val">{formatSeconds(durationSeconds)}</span>
              <span className="mz-strip-sub">
                Avg {formatSeconds(Math.max(1, Math.round((durationSeconds || 1) / Math.max(1, totalQuestions))))} / Q
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================================
            4 INTERACTIVE PRIMARY NAVIGATION TABS (MATCHING REFERENCE IMAGE)
            ===================================================================== */}
        <div className="mz-report-tabs-row mz-report-print-hide">
          <button
            type="button"
            className={`mz-report-pill-tab ${activeTab === "analysis" ? "active" : ""}`}
            onClick={() => setActiveTab("analysis")}
          >
            <ListChecks size={16} /> Question-Wise Analysis
          </button>

          <button
            type="button"
            className={`mz-report-pill-tab ${activeTab === "code_execution" ? "active" : ""}`}
            onClick={() => setActiveTab("code_execution")}
          >
            <Code2 size={16} /> Code Execution Results
          </button>

          <button
            type="button"
            className={`mz-report-pill-tab ${activeTab === "audit" ? "active" : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            <ShieldCheck size={16} /> Proctoring Audit
          </button>

          <button
            type="button"
            className={`mz-report-pill-tab ${activeTab === "insights" ? "active" : ""}`}
            onClick={() => setActiveTab("insights")}
          >
            <BarChart3 size={16} /> Performance Insights
          </button>
        </div>

        {/* =====================================================================
            TAB 1: QUESTION-WISE ANALYSIS (2-COLUMN SPLIT LAYOUT)
            ===================================================================== */}
        {activeTab === "analysis" && (
          <section className="mz-analysis-split-layout">
            {/* LEFT SIDEBAR: Question Navigator + Golden Laurel Callout */}
            <aside className="mz-q-navigator-sidebar">
              <h3 className="mz-q-nav-title">Question Navigator</h3>

              <div className="mz-q-nav-filter-list">
                <button
                  type="button"
                  className={`mz-q-nav-filter-item ${questionFilter === "all" ? "active" : ""}`}
                  onClick={() => setQuestionFilter("all")}
                >
                  <span className="mz-q-nav-filter-left">
                    <Layers size={16} color={questionFilter === "all" ? "#4F46E5" : "#64748B"} />
                    <span>All ({navigatorCounts.all})</span>
                  </span>
                </button>

                <button
                  type="button"
                  className={`mz-q-nav-filter-item ${questionFilter === "passed" ? "active" : ""}`}
                  onClick={() => setQuestionFilter("passed")}
                >
                  <span className="mz-q-nav-filter-left">
                    <CheckCircle2 size={16} color="#10B981" />
                    <span>Passed ({navigatorCounts.passed})</span>
                  </span>
                </button>

                <button
                  type="button"
                  className={`mz-q-nav-filter-item ${questionFilter === "failed" ? "active" : ""}`}
                  onClick={() => setQuestionFilter("failed")}
                >
                  <span className="mz-q-nav-filter-left">
                    <XCircle size={16} color="#EF4444" />
                    <span>Failed ({navigatorCounts.failed})</span>
                  </span>
                </button>

                {(!isMcqReport || navigatorCounts.partial > 0) && (
                  <button
                    type="button"
                    className={`mz-q-nav-filter-item ${questionFilter === "partial" ? "active" : ""}`}
                    onClick={() => setQuestionFilter("partial")}
                  >
                    <span className="mz-q-nav-filter-left">
                      <AlertTriangle size={16} color="#F59E0B" />
                      <span>Partially Passed ({navigatorCounts.partial})</span>
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  className={`mz-q-nav-filter-item ${questionFilter === "unanswered" ? "active" : ""}`}
                  onClick={() => setQuestionFilter("unanswered")}
                >
                  <span className="mz-q-nav-filter-left">
                    <MinusCircle size={16} color="#64748B" />
                    <span>Unanswered ({navigatorCounts.unanswered})</span>
                  </span>
                </button>
              </div>

              {/* Numbered Quick-Jump Grid */}
              {normalizedQuestions.length > 1 && (
                <div className="mz-q-jump-grid">
                  {normalizedQuestions.map((q) => (
                    <button
                      key={`jump_${q.questionIndex}`}
                      type="button"
                      className={`mz-q-jump-pill ${q.status}`}
                      onClick={() => {
                        setExpandedQuestions((prev) => ({ ...prev, [q.questionIndex]: true }));
                        const el = document.getElementById(`mz-q-card-${q.questionIndex}`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      title={`Jump to Question ${q.questionIndex + 1}`}
                    >
                      {q.questionIndex + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Golden Laurel Performance Callout Card (Matching Reference Image) */}
              <div className="mz-laurel-callout-card">
                <div className="mz-laurel-svg-wrap">
                  <GoldenLaurelEmblem
                    variant={isPass ? "pass" : isPartiallyPassed ? "partial" : "fail"}
                  />
                </div>
                <h4 className="mz-laurel-title">
                  {isPass
                    ? "Excellent Performance!"
                    : isPartiallyPassed
                    ? "Good Effort!"
                    : "Keep Practicing!"}
                </h4>
                <p className="mz-laurel-sub">
                  You scored <strong>{overallPercentage}%</strong> in this assessment.
                </p>
              </div>
            </aside>

            {/* RIGHT MAIN PANEL: Expand All Toolbar + Expandable Question Cards */}
            <div className="mz-questions-main-panel">
              <div className="mz-questions-panel-toolbar mz-report-print-hide">
                <div className="mz-questions-toolbar-left">
                  <div className="mz-q-search-input-wrap" ref={searchContainerRef} style={{ position: "relative" }}>
                    <Search
                      size={14}
                      color="#94A3B8"
                      style={{ position: "absolute", left: 10, pointerEvents: "none" }}
                    />
                    <input
                      type="text"
                      className="mz-q-search-input"
                      placeholder="Search..."
                      value={questionSearch}
                      onChange={(e) => {
                        setQuestionSearch(e.target.value);
                        setShowSearchDropdown(true);
                      }}
                      onFocus={() => {
                        if (questionSearch.trim()) setShowSearchDropdown(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setShowSearchDropdown(false);
                      }}
                    />
                    {questionSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionSearch("");
                          setShowSearchDropdown(false);
                        }}
                        style={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        ✕
                      </button>
                    )}

                    {showSearchDropdown && questionSearch.trim().length > 0 && (
                      <div className="mz-global-search-dropdown" style={{ minWidth: 320, left: 0 }}>
                        <div className="mz-global-search-header">
                          <span>Questions matching &ldquo;{questionSearch.trim()}&rdquo;</span>
                          <span className="mz-global-search-esc">Press ESC</span>
                        </div>
                        {filteredQuestions.length === 0 ? (
                          <div className="mz-global-search-empty">
                            <p>No questions match &ldquo;{questionSearch}&rdquo;</p>
                            <small>Try searching question title or category</small>
                          </div>
                        ) : (
                          <div className="mz-global-search-group">
                            {filteredQuestions.slice(0, 6).map((q) => (
                              <div
                                key={q.questionIndex}
                                className="mz-global-search-item"
                                onClick={() => {
                                  setShowSearchDropdown(false);
                                  setExpandedQuestions((prev) => ({ ...prev, [q.questionIndex]: true }));
                                  const el = document.getElementById(`q-card-${q.questionIndex}`);
                                  if (el) el.scrollIntoView({ behavior: "smooth" });
                                }}
                              >
                                <span className="mz-global-search-item-icon">
                                  {q.status === "passed" ? "✅" : q.status === "partial" ? "⚠️" : "❌"}
                                </span>
                                <div className="mz-global-search-item-content">
                                  <div className="mz-global-search-item-title">{q.title}</div>
                                  <div className="mz-global-search-item-sub">
                                    Q{q.questionIndex + 1} • {q.marksAllocated} Marks ({q.status})
                                  </div>
                                </div>
                                <span className="mz-global-search-item-action">Jump to Q →</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--mz-text-muted, #64748b)", fontWeight: 600 }}>
                    Showing {filteredQuestions.length} of {normalizedQuestions.length}{" "}
                    {normalizedQuestions.length === 1 ? "Question" : "Questions"}
                  </span>
                </div>

                <button type="button" className="mz-expand-all-btn" onClick={toggleExpandAll}>
                  {allAreExpanded ? (
                    <>
                      <ChevronUp size={16} /> Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} /> Expand All
                    </>
                  )}
                </button>
              </div>

              {filteredQuestions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--mz-text-muted, #64748b)" }}>
                  <p style={{ margin: "0 0 12px", fontWeight: 600 }}>
                    No questions match the selected filter ({questionFilter}).
                  </p>
                  <button
                    type="button"
                    className="mz-report-btn mz-report-btn-secondary"
                    onClick={() => {
                      setQuestionFilter("all");
                      setQuestionSearch("");
                    }}
                  >
                    Show All Questions
                  </button>
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const qIdx = q.questionIndex;
                  const isExpanded = Boolean(expandedQuestions[qIdx]);

                  // Render MCQ Question Card (Matching Reference Image 3-Column Layout)
                  if (q.isMcqQuestion) {
                    const opts = Array.isArray(q.options) ? q.options : [];
                    const userOptText =
                      !q.isUnanswered && opts[q.userAnsIdx] !== undefined
                        ? `${String.fromCharCode(65 + Number(q.userAnsIdx))}. ${opts[q.userAnsIdx]}`
                        : "Not Answered (Skipped)";
                    const corrOptText =
                      opts[q.corrAnsIdx] !== undefined
                        ? `${String.fromCharCode(65 + Number(q.corrAnsIdx))}. ${opts[q.corrAnsIdx]}`
                        : "Option A";

                    return (
                      <div
                        key={`q_${qIdx}`}
                        id={`mz-q-card-${qIdx}`}
                        className="mz-question-card"
                      >
                        <div
                          className="mz-question-card-header"
                          onClick={() => toggleQuestionCard(qIdx)}
                        >
                          <div className="mz-q-header-left">
                            <span className={`mz-q-circle-num ${q.status}`}>{qIdx + 1}</span>
                            <h4 className="mz-q-title-text">{q.title}</h4>
                            <span className={`mz-q-status-pill ${q.status}`}>
                              {q.status === "passed" ? (
                                <>
                                  Correct <Check size={13} strokeWidth={2.8} />
                                </>
                              ) : q.status === "unanswered" ? (
                                <>Unanswered</>
                              ) : (
                                <>
                                  Incorrect <X size={13} strokeWidth={2.8} />
                                </>
                              )}
                            </span>
                          </div>

                          <div className="mz-q-header-right">
                            <span className="mz-q-marks-pill">
                              {q.marksObtained} / {q.totalMarks}{" "}
                              {q.totalMarks === 1 ? "Mark" : "Marks"}
                            </span>
                            <span className="mz-q-time-badge">
                              <Clock size={14} color="#64748b" /> {q.durationLabel}
                            </span>
                            {isExpanded ? (
                              <ChevronUp size={18} color="#64748b" />
                            ) : (
                              <ChevronDown size={18} color="#64748b" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mz-question-card-body">
                            <div className="mz-q-three-col-grid">
                              <div className="mz-q-answer-panel">
                                <span className="mz-q-panel-label">Your Answer</span>
                                <div
                                  className={`mz-q-answer-box ${
                                    q.isCorrect ? "correct" : q.isUnanswered ? "" : "wrong"
                                  }`}
                                >
                                  {userOptText}
                                </div>
                              </div>

                              <div className="mz-q-answer-panel">
                                <span className="mz-q-panel-label">Correct Answer</span>
                                <div className="mz-q-answer-box correct">{corrOptText}</div>
                              </div>

                              <div
                                className={`mz-q-answer-panel ${
                                  q.isCorrect ? "explanation-green" : "explanation-amber"
                                }`}
                              >
                                <span className="mz-q-panel-label">Explanation</span>
                                <div
                                  style={{
                                    fontSize: "0.85rem",
                                    color: "var(--mz-text-primary, #1e293b)",
                                    lineHeight: 1.55,
                                  }}
                                >
                                  {q.explanation ||
                                    "Review the core module principles for this concept."}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Render Coding / Project Question Card
                  const projectFiles =
                    isProjectReport &&
                    Array.isArray(report.submittedFiles) &&
                    report.submittedFiles.length > 0
                      ? report.submittedFiles
                      : null;
                  const activeProjFileIdx = selectedProjectFileIdx[qIdx] || 0;
                  const activeProjFile = projectFiles
                    ? projectFiles[activeProjFileIdx] || projectFiles[0]
                    : null;
                  const displayedCode = activeProjFile
                    ? activeProjFile.content || ""
                    : q.submittedCode || "";
                  const displayedLang = (
                    activeProjFile?.language ||
                    q.language ||
                    "python"
                  ).toLowerCase();
                  const lineCount = displayedCode ? displayedCode.split("\n").length : 0;

                  return (
                    <div
                      key={`q_${qIdx}`}
                      id={`mz-q-card-${qIdx}`}
                      className="mz-question-card"
                    >
                      {/* Question Header */}
                      <div
                        className="mz-question-card-header"
                        onClick={() => toggleQuestionCard(qIdx)}
                      >
                        <div className="mz-q-header-left">
                          <span className={`mz-q-circle-num ${q.status}`}>{qIdx + 1}</span>
                          <h4 className="mz-q-title-text">{q.title}</h4>
                          <span className={`mz-q-status-pill ${q.status}`}>
                            {q.status === "passed" ? (
                              <>
                                Passed <Check size={13} strokeWidth={2.8} />
                              </>
                            ) : q.status === "partial" ? (
                              <>Partially Passed</>
                            ) : q.status === "unanswered" ? (
                              <>Unanswered</>
                            ) : (
                              <>
                                Failed <X size={13} strokeWidth={2.8} />
                              </>
                            )}
                          </span>
                          <span className="mz-report-pill readonly" style={{ padding: "3px 9px", fontSize: "0.72rem" }}>
                            {q.difficulty || "Medium"}
                          </span>
                          <span className="mz-report-pill proctored" style={{ padding: "3px 9px", fontSize: "0.72rem" }}>
                            {displayedLang.toUpperCase()}
                          </span>
                        </div>

                        <div className="mz-q-header-right">
                          <span className="mz-q-marks-pill">
                            {q.marksObtained} / {q.totalMarks} Marks
                          </span>
                          <span className="mz-q-time-badge">
                            <Clock size={14} color="#64748b" /> {q.durationLabel}
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={18} color="#64748b" />
                          ) : (
                            <ChevronDown size={18} color="#64748b" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Question Body */}
                      {isExpanded && (
                        <div className="mz-question-card-body">
                          {/* 3-Column Execution Summary Row (Matching Reference Image Layout) */}
                          <div className="mz-q-three-col-grid">
                            <div className="mz-q-answer-panel">
                              <span className="mz-q-panel-label">Compilation & Runtime Status</span>
                              <div
                                className={`mz-q-answer-box ${
                                  q.compilationStatus === "Compiled Successfully"
                                    ? "correct"
                                    : q.isCodeEmpty
                                    ? ""
                                    : "wrong"
                                }`}
                              >
                                <div>{q.compilationStatus}</div>
                                <div
                                  style={{
                                    fontSize: "0.76rem",
                                    color: "var(--mz-text-secondary, #475569)",
                                    marginTop: 4,
                                    fontWeight: 600,
                                  }}
                                >
                                  Runtime: {q.runtimeMs}ms • Memory: {q.memoryMb} MB
                                </div>
                              </div>
                            </div>

                            <div className="mz-q-answer-panel">
                              <span className="mz-q-panel-label">Test Case Pass Ratio</span>
                              <div
                                className={`mz-q-answer-box ${
                                  q.passedTests === q.totalTests && q.totalTests > 0
                                    ? "correct"
                                    : q.passedTests > 0
                                    ? ""
                                    : "wrong"
                                }`}
                              >
                                <div>
                                  {q.passedTests} / {q.totalTests} Test Cases Passed
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.76rem",
                                    color: "var(--mz-text-secondary, #475569)",
                                    marginTop: 4,
                                    fontWeight: 600,
                                  }}
                                >
                                  Execution Outcome: {q.executionStatus}
                                </div>
                              </div>
                            </div>

                            <div
                              className={`mz-q-answer-panel ${
                                q.status === "passed"
                                  ? "explanation-green"
                                  : q.status === "partial"
                                  ? "explanation-amber"
                                  : "explanation-red"
                              }`}
                            >
                              <span className="mz-q-panel-label">Automated Code Review</span>
                              <div
                                style={{
                                  fontSize: "0.84rem",
                                  color: "var(--mz-text-primary, #1e293b)",
                                  lineHeight: 1.5,
                                }}
                              >
                                {q.isCodeEmpty
                                  ? "No executable solution was submitted for this problem."
                                  : q.status === "passed"
                                  ? `All ${q.totalTests} public and hidden test cases passed within time and memory limits.`
                                  : q.status === "partial"
                                  ? `Passed ${q.passedTests} of ${q.totalTests} test cases. Check boundary conditions on failed hidden test cases.`
                                  : q.compilationStatus === "Compilation Error"
                                  ? "Code failed syntax/compilation check before test execution."
                                  : "Solution output did not match expected test case assertions."}
                              </div>
                            </div>
                          </div>

                          {/* Problem Statement & Constraints */}
                          {q.description && (
                            <div className="mz-q-desc-box">
                              <div className="mz-q-section-title">
                                <Terminal size={14} color="#4F46E5" /> Problem Statement
                              </div>
                              <p className="mz-q-desc-p">{q.description}</p>
                              {Array.isArray(q.constraints) && q.constraints.length > 0 && (
                                <div style={{ marginTop: 10 }}>
                                  <div className="mz-q-section-title" style={{ marginBottom: 4 }}>
                                    Constraints
                                  </div>
                                  <ul
                                    style={{
                                      margin: 0,
                                      paddingLeft: 18,
                                      fontSize: "0.82rem",
                                      color: "var(--mz-text-secondary, #475569)",
                                    }}
                                  >
                                    {q.constraints.map((c, cIdx) => (
                                      <li key={cIdx}>{c}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Candidate Submitted Code Panel (Mandatory) */}
                          <div className="mz-report-code-wrap">
                            <div className="mz-report-code-header">
                              <div className="mz-report-code-lang">
                                <FileCode size={16} color="#4F46E5" />
                                <span>Candidate Submitted Code</span>
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: 6,
                                    background: "#EEF2FF",
                                    color: "#4F46E5",
                                    fontSize: "0.73rem",
                                    fontWeight: 800,
                                  }}
                                >
                                  {displayedLang.toUpperCase()}
                                </span>
                                {!q.isCodeEmpty && (
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "var(--mz-text-muted, #64748b)",
                                      fontWeight: 500,
                                    }}
                                  >
                                    • {lineCount} {lineCount === 1 ? "line" : "lines"} • Submitted{" "}
                                    {formatDateTime(q.submittedAt || submissionTime)}
                                  </span>
                                )}
                              </div>

                              {!q.isCodeEmpty && (
                                <div className="mz-report-code-actions mz-report-print-hide">
                                  <button
                                    type="button"
                                    className="mz-report-copy-btn"
                                    onClick={() => handleCopyCode(displayedCode, qIdx)}
                                  >
                                    {copiedQuestionIdx === qIdx ? (
                                      <>
                                        <Check size={13} color="#10b981" /> Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={13} /> Copy Code
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    className="mz-report-copy-btn"
                                    onClick={() =>
                                      handleDownloadCode(
                                        displayedCode,
                                        displayedLang,
                                        q.title,
                                        qIdx,
                                        activeProjFile?.path
                                          ? activeProjFile.path.replace(/\//g, "_")
                                          : null
                                      )
                                    }
                                  >
                                    <Download size={13} /> Download Code
                                  </button>

                                  <button
                                    type="button"
                                    className="mz-report-copy-btn"
                                    onClick={() =>
                                      setFullscreenCodeModal({
                                        title: q.title,
                                        code: displayedCode,
                                        language: displayedLang,
                                        filename: activeProjFile?.path || null,
                                      })
                                    }
                                  >
                                    <Maximize2 size={13} /> Fullscreen View
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Multi-file tabs for project reports */}
                            {projectFiles && projectFiles.length > 1 && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  padding: "8px 14px",
                                  background: "#f1f5f9",
                                  borderBottom: "1px solid #e2e8f0",
                                  overflowX: "auto",
                                }}
                              >
                                {projectFiles.map((pf, pfIdx) => (
                                  <button
                                    key={pf.path}
                                    type="button"
                                    onClick={() =>
                                      setSelectedProjectFileIdx((prev) => ({
                                        ...prev,
                                        [qIdx]: pfIdx,
                                      }))
                                    }
                                    style={{
                                      padding: "5px 11px",
                                      borderRadius: 6,
                                      border:
                                        activeProjFileIdx === pfIdx
                                          ? "1px solid #4F46E5"
                                          : "1px solid #cbd5e1",
                                      background:
                                        activeProjFileIdx === pfIdx ? "#EEF2FF" : "#ffffff",
                                      color:
                                        activeProjFileIdx === pfIdx ? "#4F46E5" : "#334155",
                                      fontSize: "0.76rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {pf.path}
                                  </button>
                                ))}
                              </div>
                            )}

                            {q.isCodeEmpty ? (
                              <div className="mz-empty-code-banner">
                                <AlertTriangle size={18} />
                                <span>No code submitted for this question.</span>
                              </div>
                            ) : (
                              <>
                                <div className="mz-monaco-screen-only" style={{ height: 270 }}>
                                  <Editor
                                    height="100%"
                                    language={
                                      displayedLang === "c++" || displayedLang === "cpp"
                                        ? "cpp"
                                        : displayedLang === "js"
                                        ? "javascript"
                                        : displayedLang === "py"
                                        ? "python"
                                        : displayedLang
                                    }
                                    theme={isDark ? "vs-dark" : "light"}
                                    value={displayedCode}
                                    options={{
                                      readOnly: true,
                                      domReadOnly: true,
                                      minimap: { enabled: false },
                                      fontSize: 13,
                                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                      lineNumbers: "on",
                                      scrollBeyondLastLine: false,
                                      wordWrap: "on",
                                      padding: { top: 12, bottom: 12 },
                                    }}
                                  />
                                </div>
                                <pre className="mz-print-code-only">{displayedCode}</pre>
                              </>
                            )}
                          </div>

                          {/* Test Case Execution Analysis Table (Mandatory) */}
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 10,
                                flexWrap: "wrap",
                                gap: 8,
                              }}
                            >
                              <div className="mz-q-section-title" style={{ margin: 0 }}>
                                <Cpu size={15} color="#4F46E5" /> Test Case Execution Analysis (
                                {q.passedTests}/{q.totalTests} Passed)
                              </div>
                              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                Click any row to expand full I/O & error diagnostics
                              </span>
                            </div>

                            <div
                              style={{
                                overflowX: "auto",
                                border: "1px solid #e2e8f0",
                                borderRadius: 12,
                              }}
                            >
                              <table className="mz-report-test-table">
                                <thead>
                                  <tr>
                                    <th>Test Case</th>
                                    <th>Type</th>
                                    <th>Input</th>
                                    <th>Expected Output</th>
                                    <th>Actual Output</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {q.testResults.map((tc, tIdx) => {
                                    const rowKey = `${qIdx}_${tIdx}`;
                                    const isRowOpen = Boolean(expandedTestRows[rowKey]);
                                    const isHidden = Boolean(tc.isHidden);
                                    const tcType = tc.category
                                      ? tc.category
                                      : isHidden
                                      ? tIdx >= q.testResults.length - 2
                                        ? "Edge Case"
                                        : "Hidden"
                                      : "Sample";
                                    return (
                                      <React.Fragment key={rowKey}>
                                        <tr onClick={() => toggleTestRow(rowKey)}>
                                          <td style={{ fontWeight: 700 }}>
                                            #{tc.testIndex || tc.testNumber || tIdx + 1}
                                          </td>
                                          <td>
                                            <span
                                              style={{
                                                fontSize: "0.72rem",
                                                fontWeight: 700,
                                                padding: "2px 8px",
                                                borderRadius: 6,
                                                background: isHidden ? "#f1f5f9" : "#eef2ff",
                                                color: isHidden ? "#475569" : "#4f46e5",
                                              }}
                                            >
                                              {tcType}
                                            </span>
                                          </td>
                                          <td
                                            style={{
                                              fontFamily: "'JetBrains Mono', monospace",
                                              fontSize: "0.78rem",
                                              maxWidth: 180,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {tc.input || "[Standard Input]"}
                                          </td>
                                          <td
                                            style={{
                                              fontFamily: "'JetBrains Mono', monospace",
                                              fontSize: "0.78rem",
                                              maxWidth: 180,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {tc.expected || tc.expectedOutput || "[Expected]"}
                                          </td>
                                          <td
                                            style={{
                                              fontFamily: "'JetBrains Mono', monospace",
                                              fontSize: "0.78rem",
                                              maxWidth: 180,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                              color: tc.passed ? "#059669" : "#dc2626",
                                              fontWeight: 600,
                                            }}
                                          >
                                            {tc.actual !== undefined && tc.actual !== null && String(tc.actual).length > 0
                                              ? String(tc.actual)
                                              : (tc.actualOutput !== undefined && tc.actualOutput !== null && String(tc.actualOutput).length > 0
                                                  ? String(tc.actualOutput)
                                                  : "(No output produced)")}
                                          </td>
                                          <td style={{ color: "var(--mz-text-muted, #64748b)", fontSize: "0.78rem" }}>
                                            {tc.durationMs ?? tc.duration ?? 0}ms
                                          </td>
                                          <td>
                                            <span
                                              className={`mz-report-test-badge ${
                                                tc.passed ? "pass" : "fail"
                                              }`}
                                            >
                                              {tc.passed ? (
                                                <>
                                                  <CheckCircle2 size={12} /> Passed
                                                </>
                                              ) : (
                                                <>
                                                  <XCircle size={12} /> Failed
                                                </>
                                              )}
                                            </span>
                                          </td>
                                        </tr>
                                        {isRowOpen && (
                                          <tr>
                                            <td
                                              colSpan={7}
                                              style={{
                                                background: "var(--mz-surface-subtle, #f8fafc)",
                                                padding: "12px 16px",
                                                borderBottom: "1px solid var(--mz-border, #e2e8f0)",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  display: "grid",
                                                  gridTemplateColumns:
                                                    "repeat(auto-fit, minmax(200px, 1fr))",
                                                  gap: 12,
                                                  fontSize: "0.78rem",
                                                  fontFamily: "'JetBrains Mono', monospace",
                                                }}
                                              >
                                                <div>
                                                  <strong style={{ color: "var(--mz-text-secondary, #475569)" }}>
                                                    Input:
                                                  </strong>
                                                  <pre
                                                    style={{
                                                      margin: "4px 0 0",
                                                      padding: 8,
                                                      background: "var(--mz-surface, #ffffff)",
                                                      borderRadius: 6,
                                                      border: "1px solid var(--mz-border, #e2e8f0)",
                                                      color: "var(--mz-text-primary, #0f172a)",
                                                      whiteSpace: "pre-wrap",
                                                    }}
                                                  >
                                                    {tc.input || "N/A"}
                                                  </pre>
                                                </div>
                                                <div>
                                                  <strong style={{ color: "var(--mz-text-secondary, #475569)" }}>
                                                    Expected Output:
                                                  </strong>
                                                  <pre
                                                    style={{
                                                      margin: "4px 0 0",
                                                      padding: 8,
                                                      background: "var(--mz-surface, #ffffff)",
                                                      borderRadius: 6,
                                                      border: "1px solid var(--mz-border, #e2e8f0)",
                                                      color: "var(--mz-text-primary, #0f172a)",
                                                      whiteSpace: "pre-wrap",
                                                    }}
                                                  >
                                                    {tc.expected || tc.expectedOutput || "N/A"}
                                                  </pre>
                                                </div>
                                                <div>
                                                  <strong style={{ color: "var(--mz-text-secondary, #475569)" }}>
                                                    Actual Output:
                                                  </strong>
                                                  <pre
                                                    style={{
                                                      margin: "4px 0 0",
                                                      padding: 8,
                                                      background: "var(--mz-surface, #ffffff)",
                                                      borderRadius: 6,
                                                      border: "1px solid var(--mz-border, #e2e8f0)",
                                                      whiteSpace: "pre-wrap",
                                                      color: tc.passed ? "#059669" : "#dc2626",
                                                    }}
                                                  >
                                                    {tc.actual || tc.actualOutput || "[Empty]"}
                                                  </pre>
                                                </div>
                                                {tc.error && (
                                                  <div>
                                                    <strong style={{ color: "#dc2626" }}>
                                                      Diagnostic / Error:
                                                    </strong>
                                                    <pre
                                                      style={{
                                                        margin: "4px 0 0",
                                                        padding: 8,
                                                        background: "#fef2f2",
                                                        borderRadius: 6,
                                                        border: "1px solid #fecaca",
                                                        color: "#b91c1c",
                                                        whiteSpace: "pre-wrap",
                                                      }}
                                                    >
                                                      {tc.error}
                                                    </pre>
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* =====================================================================
            TAB 2: CODE EXECUTION RESULTS (DEEP-DIVE CODE & RUNTIME MATRIX)
            ===================================================================== */}
        {activeTab === "code_execution" && (
          <section className="mz-report-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--mz-text-primary, #0f172a)" }}>
                  Code Execution & Runtime Telemetry
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "var(--mz-text-muted, #64748b)" }}>
                  Immutable source code snapshots, compiler verification, and test-suite execution logs.
                </p>
              </div>
              <span className="mz-report-pill proctored">
                Total Passed: {totalPassedTests} / {totalTestCases}
              </span>
            </div>

            {isMcqReport ? (
              <div style={{ padding: "24px", background: "var(--mz-surface-subtle, #f8fafc)", borderRadius: 12, color: "var(--mz-text-secondary, #475569)" }}>
                This was a Multiple-Choice Question (MCQ) examination. Switch to the{" "}
                <strong>Question-Wise Analysis</strong> tab to inspect your selected options and answer explanations.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {normalizedQuestions.map((q, qIdx) => (
                  <div
                    key={`exec_${qIdx}`}
                    style={{
                      border: "1px solid var(--mz-border, #e2e8f0)",
                      borderRadius: 16,
                      padding: 20,
                      background: "var(--mz-surface, #fcfdff)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 12,
                        marginBottom: 14,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={`mz-q-circle-num ${q.status}`}>{qIdx + 1}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--mz-text-primary, #0f172a)" }}>
                            {q.title}
                          </h4>
                          <span style={{ fontSize: "0.78rem", color: "var(--mz-text-muted, #64748b)" }}>
                            {q.compilationStatus} • {q.executionStatus} • Runtime: {q.runtimeMs}ms • Memory:{" "}
                            {q.memoryMb} MB
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {!q.isCodeEmpty && (
                          <button
                            type="button"
                            className="mz-report-copy-btn"
                            onClick={() =>
                              setFullscreenCodeModal({
                                title: q.title,
                                code: q.submittedCode,
                                language: q.language,
                              })
                            }
                          >
                            <Maximize2 size={13} /> Fullscreen Code View
                          </button>
                        )}
                        <span className={`mz-q-status-pill ${q.status}`}>
                          {q.passedTests}/{q.totalTests} Passed ({q.marksObtained}/{q.totalMarks} Marks)
                        </span>
                      </div>
                    </div>

                    {q.isCodeEmpty ? (
                      <div className="mz-empty-code-banner" style={{ borderRadius: 10 }}>
                        <AlertTriangle size={18} />
                        <span>No code submitted for this question.</span>
                      </div>
                    ) : (
                      <div className="mz-report-code-wrap" style={{ marginBottom: 16 }}>
                        <div style={{ height: 220 }}>
                          <Editor
                            height="100%"
                            language={q.language || "python"}
                            theme={isDark ? "vs-dark" : "light"}
                            value={q.submittedCode}
                            options={{
                              readOnly: true,
                              domReadOnly: true,
                              minimap: { enabled: false },
                              fontSize: 13,
                              lineNumbers: "on",
                              scrollBeyondLastLine: false,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =====================================================================
            TAB 3: PROCTORING AUDIT (HONEST TELEMETRY & VIOLATION TRACKING)
            ===================================================================== */}
        {activeTab === "audit" && (
          <section className="mz-report-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--mz-text-primary, #0f172a)" }}>
                  Proctoring & Environment Integrity Audit
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "var(--mz-text-muted, #64748b)" }}>
                  Hardware permission verification, violation chances, and session security events.
                </p>
              </div>

              <span
                className={`mz-report-pill ${
                  !proctoringTelemetryAvailable
                    ? "readonly"
                    : violationsCount === 0
                    ? "pass"
                    : violationsCount <= 2
                    ? "partial"
                    : "fail"
                }`}
              >
                <ShieldCheck size={14} />
                {!proctoringTelemetryAvailable
                  ? "Standard Sandbox Evaluation (No Proctoring Telemetry)"
                  : violationsCount === 0
                  ? "Verified Flawless"
                  : `${violationsCount} Interruption(s) Recorded`}
              </span>
            </div>

            <div className="mz-report-audit-grid">
              <div className="mz-audit-chances-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--mz-text-primary, #0f172a)" }}>
                    Violation Chances Used
                  </span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#4f46e5" }}>
                    {chancesUsed} / {proctoringAudit.maxChances || 5}
                  </span>
                </div>

                <div className="mz-audit-pills-row">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isConsumed = num <= chancesUsed;
                    return (
                      <div
                        key={num}
                        className={`mz-chance-pill-dot ${isConsumed ? "consumed" : "preserved"}`}
                      >
                        {isConsumed ? "✕" : "✓"}
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 6,
                  }}
                >
                  {[
                    {
                      label: "Webcam Feed",
                      ok: Boolean(
                        proctoringAudit.permissions?.camera || report.proctoringVerified?.camera
                      ),
                    },
                    {
                      label: "Microphone",
                      ok: Boolean(
                        proctoringAudit.permissions?.microphone ||
                          report.proctoringVerified?.microphone
                      ),
                    },
                    {
                      label: "Entire Screen",
                      ok: Boolean(
                        proctoringAudit.permissions?.screenShare ||
                          report.proctoringVerified?.screenShare
                      ),
                    },
                    {
                      label: "Fullscreen Lock",
                      ok: Boolean(
                        proctoringAudit.permissions?.fullscreen ||
                          report.proctoringVerified?.fullscreen
                      ),
                    },
                  ].map((hw, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 12px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      <span>{hw.label}</span>
                      <span style={{ color: hw.ok ? "#059669" : "#64748b", fontWeight: 700 }}>
                        {hw.ok ? "Verified" : "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mz-audit-chances-card">
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--mz-text-primary, #0f172a)" }}>
                  Chronological Session Event Log
                </span>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "var(--mz-surface-subtle, #f8fafc)",
                      borderRadius: 10,
                      border: "1px solid var(--mz-border, #e2e8f0)",
                      fontSize: "0.82rem",
                      color: "var(--mz-text-primary, #0f172a)",
                    }}
                  >
                    <strong>Assessment Started</strong> — {formatDateTime(startTime)}
                  </div>

                  {(proctoringAudit.violationsTimeline || proctoringAudit.events || []).map(
                    (ev, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "10px 14px",
                          background: "var(--mz-amber-bg, #fffbeb)",
                          borderRadius: 10,
                          border: "1px solid var(--mz-amber-border, #fde68a)",
                          color: "var(--mz-amber-text, #b45309)",
                          fontSize: "0.82rem",
                        }}
                      >
                        <strong>{(ev.type || "Event").replace(/_/g, " ").toUpperCase()}</strong>:{" "}
                        {ev.detail || ev.reason || "Logged event"} ({formatDateTime(ev.timestamp)})
                      </div>
                    )
                  )}

                  <div
                    style={{
                      padding: "10px 14px",
                      background: "var(--mz-green-bg, #ecfdf5)",
                      borderRadius: 10,
                      border: "1px solid var(--mz-green-border, #a7f3d0)",
                      fontSize: "0.82rem",
                      color: "var(--mz-green-text, #065f46)",
                    }}
                  >
                    <strong>Assessment Finalized & Locked</strong> — {formatDateTime(submissionTime)}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            TAB 4: PERFORMANCE INSIGHTS & RUBRIC BREAKDOWN
            ===================================================================== */}
        {activeTab === "insights" && (
          <section className="mz-report-card">
            <h3 style={{ margin: "0 0 6px", fontSize: "1.15rem", fontWeight: 800, color: "var(--mz-text-primary, #0f172a)" }}>
              Performance Insights & Engineering Recommendations
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: "0.88rem", color: "var(--mz-text-muted, #64748b)" }}>
              {evaluationFeedback.summary ||
                (isPass
                  ? "Strong technical execution and high problem-solving accuracy demonstrated across this assessment."
                  : "Review the failed test cases and edge-case constraints to improve your overall score.")}
            </p>

            {/* 100-Mark Project Rubric Breakdown (when Project Report) */}
            {isProjectReport && Array.isArray(report.rubricBreakdown) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                  marginBottom: 20,
                }}
              >
                {report.rubricBreakdown.map((r) => (
                  <div
                    key={r.key}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: "1px solid var(--mz-border, #e2e8f0)",
                      background: "var(--mz-surface-subtle, #f8fafc)",
                      color: "var(--mz-text-primary, #0f172a)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: 800,
                        fontSize: "0.86rem",
                        marginBottom: 6,
                      }}
                    >
                      <span>{r.label}</span>
                      <span style={{ color: "var(--mz-accent-indigo, #4f46e5)" }}>
                        {r.earnedMarks} / {r.maxMarks}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--mz-text-muted, #64748b)" }}>{r.details}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mz-report-feedback-grid">
              <div className="mz-feedback-box strength">
                <div className="mz-feedback-box-title">
                  <CheckCircle2 size={18} /> Strengths Demonstrated
                </div>
                <ul className="mz-feedback-list">
                  {(evaluationFeedback.strengths && evaluationFeedback.strengths.length > 0
                    ? evaluationFeedback.strengths
                    : [
                        `Completed ${questionsAttempted} of ${totalQuestions} assessment question(s).`,
                        `Achieved ${accuracy}% overall accuracy (${totalPassedTests}/${totalTestCases} test cases passed).`,
                      ]
                  ).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mz-feedback-box improvement">
                <div className="mz-feedback-box-title">
                  <Sparkles size={18} /> Optimization & Next Steps
                </div>
                <ul className="mz-feedback-list">
                  {(evaluationFeedback.improvements && evaluationFeedback.improvements.length > 0
                    ? evaluationFeedback.improvements
                    : [
                        "Verify time and space complexity bounds on large hidden inputs.",
                        "Practice additional challenges in the Mastery Zone Coding Arena.",
                      ]
                  ).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* =====================================================================
          FULLSCREEN CODE VIEW MODAL
          ===================================================================== */}
      {fullscreenCodeModal && (
        <div
          className="mz-code-fullscreen-overlay"
          onClick={() => setFullscreenCodeModal(null)}
        >
          <div
            className="mz-code-fullscreen-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mz-report-code-header" style={{ padding: "14px 20px" }}>
              <div className="mz-report-code-lang">
                <Code2 size={18} color="#4F46E5" />
                <span style={{ fontSize: "0.96rem", fontWeight: 800 }}>
                  {fullscreenCodeModal.title}
                </span>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: "#EEF2FF",
                    color: "#4F46E5",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  {(fullscreenCodeModal.language || "python").toUpperCase()}
                </span>
              </div>

              <div className="mz-report-code-actions">
                <button
                  type="button"
                  className="mz-report-copy-btn"
                  onClick={() => handleCopyCode(fullscreenCodeModal.code, "modal")}
                >
                  {copiedQuestionIdx === "modal" ? (
                    <>
                      <Check size={14} color="#10b981" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy Code
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="mz-report-copy-btn"
                  onClick={() =>
                    handleDownloadCode(
                      fullscreenCodeModal.code,
                      fullscreenCodeModal.language,
                      fullscreenCodeModal.title,
                      0,
                      fullscreenCodeModal.filename
                    )
                  }
                >
                  <Download size={14} /> Download
                </button>
                <button
                  type="button"
                  className="mz-report-copy-btn"
                  onClick={() => setFullscreenCodeModal(null)}
                >
                  <Minimize2 size={14} /> Close (ESC)
                </button>
              </div>
            </div>

            <div className="mz-code-fullscreen-body">
              <Editor
                height="100%"
                language={
                  fullscreenCodeModal.language === "c++" || fullscreenCodeModal.language === "cpp"
                    ? "cpp"
                    : fullscreenCodeModal.language === "js"
                    ? "javascript"
                    : fullscreenCodeModal.language === "py"
                    ? "python"
                    : fullscreenCodeModal.language || "python"
                }
                theme={isDark ? "vs-dark" : "light"}
                value={fullscreenCodeModal.code}
                options={{
                  readOnly: true,
                  domReadOnly: true,
                  minimap: { enabled: true },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineNumbers: "on",
                  wordWrap: "on",
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
