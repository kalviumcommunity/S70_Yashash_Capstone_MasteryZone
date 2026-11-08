import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./home.css";
import NotificationBell from "./NotificationBell.jsx";
import FeaturedLearningCarousel from "./FeaturedLearningCarousel.jsx";
import CertificationExamWorkspace from "./CertificationExamWorkspace.jsx";
import UserProfileDropdown from "./UserProfileDropdown.jsx";
import { performGlobalLogout } from "../utils/sessionAuth.js";
import logoIcon from "../assets/logo_icon_transparent.png";
import heroIllustration from "../assets/interests_hero_illustration.png";
import rocketIcon from "../assets/interests_card_rocket.png";

// Ultra-sharp 1024x1024 300DPI 3D Apple-style illustration for Coding
import codingIllustration from "../assets/interests_card_coding_hd.png";
import heroLaptop4k from "../assets/hero_laptop_4k.svg";

import {
  LuHouse,
  LuTarget,
  LuChartColumn,
  LuUser,
  LuSettings,
  LuLogOut,
  LuSearch,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuCheck,
  LuX,
  LuArrowRight,
  LuCircleCheck,
  LuFileText,
  LuAward,
  LuClock,
  LuCalendar,
  LuExternalLink,
  LuShieldCheck,
  LuVideo,
  LuPlay,
  LuDownload,
  LuPencil,
  LuTrash2,
  LuShare2,
  LuHardDrive,
  LuBookmark,
  LuFilter,
  LuRotateCcw,
  LuPlus,
  LuCodeXml,
  LuFolderGit2,
  LuSparkles,
  LuTrendingUp,
  LuFlame,
  LuTrophy,
  LuZap,
  LuTerminal,
  LuBookOpen,
  LuLayers,
  LuCpu,
  LuBraces,
  LuGitBranch,
  LuLifeBuoy,
  LuLock,
  LuLightbulb,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

const getMediaUrl = (url) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const base =
    API_BASE ||
    (typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://localhost:5012"
      : "");
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${base}${cleanUrl}`;
};

// Vector Badge Component for Coding
const InterestBadge = ({ type, className = "" }) => {
  return (
    <div className={`mz-badge-box mz-badge-coding ${className}`} title="Coding & DSA">
      <LuCodeXml size={22} strokeWidth={2.4} />
    </div>
  );
};

// Core DSA & Problem-Solving Categories
const DSA_TOPICS = [
  {
    id: "arrays-hashing",
    title: "Arrays & Hashing",
    description: "Hash maps, frequency counters, prefix sums, and two-pointer arrays.",
    problemCount: 42,
    difficulty: "Easy to Hard",
    badgeColor: "#3b82f6",
    badgeBg: "#eff6ff",
    challenges: ["Two Sum", "Subarray Sum Equals K", "Longest Consecutive Sequence"],
    route: "/coding?tab=challenges&topic=arrays",
  },
  {
    id: "two-pointers",
    title: "Two Pointers & Sliding Window",
    description: "Subarray optimization, monotonic queues, and window shrinking.",
    problemCount: 36,
    difficulty: "Medium to Hard",
    badgeColor: "#f59e0b",
    badgeBg: "#fffbeb",
    challenges: ["Trapping Rain Water", "3Sum", "Minimum Window Substring"],
    route: "/coding?tab=challenges&topic=pointers",
  },
  {
    id: "stacks-queues",
    title: "Stacks & Queues",
    description: "LIFO/FIFO paradigms, monotonic stacks, and operation simulators.",
    problemCount: 30,
    difficulty: "Medium",
    badgeColor: "#8b5cf6",
    badgeBg: "#f5f3ff",
    challenges: ["Min Stack Operations Simulator", "Valid Parentheses", "Daily Temperatures"],
    route: "/coding?tab=challenges&topic=stacks",
  },
  {
    id: "trees-binary-search",
    title: "Trees & Binary Search",
    description: "BST traversal, BFS/DFS algorithms, and asymptotic tight-bound proofs.",
    problemCount: 46,
    difficulty: "Medium to Hard",
    badgeColor: "#10b981",
    badgeBg: "#f0fdf4",
    challenges: ["Tight Bound Proof Challenge", "Invert Binary Tree", "Lowest Common Ancestor"],
    route: "/coding?tab=challenges&topic=trees",
  },
  {
    id: "dynamic-programming",
    title: "Dynamic Programming",
    description: "Memoization, bottom-up tabulation, grid paths, and knapsack variants.",
    problemCount: 40,
    difficulty: "Hard",
    badgeColor: "#ef4444",
    badgeBg: "#fef2f2",
    challenges: ["Coin Change", "Climbing Stairs", "Longest Increasing Subsequence"],
    route: "/coding?tab=challenges&topic=dp",
  },
  {
    id: "graphs-backtracking",
    title: "Graphs & Backtracking",
    description: "Dijkstra, topological sort, connected components, and recursion trees.",
    problemCount: 35,
    difficulty: "Medium to Hard",
    badgeColor: "#06b6d4",
    badgeBg: "#ecfeff",
    challenges: ["Number of Islands", "Course Schedule", "Word Search"],
    route: "/coding?tab=challenges&topic=graphs",
  },
];

// Structured Programming Language Curricula
const PROGRAMMING_COURSES = [
  {
    id: "python",
    title: "Python Core to Advanced DSA",
    level: "All Levels",
    modules: 8,
    hours: "24 Hours",
    description: "Variables, OOP, algorithmic complexity, hash tables, and binary trees.",
    iconColor: "#387EB8",
    route: "/coding?tab=learning_path&track=python",
  },
  {
    id: "java",
    title: "Java Enterprise & Algorithms",
    level: "Intermediate",
    modules: 12,
    hours: "36 Hours",
    description: "Generics, collections, JVM memory model, concurrency, and enterprise systems.",
    iconColor: "#E76F00",
    route: "/coding?tab=learning_path&track=java",
  },
  {
    id: "javascript",
    title: "Full-Stack JavaScript & Node.js Engine",
    level: "Intermediate",
    modules: 10,
    hours: "30 Hours",
    description: "Event loop, V8 engine internals, asynchronous architecture, and microservices.",
    iconColor: "#F7DF1E",
    route: "/coding?tab=learning_path&track=javascript",
  },
  {
    id: "cpp",
    title: "C++ Systems & Memory Management",
    level: "Advanced",
    modules: 10,
    hours: "28 Hours",
    description: "Pointers, manual allocations, RAII, move semantics, and standard template library.",
    iconColor: "#00599C",
    route: "/coding?tab=learning_path&track=cpp",
  },
];

// Software Engineering Projects with Cover Page Blueprints & Interactive Milestones
const SOFTWARE_PROJECTS = [
  {
    id: "proj_task_queue",
    title: "Distributed Task Queue & Job Scheduler",
    domain: "Distributed Systems",
    tech: "Node.js • Redis • TypeScript • Docker",
    badge: "Distributed Systems",
    badgeColor: "#047857",
    badgeBg: "#d1fae5",
    border: "#a7f3d0",
    themeGradient: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 45%, #eff6ff 100%)",
    accentColor: "#059669",
    fileTab: "queue.worker.ts",
    description: "Architect a resilient background job queue with concurrency limits, exponential backoff retries, and dead-letter queues.",
    route: "/coding?tab=projects",
    technologies: ["Node.js", "Redis", "TypeScript", "Docker"],
    milestones: [
      { id: "m1", name: "Worker Daemon & IPC Engine", state: "done" },
      { id: "m2", name: "Priority Queue Concurrency Lock", state: "active" },
      { id: "m3", name: "Exponential Backoff & Dead-Letter Queue", state: "upcoming" },
    ],
    codePreview: `const worker = new JobQueueWorker({\n  concurrency: 16,\n  backoff: 'exponential'\n});\nawait worker.process('RESIZE_4K_IMAGE');`,
    xpReward: "+350 XP",
    estTime: "4-6 Hours",
    difficulty: "Advanced",
    containerStatus: "Isolated Docker Sandbox",
  },
  {
    id: "proj_collab_canvas",
    title: "Real-Time Collaborative Code Canvas",
    domain: "Real-Time Systems",
    tech: "React • WebSockets • Monaco • Node.js",
    badge: "Real-Time WebSockets",
    badgeColor: "#1d4ed8",
    badgeBg: "#dbeafe",
    border: "#bfdbfe",
    themeGradient: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 45%, #f5f3ff 100%)",
    accentColor: "#2563eb",
    fileTab: "socket.engine.js",
    description: "Build an interactive multi-cursor live code editor powered by WebSockets, Operational Transformation (OT), and presence tracking.",
    route: "/coding?tab=projects",
    technologies: ["React", "WebSockets", "Monaco", "Express"],
    milestones: [
      { id: "m1", name: "WebSocket Protocol & Auth Handshake", state: "done" },
      { id: "m2", name: "Multi-Cursor Presence Broadcasting", state: "active" },
      { id: "m3", name: "Operational Transformation (OT) Conflict Engine", state: "upcoming" },
    ],
    codePreview: `socket.on('USER_SELECTION', (payload) => {\n  broadcastCursorTransform(payload);\n  syncTextBuffer(payload.diff);\n});`,
    xpReward: "+300 XP",
    estTime: "3-5 Hours",
    difficulty: "Intermediate",
    containerStatus: "WebSocket Node Engine",
  },
  {
    id: "proj_algo_trading",
    title: "Algorithmic Order Matching Engine",
    domain: "Financial Systems",
    tech: "Modern C++20 • STL • Memory Pools • CMake",
    badge: "Low-Latency C++",
    badgeColor: "#6d28d9",
    badgeBg: "#ede9fe",
    border: "#ddd6fe",
    themeGradient: "linear-gradient(135deg, #faf5ff 0%, #f5f3ff 45%, #fdf2f8 100%)",
    accentColor: "#7c3aed",
    fileTab: "order_book.cpp",
    description: "Construct a high-throughput Limit Order Book (LOB) in Modern C++ processing bid/ask orders with sub-microsecond matching latency.",
    route: "/coding?tab=projects",
    technologies: ["C++20", "STL", "Memory Pools", "CMake"],
    milestones: [
      { id: "m1", name: "Price-Time Priority Limit Book", state: "done" },
      { id: "m2", name: "Atomic Trade Matching & Crossing", state: "active" },
      { id: "m3", name: "Zero-Allocation Cache Benchmark", state: "upcoming" },
    ],
    codePreview: `OrderBook<AllocPolicy::ZeroCopy> lob;\nlob.insertLimitOrder(Side::BUY, 104.25, 1000);\nlob.matchCrossedOrders();`,
    xpReward: "+400 XP",
    estTime: "6-8 Hours",
    difficulty: "Hard",
    containerStatus: "Native C++20 Compiler",
  },
  {
    id: "proj_compiler_telemetry",
    title: "Compiler Telemetry & Profiler Hub",
    domain: "Developer Tooling",
    tech: "Python • Docker • Linux cgroups • FastAPI",
    badge: "Compiler Design",
    badgeColor: "#b45309",
    badgeBg: "#fef3c7",
    border: "#fde68a",
    themeGradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 45%, #fefce8 100%)",
    accentColor: "#d97706",
    fileTab: "profiler.py",
    description: "Process execution runtimes, sandbox memory cgroups, and evaluate automated test assertions in secure Linux execution environments.",
    route: "/coding?tab=projects",
    technologies: ["Python", "Docker", "cgroups", "FastAPI"],
    milestones: [
      { id: "m1", name: "Containerized Sandbox Lifecycle", state: "done" },
      { id: "m2", name: "stdout/stderr Stream Multiplexer", state: "active" },
      { id: "m3", name: "Peak RSS & CPU Instruction Profiler", state: "upcoming" },
    ],
    codePreview: `result = await sandbox.run_isolated(\n    code=candidate_code,\n    memory_limit_mb=128,\n    timeout_sec=1.5\n)`,
    xpReward: "+380 XP",
    estTime: "4-6 Hours",
    difficulty: "Advanced",
    containerStatus: "Linux cgroups Sandbox",
  },
  {
    id: "proj_ecommerce_api",
    title: "Enterprise E-Commerce Microservices",
    domain: "Full-Stack Architecture",
    tech: "FastAPI • PostgreSQL • Redis • Stripe Webhooks",
    badge: "Microservices",
    badgeColor: "#0369a1",
    badgeBg: "#e0f2fe",
    border: "#bae6fd",
    themeGradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 45%, #ecfeff 100%)",
    accentColor: "#0284c7",
    fileTab: "inventory.service.py",
    description: "Design production-ready REST microservices for product catalogs, cart state, payment webhook gateways, and inventory concurrency locks.",
    route: "/coding?tab=projects",
    technologies: ["FastAPI", "PostgreSQL", "Redis", "Docker"],
    milestones: [
      { id: "m1", name: "PostgreSQL Schema & Migrations", state: "done" },
      { id: "m2", name: "Stripe Webhook Gateway & Idempotency", state: "active" },
      { id: "m3", name: "Redis Distributed Inventory Lock", state: "upcoming" },
    ],
    codePreview: `async with redis.lock("inv:sku_9921", timeout=5):\n    await inventory.decrement_stock(item_id, qty=1);\n    await orders.commit_transaction();`,
    xpReward: "+320 XP",
    estTime: "3-5 Hours",
    difficulty: "Intermediate",
    containerStatus: "PostgreSQL & Redis Services",
  },
];

const INTEREST_CARDS = [
  {
    key: "CODING",
    title: "Coding & Software Engineering",
    description: "Learn programming, build real projects, and grow your problem-solving skills.",
    tags: ["Python", "Java", "C++", "JavaScript", "Algorithms", "DSA"],
    illustration: codingIllustration,
    activeBorder: "#3b82f6",
    activeGlow: "rgba(59, 130, 246, 0.22)",
    checkBg: "#2563eb",
    targetRoute: "/coding",
  },
];

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive active navigation tab directly from current route pathname
  const currentPath = location.pathname;
  const activeNavTab = useMemo(() => {
    if (currentPath === "/reports") return "reports";
    if (currentPath === "/recordings") return "recordings";
    if (currentPath === "/certificates" || currentPath === "/certifications") return "certifications";
    if (currentPath === "/settings") return "settings";
    if (currentPath === "/select-interests") return "select-interests";
    return "home";
  }, [currentPath]);
  const [certHistory, setCertHistory] = useState({ attempts: [], certificates: [] });
  const [isLoadingCertHistory, setIsLoadingCertHistory] = useState(false);

  const getEarnedCertInfo = useCallback(
    (certId) => {
      if (!certId) return { isCompleted: false };
      const target = certId.toLowerCase();
      const cert = certHistory.certificates?.find((c) => {
        const cId = (c.certificationId || c.certId || "").toLowerCase();
        return (
          cId === target ||
          (target === "js_cert" && cId === "fullstack_cert") ||
          (target === "fullstack_cert" && cId === "js_cert")
        );
      });
      const passedAtt = certHistory.attempts?.find((a) => {
        const aId = (a.certId || "").toLowerCase();
        const matches =
          aId === target ||
          (target === "js_cert" && aId === "fullstack_cert") ||
          (target === "fullstack_cert" && aId === "js_cert");
        return (
          matches &&
          (a.status === "PASSED" || (a.percentage != null && a.percentage >= 80))
        );
      });
      return {
        isCompleted: Boolean(cert || passedAtt),
        certificateId: cert?.certificateId || passedAtt?.certificateId || null,
        attemptId: passedAtt?.attemptId || cert?.attemptId || null,
      };
    },
    [certHistory]
  );

  const handleOpenCertExam = useCallback(
    (certId, certName) => {
      const info = getEarnedCertInfo(certId);
      if (info.isCompleted) {
        toast.info("You have already passed this certification and earned your credential! Completed tests cannot be retaken.", {
          toastId: `cert_already_passed_${certId}`,
        });
        if (info.certificateId) {
          navigate(`/verify/${info.certificateId}`);
        }
        return;
      }

      // Clean stale submitted flags from localStorage before starting retake
      try {
        const rawUser = localStorage.getItem("user");
        const u = rawUser ? JSON.parse(rawUser) : null;
        const uKey = u?._id || u?.id || "guest";
        localStorage.removeItem(`mz_${uKey}_cert_${certId}_submitted`);
        localStorage.removeItem(`mz_${uKey}_cert_${certId}_report_url`);
      } catch {}

      setActiveCertExamModal({ id: certId, name: certName });
    },
    [getEarnedCertInfo, navigate]
  );
  const [activeCertExamModal, setActiveCertExamModal] = useState(() => {
    try {
      const rawUser = localStorage.getItem("user");
      let uId = "";
      if (rawUser) {
        const u = JSON.parse(rawUser);
        uId = u._id || u.id || u.userId || "";
      }
      const certKey = uId ? `mz_${uId}_active_cert_session` : "mz_active_cert_session";
      const saved = localStorage.getItem(certKey) || localStorage.getItem("mz_active_cert_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.attemptId && parsed.status === "IN_PROGRESS") {
          if (parsed.userId && uId && parsed.userId !== uId) return null;
          return {
            id: parsed.certId || "dsa_cert",
            name: parsed.certTitle || "Data Structures & Algorithms (DSA)",
            attemptId: parsed.attemptId,
          };
        }
      }
    } catch {}
    return null;
  });

  const isFetchingCertHistoryRef = useRef(false);
  const fetchCertHistory = async (force = false) => {
    if (isFetchingCertHistoryRef.current && !force) return;
    isFetchingCertHistoryRef.current = true;
    setIsLoadingCertHistory(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/certifications/my-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCertHistory({
          attempts: data.attempts || [],
          certificates: data.certificates || [],
        });
      }
    } catch (err) {
      console.warn("Cert history fetch note:", err);
    } finally {
      isFetchingCertHistoryRef.current = false;
      setIsLoadingCertHistory(false);
    }
  };

  // Dedicated Coding Platform Data State
  const [codingStats, setCodingStats] = useState({
    totalXp: 120,
    totalHours: 4.5,
    streak: 1,
    challengesSolvedCount: 0,
    tracks: [],
  });
  const [recentCodingSubmissions, setRecentCodingSubmissions] = useState([]);
  const [isLoadingCodingData, setIsLoadingCodingData] = useState(false);
  const [showPodHint, setShowPodHint] = useState(false);
  const [activeProjSlide, setActiveProjSlide] = useState(0);
  const [projViewMode, setProjViewMode] = useState("slider"); // 'slider' | 'grid'
  const [activeMilestoneHover, setActiveMilestoneHover] = useState(null);

  // Fetch real-time coding statistics and submissions
  const fetchCodingPlatformData = async () => {
    setIsLoadingCodingData(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // 1. Fetch live coding progress and stats
      try {
        const res = await fetch(`${API_BASE}/api/coding/data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const up = json.userProgress || {};
            setCodingStats({
              totalXp: up.totalXp != null ? up.totalXp : 150,
              totalHours: up.totalHours != null ? up.totalHours : 3.5,
              streak: up.streak != null ? up.streak : 1,
              challengesSolvedCount: Array.isArray(up.challengesSolved) ? up.challengesSolved.length : 0,
              tracks: json.tracks || [],
            });
          }
        }
      } catch (err) {
        console.warn("Coding data fetch note:", err);
      }

      // 2. Fetch student's real recent submissions
      try {
        const resSub = await fetch(`${API_BASE}/api/coding/submissions/my-recent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resSub.ok) {
          const jsonSub = await resSub.json();
          if (jsonSub.success && Array.isArray(jsonSub.submissions)) {
            setRecentCodingSubmissions(jsonSub.submissions);
          }
        }
      } catch (err) {
        console.warn("Recent submissions fetch note:", err);
      }
    } catch (e) {
      console.warn("Coding platform data load error:", e);
    } finally {
      setIsLoadingCodingData(false);
    }
  };
  const [reportsList, setReportsList] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState("ALL"); // "ALL" | "PASSED" | "FAILED"
  const [reportSubjectFilter, setReportSubjectFilter] = useState("ALL"); // "ALL" | "coding" | "language" | "driving" | "fitness"
  const [reportTypeFilter, setReportTypeFilter] = useState("ALL"); // "ALL" | "mcq_exam" | "coding_assessment"

  // Fetch assessment reports from database & localStorage without UI flash
  const fetchReports = async (showLoader = false) => {
    if (showLoader) {
      setIsLoadingReports(true);
    }
    try {
      const token = localStorage.getItem("token");
      let uId = "";
      let localReports = [];
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          uId = parsed._id || parsed.id || parsed.userId || "";
        }
        const reportsKey = uId ? `mz_${uId}_assessment_reports` : null;
        localReports = reportsKey ? JSON.parse(localStorage.getItem(reportsKey) || "[]") : [];
      } catch {}

      let apiReports = [];
      if (token) {
        // 1. Fetch curriculum reports (MCQ Exams & multi-subject assessment attempts)
        try {
          const res = await fetch(`${API_BASE}/api/curriculum/reports`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.reports)) {
              apiReports.push(...data.reports);
            }
          }
        } catch (curErr) {
          console.warn("Curriculum reports fetch note:", curErr);
        }

        // 2. Fetch proctored coding sessions (MZ-ASM practical exams)
        try {
          const res = await fetch(`${API_BASE}/api/coding/proctored-session/user-reports`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.reports)) {
              apiReports.push(...data.reports);
            }
          }
        } catch (apiErr) {
          console.warn("API reports fetch note:", apiErr);
        }
      }

      const map = new Map();
      apiReports.forEach((r) => {
        const key = r.sessionId || r._id || r.id;
        if (key) map.set(key, r);
      });
      localReports.forEach((r) => {
        if (uId && r.userId && String(r.userId) !== String(uId)) return;
        const key = r.sessionId || r._id || r.id;
        if (key && !map.has(key)) map.set(key, r);
      });

      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0)
      );
      setReportsList(combined);
    } catch (err) {
      console.warn("Reports load error:", err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const [recordingsList, setRecordingsList] = useState([]);
  const [recordingsAnalytics, setRecordingsAnalytics] = useState({
    totalRecordings: 0,
    totalSizeBytes: 0,
    storageQuotaBytes: 5 * 1024 * 1024 * 1024,
  });
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [recSearchQuery, setRecSearchQuery] = useState("");
  const [recDateFilter, setRecDateFilter] = useState("all"); // "all" | "today" | "week" | "month"
  const [recSortOrder, setRecSortOrder] = useState("newest"); // "newest" | "oldest" | "duration_desc" | "duration_asc"
  const [recScope, setRecScope] = useState("all"); // "all" | "personal" | "shared"
  const [activePlayingRecording, setActivePlayingRecording] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [renameModalRecording, setRenameModalRecording] = useState(null);
  const [renameInput, setRenameInput] = useState("");
  const [shareToast, setShareToast] = useState(null);
  const [newBookmarkNote, setNewBookmarkNote] = useState("");
  const videoPlayerRef = useRef(null);

  // Fetch recordings with smooth state merging to prevent blinking
  const fetchRecordings = async (showLoader = false) => {
    if (showLoader) {
      setIsLoadingRecordings(true);
    }
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (recSearchQuery.trim()) queryParams.set("q", recSearchQuery.trim());
      if (recDateFilter !== "all") queryParams.set("dateFilter", recDateFilter);
      if (recSortOrder) queryParams.set("sort", recSortOrder);
      if (recScope !== "all") queryParams.set("scope", recScope);

      let apiRecs = [];
      const res = await fetch(`${API_BASE}/api/recordings?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recordings)) {
          apiRecs = data.recordings;
        }
        if (data.analytics) {
          setRecordingsAnalytics(data.analytics);
        }
      }

      // Also merge user-specific local recordings
      let uId = "";
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          uId = parsed._id || parsed.id || parsed.userId || "";
        }
      } catch {}

      const recKey = uId ? `mz_${uId}_local_recordings` : null;
      let localRecs = [];
      try {
        localRecs = recKey ? JSON.parse(localStorage.getItem(recKey) || "[]") : [];
      } catch {}

      const recMap = new Map();
      apiRecs.forEach((r) => {
        const key = r.recordingId || r._id || r.id;
        if (key) recMap.set(key, r);
      });
      localRecs.forEach((r) => {
        if (uId && r.hostUserId && String(r.hostUserId) !== String(uId)) return;
        const key = r.recordingId || r._id || r.id;
        if (key && !recMap.has(key)) recMap.set(key, r);
      });

      const combined = Array.from(recMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setRecordingsList(combined);
    } catch (err) {
      console.warn("Recordings fetch note:", err);
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  const handleRenameRecordingSubmit = async (e) => {
    e?.preventDefault();
    if (!renameModalRecording || !renameInput.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/recordings/${renameModalRecording.recordingId}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: renameInput.trim() }),
      });
      if (res.ok) {
        setRecordingsList((prev) =>
          prev.map((r) =>
            r.recordingId === renameModalRecording.recordingId
              ? { ...r, title: renameInput.trim() }
              : r
          )
        );
        if (activePlayingRecording?.recordingId === renameModalRecording.recordingId) {
          setActivePlayingRecording((prev) => ({ ...prev, title: renameInput.trim() }));
        }
        setRenameModalRecording(null);
      }
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const handleDeleteRecording = async (recordingId) => {
    if (!window.confirm("Are you sure you want to delete this recorded session? This action cannot be undone.")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/recordings/${recordingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRecordingsList((prev) => prev.filter((r) => r.recordingId !== recordingId));
        if (activePlayingRecording?.recordingId === recordingId) {
          setActivePlayingRecording(null);
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleShareRecording = (rec) => {
    const fullUrl = `${window.location.origin}/recordings?id=${rec.recordingId}`;
    navigator.clipboard?.writeText(fullUrl);
    setShareToast(`Meeting link copied to clipboard: ${rec.title}`);
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleAddBookmark = async (e) => {
    e?.preventDefault();
    if (!activePlayingRecording || !videoPlayerRef.current) return;
    const currentSeconds = Math.floor(videoPlayerRef.current.currentTime || 0);
    const note = newBookmarkNote.trim() || `Bookmark at ${Math.floor(currentSeconds / 60)}:${String(currentSeconds % 60).padStart(2, "0")}`;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/recordings/${activePlayingRecording.recordingId}/bookmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ timestampSeconds: currentSeconds, note }),
      });
      if (res.ok) {
        const data = await res.json();
        setActivePlayingRecording((prev) => ({
          ...prev,
          bookmarks: data.bookmarks,
        }));
        setNewBookmarkNote("");
      }
    } catch (err) {
      console.error("Add bookmark error:", err);
    }
  };

  useEffect(() => {
    // Prioritize active tab loading for instant responsiveness
    if (activeNavTab === "certifications") {
      fetchCertHistory();
    } else if (activeNavTab === "reports") {
      fetchReports(true);
    } else if (activeNavTab === "recordings") {
      fetchRecordings(true);
    } else {
      fetchCodingPlatformData();
    }
  }, []);

  const prevTabRef = useRef(activeNavTab);
  useEffect(() => {
    if (prevTabRef.current !== activeNavTab) {
      prevTabRef.current = activeNavTab;
      if (activeNavTab === "reports") {
        fetchReports(reportsList.length === 0);
      } else if (activeNavTab === "recordings") {
        fetchRecordings(recordingsList.length === 0);
      } else if (activeNavTab === "certifications") {
        fetchCertHistory();
      } else if (activeNavTab === "home") {
        fetchCodingPlatformData();
      }
    }
  }, [activeNavTab, reportsList.length, recordingsList.length]);

  useEffect(() => {
    if (activeNavTab === "recordings") {
      fetchRecordings(false);
    }
  }, [recDateFilter, recSortOrder, recScope]);

  useEffect(() => {
    if (activePlayingRecording && videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = playbackSpeed;
      const rawUser = localStorage.getItem("user");
      let uId = "guest";
      try {
        if (rawUser) {
          const u = JSON.parse(rawUser);
          uId = u._id || u.id || u.userId || "guest";
        }
      } catch {}
      const savedTime =
        localStorage.getItem(`mz_${uId}_rec_seek_${activePlayingRecording.recordingId}`) ||
        localStorage.getItem(`mz_rec_seek_${activePlayingRecording.recordingId}`);
      if (savedTime && Number(savedTime) > 0) {
        videoPlayerRef.current.currentTime = Number(savedTime);
      }
    }
  }, [activePlayingRecording]);

  // Single selection: exactly one particular interest can be selected at a time
  const [selectedInterest, setSelectedInterest] = useState("CODING");

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pulseBadge, setPulseBadge] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Settings preferences
  const [preferences, setPreferences] = useState({
    notifications: true,
  });

  // Log Activity Modal & Confirmation State
  const [isLogActivityModalOpen, setIsLogActivityModalOpen] = useState(false);
  const [isLogConfirmed, setIsLogConfirmed] = useState(false);
  const [confirmedActivityData, setConfirmedActivityData] = useState(null);
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [logActivityForm, setLogActivityForm] = useState({
    track: "CODING",
    task: "Completed a lesson",
    moduleName: "",
    hoursSpent: "1.0",
    xpEarned: "30",
  });

  const handleLogActivitySubmit = async (e) => {
    e.preventDefault();
    if (!logActivityForm.moduleName.trim()) {
      toast.error("Please enter a lesson or module name");
      return;
    }

    setIsLoggingActivity(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE}/api/progress/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(logActivityForm),
      });

      if (res.ok) {
        setConfirmedActivityData({
          track: logActivityForm.track,
          task: logActivityForm.task,
          moduleName: logActivityForm.moduleName,
          hoursSpent: logActivityForm.hoursSpent,
          xpEarned: logActivityForm.xpEarned,
          date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        setIsLogConfirmed(true);
        toast.success("Learning activity recorded successfully!");
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Could not log activity");
      }
    } catch (err) {
      toast.error("Network error saving activity");
    } finally {
      setIsLoggingActivity(false);
    }
  };

  const handleCloseLogActivityModal = () => {
    setIsLogActivityModalOpen(false);
    setIsLogConfirmed(false);
    setConfirmedActivityData(null);
    setLogActivityForm({
      track: "CODING",
      task: "Completed a lesson",
      moduleName: "",
      hoursSpent: "1.0",
      xpEarned: "30",
    });
  };

  const [isExiting, setIsExiting] = useState(false);

  // Real-time search query
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch current user details and keep synchronized across all views
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          try {
            localStorage.setItem("user", JSON.stringify(data.user));
            if (data.user.avatarUrl) {
              localStorage.setItem("mz_avatarUrl", data.user.avatarUrl);
            } else {
              localStorage.removeItem("mz_avatarUrl");
            }
          } catch {}
          if (data.user.preferences) {
            setPreferences((prev) => ({
              ...prev,
              notifications: data.user.preferences.notifications ?? true,
            }));
          }
          if (Array.isArray(data.user.interests) && data.user.interests.length > 0) {
            const first = data.user.interests[0];
            const normalized = first === "VEHICLES" ? "VECHILES" : first;
            if (INTEREST_CARDS.some((c) => c.key === normalized)) {
              setSelectedInterest(normalized);
            }
          }
        }
      }
    } catch (error) {
      console.warn("Failed to fetch user", error);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handleProfileUpdated = (event) => {
      const newAvatar = event?.detail?.avatarUrl;
      if (newAvatar !== undefined) {
        setUser((prev) => (prev ? { ...prev, avatarUrl: newAvatar } : { avatarUrl: newAvatar }));
      }
      fetchUser();
    };

    const handleSync = () => {
      fetchUser();
      fetchReports(false);
      fetchRecordings(false);
      fetchCertHistory();
      fetchCodingPlatformData();
    };

    window.addEventListener("user_profile_updated", handleProfileUpdated);
    window.addEventListener("new_recording_saved", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("focus", handleSync);

    return () => {
      window.removeEventListener("user_profile_updated", handleProfileUpdated);
      window.removeEventListener("new_recording_saved", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, [fetchUser, location.pathname]);

  // Single Selection toggle with micro-spring pulse trigger
  const handleSelectInterest = (key) => {
    setSelectedInterest((prev) => (prev === key ? null : key));
    setPulseBadge(true);
    setTimeout(() => setPulseBadge(false), 350);
  };

  const handleDeselect = (e) => {
    if (e) e.stopPropagation();
    setSelectedInterest(null);
    setPulseBadge(true);
    setTimeout(() => setPulseBadge(false), 350);
  };

  // Real-time search filter for interests
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return INTEREST_CARDS;
    const q = searchQuery.toLowerCase().trim();
    return INTEREST_CARDS.filter(
      (card) =>
        card.title.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Continue to selected training track with animated loading state and transition
  const handleContinue = async () => {
    if (!selectedInterest) {
      toast.warn("Please select an interest to continue your learning journey!");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`${API_BASE}/auth/interests`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ interests: [selectedInterest] }),
        });
      }
    } catch (err) {
      console.error("Failed to persist interest:", err);
    }
    localStorage.setItem("userInterests", JSON.stringify([selectedInterest]));

    setIsExiting(true);
    setTimeout(() => {
      const item = INTEREST_CARDS.find((i) => i.key === selectedInterest);
      if (item) {
        navigate(item.targetRoute);
      } else {
        navigate("/coding");
      }
    }, 350);
  };

  const handleLogoutConfirm = () => {
    performGlobalLogout();
    toast.info("Signed out successfully.");
    navigate("/login", { replace: true });
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        toast.success("Account deleted successfully.");
        localStorage.removeItem("token");
        navigate("/signup");
      }
    } catch (error) {
      console.error("Error deleting account", error);
    }
  };

  const handlePhotoUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      const previousAvatar = user?.avatarUrl;
      setUser((prev) => ({ ...prev, avatarUrl: base64Image }));
      setIsDropdownOpen(false);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/auth/avatar`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarUrl: base64Image }),
        });

        if (!response.ok) {
          setUser((prev) => ({ ...prev, avatarUrl: previousAvatar }));
          toast.error("Failed to update profile photo. Image might be too large.");
        } else {
          try {
            const stored = localStorage.getItem("user");
            const u = stored ? JSON.parse(stored) : {};
            u.avatarUrl = base64Image;
            localStorage.setItem("user", JSON.stringify(u));
            localStorage.setItem("mz_avatarUrl", base64Image);
          } catch {}
          window.dispatchEvent(new CustomEvent("user_profile_updated", { detail: { avatarUrl: base64Image } }));
          toast.success("Profile photo updated successfully!");
        }
      } catch (error) {
        console.error("Error updating photo", error);
        setUser((prev) => ({ ...prev, avatarUrl: previousAvatar }));
      }
    };
  };

  const handleRemovePhoto = async () => {
    const previousAvatar = user?.avatarUrl;
    setUser((prev) => ({ ...prev, avatarUrl: null }));
    setIsDropdownOpen(false);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/auth/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        setUser((prev) => ({ ...prev, avatarUrl: previousAvatar }));
        toast.error("Failed to remove profile photo.");
      } else {
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const u = JSON.parse(stored);
            u.avatarUrl = null;
            localStorage.setItem("user", JSON.stringify(u));
          }
          localStorage.removeItem("mz_avatarUrl");
        } catch {}
        window.dispatchEvent(new CustomEvent("user_profile_updated", { detail: { avatarUrl: null } }));
        toast.info("Profile photo removed.");
      }
    } catch (error) {
      console.error("Error removing photo", error);
      setUser((prev) => ({ ...prev, avatarUrl: previousAvatar }));
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/auth/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.error("Failed to update preferences", err);
    }
  };

  const selectedItem = INTEREST_CARDS.find((i) => i.key === selectedInterest);
  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.name ||
    user?.username ||
    localStorage.getItem("userName") ||
    (user?.email ? user.email.split("@")[0] : "Learner");

  return (
    <div
      key={location.key}
      className={`mz-home-layout ${isExiting ? "mz-page-exit" : "mz-page-enter"}`}
    >
      {/* ================= LEFT SIDEBAR (STICKY, LOGOUT ALWAYS ON SCREEN) ================= */}
      <aside className="mz-sidebar">
        {/* Brand Logo Header */}
        <div className="mz-sidebar-brand" onClick={() => navigate("/home")} title="Mastery Zone Home">
          <img src={logoIcon} alt="Mastery Zone Logo" className="mz-sidebar-brand-icon" />
          <span className="mz-sidebar-brand-text">Mastery Zone</span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="mz-sidebar-nav">
          {/* 1. Dashboard */}
          <button
            type="button"
            className={`mz-sidebar-item ${activeNavTab === "home" ? "active" : ""}`}
            onClick={() => {
              navigate("/home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Dashboard"
            data-testid="sidebar-nav-dashboard"
          >
            <LuHouse className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Dashboard</span>
          </button>

          {/* 2. Coding */}
          <button
            type="button"
            className={`mz-sidebar-item ${currentPath === "/coding" ? "active" : ""}`}
            onClick={() => {
              navigate("/coding");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Coding"
            data-testid="sidebar-nav-coding"
          >
            <LuCodeXml className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Coding</span>
          </button>

          {/* 2. Practice & DSA */}
          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => {
              navigate("/coding?tab=challenges", { state: { tab: "challenges" } });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Practice & DSA"
            data-testid="sidebar-nav-practice"
          >
            <LuCodeXml className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Practice & DSA</span>
          </button>

          {/* 3. Learn & Path */}
          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => {
              navigate("/coding?tab=learning_path", { state: { tab: "learning_path" } });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Learn & Path"
            data-testid="sidebar-nav-learn"
          >
            <LuBookOpen className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Learn & Path</span>
          </button>

          {/* 4. Software Projects */}
          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => {
              navigate("/coding?tab=projects", { state: { tab: "projects" } });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Projects"
            data-testid="sidebar-nav-projects"
          >
            <LuFolderGit2 className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Projects</span>
          </button>

          {/* 5. Live Study Platform */}
          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => {
              navigate("/live");
            }}
            title="Live Study Groups"
            data-testid="sidebar-nav-live"
          >
            <LuVideo className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Live Study</span>
          </button>

          {/* 3. Reports */}
          <button
            type="button"
            className={`mz-sidebar-item ${activeNavTab === "reports" ? "active" : ""}`}
            onClick={() => {
              navigate("/reports");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Reports"
          >
            <LuFileText className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Reports</span>
            {reportsList.length > 0 && (
              <span className="mz-sidebar-badge-count">{reportsList.length}</span>
            )}
          </button>

          {/* 4. Recordings */}
          <button
            type="button"
            className={`mz-sidebar-item ${activeNavTab === "recordings" ? "active" : ""}`}
            onClick={() => {
              navigate("/recordings");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Recordings"
            data-testid="sidebar-nav-recordings"
          >
            <LuVideo className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Recordings</span>
            {recordingsList.length > 0 && (
              <span className="mz-sidebar-badge-count" style={{ background: "#2563eb" }}>
                {recordingsList.length}
              </span>
            )}
          </button>

          {/* 5. Certificates */}
          <button
            type="button"
            className={`mz-sidebar-item ${activeNavTab === "certifications" ? "active" : ""}`}
            onClick={() => {
              navigate("/certificates");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            title="Certificates"
            data-testid="sidebar-nav-certifications"
          >
            <LuAward className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Certificates</span>
            {certHistory.certificates?.length > 0 && (
              <span className="mz-sidebar-badge-count" style={{ background: "#7c3aed" }}>
                {certHistory.certificates.length}
              </span>
            )}
          </button>

          {/* 6. Progress */}
          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => navigate("/progress")}
            title="Progress"
          >
            <LuChartColumn className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Progress</span>
          </button>

          {/* 7. Profile */}
          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => navigate("/profile")}
            title="Profile"
          >
            <LuUser className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Profile</span>
          </button>

          {/* 8. Help & Support */}
          <button
            type="button"
            className="mz-sidebar-item"
            onClick={() => navigate("/help")}
            title="Help & Support Center"
          >
            <LuLifeBuoy className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Help & Support</span>
          </button>

          {/* 9. Settings */}
          <button
            type="button"
            className={`mz-sidebar-item ${activeNavTab === "settings" ? "active" : ""}`}
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            <LuSettings className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Settings</span>
          </button>

          {/* 9. Log Out */}
          <button
            type="button"
            className="mz-sidebar-item mz-sidebar-logout"
            onClick={() => setIsLogoutModalOpen(true)}
            title="Log Out"
          >
            <LuLogOut className="mz-sidebar-item-icon" />
            <span className="mz-sidebar-item-label">Log Out</span>
          </button>
        </nav>
      </aside>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="mz-main-wrapper">
        {/* Top Navbar */}
        <header className="mz-topbar">
          {/* Real-time search bar */}
          <div className="mz-search-bar-wrap">
            <LuSearch className="mz-search-bar-icon" size={17} />
            <input
              ref={searchInputRef}
              type="text"
              className="mz-search-bar-input"
              placeholder="Search challenges, algorithms, or concepts (e.g. Binary Search, Dynamic Programming, Python)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Real-time search"
            />
            {searchQuery && (
              <button
                type="button"
                className="mz-search-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                title="Clear search"
              >
                <LuX size={14} />
              </button>
            )}
            {searchQuery && (
              <span className="mz-search-count-pill">
                {filteredCards.length} {filteredCards.length === 1 ? "result" : "results"}
              </span>
            )}
          </div>

          <div className="mz-topbar-right">
            {/* Quick Log Activity Button */}
            <button
              type="button"
              className="mz-btn-quick-log"
              onClick={() => {
                setIsLogConfirmed(false);
                setIsLogActivityModalOpen(true);
              }}
              title="Log completed study hours or lesson"
              data-testid="home-btn-log-activity"
            >
              <LuPlus size={15} />
              <span>Log Activity</span>
            </button>

            {/* Real-Time Notification Bell */}
            <NotificationBell />

            {/* Profile Dropdown Widget with Shimmer Loader */}
            <div className="mz-profile-widget" ref={dropdownRef}>
              {isLoadingUser ? (
                <div className="mz-profile-btn mz-profile-loading" aria-label="Loading profile...">
                  <div className="mz-profile-avatar-circle mz-skeleton-shimmer" />
                  <div className="mz-skeleton-text-pill mz-skeleton-shimmer" />
                </div>
              ) : (
                <button
                  type="button"
                  className="mz-profile-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label="User profile menu"
                >
                  <div className="mz-profile-avatar-circle">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="mz-profile-avatar-img" />
                    ) : (
                      <span className="mz-profile-avatar-fallback">
                        <LuUser size={16} />
                      </span>
                    )}
                  </div>
                  <span className="mz-profile-name">{displayName}</span>
                  <LuChevronDown
                    size={14}
                    className={`mz-chevron ${isDropdownOpen ? "open" : ""}`}
                  />
                </button>
              )}

              <UserProfileDropdown
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                user={user}
                certCount={certHistory.certificates?.length || 0}
                onCertificatesClick={() => setActiveNavTab("certificates")}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onLogout={() => setIsLogoutModalOpen(true)}
              />
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="mz-content-area">
          {activeNavTab === "reports" ? (
            <div className="mz-reports-page-wrapper">
              <div className="mz-reports-top-banner">
                <div className="mz-reports-top-info">
                  <div className="mz-reports-badge-pill">
                    <LuShieldCheck size={14} /> Official Verified Records
                  </div>
                  <h1 className="mz-reports-main-heading">
                    Assessment <span className="mz-hero-gradient-text">Reports</span>
                  </h1>
                  <p className="mz-reports-sub-heading">
                    Every submitted assessment is permanently recorded here with compiler results, accuracy, test outcomes, and proctoring logs.
                  </p>
                </div>

                <div className="mz-reports-header-stats">
                  <div className="mz-rep-stat-box">
                    <span className="mz-rep-stat-val">{reportsList.length}</span>
                    <span className="mz-rep-stat-lbl">Total Attempts</span>
                  </div>
                  <div className="mz-rep-stat-box mz-stat-passed passed">
                    <span className="mz-rep-stat-val">
                      {reportsList.filter((r) => (r.passed !== undefined ? Boolean(r.passed) : r.score >= 80)).length}
                    </span>
                    <span className="mz-rep-stat-lbl">Passed (≥80%)</span>
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Discipline Selectors */}
              <div className="mz-reports-toolbar">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                  {/* Row 1: Subject Filter Pills */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "4px" }}>
                      Category:
                    </span>
                    {[
                      { id: "ALL", label: "All Engineering" },
                      { id: "coding", label: "DSA & Algorithms" },
                      { id: "proctored", label: "Proctored Certifications" },
                      { id: "project", label: "Software Projects" },
                    ].map((s) => {
                      const count = s.id === "ALL" 
                        ? reportsList.length 
                        : s.id === "proctored"
                        ? reportsList.filter((r) => String(r.sessionId || "").startsWith("mz_proc_") || String(r.type || "").toLowerCase().includes("proctor")).length
                        : s.id === "project"
                        ? reportsList.filter((r) => String(r.sessionId || "").startsWith("proj_") || String(r.type || "").toLowerCase().includes("project")).length
                        : reportsList.filter((r) => (r.subjectKey || "coding").toLowerCase() === "coding" || !String(r.sessionId || "").startsWith("proj_")).length;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`mz-filter-pill ${reportSubjectFilter === s.id ? "active" : ""}`}
                          onClick={() => setReportSubjectFilter(s.id)}
                        >
                          {s.label} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Row 2: Status & Type Filters */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div className="mz-reports-filter-pills">
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportFilter === "ALL" ? "active" : ""}`}
                        onClick={() => setReportFilter("ALL")}
                      >
                        All Results ({reportsList.length})
                      </button>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportFilter === "PASSED" ? "active" : ""}`}
                        onClick={() => setReportFilter("PASSED")}
                      >
                        Passed ({reportsList.filter((r) => (r.passed !== undefined ? Boolean(r.passed) : r.score >= 80)).length})
                      </button>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportFilter === "FAILED" ? "active" : ""}`}
                        onClick={() => setReportFilter("FAILED")}
                      >
                        Needs Improvement ({reportsList.filter((r) => !(r.passed !== undefined ? Boolean(r.passed) : r.score >= 80)).length})
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportTypeFilter === "ALL" ? "active" : ""}`}
                        onClick={() => setReportTypeFilter("ALL")}
                      >
                        All Types
                      </button>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportTypeFilter === "mcq_exam" ? "active" : ""}`}
                        onClick={() => setReportTypeFilter("mcq_exam")}
                      >
                        10-MCQ Exam
                      </button>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportTypeFilter === "coding_assessment" ? "active" : ""}`}
                        onClick={() => setReportTypeFilter("coding_assessment")}
                      >
                        Practical Code
                      </button>
                      <button
                        type="button"
                        className={`mz-filter-pill ${reportTypeFilter === "project_assessment" ? "active" : ""}`}
                        onClick={() => setReportTypeFilter("project_assessment")}
                      >
                        Projects
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reports Grid */}
              {isLoadingReports && reportsList.length === 0 ? (
                <div className="mz-reports-loading-box">
                  <div className="mz-reports-spinner" />
                  <p>Loading candidate reports...</p>
                </div>
              ) : reportsList.length === 0 ? (
                <div className="mz-reports-empty-box">
                  <div className="mz-rep-empty-icon-wrap">
                    <LuFileText size={44} />
                  </div>
                  <h3>No Assessment Reports Saved Yet</h3>
                  <p>
                    Once you take an assessment or complete an examination across any discipline,
                    your verified score, test outcomes, candidate answers, and tamper-proof proctoring history will be permanently saved here.
                  </p>
                  <button
                    type="button"
                    className="mz-rep-explore-btn"
                    onClick={() => navigate("/coding")}
                  >
                    <span>Go to Courses & Assessments</span>
                    <LuArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="mz-reports-card-grid">
                  {reportsList
                    .filter((rep) => {
                      const isPassScore = rep.passed !== undefined ? Boolean(rep.passed) : (rep.score !== undefined && rep.score >= 80);
                      if (reportFilter === "PASSED" && !isPassScore) return false;
                      if (reportFilter === "FAILED" && isPassScore) return false;
                      if (reportSubjectFilter !== "ALL" && (rep.subjectKey || "coding").toLowerCase() !== reportSubjectFilter.toLowerCase()) return false;
                      if (reportTypeFilter !== "ALL") {
                        const rType = (rep.type || "").toLowerCase();
                        const isMcqAttempt = rType.includes("mcq") || rType.includes("exam") || String(rep.sessionId || "").startsWith("attempt_");
                        const isProjectAttempt = rType.includes("project") || String(rep.sessionId || "").startsWith("proj_sub_");
                        if (reportTypeFilter === "mcq_exam" && !isMcqAttempt) return false;
                        if (reportTypeFilter === "project_assessment" && !isProjectAttempt) return false;
                        if (reportTypeFilter === "coding_assessment" && (isMcqAttempt || isProjectAttempt)) return false;
                      }
                      return true;
                    })
                    .map((rep, idx) => {
                      const isPass = rep.passed !== undefined ? Boolean(rep.passed) : rep.score >= 80;
                      const subj = (rep.subjectKey || "coding").toLowerCase();
                      const isMcq = rep.type === "mcq_exam" || String(rep.sessionId || "").startsWith("attempt_");
                      const isProject = rep.type === "project_assessment" || String(rep.sessionId || "").startsWith("proj_sub_");

                      return (
                        <div key={rep.sessionId || idx} className="mz-saved-report-card">
                          <div className="mz-rep-card-header">
                            <div className="mz-rep-card-tags">
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  background:
                                    subj === "language"
                                      ? "rgba(16, 185, 129, 0.15)"
                                      : subj === "driving"
                                      ? "rgba(245, 158, 11, 0.15)"
                                      : subj === "fitness"
                                      ? "rgba(168, 85, 247, 0.15)"
                                      : "rgba(59, 130, 246, 0.15)",
                                  color:
                                    subj === "language"
                                      ? "#34d399"
                                      : subj === "driving"
                                      ? "#fbbf24"
                                      : subj === "fitness"
                                      ? "#c084fc"
                                      : "#60a5fa",
                                  border: "1px solid currentColor",
                                }}
                              >
                                {subj.toUpperCase()}
                              </span>
                              <span className="mz-rep-diff-tag mz-rep-diff-medium medium">
                                {isMcq ? "10-MCQ Exam" : isProject ? "Project" : "Practical"}
                              </span>
                              <span className={`mz-rep-status-badge ${isPass ? "passed" : "failed"}`}>
                                {isPass ? <LuCircleCheck size={12} /> : null}
                                {isProject
                                  ? isPass
                                    ? "PROJECT COMPLETED"
                                    : "Needs Improvement"
                                  : isPass
                                  ? "Passed"
                                  : "Evaluated"}
                              </span>
                            </div>
                            <div className={`mz-rep-grade-pill grade-${(rep.grade || "F").toLowerCase().replace("+", "-plus")}`}>
                              {rep.grade || "F"}
                            </div>
                          </div>

                          <h3 className="mz-rep-card-title">
                            {rep.assessmentTitle || rep.questionTitle || "Proctored Assessment"}
                          </h3>

                          <div className="mz-rep-metrics-list">
                            <div className="mz-rep-metric-row">
                              <span className="mz-rep-metric-label"><LuUser size={13} /> Candidate</span>
                              <span className="mz-rep-metric-value">{rep.candidateDetails?.fullName || user?.fullName || user?.username || "Candidate"}</span>
                            </div>
                            <div className="mz-rep-metric-row">
                              <span className="mz-rep-metric-label"><LuAward size={13} /> Final Score</span>
                              <span className="mz-rep-metric-value mz-bold-score bold-score">
                                {isProject
                                  ? `${rep.marksObtained ?? rep.score ?? 0}/${rep.totalMarks || 100} Marks (${rep.percentage ?? rep.score ?? 0}% • ${rep.passedTests ?? 0}/${rep.totalTests ?? 6} Tests)`
                                  : `${rep.score || 0}% (${rep.passedTests ?? rep.score ?? 0}/{rep.totalTests ?? rep.totalQuestions ?? 10} ${isMcq ? "Correct" : "Tests Passed"})`}
                              </span>
                            </div>
                            <div className="mz-rep-metric-row">
                              <span className="mz-rep-metric-label"><LuClock size={13} /> Time Spent</span>
                              <span className="mz-rep-metric-value">
                                {rep.durationSeconds ? `${Math.floor(rep.durationSeconds / 60)}m ${rep.durationSeconds % 60}s` : "Timed"}
                              </span>
                            </div>
                            <div className="mz-rep-metric-row">
                              <span className="mz-rep-metric-label"><LuCalendar size={13} /> Submitted</span>
                              <span className="mz-rep-metric-value">
                                {rep.submittedAt ? new Date(rep.submittedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                              </span>
                            </div>
                          </div>

                          <div className="mz-rep-card-footer">
                            <span className="mz-rep-anomaly-pill">
                              {rep.violationsCount === 0 ? "0 Proctoring Anomalies" : `${rep.violationsCount} Anomaly Logged`}
                            </span>
                            <button
                              type="button"
                              className="mz-rep-view-report-btn"
                              onClick={() => navigate(rep.reportUrl || `/assessment-report/${rep.sessionId}`)}
                            >
                              <span>View Report</span>
                              <LuExternalLink size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : activeNavTab === "recordings" ? (
            <div className="mz-reports-page-wrapper" data-testid="recordings-full-page">
              {/* Top Banner */}
              <div className="mz-reports-top-banner">
                <div className="mz-reports-top-info">
                  <div className="mz-reports-badge-pill" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                    <LuVideo size={14} /> Cloud Recorded Video Meetings
                  </div>
                  <h1 className="mz-reports-main-heading">
                    Meeting <span className="mz-hero-gradient-text">Recordings</span>
                  </h1>
                  <p className="mz-reports-sub-heading">
                    Review video conferencing recordings, peer discussions, and presentations with searchable bookmarks, playback speeds, and instant sharing.
                  </p>
                </div>

                <div className="mz-reports-header-stats">
                  <div className="mz-rep-stat-box">
                    <span className="mz-rep-stat-val">{recordingsList.length}</span>
                    <span className="mz-rep-stat-lbl">Total Sessions</span>
                  </div>
                  <div className="mz-rep-stat-box" style={{ background: "#f8fafc" }}>
                    <span className="mz-rep-stat-val">
                      {Math.floor(recordingsList.reduce((acc, r) => acc + (r.durationSeconds || 0), 0) / 60)}m
                    </span>
                    <span className="mz-rep-stat-lbl">Recorded Time</span>
                  </div>
                  <div className="mz-rep-stat-box" style={{ minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <LuHardDrive size={13} color="#2563eb" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        {(recordingsAnalytics.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB / 5.0 GB
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 6, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(3, Math.round((recordingsAnalytics.totalSizeBytes / (recordingsAnalytics.storageQuotaBytes || 5368709120)) * 100)))}%`,
                          height: "100%",
                          background: "#2563eb",
                        }}
                      />
                    </div>
                    <span className="mz-rep-stat-lbl" style={{ marginTop: 4 }}>Cloud Storage</span>
                  </div>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "14px 18px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                {/* Search & Date */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      padding: "6px 12px",
                      minWidth: 240,
                    }}
                  >
                    <LuSearch size={14} color="#64748b" />
                    <input
                      type="text"
                      placeholder="Search title, host, or participant..."
                      value={recSearchQuery}
                      onChange={(e) => setRecSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchRecordings()}
                      style={{
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        fontSize: 13,
                        color: "#0f172a",
                        width: "100%",
                      }}
                      data-testid="recordings-search-input"
                    />
                    {recSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setRecSearchQuery("");
                          setTimeout(fetchRecordings, 10);
                        }}
                        style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                      >
                        <LuX size={14} color="#94a3b8" />
                      </button>
                    )}
                  </div>

                  {/* Date Filter Tabs */}
                  <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
                    {[
                      { key: "all", label: "All Dates" },
                      { key: "today", label: "Today" },
                      { key: "week", label: "This Week" },
                      { key: "month", label: "This Month" },
                    ].map((df) => (
                      <button
                        key={df.key}
                        type="button"
                        onClick={() => setRecDateFilter(df.key)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "none",
                          fontSize: 12,
                          fontWeight: recDateFilter === df.key ? 700 : 500,
                          background: recDateFilter === df.key ? "#ffffff" : "transparent",
                          color: recDateFilter === df.key ? "#2563eb" : "#64748b",
                          boxShadow: recDateFilter === df.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                          cursor: "pointer",
                        }}
                      >
                        {df.label}
                      </button>
                    ))}
                  </div>

                  {/* Scope Tabs */}
                  <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
                    {[
                      { key: "all", label: "All Sessions" },
                      { key: "personal", label: "My Meetings" },
                      { key: "shared", label: "Shared With Me" },
                    ].map((sc) => (
                      <button
                        key={sc.key}
                        type="button"
                        onClick={() => setRecScope(sc.key)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "none",
                          fontSize: 12,
                          fontWeight: recScope === sc.key ? 700 : 500,
                          background: recScope === sc.key ? "#ffffff" : "transparent",
                          color: recScope === sc.key ? "#2563eb" : "#64748b",
                          boxShadow: recScope === sc.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                          cursor: "pointer",
                        }}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Sort & Action */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <select
                    value={recSortOrder}
                    onChange={(e) => setRecSortOrder(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: 12.5,
                      color: "#334155",
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                    <option value="duration_desc">Sort: Longest Duration</option>
                    <option value="duration_asc">Sort: Shortest Duration</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => navigate("/live")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <LuPlus size={14} /> Start New Meeting
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              {isLoadingRecordings && recordingsList.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                  <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>Loading cloud recordings...</p>
                </div>
              ) : recordingsList.length === 0 ? (
                <div
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    background: "#ffffff",
                    border: "1px dashed #cbd5e1",
                    borderRadius: 18,
                  }}
                >
                  <LuVideo size={36} color="#94a3b8" style={{ marginBottom: 10 }} />
                  <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                    No meeting recordings found
                  </h3>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
                    {recSearchQuery || recDateFilter !== "all" || recScope !== "all"
                      ? "Try adjusting your search terms or filters."
                      : "Start a Mastery Zone Live session to record video discussions and peer reviews."}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/live")}
                    style={{
                      padding: "8px 18px",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Start New Meeting
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 16,
                  }}
                >
                  {recordingsList.map((rec) => {
                    const totalSecs = Math.max(0, Math.round(rec.durationSeconds || 0));
                    const hrs = Math.floor(totalSecs / 3600);
                    const mins = Math.floor((totalSecs % 3600) / 60);
                    const secs = totalSecs % 60;
                    const durationStr = hrs > 0
                      ? `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
                      : `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                    const dateStr = new Date(rec.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const sizeMB = ((rec.fileSize || 0) / (1024 * 1024)).toFixed(1);

                    return (
                      <div
                        key={rec.recordingId}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        }}
                        data-testid={`recording-card-${rec.recordingId}`}
                      >
                        {/* Video Thumbnail Area */}
                        <div
                          style={{
                            position: "relative",
                            height: 140,
                            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                          onClick={() => setActivePlayingRecording(rec)}
                        >
                          <div
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: "50%",
                              background: "rgba(37, 99, 235, 0.95)",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            }}
                          >
                            <LuPlay size={22} style={{ marginLeft: 2 }} />
                          </div>

                          <span
                            style={{
                              position: "absolute",
                              bottom: 8,
                              right: 8,
                              background: "rgba(0, 0, 0, 0.85)",
                              color: "#ffffff",
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <LuClock size={11} /> {durationStr}
                          </span>

                          <span
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              background: "rgba(34, 197, 94, 0.9)",
                              color: "#ffffff",
                              padding: "2px 7px",
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            {rec.status || "Ready"}
                          </span>
                        </div>

                        {/* Details */}
                        <div style={{ padding: "14px 16px", flex: 1 }}>
                          <h4
                            style={{
                              margin: "0 0 6px",
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#0f172a",
                              lineHeight: 1.35,
                              cursor: "pointer",
                            }}
                            onClick={() => setActivePlayingRecording(rec)}
                          >
                            {rec.title}
                          </h4>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#2563eb",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              marginBottom: 6,
                              fontWeight: 700,
                            }}
                          >
                            <LuClock size={13} />
                            <span>Exact Duration: <strong>{durationStr}</strong></span>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#64748b",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 6,
                            }}
                          >
                            <span>Host: <strong>{rec.hostName}</strong></span>
                            <span>•</span>
                            <span>{rec.participantsCount || 1} participant(s)</span>
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: "#94a3b8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>Recorded on {dateStr}</span>
                            <span>{sizeMB} MB</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          style={{
                            padding: "10px 14px",
                            borderTop: "1px solid #f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#fafafa",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setActivePlayingRecording(rec)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 6,
                              border: "none",
                              background: "#2563eb",
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                            data-testid={`play-recording-${rec.recordingId}`}
                          >
                            <LuPlay size={13} /> Play
                          </button>

                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setRenameModalRecording(rec);
                                setRenameInput(rec.title);
                              }}
                              style={{
                                border: "1px solid #e2e8f0",
                                background: "#ffffff",
                                color: "#2563eb",
                                padding: "5px 9px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                              title="Rename Recording"
                              data-testid={`rename-recording-${rec.recordingId}`}
                            >
                              <LuPencil size={12} /> Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareRecording(rec)}
                              style={{
                                border: "1px solid #e2e8f0",
                                background: "#ffffff",
                                color: "#475569",
                                padding: "5px 8px",
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                              title="Share Link"
                              data-testid={`share-recording-${rec.recordingId}`}
                            >
                              <LuShare2 size={13} />
                            </button>
                            <a
                              href={rec.fileUrl}
                              download={`${rec.title || "recording"}.webm`}
                              style={{
                                border: "1px solid #e2e8f0",
                                background: "#ffffff",
                                color: "#475569",
                                padding: "5px 8px",
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                textDecoration: "none",
                              }}
                              title="Download Video"
                            >
                              <LuDownload size={13} />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setRenameModalRecording(rec);
                                setRenameInput(rec.title);
                              }}
                              style={{
                                border: "1px solid #e2e8f0",
                                background: "#ffffff",
                                color: "#475569",
                                padding: "5px 8px",
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                              title="Rename Recording"
                            >
                              <LuPencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecording(rec.recordingId)}
                              style={{
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#dc2626",
                                padding: "5px 8px",
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                              title="Delete Recording"
                            >
                              <LuTrash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeNavTab === "certifications" ? (
            <div className="mz-reports-page-wrapper" data-testid="certifications-full-page">
              {/* Top Banner */}
              <div className="mz-reports-top-banner">
                <div className="mz-reports-top-info">
                  <div
                    className="mz-reports-badge-pill"
                    style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}
                  >
                    <LuAward size={14} /> Official Verified Credentials
                  </div>
                  <h1 className="mz-reports-title">Certifications & Assessment History</h1>
                  <p className="mz-reports-subtitle">
                    Review your proctored assessment attempts, examination transcripts, and officially verified credentials.
                  </p>
                </div>

                <div className="mz-reports-top-stats" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div className="mz-stat-pill">
                    <span className="mz-stat-label">Total Attempts</span>
                    <strong className="mz-stat-value">{certHistory.attempts?.length || 0}</strong>
                  </div>
                  <div className="mz-stat-pill">
                    <span className="mz-stat-label">Earned Credentials</span>
                    <strong className="mz-stat-value" style={{ color: "#16a34a" }}>
                      {certHistory.certificates?.length || 0}
                    </strong>
                  </div>
                  {(() => {
                    const dsaInfo = getEarnedCertInfo("dsa_cert");
                    if (dsaInfo.isCompleted) {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (dsaInfo.certificateId) navigate(`/verify/${dsaInfo.certificateId}`);
                          }}
                          style={{
                            padding: "8px 16px",
                            background: "#16a34a",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
                          }}
                        >
                          <LuCircleCheck size={15} /> DSA Certified 🏆
                        </button>
                      );
                    }
                    return (
                      <button
                        type="button"
                        onClick={() => handleOpenCertExam("dsa_cert", "Data Structures & Algorithms (DSA)")}
                        style={{
                          padding: "8px 16px",
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
                        }}
                      >
                        <LuAward size={15} /> Take DSA Assessment 🚀
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Genuine Loading Animation for Certifications */}
              {isLoadingCertHistory && (!certHistory.certificates?.length && !certHistory.attempts?.length) ? (
                <div
                  className="mz-reports-loading-box"
                  style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    background: "#ffffff",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    marginBottom: 32,
                  }}
                >
                  <div className="mz-reports-spinner" style={{ margin: "0 auto 14px" }} />
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#64748b" }}>
                    Loading verified credentials & assessment transcripts...
                  </p>
                </div>
              ) : (
                <>
                  {/* AREA A: EARNED CERTIFICATES */}
                  <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                      🏆 My Earned Certificates ({certHistory.certificates?.length || 0})
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                      High-resolution vector PDF certificates verified via unique credential IDs.
                    </p>
                  </div>
                </div>

                {certHistory.certificates?.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                      gap: 18,
                    }}
                  >
                    {certHistory.certificates.map((cert) => {
                      const verifyUrl =
                        cert.verificationUrl ||
                        `${window.location.origin}/verify/${cert.certificateId}`;
                      const shareLinkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                        verifyUrl
                      )}`;
                      const issueDateStr = cert.issueDate
                        ? new Date(cert.issueDate).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Issued";

                      return (
                        <div
                          key={cert.certificateId}
                          style={{
                            background: "#ffffff",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: 14,
                            padding: 20,
                            boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                              }}
                            >
                              <span
                                style={{
                                  background: "#f0fdf4",
                                  border: "1px solid #bbf7d0",
                                  color: "#15803d",
                                  padding: "3px 10px",
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <LuCircleCheck size={13} /> VERIFIED CREDENTIAL
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontFamily: "monospace",
                                  color: "#64748b",
                                  fontWeight: 600,
                                }}
                              >
                                {cert.certificateId}
                              </span>
                            </div>

                            <h3
                              style={{
                                fontSize: 17,
                                fontWeight: 800,
                                color: "#0f172a",
                                margin: "0 0 6px",
                              }}
                            >
                              {cert.certificationTitle}
                            </h3>
                            <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>
                              Issued to: <strong>{cert.recipientName}</strong>
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
                              Issued on: {issueDateStr}
                            </div>
                          </div>

                          <div
                            style={{
                              borderTop: "1px solid #f1f5f9",
                              paddingTop: 12,
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <a
                              href={`${API_BASE}/api/certifications/certificate/${cert.certificateId}/download`}
                              download
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "7px 12px",
                                borderRadius: 6,
                                background: "#2563eb",
                                color: "#ffffff",
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <LuDownload size={13} /> Download PDF
                            </a>

                            <a
                              href={shareLinkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: "7px 12px",
                                borderRadius: 6,
                                background: "#0a66c2",
                                color: "#ffffff",
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <LuShare2 size={13} /> LinkedIn
                            </a>

                            <a
                              href={`/verify/${cert.certificateId}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "7px 12px",
                                borderRadius: 6,
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                fontSize: 12,
                                fontWeight: 600,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <LuExternalLink size={13} /> Verify
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px dashed #cbd5e1",
                      borderRadius: 14,
                      padding: "36px 20px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        background: "#faf5ff",
                        color: "#7c3aed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 12px",
                      }}
                    >
                      <LuAward size={24} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                      No Earned Credentials Yet
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        maxWidth: 480,
                        margin: "0 auto 16px",
                        lineHeight: 1.5,
                      }}
                    >
                      Pass the 20 randomized multiple-choice questions (≥80%) and solve both algorithmic coding challenges under live proctoring to earn your verified Mastery Zone Certificate.
                    </p>
                    {(() => {
                      const dsaInfo = getEarnedCertInfo("dsa_cert");
                      if (dsaInfo.isCompleted) {
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (dsaInfo.certificateId) navigate(`/verify/${dsaInfo.certificateId}`);
                            }}
                            style={{
                              padding: "9px 20px",
                              background: "#16a34a",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            ✓ View Earned DSA Certificate
                          </button>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => handleOpenCertExam("dsa_cert", "Data Structures & Algorithms (DSA)")}
                          style={{
                            padding: "9px 20px",
                            background: "#7c3aed",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Start DSA Certification Assessment 🚀
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* AREA B: MY CERTIFICATION ATTEMPTS */}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>
                  📋 Assessment Attempts & Proctoring Audit ({certHistory.attempts?.length || 0})
                </h2>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
                  Complete log of each session, MCQ scores, coding challenges status, and proctoring compliance.
                </p>

                {certHistory.attempts?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {certHistory.attempts.map((att) => {
                      const isPassed = att.status === "PASSED";
                      const isInProgress = att.status === "IN_PROGRESS";
                      const isFailed = att.status === "FAILED";
                      const score = att.score || {};
                      const proctoring = att.proctoring || {};
                      const dateStr = att.startTime
                        ? new Date(att.startTime).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Recent";

                      return (
                        <div
                          key={att.attemptId}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 12,
                            padding: "16px 20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 14,
                          }}
                        >
                          <div style={{ minWidth: 220 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <strong style={{ fontSize: 14.5, color: "#0f172a" }}>
                                {att.certTitle || "DSA Certification"} • Attempt #{att.attemptNumber || 1}
                              </strong>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 12,
                                  background: isPassed
                                    ? "#dcfce7"
                                    : isInProgress
                                    ? "#dbeafe"
                                    : "#fee2e2",
                                  color: isPassed
                                    ? "#166534"
                                    : isInProgress
                                    ? "#1e40af"
                                    : "#991b1b",
                                }}
                              >
                                {att.status}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              Started on {dateStr}
                            </div>
                          </div>

                          {/* Scores & Proctoring Telemetry */}
                          <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ fontSize: 12.5 }}>
                              <div style={{ color: "#64748b", fontSize: 11 }}>Part A: MCQs</div>
                              <strong style={{ color: score.mcqPassed ? "#16a34a" : "#dc2626" }}>
                                {score.mcqScore ?? 0} / {score.mcqTotal ?? 20} ({score.mcqPercentage ?? 0}%)
                              </strong>
                            </div>

                            <div style={{ fontSize: 12.5 }}>
                              <div style={{ color: "#64748b", fontSize: 11 }}>Part B: Coding</div>
                              <strong style={{ color: score.codingPassed ? "#16a34a" : "#475569" }}>
                                Q1: {score.codingQ1Solved ? "✓ Solved" : "✗"} • Q2:{" "}
                                {score.codingQ2Solved ? "✓ Solved" : "✗"}
                              </strong>
                            </div>

                            <div style={{ fontSize: 12.5 }}>
                              <div style={{ color: "#64748b", fontSize: 11 }}>Proctoring</div>
                              <span
                                style={{
                                  color: (proctoring.violationsCount || 0) === 0 ? "#16a34a" : "#d97706",
                                  fontWeight: 600,
                                }}
                              >
                                {(proctoring.violationsCount || 0) === 0
                                  ? "Compliant ✓"
                                  : `${proctoring.violationsCount} Flag(s)`}
                              </span>
                            </div>
                          </div>

                          {/* Action */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {!isInProgress && (
                              <button
                                type="button"
                                onClick={() => navigate(`/assessment-report/${att.attemptId}`)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  background: "#f8fafc",
                                  border: "1px solid #cbd5e1",
                                  color: "#334155",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <LuFileText size={13} /> View Report
                              </button>
                            )}

                            {isInProgress ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCertExamModal({
                                    id: att.certId,
                                    name: att.certTitle,
                                  })
                                }
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 6,
                                  background: "#2563eb",
                                  color: "#ffffff",
                                  border: "none",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Resume Exam ➔
                              </button>
                            ) : isPassed ? (
                              <a
                                href={`/verify/${att.certificateId}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  background: "#dcfce7",
                                  border: "1px solid #86efac",
                                  color: "#166534",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  textDecoration: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <LuCircleCheck size={13} /> Certificate
                              </a>
                            ) : (() => {
                              const subjectStatus = getEarnedCertInfo(att.certId);
                              if (subjectStatus.isCompleted) {
                                return (
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: "#166534",
                                      fontWeight: 700,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      background: "#dcfce7",
                                      padding: "5px 10px",
                                      borderRadius: 6,
                                      border: "1px solid #86efac",
                                    }}
                                  >
                                    <LuCircleCheck size={13} /> Certified
                                  </span>
                                );
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenCertExam(att.certId, att.certTitle || "Certification Examination")
                                  }
                                  style={{
                                    padding: "6px 14px",
                                    borderRadius: 6,
                                    background: "#f1f5f9",
                                    border: "1px solid #cbd5e1",
                                    color: "#334155",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  Retake Exam
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: 20,
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    No assessment attempts recorded yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : activeNavTab === "settings" ? (
            <div className="mz-reports-page-wrapper">
              <div className="mz-reports-top-banner">
                <div className="mz-reports-top-info">
                  <div className="mz-reports-badge-pill" style={{ color: "#2563eb", background: "#eff6ff", borderColor: "#bfdbfe" }}>
                    <LuSettings size={14} /> System Configuration
                  </div>
                  <h1 className="mz-reports-main-heading">
                    Platform <span className="mz-hero-gradient-text">Settings</span>
                  </h1>
                  <p className="mz-reports-sub-heading">
                    Manage your candidate preferences, notification channels, security parameters, and account controls.
                  </p>
                </div>
              </div>

              <div style={{ maxWidth: 880, margin: "24px auto", display: "flex", flexDirection: "column", gap: 20 }}>
                {/* 1. Account Details */}
                <div style={{ background: "#ffffff", padding: "24px 28px", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(15,23,42,0.03)" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>Profile & Candidate Identification</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px" }}>Your verified credentials on Mastery Zone.</p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    <div style={{ padding: 14, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Full Name</span>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#0f172a", marginTop: 4 }}>{user?.fullName || displayName || "Verified Candidate"}</div>
                    </div>
                    <div style={{ padding: 14, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Email Address</span>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#0f172a", marginTop: 4 }}>{user?.email || localStorage.getItem("userEmail") || "user@masteryzone.com"}</div>
                    </div>
                    <div style={{ padding: 14, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Candidate ID</span>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#2563eb", marginTop: 4 }}>{`CAND-${String(user?._id || user?.id || "7CA59D").slice(-6).toUpperCase()}`}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Notification Preferences */}
                <div style={{ background: "#ffffff", padding: "24px 28px", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(15,23,42,0.03)" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>Preferences & Notifications</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px" }}>Control notification channels, exam reminders, and progress telemetry.</p>
                  
                  <div className="mz-setting-row" style={{ padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div className="mz-setting-info">
                      <span className="mz-setting-name">Email Notifications</span>
                      <span className="mz-setting-desc">Receive assessment receipts, certificate alerts, and learning track milestones.</span>
                    </div>
                    <label className="mz-switch">
                      <input
                        type="checkbox"
                        checked={preferences.notifications}
                        onChange={(e) => handlePreferenceChange("notifications", e.target.checked)}
                      />
                      <span className="mz-slider" />
                    </label>
                  </div>

                  <div className="mz-setting-row" style={{ padding: "14px 0" }}>
                    <div className="mz-setting-info">
                      <span className="mz-setting-name">Compiler Test Passed Audio Chime</span>
                      <span className="mz-setting-desc">Play subtle confirmation tone when all test cases pass in the compiler.</span>
                    </div>
                    <label className="mz-switch">
                      <input
                        type="checkbox"
                        defaultChecked={true}
                      />
                      <span className="mz-slider" />
                    </label>
                  </div>
                </div>

                {/* 3. Security & Account Controls */}
                <div style={{ background: "#ffffff", padding: "24px 28px", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(15,23,42,0.03)" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>Security & Account Controls</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px" }}>Manage password security and permanent account removal.</p>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                    <button
                      type="button"
                      className="mz-report-btn mz-report-btn-secondary"
                      onClick={() => navigate("/forgot-password")}
                      style={{ padding: "9px 18px", fontSize: "13px" }}
                    >
                      Reset Password
                    </button>
                    <button
                      type="button"
                      className="mz-report-btn"
                      onClick={handleDeleteAccount}
                      style={{ padding: "9px 18px", fontSize: "13px", color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2" }}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= DEDICATED CODING PLATFORM DASHBOARD ================= */
            <div className="mz-coding-platform-dashboard mz-dashboard-entrance" style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 0 40px" }}>
              {/* 1. Header & Learner Profile Spotlight */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                  marginBottom: 26,
                }}
              >
                <div className="mz-welcome-entrance">
                  <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                    Welcome back, {displayName} <span className="mz-wave-hand">👋</span>
                  </h2>
                  <p style={{ fontSize: "0.95rem", color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>
                    Your centralized software engineering headquarters. Master Data Structures, build production systems, and earn accredited credentials.
                  </p>
                </div>

                {user && (
                  <div
                    className="mz-user-entrance"
                    onClick={() => navigate("/profile")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: "#ffffff",
                      padding: "8px 18px 8px 10px",
                      borderRadius: 32,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                      cursor: "pointer",
                    }}
                    title="View & Edit Profile"
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "#2563eb",
                        border: "2px solid #3b82f6",
                        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
                      }}
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        (displayName || "U")[0]?.toUpperCase()
                      )}
                    </div>
                    <div style={{ textAlign: "left", lineHeight: 1.25 }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
                        {displayName}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                        <span className="mz-live-status-dot" />
                        <span>Active Profile →</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Coding Telemetry Quick Stats Strip (4 Interactive Tiles) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginBottom: 28,
                }}
              >
                {/* Tile 1: Streak */}
                <div
                  className="mz-telemetry-tile mz-tile-anim-1"
                  onClick={() => navigate("/coding?tab=challenges")}
                  title="Click to view DSA Challenges and maintain your streak"
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                      color: "#ea580c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #fed7aa",
                    }}
                  >
                    <LuFlame size={24} className="mz-pulse-flame" />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9a3412", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Coding Streak
                    </span>
                    <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                      {codingStats.streak || 1} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>Days</span>
                    </div>
                    <span style={{ fontSize: "0.74rem", color: "#ea580c", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span className="mz-telemetry-badge-icon" style={{ background: "#ffedd5", border: "1px solid #fed7aa" }}>
                        <LuFlame size={11} color="#ea580c" />
                      </span>
                      <span>Keep daily momentum</span>
                    </span>
                  </div>
                </div>

                {/* Tile 2: Engineering XP */}
                <div
                  className="mz-telemetry-tile mz-tile-anim-2"
                  onClick={() => navigate("/progress")}
                  title="Click to view learning progress & XP breakdown"
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    <LuZap size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Engineering XP
                    </span>
                    <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                      {codingStats.totalXp || 120} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>XP</span>
                    </div>
                    <span style={{ fontSize: "0.74rem", color: "#2563eb", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span className="mz-telemetry-badge-icon" style={{ background: "#dbeafe", border: "1px solid #bfdbfe" }}>
                        <LuZap size={11} color="#2563eb" />
                      </span>
                      <span>Level 2 Developer</span>
                    </span>
                  </div>
                </div>

                {/* Tile 3: Challenges Solved */}
                <div
                  className="mz-telemetry-tile mz-tile-anim-3"
                  onClick={() => navigate("/coding?tab=challenges")}
                  title="Click to solve algorithmic challenges"
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <LuCodeXml size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Challenges Solved
                    </span>
                    <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                      {codingStats.challengesSolvedCount || 0} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>/ {codingStats?.totalChallenges || 235}</span>
                    </div>
                    <span style={{ fontSize: "0.74rem", color: "#059669", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span className="mz-telemetry-badge-icon" style={{ background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                        <LuTarget size={11} color="#059669" />
                      </span>
                      <span>Real Test Assertions</span>
                    </span>
                  </div>
                </div>

                {/* Tile 4: Study Time */}
                <div
                  className="mz-telemetry-tile mz-tile-anim-4"
                  onClick={() => navigate("/progress")}
                  title="Click to view total study telemetry"
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
                      color: "#7c3aed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #ddd6fe",
                    }}
                  >
                    <LuClock size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6d28d9", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Study Time
                    </span>
                    <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                      {codingStats.totalHours || 4.5} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>Hours</span>
                    </div>
                    <span style={{ fontSize: "0.74rem", color: "#7c3aed", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span className="mz-telemetry-badge-icon" style={{ background: "#ede9fe", border: "1px solid #ddd6fe" }}>
                        <LuClock size={11} color="#7c3aed" />
                      </span>
                      <span>Active Focus Telemetry</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Hero Spotlight: Coding & Software Engineering Ecosystem */}
              <div className="mz-hero-banner-glass">
                <div style={{ maxWidth: 640, zIndex: 1 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#1d4ed8",
                      padding: "5px 14px",
                      borderRadius: 24,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      marginBottom: 14,
                    }}
                  >
                    <LuSparkles size={14} /> Official Coding & DSA Ecosystem
                  </div>
                  <h3
                    style={{
                      fontSize: "1.9rem",
                      fontWeight: 800,
                      color: "#0f172a",
                      margin: "0 0 12px",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.25,
                    }}
                  >
                    Master Algorithmic Thinking & Full-Stack Systems
                  </h3>
                  <p
                    style={{
                      color: "#475569",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      margin: "0 0 24px",
                    }}
                  >
                    Solve industrial coding challenges with real-time browser compilers, construct milestone multi-file architectures, and earn accredited, proctored computer science certificates.
                  </p>
                  
                  {/* Action Buttons Row */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      className="mz-hero-btn-primary"
                      onClick={() => navigate("/coding?tab=challenges", { state: { tab: "challenges" } })}
                      title="Solve DSA Challenges in Compiler"
                    >
                      <LuCodeXml size={18} /> Solve DSA Challenges
                    </button>
                    <button
                      type="button"
                      className="mz-hero-btn-glass"
                      onClick={() => navigate("/coding?tab=learning_path", { state: { tab: "learning_path" } })}
                      title="Open Structured Learning Path"
                    >
                      <LuBookOpen size={18} /> Learn & Path
                    </button>
                    <button
                      type="button"
                      className="mz-hero-btn-glass"
                      onClick={() => navigate("/coding?tab=projects", { state: { tab: "projects" } })}
                      title="Open Industry Software Projects"
                    >
                      <LuFolderGit2 size={18} /> Projects
                    </button>
                    <button
                      type="button"
                      className="mz-hero-btn-glass"
                      onClick={() => navigate("/certificates")}
                      title="View Proctored Examinations"
                    >
                      <LuAward size={18} /> Proctored Exams
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexShrink: 0,
                    zIndex: 1,
                    width: 360,
                    maxWidth: "100%",
                  }}
                >
                  <img
                    src={heroLaptop4k}
                    alt="Mastery Zone 4K Interactive Coding Platform"
                    className="mz-hero-laptop-img"
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: 230,
                      objectFit: "contain",
                      filter: "drop-shadow(0 14px 28px rgba(15, 23, 42, 0.12))",
                    }}
                  />
                </div>
              </div>

              {/* 4. Interactive Problem of the Day Spotlight */}
              <div className="mz-pod-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
                  <div style={{ maxWidth: 760 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: 800, color: "#4338ca", background: "#eef2ff", border: "1px solid #c7d2fe", padding: "4px 12px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <LuFlame size={13} color="#ea580c" className="mz-pulse-flame" /> Problem of the Day
                      </span>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#b45309", background: "#fffbeb", border: "1px solid #fef3c7", padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                        Medium
                      </span>
                      <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#334155", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "3px 10px", borderRadius: 20 }}>
                        Arrays &amp; Prefix Sum
                      </span>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#047857", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <LuSparkles size={12} color="#059669" /> +50 XP Reward
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                      Subarray Sum Equals K
                    </h3>
                    <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: 1.65, margin: "0 0 14px", maxWidth: 720 }}>
                      Given an array of integers <code className="mz-pod-code-inline">nums</code> and an integer <code className="mz-pod-code-inline">k</code>, return the total number of continuous subarrays whose sum equals to <code className="mz-pod-code-inline">k</code>. Implement an optimal O(N) solution using a prefix sum frequency hash map.
                    </p>

                    {/* Test Case Preview */}
                    <div className="mz-pod-io-box">
                      <div className="mz-pod-io-item">
                        <span className="mz-pod-io-label">Sample Input:</span>
                        <code className="mz-pod-io-code">nums = [1, 1, 1], k = 2</code>
                      </div>
                      <div className="mz-pod-io-divider" />
                      <div className="mz-pod-io-item">
                        <span className="mz-pod-io-label">Expected Output:</span>
                        <code className="mz-pod-io-code mz-pod-io-success">2</code>
                      </div>
                    </div>

                    <div className="mz-pod-meta-row">
                      <span className="mz-pod-meta-pill">
                        <LuCircleCheck size={14} color="#16a34a" /> Acceptance: <strong>44.2%</strong>
                      </span>
                      <span>•</span>
                      <span className="mz-pod-meta-pill">
                        <LuClock size={14} color="#6366f1" /> Time Limit: <strong>1000ms</strong>
                      </span>
                      <span>•</span>
                      <span className="mz-pod-meta-pill">
                        <LuTerminal size={14} color="#0284c7" /> Languages: <strong>Python, Java, C++, JS</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 200, alignSelf: "center" }}>
                    <button
                      type="button"
                      className="mz-pod-btn-solve"
                      onClick={() => {
                        navigate("/coding?tab=challenges", { state: { tab: "challenges" } });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Solve Challenge <LuArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      className="mz-pod-btn-hint"
                      onClick={() => setShowPodHint((prev) => !prev)}
                    >
                      <LuLightbulb size={15} color="#d97706" />
                      {showPodHint ? "Hide Solution Hint" : "View Solution Hint"}
                    </button>
                  </div>
                </div>

                {/* Collapsible Solution Hint Accordion */}
                {showPodHint && (
                  <div
                    style={{
                      marginTop: 18,
                      padding: "16px 22px",
                      background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                      border: "1px solid #fde68a",
                      borderRadius: 14,
                      boxShadow: "0 2px 8px rgba(245, 158, 11, 0.08)",
                      animation: "mzFadeInUp 0.25s ease-out forwards",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <LuLightbulb size={16} color="#b45309" />
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#92400e" }}>
                        Algorithmic Intuition &amp; Optimal Approach
                      </span>
                    </div>
                    <p style={{ fontSize: "0.86rem", color: "#78350f", lineHeight: 1.6, margin: 0 }}>
                      Maintain a running prefix sum <code>currSum</code> and a hash map tracking how often each prefix sum occurs. For each element, check if <code>currSum - k</code> exists in your map. If so, add its frequency to your answer. This reduces the brute-force O(N²) solution down to an optimal <strong>O(N) Time and O(N) Space</strong> algorithm.
                    </p>
                  </div>
                )}
              </div>

              {/* 5. DSA Problem-Solving Tracks (6 Cards in 3x2 Grid) */}
              <div style={{ marginBottom: 38 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Data Structures & Algorithms Tracks
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "#64748b", margin: "4px 0 0" }}>
                      Curated algorithmic topics designed to take you from foundational concepts to FAANG-grade mastery.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/coding?tab=challenges", { state: { tab: "challenges" } })}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    View All 235 Challenges <LuArrowRight size={14} />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
                  {DSA_TOPICS.map((topic) => (
                    <div
                      key={topic.id}
                      className="mz-interactive-card"
                      onClick={() => navigate(topic.route, { state: { tab: "challenges", topic: topic.id } })}
                      title={`Open ${topic.title} practice`}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              background: topic.badgeBg,
                              color: topic.badgeColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <LuCodeXml size={22} />
                          </div>
                          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "3px 9px", borderRadius: 8 }}>
                            {topic.problemCount} Challenges
                          </span>
                        </div>

                        <h4 style={{ fontSize: "1.08rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                          {topic.title}
                        </h4>
                        <p style={{ fontSize: "0.84rem", color: "#64748b", lineHeight: 1.5, margin: "0 0 14px" }}>
                          {topic.description}
                        </p>

                        {/* Sample Problem Tags */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                          {topic.challenges?.slice(0, 3).map((ch) => (
                            <span key={ch} style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#334155", padding: "2px 7px", borderRadius: 6, fontWeight: 500 }}>
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8" }}>
                          {topic.difficulty}
                        </span>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: topic.badgeColor, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          Practice Topic <LuArrowRight size={13} className="mz-card-arrow-icon" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Structured Learning Paths (Curricula) */}
              <div style={{ marginBottom: 38 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Structured Learning Paths
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "#64748b", margin: "4px 0 0" }}>
                      Deepen your software engineering expertise in industry-standard languages, paradigms, and architecture.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/coding?tab=learning_path", { state: { tab: "learning_path" } })}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Open Learning Path <LuArrowRight size={14} />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
                  {PROGRAMMING_COURSES.map((course) => (
                    <div
                      key={course.id}
                      className="mz-interactive-card"
                      onClick={() => navigate(course.route, { state: { tab: "learning_path", track: course.id } })}
                      title={`Open ${course.title} in Learning Path`}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: course.iconColor, background: `${course.iconColor}15`, padding: "3px 9px", borderRadius: 6 }}>
                            {course.level}
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
                            {course.hours}
                          </span>
                        </div>
                        <h4 style={{ fontSize: "1.08rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
                          {course.title}
                        </h4>
                        <p style={{ fontSize: "0.84rem", color: "#64748b", lineHeight: 1.5, margin: "0 0 14px" }}>
                          {course.description}
                        </p>
                      </div>

                      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8" }}>
                          {course.modules} Interactive Modules
                        </span>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2563eb", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          Start Track <LuArrowRight size={13} className="mz-card-arrow-icon" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Industry Software Projects — Interactive Slide Showcase & Cover Blueprints */}
              <div style={{ marginBottom: 38 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Real-World Software Engineering Projects
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "#64748b", margin: "4px 0 0" }}>
                      Hands-on multi-file workspaces with step-by-step milestones, code review, and automated testing.
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* View Mode Toggle */}
                    <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <button
                        type="button"
                        onClick={() => setProjViewMode("slider")}
                        style={{
                          background: projViewMode === "slider" ? "#ffffff" : "transparent",
                          color: projViewMode === "slider" ? "#2563eb" : "#64748b",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "5px 12px",
                          borderRadius: "7px",
                          cursor: "pointer",
                          boxShadow: projViewMode === "slider" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        Slide Showcase
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjViewMode("grid")}
                        style={{
                          background: projViewMode === "grid" ? "#ffffff" : "transparent",
                          color: projViewMode === "grid" ? "#2563eb" : "#64748b",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "5px 12px",
                          borderRadius: "7px",
                          cursor: "pointer",
                          boxShadow: projViewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        Browse All (5)
                      </button>
                    </div>

                    {/* Slide Prev/Next Arrows (in slider mode) */}
                    {projViewMode === "slider" && (
                      <div className="mz-proj-controls">
                        <button
                          type="button"
                          className="mz-proj-nav-arrow"
                          onClick={() =>
                            setActiveProjSlide((prev) =>
                              prev === 0 ? SOFTWARE_PROJECTS.length - 1 : prev - 1
                            )
                          }
                          title="Previous Project Slide"
                        >
                          <LuChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          className="mz-proj-nav-arrow"
                          onClick={() =>
                            setActiveProjSlide((prev) =>
                              (prev + 1) % SOFTWARE_PROJECTS.length
                            )
                          }
                          title="Next Project Slide"
                        >
                          <LuChevronRight size={16} />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate("/coding?tab=projects", { state: { tab: "projects" } })}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#059669",
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Open Projects Workspace <LuArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* ── MODE 1: SLIDE SHOWCASE WITH INTERACTIVE COVER HERO ── */}
                {projViewMode === "slider" && (() => {
                  const currentProj = SOFTWARE_PROJECTS[activeProjSlide] || SOFTWARE_PROJECTS[0];

                  return (
                    <div className="mz-proj-showcase-box">
                      {/* Top Cover Page Hero */}
                      <div
                        className="mz-proj-cover-hero"
                        style={{ background: currentProj.themeGradient }}
                      >
                        <div className="mz-proj-cover-left">
                          <div className="mz-proj-cover-badges">
                            <span
                              className="mz-proj-badge-domain"
                              style={{
                                color: currentProj.badgeColor,
                                background: "#ffffff",
                                borderColor: currentProj.border || "#cbd5e1",
                              }}
                            >
                              {currentProj.domain}
                            </span>
                            <span className="mz-proj-badge-diff">
                              {currentProj.difficulty} • {currentProj.xpReward}
                            </span>
                            <span className="mz-proj-badge-container">
                              <span className="mz-proj-pulse-dot" />
                              {currentProj.containerStatus}
                            </span>
                          </div>

                          <h2 className="mz-proj-cover-title">
                            {currentProj.title}
                          </h2>
                          <p className="mz-proj-cover-desc">
                            {currentProj.description}
                          </p>

                          <div className="mz-proj-tech-chips">
                            {currentProj.technologies.map((t) => (
                              <span key={t} className="mz-proj-tech-chip">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Code Blueprint Window on Cover Page */}
                        <div className="mz-proj-cover-right">
                          <div className="mz-proj-code-window">
                            <div className="mz-proj-code-header">
                              <div className="mz-proj-code-dots">
                                <span className="mz-proj-code-dot" style={{ background: "#ef4444" }} />
                                <span className="mz-proj-code-dot" style={{ background: "#f59e0b" }} />
                                <span className="mz-proj-code-dot" style={{ background: "#10b981" }} />
                              </div>
                              <span className="mz-proj-code-file">{currentProj.fileTab}</span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: currentProj.badgeColor,
                                  background: currentProj.badgeBg,
                                  fontWeight: 800,
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  border: `1px solid ${currentProj.border || "#e2e8f0"}`,
                                  letterSpacing: "0.04em",
                                }}
                              >
                                ACTIVE
                              </span>
                            </div>
                            <pre className="mz-proj-code-snippet">
                              {currentProj.codePreview}
                            </pre>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Interactive Milestones & Action Bar */}
                      <div className="mz-proj-interactive-bar">
                        <div className="mz-proj-milestones-list">
                          <span className="mz-proj-ms-label">Milestones:</span>
                          {currentProj.milestones.map((ms, mIdx) => (
                            <div
                              key={ms.id || mIdx}
                              className={`mz-proj-ms-item ${ms.state}`}
                              title={`Milestone ${mIdx + 1}: ${ms.name}`}
                            >
                              {ms.state === "done" && <LuCircleCheck size={13} color="#059669" />}
                              {ms.state === "active" && <LuZap size={13} color="#2563eb" />}
                              {ms.state === "upcoming" && <LuLock size={13} color="#94a3b8" />}
                              <span>M{mIdx + 1}: {ms.name}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mz-proj-cta-group">
                          <div className="mz-proj-time-info">
                            <LuClock size={14} color="#64748b" />
                            <span>{currentProj.estTime}</span>
                          </div>

                          <button
                            type="button"
                            className="mz-proj-btn-launch"
                            style={{ background: currentProj.accentColor }}
                            onClick={() =>
                              navigate(currentProj.route, {
                                state: { tab: "projects", project: currentProj.id },
                              })
                            }
                          >
                            <span>Launch Project Workspace</span>
                            <LuArrowRight size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Interactive Thumbnails Navigation Strip */}
                      <div style={{ padding: "0 24px 20px" }}>
                        <div className="mz-proj-thumbs-strip">
                          {SOFTWARE_PROJECTS.map((proj, idx) => {
                            const isActive = idx === activeProjSlide;
                            return (
                              <button
                                key={proj.id}
                                type="button"
                                className={`mz-proj-thumb ${isActive ? "active" : ""}`}
                                onClick={() => setActiveProjSlide(idx)}
                                style={{
                                  borderColor: isActive ? proj.badgeColor : undefined,
                                  background: isActive ? proj.badgeBg : "#ffffff",
                                }}
                              >
                                <span
                                  className="mz-proj-thumb-tag"
                                  style={{ color: proj.badgeColor }}
                                >
                                  {proj.badge}
                                </span>
                                <span className="mz-proj-thumb-title">
                                  {proj.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── MODE 2: BROWSE ALL GRID VIEW WITH COVER PAGES ── */}
                {projViewMode === "grid" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
                    {SOFTWARE_PROJECTS.map((proj) => (
                      <div
                        key={proj.id}
                        className="mz-proj-grid-card"
                        onClick={() =>
                          navigate(proj.route, {
                            state: { tab: "projects", project: proj.id },
                          })
                        }
                        title={`Open ${proj.title}`}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Card Cover Header */}
                        <div
                          className="mz-proj-grid-cover"
                          style={{
                            background: proj.themeGradient,
                            borderBottom: `1px solid ${proj.border || "#e2e8f0"}`,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                background: "#ffffff",
                                padding: "3px 9px",
                                borderRadius: "9999px",
                                color: proj.badgeColor,
                                border: `1px solid ${proj.border || "#cbd5e1"}`,
                                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
                              }}
                            >
                              {proj.domain}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#065f46",
                                background: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                                padding: "2px 8px",
                                borderRadius: "9999px",
                              }}
                            >
                              {proj.xpReward}
                            </span>
                          </div>
                          <h4 style={{ fontSize: "1.08rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.35 }}>
                            {proj.title}
                          </h4>
                          <span style={{ fontSize: "11.5px", color: "#475569", fontWeight: 600 }}>
                            {proj.tech}
                          </span>
                        </div>

                        {/* Card Body */}
                        <div className="mz-proj-grid-body">
                          <p style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.5, margin: "0 0 14px" }}>
                            {proj.description}
                          </p>

                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                            {proj.milestones.map((m, mIdx) => (
                              <div
                                key={mIdx}
                                style={{
                                  fontSize: "11.5px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  color: m.state === "done" ? "#065f46" : m.state === "active" ? "#1d4ed8" : "#64748b",
                                  background: m.state === "done" ? "#ecfdf5" : m.state === "active" ? "#eff6ff" : "#f8fafc",
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                }}
                              >
                                {m.state === "done" ? <LuCircleCheck size={12} /> : <LuZap size={12} />}
                                <span>Milestone {mIdx + 1}: {m.name}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8" }}>
                              {proj.estTime}
                            </span>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: proj.badgeColor, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              Launch Workspace <LuArrowRight size={13} className="mz-card-arrow-icon" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 8. Recent Coding Submissions Log (Genuine Database Data) */}
              <div style={{ marginBottom: 38 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Recent Algorithm Submissions
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "#64748b", margin: "4px 0 0" }}>
                      Real-time compiler execution history and test assertions from your student account.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/reports")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    View All Reports ({reportsList.length}) <LuArrowRight size={14} />
                  </button>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  {recentCodingSubmissions && recentCodingSubmissions.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Challenge</th>
                            <th style={{ padding: "14px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Language</th>
                            <th style={{ padding: "14px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Tests Passed</th>
                            <th style={{ padding: "14px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Score</th>
                            <th style={{ padding: "14px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Status</th>
                            <th style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentCodingSubmissions.slice(0, 5).map((sub, idx) => {
                            const isPass = sub.status === "PASSED" || sub.status === "ACCEPTED" || (sub.score && sub.score >= 80);
                            return (
                              <tr key={sub._id || idx} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}>
                                <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                  {sub.challengeTitle || sub.title || "Algorithmic Challenge"}
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#334155", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>
                                    {sub.language || "python"}
                                  </span>
                                </td>
                                <td style={{ padding: "14px 16px", fontSize: 12, fontWeight: 600, color: "#475569" }}>
                                  {sub.passedTests != null && sub.totalTests != null ? `${sub.passedTests}/${sub.totalTests} Passed` : "All Tests Passed"}
                                </td>
                                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                  {sub.score != null ? `${sub.score}%` : "100%"}
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "3px 8px",
                                    borderRadius: 12,
                                    background: isPass ? "#ecfdf5" : "#fef2f2",
                                    color: isPass ? "#059669" : "#dc2626",
                                    border: isPass ? "1px solid #a7f3d0" : "1px solid #fecaca",
                                  }}>
                                    {isPass ? "Accepted" : "Needs Review"}
                                  </span>
                                </td>
                                <td style={{ padding: "14px 20px", fontSize: 12, color: "#64748b" }}>
                                  {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "Today"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: "40px 20px", textAlign: "center" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                        <LuCodeXml size={24} />
                      </div>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                        Ready to write your first algorithm?
                      </h4>
                      <p style={{ fontSize: "0.88rem", color: "#64748b", margin: "0 0 18px", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
                        Solve a problem in Python, Java, C++, or JavaScript to start recording your execution telemetry.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/coding?tab=challenges", { state: { tab: "challenges" } })}
                        style={{
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          padding: "10px 22px",
                          borderRadius: 12,
                          fontSize: "0.88rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                        }}
                      >
                        <LuCodeXml size={16} /> Start DSA Practice
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 9. Verified Proctored Coding Credentials Hall */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 20,
                  padding: "30px 34px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
                  <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f5f3ff", color: "#7c3aed", padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, marginBottom: 8 }}>
                      <LuAward size={14} /> Official Verifiable Credentials
                    </div>
                    <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                      Proctored Examination & Certification Hall
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>
                      Take verified computer science credential examinations with biometric proctoring and earn digital certificates.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/certificates")}
                    style={{
                      background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                      color: "#ffffff",
                      border: "none",
                      padding: "11px 22px",
                      borderRadius: 12,
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 4px 14px rgba(124, 58, 237, 0.25)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    View All Certificates ({certHistory.certificates?.length || 0}) <LuArrowRight size={15} />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
                  <div
                    style={{
                      padding: 22,
                      background: "#f8fafc",
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <LuShieldCheck size={22} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                            Data Structures & Algorithms (DSA)
                          </h4>
                          <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700 }}>
                            Level: Professional • Proctored Exam
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "0 0 16px", lineHeight: 1.5 }}>
                        Comprehensive proctored assessment covering Arrays, Binary Trees, Dynamic Programming, and Graph theory with live compiler problems.
                      </p>
                    </div>

                    {(() => {
                      const dsaInfo = getEarnedCertInfo("dsa_cert");
                      if (dsaInfo.isCompleted) {
                        return (
                          <div>
                            <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                              <LuCircleCheck size={14} /> Completed • Certificate Awarded 🏆
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              {dsaInfo.certificateId && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/verify/${dsaInfo.certificateId}`)}
                                  style={{
                                    flex: 1,
                                    padding: "9px 0",
                                    background: "#16a34a",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: 10,
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 5,
                                  }}
                                >
                                  <LuAward size={14} /> View Certificate
                                </button>
                              )}
                              {dsaInfo.attemptId && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/assessment-report/${dsaInfo.attemptId}`)}
                                  style={{
                                    flex: 1,
                                    padding: "9px 0",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    border: "1px solid #bfdbfe",
                                    borderRadius: 10,
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 5,
                                  }}
                                >
                                  <LuFileText size={14} /> View Report
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              <LuLock size={12} /> Test Passed • Cannot Attend Again
                            </div>
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => handleOpenCertExam("dsa_cert", "Data Structures & Algorithms (DSA)")}
                          style={{
                            width: "100%",
                            padding: "10px 0",
                            background: "#ffffff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            borderRadius: 10,
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.borderColor = "#93c5fd";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#bfdbfe";
                          }}
                        >
                          Start DSA Examination
                        </button>
                      );
                    })()}
                  </div>

                  <div
                    style={{
                      padding: 22,
                      background: "#f8fafc",
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <LuAward size={22} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                            Python Software Engineer
                          </h4>
                          <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700 }}>
                            Level: Associate • Proctored Exam
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "0 0 16px", lineHeight: 1.5 }}>
                        Verifies mastery in core Python semantics, memory model, generator mechanics, algorithms, and modular software design.
                      </p>
                    </div>

                    {(() => {
                      const pyInfo = getEarnedCertInfo("python_cert");
                      if (pyInfo.isCompleted) {
                        return (
                          <div>
                            <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                              <LuCircleCheck size={14} /> Completed • Certificate Awarded 🏆
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              {pyInfo.certificateId && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/verify/${pyInfo.certificateId}`)}
                                  style={{
                                    flex: 1,
                                    padding: "9px 0",
                                    background: "#16a34a",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: 10,
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 5,
                                  }}
                                >
                                  <LuAward size={14} /> View Certificate
                                </button>
                              )}
                              {pyInfo.attemptId && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/assessment-report/${pyInfo.attemptId}`)}
                                  style={{
                                    flex: 1,
                                    padding: "9px 0",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    border: "1px solid #bfdbfe",
                                    borderRadius: 10,
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 5,
                                  }}
                                >
                                  <LuFileText size={14} /> View Report
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              <LuLock size={12} /> Test Passed • Cannot Attend Again
                            </div>
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => handleOpenCertExam("python_cert", "Python Software Engineer")}
                          style={{
                            width: "100%",
                            padding: "10px 0",
                            background: "#ffffff",
                            color: "#d97706",
                            border: "1px solid #fde68a",
                            borderRadius: 10,
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fffbeb";
                            e.currentTarget.style.borderColor = "#fcd34d";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#fde68a";
                          }}
                        >
                          Start Python Examination
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* 10. Dedicated Help & Support Section */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 20,
                  padding: "30px 32px",
                  boxShadow: "0 4px 18px rgba(0, 0, 0, 0.03)",
                  marginBottom: 38,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#eef2ff",
                        color: "#4f46e5",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      <LuLifeBuoy size={14} /> 24/7 Technical Support & Issue Resolution
                    </div>
                    <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                      Help & Support Center
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>
                      Need help with code compilation, proctored examinations, or reports? Submit a ticket and our engineers will respond in real time.
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => navigate("/help")}
                      style={{
                        background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                        color: "#ffffff",
                        border: "none",
                        padding: "11px 22px",
                        borderRadius: 12,
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                      <LuLifeBuoy size={16} /> Open Support Center <LuArrowRight size={14} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 16,
                  }}
                >
                  {[
                    {
                      title: "Compiler & IDE Issues",
                      desc: "Runtime execution errors, memory limits, language compilers, and test cases.",
                      icon: LuCodeXml,
                      color: "#0891b2",
                      bg: "#ecfeff",
                      border: "#a5f3fc",
                    },
                    {
                      title: "Examinations & Proctoring",
                      desc: "Biometric webcam locks, screen sharing stream verification, submission timers.",
                      icon: LuShieldCheck,
                      color: "#7c3aed",
                      bg: "#f5f3ff",
                      border: "#ddd6fe",
                    },
                    {
                      title: "Reports & Marks Audit",
                      desc: "Scorecard synchronization, grade verification, and detailed evaluation reviews.",
                      icon: LuFileText,
                      color: "#2563eb",
                      bg: "#eff6ff",
                      border: "#bfdbfe",
                    },
                    {
                      title: "Certificates & Verification",
                      desc: "Official credential issuance, distinction honors, verification links, and QR codes.",
                      icon: LuAward,
                      color: "#059669",
                      bg: "#ecfdf5",
                      border: "#a7f3d0",
                    },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={idx}
                        className="mz-interactive-card"
                        onClick={() => navigate("/help")}
                        style={{
                          padding: 18,
                          borderRadius: 14,
                          background: "#f8fafc",
                          border: `1px solid #e2e8f0`,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: item.bg,
                              color: item.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon size={18} />
                          </div>
                          <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
                            {item.title}
                          </h4>
                        </div>
                        <p style={{ margin: "0 0 12px", fontSize: "0.8rem", color: "#64748b", lineHeight: 1.45 }}>
                          {item.desc}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem", fontWeight: 700, color: item.color }}>
                          <span>Report Issue</span> <LuArrowRight size={13} className="mz-card-arrow-icon" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= LOGOUT CONFIRMATION MODAL ================= */}
      {isLogoutModalOpen && (
        <div className="mz-modal-backdrop" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="mz-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="mz-modal-title">Log Out</h2>
            <p className="mz-modal-text">Are you sure you want to log out of Mastery Zone?</p>
            <div className="mz-modal-actions">
              <button
                type="button"
                className="mz-modal-btn-cancel"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mz-modal-btn-confirm"
                onClick={handleLogoutConfirm}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LOG ACTIVITY MODAL WITH CONFIRMATION SCREEN ================= */}
      {isLogActivityModalOpen && (
        <div className="mz-modal-backdrop" onClick={handleCloseLogActivityModal}>
          <div
            className="mz-modal-box mz-log-activity-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: isLogConfirmed ? "460px" : "540px" }}
          >
            {isLogConfirmed && confirmedActivityData ? (
              /* Confirmation Success Screen */
              <div className="mz-log-confirm-view" data-testid="log-activity-confirmation-screen">
                <div className="mz-log-confirm-badge">
                  <LuCircleCheck size={36} color="#10b981" />
                </div>
                <h3 className="mz-log-confirm-title">Activity Logged Successfully!</h3>
                <p className="mz-log-confirm-sub">Your progress and experience points have been verified and saved to your profile.</p>

                <div className="mz-log-confirm-summary-card">
                  <div className="mz-log-confirm-row">
                    <span className="mz-log-confirm-label">Learning Track</span>
                    <span className="mz-log-confirm-val mz-track-pill">{confirmedActivityData.track}</span>
                  </div>
                  <div className="mz-log-confirm-row">
                    <span className="mz-log-confirm-label">Activity Type</span>
                    <span className="mz-log-confirm-val">{confirmedActivityData.task}</span>
                  </div>
                  <div className="mz-log-confirm-row">
                    <span className="mz-log-confirm-label">Topic / Lesson</span>
                    <span className="mz-log-confirm-val" style={{ fontWeight: 600 }}>{confirmedActivityData.moduleName}</span>
                  </div>
                  <div className="mz-log-confirm-row">
                    <span className="mz-log-confirm-label">Duration</span>
                    <span className="mz-log-confirm-val">{confirmedActivityData.hoursSpent} hrs</span>
                  </div>
                  <div className="mz-log-confirm-row">
                    <span className="mz-log-confirm-label">Earned XP</span>
                    <span className="mz-log-confirm-val mz-xp-tag">+{confirmedActivityData.xpEarned} XP</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="mz-modal-btn-confirm"
                  style={{ width: "100%", marginTop: "20px", padding: "12px", borderRadius: "12px" }}
                  onClick={handleCloseLogActivityModal}
                >
                  Done
                </button>
              </div>
            ) : (
              /* Log Activity Input Form */
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <LuPlus size={20} />
                    </div>
                    <div>
                      <h3 className="mz-modal-title" style={{ margin: 0, fontSize: "17px" }}>Log Learning Activity</h3>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Record verified lessons, study hours, or workouts</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mz-search-clear-btn"
                    onClick={handleCloseLogActivityModal}
                    title="Close"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                  >
                    <LuX size={18} />
                  </button>
                </div>

                <form onSubmit={handleLogActivitySubmit} className="mz-p-modal-form">
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Learning Track
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                      {[
                        { key: "CODING", name: "Algorithms & DSA" },
                        { key: "SYSTEMS", name: "System Architecture" },
                        { key: "PROJECTS", name: "Software Projects" },
                        { key: "EXAM", name: "Proctored Exam Prep" },
                      ].map((t) => (
                        <button
                          type="button"
                          key={t.key}
                          onClick={() => setLogActivityForm({ ...logActivityForm, track: t.key })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            border: logActivityForm.track === t.key ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                            background: logActivityForm.track === t.key ? "#eff6ff" : "#ffffff",
                            color: logActivityForm.track === t.key ? "#2563eb" : "#475569",
                            fontWeight: logActivityForm.track === t.key ? 700 : 500,
                            cursor: "pointer",
                            fontSize: "13px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <InterestBadge type="CODING" />
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Activity Type
                    </label>
                    <select
                      className="mz-search-bar-input"
                      style={{ padding: "8px 12px", borderRadius: "10px", width: "100%", background: "#f8fafc", boxSizing: "border-box" }}
                      value={logActivityForm.task}
                      onChange={(e) => setLogActivityForm({ ...logActivityForm, task: e.target.value })}
                    >
                      <option value="Completed a lesson">Completed a lesson</option>
                      <option value="Joined study group">Joined study group</option>
                      <option value="Workout logged">Workout logged</option>
                      <option value="Learned new vocabulary">Learned new vocabulary</option>
                      <option value="Practice session completed">Practice session completed</option>
                      <option value="Module exam passed">Module exam passed</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Lesson / Topic Name
                    </label>
                    <input
                      type="text"
                      className="mz-search-bar-input"
                      style={{ padding: "8px 12px", borderRadius: "10px", width: "100%", background: "#f8fafc", boxSizing: "border-box" }}
                      placeholder="e.g. Python - Control Flow & Conditionals"
                      value={logActivityForm.moduleName}
                      onChange={(e) => setLogActivityForm({ ...logActivityForm, moduleName: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        Study Hours
                      </label>
                      <select
                        className="mz-search-bar-input"
                        style={{ padding: "8px 12px", borderRadius: "10px", width: "100%", background: "#f8fafc", boxSizing: "border-box" }}
                        value={logActivityForm.hoursSpent}
                        onChange={(e) => setLogActivityForm({ ...logActivityForm, hoursSpent: e.target.value })}
                      >
                        <option value="0.5">0.5 hrs (30m)</option>
                        <option value="0.75">0.75 hrs (45m)</option>
                        <option value="1.0">1.0 hr (60m)</option>
                        <option value="1.5">1.5 hrs</option>
                        <option value="2.0">2.0 hrs</option>
                        <option value="3.0">3.0 hrs</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        XP Earned
                      </label>
                      <select
                        className="mz-search-bar-input"
                        style={{ padding: "8px 12px", borderRadius: "10px", width: "100%", background: "#f8fafc", boxSizing: "border-box" }}
                        value={logActivityForm.xpEarned}
                        onChange={(e) => setLogActivityForm({ ...logActivityForm, xpEarned: e.target.value })}
                      >
                        <option value="15">+15 XP</option>
                        <option value="20">+20 XP</option>
                        <option value="30">+30 XP</option>
                        <option value="50">+50 XP</option>
                      </select>
                    </div>
                  </div>

                  <div className="mz-modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      className="mz-modal-btn-cancel"
                      onClick={handleCloseLogActivityModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="mz-modal-btn-confirm"
                      disabled={isLoggingActivity}
                    >
                      {isLoggingActivity ? "Saving..." : "Log Activity"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= APP SETTINGS MODAL ================= */}
      {isSettingsModalOpen && (
        <div className="mz-modal-backdrop" onClick={() => setIsSettingsModalOpen(false)}>
          <div className="mz-modal-box mz-settings-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="mz-modal-title">App Settings</h2>

            <div className="mz-setting-row">
              <div className="mz-setting-info">
                <span className="mz-setting-name">Email Notifications</span>
                <span className="mz-setting-desc">Receive updates about your learning tracks</span>
              </div>
              <label className="mz-switch">
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) => handlePreferenceChange("notifications", e.target.checked)}
                />
                <span className="mz-slider" />
              </label>
            </div>

            <div className="mz-modal-actions" style={{ marginTop: "24px" }}>
              <button
                type="button"
                className="mz-modal-btn-confirm"
                style={{ width: "100%" }}
                onClick={() => setIsSettingsModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= IN-BROWSER VIDEO PLAYBACK MODAL ================= */}
      {activePlayingRecording && (
        <div
          className="mz-modal-backdrop"
          style={{ zIndex: 99999, background: "rgba(15, 23, 42, 0.88)" }}
          onClick={() => setActivePlayingRecording(null)}
          data-testid="home-video-player-modal"
        >
          <div
            className="mz-modal-box"
            style={{
              maxWidth: 880,
              width: "94%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: 22,
              background: "#0f172a",
              color: "#ffffff",
              border: "1px solid #334155",
              borderRadius: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>
                    {activePlayingRecording.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setRenameModalRecording(activePlayingRecording);
                      setRenameInput(activePlayingRecording.title);
                    }}
                    style={{
                      border: "1px solid #334155",
                      background: "#1e293b",
                      color: "#38bdf8",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    title="Rename Recording"
                  >
                    <LuPencil size={12} /> Rename
                  </button>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Host: {activePlayingRecording.hostName} • {activePlayingRecording.participantsCount || 1} participant(s)</span>
                  <span>•</span>
                  <span style={{ color: "#38bdf8", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <LuClock size={12} />
                    Exact Duration: {(() => {
                      const t = Math.max(0, Math.round(activePlayingRecording.durationSeconds || 0));
                      const h = Math.floor(t / 3600);
                      const m = Math.floor((t % 3600) / 60);
                      const s = t % 60;
                      return h > 0
                        ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
                        : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
                    })()}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePlayingRecording(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <LuX size={22} />
              </button>
            </div>

            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                background: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <video
                ref={videoPlayerRef}
                src={getMediaUrl(activePlayingRecording.streamUrl || activePlayingRecording.fileUrl)}
                controls
                autoPlay
                onLoadedMetadata={(e) => {
                  if (e.target.duration && isFinite(e.target.duration) && e.target.duration > 0) {
                    const d = Math.round(e.target.duration);
                    if (!activePlayingRecording.durationSeconds || activePlayingRecording.durationSeconds !== d) {
                      setActivePlayingRecording((prev) => (prev ? { ...prev, durationSeconds: d } : prev));
                    }
                  }
                }}
                onTimeUpdate={() => {
                  if (videoPlayerRef.current) {
                    const uId = user?._id || user?.id || user?.userId || "guest";
                    localStorage.setItem(
                      `mz_${uId}_rec_seek_${activePlayingRecording.recordingId}`,
                      Math.floor(videoPlayerRef.current.currentTime)
                    );
                  }
                }}
                style={{ width: "100%", maxHeight: 420, outline: "none" }}
                data-testid="home-video-player-element"
              />
            </div>

            {/* Video Controls Toolbar: Speed, Duration, Sharing, Bookmarks */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid #1e293b",
                marginBottom: 14,
              }}
            >
              {/* Playback Speed Switcher */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Speed:</span>
                {[0.5, 1, 1.25, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      setPlaybackSpeed(spd);
                      if (videoPlayerRef.current) {
                        videoPlayerRef.current.playbackRate = spd;
                      }
                    }}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      border: "none",
                      fontSize: 11,
                      fontWeight: 700,
                      background: playbackSpeed === spd ? "#2563eb" : "#1e293b",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleShareRecording(activePlayingRecording)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    background: "#1e293b",
                    color: "#f8fafc",
                    border: "1px solid #334155",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <LuShare2 size={13} /> Share Link
                </button>
                <a
                  href={getMediaUrl(activePlayingRecording.streamUrl || activePlayingRecording.fileUrl)}
                  download={`${activePlayingRecording.title}.webm`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    background: "#2563eb",
                    color: "#ffffff",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                  data-testid="home-modal-download-btn"
                >
                  <LuDownload size={13} /> Download
                </a>
              </div>
            </div>

            {/* Chapters & Bookmarks Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Chapters List */}
              <div
                style={{
                  background: "#1e293b",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 700, color: "#93c5fd", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <LuClock size={13} /> Chapters
                </div>
                {activePlayingRecording.chapters && activePlayingRecording.chapters.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {activePlayingRecording.chapters.map((ch, idx) => {
                      const m = Math.floor(ch.timestampSeconds / 60);
                      const s = ch.timestampSeconds % 60;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (videoPlayerRef.current) {
                              videoPlayerRef.current.currentTime = ch.timestampSeconds;
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 6px",
                            borderRadius: 4,
                            cursor: "pointer",
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <span style={{ color: "#38bdf8", fontWeight: 700, fontFamily: "monospace" }}>
                            {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                          </span>
                          <span style={{ color: "#cbd5e1" }}>{ch.title}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ color: "#64748b" }}>No chapters set</span>
                )}
              </div>

              {/* Bookmarks & Add Bookmark */}
              <div
                style={{
                  background: "#1e293b",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 700, color: "#86efac", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <LuBookmark size={13} /> Saved Bookmarks
                </div>
                <div style={{ maxHeight: 90, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                  {activePlayingRecording.bookmarks && activePlayingRecording.bookmarks.length > 0 ? (
                    activePlayingRecording.bookmarks.map((bm, idx) => {
                      const m = Math.floor(bm.timestampSeconds / 60);
                      const s = bm.timestampSeconds % 60;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (videoPlayerRef.current) {
                              videoPlayerRef.current.currentTime = bm.timestampSeconds;
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "3px 6px",
                            borderRadius: 4,
                            cursor: "pointer",
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <span style={{ color: "#4ade80", fontWeight: 700, fontFamily: "monospace" }}>
                            {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                          </span>
                          <span style={{ color: "#cbd5e1" }}>{bm.note}</span>
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ color: "#64748b" }}>No custom bookmarks yet</span>
                  )}
                </div>

                {/* Add Bookmark Form */}
                <form onSubmit={handleAddBookmark} style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Bookmark note at current second..."
                    value={newBookmarkNote}
                    onChange={(e) => setNewBookmarkNote(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "4px 8px",
                      borderRadius: 4,
                      border: "1px solid #334155",
                      background: "#0f172a",
                      color: "#ffffff",
                      fontSize: 11,
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      border: "none",
                      background: "#16a34a",
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Save
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Toast */}
      {shareToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#0f172a",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            fontWeight: 600,
            animation: "mzFadeIn 0.2s ease-out",
          }}
        >
          <LuCheck color="#22c55e" size={16} />
          <span>{shareToast}</span>
        </div>
      )}

      {/* ================= RENAME RECORDING MODAL ================= */}
      {renameModalRecording && (
        <div
          className="mz-modal-backdrop"
          style={{ zIndex: 99999 }}
          onClick={() => setRenameModalRecording(null)}
        >
          <div
            className="mz-modal-box"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
            data-testid="home-rename-modal"
          >
            <h3 className="mz-modal-title">Rename Recording</h3>
            <p className="mz-modal-subtitle">
              Enter a new title for this recorded session:
            </p>
            <form onSubmit={handleRenameRecordingSubmit}>
              <input
                type="text"
                className="mz-rename-input"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  marginTop: 10,
                  marginBottom: 16,
                  outline: "none",
                }}
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                autoFocus
                required
                data-testid="home-rename-input"
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="mz-modal-btn-cancel"
                  onClick={() => setRenameModalRecording(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mz-modal-btn-confirm"
                  data-testid="home-confirm-rename-btn"
                >
                  Save Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proctored Certification Exam Workspace Modal */}
      {activeCertExamModal && (
        <CertificationExamWorkspace
          certId={activeCertExamModal.id || "dsa_cert"}
          certTitle={activeCertExamModal.name || "Data Structures & Algorithms (DSA)"}
          onClose={() => setActiveCertExamModal(null)}
          onCompleted={() => {
            setActiveCertExamModal(null);
            fetchCertHistory();
          }}
        />
      )}
    </div>
  );
};

export default Home;
