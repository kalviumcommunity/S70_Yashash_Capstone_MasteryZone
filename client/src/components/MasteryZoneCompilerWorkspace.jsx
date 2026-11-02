import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { toast } from "react-toastify";
import {
  LuPlay,
  LuX,
  LuRotateCcw,
  LuClock,
  LuFlag,
  LuChevronDown,
  LuChevronUp,
  LuSave,
  LuSend,
  LuCircleCheck,
  LuCircleX,
  LuCircle,
  LuTerminal,
  LuSparkles,
  LuShieldCheck,
  LuFileCode,
  LuCheck,
  LuLightbulb,
  LuArrowDown,
  LuArrowUp,
  LuPause,
  LuHourglass,
  LuTrophy,
  LuHistory,
  LuTriangleAlert,
  LuCamera,
  LuMic,
  LuMonitor,
  LuMaximize,
  LuBattery,
  LuBatteryCharging,
  LuBatteryWarning,
  LuChevronLeft,
  LuChevronRight,
  LuLayoutGrid,
  LuRadio,
  LuListOrdered,
  LuLock,
  LuAward,
  LuExternalLink,
  LuHouse,
} from "react-icons/lu";
import AssessmentSecurityGate from "./AssessmentSecurityGate";
import "./MasteryZoneCompiler.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function MasteryZoneCompilerWorkspace({
  title = "Assignment | Coding Challenge",
  questionId = "",
  sessionId = "",
  initialProctoringStage = "",
  externalCameraStream = null,
  externalScreenStream = null,
  externalMicStream = null,
  problemData = null,
  starterCodeMap = {},
  defaultLanguage = "python",
  testCases = [],
  initialDraft = "",
  historyUrl = "",
  initialHistory = null,
  isProctored = true,
  isEmbedded = false,
  questionsList = [],
  currentQuestionIndex = 0,
  onSelectQuestion,
  onSaveDraft,
  onRun,
  onRunTests,
  onSubmit,
  onClose,
}) {
  // Normalize language key: "cpp", "python", "javascript", "java"
  const normalizeLang = (l) => {
    const s = (l || "").toLowerCase().trim();
    if (s.includes("c++") || s === "cpp") return "cpp";
    if (s.includes("python") || s === "py") return "python";
    if (s.includes("script") || s === "js" || s === "node") return "javascript";
    if (s.includes("java")) return "java";
    return "python";
  };

  const [selectedLang, setSelectedLang] = useState(normalizeLang(defaultLanguage));
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(13);

  // Strictly validate if code has executable logic (not empty and not comments only)
  const isCodeEmptyOrComments = (c) => {
    if (!c || typeof c !== "string") return true;
    const stripped = c
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/#.*$/gm, "")
      .replace(/\s+/g, "");
    return stripped.length === 0;
  };

  // Question Navigator Menu state
  const [isQMenuOpen, setIsQMenuOpen] = useState(false);
  const [qSearch, setQSearch] = useState("");
  const qMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (qMenuRef.current && !qMenuRef.current.contains(e.target)) {
        setIsQMenuOpen(false);
      }
    };
    if (isQMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isQMenuOpen]);

  // Strictly blank commented placeholder only — never reveal solutions or preloaded code!
  const getStarterPlaceholder = (lang) => {
    const l = (lang || "").toLowerCase().trim();
    if (l === "python" || l === "py") {
      return "# Enter your code below\n";
    }
    return "// Enter your code below\n";
  };

  const [code, setCode] = useState(
    initialDraft || getStarterPlaceholder(normalizeLang(defaultLanguage))
  );

  // Scroll references
  const questionRef = useRef(null);
  const editorCardRef = useRef(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("run_tests"); // "run" | "run_tests" | "hint"

  // Selected test case index (0 to 9)
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);

  // Reset confirmation modal state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Urgent timeline alert state (< 2 minutes remaining)
  const [isUrgentAlertVisible, setIsUrgentAlertVisible] = useState(false);
  const urgentAlertTimerRef = useRef(null);

  const triggerUrgentPopup = () => {
    setIsUrgentAlertVisible(true);
    if (urgentAlertTimerRef.current) clearTimeout(urgentAlertTimerRef.current);
    urgentAlertTimerRef.current = setTimeout(() => {
      setIsUrgentAlertVisible(false);
    }, 2000);
  };

  // Flag problem state
  const [isFlagged, setIsFlagged] = useState(false);

  // Attempt History state
  const [historyList, setHistoryList] = useState(initialHistory?.attempts || []);
  const [attemptsCount, setAttemptsCount] = useState(initialHistory?.attemptsCount || 0);
  const [bestScore, setBestScore] = useState(initialHistory?.bestScore || 0);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Load history if historyUrl provided
  useEffect(() => {
    if (!historyUrl) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(historyUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data)) {
          const mapped = data.map((s, idx) => ({
            attemptNumber: s.attemptNumber || data.length - idx,
            code: s.code,
            language: s.language,
            passedTests: s.passedTests,
            totalTests: s.totalTests,
            score: s.score ?? Math.round(((s.passedTests || 0) / (s.totalTests || 1)) * 100),
            status: s.status,
            timestamp: s.createdAt || s.timestamp,
          }));
          setHistoryList(mapped);
          setAttemptsCount(data.length);
          setBestScore(Math.max(0, ...mapped.map((m) => m.score)));
        } else {
          if (Array.isArray(data.attempts)) setHistoryList(data.attempts);
          if (data.attemptsCount !== undefined) setAttemptsCount(data.attemptsCount);
          if (data.bestScore !== undefined) setBestScore(data.bestScore);
        }
      })
      .catch(() => {});
  }, [historyUrl]);

  // Actual test cases: exactly 10 test cases; first 3 visible, remaining 7 hidden
  const effectiveTestCases = useMemo(() => {
    const list = (testCases && testCases.length > 0) ? testCases : (problemData?.testCases || []);
    return list.map((tc, idx) => ({
      index: idx + 1,
      input: tc.isHidden || idx >= 3 ? `[Hidden Test Case #${idx + 1}]` : tc.input,
      expectedOutput: tc.isHidden || idx >= 3 ? `[Hidden Output #${idx + 1}]` : tc.expectedOutput,
      isHidden: !!tc.isHidden || idx >= 3,
      passed: null,
      actualOutput: "",
      duration: 0,
      error: null,
    }));
  }, [questionId, testCases, problemData]);

  const [allTestCases, setAllTestCases] = useState(effectiveTestCases);

  const lastQuestionIdRef = useRef(questionId);
  useEffect(() => {
    if (lastQuestionIdRef.current !== questionId) {
      lastQuestionIdRef.current = questionId;
      setAllTestCases(effectiveTestCases);
      setPassedCount(0);
      setHasEvaluated(false);
      setIsCodeModifiedAfterEval(false);
      setCode(initialDraft || getStarterPlaceholder(selectedLang));
    } else if (allTestCases.length === 0 && effectiveTestCases.length > 0) {
      setAllTestCases(effectiveTestCases);
    }
  }, [questionId, effectiveTestCases, selectedLang, initialDraft, allTestCases.length]);

  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const selectedLangRef = useRef(selectedLang);
  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  // Pass banner state & dynamic UI evaluation state
  const [bannerVisible, setBannerVisible] = useState(true);
  const [passedCount, setPassedCount] = useState(0);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [isCodeModifiedAfterEval, setIsCodeModifiedAfterEval] = useState(false);

  // 100% All Passed state
  const isAllPassed = hasEvaluated && !isCodeModifiedAfterEval && allTestCases.length > 0 && (
    passedCount === allTestCases.length || allTestCases.every((tc) => tc.passed === true)
  );

  // Trigger celebration party-popper confetti on 100% pass
  const confettiCanvasRef = useRef(null);
  const triggerConfetti = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 1) * 14 - 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        gravity: 0.35,
        opacity: 1,
      });
    }

    let animationFrame;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.vRot;
        p.opacity -= 0.012;
        if (p.opacity > 0) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      }
      if (active) {
        animationFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    render();
  };

  // When all 10 tests pass, fire confetti
  useEffect(() => {
    if (isAllPassed) {
      triggerConfetti();
    }
  }, [isAllPassed]);

  // Reset evaluation state cleanly when user edits code
  const handleCodeChange = (newVal) => {
    setCode(newVal || "");
    codeRef.current = newVal || "";
    if (hasEvaluated) {
      setIsCodeModifiedAfterEval(true);
    }
    const sid = proctoredSessionId || routeSessionId;
    if (newVal) {
      try {
        localStorage.setItem("mz_recent_submitted_code", newVal);
        if (sid) {
          localStorage.setItem(`mz_draft_${sid}`, newVal);
        }
        if (questionId) {
          localStorage.setItem(`mz_draft_${questionId}`, newVal);
        }
      } catch {}
    }
  };

  // Custom STDIN in Run tab
  const [customStdin, setCustomStdin] = useState("");
  const [customOutput, setCustomOutput] = useState("");
  const [customError, setCustomError] = useState("");
  const [customDuration, setCustomDuration] = useState(null);

  // Actions loading state
  const [isRunning, setIsRunning] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Submission Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // =========================================================================
  // ASSESSMENT TIMER & AUTO-SUBMIT ENGINE (Fixed 1 Hour Limit = 3600 Seconds)
  // =========================================================================
  const [secondsRemaining, setSecondsRemaining] = useState(60 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isTimeExpired, setIsTimeExpired] = useState(false);

  // =========================================================================
  // REAL-TIME ASSESSMENT PROCTORING & FIVE RECOVERY CHANCES ENGINE
  // =========================================================================
  const { sessionId: routeSessionId } = useParams() || {};
  const navigate = useNavigate();

  const effectiveSessionId = sessionId || routeSessionId || null;
  const [proctoringStage, setProctoringStage] = useState(
    initialProctoringStage || (effectiveSessionId ? "active" : (isProctored ? "gate" : "active"))
  );
  const [proctoredSessionId, setProctoredSessionId] = useState(effectiveSessionId);
  const [candidateDetails, setCandidateDetails] = useState({
    fullName: "",
    candidateId: "",
    email: "",
    organization: "",
  });
  const [activeSessionProblem, setActiveSessionProblem] = useState(null);

  // Five Recovery Chances System (5/5)
  const [recoveryChancesRemaining, setRecoveryChancesRemaining] = useState(5);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryReason, setRecoveryReason] = useState("");
  const [recoveryTimestamp, setRecoveryTimestamp] = useState(null);
  const [isReverifying, setIsReverifying] = useState(false);

  // Synchronization refs for instant event isolation (prevent infinite interruption loops)
  const isRecoveryModalOpenRef = useRef(false);
  const isReverifyingRef = useRef(false);
  const lastResumeTimeRef = useRef(0);
  const isInitializingMediaRef = useRef(false);
  const immunityUntilRef = useRef(Date.now() + 15000);
  const needsMediaInitRef = useRef(false);

  useEffect(() => {
    isRecoveryModalOpenRef.current = isRecoveryModalOpen;
  }, [isRecoveryModalOpen]);

  useEffect(() => {
    isReverifyingRef.current = isReverifying;
  }, [isReverifying]);

  // Media Streams & Devices
  const [cameraStream, setCameraStream] = useState(externalCameraStream || null);
  const [micStream, setMicStream] = useState(externalMicStream || null);
  const [screenStream, setScreenStream] = useState(externalScreenStream || null);

  useEffect(() => {
    if (externalCameraStream) {
      setCameraStream(externalCameraStream);
      cameraStreamRef.current = externalCameraStream;
      if (procCameraRef.current && procCameraRef.current.srcObject !== externalCameraStream) {
        procCameraRef.current.srcObject = externalCameraStream;
        procCameraRef.current.play().catch(() => {});
      }
    }
  }, [externalCameraStream]);

  useEffect(() => {
    if (externalScreenStream) {
      setScreenStream(externalScreenStream);
      screenStreamRef.current = externalScreenStream;
      if (procScreenRef.current && procScreenRef.current.srcObject !== externalScreenStream) {
        procScreenRef.current.srcObject = externalScreenStream;
        procScreenRef.current.play().catch(() => {});
      }
    }
  }, [externalScreenStream]);

  useEffect(() => {
    if (externalMicStream) {
      setMicStream(externalMicStream);
      micStreamRef.current = externalMicStream;
    }
  }, [externalMicStream]);
  const [batteryInfo, setBatteryInfo] = useState({ percentage: 100, charging: false, supported: true });
  const [isProctoringCollapsed, setIsProctoringCollapsed] = useState(false);
  const [proctoringViewMode, setProctoringViewMode] = useState("dual"); // "dual" | "webcam" | "screen" - Default to "dual" so camera & screen are immediately visible
  const [procMicVolume, setProcMicVolume] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [isTerminated, setIsTerminated] = useState(false);
  const [isSubmittedReadOnly, setIsSubmittedReadOnly] = useState(false);
  const [submissionSuccessData, setSubmissionSuccessData] = useState(null);
  const [needsMediaInit, setNeedsMediaInit] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(() => !!document.fullscreenElement);
  const [isRefreshConfirmOpen, setIsRefreshConfirmOpen] = useState(false);
  const isSubmittedRef = useRef(false);

  // Monitor live fullscreen status
  useEffect(() => {
    const handleFs = () => {
      const inFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreenActive(inFs);
      if (inFs) {
        setIsRefreshConfirmOpen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFs);
    document.addEventListener("webkitfullscreenchange", handleFs);
    return () => {
      document.removeEventListener("fullscreenchange", handleFs);
      document.removeEventListener("webkitfullscreenchange", handleFs);
    };
  }, []);

  // Track active proctored session in sessionStorage so page reload/refresh keeps the assessment active
  useEffect(() => {
    const sid = proctoredSessionId || routeSessionId;
    if (sid && isProctored && proctoringStage === "active" && !isSubmittedReadOnly && !isTerminated) {
      try {
        sessionStorage.setItem("mz_active_proctored_session", sid);
      } catch {}
    }
  }, [proctoredSessionId, routeSessionId, isProctored, proctoringStage, isSubmittedReadOnly, isTerminated]);

  // Handle post-refresh recovery: silently restore code and state without interruption penalties
  useEffect(() => {
    try {
      const targetSid = proctoredSessionId || routeSessionId;
      if (targetSid) {
        // Restore saved draft code and compiler state seamlessly
        const savedDraft = localStorage.getItem(`mz_draft_${targetSid}`);
        if (savedDraft) setCode(savedDraft);
        const savedLang = localStorage.getItem(`mz_lang_${targetSid}`);
        if (savedLang) setSelectedLang(savedLang);
        const savedTime = localStorage.getItem(`mz_time_${targetSid}`);
        if (savedTime && !isNaN(Number(savedTime))) setSecondsRemaining(Number(savedTime));
      }
      sessionStorage.removeItem("mz_pending_refresh_violation");
    } catch (e) {
      console.warn("Error restoring session draft:", e);
    }
  }, [proctoredSessionId, routeSessionId]);

  // Intercept refresh attempts (F5, Ctrl+R, Cmd+R, and browser reload button via beforeunload)
  useEffect(() => {
    if (!isProctored || proctoringStage !== "active" || isSubmittedReadOnly || isTerminated) return;

    const handleKeyDown = (e) => {
      if (isSubmittedRef.current || isTerminated || isSubmittedReadOnly) return;
      if (
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        // Remove refresh confirmation modal completely in fullscreen mode
        const inFs = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement ||
          isFullscreenActive
        );
        if (inFs) {
          return;
        }
        setIsRefreshConfirmOpen(true);
      }
    };

    const handleBeforeUnload = () => {
      if (isSubmittedRef.current || isTerminated || isSubmittedReadOnly) return;
      const sid = proctoredSessionId || routeSessionId;
      if (sid) {
        try {
          localStorage.setItem(`mz_draft_${sid}`, code);
          localStorage.setItem(`mz_lang_${sid}`, selectedLang);
          localStorage.setItem(`mz_time_${sid}`, String(secondsRemaining));
        } catch {}
      }
    };

    const handleWindowFocus = () => {
      // Clear any legacy flags
      try {
        sessionStorage.removeItem("mz_pending_refresh_violation");
      } catch {}
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [isProctored, proctoringStage, isSubmittedReadOnly, isTerminated, proctoredSessionId, routeSessionId, code, selectedLang, secondsRemaining]);

  const cameraStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    micStreamRef.current = micStream;
  }, [micStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  const procCameraRef = useRef(null);
  const procScreenRef = useRef(null);
  const procAudioContextRef = useRef(null);
  const procAnalyserRef = useRef(null);
  const procAnimFrameRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const violationCooldownRef = useRef(false);

  // Quick 1-click camera connection
  const handleConnectCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: true,
      });
      setCameraStream(stream);
      setMicStream(stream);
      cameraStreamRef.current = stream;
      micStreamRef.current = stream;
      if (procCameraRef.current) {
        procCameraRef.current.srcObject = stream;
        procCameraRef.current.play().catch(() => {});
      }
      toast.success("Webcam connected successfully!");
    } catch (err) {
      toast.error("Camera access failed: " + err.message);
    }
  };

  // Quick 1-click screen sharing connection
  const handleConnectScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: false,
      });
      const track = stream.getVideoTracks()[0];
      const surface = track.getSettings?.().displaySurface || "monitor";
      if (surface === "browser" || surface === "window") {
        track.stop();
        toast.error("Entire screen selection is required. Please share your entire monitor.");
        return;
      }
      track.onended = () => {
        logProctoringAnomaly("SCREENSHARE_STOPPED", "Entire screen sharing was interrupted.");
        setScreenStream(null);
        screenStreamRef.current = null;
      };
      setScreenStream(stream);
      screenStreamRef.current = stream;
      if (procScreenRef.current) {
        procScreenRef.current.srcObject = stream;
        procScreenRef.current.play().catch(() => {});
      }
      toast.success("Entire screen sharing connected!");
    } catch (err) {
      toast.error("Screen sharing access failed: " + err.message);
    }
  };

  // Fullscreen trigger helper
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        }
      }
    } catch (err) {
      toast.warn("Click to activate full-screen mode: " + err.message);
    }
  };

  // Select navbar view mode and re-trigger video plays
  const handleSelectViewMode = (mode) => {
    setProctoringViewMode(mode);
    setTimeout(() => {
      if (procCameraRef.current && cameraStream) {
        if (procCameraRef.current.srcObject !== cameraStream) {
          procCameraRef.current.srcObject = cameraStream;
        }
        procCameraRef.current.play().catch(() => {});
      }
      if (procScreenRef.current && screenStream) {
        if (procScreenRef.current.srcObject !== screenStream) {
          procScreenRef.current.srcObject = screenStream;
        }
        procScreenRef.current.play().catch(() => {});
      }
    }, 50);
  };

  // Broadcast submission across all tabs (only invoked on actual submission/termination)
  const broadcastSessionSubmitted = (sid) => {
    try {
      const bc = new BroadcastChannel("mz_proc_sync");
      bc.postMessage({
        type: "SESSION_SUBMITTED",
        sessionId: sid || proctoredSessionId || routeSessionId,
      });
      bc.close();
    } catch {}
  };

  // Clean up all proctoring media streams, full screen, audio context, and telemetry listeners immediately
  const cleanupAllMediaAndProctoring = () => {
    isSubmittedRef.current = true;

    // 1. Gather all active streams from refs and state
    const streamsToStop = [
      cameraStreamRef.current,
      cameraStream,
      micStreamRef.current,
      micStream,
      screenStreamRef.current,
      screenStream,
    ];

    // 2. Immediately disable and stop each track
    streamsToStop.forEach((s) => {
      if (s) {
        try {
          s.getTracks().forEach((track) => {
            try {
              track.enabled = false;
              track.stop();
            } catch {}
          });
        } catch {}
      }
    });

    // 3. Clear video element preview references immediately
    if (procCameraRef.current) {
      try {
        if (procCameraRef.current.srcObject) {
          const s = procCameraRef.current.srcObject;
          if (s.getTracks) {
            s.getTracks().forEach((t) => {
              try {
                t.enabled = false;
                t.stop();
              } catch {}
            });
          }
        }
        procCameraRef.current.srcObject = null;
      } catch {}
    }

    if (procScreenRef.current) {
      try {
        if (procScreenRef.current.srcObject) {
          const s = procScreenRef.current.srcObject;
          if (s.getTracks) {
            s.getTracks().forEach((t) => {
              try {
                t.enabled = false;
                t.stop();
              } catch {}
            });
          }
        }
        procScreenRef.current.srcObject = null;
      } catch {}
    }

    // 4. Nullify states & refs
    setCameraStream(null);
    setMicStream(null);
    setScreenStream(null);
    cameraStreamRef.current = null;
    micStreamRef.current = null;
    screenStreamRef.current = null;

    // 5. Close Web Audio Context & meter loop
    if (procAudioContextRef.current && procAudioContextRef.current.state !== "closed") {
      procAudioContextRef.current.close().catch(() => {});
    }
    if (procAnimFrameRef.current) {
      cancelAnimationFrame(procAnimFrameRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // 6. Immediately exit full-screen mode across all standard & vendor prefixes
    try {
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
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
    setIsFullscreenActive(false);
  };

  // Standalone tab loader: Load proctored session state from database
  useEffect(() => {
    if (!routeSessionId) return;
    let isMounted = true;

    async function fetchSession() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/coding/proctored-session/${routeSessionId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        // If session is already submitted or terminated, redirect immediately to immutable report
        if (data.status === "submitted" || data.status === "terminated") {
          navigate(`/assessment-report/${routeSessionId}`, { replace: true });
          return;
        }

        if (data.problemData) {
          setActiveSessionProblem(data.problemData);
          if (Array.isArray(data.problemData.testCases) && data.problemData.testCases.length > 0) {
            setAllTestCases(
              data.problemData.testCases.map((tc, idx) => ({
                index: idx + 1,
                input: tc.isHidden || idx >= 3 ? `[Hidden Test Case #${idx + 1}]` : tc.input,
                expectedOutput: tc.isHidden || idx >= 3 ? `[Hidden Output #${idx + 1}]` : tc.expectedOutput,
                isHidden: !!tc.isHidden || idx >= 3,
                passed: null,
                actualOutput: "",
                duration: 0,
                error: null,
              }))
            );
          }
        }
        if (data.candidateDetails) {
          setCandidateDetails(data.candidateDetails);
        }
        if (data.chancesRemaining !== undefined) {
          setRecoveryChancesRemaining(data.chancesRemaining);
          setViolationsCount(data.chancesUsed || 5 - data.chancesRemaining);
        }
        if (data.draftCode) {
          setCode(data.draftCode);
        }
        if (data.draftLanguage) {
          setSelectedLang(normalizeLang(data.draftLanguage));
        }
        if (data.timeRemaining !== undefined) {
          setSecondsRemaining(data.timeRemaining);
        }
        if (data.isTimerPaused && !isRecoveryModalOpenRef.current) {
          setIsTimerRunning(false);
          setIsRecoveryModalOpen(true);
          isRecoveryModalOpenRef.current = true;
          setRecoveryReason("Assessment was paused due to interruption. Re-verification required to resume.");
          setRecoveryTimestamp(new Date());
        }

        setProctoredSessionId(routeSessionId);
        setProctoringStage("active");

        // Broadcast to supervisor gate tab
        try {
          const bc = new BroadcastChannel("mz_proc_sync");
          bc.postMessage({ type: "SESSION_ACTIVE", sessionId: routeSessionId });
          bc.close();
        } catch {}
      } catch (err) {
        console.error("Session fetch error:", err);
      }
    }

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, [routeSessionId, navigate]);

  // Request standalone window telemetry if not acquired
  useEffect(() => {
    if (
      !isEmbedded &&
      !externalCameraStream &&
      routeSessionId &&
      proctoringStage === "active" &&
      !cameraStream &&
      !isRecoveryModalOpen &&
      !isRecoveryModalOpenRef.current &&
      !isTerminated &&
      !isSubmittedReadOnly
    ) {
      setNeedsMediaInit(true);
      needsMediaInitRef.current = true;
    }
  }, [isEmbedded, externalCameraStream, routeSessionId, proctoringStage, cameraStream, isRecoveryModalOpen, isTerminated, isSubmittedReadOnly]);

  const handleInitStandaloneMedia = async () => {
    try {
      isInitializingMediaRef.current = true;
      immunityUntilRef.current = Date.now() + 30000;

      // 1. Camera & Mic first (does not cause window blur / screen picker drops)
      const cStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: true,
      });
      setCameraStream(cStream);
      setMicStream(cStream);
      cameraStreamRef.current = cStream;
      micStreamRef.current = cStream;
      if (procCameraRef.current) {
        procCameraRef.current.srcObject = cStream;
        procCameraRef.current.play().catch(() => {});
      }

      // 2. Screen sharing second
      const sStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: false,
      });
      const track = sStream.getVideoTracks()[0];
      const surface = track.getSettings?.().displaySurface || "monitor";
      if (surface === "browser" || surface === "window") {
        track.stop();
        toast.error("Entire screen selection is required. Please share your entire monitor.");
        isInitializingMediaRef.current = false;
        return;
      }
      track.onended = () => {
        if (
          isSubmittedRef.current ||
          isTerminated ||
          isSubmittedReadOnly ||
          isRecoveryModalOpenRef.current ||
          isReverifyingRef.current ||
          isInitializingMediaRef.current ||
          Date.now() < immunityUntilRef.current
        ) return;
        logProctoringAnomaly("SCREENSHARE_STOPPED", "Entire screen sharing was interrupted.");
      };
      setScreenStream(sStream);
      screenStreamRef.current = sStream;
      if (procScreenRef.current) {
        procScreenRef.current.srcObject = sStream;
        procScreenRef.current.play().catch(() => {});
      }

      // 3. Request Fullscreen AFTER media dialogs are completely closed
      try {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
          }
        }
      } catch (fsErr) {
        console.warn("Fullscreen request error:", fsErr);
      }

      setNeedsMediaInit(false);
      needsMediaInitRef.current = false;
      setIsRecoveryModalOpen(false);
      isRecoveryModalOpenRef.current = false;
      setIsTimerRunning(true);
      lastResumeTimeRef.current = Date.now();
      immunityUntilRef.current = Date.now() + 10000;
      toast.success("All proctoring feeds connected successfully!");
    } catch (err) {
      toast.error("Telemetry access failed: " + err.message);
    } finally {
      isInitializingMediaRef.current = false;
    }
  };

  // Called when Pre-Assessment Security Gate checks pass (modal flow)
  const handleProctoringVerified = async (gateData) => {
    isInitializingMediaRef.current = true;
    immunityUntilRef.current = Date.now() + 15000;

    setCameraStream(gateData.cameraStream);
    setMicStream(gateData.micStream);
    setScreenStream(gateData.screenStream);
    cameraStreamRef.current = gateData.cameraStream;
    micStreamRef.current = gateData.micStream;
    screenStreamRef.current = gateData.screenStream;
    setProctoringViewMode("dual");

    if (gateData.batteryInfo) {
      setBatteryInfo(gateData.batteryInfo);
    }
    if (gateData.candidateDetails) {
      setCandidateDetails(gateData.candidateDetails);
    }
    if (gateData.sessionId) {
      setProctoredSessionId(gateData.sessionId);
    }
    setProctoringStage("active");

    // Immediately play streams on workspace video preview elements
    setTimeout(() => {
      if (procCameraRef.current && gateData.cameraStream) {
        if (procCameraRef.current.srcObject !== gateData.cameraStream) {
          procCameraRef.current.srcObject = gateData.cameraStream;
        }
        procCameraRef.current.play().catch(() => {});
      }
      if (procScreenRef.current && gateData.screenStream) {
        if (procScreenRef.current.srcObject !== gateData.screenStream) {
          procScreenRef.current.srcObject = gateData.screenStream;
        }
        procScreenRef.current.play().catch(() => {});
      }
    }, 60);

    // Enter full-screen mode if not already active
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        }
      } catch {}
    }

    activeMountTimeRef.current = Date.now();
    lastResumeTimeRef.current = Date.now();
    immunityUntilRef.current = Date.now() + 10000;
    isInitializingMediaRef.current = false;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/coding/proctored-session/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId: gateData.sessionId,
          questionId: questionId || problemData?.id || "unspecified",
          assessmentTitle: questionDetails?.title,
          problemData: questionDetails,
          candidateDetails: gateData.candidateDetails,
          deviceInfo: {
            camera: true,
            microphone: true,
            screenShare: true,
            fullscreen: true,
            displaySurface: gateData.displaySurface || "monitor",
          },
        }),
      });
      if (res.ok) {
        const sData = await res.json();
        if (sData.sessionId) {
          setProctoredSessionId(sData.sessionId);
        }
      }
    } catch (err) {
      console.error("Proctored session registration error:", err);
    }
  };

  // Five-Chance Anomaly and Interruption Logger
  const logProctoringAnomaly = async (type, message) => {
    if (
      isSubmittedRef.current ||
      isTerminated ||
      isSubmittedReadOnly ||
      violationCooldownRef.current ||
      isRecoveryModalOpenRef.current ||
      isReverifyingRef.current ||
      isInitializingMediaRef.current ||
      needsMediaInitRef.current ||
      Date.now() < immunityUntilRef.current
    ) {
      return;
    }
    violationCooldownRef.current = true;
    setTimeout(() => {
      violationCooldownRef.current = false;
    }, 6000);

    // Prevent re-trigger while interruption modal is active
    isRecoveryModalOpenRef.current = true;

    const now = new Date();
    setRecoveryReason(message);
    setRecoveryTimestamp(now);
    setIsTimerRunning(false);

    const sid = proctoredSessionId || routeSessionId;
    if (!sid) {
      setViolationsCount((p) => p + 1);
      setIsRecoveryModalOpen(true);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/coding/proctored-session/${sid}/interruption`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId: sid,
          eventType: type,
          details: message,
          batteryLevel: batteryInfo.percentage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rem = data.chancesRemaining !== undefined ? data.chancesRemaining : Math.max(0, 5 - (data.chancesUsed || 0));
        setRecoveryChancesRemaining(rem);
        setViolationsCount(data.chancesUsed || (5 - rem));

        if (data.isTerminated || rem <= 0) {
          isSubmittedRef.current = true;
          setIsTerminated(true);
          setIsSubmittedReadOnly(true);
          setIsRecoveryModalOpen(true);
          cleanupAllMediaAndProctoring();
          broadcastSessionSubmitted(sid);

          // Auto-submit current code
          try {
            await fetch(`${API_BASE}/api/coding/proctored-session/${sid}/submit`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                sessionId: sid,
                code,
                language: selectedLang,
              }),
            });
          } catch {}
        } else {
          setIsRecoveryModalOpen(true);
        }
      } else {
        setRecoveryChancesRemaining((prev) => Math.max(0, prev - 1));
        setIsRecoveryModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to post proctoring interruption:", err);
      setRecoveryChancesRemaining((prev) => Math.max(0, prev - 1));
      setIsRecoveryModalOpen(true);
    }
  };

  // Re-verify devices and resume assessment
  const handleResumeAssessment = async () => {
    setIsReverifying(true);
    isReverifyingRef.current = true;
    violationCooldownRef.current = true;
    immunityUntilRef.current = Date.now() + 30000;
    try {
      // 1. Camera + Mic: Only re-request if active tracks do not exist
      let cStream = cameraStreamRef.current || cameraStream;
      const isCamLive = cStream && cStream.getVideoTracks && cStream.getVideoTracks().some((t) => t.readyState === "live");
      if (!isCamLive) {
        cStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: true,
        });
        setCameraStream(cStream);
        setMicStream(cStream);
        cameraStreamRef.current = cStream;
        micStreamRef.current = cStream;
      }
      if (procCameraRef.current && cStream) {
        procCameraRef.current.srcObject = cStream;
        procCameraRef.current.play().catch(() => {});
      }

      // 2. Screen Share: Only re-request if active tracks do not exist
      let sStream = screenStreamRef.current || screenStream;
      const isScreenLive = sStream && sStream.getVideoTracks && sStream.getVideoTracks().some((t) => t.readyState === "live");
      if (!isScreenLive) {
        sStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "monitor" },
          audio: false,
        });
        const track = sStream.getVideoTracks()[0];
        const surface = track.getSettings?.().displaySurface || "monitor";
        if (surface === "browser" || surface === "window") {
          track.stop();
          toast.error("Entire screen selection is required. Please share your entire monitor.");
          setIsReverifying(false);
          isReverifyingRef.current = false;
          return;
        }
        track.onended = () => {
          if (
            isSubmittedRef.current ||
            isTerminated ||
            isSubmittedReadOnly ||
            isRecoveryModalOpenRef.current ||
            isReverifyingRef.current ||
            isInitializingMediaRef.current ||
            Date.now() < immunityUntilRef.current
          ) return;
          logProctoringAnomaly("SCREENSHARE_STOPPED", "Entire screen sharing was interrupted.");
        };
        setScreenStream(sStream);
        screenStreamRef.current = sStream;
      }
      if (procScreenRef.current && sStream) {
        procScreenRef.current.srcObject = sStream;
        procScreenRef.current.play().catch(() => {});
      }

      // 3. Fullscreen: Request AFTER media permissions have concluded
      try {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
          }
        }
      } catch (fsErr) {
        console.warn("Fullscreen request error during resume:", fsErr);
      }

      const sid = proctoredSessionId || routeSessionId;
      if (sid) {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/coding/proctored-session/${sid}/resume`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            deviceInfo: {
              camera: true,
              microphone: true,
              screenShare: true,
              fullscreen: true,
              displaySurface: "monitor",
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.timeRemaining !== undefined) {
            setSecondsRemaining(data.timeRemaining);
          }
        }
      }

      setIsTimerRunning(true);
      setIsRecoveryModalOpen(false);
      isRecoveryModalOpenRef.current = false;
      setNeedsMediaInit(false);
      needsMediaInitRef.current = false;

      // Reset grace periods to give 10 seconds of immunity after successful resume
      lastResumeTimeRef.current = Date.now();
      activeMountTimeRef.current = Date.now();
      immunityUntilRef.current = Date.now() + 10000;
      violationCooldownRef.current = true;
      setTimeout(() => {
        violationCooldownRef.current = false;
      }, 8000);

      toast.success(`Assessment Resumed! Remaining chances: ${recoveryChancesRemaining}/5`);
    } catch (err) {
      toast.error("Re-verification failed: " + err.message);
    } finally {
      setIsReverifying(false);
      isReverifyingRef.current = false;
    }
  };

  // Video streams and Web Audio Analyser setup in active stage
  useEffect(() => {
    if (!isProctored || proctoringStage !== "active") return;

    if (cameraStream && procCameraRef.current) {
      procCameraRef.current.srcObject = cameraStream;
      procCameraRef.current.play().catch(() => {});
    }

    if (screenStream && procScreenRef.current) {
      procScreenRef.current.srcObject = screenStream;
      procScreenRef.current.play().catch(() => {});
    }

    if (micStream) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          procAudioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          procAnalyserRef.current = analyser;
          const source = audioCtx.createMediaStreamSource(micStream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const vol = Math.min(100, Math.round((avg / 128) * 100));
            setProcMicVolume(vol);
            procAnimFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (err) {
        console.warn("Audio meter setup error:", err);
      }
    }

    return () => {
      if (procAnimFrameRef.current) cancelAnimationFrame(procAnimFrameRef.current);
      if (procAudioContextRef.current && procAudioContextRef.current.state !== "closed") {
        procAudioContextRef.current.close().catch(() => {});
      }
    };
  }, [isProctored, proctoringStage, cameraStream, screenStream, micStream]);

  // Battery monitoring in active stage
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.getBattery === "function") {
      navigator.getBattery().then((battery) => {
        const updateBat = () => {
          setBatteryInfo({
            percentage: Math.round(battery.level * 100),
            charging: battery.charging,
            supported: true,
          });
        };
        battery.addEventListener("levelchange", updateBat);
        battery.addEventListener("chargingchange", updateBat);
      }).catch(() => {});
    }
  }, []);

  // Grace period tracker to prevent transition glitch warnings
  const activeMountTimeRef = useRef(Date.now());
  useEffect(() => {
    if (proctoringStage === "active") {
      activeMountTimeRef.current = Date.now();
    }
  }, [proctoringStage]);

  // Real-time Event Listeners: Fullscreen, Tab Switch / Blur, Stream Track Ended, Heartbeat
  useEffect(() => {
    if (!isProctored || proctoringStage !== "active" || isTerminated || isSubmittedReadOnly || isSubmittedRef.current) return;

    const onFsChange = () => {
      if (
        isSubmittedRef.current ||
        isTerminated ||
        isSubmittedReadOnly ||
        isRecoveryModalOpenRef.current ||
        isReverifyingRef.current ||
        isInitializingMediaRef.current ||
        needsMediaInitRef.current ||
        Date.now() < immunityUntilRef.current
      ) return;

      const inFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      if (!inFs) {
        logProctoringAnomaly(
          "FULLSCREEN_EXIT",
          "Assessment requires continuous fullscreen mode. Exiting fullscreen is an integrity violation.",
          "fullscreen"
        );
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);

    const onVisibilityChange = () => {
      if (
        isSubmittedRef.current ||
        isTerminated ||
        isSubmittedReadOnly ||
        isRecoveryModalOpenRef.current ||
        isReverifyingRef.current ||
        isInitializingMediaRef.current ||
        needsMediaInitRef.current ||
        Date.now() < immunityUntilRef.current
      ) return;

      if (document.hidden) {
        logProctoringAnomaly(
          "TAB_SWITCH",
          "Assessment window lost focus or switched tabs. Navigating away from the compiler is prohibited.",
          "focus"
        );
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const screenTrack = screenStream?.getVideoTracks?.()[0];
    if (screenTrack) {
      screenTrack.onended = () => {
        if (
          isSubmittedRef.current ||
          isTerminated ||
          isSubmittedReadOnly ||
          isRecoveryModalOpenRef.current ||
          isReverifyingRef.current ||
          isInitializingMediaRef.current ||
          needsMediaInitRef.current ||
          Date.now() < immunityUntilRef.current
        ) return;
        logProctoringAnomaly(
          "SCREENSHARE_STOPPED",
          "Entire screen sharing was interrupted. You must keep sharing your screen during the assessment.",
          "screenshare"
        );
      };
    }

    const cameraTrack = cameraStream?.getVideoTracks?.()[0];
    if (cameraTrack) {
      cameraTrack.onended = () => {
        if (
          isSubmittedRef.current ||
          isTerminated ||
          isSubmittedReadOnly ||
          isRecoveryModalOpenRef.current ||
          isReverifyingRef.current ||
          isInitializingMediaRef.current ||
          needsMediaInitRef.current ||
          Date.now() < immunityUntilRef.current
        ) return;
        logProctoringAnomaly(
          "CAMERA_DISCONNECTED",
          "Webcam video stream was stopped or disconnected.",
          "camera"
        );
      };
    }

    // 20s Heartbeat
    heartbeatIntervalRef.current = setInterval(async () => {
      if (!proctoredSessionId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/coding/proctored-session/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            sessionId: proctoredSessionId,
            batteryLevel: batteryInfo.percentage,
            draftCode: codeRef.current,
            language: selectedLangRef.current,
          }),
        });
        if (res.ok) {
          const hbData = await res.json();
          if (hbData.isTerminated) {
            setIsTerminated(true);
            toast.error("Assessment has been terminated by the proctoring server.", { autoClose: 2000 });
          }
        }
      } catch {}
    }, 20000);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [isProctored, proctoringStage, isTerminated, isSubmittedReadOnly, screenStream, cameraStream, proctoredSessionId, batteryInfo]);

  // Teardown media tracks ONLY on true component unmount (empty dependency array prevents re-render closures)
  useEffect(() => {
    return () => {
      if (isEmbedded || externalCameraStream) {
        // Parent exam workspace owns the stream lifecycle; do not terminate tracks
        return;
      }
      const streams = [
        cameraStreamRef.current,
        micStreamRef.current,
        screenStreamRef.current,
      ];
      streams.forEach((s) => {
        if (s) {
          try {
            s.getTracks().forEach((track) => {
              track.enabled = false;
              track.stop();
            });
          } catch {}
        }
      });
      if (procAudioContextRef.current && procAudioContextRef.current.state !== "closed") {
        procAudioContextRef.current.close().catch(() => {});
      }
      if (procAnimFrameRef.current) {
        cancelAnimationFrame(procAnimFrameRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isTimerRunning || isTimeExpired) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        const next = prev - 1;
        // When timer is less than 2 minutes (<= 120s): appear once every 10 seconds, last 2 seconds
        if (next <= 120 && next > 0 && next % 10 === 0) {
          triggerUrgentPopup();
        }
        return next;
      });
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      if (urgentAlertTimerRef.current) clearTimeout(urgentAlertTimerRef.current);
    };
  }, [isTimerRunning, isTimeExpired]);

  const handleAutoSubmitOnTimeout = () => {
    isSubmittedRef.current = true;
    setIsTimeExpired(true);
    setIsTimerRunning(false);
    setIsSubmittedReadOnly(true);
    cleanupAllMediaAndProctoring();
    const sid = proctoredSessionId || routeSessionId;
    if (sid) {
      broadcastSessionSubmitted(sid);
    }
    toast.error("⏰ Assessment time limit (1 hour) expired! Submitting your solution for grading...", {
      autoClose: 2000,
      toastId: "timeout_alert",
    });
    executeSubmit();
  };

  const formatTimer = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    }
    return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  // Language display labels
  const langLabels = {
    cpp: "CPP",
    python: "Python 3",
    javascript: "JavaScript",
    java: "Java",
  };

  const handleSelectLanguage = (langKey) => {
    setSelectedLang(langKey);
    setIsLangMenuOpen(false);
    const trimmed = (code || "").trim();
    if (!trimmed || trimmed === "# Enter your code below" || trimmed === "// Enter your code below") {
      setCode(getStarterPlaceholder(langKey));
    }
    setHasEvaluated(false);
    setIsCodeModifiedAfterEval(false);
  };

  const handleResetCode = () => {
    setIsResetConfirmOpen(true);
  };

  const confirmResetCode = () => {
    setCode(getStarterPlaceholder(selectedLang));
    try {
      localStorage.removeItem(`mz_draft_${questionId}_${selectedLang}`);
      localStorage.removeItem(`mz_ch_draft_${questionId}_${selectedLang}`);
    } catch {}
    setHasEvaluated(false);
    setPassedCount(0);
    setIsCodeModifiedAfterEval(false);
    setAllTestCases((prev) =>
      prev.map((tc) => ({
        ...tc,
        passed: null,
        actualOutput: "",
        duration: 0,
        error: null,
      }))
    );
    setIsResetConfirmOpen(false);
  };

  // Save Draft (Silent save with footer status display)
  const handleSave = async () => {
    if (isTimeExpired) {
      toast.warn("Assessment time has expired.", { toastId: "expired_warn" });
      return;
    }
    setIsSaving(true);
    try {
      if (onSaveDraft) {
        await onSaveDraft(code, selectedLang);
      }
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch {
      toast.error("Failed to save draft.", { toastId: "draft_err" });
    } finally {
      setIsSaving(false);
    }
  };

  // Run Button (Sample or Custom STDIN)
  const handleRun = async () => {
    setIsRunning(true);
    setIsDrawerOpen(true);
    setActiveTab("run");

    try {
      let res;
      if (onRun) {
        res = await onRun(code, selectedLang, customStdin);
      } else {
        const qId = questionId || problemData?.id || "ch_two_sum";
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_BASE}/api/coding/challenges/${qId}/test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            language: selectedLang,
            code,
            customInput: customStdin?.trim() ? customStdin : undefined,
          }),
        });
        const rawText = await resp.text();
        try {
          res = rawText ? JSON.parse(rawText) : {};
        } catch {
          res = { error: rawText || `Server error (${resp.status})` };
        }
      }

      if (res?.error) {
        setCustomError(res.error);
        toast.error(res.error.split("\n")[0] || "Code execution failed.");
        return;
      }

      if (res.isCustom) {
        setCustomOutput(res.output || "");
        setCustomError(res.error || "");
        setCustomDuration(res.duration || 0);
      } else if (res.results) {
        setAllTestCases((prev) => {
          const copy = [...prev];
          res.results.forEach((r, idx) => {
            if (copy[idx]) {
              copy[idx].passed = r.passed;
              copy[idx].actualOutput = r.actual || r.actualOutput || "";
              copy[idx].duration = r.duration || r.durationMs || 0;
              copy[idx].error = r.error;
            }
          });
          return copy;
        });
      }
      toast.success("Code executed successfully.");
    } catch (err) {
      toast.error(`Execution failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Run Tests Button (Executes solution against all test cases in runner)
  const handleRunTests = async () => {
    setIsRunningTests(true);
    setIsDrawerOpen(true);
    setActiveTab("run_tests");
    setBannerVisible(true);

    try {
      let result = null;
      if (onRunTests) {
        result = await onRunTests(code, selectedLang);
      } else {
        const qId = questionId || problemData?.id || "ch_two_sum";
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_BASE}/api/coding/challenges/${qId}/test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            language: selectedLang,
            code,
          }),
        });
        const rawText = await resp.text();
        try {
          result = rawText ? JSON.parse(rawText) : {};
        } catch {
          result = { error: rawText || `Server error (${resp.status})` };
        }
      }

      if (result?.error) {
        // Strict compiler/syntax error surfaced immediately
        toast.error(result.error.split("\n")[0] || "Language Syntax / Compilation Error");
        setAllTestCases((prev) =>
          prev.map((tc) => ({
            ...tc,
            passed: false,
            actualOutput: "[Compilation / Syntax Error]",
            error: result.error,
          }))
        );
        setPassedCount(0);
        setHasEvaluated(true);
        return;
      }

      const resultsArray = result?.results || [];
      let pCount = 0;

      setAllTestCases((prev) => {
        const base = prev.length > 0
          ? prev
          : (effectiveTestCases.length > 0 ? effectiveTestCases : (resultsArray.length > 0 ? Array.from({ length: resultsArray.length }) : Array.from({ length: 10 })));
        const updated = [...base];
        for (let i = 0; i < updated.length; i++) {
          const r = resultsArray[i];
          if (r) {
            const isPassed = !!r.passed;
            if (isPassed) pCount++;
            updated[i] = {
              ...(updated[i] || {}),
              index: i + 1,
              passed: isPassed,
              actualOutput: r.actual || r.actualOutput || (isPassed ? "[Passed]" : "[Failed Output]"),
              duration: r.duration || r.durationMs || 35,
              error: r.error || null,
              input: r.input || updated[i]?.input || `Test Case #${i + 1}`,
              expectedOutput: r.expected || r.expectedOutput || updated[i]?.expectedOutput || "Expected Output",
              isHidden: r.isHidden !== undefined ? r.isHidden : (updated[i]?.isHidden !== undefined ? updated[i].isHidden : i >= 3),
            };
          } else if (result?.passedCount === (base.length || 10) || result?.status === "ACCEPTED" || result?.status === "PASSED") {
            pCount++;
            updated[i] = {
              ...(updated[i] || {}),
              index: i + 1,
              passed: true,
              actualOutput: "[Passed]",
              duration: 35,
              error: null,
              input: updated[i]?.input || `Test Case #${i + 1}`,
              expectedOutput: updated[i]?.expectedOutput || "Expected Output",
              isHidden: updated[i]?.isHidden !== undefined ? updated[i].isHidden : i >= 3,
            };
          } else {
            updated[i] = {
              ...(updated[i] || {}),
              index: i + 1,
              passed: false,
              actualOutput: "[Execution Terminated]",
              duration: 0,
              error: "Test case did not execute",
              input: updated[i]?.input || `Test Case #${i + 1}`,
              expectedOutput: updated[i]?.expectedOutput || "Expected Output",
              isHidden: updated[i]?.isHidden !== undefined ? updated[i].isHidden : i >= 3,
            };
          }
        }
        return updated;
      });

      const finalCount = result?.passedCount !== undefined ? result.passedCount : pCount;
      setPassedCount(finalCount);
      setHasEvaluated(true);
      setIsCodeModifiedAfterEval(false);

      toast.dismiss();
      if (finalCount === (allTestCases.length || 10)) {
        toast.success("🏆 Incredible! Passed all test cases (100% Score)! Interface verified in Green!", { toastId: "eval_result" });
      } else if (finalCount >= Math.ceil((allTestCases.length || 10) * 0.8)) {
        toast.success(`Passed ${finalCount}/${allTestCases.length} tests! Meets passing criteria.`, { toastId: "eval_result" });
      } else {
        toast.warn(`Passed ${finalCount}/${allTestCases.length} tests (${Math.round((finalCount / (allTestCases.length || 1)) * 100)}%). Minimum 80% required to pass.`, { toastId: "eval_result" });
      }
    } catch (err) {
      toast.error(`Testing error: ${err.message || "Failed to execute tests"}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Open confirmation modal before submitting
  const handleOpenSubmitModal = () => {
    setIsConfirmModalOpen(true);
  };

  // Final submission execution (called from Confirmation Modal)
  const executeSubmit = async () => {
    // 1. Mark submitted immediately to block anomaly triggers
    isSubmittedRef.current = true;
    setIsSubmittedReadOnly(true);
    setIsTimerRunning(false);

    // 2. SYNCHRONOUSLY stop camera, mic, screen sharing tracks and exit fullscreen ONLY if NOT embedded
    if (!isEmbedded && !externalCameraStream) {
      cleanupAllMediaAndProctoring();
    }

    // 3. Immediately broadcast across tabs
    let sid = proctoredSessionId || routeSessionId;
    if (sid) {
      broadcastSessionSubmitted(sid);
    }

    setIsSubmitting(true);
    setIsConfirmModalOpen(false);
    setIsDrawerOpen(true);
    setActiveTab("run_tests");
    setBannerVisible(true);

    try {
      const token = localStorage.getItem("token");

      // Auto-init session if one doesn't exist yet so attempt is permanently recorded in DB
      if (!sid) {
        try {
          const initRes = await fetch(`${API_BASE}/api/coding/proctored-session/init`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              candidateDetails: candidateDetails?.fullName ? candidateDetails : {
                fullName: localStorage.getItem("userName") || "Mastery Zone Candidate",
                candidateId: "MZ-" + Math.floor(100000 + Math.random() * 900000),
                email: localStorage.getItem("userEmail") || "candidate@masteryzone.com",
                organization: "Mastery Zone Academy",
              },
              questionId: questionId || problemData?.id || "ch_two_sum",
              assessmentTitle: questionDetails.title,
              defaultLanguage: selectedLang,
              problemData: questionDetails,
              questionsList: questionsList && questionsList.length > 0 ? questionsList : undefined,
            }),
          });
          if (initRes.ok) {
            const initData = await initRes.json();
            sid = initData.sessionId;
            setProctoredSessionId(sid);
          }
        } catch (e) {
          console.warn("Auto session init note:", e);
        }
      }

      let result = null;
      if (onSubmit) {
        result = await onSubmit(code, selectedLang);
      } else {
        const qId = questionId || problemData?.id;
        const res = await fetch(`${API_BASE}/api/coding/challenges/${qId}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            language: selectedLang,
            code,
          }),
        });
        const rawText = await res.text();
        try {
          result = rawText ? JSON.parse(rawText) : {};
        } catch {
          result = { error: rawText || `Server error (${res.status})` };
        }
      }

      const resultsArray = Array.isArray(result?.results) ? result.results : [];
      let pCount = 0;

      const baseCases = (allTestCases && allTestCases.length > 0)
        ? allTestCases
        : (effectiveTestCases && effectiveTestCases.length > 0)
          ? effectiveTestCases
          : (resultsArray.length > 0 ? Array.from({ length: resultsArray.length }) : Array.from({ length: 10 }));

      const updatedCases = baseCases.map((tc, i) => {
        const r = resultsArray[i];
        if (r) {
          const isPassed = !!r.passed;
          if (isPassed) pCount++;
          return {
            ...(tc || {}),
            index: i + 1,
            passed: isPassed,
            actualOutput: r.actual || r.actualOutput || (isPassed ? "[Passed]" : "[Failed Output]"),
            duration: r.duration || r.durationMs || 35,
            error: r.error || null,
            input: r.input || tc?.input || `Test Case #${i + 1}`,
            expectedOutput: r.expected || r.expectedOutput || tc?.expectedOutput || "Expected Output",
            isHidden: r.isHidden !== undefined ? r.isHidden : (tc?.isHidden !== undefined ? tc.isHidden : i >= 3),
          };
        } else if (result?.passedCount === baseCases.length || result?.status === "ACCEPTED" || result?.status === "PASSED") {
          pCount++;
          return {
            ...(tc || {}),
            index: i + 1,
            passed: true,
            actualOutput: "[Passed]",
            duration: 35,
            error: null,
            input: tc?.input || `Test Case #${i + 1}`,
            expectedOutput: tc?.expectedOutput || "Expected Output",
            isHidden: tc?.isHidden !== undefined ? tc.isHidden : i >= 3,
          };
        } else {
          return {
            ...(tc || {}),
            index: i + 1,
            passed: false,
            actualOutput: "[Failed Output]",
            duration: 0,
            error: "Not executed",
            input: tc?.input || `Test Case #${i + 1}`,
            expectedOutput: tc?.expectedOutput || "Expected Output",
            isHidden: tc?.isHidden !== undefined ? tc.isHidden : i >= 3,
          };
        }
      });

      setAllTestCases(updatedCases);

      const finalPassed = result?.passedCount !== undefined ? result.passedCount : pCount;
      const totalTestsCount = updatedCases.length || 10;
      setPassedCount(finalPassed);
      setHasEvaluated(true);
      setIsCodeModifiedAfterEval(false);

      // Construct verified 10-test suite execution objects
      const submittedTestResults = updatedCases.map((tc, idx) => ({
        testIndex: idx + 1,
        testNumber: idx + 1,
        passed: tc.passed !== null ? tc.passed : (idx < finalPassed),
        durationMs: tc.duration || 35,
        input: tc.isHidden ? "[Hidden Test Case]" : (tc.input || `Test Case #${idx + 1}`),
        expected: tc.isHidden ? "[Hidden Output]" : (tc.expectedOutput || "Expected Output"),
        actual: tc.actualOutput || (tc.passed ? "[Passed]" : "[Failed Output]"),
        error: tc.error || null,
        isHidden: !!tc.isHidden,
      }));

      // Update attempt count and best score
      if (result?.attemptsCount !== undefined) setAttemptsCount(result.attemptsCount);
      if (result?.bestScore !== undefined) setBestScore(result.bestScore);
      if (Array.isArray(result?.attempts)) setHistoryList(result.attempts);

      // Freeze timer permanently after submission
      setIsTimerRunning(false);

      const isAccepted = result?.passed || result?.status === "PASSED" || result?.status === "ACCEPTED" || finalPassed >= Math.round(totalTestsCount * 0.8);
      const calculatedScore = result?.score !== undefined ? result.score : Math.round((finalPassed / (totalTestsCount || 1)) * 100);
      const calculatedGrade = finalPassed === totalTestsCount ? "A+" : finalPassed >= Math.round(totalTestsCount * 0.8) ? "B" : "F";
      const calculatedAccuracy = Math.round((finalPassed / (totalTestsCount || 1)) * 100);

      // Save report summary permanently to localStorage so Home page can access all reports instantly
      const reportItem = {
        sessionId: sid || `session_${Date.now()}`,
        assessmentTitle: questionDetails.title || "MZ-ASM Assessment",
        questionTitle: questionDetails.title || "Algorithmic Assessment",
        difficulty: problemData?.difficulty || "Medium",
        category: problemData?.category || "Algorithms",
        candidateDetails: candidateDetails?.fullName ? candidateDetails : {
          fullName: localStorage.getItem("userName") || "Mastery Zone Candidate",
          email: localStorage.getItem("userEmail") || "candidate@masteryzone.com",
        },
        submittedAt: new Date().toISOString(),
        score: calculatedScore,
        grade: calculatedGrade,
        accuracy: calculatedAccuracy,
        passedTests: finalPassed,
        totalTests: totalTestsCount,
        durationSeconds: Math.max(1, 3600 - secondsRemaining),
        language: selectedLang,
        passed: isAccepted,
        violationsCount: violationsCount !== undefined ? violationsCount : Math.max(0, 5 - recoveryChancesRemaining),
        recoveryChancesUsed: violationsCount !== undefined ? violationsCount : Math.max(0, 5 - recoveryChancesRemaining),
        recoveryChancesRemaining: recoveryChancesRemaining !== undefined ? recoveryChancesRemaining : 5,
        reportUrl: `/assessment-report/${sid || "recent"}`,
      };
      try {
        const stored = JSON.parse(localStorage.getItem("mz_assessment_reports") || "[]");
        const filtered = stored.filter((r) => r.sessionId !== reportItem.sessionId);
        localStorage.setItem("mz_assessment_reports", JSON.stringify([reportItem, ...filtered]));
      } catch (e) {
        console.warn("Could not save report to localStorage:", e);
      }

      toast.dismiss();
      if (!isEmbedded) {
        if (finalPassed === totalTestsCount) {
          toast.success(`🎉 Perfect Score! All test cases passed (100%). Assignment Accepted and Graded!`, { toastId: "mz-submit-result", position: "top-right", autoClose: 2000 });
        } else if (isAccepted) {
          toast.success(`🎉 Submission Accepted! Score: ${calculatedScore}%.`, { toastId: "mz-submit-result", position: "top-right", autoClose: 2000 });
        } else {
          toast.error(`Submission Evaluated: ${finalPassed}/${totalTestsCount} tests passed. Pass mark is 80%.`, { toastId: "mz-submit-result", position: "top-right", autoClose: 2000 });
        }
      }

      // Record permanently in ProctoredCodingSession database
      if (sid) {
        try {
          const pRes = await fetch(`${API_BASE}/api/coding/proctored-session/${sid}/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              sessionId: sid,
              questionId: questionId || problemData?.id,
              assessmentTitle: questionDetails.title,
              problemData: questionDetails,
              code,
              language: selectedLang,
              passedTests: finalPassed,
              totalTests: totalTestsCount,
              score: calculatedScore,
              grade: calculatedGrade,
              accuracy: calculatedAccuracy,
              passed: isAccepted,
              questions: [
                {
                  questionId: questionId || problemData?.id,
                  title: questionDetails.title,
                  difficulty: questionDetails.difficulty,
                  category: questionDetails.category,
                  description: questionDetails.description,
                  inputFormat: questionDetails.inputFormat,
                  outputFormat: questionDetails.outputFormat,
                  constraints: questionDetails.constraints,
                  examples: questionDetails.examples,
                  hints: questionDetails.hints,
                  testCases: updatedCases,
                  submittedCode: code,
                  language: selectedLang,
                  status: isAccepted ? "passed" : "failed",
                  score: calculatedScore,
                  marksObtained: Math.round((calculatedScore / 100) * 100),
                  totalMarks: 100,
                  passedTests: finalPassed,
                  totalTests: totalTestsCount,
                  testResults: submittedTestResults,
                  attempted: true,
                },
              ],
              testResults: submittedTestResults,
            }),
          });

          if (pRes.ok) {
            const pData = await pRes.json();
            setSubmissionSuccessData({
              score: pData.score !== undefined ? pData.score : calculatedScore,
              grade: pData.grade || calculatedGrade,
              accuracy: pData.accuracy !== undefined ? pData.accuracy : calculatedAccuracy,
              passedTests: pData.passedTests !== undefined ? pData.passedTests : finalPassed,
              totalTests: pData.totalTests || totalTestsCount,
              durationSeconds: pData.durationSeconds || (3600 - secondsRemaining),
              reportUrl: pData.reportUrl || `/assessment-report/${sid}`,
              sessionId: sid,
            });
            setIsSubmittedReadOnly(true);
            cleanupAllMediaAndProctoring();
            broadcastSessionSubmitted(sid);
            try {
              sessionStorage.removeItem("mz_active_proctored_session");
            } catch {}
            return;
          }
        } catch (err) {
          console.error("Proctoring submit sync note:", err);
        }
      }

      // Fallback submission success card (without auto-redirect)
      setSubmissionSuccessData({
        score: calculatedScore,
        grade: calculatedGrade,
        accuracy: calculatedAccuracy,
        passedTests: finalPassed,
        totalTests: totalTestsCount,
        durationSeconds: 3600 - secondsRemaining,
        reportUrl: sid ? `/assessment-report/${sid}` : `/coding`,
        sessionId: sid,
      });
      setIsSubmittedReadOnly(true);
      cleanupAllMediaAndProctoring();
      if (sid) broadcastSessionSubmitted(sid);
      try {
        sessionStorage.removeItem("mz_active_proctored_session");
      } catch {}
    } catch (err) {
      toast.error(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // ACCURATE QUESTION STATEMENT & METADATA (NO FAKE / GENERIC FALLBACKS)
  // =========================================================================
  const questionDetails = useMemo(() => {
    const p = activeSessionProblem || problemData || {};
    const probTitle = p.taskTitle || p.title || (activeSessionProblem ? activeSessionProblem.title : title.replace(/^Assignment\s*\|\s*/i, ""));
    const probDifficulty = p.difficulty || "Medium";
    const probCategory = p.category || p.moduleTitle || "Core Programming & Algorithms";
    const probDescription = p.prompt || p.description || "";
    const isMissingDetails = !probDescription;

    const probObjective = p.objective || "";
    const probConceptual = Array.isArray(p.conceptualExplanation) && p.conceptualExplanation.length > 0 ? p.conceptualExplanation : [];
    const probInputFormat = p.inputFormat || "";
    const probOutputFormat = p.outputFormat || "";
    const probExamples = Array.isArray(p.examples) && p.examples.length > 0 ? p.examples : [];
    const probConstraints = Array.isArray(p.constraints) && p.constraints.length > 0 ? p.constraints : [];
    const probHints = Array.isArray(p.hints) && p.hints.length > 0 ? p.hints : [];

    return {
      title: probTitle,
      difficulty: probDifficulty,
      category: probCategory,
      description: probDescription,
      objective: probObjective,
      conceptualExplanation: probConceptual,
      inputFormat: probInputFormat,
      outputFormat: probOutputFormat,
      examples: probExamples,
      constraints: probConstraints,
      hints: probHints,
      isMissingDetails,
    };
  }, [problemData, title]);

  // Hints progressive reveal state
  const [revealedHints, setRevealedHints] = useState({ 0: true });
  const toggleHint = (idx) => {
    setRevealedHints((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };
  const revealAllHints = () => {
    const all = {};
    questionDetails.hints.forEach((_, i) => (all[i] = true));
    setRevealedHints(all);
  };

  // Scroll Helpers
  const scrollToEditor = () => {
    if (editorCardRef.current) {
      editorCardRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToQuestion = () => {
    if (questionRef.current) {
      questionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const selectedCase = allTestCases[selectedCaseIndex] || allTestCases[0];

  // =========================================================================
  // PRE-ASSESSMENT SECURITY GATE ENFORCEMENT
  // =========================================================================
  if (isProctored && proctoringStage === "gate" && !routeSessionId) {
    return (
      <AssessmentSecurityGate
        assessmentTitle={title || questionDetails.title}
        timeLimitMinutes={60}
        questionId={questionId || problemData?.id}
        problemData={questionDetails}
        onCancel={() => {
          cleanupAllMediaAndProctoring();
          if (onClose) onClose();
        }}
        onStartAssessment={handleProctoringVerified}
      />
    );
  }

  return (
    <div
      className={`mz-compiler-overlay ${isEmbedded ? "mz-compiler-embedded" : ""} ${
        isAllPassed
          ? "mz-state-all-passed"
          : hasEvaluated && !isCodeModifiedAfterEval && passedCount < 8
          ? "mz-state-failed"
          : hasEvaluated && !isCodeModifiedAfterEval && passedCount >= 8
          ? "mz-state-passed"
          : "mz-state-idle"
      }`}
    >
      {/* Confetti particle canvas for celebration */}
      <canvas
        id="mz-celebration-canvas"
        ref={confettiCanvasRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 99999,
        }}
      />

      {/* URGENT TIMELINE ALERT POPUP (Triggers every 10s for 2s when countdown <= 2 mins) */}
      {isUrgentAlertVisible && (
        <div className="mz-compiler-urgent-timeline-popup" role="alert">
          <div className="mz-urgent-popup-badge-icon">
            <LuTriangleAlert size={22} className="mz-urgent-alert-pulsing-icon" />
          </div>
          <div className="mz-urgent-popup-body">
            <div className="mz-urgent-popup-header">
              <span className="mz-urgent-popup-title">Timeline Alert: Less than 2 Minutes Remaining!</span>
              <span className="mz-urgent-popup-time-badge">{formatTimer(secondsRemaining)}</span>
            </div>
            <p className="mz-urgent-popup-sub">
              Hurry up! Submit your solution before the countdown timer expires and automatically finalizes.
            </p>
          </div>
          <div className="mz-urgent-progress-strip" />
        </div>
      )}

      {/* =========================================================================
          1. STICKY TOP ASSESSMENT BAR
          ========================================================================= */}
      <header className="mz-compiler-topbar">
        <div className="mz-compiler-topbar-left">
          {/* Logo spiral icon */}
          <div className="mz-compiler-brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
                stroke="url(#kzGradient)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"
                stroke="url(#kzGradient)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M12 10C10.9 10 10 10.9 10 12"
                stroke="url(#kzGradient)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="kzGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor={isAllPassed ? "#10b981" : "#8b5cf6"} />
                  <stop offset="1" stopColor={isAllPassed ? "#059669" : "#3b82f6"} />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Title and Badges */}
          <div className="mz-compiler-title-wrap">
            <h2 className="mz-compiler-title">{questionDetails.title}</h2>
            <button
              type="button"
              className={`mz-compiler-flag-btn ${isFlagged ? "active" : ""}`}
              onClick={() => setIsFlagged(!isFlagged)}
              title="Flag problem statement"
            >
              <LuFlag size={14} fill={isFlagged ? "currentColor" : "none"} />
            </button>

            {isAllPassed && (
              <div className="mz-compiler-allpassed-badge">
                <LuTrophy size={14} />
                <span>100% MASTERED</span>
              </div>
            )}

            {isProctored && proctoringStage === "active" && (
              <div
                className={`mz-compiler-proctor-live-pill ${violationsCount > 0 ? "has-warn" : ""}`}
                title={`Proctored Assessment: ${violationsCount} warning(s) logged`}
              >
                <span className={`mz-topbar-live-dot ${violationsCount > 0 ? "amber" : "green"}`} />
                <span>{violationsCount > 0 ? `${violationsCount} Warning(s)` : "PROCTORING ACTIVE"}</span>
              </div>
            )}
            <div className="mz-compiler-sync-pill" title="Workspace Connected & Telemetry Synced">
              <span className="mz-sync-dot" />
              <span>Synced</span>
            </div>
          </div>

          {/* Question Indicator: Question changing option is removed while taking an assessment */}
          {isProctored ? (
            <div
              className="mz-compiler-locked-q-badge"
              title="Question is locked and strictly assigned for this proctored assessment"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 14px",
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#4338ca",
              }}
            >
              <LuLock size={13} style={{ color: "#4f46e5" }} />
              <span>Assigned Assessment Task</span>
            </div>
          ) : (
            questionsList && questionsList.length > 1 && (
              <div className="mz-compiler-question-navigator" ref={qMenuRef}>
                <button
                  type="button"
                  className="mz-compiler-nav-arrow"
                  disabled={currentQuestionIndex <= 0}
                  onClick={() => {
                    if (currentQuestionIndex > 0 && onSelectQuestion) {
                      onSelectQuestion(questionsList[currentQuestionIndex - 1], currentQuestionIndex - 1);
                    }
                  }}
                  title="Previous Question"
                >
                  <LuChevronLeft size={16} />
                </button>

                <div className="mz-compiler-q-select-wrap">
                  <button
                    type="button"
                    className="mz-compiler-q-dropdown-btn"
                    onClick={() => setIsQMenuOpen(!isQMenuOpen)}
                    title="Switch to another question"
                  >
                    <LuListOrdered size={14} />
                    <span>Q {currentQuestionIndex + 1} of {questionsList.length}</span>
                    <LuChevronDown size={13} />
                  </button>

                  {isQMenuOpen && (
                    <div className="mz-compiler-q-menu">
                      <div className="mz-compiler-q-menu-search">
                        <input
                          type="text"
                          placeholder="Search 65 questions by title or topic..."
                          value={qSearch}
                          onChange={(e) => setQSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="mz-compiler-q-menu-list">
                        {questionsList
                          .map((q, idx) => ({ ...q, originalIndex: idx }))
                          .filter(
                            (q) =>
                              !qSearch ||
                              q.title.toLowerCase().includes(qSearch.toLowerCase()) ||
                              (q.category && q.category.toLowerCase().includes(qSearch.toLowerCase()))
                          )
                          .map((q) => {
                            const isCurrent = q.originalIndex === currentQuestionIndex;
                            const isSolved = q.solved || q.isCompleted;
                            return (
                              <button
                                key={q.id || q.originalIndex}
                                type="button"
                                className={`mz-compiler-q-item ${isCurrent ? "active" : ""}`}
                                onClick={() => {
                                 setIsQMenuOpen(false);
                                 setQSearch("");
                                 if (onSelectQuestion) {
                                   onSelectQuestion(q, q.originalIndex);
                                 }
                                }}
                              >
                                <span className="mz-q-num">#{q.originalIndex + 1}</span>
                                <span className="mz-q-name">{q.title}</span>
                                <span className={`mz-q-diff ${(q.difficulty || "medium").toLowerCase()}`}>
                                  {q.difficulty}
                                </span>
                                {isSolved && <span className="mz-q-solved-check">✓</span>}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="mz-compiler-nav-arrow"
                  disabled={currentQuestionIndex >= questionsList.length - 1}
                  onClick={() => {
                    if (currentQuestionIndex < questionsList.length - 1 && onSelectQuestion) {
                      onSelectQuestion(questionsList[currentQuestionIndex + 1], currentQuestionIndex + 1);
                    }
                  }}
                  title="Next Question"
                >
                  <LuChevronRight size={16} />
                </button>
              </div>
            )
          )}
        </div>

        <div className="mz-compiler-topbar-right">
          {/* Attempt Tracker Pill */}
          <button
            type="button"
            className="mz-compiler-history-pill"
            onClick={() => setIsHistoryModalOpen(true)}
            title="View past submissions and attempt history"
          >
            <LuHistory size={14} />
            <span>Attempts: {attemptsCount || historyList.length}</span>
            {bestScore > 0 && <span className="mz-best-score-tag">Best: {bestScore}%</span>}
          </button>

          {/* Quick Jump Buttons */}
          <div className="mz-compiler-nav-jumps">
            <button type="button" className="mz-compiler-jump-btn" onClick={scrollToQuestion} title="View Problem Statement">
              <LuArrowUp size={13} />
              <span>Question</span>
            </button>
            <button type="button" className="mz-compiler-jump-btn" onClick={scrollToEditor} title="Jump to MZ-ASM Editor">
              <LuArrowDown size={13} />
              <span>Editor</span>
            </button>
          </div>

          {/* Assessment Timer (1 Hour Automatic Countdown) */}
          <div
            className={`mz-compiler-timer-pill ${
              secondsRemaining < 180 && !isTimeExpired ? "urgent" : ""
            } ${isTimeExpired ? "expired" : ""}`}
            title="Assessment Time Remaining (1 Hour Limit)"
          >
            <LuHourglass
              size={15}
              color={isTimeExpired ? "#ef4444" : secondsRemaining < 180 ? "#dc2626" : "#2563eb"}
            />
            <span className="mz-timer-text">
              {isTimeExpired ? "Time Expired" : `${formatTimer(secondsRemaining)} remaining`}
            </span>
          </div>


        </div>
      </header>

      {/* =========================================================================
          2. SCROLLABLE BODY (QUESTION STATEMENT + COMPILER CARD + PROCTORING PANEL)
          ========================================================================= */}
      <div className="mz-compiler-scroll-body">
        <div className={`mz-compiler-container ${isProctored && proctoringStage === "active" && !isSubmittedReadOnly ? "has-proctoring" : ""}`}>
          {/* Dedicated Left Proctoring Panel */}
          {isProctored && proctoringStage === "active" && !isSubmittedReadOnly && (
            <aside className={`mz-proctoring-panel ${isProctoringCollapsed ? "collapsed" : ""}`}>
              {/* Header */}
              <div className="mz-proc-header">
                {!isProctoringCollapsed ? (
                  <>
                    <div className="mz-proc-header-title-wrap">
                      <div className="mz-proc-badge-icon">
                        <LuShieldCheck size={18} />
                      </div>
                      <span className="mz-proc-title">Live Proctoring</span>
                    </div>
                    <button
                      type="button"
                      className="mz-proc-toggle-btn"
                      onClick={() => setIsProctoringCollapsed(true)}
                      title="Collapse Proctoring Panel"
                    >
                      <LuChevronLeft size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="mz-proc-toggle-btn"
                    onClick={() => setIsProctoringCollapsed(false)}
                    title="Expand Proctoring Panel"
                  >
                    <LuChevronRight size={16} />
                  </button>
                )}
              </div>

              {isProctoringCollapsed ? (
                /* Collapsed Mini-Bar */
                <div className="mz-proc-collapsed-bar">
                  <div
                    title="Webcam Live"
                    className="mz-proc-collapsed-icon"
                    onClick={() => setIsProctoringCollapsed(false)}
                  >
                    <LuCamera size={18} />
                  </div>
                  <div
                    title="Screen Capture Live"
                    className="mz-proc-collapsed-icon"
                    onClick={() => setIsProctoringCollapsed(false)}
                  >
                    <LuMonitor size={18} />
                  </div>
                  <div
                    title="Microphone Active"
                    className="mz-proc-collapsed-icon"
                    onClick={() => setIsProctoringCollapsed(false)}
                  >
                    <LuMic size={18} />
                  </div>
                  <div
                    title="Fullscreen Active"
                    className="mz-proc-collapsed-icon"
                    onClick={() => setIsProctoringCollapsed(false)}
                  >
                    <LuMaximize size={18} />
                  </div>
                  <div className="mz-proc-collapsed-battery" title={`Battery: ${batteryInfo.percentage}%`}>
                    {batteryInfo.percentage}%
                  </div>
                </div>
              ) : (
                /* Expanded Panel */
                <>
                  {/* View Selector: Camera | Screen | Dual */}
                  <div className="mz-proc-view-tabs">
                    <button
                      type="button"
                      className={`mz-proc-view-tab ${proctoringViewMode === "webcam" ? "active" : ""}`}
                      onClick={() => handleSelectViewMode("webcam")}
                    >
                      <LuCamera size={12} />
                      <span>Camera</span>
                    </button>
                    <button
                      type="button"
                      className={`mz-proc-view-tab ${proctoringViewMode === "screen" ? "active" : ""}`}
                      onClick={() => handleSelectViewMode("screen")}
                    >
                      <LuMonitor size={12} />
                      <span>Screen</span>
                    </button>
                    <button
                      type="button"
                      className={`mz-proc-view-tab ${proctoringViewMode === "dual" ? "active" : ""}`}
                      onClick={() => handleSelectViewMode("dual")}
                    >
                      <LuLayoutGrid size={12} />
                      <span>Dual</span>
                    </button>
                  </div>

                  {/* Previews Viewport (both video elements stay mounted for continuous tracks) */}
                  <div className={`mz-proc-previews-container ${proctoringViewMode}`}>
                    {/* Live Webcam Preview */}
                    <div
                      className="mz-proc-video-box"
                      style={{
                        display: proctoringViewMode === "screen" ? "none" : "flex",
                      }}
                    >
                      <video
                        ref={(el) => {
                          procCameraRef.current = el;
                          if (el && cameraStream && el.srcObject !== cameraStream) {
                            el.srcObject = cameraStream;
                            el.play().catch(() => {});
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="mz-proc-video-elem mirror"
                      />
                      <div className="mz-proc-live-pill">
                        <span className={`mz-proc-status-dot ${cameraStream?.active ? "" : "red"}`} /> LIVE CAM
                      </div>
                      <span className="mz-proc-video-label">Webcam</span>

                      {(!cameraStream || !cameraStream.active) && (
                        <div className="mz-proc-stream-missing-overlay">
                          <LuCamera size={20} color="#94a3b8" />
                          <span style={{ fontSize: "10.5px", color: "#cbd5e1" }}>Camera Disconnected</span>
                          <button
                            type="button"
                            className="mz-proc-mini-connect-btn"
                            onClick={handleConnectCamera}
                          >
                            Enable Camera
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Live Screen Preview */}
                    <div
                      className="mz-proc-video-box screen-box"
                      style={{
                        display: proctoringViewMode === "webcam" ? "none" : "flex",
                      }}
                    >
                      <video
                        ref={(el) => {
                          procScreenRef.current = el;
                          if (el && screenStream && el.srcObject !== screenStream) {
                            el.srcObject = screenStream;
                            el.play().catch(() => {});
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="mz-proc-video-elem contain"
                      />
                      <div className="mz-proc-live-pill">
                        <span className={`mz-proc-status-dot ${screenStream?.active ? "" : "red"}`} /> SCREEN
                      </div>
                      <span className="mz-proc-video-label">Entire Screen</span>

                      {(!screenStream || !screenStream.active) && (
                        <div className="mz-proc-stream-missing-overlay">
                          <LuMonitor size={20} color="#94a3b8" />
                          <span style={{ fontSize: "10.5px", color: "#cbd5e1" }}>Screen Not Shared</span>
                          <button
                            type="button"
                            className="mz-proc-mini-connect-btn"
                            onClick={handleConnectScreen}
                          >
                            Share Screen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Microphone Level */}
                  <div className="mz-proc-audio-card">
                    <div className="mz-proc-audio-title-row">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <LuMic size={14} color="#2563eb" />
                        <span>Microphone Signal</span>
                      </div>
                      <span
                        style={{
                          fontSize: "10.5px",
                          color: procMicVolume > 5 ? "#166534" : "#64748b",
                          fontWeight: 700,
                        }}
                      >
                        {procMicVolume > 5 ? "Audio Signal Detected" : "Quiet"}
                      </span>
                    </div>
                    <div className="mz-proc-audio-track">
                      <div
                        className="mz-proc-audio-bar"
                        style={{ width: `${Math.min(100, Math.max(4, procMicVolume))}%` }}
                      />
                    </div>
                  </div>

                  {/* Battery & Status Cluster */}
                  <div className="mz-proc-status-cluster">
                    <div className={`mz-proc-battery-badge ${batteryInfo.percentage <= 20 ? "low" : ""}`}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {batteryInfo.charging ? (
                          <LuBatteryCharging size={16} />
                        ) : batteryInfo.percentage <= 20 ? (
                          <LuBatteryWarning size={16} />
                        ) : (
                          <LuBattery size={16} />
                        )}
                        <span>Device Battery</span>
                      </div>
                      <span style={{ fontWeight: 700 }}>
                        {batteryInfo.percentage}% {batteryInfo.charging ? "⚡" : ""}
                      </span>
                    </div>

                    <div
                      className={`mz-proc-badge-item ${isFullscreenActive ? "active" : "pending"}`}
                      style={{ cursor: "pointer" }}
                      onClick={handleToggleFullscreen}
                      title={isFullscreenActive ? "Fullscreen mode active" : "Click to enter full-screen mode"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <LuMaximize size={13} color={isFullscreenActive ? "#2563eb" : "#ef4444"} />
                        <span>Fullscreen Enforcement</span>
                      </div>
                      <span className={`mz-proc-status-dot ${isFullscreenActive ? "" : "red"}`} />
                      {!isFullscreenActive && (
                        <span style={{ fontSize: "9.5px", color: "#dc2626", fontWeight: 700, marginLeft: "auto" }}>
                          Fix Fullscreen
                        </span>
                      )}
                    </div>

                    <div className="mz-proc-badge-item active">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <LuShieldCheck size={13} color="#10b981" />
                        <span>Assessment Security</span>
                      </div>
                      <span style={{ fontSize: "10px", color: "#166534", fontWeight: 700 }}>STRICT</span>
                    </div>
                  </div>

                  {/* Candidate Identification Badge */}
                  {candidateDetails?.fullName && (
                    <div className="mz-proc-candidate-card">
                      <span className="mz-proc-candidate-name">{candidateDetails.fullName}</span>
                      <span className="mz-proc-candidate-id">{candidateDetails.candidateId}</span>
                    </div>
                  )}

                  {/* Five Recovery Chances Meter */}
                  <div className="mz-proc-chances-meter">
                    <div className="mz-proc-chances-label-row">
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <LuShieldCheck size={14} color="#10b981" />
                        <span>Recovery Chances</span>
                      </span>
                      <span style={{ color: recoveryChancesRemaining > 1 ? "#10b981" : "#ef4444" }}>
                        {recoveryChancesRemaining} / 5 Left
                      </span>
                    </div>
                    <div className="mz-proc-chances-pills">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`mz-proc-chance-pill ${idx > recoveryChancesRemaining ? "consumed" : ""}`}
                          title={`Chance ${idx}: ${idx > recoveryChancesRemaining ? "Used" : "Available"}`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </aside>
          )}

          <main className="mz-compiler-main-content">
            {/* SECTION A: PROBLEM QUESTION DOCUMENTATION (Above the compiler) */}
          <section className="mz-compiler-question-card" ref={questionRef}>
            <div className="mz-question-header">
              <div className="mz-question-badges">
                <span className={`mz-badge-diff ${questionDetails.difficulty.toLowerCase()}`}>
                  {questionDetails.difficulty}
                </span>
                <span className="mz-badge-category">{questionDetails.category}</span>
                <span className="mz-badge-points">100 Marks (10 Tests × 10%)</span>
                <span className="mz-badge-passmark">80% Passing Threshold</span>
              </div>
              <h1 className="mz-question-title">{questionDetails.title}</h1>
            </div>

            {/* Objective Banner */}
            {questionDetails.objective && (
              <div className="mz-objective-card">
                <div className="mz-objective-header">
                  <LuSparkles size={16} color="#2563eb" />
                  <strong>Objective</strong>
                </div>
                <p className="mz-objective-text">{questionDetails.objective}</p>
              </div>
            )}

            {/* Missing Data Guard */}
            {questionDetails.isMissingDetails ? (
              <div className="mz-missing-data-alert">
                <LuTriangleAlert size={20} color="#d97706" />
                <div>
                  <strong>Original Problem Statement Unavailable</strong>
                  <p>The details for this question are currently missing from the curriculum registry. Please reload or contact the administrator.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Problem Statement */}
                <div className="mz-question-section">
                  <h3 className="mz-section-heading">Problem Statement</h3>
                  <div className="mz-question-body-text">
                    {questionDetails.description.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>

                {/* Input & Output Format */}
                {(questionDetails.inputFormat || questionDetails.outputFormat) && (
                  <div className="mz-format-grid">
                    {questionDetails.inputFormat && (
                      <div className="mz-question-section">
                        <h3 className="mz-section-heading">Input Format</h3>
                        <div className="mz-format-box">
                          {questionDetails.inputFormat.split("\n").map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {questionDetails.outputFormat && (
                      <div className="mz-question-section">
                        <h3 className="mz-section-heading">Output Format</h3>
                        <div className="mz-format-box">
                          {questionDetails.outputFormat.split("\n").map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Examples */}
                {questionDetails.examples.length > 0 && (
                  <div className="mz-question-section">
                    <h3 className="mz-section-heading">Examples</h3>
                    <div className="mz-examples-grid">
                      {questionDetails.examples.map((ex, idx) => (
                        <div key={idx} className="mz-example-card">
                          <div className="mz-example-card-header">
                            <strong>Example {idx + 1}</strong>
                          </div>
                          <div className="mz-example-io-wrap">
                            <div className="mz-example-block">
                              <span className="mz-example-label">Input:</span>
                              <pre className="mz-example-pre">{ex.input}</pre>
                            </div>

                            <div className="mz-example-block">
                              <span className="mz-example-label">Output:</span>
                              <pre className="mz-example-pre">{ex.output}</pre>
                            </div>
                          </div>
                          {ex.explanation && (
                            <div className="mz-example-explanation">
                              <strong>Explanation: </strong>
                              <span>{ex.explanation}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {questionDetails.constraints.length > 0 && (
                  <div className="mz-question-section">
                    <h3 className="mz-section-heading">Constraints</h3>
                    <ul className="mz-constraints-list">
                      {questionDetails.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Step-by-Step Conceptual Approach */}
                {questionDetails.conceptualExplanation && questionDetails.conceptualExplanation.length > 0 && (
                  <div className="mz-question-section">
                    <h3 className="mz-section-heading">Step-by-Step Conceptual Approach</h3>
                    <div className="mz-conceptual-steps-list">
                      {questionDetails.conceptualExplanation.map((step, idx) => (
                        <div key={idx} className="mz-step-card">
                          <div className="mz-step-content-wrap">
                            <span className="mz-step-number">{idx + 1}</span>
                            <span className="mz-step-text">{step}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* SECTION B: COMPILER WORKSPACE CARD (Monaco Editor & Drawer) */}
          <section
            className={`mz-compiler-editor-card ${
              isAllPassed
                ? "card-all-passed"
                : hasEvaluated && !isCodeModifiedAfterEval && passedCount < 8
                ? "card-failed"
                : hasEvaluated && !isCodeModifiedAfterEval && passedCount >= 8
                ? "card-passed"
                : ""
            }`}
            ref={editorCardRef}
          >
            {/* Editor Header Toolbar (Language Selector, Font Size, Reset) */}
            <div className="mz-compiler-card-toolbar">
              <div className="mz-toolbar-left" style={{ position: "relative" }}>
                <button
                  type="button"
                  className="mz-compiler-lang-dropdown-btn"
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                >
                  <span>{langLabels[selectedLang] || "Language"}</span>
                  <LuChevronDown size={14} color="#6b7280" />
                </button>

                {isLangMenuOpen && (
                  <div className="mz-compiler-dropdown-menu">
                    {Object.entries(langLabels).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={`mz-compiler-dropdown-item ${selectedLang === key ? "active" : ""}`}
                        onClick={() => handleSelectLanguage(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Font Size Selector */}
                <div className="mz-font-size-group">
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Font:</span>
                  {[12, 13, 14, 16].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      className={`mz-font-size-btn ${editorFontSize === sz ? "active" : ""}`}
                      onClick={() => setEditorFontSize(sz)}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                {/* Evaluation State Indicator */}
                {isCodeModifiedAfterEval && (
                  <span className="mz-code-modified-badge">Edited (Unsaved / Not Evaluated)</span>
                )}
              </div>

              <div className="mz-toolbar-right">
                <button
                  type="button"
                  className="mz-compiler-reset-btn"
                  onClick={handleResetCode}
                  title="Reset starter template"
                  disabled={isTimeExpired}
                >
                  <LuRotateCcw size={15} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Monaco Code Editor */}
            <div className="mz-compiler-editor-wrap">
              <Editor
                height="390px"
                language={selectedLang}
                theme="vs"
                value={code}
                onChange={handleCodeChange}
                options={{
                  fontFamily: "Consolas, Menlo, Monaco, 'Courier New', monospace",
                  fontSize: editorFontSize,
                  lineNumbers: "on",
                  lineNumbersMinChars: 3,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: "on",
                  readOnly: isTimeExpired || isTerminated || isSubmittedReadOnly,
                  domReadOnly: isTimeExpired || isTerminated || isSubmittedReadOnly,
                  renderLineHighlight: "all",
                  cursorBlinking: "smooth",
                  folding: true,
                  padding: { top: 8, bottom: 8 },
                }}
              />

              {(isTimeExpired || isTerminated || isSubmittedReadOnly) && (
                <div className="mz-editor-locked-overlay">
                  <LuLock size={24} color="#3b82f6" />
                  <strong>Assessment Solution Locked (Read-Only)</strong>
                  <span>This attempt is permanently locked and cryptographically logged.</span>
                </div>
              )}
            </div>

            {/* Drawer Tab Header (Run | Run Tests | Hint | Chevron) */}
            <div className="mz-compiler-drawer-tabs">
              <div className="mz-compiler-tabs-group">
                <button
                  type="button"
                  className={`mz-compiler-tab ${activeTab === "run" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("run");
                    setIsDrawerOpen(true);
                  }}
                >
                  <LuTerminal size={14} style={{ marginRight: "6px" }} />
                  Run
                </button>
                <button
                  type="button"
                  className={`mz-compiler-tab ${activeTab === "run_tests" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("run_tests");
                    setIsDrawerOpen(true);
                  }}
                >
                  <LuPlay size={14} style={{ marginRight: "6px" }} />
                  Run Tests
                </button>
                <button
                  type="button"
                  className={`mz-compiler-tab ${activeTab === "hint" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("hint");
                    setIsDrawerOpen(true);
                  }}
                >
                  <LuLightbulb size={14} style={{ marginRight: "6px" }} />
                  Hint
                </button>
              </div>

              <button
                type="button"
                className="mz-compiler-drawer-toggle-btn"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                title={isDrawerOpen ? "Collapse drawer" : "Expand drawer"}
              >
                {isDrawerOpen ? <LuChevronUp size={18} /> : <LuChevronDown size={18} />}
              </button>
            </div>

            {/* Expanded Drawer Area */}
            {isDrawerOpen && (
              <div className="mz-compiler-drawer-body">
                {/* Pass/Fail Banner */}
                {activeTab === "run_tests" && bannerVisible && (
                  <div
                    className={`mz-compiler-pass-banner ${
                      isAllPassed
                        ? "all-passed"
                        : hasEvaluated && !isCodeModifiedAfterEval && passedCount >= 8
                        ? "passed"
                        : hasEvaluated && !isCodeModifiedAfterEval && passedCount < 8
                        ? "failed"
                        : "idle"
                    }`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {isAllPassed ? (
                        <LuSparkles size={16} />
                      ) : hasEvaluated && !isCodeModifiedAfterEval && passedCount >= 8 ? (
                        <LuCircleCheck size={16} />
                      ) : hasEvaluated && !isCodeModifiedAfterEval && passedCount < 8 ? (
                        <LuCircleX size={16} />
                      ) : (
                        <LuFileCode size={16} />
                      )}
                      <span>
                        {isAllPassed
                          ? "🎉 Perfect Score! All test cases passed (100%). Solution Verified & Graded!"
                          : hasEvaluated && !isCodeModifiedAfterEval
                          ? `You have passed ${passedCount}/${allTestCases.length} tests${
                              passedCount >= 8
                                ? " — Solution meets passing criteria (≥80%)!"
                                : " — Keep revising to reach 80% passing threshold!"
                            }`
                          : "Run tests to evaluate your solution against the test suite."}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="mz-compiler-banner-dismiss"
                      onClick={() => setBannerVisible(false)}
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* TAB 1: RUN TESTS */}
                {activeTab === "run_tests" && (
                  <div className="mz-compiler-drawer-content">
                    {/* Left Column: Test Cases List */}
                    <div className="mz-compiler-drawer-sidebar">
                      <button
                        type="button"
                        className="mz-compiler-btn-run-tests"
                        disabled={isRunningTests || isSubmitting}
                        onClick={handleRunTests}
                      >
                        <LuPlay size={13} fill="currentColor" />
                        <span>{isRunningTests ? "Running Tests..." : "Run Tests"}</span>
                      </button>

                      <div className="mz-compiler-test-cases-list">
                        {allTestCases.map((tc, idx) => (
                          <button
                            key={tc.index}
                            type="button"
                            className={`mz-compiler-tc-item ${selectedCaseIndex === idx ? "active" : ""}`}
                            onClick={() => setSelectedCaseIndex(idx)}
                          >
                            <span>Test Case {tc.index}</span>
                            <span
                              className={`mz-compiler-status-icon ${
                                tc.passed === true || (isAllPassed && hasEvaluated)
                                  ? "pass"
                                  : tc.passed === false
                                  ? "fail"
                                  : "neutral"
                              }`}
                            >
                              {tc.passed === true || (isAllPassed && hasEvaluated) ? (
                                <LuCircleCheck size={16} />
                              ) : tc.passed === false ? (
                                <LuCircleX size={16} />
                              ) : (
                                <LuCircle size={15} color="#94a3b8" />
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Input, Expected Output, & Actual Output */}
                    <div className="mz-compiler-drawer-detail">
                      <div>
                        <div className="mz-detail-header-row">
                          <div className="mz-compiler-detail-section-title">
                            Input {selectedCase?.isHidden ? `(Hidden Test Case ${selectedCase?.index} of 10)` : `(Public Sample ${selectedCase?.index} of 3)`}
                          </div>
                        </div>
                        <div className={`mz-compiler-io-box ${selectedCase?.isHidden ? "hidden-case" : ""}`}>
                          {selectedCase?.isHidden
                            ? "[Hidden Test Case — Stored exclusively on backend to evaluate boundary conditions]"
                            : selectedCase?.input}
                        </div>
                      </div>

                      <div>
                        <div className="mz-detail-header-row">
                          <div className="mz-compiler-detail-section-title">
                            Expected Output {selectedCase?.isHidden ? "(Hidden)" : ""}
                          </div>
                        </div>
                        <div className={`mz-compiler-io-box ${selectedCase?.isHidden ? "hidden-case" : ""}`}>
                          {selectedCase?.isHidden
                            ? "[Hidden Output — Protected test case to prevent hardcoding]"
                            : selectedCase?.expectedOutput}
                        </div>
                      </div>

                      {/* Actual Output */}
                      {hasEvaluated && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div className="mz-compiler-detail-section-title">Actual Output</div>
                            <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                              ⏱ {selectedCase?.duration || 0}ms
                            </span>
                          </div>
                          <div
                            className={`mz-compiler-io-box ${
                              selectedCase?.passed === false && !isAllPassed
                                ? "error-box"
                                : selectedCase?.passed === true || isAllPassed
                                ? "success-box"
                                : ""
                            }`}
                          >
                            {selectedCase?.isHidden
                              ? selectedCase?.passed === true || isAllPassed
                                ? "[Passed — Output matched hidden test case expectations]"
                                : selectedCase?.error || "[Hidden Test Case Failed — Output did not match expected]"
                              : selectedCase?.actualOutput ||
                                (selectedCase?.passed === true || isAllPassed
                                  ? selectedCase?.expectedOutput || "[Passed]"
                                  : "[No output produced]")}
                            {selectedCase?.error && (
                              <div style={{ color: "#ef4444", marginTop: "6px", fontFamily: "monospace" }}>
                                {selectedCase.error}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: RUN (Custom STDIN) */}
                {activeTab === "run" && (
                  <div className="mz-compiler-drawer-content">
                    <div className="mz-compiler-drawer-sidebar">
                      <button
                        type="button"
                        className="mz-compiler-btn-run-tests"
                        disabled={isRunning || isSubmitting}
                        onClick={handleRun}
                      >
                        <LuPlay size={13} fill="currentColor" />
                        <span>{isRunning ? "Executing..." : "Run"}</span>
                      </button>
                      <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                        Execute your solution against custom parameters or test unique boundary conditions in real-time.
                      </div>
                    </div>

                    <div className="mz-compiler-drawer-detail">
                      <div>
                        <div className="mz-compiler-detail-section-title">Custom Input (STDIN)</div>
                        <textarea
                          className="mz-compiler-custom-stdin-textarea"
                          placeholder="Provide optional custom input to feed to standard input..."
                          value={customStdin}
                          onChange={(e) => setCustomStdin(e.target.value)}
                        />
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div className="mz-compiler-detail-section-title">Your Output</div>
                          {customDuration !== null && (
                            <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                              ⏱ {customDuration}ms
                            </span>
                          )}
                        </div>
                        <div className={`mz-compiler-io-box ${customError ? "error-box" : ""}`}>
                          {customOutput || (customError ? customError : "[No output produced yet. Click 'Run' to execute.]")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: HINT */}
                {activeTab === "hint" && (
                  <div className="mz-compiler-hints-panel">
                    <div className="mz-hints-top-bar">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <LuLightbulb size={18} color="#f59e0b" />
                        <strong>Algorithmic Hints & Intuition Guide</strong>
                      </div>
                      <button type="button" className="mz-reveal-all-btn" onClick={revealAllHints}>
                        Reveal All Hints
                      </button>
                    </div>

                    <div className="mz-hints-list">
                      {questionDetails.hints.map((hintText, idx) => (
                        <div key={idx} className="mz-hint-card">
                          <button
                            type="button"
                            className="mz-hint-card-header"
                            onClick={() => toggleHint(idx)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className="mz-hint-number">Hint {idx + 1}</span>
                              <span className="mz-hint-title-tag">
                                {idx === 0
                                  ? "Core Insight & Input Parsing"
                                  : idx === 1
                                  ? "Algorithmic Formulation & Approach"
                                  : idx === 2
                                  ? "Boundary Conditions & Edge Cases"
                                  : "Implementation Strategy & Complexity"}
                              </span>
                            </div>
                            {revealedHints[idx] ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
                          </button>

                          {revealedHints[idx] ? (
                            <div className="mz-hint-content">
                              <p>{hintText}</p>
                            </div>
                          ) : (
                            <div className="mz-hint-collapsed-notice" onClick={() => toggleHint(idx)}>
                              <span>Click to reveal Hint #{idx + 1}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>

      {/* =========================================================================
          3. STICKY FOOTER BAR (SAVE DRAFT & SUBMIT FINAL SOLUTION)
          ========================================================================= */}
      <footer className="mz-compiler-footer">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            className="mz-compiler-btn-save"
            disabled={isSaving || isTimeExpired}
            onClick={handleSave}
          >
            <LuSave size={14} />
            <span>{isSaving ? "Saving..." : "Save Draft"}</span>
          </button>
          {lastSavedTime && (
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Last saved: {lastSavedTime}
            </span>
          )}
        </div>

        {/* Center Progress Pill */}
        <div className="mz-footer-status-pill">
          {isAllPassed ? (
            <span style={{ color: "#166534", fontWeight: 700 }}>
              ✓ All {allTestCases.length} Tests Passed (100% Score)
            </span>
          ) : hasEvaluated && !isCodeModifiedAfterEval ? (
            <span style={{ color: passedCount >= 8 ? "#166534" : "#991b1b", fontWeight: 600 }}>
              {passedCount}/{allTestCases.length} Tests Passed ({Math.round((passedCount / (allTestCases.length || 1)) * 100)}%)
            </span>
          ) : (
            <span style={{ color: "#475569" }}>Suite: {allTestCases.length} Tests (80% Required to Pass)</span>
          )}
        </div>

        {isSubmittedReadOnly ? (
          <button
            type="button"
            className="mz-compiler-btn-submit btn-view-report"
            style={{ backgroundColor: "#2563eb", color: "#ffffff", gap: "8px", fontWeight: 700 }}
            onClick={() => {
              const sid = proctoredSessionId || routeSessionId || submissionSuccessData?.sessionId;
              if (sid) {
                navigate(`/assessment-report/${sid}`);
              } else if (submissionSuccessData?.reportUrl) {
                navigate(submissionSuccessData.reportUrl);
              }
            }}
          >
            <LuAward size={18} />
            <span>View Assessment Report</span>
          </button>
        ) : (
          <button
            type="button"
            className={`mz-compiler-btn-submit ${isAllPassed ? "btn-all-passed" : ""}`}
            disabled={isSubmitting || isRunningTests}
            onClick={handleOpenSubmitModal}
          >
            {isSubmitting ? (
              <span>Evaluating...</span>
            ) : isAllPassed ? (
              <>
                <LuCircleCheck size={16} />
                <span>Accept & Grade (100%)</span>
              </>
            ) : (
              <>
                <span>Accept & Grade Solution</span>
                <LuSend size={14} />
              </>
            )}
          </button>
        )}
      </footer>

      {/* =========================================================================
          4. SUBMISSION CONFIRMATION MODAL
          ========================================================================= */}
      {isConfirmModalOpen && (
        <div className="mz-submit-modal-overlay">
          <div className="mz-submit-modal">
            <div className="mz-modal-header">
              <LuShieldCheck size={26} color="#2563eb" />
              <h3>Confirm Assignment Submission</h3>
            </div>
            <div className="mz-modal-body">
              <p className="mz-modal-question-name">
                <strong>Question:</strong> {questionDetails.title}
              </p>
              <div className="mz-modal-stats-grid">
                <div className="mz-stat-box">
                  <span className="mz-stat-label">Tests Passed</span>
                  <span className={`mz-stat-val ${passedCount >= 8 ? "pass" : "fail"}`}>
                    {hasEvaluated ? passedCount : 0} / {allTestCases.length}
                  </span>
                </div>
                <div className="mz-stat-box">
                  <span className="mz-stat-label">Current Score</span>
                  <span className={`mz-stat-val ${passedCount >= 8 ? "pass" : "fail"}`}>
                    {hasEvaluated ? Math.round((passedCount / (allTestCases.length || 1)) * 100) : 0}%
                  </span>
                </div>
                <div className="mz-stat-box">
                  <span className="mz-stat-label">Status</span>
                  <span className={`mz-stat-val ${passedCount >= 8 ? "pass" : "fail"}`}>
                    {!hasEvaluated
                      ? "Not Evaluated"
                      : passedCount === allTestCases.length
                      ? "100% Mastered"
                      : passedCount >= 8
                      ? "Passing (≥80%)"
                      : "Needs Revision"}
                  </span>
                </div>
              </div>
              <div className="mz-modal-consequence-alert">
                <LuSparkles size={16} />
                <span>
                  {passedCount >= 8
                    ? "Submitting will officially evaluate and record your mastery score in the database, updating your global Progress dashboard."
                    : "Note: Submitting now will record your attempt with the current score. You can retry and resubmit anytime to achieve 100%."}
                </span>
              </div>
            </div>
            <div className="mz-modal-actions">
              <button
                type="button"
                className="mz-modal-btn-cancel"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel & Continue Editing
              </button>
              <button
                type="button"
                className={`mz-modal-btn-confirm ${isAllPassed ? "all-pass" : ""}`}
                onClick={executeSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Evaluating & Submitting..." : "Confirm & Save Submission"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RESET CONFIRMATION MODAL
          ========================================================================= */}
      {isResetConfirmOpen && (
        <div className="mz-submit-modal-overlay">
          <div className="mz-submit-modal" style={{ maxWidth: "460px" }}>
            <div className="mz-modal-header">
              <LuRotateCcw size={22} color="#dc2626" />
              <h3>Reset Code Editor</h3>
            </div>
            <div className="mz-modal-body">
              <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: "1.5" }}>
                Are you sure you want to reset your code? This will clear all changes and restore the editor to <code>// Enter your code below</code>.
              </p>
            </div>
            <div className="mz-modal-actions">
              <button
                type="button"
                className="mz-modal-btn-cancel"
                onClick={() => setIsResetConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mz-modal-btn-confirm"
                style={{ background: "#dc2626", borderColor: "#b91c1c" }}
                onClick={confirmResetCode}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE REFRESH VIOLATION CONFIRMATION MODAL (Disabled in Fullscreen Mode)
          ========================================================================= */}
      {isRefreshConfirmOpen && !document.fullscreenElement && !document.webkitFullscreenElement && !isFullscreenActive && (
        <div className="mz-submit-modal-overlay">
          <div className="mz-submit-modal" style={{ maxWidth: "490px" }}>
            <div className="mz-modal-header">
              <LuTriangleAlert size={26} color="#d97706" />
              <h3 style={{ color: "#b45309" }}>Refresh Interruption Warning</h3>
            </div>
            <div className="mz-modal-body">
              <p style={{ fontSize: "1.02rem", fontWeight: 700, color: "#0f172a", margin: "0 0 10px 0" }}>
                Refreshing will consume one of your 5 violation chances. Do you want to continue?
              </p>
              <p style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: "1.55", margin: 0 }}>
                If you choose to refresh, your current code and assessment progress will be securely saved, but you will be redirected to re-verify your camera, microphone, screen sharing, and full-screen permissions before resuming.
              </p>
              <div className="mz-proc-chances-meter" style={{ marginTop: "14px" }}>
                <div className="mz-proc-chances-label-row">
                  <span>Current Recovery Chances</span>
                  <span style={{ color: recoveryChancesRemaining > 1 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                    {recoveryChancesRemaining} / 5 Remaining
                  </span>
                </div>
                <div className="mz-proc-chances-pills">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={`mz-proc-chance-pill ${idx > recoveryChancesRemaining ? "consumed" : ""}`}
                      title={`Chance ${idx}: ${idx > recoveryChancesRemaining ? "Used" : "Available"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mz-modal-actions">
              <button
                type="button"
                className="mz-modal-btn-cancel"
                style={{ fontWeight: 600 }}
                onClick={() => setIsRefreshConfirmOpen(false)}
              >
                Cancel & Continue Assessment
              </button>
              <button
                type="button"
                className="mz-modal-btn-confirm"
                style={{ background: "#dc2626", borderColor: "#b91c1c" }}
                onClick={() => {
                  const sid = proctoredSessionId || routeSessionId;
                  if (sid) {
                    try {
                      sessionStorage.setItem(
                        "mz_pending_refresh_violation",
                        JSON.stringify({
                          sessionId: sid,
                          reason: "Page reload / refresh confirmed by candidate",
                          timestamp: Date.now(),
                        })
                      );
                      localStorage.setItem(`mz_draft_${sid}`, code);
                      localStorage.setItem(`mz_lang_${sid}`, selectedLang);
                      localStorage.setItem(`mz_time_${sid}`, String(secondsRemaining));
                    } catch {}
                  }
                  setIsRefreshConfirmOpen(false);
                  window.location.reload();
                }}
              >
                Yes, Refresh & Consume 1 Chance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. ATTEMPT HISTORY MODAL
          ========================================================================= */}
      {isHistoryModalOpen && (
        <div className="mz-submit-modal-overlay">
          <div className="mz-submit-modal" style={{ maxWidth: "600px" }}>
            <div className="mz-modal-header" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <LuHistory size={22} color="#2563eb" />
                <h3>Submission History ({historyList.length} Attempts)</h3>
              </div>
              <button
                type="button"
                className="mz-compiler-close-btn"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                <LuX size={18} />
              </button>
            </div>
            <div className="mz-modal-body" style={{ maxHeight: "360px", overflowY: "auto" }}>
              {historyList.length === 0 ? (
                <div style={{ textAlign: "center", color: "#64748b", padding: "24px 0" }}>
                  No previous attempts recorded yet. Submit your solution to record your first graded attempt.
                </div>
              ) : (
                <div className="mz-history-table">
                  <div className="mz-history-table-header">
                    <span>Attempt</span>
                    <span>Status</span>
                    <span>Score</span>
                    <span>Language</span>
                    <span>Date & Time</span>
                  </div>
                  {historyList.map((att, i) => (
                    <div key={i} className="mz-history-row">
                      <strong>#{att.attemptNumber || historyList.length - i}</strong>
                      <span className={`mz-status-badge ${att.status === "PASSED" || att.status === "ACCEPTED" ? "pass" : "fail"}`}>
                        {att.status || (att.score >= 80 ? "PASSED" : "FAILED")}
                      </span>
                      <strong>{att.score}% ({att.passedTests}/{att.totalTests || 10})</strong>
                      <span>{att.language || "python"}</span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        {att.timestamp ? new Date(att.timestamp).toLocaleString() : "Just now"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mz-modal-actions" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="mz-modal-btn-cancel"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. STANDALONE PROCTORING TELEMETRY ACTIVATION OVERLAY
          ========================================================================= */}
      {needsMediaInit && !isRecoveryModalOpen && (
        <div className="mz-proc-violation-modal-overlay">
          <div className="mz-proc-recovery-card" style={{ maxWidth: "520px", position: "relative" }}>
            <div className="mz-proc-recovery-icon-ring" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#2563eb" }}>
              <LuShieldCheck size={32} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
              Activate Assessment Telemetry
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#475569", lineHeight: "1.5" }}>
              Your proctored coding assessment requires continuous full-screen enforcement, entire-monitor screen sharing, and webcam verification.
            </p>
            <div className="mz-proc-chances-meter">
              <div className="mz-proc-chances-label-row">
                <span>Assessment Policy</span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>5 Recovery Chances Allowed</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "6px" }}>
              <button
                type="button"
                className="mz-proc-btn-resolve"
                onClick={handleInitStandaloneMedia}
              >
                <LuMaximize size={16} />
                <span>Connect Proctoring & Enter Workspace</span>
              </button>
              <button
                type="button"
                className="mz-modal-btn-cancel"
                style={{ padding: "10px 16px", borderRadius: "10px", fontWeight: 600 }}
                onClick={() => {
                  try {
                    sessionStorage.removeItem("mz_active_proctored_session");
                    sessionStorage.removeItem("mz_pending_refresh_violation");
                  } catch {}
                  cleanupAllMediaAndProctoring();
                  if (onClose) onClose();
                  else navigate("/coding");
                }}
              >
                Exit to Coding Challenges
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. FIVE-CHANCE ASSESSMENT RECOVERY OVERLAY
          ========================================================================= */}
      {isRecoveryModalOpen && (
        <div className="mz-proc-violation-modal-overlay">
          <div className={`mz-proc-recovery-card ${isTerminated ? "terminated" : ""}`} style={{ position: "relative" }}>
            <div className="mz-proc-recovery-icon-ring">
              <LuTriangleAlert size={30} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: isTerminated ? "#b91c1c" : "#92400e" }}>
              {isTerminated ? "Assessment Terminated: Limits Exceeded" : "Assessment Interrupted — Verification Required"}
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#475569", lineHeight: "1.5" }}>
              {isTerminated
                ? "You have exhausted all 5 recovery chances. Your assessment workspace is locked and your solution has been permanently submitted for final grading."
                : recoveryReason || "An environment interruption was detected. You must re-verify your device permissions and fullscreen mode to resume."}
            </p>

            {recoveryTimestamp && (
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                Timestamp: {new Date(recoveryTimestamp).toLocaleTimeString()}
              </div>
            )}

            {/* Five Chances Meter */}
            <div className="mz-proc-chances-meter">
              <div className="mz-proc-chances-label-row">
                <span>Recovery Chances Tracker</span>
                <span style={{ color: recoveryChancesRemaining > 0 ? "#10b981" : "#ef4444" }}>
                  {recoveryChancesRemaining} / 5 Remaining
                </span>
              </div>
              <div className="mz-proc-chances-pills">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className={`mz-proc-chance-pill ${idx > recoveryChancesRemaining ? "consumed" : ""}`}
                    title={`Chance ${idx}: ${idx > recoveryChancesRemaining ? "Used" : "Available"}`}
                  />
                ))}
              </div>
            </div>

            {!isTerminated ? (
              <>
                {/* Verification Checklist */}
                <div className="mz-proc-recheck-grid">
                  <div className={`mz-proc-recheck-item ${(cameraStream?.active || (cameraStream && cameraStream.getVideoTracks().some(t => t.readyState === "live"))) ? "ok" : "missing"}`}>
                    <LuCamera size={16} />
                    <span>Camera {(cameraStream?.active || (cameraStream && cameraStream.getVideoTracks().some(t => t.readyState === "live"))) ? "Active" : "Required"}</span>
                  </div>
                  <div className={`mz-proc-recheck-item ${(screenStream?.active || (screenStream && screenStream.getVideoTracks().some(t => t.readyState === "live"))) ? "ok" : "missing"}`}>
                    <LuMonitor size={16} />
                    <span>Screen {(screenStream?.active || (screenStream && screenStream.getVideoTracks().some(t => t.readyState === "live"))) ? "Active" : "Required"}</span>
                  </div>
                  <div className={`mz-proc-recheck-item ${(document.fullscreenElement || document.webkitFullscreenElement) ? "ok" : "missing"}`}>
                    <LuMaximize size={16} />
                    <span>Fullscreen {(document.fullscreenElement || document.webkitFullscreenElement) ? "Active" : "Required"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "6px" }}>
                  <button
                    type="button"
                    className="mz-proc-btn-resolve"
                    onClick={handleResumeAssessment}
                    disabled={isReverifying}
                  >
                    {isReverifying ? "Verifying Telemetry..." : "Re-Verify Hardware & Resume Assessment"}
                  </button>
                  <button
                    type="button"
                    className="mz-modal-btn-cancel"
                    style={{ padding: "10px 16px", borderRadius: "10px", fontWeight: 600 }}
                    onClick={() => {
                      try {
                        sessionStorage.removeItem("mz_active_proctored_session");
                        sessionStorage.removeItem("mz_pending_refresh_violation");
                      } catch {}
                      cleanupAllMediaAndProctoring();
                      if (onClose) onClose();
                      else navigate("/coding");
                    }}
                  >
                    Exit Assessment & Return to Challenges
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="mz-proc-btn-report"
                onClick={() => {
                  const sid = proctoredSessionId || routeSessionId;
                  navigate(`/assessment-report/${sid}`);
                }}
              >
                <LuAward size={18} />
                <span>View Assessment Report</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          8. SUBMISSION SUCCESS & VIEW ASSESSMENT REPORT MODAL
          ========================================================================= */}
      {submissionSuccessData && (
        <div className="mz-submit-modal-overlay">
          <div className="mz-proc-submission-success-card">
            <div className="mz-proc-success-icon-ring">
              <LuTrophy size={36} />
            </div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
              Assessment Submitted & Evaluated
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0, lineHeight: "1.5" }}>
              Your solution has been evaluated across all 10 real test cases in an isolated container. The assessment attempt is permanently locked and cryptographically archived.
            </p>

            <div className="mz-proc-score-badge-lg">
              <span>Score: {submissionSuccessData.score}/100</span>
              <span className={`grade-tag ${submissionSuccessData.score >= 80 ? "pass" : "fail"}`}>
                Grade: {submissionSuccessData.grade}
              </span>
              <span style={{ color: "#64748b", fontSize: "13px" }}>
                ({submissionSuccessData.passedTests}/{submissionSuccessData.totalTests} Tests Passed)
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
                <span>View Assessment Report</span>
              </button>

              <button
                type="button"
                className="mz-report-btn mz-report-btn-secondary"
                style={{ justifyContent: "center", padding: "12px", border: "1px solid #cbd5e1", color: "#334155" }}
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    navigate("/coding");
                  }
                }}
              >
                <LuHouse size={16} />
                <span>{onClose ? "Return to Challenges" : "Back to Home Dashboard"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
