import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { toast } from "react-toastify";
import useNavigationLock from "../hooks/useNavigationLock";
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
  LuLayers,
  LuWrapText,
  LuMaximize2,
  LuMinimize2,
  LuTrash2,
  LuPlus,
  LuFileText,
} from "react-icons/lu";
import {
  SiPython,
  SiJavascript,
  SiOpenjdk,
  SiCplusplus,
  SiC,
} from "react-icons/si";
import {
  VscFiles,
  VscSearch,
  VscSourceControl,
  VscSettingsGear,
  VscTerminal,
  VscSparkle,
  VscWand,
  VscCopy,
  VscCloudDownload,
  VscLightbulb,
  VscKey,
  VscChecklist,
  VscChevronUp,
  VscChevronDown,
} from "react-icons/vsc";
import AssessmentSecurityGate from "./AssessmentSecurityGate";
import "./MasteryZoneCompiler.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

// MasteryZone Playground Theme Specifications
const VSCODE_THEMES = [
  { id: "vs-dark", label: "MasteryZone Dark+" },
  { id: "vs", label: "MasteryZone Light+" },
  { id: "one-dark-pro", label: "One Dark Pro" },
  { id: "dracula", label: "Dracula" },
  { id: "monokai", label: "Monokai" },
  { id: "github-dark", label: "GitHub Dark" },
];

// Rich Algorithmic Templates & Snippets Library for Sandboxed Compilers
const ALGORITHM_SNIPPETS = {
  python: [
    {
      title: "Fast I/O & Boilerplate",
      desc: "Optimized sys.stdin reader for large input processing",
      code: `import sys\n\ndef main():\n    input = sys.stdin.read\n    data = input().split()\n    if not data:\n        return\n    # Process data here\n    print("Ready")\n\nif __name__ == "__main__":\n    main()\n`,
    },
    {
      title: "Binary Search Template",
      desc: "Standard O(log n) lower bound binary search",
      code: `def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = left + (right - left) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n`,
    },
    {
      title: "Graph BFS / DFS Traversal",
      desc: "Adjacency list BFS with queue and visited set",
      code: `from collections import deque, defaultdict\n\ndef bfs(graph, start_node):\n    visited = set([start_node])\n    queue = deque([start_node])\n    traversal = []\n    while queue:\n        curr = queue.popleft()\n        traversal.append(curr)\n        for neighbor in graph[curr]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)\n    return traversal\n`,
    },
    {
      title: "Sliding Window / Two Pointers",
      desc: "Dynamic window expand and contract template",
      code: `def max_sliding_window(nums, k):\n    left = 0\n    current_sum = 0\n    max_sum = float('-inf')\n    for right in range(len(nums)):\n        current_sum += nums[right]\n        if right - left + 1 == k:\n            max_sum = max(max_sum, current_sum)\n            current_sum -= nums[left]\n            left += 1\n    return max_sum\n`,
    },
    {
      title: "LRU Cache / Dynamic Memoization",
      desc: "Built-in functools lru_cache for fast DP",
      code: `from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef solve_dp(n):\n    if n <= 1:\n        return n\n    return solve_dp(n - 1) + solve_dp(n - 2)\n`,
    },
  ],
  javascript: [
    {
      title: "Fast I/O & Template",
      desc: "Standard input parsing via readline / fs",
      code: `const fs = require('fs');\n\nfunction main() {\n    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    console.log("MasteryZone JS Engine Ready");\n}\nmain();\n`,
    },
    {
      title: "Binary Search Template",
      desc: "Classic iterative binary search",
      code: `function binarySearch(arr, target) {\n    let left = 0, right = arr.length - 1;\n    while (left <= right) {\n        const mid = Math.floor(left + (right - left) / 2);\n        if (arr[mid] === target) return mid;\n        if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}\n`,
    },
    {
      title: "Frequency Map Counter",
      desc: "O(n) Map-based character / element counting",
      code: `function getFrequencies(items) {\n    const freq = new Map();\n    for (const item of items) {\n        freq.set(item, (freq.get(item) || 0) + 1);\n    }\n    return freq;\n}\n`,
    },
    {
      title: "Breadth-First Search (BFS)",
      desc: "Queue-based level order graph traversal",
      code: `function bfs(graph, start) {\n    const visited = new Set([start]);\n    const queue = [start];\n    const result = [];\n    while (queue.length > 0) {\n        const node = queue.shift();\n        result.push(node);\n        for (const neighbor of (graph[node] || [])) {\n            if (!visited.has(neighbor)) {\n                visited.add(neighbor);\n                queue.push(neighbor);\n            }\n        }\n    }\n    return result;\n}\n`,
    },
  ],
  java: [
    {
      title: "Fast Scanner & Main Template",
      desc: "BufferedReader + StringTokenizer for fast competitive I/O",
      code: `import java.io.*;\nimport java.util.*;\n\npublic class Solution {\n    static class FastReader {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringTokenizer st;\n        String next() {\n            while (st == null || !st.hasMoreElements()) {\n                try { st = new StringTokenizer(br.readLine()); } catch (IOException e) {}\n            }\n            return st.nextToken();\n        }\n        int nextInt() { return Integer.parseInt(next()); }\n    }\n    public static void main(String[] args) {\n        FastReader in = new FastReader();\n        System.out.println("Java Ready");\n    }\n}\n`,
    },
    {
      title: "Binary Search Template",
      desc: "Standard O(log n) search in sorted array",
      code: `public static int binarySearch(int[] arr, int target) {\n    int l = 0, r = arr.length - 1;\n    while (l <= r) {\n        int mid = l + (r - l) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) l = mid + 1;\n        else r = mid - 1;\n    }\n    return -1;\n}\n`,
    },
    {
      title: "Min-Heap / PriorityQueue",
      desc: "Top-K elements using Java PriorityQueue",
      code: `PriorityQueue<Integer> minHeap = new PriorityQueue<>();\nfor (int num : nums) {\n    minHeap.offer(num);\n    if (minHeap.size() > k) minHeap.poll();\n}\n`,
    },
  ],
  cpp: [
    {
      title: "Fast I/O & Template",
      desc: "Competitive programming fast I/O setup",
      code: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    cout << "C++ Engine Ready\\n";\n    return 0;\n}\n`,
    },
    {
      title: "Binary Search (Lower Bound)",
      desc: "O(log n) lower bound search in sorted vector",
      code: `int binary_search_idx(const vector<int>& arr, int target) {\n    int l = 0, r = arr.size() - 1;\n    while (l <= r) {\n        int mid = l + (r - l) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) l = mid + 1;\n        else r = mid - 1;\n    }\n    return -1;\n}\n`,
    },
    {
      title: "Breadth-First Search (BFS)",
      desc: "Queue-based graph traversal template",
      code: `void bfs(int start, const vector<vector<int>>& adj, int n) {\n    vector<bool> visited(n, false);\n    queue<int> q;\n    visited[start] = true;\n    q.push(start);\n    while (!q.empty()) {\n        int u = q.front(); q.pop();\n        for (int v : adj[u]) {\n            if (!visited[v]) {\n                visited[v] = true;\n                q.push(v);\n            }\n        }\n    }\n}\n`,
    },
  ],
};

// Built-in AI Complexity & Code Diagnostics Generator
const analyzeCodeWithAi = (codeString, lang) => {
  if (!codeString || codeString.trim().length === 0) {
    return {
      explanation: "No code provided to analyze.",
      timeComplexity: "O(1)",
      spaceComplexity: "O(1)",
      optimizations: ["Write starter logic to begin algorithmic evaluation."],
      edgeCases: ["Empty input array", "Null / None pointer checks"],
    };
  }

  const forLoops = (codeString.match(/\bfor\b/g) || []).length;
  const whileLoops = (codeString.match(/\bwhile\b/g) || []).length;
  const totalLoops = forLoops + whileLoops;
  const hasRecursion = Boolean(codeString.includes("return") && (codeString.match(/def\s+(\w+)[\s\S]*?\1\s*\(/) || codeString.match(/function\s+(\w+)[\s\S]*?\1\s*\(/)));
  const hasNestedLoops = /for[\s\S]*?for|while[\s\S]*?while|for[\s\S]*?while|while[\s\S]*?for/.test(codeString);

  let timeComp = "O(1)";
  if (hasNestedLoops) {
    timeComp = "O(n²)";
  } else if (totalLoops > 0) {
    timeComp = "O(n)";
  } else if (hasRecursion) {
    timeComp = "O(2ⁿ) or O(n) with memoization";
  }

  const hasHash = /set\(|dict\(|\{|\bMap\b|\bSet\b|HashMap|HashSet|unordered_map/.test(codeString);
  const hasArrayAlloc = /\[.*?\]|new\s+int|vector<|new\s+Array/.test(codeString);
  let spaceComp = "O(1)";
  if (hasHash || hasArrayAlloc) {
    spaceComp = "O(n) auxiliary memory";
  }

  const optimizations = [];
  if (hasNestedLoops) {
    optimizations.push("Consider replacing nested iteration with a Hash Map or Two-Pointer technique to reduce runtime from O(n²) to O(n).");
  }
  if (!hasHash && totalLoops > 1) {
    optimizations.push("Use a Set or Map for O(1) membership lookups instead of repeated linear scans.");
  }
  if (hasRecursion) {
    optimizations.push("Add memoization (@lru_cache or memo array) to prevent redundant subproblem recalculations.");
  }
  if (optimizations.length === 0) {
    optimizations.push("Algorithm appears streamlined with linear single-pass structure.");
    optimizations.push("Ensure boundary conditions prevent overflow for large constraints.");
  }

  const edgeCases = [
    "Zero or empty input array / string",
    "Single element collection (len == 1)",
    "Duplicate or negative numeric values",
    "Extreme boundary scale (e.g. n >= 10⁵)",
  ];

  return {
    explanation: `This ${lang.toUpperCase()} solution implements an algorithmic routine utilizing ${totalLoops} iteration construct(s). ${
      hasNestedLoops ? "Nested loops detect quadratic complexity operations." : "Single-pass or direct branching preserves optimal runtime."
    }`,
    timeComplexity: timeComp,
    spaceComplexity: spaceComp,
    optimizations,
    edgeCases,
  };
};

// Authentic programming language icon component
function RealLanguageLogo({ lang, size = 14 }) {
  const l = (lang || "").toLowerCase().trim();
  if (l.includes("py")) {
    return <SiPython size={size} color="#38bdf8" style={{ verticalAlign: "middle" }} />;
  }
  if (l.includes("script") || l === "js" || l === "node") {
    return <SiJavascript size={size} color="#facc15" style={{ verticalAlign: "middle" }} />;
  }
  if (l.includes("java")) {
    return <SiOpenjdk size={size} color="#f87171" style={{ verticalAlign: "middle" }} />;
  }
  if (l.includes("c++") || l === "cpp") {
    return <SiCplusplus size={size} color="#60a5fa" style={{ verticalAlign: "middle" }} />;
  }
  if (l === "c") {
    return <SiC size={size} color="#94a3b8" style={{ verticalAlign: "middle" }} />;
  }
  return <LuFileCode size={size} color="#60a5fa" style={{ verticalAlign: "middle" }} />;
}

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

  // Blank commented placeholder or starter code map
  const isPlayground = Boolean(questionId?.startsWith("playground-") || problemData?.id?.startsWith("playground-"));

  const getStarterPlaceholder = (lang) => {
    const l = normalizeLang(lang);
    if (starterCodeMap && starterCodeMap[l]) {
      return starterCodeMap[l];
    }
    if (problemData?.starterCode && problemData.starterCode[l]) {
      return problemData.starterCode[l];
    }
    if (l === "python") {
      return "# Enter your code below\n";
    }
    return "// Enter your code below\n";
  };

  const [code, setCode] = useState(
    initialDraft || getStarterPlaceholder(normalizeLang(defaultLanguage))
  );

  useEffect(() => {
    if (defaultLanguage) {
      const norm = normalizeLang(defaultLanguage);
      setSelectedLang(norm);
      if (!initialDraft || initialDraft === "# Enter your code below\n" || initialDraft === "// Enter your code below\n") {
        setCode(getStarterPlaceholder(norm));
      }
    }
  }, [defaultLanguage]);

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

  // Authenticated user ID resolution for strict workspace state isolation
  const currentUserId = useMemo(() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        return u._id || u.id || u.userId || "guest";
      }
    } catch {}
    return "guest";
  }, []);

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

  // Actual test cases: exactly 10 test cases; for playground, all 10 are visible with real inputs and expected outputs
  const effectiveTestCases = useMemo(() => {
    const list = (testCases && testCases.length > 0) ? testCases : (problemData?.testCases || []);
    return list.map((tc, idx) => ({
      index: idx + 1,
      input: (!isPlayground && (tc.isHidden || idx >= 3)) ? `[Hidden Test Case #${idx + 1}]` : tc.input,
      expectedOutput: (!isPlayground && (tc.isHidden || idx >= 3)) ? `[Hidden Output #${idx + 1}]` : tc.expectedOutput,
      isHidden: isPlayground ? false : (!!tc.isHidden || idx >= 3),
      passed: null,
      actualOutput: "",
      duration: 0,
      error: null,
    }));
  }, [questionId, testCases, problemData, isPlayground]);

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

  // Real-time test cases validation in Interactive MZ-ASM Playground
  useEffect(() => {
    if (!isPlayground) return;
    if (!code || code.trim().length < 10) return;
    const timer = setTimeout(() => {
      const qId = questionId || problemData?.id;
      if (!qId) return;
      const token = localStorage.getItem("token");
      fetch(`${API_BASE}/api/coding/challenges/${qId}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          language: selectedLang,
          code,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((res) => {
          if (res && Array.isArray(res.results) && res.results.length > 0) {
            let pCount = 0;
            setAllTestCases((prev) => {
              const base = prev.length > 0 ? prev : (effectiveTestCases.length > 0 ? effectiveTestCases : Array.from({ length: res.results.length }));
              const copy = [...base];
              res.results.forEach((r, idx) => {
                if (copy[idx]) {
                  const isPassed = !!r.passed;
                  if (isPassed) pCount++;
                  copy[idx] = {
                    ...(copy[idx] || {}),
                    index: idx + 1,
                    passed: isPassed,
                    actualOutput: r.actual || r.actualOutput || (isPassed ? (r.expected || r.expectedOutput) : "[No Output]"),
                    duration: r.duration || r.durationMs || 25,
                    error: r.error || null,
                    input: r.input || copy[idx].input,
                    expectedOutput: r.expected || r.expectedOutput || copy[idx].expectedOutput,
                    isHidden: false,
                  };
                }
              });
              return copy;
            });
            setPassedCount(pCount);
            setHasEvaluated(true);
          }
        })
        .catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [code, selectedLang, isPlayground, questionId, problemData, effectiveTestCases]);

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
    if (activeEditorFile === "solution") {
      setCode(newVal || "");
      codeRef.current = newVal || "";
      if (hasEvaluated) {
        setIsCodeModifiedAfterEval(true);
      }
      const sid = proctoredSessionId || routeSessionId;
      if (newVal) {
        try {
          if (currentUserId && currentUserId !== "guest") {
            localStorage.setItem(`mz_${currentUserId}_recent_submitted_code`, newVal);
            if (sid) {
              localStorage.setItem(`mz_${currentUserId}_draft_${sid}`, newVal);
            }
            if (questionId) {
              localStorage.setItem(`mz_${currentUserId}_draft_${questionId}`, newVal);
            }
          }
          localStorage.setItem("mz_recent_submitted_code", newVal);
          if (sid) {
            localStorage.setItem(`mz_draft_${sid}`, newVal);
          }
          if (questionId) {
            localStorage.setItem(`mz_draft_${questionId}`, newVal);
          }
        } catch {}
      }
    } else if (activeEditorFile === "input") {
      setCustomStdin(newVal || "");
    } else if (activeEditorFile === "scratchpad") {
      setScratchpadContent(newVal || "");
    }
  };

  // Custom STDIN in Run tab
  const [customStdin, setCustomStdin] = useState("");
  const [customOutput, setCustomOutput] = useState("");
  const [customError, setCustomError] = useState("");
  const [customDuration, setCustomDuration] = useState(null);

  // VS Code Real IDE States
  const [editorTheme, setEditorTheme] = useState(() => {
    return localStorage.getItem("mz_editor_theme") || "vs-dark";
  });
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [activeVsCodeSidebar, setActiveVsCodeSidebar] = useState("explorer"); // "explorer" | "search" | "snippets" | "ai" | "settings" | "shortcuts" | null
  const [activeEditorFile, setActiveEditorFile] = useState("solution"); // "solution" | "input" | "scratchpad"
  const [scratchpadContent, setScratchpadContent] = useState(
    "# Candidate Notes & Algorithmic Blueprint\n\n- Primary Objective: Build high-performance solution\n- Target Time Complexity: O(n)\n- Edge cases considered:\n  * Null or empty parameters\n  * Extreme range constraints\n"
  );
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);
  const [isWordWrap, setIsWordWrap] = useState(true);
  const [tabSize, setTabSize] = useState(4);
  const [lineNumbersMode, setLineNumbersMode] = useState("on");
  const [bracketPairColorization, setBracketPairColorization] = useState(true);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [selectionLength, setSelectionLength] = useState(0);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [bottomPanelTab, setBottomPanelTab] = useState("testcases"); // "terminal" | "output" | "testcases" | "problems" | "hints" | "ai"
  const [isBottomPanelMaximized, setIsBottomPanelMaximized] = useState(false);

  // Search & Replace states
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [matchRegex, setMatchRegex] = useState(false);
  const [searchResultsCount, setSearchResultsCount] = useState(0);

  // AI Copilot state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // References for Monaco editor
  const editorInstanceRef = useRef(null);
  const monacoInstanceRef = useRef(null);

  const getActiveFileName = (fileType, lang) => {
    if (fileType === "input") return "input.txt";
    if (fileType === "scratchpad") return "scratchpad.md";
    const l = (lang || "").toLowerCase();
    if (l === "python" || l === "py") return "solution.py";
    if (l === "javascript" || l === "js" || l === "node") return "solution.js";
    if (l === "java") return "Solution.java";
    if (l === "cpp" || l === "c++") return "main.cpp";
    return "solution.py";
  };

  const handleSelectTheme = (themeId) => {
    setEditorTheme(themeId);
    localStorage.setItem("mz_editor_theme", themeId);
    setIsThemeDropdownOpen(false);
    toast.success(`Theme switched to ${VSCODE_THEMES.find((t) => t.id === themeId)?.label || themeId}`);
  };

  const handleEditorBeforeMount = (monaco) => {
    monaco.editor.defineTheme("one-dark-pro", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "5c6370", fontStyle: "italic" },
        { token: "keyword", foreground: "c678dd" },
        { token: "string", foreground: "98c379" },
        { token: "number", foreground: "d19a66" },
        { token: "type", foreground: "e5c07b" },
        { token: "function", foreground: "61afef" },
      ],
      colors: {
        "editor.background": "#282c34",
        "editor.foreground": "#abb2bf",
        "editorCursor.foreground": "#528bff",
        "editor.lineHighlightBackground": "#2c313a",
        "editorLineNumber.foreground": "#4b5263",
        "editor.selectionBackground": "#3e4451",
      },
    });

    monaco.editor.defineTheme("dracula", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6272a4", fontStyle: "italic" },
        { token: "keyword", foreground: "ff79c6" },
        { token: "string", foreground: "f1fa8c" },
        { token: "number", foreground: "bd93f9" },
        { token: "type", foreground: "8be9fd" },
        { token: "function", foreground: "50fa7b" },
      ],
      colors: {
        "editor.background": "#282a36",
        "editor.foreground": "#f8f8f2",
        "editorCursor.foreground": "#f8f8f0",
        "editor.lineHighlightBackground": "#44475a",
        "editorLineNumber.foreground": "#6272a4",
        "editor.selectionBackground": "#44475a",
      },
    });

    monaco.editor.defineTheme("monokai", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "75715e" },
        { token: "keyword", foreground: "f92672" },
        { token: "string", foreground: "e6db74" },
        { token: "number", foreground: "ae81ff" },
        { token: "type", foreground: "66d9ef" },
        { token: "function", foreground: "a6e22e" },
      ],
      colors: {
        "editor.background": "#272822",
        "editor.foreground": "#f8f8f2",
        "editorCursor.foreground": "#f8f8f0",
        "editor.lineHighlightBackground": "#3e3d32",
        "editorLineNumber.foreground": "#90908a",
        "editor.selectionBackground": "#49483e",
      },
    });

    monaco.editor.defineTheme("github-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "8b949e" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "string", foreground: "a5d6ff" },
        { token: "number", foreground: "79c0ff" },
        { token: "type", foreground: "ffa657" },
        { token: "function", foreground: "d2a8ff" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#c9d1d9",
        "editorCursor.foreground": "#58a6ff",
        "editor.lineHighlightBackground": "#161b22",
        "editorLineNumber.foreground": "#6e7681",
        "editor.selectionBackground": "#264f78",
      },
    });
  };

  const handleEditorMount = (editor, monaco) => {
    editorInstanceRef.current = editor;
    monacoInstanceRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });

    editor.onDidChangeCursorSelection((e) => {
      const model = editor.getModel();
      if (model) {
        const text = model.getValueInRange(e.selection);
        setSelectionLength(text.length);
      }
    });

    // Hotkey: Ctrl+Enter or Cmd+Enter to Run Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });

    // Hotkey: Shift+Alt+F to format document
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
      handleFormatDocument();
    });

    // Hotkey: Ctrl+S or Cmd+S to Save Draft
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleFormatDocument = () => {
    if (!editorInstanceRef.current) return;
    const editor = editorInstanceRef.current;
    const formatAction = editor.getAction("editor.action.formatDocument");
    if (formatAction && typeof formatAction.run === "function") {
      formatAction.run();
    }
    try {
      const val = editor.getValue();
      if (selectedLang === "python") {
        const lines = val.split("\n").map((l) => l.replace(/\s+$/, ""));
        editor.setValue(lines.join("\n"));
      }
      toast.success("Document formatted (Prettier / Beautifier)");
    } catch {
      toast.info("Document formatted");
    }
  };

  const handleCopyCode = () => {
    const activeText =
      activeEditorFile === "solution"
        ? code
        : activeEditorFile === "input"
        ? customStdin
        : scratchpadContent;
    navigator.clipboard.writeText(activeText);
    toast.success(`Copied ${getActiveFileName(activeEditorFile, selectedLang)} to clipboard!`);
  };

  const handleDownloadFile = () => {
    const fileName = getActiveFileName(activeEditorFile, selectedLang);
    const content =
      activeEditorFile === "solution"
        ? code
        : activeEditorFile === "input"
        ? customStdin
        : scratchpadContent;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a);
    toast.success(`Downloaded ${fileName}`);
  };

  const handleInsertSnippet = (snippetCode) => {
    if (!editorInstanceRef.current) return;
    const editor = editorInstanceRef.current;
    const position = editor.getPosition();
    if (position && monacoInstanceRef.current) {
      editor.executeEdits("snippet-insert", [
        {
          range: new monacoInstanceRef.current.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          text: snippetCode + "\n",
          forceMoveMarkers: true,
        },
      ]);
      editor.focus();
    } else {
      setCode((prev) => prev + "\n" + snippetCode);
    }
    toast.success("Snippet inserted into code");
  };

  const handleSearchCode = (query) => {
    setSearchQuery(query);
    if (!editorInstanceRef.current || !monacoInstanceRef.current || !query) {
      setSearchResultsCount(0);
      return;
    }
    const model = editorInstanceRef.current.getModel();
    if (model) {
      const matches = model.findMatches(query, false, matchRegex, matchCase, matchWholeWord ? " " : null, false);
      setSearchResultsCount(matches.length);
    }
  };

  const handleReplaceCode = (isAll = false) => {
    if (!editorInstanceRef.current || !searchQuery) return;
    const editor = editorInstanceRef.current;
    const model = editor.getModel();
    if (!model) return;
    const matches = model.findMatches(searchQuery, false, matchRegex, matchCase, matchWholeWord ? " " : null, false);
    if (matches.length === 0) {
      toast.info("No matches found to replace");
      return;
    }
    if (isAll) {
      const edits = matches.map((m) => ({
        range: m.range,
        text: replaceQuery,
        forceMoveMarkers: true,
      }));
      editor.executeEdits("replace-all", edits);
      toast.success(`Replaced ${matches.length} occurrence(s)`);
      setSearchResultsCount(0);
    } else {
      const first = matches[0];
      editor.executeEdits("replace-one", [
        { range: first.range, text: replaceQuery, forceMoveMarkers: true },
      ]);
      toast.success("Replaced 1 occurrence");
      handleSearchCode(searchQuery);
    }
  };

  const handleRunAiAnalysis = () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      const analysis = analyzeCodeWithAi(code, selectedLang);
      setAiAnalysis(analysis);
      setIsAiAnalyzing(false);
      setBottomPanelTab("ai");
      setIsDrawerOpen(true);
      toast.success("AI Code Diagnostics & Complexity Report Generated!");
    }, 350);
  };

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
    initialProctoringStage || (effectiveSessionId ? "active" : (isProctored && !isPlayground ? "gate" : "active"))
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

  // Lock browser back / horizontal trackpad swipe navigation during active proctored assessment
  useNavigationLock(
    isProctored && proctoringStage === "active" && !isSubmittedReadOnly && !isSubmitting && !isTerminated,
    "An active proctored assessment is in progress. Leaving this page will trigger an assessment violation. Are you sure you want to exit?"
  );

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
        // Restore saved draft code and compiler state seamlessly strictly scoped to user
        const savedDraft =
          (currentUserId && currentUserId !== "guest" && localStorage.getItem(`mz_${currentUserId}_draft_${targetSid}`)) ||
          localStorage.getItem(`mz_draft_${targetSid}`);
        if (savedDraft) setCode(savedDraft);
        const savedLang =
          (currentUserId && currentUserId !== "guest" && localStorage.getItem(`mz_${currentUserId}_lang_${targetSid}`)) ||
          localStorage.getItem(`mz_lang_${targetSid}`);
        if (savedLang) setSelectedLang(savedLang);
        const savedTime =
          (currentUserId && currentUserId !== "guest" && localStorage.getItem(`mz_${currentUserId}_time_${targetSid}`)) ||
          localStorage.getItem(`mz_time_${targetSid}`);
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
          if (currentUserId && currentUserId !== "guest") {
            localStorage.setItem(`mz_${currentUserId}_draft_${sid}`, code);
            localStorage.setItem(`mz_${currentUserId}_lang_${sid}`, selectedLang);
            localStorage.setItem(`mz_${currentUserId}_time_${sid}`, String(secondsRemaining));
          }
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
      if (currentUserId && currentUserId !== "guest") {
        localStorage.removeItem(`mz_${currentUserId}_draft_${questionId}_${selectedLang}`);
        localStorage.removeItem(`mz_${currentUserId}_ch_draft_${questionId}_${selectedLang}`);
        localStorage.removeItem(`mz_${currentUserId}_draft_${questionId}`);
      }
      localStorage.removeItem(`mz_draft_${questionId}_${selectedLang}`);
      localStorage.removeItem(`mz_ch_draft_${questionId}_${selectedLang}`);
      localStorage.removeItem(`mz_draft_${questionId}`);
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
    setBottomPanelTab("terminal");

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
          const base = prev.length > 0 ? prev : (effectiveTestCases.length > 0 ? effectiveTestCases : Array.from({ length: res.results.length }));
          const copy = [...base];
          let pCount = 0;
          res.results.forEach((r, idx) => {
            if (copy[idx]) {
              const isPassed = !!r.passed;
              if (isPassed) pCount++;
              copy[idx] = {
                ...(copy[idx] || {}),
                index: idx + 1,
                passed: isPassed,
                actualOutput: r.actual || r.actualOutput || (isPassed ? (r.expected || r.expectedOutput) : "[No Output]"),
                duration: r.duration || r.durationMs || 0,
                error: r.error || null,
                input: r.input || copy[idx].input,
                expectedOutput: r.expected || r.expectedOutput || copy[idx].expectedOutput,
                isHidden: isPlayground ? false : (copy[idx].isHidden !== undefined ? copy[idx].isHidden : idx >= 3),
              };
            }
          });
          setPassedCount(pCount);
          setHasEvaluated(true);
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
    setBottomPanelTab("testcases");
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

      const resultsArray = result?.results || result?.testResults || [];
      let pCount = 0;

      setAllTestCases((prev) => {
        const base = prev.length > 0
          ? prev
          : (effectiveTestCases.length > 0 ? effectiveTestCases : (resultsArray.length > 0 ? Array.from({ length: resultsArray.length }) : Array.from({ length: 10 })));
        const updated = [...base];
        for (let i = 0; i < updated.length; i++) {
          const r = resultsArray[i];
          if (r) {
            const isPassed = Boolean(r.passed === true || r.passed === "true" || r.passed === 1 || r.status === "PASSED" || r.status === "ACCEPTED");
            if (isPassed) pCount++;
            updated[i] = {
              ...(updated[i] || {}),
              index: i + 1,
              passed: isPassed,
              actualOutput: r.actual || r.actualOutput || (isPassed ? "[Passed]" : "[Failed Output]"),
              duration: r.duration || r.durationMs || 35,
              error: isPassed ? null : (r.error || null),
              input: r.input || updated[i]?.input || `Test Case #${i + 1}`,
              expectedOutput: r.expected || r.expectedOutput || updated[i]?.expectedOutput || "Expected Output",
              isHidden: r.isHidden !== undefined ? r.isHidden : (updated[i]?.isHidden !== undefined ? updated[i].isHidden : i >= 3),
            };
          } else if (result?.passedCount === (base.length || 10) || result?.status === "ACCEPTED" || result?.status === "PASSED" || result?.allPassed) {
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
            // Unexecuted case in sample run remains neutral (passed: null), not falsely marked failed!
            updated[i] = {
              ...(updated[i] || {}),
              index: i + 1,
              passed: null,
              actualOutput: "[Awaiting Full Evaluation]",
              duration: 0,
              error: null,
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

      const resultsArray = Array.isArray(result?.results)
        ? result.results
        : Array.isArray(result?.testResults)
        ? result.testResults
        : [];
      let pCount = 0;

      const baseCases = (allTestCases && allTestCases.length > 0)
        ? allTestCases
        : (effectiveTestCases && effectiveTestCases.length > 0)
          ? effectiveTestCases
          : (resultsArray.length > 0 ? Array.from({ length: resultsArray.length }) : Array.from({ length: 10 }));

      const updatedCases = baseCases.map((tc, i) => {
        const r = resultsArray[i];
        if (r) {
          const isPassed = Boolean(r.passed === true || r.passed === "true" || r.passed === 1 || r.status === "PASSED" || r.status === "ACCEPTED");
          if (isPassed) pCount++;
          return {
            ...(tc || {}),
            index: i + 1,
            passed: isPassed,
            actualOutput: r.actual || r.actualOutput || (isPassed ? "[Passed]" : "[Failed Output]"),
            duration: r.duration || r.durationMs || 35,
            error: isPassed ? null : (r.error || null),
            input: r.input || tc?.input || `Test Case #${i + 1}`,
            expectedOutput: r.expected || r.expectedOutput || tc?.expectedOutput || "Expected Output",
            isHidden: r.isHidden !== undefined ? r.isHidden : (tc?.isHidden !== undefined ? tc.isHidden : i >= 3),
          };
        } else if (result?.passedCount === baseCases.length || result?.status === "ACCEPTED" || result?.status === "PASSED" || result?.allPassed || result?.isSolved) {
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
            error: "Test case did not pass",
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
        const rawUser = localStorage.getItem("user");
        let uId = "";
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          uId = parsed._id || parsed.id || parsed.userId || "";
        }
        const reportsKey = uId ? `mz_${uId}_assessment_reports` : "mz_assessment_reports";
        const stored = JSON.parse(localStorage.getItem(reportsKey) || "[]");
        const filtered = stored.filter((r) => r.sessionId !== reportItem.sessionId);
        localStorage.setItem(reportsKey, JSON.stringify([reportItem, ...filtered]));
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
  if (isProctored && !isPlayground && proctoringStage === "gate" && !routeSessionId) {
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
        <div className={`mz-compiler-container ${!isEmbedded && isProctored && proctoringStage === "active" && !isSubmittedReadOnly ? "has-proctoring" : ""}`}>
          {/* Dedicated Left Proctoring Panel (suppressed when embedded inside parent exam workspace) */}
          {!isEmbedded && isProctored && proctoringStage === "active" && !isSubmittedReadOnly && (
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

          {/* SECTION B: COMPILER WORKSPACE CARD (VS CODE PLAYGROUND SUITE) */}
          <section
            className={`mz-compiler-editor-card mz-vscode-card ${
              editorTheme === "vs" ? "is-light" : "is-dark"
            } ${isEditorFullscreen ? "is-fullscreen" : ""} ${
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
            {/* 1. VS CODE TABS BAR */}
            <div className="mz-vscode-tabs-bar">
              <div className="mz-vscode-tab-list">
                {/* File Tab: Solution */}
                <div
                  className={`mz-vscode-tab ${activeEditorFile === "solution" ? "active" : ""}`}
                  onClick={() => setActiveEditorFile("solution")}
                  title={`Active Code (${selectedLang})`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <RealLanguageLogo lang={selectedLang} size={15} />
                  <span>{getActiveFileName("solution", selectedLang)}</span>
                  {isCodeModifiedAfterEval && <span className="mz-vscode-tab-dot" title="Unsaved / Modified" />}
                </div>

                {/* File Tab: Custom STDIN Input */}
                <div
                  className={`mz-vscode-tab ${activeEditorFile === "input" ? "active" : ""}`}
                  onClick={() => setActiveEditorFile("input")}
                  title="Custom Input STDIN buffer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <LuTerminal size={14} color="#38bdf8" />
                  <span>input.txt</span>
                </div>

                {/* File Tab: Scratchpad */}
                <div
                  className={`mz-vscode-tab ${activeEditorFile === "scratchpad" ? "active" : ""}`}
                  onClick={() => setActiveEditorFile("scratchpad")}
                  title="Candidate Scratchpad Notes"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <LuFileText size={14} color="#a78bfa" />
                  <span>scratchpad.md</span>
                </div>

                <button
                  type="button"
                  className="mz-vscode-tab-add"
                  onClick={() => setActiveEditorFile("scratchpad")}
                  title="Open Notes / Scratchpad"
                >
                  <LuPlus size={14} />
                </button>
              </div>

              {/* Top Right Actions Toolbar */}
              <div className="mz-vscode-tabs-actions">
                {/* Run Solution Button */}
                <button
                  type="button"
                  className="mz-vscode-action-btn mz-vscode-btn-run"
                  onClick={handleRun}
                  disabled={isRunning || isSubmitting}
                  title="Run Program (Ctrl+Enter / Cmd+Enter)"
                >
                  <LuPlay size={13} fill="currentColor" />
                  <span>{isRunning ? "Running..." : "Run"}</span>
                </button>

                {/* Format Document (Prettier / Beautifier) */}
                <button
                  type="button"
                  className="mz-vscode-action-btn"
                  onClick={handleFormatDocument}
                  title="Format Document (Shift+Alt+F)"
                >
                  <VscWand size={14} />
                  <span>Format</span>
                </button>

                {/* Copy Code */}
                <button
                  type="button"
                  className="mz-vscode-action-btn"
                  onClick={handleCopyCode}
                  title="Copy current file code"
                >
                  <VscCopy size={13} />
                  <span>Copy</span>
                </button>

                {/* Download File */}
                <button
                  type="button"
                  className="mz-vscode-action-btn"
                  onClick={handleDownloadFile}
                  title="Download file to computer"
                >
                  <VscCloudDownload size={14} />
                  <span>Export</span>
                </button>

                {/* Theme Selector Popover */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="mz-vscode-action-btn"
                    onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                    title="Change MasteryZone Editor Theme"
                  >
                    <span>{VSCODE_THEMES.find((t) => t.id === editorTheme)?.label || "Theme"}</span>
                    <LuChevronDown size={12} />
                  </button>

                  {isThemeDropdownOpen && (
                    <div className="mz-vscode-theme-dropdown">
                      {VSCODE_THEMES.map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          className={`mz-vscode-theme-item ${editorTheme === th.id ? "active" : ""}`}
                          onClick={() => handleSelectTheme(th.id)}
                        >
                          <span>{th.label}</span>
                          {editorTheme === th.id && <LuCheck size={12} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reset Template */}
                <button
                  type="button"
                  className="mz-vscode-action-btn"
                  onClick={handleResetCode}
                  title="Reset starter template"
                  disabled={isTimeExpired}
                >
                  <LuRotateCcw size={13} />
                  <span>Reset</span>
                </button>

                {/* Fullscreen IDE Toggle */}
                <button
                  type="button"
                  className="mz-vscode-action-btn"
                  onClick={() => setIsEditorFullscreen(!isEditorFullscreen)}
                  title={isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen Playground"}
                >
                  {isEditorFullscreen ? <LuMinimize2 size={13} /> : <LuMaximize2 size={13} />}
                </button>
              </div>
            </div>

            {/* 2. VS CODE BREADCRUMBS BAR */}
            <div className="mz-vscode-breadcrumbs">
              <div className="mz-vscode-breadcrumbs-path">
                <span>masteryzone</span>
                <span>&gt;</span>
                <span>workspace</span>
                <span>&gt;</span>
                <span>src</span>
                <span>&gt;</span>
                <strong style={{ color: editorTheme === "vs" ? "#0f172a" : "#ffffff" }}>
                  {getActiveFileName(activeEditorFile, selectedLang)}
                </strong>
              </div>

              <div className="mz-vscode-breadcrumbs-right">
                {/* Language Mode Selector */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="mz-vscode-pill-toggle active"
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    style={{ background: "transparent", border: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <RealLanguageLogo lang={selectedLang} size={14} />
                    <span>{langLabels[selectedLang] || "Language"}</span>
                    <LuChevronDown size={11} />
                  </button>

                  {isLangMenuOpen && (
                    <div className="mz-compiler-dropdown-menu" style={{ right: 0, left: "auto" }}>
                      {Object.entries(langLabels).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          className={`mz-compiler-dropdown-item ${selectedLang === key ? "active" : ""}`}
                          onClick={() => handleSelectLanguage(key)}
                          style={{ display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <RealLanguageLogo lang={key} size={15} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Minimap Toggle */}
                <button
                  type="button"
                  className={`mz-vscode-pill-toggle ${isMinimapOpen ? "active" : ""}`}
                  onClick={() => setIsMinimapOpen(!isMinimapOpen)}
                  style={{ background: "transparent", border: "none" }}
                  title="Toggle Minimap"
                >
                  <LuLayers size={13} />
                  <span>Minimap: {isMinimapOpen ? "On" : "Off"}</span>
                </button>

                {/* Word Wrap Toggle */}
                <button
                  type="button"
                  className={`mz-vscode-pill-toggle ${isWordWrap ? "active" : ""}`}
                  onClick={() => setIsWordWrap(!isWordWrap)}
                  style={{ background: "transparent", border: "none" }}
                  title="Toggle Word Wrap (Alt+Z)"
                >
                  <LuWrapText size={13} />
                  <span>Wrap: {isWordWrap ? "On" : "Off"}</span>
                </button>
              </div>
            </div>

            {/* 3. MAIN VS CODE WORKSPACE (ACTIVITY BAR + SIDEBAR + MONACO) */}
            <div className="mz-vscode-workspace">
              {/* Activity Bar (48px left vertical icon strip) */}
              <div className="mz-vscode-activity-bar">
                <button
                  type="button"
                  className={`mz-vscode-activity-item ${activeVsCodeSidebar === "explorer" ? "active" : ""}`}
                  onClick={() => setActiveVsCodeSidebar(activeVsCodeSidebar === "explorer" ? null : "explorer")}
                  title="Explorer (Files & Tree)"
                >
                  <VscFiles size={20} />
                </button>

                <button
                  type="button"
                  className={`mz-vscode-activity-item ${activeVsCodeSidebar === "search" ? "active" : ""}`}
                  onClick={() => setActiveVsCodeSidebar(activeVsCodeSidebar === "search" ? null : "search")}
                  title="Search & Replace"
                >
                  <VscSearch size={20} />
                </button>

                <button
                  type="button"
                  className={`mz-vscode-activity-item ${activeVsCodeSidebar === "snippets" ? "active" : ""}`}
                  onClick={() => setActiveVsCodeSidebar(activeVsCodeSidebar === "snippets" ? null : "snippets")}
                  title="Algorithm Snippets & Boilerplates"
                >
                  <LuSparkles size={20} />
                </button>

                <button
                  type="button"
                  className={`mz-vscode-activity-item ${activeVsCodeSidebar === "ai" ? "active" : ""}`}
                  onClick={() => setActiveVsCodeSidebar(activeVsCodeSidebar === "ai" ? null : "ai")}
                  title="AI Code Copilot & Diagnostics"
                >
                  <VscSparkle size={20} />
                </button>

                <button
                  type="button"
                  className={`mz-vscode-activity-item ${activeVsCodeSidebar === "settings" ? "active" : ""}`}
                  onClick={() => setActiveVsCodeSidebar(activeVsCodeSidebar === "settings" ? null : "settings")}
                  title="Editor Settings & Font Size"
                >
                  <VscSettingsGear size={20} />
                </button>

                <button
                  type="button"
                  className={`mz-vscode-activity-item ${activeVsCodeSidebar === "shortcuts" ? "active" : ""}`}
                  onClick={() => setActiveVsCodeSidebar(activeVsCodeSidebar === "shortcuts" ? null : "shortcuts")}
                  title="Keyboard Shortcuts Cheat Sheet"
                >
                  <VscKey size={20} />
                </button>
              </div>

              {/* Collapsible Sidebar (250px) */}
              {activeVsCodeSidebar && (
                <div className="mz-vscode-sidebar">
                  {/* VIEW 1: EXPLORER */}
                  {activeVsCodeSidebar === "explorer" && (
                    <>
                      <div className="mz-vscode-sidebar-header">
                        <span>Explorer</span>
                        <span style={{ fontSize: "10px", color: "#858585" }}>WORKSPACE</span>
                      </div>
                      <div className="mz-vscode-sidebar-body">
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                          Open Editors
                        </div>
                        <div
                          className={`mz-vscode-file-item ${activeEditorFile === "solution" ? "active" : ""}`}
                          onClick={() => setActiveEditorFile("solution")}
                          style={{ display: "flex", alignItems: "center", gap: 6 }}
                        >
                          <RealLanguageLogo lang={selectedLang} size={14} />
                          <span>{getActiveFileName("solution", selectedLang)}</span>
                        </div>
                        <div
                          className={`mz-vscode-file-item ${activeEditorFile === "input" ? "active" : ""}`}
                          onClick={() => setActiveEditorFile("input")}
                          style={{ display: "flex", alignItems: "center", gap: 6 }}
                        >
                          <LuTerminal size={14} color="#38bdf8" />
                          <span>input.txt (Stdin)</span>
                        </div>
                        <div
                          className={`mz-vscode-file-item ${activeEditorFile === "scratchpad" ? "active" : ""}`}
                          onClick={() => setActiveEditorFile("scratchpad")}
                          style={{ display: "flex", alignItems: "center", gap: 6 }}
                        >
                          <LuFileText size={14} color="#a78bfa" />
                          <span>scratchpad.md</span>
                        </div>

                        <div style={{ marginTop: "16px", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                          Problem Info
                        </div>
                        <div style={{ padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", fontSize: "11.5px" }}>
                          <div style={{ fontWeight: 700, color: "#38bdf8", marginBottom: "4px" }}>{questionDetails.title}</div>
                          <div style={{ color: "#94a3b8" }}>Level: {questionDetails.difficulty}</div>
                          <div style={{ color: "#94a3b8" }}>Target: 80% passing</div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* VIEW 2: SEARCH & REPLACE */}
                  {activeVsCodeSidebar === "search" && (
                    <>
                      <div className="mz-vscode-sidebar-header">
                        <span>Search & Replace</span>
                        {searchResultsCount > 0 && <span style={{ color: "#38bdf8" }}>{searchResultsCount} found</span>}
                      </div>
                      <div className="mz-vscode-sidebar-body">
                        <div className="mz-vscode-search-box">
                          <input
                            type="text"
                            className="mz-vscode-search-input"
                            placeholder="Find in current buffer..."
                            value={searchQuery}
                            onChange={(e) => handleSearchCode(e.target.value)}
                          />
                          <input
                            type="text"
                            className="mz-vscode-search-input"
                            placeholder="Replace with..."
                            value={replaceQuery}
                            onChange={(e) => setReplaceQuery(e.target.value)}
                          />
                          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                            <button
                              type="button"
                              className="mz-vscode-snippet-btn"
                              onClick={() => handleReplaceCode(false)}
                              disabled={!searchQuery}
                            >
                              Replace Next
                            </button>
                            <button
                              type="button"
                              className="mz-vscode-snippet-btn"
                              onClick={() => handleReplaceCode(true)}
                              disabled={!searchQuery}
                              style={{ background: "#475569" }}
                            >
                              Replace All
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* VIEW 3: ALGORITHM SNIPPETS */}
                  {activeVsCodeSidebar === "snippets" && (
                    <>
                      <div className="mz-vscode-sidebar-header">
                        <span>Algorithms & Snippets</span>
                        <span style={{ fontSize: "10px", color: "#38bdf8" }}>{selectedLang.toUpperCase()}</span>
                      </div>
                      <div className="mz-vscode-sidebar-body">
                        {(ALGORITHM_SNIPPETS[selectedLang] || ALGORITHM_SNIPPETS.python).map((snip, idx) => (
                          <div key={idx} className="mz-vscode-snippet-card">
                            <span className="mz-vscode-snippet-title">{snip.title}</span>
                            <span className="mz-vscode-snippet-desc">{snip.desc}</span>
                            <button
                              type="button"
                              className="mz-vscode-snippet-btn"
                              onClick={() => handleInsertSnippet(snip.code)}
                            >
                              + Insert Code
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* VIEW 4: AI COPILOT */}
                  {activeVsCodeSidebar === "ai" && (
                    <>
                      <div className="mz-vscode-sidebar-header">
                        <span>AI Code Copilot</span>
                        <span style={{ fontSize: "10px", color: "#10b981" }}>DIAGNOSTICS</span>
                      </div>
                      <div className="mz-vscode-sidebar-body">
                        <button
                          type="button"
                          className="mz-vscode-snippet-btn"
                          onClick={handleRunAiAnalysis}
                          disabled={isAiAnalyzing}
                          style={{ width: "100%", padding: "7px 10px", background: "#8b5cf6" }}
                        >
                          {isAiAnalyzing ? "Evaluating AST & Loops..." : "⚡ Analyze Code & Complexity"}
                        </button>

                        {aiAnalysis && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                            <div style={{ padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>
                              <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "11px" }}>TIME COMPLEXITY</div>
                              <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", fontFamily: "monospace" }}>
                                {aiAnalysis.timeComplexity}
                              </div>
                            </div>

                            <div style={{ padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>
                              <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "11px" }}>SPACE COMPLEXITY</div>
                              <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", fontFamily: "monospace" }}>
                                {aiAnalysis.spaceComplexity}
                              </div>
                            </div>

                            <div style={{ fontSize: "11.5px", color: "#cbd5e1", lineHeight: "1.4" }}>
                              {aiAnalysis.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* VIEW 5: SETTINGS */}
                  {activeVsCodeSidebar === "settings" && (
                    <>
                      <div className="mz-vscode-sidebar-header">
                        <span>Editor Settings</span>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>PREFERENCES</span>
                      </div>
                      <div className="mz-vscode-sidebar-body">
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: "6px" }}>Font Size</div>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {[12, 13, 14, 16, 18].map((sz) => (
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
                        </div>

                        <div style={{ marginTop: "12px" }}>
                          <div style={{ fontWeight: 700, marginBottom: "6px" }}>Tab Size (Spaces)</div>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {[2, 4].map((ts) => (
                              <button
                                key={ts}
                                type="button"
                                className={`mz-font-size-btn ${tabSize === ts ? "active" : ""}`}
                                onClick={() => setTabSize(ts)}
                              >
                                {ts} Spaces
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginTop: "12px" }}>
                          <div style={{ fontWeight: 700, marginBottom: "6px" }}>Line Numbers</div>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {["on", "relative", "off"].map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                className={`mz-font-size-btn ${lineNumbersMode === mode ? "active" : ""}`}
                                onClick={() => setLineNumbersMode(mode)}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginTop: "12px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={bracketPairColorization}
                              onChange={(e) => setBracketPairColorization(e.target.checked)}
                            />
                            <span>Bracket Pair Colorization</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* VIEW 6: KEYBOARD SHORTCUTS */}
                  {activeVsCodeSidebar === "shortcuts" && (
                    <>
                      <div className="mz-vscode-sidebar-header">
                        <span>Shortcuts</span>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>CHEATSHEET</span>
                      </div>
                      <div className="mz-vscode-sidebar-body">
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11.5px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Run Program</span>
                            <kbd style={{ background: "#3c3c3c", padding: "2px 5px", borderRadius: "3px" }}>Ctrl + Enter</kbd>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Format Document</span>
                            <kbd style={{ background: "#3c3c3c", padding: "2px 5px", borderRadius: "3px" }}>Shift + Alt + F</kbd>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Save Draft</span>
                            <kbd style={{ background: "#3c3c3c", padding: "2px 5px", borderRadius: "3px" }}>Ctrl + S</kbd>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Find in File</span>
                            <kbd style={{ background: "#3c3c3c", padding: "2px 5px", borderRadius: "3px" }}>Ctrl + F</kbd>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Toggle Word Wrap</span>
                            <kbd style={{ background: "#3c3c3c", padding: "2px 5px", borderRadius: "3px" }}>Alt + Z</kbd>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Monaco Code Editor Pane */}
              <div className="mz-vscode-editor-pane">
                <div className="mz-vscode-editor-inner">
                  <Editor
                    height={isEditorFullscreen ? "calc(100vh - 290px)" : "420px"}
                    language={activeEditorFile === "solution" ? selectedLang : activeEditorFile === "input" ? "plaintext" : "markdown"}
                    theme={editorTheme}
                    value={activeEditorFile === "solution" ? code : activeEditorFile === "input" ? customStdin : scratchpadContent}
                    onChange={handleCodeChange}
                    beforeMount={handleEditorBeforeMount}
                    onMount={handleEditorMount}
                    options={{
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, Menlo, Monaco, monospace",
                      fontSize: editorFontSize,
                      lineNumbers: lineNumbersMode,
                      lineNumbersMinChars: 3,
                      minimap: { enabled: isMinimapOpen },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize,
                      wordWrap: isWordWrap ? "on" : "off",
                      readOnly: isTimeExpired || isTerminated || isSubmittedReadOnly,
                      domReadOnly: isTimeExpired || isTerminated || isSubmittedReadOnly,
                      renderLineHighlight: "all",
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      bracketPairColorization: { enabled: bracketPairColorization },
                      formatOnPaste: true,
                      folding: true,
                      padding: { top: 10, bottom: 10 },
                      smoothScrolling: true,
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
              </div>
            </div>

            {/* 4. INTEGRATED TERMINAL & OUTPUT DRAWER PANEL */}
            <div className="mz-vscode-bottom-panel">
              {/* Bottom Tabs Header */}
              <div className="mz-vscode-bottom-header">
                <div className="mz-vscode-bottom-tabs">
                  <button
                    type="button"
                    className={`mz-vscode-bottom-tab ${bottomPanelTab === "terminal" ? "active" : ""}`}
                    onClick={() => {
                      setBottomPanelTab("terminal");
                      setIsDrawerOpen(true);
                    }}
                  >
                    <VscTerminal size={14} />
                    <span>Terminal / STDIN</span>
                  </button>

                  <button
                    type="button"
                    className={`mz-vscode-bottom-tab ${bottomPanelTab === "output" ? "active" : ""}`}
                    onClick={() => {
                      setBottomPanelTab("output");
                      setIsDrawerOpen(true);
                    }}
                  >
                    <LuFileCode size={14} />
                    <span>Output</span>
                  </button>

                  <button
                    type="button"
                    className={`mz-vscode-bottom-tab ${bottomPanelTab === "testcases" ? "active" : ""}`}
                    onClick={() => {
                      setBottomPanelTab("testcases");
                      setIsDrawerOpen(true);
                    }}
                  >
                    <LuPlay size={13} fill="currentColor" />
                    <span>Test Cases ({passedCount}/{allTestCases.length})</span>
                  </button>

                  <button
                    type="button"
                    className={`mz-vscode-bottom-tab ${bottomPanelTab === "problems" ? "active" : ""}`}
                    onClick={() => {
                      setBottomPanelTab("problems");
                      setIsDrawerOpen(true);
                    }}
                  >
                    <LuTriangleAlert size={14} color={customError ? "#ef4444" : "#94a3b8"} />
                    <span>Problems {customError ? "(1)" : "(0)"}</span>
                  </button>

                  <button
                    type="button"
                    className={`mz-vscode-bottom-tab ${bottomPanelTab === "hints" ? "active" : ""}`}
                    onClick={() => {
                      setBottomPanelTab("hints");
                      setIsDrawerOpen(true);
                    }}
                  >
                    <LuLightbulb size={14} />
                    <span>Hints</span>
                  </button>

                  <button
                    type="button"
                    className={`mz-vscode-bottom-tab ${bottomPanelTab === "ai" ? "active" : ""}`}
                    onClick={() => {
                      setBottomPanelTab("ai");
                      setIsDrawerOpen(true);
                    }}
                  >
                    <VscSparkle size={14} />
                    <span>AI Copilot</span>
                  </button>
                </div>

                {/* Panel Controls */}
                <div className="mz-vscode-bottom-controls">
                  <button
                    type="button"
                    className="mz-vscode-bottom-ctrl-btn"
                    onClick={() => {
                      setCustomOutput("");
                      setCustomError("");
                    }}
                    title="Clear Terminal Output"
                  >
                    <LuTrash2 size={13} />
                  </button>

                  <button
                    type="button"
                    className="mz-vscode-bottom-ctrl-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(customOutput || customError || "");
                      toast.success("Output copied to clipboard");
                    }}
                    title="Copy Output"
                  >
                    <VscCopy size={13} />
                  </button>

                  <button
                    type="button"
                    className="mz-vscode-bottom-ctrl-btn"
                    onClick={() => setIsBottomPanelMaximized(!isBottomPanelMaximized)}
                    title={isBottomPanelMaximized ? "Restore Panel Height" : "Maximize Panel"}
                  >
                    {isBottomPanelMaximized ? <LuMinimize2 size={13} /> : <LuMaximize2 size={13} />}
                  </button>

                  <button
                    type="button"
                    className="mz-vscode-bottom-ctrl-btn"
                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                    title={isDrawerOpen ? "Collapse Panel" : "Expand Panel"}
                  >
                    {isDrawerOpen ? <VscChevronDown size={14} /> : <VscChevronUp size={14} />}
                  </button>
                </div>
              </div>

              {/* Panel Body */}
              {isDrawerOpen && (
                <div className={`mz-vscode-bottom-body ${isBottomPanelMaximized ? "is-maximized" : ""}`}>
                  {/* TAB 1: TERMINAL / STDIN */}
                  {bottomPanelTab === "terminal" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>Standard Input (STDIN) Stream:</span>
                        <button
                          type="button"
                          className="mz-vscode-snippet-btn"
                          onClick={handleRun}
                          disabled={isRunning || isSubmitting}
                          style={{ background: "#10b981" }}
                        >
                          <LuPlay size={11} fill="currentColor" style={{ marginRight: "4px" }} />
                          {isRunning ? "Executing..." : "Execute with STDIN"}
                        </button>
                      </div>

                      <textarea
                        className="mz-compiler-custom-stdin-textarea"
                        placeholder="Enter custom input (passed via standard input to solution)..."
                        value={customStdin}
                        onChange={(e) => setCustomStdin(e.target.value)}
                        style={{ height: "60px", background: editorTheme === "vs" ? "#ffffff" : "#222222", color: editorTheme === "vs" ? "#0f172a" : "#e2e8f0" }}
                      />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                        <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>Terminal Execution Result:</span>
                        {customDuration !== null && (
                          <span style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "monospace" }}>
                            ⏱ Execution time: {customDuration}ms
                          </span>
                        )}
                      </div>

                      <div
                        className={`mz-compiler-io-box ${customError ? "error-box" : ""}`}
                        style={{ background: editorTheme === "vs" ? "#ffffff" : "#1a1a1a", border: "1px solid #333333" }}
                      >
                        {customOutput || (customError ? customError : "[No output produced yet. Click 'Execute with STDIN' or 'Run Solution' to execute.]")}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: OUTPUT */}
                  {bottomPanelTab === "output" && (
                    <div style={{ fontFamily: "monospace", fontSize: "12px", whiteSpace: "pre-wrap", color: editorTheme === "vs" ? "#0f172a" : "#e2e8f0" }}>
                      {customOutput || customError ? (
                        <>
                          <div style={{ color: "#94a3b8", marginBottom: "8px" }}>
                            [MasteryZone Sandboxed Runner — {selectedLang.toUpperCase()} 64-bit runtime]
                          </div>
                          {customOutput && <div>{customOutput}</div>}
                          {customError && <div style={{ color: "#ef4444", marginTop: "6px" }}>{customError}</div>}
                        </>
                      ) : (
                        <div style={{ color: "#64748b" }}>
                          [Execution output console is empty. Click Run or Run Tests to view standard output.]
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: TEST CASES */}
                  {bottomPanelTab === "testcases" && (
                    <div>
                      {/* Pass/Fail Banner */}
                      {bannerVisible && (
                        <div
                          className={`mz-compiler-pass-banner ${
                            isAllPassed || (hasEvaluated && !isCodeModifiedAfterEval && passedCount > 0 && passedCount === allTestCases.filter(t => t.passed !== null).length)
                              ? "all-passed"
                              : hasEvaluated && !isCodeModifiedAfterEval && passedCount >= Math.ceil(allTestCases.length * 0.8)
                              ? "passed"
                              : hasEvaluated && !isCodeModifiedAfterEval
                              ? "failed"
                              : "idle"
                          }`}
                          style={{ marginBottom: "12px" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {isAllPassed ? (
                              <LuSparkles size={16} />
                            ) : hasEvaluated && !isCodeModifiedAfterEval && (passedCount >= Math.ceil(allTestCases.length * 0.8) || (passedCount > 0 && passedCount === allTestCases.filter(t => t.passed !== null).length)) ? (
                              <LuCircleCheck size={16} color="#10b981" style={{ color: "#10b981" }} />
                            ) : hasEvaluated && !isCodeModifiedAfterEval ? (
                              <LuCircleX size={16} color="#ef4444" style={{ color: "#ef4444" }} />
                            ) : (
                              <LuFileCode size={16} />
                            )}
                            <span>
                              {isAllPassed
                                ? "🎉 Perfect Score! All test cases passed (100%). Solution Verified & Graded!"
                                : hasEvaluated && !isCodeModifiedAfterEval
                                ? `You have passed ${passedCount}/${allTestCases.length} tests${
                                    passedCount >= Math.ceil(allTestCases.length * 0.8) || (passedCount > 0 && passedCount === allTestCases.filter(t => t.passed !== null).length)
                                      ? " — Passing criteria satisfied (Green Verified)!"
                                      : " — Keep revising to reach 80% passing threshold!"
                                  }`
                                : "Run tests to evaluate your solution against the comprehensive test suite."}
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
                            {allTestCases.map((tc, idx) => {
                              const isTcPass = Boolean(
                                tc.passed === true ||
                                tc.passed === "true" ||
                                tc.status === "PASSED" ||
                                (isAllPassed && hasEvaluated)
                              );
                              const isTcFail = Boolean(
                                (tc.passed === false || tc.passed === "false" || tc.status === "FAILED") && !isTcPass
                              );
                              return (
                                <button
                                  key={tc.index || idx + 1}
                                  type="button"
                                  className={`mz-compiler-tc-item ${selectedCaseIndex === idx ? "active" : ""}`}
                                  onClick={() => setSelectedCaseIndex(idx)}
                                >
                                  <span>Test Case {tc.index || idx + 1}</span>
                                  <span
                                    className={`mz-compiler-status-icon ${
                                      isTcPass ? "pass" : isTcFail ? "fail" : "neutral"
                                    }`}
                                  >
                                    {isTcPass ? (
                                      <LuCircleCheck size={16} color="#10b981" style={{ color: "#10b981" }} />
                                    ) : isTcFail ? (
                                      <LuCircleX size={16} color="#ef4444" style={{ color: "#ef4444" }} />
                                    ) : (
                                      <LuCircle size={15} color="#94a3b8" style={{ color: "#94a3b8" }} />
                                    )}
                                  </span>
                                </button>
                              );
                            })}
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
                    </div>
                  )}

                  {/* TAB 4: PROBLEMS */}
                  {bottomPanelTab === "problems" && (
                    <div style={{ fontSize: "12px" }}>
                      {customError ? (
                        <div style={{ padding: "10px 14px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid #ef4444", borderRadius: "6px", color: "#fca5a5" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#ef4444", marginBottom: "4px" }}>
                            <LuTriangleAlert size={16} />
                            <span>Compilation or Runtime Diagnostic:</span>
                          </div>
                          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "11.5px" }}>
                            {customError}
                          </pre>
                        </div>
                      ) : (
                        <div style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "8px", padding: "12px 0" }}>
                          <LuCircleCheck size={16} />
                          <span>No compilation problems or syntax errors detected in workspace buffer.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: HINTS */}
                  {bottomPanelTab === "hints" && (
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

                  {/* TAB 6: AI COPILOT */}
                  {bottomPanelTab === "ai" && (
                    <div style={{ fontSize: "12.5px", color: editorTheme === "vs" ? "#0f172a" : "#e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <VscSparkle size={18} color="#a855f7" />
                          <strong>AI Algorithmic Diagnostics & Complexity Estimator</strong>
                        </div>
                        <button
                          type="button"
                          className="mz-vscode-snippet-btn"
                          onClick={handleRunAiAnalysis}
                          disabled={isAiAnalyzing}
                          style={{ background: "#8b5cf6" }}
                        >
                          {isAiAnalyzing ? "Analyzing..." : "Re-Analyze Code"}
                        </button>
                      </div>

                      {aiAnalysis ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div style={{ padding: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <div style={{ color: "#38bdf8", fontWeight: 700, marginBottom: "4px" }}>TIME & SPACE COMPLEXITY</div>
                            <div style={{ fontSize: "13px", fontFamily: "monospace" }}>Time: <strong>{aiAnalysis.timeComplexity}</strong></div>
                            <div style={{ fontSize: "13px", fontFamily: "monospace", marginTop: "2px" }}>Space: <strong>{aiAnalysis.spaceComplexity}</strong></div>
                            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>{aiAnalysis.explanation}</p>
                          </div>

                          <div style={{ padding: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <div style={{ color: "#10b981", fontWeight: 700, marginBottom: "4px" }}>OPTIMIZATION HINTS & EDGE CASES</div>
                            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#cbd5e1" }}>
                              {aiAnalysis.optimizations.map((opt, i) => (
                                <li key={i} style={{ marginBottom: "4px" }}>{opt}</li>
                              ))}
                              {aiAnalysis.edgeCases.slice(0, 2).map((ec, i) => (
                                <li key={`ec-${i}`} style={{ color: "#f59e0b" }}>Watch: {ec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>
                          Click &quot;Re-Analyze Code&quot; to inspect your solution with the built-in AI code evaluator.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. AUTHENTIC VS CODE BOTTOM STATUS BAR */}
            <div className="mz-vscode-status-bar">
              <div className="mz-vscode-status-left">
                <div className="mz-vscode-status-item" title="Git Branch: main">
                  <VscSourceControl size={13} />
                  <span>main</span>
                </div>

                <div
                  className="mz-vscode-status-item"
                  onClick={() => {
                    setBottomPanelTab("problems");
                    setIsDrawerOpen(true);
                  }}
                  title="Diagnostics & Problems"
                >
                  <span>{customError ? "⨂ 1" : "⨂ 0"}</span>
                  <span>⚠ 0</span>
                </div>

                <div className="mz-vscode-status-item">
                  <span>{isRunning ? "⏳ Executing..." : customDuration !== null ? `⏱ ${customDuration}ms` : "✓ Ready"}</span>
                </div>
              </div>

              <div className="mz-vscode-status-right">
                <div className="mz-vscode-status-item">
                  <span>
                    Ln {cursorPos.line}, Col {cursorPos.col}
                    {selectionLength > 0 ? ` (${selectionLength} selected)` : ""}
                  </span>
                </div>

                <div className="mz-vscode-status-item">
                  <span>Spaces: {tabSize}</span>
                </div>

                <div className="mz-vscode-status-item">
                  <span>UTF-8</span>
                </div>

                <div className="mz-vscode-status-item" style={{ fontWeight: 700 }}>
                  <span>{selectedLang.toUpperCase()}</span>
                </div>

                <div className="mz-vscode-status-item" title="Prettier Formatter Active">
                  <span>Prettier: ✓</span>
                </div>

                <div
                  className="mz-vscode-status-item"
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  style={{ textDecoration: "underline", cursor: "pointer" }}
                  title="Click to Switch MasteryZone Theme"
                >
                  <span>{VSCODE_THEMES.find((t) => t.id === editorTheme)?.label || editorTheme}</span>
                </div>
              </div>
            </div>
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
                      if (currentUserId && currentUserId !== "guest") {
                        localStorage.setItem(`mz_${currentUserId}_draft_${sid}`, code);
                        localStorage.setItem(`mz_${currentUserId}_lang_${sid}`, selectedLang);
                        localStorage.setItem(`mz_${currentUserId}_time_${sid}`, String(secondsRemaining));
                      }
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
