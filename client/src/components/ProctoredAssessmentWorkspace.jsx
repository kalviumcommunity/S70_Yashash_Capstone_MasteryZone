import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  LuRefreshCw,
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
  const [searchParams] = useSearchParams();
  const isRetakeQuery = searchParams.get("retake") === "true";

  const [module, setModule] = useState(propModule || null);
  const [loadingModule, setLoadingModule] = useState(!propModule);

  const tId = propTrackId || paramTrackId || module?.trackId || "python";
  const mIdx = module?.moduleIndex ?? (paramModuleId !== undefined ? parseInt(paramModuleId, 10) : 0);
  const modKey = `${subjectKey}_${tId}_${mIdx}`;
  const orderStorageKey = `mz_proc_order_${modKey}`;

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



  // Assessment workflow stages: "gate", "active", "results_loading", "results"
  const [stage, setStage] = useState("gate");
  const [evaluatingState, setEvaluatingState] = useState(null); // 'evaluating' | 'report_ready' | 'error'
  const [savedReportData, setSavedReportData] = useState(null);
  const [evaluatingError, setEvaluatingError] = useState(null);

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
  const [recoveryTimestamp, setRecoveryTimestamp] = useState(null);
  const [isReverifying, setIsReverifying] = useState(false);
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
  const handleSubmitExamRef = useRef(null);

  // Synchronized state refs to avoid re-binding proctoring event listeners every second
  const answersRef = useRef(answers);
  const markedForReviewRef = useRef(markedForReview);
  const timeRemainingRef = useRef(timeRemaining);
  const violationsCountRef = useRef(violationsCount);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { markedForReviewRef.current = markedForReview; }, [markedForReview]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);
  useEffect(() => { violationsCountRef.current = violationsCount; }, [violationsCount]);

  useEffect(() => {
    isViolationOverlayOpenRef.current = isViolationOverlayOpen;
  }, [isViolationOverlayOpen]);

  useEffect(() => {
    isReverifyingRef.current = isReverifying;
  }, [isReverifying]);

  // Results State
  const [resultsData, setResultsData] = useState(null);

  const sessionStorageKey = `mz_exam_session_${subjectKey}_${tId}_${mIdx}`;

  // Shuffled questions preparation for every new attempt, persisting order per attempt
  const initShuffledQuestions = useCallback((sourceModule, forceNewShuffle = false) => {
    const rawQuestions =
      sourceModule?.assessment?.questions ||
      sourceModule?.questions ||
      sourceModule?.safeQuestions ||
      [];
    if (!rawQuestions || rawQuestions.length === 0) {
      setQuestions([]);
      return;
    }
    // Tag each question with its original index and id so grading is always 100% accurate
    const indexed = rawQuestions.map((q, idx) => ({
      ...q,
      originalIndex: typeof q.originalIndex === "number" ? q.originalIndex : idx,
      id: q.id || `q_${idx + 1}`,
    }));

    if (!forceNewShuffle) {
      try {
        const savedOrderJson = localStorage.getItem(orderStorageKey);
        if (savedOrderJson) {
          const parsed = JSON.parse(savedOrderJson);
          if (Array.isArray(parsed) && parsed.length === indexed.length) {
            setQuestions(parsed);
            return;
          }
        }
      } catch {}
    }

    // Fisher-Yates array shuffle for randomized question order on every fresh attempt
    const shuffled = [...indexed];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    try {
      localStorage.setItem(orderStorageKey, JSON.stringify(shuffled));
    } catch {}
    setQuestions(shuffled);
  }, [orderStorageKey]);

  // Reset attempt state, temporary test data, timer, answers and submission locks
  const resetAttemptData = useCallback(
    (forceShuffle = true) => {
      try {
        const rawUser = localStorage.getItem("user");
        let uId = "";
        if (rawUser) {
          try {
            const u = JSON.parse(rawUser);
            uId = u._id || u.id || u.userId || "";
          } catch {}
        }
        const userSubmittedKey = uId
          ? `mz_${uId}_exam_${subjectKey}_${tId}_${mIdx}_submitted`
          : `mz_exam_${mIdx}_submitted`;
        localStorage.removeItem(userSubmittedKey);
        localStorage.removeItem(`${userSubmittedKey}_report_url`);
        localStorage.removeItem(`mz_proc_draft_ans_${modKey}`);
        localStorage.removeItem(`mz_proc_draft_time_${modKey}`);
        localStorage.removeItem(`mz_proc_draft_violations_${modKey}`);
        sessionStorage.removeItem("mz_proc_pending_refresh_violation");
        if (forceShuffle) {
          localStorage.removeItem(orderStorageKey);
        }
      } catch {}

      setAnswers({});
      setMarkedForReview({});
      setVisitedQuestions({ 0: true });
      setCurrentQIndex(0);
      setTimeRemaining(EXAM_DURATION_SECONDS);
      setViolationsCount(0);
      setViolationsLog([]);
      setIsTerminated(false);
      setIsViolationOverlayOpen(false);
      setResultsData(null);
      setEvaluatingState(null);
      setSavedReportData(null);
      setEvaluatingError(null);
      setIsSubmitting(false);
      isSubmittedRef.current = false;
      setStage("gate");

      if (forceShuffle && module) {
        initShuffledQuestions(module, true);
      }
    },
    [subjectKey, tId, mIdx, modKey, orderStorageKey, module, initShuffledQuestions]
  );

  // Clear any legacy submission lock so re-attempts are always fresh for the candidate
  useEffect(() => {
    if (isRetakeQuery) {
      resetAttemptData(true);
    } else {
      const rawUser = localStorage.getItem("user");
      let uId = "";
      if (rawUser) {
        try {
          const u = JSON.parse(rawUser);
          uId = u._id || u.id || u.userId || "";
        } catch {}
      }
      const userSubmittedKey = uId
        ? `mz_${uId}_exam_${subjectKey}_${tId}_${mIdx}_submitted`
        : `mz_exam_${mIdx}_submitted`;
      localStorage.removeItem(userSubmittedKey);
      localStorage.removeItem(`${userSubmittedKey}_report_url`);
    }
  }, [isRetakeQuery, resetAttemptData, subjectKey, tId, mIdx]);

  useEffect(() => {
    if (module) {
      initShuffledQuestions(module, isRetakeQuery);
    }
  }, [module, isRetakeQuery, initShuffledQuestions]);

  const streamsRef = useRef({ cameraStream: null, micStream: null, screenStream: null });
  useEffect(() => {
    streamsRef.current = { cameraStream, micStream, screenStream };
  }, [cameraStream, micStream, screenStream]);

  // Clean up all streams, audio contexts, and exit fullscreen (safe unmount or final submission)
  const cleanUpMediaStreams = useCallback(() => {
    const { cameraStream: cs, micStream: ms, screenStream: ss } = streamsRef.current;
    if (cs) {
      try {
        cs.getTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
        });
      } catch {}
    }
    if (ms) {
      try {
        ms.getTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
        });
      } catch {}
    }
    if (ss) {
      try {
        ss.getTracks().forEach((track) => {
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
  }, []);

  // Component unmount ONLY
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
      const now = new Date();
      setRecoveryTimestamp(now);

      const entry = {
        type: detail || type,
        timestamp: now.toLocaleTimeString(),
      };

      setViolationsCount((prev) => {
        const next = prev + 1;
        setViolationsLog((pl) => [entry, ...pl]);
        setViolationMessage(detail || "Screen switch or window blur detected. Navigating away from the proctored test environment is prohibited.");

        if (next >= 5) {
          setIsTerminated(true);
          setIsViolationOverlayOpen(true);
          toast.error("All 5 proctoring violation chances exhausted! Submitting exam now...");
          setTimeout(() => {
            if (handleSubmitExamRef.current) {
              handleSubmitExamRef.current();
            }
          }, 1500);
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

    const handleKeyDown = (e) => {
      if (isSubmittedRef.current || isTerminated) return;
      if (
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        logViolation(
          "PAGE_RELOAD_ATTEMPT",
          "Screen switch or window blur detected. Navigating away from the proctored test environment is prohibited."
        );
      }
    };

    let blurTimer = null;
    const triggerTabSwitch = () => {
      if (
        isSubmittedRef.current ||
        isTerminated ||
        isViolationOverlayOpenRef.current ||
        isReverifyingRef.current ||
        Date.now() < immunityUntilRef.current
      ) return;

      logViolation(
        "TAB_SWITCH",
        "The examination has been paused because you switched away from the active assessment tab. Navigating to other browser tabs or applications during a proctored examination is strictly prohibited."
      );
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (blurTimer) {
          clearTimeout(blurTimer);
          blurTimer = null;
        }
        triggerTabSwitch();
      }
    };

    const handleWindowBlur = () => {
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (document.hidden || !document.hasFocus()) {
          triggerTabSwitch();
        }
      }, 250);
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
      if (isSubmittedRef.current || isTerminated) return;
      try {
        sessionStorage.setItem("mz_proc_pending_refresh_violation", "true");
        localStorage.setItem(`mz_proc_draft_ans_${modKey}`, JSON.stringify(answersRef.current));
        localStorage.setItem(`mz_proc_draft_review_${modKey}`, JSON.stringify(markedForReviewRef.current));
        localStorage.setItem(`mz_proc_draft_time_${modKey}`, String(timeRemainingRef.current));
        localStorage.setItem(`mz_proc_draft_violations_${modKey}`, String(violationsCountRef.current));
      } catch {}
      e.preventDefault();
      e.returnValue = "Leaving or reloading will consume one of your 5 recovery chances. Are you sure?";
      return e.returnValue;
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [stage, isTerminated, logViolation, modKey]);

  // Check for reload violation on stage mount & restore draft
  useEffect(() => {
    if (stage === "active") {
      try {
        const savedAns = localStorage.getItem(`mz_proc_draft_ans_${modKey}`);
        if (savedAns) {
          try {
            setAnswers(JSON.parse(savedAns));
          } catch {}
        }
        const savedReview = localStorage.getItem(`mz_proc_draft_review_${modKey}`);
        if (savedReview) {
          try {
            setMarkedForReview(JSON.parse(savedReview));
          } catch {}
        }
        const savedTime = localStorage.getItem(`mz_proc_draft_time_${modKey}`);
        if (savedTime && !isNaN(Number(savedTime))) {
          const parsedTime = Number(savedTime);
          if (parsedTime > 0 && parsedTime <= EXAM_DURATION_SECONDS) {
            setTimeRemaining(parsedTime);
          }
        }
        if (sessionStorage.getItem("mz_proc_pending_refresh_violation") === "true") {
          sessionStorage.removeItem("mz_proc_pending_refresh_violation");
          setTimeout(() => {
            logViolation(
              "PAGE_RELOAD",
              "Screen switch or window blur detected. Navigating away from the proctored test environment is prohibited."
            );
          }, 800);
        }
      } catch {}
    }
  }, [stage, logViolation, modKey]);

  // -------------------------------------------------------------
  // START ASSESSMENT (DIRECT FROM SECURITY GATE)
  // -------------------------------------------------------------
  const handleStartAssessmentDirect = async (gateData) => {
    setGateError("");
    const token = localStorage.getItem("token");

    try {
      if (token) {
        fetch(`${API_BASE}/api/curriculum/proctoring/start`, {
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

      // Clear previous draft answers, timers, and submission locks so new exam starts 100% fresh
      try {
        localStorage.removeItem(`mz_proc_draft_ans_${modKey}`);
        localStorage.removeItem(`mz_proc_draft_review_${modKey}`);
        localStorage.removeItem(`mz_proc_draft_time_${modKey}`);
        localStorage.removeItem(`mz_proc_draft_violations_${modKey}`);
        sessionStorage.removeItem("mz_proc_pending_refresh_violation");
      } catch {}

      isSubmittedRef.current = false;
      setIsSubmitting(false);
      setIsTerminated(false);
      setIsViolationOverlayOpen(false);

      setStage("active");
      initShuffledQuestions(module, true);
      setCurrentQIndex(0);
      setAnswers({});
      setMarkedForReview({});
      setVisitedQuestions({ 0: true });
      setTimeRemaining(EXAM_DURATION_SECONDS);
      timeRemainingRef.current = EXAM_DURATION_SECONDS;
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

      toast.info("10-Question proctored assessment commenced. Strict 30-minute limit active!");
    } catch (err) {
      setGateError(err.message);
      toast.error(err.message || "Failed to start assessment");
    }
  };

  // -------------------------------------------------------------
  // COUNTDOWN TIMER
  // -------------------------------------------------------------
  useEffect(() => {
    if (stage !== "active" || isSubmittedRef.current || isTerminated) {
      if (examTimerRef.current) clearInterval(examTimerRef.current);
      return;
    }

    if (examTimerRef.current) clearInterval(examTimerRef.current);
    examTimerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(examTimerRef.current);
          if (handleSubmitExamRef.current) {
            handleSubmitExamRef.current();
          }
          return 0;
        }
        const nextTime = prev - 1;
        timeRemainingRef.current = nextTime;
        if (nextTime % 5 === 0) {
          try {
            localStorage.setItem(`mz_proc_draft_time_${modKey}`, String(nextTime));
          } catch {}
        }
        return nextTime;
      });
    }, 1000);

    return () => {
      if (examTimerRef.current) clearInterval(examTimerRef.current);
    };
  }, [stage, isTerminated, modKey]);

  // -------------------------------------------------------------
  // EXAM ANSWERING & REVIEW CONTROLS
  // -------------------------------------------------------------
  const handleSelectOption = (optIndex) => {
    if (isSubmitting || isSubmittedRef.current) return;
    setAnswers((prev) => {
      const next = {
        ...prev,
        [currentQIndex]: optIndex,
      };
      answersRef.current = next;
      try {
        localStorage.setItem(`mz_proc_draft_ans_${modKey}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleToggleMarkForReview = () => {
    if (isSubmitting || isSubmittedRef.current) return;
    setMarkedForReview((prev) => {
      const next = { ...prev };
      if (next[currentQIndex]) {
        delete next[currentQIndex];
        toast.info(`Question ${currentQIndex + 1} unmarked from review.`);
      } else {
        next[currentQIndex] = true;
        toast.info(`Question ${currentQIndex + 1} marked for review.`);
      }
      markedForReviewRef.current = next;
      try {
        localStorage.setItem(`mz_proc_draft_review_${modKey}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleNavigateQuestion = (targetIdx) => {
    if (isSubmitting || isSubmittedRef.current) return;
    const bounded = Math.max(0, Math.min(questions.length - 1, targetIdx));
    setCurrentQIndex(bounded);
    setVisitedQuestions((prev) => ({ ...prev, [bounded]: true }));
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

    // Immediately transition screen to results loading animation (no old exam visible)
    setStage("results_loading");
    setEvaluatingState("evaluating");
    setEvaluatingError(null);

    cleanUpMediaStreams();

    const token = localStorage.getItem("token");
    const timeSpent = Math.max(1, EXAM_DURATION_SECONDS - (timeRemainingRef.current || timeRemaining));

    // Prepare answers payload mapped by both original question index and question ID
    const curAnswers = answersRef.current || answers;
    const submissionAnswers = {};
    questions.forEach((q, currentPos) => {
      const userSelected = curAnswers[currentPos];
      if (userSelected !== undefined && userSelected !== null && userSelected !== "") {
        const origIdx = q.originalIndex !== undefined ? q.originalIndex : currentPos;
        submissionAnswers[origIdx] = userSelected;
        submissionAnswers[String(origIdx)] = userSelected;
        submissionAnswers[currentPos] = userSelected;
        submissionAnswers[String(currentPos)] = userSelected;
        if (q.id) {
          submissionAnswers[q.id] = userSelected;
          submissionAnswers[String(q.id)] = userSelected;
        }
      }
    });

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
          answers: submissionAnswers,
          timeSpentSeconds: timeSpent,
          violationsCount: violationsCountRef.current || violationsCount,
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

      // Cache report locally for instant zero-latency report page rendering
      let localRecord = null;
      try {
        const rawUser = localStorage.getItem("user");
        let uId = "";
        if (rawUser) {
          const u = JSON.parse(rawUser);
          uId = u._id || u.id || u.userId || "";
        }
        const reportsKey = uId ? `mz_${uId}_assessment_reports` : "mz_assessment_reports";
        const existing = JSON.parse(localStorage.getItem(reportsKey) || "[]");
        localRecord = {
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
          questionsAttempted: data.questionsAttempted ?? Object.keys(curAnswers).length,
          questionsUnanswered: data.questionsUnanswered ?? Math.max(0, (data.totalQuestions || questions.length || 10) - Object.keys(curAnswers).length),
          durationSeconds: timeSpent,
          passed: Boolean(data.passed),
          violationsCount: violationsCountRef.current || violationsCount,
          submittedAt: new Date().toISOString(),
          reviewBreakdown: data.reviewBreakdown || [],
          reportUrl: `/assessment-report/${resolvedSessionId}`,
        };
        const updated = [localRecord, ...existing.filter((r) => r.sessionId !== resolvedSessionId && r.attemptId !== data.attemptId)];
        localStorage.setItem(reportsKey, JSON.stringify(updated.slice(0, 30)));

        // Clean up current attempt temporary data and locks so retakes are 100% fresh
        const userSubmittedKey = uId ? `mz_${uId}_exam_${subjectKey}_${tId}_${mIdx}_submitted` : `mz_exam_${mIdx}_submitted`;
        localStorage.removeItem(userSubmittedKey);
        localStorage.removeItem(`${userSubmittedKey}_report_url`);
        localStorage.removeItem(`mz_proc_draft_ans_${modKey}`);
        localStorage.removeItem(`mz_proc_draft_time_${modKey}`);
        localStorage.removeItem(`mz_proc_draft_review_${modKey}`);
        localStorage.removeItem(`mz_proc_draft_violations_${modKey}`);
        localStorage.removeItem(orderStorageKey);
        sessionStorage.removeItem("mz_proc_pending_refresh_violation");
      } catch (e) {
        console.warn("Could not cache report locally:", e);
      }

      if (onAssessmentCompleted) {
        onAssessmentCompleted(data);
      }

      setSavedReportData({
        ...data,
        resolvedSessionId,
        reportData: data.report || localRecord,
        timeSpentSeconds: timeSpent,
      });
      setEvaluatingState("report_ready");
    } catch (err) {
      console.error("Exam submission evaluation error:", err);
      setEvaluatingError(err.message || "Failed to submit assessment to server. Please try again.");
      setEvaluatingState("error");
      setIsSubmitting(false);
      isSubmittedRef.current = false;
    }
  };

  handleSubmitExamRef.current = handleSubmitExam;

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
                      ? "You have exhausted all 5 recovery chances. Your assessment workspace is locked and your answers have been permanently submitted for final grading."
                      : violationMessage || "Screen switch or window blur detected. Navigating away from the proctored test environment is prohibited."}
                  </p>

                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    Timestamp: {recoveryTimestamp ? new Date(recoveryTimestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                  </div>

                  {/* Five Chances Meter */}
                  <div className="mz-proc-chances-meter">
                    <div className="mz-proc-chances-label-row">
                      <span>Recovery Chances Tracker</span>
                      <span style={{ color: chancesRemaining > 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                        {chancesRemaining} / 5 Remaining
                      </span>
                    </div>
                    <div className="mz-proc-chances-pills">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`mz-proc-chance-pill ${idx > chancesRemaining ? "consumed" : ""}`}
                          title={`Chance ${idx}: ${idx > chancesRemaining ? "Used" : "Available"}`}
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
                          disabled={isReverifying}
                          onClick={async () => {
                            setIsReverifying(true);
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
                            immunityUntilRef.current = Date.now() + 3500;
                            setIsViolationOverlayOpen(false);
                            isViolationOverlayOpenRef.current = false;
                            isReverifyingRef.current = false;
                            setIsReverifying(false);
                          }}
                        >
                          {isReverifying ? "Verifying Telemetry..." : "Re-Verify Hardware & Resume Assessment"}
                        </button>
                        <button
                          type="button"
                          className="mz-modal-btn-cancel"
                          style={{ padding: "10px 16px", borderRadius: "10px", fontWeight: 600, width: "100%", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155", cursor: "pointer" }}
                          onClick={() => {
                            cleanUpMediaStreams();
                            if (onClose) onClose();
                            else navigate("/coding", { replace: true });
                          }}
                        >
                          Exit Assessment & Return to Challenges
                        </button>
                      </div>
                    </>
                  ) : null}
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
                          onClick={() => handleNavigateQuestion(idx)}
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
                      onClick={() => handleNavigateQuestion(currentQIndex - 1)}
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
                          onClick={() => handleNavigateQuestion(currentQIndex + 1)}
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
            STAGE: RESULTS PREPARATION & REPORT NOTIFICATION
            ===================================================== */}
        {stage === "results_loading" && (
          <>
            {/* 1. Results Loading Animation (Simple Normal Animation) */}
            {evaluatingState === "evaluating" && (
              <div className="mz-results-preparing-screen">
                <div className="mz-results-preparing-card mz-simple-loading-card">
                  <div className="mz-simple-loader">
                    <div className="mz-simple-spinner" />
                  </div>

                  <h2 className="mz-preparing-title">Loading Results...</h2>
                  <p className="mz-preparing-subtitle">
                    Please wait while your submission is being evaluated.
                  </p>

                  <div className="mz-simple-progress-bar">
                    <div className="mz-simple-progress-fill" />
                  </div>
                </div>
              </div>
            )}

            {/* 2. View Report Notification Card */}
            {evaluatingState === "report_ready" && savedReportData && (
              <div className="mz-report-ready-screen">
                <div className="mz-report-ready-card">
                  <div className="mz-report-ready-badge-wrapper">
                    <div className="mz-report-ready-check-icon">
                      <LuCircleCheck size={44} color="#10b981" />
                    </div>
                  </div>

                  <div className="mz-report-ready-tag">Evaluation Complete</div>
                  <h2 className="mz-report-ready-title">Your Report Is Ready!</h2>
                  <p className="mz-report-ready-subtitle">
                    Your assessment results have been verified and permanently saved to your audit ledger. Click below to inspect your comprehensive grade report.
                  </p>

                  <div className="mz-report-summary-box">
                    <div className="mz-summary-row">
                      <span className="mz-summary-label">Module:</span>
                      <span className="mz-summary-value">{module?.title || "Proctored Exam"}</span>
                    </div>
                    <div className="mz-summary-row">
                      <span className="mz-summary-label">MCQ Assessment Score:</span>
                      <span className={`mz-summary-value ${savedReportData.marksObtained >= 8 ? "pass" : "fail"}`}>
                        {savedReportData.marksObtained ?? 0} / {savedReportData.totalMarks || 10} Marks
                      </span>
                    </div>
                    <div className="mz-summary-row">
                      <span className="mz-summary-label">Accuracy & Grade:</span>
                      <span className="mz-summary-value">
                        {savedReportData.accuracy ?? savedReportData.percentage ?? 0}% (Grade {savedReportData.grade || (savedReportData.percentage >= 80 ? "A" : "F")})
                      </span>
                    </div>
                    <div className="mz-summary-row">
                      <span className="mz-summary-label">Cutoff (8/10):</span>
                      <span className={`mz-summary-badge ${savedReportData.marksObtained >= 8 ? "pass" : "fail"}`}>
                        {savedReportData.marksObtained >= 8 ? "Cutoff Met (Passed)" : "Cutoff Not Met (<8/10)"}
                      </span>
                    </div>
                    <div className="mz-summary-row">
                      <span className="mz-summary-label">Time Taken:</span>
                      <span className="mz-summary-value">
                        {formatTime(savedReportData.timeSpentSeconds || (EXAM_DURATION_SECONDS - timeRemaining))}
                      </span>
                    </div>
                  </div>

                  <div className="mz-report-ready-actions">
                    <button
                      type="button"
                      className="mz-view-report-primary-btn"
                      onClick={() => {
                        const sid = savedReportData.resolvedSessionId || savedReportData.sessionId || (savedReportData.attemptId ? `attempt_${savedReportData.attemptId}` : `attempt_${savedReportData.id}`);
                        const targetUrl = `/assessment-report/${sid}`;
                        navigate(targetUrl, {
                          replace: true,
                          state: {
                            report: savedReportData.reportData || savedReportData.report || savedReportData,
                            reportData: savedReportData.reportData || savedReportData.report || savedReportData,
                          },
                        });
                      }}
                    >
                      <LuFileText size={18} />
                      <span>View Report</span>
                      <LuArrowRight size={18} />
                    </button>

                    <button
                      type="button"
                      className="mz-return-dashboard-btn"
                      onClick={handleClose}
                    >
                      Done & Return to Curriculum
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Evaluation Error State */}
            {evaluatingState === "error" && (
              <div className="mz-report-ready-screen">
                <div className="mz-report-ready-card" style={{ borderColor: "#fca5a5" }}>
                  <div className="mz-report-ready-badge-wrapper">
                    <div className="mz-report-ready-check-icon" style={{ background: "#fef2f2", borderColor: "#fca5a5" }}>
                      <LuCircleX size={44} color="#dc2626" />
                    </div>
                  </div>

                  <h2 className="mz-report-ready-title" style={{ color: "#991b1b" }}>Submission Issue Detected</h2>
                  <p className="mz-report-ready-subtitle" style={{ color: "#b91c1c" }}>
                    {evaluatingError || "We could not save your evaluation report. Please check your network connection and retry."}
                  </p>

                  <div className="mz-report-ready-actions">
                    <button
                      type="button"
                      className="mz-view-report-primary-btn"
                      style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                      onClick={handleSubmitExam}
                    >
                      <LuRefreshCw size={17} />
                      <span>Retry Submission & Evaluation</span>
                    </button>
                    <button
                      type="button"
                      className="mz-return-dashboard-btn"
                      onClick={() => setStage("active")}
                    >
                      Return to Assessment Questions
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
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
                    onClick={() => resetAttemptData(true)}
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
