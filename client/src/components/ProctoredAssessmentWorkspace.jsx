import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AssessmentSecurityGate from "./AssessmentSecurityGate";
import useNavigationLock from "../hooks/useNavigationLock";
import "./proctoredAssessment.css";

// Functional icons from react-icons/lu
import {
  LuShield,
  LuCamera,
  LuMic,
  LuMonitor,
  LuMaximize,
  LuCheck,
  LuX,
  LuCircleAlert,
  LuTriangleAlert,
  LuClock,
  LuArrowLeft,
  LuArrowRight,
  LuRotateCcw,
  LuBookmark,
  LuBookmarkCheck,
  LuAward,
  LuCircleCheck,
  LuCircleX,
  LuTrophy,
  LuSparkles,
  LuFileText,
  LuSend,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";
const EXAM_DURATION_SECONDS = 1800; // Strict 30 Minutes

export default function ProctoredAssessmentWorkspace({
  module: propModule,
  subjectKey = "coding",
  trackId: propTrackId,
  onClose,
  onAssessmentCompleted,
  isStandalone = false,
}) {
  const navigate = useNavigate();
  const { trackId: paramTrackId, moduleId: paramModuleId } = useParams();

  const [module, setModule] = useState(propModule || null);
  const [loadingModule, setLoadingModule] = useState(!propModule);

  const tId = propTrackId || paramTrackId || module?.trackId || "python";
  const mIdx = module?.moduleIndex ?? (paramModuleId !== undefined ? parseInt(paramModuleId, 10) : 0);

  // Fetch module if standalone / not supplied via prop
  useEffect(() => {
    if (propModule) {
      setModule(propModule);
      setLoadingModule(false);
      return;
    }

    const token = localStorage.getItem("token");
    setLoadingModule(true);
    fetch(`${API_BASE}/api/coding/curriculum/${tId}/${mIdx}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setModule(data);
        }
      })
      .catch((err) => console.error("Failed to load proctored assessment module:", err))
      .finally(() => setLoadingModule(false));
  }, [propModule, tId, mIdx]);

  // Check if this assessment has already been submitted for current user account
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    let uId = "";
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        uId = u._id || u.id || u.userId || "";
      } catch {}
    }
    const userSubmittedKey = uId ? `mz_${uId}_exam_${subjectKey}_${tId}_${mIdx}_submitted` : `mz_exam_${mIdx}_submitted`;
    if (localStorage.getItem(userSubmittedKey) === "true") {
      const repUrl = localStorage.getItem(`${userSubmittedKey}_report_url`);
      if (repUrl) {
        toast.info("This accreditation assessment has already been completed and submitted.", { toastId: "assessment_already_submitted" });
        navigate(repUrl, { replace: true });
      }
    }

    const handlePopState = () => {
      if (localStorage.getItem(userSubmittedKey) === "true") {
        const repUrl = localStorage.getItem(`${userSubmittedKey}_report_url`) || "/home";
        navigate(repUrl, { replace: true });
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [subjectKey, tId, mIdx, navigate]);

  // Assessment workflow stages: "gate", "active", "results"
  const [stage, setStage] = useState("gate");

  // Media & Device Streams
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [micActive, setMicActive] = useState(false);
  const [micStream, setMicStream] = useState(null);
  const [micVolume, setMicVolume] = useState(0);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [displaySurface, setDisplaySurface] = useState("monitor");
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [gateError, setGateError] = useState("");

  // Media element refs
  const examCameraRef = useRef(null);
  const examScreenRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  // Active Exam States
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState({ 0: true });
  const [timeRemaining, setTimeRemaining] = useState(EXAM_DURATION_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock browser back / horizontal trackpad swipe navigation during active proctored assessment
  useNavigationLock(
    stage === "active" && !isSubmitting,
    "An active proctored assessment is in progress. Leaving this page will trigger an assessment violation. Are you sure you want to exit?"
  );

  // 5 Violation Chances System
  const [violationsCount, setViolationsCount] = useState(0);
  const [violationsLog, setViolationsLog] = useState([]);
  const [isViolationOverlayOpen, setIsViolationOverlayOpen] = useState(false);
  const [violationMessage, setViolationMessage] = useState("");
  const [isTerminated, setIsTerminated] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);

  // Anti-loop refs
  const violationCooldownRef = useRef(false);
  const lastResumeTimeRef = useRef(Date.now());
  const examTimerRef = useRef(null);
  const isSubmittedRef = useRef(false);
  const immunityUntilRef = useRef(Date.now() + 1500);
  const isReverifyingRef = useRef(false);
  const isViolationOverlayOpenRef = useRef(false);

  useEffect(() => {
    isViolationOverlayOpenRef.current = isViolationOverlayOpen;
  }, [isViolationOverlayOpen]);

  // Results State
  const [resultsData, setResultsData] = useState(null);

  const sessionStorageKey = `mz_exam_session_${subjectKey}_${tId}_${mIdx}`;

  // Safe question extract
  useEffect(() => {
    const rawQuestions =
      module?.assessment?.questions ||
      module?.questions ||
      module?.safeQuestions ||
      [];
    setQuestions(rawQuestions);
  }, [module]);

  // Clean up all streams, audio contexts, and exit fullscreen immediately
  const cleanUpMediaStreams = useCallback(() => {
    isSubmittedRef.current = true;
    if (cameraStream) {
      try {
        cameraStream.getTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
        });
      } catch {}
    }
    if (micStream) {
      try {
        micStream.getTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
        });
      } catch {}
    }
    if (screenStream) {
      try {
        screenStream.getTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
        });
      } catch {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch {}
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        const exitFn =
          document.exitFullscreen ||
          document.webkitExitFullscreen ||
          document.mozCancelFullScreen ||
          document.msExitFullscreen;
        if (exitFn) {
          exitFn.call(document).catch(() => {});
        }
      }
    } catch {}
    setFullscreenActive(false);
  }, [cameraStream, micStream, screenStream]);

  useEffect(() => {
    return () => {
      cleanUpMediaStreams();
      if (examTimerRef.current) clearInterval(examTimerRef.current);
    };
  }, [cleanUpMediaStreams]);

  // Connect camera stream to preview video
  useEffect(() => {
    if (cameraStream && examCameraRef.current) {
      examCameraRef.current.srcObject = cameraStream;
      examCameraRef.current.play().catch(() => {});
    }
  }, [cameraStream, stage]);

  // Connect screen share stream to preview video
  useEffect(() => {
    if (screenStream && examScreenRef.current) {
      examScreenRef.current.srcObject = screenStream;
      examScreenRef.current.play().catch(() => {});
    }
  }, [screenStream, stage]);

  // Track visited questions as candidate navigates
  useEffect(() => {
    setVisitedQuestions((prev) => ({
      ...prev,
      [currentQIndex]: true,
    }));
  }, [currentQIndex]);

  // -------------------------------------------------------------
  // PROCTORING EVENT LISTENERS & 5-CHANCE VIOLATION SYSTEM
  // -------------------------------------------------------------
  const logViolation = useCallback(
    (type, detail) => {
      if (
        isSubmittedRef.current ||
        isTerminated ||
        violationCooldownRef.current ||
        isViolationOverlayOpenRef.current ||
        isReverifyingRef.current ||
        Date.now() < immunityUntilRef.current
      ) {
        return;
      }

      violationCooldownRef.current = true;
      setTimeout(() => {
        violationCooldownRef.current = false;
      }, 2000);

      isViolationOverlayOpenRef.current = true;

      const entry = {
        type: detail || type,
        timestamp: new Date().toLocaleTimeString(),
      };

      setViolationsCount((prev) => {
        const next = prev + 1;
        setViolationsLog((pl) => [entry, ...pl]);
        setViolationMessage(detail);

        if (next >= 5) {
          setIsTerminated(true);
          setIsViolationOverlayOpen(true);
          toast.error("All 5 proctoring violation chances exhausted! Submitting exam now...");
          setTimeout(() => {
            handleSubmitExam();
          }, 2500);
        } else {
          setIsViolationOverlayOpen(true);
          toast.warn(`Proctoring alert: ${detail} (Violation ${next}/5)`);
        }
        return next;
      });
    },
    [isTerminated]
  );

  useEffect(() => {
    if (stage !== "active" || isSubmittedRef.current || isTerminated) return;

    const handleVisibilityChange = () => {
      if (
        isSubmittedRef.current ||
        isTerminated ||
        isViolationOverlayOpenRef.current ||
        isReverifyingRef.current ||
        Date.now() < immunityUntilRef.current
      ) return;

      if (document.hidden) {
        logViolation("TAB_SWITCH", "Assessment window lost focus or switched tabs.");
      }
    };

    const handleWindowBlur = () => {
      if (
        isSubmittedRef.current ||
        isTerminated ||
        isViolationOverlayOpenRef.current ||
        isReverifyingRef.current ||
        Date.now() < immunityUntilRef.current
      ) return;

      logViolation("SCREEN_SWITCH", "Screen switch or window blur detected. Navigating away from the proctored test environment is prohibited.");
    };

    const handleFullscreenChange = () => {
      if (
        isSubmittedRef.current ||
        isTerminated ||
        isViolationOverlayOpenRef.current ||
        isReverifyingRef.current ||
        Date.now() < immunityUntilRef.current
      ) return;

      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        logViolation("FULLSCREEN_EXIT", "Assessment exited edge-to-edge fullscreen mode.");
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Leaving or refreshing will consume one of your 5 violation chances. Are you sure?";
      return e.returnValue;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [stage, isTerminated, logViolation]);

  // -------------------------------------------------------------
  // START ASSESSMENT (DIRECT FROM SECURITY GATE)
  // -------------------------------------------------------------
  const handleStartAssessmentDirect = async (gateData) => {
    setGateError("");
    const token = localStorage.getItem("token");

    try {
      if (token) {
        await fetch(`${API_BASE}/api/curriculum/proctoring/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subjectKey,
            trackId: tId,
            moduleIndex: mIdx,
            cameraVerified: true,
            micVerified: true,
            screenShareVerified: true,
            displaySurface: gateData?.displaySurface || "monitor",
            fullscreenVerified: true,
          }),
        }).catch(() => {});
      }

      setStage("active");
      setCurrentQIndex(0);
      setAnswers({});
      setMarkedForReview({});
      setVisitedQuestions({ 0: true });
      setTimeRemaining(EXAM_DURATION_SECONDS);
      lastResumeTimeRef.current = Date.now();
      immunityUntilRef.current = Date.now() + 1500;

      // Request true browser fullscreen so no background page is visible
      try {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen().catch(() => {});
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen().catch(() => {});
          }
        }
      } catch { /* fullscreen may be denied on some browsers */ }

      // Wire up real-time mic volume analysis from the gate's mic stream
      if (gateData?.micStream) {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(gateData.micStream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const pollMic = () => {
              if (!audioContextRef.current || audioContextRef.current.state === "closed") return;
              analyser.getByteFrequencyData(dataArray);
              const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
              const vol = Math.min(100, Math.round((avg / 255) * 100 * 3));
              setMicVolume(vol);
              animFrameRef.current = requestAnimationFrame(pollMic);
            };
            animFrameRef.current = requestAnimationFrame(pollMic);
          }
        } catch { /* audio context setup failed */ }
      }

      // Start 30-Minute countdown timer
      if (examTimerRef.current) clearInterval(examTimerRef.current);
      examTimerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(examTimerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast.info("10-Question proctored assessment commenced. Strict 30-minute limit active!");
    } catch (err) {
      setGateError(err.message);
      toast.error(err.message || "Failed to start assessment");
    }
  };

  // -------------------------------------------------------------
  // EXAM ANSWERING & REVIEW CONTROLS
  // -------------------------------------------------------------
  const handleSelectOption = (optIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQIndex]: optIndex,
    }));
  };

  const handleToggleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const next = { ...prev };
      if (next[currentQIndex]) {
        delete next[currentQIndex];
        toast.info(`Question ${currentQIndex + 1} unmarked from review.`);
      } else {
        next[currentQIndex] = true;
        toast.info(`Question ${currentQIndex + 1} marked for review.`);
      }
      return next;
    });
  };

  const handleAutoSubmit = () => {
    toast.warn("Exam timer expired! Automatically submitting your answers now...");
    handleSubmitExam();
  };

  // -------------------------------------------------------------
  // SUBMISSION & RESULTS EVALUATION
  // -------------------------------------------------------------
  const handleSubmitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsConfirmSubmitOpen(false);
    isSubmittedRef.current = true;
    if (examTimerRef.current) clearInterval(examTimerRef.current);

    cleanUpMediaStreams();

    const token = localStorage.getItem("token");
    const timeSpent = Math.max(1, EXAM_DURATION_SECONDS - timeRemaining);

    try {
      const res = await fetch(`${API_BASE}/api/curriculum/assessment/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectKey,
          trackId: tId,
          moduleIndex: mIdx,
          answers,
          timeSpentSeconds: timeSpent,
          violationsCount,
          violationsLog,
          proctoringVerified: {
            camera: true,
            microphone: true,
            screenShare: true,
            displaySurface,
            fullscreen: true,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      const resolvedSessionId = data.sessionId || (data.attemptId ? `attempt_${data.attemptId}` : `mz_mcq_${Date.now()}`);

      // Cache report locally for instant offline availability and resilience strictly scoped to logged-in user
      try {
        const rawUser = localStorage.getItem("user");
        let uId = "";
        if (rawUser) {
          const u = JSON.parse(rawUser);
          uId = u._id || u.id || u.userId || "";
        }
        const reportsKey = uId ? `mz_${uId}_assessment_reports` : "mz_assessment_reports";
        const existing = JSON.parse(localStorage.getItem(reportsKey) || "[]");
        const newRecord = {
          id: data.attemptId || resolvedSessionId,
          sessionId: resolvedSessionId,
          attemptId: data.attemptId,
          subjectKey,
          trackId: tId,
          moduleIndex: mIdx,
          assessmentTitle: `${module?.title || "Module"} — Proctored Accreditation Exam`,
          questionTitle: module?.title || "Accreditation Examination",
          type: "mcq_exam",
          typeLabel: `${data.totalQuestions || questions.length || 10}-MCQ Proctored Exam`,
          score: data.marksObtained ?? data.score ?? 0,
          marksObtained: data.marksObtained ?? data.score ?? 0,
          totalMarks: data.totalMarks ?? (data.totalQuestions || questions.length || 10),
          percentage: data.percentage ?? 0,
          grade: data.grade || (data.percentage >= 90 ? "A+" : data.percentage >= 80 ? "A" : data.percentage >= 70 ? "B" : data.percentage >= 60 ? "C" : "F"),
          accuracy: data.accuracy ?? data.percentage ?? 0,
          totalQuestions: data.totalQuestions || questions.length || 10,
          questionsAttempted: data.questionsAttempted ?? Object.keys(answers).length,
          questionsUnanswered: data.questionsUnanswered ?? Math.max(0, (data.totalQuestions || questions.length || 10) - Object.keys(answers).length),
          durationSeconds: timeSpent,
          passed: Boolean(data.passed),
          violationsCount,
          submittedAt: new Date().toISOString(),
          reviewBreakdown: data.reviewBreakdown || [],
          reportUrl: `/assessment-report/${resolvedSessionId}`,
        };
        const updated = [newRecord, ...existing.filter((r) => r.sessionId !== resolvedSessionId && r.attemptId !== data.attemptId)];
        localStorage.setItem(reportsKey, JSON.stringify(updated.slice(0, 30)));

        // Record per-account assessment submission lock
        const userSubmittedKey = uId ? `mz_${uId}_exam_${subjectKey}_${tId}_${mIdx}_submitted` : `mz_exam_${mIdx}_submitted`;
        localStorage.setItem(userSubmittedKey, "true");
        localStorage.setItem(`${userSubmittedKey}_report_url`, `/assessment-report/${resolvedSessionId}`);
      } catch (e) {
        console.warn("Could not cache report locally:", e);
      }

      setResultsData({
        ...data,
        sessionId: resolvedSessionId,
        score: data.score ?? 0,
        marksObtained: data.marksObtained ?? data.score ?? 0,
        totalMarks: data.totalMarks ?? (data.totalQuestions || questions.length || 10),
        percentage: data.percentage ?? 0,
        totalQuestions: data.totalQuestions ?? questions.length ?? 10,
        questionsAttempted: data.questionsAttempted ?? Object.keys(answers).length,
        questionsUnanswered: data.questionsUnanswered ?? Math.max(0, (data.totalQuestions || questions.length || 10) - Object.keys(answers).length),
        accuracy: data.accuracy ?? 0,
        grade: data.grade || (data.percentage >= 90 ? "A+" : data.percentage >= 80 ? "A" : data.percentage >= 70 ? "B" : data.percentage >= 60 ? "C" : "F"),
        reviewBreakdown: data.reviewBreakdown ?? [],
        timeSpentSeconds: timeSpent,
        violationsCount,
        submittedAt: new Date().toISOString(),
      });
      setStage("results");

      if (data.passed) {
        toast.success(data.message || `Congratulations! Passed with ${data.percentage}%!`, {
          toastId: "mcq_submit_result",
        });
      } else {
        toast.warn(data.message || `Score: ${data.percentage}%. Minimum 80% needed to pass.`, {
          toastId: "mcq_submit_result",
        });
      }

      if (onAssessmentCompleted) {
        onAssessmentCompleted(data);
      }
    } catch (err) {
      toast.error("Failed to submit assessment to server: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentQIndex] || null;
  const answeredCount = Object.keys(answers).length;
  const chancesRemaining = Math.max(0, 5 - violationsCount);

  // =============================================================
  // STAGE 1: ASSESSMENT SECURITY GATE
  // =============================================================
  const handleClose = () => {
    cleanUpMediaStreams();
    if (onClose) onClose();
    if (isStandalone || !propModule) {
      if (window.opener) {
        window.close();
      } else {
        navigate("/coding", { replace: true });
      }
    }
  };

  if (loadingModule || !module) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#0d1117",
          color: "#94a3b8",
          fontFamily: "'Inter', sans-serif",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #3b82f6",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ fontSize: "14px", fontWeight: 500 }}>Initializing Proctored Security Gate...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (stage === "gate") {
    return (
      <AssessmentSecurityGate
        assessmentTitle={`${module?.title || "Module"} — 10-Question Proctored Exam`}
        timeLimitMinutes={30}
        onCancel={handleClose}
        onStartAssessment={async (gateData) => {
          setCameraStream(gateData.cameraStream);
          setCameraActive(true);
          setMicStream(gateData.micStream);
          setMicActive(true);
          setScreenStream(gateData.screenStream);
          setScreenShareActive(true);
          setDisplaySurface(gateData.displaySurface || "monitor");
          setFullscreenActive(true);

          await handleStartAssessmentDirect(gateData);
        }}
      />
    );
  }

  return (
    <div className="mz-proc-overlay" style={{ zIndex: 100000 }}>
      <div className="mz-proc-container">
        {/* =====================================================
            STAGE 2: ACTIVE PROCTORED EXAM WORKSPACE
            ===================================================== */}
        {stage === "active" && (
          <div className="mz-exam-workspace">
            {/* Top Bar */}
            <div className="mz-exam-topbar">
              <div className="mz-exam-topbar-left">
                <span className="mz-exam-badge-proctoring">
                  <span className="mz-exam-pulse-dot" /> LIVE PROCTORED EXAM
                </span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                  {module.title}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Question {currentQIndex + 1} of {questions.length} • {answeredCount}/{questions.length} Answered
                </span>
                <div className={`mz-exam-timer-box ${timeRemaining < 300 ? "urgent" : ""}`} title="30-Minute Strict Exam Limit">
                  <LuClock size={16} />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              </div>
            </div>

            {/* Violation Overlay Modal */}
            {isViolationOverlayOpen && (
              <div className="mz-exam-violation-overlay">
                <div className="mz-violation-card">
                  <LuTriangleAlert size={44} color="#ef4444" />
                  <h3>Proctoring Interruption Detected</h3>
                  <p>{violationMessage}</p>
                  <p style={{ fontSize: "13px", color: "#475569", marginTop: "8px" }}>
                    Remaining violation chances: <strong>{chancesRemaining}/5</strong>.
                    {isTerminated && " All chances consumed. Automatically submitting examination."}
                  </p>
                  {!isTerminated && (
                    <button
                      type="button"
                      className="mz-gate-start-btn"
                      style={{ marginTop: 16 }}
                      onClick={async () => {
                        isReverifyingRef.current = true;
                        immunityUntilRef.current = Date.now() + 25000;
                        try {
                          // Check camera stream
                          if (!cameraStream || !cameraStream.active) {
                            try {
                              const cStream = await navigator.mediaDevices.getUserMedia({
                                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                                audio: true,
                              });
                              setCameraStream(cStream);
                            } catch {}
                          }

                          // Check screen stream
                          if (!screenStream || !screenStream.active) {
                            try {
                              const sStream = await navigator.mediaDevices.getDisplayMedia({
                                video: { displaySurface: "monitor" },
                                audio: false,
                              });
                              setScreenStream(sStream);
                            } catch {}
                          }

                          // Request fullscreen
                          if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                            if (document.documentElement.requestFullscreen) {
                              await document.documentElement.requestFullscreen().catch(() => {});
                            } else if (document.documentElement.webkitRequestFullscreen) {
                              await document.documentElement.webkitRequestFullscreen().catch(() => {});
                            }
                          }
                        } catch {}
                        lastResumeTimeRef.current = Date.now();
                        immunityUntilRef.current = Date.now() + 1500;
                        setIsViolationOverlayOpen(false);
                        isViolationOverlayOpenRef.current = false;
                        isReverifyingRef.current = false;
                      }}
                    >
                      Resume Exam Session ({chancesRemaining} Chances Left)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Submit Confirmation Modal */}
            {isConfirmSubmitOpen && (
              <div className="mz-exam-violation-overlay">
                <div className="mz-violation-card" style={{ borderColor: "#3b82f6" }}>
                  <LuCircleCheck size={40} color="#3b82f6" />
                  <h3 style={{ color: "#0f172a" }}>Confirm Exam Submission</h3>
                  <p style={{ color: "#334155", fontSize: "14px" }}>
                    You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
                    {Object.keys(markedForReview).length > 0 && (
                      <span style={{ color: "#7c3aed", display: "block", marginTop: "6px" }}>
                        ★ {Object.keys(markedForReview).length} question(s) currently marked for review.
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: "12.5px", color: "#64748b" }}>
                    Once submitted, your answers will be permanently graded and saved to your audit report.
                  </p>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
                    <button
                      type="button"
                      className="mz-exam-nav-btn"
                      onClick={() => setIsConfirmSubmitOpen(false)}
                    >
                      Continue Answering
                    </button>
                    <button
                      type="button"
                      className="mz-exam-submit-btn"
                      onClick={handleSubmitExam}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Scoring..." : "Yes, Submit Exam"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Content Grid: Left HUD + Right Questions */}
            <div className="mz-exam-content-grid">
              {/* Left HUD Column */}
              <div className="mz-exam-hud-column">
                {/* 5 Chances Violation Meter */}
                <div className="mz-exam-chances-meter">
                  <div className="mz-chances-label-row">
                    <span>Violation Chances</span>
                    <span style={{ color: chancesRemaining > 1 ? "#10b981" : "#ef4444" }}>
                      {chancesRemaining}/5 Remaining
                    </span>
                  </div>
                  <div className="mz-chances-pills">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div
                        key={idx}
                        className={`mz-chance-pill ${idx > chancesRemaining ? "consumed" : ""}`}
                        title={`Chance ${idx}: ${idx > chancesRemaining ? "Used" : "Available"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Candidate Feed */}
                <div className="mz-exam-hud-card">
                  <div className="mz-exam-hud-card-title">
                    <span>CANDIDATE FEED</span>
                    <span style={{ color: "#ef4444" }}>● LIVE</span>
                  </div>
                  <div className="mz-exam-stream-box">
                    <video ref={examCameraRef} autoPlay playsInline muted />
                  </div>
                </div>

                {/* Live Screen Mirror */}
                <div className="mz-exam-hud-card">
                  <div className="mz-exam-hud-card-title">
                    <span>DISPLAY MIRROR</span>
                    <span style={{ color: "#10b981" }}>MONITORED</span>
                  </div>
                  <div className="mz-exam-stream-box">
                    <video ref={examScreenRef} autoPlay playsInline muted />
                  </div>
                </div>

                {/* Mic Telemetry */}
                <div className="mz-exam-hud-card">
                  <div className="mz-exam-hud-card-title">
                    <span>MIC TELEMETRY</span>
                    <span>{micVolume}%</span>
                  </div>
                  <div className="mz-gate-audio-track">
                    <div className="mz-gate-audio-fill" style={{ width: `${micVolume}%` }} />
                  </div>
                </div>

                {/* Security Log */}
                <div className="mz-exam-hud-card">
                  <div className="mz-exam-hud-card-title">
                    <span>SECURITY AUDIT</span>
                    <span style={{ color: violationsCount > 0 ? "#ef4444" : "#10b981" }}>
                      {violationsCount} Flags
                    </span>
                  </div>
                  <div className="mz-exam-log-scroll">
                    <div className="mz-exam-log-entry">Session started (30m limit)</div>
                    <div className="mz-exam-log-entry">Surface: {displaySurface}</div>
                    {violationsLog.map((v, i) => (
                      <div key={i} className="mz-exam-log-entry warn">
                        [{v.timestamp}] {v.type}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Exam Questions Column */}
              <div className="mz-exam-question-column">
                <div>
                  <div className="mz-exam-q-header">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="mz-exam-q-category">
                        QUESTION {currentQIndex + 1} OF {questions.length}
                      </div>
                      {markedForReview[currentQIndex] && (
                        <span style={{ background: "rgba(139, 92, 246, 0.2)", color: "#c4b5fd", border: "1px solid rgba(139, 92, 246, 0.4)", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
                          ★ Marked for Review
                        </span>
                      )}
                    </div>
                    <h2 className="mz-exam-q-statement">
                      {currentQuestion ? currentQuestion.question : "Loading question..."}
                    </h2>
                  </div>

                  {/* 4 Options Grid */}
                  <div className="mz-exam-options-grid">
                    {currentQuestion?.options?.map((opt, optIdx) => {
                      const isSelected = answers[currentQIndex] === optIdx;
                      const letter = String.fromCharCode(65 + optIdx);
                      return (
                        <div
                          key={optIdx}
                          className={`mz-exam-option-card ${isSelected ? "selected" : ""}`}
                          onClick={() => handleSelectOption(optIdx)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="mz-exam-option-letter">{letter}</div>
                          <div className="mz-exam-option-text">{opt}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Navigation & Question Palette */}
                <div>
                  {/* Question Palette Legend */}
                  <div className="mz-exam-palette-legend">
                    <span className="mz-legend-item">
                      <span className="mz-legend-dot answered" /> Answered
                    </span>
                    <span className="mz-legend-item">
                      <span className="mz-legend-dot not-answered" /> Not Answered
                    </span>
                    <span className="mz-legend-item">
                      <span className="mz-legend-dot marked" /> Marked for Review
                    </span>
                    <span className="mz-legend-item">
                      <span className="mz-legend-dot not-visited" /> Not Visited
                    </span>
                  </div>

                  {/* 4-State Question Palette */}
                  <div className="mz-exam-palette">
                    {questions.map((_, idx) => {
                      const isCurrent = currentQIndex === idx;
                      const isMarked = Boolean(markedForReview[idx]);
                      const isAnswered = answers[idx] !== undefined;
                      const isVisited = Boolean(visitedQuestions[idx]);

                      let statusClass = "unvisited";
                      if (isMarked) statusClass = "marked";
                      else if (isAnswered) statusClass = "answered";
                      else if (isVisited) statusClass = "not-answered";

                      return (
                        <button
                          type="button"
                          key={idx}
                          className={`mz-exam-palette-btn ${statusClass} ${isCurrent ? "current" : ""}`}
                          onClick={() => setCurrentQIndex(idx)}
                          title={`Q${idx + 1}: ${
                            isMarked
                              ? "Marked for Review"
                              : isAnswered
                              ? "Answered"
                              : isVisited
                              ? "Not Answered"
                              : "Not Visited"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Action Bar */}
                  <div className="mz-exam-actions-bar">
                    <button
                      type="button"
                      className="mz-exam-nav-btn"
                      disabled={currentQIndex === 0}
                      onClick={() => setCurrentQIndex((prev) => prev - 1)}
                    >
                      <LuArrowLeft size={16} /> Previous
                    </button>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <button
                        type="button"
                        className={`mz-exam-review-btn ${markedForReview[currentQIndex] ? "active" : ""}`}
                        onClick={handleToggleMarkForReview}
                        title="Mark / Unmark this question for later review"
                      >
                        {markedForReview[currentQIndex] ? <LuBookmarkCheck size={16} /> : <LuBookmark size={16} />}
                        <span>{markedForReview[currentQIndex] ? "Marked for Review" : "Save for Review"}</span>
                      </button>

                      {currentQIndex < questions.length - 1 ? (
                        <button
                          type="button"
                          className="mz-exam-nav-btn"
                          onClick={() => setCurrentQIndex((prev) => prev + 1)}
                        >
                          Next <LuArrowRight size={16} />
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="mz-exam-submit-btn"
                        disabled={isSubmitting}
                        onClick={() => setIsConfirmSubmitOpen(true)}
                      >
                        <LuSend size={14} />
                        <span>Submit Exam ({answeredCount}/{questions.length})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            STAGE 3: DETAILED RESULTS & COMPREHENSIVE AUDIT POPUP
            ===================================================== */}
        {stage === "results" && resultsData && (() => {
          const totalQ = resultsData.totalQuestions || questions.length || 10;
          const scoreCorrect = resultsData.score || 0;
          const unansweredCount = resultsData.reviewBreakdown?.filter(q => q.userSelected === null || q.userSelected === undefined).length ?? (totalQ - Object.keys(answers).length);
          const incorrectCount = Math.max(0, totalQ - scoreCorrect - unansweredCount);
          const attemptedCount = Object.keys(answers).length;
          const accuracyPct = Math.round((scoreCorrect / Math.max(1, attemptedCount)) * 100);
          const isPass = Boolean(resultsData.passed || resultsData.percentage >= 80);

          return (
            <div className="mz-results-container">
              {/* Outcome Banner */}
              <div className={`mz-results-banner ${isPass ? "passed" : "failed"}`}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: isPass ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)", padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase" }}>
                    <LuAward size={13} /> {isPass ? "Verified Passing Mark (≥80%)" : "Retake Required (<80%)"}
                  </div>
                  <h2 style={{ margin: "0 0 6px 0", fontSize: "24px", color: isPass ? "#065f46" : "#991b1b", fontWeight: "800" }}>
                    {isPass ? "🏆 Examination Passed & Verified!" : "⚠️ Examination Needs Improvement"}
                  </h2>
                  <p style={{ margin: 0, fontSize: "14px", color: isPass ? "#047857" : "#b91c1c" }}>
                    {resultsData.message || (isPass ? "Excellent performance! You have cleared this module's accreditation examination." : "You did not achieve the required 80% passing mark. Review the explanations below and retake.")}
                  </p>
                </div>

                <div className="mz-results-score-box">
                  <span className="mz-results-score-big">{resultsData.percentage}%</span>
                  <span className="mz-results-score-denom">
                    ({scoreCorrect}/{totalQ} Correct)
                  </span>
                </div>
              </div>

              {/* 8 Comprehensive Key Metrics Cards */}
              <div className="mz-results-metrics-grid">
                <div className="mz-metric-stat-card">
                  <span className="mz-metric-stat-val blue">{totalQ}</span>
                  <span className="mz-metric-stat-lbl">Total Questions</span>
                </div>
                <div className="mz-metric-stat-card">
                  <span className="mz-metric-stat-val blue">{attemptedCount} / {totalQ}</span>
                  <span className="mz-metric-stat-lbl">Attempted</span>
                </div>
                <div className="mz-metric-stat-card">
                  <span className="mz-metric-stat-val green">{scoreCorrect}</span>
                  <span className="mz-metric-stat-lbl">Correct Answers</span>
                </div>
                <div className="mz-metric-stat-card">
                  <span className="mz-metric-stat-val red">{incorrectCount}</span>
                  <span className="mz-metric-stat-lbl">Incorrect</span>
                </div>
                <div className="mz-metric-stat-card">
                  <span className="mz-metric-stat-val" style={{ color: "#f59e0b" }}>{unansweredCount}</span>
                  <span className="mz-metric-stat-lbl">Unanswered</span>
                </div>
                <div className="mz-metric-stat-card">
                  <span className={`mz-metric-stat-val ${isPass ? "green" : "red"}`}>
                    {resultsData.percentage}%
                  </span>
                  <span className="mz-metric-stat-lbl">Total Score</span>
                </div>
                <div className="mz-metric-stat-card">
                  <span className="mz-metric-stat-val green">{accuracyPct}%</span>
                  <span className="mz-metric-stat-lbl">Accuracy Rate</span>
                </div>
                <div className="mz-metric-stat-card">
                  <span className="mz-metric-stat-val blue">
                    {formatTime(resultsData.timeSpentSeconds || 60)}
                  </span>
                  <span className="mz-metric-stat-lbl">Time Taken</span>
                </div>
                <div className="mz-metric-stat-card">
                  <span className="mz-metric-stat-val green">
                    {5 - Math.min(5, violationsCount)}/5
                  </span>
                  <span className="mz-metric-stat-lbl">Proctoring Integrity</span>
                </div>
              </div>

              {/* Performance Analysis & Actionable Suggestions */}
              <div className="mz-results-analysis-card">
                <h4>
                  <LuSparkles size={18} />
                  <span>Performance Analysis & Improvement Recommendations</span>
                </h4>
                <p>
                  {isPass
                    ? `Outstanding command! You achieved an accuracy rate of ${accuracyPct}% with ${scoreCorrect} correct answers out of ${totalQ}. Your proctoring record satisfied all integrity rules. This module has been verified, your progress is updated, and the next curriculum module is now unlocked!`
                    : `Your score of ${resultsData.percentage}% is below the mandatory 80% passing threshold. To achieve accreditation, review the full-screen concept notes for this module, focus on the missed questions detailed below, and retake the exam when ready.`}
                </p>
                <div style={{ marginTop: "10px", fontSize: "12px", color: "#64748b" }}>
                  Submitted on: {new Date(resultsData.submittedAt || Date.now()).toLocaleString()} • Session sealed as Read-Only
                </div>
              </div>

              {/* Question-by-Question Detailed Review Breakdown */}
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", marginBottom: 14 }}>
                Question-Wise Analysis & Technical Explanations
              </h3>

              <div className="mz-review-items-list">
                {resultsData.reviewBreakdown?.map((item, idx) => (
                  <div
                    key={idx}
                    className={`mz-review-item-card ${item.isCorrect ? "correct" : "incorrect"}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: item.isCorrect ? "#059669" : "#dc2626" }}>
                        QUESTION {idx + 1} • {item.isCorrect ? "CORRECT (+10%)" : "INCORRECT (0%)"}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a", margin: "0 0 10px 0" }}>
                      {item.question}
                    </h4>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                      <div style={{ padding: "8px 12px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span style={{ color: "#64748b" }}>Your Answer: </span>
                        <strong style={{ color: item.isCorrect ? "#059669" : "#dc2626" }}>
                          {item.userSelected !== null && item.options?.[item.userSelected]
                            ? item.options[item.userSelected]
                            : "Unanswered"}
                        </strong>
                      </div>

                      <div style={{ padding: "8px 12px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <span style={{ color: "#64748b" }}>Correct Answer: </span>
                        <strong style={{ color: "#059669" }}>{item.options?.[item.correctIndex]}</strong>
                      </div>
                    </div>

                    {item.explanation && (
                      <div className="mz-review-explanation-box">
                        <strong style={{ color: "#2563eb" }}>Explanation: </strong>
                        {item.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginTop: 28 }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="mz-exam-submit-btn"
                    style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)", padding: "10px 20px" }}
                    onClick={() => {
                      const sid = resultsData?.sessionId || (resultsData?.attemptId ? `attempt_${resultsData.attemptId}` : null);
                      if (sid) {
                        navigate(`/assessment-report/${sid}`, { replace: true });
                      } else {
                        navigate("/home", { state: { tab: "reports" }, replace: true });
                      }
                    }}
                  >
                    <LuFileText size={15} />
                    <span>Open Official Grade Report</span>
                  </button>

                  <button
                    type="button"
                    className="mz-exam-nav-btn"
                    onClick={() => navigate("/home", { state: { tab: "reports" }, replace: true })}
                  >
                    <span>Centralized Records</span>
                  </button>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    className="mz-exam-nav-btn"
                    onClick={() => {
                      setStage("gate");
                      setAnswers({});
                      setMarkedForReview({});
                      setResultsData(null);
                      setViolationsCount(0);
                      setViolationsLog([]);
                    }}
                  >
                    <LuRotateCcw size={16} /> Retake Assessment
                  </button>
                  <button type="button" className="mz-exam-submit-btn" onClick={handleClose}>
                    Done & Return to Curriculum
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
