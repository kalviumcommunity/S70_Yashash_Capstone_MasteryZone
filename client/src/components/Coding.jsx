import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import UserProfileDropdown from "./UserProfileDropdown.jsx";
import {
  LuSearch,
  LuX,
  LuBookOpen,
  LuCode,
  LuPlay,
  LuTv,
  LuFolderGit2,
  LuLayers,
  LuUsers,
  LuFileText,
  LuLock,
  LuAward,
  LuChevronRight,
  LuChevronLeft,
  LuChevronDown,
  LuCheck,
  LuCircleCheck,
  LuClock,
  LuExternalLink,
  LuSparkles,
  LuVideo,
  LuShieldCheck,
  LuShieldAlert,
  LuRotateCcw,
  LuLaptop,
  LuDownload,
  LuShare2,
  LuArrowRight,
  LuUser,
  LuLogOut,
  LuTrendingUp,
  LuActivity,
  LuFlame,
  LuZap,
  LuTerminal,
  LuPenTool,
  LuPlus,
} from "react-icons/lu";

import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import FeaturedLearningCarousel from "./FeaturedLearningCarousel";
import FeaturedVideosSlider, { DEFAULT_FEATURED_VIDEOS } from "./FeaturedVideosSlider";
import { deduplicatedFetch, invalidateCachePattern } from "../utils/apiClient";
import { performGlobalLogout } from "../utils/sessionAuth.js";
import { PROJECTS_CATALOG } from "../data/projectsCatalog";
import logoIcon from "../assets/logo_icon_transparent.png";
import MasteryZoneGlobalLoader from "./MasteryZoneGlobalLoader";
import "./coding.css";

const ChallengeWorkspaceModal = React.lazy(() => import("./ChallengeWorkspaceModal"));
const ProjectWorkspaceModal = React.lazy(() =>
  import("./ProjectWorkspaceModal").then((m) => ({ default: m.ProjectWorkspaceModal || m.default }))
);
const CertificationExamWorkspace = React.lazy(() => import("./CertificationExamWorkspace"));
const FullScreenConceptLearning = React.lazy(() => import("./FullScreenConceptLearning"));
const PracticalAssignmentModal = React.lazy(() => import("./PracticalAssignmentModal"));
const ProctoredAssessmentWorkspace = React.lazy(() => import("./ProctoredAssessmentWorkspace"));

const API_BASE = import.meta.env.VITE_API_URL || "";

/* ══════════════════════════════════════════════════════════════
   TECH BRAND ICON COMPONENT (Exported for FeaturedVideosSlider & Badges)
   Crisp, high-fidelity SVGs with official brand palettes
   ══════════════════════════════════════════════════════════════ */
const TechBrandIcon = ({ type, size = 18, className = "" }) => {
  const norm = String(type || "").toLowerCase().trim();

  if (norm.includes("python") || norm === "py") {
    return (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
        <path d="M63.5 12c-27.6 0-26 12-26 12l.03 12.4H64v3.6H27.5C12 40 12 63.5 12 63.5s0 14.5 16 14.5h9.5v-13c0-8.8 7.2-16 16-16h26V37.5c0-11-8.5-25.5-20-25.5zm-14.8 7.7a4.2 4.2 0 110 8.4 4.2 4.2 0 010-8.4z" fill="#387EB8"/>
        <path d="M64.5 116c27.6 0 26-12 26-12l-.03-12.4H64v-3.6h36.5C116 88 116 64.5 116 64.5s0-14.5-16-14.5h-9.5v13c0 8.8-7.2 16-16 16h-26v11.5c0 11 8.5 25.5 20 25.5zm14.8-7.7a4.2 4.2 0 110-8.4 4.2 4.2 0 010 8.4z" fill="#FFE052"/>
      </svg>
    );
  }

  if (norm.includes("javascript") || norm === "js") {
    return (
      <svg width={size} height={size} viewBox="0 0 128 128" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
        <rect width="128" height="128" rx="20" fill="#F7DF1E"/>
        <path d="M72.5 102.5c4.2 6.8 9.8 11.2 19.8 11.2 8.3 0 13.7-4.1 13.7-9.8 0-6.8-5.4-9.3-14.6-13.3l-5-2.1c-14.4-6.2-24-13.9-24-30.8 0-15.3 11.7-27 30-27 13 0 22.3 4.6 28.8 16.3l-13.6 8.7c-3-5.3-6.9-7.4-15.1-7.4-6.8 0-11.7 4.1-11.7 9.3 0 6.3 4.5 8.7 13.2 12.5l5 2.1c16.9 7.3 25.8 14.8 25.8 32.2 0 18.5-14.5 28.5-33.8 28.5-18.9 0-30.8-9.4-36.5-20.9l18-10.6zM32 102.2c3 5.3 6.9 9.8 13.9 9.8 7.3 0 11.9-3.7 11.9-18.4V41.5h19.5v52.3c0 23.9-13.9 34.6-32.9 34.6-14.8 0-23.7-7.4-28.5-16.5l16.1-9.7z" fill="#000000"/>
      </svg>
    );
  }

  if (norm.includes("java") && !norm.includes("script")) {
    return (
      <svg width={size} height={size} viewBox="0 0 128 128" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
        <path d="M47 88c12 2 24 2 34-4 0 0-4 3-13 5-11 2-25 1-21-1zm-3-12c14 2 30 2 43-5 0 0-5 4-16 6-13 2-31 2-27-1zm24-36c4 4 6 9 2 15-3 5-9 8-14 11-5 4-7 8-5 12 3-5 7-8 12-10 6-3 12-7 14-14 3-9-2-18-9-24zm20 33c7-1 14-6 15-13 1-5-1-10-6-13 2 4 1 8-1 11-3 5-9 8-15 10 3 1 5 2 7 2zm-40 25c11 1 23 1 33-3 0 0-4 2-12 4-11 1-25 1-21-1zm37-37c2 5 2 10 0 15 4-3 7-7 7-12 0-3-1-6-3-9-2 2-3 4-4 6z" fill="#E76F00"/>
        <path d="M57 101c22 1 42-6 45-15 0 0-2 4-15 8-15 4-38 4-45 0-3-2 1-5 1-5 3 7 23 11 14 12z" fill="#5382A1"/>
      </svg>
    );
  }

  if (norm.includes("cpp") || norm.includes("c++")) {
    return (
      <svg width={size} height={size} viewBox="0 0 128 128" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
        <path d="M64 8l54 31.2v62.4L64 123 10 101.6V39.2L64 8z" fill="#00599C"/>
        <path d="M64 26c-21 0-38 17-38 38s17 38 38 38c14.2 0 26.6-7.8 33-19.3l-14.7-8.5c-4 6.8-11.4 11.4-18.3 11.4-12.7 0-23-10.3-23-23s10.3-23 23-23c6.9 0 14.3 4.6 18.3 11.4l14.7-8.5C90.6 33.8 78.2 26 64 26zm28 29v7h7v4h-7v7h-4v-7h-7v-4h7v-7h4zm20 0v7h7v4h-7v7h-4v-7h-7v-4h7v-7h4z" fill="#FFFFFF"/>
      </svg>
    );
  }

  if (norm.includes("dsa") || norm.includes("algo") || norm.includes("structure")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
        <circle cx="12" cy="5" r="3" fill="#dbeafe" />
        <circle cx="6" cy="18" r="3" fill="#dbeafe" />
        <circle cx="18" cy="18" r="3" fill="#dbeafe" />
        <line x1="10.5" y1="7.5" x2="7.5" y2="15.5" />
        <line x1="13.5" y1="7.5" x2="16.5" y2="15.5" />
        <line x1="9" y1="18" x2="15" y2="18" strokeDasharray="2 2" />
      </svg>
    );
  }

  if (norm.includes("react") || norm.includes("webdev") || norm.includes("frontend")) {
    return (
      <svg width={size} height={size} viewBox="0 0 128 128" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
        <ellipse cx="64" cy="64" rx="52" ry="19" fill="none" stroke="#00D8FF" strokeWidth="6" transform="rotate(0 64 64)"/>
        <ellipse cx="64" cy="64" rx="52" ry="19" fill="none" stroke="#00D8FF" strokeWidth="6" transform="rotate(60 64 64)"/>
        <ellipse cx="64" cy="64" rx="52" ry="19" fill="none" stroke="#00D8FF" strokeWidth="6" transform="rotate(120 64 64)"/>
        <circle cx="64" cy="64" r="9" fill="#00D8FF"/>
      </svg>
    );
  }

  if (norm.includes("sql") || norm.includes("db") || norm.includes("database")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    );
  }

  // Fallback Clean Code Icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
};

/* ══════════════════════════════════════════════════════════════
   DEFAULT CURRICULUM TRACKS DATA
   ══════════════════════════════════════════════════════════════ */
const DEFAULT_TRACKS = [
  {
    id: "python",
    title: "Python Basics & Core",
    subtitle: "Variables, control flow, functions, OOP, and data structures.",
    icon: "python",
    totalLessons: 8,
    completedLessons: 0,
    badgeText: "Most Popular",
    modules: [
      { id: "py_m1", index: 1, title: "Variables, Data Types & IO", desc: "Master primitive types, f-strings, input handling, and numeric expressions.", status: "available", duration: "45m" },
      { id: "py_m2", index: 2, title: "Control Flow & Conditionals", desc: "Boolean logic, branching with if/elif/else, and match-case statements.", status: "available", duration: "50m" },
      { id: "py_m3", index: 3, title: "Loops & Iterations", desc: "for loops, range generators, while constructs, and loop control statements.", status: "available", duration: "60m" },
      { id: "py_m4", index: 4, title: "Functions & Scope", desc: "Function arguments (*args, **kwargs), return values, closures, and lambda expressions.", status: "available", duration: "1h 15m" },
      { id: "py_m5", index: 5, title: "Data Structures: Lists, Tuples, Dictionaries", desc: "List comprehensions, dictionary lookups, sets, and in-memory complexity.", status: "available", duration: "1h 30m" },
      { id: "py_m6", index: 6, title: "Object-Oriented Programming (OOP)", desc: "Classes, encapsulation, inheritance, polymorphism, and dunder magic methods.", status: "available", duration: "1h 45m" },
      { id: "py_m7", index: 7, title: "File I/O & Exception Handling", desc: "Context managers with open(), try/except blocks, custom exceptions, and logging.", status: "available", duration: "1h 10m" },
      { id: "py_m8", index: 8, title: "Capstone Assessment Project", desc: "Comprehensive algorithmic problem suite with 10 test case validations.", status: "available", duration: "2h" },
    ],
  },
  {
    id: "javascript",
    title: "JavaScript Essentials",
    subtitle: "DOM manipulation, async/await, closures, and ES6+ modern patterns.",
    icon: "javascript",
    totalLessons: 10,
    completedLessons: 0,
    badgeText: "Web Core",
    modules: [
      { id: "js_m1", index: 1, title: "ES6+ Fundamentals & Types", desc: "Let/const, arrow functions, destructuring, and template literals.", status: "available", duration: "40m" },
      { id: "js_m2", index: 2, title: "Async JavaScript & Promises", desc: "Event loop, microtasks, Promise chaining, and async/await.", status: "available", duration: "1h" },
      { id: "js_m3", index: 3, title: "DOM Manipulation & Events", desc: "Query selectors, event bubbling, delegation, and DOM mutations.", status: "available", duration: "1h 15m" },
      { id: "js_m4", index: 4, title: "Closures & Functional JS", desc: "Scope chains, currying, higher-order functions (map, filter, reduce).", status: "available", duration: "1h 30m" },
    ],
  },
  {
    id: "java",
    title: "Java Programming",
    subtitle: "OOP principles, collections, multithreading, and enterprise design.",
    icon: "java",
    totalLessons: 12,
    completedLessons: 0,
    badgeText: "Enterprise",
    modules: [
      { id: "java_m1", index: 1, title: "Java JVM & Core Types", desc: "JVM architecture, bytecode execution, primitive types, and memory layout.", status: "available", duration: "1h" },
      { id: "java_m2", index: 2, title: "OOP: Polymorphism & Interfaces", desc: "Deep inheritance hierarchies, abstract classes, and clean interface segregation.", status: "available", duration: "1h 30m" },
      { id: "java_m3", index: 3, title: "Java Collections Framework", desc: "ArrayList, HashMap, LinkedList, HashSet, and Big-O performance.", status: "available", duration: "2h" },
    ],
  },
  {
    id: "cpp",
    title: "Modern C++ Systems",
    subtitle: "Pointers, memory management, STL containers, and high performance.",
    icon: "cpp",
    totalLessons: 8,
    completedLessons: 0,
    badgeText: "Systems",
    modules: [
      { id: "cpp_m1", index: 1, title: "Pointers, References & Memory", desc: "Stack vs heap allocation, pointer arithmetic, and reference passing.", status: "available", duration: "1h 15m" },
      { id: "cpp_m2", index: 2, title: "Standard Template Library (STL)", desc: "Vectors, maps, sets, iterators, and std::sort custom lambdas.", status: "available", duration: "1h 45m" },
      { id: "cpp_m3", index: 3, title: "RAII & Smart Pointers", desc: "std::unique_ptr, std::shared_ptr, move semantics, and zero leaks.", status: "available", duration: "2h" },
    ],
  },
  {
    id: "webdev",
    title: "Full-Stack Web Development",
    subtitle: "HTML5 semantic markup, CSS3 Flex/Grid, React 19, and REST APIs.",
    icon: "webdev",
    totalLessons: 10,
    completedLessons: 0,
    badgeText: "Full-Stack",
    modules: [
      { id: "web_m1", index: 1, title: "Modern HTML5 & Responsive CSS3", desc: "Semantic markup, Flexbox, CSS Grid, media queries, and accessibility.", status: "available", duration: "1h" },
      { id: "web_m2", index: 2, title: "React Components & State", desc: "Component architecture, useState, useEffect, and custom hooks.", status: "available", duration: "1h 30m" },
      { id: "web_m3", index: 3, title: "Backend REST APIs & Databases", desc: "Express routing, MongoDB queries, authentication, and error middleware.", status: "available", duration: "2h" },
    ],
  },
  {
    id: "dsa",
    title: "Data Structures & Algorithms",
    subtitle: "Arrays, stacks, queues, trees, graphs, and dynamic programming.",
    icon: "dsa",
    totalLessons: 12,
    completedLessons: 0,
    badgeText: "Interview Prep",
    modules: [
      { id: "dsa_m1", index: 1, title: "Big-O Asymptotic Analysis", desc: "Time and space complexity proofs, recurrence relations, and tight bounds.", status: "available", duration: "1h" },
      { id: "dsa_m2", index: 2, title: "Two Pointers & Sliding Window", desc: "Subarray sums, palindromes, container with most water, and sliding window maximum.", status: "available", duration: "1h 45m" },
      { id: "dsa_m3", index: 3, title: "Binary Trees & BST Traversals", desc: "In-order, pre-order, post-order, BFS level-order, and LCA queries.", status: "available", duration: "2h" },
      { id: "dsa_m4", index: 4, title: "Graphs: BFS, DFS & Dijkstra", desc: "Adjacency lists, cycle detection, topological sorting, and shortest paths.", status: "available", duration: "2h 30m" },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════
   DEFAULT PRACTICAL PROJECTS DATA (14 Production-Grade Industry Labs)
   ══════════════════════════════════════════════════════════════ */
const DEFAULT_PROJECTS = PROJECTS_CATALOG;

/* ══════════════════════════════════════════════════════════════
   DEFAULT CURATED RESOURCES
   ══════════════════════════════════════════════════════════════ */
const DEFAULT_RESOURCES = [
  {
    title: "MDN Web Docs",
    category: "Web & JavaScript",
    url: "https://developer.mozilla.org",
    description: "The definitive reference manual for HTML, CSS, JavaScript, and Web APIs.",
    official: true,
    lang: "javascript",
  },
  {
    title: "Official Python Documentation",
    category: "Python",
    url: "https://docs.python.org/3/",
    description: "Official tutorials, standard library references, and language specifications.",
    official: true,
    lang: "python",
  },
  {
    title: "Oracle Java SE Documentation",
    category: "Java",
    url: "https://docs.oracle.com/en/java/javase/",
    description: "Java platform documentation, API specifications, and JVM internals.",
    official: true,
    lang: "java",
  },
  {
    title: "cppreference.com",
    category: "C / C++",
    url: "https://en.cppreference.com/w/",
    description: "Comprehensive C and C++ standard library, templates, and STL reference.",
    official: true,
    lang: "cpp",
  },
  {
    title: "React Official Documentation",
    category: "Frontend",
    url: "https://react.dev",
    description: "Modern component architectures, hooks, state patterns, and performance.",
    official: true,
    lang: "react",
  },
  {
    title: "NeetCode DSA Roadmap",
    category: "Algorithms",
    url: "https://neetcode.io/roadmap",
    description: "Curated learning paths for data structures, algorithms, and technical interviews.",
    official: false,
    lang: "dsa",
  },
  {
    title: "PostgreSQL Documentation",
    category: "Databases & SQL",
    url: "https://www.postgresql.org/docs/current/",
    description: "Advanced relational database reference, SQL queries, and indexing strategies.",
    official: true,
    lang: "sql",
  },
];

/* ══════════════════════════════════════════════════════════════
   DEFAULT STUDY GROUPS & COLLABORATIVE PODS
   ══════════════════════════════════════════════════════════════ */
const DEFAULT_STUDY_GROUPS = [];

// In-memory curriculum and module caches for instant navigation and duplicate request elimination
const trackCurriculumCache = new Map();
const moduleDetailCache = new Map();

const VALID_TRACK_IDS = new Set(DEFAULT_TRACKS.map((t) => t.id));

const normalizeTrackId = (raw) => {
  if (!raw) return null;
  const lower = String(raw).toLowerCase().trim();
  if (VALID_TRACK_IDS.has(lower)) return lower;
  if (lower.includes("python")) return "python";
  if (lower.includes("javascript") || lower === "js") return "javascript";
  if (lower.includes("java")) return "java";
  if (lower.includes("c++") || lower.includes("cpp")) return "cpp";
  if (lower.includes("web") || lower.includes("full-stack") || lower.includes("fullstack")) return "webdev";
  if (lower.includes("dsa") || lower.includes("algorithm") || lower.includes("data structure")) return "dsa";
  return null;
};

const isModuleStrictlyComplete = (m) => {
  if (!m) return false;
  const isStudyDone = Boolean(m.isStudied);
  const isCodingDone = Boolean(m.assignmentPassed || m.exercisePassed);
  const isAssessmentDone = Boolean(m.assessmentPassed);
  const isCutoffCleared = Boolean(
    (m.assessmentPassed && (m.bestScore == null || m.bestScore >= 80)) ||
    (m.bestScore != null && m.bestScore >= 80)
  );
  return Boolean(isStudyDone && isCodingDone && isAssessmentDone && isCutoffCleared);
};

/* ══════════════════════════════════════════════════════════════
   MAIN CODING DASHBOARD COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function Coding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Normalize tab names to support aliases like 'learn', 'tracks', 'learning-path', 'practice'
  const normalizeTabName = (name) => {
    if (!name) return "learning_path";
    const lower = String(name).toLowerCase().trim();
    if (lower === "learning_path" || lower === "learning-path" || lower === "learningpath" || lower === "learn" || lower === "tracks" || lower === "track" || lower === "path") {
      return "learning_path";
    }
    if (lower === "challenges" || lower === "challenge" || lower === "practice" || lower === "dsa") {
      return "challenges";
    }
    if (lower === "projects" || lower === "project") {
      return "projects";
    }
    if (lower === "certification" || lower === "certificates" || lower === "certifications" || lower === "exams") {
      return "certification";
    }
    if (lower === "videos" || lower === "video") {
      return "videos";
    }
    if (lower === "study_groups" || lower === "study-groups" || lower === "studygroups" || lower === "live") {
      return "study_groups";
    }
    if (lower === "resources" || lower === "resource") {
      return "resources";
    }
    return "learning_path";
  };

  const rawInitialTab = searchParams.get("tab") || sessionStorage.getItem("mz_coding_active_tab") || location.state?.tab;
  const initialTab = normalizeTabName(rawInitialTab);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Synchronize active tab whenever URL search params or router state changes
  useEffect(() => {
    const tabParam = searchParams.get("tab") || location.state?.tab;
    if (tabParam) {
      const normalized = normalizeTabName(tabParam);
      setActiveTab(normalized);
      try {
        sessionStorage.setItem("mz_coding_active_tab", normalized);
      } catch {}
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    const trackParam = normalizeTrackId(searchParams.get("track") || location.state?.track);
    if (trackParam) {
      hasExplicitTrackRef.current = true;
      setActiveTrackId(trackParam);
      try {
        localStorage.setItem("mz_coding_active_track", trackParam);
      } catch {}
    }
  }, [searchParams, location.state]);

  // Persist activeTab across browser refreshes and sync with URL query
  useEffect(() => {
    try {
      sessionStorage.setItem("mz_coding_active_tab", activeTab);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.searchParams.get("tab") !== activeTab) {
          url.searchParams.set("tab", activeTab);
          window.history.replaceState(window.history.state, "", url.toString());
        }
      }
    } catch {}
  }, [activeTab]);

  // Global search & suggestions
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // User Profile Dropdown
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userPillRef = useRef(null);

  // Data state
  const [tracks, setTracks] = useState(DEFAULT_TRACKS);
  const [activeTrackId, setActiveTrackId] = useState(() => {
    const urlTrack = normalizeTrackId(searchParams.get("track"));
    if (urlTrack) return urlTrack;
    try {
      const savedTrack = normalizeTrackId(localStorage.getItem("mz_coding_active_track"));
      if (savedTrack) return savedTrack;
    } catch {}
    return "python";
  });
  const hasExplicitTrackRef = useRef(
    Boolean(
      normalizeTrackId(searchParams.get("track")) ||
      (() => {
        try {
          return normalizeTrackId(localStorage.getItem("mz_coding_active_track"));
        } catch {
          return null;
        }
      })()
    )
  );
  const [challenges, setChallenges] = useState([]);
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [resources, setResources] = useState(DEFAULT_RESOURCES);
  const [studyGroups, setStudyGroups] = useState(DEFAULT_STUDY_GROUPS);
  const [studyRooms, setStudyRooms] = useState([]);
  const [stats, setStats] = useState({
    totalXp: 0,
    hoursSpent: 0,
    streakDays: 0,
    solvedCount: 0,
    activeTrack: "Python Track",
  });
  const [earnedCertificates, setEarnedCertificates] = useState(() => {
    try {
      const cached = sessionStorage.getItem("mz_cached_earned_certs");
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [certAttempts, setCertAttempts] = useState(() => {
    try {
      const cached = sessionStorage.getItem("mz_cached_cert_attempts");
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  // Filter states inside Challenges tab
  const [challengeDifficulty, setChallengeDifficulty] = useState("all");
  const [challengeCategory, setChallengeCategory] = useState("all");
  const [challengePage, setChallengePage] = useState(1);
  const challengesGridRef = useRef(null);
  const CHALLENGES_PER_PAGE = 10;

  // Pagination state inside Projects tab
  const [projectPage, setProjectPage] = useState(1);
  const projectsGridRef = useRef(null);
  const PROJECTS_PER_PAGE = 6;

  // Modals & Active Workspaces
  const [selectedChallengeModal, setSelectedChallengeModal] = useState(null);
  const [selectedProjectModal, setSelectedProjectModal] = useState(null);
  const [selectedExamWorkspace, setSelectedExamWorkspace] = useState(() => {
    try {
      const rawUser = localStorage.getItem("user");
      let uId = "";
      if (rawUser) {
        const u = JSON.parse(rawUser);
        uId = u._id || u.id || u.userId || "";
      }
      const certKey = uId ? `mz_${uId}_active_cert_session` : "mz_active_cert_session";
      const saved =
        localStorage.getItem(certKey) ||
        localStorage.getItem("mz_active_cert_session") ||
        sessionStorage.getItem("mz_active_cert_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.attemptId && parsed.status === "IN_PROGRESS") {
          if (parsed.userId && uId && parsed.userId !== uId) return null;

          // Expiration guard: Exam attempts strictly expire after 90 minutes. Stale sessions must be discarded.
          const sessionTime = parsed.startedAt || parsed.updatedAt || parsed.timestamp;
          if (!sessionTime || Date.now() - sessionTime > 90 * 60 * 1000) {
            try {
              localStorage.removeItem(certKey);
              localStorage.removeItem("mz_active_cert_session");
              sessionStorage.removeItem("mz_active_cert_session");
              if (uId) {
                localStorage.removeItem(`mz_${uId}_active_cert_session`);
                sessionStorage.removeItem(`mz_${uId}_active_cert_session`);
              }
            } catch {}
            return null;
          }

          // Check if candidate already has an earned certificate for this track
          const cachedCertsRaw =
            sessionStorage.getItem("mz_cached_earned_certs") ||
            sessionStorage.getItem("mz_cert_history_cache") ||
            localStorage.getItem("mz_certificates");
          if (cachedCertsRaw) {
            try {
              const cachedData = JSON.parse(cachedCertsRaw);
              const list = Array.isArray(cachedData) ? cachedData : cachedData.certificates || [];
              const targetCertId = parsed.certId || "dsa_cert";
              const alreadyHas = list.some(
                (c) =>
                  (c.certificationId || c.certId || "").toLowerCase() === targetCertId.toLowerCase()
              );
              if (alreadyHas) {
                try {
                  localStorage.removeItem(certKey);
                  localStorage.removeItem("mz_active_cert_session");
                  sessionStorage.removeItem("mz_active_cert_session");
                  if (uId) {
                    localStorage.removeItem(`mz_${uId}_active_cert_session`);
                    sessionStorage.removeItem(`mz_${uId}_active_cert_session`);
                  }
                } catch {}
                return null;
              }
            } catch {}
          }

          return {
            id: parsed.certId || "dsa_cert",
            name: parsed.certTitle || "Data Structures & Algorithms (DSA)",
            attemptId: parsed.attemptId,
            language: "python",
          };
        }
      }
    } catch {}
    return null;
  });
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Video Library states
  const [videoCourses, setVideoCourses] = useState(DEFAULT_FEATURED_VIDEOS);
  const [videoCategoryFilter, setVideoCategoryFilter] = useState("all");
  const [videoSearchQuery, setVideoSearchQuery] = useState("");

  // Real-Time Coding Hub & Telemetry Tracker (starts at 0min 0sec, auto-resets at 12:00 AM midnight)
  const rawCurrentUserId = (() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        return u._id || u.id || u.userId || "guest";
      }
    } catch {}
    return "guest";
  })();

  const getTodayDateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getInitialLiveSeconds = () => {
    try {
      const today = getTodayDateKey();
      const lastDate = localStorage.getItem(`mz_${rawCurrentUserId}_hub_date`);
      if (lastDate !== today) {
        localStorage.setItem(`mz_${rawCurrentUserId}_hub_date`, today);
        localStorage.setItem(`mz_${rawCurrentUserId}_hub_seconds`, "0");
        return 0;
      }
      const saved = localStorage.getItem(`mz_${rawCurrentUserId}_hub_seconds`);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  };

  const [liveCodingSeconds, setLiveCodingSeconds] = useState(getInitialLiveSeconds);
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [selectedModuleChoice, setSelectedModuleChoice] = useState(null);

  // Sync to localStorage and auto reset at 12:00 AM midnight
  useEffect(() => {
    if (!isLiveTracking) return;
    const interval = setInterval(() => {
      setLiveCodingSeconds((prev) => {
        const today = getTodayDateKey();
        const savedDate = localStorage.getItem(`mz_${rawCurrentUserId}_hub_date`);
        if (savedDate && savedDate !== today) {
          // Midnight has passed! Auto-reset to 0min 0sec
          localStorage.setItem(`mz_${rawCurrentUserId}_hub_date`, today);
          localStorage.setItem(`mz_${rawCurrentUserId}_hub_seconds`, "0");
          return 0;
        }
        const nextVal = prev + 1;
        try {
          localStorage.setItem(`mz_${rawCurrentUserId}_hub_seconds`, String(nextVal));
          localStorage.setItem(`mz_${rawCurrentUserId}_hub_date`, today);
        } catch {}
        return nextVal;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLiveTracking, rawCurrentUserId]);

  const formatLiveDuration = useCallback((secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${s}s`;
    }
    return `${mins}min ${s}sec`;
  }, []);

  // 3-Step Curriculum Modules Progression State
  const [curriculumData, setCurriculumData] = useState({ trackId: activeTrackId, modules: [], unlockLevel: 0 });
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [activeStudyModule, setActiveStudyModule] = useState(null);
  const [studyTimeElapsed, setStudyTimeElapsed] = useState(0);
  const [activeAssignmentModule, setActiveAssignmentModule] = useState(null);
  const [activeAssessmentModule, setActiveAssessmentModule] = useState(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // User authentication info
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        const name = u.fullName || u.username || u.name || localStorage.getItem("userName") || "Learner";
        const email = u.email || localStorage.getItem("userEmail") || "user@masteryzone.com";
        return { ...u, name, fullName: u.fullName || name, email };
      }
    } catch {}
    const name = localStorage.getItem("userName") || "Learner";
    const email = localStorage.getItem("userEmail") || "user@masteryzone.com";
    return { name, fullName: name, email };
  });

  const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId || "";

  // Real-time user info sync from database
  useEffect(() => {
    const fetchFreshUser = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) return;
      try {
        const res = await deduplicatedFetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
          cacheTtlMs: 5000,
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            const u = data.user;
            const name = u.fullName || u.username || u.name || "Learner";
            const email = u.email || "user@masteryzone.com";
            const updated = { ...u, name, fullName: u.fullName || name, email };
            setCurrentUser(updated);
            try {
              localStorage.setItem("user", JSON.stringify(updated));
              localStorage.setItem("mz_user", JSON.stringify(updated));
              localStorage.setItem("userName", name);
              localStorage.setItem("userEmail", email);
            } catch {}
          }
        }
      } catch (err) {
        console.warn("Real-time profile refresh notice:", err);
      }
    };
    fetchFreshUser();
  }, []);

  // Resource Visited State strictly scoped to logged-in user
  const [visitedResources, setVisitedResources] = useState(() => {
    try {
      const rawUser = localStorage.getItem("user");
      let uId = "";
      if (rawUser) {
        const p = JSON.parse(rawUser);
        uId = p._id || p.id || p.userId || "";
      }
      const key = uId ? `mz_${uId}_visited_resources` : "mz_visited_resources";
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  });

  // Certification interactive search & category filter state
  const [certSearchQuery, setCertSearchQuery] = useState("");
  const [certFilterCategory, setCertFilterCategory] = useState("all");

  // Projects interactive domain filter state
  const [projectDomainFilter, setProjectDomainFilter] = useState("all");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  // Study Groups interactive state & configurator
  const [studyGroupCategory, setStudyGroupCategory] = useState("all");
  const [studyRoomCodeInput, setStudyRoomCodeInput] = useState("");
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [pairLang, setPairLang] = useState("Python");
  const [dsaTopic, setDsaTopic] = useState("Dynamic Programming");
  const [archTopic, setArchTopic] = useState("Microservices");
  const [interviewTrack, setInterviewTrack] = useState("Full-Stack Lead");
  const [customRoomTopic, setCustomRoomTopic] = useState("");
  const [customRoomTrack, setCustomRoomTrack] = useState("DSA & Problem Solving");
  const [customRoomLimit, setCustomRoomLimit] = useState("4");

  // Re-render tick when challenges or projects are solved in separate tabs
  const [completionTick, setCompletionTick] = useState(0);

  // Clean up legacy/unauthenticated project completion keys from browser storage
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        Object.keys(window.localStorage).forEach((k) => {
          if (k.startsWith("mz_proj_passed_") || k.includes("_proj_passed_proj_portfolio")) {
            window.localStorage.removeItem(k);
          }
        });
        window.sessionStorage?.removeItem("mz_proj_submitted_proj_portfolio");
      }
    } catch {}
  }, []);

  const applyOptimisticModuleProgress = useCallback((payload) => {
    if (!payload || !payload.type) return;
    if (payload.type === "MZ_ACTIVE_TRACK_CHANGED" && payload.trackId) {
      const normalized = normalizeTrackId(payload.trackId);
      if (normalized) {
        setActiveTrackId(normalized);
        try {
          localStorage.setItem("mz_coding_active_track", normalized);
        } catch {}
      }
      return;
    }

    const targetTrack = normalizeTrackId(payload.trackId) || activeTrackId;
    const modIdx = typeof payload.moduleIndex === "number" ? payload.moduleIndex : Number(payload.moduleIndex);
    if (Number.isNaN(modIdx)) return;

    const patchModule = (mod, idx) => {
      const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : idx;
      if (mIdx !== modIdx) return mod;
      if (payload.type === "MZ_MODULE_STUDIED") {
        return { ...mod, isStudied: true };
      }
      if (payload.type === "MZ_ASSIGNMENT_PASSED") {
        const scoreVal = typeof payload.score === "number" ? payload.score : (Number(payload.score) || 100);
        return {
          ...mod,
          isStudied: true,
          assignmentPassed: true,
          exercisePassed: true,
          exerciseScore: scoreVal,
          assignmentScore: scoreVal,
          score: scoreVal,
          marksObtained: scoreVal,
          bestScore: Math.max(mod.bestScore || 0, scoreVal),
        };
      }
      if (payload.type === "MZ_EXAM_COMPLETED") {
        const numericScore = typeof payload.score === "number" ? payload.score : Number(payload.score);
        const validScore = !Number.isNaN(numericScore) ? numericScore : mod.bestScore;
        const bestScore = validScore != null ? Math.max(mod.bestScore || 0, validScore) : mod.bestScore;
        const passed = payload.passed !== undefined ? Boolean(payload.passed) : (bestScore != null ? bestScore >= 80 : true);
        return {
          ...mod,
          assessmentPassed: passed || Boolean(mod.assessmentPassed),
          bestScore,
        };
      }
      return mod;
    };

    if (targetTrack === activeTrackId) {
      setCurriculumData((prev) => {
        if (!prev || !Array.isArray(prev.modules) || prev.modules.length === 0) return prev;
        if (prev.trackId && prev.trackId !== targetTrack) return prev;
        return {
          ...prev,
          trackId: targetTrack,
          modules: prev.modules.map(patchModule),
        };
      });
    }
  }, [activeTrackId]);

  useEffect(() => {
    const handleStorageOrCustom = (e) => {
      if (e && e.key && e.key !== "user" && e.key !== "mz_coding_active_track" && !e.key.startsWith("mz_")) {
        return;
      }
      setCompletionTick((t) => t + 1);
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          const name = u.fullName || u.username || u.name || "Learner";
          setCurrentUser({ ...u, name, fullName: u.fullName || name, email: u.email || "user@masteryzone.com" });
        }
      } catch {}
      fetchDashboardData(true);
    };

    const handleWindowMessage = (event) => {
      if (
        event.data?.type === "MZ_MODULE_STUDIED" ||
        event.data?.type === "MZ_EXAM_COMPLETED" ||
        event.data?.type === "MZ_ASSIGNMENT_PASSED" ||
        event.data?.type === "mz_module_progress_updated"
      ) {
        applyOptimisticModuleProgress(event.data);
        trackCurriculumCache.clear();
        moduleDetailCache.clear();
        invalidateCachePattern("/api/curriculum");
        invalidateCachePattern("/api/coding");
        if (activeTrackId) {
          fetchCurriculum(activeTrackId, true);
        }
        fetchDashboardData(true);
      }
    };

    window.addEventListener("mz_challenge_solved", handleStorageOrCustom);
    window.addEventListener("mz_project_passed", handleStorageOrCustom);
    window.addEventListener("storage", handleStorageOrCustom);
    window.addEventListener("message", handleWindowMessage);
    return () => {
      window.removeEventListener("mz_challenge_solved", handleStorageOrCustom);
      window.removeEventListener("mz_project_passed", handleStorageOrCustom);
      window.removeEventListener("storage", handleStorageOrCustom);
      window.removeEventListener("message", handleWindowMessage);
    };
  }, [activeTrackId, applyOptimisticModuleProgress]);

  const lastDashboardFetchRef = useRef(0);
  const lastFocusSyncRef = useRef(0);

  /* ────────────────────────────────────────────────────────────
     1. Fetch Unified Dashboard Data
     ──────────────────────────────────────────────────────────── */
  const fetchDashboardData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastDashboardFetchRef.current < 1200) {
      return;
    }
    lastDashboardFetchRef.current = now;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    let challengesLoadedFromData = false;

    const pData = deduplicatedFetch(`${API_BASE}/api/coding/data`, {
      headers,
      cacheTtlMs: force ? 0 : 3500,
      forceFresh: force,
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (!hasExplicitTrackRef.current) {
            const serverTrack = normalizeTrackId(data.progress?.activeTrack || data.stats?.activeTrack);
            if (serverTrack) {
              hasExplicitTrackRef.current = true;
              setActiveTrackId(serverTrack);
              try {
                localStorage.setItem("mz_coding_active_track", serverTrack);
              } catch {}
            }
          }
          if (Array.isArray(data.tracks) && data.tracks.length > 0) {
            const merged = data.tracks.map((t) => {
              const def = DEFAULT_TRACKS.find((dt) => dt.id === t.id);
              const completed = Number(t.completedLessons) || 0;
              const total = Number(t.totalLessons) || def?.totalLessons || (def?.modules || []).length || 8;
              const rawModules = Array.isArray(t.modules) && t.modules.length > 0 ? t.modules : (def?.modules || []);
              const modules = rawModules.map((mod, idx) => ({
                ...mod,
                status: idx < completed ? "completed" : (idx === completed && completed < total ? "in_progress" : "available"),
              }));
              return {
                ...t,
                badgeText: t.badgeText || def?.badgeText || "Core",
                modules,
              };
            });
            setTracks(merged);
          }
          if (Array.isArray(data.challenges) && data.challenges.length > 0) {
            setChallenges(data.challenges);
            challengesLoadedFromData = true;
          }
          if (Array.isArray(data.videoCourses) && data.videoCourses.length > 0) {
            setVideoCourses(data.videoCourses);
          }
          if (Array.isArray(data.projects) && data.projects.length > 0) {
            setProjects(data.projects);
          }
          if (Array.isArray(data.resources) && data.resources.length > 0) {
            setResources(data.resources);
          }
          if (data.stats) {
            setStats(data.stats);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load /api/coding/data, falling back to local catalog:", err);
      });

    const pChallenges = pData.then(async () => {
      // If challenges were already populated by /api/coding/data, skip duplicate request
      if (challengesLoadedFromData) return;
      try {
        const chRes = await deduplicatedFetch(`${API_BASE}/api/coding/challenges`, { cacheTtlMs: 10000 });
        if (chRes.ok) {
          const chData = await chRes.json();
          if (Array.isArray(chData.challenges) && chData.challenges.length > 0) {
            setChallenges(chData.challenges);
          }
        }
      } catch {}
    });

    const pCert = token
      ? deduplicatedFetch(`${API_BASE}/api/certifications/my-history`, { headers, cacheTtlMs: 4000 })
          .then(async (certRes) => {
            if (certRes.ok) {
              const certData = await certRes.json();
              if (Array.isArray(certData.certificates)) {
                setEarnedCertificates(certData.certificates);
                try {
                  sessionStorage.setItem("mz_cached_earned_certs", JSON.stringify(certData.certificates));
                } catch {}
                if (certData.certificates.length === 0) {
                  try {
                    const uKey = currentUserId || "guest";
                    ["python_cert", "js_cert", "fullstack_cert", "java_cert", "cpp_cert", "dsa_cert"].forEach((k) => {
                      localStorage.removeItem(`mz_${uKey}_cert_${k}_submitted`);
                      localStorage.removeItem(`mz_cert_${k}_submitted`);
                      localStorage.removeItem(`mz_${uKey}_cert_passed_${k}`);
                      localStorage.removeItem(`mz_cert_passed_${k}`);
                      localStorage.removeItem(`mz_${uKey}_cert_${k}_report_url`);
                    });
                  } catch {}
                }
              }
              if (Array.isArray(certData.attempts)) {
                setCertAttempts(certData.attempts);
                try {
                  sessionStorage.setItem("mz_cached_cert_attempts", JSON.stringify(certData.attempts));
                } catch {}
              }
            }
          })
          .catch(() => {})
      : Promise.resolve();

    await Promise.allSettled([pData, pChallenges, pCert]);
  }, [token, currentUserId]);

  useEffect(() => {
    fetchDashboardData();

    const handleProjectPassed = (e) => {
      const pid = e.detail?.projectId;
      if (pid) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id === pid) {
              return {
                ...p,
                userState: {
                  ...p.userState,
                  passed: true,
                  badgeAwarded: true,
                  status: "PASSED",
                  bestScore: Math.max(p.userState?.bestScore || 0, p.passingMarks || 80),
                  progressPercent: 100,
                },
              };
            }
            return p;
          })
        );
      }
      fetchDashboardData();
    };

    const handleChallengeSolved = (e) => {
      const chId = e.detail?.challengeId;
      if (chId) {
        setChallenges((prev) =>
          prev.map((c) => (c.id === chId ? { ...c, solved: true, isCompleted: true } : c))
        );
      }
      fetchDashboardData();
    };

    const handleCertAwarded = () => {
      fetchDashboardData();
    };

    window.addEventListener("mz_project_passed", handleProjectPassed);
    window.addEventListener("mz_challenge_solved", handleChallengeSolved);
    window.addEventListener("mz_certificate_awarded", handleCertAwarded);

    return () => {
      window.removeEventListener("mz_project_passed", handleProjectPassed);
      window.removeEventListener("mz_challenge_solved", handleChallengeSolved);
      window.removeEventListener("mz_certificate_awarded", handleCertAwarded);
    };
  }, [fetchDashboardData]);

  // Fetch real curriculum modules from server with request deduplication, cancellation and in-memory caching
  const curriculumAbortRef = useRef(null);

  const fetchCurriculum = useCallback(async (trackId, forceRefresh = false) => {
    if (!trackId) return;

    // Fast-path: return cached curriculum data instantly
    if (!forceRefresh && trackCurriculumCache.has(trackId)) {
      setCurriculumData(trackCurriculumCache.get(trackId));
      setLoadingCurriculum(false);
      return;
    }

    // Cancel in-flight request for previous track to prevent race conditions and stale response overwrites
    if (curriculumAbortRef.current) {
      curriculumAbortRef.current.abort();
    }
    const controller = new AbortController();
    curriculumAbortRef.current = controller;

    setLoadingCurriculum(true);
    const token = localStorage.getItem("token");
    try {
      const res = await deduplicatedFetch(`${API_BASE}/api/curriculum/coding/${trackId}`, {
        signal: controller.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cacheTtlMs: forceRefresh ? 0 : 10000,
        forceFresh: forceRefresh,
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.modules)) {
          const tagged = { ...data, trackId };
          trackCurriculumCache.set(trackId, tagged);
          setCurriculumData(tagged);
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Failed to fetch curriculum modules:", err);
      }
    } finally {
      if (curriculumAbortRef.current === controller) {
        setLoadingCurriculum(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCurriculum(activeTrackId);
  }, [activeTrackId, fetchCurriculum]);

  // Real-time synchronization for curriculum progress across tabs & windows
  useEffect(() => {
    const handleSync = (payload) => {
      if (payload) {
        applyOptimisticModuleProgress(payload);
      }
      trackCurriculumCache.clear();
      moduleDetailCache.clear();
      invalidateCachePattern("/api/curriculum");
      invalidateCachePattern("/api/coding");
      const targetTrack = normalizeTrackId(payload?.trackId) || activeTrackId;
      if (targetTrack) {
        fetchCurriculum(targetTrack, true);
      }
      fetchDashboardData(true);
    };

    const handleStorage = (e) => {
      if (
        !e ||
        e.key === "mz_module_progress_updated" ||
        e.key === "mz_exam_completed" ||
        e.key === "mz_assignment_passed" ||
        e.key === "mz_learning_progress_reset" ||
        e.key === "mz_coding_active_track" ||
        e.key === "user"
      ) {
        let parsed = null;
        if (e?.newValue && e.key === "mz_module_progress_updated") {
          try {
            parsed = JSON.parse(e.newValue);
          } catch {}
        } else if (e?.key === "mz_coding_active_track" && e.newValue) {
          parsed = { type: "MZ_ACTIVE_TRACK_CHANGED", trackId: e.newValue };
        }
        handleSync(parsed);
      }
    };

    const handleCustomEvent = (e) => handleSync(e?.detail || null);

    let bc = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("mz_module_sync");
        bc.onmessage = (msg) => handleSync(msg?.data || null);
      }
    } catch {}

    const handleFocusOrVisibility = () => {
      const now = Date.now();
      if (now - lastFocusSyncRef.current < 1500) {
        return;
      }
      lastFocusSyncRef.current = now;
      invalidateCachePattern("/api/curriculum");
      invalidateCachePattern("/api/coding");
      if (activeTrackId) {
        fetchCurriculum(activeTrackId, true);
      }
      fetchDashboardData(true);
    };

    const handleFocus = () => handleFocusOrVisibility();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleFocusOrVisibility();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("mz_module_studied", handleCustomEvent);
    window.addEventListener("mz_assignment_passed", handleCustomEvent);
    window.addEventListener("mz_exam_completed", handleCustomEvent);
    window.addEventListener("mz_learning_progress_reset", handleCustomEvent);
    window.addEventListener("mz_marks_updated", handleCustomEvent);
    window.addEventListener("mz_submission_updated", handleCustomEvent);
    window.addEventListener("mz_submission_created", handleCustomEvent);
    window.addEventListener("mz_progress_updated", handleCustomEvent);
    window.addEventListener("mz_cert_updated", handleCustomEvent);
    window.addEventListener("mz_socket_reconnected", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("mz_module_studied", handleCustomEvent);
      window.removeEventListener("mz_assignment_passed", handleCustomEvent);
      window.removeEventListener("mz_exam_completed", handleCustomEvent);
      window.removeEventListener("mz_learning_progress_reset", handleCustomEvent);
      window.removeEventListener("mz_marks_updated", handleCustomEvent);
      window.removeEventListener("mz_submission_updated", handleCustomEvent);
      window.removeEventListener("mz_submission_created", handleCustomEvent);
      window.removeEventListener("mz_progress_updated", handleCustomEvent);
      window.removeEventListener("mz_cert_updated", handleCustomEvent);
      window.removeEventListener("mz_socket_reconnected", handleCustomEvent);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [activeTrackId, applyOptimisticModuleProgress, fetchCurriculum, fetchDashboardData]);

  // Concept study lesson timer
  useEffect(() => {
    let timer = null;
    if (activeStudyModule) {
      timer = setInterval(() => {
        setStudyTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeStudyModule]);

  // Click outside listener for search & user dropdown
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (userPillRef.current && !userPillRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  // Keyboard shortcut ⌘K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* ────────────────────────────────────────────────────────────
     2. Rich Search Engine (Handles Question Numbers + Keywords)
     ──────────────────────────────────────────────────────────── */
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return { matchedChallenges: [], matchedTracks: [], matchedProjects: [], isQuestionNumMatch: false, qNum: null };

    // Check if query is a question number (e.g. "1", "#1", "22", "#22")
    const qNumMatch = query.match(/^#?(\d+)$/);
    const targetQNum = qNumMatch ? parseInt(qNumMatch[1], 10) : null;

    let matchedChallenges = [];
    if (targetQNum !== null) {
      // Find exact question number match first, then numbers starting with it
      matchedChallenges = challenges.filter(
        (ch) => ch.questionNumber === targetQNum || String(ch.questionNumber).startsWith(String(targetQNum))
      );
    } else {
      matchedChallenges = challenges.filter((ch) => {
        const numStr = String(ch.questionNumber || "");
        return (
          numStr === query ||
          `#${numStr}` === query ||
          (ch.title && ch.title.toLowerCase().includes(query)) ||
          (ch.category && ch.category.toLowerCase().includes(query)) ||
          (ch.difficulty && ch.difficulty.toLowerCase() === query)
        );
      });
    }

    const matchedTracks = tracks.filter((t) => {
      return (
        t.title.toLowerCase().includes(query) ||
        t.subtitle.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
      );
    });

    const matchedProjects = projects.filter((p) => {
      return (
        p.title.toLowerCase().includes(query) ||
        (p.domain && p.domain.toLowerCase().includes(query)) ||
        (p.technologies && p.technologies.some((tech) => tech.toLowerCase().includes(query)))
      );
    });

    return {
      matchedChallenges: matchedChallenges.slice(0, 15),
      matchedTracks: matchedTracks.slice(0, 4),
      matchedProjects: matchedProjects.slice(0, 4),
      isQuestionNumMatch: targetQNum !== null,
      qNum: targetQNum,
    };
  }, [searchQuery, challenges, tracks, projects]);

  const totalResultsCount =
    searchResults.matchedChallenges.length +
    searchResults.matchedTracks.length +
    searchResults.matchedProjects.length;

  /* ────────────────────────────────────────────────────────────
     3. Active Track & Challenges Filtering
     ──────────────────────────────────────────────────────────── */
  const activeTrack = useMemo(() => {
    return tracks.find((t) => t.id === activeTrackId) || tracks[0] || DEFAULT_TRACKS[0];
  }, [tracks, activeTrackId]);

  const handleSelectTrack = useCallback((nextTrackId) => {
    const normalized = normalizeTrackId(nextTrackId) || nextTrackId;
    if (!normalized) return;

    hasExplicitTrackRef.current = true;
    setActiveTrackId(normalized);
    try {
      localStorage.setItem("mz_coding_active_track", normalized);
      const url = new URL(window.location.href);
      url.searchParams.set("track", normalized);
      window.history.replaceState(window.history.state, "", url.toString());
    } catch {}

    if (trackCurriculumCache.has(normalized)) {
      setCurriculumData(trackCurriculumCache.get(normalized));
      setLoadingCurriculum(false);
    } else {
      setCurriculumData({ trackId: normalized, modules: [], unlockLevel: 0 });
    }

    const targetTrack = tracks.find((t) => t.id === normalized) || DEFAULT_TRACKS.find((t) => t.id === normalized);
    if (targetTrack) {
      setStats((prev) => ({ ...prev, activeTrack: targetTrack.title }));
    }

    const authToken = localStorage.getItem("token");
    if (authToken) {
      fetch(`${API_BASE}/api/coding/track/select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ track: normalized }),
      }).catch(() => {});
    }

    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("mz_module_sync");
        bc.postMessage({ type: "MZ_ACTIVE_TRACK_CHANGED", trackId: normalized, timestamp: Date.now() });
        bc.close();
      }
    } catch {}
  }, [tracks]);

  const displayModules = useMemo(() => {
    if (
      curriculumData &&
      (!curriculumData.trackId || curriculumData.trackId === activeTrackId) &&
      Array.isArray(curriculumData.modules) &&
      curriculumData.modules.length > 0
    ) {
      return curriculumData.modules;
    }
    return (activeTrack.modules || []).map((m, idx) => ({
      id: m.id || `${activeTrackId}_m${idx + 1}`,
      moduleIndex: typeof m.moduleIndex === "number" ? m.moduleIndex : idx,
      title: m.title,
      subtitle: m.desc,
      desc: m.desc,
      estimatedTime: m.duration || "45m",
      isStudied: m.status === "completed",
      assignmentPassed: m.status === "completed",
      exercisePassed: m.status === "completed",
      assessmentPassed: m.status === "completed",
      bestScore: m.status === "completed" ? 100 : null,
    }));
  }, [curriculumData, activeTrack, activeTrackId]);

  const activeModuleChoice = useMemo(() => {
    if (!selectedModuleChoice) return null;
    return (
      displayModules.find(
        (m) =>
          (selectedModuleChoice.id && m.id === selectedModuleChoice.id) ||
          (typeof selectedModuleChoice.moduleIndex === "number" && m.moduleIndex === selectedModuleChoice.moduleIndex)
      ) || selectedModuleChoice
    );
  }, [selectedModuleChoice, displayModules]);

  const completedCount = useMemo(() => {
    return displayModules.filter(isModuleStrictlyComplete).length;
  }, [displayModules]);

  const hasStartedLearning = useMemo(() => {
    return (
      completedCount > 0 ||
      displayModules.some(
        (m) =>
          Boolean(m.assessmentPassed) ||
          Boolean(m.assignmentPassed) ||
          Boolean(m.exercisePassed) ||
          Boolean(m.isStudied) ||
          Boolean(m.score)
      )
    );
  }, [completedCount, displayModules]);

  const totalCount = displayModules.length || 8;
  const completionPercentage = Math.round((completedCount / (totalCount || 1)) * 100);

  const filteredChallenges = useMemo(() => {
    let list = challenges;

    // Filter by search query if in challenges tab
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const qNumMatch = q.match(/^#?(\d+)$/);
      if (qNumMatch) {
        const num = parseInt(qNumMatch[1], 10);
        list = list.filter((ch) => ch.questionNumber === num || String(ch.questionNumber).startsWith(String(num)));
      } else {
        list = list.filter(
          (ch) =>
            ch.title?.toLowerCase().includes(q) ||
            ch.category?.toLowerCase().includes(q) ||
            ch.difficulty?.toLowerCase().includes(q) ||
            ch.topic?.toLowerCase().includes(q) ||
            ch.description?.toLowerCase().includes(q) ||
            (Array.isArray(ch.tags) && ch.tags.some((t) => t.toLowerCase().includes(q))) ||
            String(ch.questionNumber) === q ||
            `#${ch.questionNumber}` === q
        );
      }
    }

    if (challengeDifficulty !== "all") {
      list = list.filter((ch) => ch.difficulty?.toLowerCase() === challengeDifficulty.toLowerCase());
    }

    if (challengeCategory !== "all") {
      list = list.filter((ch) => ch.category?.toLowerCase() === challengeCategory.toLowerCase());
    }

    return list;
  }, [challenges, searchQuery, challengeDifficulty, challengeCategory]);

  // Reset to page 1 whenever difficulty filter, topic filter, or search query changes
  useEffect(() => {
    setChallengePage(1);
  }, [challengeDifficulty, challengeCategory, searchQuery]);

  const totalChallengesCount = filteredChallenges.length;
  const totalChallengePages = Math.max(1, Math.ceil(totalChallengesCount / CHALLENGES_PER_PAGE));

  // Clamp current page if filtered results shrink and current page is out of bounds
  useEffect(() => {
    if (challengePage > totalChallengePages) {
      setChallengePage(1);
    }
  }, [challengePage, totalChallengePages]);

  const startChallengeIndex = (challengePage - 1) * CHALLENGES_PER_PAGE;
  const endChallengeIndex = Math.min(startChallengeIndex + CHALLENGES_PER_PAGE, totalChallengesCount);

  const paginatedChallenges = useMemo(() => {
    return filteredChallenges.slice(startChallengeIndex, startChallengeIndex + CHALLENGES_PER_PAGE);
  }, [filteredChallenges, startChallengeIndex]);

  const getPageNumbers = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total];
    }
    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  const handleChallengePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalChallengePages || newPage === challengePage) return;
    setChallengePage(newPage);
    if (challengesGridRef.current) {
      const yOffset = -90;
      const y = challengesGridRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  const filteredVideoCourses = useMemo(() => {
    return (videoCourses || []).filter((vid) => {
      // Category filter
      if (videoCategoryFilter !== "all") {
        const cat = (vid.category || "").toLowerCase();
        const lang = (vid.language || "").toLowerCase();
        const target = videoCategoryFilter.toLowerCase();
        if (target === "python") {
          if (!cat.includes("python") && !lang.includes("python")) return false;
        } else if (target === "javascript") {
          if (!cat.includes("javascript") && !lang.includes("javascript") && !cat.includes("react") && !cat.includes("typescript")) return false;
        } else if (target === "java") {
          if ((!cat.includes("java") || cat.includes("javascript")) && (!lang.includes("java") || lang.includes("javascript"))) return false;
        } else if (target === "cpp") {
          if (!cat.includes("c++") && !lang.includes("cpp")) return false;
        } else if (target === "dsa") {
          if (!cat.includes("data structure") && !cat.includes("algorithm") && !cat.includes("dsa") && !cat.includes("system design")) return false;
        } else if (target === "web") {
          if (!cat.includes("web") && !cat.includes("react") && !cat.includes("next") && !cat.includes("backend")) return false;
        } else if (target === "database") {
          if (!cat.includes("database") && !cat.includes("sql") && !lang.includes("sql")) return false;
        } else if (target === "devops") {
          if (!cat.includes("devops") && !cat.includes("docker") && !cat.includes("tools") && !cat.includes("git")) return false;
        }
      }

      // Search query
      if (videoSearchQuery.trim()) {
        const q = videoSearchQuery.toLowerCase().trim();
        const titleMatch = (vid.title || "").toLowerCase().includes(q);
        const channelMatch = (vid.channelTitle || "").toLowerCase().includes(q);
        const catMatch = (vid.category || "").toLowerCase().includes(q);
        const topicMatch = Array.isArray(vid.topics) && vid.topics.some((t) => (t || "").toLowerCase().includes(q));
        if (!titleMatch && !channelMatch && !catMatch && !topicMatch) return false;
      }

      return true;
    });
  }, [videoCourses, videoCategoryFilter, videoSearchQuery]);

  const filteredProjects = useMemo(() => {
    let list = Array.isArray(projects) && projects.length > 0 ? projects : DEFAULT_PROJECTS;
    if (projectDomainFilter !== "all") {
      const target = projectDomainFilter.toLowerCase();
      list = list.filter((p) => {
        const d = (p.domain || p.category || p.track || "").toLowerCase();
        const tech = (p.technologies || []).map((t) => t.toLowerCase());
        if (target === "backend") return d.includes("backend") || tech.some((t) => t.includes("node") || t.includes("redis") || t.includes("sql"));
        if (target === "real-time") return d.includes("real-time") || tech.some((t) => t.includes("websocket") || t.includes("socket"));
        if (target === "financial") return d.includes("financial") || tech.some((t) => t.includes("c++") || t.includes("trading"));
        if (target === "full-stack") return d.includes("full-stack") || d.includes("web") || tech.some((t) => t.includes("react") || t.includes("fastapi"));
        if (target === "enterprise") return d.includes("enterprise") || tech.some((t) => t.includes("java") || t.includes("spring"));
        if (target === "ai") return d.includes("ai") || d.includes("data") || tech.some((t) => t.includes("nlp") || t.includes("regex"));
        return d.includes(target);
      });
    }
    if (projectSearchQuery.trim()) {
      const q = projectSearchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const title = (p.title || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const techs = (p.technologies || []).map((t) => t.toLowerCase());
        return title.includes(q) || desc.includes(q) || techs.some((t) => t.includes(q));
      });
    }
    return list;
  }, [projects, projectDomainFilter, projectSearchQuery]);

  // Reset to page 1 whenever project domain filter or search query changes
  useEffect(() => {
    setProjectPage(1);
  }, [projectDomainFilter, projectSearchQuery]);

  const totalProjectsCount = filteredProjects.length;
  const totalProjectPages = Math.max(1, Math.ceil(totalProjectsCount / PROJECTS_PER_PAGE));

  useEffect(() => {
    if (projectPage > totalProjectPages) {
      setProjectPage(1);
    }
  }, [projectPage, totalProjectPages]);

  const startProjectIndex = (projectPage - 1) * PROJECTS_PER_PAGE;
  const endProjectIndex = Math.min(startProjectIndex + PROJECTS_PER_PAGE, totalProjectsCount);

  const paginatedProjects = useMemo(() => {
    return filteredProjects.slice(startProjectIndex, startProjectIndex + PROJECTS_PER_PAGE);
  }, [filteredProjects, startProjectIndex]);

  const handleProjectPageChange = (newPage) => {
    if (newPage < 1 || newPage > totalProjectPages || newPage === projectPage) return;
    setProjectPage(newPage);
    if (projectsGridRef.current) {
      const yOffset = -90;
      const y = projectsGridRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  const challengeCategoriesList = useMemo(() => {
    const cats = new Set(challenges.map((c) => c.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [challenges]);

  const filteredStudyGroups = useMemo(() => {
    if (studyGroupCategory === "all") return studyGroups;
    return studyGroups.filter((g) => {
      const cat = (g.category || "").toLowerCase();
      const tags = (g.tags || []).map((t) => t.toLowerCase());
      const target = studyGroupCategory.toLowerCase();
      if (target === "algorithms") return cat.includes("algorithm") || tags.some((t) => t.includes("tree") || t.includes("dp") || t.includes("pointer"));
      if (target === "backend") return cat.includes("backend") || cat.includes("ai") || tags.some((t) => t.includes("python") || t.includes("fastapi"));
      if (target === "web") return cat.includes("web") || tags.some((t) => t.includes("react") || t.includes("node"));
      if (target === "systems") return cat.includes("system") || tags.some((t) => t.includes("c++") || t.includes("raii"));
      if (target === "career") return cat.includes("career") || tags.some((t) => t.includes("mock") || t.includes("behavioral"));
      if (target === "communication") return cat.includes("communication") || tags.some((t) => t.includes("english"));
      return true;
    });
  }, [studyGroups, studyGroupCategory]);

  /* ────────────────────────────────────────────────────────────
     4. Action Handlers
     ──────────────────────────────────────────────────────────── */
  const handleOpenChallenge = (challenge) => {
    setShowSearchDropdown(false);
    const chId = challenge?.id || challenge?._id;
    if (chId) {
      window.open(`/challenge-workspace/${chId}`, "_blank", "noopener,noreferrer");
    } else {
      setSelectedChallengeModal(challenge);
    }
  };

  const handleOpenProject = (project) => {
    setShowSearchDropdown(false);
    const projId = project?.id || project?._id;
    if (projId) {
      window.open(`/project-workspace/${projId}`, "_blank", "noopener,noreferrer");
    } else {
      setSelectedProjectModal(project);
    }
  };

  const getSubjectCertStatus = useCallback(
    (subjectId) => {
      if (!subjectId) return { isCompleted: false };
      const target = subjectId.toLowerCase();

      // Check earned valid certificates from database
      const cert = earnedCertificates.find((c) => {
        const cId = (c.certificationId || c.certId || "").toLowerCase();
        return (
          cId === target ||
          (target === "js_cert" && cId === "fullstack_cert") ||
          (target === "fullstack_cert" && cId === "js_cert")
        );
      });

      // Check passed attempts (strictly status PASSED, finalVerdict PASSED, and cutoff met >= 80%)
      const passedAttempt = certAttempts.find((att) => {
        const aId = (att.certId || "").toLowerCase();
        const matches =
          aId === target ||
          (target === "js_cert" && aId === "fullstack_cert") ||
          (target === "fullstack_cert" && aId === "js_cert");
        const score = att.finalScorePercentage != null ? att.finalScorePercentage : (att.percentage != null ? att.percentage : 0);
        return (
          matches &&
          att.status === "PASSED" &&
          (att.finalVerdict === "PASSED" || !att.finalVerdict) &&
          score >= 80
        );
      });

      // Check latest attempt for previous score feedback
      const latestAttempt = certAttempts
        .filter((att) => {
          const aId = (att.certId || "").toLowerCase();
          return (
            aId === target ||
            (target === "js_cert" && aId === "fullstack_cert") ||
            (target === "fullstack_cert" && aId === "js_cert")
          );
        })
        .sort(
          (a, b) =>
            new Date(b.startTime || b.createdAt || 0) -
            new Date(a.startTime || a.createdAt || 0)
        )[0];

      // Strictly completed ONLY if an authentic certificate was issued or a verified passed attempt exists with cutoff met
      const isCompleted = Boolean(cert || (passedAttempt && passedAttempt.certificateId));
      const certificateId = cert?.certificateId || passedAttempt?.certificateId || null;
      const attemptId = passedAttempt?.attemptId || cert?.attemptId || latestAttempt?.attemptId || null;

      return {
        isCompleted,
        certificate: cert,
        passedAttempt,
        latestAttempt,
        certificateId,
        attemptId,
      };
    },
    [earnedCertificates, certAttempts]
  );

  const handleStartExam = (certId, certTitle, language = "python") => {
    const status = getSubjectCertStatus(certId);
    if (status.isCompleted) {
      toast.info("You have already passed this certification and earned your credential! Completed tests cannot be retaken.", {
        toastId: "cert_cannot_retake",
      });
      if (status.certificateId) {
        window.open(`/certification/verify/${status.certificateId}`, "_blank", "noopener,noreferrer");
      }
      return;
    }

    // Clean stale submitted flags from localStorage before starting retake
    const uKey = currentUser?._id || currentUser?.id || "guest";
    localStorage.removeItem(`mz_${uKey}_cert_${certId}_submitted`);
    localStorage.removeItem(`mz_${uKey}_cert_${certId}_report_url`);

    // Open certification examination strictly in a dedicated separate tab
    window.open(`/certification-exam/${certId}`, "_blank", "noopener,noreferrer");
  };

  const handleOpenPlayground = (langId) => {
    setShowSearchDropdown(false);
    const targetLang = (langId || "python").toLowerCase();
    const seed = Date.now();
    window.open(`/challenge-workspace/playground-${targetLang}-${seed}`, "_blank", "noopener,noreferrer");
  };

  const handleStartInstantMeeting = async (customTitle, customKey) => {
    setIsCreatingMeeting(true);
    try {
      const titleStr = typeof customTitle === "string" && customTitle.trim()
        ? customTitle.trim()
        : "Mastery Zone Instant Live Pod";
      const keyStr = typeof customKey === "string" && customKey.trim()
        ? customKey.trim()
        : "study_group";

      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/api/meetings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: titleStr,
          groupKey: keyStr,
        }),
      });
      let meetingId = null;
      if (res.ok) {
        const data = await res.json();
        meetingId = data.meetingId;
      } else {
        const r1 = Math.random().toString(36).substring(2, 5);
        const r2 = Math.random().toString(36).substring(2, 6);
        const r3 = Math.random().toString(36).substring(2, 5);
        meetingId = `${r1}-${r2}-${r3}`;
      }

      if (meetingId) {
        sessionStorage.setItem(`mz_host_${meetingId}`, "true");
        window.open(`/meeting/${meetingId}`, "_blank", "noopener,noreferrer");
        toast.success(`Live room "${titleStr}" launched!`);
      }
    } catch (err) {
      console.warn("Instant meeting creation:", err);
      const r1 = Math.random().toString(36).substring(2, 5);
      const r2 = Math.random().toString(36).substring(2, 6);
      const r3 = Math.random().toString(36).substring(2, 5);
      const fallbackId = `${r1}-${r2}-${r3}`;
      sessionStorage.setItem(`mz_host_${fallbackId}`, "true");
      window.open(`/meeting/${fallbackId}`, "_blank", "noopener,noreferrer");
      toast.success("Live room launched in fallback mode!");
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  const handleCreateCustomRoom = (e) => {
    e?.preventDefault();
    const title = customRoomTopic.trim() || `${customRoomTrack} Live Pod`;
    handleStartInstantMeeting(`${title} (${customRoomLimit} peers max)`, customRoomTrack.toLowerCase().replace(/[^a-z0-9]/g, "_"));
    setCustomRoomTopic("");
  };

  const handleJoinStudyGroup = (sg) => {
    const meetingKey = sg.activeMeetingId || sg.meetingId || sg.id || sg.key;
    window.open(`/meeting/${meetingKey}`, "_blank", "noopener,noreferrer");
  };

  const handleJoinWithCode = (e) => {
    e?.preventDefault();
    let raw = studyRoomCodeInput.trim().toLowerCase();
    if (!raw) return;
    if (raw.includes("/meeting/")) {
      raw = raw.split("/meeting/").pop().split("?")[0].split("/")[0];
    } else if (raw.includes("meetingid=")) {
      raw = raw.split("meetingid=").pop().split("&")[0];
    } else if (raw.includes("/")) {
      raw = raw.split("/").filter(Boolean).pop().split("?")[0];
    }
    const alphanumeric = raw.replace(/[^a-z0-9]/g, "");
    if (alphanumeric.length === 10) {
      raw = `${alphanumeric.slice(0, 3)}-${alphanumeric.slice(3, 7)}-${alphanumeric.slice(7, 10)}`;
    }
    window.open(`/meeting/${raw}`, "_blank", "noopener,noreferrer");
    setStudyRoomCodeInput("");
  };

  const handleOpenResource = (resItem) => {
    if (!resItem) return;
    const key = resItem.url || resItem.title;
    if (!visitedResources.includes(key)) {
      const updated = [...visitedResources, key];
      setVisitedResources(updated);
      try {
        const uId = currentUser?._id || currentUser?.id || currentUser?.userId;
        if (uId) {
          localStorage.setItem(`mz_${uId}_visited_resources`, JSON.stringify(updated));
        }
      } catch {}
      // Sync permanently to user's database account
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${API_BASE}/api/coding/resources/visit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: resItem.url, title: resItem.title }),
        }).catch(() => {});
      }
    }
    try {
      window.open(resItem.url, "_blank", "noopener,noreferrer");
    } catch {}
  };

  const handlePracticeInLearningPath = (video) => {
    setActiveVideoModal(null);
    setActiveTab("learning_path");

    if (video) {
      const lang = (video.language || video.category || "").toLowerCase();
      const matchedTrack = tracks.find(
        (t) =>
          t.id === lang ||
          t.id.includes(lang) ||
          lang.includes(t.id) ||
          t.title.toLowerCase().includes(lang)
      );
      if (matchedTrack) {
        handleSelectTrack(matchedTrack.id);
      }
    }

    setTimeout(() => {
      const el = document.querySelector(".mz-c-track-hero-card") || document.querySelector(".mz-c-timeline");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
  };

  // ── Step 1: Open Theory / Concept Learning Lesson ──
  const handleOpenStudy = async (module) => {
    setShowSearchDropdown(false);
    const cacheKey = `${activeTrackId}_${module.moduleIndex}`;
    if (moduleDetailCache.has(cacheKey)) {
      setActiveStudyModule(moduleDetailCache.get(cacheKey));
      setStudyTimeElapsed(0);
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/curriculum/coding/${activeTrackId}/${module.moduleIndex}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        moduleDetailCache.set(cacheKey, data);
        setActiveStudyModule(data);
        setStudyTimeElapsed(0);
      } else {
        setActiveStudyModule(module);
        setStudyTimeElapsed(0);
      }
    } catch {
      setActiveStudyModule(module);
      setStudyTimeElapsed(0);
    }
  };

  // ── Step 1 Complete: Auto proceed to Step 2 (Coding Test) ──
  const handleFinishStudy = async (completedMod) => {
    const mod = completedMod || activeStudyModule;
    setActiveStudyModule(null);
    if (!mod) return;

    const cacheKey = `${activeTrackId}_${mod.moduleIndex}`;
    if (moduleDetailCache.has(cacheKey)) {
      const cached = moduleDetailCache.get(cacheKey);
      moduleDetailCache.set(cacheKey, { ...cached, isStudied: true, progressState: { ...(cached.progressState || {}), isStudied: true } });
    }

    // Immediately transition candidate to Step 2: Practical Coding Test
    setActiveAssignmentModule(mod);
    toast.success("Concept lesson studied! Proceeding to Step 2: Practical Coding Test.");

    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${API_BASE}/api/coding/curriculum/study`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            trackId: activeTrackId,
            moduleIndex: mod.moduleIndex,
            studyTimeSeconds: Math.max(30, studyTimeElapsed),
          }),
        });
        trackCurriculumCache.delete(activeTrackId);
        invalidateCachePattern("/api/curriculum");
        await fetchCurriculum(activeTrackId, true);
        await fetchDashboardData();
      } catch (err) {
        console.warn("Failed to record study duration:", err);
      }
    }
  };

  // ── Step 2 Complete: Practical Coding Test Passed ──
  const handleAssignmentPassed = () => {
    trackCurriculumCache.delete(activeTrackId);
    invalidateCachePattern("/api/curriculum");
    fetchCurriculum(activeTrackId, true);
    fetchDashboardData();
    toast.success("Practical Coding Test Passed! Step 3: Proctored 10-MCQ Exam is unlocked.", {
      toastId: "practical_test_result",
    });
  };

  const handleLaunchAssessment = (mod) => {
    setActiveAssignmentModule(null);
    setActiveAssessmentModule(mod);
  };

  // ── Step 3 Complete: 10-MCQ Exam Passed ──
  const handleAssessmentCompleted = () => {
    trackCurriculumCache.delete(activeTrackId);
    invalidateCachePattern("/api/curriculum");
    fetchCurriculum(activeTrackId, true);
    fetchDashboardData();
  };

  // ── Module Practice Handler: Opens Confirmation Pathway Modal ──
  const handleStartPractice = (module) => {
    setSelectedModuleChoice(module);
  };

  // ── Reset Learning Progress Handler ──
  const handleResetTrackProgress = async () => {
    setIsResetting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/curriculum/coding/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trackId: activeTrackId,
          resetAllTracks: false,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Invalidate all client-side and network caches for curriculum and coding
        trackCurriculumCache.delete(activeTrackId);
        trackCurriculumCache.clear();
        moduleDetailCache.clear();
        invalidateCachePattern("/api/curriculum");
        invalidateCachePattern("/api/coding");
        invalidateCachePattern("/api/progress");

        // Immediately update React state optimistically so UI switches "Resume Learning" -> "Start Learning" instantly
        setCurriculumData((prev) => {
          if (!prev || !Array.isArray(prev.modules)) return prev;
          return {
            ...prev,
            unlockLevel: 0,
            modules: prev.modules.map((m, idx) => ({
              ...m,
              isStudied: false,
              assignmentPassed: false,
              exercisePassed: false,
              assessmentPassed: false,
              isCompleted: false,
              isComplete: false,
              isUnlocked: idx === 0,
              score: 0,
              bestScore: 0,
              attemptsCount: 0,
              status: idx === 0 ? "available" : "locked",
            })),
          };
        });

        setTracks((prev) =>
          prev.map((t) =>
            t.id === activeTrackId
              ? {
                  ...t,
                  completedLessons: 0,
                  unlockedLevel: 0,
                  status: "Start",
                  modules: (t.modules || []).map((mod, idx) => ({
                    ...mod,
                    status: idx === 0 ? "available" : "locked",
                  })),
                }
              : t
          )
        );

        setIsResetModalOpen(false);
        toast.success(data.message || "Learning progress reset successfully!");

        // Refresh live data from server with forceRefresh = true
        await Promise.all([
          fetchCurriculum(activeTrackId, true),
          fetchDashboardData(),
        ]);

        // Broadcast reset event across tabs, windows, and components
        window.dispatchEvent(
          new CustomEvent("mz_learning_progress_reset", {
            detail: { trackId: activeTrackId, subjectKey: "coding" },
          })
        );
        try {
          localStorage.setItem("mz_learning_progress_reset", Date.now().toString());
          if (typeof BroadcastChannel !== "undefined") {
            const bc = new BroadcastChannel("mz_module_sync");
            bc.postMessage({ type: "reset", trackId: activeTrackId });
            bc.close();
          }
        } catch {}
      } else {
        toast.error(data.error || data.message || "Failed to reset progress");
      }
    } catch (err) {
      toast.error(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    performGlobalLogout();
    toast.info("Signed out successfully.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="mz-c-page-wrapper">
      {/* ── Background Subtle Ambient Orbs ── */}
      <div className="mz-c-ambient-glow mz-c-glow-1" />
      <div className="mz-c-ambient-glow mz-c-glow-2" />

      {/* ══════════════════════════════════════════════════════════
          1. TOP NAVIGATION HEADER (.mz-c-navbar)
          ══════════════════════════════════════════════════════════ */}
      <header className="mz-c-navbar mz-c-nav-anim">
        {/* Left: Mastery Zone Logo + Coding Tag */}
        <div className="mz-c-nav-left">
          <div
            className="mz-c-logo"
            onClick={() => {
              setActiveTab("learning_path");
              setSearchQuery("");
            }}
            title="Return to Mastery Zone Coding Dashboard"
          >
            <img src={logoIcon} alt="Mastery Zone" />
            <span className="mz-c-brand-title">
              Mastery<strong>Zone</strong>
            </span>
          </div>
          <span className="mz-c-badge-pill">Pro Learning Platform</span>
        </div>

        {/* Center: Prominent Big Clear Search Bar */}
        <div className="mz-c-search-wrapper" ref={searchContainerRef}>
          <div className="mz-c-search-box">
            <LuSearch className="mz-c-search-icon" size={19} />
            <input
              ref={searchInputRef}
              type="text"
              className="mz-c-search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
            />
            {searchQuery ? (
              <button
                className="mz-c-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchDropdown(false);
                }}
                title="Clear Search"
              >
                <LuX size={15} />
              </button>
            ) : (
              <span className="mz-c-search-shortcut">⌘K</span>
            )}
          </div>

          {/* Search Results Dropdown Overlay */}
          {showSearchDropdown && searchQuery.trim().length > 0 && (
            <div className="mz-c-search-dropdown" data-testid="coding-search-dropdown">
              <div className="mz-c-search-dropdown-header">
                <div className="mz-c-search-header-left">
                  <span className="mz-c-search-match-text">
                    Results for <strong>"{searchQuery}"</strong>
                  </span>
                  <span className="mz-c-search-count-pill">{totalResultsCount} found</span>
                  {searchResults.isQuestionNumMatch && (
                    <span className="mz-c-search-qnum-tag">Question #{searchResults.qNum}</span>
                  )}
                </div>
                <span className="mz-c-search-hint">Press ESC to dismiss</span>
              </div>

              {totalResultsCount === 0 ? (
                <div className="mz-c-search-empty-state">
                  <LuCode size={32} style={{ color: "#94a3b8", marginBottom: "8px" }} />
                  <p>No matching resources found for "{searchQuery}"</p>
                  <small>Try searching question numbers like "1", "#22" or topics like "Two Sum", "Python", "Graph"</small>
                </div>
              ) : (
                <>
                  {/* Matched Challenges Group */}
                  {searchResults.matchedChallenges.length > 0 && (
                    <div className="mz-c-search-group">
                      <div className="mz-c-search-group-title">
                        <LuCode className="mz-c-group-icon" size={13} />
                        Algorithmic Coding Challenges ({searchResults.matchedChallenges.length})
                      </div>
                      {searchResults.matchedChallenges.map((ch) => (
                        <div
                          key={ch.id}
                          className="mz-c-search-result-item mz-c-search-challenge-item"
                          onClick={() => handleOpenChallenge(ch)}
                        >
                          <div className="mz-c-result-icon-box mz-c-result-box-code">
                            <TechBrandIcon type={ch.starterLanguage || "python"} size={16} />
                          </div>
                          <div className="mz-c-result-content">
                            <div className="mz-c-result-title-row">
                              <span className="mz-c-result-qnum-tag">#{ch.questionNumber}</span>
                              <span className="mz-c-result-title">{ch.title}</span>
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  fontWeight: 700,
                                  padding: "2px 7px",
                                  borderRadius: "10px",
                                  background:
                                    ch.difficulty?.toLowerCase() === "easy"
                                      ? "rgba(16,185,129,0.12)"
                                      : ch.difficulty?.toLowerCase() === "hard"
                                      ? "rgba(239,68,68,0.12)"
                                      : "rgba(245,158,11,0.12)",
                                  color:
                                    ch.difficulty?.toLowerCase() === "easy"
                                      ? "#10b981"
                                      : ch.difficulty?.toLowerCase() === "hard"
                                      ? "#ef4444"
                                      : "#f59e0b",
                                }}
                              >
                                {ch.difficulty || "Medium"}
                              </span>
                            </div>
                            <span className="mz-c-result-sub">{ch.category || "Algorithmic Problem"}</span>
                          </div>
                          <button
                            className="mz-c-btn-solve"
                            style={{ padding: "5px 12px", fontSize: "11px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChallenge(ch);
                            }}
                          >
                            Solve Challenge
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matched Tracks Group */}
                  {searchResults.matchedTracks.length > 0 && (
                    <div className="mz-c-search-group">
                      <div className="mz-c-search-group-title">
                        <LuBookOpen className="mz-c-group-icon" size={13} />
                        Learning Paths & Tracks ({searchResults.matchedTracks.length})
                      </div>
                      {searchResults.matchedTracks.map((tr) => (
                        <div
                          key={tr.id}
                          className="mz-c-search-result-item"
                          onClick={() => {
                            handleSelectTrack(tr.id);
                            setActiveTab("learning_path");
                            setShowSearchDropdown(false);
                          }}
                        >
                          <div className="mz-c-result-icon-box mz-c-result-box-track">
                            <TechBrandIcon type={tr.id} size={16} />
                          </div>
                          <div className="mz-c-result-content">
                            <span className="mz-c-result-title">{tr.title}</span>
                            <span className="mz-c-result-sub">{tr.subtitle}</span>
                          </div>
                          <LuArrowRight size={14} style={{ color: "#94a3b8" }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matched Projects Group */}
                  {searchResults.matchedProjects.length > 0 && (
                    <div className="mz-c-search-group">
                      <div className="mz-c-search-group-title">
                        <LuFolderGit2 className="mz-c-group-icon" size={13} />
                        Practical Engineering Projects ({searchResults.matchedProjects.length})
                      </div>
                      {searchResults.matchedProjects.map((pr) => (
                        <div
                          key={pr.id}
                          className="mz-c-search-result-item"
                          onClick={() => handleOpenProject(pr)}
                        >
                          <div className="mz-c-result-icon-box mz-c-result-box-project">
                            <LuLayers size={16} />
                          </div>
                          <div className="mz-c-result-content">
                            <span className="mz-c-result-title">{pr.title}</span>
                            <span className="mz-c-result-sub">{pr.domain}</span>
                          </div>
                          <LuArrowRight size={14} style={{ color: "#94a3b8" }} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: + Live Meet, Notification Bell, User Avatar */}
        <div className="mz-c-nav-right">
          <button
            className="mz-c-live-room-btn"
            onClick={handleStartInstantMeeting}
            title="Launch Instant Collaborative Live Room"
          >
            <span className="mz-c-live-dot" />
            + Live Meet
          </button>

          <ThemeToggle />

          <NotificationBell />

          {/* User Profile Pill */}
          <div className="mz-c-user-pill-wrap" ref={userPillRef}>
            <div
              className="mz-c-user-pill"
              onClick={() => setShowUserDropdown((prev) => !prev)}
            >
              <div className="mz-c-user-avatar">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="User" />
                ) : (
                  (currentUser?.name || "U").charAt(0).toUpperCase()
                )}
              </div>
              <span className="mz-c-user-name">{currentUser?.name || "Learner"}</span>
              <LuChevronDown className={`mz-c-user-chevron ${showUserDropdown ? "open" : ""}`} size={14} />
            </div>

            <UserProfileDropdown
              isOpen={showUserDropdown}
              onClose={() => setShowUserDropdown(false)}
              user={currentUser}
              certCount={earnedCertificates.length}
              onCertificatesClick={() => {
                setActiveTab("certification");
                setShowUserDropdown(false);
              }}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          2. MAIN CONTENT CONTAINER
          ══════════════════════════════════════════════════════════ */}
      <main className="mz-c-main-container">
        {/* Top Auto-Sliding Hero Carousel */}
        <section className="mz-c-hero-anim" style={{ marginBottom: "24px" }}>
          <FeaturedLearningCarousel
            activeTrack={activeTrack.title}
            activeTab={activeTab}
            challenges={challenges}
            projects={projects}
            earnedCertificates={earnedCertificates}
            solvedCount={stats?.solvedCount || 0}
            passedProjectsCount={projects.filter((p) => p.userState?.passed).length}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onStartLearning={() => {
              setActiveTab("learning_path");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </section>

        {/* Horizontal Navigation Tabs Bar */}
        <nav className="mz-c-horizontal-tabs mz-c-tabs-anim">
          <button
            className={`mz-c-tab-btn ${activeTab === "learning_path" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("learning_path");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <LuBookOpen size={16} /> Learning Path
          </button>
          <button
            className={`mz-c-tab-btn ${activeTab === "videos" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("videos");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <LuTv size={16} /> Video Library
          </button>
          <button
            className={`mz-c-tab-btn ${activeTab === "challenges" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("challenges");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <LuCode size={16} /> Challenges ({challenges.length || 235})
          </button>
          <button
            className={`mz-c-tab-btn ${activeTab === "projects" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("projects");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <LuFolderGit2 size={16} /> Projects
          </button>
          <button
            className={`mz-c-tab-btn ${activeTab === "study_groups" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("study_groups");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <LuUsers size={16} /> Study Groups
          </button>
          <button
            className={`mz-c-tab-btn ${activeTab === "resources" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("resources");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <LuFileText size={16} /> Resources
          </button>
          <button
            className={`mz-c-tab-btn ${activeTab === "certification" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("certification");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <LuAward size={16} /> Certification
          </button>
        </nav>

        {/* ══════════════════════════════════════════════════════════
            3. DYNAMIC TAB VIEWS
            ══════════════════════════════════════════════════════════ */}

        {/* ── TAB 1: LEARNING PATH ── */}
        {activeTab === "learning_path" && (
          <div className="mz-c-learning-path-wrapper">
            {/* 1. Featured Video Courses Slider - ALWAYS VISIBLE ON STARTING DASHBOARD */}
            <div className="mz-c-featured-videos-dashboard-section" style={{ marginBottom: "24px" }}>
              <FeaturedVideosSlider
                onViewAll={() => {
                  setActiveTab("videos");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onPracticeInLearningPath={handlePracticeInLearningPath}
              />
            </div>

            {/* 2. Track Selector Chips Bar */}
            <div className="mz-c-track-selector-bar" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "20px" }}>
              {tracks.map((tr) => (
                <button
                  key={tr.id}
                  type="button"
                  className={`mz-c-chip ${activeTrackId === tr.id ? "mz-c-chip-active" : ""}`}
                  onClick={() => handleSelectTrack(tr.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: activeTrackId === tr.id ? "1.5px solid #2563eb" : "1px solid var(--mz-border)",
                    background: activeTrackId === tr.id ? "var(--mz-blue-soft)" : "var(--mz-surface)",
                    color: activeTrackId === tr.id ? "var(--mz-blue-text)" : "var(--mz-text-secondary)",
                    fontWeight: activeTrackId === tr.id ? 700 : 500,
                    boxShadow: activeTrackId === tr.id ? "0 2px 6px rgba(37, 99, 235, 0.15)" : "none",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease"
                  }}
                >
                  <TechBrandIcon type={tr.id} size={16} />
                  <span>{tr.title}</span>
                </button>
              ))}
            </div>

            {/* 3. Two-Column Grid: Left (Track Hero & Modules Roadmap) + Right (Preview Cards & MZ-ASM Playground) */}
            <div className="mz-c-content-grid mz-c-grid-anim">
              {/* Left Column: Track Roadmap Timeline */}
              <div className="mz-c-path-column">
                {/* Redesigned Active Track Cover Hero Banner */}
                <div className="mz-c-track-hero-card">
                  <div className="mz-c-track-hero-top">
                    <div className="mz-c-track-hero-badges">
                      <span className="mz-c-track-active-tag">
                        <span className="mz-c-track-dot" /> ACTIVE TRACK
                      </span>
                      <span className="mz-c-track-completed-tag">
                        {completedCount} of {totalCount} modules completed
                      </span>
                    </div>
                    <button
                      type="button"
                      className="mz-c-track-hero-reset-btn"
                      onClick={() => setIsResetModalOpen(true)}
                      title="Reset Learning Process (modules, tests, and assignments)"
                    >
                      <LuRotateCcw size={13} />
                      <span>Reset Progress</span>
                    </button>
                  </div>

                  <div className="mz-c-track-hero-body">
                    <div className="mz-c-track-hero-icon-box">
                      <TechBrandIcon type={activeTrack.id} size={36} />
                    </div>
                    <div className="mz-c-track-hero-info">
                      <h2 className="mz-c-track-hero-title">{activeTrack.title}</h2>
                      <p className="mz-c-track-hero-desc">{activeTrack.subtitle}</p>
                    </div>
                  </div>

                  <div className="mz-c-track-hero-footer">
                    <div className="mz-c-track-hero-progress-wrap">
                      <div className="mz-c-track-hero-progress-info">
                        <span>Curriculum Completion</span>
                        <span>{completionPercentage}%</span>
                      </div>
                      <div className="mz-c-track-hero-progress-track">
                        <div
                          className="mz-c-track-hero-progress-fill"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mz-c-track-hero-cta"
                      onClick={() => {
                        const nextMod = displayModules.find((m) => !isModuleStrictlyComplete(m)) || displayModules[0];
                        if (nextMod) handleStartPractice(nextMod);
                      }}
                    >
                      {hasStartedLearning ? "Resume Learning" : "Start Learning"} <LuArrowRight size={15} />
                    </button>
                  </div>
                </div>

                {/* Modules Roadmap List with 3-Step Interactive Progression */}
                <div className="mz-c-timeline" style={{ marginTop: "20px" }}>
                  {loadingCurriculum && (!displayModules || displayModules.length === 0) ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                      <p>Loading curriculum modules...</p>
                    </div>
                  ) : (
                    displayModules.map((mod, idx) => {
                      const stepNum = typeof mod.moduleIndex === "number" ? mod.moduleIndex + 1 : idx + 1;
                      const isStudyDone = Boolean(mod.isStudied);
                      const isCodingDone = Boolean(mod.assignmentPassed || mod.exercisePassed);
                      const isAssessmentDone = Boolean(mod.assessmentPassed);
                      const isCutoffCleared = Boolean(
                        (mod.assessmentPassed && (mod.bestScore == null || mod.bestScore >= 80)) ||
                        (mod.bestScore != null && mod.bestScore >= 80)
                      );

                      // Module should ONLY be marked as completed if all 3 are completed:
                      // 1. Learning module studied
                      // 2. Practical coding test passed
                      // 3. 10 MCQs attempted and cutoff (>= 80%) met
                      const isComplete = Boolean(isStudyDone && isCodingDone && isAssessmentDone && isCutoffCleared);

                      return (
                        <div key={mod.id || idx} className="mz-c-timeline-step">
                          <div
                            className={`mz-c-timeline-node ${
                              isComplete ? "completed" : isStudyDone || isCodingDone || isAssessmentDone ? "in-progress" : ""
                            }`}
                          >
                            {isComplete ? (
                              <LuCheck size={16} />
                            ) : (
                              <span>{stepNum}</span>
                            )}
                          </div>

                          <div className="mz-c-step-card">
                            <div className="mz-c-step-brand-box">
                              <TechBrandIcon type={activeTrack.id} size={24} />
                            </div>

                            <div className="mz-c-step-content" style={{ flex: 1, minWidth: 0 }}>
                              <div className="mz-c-mod-header-row">
                                <div className="mz-c-mod-title-group">
                                  <span className="mz-c-mod-index-pill">
                                    Module {String(stepNum).padStart(2, "0")}
                                  </span>
                                  <h3 className="mz-c-module-heading">
                                    {mod.title}
                                  </h3>
                                </div>
                                <span
                                  className={`mz-c-mod-status-pill ${
                                    isComplete
                                      ? "passed"
                                      : isStudyDone || isCodingDone || isAssessmentDone
                                      ? "in-progress"
                                      : "available"
                                  }`}
                                >
                                  {isComplete
                                    ? "Completed"
                                    : isStudyDone || isCodingDone || isAssessmentDone
                                    ? "In Progress"
                                    : "Available"}
                                </span>
                              </div>

                              <p className="mz-c-module-desc">
                                {mod.subtitle || mod.desc}
                              </p>

                              {/* Rich Content Telemetry Badges */}
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "6px 0 10px 0" }}>
                                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--mz-blue-text)", background: "var(--mz-blue-soft)", border: "1px solid var(--mz-blue-border)", padding: "2px 8px", borderRadius: "6px" }}>
                                  📖 {mod.sections?.length || 5} Deep Dive Topics
                                </span>
                                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--mz-purple-text)", background: "var(--mz-purple-soft)", border: "1px solid var(--mz-purple-border)", padding: "2px 8px", borderRadius: "6px" }}>
                                  📚 {mod.references?.length || 3} Official References
                                </span>
                                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--mz-emerald-text)", background: "var(--mz-emerald-soft)", border: "1px solid var(--mz-emerald-border)", padding: "2px 8px", borderRadius: "6px" }}>
                                  ⚡ Interactive Sandbox
                                </span>
                                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--mz-amber-text)", background: "var(--mz-amber-soft)", border: "1px solid var(--mz-amber-border)", padding: "2px 8px", borderRadius: "6px" }}>
                                  🧠 Knowledge Check Quiz
                                </span>
                              </div>

                              {/* 3-Step Badges Row */}
                              <div className="mz-c-step-badges-row">
                                <button
                                  type="button"
                                  className={`mz-c-step-badge ${isStudyDone ? "done" : "active-step"}`}
                                  onClick={() => {
                                    const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : idx;
                                    window.open(`/concept-learning/${activeTrackId}/${mIdx}`, "_blank");
                                  }}
                                  title="Step 1: In-depth Theory & Concept Study"
                                >
                                  <LuBookOpen size={13} />
                                  <span>{isStudyDone ? "✓ Step 1: Lesson Studied" : "Step 1: Module Learning"}</span>
                                </button>

                                <button
                                  type="button"
                                  className={`mz-c-step-badge ${isCodingDone ? "done" : isStudyDone ? "active-step" : ""}`}
                                  onClick={() => {
                                    const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : idx;
                                    if (!isStudyDone) {
                                      toast.warn("Please study the concept lesson first (Step 1).");
                                      window.open(`/concept-learning/${activeTrackId}/${mIdx}`, "_blank");
                                      return;
                                    }
                                    window.open(`/coding-test/${activeTrackId}/${mIdx}`, "_blank");
                                  }}
                                  title="Step 2: Practical Coding Test with Monaco IDE"
                                >
                                  <LuCode size={13} />
                                  <span>{isCodingDone ? `✓ Step 2: Coding Test Passed (${mod.exerciseScore || mod.assignmentScore || mod.bestScore || 100}%)` : "Step 2: Coding Test"}</span>
                                </button>

                                <button
                                  type="button"
                                  className={`mz-c-step-badge ${isAssessmentDone && isCutoffCleared ? "done" : isCodingDone ? "active-step" : ""}`}
                                  onClick={() => {
                                    const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : idx;
                                    if (!isStudyDone) {
                                      toast.warn("Please study the concept lesson first (Step 1).");
                                      window.open(`/concept-learning/${activeTrackId}/${mIdx}`, "_blank");
                                      return;
                                    }
                                    if (!isCodingDone) {
                                      toast.warn("Please pass the practical coding test first (Step 2).");
                                      window.open(`/coding-test/${activeTrackId}/${mIdx}`, "_blank");
                                      return;
                                    }
                                    window.open(`/proctored-assessment/${activeTrackId}/${mIdx}`, "_blank");
                                  }}
                                  title="Step 3: Proctored 10-MCQ Exam with Security Gate"
                                >
                                  <LuShieldCheck size={13} />
                                  <span>
                                    {isAssessmentDone && isCutoffCleared
                                      ? `✓ Step 3: Exam Passed (${mod.bestScore || 100}%)`
                                      : isAssessmentDone
                                      ? `Step 3: Retake (Score ${mod.bestScore || 0}% < 80%)`
                                      : "Step 3: 10-MCQ Exam (≥80%)"}
                                  </span>
                                </button>
                              </div>

                              <div className="mz-c-step-footer-row">
                                <span className="mz-c-step-time-est">
                                  <LuClock size={13} /> {mod.estimatedTime || "45m"} practical coding & tests
                                </span>
                                <button
                                  type="button"
                                  className="mz-c-btn-solve"
                                  style={{ padding: "7px 16px", fontSize: "12.5px" }}
                                  onClick={() => handleStartPractice(mod)}
                                >
                                  {isComplete ? "Review Module" : isStudyDone ? "Resume Learning" : "Start Practice"}{" "}
                                  <LuArrowRight size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            {/* Right Column: Real-Time Coding Hub & Interactive MZ-ASM Playground */}
            <div className="mz-c-right-column">
              {/* ── CARD 1: Real-Time Coding Hub & Live Telemetry Tracker ── */}
              <div className="mz-c-card mz-c-live-tracker-card">
                <div className="mz-c-card-header" style={{ marginBottom: "14px" }}>
                  <div className="mz-c-header-left">
                    <div className="mz-c-circle-icon mz-c-icon-emerald" style={{ position: "relative" }}>
                      <LuActivity size={18} />
                      <span className="mz-c-live-pulsing-badge" />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h3 className="mz-c-card-heading">Real-Time Coding Hub</h3>
                        <span className="mz-c-live-status-pill">
                          <span className="mz-c-live-dot" /> LIVE
                        </span>
                      </div>
                      <p className="mz-c-card-sub" style={{ margin: "2px 0 0 0", fontSize: "12px" }}>
                        Live session tracking, sandboxed runtimes & telemetry
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mz-c-link-btn"
                    onClick={() =>
                      handleOpenPlayground(activeTrack.id || "python")
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#2563eb",
                      background: "rgba(37, 99, 235, 0.08)",
                      border: "1px solid rgba(37, 99, 235, 0.2)",
                      cursor: "pointer",
                      padding: "5px 10px",
                      borderRadius: "8px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <LuLaptop size={13} /> Open IDE <LuArrowRight size={13} />
                  </button>
                </div>

                {/* Live Session Timer & Progress Row */}
                <div className="mz-c-live-timer-banner">
                  <div className="mz-c-live-timer-left">
                    <span className="mz-c-live-timer-label">SESSION DURATION (TODAY)</span>
                    <div className="mz-c-live-timer-clock">
                      <LuClock size={16} className="mz-c-clock-ticker" />
                      <span className="mz-c-clock-digits">{formatLiveDuration(liveCodingSeconds)}</span>
                    </div>
                  </div>
                  <div className="mz-c-live-timer-actions">
                    <button
                      type="button"
                      className={`mz-c-live-toggle-btn ${isLiveTracking ? "tracking" : "paused"}`}
                      onClick={() => setIsLiveTracking(!isLiveTracking)}
                      title={isLiveTracking ? "Pause Tracking" : "Resume Tracking"}
                    >
                      {isLiveTracking ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      className="mz-c-live-reset-btn"
                      onClick={() => setLiveCodingSeconds(0)}
                      title="Reset today's session timer"
                    >
                      <LuRotateCcw size={12} />
                    </button>
                  </div>
                </div>

                {/* Real-Time Metrics 3-Col Bar */}
                <div className="mz-c-live-metrics-grid">
                  <div className="mz-c-live-metric-box">
                    <span className="mz-c-live-metric-title">ACTIVE RUNTIME</span>
                    <div className="mz-c-live-metric-val">
                      <TechBrandIcon type={activeTrack.id || "python"} size={14} />
                      <span>{activeTrack.id === "javascript" ? "Node 20" : activeTrack.id === "java" ? "Java 26" : activeTrack.id === "cpp" ? "Clang 18" : "Python 3.11"}</span>
                    </div>
                    <span className="mz-c-live-metric-tag ready">● Ready (12ms)</span>
                  </div>

                  <div className="mz-c-live-metric-box">
                    <span className="mz-c-live-metric-title">XP EARNED TODAY</span>
                    <div className="mz-c-live-metric-val" style={{ color: "#d97706" }}>
                      <LuFlame size={14} color="#f59e0b" />
                      <span>+{stats?.todayXp ?? 0} XP</span>
                    </div>
                    <span className="mz-c-live-metric-tag xp">
                      {(stats?.todayXp || 0) > 0 ? "⚡ Active Momentum" : "Target: 50 XP"}
                    </span>
                  </div>

                  <div className="mz-c-live-metric-box">
                    <span className="mz-c-live-metric-title">TEST SUITE PASS</span>
                    <div className="mz-c-live-metric-val" style={{ color: "#059669" }}>
                      <LuCircleCheck size={14} color="#10b981" />
                      <span>{stats?.accuracyRate ?? (stats?.solvedCount > 0 ? 100 : 0)}% Passed</span>
                    </div>
                    <span className="mz-c-live-metric-tag pass">
                      {stats?.solvedCount || 0} Solved
                    </span>
                  </div>
                </div>

                {/* Daily Goal Visual Progress */}
                <div className="mz-c-live-goal-strip">
                  <div className="mz-c-live-goal-header">
                    <span className="mz-c-live-goal-title">Daily Practice Target</span>
                    <span className="mz-c-live-goal-pct">
                      {Math.min(100, Math.round((liveCodingSeconds / 2700) * 100))}% ({Math.floor(liveCodingSeconds / 60)} / 45 mins)
                    </span>
                  </div>
                  <div className="mz-c-live-goal-bar-bg">
                    <div
                      className="mz-c-live-goal-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(8, Math.round((liveCodingSeconds / 2700) * 100)))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ── CARD 2: Interactive MZ-ASM Playground (Below Real-Time Coding Hub) ── */}
              <div className="mz-c-card mz-c-playground-card" style={{ marginTop: "16px" }}>
                <div className="mz-c-card-header" style={{ marginBottom: "14px", alignItems: "flex-start" }}>
                  <div className="mz-c-header-left" style={{ alignItems: "flex-start" }}>
                    <div className="mz-c-circle-icon mz-c-icon-blue" style={{ marginTop: "2px" }}>
                      <LuCode size={18} />
                    </div>
                    <div>
                      <h3 className="mz-c-card-heading">Interactive Code Playground</h3>
                      <p className="mz-c-card-sub" style={{ margin: "2px 0 0 0", fontSize: "12.5px" }}>
                        Cloud compiler runtime supporting Python, JavaScript, Java, and C++.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mz-c-link-btn"
                    onClick={() =>
                      handleOpenPlayground("python")
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2563eb",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Open Editor <LuArrowRight size={14} />
                  </button>
                </div>

                <div className="mz-c-playground-grid">
                  {/* Python 3 */}
                  <div className="mz-c-playground-item">
                    <div className="mz-c-playground-item-top">
                      <TechBrandIcon type="python" size={26} />
                      <div className="mz-c-playground-item-info">
                        <span className="mz-c-playground-item-title">Python 3</span>
                        <span className="mz-c-playground-item-sub">Sandboxed Runner</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mz-c-playground-btn"
                      onClick={() =>
                        handleOpenPlayground("python")
                      }
                    >
                      Start Coding <LuArrowRight size={13} />
                    </button>
                  </div>

                  {/* JavaScript */}
                  <div className="mz-c-playground-item">
                    <div className="mz-c-playground-item-top">
                      <TechBrandIcon type="javascript" size={26} />
                      <div className="mz-c-playground-item-info">
                        <span className="mz-c-playground-item-title">JavaScript</span>
                        <span className="mz-c-playground-item-sub">Node.js Runtime</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mz-c-playground-btn"
                      onClick={() =>
                        handleOpenPlayground("javascript")
                      }
                    >
                      Start Coding <LuArrowRight size={13} />
                    </button>
                  </div>

                  {/* Java 26 */}
                  <div className="mz-c-playground-item">
                    <div className="mz-c-playground-item-top">
                      <TechBrandIcon type="java" size={26} />
                      <div className="mz-c-playground-item-info">
                        <span className="mz-c-playground-item-title">Java 26</span>
                        <span className="mz-c-playground-item-sub">OpenJDK Compiler</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mz-c-playground-btn"
                      onClick={() =>
                        handleOpenPlayground("java")
                      }
                    >
                      Start Coding <LuArrowRight size={13} />
                    </button>
                  </div>

                  {/* Modern C++ */}
                  <div className="mz-c-playground-item">
                    <div className="mz-c-playground-item-top">
                      <TechBrandIcon type="cpp" size={26} />
                      <div className="mz-c-playground-item-info">
                        <span className="mz-c-playground-item-title">Modern C++</span>
                        <span className="mz-c-playground-item-sub">Clang / G++</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mz-c-playground-btn"
                      onClick={() =>
                        handleOpenPlayground("cpp")
                      }
                    >
                      Start Coding <LuArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* ── TAB 2: CHALLENGES TAB (Curated Algorithmic Problems with Question Numbers) ── */}
        {activeTab === "challenges" && (
          <div className="mz-c-challenges-tab-view mz-c-grid-anim">
            {/* Top 235 Challenges Showcase Cover Card */}
            <div className="mz-c-challenges-showcase-cover">
              <div style={{ position: "relative", zIndex: 1, maxWidth: "660px" }}>
                <div className="mz-c-challenges-cover-badge">
                  <LuCode size={13} color="#2563eb" />
                  <span>Official LeetCode & FAANG Problem Catalog</span>
                </div>
                <h2 className="mz-c-challenges-cover-title">
                  {challenges.length || 235} Curated Algorithmic Coding Challenges
                </h2>
                <p className="mz-c-challenges-cover-desc">
                  Practice essential data structures and algorithms across Python, Modern C++, Java, and JavaScript. Every problem features automated multi-test execution, edge-case evaluation, and sub-millisecond benchmarking.
                </p>
              </div>

              {/* Mini Quick Metric Counters */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                <div className="mz-c-challenges-metric-box">
                  <div style={{ fontSize: "10.5px", color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>Total</div>
                  <div style={{ fontSize: "19px", fontWeight: 900, color: "#0f172a", marginTop: "2px" }}>{challenges.length || 235}</div>
                </div>
                <div className="mz-c-challenges-metric-box">
                  <div style={{ fontSize: "10.5px", color: "#16a34a", textTransform: "uppercase", fontWeight: 800 }}>Easy</div>
                  <div style={{ fontSize: "19px", fontWeight: 900, color: "#16a34a", marginTop: "2px" }}>
                    {challenges.filter((c) => c.difficulty?.toLowerCase() === "easy").length || 90}
                  </div>
                </div>
                <div className="mz-c-challenges-metric-box">
                  <div style={{ fontSize: "10.5px", color: "#d97706", textTransform: "uppercase", fontWeight: 800 }}>Medium</div>
                  <div style={{ fontSize: "19px", fontWeight: 900, color: "#d97706", marginTop: "2px" }}>
                    {challenges.filter((c) => c.difficulty?.toLowerCase() === "medium").length || 133}
                  </div>
                </div>
                <div className="mz-c-challenges-metric-box">
                  <div style={{ fontSize: "10.5px", color: "#dc2626", textTransform: "uppercase", fontWeight: 800 }}>Hard</div>
                  <div style={{ fontSize: "19px", fontWeight: 900, color: "#dc2626", marginTop: "2px" }}>
                    {challenges.filter((c) => c.difficulty?.toLowerCase() === "hard").length || 12}
                  </div>
                </div>
                <div className="mz-c-challenges-metric-box">
                  <div style={{ fontSize: "10.5px", color: "#10b981", textTransform: "uppercase", fontWeight: 800 }}>Completed</div>
                  <div style={{ fontSize: "19px", fontWeight: 900, color: "#10b981", marginTop: "2px" }}>
                    {challenges.filter((c) => {
                      const isLocallySolved =
                        (currentUserId && currentUserId !== "guest" && typeof window !== "undefined" && window.localStorage?.getItem(`mz_${currentUserId}_ch_solved_${c.id}`) === "true") ||
                        (typeof window !== "undefined" && window.localStorage?.getItem(`mz_ch_solved_${c.id}`) === "true");
                      return c.isCompleted || c.solved || isLocallySolved;
                    }).length}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "24px",
                padding: "16px 20px",
                background: "var(--mz-surface)",
                borderRadius: "16px",
                border: "1px solid var(--mz-border)",
                boxShadow: "var(--mz-shadow-sm)",
              }}
            >
              {/* Difficulty Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--mz-text-muted)", textTransform: "uppercase" }}>
                  Difficulty:
                </span>
                {["all", "easy", "medium", "hard"].map((diff) => (
                  <button
                    key={diff}
                    className={`mz-c-chip ${challengeDifficulty === diff ? "mz-c-chip-active" : ""}`}
                    onClick={() => setChallengeDifficulty(diff)}
                    style={{
                      cursor: "pointer",
                      textTransform: "capitalize",
                      fontWeight: 700,
                      border: challengeDifficulty === diff ? "1.5px solid #2563eb" : "1px solid var(--mz-border)",
                    }}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", maxWidth: "60%" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--mz-text-muted)", textTransform: "uppercase" }}>
                  Topic:
                </span>
                {challengeCategoriesList.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    className={`mz-c-chip ${challengeCategory === cat ? "mz-c-chip-active" : ""}`}
                    onClick={() => setChallengeCategory(cat)}
                    style={{
                      cursor: "pointer",
                      textTransform: "capitalize",
                      border: challengeCategory === cat ? "1.5px solid #2563eb" : "1px solid var(--mz-border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Challenges Grid */}
            <div className="mz-c-challenges-grid" ref={challengesGridRef}>
              {filteredChallenges.length === 0 ? (
                <div className="mz-c-challenges-empty-state" style={{ gridColumn: "1 / -1" }}>
                  <LuCode size={40} style={{ color: "#94a3b8", marginBottom: "12px" }} />
                  <h3>No challenges match your filter criteria</h3>
                  <p>Try resetting the search bar or choosing "All" difficulty</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setChallengeDifficulty("all");
                      setChallengeCategory("all");
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                paginatedChallenges.map((ch, idx) => {
                  const isLocallySolved =
                    (currentUserId && currentUserId !== "guest" && typeof window !== "undefined" && window.localStorage?.getItem(`mz_${currentUserId}_ch_solved_${ch.id}`) === "true") ||
                    (typeof window !== "undefined" && window.localStorage?.getItem(`mz_ch_solved_${ch.id}`) === "true");

                  const isDone = Boolean(
                    ch.isCompleted ||
                    ch.solved ||
                    isLocallySolved
                  );
                  return (
                    <div
                      key={ch.id || idx}
                      className={`mz-c-challenge-card ${isDone ? "is-completed" : ""}`}
                      onClick={() => handleOpenChallenge(ch)}
                    >
                      {/* Top Accent Line - clipped cleanly by overflow: hidden */}
                      <div
                        className="mz-c-card-top-accent"
                        style={{
                          background: isDone
                            ? "linear-gradient(90deg, #10b981, #059669)"
                            : ch.difficulty?.toLowerCase() === "easy"
                            ? "linear-gradient(90deg, #10b981, #3b82f6)"
                            : ch.difficulty?.toLowerCase() === "hard"
                            ? "linear-gradient(90deg, #ef4444, #8b5cf6)"
                            : "linear-gradient(90deg, #2563eb, #6366f1)",
                        }}
                      />

                      {/* Interactive Problem Cover Stage */}
                      <div
                        className="mz-c-ch-cover-stage"
                        style={{
                          padding: "18px 20px 14px",
                          background: isDone
                            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)"
                            : ch.difficulty?.toLowerCase() === "easy"
                            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.07) 0%, rgba(37, 99, 235, 0.03) 100%)"
                            : ch.difficulty?.toLowerCase() === "hard"
                            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.07) 0%, rgba(139, 92, 246, 0.03) 100%)"
                            : "linear-gradient(135deg, rgba(37, 99, 235, 0.07) 0%, rgba(99, 102, 241, 0.03) 100%)",
                          borderBottom: "1px solid var(--mz-border-subtle)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                fontSize: "12px",
                                fontWeight: 800,
                                padding: "3px 9px",
                                borderRadius: "7px",
                                background: "#0f172a",
                                color: "#ffffff",
                                boxShadow: "0 2px 5px rgba(15, 23, 42, 0.15)",
                              }}
                            >
                              #{ch.questionNumber || (startChallengeIndex + idx + 1)}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 9px",
                                borderRadius: "12px",
                                background:
                                  ch.difficulty?.toLowerCase() === "easy"
                                    ? "rgba(16,185,129,0.12)"
                                    : ch.difficulty?.toLowerCase() === "hard"
                                    ? "rgba(239,68,68,0.12)"
                                    : "rgba(245,158,11,0.12)",
                                color:
                                  ch.difficulty?.toLowerCase() === "easy"
                                    ? "#10b981"
                                    : ch.difficulty?.toLowerCase() === "hard"
                                    ? "#ef4444"
                                    : "#d97706",
                                border:
                                  ch.difficulty?.toLowerCase() === "easy"
                                    ? "1px solid rgba(16,185,129,0.25)"
                                    : ch.difficulty?.toLowerCase() === "hard"
                                    ? "1px solid rgba(239,68,68,0.25)"
                                    : "1px solid rgba(245,158,11,0.25)",
                                textTransform: "capitalize",
                              }}
                            >
                              {ch.difficulty || "Medium"}
                            </span>
                          </div>

                          {isDone ? (
                            <span
                              className="mz-c-proj-completed-badge"
                              style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                color: "var(--mz-green-text)",
                                background: "var(--mz-green-soft)",
                                border: "1px solid var(--mz-green-border)",
                                padding: "3px 9px",
                                borderRadius: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <LuCircleCheck size={13} /> Completed
                            </span>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <TechBrandIcon type={ch.starterLanguage || "python"} size={16} />
                              <span style={{ fontSize: "11px", color: "var(--mz-text-muted)", fontWeight: 700 }}>
                                {ch.category || "DSA Core"}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title on the Cover */}
                        <h3
                          style={{
                            margin: "2px 0 0",
                            fontSize: "16px",
                            fontWeight: 800,
                            color: "var(--mz-text-primary)",
                            lineHeight: 1.35,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {ch.title}
                        </h3>
                      </div>

                      {/* Problem Body Info */}
                      <div style={{ padding: "16px 20px 18px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                        <p
                          style={{
                            margin: "0 0 16px",
                            fontSize: "13px",
                            color: "var(--mz-text-muted)",
                            lineHeight: 1.5,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {ch.description ? ch.description.slice(0, 110) + "..." : "Master algorithmic optimization and verify edge cases across automated test suites."}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--mz-border-subtle)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "11.5px", color: "var(--mz-text-muted)", display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                              <LuShieldCheck size={13} color="#2563eb" /> 10 Test Cases
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--mz-amber-text)", background: "var(--mz-amber-soft)", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>
                              +40 XP
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {isDone && typeof window !== "undefined" && localStorage.getItem(`mz_report_sid_${ch.id}`) && (
                              <button
                                type="button"
                                className="mz-c-btn-solve"
                                style={{
                                  padding: "6px 11px",
                                  fontSize: "11.5px",
                                  background: "var(--mz-blue-soft)",
                                  color: "var(--mz-blue-text)",
                                  border: "1px solid var(--mz-blue-border)",
                                  borderRadius: "8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontWeight: 700,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const sid = localStorage.getItem(`mz_report_sid_${ch.id}`);
                                  window.open(`/assessment-report/${sid}`, "_blank", "noopener,noreferrer");
                                }}
                              >
                                <LuAward size={12} /> Report
                              </button>
                            )}
                            <button
                              type="button"
                              className={`mz-c-btn-solve ${isDone ? "mz-c-btn-completed" : ""}`}
                              style={{
                                padding: "7px 15px",
                                fontSize: "12px",
                                borderRadius: "8px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: 700,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChallenge(ch);
                              }}
                            >
                              <span>{isDone ? "Review Solution" : "Solve Challenge"}</span>
                              <LuArrowRight className="mz-c-solve-arrow" size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {filteredChallenges.length > 0 && (
              <div className="mz-c-challenges-pagination-container">
                <div className="mz-c-challenges-pagination-info">
                  <span>
                    Showing <strong className="mz-c-page-count-highlight">{startChallengeIndex + 1}–{endChallengeIndex}</strong> of{" "}
                    <strong className="mz-c-page-count-highlight">{totalChallengesCount}</strong> challenges
                  </span>
                  <span className="mz-c-page-total-badge">
                    Page {challengePage} of {totalChallengePages} ({totalChallengePages} {totalChallengePages === 1 ? "page" : "pages"} total)
                  </span>
                </div>

                <div className="mz-c-pagination-controls">
                  {/* Previous Button */}
                  <button
                    type="button"
                    className="mz-c-pagination-btn mz-c-pagination-prev"
                    onClick={() => handleChallengePageChange(challengePage - 1)}
                    disabled={challengePage <= 1}
                    aria-label="Previous Page"
                  >
                    <LuChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="mz-c-pagination-numbers">
                    {getPageNumbers(challengePage, totalChallengePages).map((pageNum, pIdx) => {
                      if (pageNum === "...") {
                        return (
                          <span key={`ellipsis-${pIdx}`} className="mz-c-pagination-ellipsis" aria-hidden="true">
                            ...
                          </span>
                        );
                      }
                      const isActive = challengePage === pageNum;
                      return (
                        <button
                          key={`page-${pageNum}`}
                          type="button"
                          className={`mz-c-pagination-num-btn ${isActive ? "active" : ""}`}
                          onClick={() => handleChallengePageChange(pageNum)}
                          aria-label={`Page ${pageNum}`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    className="mz-c-pagination-btn mz-c-pagination-next"
                    onClick={() => handleChallengePageChange(challengePage + 1)}
                    disabled={challengePage >= totalChallengePages}
                    aria-label="Next Page"
                  >
                    <span>Next</span>
                    <LuChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: VIDEOS TAB (ALL VIDEOS GRID CATALOG) ── */}
        {activeTab === "videos" && (
          <div className="mz-c-videos-anim" style={{ marginTop: "12px" }}>
            {/* Header & Search */}
            <div className="mz-c-tab-view-header">
              <div>
                <h2>Video Library & Masterclasses</h2>
                <p>
                  Comprehensive collection of verified full-length programming masterclasses, interactive notes, and sandboxed code execution.
                </p>
              </div>
              <div className="mz-c-v-search-bar">
                <LuSearch size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={videoSearchQuery}
                  onChange={(e) => setVideoSearchQuery(e.target.value)}
                />
                {videoSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setVideoSearchQuery("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0 }}
                    aria-label="Clear search"
                  >
                    <LuX size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Spotlight Masterclass Cover Banner (Enlarged Widescreen Cover Slide) */}
            {filteredVideoCourses.length > 0 && (
              <div
                className="mz-c-video-spotlight-banner"
                onClick={() => setActiveVideoModal(filteredVideoCourses[0])}
              >
                <img
                  src={`https://img.youtube.com/vi/${filteredVideoCourses[0].youtubeId}/hqdefault.jpg`}
                  alt={filteredVideoCourses[0].title}
                  className="mz-c-spotlight-bg"
                />
                <div className="mz-c-spotlight-overlay" />

                <div className="mz-c-spotlight-content">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span className="mz-c-spotlight-tag">
                      <LuSparkles size={12} /> Spotlight Masterclass
                    </span>
                    <span className="mz-c-spotlight-duration">
                      <LuClock size={12} style={{ marginRight: "5px", verticalAlign: "middle", color: "#2563eb" }} />
                      {filteredVideoCourses[0].duration}
                    </span>
                  </div>

                  <h3 className="mz-c-spotlight-title">
                    {filteredVideoCourses[0].title}
                  </h3>

                  <p className="mz-c-spotlight-desc">
                    Taught by <strong>{filteredVideoCourses[0].channelTitle}</strong> • {filteredVideoCourses[0].level} • {filteredVideoCourses[0].category}
                  </p>

                  <div style={{ marginTop: "4px" }}>
                    <button
                      type="button"
                      className="mz-c-spotlight-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveVideoModal(filteredVideoCourses[0]);
                      }}
                    >
                      <LuPlay size={14} fill="currentColor" /> Watch Spotlight Masterclass
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Category Filter Pills */}
            <div className="mz-c-video-filter-bar">
              {[
                { key: "all", label: `All Courses (${videoCourses.length})` },
                { key: "python", label: "Python" },
                { key: "javascript", label: "JavaScript & React" },
                { key: "java", label: "Java" },
                { key: "cpp", label: "C++" },
                { key: "dsa", label: "Algorithms & DSA" },
                { key: "web", label: "Web Development" },
                { key: "database", label: "Databases & SQL" },
                { key: "devops", label: "DevOps & Systems" },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`mz-c-v-filter-pill ${videoCategoryFilter === cat.key ? "active" : ""}`}
                  onClick={() => setVideoCategoryFilter(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* All Videos Grid - Every single video displayed simultaneously together */}
            <div className="mz-c-full-video-grid mz-c-grid-anim">
              {filteredVideoCourses.map((course) => (
                <div
                  key={course.id}
                  className="mz-c-full-video-card"
                  onClick={() => setActiveVideoModal(course)}
                >
                  <div className="mz-c-full-video-thumb">
                    <img
                      src={`https://img.youtube.com/vi/${course.youtubeId}/hqdefault.jpg`}
                      alt={course.title}
                      className="mz-c-full-thumb-img"
                      loading="lazy"
                    />
                    <div className="mz-c-play-overlay">
                      <div className="mz-c-thumb-play-btn">
                        <LuPlay size={16} fill="currentColor" />
                      </div>
                    </div>
                    <div className="mz-c-verified-badge">
                      <TechBrandIcon type={course.language} size={13} />
                      <span>{course.category}</span>
                    </div>
                    <span className="mz-c-duration-badge">
                      <LuClock size={11} style={{ marginRight: "3px", verticalAlign: "middle" }} />
                      {course.duration}
                    </span>
                  </div>

                  <div className="mz-c-full-video-body">
                    <div>
                      <div className="mz-c-v-body-header">
                        <span className="mz-c-v-channel">{course.channelTitle}</span>
                        {course.verified && (
                          <LuCircleCheck size={13} color="#2563eb" title="Verified Creator" />
                        )}
                        <span className="mz-c-v-tag level" style={{ marginLeft: "auto" }}>
                          {course.level || "Beginner"}
                        </span>
                      </div>
                      <h3>{course.title}</h3>
                      {course.topics && course.topics.length > 0 && (
                        <div className="mz-c-video-topics-list">
                          {course.topics.slice(0, 4).map((topic, idx) => (
                            <span key={idx} className="mz-c-topic-tag">
                              {topic}
                            </span>
                          ))}
                          {course.topics.length > 4 && (
                            <span className="mz-c-topic-tag" style={{ opacity: 0.75 }}>
                              +{course.topics.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="mz-c-btn-watch"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveVideoModal(course);
                      }}
                    >
                      <LuPlay size={13} fill="currentColor" />
                      <span>Watch Masterclass</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredVideoCourses.length === 0 && (
              <div className="mz-c-empty-state" style={{ textAlign: "center", padding: "60px 20px" }}>
                <div className="mz-c-empty-icon" style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
                <h3>No video masterclasses found</h3>
                <p style={{ color: "#64748b", margin: "6px 0 16px" }}>
                  No courses matched "{videoSearchQuery}" under the selected category.
                </p>
                <button
                  type="button"
                  className="mz-c-chip mz-c-chip-active"
                  onClick={() => {
                    setVideoSearchQuery("");
                    setVideoCategoryFilter("all");
                  }}
                  style={{ padding: "8px 18px", cursor: "pointer" }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: PROJECTS TAB (12 Production-Grade Industry Labs) ── */}
        {activeTab === "projects" && (
          <div className="mz-c-projects-tab-view mz-c-grid-anim">
            {/* Top 12 Projects Showcase Cover Slide (No blue line above top slide) */}
            <div className="mz-c-projects-showcase-cover">
              <div className="mz-c-proj-cover-content">
                <div className="mz-c-proj-cover-badge-row">
                  <span className="mz-c-proj-cover-tag">
                    <LuSparkles size={13} /> Full-Stack & Systems Engineering Labs
                  </span>
                  <span className="mz-c-proj-cover-meta-pill">
                    Monaco Multi-File Cloud IDE • Automated Milestones
                  </span>
                </div>
                <h2 className="mz-c-proj-cover-title">
                  {projects.length || 14} Production-Grade Industry Engineering Projects
                </h2>
                <p className="mz-c-proj-cover-desc">
                  Architect and deploy end-to-end distributed systems, real-time WebSockets engines, microservices APIs, and high-frequency order books with milestone-by-milestone guided verification.
                </p>

                {/* Interactive Domain Filter Chips inside Cover */}
                <div className="mz-c-proj-cover-filter-row">
                  <span className="mz-c-proj-filter-label">Filter Labs:</span>
                  {[
                    { id: "all", label: `All Projects (${projects.length || 14})` },
                    { id: "backend", label: "Backend Systems" },
                    { id: "real-time", label: "Real-Time Systems" },
                    { id: "financial", label: "Financial Engineering" },
                    { id: "full-stack", label: "Full-Stack Web" },
                    { id: "enterprise", label: "Enterprise Systems" },
                    { id: "ai", label: "AI & Data" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`mz-c-proj-filter-pill ${projectDomainFilter === cat.id ? "is-active" : ""}`}
                      onClick={() => setProjectDomainFilter(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Metrics Cluster */}
              <div className="mz-c-proj-cover-stats">
                <div className="mz-c-proj-stat-box">
                  <div className="mz-c-proj-stat-label">Total Labs</div>
                  <div className="mz-c-proj-stat-num">{projects.length || 14}</div>
                  <div className="mz-c-proj-stat-sub">Production Grade</div>
                </div>
                <div className="mz-c-proj-stat-box">
                  <div className="mz-c-proj-stat-label">Completed</div>
                  <div className="mz-c-proj-stat-num" style={{ color: "#4ade80" }}>
                    {projects.filter((p) => {
                      const pass = p.passingMarks || 80;
                      const score = p.userState?.bestScore ?? p.userState?.lastScore ?? 0;
                      const isLocallyPassed =
                        (currentUserId && (
                          localStorage.getItem(`mz_${currentUserId}_proj_passed_${p.id}`) === "true" ||
                          sessionStorage.getItem(`mz_${currentUserId}_proj_submitted_${p.id}`) === "true"
                        )) ||
                        localStorage.getItem(`mz_proj_passed_${p.id}`) === "true" ||
                        sessionStorage.getItem(`mz_proj_submitted_${p.id}`) === "true";
                      return isLocallyPassed || (score >= pass && p.userState?.passed) || p.userState?.passed;
                    }).length}
                  </div>
                  <div className="mz-c-proj-stat-sub">Verified</div>
                </div>
                <div className="mz-c-proj-stat-box">
                  <div className="mz-c-proj-stat-label">Max Reward</div>
                  <div className="mz-c-proj-stat-num" style={{ color: "#38bdf8" }}>
                    +{projects.reduce((acc, p) => acc + (p.xpReward || 350), 0).toLocaleString()}
                  </div>
                  <div className="mz-c-proj-stat-sub">Total XP</div>
                </div>
              </div>
            </div>

            {/* 12 Projects Grid (Blue line above slides removed) */}
            <div className="mz-c-projects-grid" ref={projectsGridRef}>
              {paginatedProjects.map((proj) => {
                const passingThreshold = proj.passingMarks || 80;
                const bestScore = proj.userState?.bestScore ?? proj.userState?.lastScore ?? 0;
                const isLocallyPassed =
                  (currentUserId && (
                    localStorage.getItem(`mz_${currentUserId}_proj_passed_${proj.id}`) === "true" ||
                    sessionStorage.getItem(`mz_${currentUserId}_proj_submitted_${proj.id}`) === "true"
                  )) ||
                  localStorage.getItem(`mz_proj_passed_${proj.id}`) === "true" ||
                  sessionStorage.getItem(`mz_proj_submitted_${proj.id}`) === "true";

                const isDone = Boolean(
                  isLocallyPassed ||
                  (bestScore >= passingThreshold && (proj.userState?.passed || String(proj.userState?.status).toUpperCase() === "PASSED")) ||
                  proj.userState?.passed ||
                  String(proj.userState?.status).toUpperCase() === "PASSED" ||
                  String(proj.userState?.status).toUpperCase() === "COMPLETED"
                );
                const techList = proj.technologies || [];
                const milestonesList = proj.milestones || proj.tasks || [];
                const checkedMilestones = isDone
                  ? milestonesList.length
                  : (proj.userState?.checkedTasks?.length || (proj.progressPercent ? Math.round((proj.progressPercent / 100) * milestonesList.length) : 0));
                const progressPct = isDone
                  ? 100
                  : (milestonesList.length > 0 ? Math.round((checkedMilestones / milestonesList.length) * 100) : 0);

                return (
                  <div
                    key={proj.id}
                    className={`mz-c-project-card ${isDone ? "is-completed" : ""}`}
                    onClick={() => handleOpenProject(proj)}
                  >
                    {/* Notice: Blue line (.mz-c-card-top-accent) removed above slide */}

                    {/* Interactive Project Cover Stage */}
                    <div className="mz-c-project-cover-stage">
                      <div className="mz-c-stage-top-row">
                        <span className="mz-c-domain-badge">
                          <TechBrandIcon type={proj.starterLanguage || proj.lang || techList[0]} size={16} />
                          <span>{proj.domain || proj.category || "Engineering Lab"}</span>
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span className={`mz-c-proj-diff-badge ${String(proj.difficulty || "Intermediate").toLowerCase()}`}>
                            {proj.difficulty || "Intermediate"}
                          </span>
                          {isDone && (
                            <span
                              className="mz-c-proj-completed-badge"
                              style={{
                                background: "#dcfce7",
                                color: "#15803d",
                                border: "1px solid #86efac",
                                fontSize: "11px",
                                fontWeight: 800,
                                padding: "3px 9px",
                                borderRadius: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <LuCircleCheck size={13} /> Completed
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="mz-c-project-title">{proj.title}</h3>
                      <p className="mz-c-project-desc">{proj.description}</p>
                    </div>

                    {/* Tech Stack Pills */}
                    <div className="mz-c-project-tech-row">
                      {techList.slice(0, 4).map((t) => (
                        <span key={t} className="mz-c-tech-tag-pill">
                          {t}
                        </span>
                      ))}
                      {techList.length > 4 && (
                        <span className="mz-c-tech-tag-pill" style={{ opacity: 0.75 }}>
                          +{techList.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Guided Milestones Progress Bar */}
                    <div className="mz-c-project-milestones-box">
                      <div className="mz-c-milestone-header">
                        <span className="mz-c-milestone-label">
                          {isDone ? "✓ All Milestones Verified • 100%" : `${milestonesList.length} Guided Milestones`}
                        </span>
                        <span className="mz-c-milestone-pct">{progressPct}%</span>
                      </div>
                      <div className="mz-c-milestone-progress-track">
                        <div
                          className="mz-c-milestone-progress-fill"
                          style={{
                            width: `${progressPct}%`,
                            background: isDone
                              ? "linear-gradient(90deg, #10b981, #059669)"
                              : "linear-gradient(90deg, #3b82f6, #6366f1)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Card Footer with Launch CTA */}
                    <div className="mz-c-project-footer">
                      <span className="mz-c-proj-xp-badge">
                        <LuZap size={13} color="#f59e0b" /> +{proj.xpReward || 300} XP
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isDone && (proj.userState?.latestReportSessionId || (typeof window !== "undefined" && localStorage.getItem(`mz_report_sid_${proj.id}`))) && (
                          <button
                            type="button"
                            className="mz-c-btn-solve"
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                              borderRadius: "8px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const sid = proj.userState?.latestReportSessionId || localStorage.getItem(`mz_report_sid_${proj.id}`);
                              window.open(`/assessment-report/${sid}`, "_blank", "noopener,noreferrer");
                            }}
                          >
                            <LuAward size={13} /> View Report
                          </button>
                        )}
                        <a
                          href={`/project-workspace/${proj.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mz-c-btn-solve ${isDone ? "mz-c-btn-completed" : ""}`}
                          style={{ padding: "7px 16px", fontSize: "12.5px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProject(proj);
                          }}
                        >
                          {isDone ? "Review Workspace" : "Open Workspace"} <LuArrowRight size={13} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Projects Pagination Controls */}
            {filteredProjects.length > 0 && (
              <div className="mz-c-challenges-pagination-container">
                <div className="mz-c-challenges-pagination-info">
                  <span>
                    Showing <strong className="mz-c-page-count-highlight">{startProjectIndex + 1}–{endProjectIndex}</strong> of{" "}
                    <strong className="mz-c-page-count-highlight">{totalProjectsCount}</strong> projects
                  </span>
                  <span className="mz-c-page-total-badge">
                    Page {projectPage} of {totalProjectPages} ({totalProjectPages} {totalProjectPages === 1 ? "page" : "pages"} total)
                  </span>
                </div>

                <div className="mz-c-pagination-controls">
                  <button
                    type="button"
                    className="mz-c-pagination-btn mz-c-pagination-prev"
                    onClick={() => handleProjectPageChange(projectPage - 1)}
                    disabled={projectPage <= 1}
                    aria-label="Previous Page"
                  >
                    <LuChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <div className="mz-c-pagination-numbers">
                    {getPageNumbers(projectPage, totalProjectPages).map((pageNum, pIdx) => {
                      if (pageNum === "...") {
                        return (
                          <span key={`proj-ellipsis-${pIdx}`} className="mz-c-pagination-ellipsis" aria-hidden="true">
                            ...
                          </span>
                        );
                      }
                      const isActive = projectPage === pageNum;
                      return (
                        <button
                          key={`proj-page-${pageNum}`}
                          type="button"
                          className={`mz-c-pagination-num-btn ${isActive ? "active" : ""}`}
                          onClick={() => handleProjectPageChange(pageNum)}
                          aria-label={`Page ${pageNum}`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="mz-c-pagination-btn mz-c-pagination-next"
                    onClick={() => handleProjectPageChange(projectPage + 1)}
                    disabled={projectPage >= totalProjectPages}
                    aria-label="Next Page"
                  >
                    <span>Next</span>
                    <LuChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: STUDY GROUPS TAB (Interactive Cover Page & Collaborative Live Pods) ── */}
        {activeTab === "study_groups" && (
          <div className="mz-c-study-groups-view mz-c-grid-anim">
            {/* Collaborative Session Controls */}
            <div className="mz-c-study-cover-hero" style={{ padding: "20px 24px", marginBottom: "20px" }}>
              <div className="mz-c-study-cover-actions" style={{ marginTop: 0, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    type="button"
                    className="mz-c-btn-start-meeting"
                    onClick={() => navigate("/live")}
                    title="Start Meeting"
                  >
                    <LuVideo size={16} />
                    <span>Start Meeting</span>
                  </button>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    Launch instant collaborative coding room
                  </span>
                </div>

                <form className="mz-c-join-code-form" onSubmit={handleJoinWithCode}>
                  <input
                    type="text"
                    placeholder="Enter Room Code (e.g. abc-def-ghi)"
                    value={studyRoomCodeInput}
                    onChange={(e) => setStudyRoomCodeInput(e.target.value)}
                    className="mz-c-join-code-input"
                  />
                  <button type="submit" className="mz-c-join-code-btn" disabled={!studyRoomCodeInput.trim()}>
                    Join Room
                  </button>
                </form>
              </div>
            </div>

            {/* 3. Interactive Pod Mode Launchers */}
            <div className="mz-c-study-launchers-header">
              <h3 className="mz-c-study-section-title">
                <LuLayers size={20} color="#2563eb" />
                Interactive Collaborative Pod Launchers
              </h3>
              <p className="mz-c-study-section-desc">
                Select an environment preset, customize target parameters, and jump directly into a synchronized live workspace.
              </p>
            </div>

            <div className="mz-c-study-launchers-grid">
              {/* Launcher 1: 1:1 Pair Programming */}
              <div className="mz-c-study-launcher-card">
                <div className="mz-c-launcher-top-accent" style={{ background: "linear-gradient(90deg, #06b6d4, #3b82f6)" }} />
                <div className="mz-c-launcher-header">
                  <div className="mz-c-launcher-icon-box" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#0891b2" }}>
                    <LuTerminal size={22} />
                  </div>
                  <span className="mz-c-launcher-badge" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#0891b2" }}>
                    Pair Coding
                  </span>
                </div>
                <h4 className="mz-c-launcher-card-title">1:1 Live Pair Programming</h4>
                <p className="mz-c-launcher-card-desc">
                  Dual Monaco editor with real-time cursor tracking, synchronized terminal execution, and side-by-side voice walkthrough.
                </p>

                <div className="mz-c-launcher-selector-wrap">
                  <span className="mz-c-launcher-selector-label">Target Runtime Language:</span>
                  <div className="mz-c-launcher-pills-row">
                    {["Python", "C++", "JavaScript", "Java", "Go"].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        className={`mz-c-launcher-pill-btn ${pairLang === lang ? "is-active" : ""}`}
                        onClick={() => setPairLang(lang)}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="mz-c-launcher-action-btn"
                  style={{ background: "linear-gradient(135deg, #0284c7, #2563eb)" }}
                  onClick={() => handleStartInstantMeeting(`1:1 Pair Programming Pod (${pairLang})`, "pair_programming")}
                  disabled={isCreatingMeeting}
                >
                  <LuPlay size={15} /> Launch Pair Pod ({pairLang})
                </button>
              </div>

              {/* Launcher 2: DSA Algorithmic Sprint */}
              <div className="mz-c-study-launcher-card">
                <div className="mz-c-launcher-top-accent" style={{ background: "linear-gradient(90deg, #2563eb, #6366f1)" }} />
                <div className="mz-c-launcher-header">
                  <div className="mz-c-launcher-icon-box" style={{ background: "rgba(37, 99, 235, 0.12)", color: "#2563eb" }}>
                    <LuCode size={22} />
                  </div>
                  <span className="mz-c-launcher-badge" style={{ background: "rgba(37, 99, 235, 0.12)", color: "#2563eb" }}>
                    Algorithmic Sprint
                  </span>
                </div>
                <h4 className="mz-c-launcher-card-title">DSA & LeetCode Sprint Pod</h4>
                <p className="mz-c-launcher-card-desc">
                  Timed sprint countdown, synchronized problem dissection, shared test runner, and Big-O complexity scratchpad.
                </p>

                <div className="mz-c-launcher-selector-wrap">
                  <span className="mz-c-launcher-selector-label">Sprint Focus Topic:</span>
                  <div className="mz-c-launcher-pills-row">
                    {["Dynamic Programming", "Sliding Window", "Graph BFS/DFS", "Binary Trees"].map((top) => (
                      <button
                        key={top}
                        type="button"
                        className={`mz-c-launcher-pill-btn ${dsaTopic === top ? "is-active" : ""}`}
                        onClick={() => setDsaTopic(top)}
                      >
                        {top}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="mz-c-launcher-action-btn"
                  style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
                  onClick={() => handleStartInstantMeeting(`DSA Sprint Pod (${dsaTopic})`, "dsa_sprint")}
                  disabled={isCreatingMeeting}
                >
                  <LuPlay size={15} /> Launch DSA Sprint ({dsaTopic})
                </button>
              </div>

              {/* Launcher 3: System Architecture & Whiteboard */}
              <div className="mz-c-study-launcher-card">
                <div className="mz-c-launcher-top-accent" style={{ background: "linear-gradient(90deg, #10b981, #06b6d4)" }} />
                <div className="mz-c-launcher-header">
                  <div className="mz-c-launcher-icon-box" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
                    <LuPenTool size={22} />
                  </div>
                  <span className="mz-c-launcher-badge" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
                    Architecture Canvas
                  </span>
                </div>
                <h4 className="mz-c-launcher-card-title">System Architecture Whiteboard</h4>
                <p className="mz-c-launcher-card-desc">
                  Infinite vector canvas for distributed systems design, microservice architectures, database schema modeling, and sequence flows.
                </p>

                <div className="mz-c-launcher-selector-wrap">
                  <span className="mz-c-launcher-selector-label">Architecture Pattern:</span>
                  <div className="mz-c-launcher-pills-row">
                    {["Microservices", "High-Scale Caching", "Event-Driven Kafka", "DB Sharding"].map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        className={`mz-c-launcher-pill-btn ${archTopic === pat ? "is-active" : ""}`}
                        onClick={() => setArchTopic(pat)}
                      >
                        {pat}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="mz-c-launcher-action-btn"
                  style={{ background: "linear-gradient(135deg, #059669, #0d9488)" }}
                  onClick={() => handleStartInstantMeeting(`System Architecture Pod (${archTopic})`, "architecture_whiteboard")}
                  disabled={isCreatingMeeting}
                >
                  <LuPlay size={15} /> Launch Whiteboard ({archTopic})
                </button>
              </div>

              {/* Launcher 4: Mock Technical Interview */}
              <div className="mz-c-study-launcher-card">
                <div className="mz-c-launcher-top-accent" style={{ background: "linear-gradient(90deg, #8b5cf6, #ec4899)" }} />
                <div className="mz-c-launcher-header">
                  <div className="mz-c-launcher-icon-box" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#7c3aed" }}>
                    <LuUser size={22} />
                  </div>
                  <span className="mz-c-launcher-badge" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#7c3aed" }}>
                    FAANG Simulation
                  </span>
                </div>
                <h4 className="mz-c-launcher-card-title">Live Mock Technical Interview</h4>
                <p className="mz-c-launcher-card-desc">
                  Realistic 45-minute timed interview with candidate and interviewer split perspectives, code execution, and behavioral rubrics.
                </p>

                <div className="mz-c-launcher-selector-wrap">
                  <span className="mz-c-launcher-selector-label">Target Role Track:</span>
                  <div className="mz-c-launcher-pills-row">
                    {["Full-Stack Lead", "SDE-1 / SDE-2", "Backend Systems", "System Design"].map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`mz-c-launcher-pill-btn ${interviewTrack === role ? "is-active" : ""}`}
                        onClick={() => setInterviewTrack(role)}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="mz-c-launcher-action-btn"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
                  onClick={() => handleStartInstantMeeting(`Mock Technical Interview (${interviewTrack})`, "mock_interview")}
                  disabled={isCreatingMeeting}
                >
                  <LuPlay size={15} /> Launch Mock Interview ({interviewTrack})
                </button>
              </div>
            </div>

            {/* 4. Custom Live Room Configurator Card */}
            <div className="mz-c-study-custom-panel">
              <div className="mz-c-custom-panel-header">
                <div className="mz-c-custom-panel-info">
                  <h3>Custom Live Pod Configurator</h3>
                  <p>Design a tailored live coding pod with a custom topic name, domain specialization, and peer capacity limit.</p>
                </div>
                <span className="mz-c-study-tech-badge">
                  <LuZap size={13} color="#f59e0b" /> Instant WebRTC Provisioning
                </span>
              </div>

              <form className="mz-c-custom-form-grid" onSubmit={handleCreateCustomRoom}>
                <div className="mz-c-custom-input-group">
                  <label>Room Topic / Sprint Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Striver SDE Sheet DP Marathon"
                    value={customRoomTopic}
                    onChange={(e) => setCustomRoomTopic(e.target.value)}
                    className="mz-c-custom-input"
                  />
                </div>

                <div className="mz-c-custom-input-group">
                  <label>Focus Domain</label>
                  <select
                    value={customRoomTrack}
                    onChange={(e) => setCustomRoomTrack(e.target.value)}
                    className="mz-c-custom-select"
                  >
                    <option value="DSA & Problem Solving">DSA & Problem Solving</option>
                    <option value="Full-Stack Engineering">Full-Stack Engineering</option>
                    <option value="Backend & Distributed Systems">Backend & Distributed Systems</option>
                    <option value="Modern C++ Systems">Modern C++ Systems</option>
                    <option value="Machine Learning Pipelines">Machine Learning Pipelines</option>
                  </select>
                </div>

                <div className="mz-c-custom-input-group">
                  <label>Peer Limit</label>
                  <select
                    value={customRoomLimit}
                    onChange={(e) => setCustomRoomLimit(e.target.value)}
                    className="mz-c-custom-select"
                  >
                    <option value="2">2 Peers (Pair)</option>
                    <option value="4">4 Peers (Squad)</option>
                    <option value="8">8 Peers (Study Group)</option>
                    <option value="16">16 Peers (Open Hall)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="mz-c-btn-create-custom-pod"
                  disabled={isCreatingMeeting}
                >
                  <LuPlus size={16} /> Create & Enter Pod
                </button>
              </form>
            </div>

            {/* 5. Collaboration Best Practices */}
            <div className="mz-c-study-guidelines-grid">
              <div className="mz-c-study-guideline-card">
                <div className="mz-c-guideline-step-num">01</div>
                <div className="mz-c-guideline-content">
                  <h4>Driver & Navigator Rotation</h4>
                  <p>
                    Swap keyboard control every 20-30 minutes. The Driver writes code while the Navigator dictates architectural constraints and boundary tests.
                  </p>
                </div>
              </div>

              <div className="mz-c-study-guideline-card">
                <div className="mz-c-guideline-step-num">02</div>
                <div className="mz-c-guideline-content">
                  <h4>Diagram Before Coding</h4>
                  <p>
                    Spend the first 10 minutes on the infinite whiteboard clarifying constraints, data structures, and edge cases before writing syntax.
                  </p>
                </div>
              </div>

              <div className="mz-c-study-guideline-card">
                <div className="mz-c-guideline-step-num">03</div>
                <div className="mz-c-guideline-content">
                  <h4>Test-Driven Verification</h4>
                  <p>
                    Step through code with empty arrays, single elements, and extreme boundaries before considering an algorithmic challenge solved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: RESOURCES TAB (With Visited Documentation Tracking & Badges) ── */}
        {activeTab === "resources" && (
          <div className="mz-c-resource-library-grid mz-c-grid-anim" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {resources.map((resItem, idx) => {
              const resKey = resItem.url || resItem.title;
              const isVisited = visitedResources.includes(resKey);
              return (
                <div
                  key={idx}
                  className={`mz-c-card mz-c-resource-card ${isVisited ? "is-visited" : ""}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "16px",
                    border: isVisited ? "1.5px solid #10b981" : "1px solid var(--mz-border)",
                    background: "var(--mz-surface)",
                    boxShadow: isVisited
                      ? "0 8px 24px -4px rgba(16, 185, 129, 0.14), 0 2px 6px rgba(15, 23, 42, 0.04)"
                      : "var(--mz-shadow-sm)",
                  }}
                  onClick={() => handleOpenResource(resItem)}
                >
                  {/* Top Accent Line - clipped cleanly by overflow: hidden */}
                  <div
                    className="mz-c-card-top-accent"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "3.5px",
                      background: isVisited
                        ? "linear-gradient(90deg, #10b981, #059669)"
                        : "linear-gradient(90deg, #2563eb, #6366f1)",
                      opacity: isVisited ? 1 : 0.65,
                    }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", marginTop: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <TechBrandIcon type={resItem.lang} size={22} />
                        <span style={{ fontSize: "12px", fontWeight: 700, color: isVisited ? "var(--mz-emerald-text)" : "var(--mz-text-muted)" }}>{resItem.category}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {resItem.official && (
                          <span style={{ fontSize: "10.5px", fontWeight: 800, padding: "2px 7px", borderRadius: "10px", background: "var(--mz-cyan-soft)", color: "var(--mz-cyan-text)" }}>
                            OFFICIAL DOCS
                          </span>
                        )}
                        {isVisited && (
                          <span
                            className="mz-c-card-completed-badge mz-c-badge-visited"
                            style={{
                              background: "var(--mz-emerald-soft)",
                              color: "var(--mz-emerald-text)",
                              border: "1px solid var(--mz-emerald-border)",
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 9px",
                              borderRadius: "12px",
                              fontSize: "11px",
                            }}
                            title="Viewed and recorded"
                          >
                            <LuCircleCheck size={13} /> Visited
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: "16.5px", fontWeight: 800, color: "var(--mz-text-primary)", lineHeight: 1.35 }}>
                      {resItem.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--mz-text-muted)", lineHeight: 1.55 }}>
                      {resItem.description}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--mz-border-subtle)" }}>
                    <span style={{ fontSize: "11.5px", color: isVisited ? "var(--mz-emerald-text)" : "var(--mz-text-muted)", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                      {isVisited ? "✓ Reference Explored" : "Reference Manual"}
                    </span>
                    <span style={{ color: isVisited ? "var(--mz-emerald-text)" : "var(--mz-blue-text)", fontSize: "12.5px", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                      {isVisited ? "Explore Docs" : "Open Documentation"} <LuExternalLink size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB 7: CERTIFICATION TAB (Professional & Interactive Design) ── */}
        {activeTab === "certification" && (
          <div className="mz-c-certs-list mz-c-grid-anim">
            {/* Top Academic & Professional Banner */}
            <div
              style={{
                background: "var(--mz-gradient-hero)",
                borderRadius: "20px",
                padding: "32px 36px",
                color: "var(--mz-text-primary)",
                marginBottom: "32px",
                boxShadow: "var(--mz-shadow-md)",
                position: "relative",
                overflow: "hidden",
                border: "1.5px solid var(--mz-blue-border)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -80,
                  right: -80,
                  width: "280px",
                  height: "280px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0) 70%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--mz-blue-soft)", border: "1.5px solid var(--mz-blue-border)", padding: "4px 14px", borderRadius: "9999px", marginBottom: "14px", boxShadow: "0 1px 3px rgba(37, 99, 235, 0.08)" }}>
                  <span style={{ color: "var(--mz-amber-text)", fontSize: "13px" }}>★</span>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--mz-blue-text)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Official Accredited Examination Suite
                  </span>
                </div>
                <h1 style={{ fontSize: "26px", fontWeight: 900, margin: "0 0 10px", color: "var(--mz-text-primary)", letterSpacing: "-0.02em" }}>
                  Mastery Zone Professional Certifications
                </h1>
                <p style={{ margin: "0 0 24px", fontSize: "14px", color: "var(--mz-text-secondary)", maxWidth: "800px", lineHeight: 1.6 }}>
                  Take comprehensive, proctored examinations designed to evaluate core engineering competence. Pass 20 MCQs and 2 live algorithmic coding challenges to receive official verified credentials.
                </p>

                {/* Key Metrics Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginTop: "12px" }}>
                  <div style={{ background: "var(--mz-surface)", padding: "14px 18px", borderRadius: "14px", border: "1px solid var(--mz-border)", boxShadow: "var(--mz-shadow-sm)" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--mz-text-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.04em" }}>Pass Benchmark</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--mz-green-text)", marginTop: "4px" }}>80% Required</div>
                  </div>
                  <div style={{ background: "var(--mz-surface)", padding: "14px 18px", borderRadius: "14px", border: "1px solid var(--mz-border)", boxShadow: "var(--mz-shadow-sm)" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--mz-text-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.04em" }}>Proctoring Standard</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--mz-blue-text)", marginTop: "4px" }}>Strict (5 Lives)</div>
                  </div>
                  <div style={{ background: "var(--mz-surface)", padding: "14px 18px", borderRadius: "14px", border: "1px solid var(--mz-border)", boxShadow: "var(--mz-shadow-sm)" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--mz-text-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.04em" }}>Time Allowed</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--mz-amber-text)", marginTop: "4px" }}>90 Minutes</div>
                  </div>
                  <div style={{ background: "var(--mz-surface)", padding: "14px 18px", borderRadius: "14px", border: "1px solid var(--mz-border)", boxShadow: "var(--mz-shadow-sm)" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--mz-text-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.04em" }}>Earned Credentials</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--mz-purple-text)", marginTop: "4px" }}>{earnedCertificates.length} Issued</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated My Earned Certificates Section */}
            <div style={{ marginBottom: "40px" }} data-testid="coding-my-certificates-section">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--mz-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🏆</span> My Earned Certificates ({earnedCertificates.length})
                  </h2>
                  <p style={{ margin: "3px 0 0", fontSize: "13px", color: "var(--mz-text-muted)" }}>
                    Verified credentials issued upon successful examination completion
                  </p>
                </div>
              </div>

              {earnedCertificates.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                  {earnedCertificates.map((cert) => (
                    <div
                      key={cert.certificateId}
                      style={{
                        background: "var(--mz-surface)",
                        border: "1.5px solid #d4af37",
                        borderRadius: "16px",
                        padding: "22px",
                        boxShadow: "0 8px 24px rgba(212, 175, 55, 0.14)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "4px",
                          background: "linear-gradient(90deg, #d4af37, #fef08a, #d4af37)",
                          borderTopLeftRadius: "14px",
                          borderTopRightRadius: "14px",
                        }}
                      />
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{ background: "var(--mz-emerald-soft)", color: "var(--mz-emerald-text)", border: "1px solid var(--mz-emerald-border)", fontSize: "11px", fontWeight: 800, padding: "3px 9px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <LuShieldCheck size={13} /> VERIFIED CREDENTIAL
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--mz-text-muted)", fontFamily: "monospace", background: "var(--mz-surface-muted)", padding: "2px 6px", borderRadius: "4px" }}>
                            {cert.certificateId}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "17.5px", fontWeight: 800, color: "var(--mz-text-primary)", margin: "6px 0 4px" }}>
                          {cert.certTitle || "Professional Certification"}
                        </h3>
                        <p style={{ fontSize: "13px", color: "var(--mz-text-muted)", margin: "2px 0 14px", lineHeight: 1.5 }}>
                          Recipient: <strong style={{ color: "var(--mz-text-primary)" }}>{cert.fullName || currentUser?.fullName || currentUser?.name || "Yashash"}</strong> • Grade: <strong style={{ color: "var(--mz-emerald-text)" }}>{cert.grade || "A+"}</strong> ({cert.score || 95}%)
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--mz-border-subtle)", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="mz-c-btn-solve"
                          style={{ flex: 1, minWidth: "100px", padding: "8px 12px", fontSize: "12px", justifyContent: "center", background: "#2563eb", color: "#ffffff", borderRadius: "8px" }}
                          onClick={() => {
                            const authToken = localStorage.getItem("token") || token || "";
                            window.open(`${API_BASE}/api/certifications/download/${cert.certificateId}?token=${encodeURIComponent(authToken)}`, "_blank");
                          }}
                        >
                          <LuDownload size={13} /> Download PDF
                        </button>
                        <button
                          type="button"
                          className="mz-c-btn-solve"
                          style={{ background: "var(--mz-surface-subtle)", color: "var(--mz-text-primary)", border: "1px solid var(--mz-border)", padding: "8px 12px", fontSize: "12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "5px" }}
                          onClick={() => window.open(`/certification/verify/${cert.certificateId}`, "_blank", "noopener,noreferrer")}
                        >
                          <LuExternalLink size={13} /> Verify
                        </button>
                        <button
                          type="button"
                          className="mz-c-btn-solve"
                          style={{ background: "var(--mz-blue-soft)", color: "var(--mz-blue-text)", border: "1px solid var(--mz-blue-border)", padding: "8px 12px", fontSize: "12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "5px", fontWeight: 700 }}
                          onClick={() => window.open(`/assessment-report/${cert.attemptId || cert.certificateId}`, "_blank", "noopener,noreferrer")}
                        >
                          <LuAward size={13} /> View Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "32px 24px", background: "var(--mz-surface-subtle)", borderRadius: "16px", border: "1.5px dashed var(--mz-border-strong)", textAlign: "center" }}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>📜</div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "var(--mz-text-primary)" }}>
                    No Earned Credentials Yet
                  </h3>
                  <p style={{ margin: "0 auto 12px", fontSize: "13.5px", color: "var(--mz-text-muted)", maxWidth: "560px" }}>
                    Choose an official track below and complete the proctored assessment. Score ≥80% to earn your cryptographic credential and showcase it on LinkedIn.
                  </p>
                  <div style={{ display: "inline-flex", gap: "16px", fontSize: "12px", color: "var(--mz-text-secondary)", fontWeight: 600 }}>
                    <span>1. Select Domain</span>
                    <span>→</span>
                    <span>2. Pass Integrity Checks</span>
                    <span>→</span>
                    <span>3. Score ≥80%</span>
                    <span>→</span>
                    <span>4. Verified Certificate</span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Filter & Search Controls */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "14px", marginBottom: "22px" }}>
              <div>
                <h3 style={{ fontSize: "19px", fontWeight: 800, color: "var(--mz-text-primary)", margin: 0 }}>
                  Available Professional Certification Examinations
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--mz-text-muted)" }}>
                  Each exam opens in its own secure, focused proctoring workspace in a separate tab.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                {[
                  { id: "all", label: "All Exams" },
                  { id: "python", label: "Python" },
                  { id: "javascript", label: "JavaScript" },
                  { id: "java", label: "Java" },
                  { id: "cpp", label: "C++" },
                  { id: "dsa", label: "DSA" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCertFilterCategory(cat.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: certFilterCategory === cat.id ? "1.5px solid #2563eb" : "1px solid var(--mz-border)",
                      background: certFilterCategory === cat.id ? "var(--mz-blue-soft)" : "var(--mz-surface)",
                      color: certFilterCategory === cat.id ? "var(--mz-blue-text)" : "var(--mz-text-secondary)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assessment Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "22px" }}>
              {[
                {
                  id: "python_cert",
                  title: "Python Certified Professional",
                  language: "python",
                  category: "python",
                  desc: "Comprehensive proctored assessment covering OOP, data structures, recursion, file operations, and algorithmic efficiency.",
                  cutoff: "80% Required (32 / 40 Marks)",
                  format: "20 MCQs + 2 Algorithmic Coding Tests",
                  time: "90 Minutes",
                  skills: ["OOP Design", "Recursion", "Data Structures", "Algorithms"],
                  accentColor: "#3b82f6",
                },
                {
                  id: "js_cert",
                  title: "JavaScript Full-Stack Developer",
                  language: "javascript",
                  category: "javascript",
                  desc: "Evaluates modern ES6+, async architecture, event loop mastery, functional programming, and practical DOM execution.",
                  cutoff: "80% Required (32 / 40 Marks)",
                  format: "20 MCQs + 2 Algorithmic Coding Tests",
                  time: "90 Minutes",
                  skills: ["Async / Await", "Event Loop", "Closures", "ES6+ Standards"],
                  accentColor: "#eab308",
                },
                {
                  id: "java_cert",
                  title: "Enterprise Java Specialist",
                  language: "java",
                  category: "java",
                  desc: "Strict proctored test on OOP architecture, Java Collections Framework, concurrency, and robust error management.",
                  cutoff: "80% Required (32 / 40 Marks)",
                  format: "20 MCQs + 2 Algorithmic Coding Tests",
                  time: "90 Minutes",
                  skills: ["Collections", "Concurrency", "Generics", "OOP Principles"],
                  accentColor: "#ef4444",
                },
                {
                  id: "cpp_cert",
                  title: "Modern C++ Systems Engineer",
                  language: "cpp",
                  category: "cpp",
                  desc: "Deep evaluation of pointer semantics, RAII, STL algorithms, move semantics, and low-latency system design.",
                  cutoff: "80% Required (32 / 40 Marks)",
                  format: "20 MCQs + 2 Algorithmic Coding Tests",
                  time: "90 Minutes",
                  skills: ["Pointers & RAII", "STL Algorithms", "Memory Management", "Templates"],
                  accentColor: "#0284c7",
                },
                {
                  id: "dsa_cert",
                  title: "Data Structures & Algorithms (DSA)",
                  language: "python",
                  category: "dsa",
                  desc: "Rigorous algorithmic assessment on Two Pointers, Sliding Window, Trees, Dynamic Programming, and Graph Traversals.",
                  cutoff: "80% Required (32 / 40 Marks)",
                  format: "20 MCQs + 2 Algorithmic Coding Tests",
                  time: "90 Minutes",
                  skills: ["Two Pointers", "Trees & Graphs", "Dynamic Programming", "Big-O Optimization"],
                  accentColor: "#7c3aed",
                },
              ]
                .filter((item) => {
                  if (certFilterCategory !== "all" && item.category !== certFilterCategory) return false;
                  if (certSearchQuery.trim()) {
                    const q = certSearchQuery.toLowerCase();
                    return item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
                  }
                  return true;
                })
                .map((certItem) => {
                  const certStatus = getSubjectCertStatus(certItem.id);
                  const isCompleted = certStatus.isCompleted;

                  return (
                    <div
                      key={certItem.id}
                      className="mz-c-card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                        borderRadius: "16px",
                        border: isCompleted ? "2px solid #22c55e" : "1px solid var(--mz-border)",
                        background: isCompleted ? "var(--mz-green-soft)" : "var(--mz-surface)",
                        boxShadow: isCompleted
                          ? "0 6px 20px rgba(34, 197, 94, 0.12)"
                          : "var(--mz-shadow-sm)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "4px",
                          background: isCompleted ? "#22c55e" : certItem.accentColor,
                        }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", marginTop: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <TechBrandIcon type={certItem.language} size={28} />
                            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", padding: "2px 8px", borderRadius: "10px", background: "var(--mz-surface-subtle)", border: "1px solid var(--mz-border)", color: "var(--mz-text-secondary)" }}>
                              {certItem.language.toUpperCase()}
                            </span>
                          </div>
                          {isCompleted ? (
                            <span style={{ fontSize: "11px", fontWeight: 800, padding: "3px 9px", borderRadius: "10px", background: "var(--mz-green-soft)", color: "var(--mz-green-text)", border: "1px solid var(--mz-green-border)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <LuCircleCheck size={13} /> COMPLETED
                            </span>
                          ) : (
                            <span style={{ fontSize: "11px", fontWeight: 800, padding: "3px 9px", borderRadius: "10px", background: "var(--mz-amber-soft)", color: "var(--mz-amber-text)", border: "1px solid var(--mz-amber-border)" }}>
                              OFFICIAL CERT
                            </span>
                          )}
                        </div>

                        <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 800, color: "var(--mz-text-primary)" }}>
                          {certItem.title}
                        </h3>
                        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--mz-text-muted)", lineHeight: 1.5 }}>
                          {certItem.desc}
                        </p>

                        {/* Completed Banner */}
                        {isCompleted && (
                          <div
                            style={{
                              background: "var(--mz-green-soft)",
                              border: "1.5px solid var(--mz-green-border)",
                              borderRadius: "10px",
                              padding: "10px 12px",
                              marginBottom: "14px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--mz-green-text)", fontWeight: 800, fontSize: "12.5px" }}>
                              <span>🏆</span> Cutoff Cleared (≥80%) • Certificate Awarded
                            </div>
                            {certStatus.certificateId && (
                              <div style={{ fontSize: "11.5px", color: "var(--mz-green-text)", fontFamily: "monospace", marginTop: "3px", fontWeight: 600 }}>
                                Credential ID: {certStatus.certificateId}
                              </div>
                            )}
                            <div style={{ fontSize: "11px", color: "var(--mz-green-text)", marginTop: "2px", fontWeight: 600 }}>
                              ✓ Examination completed. Retaking is locked.
                            </div>
                          </div>
                        )}

                        {/* Skills Chips */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                          {certItem.skills.map((sk, sIdx) => (
                            <span key={sIdx} style={{ fontSize: "11px", background: "var(--mz-surface-muted)", color: "var(--mz-text-secondary)", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                              {sk}
                            </span>
                          ))}
                        </div>

                        {/* Exam Specs Box */}
                        <div style={{ fontSize: "12px", color: "var(--mz-text-secondary)", background: "var(--mz-surface-subtle)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--mz-border)", display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div><strong>Format:</strong> {certItem.format}</div>
                          <div><strong>Passing:</strong> {certItem.cutoff}</div>
                          <div><strong>Duration:</strong> {certItem.time} • <strong>Proctoring:</strong> Strict (5 Lives)</div>
                        </div>
                      </div>

                      {/* Action Area */}
                      {isCompleted ? (
                        <div style={{ marginTop: "16px" }}>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {certStatus.certificateId && (
                              <button
                                type="button"
                                className="mz-c-btn-solve"
                                style={{
                                  flex: 1,
                                  minWidth: "120px",
                                  justifyContent: "center",
                                  padding: "10px 14px",
                                  fontSize: "12.5px",
                                  fontWeight: 700,
                                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                                }}
                                onClick={() => window.open(`/certification/verify/${certStatus.certificateId}`, "_blank", "noopener,noreferrer")}
                              >
                                <LuAward size={14} />
                                <span>View Certificate</span>
                              </button>
                            )}
                            {certStatus.attemptId && (
                              <button
                                type="button"
                                className="mz-c-btn-solve"
                                style={{
                                  flex: 1,
                                  minWidth: "110px",
                                  justifyContent: "center",
                                  padding: "10px 14px",
                                  fontSize: "12.5px",
                                  fontWeight: 700,
                                  background: "var(--mz-blue-soft)",
                                  color: "var(--mz-blue-text)",
                                  border: "1px solid var(--mz-blue-border)",
                                  borderRadius: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  cursor: "pointer",
                                }}
                                onClick={() => window.open(`/assessment-report/${certStatus.attemptId}`, "_blank", "noopener,noreferrer")}
                              >
                                <LuFileText size={14} />
                                <span>View Report</span>
                              </button>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "11.5px",
                              color: "var(--mz-text-muted)",
                              marginTop: "8px",
                              textAlign: "center",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              fontWeight: 600,
                            }}
                          >
                            <LuLock size={12} /> Test Passed • Cannot Attend Again
                          </div>
                        </div>
                      ) : (
                        <div>
                          {certStatus.latestAttempt &&
                            (certStatus.latestAttempt.status === "FAILED" ||
                              (certStatus.latestAttempt.percentage != null &&
                                certStatus.latestAttempt.percentage < 80)) && (
                              <div
                                style={{
                                  background: "var(--mz-red-soft)",
                                  border: "1px solid var(--mz-red-border)",
                                  borderRadius: "10px",
                                  padding: "8px 12px",
                                  marginTop: "12px",
                                  fontSize: "12px",
                                  color: "var(--mz-red-text)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <span>⚠️</span> Previous Attempt: Score {certStatus.latestAttempt.percentage ?? 0}% (Cutoff 80% Not Met)
                              </div>
                            )}

                          <button
                            type="button"
                            className="mz-c-btn-solve"
                            style={{
                              marginTop: "16px",
                              width: "100%",
                              justifyContent: "center",
                              padding: "11px 16px",
                              fontSize: "13px",
                              fontWeight: 700,
                              background: certStatus.latestAttempt
                                ? "linear-gradient(135deg, #4f46e5, #4338ca)"
                                : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                            }}
                            onClick={() => handleStartExam(certItem.id, certItem.title, certItem.language)}
                          >
                            <span>{certStatus.latestAttempt ? "Retake Examination" : "Start Certification Exam"}</span>
                            <LuExternalLink size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════
          4. MODAL WORKSPACES (Solving Challenge, Project, Exam)
          ══════════════════════════════════════════════════════════ */}

      {/* Algorithmic Challenge Solver Modal */}
      {selectedChallengeModal && (
        <React.Suspense fallback={<MasteryZoneGlobalLoader message="Opening Challenge Workspace..." />}>
          <ChallengeWorkspaceModal
            challenge={selectedChallengeModal}
            questionsList={challenges}
            currentQuestionIndex={challenges.findIndex((c) => c.id === selectedChallengeModal.id)}
            onSelectQuestion={(q) => setSelectedChallengeModal(q)}
            onClose={() => setSelectedChallengeModal(null)}
            onChallengeSolved={() => {
              fetchDashboardData();
            }}
          />
        </React.Suspense>
      )}

      {/* Project Workspace Modal (Fallback Fixed Overlay) */}
      {selectedProjectModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--mz-bg-primary, #000000)", overflowY: "auto" }}>
          <React.Suspense fallback={<MasteryZoneGlobalLoader message="Opening Project Workspace..." />}>
            <ProjectWorkspaceModal
              project={selectedProjectModal}
              onClose={() => setSelectedProjectModal(null)}
              onProjectStateUpdated={() => {
                fetchDashboardData();
              }}
            />
          </React.Suspense>
        </div>
      )}

      {/* Certification Exam Workspace */}
      {selectedExamWorkspace && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--mz-bg-primary)" }}>
          <React.Suspense fallback={<MasteryZoneGlobalLoader message="Preparing Certification Exam..." />}>
            <CertificationExamWorkspace
              certId={selectedExamWorkspace.id}
              certTitle={selectedExamWorkspace.name}
              language={selectedExamWorkspace.language}
              onClose={() => setSelectedExamWorkspace(null)}
              onExamCompleted={() => {
                setSelectedExamWorkspace(null);
                fetchDashboardData();
              }}
            />
          </React.Suspense>
        </div>
      )}

      {/* In-Platform Video Masterclass Modal */}
      {activeVideoModal && (
        <div
          className="mz-video-modal-backdrop"
          onClick={() => setActiveVideoModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="mz-video-modal-window" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="mz-video-modal-header">
              <div className="mz-video-title-cluster">
                <div className="mz-video-icon-box">
                  <TechBrandIcon type={activeVideoModal.language || "python"} size={26} />
                </div>
                <div className="mz-video-header-text">
                  <h3 className="mz-video-title" title={activeVideoModal.title}>
                    {activeVideoModal.title}
                  </h3>
                  <div className="mz-video-sub-row">
                    <span style={{ fontWeight: 600, color: "#2563eb", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {activeVideoModal.channelTitle || "Official Instructor"}
                    </span>
                    <span>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <LuClock size={12} /> {activeVideoModal.duration || "Full Course"}
                    </span>
                    <span>•</span>
                    <span className="mz-video-badge">{activeVideoModal.level || "Beginner"}</span>
                    {activeVideoModal.category && (
                      <>
                        <span>•</span>
                        <span style={{ color: "#64748b" }}>{activeVideoModal.category}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mz-video-close-btn"
                onClick={() => setActiveVideoModal(null)}
                aria-label="Close video player"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Video Player 16:9 Stage */}
            <div className="mz-video-embed-stage">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoModal.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={activeVideoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="mz-video-iframe-player"
              />
            </div>

            {/* Footer */}
            <div className="mz-video-modal-footer">
              <div className="mz-video-footer-left">
                <span className="mz-video-topic-pill">
                  <LuSparkles size={13} color="#2563eb" /> 1080p Verified Masterclass
                </span>
                <span className="mz-video-topic-pill">
                  <LuCheck size={13} color="#10b981" /> Interactive Notes Available
                </span>
                {activeVideoModal.topics && activeVideoModal.topics.slice(0, 3).map((topic, i) => (
                  <span key={i} className="mz-video-topic-pill">
                    {topic}
                  </span>
                ))}
              </div>

              <div className="mz-video-footer-right">
                <button
                  type="button"
                  className="mz-video-btn-secondary"
                  onClick={() => setActiveVideoModal(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="mz-video-btn-primary"
                  onClick={() => handlePracticeInLearningPath(activeVideoModal)}
                >
                  <span>Practice in Learning Path</span>
                  <LuArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3-STEP PROGRESSION MODALS ── */}

      {/* ── MODULE LEARNING PATHWAY CONFIRMATION MODAL ── */}
      {activeModuleChoice && (
        <div
          className="mz-c-modal-overlay"
          onClick={() => setSelectedModuleChoice(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.72)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="mz-c-choice-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--mz-surface)",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "680px",
              boxShadow: "var(--mz-shadow-xl)",
              border: "1px solid var(--mz-border)",
              overflow: "hidden",
              animation: "mzChoiceModalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Modal Top Header */}
            <div
              style={{
                padding: "22px 24px 18px",
                borderBottom: "1px solid var(--mz-border-subtle)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                background: "var(--mz-surface-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "var(--mz-blue-soft)",
                    border: "1px solid var(--mz-blue-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <TechBrandIcon type={activeTrack.id} size={28} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: "var(--mz-blue-soft)",
                        color: "var(--mz-blue-text)",
                        border: "1px solid var(--mz-blue-border)",
                      }}
                    >
                      Module {String(typeof activeModuleChoice.moduleIndex === "number" ? activeModuleChoice.moduleIndex + 1 : 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--mz-text-muted)", fontWeight: 600 }}>
                      {activeTrack.title || "Curriculum Track"}
                    </span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--mz-text-primary)" }}>
                    {activeModuleChoice.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedModuleChoice(null)}
                style={{
                  background: "var(--mz-surface-muted)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--mz-text-muted)",
                  transition: "all 0.15s ease",
                }}
                aria-label="Close dialog"
              >
                <LuX size={16} />
              </button>
            </div>

            {/* Confirmation Subtitle Banner */}
            <div style={{ padding: "14px 24px", background: "var(--mz-surface-subtle)", borderBottom: "1px solid var(--mz-border)" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--mz-text-secondary)", lineHeight: 1.5 }}>
                Select the learning mode you wish to proceed with. Practical coding and the 10-MCQ assessment unlock strictly after prerequisite completion.
              </p>
            </div>

            {/* 3 Pathway Choice Options */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* OPTION 1: Learning Module (Theory & Concept) */}
              <div
                className="mz-c-pathway-option active-pathway"
                onClick={() => {
                  const mod = activeModuleChoice;
                  setSelectedModuleChoice(null);
                  const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : 0;
                  window.open(`/concept-learning/${activeTrackId}/${mIdx}`, "_blank", "noopener,noreferrer");
                }}
                style={{
                  border: "1.5px solid #2563eb",
                  background: "var(--mz-blue-soft)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "var(--mz-surface)",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <LuBookOpen size={20} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--mz-text-primary)" }}>
                        1. Learning Module
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 7px",
                          borderRadius: "9999px",
                          background: activeModuleChoice.isStudied ? "var(--mz-emerald-soft)" : "var(--mz-blue-soft)",
                          color: activeModuleChoice.isStudied ? "var(--mz-emerald-text)" : "var(--mz-blue-text)",
                          border: activeModuleChoice.isStudied ? "1px solid var(--mz-emerald-border)" : "1px solid var(--mz-blue-border)",
                        }}
                      >
                        {activeModuleChoice.isStudied ? "✓ Completed" : "Unlocked & Ready"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "var(--mz-text-secondary)", lineHeight: 1.4 }}>
                      In-depth concept mastery, syntax breakdown, annotated code examples, and study notes.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px" }}>
                      <span style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--mz-blue-text)", background: "var(--mz-surface)", border: "1px solid var(--mz-blue-border)", padding: "1px 7px", borderRadius: "5px" }}>
                        📖 {activeModuleChoice.sections?.length || 5} Topics
                      </span>
                      <span style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--mz-purple-text)", background: "var(--mz-purple-soft)", border: "1px solid var(--mz-purple-border)", padding: "1px 7px", borderRadius: "5px" }}>
                        📚 {activeModuleChoice.references?.length || 3} Official Standards
                      </span>
                      <span style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--mz-emerald-text)", background: "var(--mz-emerald-soft)", border: "1px solid var(--mz-emerald-border)", padding: "1px 7px", borderRadius: "5px" }}>
                        ⚡ Live Sandbox
                      </span>
                      <span style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--mz-amber-text)", background: "var(--mz-amber-soft)", border: "1px solid var(--mz-amber-border)", padding: "1px 7px", borderRadius: "5px" }}>
                        🧠 Quiz
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0,
                  }}
                >
                  {activeModuleChoice.isStudied ? "Review Lesson" : "Start Learning"} <LuArrowRight size={13} />
                </button>
              </div>

              {/* OPTION 2: Practical Coding Test (Locked if !isStudied) */}
              {(() => {
                const isUnlocked = Boolean(activeModuleChoice.isStudied);
                const isPassed = Boolean(activeModuleChoice.assignmentPassed || activeModuleChoice.exercisePassed);

                return (
                  <div
                    className={`mz-c-pathway-option ${isUnlocked ? "active-pathway" : "locked-pathway"}`}
                    onClick={() => {
                      if (!isUnlocked) {
                        toast.warn("🔒 Locked: Please complete Module Learning first before taking the coding test.", {
                          toastId: "code_lock_warn",
                        });
                        return;
                      }
                      const mod = activeModuleChoice;
                      setSelectedModuleChoice(null);
                      const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : 0;
                      if (isPassed) {
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
                            ? `mz_${uId}_exam_coding_${activeTrackId}_${mIdx}_submitted`
                            : `mz_exam_${mIdx}_submitted`;
                          localStorage.removeItem(userSubmittedKey);
                          localStorage.removeItem(`${userSubmittedKey}_report_url`);
                          sessionStorage.removeItem("mz_active_proctored_session");
                          localStorage.removeItem("mz_active_proctored_session");
                        } catch {}
                      }
                      window.open(`/coding-test/${activeTrackId}/${mIdx}${isPassed ? "?retake=true" : ""}`, "_blank", "noopener,noreferrer");
                    }}
                    style={{
                      border: isUnlocked ? (isPassed ? "1px solid var(--mz-emerald-border)" : "1.5px solid #3b82f6") : "1px solid var(--mz-border)",
                      background: isUnlocked ? (isPassed ? "var(--mz-emerald-soft)" : "var(--mz-surface)") : "var(--mz-surface-subtle)",
                      borderRadius: "14px",
                      padding: "16px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: isUnlocked ? "pointer" : "not-allowed",
                      opacity: isUnlocked ? 1 : 0.72,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: isUnlocked ? (isPassed ? "var(--mz-green-soft)" : "var(--mz-blue-soft)") : "var(--mz-surface-muted)",
                          color: isUnlocked ? (isPassed ? "var(--mz-green-text)" : "var(--mz-blue-text)") : "var(--mz-text-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <LuCode size={20} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "14.5px", fontWeight: 700, color: isUnlocked ? "var(--mz-text-primary)" : "var(--mz-text-muted)" }}>
                            2. Practical Coding Test
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "2px 7px",
                              borderRadius: "9999px",
                              background: isPassed ? "var(--mz-emerald-soft)" : isUnlocked ? "var(--mz-blue-soft)" : "var(--mz-surface-muted)",
                              color: isPassed ? "var(--mz-emerald-text)" : isUnlocked ? "var(--mz-blue-text)" : "var(--mz-text-muted)",
                              border: isPassed ? "1px solid var(--mz-emerald-border)" : isUnlocked ? "1px solid var(--mz-blue-border)" : "1px solid var(--mz-border)",
                            }}
                          >
                            {isPassed ? `✓ Passed (${activeModuleChoice.exerciseScore || activeModuleChoice.assignmentScore || activeModuleChoice.bestScore || 100}%)` : isUnlocked ? "Unlocked & Ready" : "🔒 Locked"}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--mz-text-muted)", lineHeight: 1.4 }}>
                          {isUnlocked
                            ? "Interactive Monaco code editor, sandboxed execution, and real-time test case verification."
                            : "Locked — Requires completing Module Learning (Step 1) to unlock."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!isUnlocked}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background: isUnlocked ? (isPassed ? "#059669" : "#2563eb") : "var(--mz-surface-muted)",
                        color: isUnlocked ? "#ffffff" : "var(--mz-text-subtle)",
                        border: "none",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: isUnlocked ? "pointer" : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                      }}
                    >
                      {isUnlocked ? (isPassed ? "Review Code" : "Start Coding Test") : "🔒 Locked"}{" "}
                      {isUnlocked && <LuArrowRight size={13} />}
                    </button>
                  </div>
                );
              })()}

              {/* OPTION 3: 10-MCQ Proctored Assessment (Locked if !isStudied || !codingDone) */}
              {(() => {
                const isStudyDone = Boolean(activeModuleChoice.isStudied);
                const isCodingDone = Boolean(activeModuleChoice.assignmentPassed || activeModuleChoice.exercisePassed);
                const isUnlocked = isStudyDone && isCodingDone;
                const isPassed = Boolean(activeModuleChoice.assessmentPassed);

                return (
                  <div
                    className={`mz-c-pathway-option ${isUnlocked ? "active-pathway" : "locked-pathway"}`}
                    onClick={() => {
                      if (!isStudyDone) {
                        toast.warn("🔒 Locked: Please complete Module Learning first.", { toastId: "exam_lock_s1" });
                        return;
                      }
                      if (!isCodingDone) {
                        toast.warn("🔒 Locked: Please pass the Practical Coding Test first to unlock the 10-MCQ Exam.", {
                          toastId: "exam_lock_s2",
                        });
                        return;
                      }
                      const mod = activeModuleChoice;
                      setSelectedModuleChoice(null);
                      const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : 0;
                      if (isPassed) {
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
                            ? `mz_${uId}_exam_coding_${activeTrackId}_${mIdx}_submitted`
                            : `mz_exam_${mIdx}_submitted`;
                          localStorage.removeItem(userSubmittedKey);
                          localStorage.removeItem(`${userSubmittedKey}_report_url`);
                          localStorage.removeItem(`mz_proc_draft_ans_coding_${activeTrackId}_${mIdx}`);
                          localStorage.removeItem(`mz_proc_draft_time_coding_${activeTrackId}_${mIdx}`);
                          sessionStorage.removeItem("mz_active_proctored_session");
                          localStorage.removeItem("mz_active_proctored_session");
                        } catch {}
                      }
                      window.open(`/proctored-assessment/${activeTrackId}/${mIdx}${isPassed ? "?retake=true" : ""}`, "_blank", "noopener,noreferrer");
                    }}
                    style={{
                      border: isUnlocked ? (isPassed ? "1px solid var(--mz-emerald-border)" : "1.5px solid #3b82f6") : "1px solid var(--mz-border)",
                      background: isUnlocked ? (isPassed ? "var(--mz-emerald-soft)" : "var(--mz-surface)") : "var(--mz-surface-subtle)",
                      borderRadius: "14px",
                      padding: "16px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: isUnlocked ? "pointer" : "not-allowed",
                      opacity: isUnlocked ? 1 : 0.72,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: isUnlocked ? (isPassed ? "var(--mz-green-soft)" : "var(--mz-blue-soft)") : "var(--mz-surface-muted)",
                          color: isUnlocked ? (isPassed ? "var(--mz-green-text)" : "var(--mz-blue-text)") : "var(--mz-text-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <LuShieldCheck size={20} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "14.5px", fontWeight: 700, color: isUnlocked ? "var(--mz-text-primary)" : "var(--mz-text-muted)" }}>
                            3. Proctored 10-MCQ Exam
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "2px 7px",
                              borderRadius: "9999px",
                              background: isPassed ? "var(--mz-emerald-soft)" : isUnlocked ? "var(--mz-blue-soft)" : "var(--mz-surface-muted)",
                              color: isPassed ? "var(--mz-emerald-text)" : isUnlocked ? "var(--mz-blue-text)" : "var(--mz-text-muted)",
                              border: isPassed ? "1px solid var(--mz-emerald-border)" : isUnlocked ? "1px solid var(--mz-blue-border)" : "1px solid var(--mz-border)",
                            }}
                          >
                            {isPassed
                              ? `✓ Passed (${activeModuleChoice.bestScore || 100}%)`
                              : isUnlocked
                              ? "Unlocked & Ready"
                              : "🔒 Locked"}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--mz-text-muted)", lineHeight: 1.4 }}>
                          {isUnlocked
                            ? "Proctored assessment with 5-lives security gate, webcam validation, and 80% pass threshold."
                            : !isStudyDone
                            ? "Locked — Requires completing Module Learning first."
                            : "Locked — Requires passing Practical Coding Test (Step 2) first."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!isUnlocked}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background: isUnlocked ? (isPassed ? "#059669" : "#2563eb") : "var(--mz-surface-muted)",
                        color: isUnlocked ? "#ffffff" : "var(--mz-text-subtle)",
                        border: "none",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: isUnlocked ? "pointer" : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                      }}
                    >
                      {isUnlocked ? (isPassed ? "Retake Assessment" : "Take Assessment") : "🔒 Locked"}{" "}
                      {isUnlocked && <LuArrowRight size={13} />}
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Modal Bottom Footer */}
            <div
              style={{
                padding: "14px 24px",
                background: "var(--mz-surface-subtle)",
                borderTop: "1px solid var(--mz-border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--mz-text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                <LuClock size={13} /> Estimated: {activeModuleChoice.estimatedTime || "45m"} for all 3 steps
              </span>
              <button
                type="button"
                onClick={() => setSelectedModuleChoice(null)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  background: "var(--mz-surface)",
                  border: "1px solid var(--mz-border)",
                  color: "var(--mz-text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Full-Screen Concept Learning & Theory (Step 1) */}
      {activeStudyModule && (
        <React.Suspense fallback={<MasteryZoneGlobalLoader message="Loading Learning Module..." />}>
          <FullScreenConceptLearning
            module={activeStudyModule}
            subjectKey="coding"
            trackId={activeTrackId}
            onClose={() => setActiveStudyModule(null)}
            onComplete={(completedMod) => handleFinishStudy(completedMod)}
          />
        </React.Suspense>
      )}

      {/* MODAL 2: Practical Coding Test with Monaco IDE (Step 2) */}
      {activeAssignmentModule && (
        <React.Suspense fallback={<MasteryZoneGlobalLoader message="Launching Practical Coding IDE..." />}>
          <PracticalAssignmentModal
            module={activeAssignmentModule}
            subjectKey="coding"
            trackId={activeTrackId}
            onClose={() => setActiveAssignmentModule(null)}
            onAssignmentPassed={() => {
              trackCurriculumCache.delete(activeTrackId);
              invalidateCachePattern("/api/curriculum");
              fetchCurriculum(activeTrackId, true);
              fetchDashboardData();
            }}
            onLaunchAssessment={(mod) => {
              setActiveAssignmentModule(null);
              setActiveAssessmentModule(mod);
            }}
          />
        </React.Suspense>
      )}

      {/* MODAL 3: 5-Step Proctored 10-MCQ Exam with Security Gate (Step 3) */}
      {activeAssessmentModule && (
        <React.Suspense fallback={<MasteryZoneGlobalLoader message="Initializing Proctored Assessment..." />}>
          <ProctoredAssessmentWorkspace
            module={activeAssessmentModule}
            subjectKey="coding"
            trackId={activeTrackId}
            onClose={() => setActiveAssessmentModule(null)}
            onAssessmentCompleted={() => {
              trackCurriculumCache.delete(activeTrackId);
              invalidateCachePattern("/api/curriculum");
              fetchCurriculum(activeTrackId, true);
              fetchDashboardData();
            }}
          />
        </React.Suspense>
      )}

      {/* MODAL 4: Reset Learning Progress Modal */}
      {isResetModalOpen && (
        <div
          className="mz-c-modal-overlay"
          onClick={() => !isResetting && setIsResetModalOpen(false)}
        >
          <div className="mz-c-modal mz-reset-learning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mz-reset-modal-header">
              <div className="mz-reset-modal-icon-ring">
                <LuRotateCcw size={22} />
              </div>
              <div>
                <h3 className="mz-reset-modal-title">Reset Learning Process</h3>
                <p className="mz-reset-modal-sub">Clear module completions, assignments, and test assessments</p>
              </div>
              <button
                type="button"
                className="mz-c-modal-close"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="mz-reset-modal-body">
              <div className="mz-reset-warning-banner">
                <LuShieldAlert size={18} />
                <span>
                  This action will reset your learning progress, completed lessons, coding tests, and assessments for <strong>{activeTrack.title}</strong> back to the beginning.
                </span>
              </div>

              <div className="mz-reset-summary-list">
                <div className="mz-reset-summary-item">
                  <LuCheck size={14} color="#dc2626" />
                  <span>Module completions and scores will be reset to 0%. All modules remain accessible for practice.</span>
                </div>
                <div className="mz-reset-summary-item">
                  <LuCheck size={14} color="#dc2626" />
                  <span>Proctored 10-MCQ test exam attempts and scores will be cleared.</span>
                </div>
                <div className="mz-reset-summary-item">
                  <LuCheck size={14} color="#dc2626" />
                  <span>Practical coding test completions and submissions will be reset.</span>
                </div>
              </div>
            </div>

            <div className="mz-reset-modal-actions">
              <button
                type="button"
                className="mz-reset-btn-cancel"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mz-reset-btn-confirm"
                onClick={handleResetTrackProgress}
                disabled={isResetting}
              >
                {isResetting ? "Resetting Progress..." : "Yes, Reset Progress"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
