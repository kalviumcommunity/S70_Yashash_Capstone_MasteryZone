import React, { useState, useEffect, useRef, useMemo } from "react";
import Editor from "@monaco-editor/react";
import {
  LuPlay,
  LuSquare,
  LuRotateCcw,
  LuSparkles,
  LuFile,
  LuFilePlus,
  LuTrash2,
  LuDownload,
  LuCheck,
  LuCircleCheck,
  LuCircleX,
  LuCircle,
  LuTerminal,
  LuChevronDown,
  LuChevronRight,
  LuChevronLeft,
  LuChevronUp,
  LuFolder,
  LuLock,
  LuLockOpen,
  LuEye,
  LuMaximize2,
  LuMinimize2,
  LuMessageSquare,
  LuClock,
  LuSettings,
  LuPlus,
  LuCode,
  LuFlag,
  LuSave,
  LuSend,
  LuShieldCheck,
  LuFileCode,
  LuLightbulb,
  LuCamera,
  LuMic,
  LuMicOff,
  LuMonitor,
  LuMaximize,
  LuBattery,
  LuBatteryCharging,
  LuBatteryWarning,
  LuLayoutGrid,
  LuTrophy,
  LuAward,
} from "react-icons/lu";
import {
  SiJavascript,
  SiPython,
  SiOpenjdk,
  SiCplusplus,
  SiC,
  SiHtml5,
  SiCss3,
  SiJson,
  SiMarkdown,
} from "react-icons/si";
import { toast } from "react-toastify";
import "../MasteryZoneCompiler.css";

export function TechIcon({ lang, size = 15, className = "" }) {
  const l = (lang || "").toLowerCase();
  if (l.includes("python") || l === "py") return <SiPython size={size} color="#3776ab" className={className} />;
  if (l.includes("javascript") || l.includes("node") || l === "js") return <SiJavascript size={size} color="#eab308" className={className} />;
  if (l.includes("java") && !l.includes("javascript")) return <SiOpenjdk size={size} color="#e76f00" className={className} />;
  if (l.includes("cpp") || l.includes("c++")) return <SiCplusplus size={size} color="#00599c" className={className} />;
  if (l === "c") return <SiC size={size} color="#659ad2" className={className} />;
  if (l.includes("html")) return <SiHtml5 size={size} color="#e34f26" className={className} />;
  if (l.includes("css")) return <SiCss3 size={size} color="#1572b6" className={className} />;
  if (l.includes("json")) return <SiJson size={size} color="#555555" className={className} />;
  if (l.includes("markdown") || l === "md") return <SiMarkdown size={size} color="#083fa1" className={className} />;
  return <LuCode size={size} className={className} />;
}

const LANGUAGE_MAP = {
  python: { monaco: "python", name: "Python 3", ext: ".py" },
  javascript: { monaco: "javascript", name: "JavaScript", ext: ".js" },
  java: { monaco: "java", name: "Java 21", ext: ".java" },
  cpp: { monaco: "cpp", name: "C++ 17", ext: ".cpp" },
  c: { monaco: "c", name: "C (GCC)", ext: ".c" },
  html: { monaco: "html", name: "HTML / Web", ext: ".html" },
  css: { monaco: "css", name: "CSS", ext: ".css" },
  json: { monaco: "json", name: "JSON", ext: ".json" },
  markdown: { monaco: "markdown", name: "Markdown", ext: ".md" },
};

function getLanguageFromFilename(filename = "") {
  const f = filename.toLowerCase();
  if (f.endsWith(".py")) return "python";
  if (f.endsWith(".js") || f.endsWith(".jsx")) return "javascript";
  if (f.endsWith(".java")) return "java";
  if (f.endsWith(".cpp") || f.endsWith(".cc") || f.endsWith(".h")) return "cpp";
  if (f.endsWith(".c")) return "c";
  if (f.endsWith(".html") || f.endsWith(".htm")) return "html";
  if (f.endsWith(".css")) return "css";
  if (f.endsWith(".json")) return "json";
  if (f.endsWith(".md")) return "markdown";
  return "python";
}

const PEER_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#f97316", // orange
];

const DEFAULT_TWO_SUM_TESTS = [
  { index: 1, id: "tc_1", input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]", actualOutput: "", passed: null, isHidden: false },
  { index: 2, id: "tc_2", input: "[3, 2, 4]\n6", expectedOutput: "[1, 2]", actualOutput: "", passed: null, isHidden: false },
  { index: 3, id: "tc_3", input: "[3, 3]\n6", expectedOutput: "[0, 1]", actualOutput: "", passed: null, isHidden: false },
  { index: 4, id: "tc_4", input: "[1, 5, 7, 12, 19]\n20", expectedOutput: "[0, 4]", actualOutput: "", passed: null, isHidden: true },
  { index: 5, id: "tc_5", input: "[-3, 4, 3, 90]\n0", expectedOutput: "[0, 2]", actualOutput: "", passed: null, isHidden: true },
  { index: 6, id: "tc_6", input: "[0, 4, 3, 0]\n0", expectedOutput: "[0, 3]", actualOutput: "", passed: null, isHidden: true },
  { index: 7, id: "tc_7", input: "[-1, -2, -3, -4, -5]\n-8", expectedOutput: "[2, 4]", actualOutput: "", passed: null, isHidden: true },
  { index: 8, id: "tc_8", input: "[1000000000, 3, 5, 1000000000]\n2000000000", expectedOutput: "[0, 3]", actualOutput: "", passed: null, isHidden: true },
  { index: 9, id: "tc_9", input: "[2, 5, 5, 11]\n10", expectedOutput: "[1, 2]", actualOutput: "", passed: null, isHidden: true },
  { index: 10, id: "tc_10", input: "[1, 2, 3, 4, 6]\n10", expectedOutput: "[3, 4]", actualOutput: "", passed: null, isHidden: true },
];

const TWO_SUM_STEPS = [
  { num: 1, title: "Step 1: Parse input array and target value from standard input." },
  { num: 2, title: "Step 2: Maintain a hash map to record visited elements and their indices." },
  { num: 3, title: "Step 3: Iterate through each element num and calculate complement = target - num." },
  { num: 4, title: "Step 4: If complement exists in map, return [map[complement], i]." },
  { num: 5, title: "Step 5: Output the zero-indexed pair as a JSON array." },
];

export default function MasteryZoneCompilerLive({
  meetingId,
  socket,
  currentUser,
  isHost,
  codingPermission = "collaborative", // "collaborative" | "host-only" | "read-only"
  workspaceFiles = [],
  activeFileId = "file_0",
  testCases = [],
  codeReviews = [],
  localStream,
  screenStream,
  remoteStreams = {},
  isMuted = false,
  isVideoOff = false,
  isScreenSharing = false,
  elapsedSeconds = 0,
  onUpdatePermission,
  onRunStatusChange,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
}) {
  // Mode: "challenge" (Collaborative Challenge / Assessment) | "ide" (Full Cloud IDE)
  const [workspaceMode, setWorkspaceMode] = useState("challenge");

  // Files & Editor State
  const [files, setFiles] = useState(
    Array.isArray(workspaceFiles) && workspaceFiles.length > 0
      ? workspaceFiles
      : [
          {
            id: "file_0",
            name: "solution.py",
            language: "python",
            content: "# Enter your code below\n",
            lastModifiedBy: "Host",
          },
        ]
  );
  const [currentFileId, setCurrentFileId] = useState(activeFileId || "file_0");
  const [editorFontSize, setEditorFontSize] = useState(13);

  // Execution & Drawer State
  const [activeTab, setActiveTab] = useState("run_tests"); // "run" | "run_tests" | "hint" | "stdin" | "output"
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stdinInput, setStdinInput] = useState("");
  const [executionOutput, setExecutionOutput] = useState("");
  const [executionError, setExecutionError] = useState("");
  const [executionMeta, setExecutionMeta] = useState(null); // { duration, exitCode, executedBy }

  // Challenge & Test Cases State
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [currentTestCases, setCurrentTestCases] = useState(() => {
    if (Array.isArray(testCases) && testCases.length > 0) {
      return testCases.map((tc, idx) => ({ ...tc, index: idx + 1 }));
    }
    return DEFAULT_TWO_SUM_TESTS;
  });
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [hasEvaluated, setHasEvaluated] = useState(false);

  // Left Proctoring & Collaboration Panel State
  const [isProctoringCollapsed, setIsProctoringCollapsed] = useState(false);
  const [proctoringViewMode, setProctoringViewMode] = useState("dual"); // "webcam" | "screen" | "dual"
  const [micVolume, setMicVolume] = useState(65);
  const [batteryInfo, setBatteryInfo] = useState({ percentage: 89, charging: false });
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);

  // Multi-User Live Collaboration State
  const [remoteCursors, setRemoteCursors] = useState({}); // socketId => { lineNumber, column, user, color }
  const [typingPeer, setTypingPeer] = useState(null);
  const [reviewThreads, setReviewThreads] = useState(codeReviews);
  const [selectedReviewLine, setSelectedReviewLine] = useState(null);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState("");

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const procCameraRef = useRef(null);
  const procScreenRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Sync props from server
  useEffect(() => {
    if (Array.isArray(workspaceFiles) && workspaceFiles.length > 0) {
      setFiles(workspaceFiles);
    }
  }, [workspaceFiles]);

  useEffect(() => {
    if (activeFileId) setCurrentFileId(activeFileId);
  }, [activeFileId]);

  useEffect(() => {
    if (Array.isArray(testCases) && testCases.length > 0) {
      setCurrentTestCases(testCases.map((tc, idx) => ({ ...tc, index: idx + 1 })));
    }
  }, [testCases]);

  useEffect(() => {
    if (Array.isArray(codeReviews)) setReviewThreads(codeReviews);
  }, [codeReviews]);

  // Battery detection API with fallback
  useEffect(() => {
    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        setBatteryInfo({
          percentage: Math.round(battery.level * 100),
          charging: battery.charging,
        });
        battery.onlevelchange = () => {
          setBatteryInfo((prev) => ({
            ...prev,
            percentage: Math.round(battery.level * 100),
          }));
        };
        battery.onchargingchange = () => {
          setBatteryInfo((prev) => ({
            ...prev,
            charging: battery.charging,
          }));
        };
      }).catch(() => {});
    }
  }, []);

  // Fullscreen tracking
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenActive(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Web Audio microphone volume tracking
  useEffect(() => {
    if (!localStream || isMuted) {
      setMicVolume(isMuted ? 0 : 25);
      return;
    }

    let animationFrameId;
    try {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack && window.AudioContext) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(localStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          // Scale to 0-100 range with realistic visual baseline
          const vol = Math.min(100, Math.round(avg * 1.5) + (avg > 2 ? 15 : 0));
          setMicVolume(vol);
          animationFrameId = requestAnimationFrame(tick);
        };
        tick();
      }
    } catch {
      // Fallback ambient oscillation
      const interval = setInterval(() => {
        setMicVolume(Math.floor(45 + Math.random() * 30));
      }, 300);
      return () => clearInterval(interval);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [localStream, isMuted]);

  // Video element stream attachments
  useEffect(() => {
    if (procCameraRef.current) {
      const targetStream = localStream || Object.values(remoteStreams)[0];
      if (targetStream && procCameraRef.current.srcObject !== targetStream) {
        procCameraRef.current.srcObject = targetStream;
        procCameraRef.current.play().catch(() => {});
      }
    }
  }, [localStream, remoteStreams, proctoringViewMode]);

  useEffect(() => {
    if (procScreenRef.current && screenStream) {
      if (procScreenRef.current.srcObject !== screenStream) {
        procScreenRef.current.srcObject = screenStream;
        procScreenRef.current.play().catch(() => {});
      }
    }
  }, [screenStream, proctoringViewMode]);

  const activeFile =
    files.find((f) => f.id === currentFileId) ||
    files[0] || {
      id: "file_0",
      name: "solution.py",
      language: "python",
      content: "# Enter your code below\n",
    };

  const currentUserId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u._id || u.id || u.userId || "guest";
    } catch {
      return "guest";
    }
  })();
  const meetSubmitKey = `mz_${currentUserId}_meeting_${meetingId}_test_submitted`;

  const [isTestSubmitted, setIsTestSubmitted] = useState(() => {
    try {
      const item = localStorage.getItem(meetSubmitKey);
      return Boolean(item && JSON.parse(item).submitted);
    } catch {
      return false;
    }
  });

  const isReadOnlyForUser =
    isTestSubmitted ||
    codingPermission === "read-only" ||
    (codingPermission === "host-only" && !isHost);

  const passedCount = useMemo(
    () => currentTestCases.filter((tc) => tc.passed === true || tc.passed === "true" || tc.status === "PASSED" || tc.passed === 1).length,
    [currentTestCases]
  );
  const isAllPassed = currentTestCases.length > 0 && passedCount === currentTestCases.length;
  const selectedCase = currentTestCases[selectedCaseIndex] || currentTestCases[0];

  // -------------------------------------------------------------
  // 1. Socket Event Listeners for Collaborative Sync
  // -------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    socket.on("meeting_file_selected", ({ fileId }) => {
      if (fileId) setCurrentFileId(fileId);
    });

    socket.on("meeting_file_updated", ({ fileId, name, content, language, fromSocketId }) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                name: name !== undefined ? name : f.name,
                content: content !== undefined ? content : f.content,
                language: language !== undefined ? language : f.language,
              }
            : f
        )
      );

      if (editorRef.current && currentFileId === fileId && fromSocketId !== socket.id) {
        const currentModel = editorRef.current.getModel();
        if (currentModel && content !== undefined && currentModel.getValue() !== content) {
          const position = editorRef.current.getPosition();
          editorRef.current.setValue(content);
          if (position) editorRef.current.setPosition(position);
        }
      }
    });

    socket.on("meeting_file_created", ({ file }) => {
      if (file) {
        setFiles((prev) => (prev.some((f) => f.id === file.id) ? prev : [...prev, file]));
      }
    });

    socket.on("meeting_file_deleted", ({ fileId }) => {
      setFiles((prev) => {
        const next = prev.filter((f) => f.id !== fileId);
        if (currentFileId === fileId && next.length > 0) {
          setCurrentFileId(next[0].id);
        }
        return next;
      });
    });

    socket.on("meeting_peer_cursor", ({ socketId, fileId, cursor, user }) => {
      if (fileId !== currentFileId) return;
      const colorIndex =
        Math.abs(
          (socketId || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
        ) % PEER_COLORS.length;

      setRemoteCursors((prev) => ({
        ...prev,
        [socketId]: {
          ...cursor,
          user: user || { fullName: "Peer" },
          color: PEER_COLORS[colorIndex],
        },
      }));
    });

    socket.on("meeting_typing_status", ({ user, isTyping, fileId }) => {
      if (isTyping && fileId === currentFileId) {
        setTypingPeer({
          user: user?.fullName || "A peer",
        });
      } else {
        setTypingPeer(null);
      }
    });

    socket.on("meeting_code_executed", ({ language, result, executedBy }) => {
      setIsRunning(false);
      setExecutionOutput(result?.output || "");
      setExecutionError(result?.error || "");
      setExecutionMeta({
        duration: result?.durationMs,
        exitCode: result?.ok ? 0 : 1,
        executedBy,
      });
      setActiveTab("run");
      setIsDrawerOpen(true);
      toast.info(`Code executed by ${executedBy}`);
    });

    socket.on("meeting_tests_executed", ({ passedCount, totalCount, results, executedBy }) => {
      setIsRunningTests(false);
      setHasEvaluated(true);
      if (Array.isArray(results)) {
        setCurrentTestCases(results.map((r, i) => ({ ...r, index: i + 1 })));
      }
      setActiveTab("run_tests");
      setIsDrawerOpen(true);
      toast.info(`Tests run by ${executedBy}: ${passedCount}/${totalCount} passed`);
    });

    socket.on("meeting_solution_submitted", ({ result, user }) => {
      setIsSubmitting(false);
      setAttemptsCount((prev) => prev + 1);
      if (result?.isPassing) {
        toast.success(`🎉 ${user?.fullName || "Team"} passed the solution with ${result.scorePercentage}%!`);
      } else {
        toast.warn(`${user?.fullName || "Team"} submitted solution (${result.passedCount}/${result.totalCount} tests passed)`);
      }
    });

    socket.on("meeting_challenge_mode_toggled", ({ mode, user }) => {
      if (mode) {
        setWorkspaceMode(mode);
        toast.info(`${user?.fullName || "Host"} switched workspace to ${mode === "challenge" ? "Collaborative Challenge" : "Cloud IDE"}`);
      }
    });

    return () => {
      socket.off("meeting_file_selected");
      socket.off("meeting_file_updated");
      socket.off("meeting_file_created");
      socket.off("meeting_file_deleted");
      socket.off("meeting_peer_cursor");
      socket.off("meeting_typing_status");
      socket.off("meeting_code_executed");
      socket.off("meeting_tests_executed");
      socket.off("meeting_solution_submitted");
      socket.off("meeting_challenge_mode_toggled");
    };
  }, [socket, currentFileId]);

  // Monaco Remote Cursor Decorations
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    const newDecorations = Object.entries(remoteCursors).map(([sId, c]) => ({
      range: new monaco.Range(c.lineNumber, c.column, c.lineNumber, c.column + 1),
      options: {
        className: `mz-remote-cursor-line mz-cursor-${sId}`,
        beforeContentClassName: `mz-remote-cursor-flag`,
        hoverMessage: { value: `**${c.user?.fullName || "Peer"}** is editing here` },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [remoteCursors]);

  // Monaco Mounting & Keystroke Handlers
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      if (socket) {
        socket.emit("meeting_cursor_move", {
          meetingId,
          fileId: currentFileId,
          cursor: {
            lineNumber: e.position.lineNumber,
            column: e.position.column,
          },
          user: currentUser,
        });
      }
    });
  };

  const handleCodeChange = (newContent) => {
    if (isReadOnlyForUser) return;
    const updatedContent = newContent || "";

    setFiles((prev) =>
      prev.map((f) => (f.id === currentFileId ? { ...f, content: updatedContent } : f))
    );

    if (socket) {
      socket.emit("meeting_file_update", {
        meetingId,
        fileId: currentFileId,
        name: activeFile.name,
        content: updatedContent,
        language: activeFile.language,
        user: currentUser,
      });

      socket.emit("meeting_typing_status", {
        meetingId,
        fileId: currentFileId,
        user: currentUser,
        isTyping: true,
      });

      clearTimeout(window._typingTimer);
      window._typingTimer = setTimeout(() => {
        socket.emit("meeting_typing_status", {
          meetingId,
          fileId: currentFileId,
          user: currentUser,
          isTyping: false,
        });
      }, 1200);
    }
  };

  const handleLanguageChange = (newLang) => {
    if (isReadOnlyForUser) return;
    const info = LANGUAGE_MAP[newLang];
    let newName = activeFile.name;

    if (info?.ext && newName.includes(".")) {
      const base = newName.substring(0, newName.lastIndexOf("."));
      newName = `${base}${info.ext}`;
    }

    setFiles((prev) =>
      prev.map((f) =>
        f.id === currentFileId ? { ...f, language: newLang, name: newName } : f
      )
    );

    if (socket) {
      socket.emit("meeting_file_update", {
        meetingId,
        fileId: currentFileId,
        name: newName,
        content: activeFile.content,
        language: newLang,
        user: currentUser,
      });
    }
  };

  const handleResetCode = () => {
    if (isReadOnlyForUser) return;
    const placeholder =
      activeFile.language === "python"
        ? "# Enter your code below\n"
        : "// Enter your code below\n";
    handleCodeChange(placeholder);
    toast.info("Code reset to starter template");
  };

  // Run Code (Single execution with STDIN)
  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setExecutionOutput("⚡ Compiling & executing code in sandbox runtime...");
    setExecutionError("");
    setActiveTab("run");
    setIsDrawerOpen(true);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/meetings/${meetingId}/run-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          stdin: stdinInput,
          files,
        }),
      });

      const data = await res.json();
      const output = data.output || (data.result?.output) || "";
      const error = data.error || (data.result?.error) || "";

      setExecutionOutput(output || (!error ? "Program executed with no stdout output." : ""));
      setExecutionError(error);
      setExecutionMeta({
        duration: data.duration || data.result?.durationMs || 0,
        exitCode: data.exitCode !== undefined ? data.exitCode : (data.result?.ok ? 0 : 1),
        executedBy: currentUser?.fullName || "You",
      });

      if (socket) {
        socket.emit("meeting_code_run_status", {
          meetingId,
          status: "completed",
          user: currentUser,
          result: {
            output: output || (!error ? "Program executed with no stdout output." : ""),
            error,
            durationMs: data.duration || 0,
            ok: !error,
          },
        });
      }
    } catch (err) {
      setExecutionError(`Execution Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Run Test Cases against Sandbox
  const handleRunTests = async () => {
    if (isRunningTests) return;
    setIsRunningTests(true);
    setActiveTab("run_tests");
    setIsDrawerOpen(true);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/meetings/${meetingId}/run-tests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          testCases: currentTestCases,
        }),
      });

      const data = await res.json();
      const resList = data.results || data.testResults || [];
      if (resList.length > 0) {
        setHasEvaluated(true);
        setCurrentTestCases(
          resList.map((r, i) => ({
            ...r,
            index: i + 1,
            passed: Boolean(r.passed === true || r.passed === "true" || r.status === "PASSED" || r.passed === 1),
          }))
        );
        toast.success(`Completed Tests: ${data.passedCount ?? resList.filter(r => r.passed).length}/${data.totalCount || resList.length} passed`);
      }
    } catch (err) {
      toast.error(`Failed to run test cases: ${err.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Submit and Grade Solution (80% threshold required to pass)
  const handleSubmitSolution = async () => {
    if (isSubmitting || isTestSubmitted) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/meetings/${meetingId}/submit-solution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          challengeTitle: "Two Sum",
          testCases: currentTestCases,
          passingPercentage: 80,
        }),
      });

      const data = await res.json();
      setAttemptsCount((prev) => prev + 1);
      setHasEvaluated(true);

      const resList = data.testResults || data.results || [];
      if (resList.length > 0) {
        setCurrentTestCases(
          resList.map((r, i) => ({
            ...r,
            index: i + 1,
            passed: Boolean(r.passed === true || r.passed === "true" || r.status === "PASSED" || r.passed === 1),
          }))
        );
      }

      if (data.isPassing || (resList.length > 0 && resList.every(r => r.passed))) {
        toast.success(`🎉 Solution Accepted! Score: ${data.scorePercentage || 100}% (${data.passedCount || resList.length}/${data.totalCount || resList.length} tests passed)`);
        // Permanently record submission for this user and seal meeting test
        localStorage.setItem(meetSubmitKey, JSON.stringify({
          submitted: true,
          scorePercentage: data.scorePercentage || 100,
          passedCount: data.passedCount || resList.length,
          totalCount: data.totalCount || resList.length,
          isPassing: true,
          submittedAt: new Date().toISOString(),
        }));
        setIsTestSubmitted(true);
      } else {
        toast.warn(`Solution did not meet the 80% passing threshold (${data.scorePercentage}% scored). Revise and try again!`);
      }
    } catch (err) {
      toast.error(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Export workspace bundle
  const handleExportProject = () => {
    const projectBundle = {
      meetingId,
      exportedAt: new Date().toISOString(),
      files,
      testCases: currentTestCases,
    };
    const blob = new Blob([JSON.stringify(projectBundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `masteryzone_live_${meetingId}_workspace.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Workspace project exported successfully!");
  };

  const editorLang =
    LANGUAGE_MAP[activeFile.language]?.monaco ||
    getLanguageFromFilename(activeFile.name);

  // Time remaining calculator (59m 15s standard baseline)
  const totalSeconds = 3600;
  const remainingSecs = Math.max(0, totalSeconds - elapsedSeconds);
  const remainingMins = Math.floor(remainingSecs / 60);
  const remainingRemSecs = remainingSecs % 60;
  const timerDisplay = `${remainingMins}m ${String(remainingRemSecs).padStart(2, "0")}s remaining`;

  return (
    <div className="mz-live-compiler-root" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* =========================================================================
          WORKSPACE SUPER HEADER (Challenge title, badges, mode switcher, timer)
          ========================================================================= */}
      <div
        className="mz-challenge-super-header"
        style={{
          height: 48,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          gap: 12,
          flexShrink: 0,
        }}
      >
        {/* Left: Challenge Title & Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#2563eb", display: "flex", alignItems: "center" }}>
              <LuCode size={18} />
            </span>
            <strong style={{ fontSize: 14, color: "#0f172a", fontWeight: 700 }}>Two Sum</strong>
            <button
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2 }}
              title="Flag problem for discussion"
            >
              <LuFlag size={14} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                background: "#f0fdf4",
                color: "#16a34a",
                border: "1px solid #bbf7d0",
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 10.5,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              PROCTORING ACTIVE
            </span>

            <span
              style={{
                background: "#ecfeff",
                color: "#0891b2",
                border: "1px solid #a5f3fc",
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 10.5,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#06b6d4" }} />
              Synced
            </span>

            <span
              style={{
                background: "#f5f3ff",
                color: "#7c3aed",
                border: "1px solid #ddd6fe",
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 10.5,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <LuLock size={11} />
              Assigned Assessment Task
            </span>
          </div>
        </div>

        {/* Center: Workspace Mode Switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f1f5f9",
            borderRadius: 8,
            padding: 2,
            gap: 2,
          }}
        >
          <button
            type="button"
            style={{
              border: "none",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: workspaceMode === "challenge" ? 700 : 500,
              background: workspaceMode === "challenge" ? "#ffffff" : "transparent",
              color: workspaceMode === "challenge" ? "#2563eb" : "#64748b",
              boxShadow: workspaceMode === "challenge" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
            onClick={() => {
              setWorkspaceMode("challenge");
              if (socket) socket.emit("meeting_challenge_mode_toggle", { meetingId, mode: "challenge", user: currentUser });
            }}
          >
            <LuTrophy size={13} />
            Collaborative Challenge
          </button>
          <button
            type="button"
            style={{
              border: "none",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: workspaceMode === "ide" ? 700 : 500,
              background: workspaceMode === "ide" ? "#ffffff" : "transparent",
              color: workspaceMode === "ide" ? "#2563eb" : "#64748b",
              boxShadow: workspaceMode === "ide" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
            onClick={() => {
              setWorkspaceMode("ide");
              if (socket) socket.emit("meeting_challenge_mode_toggle", { meetingId, mode: "ide", user: currentUser });
            }}
          >
            <LuCode size={13} />
            Cloud IDE
          </button>
        </div>

        {/* Right: Metrics & Timer */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <LuClock size={13} />
            Attempts: {attemptsCount}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              padding: "4px 10px",
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 700,
              color: "#1d4ed8",
            }}
          >
            <LuClock size={13} />
            {timerDisplay}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN COLLABORATIVE WORKSPACE AREA (Left Proctoring Sidebar + Central Editor)
          ========================================================================= */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
        {/* DEDICATED LEFT PROCTORING & COLLABORATION FEED SIDEBAR (Matches Reference Image) */}
        {workspaceMode === "challenge" && (
          <aside
            className={`mz-proctoring-panel ${isProctoringCollapsed ? "collapsed" : ""}`}
            style={{
              width: isProctoringCollapsed ? 44 : 260,
              background: "#ffffff",
              borderRight: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              padding: isProctoringCollapsed ? "10px 4px" : "12px",
              gap: 10,
              overflowY: "auto",
              transition: "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              flexShrink: 0,
            }}
          >
            {/* Header */}
            <div className="mz-proc-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {!isProctoringCollapsed ? (
                <>
                  <div className="mz-proc-header-title-wrap" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <LuShieldCheck size={16} color="#2563eb" />
                    <span className="mz-proc-title" style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
                      Live Proctoring
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mz-proc-toggle-btn"
                    onClick={() => setIsProctoringCollapsed(true)}
                    title="Collapse Live Feed"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                  >
                    <LuChevronLeft size={16} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="mz-proc-toggle-btn"
                  onClick={() => setIsProctoringCollapsed(false)}
                  title="Expand Live Feed"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", width: "100%", display: "flex", justifyContent: "center" }}
                >
                  <LuChevronRight size={16} />
                </button>
              )}
            </div>

            {isProctoringCollapsed ? (
              /* Mini Collapsed Bar */
              <div className="mz-proc-collapsed-bar" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <LuCamera size={16} color="#2563eb" title="Camera feed active" onClick={() => setIsProctoringCollapsed(false)} />
                <LuMonitor size={16} color="#2563eb" title="Screen feed active" onClick={() => setIsProctoringCollapsed(false)} />
                <LuMic size={16} color={isMuted ? "#ef4444" : "#10b981"} title="Microphone active" onClick={() => setIsProctoringCollapsed(false)} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#2563eb" }}>{batteryInfo.percentage}%</span>
              </div>
            ) : (
              /* Expanded Proctoring Body */
              <>
                {/* View Mode Tabs: Camera | Screen | Dual */}
                <div className="mz-proc-view-tabs" style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 2, gap: 2 }}>
                  <button
                    type="button"
                    className={`mz-proc-view-tab ${proctoringViewMode === "webcam" ? "active" : ""}`}
                    onClick={() => setProctoringViewMode("webcam")}
                    style={{ flex: 1, padding: "4px 6px", fontSize: 11, border: "none", borderRadius: 6, cursor: "pointer", background: proctoringViewMode === "webcam" ? "#ffffff" : "transparent", color: proctoringViewMode === "webcam" ? "#2563eb" : "#64748b", fontWeight: proctoringViewMode === "webcam" ? 700 : 500 }}
                  >
                    <LuCamera size={11} /> Camera
                  </button>
                  <button
                    type="button"
                    className={`mz-proc-view-tab ${proctoringViewMode === "screen" ? "active" : ""}`}
                    onClick={() => setProctoringViewMode("screen")}
                    style={{ flex: 1, padding: "4px 6px", fontSize: 11, border: "none", borderRadius: 6, cursor: "pointer", background: proctoringViewMode === "screen" ? "#ffffff" : "transparent", color: proctoringViewMode === "screen" ? "#2563eb" : "#64748b", fontWeight: proctoringViewMode === "screen" ? 700 : 500 }}
                  >
                    <LuMonitor size={11} /> Screen
                  </button>
                  <button
                    type="button"
                    className={`mz-proc-view-tab ${proctoringViewMode === "dual" ? "active" : ""}`}
                    onClick={() => setProctoringViewMode("dual")}
                    style={{ flex: 1, padding: "4px 6px", fontSize: 11, border: "none", borderRadius: 6, cursor: "pointer", background: proctoringViewMode === "dual" ? "#ffffff" : "transparent", color: proctoringViewMode === "dual" ? "#2563eb" : "#64748b", fontWeight: proctoringViewMode === "dual" ? 700 : 500 }}
                  >
                    <LuLayoutGrid size={11} /> Dual
                  </button>
                </div>

                {/* Previews Viewport */}
                <div className="mz-proc-previews-container dual" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Webcam Box */}
                  <div
                    className="mz-proc-video-box"
                    style={{
                      height: proctoringViewMode === "dual" ? 95 : 130,
                      background: "#0f172a",
                      borderRadius: 8,
                      overflow: "hidden",
                      position: "relative",
                      display: proctoringViewMode === "screen" ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <video
                      ref={procCameraRef}
                      autoPlay
                      playsInline
                      muted
                      className="mz-proc-video-elem mirror"
                      style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                    />
                    <div
                      className="mz-proc-live-pill"
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(15, 23, 42, 0.75)",
                        color: "#4ade80",
                        fontSize: 9.5,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                      LIVE CAM
                    </div>
                    <span
                      className="mz-proc-video-label"
                      style={{
                        position: "absolute",
                        bottom: 4,
                        right: 6,
                        padding: "1px 5px",
                        borderRadius: 3,
                        background: "rgba(15, 23, 42, 0.6)",
                        color: "#e2e8f0",
                        fontSize: 9,
                        fontWeight: 600,
                      }}
                    >
                      Webcam
                    </span>
                  </div>

                  {/* Screen Share Box */}
                  <div
                    className="mz-proc-video-box screen-box"
                    style={{
                      height: proctoringViewMode === "dual" ? 85 : 130,
                      background: "#0f172a",
                      borderRadius: 8,
                      overflow: "hidden",
                      position: "relative",
                      display: proctoringViewMode === "webcam" ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <video
                      ref={procScreenRef}
                      autoPlay
                      playsInline
                      muted
                      className="mz-proc-video-elem contain"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                    <div
                      className="mz-proc-live-pill"
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(15, 23, 42, 0.75)",
                        color: "#38bdf8",
                        fontSize: 9.5,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#38bdf8" }} />
                      SCREEN
                    </div>
                    <span
                      className="mz-proc-video-label"
                      style={{
                        position: "absolute",
                        bottom: 4,
                        right: 6,
                        padding: "1px 5px",
                        borderRadius: 3,
                        background: "rgba(15, 23, 42, 0.6)",
                        color: "#e2e8f0",
                        fontSize: 9,
                        fontWeight: 600,
                      }}
                    >
                      Entire Screen
                    </span>
                  </div>
                </div>

                {/* Microphone Level Card with Dynamic Gradient Wave */}
                <div
                  className="mz-proc-audio-card"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "#334155" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <LuMic size={13} color={isMuted ? "#ef4444" : "#2563eb"} />
                      <span>Microphone Signal</span>
                    </div>
                    <span style={{ fontSize: 10, color: isMuted ? "#ef4444" : micVolume > 10 ? "#166534" : "#64748b", fontWeight: 700 }}>
                      {isMuted ? "Muted" : micVolume > 10 ? "Audio Signal Detected" : "Quiet"}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${isMuted ? 0 : Math.min(100, Math.max(5, micVolume))}%`,
                        background: "linear-gradient(90deg, #10b981 0%, #22c55e 65%, #f59e0b 90%, #ef4444 100%)",
                        borderRadius: 3,
                        transition: "width 0.08s ease-out",
                      }}
                    />
                  </div>
                </div>

                {/* Device Battery & Status Cluster */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <LuBattery size={14} />
                      <span>Device Battery</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>{batteryInfo.percentage}%</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#475569",
                      cursor: "pointer",
                    }}
                    onClick={handleToggleFullscreen}
                    title="Toggle Fullscreen"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <LuMaximize size={13} color={isFullscreenActive ? "#2563eb" : "#10b981"} />
                      <span>Fullscreen Enforcement</span>
                    </div>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#475569",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <LuShieldCheck size={13} color="#10b981" />
                      <span>Assessment Security</span>
                    </div>
                    <span style={{ fontSize: 10, color: "#166534", fontWeight: 700 }}>STRICT</span>
                  </div>
                </div>

                {/* Recovery Chances 5 / 5 Left */}
                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, fontWeight: 600 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#334155" }}>
                      <LuShieldCheck size={13} color="#10b981" />
                      Recovery Chances
                    </span>
                    <span style={{ color: "#10b981", fontWeight: 700 }}>5 / 5 Left</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          height: 5,
                          background: "#10b981",
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </aside>
        )}

        {/* CENTRAL MAIN WORKSPACE (Code Editor + Drawer) */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden", background: "#f8fafc" }}>
          {/* A. STEP INSTRUCTIONS ACCORDION (Shown in Collaborative Challenge Mode) */}
          {workspaceMode === "challenge" && (
            <div
              style={{
                background: "#ffffff",
                borderBottom: "1px solid #e2e8f0",
                padding: "8px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 5,
                maxHeight: 110,
                overflowY: "auto",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    background: "#eff6ff",
                    color: "#2563eb",
                    borderRadius: 12,
                    padding: "2px 8px",
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  Step 4
                </span>
                <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>
                  If complement exists in map, return [map[complement], i].
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    background: "#eff6ff",
                    color: "#2563eb",
                    borderRadius: 12,
                    padding: "2px 8px",
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  Step 5
                </span>
                <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>
                  Output the zero-indexed pair as a JSON array.
                </span>
              </div>
            </div>
          )}

          {/* B. EDITOR TOOLBAR (Language selector, Font: 12 13 14 16, Reset, Permissions) */}
          <div
            style={{
              height: 44,
              background: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px",
              gap: 10,
              flexShrink: 0,
            }}
          >
            {/* Left: Language Dropdown + File Pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {workspaceMode === "ide" && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setCurrentFileId(file.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: file.id === currentFileId ? "#eff6ff" : "#f1f5f9",
                        color: file.id === currentFileId ? "#2563eb" : "#475569",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <TechIcon lang={file.language} size={13} />
                      <span>{file.name}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowNewFileModal(true)}
                    style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#64748b" }}
                    title="Add File"
                  >
                    <LuPlus size={13} />
                  </button>
                </div>
              )}

              {/* Official Language Selector with Simple Icons */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TechIcon lang={activeFile.language || "python"} size={16} />
                <select
                  value={activeFile.language || "python"}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={isReadOnlyForUser}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0f172a",
                    background: "#ffffff",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java 21</option>
                  <option value="cpp">C++ 17</option>
                  <option value="c">C (GCC)</option>
                  <option value="html">HTML5</option>
                  <option value="css">CSS3</option>
                </select>
              </div>

              {/* Font Size Selector: 12 | 13 | 14 | 16 */}
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: 6 }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Font:</span>
                {[12, 13, 14, 16].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setEditorFontSize(size)}
                    style={{
                      border: "none",
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: editorFontSize === size ? 700 : 500,
                      background: editorFontSize === size ? "#2563eb" : "#f1f5f9",
                      color: editorFontSize === size ? "#ffffff" : "#475569",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Reset Button & Permissions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isHost ? (
                <select
                  value={codingPermission}
                  onChange={(e) => onUpdatePermission?.(e.target.value)}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#0f172a",
                    background: "#ffffff",
                    cursor: "pointer",
                  }}
                  title="Collaborative Permissions"
                >
                  <option value="collaborative">🔓 Collaborative Mode</option>
                  <option value="host-only">🔒 Host-Only Mode</option>
                  <option value="read-only">👁️ Read-Only Mode</option>
                </select>
              ) : (
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                  <LuLockOpen size={12} /> Collaborative
                </span>
              )}

              <button
                type="button"
                onClick={handleResetCode}
                disabled={isReadOnlyForUser}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
                title="Reset to starter template"
              >
                <LuRotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Typing Banner */}
          {typingPeer && (
            <div
              style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                fontSize: 11,
                padding: "3px 14px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
              {typingPeer.user} is typing in {activeFile.name}...
            </div>
          )}

          {/* C. MONACO CODE EDITOR */}
          <div style={{ flex: 1, minHeight: 180, position: "relative" }}>
            <Editor
              height="100%"
              language={editorLang}
              theme="vs"
              value={activeFile.content}
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
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
                readOnly: isReadOnlyForUser,
                cursorBlinking: "smooth",
                renderLineHighlight: "all",
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          {/* D. EXECUTION & TEST CASES DRAWER (Run | Run Tests | Hint | Dismiss) */}
          <div
            style={{
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            {/* Drawer Tabs Bar */}
            <div
              style={{
                height: 38,
                background: "#ffffff",
                borderBottom: isDrawerOpen ? "1px solid #e2e8f0" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("run");
                    setIsDrawerOpen(true);
                  }}
                  style={{
                    background: activeTab === "run" && isDrawerOpen ? "#eff6ff" : "transparent",
                    color: activeTab === "run" && isDrawerOpen ? "#2563eb" : "#64748b",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <LuTerminal size={13} />
                  <span>Run</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("run_tests");
                    setIsDrawerOpen(true);
                  }}
                  style={{
                    background: activeTab === "run_tests" && isDrawerOpen ? "#eff6ff" : "transparent",
                    color: activeTab === "run_tests" && isDrawerOpen ? "#2563eb" : "#64748b",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <LuPlay size={13} fill={activeTab === "run_tests" ? "currentColor" : "none"} />
                  <span>Run Tests</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("hint");
                    setIsDrawerOpen(true);
                  }}
                  style={{
                    background: activeTab === "hint" && isDrawerOpen ? "#eff6ff" : "transparent",
                    color: activeTab === "hint" && isDrawerOpen ? "#2563eb" : "#64748b",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <LuLightbulb size={13} />
                  <span>Hint</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                }}
                title={isDrawerOpen ? "Collapse drawer" : "Expand drawer"}
              >
                {isDrawerOpen ? <LuChevronDown size={18} /> : <LuChevronUp size={18} />}
              </button>
            </div>

            {/* Drawer Body */}
            {isDrawerOpen && (
              <div
                style={{
                  height: 210,
                  display: "flex",
                  flexDirection: "column",
                  background: "#f8fafc",
                  overflowY: "auto",
                }}
              >
                {/* Banner */}
                {bannerVisible && (
                  <div
                    style={{
                      padding: "6px 14px",
                      background: "#f0fdf4",
                      borderBottom: "1px solid #dcfce7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 11.5,
                      color: "#166534",
                      fontWeight: 600,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <LuFileCode size={14} color="#16a34a" />
                      <span>Run tests to evaluate your solution against the test suite.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBannerVisible(false)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#16a34a", fontSize: 11, fontStyle: "italic" }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* TAB 1: RUN TESTS (Matches uploaded reference image!) */}
                {activeTab === "run_tests" && (
                  <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
                    {/* Left Column: Run Tests Button + List of 10 Test Cases */}
                    <div
                      style={{
                        width: 170,
                        borderRight: "1px solid #e2e8f0",
                        background: "#ffffff",
                        padding: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        overflowY: "auto",
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleRunTests}
                        disabled={isRunningTests || isReadOnlyForUser}
                        style={{
                          background: "#0f172a",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 8,
                          padding: "7px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      >
                        <LuPlay size={12} fill="#ffffff" />
                        <span>{isRunningTests ? "Running Tests..." : "Run Tests"}</span>
                      </button>

                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {currentTestCases.map((tc, idx) => (
                          <button
                            key={tc.id || idx}
                            type="button"
                            onClick={() => setSelectedCaseIndex(idx)}
                            style={{
                              background: selectedCaseIndex === idx ? "#eff6ff" : "transparent",
                              border: selectedCaseIndex === idx ? "1px solid #bfdbfe" : "1px solid transparent",
                              borderRadius: 6,
                              padding: "5px 8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: 11.5,
                              fontWeight: selectedCaseIndex === idx ? 700 : 500,
                              color: selectedCaseIndex === idx ? "#1d4ed8" : "#475569",
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            <span>Test Case {tc.index || idx + 1}</span>
                            <span>
                              {(() => {
                                const isTcPass = Boolean(tc.passed === true || tc.passed === "true" || tc.status === "PASSED" || tc.passed === 1);
                                const isTcFail = Boolean((tc.passed === false || tc.passed === "false" || tc.status === "FAILED") && !isTcPass);
                                if (isTcPass) {
                                  return <LuCircleCheck size={14} color="#16a34a" style={{ color: "#16a34a" }} />;
                                }
                                if (isTcFail) {
                                  return <LuCircleX size={14} color="#dc2626" style={{ color: "#dc2626" }} />;
                                }
                                return <LuCircle size={13} color="#94a3b8" style={{ color: "#94a3b8" }} />;
                              })()}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Input, Expected Output & Actual Output */}
                    <div
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        overflowY: "auto",
                      }}
                    >
                      {/* Input Box */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                          Input {selectedCase?.isHidden ? `(Hidden Test Case ${selectedCase?.index} of 10)` : `(Public Sample ${selectedCase?.index || 1} of 3)`}
                        </div>
                        <div
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontFamily: "monospace",
                            fontSize: 12,
                            color: "#0f172a",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {selectedCase?.isHidden ? "[Hidden Test Case — Stored on backend]" : selectedCase?.input}
                        </div>
                      </div>

                      {/* Expected Output Box */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                          Expected Output {selectedCase?.isHidden ? "(Hidden)" : ""}
                        </div>
                        <div
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontFamily: "monospace",
                            fontSize: 12,
                            color: "#0f172a",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {selectedCase?.isHidden ? "[Hidden Output — Protected test case]" : selectedCase?.expectedOutput}
                        </div>
                      </div>

                      {/* Actual Output (if evaluated) */}
                      {hasEvaluated && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                            Actual Output
                          </div>
                          <div
                            style={{
                              background: selectedCase?.passed ? "#f0fdf4" : "#fef2f2",
                              border: selectedCase?.passed ? "1px solid #bbf7d0" : "1px solid #fecaca",
                              borderRadius: 6,
                              padding: "8px 10px",
                              fontFamily: "monospace",
                              fontSize: 12,
                              color: selectedCase?.passed ? "#166534" : "#991b1b",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {selectedCase?.actualOutput || (selectedCase?.passed ? "[Passed]" : "[No output / Failed]")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: RUN (Interactive STDIN & Console Output) */}
                {activeTab === "run" && (
                  <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
                    <div style={{ width: 170, borderRight: "1px solid #e2e8f0", background: "#ffffff", padding: "10px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleRunCode}
                        disabled={isRunning || isReadOnlyForUser}
                        style={{
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 8,
                          padding: "7px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <LuPlay size={12} fill="#ffffff" />
                        <span>{isRunning ? "Executing..." : "Run"}</span>
                      </button>
                      <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
                        Execute code against custom input in a secure sandbox.
                      </div>
                    </div>

                    <div style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Custom Input (STDIN)</div>
                        <textarea
                          value={stdinInput}
                          onChange={(e) => setStdinInput(e.target.value)}
                          placeholder="Optional stdin parameters for your program..."
                          style={{
                            width: "100%",
                            height: 60,
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            fontFamily: "monospace",
                            fontSize: 12,
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>Terminal Output</span>
                          {executionMeta && (
                            <span style={{ fontSize: 10.5, color: "#64748b", fontFamily: "monospace" }}>
                              ⏱ {executionMeta.duration}ms | Exit: {executionMeta.exitCode}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            background: "#0f172a",
                            color: "#f8fafc",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontFamily: "monospace",
                            fontSize: 12,
                            minHeight: 50,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {executionError ? (
                            <span style={{ color: "#f87171" }}>{executionError}</span>
                          ) : executionOutput ? (
                            executionOutput
                          ) : (
                            <span style={{ color: "#64748b" }}>Click 'Run' to execute code and view output.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: HINTS */}
                {activeTab === "hint" && (
                  <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b" }}>💡 Solution Guidance & Algorithmic Hints</div>
                    <ul style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, paddingLeft: 18 }}>
                      <li>
                        <strong>Hash Map Approach:</strong> As you iterate through the list, keep a map of visited values to their indices.
                      </li>
                      <li>
                        For every element <code>nums[i]</code>, calculate <code>diff = target - nums[i]</code>.
                      </li>
                      <li>
                        If <code>diff</code> is already in the map, you found your two indices: <code>[map[diff], i]</code>.
                      </li>
                      <li>This optimal approach runs in <strong>O(n) time complexity</strong> and <strong>O(n) auxiliary space</strong>.</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =========================================================================
              E. STICKY BOTTOM ACTION FOOTER BAR (Matches uploaded reference image!)
              ========================================================================= */}
          <footer
            style={{
              height: 48,
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px",
              flexShrink: 0,
            }}
          >
            {/* Left: Save Draft */}
            <button
              type="button"
              onClick={() => {
                handleExportProject();
                toast.success("Draft saved successfully!");
              }}
              style={{
                background: "#0f172a",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <LuSave size={13} />
              <span>Save Draft</span>
            </button>

            {/* Center: Suite Progress Pill */}
            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "4px 14px",
                fontSize: 11.5,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              {hasEvaluated ? (
                <span style={{ color: passedCount >= 8 ? "#166534" : "#991b1b", fontWeight: 700 }}>
                  {passedCount}/{currentTestCases.length} Tests Passed ({Math.round((passedCount / currentTestCases.length) * 100)}%) — {passedCount >= 8 ? "Pass Criteria Met!" : "80% Required"}
                </span>
              ) : (
                <span>Suite: 10 Tests (80% Required to Pass)</span>
              )}
            </div>

            {/* Right: Accept & Grade Solution (Black Pill with Send Icon, or Green Locked when Submitted) */}
            <button
              type="button"
              onClick={handleSubmitSolution}
              disabled={isSubmitting || isReadOnlyForUser || isTestSubmitted}
              style={{
                background: isTestSubmitted ? "#16a34a" : "#0f172a",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "6px 16px",
                fontSize: 12,
                fontWeight: 700,
                cursor: isTestSubmitted ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 6px rgba(15, 23, 42, 0.2)",
              }}
            >
              {isTestSubmitted ? (
                <>
                  <LuCircleCheck size={14} color="#ffffff" style={{ color: "#ffffff" }} />
                  <span>Test Submitted & Graded (Locked)</span>
                </>
              ) : (
                <>
                  <span>{isSubmitting ? "Evaluating..." : "Accept & Grade Solution"}</span>
                  <LuSend size={13} />
                </>
              )}
            </button>
          </footer>
        </div>
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowNewFileModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 20,
              width: 320,
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: "0 0 12px 0", fontSize: 15, color: "#0f172a" }}>Create New File</h4>
            <input
              type="text"
              placeholder="e.g. utils.py, index.js"
              value={newFileNameInput}
              onChange={(e) => setNewFileNameInput(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                marginBottom: 12,
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowNewFileModal(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = newFileNameInput.trim();
                  if (!name) return;
                  const lang = getLanguageFromFilename(name);
                  const newFile = {
                    id: `file_${Date.now()}`,
                    name,
                    language: lang,
                    content: `# ${name}\n`,
                    lastModifiedBy: currentUser?.fullName || "User",
                  };
                  setFiles((prev) => [...prev, newFile]);
                  setCurrentFileId(newFile.id);
                  setNewFileNameInput("");
                  setShowNewFileModal(false);
                  if (socket) socket.emit("meeting_file_create", { meetingId, file: newFile, user: currentUser });
                  toast.success(`Created file ${name}`);
                }}
                style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
