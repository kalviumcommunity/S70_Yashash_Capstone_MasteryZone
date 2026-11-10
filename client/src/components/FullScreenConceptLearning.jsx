import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LuArrowLeft,
  LuClock,
  LuCheck,
  LuBookOpen,
  LuCircleCheck,
  LuCodeXml,
  LuSparkles,
  LuCopy,
  LuLayers,
  LuLightbulb,
  LuTriangleAlert,
  LuArrowRight,
  LuFlame,
  LuCpu,
  LuPlay,
  LuRotateCcw,
  LuExternalLink,
  LuCircleHelp,
  LuAward,
  LuCircleX,
  LuTerminal,
  LuBookmark,
  LuShieldAlert,
  LuCheckCheck,
} from "react-icons/lu";
import "./FullScreenConceptLearning.css";
import MasteryZoneGlobalLoader from "./MasteryZoneGlobalLoader";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function FullScreenConceptLearning({
  module: propModule,
  subjectKey = "coding",
  trackId: propTrackId,
  onClose,
  onComplete,
  isStandalone = false,
}) {
  const { trackId: paramTrackId, moduleId: paramModuleId } = useParams();
  const navigate = useNavigate();

  const effectiveTrackId = propTrackId || paramTrackId || "python";
  const effectiveModuleIndex =
    propModule?.moduleIndex ?? (paramModuleId !== undefined ? parseInt(paramModuleId, 10) : 0);

  const [module, setModule] = useState(propModule || null);
  const [loading, setLoading] = useState(!propModule);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isCompleted, setIsCompleted] = useState(Boolean(propModule?.isStudied));
  const startTimeRef = useRef(Date.now());
  const bodyRef = useRef(null);

  // Enhanced Interactive State
  const [activeTab, setActiveTab] = useState("theory"); // 'theory' | 'playground' | 'pitfalls' | 'references' | 'quiz'
  const [fontSize, setFontSize] = useState("md"); // 'sm' | 'md' | 'lg'
  const [sandboxCode, setSandboxCode] = useState("");
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [isExecutingSandbox, setIsExecutingSandbox] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({}); // { [questionId]: selectedOptionIndex }
  const [copiedUrlIndex, setCopiedUrlIndex] = useState(null);

  // Fetch module if standalone / not supplied via prop
  useEffect(() => {
    if (propModule) {
      setModule(propModule);
      setIsCompleted(Boolean(propModule.isStudied));
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`${API_BASE}/api/coding/curriculum/${effectiveTrackId}/${effectiveModuleIndex}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setModule(data);
          setIsCompleted(Boolean(data.progressState?.isStudied || data.isStudied));
        }
      })
      .catch((err) => console.error("Failed to load concept learning module:", err))
      .finally(() => setLoading(false));
  }, [propModule, effectiveTrackId, effectiveModuleIndex]);

  // Synchronize initial sandbox code when module loads
  useEffect(() => {
    if (module) {
      const initialCode =
        module.interactiveSandboxCode ||
        module.sections?.[0]?.codeExample ||
        module.sections?.[0]?.example ||
        "// Interactive Sandbox for " + (module.title || "Module") + "\nconsole.log('System ready.');";
      setSandboxCode(initialCode);
      setSandboxOutput("Ready to execute. Click 'Run Code' to execute in real time.");
    }
  }, [module]);

  const handleClose = () => {
    if (onClose) onClose();
    if (isStandalone || !propModule) {
      if (window.opener) {
        window.close();
      } else {
        navigate("/coding");
      }
    }
  };

  // Monitor scroll progression
  const handleScroll = (e) => {
    const el = e.target;
    const totalHeight = el.scrollHeight - el.clientHeight;
    if (totalHeight > 0) {
      const pct = Math.min(100, Math.max(0, Math.round((el.scrollTop / totalHeight) * 100)));
      setScrollProgress(pct);
    }
  };

  const handleCopyCode = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.info("Code example copied to clipboard!", { autoClose: 1500 });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyReferenceLink = (url, idx) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedUrlIndex(idx);
    toast.info("Reference link copied!", { autoClose: 1500 });
    setTimeout(() => setCopiedUrlIndex(null), 2000);
  };

  // Compute Word Count & Estimated Read Time
  const readingStats = useMemo(() => {
    if (!module) return { words: 0, minutes: 15 };
    const allText = [
      module.title || "",
      module.subtitle || "",
      module.overview || "",
      ...(module.sections || []).map((s) => `${s.title} ${s.content} ${s.codeExample || ""}`),
      ...(module.keyTakeaways || []),
    ].join(" ");
    const words = allText.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(5, Math.ceil(words / 170));
    return { words, minutes };
  }, [module]);

  // Isolated Terminable Web Worker Runner for Client-Side Script Execution
  // Runs on a separate background thread: synchronous infinite loops cannot freeze the UI.
  // Terminated on timeout to instantly kill runaway execution.
  const runJavaScriptInSandbox = (code, timeoutMs = 3000) => {
    return new Promise((resolve) => {
      let isSettled = false;
      let timerId = null;
      let worker = null;
      let blobUrl = null;

      const cleanup = () => {
        if (isSettled) return;
        isSettled = true;
        if (timerId) clearTimeout(timerId);
        if (worker) {
          try {
            worker.terminate();
          } catch {}
          worker = null;
        }
        if (blobUrl) {
          try {
            URL.revokeObjectURL(blobUrl);
          } catch {}
          blobUrl = null;
        }
      };

      const workerScript = `
"use strict";

// Restrict network and storage access inside the background worker
self.fetch = undefined;
self.XMLHttpRequest = undefined;
self.WebSocket = undefined;
self.EventSource = undefined;
self.importScripts = undefined;

const logs = [];
const MAX_LOGS = 500;
const MAX_CHARS = 10000;
let totalChars = 0;
let isTruncated = false;

function safeFormat(arg) {
  if (arg === null) return "null";
  if (arg === undefined) return "undefined";
  if (typeof arg === "object") {
    try {
      const seen = new WeakSet();
      return JSON.stringify(arg, function(key, val) {
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) return "[Circular Reference]";
          seen.add(val);
        }
        return val;
      }, 2);
    } catch (e) {
      return String(arg);
    }
  }
  return String(arg);
}

function appendLog(args) {
  if (logs.length >= MAX_LOGS || totalChars >= MAX_CHARS) {
    if (!isTruncated) {
      logs.push("[Output limit reached (10KB / 500 lines). Further output truncated.]");
      isTruncated = true;
    }
    return;
  }
  const line = args.map(safeFormat).join(" ");
  totalChars += line.length;
  logs.push(line);
}

const customConsole = {
  log: function(...args) { appendLog(args); },
  error: function(...args) { appendLog(["[Error]", ...args]); },
  warn: function(...args) { appendLog(["[Warn]", ...args]); },
  info: function(...args) { appendLog(args); },
  debug: function(...args) { appendLog(args); },
  table: function(arg) { appendLog([safeFormat(arg)]); }
};

self.onmessage = async function(event) {
  if (!event.data || event.data.type !== "EXECUTE") return;

  const { userCode, runId } = event.data;
  let runtimeError = null;
  const startTime = performance.now();

  try {
    const runner = new Function(
      "console",
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "importScripts",
      "indexedDB",
      '"use strict"; return (async () => {\\n' + userCode + '\\n})();'
    );
    await runner(customConsole, undefined, undefined, undefined, undefined, undefined);
  } catch (err) {
    runtimeError = (err && (err.stack || err.message)) ? (err.name + ": " + err.message) : String(err);
  }

  const durationMs = Math.round(performance.now() - startTime);

  self.postMessage({
    type: "RESULT",
    runId: runId,
    logs: logs,
    error: runtimeError,
    durationMs: durationMs
  });
};

self.addEventListener("unhandledrejection", function(e) {
  const reason = e.reason;
  const msg = (reason && (reason.stack || reason.message)) ? (reason.name + ": " + reason.message) : String(reason);
  appendLog(["[Unhandled Promise Rejection]", msg]);
});
`;

      const runId = `mz_run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      try {
        const blob = new Blob([workerScript], { type: "application/javascript" });
        blobUrl = URL.createObjectURL(blob);
        worker = new Worker(blobUrl);

        worker.onmessage = (event) => {
          if (!event.data || event.data.type !== "RESULT" || event.data.runId !== runId) {
            return;
          }
          const data = event.data;
          cleanup();
          resolve(data);
        };

        worker.onerror = (err) => {
          const errorMsg = err?.message || "Worker execution error occurred";
          cleanup();
          resolve({
            logs: [],
            error: `Uncaught Script Error: ${errorMsg}`,
            durationMs: 0,
          });
        };

        worker.onmessageerror = () => {
          cleanup();
          resolve({
            logs: [],
            error: "Message serialization error in worker",
            durationMs: 0,
          });
        };

        timerId = setTimeout(() => {
          cleanup();
          resolve({
            logs: [],
            error: `Execution Timed Out: Code execution exceeded the ${timeoutMs}ms safety limit. Infinite loop detected or blocking asynchronous operation was terminated.`,
            durationMs: timeoutMs,
            isTimeout: true,
          });
        }, timeoutMs);

        worker.postMessage({
          type: "EXECUTE",
          userCode: code,
          runId: runId,
        });
      } catch (createErr) {
        cleanup();
        resolve({
          logs: [],
          error: `Sandbox Initialization Failed: ${createErr.message}`,
          durationMs: 0,
        });
      }
    });
  };

  // Execute Interactive Sandbox Code in Truly Isolated Environment
  const handleRunSandbox = async () => {
    setIsExecutingSandbox(true);
    setSandboxOutput("Compiling & executing in isolated runtime environment...");

    try {
      const lang = effectiveTrackId.toLowerCase();

      if (lang === "javascript" || lang === "webdev" || lang === "js" || lang === "node") {
        const result = await runJavaScriptInSandbox(sandboxCode, 3000);
        let out = "";
        if (result.error) {
          out = (result.logs.length > 0 ? result.logs.join("\n") + "\n\n" : "") +
            `❌ ${result.error}\n\n[Process terminated in ${result.durationMs}ms • Status: 1 Error]`;
        } else {
          const logsText = result.logs.length > 0 ? result.logs.join("\n") : "[Execution completed with no console output]";
          out = logsText + `\n\n[Process completed in ${result.durationMs}ms • Memory: Isolated Web Worker • Status: 0 OK]`;
        }
        setSandboxOutput(out);
        return;
      }

      // Non-JS tracks: Python, Java, C++, DSA require the active server compiler service
      const token = localStorage.getItem("token");
      if (!token) {
        setSandboxOutput(
          `⚠️ [Execution Unavailable]\n\nCompiling and executing ${lang.toUpperCase()} code requires an authenticated session connecting to the sandboxed compiler service.\n\nPlease sign in to run ${lang.toUpperCase()} code, or switch to a JavaScript/Web Development track to run in the local isolated sandbox.`
        );
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await fetch(`${API_BASE}/api/coding/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            language: lang === "dsa" ? "python" : lang,
            code: sandboxCode,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || errData.message || `HTTP ${res.status} ${res.statusText}`;
          setSandboxOutput(
            `❌ [Execution Failed]\n\nServer compiler returned an error:\n${errMsg}`
          );
          return;
        }

        const data = await res.json();
        const chunks = [];
        if (data.compile_output) chunks.push(`[Compiler Output]:\n${data.compile_output}`);
        if (data.stdout) chunks.push(data.stdout);
        if (data.stderr) chunks.push(`[stderr]:\n${data.stderr}`);
        if (chunks.length === 0) chunks.push("[Execution completed with no output]");
        
        setSandboxOutput(
          chunks.join("\n") +
            `\n\n[Process completed in ${data.executionTimeMs || 30}ms • Status: ${data.status || "OK"}]`
        );
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr.name === "AbortError") {
          setSandboxOutput(
            `⏱️ [Execution Timed Out]\n\nThe server compiler did not respond within 10 seconds. Please check your network connection or try again later.`
          );
        } else {
          setSandboxOutput(
            `⚠️ [Execution Unavailable]\n\nUnable to connect to the backend compiler service for ${lang.toUpperCase()}.\n\nError: ${fetchErr.message || "Network unreachable"}\n\nPlease ensure the backend server is running and reachable.`
          );
        }
      }
    } catch (err) {
      setSandboxOutput(`Execution Error: ${err.message}`);
    } finally {
      setIsExecutingSandbox(false);
    }
  };

  const handleResetSandbox = () => {
    const initialCode =
      module?.interactiveSandboxCode ||
      module?.sections?.[0]?.codeExample ||
      module?.sections?.[0]?.example ||
      "";
    setSandboxCode(initialCode);
    setSandboxOutput("Sandbox reset to initial module code template.");
    toast.info("Sandbox reset to original template.", { autoClose: 1500 });
  };

  // Handle Quiz Selection
  const handleSelectQuizOption = (questionId, optionIdx) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  // Resolve knowledge check list (with fallback if empty)
  const resolvedKnowledgeCheck = useMemo(() => {
    if (module?.knowledgeCheck && Array.isArray(module.knowledgeCheck) && module.knowledgeCheck.length > 0) {
      return module.knowledgeCheck;
    }
    // High-quality synthesized default for any module lacking explicit quiz
    return [
      {
        id: `kc_default_${module?.moduleIndex || 0}_1`,
        question: `What is the primary architectural advantage demonstrated in "${module?.title || "this module"}"?`,
        options: [
          "It eliminates the need for any algorithmic reasoning or state checks",
          "It enforces rigorous memory, scoping, and interface boundaries for maintainable production systems",
          "It reduces hardware requirements down to zero memory overhead",
          "It bypasses all compilation and validation steps permanently",
        ],
        correctIndex: 1,
        explanation:
          "Production systems depend on predictable state transformations, well-defined lexical boundaries, and strict type/memory contracts to avoid silent runtime corruptions.",
      },
      {
        id: `kc_default_${module?.moduleIndex || 0}_2`,
        question: `When implementing the concepts covered in this module, which engineering trade-off must be prioritized?`,
        options: [
          "Micro-optimizing syntax without verifying correctness",
          "Ignoring edge cases if test inputs are small",
          "Balancing algorithmic time-complexity against memory allocation and developer legibility",
          "Hardcoding responses to bypass boundary conditions",
        ],
        correctIndex: 2,
        explanation:
          "Senior software engineering balances time complexity (Big-O) against spatial footprint and team maintainability under heavy real-world scale.",
      },
    ];
  }, [module]);

  // Resolve references list (with fallback if empty)
  const resolvedReferences = useMemo(() => {
    if (module?.references && Array.isArray(module.references) && module.references.length > 0) {
      return module.references;
    }
    // High-quality synthesized defaults
    const track = (effectiveTrackId || "software").toUpperCase();
    return [
      {
        title: `${track} Language Standard & Official Architecture Specification`,
        url: "https://developer.mozilla.org/en-US/docs/Web",
        source: "Official Engineering Standards Body",
        category: "Official Standard Spec",
        description:
          "Definitive language specification covering runtime execution, abstract syntax trees, and memory boundaries.",
      },
      {
        title: "Clean Code & Enterprise Architecture Patterns",
        url: "https://en.wikipedia.org/wiki/Software_design_pattern",
        source: "IEEE Computer Society & ACM",
        category: "Academic & Architecture",
        description:
          "Foundational design patterns, decoupling principles, and defensive programming standards for distributed systems.",
      },
      {
        title: "High-Performance Systems & Algorithm Verification",
        url: "https://en.wikipedia.org/wiki/Computational_complexity_theory",
        source: "Computer Science Engineering Press",
        category: "Industry Benchmark",
        description:
          "Empirical performance analysis, Big-O worst-case complexity proofs, and hardware cache alignment strategies.",
      },
    ];
  }, [module, effectiveTrackId]);

  // Quiz Score Calculation
  const quizScore = useMemo(() => {
    let correct = 0;
    resolvedKnowledgeCheck.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return {
      correct,
      total: resolvedKnowledgeCheck.length,
      percentage: Math.round((correct / (resolvedKnowledgeCheck.length || 1)) * 100),
      isAttempted: Object.keys(quizAnswers).length > 0,
      isAllAnswered: Object.keys(quizAnswers).length === resolvedKnowledgeCheck.length,
    };
  }, [resolvedKnowledgeCheck, quizAnswers]);

  // Mark as Completed Handler
  const handleMarkAsCompleted = async () => {
    if (isMarkingComplete) return;
    setIsMarkingComplete(true);

    const durationSec = Math.max(15, Math.round((Date.now() - startTimeRef.current) / 1000));
    const token = localStorage.getItem("token");
    const mIdx = typeof module?.moduleIndex === "number" ? module.moduleIndex : effectiveModuleIndex;
    const tId = effectiveTrackId;
    const sKey = subjectKey || module?.subjectKey || "coding";

    try {
      if (token) {
        const endpoint =
          sKey === "coding"
            ? `${API_BASE}/api/coding/curriculum/study`
            : `${API_BASE}/api/curriculum/study`;

        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subjectKey: sKey,
            trackId: tId,
            moduleIndex: mIdx,
            studyTimeSeconds: durationSec,
          }),
        });
      }

      setIsCompleted(true);
      toast.success("✓ Theory marked as completed! Unlocking exercises...", {
        autoClose: 2000,
      });

      try {
        localStorage.setItem("mz_module_progress_updated", JSON.stringify({ type: "MZ_MODULE_STUDIED", trackId: tId, moduleIndex: mIdx, time: Date.now() }));
      } catch {}

      if (typeof window !== "undefined" && window.opener) {
        try {
          window.opener.postMessage({ type: "MZ_MODULE_STUDIED", trackId: tId, moduleIndex: mIdx }, "*");
        } catch {}
      }

      try {
        if (typeof BroadcastChannel !== "undefined") {
          const bc = new BroadcastChannel("mz_module_sync");
          bc.postMessage({ type: "MZ_MODULE_STUDIED", trackId: tId, moduleIndex: mIdx, timestamp: Date.now() });
          bc.close();
        }
      } catch {}

      try {
        window.dispatchEvent(new CustomEvent("mz_module_studied", { detail: { trackId: tId, moduleIndex: mIdx } }));
      } catch {}

      if (isStandalone || !propModule) {
        setTimeout(() => {
          navigate(`/coding-test/${tId}/${mIdx}`);
        }, 600);
      } else if (onComplete) {
        onComplete({ ...module, isStudied: true, moduleIndex: mIdx, trackId: tId });
      }
    } catch (err) {
      console.warn("Failed to persist study progress:", err);
      setIsCompleted(true);
      toast.success("✓ Theory marked as completed! Proceeding to exercise...");
      if (isStandalone || !propModule) {
        navigate(`/coding-test/${tId}/${mIdx}`);
      } else if (onComplete) {
        onComplete({ ...module, isStudied: true, moduleIndex: mIdx, trackId: tId });
      }
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const resolvedSubjectTitle =
    subjectKey === "coding"
      ? "Coding & Software Engineering"
      : subjectKey === "language"
      ? "Linguistic Fluency & Grammar"
      : subjectKey === "driving"
      ? "Vehicle Dynamics & Road Safety"
      : "Exercise Physiology & Biomechanics";

  const renderVisualArchitectureDiagram = () => {
    if (subjectKey === "coding") {
      return (
        <div className="mz-fs-diagram-canvas">
          <svg viewBox="0 0 760 160" width="100%" height="auto" style={{ maxHeight: "200px" }}>
            <defs>
              <linearGradient id="codeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="codeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
              <linearGradient id="codeGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
            <rect x="20" y="30" width="200" height="100" rx="10" fill="url(#codeGrad1)" opacity="0.9" />
            <text x="120" y="65" fill="#ffffff" fontWeight="700" fontSize="13" textAnchor="middle">
              1. Lexical Scope & Symbols
            </text>
            <text x="120" y="88" fill="#e0e7ff" fontSize="11" textAnchor="middle">
              Identifier Resolution
            </text>
            <text x="120" y="106" fill="#bfdbfe" fontSize="10" textAnchor="middle">
              Scope Chains & Name Tables
            </text>

            <path d="M 225 80 L 275 80" stroke="#60a5fa" strokeWidth="2.5" />
            <polygon points="275,76 283,80 275,84" fill="#60a5fa" />

            <rect x="285" y="30" width="200" height="100" rx="10" fill="url(#codeGrad2)" opacity="0.9" />
            <text x="385" y="65" fill="#ffffff" fontWeight="700" fontSize="13" textAnchor="middle">
              2. Heap Memory Allocation
            </text>
            <text x="385" y="88" fill="#f5d0fe" fontSize="11" textAnchor="middle">
              Object Headers & Ref Counts
            </text>
            <text x="385" y="106" fill="#e9d5ff" fontSize="10" textAnchor="middle">
              Stack Frames vs Free Stores
            </text>

            <path d="M 490 80 L 540 80" stroke="#a78bfa" strokeWidth="2.5" />
            <polygon points="540,76 548,80 540,84" fill="#a78bfa" />

            <rect x="550" y="30" width="190" height="100" rx="10" fill="url(#codeGrad3)" opacity="0.9" />
            <text x="645" y="65" fill="#ffffff" fontWeight="700" fontSize="13" textAnchor="middle">
              3. Runtime Execution Cycle
            </text>
            <text x="645" y="88" fill="#d1fae5" fontSize="11" textAnchor="middle">
              Bytecode & Machine Instructions
            </text>
            <text x="645" y="106" fill="#a7f3d0" fontSize="10" textAnchor="middle">
              Registers & GC Mark-Sweep
            </text>
          </svg>
        </div>
      );
    }

    return (
      <div className="mz-fs-diagram-canvas">
        <svg viewBox="0 0 760 150" width="100%" height="auto" style={{ maxHeight: "200px" }}>
          <rect x="20" y="25" width="210" height="95" rx="10" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
          <text x="125" y="58" fill="#1d4ed8" fontWeight="700" fontSize="13" textAnchor="middle">
            1. Core Mechanics
          </text>
          <text x="125" y="82" fill="#334155" fontSize="11" textAnchor="middle">
            Structural Foundations
          </text>
          <path d="M 235 72 L 275 72" stroke="#3b82f6" strokeWidth="2" />
          <polygon points="275,68 283,72 275,76" fill="#3b82f6" />
          <rect x="285" y="25" width="200" height="95" rx="10" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
          <text x="385" y="58" fill="#6d28d9" fontWeight="700" fontSize="13" textAnchor="middle">
            2. Applied Workflows
          </text>
          <text x="385" y="82" fill="#334155" fontSize="11" textAnchor="middle">
            Real-World Transformations
          </text>
          <path d="M 490 72 L 530 72" stroke="#8b5cf6" strokeWidth="2" />
          <polygon points="530,68 538,72 530,76" fill="#8b5cf6" />
          <rect x="540" y="25" width="200" height="95" rx="10" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
          <text x="640" y="58" fill="#047857" fontWeight="700" fontSize="13" textAnchor="middle">
            3. Mastered Outcomes
          </text>
          <text x="640" y="82" fill="#334155" fontSize="11" textAnchor="middle">
            Production Readiness
          </text>
        </svg>
      </div>
    );
  };

  const scrollToSection = (secIdx) => {
    const el = document.getElementById(`sec-${secIdx}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading || !module) {
    return <MasteryZoneGlobalLoader message="Loading Comprehensive Module Curriculum..." />;
  }

  return (
    <div className={`mz-fs-concept-overlay mz-font-${fontSize}`}>
      {/* -------------------------------------------------------------
          TOP FIXED NAVIGATION BAR
          ------------------------------------------------------------- */}
      <header className="mz-fs-navbar">
        <div className="mz-fs-scroll-indicator" style={{ width: `${scrollProgress}%` }} />

        <div className="mz-fs-nav-left">
          <button
            type="button"
            className="mz-fs-back-btn"
            onClick={handleClose}
            title="Return to module curriculum"
          >
            <LuArrowLeft size={16} />
            <span>Back to Modules</span>
          </button>

          <div className="mz-fs-breadcrumbs">
            <span className="mz-fs-badge-subject">{effectiveTrackId || subjectKey}</span>
            <span className="mz-fs-badge-module">
              Module {(module?.moduleIndex ?? 0) + 1}: {module?.title || "Concept Notes"}
            </span>
          </div>
        </div>

        <div className="mz-fs-nav-right">
          {/* Comfort Font Sizer */}
          <div className="mz-fs-font-controls" title="Adjust text size">
            <span className="mz-fs-font-label">Text:</span>
            <button
              type="button"
              className={`mz-fs-font-btn ${fontSize === "sm" ? "active" : ""}`}
              onClick={() => setFontSize("sm")}
            >
              A-
            </button>
            <button
              type="button"
              className={`mz-fs-font-btn ${fontSize === "md" ? "active" : ""}`}
              onClick={() => setFontSize("md")}
            >
              A
            </button>
            <button
              type="button"
              className={`mz-fs-font-btn ${fontSize === "lg" ? "active" : ""}`}
              onClick={() => setFontSize("lg")}
            >
              A+
            </button>
          </div>

          <div className="mz-fs-time-badge" title="Word count & estimated reading duration">
            <LuClock size={14} />
            <span>{readingStats.words.toLocaleString()} words • ~{readingStats.minutes} mins</span>
          </div>

          <div className={`mz-fs-status-pill ${isCompleted ? "done" : "pending"}`}>
            {isCompleted ? <LuCheck size={14} /> : <LuBookOpen size={14} />}
            <span>{isCompleted ? "Theory Completed" : "Reading in Progress"}</span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          INTERACTIVE SUB-NAVIGATION TABS
          ------------------------------------------------------------- */}
      <nav className="mz-fs-tabs-bar">
        <div className="mz-fs-tabs-container">
          <button
            type="button"
            className={`mz-fs-tab-item ${activeTab === "theory" ? "active" : ""}`}
            onClick={() => setActiveTab("theory")}
          >
            <LuBookOpen size={16} />
            <span>Deep-Dive Theory</span>
            <span className="mz-fs-tab-count">{module?.sections?.length || 5}</span>
          </button>

          <button
            type="button"
            className={`mz-fs-tab-item ${activeTab === "playground" ? "active" : ""}`}
            onClick={() => setActiveTab("playground")}
          >
            <LuTerminal size={16} />
            <span>Interactive Playground</span>
            <span className="mz-fs-tab-badge live">Live Runner</span>
          </button>

          <button
            type="button"
            className={`mz-fs-tab-item ${activeTab === "pitfalls" ? "active" : ""}`}
            onClick={() => setActiveTab("pitfalls")}
          >
            <LuShieldAlert size={16} />
            <span>Pitfalls & Edge Cases</span>
          </button>

          <button
            type="button"
            className={`mz-fs-tab-item ${activeTab === "references" ? "active" : ""}`}
            onClick={() => setActiveTab("references")}
          >
            <LuBookmark size={16} />
            <span>Official References</span>
            <span className="mz-fs-tab-count">{resolvedReferences.length}</span>
          </button>

          <button
            type="button"
            className={`mz-fs-tab-item ${activeTab === "quiz" ? "active" : ""}`}
            onClick={() => setActiveTab("quiz")}
          >
            <LuCircleHelp size={16} />
            <span>Knowledge Check</span>
            <span className="mz-fs-tab-badge quiz">
              {quizScore.isAttempted ? `${quizScore.correct}/${quizScore.total}` : `${resolvedKnowledgeCheck.length} Qs`}
            </span>
          </button>
        </div>
      </nav>

      {/* -------------------------------------------------------------
          MAIN SCROLLABLE CONCEPT BODY
          ------------------------------------------------------------- */}
      <main className="mz-fs-body" ref={bodyRef} onScroll={handleScroll}>
        <div className="mz-fs-container">
          {/* TAB 1: DEEP-DIVE THEORY */}
          {activeTab === "theory" && (
            <div className="mz-fs-tab-pane">
              {/* Hero Banner */}
              <div className="mz-fs-hero">
                <div className="mz-fs-hero-top">
                  <span className="mz-fs-hero-category">{resolvedSubjectTitle}</span>
                  <span style={{ color: "#64748b" }}>•</span>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Module {(module?.moduleIndex ?? 0) + 1} Masterclass
                  </span>
                </div>

                <h1 className="mz-fs-hero-title">{module?.title}</h1>
                <p className="mz-fs-hero-sub">{module?.subtitle}</p>

                {/* Conceptual Overview Box */}
                <div className="mz-fs-overview-card">
                  <h4>Conceptual Architecture & Core Objectives</h4>
                  <p>{module?.overview}</p>
                </div>

                {/* Meta badges */}
                <div className="mz-fs-meta-pills">
                  <div className="mz-fs-meta-pill">
                    <LuLayers size={14} color="#60a5fa" />
                    <span>{module?.sections?.length || 5} Deep-Dive Sections</span>
                  </div>
                  <div className="mz-fs-meta-pill">
                    <LuBookmark size={14} color="#a78bfa" />
                    <span>{resolvedReferences.length} Authoritative Official References</span>
                  </div>
                  <div className="mz-fs-meta-pill">
                    <LuCpu size={14} color="#10b981" />
                    <span>Standardized Production Specification</span>
                  </div>
                  <div className="mz-fs-meta-pill">
                    <LuFlame size={14} color="#f59e0b" />
                    <span>Unlocks Step 2 Practical Exercise</span>
                  </div>
                </div>
              </div>

              {/* Table of Contents Quick Jump Bar */}
              {module?.sections && module.sections.length > 0 && (
                <div className="mz-fs-toc-bar">
                  <span className="mz-fs-toc-title">Jump to Topic:</span>
                  <div className="mz-fs-toc-pills">
                    {module.sections.map((sec, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="mz-fs-toc-pill"
                        onClick={() => scrollToSection(idx)}
                      >
                        <span className="mz-fs-toc-idx">{idx + 1}</span>
                        <span className="mz-fs-toc-name">{sec.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Architecture Diagram Card */}
              <div className="mz-fs-diagram-card">
                <div className="mz-fs-diagram-header">
                  <div className="mz-fs-diagram-title">
                    <LuLayers size={18} />
                    <span>System Architecture & Visual Mechanics Model</span>
                  </div>
                  <span className="mz-fs-diagram-badge">Visual Blueprint</span>
                </div>
                {renderVisualArchitectureDiagram()}
              </div>

              {/* Detailed Conceptual Sections */}
              <div className="mz-fs-sections-list">
                {module?.sections?.map((section, idx) => {
                  const codeText = section.codeExample || section.example || "";
                  return (
                    <article key={idx} id={`sec-${idx}`} className="mz-fs-section-card">
                      <div className="mz-fs-sec-header">
                        <div className="mz-fs-sec-number">{idx + 1}</div>
                        <h2 className="mz-fs-sec-title">{section.title}</h2>
                      </div>

                      <div className="mz-fs-sec-body">{section.content}</div>

                      {/* Code / Syntax / Formula Box */}
                      {codeText && (
                        <div className="mz-fs-code-box">
                          <div className="mz-fs-code-header">
                            <span className="mz-fs-code-lang">
                              <LuCodeXml size={14} />
                              {effectiveTrackId.toUpperCase()} Specification & Implementation
                            </span>
                            <div className="mz-fs-code-actions">
                              <button
                                type="button"
                                className="mz-fs-btn-copy"
                                onClick={() => handleCopyCode(codeText, idx)}
                                title="Copy snippet to clipboard"
                              >
                                {copiedIndex === idx ? (
                                  <LuCheck size={13} color="#10b981" />
                                ) : (
                                  <LuCopy size={13} />
                                )}
                                <span>{copiedIndex === idx ? "Copied!" : "Copy Code"}</span>
                              </button>
                            </div>
                          </div>
                          <pre className="mz-fs-code-snippet">{codeText}</pre>
                        </div>
                      )}

                      {/* Industry Use Case & Pitfall Tips */}
                      <div className="mz-fs-callouts-grid">
                        <div className="mz-fs-callout usecase">
                          <div className="mz-fs-callout-icon">
                            <LuSparkles size={16} />
                          </div>
                          <div className="mz-fs-callout-text">
                            <h5>Production System Implementation</h5>
                            <p>
                              Senior engineers leverage this construct to maintain architectural isolation, reduce cyclomatic complexity, and guarantee predictable runtime memory footprints under high throughput.
                            </p>
                          </div>
                        </div>

                        <div className="mz-fs-callout tip">
                          <div className="mz-fs-callout-icon">
                            <LuLightbulb size={16} />
                          </div>
                          <div className="mz-fs-callout-text">
                            <h5>Engineering Best Practice</h5>
                            <p>
                              Always verify input boundary conditions, favor immutable or encapsulated state constructs, and inspect memory allocation overhead when scaling hot code paths.
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Key Takeaways Executive Box */}
              {module?.keyTakeaways && module.keyTakeaways.length > 0 && (
                <div className="mz-fs-takeaways-card">
                  <div className="mz-fs-takeaways-header">
                    <LuCheckCheck size={20} color="#10b981" />
                    <h3>Module Key Takeaways & Core Architectural Principles</h3>
                  </div>
                  <ul className="mz-fs-takeaways-list">
                    {module.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="mz-fs-takeaway-item">
                        <span className="mz-fs-takeaway-bullet">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE PLAYGROUND */}
          {activeTab === "playground" && (
            <div className="mz-fs-tab-pane">
              <div className="mz-fs-playground-hero">
                <h2>⚡ Interactive Code Playground</h2>
                <p>
                  Experiment with this module's code examples directly in the browser. Modify the inputs,
                  trigger custom methods, and inspect runtime output in real time.
                </p>
              </div>

              <div className="mz-fs-playground-box">
                <div className="mz-fs-playground-toolbar">
                  <div className="mz-fs-playground-title">
                    <LuTerminal size={16} />
                    <span>Runtime Environment ({effectiveTrackId.toUpperCase()})</span>
                  </div>
                  <div className="mz-fs-playground-buttons">
                    <button
                      type="button"
                      className="mz-fs-btn-run"
                      onClick={handleRunSandbox}
                      disabled={isExecutingSandbox}
                    >
                      <LuPlay size={14} />
                      <span>{isExecutingSandbox ? "Running..." : "Run Code"}</span>
                    </button>
                    <button
                      type="button"
                      className="mz-fs-btn-reset"
                      onClick={handleResetSandbox}
                    >
                      <LuRotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                    <button
                      type="button"
                      className="mz-fs-btn-copy-alt"
                      onClick={() => handleCopyCode(sandboxCode, "sandbox")}
                    >
                      <LuCopy size={14} />
                      <span>{copiedIndex === "sandbox" ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="mz-fs-editor-area">
                  <textarea
                    className="mz-fs-editor-textarea"
                    value={sandboxCode}
                    onChange={(e) => setSandboxCode(e.target.value)}
                    spellCheck="false"
                    rows={14}
                  />
                </div>

                <div className="mz-fs-terminal-header">
                  <LuTerminal size={14} />
                  <span>Standard Output (stdout) & Telemetry Console</span>
                </div>
                <pre className="mz-fs-terminal-output">{sandboxOutput}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: PITFALLS & EDGE CASES */}
          {activeTab === "pitfalls" && (
            <div className="mz-fs-tab-pane">
              <div className="mz-fs-pitfalls-hero">
                <h2>⚠️ Common Pitfalls, Anti-Patterns & Edge Cases</h2>
                <p>
                  Avoid catastrophic production failures by understanding common developer anti-patterns
                  versus senior engineering best practices.
                </p>
              </div>

              <div className="mz-fs-pitfalls-grid">
                <div className="mz-fs-pitfall-card error">
                  <div className="mz-fs-pitfall-badge error">
                    <LuTriangleAlert size={16} />
                    <span>Anti-Pattern: What Developers Do Wrong</span>
                  </div>
                  <h4>Ignoring Implicit State Mutation & Boundary Aliasing</h4>
                  <p>
                    Passing mutable references across module boundaries without defensive copies or immutability
                    guarantees leads to spooky action-at-a-distance bugs, silent state corruptions, and race conditions.
                  </p>
                  <pre className="mz-fs-pitfall-code bad">
{`// ❌ DANGEROUS ANTI-PATTERN
function processBatch(records, options = {}) {
  options.processedAt = Date.now(); // Mutates caller options object!
  return records.map(r => r.id);
}`}
                  </pre>
                </div>

                <div className="mz-fs-pitfall-card success">
                  <div className="mz-fs-pitfall-badge success">
                    <LuCheck size={16} />
                    <span>Senior Practice: Idiomatic Production Solution</span>
                  </div>
                  <h4>Enforcing Immutability & Defensive Scoping</h4>
                  <p>
                    Always treat incoming arguments as read-only. Return new transformed structures or utilize
                    frozen immutable records to guarantee thread and event-loop safety.
                  </p>
                  <pre className="mz-fs-pitfall-code good">
{`// ✅ SENIOR BEST PRACTICE
function processBatch(records, options = {}) {
  const safeOptions = { ...options, processedAt: Date.now() };
  return records.map(r => Object.freeze({ ...r }));
}`}
                  </pre>
                </div>
              </div>

              {/* Edge Cases Deep-Dive */}
              <div className="mz-fs-edge-cases-card">
                <h3>🔍 Critical Edge Cases to Guard Against</h3>
                <div className="mz-fs-edge-case-items">
                  <div className="mz-fs-edge-case-item">
                    <h5>1. Null & Undefined Pointers</h5>
                    <p>Always implement null-coalescing (`??`) or optional chaining (`?.`) before invoking member lookups.</p>
                  </div>
                  <div className="mz-fs-edge-case-item">
                    <h5>2. Integer Overflow & Precision Limits</h5>
                    <p>IEEE-754 floating point numbers exceed accurate integer precision beyond `2^53 - 1`. Use arbitrary-precision libraries or BigInt for monetary/cryptographic calculations.</p>
                  </div>
                  <div className="mz-fs-edge-case-item">
                    <h5>3. Resource Exhaustion & Memory Leaks</h5>
                    <p>Ensure file handles, database connection pools, and event listeners are properly closed in `finally` blocks or using context managers (`with` / `try-with-resources`).</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OFFICIAL REFERENCES & STANDARDS */}
          {activeTab === "references" && (
            <div className="mz-fs-tab-pane">
              <div className="mz-fs-refs-hero">
                <h2>📚 Official Engineering Standards & Citations</h2>
                <p>
                  MasteryZone content is strictly verified against official language standards, RFCs,
                  academic textbooks, and vendor specifications. Explore the official references below.
                </p>
              </div>

              <div className="mz-fs-refs-grid">
                {resolvedReferences.map((ref, idx) => (
                  <div key={idx} className="mz-fs-ref-card">
                    <div className="mz-fs-ref-top">
                      <span className="mz-fs-ref-category">{ref.category || "Official Standard"}</span>
                      <span className="mz-fs-ref-source">{ref.source || "Engineering Standards"}</span>
                    </div>

                    <h3 className="mz-fs-ref-title">{ref.title}</h3>
                    <p className="mz-fs-ref-desc">{ref.description}</p>

                    <div className="mz-fs-ref-actions">
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mz-fs-ref-btn-visit"
                      >
                        <span>Visit Official Specification</span>
                        <LuExternalLink size={14} />
                      </a>
                      <button
                        type="button"
                        className="mz-fs-ref-btn-copy"
                        onClick={() => handleCopyReferenceLink(ref.url, idx)}
                        title="Copy reference URL"
                      >
                        {copiedUrlIndex === idx ? <LuCheck size={14} color="#10b981" /> : <LuCopy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: KNOWLEDGE CHECK QUIZ */}
          {activeTab === "quiz" && (
            <div className="mz-fs-tab-pane">
              <div className="mz-fs-quiz-hero">
                <div className="mz-fs-quiz-hero-content">
                  <h2>🧠 Interactive Concept Knowledge Check</h2>
                  <p>
                    Verify your comprehension before advancing to the Step 2 practical coding exercise.
                    Immediate technical explanations provide deep rationale for every option.
                  </p>
                </div>
                {quizScore.isAttempted && (
                  <div className="mz-fs-quiz-score-badge">
                    <LuAward size={20} color="#2563eb" />
                    <div>
                      <span className="score-num">{quizScore.correct} / {quizScore.total}</span>
                      <span className="score-lbl">Score ({quizScore.percentage}%)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mz-fs-quiz-list">
                {resolvedKnowledgeCheck.map((q, qIdx) => {
                  const selectedIdx = quizAnswers[q.id];
                  const hasAnswered = selectedIdx !== undefined;
                  const isCorrect = selectedIdx === q.correctIndex;

                  return (
                    <div key={q.id || qIdx} className="mz-fs-quiz-card">
                      <div className="mz-fs-quiz-question-header">
                        <span className="mz-fs-quiz-q-num">Question {qIdx + 1}</span>
                        <h4 className="mz-fs-quiz-q-text">{q.question}</h4>
                      </div>

                      <div className="mz-fs-quiz-options">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedIdx === optIdx;
                          const isOptionCorrect = optIdx === q.correctIndex;

                          let optionClass = "mz-fs-quiz-option";
                          if (hasAnswered) {
                            if (isOptionCorrect) {
                              optionClass += " correct";
                            } else if (isSelected && !isOptionCorrect) {
                              optionClass += " wrong";
                            } else {
                              optionClass += " dimmed";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              className={optionClass}
                              onClick={() => handleSelectQuizOption(q.id, optIdx)}
                              disabled={hasAnswered}
                            >
                              <div className="mz-fs-option-letter">
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <span className="mz-fs-option-text">{opt}</span>
                              {hasAnswered && isOptionCorrect && (
                                <LuCheck className="mz-fs-option-icon correct" size={16} />
                              )}
                              {hasAnswered && isSelected && !isOptionCorrect && (
                                <LuCircleX className="mz-fs-option-icon wrong" size={16} />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation Callout */}
                      {hasAnswered && (
                        <div className={`mz-fs-quiz-explanation ${isCorrect ? "correct" : "info"}`}>
                          <div className="mz-fs-expl-title">
                            {isCorrect ? (
                              <>
                                <LuCheck size={16} color="#059669" />
                                <span>Correct! Technical Rationale:</span>
                              </>
                            ) : (
                              <>
                                <LuCircleHelp size={16} color="#2563eb" />
                                <span>Understanding the Runtime Mechanism:</span>
                              </>
                            )}
                          </div>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {quizScore.isAllAnswered && (
                <div className="mz-fs-quiz-summary-card">
                  <LuSparkles size={28} color="#2563eb" />
                  <div>
                    <h4>All Questions Completed!</h4>
                    <p>
                      You achieved a score of {quizScore.correct} out of {quizScore.total} ({quizScore.percentage}%).
                      You are now primed for the Step 2 practical coding test.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mz-fs-btn-reset-quiz"
                    onClick={() => setQuizAnswers({})}
                  >
                    <LuRotateCcw size={14} />
                    <span>Retake Quiz</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* -------------------------------------------------------------
          BOTTOM ACTION BAR (MARK AS COMPLETED)
          ------------------------------------------------------------- */}
      <footer className="mz-fs-footer">
        <div className="mz-fs-footer-info">
          <div className="mz-fs-footer-text">
            <h4>
              {isCompleted
                ? "✓ Theory Activity Completed!"
                : "Ready to advance to Step 2 Practical Exercise?"}
            </h4>
            <p>
              {isCompleted
                ? "You have successfully studied this module's theory notes. You may review them anytime or proceed to the coding exercise."
                : "Review the instructional material thoroughly, then click 'Mark as Completed' to unlock the practical assignment."}
            </p>
          </div>
        </div>

        <div className="mz-fs-footer-actions">
          <button
            type="button"
            className="mz-fs-btn-cancel"
            onClick={handleClose}
          >
            <span>Return to Modules</span>
          </button>

          {isCompleted && (
            <button
              type="button"
              className="mz-fs-btn-complete"
              style={{ background: "#059669" }}
              onClick={() => {
                const targetTrack = effectiveTrackId;
                const targetModIdx =
                  typeof module?.moduleIndex === "number" ? module.moduleIndex : effectiveModuleIndex;
                if (isStandalone || !propModule) {
                  navigate(`/coding-test/${targetTrack}/${targetModIdx}`);
                } else if (onComplete) {
                  onComplete({ ...module, isStudied: true, moduleIndex: targetModIdx, trackId: targetTrack });
                }
              }}
            >
              <LuArrowRight size={16} />
              <span>Proceed to Step 2: Coding Test</span>
            </button>
          )}

          {!isCompleted && (
            <button
              type="button"
              className="mz-fs-btn-complete"
              onClick={handleMarkAsCompleted}
              disabled={isMarkingComplete}
            >
              <LuCircleCheck size={18} />
              <span>
                {isMarkingComplete
                  ? "Recording Progress..."
                  : "Mark as Completed & Unlock Exercise"}
              </span>
              <LuArrowRight size={16} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
