import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AssessmentSecurityGate from "./AssessmentSecurityGate";
import AssessmentSubmissionFlow from "./AssessmentSubmissionFlow";
import MasteryZoneCompilerWorkspace from "./MasteryZoneCompilerWorkspace";
import useNavigationLock from "../hooks/useNavigationLock";
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
  LuMaximize2,
  LuLayers,
  LuTerminal,
  LuCheckCheck,
  LuRotateCcw,
  LuCamera,
  LuMonitor,
  LuLayoutGrid,
  LuMic,
  LuBatteryCharging,
  LuBattery,
  LuFlag,
  LuFolderLock,
  LuHistory,
  LuSave,
  LuLightbulb,
  LuFileCode,
  LuExternalLink,
  LuTriangleAlert,
  LuTrophy,
  LuFileText,
  LuHouse,
  LuStar,
  LuLock,
  LuFolderTree,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

const CERT_INFO_MAP = {
  python_cert: { title: "Python Certified Professional", lang: "python" },
  js_cert: { title: "JavaScript Full-Stack Developer", lang: "javascript" },
  java_cert: { title: "Enterprise Java Specialist", lang: "java" },
  cpp_cert: { title: "Modern C++ Systems Engineer", lang: "cpp" },
  dsa_cert: { title: "Data Structures & Algorithms (DSA)", lang: "python" },
};

// Default fallback questions for Question 21 and Question 22 to guarantee distinct compilers and challenges
const DEFAULT_CERT_CODING_QUESTIONS = [
  {
    id: "ch_find_peak_element",
    questionId: "ch_find_peak_element",
    title: "Find Peak Element Index",
    difficulty: "Medium",
    category: "Algorithms & Binary Search",
    description: "A peak element is an element that is strictly greater than its neighbors.\n\nGiven a 0-indexed integer array `nums`, find a peak element, and return its index. If the array contains multiple peaks, return the index to any of the peaks.\n\nYou may imagine that nums[-1] = nums[n] = -∞. You must write an algorithm that runs in O(log n) time.",
    inputFormat: "nums: integer array",
    outputFormat: "integer: 0-based index of a peak element",
    starterCode: {
      python: "def findPeakElement(nums):\n    # Enter your solution below\n    pass\n",
      javascript: "function findPeakElement(nums) {\n    // Enter your solution below\n}\n",
      java: "class Solution {\n    public int findPeakElement(int[] nums) {\n        // Enter your solution below\n        return 0;\n    }\n}\n",
      cpp: "class Solution {\npublic:\n    int findPeakElement(vector<int>& nums) {\n        // Enter your solution below\n        return 0;\n    }\n};\n",
    },
    testCases: [
      { input: "[1, 2, 3, 1]", expectedOutput: "2", isHidden: false },
      { input: "[1, 2, 1, 3, 5, 6, 4]", expectedOutput: "5", isHidden: false },
      { input: "[1]", expectedOutput: "0", isHidden: false },
      { input: "[1, 2]", expectedOutput: "1", isHidden: true },
      { input: "[2, 1]", expectedOutput: "0", isHidden: true },
      { input: "[1, 3, 20, 4, 1, 0]", expectedOutput: "2", isHidden: true },
      { input: "[1, 2, 3, 4, 5]", expectedOutput: "4", isHidden: true },
      { input: "[5, 4, 3, 2, 1]", expectedOutput: "0", isHidden: true },
      { input: "[1, 10, 9, 8, 7, 6]", expectedOutput: "1", isHidden: true },
      { input: "[3, 4, 3, 2, 1]", expectedOutput: "1", isHidden: true },
    ],
  },
  {
    id: "ch_longest_substr_no_repeat",
    questionId: "ch_longest_substr_no_repeat",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "Sliding Window & Hash Map",
    description: "Given a string `s`, find the length of the longest substring without duplicate characters.",
    inputFormat: "s: string",
    outputFormat: "integer: length of longest unique character substring",
    starterCode: {
      python: "def lengthOfLongestSubstring(s):\n    # Enter your solution below\n    pass\n",
      javascript: "function lengthOfLongestSubstring(s) {\n    // Enter your solution below\n}\n",
      java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Enter your solution below\n        return 0;\n    }\n}\n",
      cpp: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Enter your solution below\n        return 0;\n    }\n};\n",
    },
    testCases: [
      { input: "\"abcabcbb\"", expectedOutput: "3", isHidden: false },
      { input: "\"bbbbb\"", expectedOutput: "1", isHidden: false },
      { input: "\"pwwkew\"", expectedOutput: "3", isHidden: false },
      { input: "\"\"", expectedOutput: "0", isHidden: true },
      { input: "\"au\"", expectedOutput: "2", isHidden: true },
      { input: "\"dvdf\"", expectedOutput: "3", isHidden: true },
      { input: "\"anviaj\"", expectedOutput: "5", isHidden: true },
      { input: "\"tmmzuxt\"", expectedOutput: "5", isHidden: true },
      { input: "\"abcdefghijklmnopqrstuvwxyz\"", expectedOutput: "26", isHidden: true },
      { input: "\"abba\"", expectedOutput: "2", isHidden: true },
    ],
  },
];

export default function CertificationExamWorkspace({
  certId: propCertId = "dsa_cert",
  certTitle: propCertTitle,
  language: propLanguage,
  onClose,
  onCompleted,
  isStandalone = false,
}) {
  const navigate = useNavigate();
  const { certId: paramCertId } = useParams();
  const certId = paramCertId || propCertId || "dsa_cert";
  const certTitle = propCertTitle || CERT_INFO_MAP[certId]?.title || "Python Certified Professional";
  const language = propLanguage || CERT_INFO_MAP[certId]?.lang || "python";

  const { currentUserId, currentUserEmail } = (() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const uid = u._id || u.id || u.userId || "";
        return {
          currentUserId: uid !== "guest" ? uid : "",
          currentUserEmail: u.email || "",
        };
      }
    } catch {}
    return { currentUserId: "", currentUserEmail: "" };
  })();

  // 1. Session Persistence Recovery State strictly isolated to authenticated user
  const savedSession = (() => {
    try {
      if (!currentUserId) return null;
      const item = localStorage.getItem(`mz_${currentUserId}_active_cert_session`);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (parsed.userId && parsed.userId !== currentUserId) return null;
      return parsed;
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
  const [alreadyCertifiedInfo, setAlreadyCertifiedInfo] = useState(null);
  const [attemptId, setAttemptId] = useState(() => savedSession?.attemptId || null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [candidateName, setCandidateName] = useState("Candidate");
  const [secondsRemaining, setSecondsRemaining] = useState(() => savedSession?.secondsRemaining || 5394); // ~89m 54s default
  const [isTimerRunning, setIsTimerRunning] = useState(true);

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
    {
      code: "# Enter your code below\n",
      language: "python",
      solved: false,
      passedTests: 0,
      totalTests: 10,
      testResults: [],
    },
    {
      code: "# Enter your code below\n",
      language: "python",
      solved: false,
      passedTests: 0,
      totalTests: 10,
      testResults: [],
    },
  ]);

  // -----------------------------------------------------------------
  // 5 Life Chances & Interruption System
  // -----------------------------------------------------------------
  const [recoveryChancesRemaining, setRecoveryChancesRemaining] = useState(5);
  const [violationsCount, setViolationsCount] = useState(0);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryReason, setRecoveryReason] = useState("");
  const [recoveryTimestamp, setRecoveryTimestamp] = useState(null);
  const [isReverifying, setIsReverifying] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);

  // Live Proctoring Media Streams (Continuous across MCQs & Coding)
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [micStream, setMicStream] = useState(null);
  const [batteryInfo, setBatteryInfo] = useState({ percentage: 82, charging: false });
  const [proctoringViewMode, setProctoringViewMode] = useState("dual"); // "dual" | "camera" | "screen"
  const [procMicVolume, setProcMicVolume] = useState(15);

  // Modals & Finalizing
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionSuccessData, setSubmissionSuccessData] = useState(null);
  const [finalReportReadyData, setFinalReportReadyData] = useState(null);

  // State synchronization refs for instant zero-latency isolation
  const isRecoveryModalOpenRef = useRef(false);
  const isReverifyingRef = useRef(false);
  const isSubmittedRef = useRef(false);
  const isFinalizingRef = useRef(false);
  const showConfirmModalRef = useRef(false);
  const violationCooldownRef = useRef(false);
  const immunityUntilRef = useRef(Date.now() + 1500);
  const secondsRemainingRef = useRef(secondsRemaining);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const mcqAnswersRef = useRef(mcqAnswers);
  const codingSubmissionsRef = useRef(codingSubmissions);
  const violationsCountRef = useRef(violationsCount);
  const handleFinalSubmitRef = useRef(null);

  const procCameraVideoRef = useRef(null);
  const procScreenVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    mcqAnswersRef.current = mcqAnswers;
  }, [mcqAnswers]);

  useEffect(() => {
    codingSubmissionsRef.current = codingSubmissions;
  }, [codingSubmissions]);

  useEffect(() => {
    violationsCountRef.current = violationsCount;
  }, [violationsCount]);

  useEffect(() => {
    isRecoveryModalOpenRef.current = isRecoveryModalOpen;
  }, [isRecoveryModalOpen]);

  useEffect(() => {
    isReverifyingRef.current = isReverifying;
  }, [isReverifying]);

  useEffect(() => {
    secondsRemainingRef.current = secondsRemaining;
  }, [secondsRemaining]);

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    isFinalizingRef.current = isFinalizing;
  }, [isFinalizing]);

  useEffect(() => {
    showConfirmModalRef.current = showConfirmModal;
  }, [showConfirmModal]);

  useEffect(() => {
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  useEffect(() => {
    micStreamRef.current = micStream;
  }, [micStream]);

  // Centralized Navigation Lock (protects against trackpad two-finger swipe-back, browser Back, and reload)
  useNavigationLock({
    isLocked: stage === "active" && !isFinalizing && !submissionSuccessData,
    warningMessage: "An active certification examination is in progress. Submitting your examination is required to exit.",
    lockKey: `mz_cert_${certId}`,
  });

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

  // Microphone volume level analyzer (throttled to avoid 60-120fps component re-render churn)
  useEffect(() => {
    if (!micStream) return;
    let isCancelled = false;
    let lastUpdate = 0;
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
          if (isCancelled || !analyser) return;
          const now = Date.now();
          if (now - lastUpdate > 150) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            const vol = Math.min(100, Math.round((avg / 128) * 100));
            setProcMicVolume((prev) => (Math.abs(prev - vol) > 3 ? vol : prev));
            lastUpdate = now;
          }
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }
    } catch (err) {
      console.warn("Audio meter setup note:", err);
    }

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [micStream]);

  // Battery monitoring
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.getBattery === "function") {
      navigator
        .getBattery()
        .then((battery) => {
          const updateBat = () => {
            setBatteryInfo({
              percentage: Math.round(battery.level * 100),
              charging: battery.charging,
            });
          };
          updateBat();
          battery.addEventListener("levelchange", updateBat);
          battery.addEventListener("chargingchange", updateBat);
        })
        .catch(() => {});
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
      const isStartingFresh = !isResumeTrigger;

      const res = await fetch(`${API_BASE}/api/certifications/attempt/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          certId,
          certTitle,
          forceNew: isStartingFresh,
          candidatePhoto: securityGateData?.candidatePhoto || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.alreadyCertified || err.isPassed || res.status === 403) {
          setAlreadyCertifiedInfo(err);
          toast.info("You have already passed this certification! Retaking is not allowed.", {
            toastId: "cert_already_certified",
          });
          return;
        }
        throw new Error(err.error || "Failed to initiate certification attempt");
      }

      const data = await res.json();
      if (data.alreadyCertified || data.isPassed) {
        setAlreadyCertifiedInfo(data);
        return;
      }

      // If candidate is starting a fresh valid attempt, clear stale drafts and submitted flags
      if (currentUserId && isStartingFresh) {
        localStorage.removeItem(`mz_${currentUserId}_cert_${certId}_submitted`);
        localStorage.removeItem(`mz_${currentUserId}_cert_${certId}_report_url`);
        // Remove stale draft code from previous attempts
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(`mz_${currentUserId}_draft_`) || key.startsWith(`mz_${currentUserId}_lang_`)) {
              localStorage.removeItem(key);
            }
          });
        } catch {}
      }

      setAttemptId(data.attemptId);
      setAttemptNumber(data.attemptNumber || 1);
      setCandidateName(data.candidateName || "Candidate");
      setSelectedMcqs(data.selectedMcqs || []);
      // Guarantee fresh attempt starts with 0 answers and question index 0
      setMcqAnswers(isStartingFresh ? {} : (data.mcqAnswers || {}));
      setFlaggedMcqs(new Set());
      setCurrentQuestionIndex(0);
      setSelectedCodingQuestions(data.selectedCodingQuestions || []);

      if (Array.isArray(data.codingSubmissions) && data.codingSubmissions.length > 0 && !isStartingFresh) {
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
        // Pristine starter code for brand new attempt
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

      if (data.proctoring && !isStartingFresh) {
        const viols = data.proctoring.violationsCount || 0;
        setViolationsCount(viols);
        setRecoveryChancesRemaining(Math.max(0, 5 - viols));
      } else {
        setViolationsCount(0);
        setRecoveryChancesRemaining(5);
      }

      // Save active session to localStorage so reload won't exit the test
      if (currentUserId) {
        localStorage.setItem(
          `mz_${currentUserId}_active_cert_session`,
          JSON.stringify({
            userId: currentUserId,
            attemptId: data.attemptId,
            certId,
            certTitle,
            currentQuestionIndex: 0,
            secondsRemaining: data.durationMinutes ? data.durationMinutes * 60 : 5400,
            status: "IN_PROGRESS",
          })
        );
      }

      // Enter fullscreen if permitted
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {}

      setStage("active");
      immunityUntilRef.current = Date.now() + 1500;

      if (isResumeTrigger || data.resumed) {
        toast.info("Resumed active certification examination.", {
          toastId: "cert_resume_toast",
          position: "bottom-right",
          autoClose: 1500,
        });
      } else {
        toast.success("Security Gate passed. Proctored examination active!", {
          toastId: "cert_gate_toast",
          position: "bottom-right",
          autoClose: 1500,
        });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify backend session state: check if certified or allowed to take exam (read-only, no attempt created)
  useEffect(() => {
    let isCancelled = false;
    const token = localStorage.getItem("token");
    if (token && certId) {
      fetch(`${API_BASE}/api/certifications/check/${certId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (isCancelled) return;
          if (data.alreadyCertified || data.isPassed || res.status === 403) {
            setAlreadyCertifiedInfo(data);
          } else {
            // Clean up stale submission flags for uncertified or retake attempts
            const uKey = currentUserId && currentUserId !== "guest" ? currentUserId : "guest";
            localStorage.removeItem(`mz_${uKey}_cert_${certId}_submitted`);
            localStorage.removeItem(`mz_${uKey}_cert_${certId}_report_url`);

            if (data.attemptNumber) {
              setAttemptNumber(data.attemptNumber);
            }

            // Only auto-resume if user actually had an active session stored locally
            if (isResumingActive && data.hasActiveAttempt) {
              startOrResumeAttempt(null, true);
            }
          }
        })
        .catch(() => {});
    }

    const handlePopState = () => {
      const uKey = currentUserId && currentUserId !== "guest" ? currentUserId : "guest";
      const checkSubmitted =
        isSubmittedRef.current ||
        localStorage.getItem(`mz_${uKey}_cert_${certId}_submitted`) === "true" ||
        (attemptId && localStorage.getItem(`mz_${uKey}_cert_${attemptId}_submitted`) === "true");
      if (checkSubmitted) {
        const repUrl =
          localStorage.getItem(`mz_${uKey}_cert_${certId}_report_url`) ||
          (attemptId ? `/assessment-report/${attemptId}` : "/home");
        navigate(repUrl, { replace: true });
      }
    };
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // -------------------------------------------------------------
  // 2. Interruption Logger: Five Life Chances System (5/5)
  // -------------------------------------------------------------
  const logProctoringAnomaly = useCallback(
    async (type, message) => {
      if (
        isSubmittedRef.current ||
        isTerminated ||
        isFinalizing ||
        isFinalizingRef.current ||
        showConfirmModal ||
        showConfirmModalRef.current ||
        violationCooldownRef.current ||
        isRecoveryModalOpenRef.current ||
        isReverifyingRef.current ||
        Date.now() < immunityUntilRef.current
      ) {
        return;
      }

      violationCooldownRef.current = true;
      setTimeout(() => {
        violationCooldownRef.current = false;
      }, 2000);

      isRecoveryModalOpenRef.current = true;
      const now = new Date();
      setRecoveryReason(message);
      setRecoveryTimestamp(now);
      setIsTimerRunning(false);

      // Immediate deterministic deduction of 1 chance
      let nextRem = 5;
      setRecoveryChancesRemaining((prev) => {
        nextRem = Math.max(0, prev - 1);
        if (nextRem <= 0) {
          setIsTerminated(true);
          toast.error("All 5 recovery chances exhausted! Submitting and grading exam now...", {
            toastId: "cert_auto_submit_toast",
            autoClose: 2000,
          });
          setTimeout(() => {
            if (handleFinalSubmitRef.current) {
              handleFinalSubmitRef.current();
            }
          }, 1500);
        }
        return nextRem;
      });
      setViolationsCount((p) => p + 1);
      setIsRecoveryModalOpen(true);

      // Post interruption telemetry event to backend
      try {
        const token = localStorage.getItem("token");
        if (attemptId && token) {
          const res = await fetch(`${API_BASE}/api/certifications/attempt/${attemptId}/proctoring-event`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ type, details: message }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.violationsCount !== undefined) {
              setViolationsCount(data.violationsCount);
            }
            if (data.chancesRemaining !== undefined) {
              setRecoveryChancesRemaining(data.chancesRemaining);
              if (data.chancesRemaining <= 0) {
                setIsTerminated(true);
                setTimeout(() => {
                  if (handleFinalSubmitRef.current) {
                    handleFinalSubmitRef.current();
                  }
                }, 1200);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Proctoring interruption telemetry error:", err);
      }
    },
    [attemptId, isFinalizing, isTerminated]
  );

  useEffect(() => {
    window.__mz_trigger_interruption = (type, message) => {
      immunityUntilRef.current = 0;
      violationCooldownRef.current = false;
      logProctoringAnomaly(
        type || "TAB_SWITCH",
        message || "Assessment window lost focus or switched tabs. Navigating away from the proctored examination is prohibited."
      );
    };
    return () => {
      delete window.__mz_trigger_interruption;
    };
  }, [logProctoringAnomaly]);

  // Re-verify hardware & resume proctored assessment
  const handleResumeAssessment = async () => {
    setIsReverifying(true);
    isReverifyingRef.current = true;
    violationCooldownRef.current = true;
    immunityUntilRef.current = Date.now() + 3500;

    try {
      // 1. Camera & Mic Check
      let cStream = cameraStream;
      const isCamLive = cStream && cStream.getVideoTracks && cStream.getVideoTracks().some((t) => t.readyState === "live");
      if (!isCamLive) {
        try {
          cStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
            audio: true,
          });
          setCameraStream(cStream);
          setMicStream(cStream);
        } catch (e) {
          console.warn("Camera re-acquisition note:", e);
        }
      }

      // 2. Screen Share Check
      let sStream = screenStream;
      const isScreenLive = sStream && sStream.getVideoTracks && sStream.getVideoTracks().some((t) => t.readyState === "live");
      if (!isScreenLive && navigator.mediaDevices?.getDisplayMedia) {
        try {
          sStream = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: "monitor" },
            audio: false,
          });
          setScreenStream(sStream);
        } catch (e) {
          console.warn("Screen re-acquisition note:", e);
        }
      }

      // 3. Fullscreen Re-entry
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

      setIsTimerRunning(true);
      setIsRecoveryModalOpen(false);
      isRecoveryModalOpenRef.current = false;
      toast.success(`Assessment Resumed! Remaining chances: ${recoveryChancesRemaining}/5`, {
        toastId: "cert_resumed_toast",
        position: "bottom-right",
        autoClose: 2000,
      });
    } catch (err) {
      toast.error("Re-verification failed: " + err.message);
    } finally {
      setIsReverifying(false);
      isReverifyingRef.current = false;
    }
  };

  // -------------------------------------------------------------
  // 3. Telemetry Listeners: Tab Switch, Fullscreen Exit, Reload
  // -------------------------------------------------------------
  useEffect(() => {
    if (stage !== "active" || isTerminated || isFinalizing) return;

    // 1. Tab switch / browser window blur / minimized window with coordination & debouncing
    let blurCheckTimer = null;

    const triggerTabSwitchViolation = () => {
      if (
        isSubmittedRef.current ||
        isTerminated ||
        isFinalizing ||
        isFinalizingRef.current ||
        showConfirmModal ||
        showConfirmModalRef.current ||
        violationCooldownRef.current ||
        isRecoveryModalOpenRef.current ||
        isReverifyingRef.current ||
        Date.now() < immunityUntilRef.current
      ) {
        return;
      }

      logProctoringAnomaly(
        "TAB_SWITCH",
        "The examination has been paused because you switched away from the active assessment tab. Navigating to other browser tabs or applications during a proctored examination is strictly prohibited."
      );
    };

    const handleVisibilityChange = () => {
      if (
        isSubmittedRef.current ||
        isTerminated ||
        isFinalizing ||
        isFinalizingRef.current ||
        showConfirmModal ||
        showConfirmModalRef.current
      ) {
        return;
      }
      if (document.hidden) {
        if (blurCheckTimer) {
          clearTimeout(blurCheckTimer);
          blurCheckTimer = null;
        }
        triggerTabSwitchViolation();
      }
    };

    const handleWindowBlur = () => {
      if (blurCheckTimer) clearTimeout(blurCheckTimer);
      if (
        isSubmittedRef.current ||
        isTerminated ||
        isFinalizing ||
        isFinalizingRef.current ||
        showConfirmModal ||
        showConfirmModalRef.current
      ) {
        return;
      }
      blurCheckTimer = setTimeout(() => {
        if (
          isSubmittedRef.current ||
          isTerminated ||
          isFinalizing ||
          isFinalizingRef.current ||
          showConfirmModal ||
          showConfirmModalRef.current ||
          Date.now() < immunityUntilRef.current
        ) {
          return;
        }
        if (document.hidden || !document.hasFocus()) {
          triggerTabSwitchViolation();
        }
      }, 350);
    };

    // 2. Continuous Fullscreen Enforcement
    const handleFsChange = () => {
      if (
        isSubmittedRef.current ||
        isTerminated ||
        isFinalizing ||
        isFinalizingRef.current ||
        showConfirmModal ||
        showConfirmModalRef.current ||
        isRecoveryModalOpenRef.current ||
        isReverifyingRef.current ||
        Date.now() < immunityUntilRef.current
      ) {
        return;
      }

      const inFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      if (!inFs) {
        logProctoringAnomaly(
          "FULLSCREEN_EXIT",
          "Continuous fullscreen mode is strictly required. Exiting fullscreen is an integrity violation."
        );
      }
    };

    // 3. Intercept reload shortcut keys (F5, Ctrl+R, Cmd+R)
    const handleKeyDown = (e) => {
      if (isSubmittedRef.current || isTerminated) return;
      if (
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        logProctoringAnomaly(
          "PAGE_RELOAD_ATTEMPT",
          "Screen switch or window blur detected. Navigating away from the proctored test environment is prohibited."
        );
      }
    };

    // 4. Beforeunload listener to detect page reload and persist state
    const handleBeforeUnload = (e) => {
      if (isSubmittedRef.current || isTerminated) return;
      try {
        sessionStorage.setItem("mz_cert_pending_refresh_violation", "true");
        if (currentUserId) {
          localStorage.setItem(
            `mz_${currentUserId}_active_cert_session`,
            JSON.stringify({
              userId: currentUserId,
              attemptId,
              certId,
              certTitle,
              currentQuestionIndex: currentQuestionIndexRef.current,
              secondsRemaining: secondsRemainingRef.current,
              status: "IN_PROGRESS",
            })
          );
        }
      } catch {}
      e.preventDefault();
      e.returnValue = "Are you sure you want to reload? An integrity violation will be logged and 1 recovery chance deducted.";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    stage,
    isTerminated,
    isFinalizing,
    logProctoringAnomaly,
    attemptId,
    certId,
    certTitle,
    currentUserId,
  ]);

  // Check for reload violation on stage mount
  useEffect(() => {
    if (stage === "active") {
      try {
        if (sessionStorage.getItem("mz_cert_pending_refresh_violation") === "true") {
          sessionStorage.removeItem("mz_cert_pending_refresh_violation");
          setTimeout(() => {
            logProctoringAnomaly(
              "PAGE_RELOAD",
              "Screen switch or window blur detected. Navigating away from the proctored test environment is prohibited."
            );
          }, 800);
        }
      } catch {}
    }
  }, [stage, logProctoringAnomaly]);

  // 3b. Continuous Hardware & Track Disconnection Monitoring
  useEffect(() => {
    if (stage !== "active" || isTerminated || isFinalizing) return;

    const camTrack = cameraStreamRef.current?.getVideoTracks?.()[0];
    const screenTrack = screenStreamRef.current?.getVideoTracks?.()[0];
    const micTrack = micStreamRef.current?.getAudioTracks?.()[0];

    const onCamEnded = () => {
      if (isSubmittedRef.current || isTerminated || isFinalizing || isFinalizingRef.current || showConfirmModalRef.current) return;
      logProctoringAnomaly(
        "CAMERA_DISCONNECTED",
        "Webcam video connection was lost or disconnected. Reconnecting camera is required."
      );
    };

    const onScreenEnded = () => {
      if (isSubmittedRef.current || isTerminated || isFinalizing || isFinalizingRef.current || showConfirmModalRef.current) return;
      logProctoringAnomaly(
        "SCREEN_SHARE_STOPPED",
        "Entire screen sharing was stopped. Continuous entire screen sharing is required throughout the examination."
      );
    };

    const onMicEnded = () => {
      if (isSubmittedRef.current || isTerminated || isFinalizing || isFinalizingRef.current || showConfirmModalRef.current) return;
      logProctoringAnomaly(
        "MIC_DISCONNECTED",
        "Microphone audio connection was lost. Reconnecting microphone is required."
      );
    };

    if (camTrack) camTrack.addEventListener("ended", onCamEnded);
    if (screenTrack) screenTrack.addEventListener("ended", onScreenEnded);
    if (micTrack) micTrack.addEventListener("ended", onMicEnded);

    return () => {
      if (camTrack) camTrack.removeEventListener("ended", onCamEnded);
      if (screenTrack) screenTrack.removeEventListener("ended", onScreenEnded);
      if (micTrack) micTrack.removeEventListener("ended", onMicEnded);
    };
  }, [stage, isTerminated, isFinalizing, logProctoringAnomaly, cameraStream, screenStream, micStream]);

  // -------------------------------------------------------------
  // 4. Timer Countdown (Pauses when modal open or terminated)
  // -------------------------------------------------------------
  useEffect(() => {
    if (stage !== "active" || !isTimerRunning || isTerminated) return;
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
  }, [stage, isTimerRunning, isTerminated]);

  const formatTimerMinsSecs = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
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
  const currentCodingQ = (selectedCodingQuestions && selectedCodingQuestions[codingIndex]?.title)
    ? selectedCodingQuestions[codingIndex]
    : DEFAULT_CERT_CODING_QUESTIONS[codingIndex] || DEFAULT_CERT_CODING_QUESTIONS[0];
  const currentSubmission = codingSubmissions[codingIndex] || {
    code: currentCodingQ.starterCode?.python || "# Enter your solution below\n",
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
    // Persist code per coding question index to prevent cross-question contamination
    try {
      if (currentUserId) {
        localStorage.setItem(`mz_${currentUserId}_draft_${attemptId}_q${21 + codingIndex}`, newCode);
        localStorage.setItem(`mz_${currentUserId}_lang_${attemptId}_q${21 + codingIndex}`, lang || "python");
      }
    } catch {}
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
      const passedCount = data.passedCount !== undefined ? data.passedCount : data.passedTests || 0;
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

  // Stop all media tracks (camera, screen, microphone) and clean up contexts immediately
  const stopAllProctoringMedia = useCallback(() => {
    try {
      isSubmittedRef.current = true;
      isFinalizingRef.current = true;
      immunityUntilRef.current = Date.now() + 60000;

      const activeStreams = [
        cameraStreamRef.current,
        screenStreamRef.current,
        micStreamRef.current,
      ];

      activeStreams.forEach((st) => {
        if (st && typeof st.getTracks === "function") {
          st.getTracks().forEach((track) => {
            try {
              track.onended = null;
              track.enabled = false;
              track.stop();
            } catch {}
          });
        }
      });

      if (procCameraVideoRef.current) {
        if (procCameraVideoRef.current.srcObject && typeof procCameraVideoRef.current.srcObject.getTracks === "function") {
          try {
            procCameraVideoRef.current.srcObject.getTracks().forEach((t) => {
              t.onended = null;
              t.enabled = false;
              t.stop();
            });
          } catch {}
        }
        procCameraVideoRef.current.srcObject = null;
      }

      if (procScreenVideoRef.current) {
        if (procScreenVideoRef.current.srcObject && typeof procScreenVideoRef.current.srcObject.getTracks === "function") {
          try {
            procScreenVideoRef.current.srcObject.getTracks().forEach((t) => {
              t.onended = null;
              t.enabled = false;
              t.stop();
            });
          } catch {}
        }
        procScreenVideoRef.current.srcObject = null;
      }

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          audioContextRef.current.close().catch(() => {});
        } catch {}
        audioContextRef.current = null;
      }

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
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

      cameraStreamRef.current = null;
      screenStreamRef.current = null;
      micStreamRef.current = null;
      setCameraStream(null);
      setScreenStream(null);
      setMicStream(null);
    } catch (e) {
      console.warn("Error stopping proctoring media:", e);
    }
  }, []);

  // Ensure all streams are terminated on component unmount
  useEffect(() => {
    return () => {
      stopAllProctoringMedia();
    };
  }, [stopAllProctoringMedia]);

  // -------------------------------------------------------------
  // 7. Final Combined Assessment Submission (MCQs + Coding >= 80%)
  // -------------------------------------------------------------
  const handleFinalSubmit = async () => {
    if (isSubmittedRef.current && isFinalizing) return;
    isSubmittedRef.current = true;
    isFinalizingRef.current = true;
    setIsFinalizing(true);
    setShowConfirmModal(false);
    showConfirmModalRef.current = false;
    setIsRecoveryModalOpen(false);
    isRecoveryModalOpenRef.current = false;
    immunityUntilRef.current = Date.now() + 60000;
    try {
      const token = localStorage.getItem("token");
      const currentMcqs = mcqAnswersRef.current || mcqAnswers;
      const currentCoding = codingSubmissionsRef.current || codingSubmissions;
      const currentViols = violationsCountRef.current !== undefined ? violationsCountRef.current : violationsCount;

      const res = await fetch(`${API_BASE}/api/certifications/attempt/${attemptId}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mcqAnswers: currentMcqs,
          codingSubmissions: currentCoding,
          violationsCount: currentViols,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to grade assessment");
      }

      const data = await res.json();
      setShowConfirmModal(false);
      setIsRecoveryModalOpen(false);

      // Record submitted status in localStorage strictly isolated to current authenticated user
      const uKey = currentUserId && currentUserId !== "guest" ? currentUserId : "guest";
      localStorage.setItem(`mz_${uKey}_cert_${certId}_submitted`, "true");
      if (attemptId) {
        localStorage.setItem(`mz_${uKey}_cert_${attemptId}_submitted`, "true");
      }
      const targetReportUrl = `/assessment-report/${attemptId}`;
      localStorage.setItem(`mz_${uKey}_cert_${certId}_report_url`, targetReportUrl);
      if (currentUserId) {
        localStorage.removeItem(`mz_${currentUserId}_active_cert_session`);
      }

      // Clear session from storage
      localStorage.removeItem("mz_active_cert_session");
      sessionStorage.removeItem("mz_cert_pending_refresh_violation");

      // Stop ALL proctoring tracks (camera, microphone, screen) automatically upon submission
      stopAllProctoringMedia();

      toast.dismiss();
      toast.success(
        data.finalVerdict === "PASSED"
          ? "🎉 Assessment Submitted! You cleared the 80% cutoff and earned your Official Certificate!"
          : "Assessment submitted and permanently recorded. View your official evaluation report below.",
        {
          toastId: "mz-cert-submit-toast",
          position: "top-right",
          autoClose: 2000,
        }
      );

      const finalScore =
        data.totalScore !== undefined
          ? data.totalScore
          : data.score !== undefined
          ? data.score
          : data.totalMarksObtained !== undefined
          ? data.totalMarksObtained
          : answeredMcqCount + totalPassedCodingTests;
      const finalPct =
        data.percentage !== undefined
          ? data.percentage
          : data.finalScorePercentage !== undefined
          ? data.finalScorePercentage
          : Math.round((finalScore / 40) * 100);
      const isPassed = data.finalVerdict === "PASSED" || finalPct >= 80;
      const totalPassedCoding = currentCoding.reduce((acc, s) => acc + (s.passedTests || 0), 0);

      if (isPassed) {
        try {
          localStorage.setItem(`mz_${uKey}_cert_passed_${certId}`, "true");
          localStorage.setItem(`mz_cert_passed_${certId}`, "true");
          window.dispatchEvent(new CustomEvent("mz_certificate_awarded", { detail: { certId, attemptId } }));
        } catch {}
      }

      // Cache comprehensive report locally for instant zero-latency report page rendering
      try {
        const reportsKey = uKey !== "guest" ? `mz_${uKey}_assessment_reports` : "mz_assessment_reports";
        const existing = JSON.parse(localStorage.getItem(reportsKey) || "[]");
        const localReportEntry = {
          sessionId: attemptId,
          attemptId,
          id: attemptId,
          certId,
          assessmentTitle: `${certTitle || "Data Structures & Algorithms"} — Proctored Credential Examination`,
          certTitle: certTitle || "Data Structures & Algorithms",
          candidateDetails: {
            fullName: candidateName || "Verified Candidate",
            email: currentUserEmail || "candidate@masteryzone.com",
            candidateId: `CAND-${(currentUserId || attemptId).slice(-6).toUpperCase()}`,
            organization: "Mastery Zone Academic Accreditation",
          },
          startTime: new Date(Date.now() - (90 * 60 - secondsRemaining) * 1000).toISOString(),
          submissionTime: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          durationSeconds: Math.max(1, 90 * 60 - secondsRemaining),
          timeLimitMinutes: 90,
          status: isPassed ? "passed" : "failed",
          finalVerdict: data.finalVerdict || (isPassed ? "PASSED" : "FAILED"),
          scorecard: {
            totalQuestions: (selectedMcqs?.length || 20) + (selectedCodingQuestions?.length || 2),
            questionsAttempted: Object.keys(currentMcqs).length + currentCoding.filter((s) => s.solved || s.passedTests > 0).length,
            questionsUnanswered: Math.max(0, 22 - (Object.keys(currentMcqs).length + currentCoding.filter((s) => s.solved || s.passedTests > 0).length)),
            totalMarks: 40,
            marksObtained: finalScore,
            overallPercentage: finalPct,
            totalTestCases: 20,
            totalPassedTests: totalPassedCoding,
            passed: isPassed,
            grade: finalPct >= 90 ? "A+" : finalPct >= 80 ? "A" : finalPct >= 70 ? "B" : finalPct >= 60 ? "C" : "F",
          },
          performance: {
            score: finalPct,
            passed: isPassed,
            passedTests: totalPassedCoding,
            totalTests: 20,
            marksObtained: finalScore,
            totalMarks: 40,
            mcqScore: data.mcqScore !== undefined ? data.mcqScore : Object.keys(currentMcqs).length,
            mcqTotal: 20,
            codingSolvedCount: currentCoding.filter((s) => s.solved).length,
            passingThreshold: 80,
          },
          proctoring: {
            status: currentViols === 0 ? "Compliant" : "Audit Flagged",
            violationsCount: currentViols,
            tabSwitches: currentViols,
            fullscreenExits: 0,
            deviceVerified: true,
            integrityRating: Math.max(50, 100 - currentViols * 10),
          },
          reviewBreakdown: (selectedMcqs || []).map((m) => {
            const userAns = currentMcqs[m.id];
            const isCorrect = userAns !== undefined && Number(userAns) === Number(m.correctAnswer);
            return {
              questionId: m.id,
              question: m.question,
              options: m.options,
              userSelected: userAns !== undefined ? Number(userAns) : null,
              correctIndex: Number(m.correctAnswer),
              isCorrect,
              marksAwarded: isCorrect ? 1 : 0,
              maxMarks: 1,
              explanation: m.explanation || "Algorithm analysis and complexity.",
            };
          }),
          questions: (selectedCodingQuestions || []).map((q, idx) => {
            const sub = currentCoding[idx] || {};
            return {
              questionId: q.questionId,
              title: q.title,
              difficulty: q.difficulty || "Medium",
              category: q.category || "Algorithms",
              submittedCode: sub.code || "",
              language: sub.language || "python",
              status: sub.solved ? "passed" : "failed",
              score: Math.round(((sub.passedTests || 0) / 10) * 100),
              marksObtained: sub.passedTests || 0,
              totalMarks: 10,
              passedTests: sub.passedTests || 0,
              totalTests: 10,
              testResults: sub.testResults || [],
            };
          }),
          certificate: data.certificate || null,
        };

        const updated = [localReportEntry, ...existing.filter((r) => r.sessionId !== attemptId && r.attemptId !== attemptId)];
        localStorage.setItem(reportsKey, JSON.stringify(updated.slice(0, 30)));
      } catch (cacheErr) {
        console.warn("Local report sync note:", cacheErr);
      }

      setSubmissionSuccessData({
        attemptId,
        score: finalScore,
        totalMarks: data.maxScore || 40,
        percentage: finalPct,
        passed: isPassed,
        mcqScore: data.mcqScore !== undefined ? data.mcqScore : answeredMcqCount,
        codingScore: data.codingScore !== undefined ? data.codingScore : totalPassedCodingTests,
        reportUrl: targetReportUrl,
      });

      if (onCompleted) {
        onCompleted(data);
      }

      // Replace history entry so browser Back button cannot re-enter the completed exam workspace
      window.history.replaceState({ submitted: true, certId, attemptId }, "", targetReportUrl);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  useEffect(() => {
    handleFinalSubmitRef.current = handleFinalSubmit;
  });

  // Combined score calculations (20 MCQs + 20 Coding Tests = 40 Total Marks)
  const answeredMcqCount = Object.keys(mcqAnswers).length;
  const totalPassedCodingTests = codingSubmissions.reduce((acc, s) => acc + (s.passedTests || 0), 0);
  const totalAttemptedCount = answeredMcqCount + (codingSubmissions.filter((s) => s.solved || s.passedTests > 0).length);

  // -------------------------------------------------------------
  // STAGE 0: CANDIDATE ALREADY PASSED & EARNED CERTIFICATE
  // -------------------------------------------------------------
  if (alreadyCertifiedInfo) {
    const certIdVal = alreadyCertifiedInfo.certificateId || "VERIFIED";
    const attIdVal = alreadyCertifiedInfo.attemptId;
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #090d16 0%, #15102a 100%)",
          color: "#ffffff",
          padding: "24px",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "560px",
            width: "100%",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: "1.5px solid rgba(255, 255, 255, 0.12)",
            padding: "36px 32px",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(34, 197, 94, 0.15)",
              color: "#4ade80",
              border: "2px solid #22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              fontSize: "32px",
            }}
          >
            🏆
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(34, 197, 94, 0.2)",
              color: "#86efac",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              borderRadius: "20px",
              padding: "4px 14px",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "14px",
            }}
          >
            <LuCircleCheck size={14} /> Completed • Certificate Awarded
          </div>

          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 10px", color: "#ffffff" }}>
            {certTitle}
          </h1>

          <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.6, margin: "0 0 22px" }}>
            You have already cleared the 80% passing cutoff and earned your verified credential for this subject.
            <br />
            <strong style={{ color: "#fde047" }}>Completed certification examinations cannot be attended again.</strong>
          </p>

          {certIdVal && (
            <div
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "12px",
                marginBottom: "24px",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              Credential ID:{" "}
              <strong style={{ color: "#ffffff", fontFamily: "monospace", letterSpacing: "1px" }}>
                {certIdVal}
              </strong>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {certIdVal && (
              <a
                href={`/verify/${certIdVal}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(34, 197, 94, 0.3)",
                }}
              >
                <LuAward size={16} /> View Verified Certificate
              </a>
            )}

            {attIdVal && (
              <a
                href={`/assessment-report/${attIdVal}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                }}
              >
                <LuFileText size={16} /> View Examination Report
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                else if (window.opener) window.close();
                else navigate("/certificates", { replace: true });
              }}
              style={{
                marginTop: "4px",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                padding: "8px",
              }}
            >
              ← Return to Certifications
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          if (currentUserId) localStorage.removeItem(`mz_${currentUserId}_active_cert_session`);
          if (onClose) {
            onClose();
          } else if (isStandalone || !onClose) {
            if (window.opener) window.close();
            else navigate("/coding", { replace: true });
          }
        }}
        onStartAssessment={async (gateData) => {
          await startOrResumeAttempt(gateData);
        }}
      />
    );
  }

  if (isFinalizing) {
    return (
      <AssessmentSubmissionFlow
        stage="preparing"
        title={certTitle}
        assignmentType="Certification Exam"
        attemptNumber={attemptNumber}
      />
    );
  }

  if (submissionSuccessData) {
    return (
      <AssessmentSubmissionFlow
        stage="ready"
        title={certTitle}
        assignmentType="Certification Exam"
        attemptNumber={attemptNumber}
        reportUrl={submissionSuccessData.reportUrl}
        sessionId={submissionSuccessData.attemptId}
        summaryData={{
          score: submissionSuccessData.score,
          totalMarks: submissionSuccessData.totalMarks || 40,
          percentage: submissionSuccessData.percentage,
          status: submissionSuccessData.passed ? "PASSED" : "EVALUATED",
          grade: submissionSuccessData.passed ? "CERTIFIED" : "COMPLETED",
          details: `MCQs: ${submissionSuccessData.mcqScore}/20 • Coding: ${submissionSuccessData.codingScore}/20`,
        }}
        onViewReport={() => {
          navigate(submissionSuccessData.reportUrl, { replace: true });
        }}
        onRetake={!submissionSuccessData.passed ? () => {
          setSubmissionSuccessData(null);
          setStage("gate");
          setAttemptId(null);
          setMcqAnswers({});
          setFlaggedMcqs(new Set());
          setCodingSubmissions([]);
          setSelectedMcqs([]);
          setSelectedCodingQuestions([]);
          setCurrentQuestionIndex(0);
          setAttemptNumber((prev) => prev + 1);
          if (currentUserId) {
            localStorage.removeItem(`mz_${currentUserId}_active_cert_session`);
          }
        } : null}
      />
    );
  }

  // -------------------------------------------------------------
  // STAGE 2: ACTIVE PROCTORED EXAMINATION WORKSPACE (22 QUESTIONS)
  // EXACT MATCH TO REFERENCE IMAGE (NO TOP PLATFORM NAVBAR)
  // -------------------------------------------------------------
  const isMcqMode = currentQuestionIndex < 20;
  const currentMcq = isMcqMode ? selectedMcqs[currentQuestionIndex] : null;

  return (
    <div className="mz-cert-workspace-root">
      {/* 1. TOP HEADER BANNER (DEEP PURPLE/NAVY GRADIENT) */}
      <header className="mz-cert-top-bar">
        {/* Left: Star Icon in circle + Title • Attempt # + Proctoring Active pill */}
        <div className="mz-cert-top-left">
          <div className="mz-cert-star-circle">
            <LuStar size={17} fill="#ffffff" color="#ffffff" />
          </div>

          <h1 className="mz-cert-problem-title">
            {certTitle} • Attempt #{attemptNumber}
          </h1>

          <div className="mz-cert-proctoring-pill">
            <span className="mz-dot-proctoring">●</span> Proctoring Active
          </div>
        </div>

        {/* Right: Time Remaining + Submit Assessment Button */}
        <div className="mz-cert-top-right">
          <div className="mz-cert-timer-block">
            <LuClock size={22} color="#ffffff" className="mz-timer-clock-icon" />
            <div className="mz-timer-text-wrap">
              <span className="mz-timer-label">Time Remaining</span>
              <span className="mz-timer-val">{formatTimerMinsSecs(secondsRemaining)}</span>
            </div>
          </div>

          <button
            type="button"
            className="mz-cert-btn-top-submit"
            onClick={() => setShowConfirmModal(true)}
            title="Finalize assessment and submit for grading"
          >
            <LuSend size={15} style={{ marginRight: 6 }} />
            <span>Submit Assessment</span>
          </button>
        </div>
      </header>

      {/* 2. UNIFIED QUESTION NAVIGATION STRIP */}
      <div className="mz-cert-palette-bar">
        <div className="mz-palette-left-section">
          <span className="mz-palette-section-label">MCQs (1-20)</span>
          <div className="mz-palette-mcq-circles">
            {Array.from({ length: 20 }).map((_, idx) => {
              const q = selectedMcqs[idx];
              const isAnswered = q && mcqAnswers[q.id] !== undefined;
              const isFlagged = flaggedMcqs.has(idx);
              const isCurrent = currentQuestionIndex === idx;

              let cls = "mz-palette-circle-btn";
              if (isCurrent) cls += " active";
              else if (isAnswered) cls += " answered";
              else if (isFlagged) cls += " flagged";

              return (
                <button
                  key={idx}
                  type="button"
                  className={cls}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mz-palette-strip-divider" />

          <span className="mz-palette-section-label">CODING (21-22)</span>
          <div className="mz-palette-coding-pills">
            <button
              type="button"
              className={`mz-palette-coding-pill ${currentQuestionIndex === 20 ? "active" : ""}`}
              onClick={() => setCurrentQuestionIndex(20)}
              title="Coding Question 21"
            >
              <span className="mz-coding-pill-icon">&lt;/&gt;</span>
              <span>Q21</span>
            </button>

            <button
              type="button"
              className={`mz-palette-coding-pill ${currentQuestionIndex === 21 ? "active" : ""}`}
              onClick={() => setCurrentQuestionIndex(21)}
              title="Coding Question 22"
            >
              <LuFileCode size={13} style={{ marginRight: 3 }} />
              <span>Q22</span>
            </button>
          </div>
        </div>

        {/* Right Stats: MCQs count, Coding count, Combined Cutoff Badge */}
        <div className="mz-palette-right-section">
          <div className="mz-stat-item">
            <span className="mz-dot-indicator green">●</span>
            <span className="mz-stat-label">
              MCQs: <strong>{answeredMcqCount}/20</strong>
            </span>
          </div>

          <div className="mz-stat-item">
            <span className="mz-dot-indicator purple">●</span>
            <span className="mz-stat-label">
              Coding Tests: <strong>{totalPassedCodingTests}/20</strong>
            </span>
          </div>

          <div className="mz-cutoff-pill-badge">
            <LuAward size={14} color="#d97706" />
            <span>Combined Cutoff: ≥80% (32/40)</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE LAYOUT (2 COLUMNS) */}
      <div className="mz-cert-main-layout">
        {/* Left Column: Live Proctoring Card (Top) + Question Palette Card (Bottom) */}
        <aside className="mz-cert-sidebar-col">
          {/* CARD 1: LIVE PROCTORING */}
          <div className="mz-cert-sidebar-card mz-cert-proc-card">
            <div className="mz-proc-card-header">
              <div className="mz-proc-title-wrap">
                <LuShieldCheck size={17} color="#10b981" />
                <span className="mz-proc-card-title">Live Proctoring</span>
              </div>
              <span className="mz-proc-badge-active">ACTIVE</span>
            </div>

            {/* Mode Switcher Pills (Camera / Screen / Dual) */}
            <div className="mz-proc-mode-toggle-group">
              <button
                type="button"
                className={`mz-proc-mode-btn ${proctoringViewMode === "camera" ? "active" : ""}`}
                onClick={() => setProctoringViewMode("camera")}
              >
                <LuCamera size={13} />
                <span>Camera</span>
              </button>
              <button
                type="button"
                className={`mz-proc-mode-btn ${proctoringViewMode === "screen" ? "active" : ""}`}
                onClick={() => setProctoringViewMode("screen")}
              >
                <LuMonitor size={13} />
                <span>Screen</span>
              </button>
              <button
                type="button"
                className={`mz-proc-mode-btn ${proctoringViewMode === "dual" ? "active" : ""}`}
                onClick={() => setProctoringViewMode("dual")}
              >
                <LuLayers size={13} />
                <span>Dual</span>
              </button>
            </div>

            {/* Dual Video Feeds (Webcam on top, Screen below) */}
            <div className="mz-proc-video-container">
              {(proctoringViewMode === "dual" || proctoringViewMode === "camera") && (
                <div className="mz-proc-feed-box webcam">
                  <video
                    ref={procCameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="mz-proc-video-el"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <div className="mz-proc-feed-badge-top-left">
                    <span className="mz-dot-feed live">●</span> Live
                  </div>
                  <div className="mz-proc-feed-badge-bottom-right">Webcam</div>
                  {(!cameraStream || !cameraStream.active) && (
                    <div className="mz-proc-feed-disconnected-overlay">
                      <LuCamera size={20} color="#f87171" />
                      <span style={{ color: "#f87171", fontWeight: 600 }}>Webcam Disconnected</span>
                    </div>
                  )}
                </div>
              )}

              {(proctoringViewMode === "dual" || proctoringViewMode === "screen") && (
                <div className="mz-proc-feed-box screen">
                  <video
                    ref={procScreenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="mz-proc-video-el screen"
                  />
                  <div className="mz-proc-feed-badge-top-left">
                    <span className="mz-dot-feed screen">●</span> Screen
                  </div>
                  <div className="mz-proc-feed-badge-bottom-right">Entire Screen</div>
                  {(!screenStream || !screenStream.active) && (
                    <div className="mz-proc-feed-disconnected-overlay">
                      <LuMonitor size={20} color="#f87171" />
                      <span style={{ color: "#f87171", fontWeight: 600 }}>Screen Share Inactive</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Microphone Audio Equalizer Bar */}
            <div className="mz-proc-mic-section">
              <div className="mz-proc-mic-header">
                <div className="mz-proc-mic-label">
                  <LuMic size={14} color="#334155" />
                  <span>Microphone</span>
                </div>
                <div className="mz-proc-mic-status">
                  <span className="mz-mic-status-dot">●</span>
                  <span>Audio Detected</span>
                </div>
              </div>
              <div className="mz-proc-equalizer-bars">
                {[
                  4, 6, 10, 14, 8, 12, 16, 18, 14, 10, 8, 14, 16, 12, 18, 16, 12, 10, 14, 16,
                  12, 8, 10, 14, 12, 8, 6, 4,
                ].map((baseH, bIdx) => {
                  const dynamicH = Math.min(
                    18,
                    Math.max(4, Math.round(baseH * (0.6 + (procMicVolume / 100) * 0.8)))
                  );
                  return (
                    <span
                      key={bIdx}
                      className="mz-eq-bar"
                      style={{ height: `${dynamicH}px` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Hardware & Security Telemetry Metrics */}
            <div className="mz-proc-metrics-list">
              <div className="mz-proc-metric-row">
                <div className="mz-metric-label-left">
                  <LuBatteryCharging size={14} color="#475569" />
                  <span>Device Battery</span>
                </div>
                <div className="mz-metric-val-right">
                  <span className="mz-metric-dot green">●</span> {batteryInfo.percentage}%
                </div>
              </div>

              <div className="mz-proc-metric-row">
                <div className="mz-metric-label-left">
                  <LuMaximize2 size={14} color="#475569" />
                  <span>Full Screen Enforcement</span>
                </div>
                <div className="mz-metric-val-right bold-green">Active</div>
              </div>

              <div className="mz-proc-metric-row">
                <div className="mz-metric-label-left">
                  <LuLock size={14} color="#475569" />
                  <span>Assessment Security</span>
                </div>
                <div className="mz-metric-val-right bold-purple">STRICT</div>
              </div>

              <div className="mz-proc-metric-row">
                <div className="mz-metric-label-left">
                  <LuRotateCcw size={14} color="#475569" />
                  <span>Recovery Chances</span>
                </div>
                <div
                  className={`mz-metric-val-right ${
                    recoveryChancesRemaining > 0 ? "bold-green" : "bold-red"
                  }`}
                >
                  {recoveryChancesRemaining} / 5 Left
                </div>
              </div>

              {/* 5 Segmented Horizontal Bars beneath Recovery Chances */}
              <div className="mz-proc-segmented-chances-row">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className={`mz-chance-segment-pill ${
                      idx <= recoveryChancesRemaining ? "active" : "consumed"
                    }`}
                    title={`Recovery Chance ${idx}: ${
                      idx <= recoveryChancesRemaining ? "Available" : "Consumed"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CARD 2: QUESTION PALETTE (1-22) */}
          <div className="mz-cert-sidebar-card mz-cert-palette-card">
            <div className="mz-palette-card-header">
              <span className="mz-palette-card-title">Question Palette (1-22)</span>
              <span className="mz-palette-card-count">{totalAttemptedCount}/22 Attempted</span>
            </div>

            {/* 5-Column Grid */}
            <div className="mz-sidebar-palette-grid">
              {/* Questions 1 to 20: MCQs */}
              {Array.from({ length: 20 }).map((_, idx) => {
                const q = selectedMcqs[idx];
                const isAnswered = q && mcqAnswers[q.id] !== undefined;
                const isFlagged = flaggedMcqs.has(idx);
                const isCurrent = currentQuestionIndex === idx;

                let cls = "mz-sidebar-grid-btn";
                if (isCurrent) cls += " active";
                else if (isAnswered) cls += " answered";
                else if (isFlagged) cls += " flagged";

                return (
                  <button
                    key={idx}
                    type="button"
                    className={cls}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}

              {/* Questions 21 and 22: Coding Challenges */}
              {[21, 22].map((qNum, cIdx) => {
                const paletteIdx = 20 + cIdx;
                const sub = codingSubmissions[cIdx];
                const isSolved = Boolean(sub?.solved || sub?.passedTests === 10);
                const isCurrent = currentQuestionIndex === paletteIdx;

                let cls = "mz-sidebar-grid-btn coding";
                if (isCurrent) cls += " active";
                else if (isSolved) cls += " answered";

                return (
                  <button
                    key={qNum}
                    type="button"
                    className={cls}
                    onClick={() => setCurrentQuestionIndex(paletteIdx)}
                  >
                    {qNum}
                  </button>
                );
              })}
            </div>

            {/* Question Challenges (Q21 & Q22) Action Cards */}
            <div className="mz-sidebar-challenges-section">
              <div className="mz-sidebar-challenges-title">Question Challenges (Q21 & Q22)</div>
              {[0, 1].map((cIdx) => {
                const qNum = 21 + cIdx;
                const paletteIdx = 20 + cIdx;
                const cq = selectedCodingQuestions[cIdx] || {};
                const sub = codingSubmissions[cIdx];
                const isCurrent = currentQuestionIndex === paletteIdx;
                const isSolved = Boolean(sub?.solved || sub?.passedTests === 10);
                const defaultTitle =
                  cIdx === 0
                    ? "Find Peak Element Index"
                    : "Longest Substring Without Repeating Characters";

                return (
                  <button
                    key={qNum}
                    type="button"
                    className={`mz-sidebar-challenge-card ${isCurrent ? "active" : ""}`}
                    onClick={() => setCurrentQuestionIndex(paletteIdx)}
                  >
                    <div className="mz-sidebar-challenge-left">
                      <span className="mz-sidebar-code-symbol">&lt;/&gt;</span>
                      <span className="mz-sidebar-challenge-name">
                        Q{qNum}: {cq.title || defaultTitle}
                      </span>
                    </div>
                    <span className="mz-sidebar-challenge-badge">
                      {isSolved ? "10/10 Tests" : "10 Marks"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Main Panel: MCQ View (1..20) OR Embedded Compiler Workspace (21..22) */}
        {isMcqMode ? (
          <main className="mz-mcq-card-main">
            {currentMcq ? (
              <>
                {/* Header: Question 1 of 20, Trees topic, Marks & Cutoff, Flag button */}
                <div className="mz-mcq-card-header">
                  <div className="mz-mcq-header-left">
                    <span className="mz-mcq-qnumber-pill">
                      Question {currentQuestionIndex + 1} of 20
                    </span>
                    <span className="mz-mcq-topic-pill">
                      <LuFolderTree size={14} color="#475569" style={{ marginRight: 6 }} />
                      {currentMcq.topic || "Trees"}
                    </span>
                  </div>

                  <div className="mz-mcq-header-right">
                    <span className="mz-mcq-cutoff-text">
                      1 Mark • Combined Cutoff: ≥80% (32/40)
                    </span>
                    <button
                      type="button"
                      className={`mz-mcq-flag-btn ${
                        flaggedMcqs.has(currentQuestionIndex) ? "flagged" : ""
                      }`}
                      onClick={() => toggleFlagMcq(currentQuestionIndex)}
                    >
                      <LuFlag
                        size={14}
                        color={flaggedMcqs.has(currentQuestionIndex) ? "#eab308" : "#475569"}
                      />
                      <span>
                        {flaggedMcqs.has(currentQuestionIndex) ? "Flagged ✓" : "Flag Question"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Question Body */}
                <div className="mz-mcq-body-content">
                  <h2 className="mz-mcq-question-text">
                    {currentMcq.question}
                  </h2>

                  {currentMcq.codeSnippet && (
                    <pre className="mz-mcq-code-snippet">
                      <code>{currentMcq.codeSnippet}</code>
                    </pre>
                  )}

                  {/* 4 Option Cards (A, B, C, D) */}
                  <div className="mz-mcq-options-list">
                    {currentMcq.options?.map((opt, optIdx) => {
                      const isSelected = mcqAnswers[currentMcq.id] === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`mz-mcq-option-card ${isSelected ? "selected" : ""}`}
                          onClick={() => handleSelectMcqOption(currentMcq.id, optIdx)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleSelectMcqOption(currentMcq.id, optIdx);
                            }
                          }}
                        >
                          <div className="mz-mcq-opt-left">
                            <span className="mz-mcq-opt-circle">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="mz-mcq-opt-text">{opt}</span>
                          </div>
                          <div className={`mz-mcq-radio-circle ${isSelected ? "selected" : ""}`}>
                            {isSelected && <span className="mz-mcq-radio-dot-inner" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Navigation Bar */}
                <div className="mz-mcq-nav-actions">
                  <button
                    type="button"
                    className="mz-btn-prev-question"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                  >
                    <LuChevronLeft size={16} />
                    <span>Previous Question</span>
                  </button>

                  <div className="mz-mcq-nav-center-progress">
                    <div className="mz-nav-progress-line-track">
                      <div
                        className="mz-nav-progress-line-fill"
                        style={{ width: `${((currentQuestionIndex + 1) / 20) * 100}%` }}
                      />
                    </div>
                    <span className="mz-nav-progress-title">
                      Question {currentQuestionIndex + 1} of 20
                    </span>
                    <span className="mz-nav-progress-sub">
                      {mcqAnswers[currentMcq.id] !== undefined
                        ? "Option Selected"
                        : "Pending Selection"}
                    </span>
                  </div>

                  {currentQuestionIndex < 19 ? (
                    <button
                      type="button"
                      className="mz-btn-next-question"
                      onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                    >
                      <span>Next Question</span>
                      <LuChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mz-btn-next-question mz-btn-next-to-coding"
                      onClick={() => setCurrentQuestionIndex(20)}
                    >
                      <span>Proceed to Coding (Q21)</span>
                      <LuChevronRight size={16} />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                Loading examination question details...
              </div>
            )}
          </main>
        ) : (
          /* ================= EMBEDDED CODING WORKSPACE (QUESTIONS 21 & 22) ================= */
          <div className="mz-embedded-coding-wrapper">
            {/* Subnav Header for Coding Problems */}
            <div className="mz-cert-coding-subnav">
              <div className="mz-cert-coding-subnav-left">
                <span className="mz-cert-coding-q-tag">
                  Question {currentQuestionIndex + 1} of 22
                </span>
                <span className="mz-cert-coding-title-text">
                  {currentCodingQ.title || (codingIndex === 0 ? "Find Peak Element Index" : "Longest Substring Without Repeating Characters")}
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

            {/* Embedded Mastery Zone Compiler Frame */}
            <div className="mz-embedded-compiler-frame">
              <MasteryZoneCompilerWorkspace
                key={`${attemptId}_coding_${codingIndex}_${currentCodingQ.questionId || currentCodingQ.id || codingIndex}`}
                title={`Question ${currentQuestionIndex + 1}: ${currentCodingQ.title || (codingIndex === 0 ? "Find Peak Element Index" : "Longest Substring Without Repeating Characters")}`}
                questionId={currentCodingQ.questionId || currentCodingQ.id || (codingIndex === 0 ? "ch_find_peak_element" : "ch_longest_substr_no_repeat")}
                sessionId={`${attemptId}_q${21 + codingIndex}`}
                initialProctoringStage="active"
                isProctored={true}
                isEmbedded={true}
                externalCameraStream={cameraStream}
                externalScreenStream={screenStream}
                externalMicStream={micStream}
                problemData={{
                  ...currentCodingQ,
                  id: currentCodingQ.questionId || currentCodingQ.id || (codingIndex === 0 ? "ch_find_peak_element" : "ch_longest_substr_no_repeat"),
                  title: currentCodingQ.title || (codingIndex === 0 ? "Find Peak Element Index" : "Longest Substring Without Repeating Characters"),
                  description: currentCodingQ.description || (codingIndex === 0
                    ? "A peak element is an element that is strictly greater than its neighbors. Given a 0-indexed integer array nums, find a peak element, and return its index."
                    : "Given a string s, find the length of the longest substring without duplicate characters."),
                  difficulty: currentCodingQ.difficulty || "Medium",
                  testCases: (currentCodingQ.testCases && currentCodingQ.testCases.length > 0)
                    ? currentCodingQ.testCases
                    : (currentCodingQ.publicTests || DEFAULT_CERT_CODING_QUESTIONS[codingIndex]?.testCases || []),
                }}
                starterCodeMap={currentCodingQ.starterCode || DEFAULT_CERT_CODING_QUESTIONS[codingIndex]?.starterCode || {}}
                defaultLanguage={codingSubmissions[codingIndex]?.language || "python"}
                testCases={(currentCodingQ.testCases && currentCodingQ.testCases.length > 0)
                  ? currentCodingQ.testCases
                  : (currentCodingQ.publicTests || DEFAULT_CERT_CODING_QUESTIONS[codingIndex]?.testCases || [])}
                questionsList={
                  selectedCodingQuestions && selectedCodingQuestions.length >= 2
                    ? selectedCodingQuestions
                    : DEFAULT_CERT_CODING_QUESTIONS
                }
                currentQuestionIndex={codingIndex}
                onSelectQuestion={(q, idx) => setCurrentQuestionIndex(20 + idx)}
                onSaveDraft={async (code, lang) => {
                  handleUpdateCode(code, lang);
                  toast.success(`Question ${21 + codingIndex} draft saved.`);
                }}
                initialDraft={
                  codingSubmissions[codingIndex]?.code ||
                  currentCodingQ.starterCode?.[codingSubmissions[codingIndex]?.language || "python"] ||
                  currentCodingQ.starterCode?.python ||
                  DEFAULT_CERT_CODING_QUESTIONS[codingIndex]?.starterCode?.python ||
                  "# Enter your code below\n"
                }
                onRun={async (code, lang, customInput) => {
                  return handleRunCode(code, lang, customInput);
                }}
                onRunTests={async (code, lang) => {
                  return handleRunCode(code, lang);
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

      {/* 4. FIVE-CHANCE ASSESSMENT RECOVERY OVERLAY MODAL */}
      {isRecoveryModalOpen && (
        <div className="mz-proc-violation-modal-overlay">
          <div
            className={`mz-proc-recovery-card ${isTerminated ? "terminated" : ""}`}
            style={{ position: "relative" }}
          >
            <div className="mz-proc-recovery-icon-ring">
              <LuTriangleAlert size={30} />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 800,
                color: isTerminated ? "#b91c1c" : "#92400e",
              }}
            >
              {isTerminated
                ? "Assessment Terminated: Limits Exceeded"
                : "Examination Interrupted: Tab Switch Detected"}
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#475569", lineHeight: "1.5" }}>
              {isTerminated
                ? "You have exhausted all 5 recovery chances. Your assessment workspace is locked and your answers have been permanently submitted for final grading."
                : recoveryReason ||
                  "The examination has been paused because you switched away from the active assessment tab. Navigating to other browser tabs or applications during a proctored examination is strictly prohibited. You must re-verify your environment to resume."}
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
                <span
                  style={{
                    color: recoveryChancesRemaining > 0 ? "#10b981" : "#ef4444",
                    fontWeight: 700,
                  }}
                >
                  {recoveryChancesRemaining} / 5 Remaining
                </span>
              </div>
              <div className="mz-proc-chances-pills">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className={`mz-proc-chance-pill ${
                      idx > recoveryChancesRemaining ? "consumed" : ""
                    }`}
                    title={`Chance ${idx}: ${
                      idx > recoveryChancesRemaining ? "Used" : "Available"
                    }`}
                  />
                ))}
              </div>
            </div>

            {!isTerminated ? (
              <>
                {/* Verification Checklist */}
                <div className="mz-proc-recheck-grid">
                  <div
                    className={`mz-proc-recheck-item ${
                      cameraStream?.active ||
                      (cameraStream && cameraStream.getVideoTracks().some((t) => t.readyState === "live"))
                        ? "ok"
                        : "missing"
                    }`}
                  >
                    <LuCamera size={16} />
                    <span>
                      Camera{" "}
                      {cameraStream?.active ||
                      (cameraStream && cameraStream.getVideoTracks().some((t) => t.readyState === "live"))
                        ? "Active"
                        : "Required"}
                    </span>
                  </div>
                  <div
                    className={`mz-proc-recheck-item ${
                      screenStream?.active ||
                      (screenStream && screenStream.getVideoTracks().some((t) => t.readyState === "live"))
                        ? "ok"
                        : "missing"
                    }`}
                  >
                    <LuMonitor size={16} />
                    <span>
                      Screen{" "}
                      {screenStream?.active ||
                      (screenStream && screenStream.getVideoTracks().some((t) => t.readyState === "live"))
                        ? "Active"
                        : "Required"}
                    </span>
                  </div>
                  <div
                    className={`mz-proc-recheck-item ${
                      document.fullscreenElement || document.webkitFullscreenElement
                        ? "ok"
                        : "missing"
                    }`}
                  >
                    <LuMaximize size={16} />
                    <span>
                      Fullscreen{" "}
                      {document.fullscreenElement || document.webkitFullscreenElement
                        ? "Active"
                        : "Required"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    width: "100%",
                    marginTop: "6px",
                  }}
                >
                  <button
                    type="button"
                    className="mz-proc-btn-resolve"
                    onClick={handleResumeAssessment}
                    disabled={isReverifying}
                  >
                    {isReverifying
                      ? "Verifying Telemetry..."
                      : "Re-Verify Hardware & Resume Assessment"}
                  </button>
                  <button
                    type="button"
                    className="mz-modal-btn-cancel"
                    style={{ padding: "10px 16px", borderRadius: "10px", fontWeight: 600, width: "100%", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155", cursor: "pointer" }}
                    onClick={() => {
                      try {
                        localStorage.removeItem("mz_active_cert_session");
                        if (currentUserId) localStorage.removeItem(`mz_${currentUserId}_active_cert_session`);
                      } catch {}
                      stopAllProctoringMedia();
                      if (onClose) onClose();
                      else navigate("/coding", { replace: true });
                    }}
                  >
                    Exit Assessment & Return to Challenges
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  marginTop: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#dc2626",
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    background: "rgba(220, 38, 38, 0.08)",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: "2px solid #fecaca",
                      borderTopColor: "#dc2626",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      flexShrink: 0,
                    }}
                  />
                  <span>All 5 recovery chances exhausted. Auto-submitting and grading exam...</span>
                </div>
                <button
                  type="button"
                  className="mz-proc-btn-resolve"
                  style={{ background: "#dc2626" }}
                  onClick={handleFinalSubmit}
                  disabled={isFinalizing}
                >
                  {isFinalizing ? "Submitting Assessment..." : "Finalize & Submit Immediately"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. CONFIRMATION MODAL BEFORE FINAL SUBMISSION */}
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
                <span
                  style={{
                    color:
                      Math.round(((answeredMcqCount + totalPassedCodingTests) / 40) * 100) >= 80
                        ? "#16a34a"
                        : "#ea580c",
                  }}
                >
                  {answeredMcqCount + totalPassedCodingTests} / 40 Marks (
                  {Math.round(((answeredMcqCount + totalPassedCodingTests) / 40) * 100)}%)
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

      {/* 6. POST-SUBMISSION OFFICIAL REPORT & SUCCESS MODAL */}
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
              <span>
                Score: {submissionSuccessData.score}/{submissionSuccessData.totalMarks}
              </span>
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
                  navigate(submissionSuccessData.reportUrl, { replace: true });
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
                  if (window.opener) {
                    try {
                      window.opener.postMessage({ type: "MZ_EXAM_COMPLETED", certId }, "*");
                    } catch {}
                    window.close();
                  } else {
                    navigate("/coding", { replace: true });
                  }
                }}
              >
                <LuHouse size={16} />
                <span>
                  {typeof window !== "undefined" && window.opener ? "Close Tab & Return" : "Back to Coding"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
