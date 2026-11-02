import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AssessmentSecurityGate from "./AssessmentSecurityGate";
import MasteryZoneCompilerWorkspace from "./MasteryZoneCompilerWorkspace";
import "./CertificationExamWorkspace.css";
import {
  LuAward,
  LuShield,
  LuShieldCheck,
  LuClock,
  LuCheck,
  LuX,
  LuCircleCheck,
  LuCircleAlert,
  LuPlay,
  LuSend,
  LuDownload,
  LuShare2,
  LuChevronLeft,
  LuChevronRight,
  LuBookmark,
  LuMaximize,
  LuLayers,
  LuTerminal,
  LuCheckCheck,
  LuRotateCcw,
  LuCamera,
  LuMonitor,
  LuLayoutGrid,
  LuMic,
  LuBatteryCharging,
  LuFlag,
  LuFolderLock,
  LuHistory,
  LuSave,
  LuLightbulb,
  LuFileCode,
  LuExternalLink,
  LuTriangleAlert,
  LuTrophy,
  LuHouse,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function CertificationExamWorkspace({
  certId = "dsa_cert",
  certTitle = "Data Structures & Algorithms (DSA)",
  onClose,
  onCompleted,
}) {
  const navigate = useNavigate();

  // 1. Session Persistence Recovery State
  const savedSession = (() => {
    try {
      const item = localStorage.getItem("mz_active_cert_session");
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const isResumingActive = Boolean(
    savedSession &&
      savedSession.attemptId &&
      savedSession.status === "IN_PROGRESS" &&
      (savedSession.certId === certId || !certId)
  );

  // Workflow Stage: "gate" | "active"
  const [stage, setStage] = useState(() => (isResumingActive ? "active" : "gate"));
  const [attemptId, setAttemptId] = useState(() => savedSession?.attemptId || null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [candidateName, setCandidateName] = useState("Candidate");
  const [secondsRemaining, setSecondsRemaining] = useState(() => savedSession?.secondsRemaining || 5400); // 90 mins

  // Unified Question Index (0..21 for Questions 1..22)
  // Index 0..19: MCQs (Q1 to Q20)
  // Index 20: Coding Question 1 (Q21)
  // Index 21: Coding Question 2 (Q22)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    if (savedSession && typeof savedSession.currentQuestionIndex === "number") {
      return Math.max(0, Math.min(21, savedSession.currentQuestionIndex));
    }
    return 0;
  });

  // Questions Data
  const [selectedMcqs, setSelectedMcqs] = useState([]);
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [flaggedMcqs, setFlaggedMcqs] = useState(new Set());

  const [selectedCodingQuestions, setSelectedCodingQuestions] = useState([]);
  const [codingSubmissions, setCodingSubmissions] = useState([
    { code: "# Enter your code below\n", language: "python", solved: false, passedTests: 0, totalTests: 10, testResults: [] },
    { code: "# Enter your code below\n", language: "python", solved: false, passedTests: 0, totalTests: 10, testResults: [] },
  ]);

  // Telemetry & Proctoring
  const [recoveryChances, setRecoveryChances] = useState(5);
  const [violationsCount, setViolationsCount] = useState(0);

  // Live Proctoring Media Streams (Continuous across MCQs & Coding)
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [micStream, setMicStream] = useState(null);
  const [batteryInfo, setBatteryInfo] = useState({ percentage: 100, charging: false });
  const [proctoringViewMode, setProctoringViewMode] = useState("dual"); // "dual" | "camera" | "screen"
  const [procMicVolume, setProcMicVolume] = useState(0);

  const procCameraVideoRef = useRef(null);
  const procScreenVideoRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  // Modals & Finalizing
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInterruptedModalOpen, setIsInterruptedModalOpen] = useState(false);
  const [interruptionReason, setInterruptionReason] = useState("");
  const [interruptedTimestamp, setInterruptedTimestamp] = useState(null);
  const violationCooldownRef = useRef(false);
  const [submissionSuccessData, setSubmissionSuccessData] = useState(null);

  const ensureMediaStreams = async () => {
    try {
      if (!cameraStream) {
        const cStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: true,
        });
        setCameraStream(cStream);
        setMicStream(cStream);
      }
    } catch (e) {
      console.warn("Camera re-connect note:", e.message);
    }
    try {
      if (!screenStream && navigator.mediaDevices?.getDisplayMedia) {
        const sStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "monitor" },
          audio: false,
        });
        setScreenStream(sStream);
      }
    } catch (e) {
      console.warn("Screen re-connect note:", e.message);
    }
  };

  // Microphone volume level analyzer
  useEffect(() => {
    if (!micStream) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source = ctx.createMediaStreamSource(micStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setProcMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }
    } catch (err) {
      console.warn("Audio meter setup note:", err);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [micStream]);

  // Battery monitoring
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.getBattery === "function") {
      navigator.getBattery().then((battery) => {
        const updateBat = () => {
          setBatteryInfo({
            percentage: Math.round(battery.level * 100),
            charging: battery.charging,
          });
        };
        updateBat();
        battery.addEventListener("levelchange", updateBat);
        battery.addEventListener("chargingchange", updateBat);
      }).catch(() => {});
    }
  }, []);

  // Sync video elements with streams
  useEffect(() => {
    if (procCameraVideoRef.current && cameraStream) {
      if (procCameraVideoRef.current.srcObject !== cameraStream) {
        procCameraVideoRef.current.srcObject = cameraStream;
        procCameraVideoRef.current.play().catch(() => {});
      }
    }
  }, [cameraStream, proctoringViewMode, stage, currentQuestionIndex]);

  useEffect(() => {
    if (procScreenVideoRef.current && screenStream) {
      if (procScreenVideoRef.current.srcObject !== screenStream) {
        procScreenVideoRef.current.srcObject = screenStream;
        procScreenVideoRef.current.play().catch(() => {});
      }
    }
  }, [screenStream, proctoringViewMode, stage, currentQuestionIndex]);

  // -------------------------------------------------------------
  // 1. Start or Resume Proctored Attempt with Gate Data
  // -------------------------------------------------------------
  const startOrResumeAttempt = async (securityGateData, isResumeTrigger = false) => {
    setIsLoading(true);
    try {
      if (securityGateData?.cameraStream) {
        setCameraStream(securityGateData.cameraStream);
      }
      if (securityGateData?.screenStream) {
        setScreenStream(securityGateData.screenStream);
      }
      if (securityGateData?.micStream) {
        setMicStream(securityGateData.micStream);
      }
      if (securityGateData?.batteryInfo) {
        setBatteryInfo(securityGateData.batteryInfo);
      }

      if (isResumeTrigger && !securityGateData?.cameraStream) {
        ensureMediaStreams();
      }
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/certifications/attempt/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          certId,
          candidatePhoto: securityGateData?.candidatePhoto || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initiate certification attempt");
      }

      const data = await res.json();
      setAttemptId(data.attemptId);
      setAttemptNumber(data.attemptNumber || 1);
      setCandidateName(data.candidateName || "Candidate");
      setSelectedMcqs(data.selectedMcqs || []);
      setMcqAnswers(data.mcqAnswers || {});
      setSelectedCodingQuestions(data.selectedCodingQuestions || []);

      if (Array.isArray(data.codingSubmissions) && data.codingSubmissions.length > 0) {
        setCodingSubmissions(
          data.codingSubmissions.map((sub, idx) => ({
            code: sub.code || data.selectedCodingQuestions[idx]?.starterCode?.python || "# Enter your code below\n",
            language: sub.language || "python",
            solved: Boolean(sub.solved),
            passedTests: sub.passedTests || 0,
            totalTests: sub.totalTests || 10,
            testResults: sub.testResults || [],
          }))
        );
      } else if (Array.isArray(data.selectedCodingQuestions)) {
        setCodingSubmissions(
          data.selectedCodingQuestions.map((q) => ({
            code: q.starterCode?.python || "# Enter your code below\n",
            language: "python",
            solved: false,
            passedTests: 0,
            totalTests: 10,
            testResults: [],
          }))
        );
      }

      if (data.proctoring) {
        const viols = data.proctoring.violationsCount || 0;
        setViolationsCount(viols);
        setRecoveryChances(Math.max(0, 5 - viols));
      }

      // Save active session to localStorage so reload won't exit the test
      localStorage.setItem(
        "mz_active_cert_session",
        JSON.stringify({
          attemptId: data.attemptId,
          certId,
          certTitle,
          currentQuestionIndex: currentQuestionIndex || 0,
          secondsRemaining,
          status: "IN_PROGRESS",
        })
      );

      // Enter fullscreen if permitted
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {}

      setStage("active");

      if (isResumeTrigger || data.resumed) {
        toast.info("Resumed active certification examination.", { toastId: "cert_resume_toast", autoClose: 1800 });
      } else {
        toast.success("Security Gate passed. Proctored examination active!", { toastId: "cert_gate_toast", autoClose: 1800 });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-resume if active session is stored in localStorage
  useEffect(() => {
    if (isResumingActive) {
      startOrResumeAttempt(null, true);
    }
  }, []);

  // -------------------------------------------------------------
  // 2. Reload Handling: Preserve session state silently without penalties
  // -------------------------------------------------------------
  useEffect(() => {
    if (stage !== "active") return;

    const handleBeforeUnload = () => {
      if (attemptId) {
        localStorage.setItem(
          "mz_active_cert_session",
          JSON.stringify({
            attemptId,
            certId,
            certTitle,
            currentQuestionIndex,
            secondsRemaining,
            status: "IN_PROGRESS",
          })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [stage, attemptId, certId, certTitle, currentQuestionIndex, secondsRemaining]);

  // -------------------------------------------------------------
  // 3. Proctoring Telemetry Violations with Single Deduction & Deduplication
  // -------------------------------------------------------------
  const recordViolation = useCallback(
    async (type, details) => {
      if (!attemptId || stage !== "active" || violationCooldownRef.current || isFinalizing) return;
      violationCooldownRef.current = true;
      setTimeout(() => {
        violationCooldownRef.current = false;
      }, 4500);

      const now = new Date();
      setInterruptionReason(details || "Assessment environment interruption detected.");
      setInterruptedTimestamp(now);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/certifications/attempt/${attemptId}/proctoring-event`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ type, details }),
        });
        if (res.ok) {
          const data = await res.json();
          const used = data.violationsCount || 0;
          const rem = data.chancesRemaining !== undefined ? data.chancesRemaining : Math.max(0, 5 - used);
          setViolationsCount(used);
          setRecoveryChances(rem);
          if (rem <= 0) {
            toast.error("All 5 recovery chances exhausted. Auto-submitting examination.", { toastId: "term_alert" });
            handleFinalSubmit();
          } else {
            toast.warn(`⚠️ Integrity Notice: ${details} (${rem}/5 chances remaining)`, { toastId: `viol_${type}` });
          }
        } else {
          setRecoveryChances((prev) => Math.max(0, prev - 1));
        }
      } catch {
        setRecoveryChances((prev) => Math.max(0, prev - 1));
      }
    },
    [attemptId, stage, isFinalizing]
  );

  useEffect(() => {
    // Only monitor directly in parent workspace during MCQ phase (Q1-Q20).
    // During coding phase (Q21-Q22), embedded MasteryZoneCompilerWorkspace manages compiler proctoring feeds.
    if (stage !== "active" || currentQuestionIndex >= 20) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation("TAB_SWITCH", "Candidate switched active browser tab or minimized window");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        recordViolation("FULLSCREEN_EXIT", "Candidate exited required fullscreen proctoring view");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [stage, currentQuestionIndex, recordViolation]);

  // -------------------------------------------------------------
  // 4. Timer Countdown
  // -------------------------------------------------------------
  useEffect(() => {
    if (stage !== "active") return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s remaining`;
  };

  // -------------------------------------------------------------
  // 5. MCQ Answering
  // -------------------------------------------------------------
  const handleSelectMcqOption = async (questionId, optionIndex) => {
    setMcqAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    if (!attemptId) return;

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/api/certifications/attempt/${attemptId}/save-mcq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId,
          selectedOptionIndex: optionIndex,
        }),
      });
    } catch {}
  };

  const toggleFlagMcq = (idx) => {
    setFlaggedMcqs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // -------------------------------------------------------------
  // 6. Coding Execution Handlers (10 Test Cases, 3 Public, 7 Hidden)
  // -------------------------------------------------------------
  const codingIndex = currentQuestionIndex >= 20 ? currentQuestionIndex - 20 : 0;
  const currentCodingQ = selectedCodingQuestions[codingIndex] || {};
  const currentSubmission = codingSubmissions[codingIndex] || {
    code: "# Enter your code below\n",
    language: "python",
    solved: false,
    passedTests: 0,
    totalTests: 10,
    testResults: [],
  };

  const handleUpdateCode = (newCode, lang = "python") => {
    setCodingSubmissions((prev) => {
      const next = [...prev];
      next[codingIndex] = {
        ...next[codingIndex],
        code: newCode,
        language: lang || next[codingIndex]?.language || "python",
      };
      return next;
    });
  };

  // Run Code (sample tests or custom input)
  const handleRunCode = async (code, lang, customInput) => {
    if (!currentCodingQ.questionId && !currentCodingQ.id) return { error: "No question selected" };
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/certifications/attempt/${attemptId}/run-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionIndex: codingIndex,
          code: code || currentSubmission.code,
          language: lang || currentSubmission.language,
          customInput,
        }),
      });

      const data = await res.json();
      if (data.isCustom) {
        return data;
      }
      return {
        results: data.results || data.testResults || [],
        passedCount: data.passedCount || 0,
        total: data.total || (data.results || []).length,
      };
    } catch (err) {
      toast.error(err.message);
      return { error: err.message };
    }
  };

  // Run Tests / Submit (evaluates all 10 test cases: 3 public, 7 hidden)
  const handleSubmitCode = async (code, lang) => {
    if (!currentCodingQ.questionId && !currentCodingQ.id) return { error: "No question selected" };
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/certifications/attempt/${attemptId}/submit-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionIndex: codingIndex,
          code: code || currentSubmission.code,
          language: lang || currentSubmission.language,
        }),
      });

      const data = await res.json();
      const resultsArray = data.results || data.testResults || [];
      const isSolved = Boolean(data.isSolved || data.solved);
      const passedCount = data.passedCount !== undefined ? data.passedCount : (data.passedTests || 0);
      const totalCount = data.total || data.totalTests || 10;

      setCodingSubmissions((prev) => {
        const next = [...prev];
        next[codingIndex] = {
          ...next[codingIndex],
          code: code || next[codingIndex]?.code,
          language: lang || next[codingIndex]?.language,
          solved: isSolved,
          passedTests: passedCount,
          totalTests: totalCount,
          testResults: resultsArray,
        };
        return next;
      });

      if (isSolved) {
        toast.success(`🎉 Problem ${codingIndex + 1} (Q${21 + codingIndex}) Solved! 10/10 test cases passed.`);
      } else {
        toast.info(
          `Evaluated Question ${21 + codingIndex}: ${passedCount} / ${totalCount} test cases passed.`
        );
      }

      return {
        success: true,
        status: isSolved ? "ACCEPTED" : "WRONG_ANSWER",
        isSolved,
        solved: isSolved,
        results: resultsArray,
        passedCount,
        passedTests: passedCount,
        total: totalCount,
        totalTests: totalCount,
      };
    } catch (err) {
      toast.error(err.message);
      return { error: err.message };
    }
  };

  // -------------------------------------------------------------
  // 7. Final Combined Assessment Submission (MCQs + Coding >= 80%)
  // -------------------------------------------------------------
  const handleFinalSubmit = async () => {
    setIsFinalizing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/certifications/attempt/${attemptId}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to grade assessment");
      }

      const data = await res.json();
      setShowConfirmModal(false);

      // Clear session from storage so next visit starts fresh
      localStorage.removeItem("mz_active_cert_session");
      sessionStorage.removeItem("mz_cert_reload_interruption");

      // Stop proctoring tracks and exit fullscreen on final submission
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }
      if (document.fullscreenElement) {
        try {
          document.exitFullscreen().catch(() => {});
        } catch {}
      }

      // Enforce strictly ONE single notification on top-right upon submission
      toast.dismiss();
      toast.success(
        data.finalVerdict === "PASSED"
          ? "🎉 Assessment Submitted! You cleared the 80% cutoff and earned your Official Certificate!"
          : "Assessment submitted and permanently recorded. View your official evaluation report below.",
        {
          toastId: "mz-single-assessment-submit-toast",
          position: "top-right",
          autoClose: 2000,
        }
      );

      const finalScore = data.totalScore !== undefined ? data.totalScore : (data.mcqScore !== undefined ? data.mcqScore + (data.codingScore || 0) : answeredMcqCount + totalPassedCodingTests);
      const finalPct = data.percentage !== undefined ? data.percentage : Math.round((finalScore / 40) * 100);

      setSubmissionSuccessData({
        attemptId,
        score: finalScore,
        totalMarks: data.maxScore || 40,
        percentage: finalPct,
        passed: data.finalVerdict === "PASSED" || (finalPct >= 80),
        mcqScore: data.mcqScore !== undefined ? data.mcqScore : answeredMcqCount,
        codingScore: data.codingScore !== undefined ? data.codingScore : totalPassedCodingTests,
        reportUrl: `/assessment-report/${attemptId}`,
      });

      if (onCompleted) {
        onCompleted(data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  // Combined score calculations (20 MCQs + 20 Coding Tests = 40 Total Marks)
  const answeredMcqCount = Object.keys(mcqAnswers).length;
  const totalPassedCodingTests = codingSubmissions.reduce((acc, s) => acc + (s.passedTests || 0), 0);
  const totalCombinedMarks = 40; // 20 MCQs (1 mark each) + 20 Coding Tests (1 mark each)
  const currentMarksObtained = answeredMcqCount + totalPassedCodingTests;
  const currentPercentage = Math.round((currentMarksObtained / totalCombinedMarks) * 100);

  // -------------------------------------------------------------
  // STAGE 1: ASSESSMENT SECURITY GATE
  // -------------------------------------------------------------
  if (stage === "gate") {
    return (
      <AssessmentSecurityGate
        assessmentTitle={`${certTitle} — Proctored Credential Examination`}
        timeLimitMinutes={90}
        onCancel={() => {
          localStorage.removeItem("mz_active_cert_session");
          if (onClose) onClose();
        }}
        onStartAssessment={async (gateData) => {
          await startOrResumeAttempt(gateData);
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // STAGE 2: ACTIVE PROCTORED EXAMINATION WORKSPACE (22 QUESTIONS)
  // -------------------------------------------------------------
  const isMcqMode = currentQuestionIndex < 20;
  const currentMcq = isMcqMode ? selectedMcqs[currentQuestionIndex] : null;

  return (
    <div className="mz-cert-workspace-root">
      {/* 1. STICKY TOP HEADER */}
      <header className="mz-cert-top-bar">
        {/* Left: Branding & Status Badges */}
        <div className="mz-cert-top-left">
          <div className="mz-cert-logo-circle" title="Mastery Zone Assessment Platform">
            <LuAward size={18} />
          </div>

          <h2 className="mz-cert-problem-title">
            {certTitle} • Attempt #{attemptNumber}
          </h2>

          <div className="mz-cert-pill-green">
            <span className="mz-dot-green">●</span> PROCTORING ACTIVE
          </div>

          <div className="mz-cert-pill-cyan">
            <span className="mz-dot-cyan">●</span> Synced
          </div>

          <div className="mz-cert-pill-purple">
            <LuFolderLock size={13} style={{ marginRight: 4 }} /> Assigned Assessment Task
          </div>
        </div>

        {/* Center: Live Combined Progress Tracker */}
        <div className="mz-cert-top-center">
          <div className="mz-cert-score-tracker">
            <span className="mz-tracker-chip">
              <strong>Part A:</strong> {answeredMcqCount}/20 MCQs
            </span>
            <span className="mz-tracker-divider">•</span>
            <span className="mz-tracker-chip">
              <strong>Part B:</strong> {totalPassedCodingTests}/20 Tests Passed
            </span>
            <span className="mz-tracker-divider">•</span>
            <span className="mz-tracker-chip highlight">
              <strong>Combined Cutoff:</strong> ≥80% (32/40 Marks)
            </span>
          </div>
        </div>

        {/* Right: Clock & Submit */}
        <div className="mz-cert-top-right">
          <div className="mz-cert-timer-display">
            <LuClock size={13} style={{ marginRight: 5 }} /> {formatTimer(secondsRemaining)}
          </div>

          <button
            type="button"
            className="mz-cert-btn-top-submit"
            onClick={() => setShowConfirmModal(true)}
            title="Finalize assessment and view verified report"
          >
            <LuSend size={13} style={{ marginRight: 5 }} /> Submit Assessment
          </button>
        </div>
      </header>

      {/* 2. UNIFIED 22-QUESTION PALETTE STRIP (ALWAYS VISIBLE FOR BOTH MCQS & CODING) */}
      <div className="mz-cert-palette-bar">
        <div className="mz-palette-scroll">
          {/* Questions 1 to 20: MCQs */}
          <div className="mz-palette-group">
            <span className="mz-palette-group-label">MCQs (1–20)</span>
            <div className="mz-palette-btns">
              {selectedMcqs.map((q, idx) => {
                const isAnswered = mcqAnswers[q.id] !== undefined;
                const isFlagged = flaggedMcqs.has(idx);
                const isCurrent = currentQuestionIndex === idx;

                let cls = "mz-palette-btn";
                if (isCurrent) cls += " active";
                else if (isAnswered) cls += " answered";
                else if (isFlagged) cls += " flagged";

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    className={cls}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    title={`Question ${idx + 1} (MCQ): ${isAnswered ? "Answered (1 Mark)" : "Unanswered"}`}
                  >
                    {idx + 1}
                    {isFlagged && <span className="mz-palette-flag-dot" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mz-palette-divider" />

          {/* Questions 21 and 22: Coding Challenges */}
          <div className="mz-palette-group coding">
            <span className="mz-palette-group-label">Coding (21–22)</span>
            <div className="mz-palette-btns">
              {selectedCodingQuestions.slice(0, 2).map((cq, cIdx) => {
                const questionNumber = 21 + cIdx;
                const paletteIndex = 20 + cIdx;
                const sub = codingSubmissions[cIdx];
                const isSolved = Boolean(sub?.solved || sub?.passedTests === 10);
                const passedT = sub?.passedTests || 0;
                const isAttempted = Boolean(passedT > 0 || (sub?.code && sub.code.length > 50));
                const isCurrent = currentQuestionIndex === paletteIndex;

                let cls = "mz-palette-btn coding";
                if (isCurrent) cls += " active";
                else if (isSolved) cls += " solved";
                else if (isAttempted) cls += " attempted";

                return (
                  <button
                    key={cq.questionId || cIdx}
                    type="button"
                    className={cls}
                    onClick={() => setCurrentQuestionIndex(paletteIndex)}
                    title={`Question ${questionNumber} (Coding): ${cq.title || "Algorithm Challenge"} • ${passedT}/10 Tests Passed (${passedT} Marks)`}
                  >
                    <LuFileCode size={12} style={{ marginRight: 3 }} />
                    <span>Q{questionNumber}</span>
                    {isSolved ? (
                      <span className="mz-palette-check-dot">✓</span>
                    ) : passedT > 0 ? (
                      <span className="mz-palette-pass-count">{passedT}/10</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Info: Combined Scoring Rule */}
        <div className="mz-palette-stats">
          <div className="mz-palette-stat-chip">
            <span className="mz-dot-chip green">●</span>
            <span>MCQs: <strong>{answeredMcqCount}/20</strong></span>
          </div>
          <div className="mz-palette-stat-chip">
            <span className="mz-dot-chip purple">●</span>
            <span>Coding Tests: <strong>{totalPassedCodingTests}/20</strong></span>
          </div>
          <div className="mz-palette-stat-chip gold">
            <LuAward size={13} color="#d97706" />
            <span>Combined Cutoff: <strong>≥80% (32/40)</strong></span>
          </div>
        </div>
      </div>

      {/* 3. WORKSPACE BODY: MCQ VIEW (1..20) OR EMBEDDED MZ-ASM COMPILER WORKSPACE (21..22) */}
      <div className="mz-cert-main-layout">
        {isMcqMode ? (
          /* ================= MCQs VIEW (QUESTIONS 1 TO 20) ================= */
          <div className="mz-mcq-view-container">
            {/* Left Palette Panel: ALL 22 Questions Grid */}
            <aside className="mz-mcq-palette-panel">
              {/* LIVE PROCTORING WIDGET (CONTINUOUS WEBCAM & SCREEN PROCTORING) */}
              <div
                className="mz-cert-mcq-proctoring-box"
                style={{
                  marginBottom: 16,
                  padding: "10px",
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 12.5, color: "#0f172a" }}>
                    <LuShieldCheck size={15} color="#2563eb" />
                    <span>Live Proctoring</span>
                  </div>
                  <span style={{ fontSize: 9.5, background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>
                    ACTIVE
                  </span>
                </div>

                {/* View Mode Toggle */}
                <div style={{ display: "flex", background: "#e2e8f0", borderRadius: 6, padding: 2, marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => setProctoringViewMode("camera")}
                    style={{
                      flex: 1,
                      border: "none",
                      background: proctoringViewMode === "camera" ? "#ffffff" : "transparent",
                      color: proctoringViewMode === "camera" ? "#2563eb" : "#64748b",
                      fontWeight: 700,
                      fontSize: 10.5,
                      padding: "3px 0",
                      borderRadius: 4,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                    }}
                  >
                    <LuCamera size={11} /> Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => setProctoringViewMode("screen")}
                    style={{
                      flex: 1,
                      border: "none",
                      background: proctoringViewMode === "screen" ? "#ffffff" : "transparent",
                      color: proctoringViewMode === "screen" ? "#2563eb" : "#64748b",
                      fontWeight: 700,
                      fontSize: 10.5,
                      padding: "3px 0",
                      borderRadius: 4,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                    }}
                  >
                    <LuMonitor size={11} /> Screen
                  </button>
                  <button
                    type="button"
                    onClick={() => setProctoringViewMode("dual")}
                    style={{
                      flex: 1,
                      border: "none",
                      background: proctoringViewMode === "dual" ? "#ffffff" : "transparent",
                      color: proctoringViewMode === "dual" ? "#2563eb" : "#64748b",
                      fontWeight: 700,
                      fontSize: 10.5,
                      padding: "3px 0",
                      borderRadius: 4,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                    }}
                  >
                    <LuLayoutGrid size={11} /> Dual
                  </button>
                </div>

                {/* Video Streams Display */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                  {(proctoringViewMode === "dual" || proctoringViewMode === "camera") && (
                    <div style={{ position: "relative", width: "100%", height: 95, background: "#0f172a", borderRadius: 6, overflow: "hidden" }}>
                      <video
                        ref={procCameraVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                      />
                      <div style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.65)", color: "#ffffff", padding: "1px 5px", borderRadius: 3, fontSize: 8.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: cameraStream?.active ? "#22c55e" : "#ef4444" }} />
                        LIVE CAM
                      </div>
                      <span style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#cbd5e1", padding: "1px 4px", borderRadius: 3, fontSize: 8.5 }}>Webcam</span>
                      {(!cameraStream || !cameraStream.active) && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.9)", color: "#cbd5e1", gap: 3 }}>
                          <LuCamera size={16} color="#94a3b8" />
                          <span style={{ fontSize: 9.5 }}>Camera Disconnected</span>
                          <button
                            type="button"
                            onClick={ensureMediaStreams}
                            style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 3, padding: "2px 6px", fontSize: 9.5, cursor: "pointer", fontWeight: 700 }}
                          >
                            Enable Camera
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {(proctoringViewMode === "dual" || proctoringViewMode === "screen") && (
                    <div style={{ position: "relative", width: "100%", height: 95, background: "#0f172a", borderRadius: 6, overflow: "hidden" }}>
                      <video
                        ref={procScreenVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                      <div style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.65)", color: "#ffffff", padding: "1px 5px", borderRadius: 3, fontSize: 8.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: screenStream?.active ? "#22c55e" : "#ef4444" }} />
                        SCREEN
                      </div>
                      <span style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#cbd5e1", padding: "1px 4px", borderRadius: 3, fontSize: 8.5 }}>Entire Screen</span>
                      {(!screenStream || !screenStream.active) && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.9)", color: "#cbd5e1", gap: 3 }}>
                          <LuMonitor size={16} color="#94a3b8" />
                          <span style={{ fontSize: 9.5 }}>Screen Not Shared</span>
                          <button
                            type="button"
                            onClick={ensureMediaStreams}
                            style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 3, padding: "2px 6px", fontSize: 9.5, cursor: "pointer", fontWeight: 700 }}
                          >
                            Share Screen
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Microphone Level */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 6px", marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                    <span style={{ color: "#475569", fontWeight: 700 }}>Microphone Signal</span>
                    <span style={{ color: procMicVolume > 5 ? "#16a34a" : "#64748b", fontWeight: 700 }}>
                      {procMicVolume > 5 ? "Audio Detected" : "Quiet"}
                    </span>
                  </div>
                  <div style={{ height: 3, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, Math.max(4, procMicVolume))}%`, background: "linear-gradient(90deg, #22c55e 0%, #eab308 70%, #ef4444 100%)", transition: "width 0.1s ease" }} />
                  </div>
                </div>

                {/* Battery & Fullscreen Enforcement */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, padding: "2px 0", color: "#475569" }}>
                  <span>Device Battery</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{batteryInfo.percentage}% {batteryInfo.charging ? "⚡" : ""}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, padding: "2px 0", color: "#475569" }}>
                  <span>Fullscreen Enforcement</span>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, padding: "2px 0", color: "#475569", marginBottom: 6 }}>
                  <span>Assessment Security</span>
                  <span style={{ fontWeight: 800, color: "#2563eb", fontSize: 10 }}>STRICT</span>
                </div>

                {/* Recovery Chances */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, fontWeight: 700, marginBottom: 3 }}>
                    <span style={{ color: "#0f172a" }}>Recovery Chances</span>
                    <span style={{ color: recoveryChances > 2 ? "#16a34a" : "#dc2626" }}>{recoveryChances} / 5 Left</span>
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 2,
                          background: idx < recoveryChances ? "#22c55e" : "#ef4444",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <strong style={{ fontSize: 13, color: "#0f172a" }}>Question Palette (1–22)</strong>
                <span style={{ fontSize: 11.5, color: "#64748b" }}>
                  {answeredMcqCount + (codingSubmissions[0]?.solved ? 1 : 0) + (codingSubmissions[1]?.solved ? 1 : 0)}/22 Attempted
                </span>
              </div>

              {/* Complete 22 Buttons Grid */}
              <div className="mz-mcq-grid-buttons">
                {/* 1..20 MCQs */}
                {selectedMcqs.map((q, idx) => {
                  const isAnswered = mcqAnswers[q.id] !== undefined;
                  const isFlagged = flaggedMcqs.has(idx);
                  const isCurrent = currentQuestionIndex === idx;

                  let cls = "mz-mcq-grid-btn";
                  if (isCurrent) cls += " active";
                  else if (isAnswered) cls += " answered";
                  else if (isFlagged) cls += " flagged";

                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      className={cls}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      title={`MCQ ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}

                {/* 21 & 22 Coding in Same Grid */}
                {selectedCodingQuestions.slice(0, 2).map((cq, cIdx) => {
                  const qNum = 21 + cIdx;
                  const paletteIdx = 20 + cIdx;
                  const sub = codingSubmissions[cIdx];
                  const isSolved = Boolean(sub?.solved || sub?.passedTests === 10);
                  const isAttempted = Boolean((sub?.passedTests || 0) > 0);
                  const isCurrent = currentQuestionIndex === paletteIdx;

                  let cls = "mz-mcq-grid-btn coding";
                  if (isCurrent) cls += " active";
                  else if (isSolved) cls += " answered";
                  else if (isAttempted) cls += " flagged";

                  return (
                    <button
                      key={cq.questionId || cIdx}
                      type="button"
                      className={cls}
                      onClick={() => setCurrentQuestionIndex(paletteIdx)}
                      title={`Coding Problem Q${qNum}: ${cq.title || "Challenge"}`}
                    >
                      {qNum}
                    </button>
                  );
                })}
              </div>

              {/* Coding Questions Detailed Jump Links */}
              <div className="mz-mcq-coding-links">
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Coding Challenges (Q21 & Q22)
                </div>
                {selectedCodingQuestions.slice(0, 2).map((cq, cIdx) => {
                  const qNum = 21 + cIdx;
                  const sub = codingSubmissions[cIdx];
                  const isSolved = Boolean(sub?.solved || sub?.passedTests === 10);
                  const passedT = sub?.passedTests || 0;
                  return (
                    <button
                      key={cq.questionId || cIdx}
                      type="button"
                      className={`mz-mcq-coding-link-btn ${isSolved ? "solved" : ""}`}
                      onClick={() => setCurrentQuestionIndex(20 + cIdx)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <LuFileCode size={13} />
                        <span>Q{qNum}: {cq.title || `Challenge ${cIdx + 1}`}</span>
                      </div>
                      {isSolved ? (
                        <span className="mz-badge-solved">10/10 Tests</span>
                      ) : passedT > 0 ? (
                        <span className="mz-badge-partial">{passedT}/10 Tests</span>
                      ) : (
                        <span className="mz-badge-open">10 Marks</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend with 80% Rule */}
              <div className="mz-mcq-legend">
                <div className="mz-legend-item">
                  <span className="mz-legend-dot answered"></span> Answered / Solved
                </div>
                <div className="mz-legend-item">
                  <span className="mz-legend-dot active"></span> Current Question
                </div>
                <div className="mz-legend-item">
                  <span className="mz-legend-dot flagged"></span> Flagged / Partial
                </div>
              </div>

              <div className="mz-combined-rule-box">
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                  Combined 80% Grading
                </div>
                <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.45 }}>
                  20 MCQs (20 pts) + 2 Coding Problems (20 pts) = <strong>40 Total Points</strong>.
                  Clear $\ge$ 80% (32 pts) combined to earn the Official Certificate!
                </div>
              </div>
            </aside>

            {/* Right MCQ Card: Generously Sized, High Legibility, Space Optimized */}
            <div className="mz-mcq-card-main">
              {currentMcq ? (
                <>
                  <div className="mz-mcq-card-header">
                    <div className="mz-mcq-header-left">
                      <span className="mz-mcq-qnumber-pill">
                        Question {currentQuestionIndex + 1} of 20
                      </span>
                      <span className="mz-mcq-topic-badge">
                        {currentMcq.topic || "Algorithm & Complexity"}
                      </span>
                    </div>

                    <div className="mz-mcq-header-right">
                      <span className="mz-mcq-cutoff-pill">
                        1 Mark • Combined Cutoff: ≥80% (32/40)
                      </span>
                      <button
                        type="button"
                        className={`mz-mcq-flag-toggle-btn ${flaggedMcqs.has(currentQuestionIndex) ? "flagged" : ""}`}
                        onClick={() => toggleFlagMcq(currentQuestionIndex)}
                        title="Flag this question to review later"
                      >
                        <LuBookmark size={15} />
                        <span>{flaggedMcqs.has(currentQuestionIndex) ? "Flagged for Review ✓" : "Flag Question"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="mz-mcq-body-content">
                    <h2 className="mz-mcq-question-text">
                      {currentMcq.question}
                    </h2>

                    {currentMcq.codeSnippet && (
                      <pre className="mz-mcq-code-snippet">
                        <code>{currentMcq.codeSnippet}</code>
                      </pre>
                    )}

                    <div className="mz-mcq-options-list">
                      {currentMcq.options?.map((opt, optIdx) => {
                        const isSelected = mcqAnswers[currentMcq.id] === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`mz-mcq-option-label ${isSelected ? "selected" : ""}`}
                            onClick={() => handleSelectMcqOption(currentMcq.id, optIdx)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handleSelectMcqOption(currentMcq.id, optIdx);
                              }
                            }}
                          >
                            <span className="mz-mcq-opt-char">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="mz-mcq-opt-text">{opt}</span>
                            <div className="mz-mcq-radio-indicator">
                              <span className="mz-mcq-radio-dot" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prominent, Highly Visible & Easy to Use Navigation Controls */}
                  <div className="mz-mcq-nav-actions">
                    <button
                      type="button"
                      className="mz-btn-prev-large"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                    >
                      <LuChevronLeft size={18} />
                      <span>Previous Question</span>
                    </button>

                    <div className="mz-mcq-nav-center-info">
                      <span className="mz-nav-progress-text">
                        Question <strong>{currentQuestionIndex + 1}</strong> of <strong>20</strong>
                      </span>
                      <span className="mz-nav-status-badge">
                        {mcqAnswers[currentMcq.id] !== undefined ? (
                          <span className="mz-status-answered">✓ Answer Selected</span>
                        ) : (
                          <span className="mz-status-unanswered">Pending Selection</span>
                        )}
                      </span>
                    </div>

                    {currentQuestionIndex < 19 ? (
                      <button
                        type="button"
                        className="mz-btn-next-large"
                        onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                      >
                        <span>Next Question</span>
                        <LuChevronRight size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="mz-btn-next-large mz-btn-next-to-coding"
                        onClick={() => setCurrentQuestionIndex(20)}
                      >
                        <LuFileCode size={18} />
                        <span>Proceed to Coding (Question 21)</span>
                        <LuChevronRight size={18} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                  Loading examination questions...
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= EMBEDDED CODING WORKSPACE (QUESTIONS 21 & 22) ================= */
          <div className="mz-embedded-coding-wrapper">
            {/* Context Breadcrumb & Question Navigation Bar */}
            <div className="mz-cert-coding-subnav">
              <div className="mz-cert-coding-subnav-left">
                <span className="mz-cert-coding-q-tag">
                  Question {currentQuestionIndex + 1} of 22
                </span>
                <span className="mz-cert-coding-title-text">
                  {currentCodingQ.title || "Algorithmic Challenge"}
                </span>
                <span className={`mz-cert-diff-badge ${(currentCodingQ.difficulty || "medium").toLowerCase()}`}>
                  {currentCodingQ.difficulty || "Medium"}
                </span>
                <span className="mz-cert-marks-badge">
                  10 Marks (10 Tests)
                </span>
              </div>

              <div className="mz-cert-coding-subnav-right">
                <button
                  type="button"
                  className="mz-btn-subnav-prev"
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                >
                  <LuChevronLeft size={15} />
                  <span>{currentQuestionIndex === 20 ? "Question 20 (MCQ)" : "Question 21 (Coding)"}</span>
                </button>

                {currentQuestionIndex === 20 ? (
                  <button
                    type="button"
                    className="mz-btn-subnav-next"
                    onClick={() => setCurrentQuestionIndex(21)}
                  >
                    <span>Question 22 (Coding)</span>
                    <LuChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="mz-btn-subnav-submit"
                    onClick={() => setShowConfirmModal(true)}
                  >
                    <span>Finish & Submit Exam</span>
                    <LuSend size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Embedded Mastery Zone Compiler (No overlapping fixed modals!) */}
            <div className="mz-embedded-compiler-frame">
              <MasteryZoneCompilerWorkspace
                key={`${attemptId}_coding_${codingIndex}`}
                title={`Question ${currentQuestionIndex + 1}: ${currentCodingQ.title || "Algorithm Challenge"}`}
                questionId={currentCodingQ.questionId || currentCodingQ.id}
                sessionId={attemptId}
                initialProctoringStage="active"
                isProctored={true}
                isEmbedded={true}
                externalCameraStream={cameraStream}
                externalScreenStream={screenStream}
                externalMicStream={micStream}
                problemData={{
                  ...currentCodingQ,
                  id: currentCodingQ.questionId || currentCodingQ.id,
                  testCases: currentCodingQ.testCases || [],
                }}
                starterCodeMap={currentCodingQ.starterCode || {}}
                defaultLanguage={codingSubmissions[codingIndex]?.language || "python"}
                testCases={currentCodingQ.testCases || []}
                questionsList={selectedCodingQuestions}
                currentQuestionIndex={codingIndex}
                onSelectQuestion={(q, idx) => setCurrentQuestionIndex(20 + idx)}
                onSaveDraft={async (code, lang) => {
                  handleUpdateCode(code, lang);
                  toast.success("Code draft saved.");
                }}
                initialDraft={
                  codingSubmissions[codingIndex]?.code ||
                  currentCodingQ.starterCode?.python ||
                  "# Enter your code below\n"
                }
                onRun={async (code, lang, customInput) => {
                  return handleRunCode(code, lang, customInput);
                }}
                onRunTests={async (code, lang) => {
                  return handleSubmitCode(code, lang);
                }}
                onSubmit={async (code, lang) => {
                  return handleSubmitCode(code, lang);
                }}
                onClose={() => setShowConfirmModal(true)}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. CONFIRMATION MODAL BEFORE FINAL SUBMISSION */}
      {showConfirmModal && (
        <div className="mz-cert-modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="mz-cert-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 10px", fontSize: 18, color: "#0f172a", fontWeight: 800 }}>
              Confirm Official Examination Submission
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#475569", lineHeight: 1.5 }}>
              Your examination will be evaluated atomically on the academic server. Marks are combinely evaluated from all 20 MCQs and both coding challenges (20 test cases). Scoring <strong>≥80% (32/40 Marks)</strong> awards the Official Course Completion Certificate.
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 13 }}>
                <span>Part A: Multiple Choice Questions:</span>
                <strong>{answeredMcqCount} of 20 answered (20 Marks)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                <span>Part B: Algorithmic Coding Tests:</span>
                <strong>{totalPassedCodingTests} of 20 tests passed (20 Marks)</strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 10,
                  borderTop: "1px solid #e2e8f0",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <span>Current Combined Marks:</span>
                <span style={{ color: currentPercentage >= 80 ? "#16a34a" : "#ea580c" }}>
                  {currentMarksObtained} / 40 Marks ({currentPercentage}%)
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="mz-btn-sec"
              >
                Back to Assessment
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isFinalizing}
                className="mz-btn-prim"
                style={{ background: "#16a34a" }}
              >
                {isFinalizing ? "Grading..." : "Yes, Grade & Generate Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. POST-SUBMISSION OFFICIAL REPORT & SUCCESS MODAL */}
      {submissionSuccessData && (
        <div className="mz-submit-modal-overlay">
          <div className="mz-proc-submission-success-card">
            <div className="mz-proc-success-icon-ring">
              <LuTrophy size={36} />
            </div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
              Examination Submitted & Evaluated
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0, lineHeight: "1.5" }}>
              Your 20 MCQ questions and 2 algorithmic coding solutions have been graded across all 20 live container test cases. Your assessment attempt is permanently locked and cryptographically archived.
            </p>

            <div className="mz-proc-score-badge-lg">
              <span>Score: {submissionSuccessData.score}/{submissionSuccessData.totalMarks}</span>
              <span className={`grade-tag ${submissionSuccessData.passed ? "pass" : "fail"}`}>
                {submissionSuccessData.passed ? "PASSED (≥80%)" : "FAILED (<80%)"}
              </span>
              <span style={{ color: "#64748b", fontSize: "13px" }}>
                ({submissionSuccessData.percentage}% Overall Score)
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "8px" }}>
              <button
                type="button"
                className="mz-proc-btn-report"
                onClick={() => {
                  navigate(submissionSuccessData.reportUrl);
                }}
              >
                <LuAward size={18} />
                <span>View Official Report</span>
              </button>

              <button
                type="button"
                className="mz-report-btn mz-report-btn-secondary"
                style={{ justifyContent: "center", padding: "12px", border: "1px solid #cbd5e1", color: "#334155" }}
                onClick={() => {
                  navigate("/");
                }}
              >
                <LuHouse size={16} />
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
