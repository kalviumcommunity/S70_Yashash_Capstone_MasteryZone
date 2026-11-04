import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
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

import NotificationBell from "./NotificationBell";
import FeaturedLearningCarousel from "./FeaturedLearningCarousel";
import FeaturedVideosSlider, { DEFAULT_FEATURED_VIDEOS } from "./FeaturedVideosSlider";
import ChallengeWorkspaceModal from "./ChallengeWorkspaceModal";
import { ProjectWorkspaceModal } from "./ProjectWorkspaceModal";
import CertificationExamWorkspace from "./CertificationExamWorkspace";
import FullScreenConceptLearning from "./FullScreenConceptLearning";
import PracticalAssignmentModal from "./PracticalAssignmentModal";
import ProctoredAssessmentWorkspace from "./ProctoredAssessmentWorkspace";
import logoIcon from "../assets/logo_icon_transparent.png";
import "./coding.css";

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
    completedLessons: 2,
    badgeText: "Most Popular",
    modules: [
      { id: "py_m1", index: 1, title: "Variables, Data Types & IO", desc: "Master primitive types, f-strings, input handling, and numeric expressions.", status: "completed", duration: "45m" },
      { id: "py_m2", index: 2, title: "Control Flow & Conditionals", desc: "Boolean logic, branching with if/elif/else, and match-case statements.", status: "completed", duration: "50m" },
      { id: "py_m3", index: 3, title: "Loops & Iterations", desc: "for loops, range generators, while constructs, and loop control statements.", status: "in_progress", duration: "60m" },
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
    completedLessons: 1,
    badgeText: "Web Core",
    modules: [
      { id: "js_m1", index: 1, title: "ES6+ Fundamentals & Types", desc: "Let/const, arrow functions, destructuring, and template literals.", status: "completed", duration: "40m" },
      { id: "js_m2", index: 2, title: "Async JavaScript & Promises", desc: "Event loop, microtasks, Promise chaining, and async/await.", status: "in_progress", duration: "1h" },
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
   DEFAULT PRACTICAL PROJECTS DATA (12 Industry Labs)
   ══════════════════════════════════════════════════════════════ */
const DEFAULT_PROJECTS = [
  {
    id: "proj_task_queue",
    title: "Distributed Task Queue & Job Scheduler",
    domain: "Backend Systems",
    starterLanguage: "javascript",
    description: "Architect a resilient background job queue with concurrency limits, exponential backoff retries, and dead-letter queues.",
    technologies: ["Node.js", "Redis", "TypeScript", "Docker"],
    milestones: ["Worker Daemon & IPC", "Priority Queue Engine", "Exponential Backoff & Telemetry"],
    progressPercent: 35,
    difficulty: "Advanced",
    xpReward: 350,
  },
  {
    id: "proj_collab_canvas",
    title: "Real-Time Collaborative Code Canvas",
    domain: "Real-Time Systems",
    starterLanguage: "react",
    description: "Build an interactive multi-cursor live code editor powered by WebSockets, Operational Transformation (OT), and presence tracking.",
    technologies: ["React", "WebSockets", "Monaco Editor", "Express"],
    milestones: ["WebSocket Protocol & Auth", "Cursor Broadcasting", "Conflict Resolution Engine"],
    progressPercent: 0,
    difficulty: "Intermediate",
    xpReward: 300,
  },
  {
    id: "proj_algo_trading",
    title: "Algorithmic Order Matching Engine",
    domain: "Financial Engineering",
    starterLanguage: "cpp",
    description: "Construct a high-throughput Limit Order Book (LOB) engine in Modern C++ processing bid/ask orders with sub-millisecond execution.",
    technologies: ["C++20", "STL", "Memory Pools", "CMake"],
    milestones: ["Price-Time Priority Book", "Trade Execution Engine", "Performance Benchmark Suite"],
    progressPercent: 0,
    difficulty: "Hard",
    xpReward: 400,
  },
  {
    id: "proj_ecommerce_api",
    title: "Enterprise E-Commerce Microservices API",
    domain: "Full-Stack Web",
    starterLanguage: "python",
    description: "Design modular RESTful microservices for product catalogs, cart state, payment webhook gateways, and JWT authentication.",
    technologies: ["Python", "FastAPI", "PostgreSQL", "Docker"],
    milestones: ["Schema & Database Migrations", "Payment Webhook Dispatcher", "Inventory Concurrency Lock"],
    progressPercent: 0,
    difficulty: "Intermediate",
    xpReward: 320,
  },
  {
    id: "proj_portfolio",
    title: "Modern Developer Portfolio & Terminal Resume",
    domain: "Full-Stack Web",
    starterLanguage: "javascript",
    description: "Build a fast, responsive developer portfolio engine featuring dynamic project filtering, an interactive terminal resume parser, and contact form validation.",
    technologies: ["HTML5", "CSS3 Grid", "JavaScript ES6", "DOM Validation"],
    milestones: ["Interactive Project Filter", "Terminal Resume CLI", "Sanitized Contact Endpoint"],
    progressPercent: 0,
    difficulty: "Beginner",
    xpReward: 250,
  },
  {
    id: "proj_task_api",
    title: "RESTful Task Management Engine",
    domain: "Backend Systems",
    starterLanguage: "python",
    description: "Develop a secure RESTful API featuring role-based access control, encrypted session tokens, and relational schema validation.",
    technologies: ["Python", "Flask", "SQLite", "JWT Auth"],
    milestones: ["Token Authentication Middleware", "CRUD Task Lifecycle", "Filter & Pagination API"],
    progressPercent: 0,
    difficulty: "Intermediate",
    xpReward: 280,
  },
  {
    id: "proj_banking_system",
    title: "Java Enterprise OOP Banking Engine",
    domain: "Enterprise Systems",
    starterLanguage: "java",
    description: "Architect an object-oriented banking transaction platform supporting checking/savings polymorphism, atomic fund transfers, and ledger persistence.",
    technologies: ["Java 17", "OOP Polymorphism", "Atomic Transactions", "JUnit"],
    milestones: ["Account Hierarchy & Overdraft", "Atomic Ledger Transfers", "Interest Accrual Service"],
    progressPercent: 0,
    difficulty: "Intermediate",
    xpReward: 320,
  },
  {
    id: "proj_realtime_chat",
    title: "Real-Time Chat & Multi-Room Presence",
    domain: "Real-Time Systems",
    starterLanguage: "javascript",
    description: "Engineer an instant messaging backbone with peer-to-peer room routing, typing presence indicators, and message caching.",
    technologies: ["Node.js", "Socket.io", "Redis Pub/Sub", "Express"],
    milestones: ["Room Broadcasting Protocol", "Heartbeat Presence Tracker", "Message History Cache"],
    progressPercent: 0,
    difficulty: "Intermediate",
    xpReward: 300,
  },
  {
    id: "proj_online_exam",
    title: "Online Examination & Proctoring Engine",
    domain: "Full-Stack Web",
    starterLanguage: "react",
    description: "Construct a proctored assessment system with synchronized countdown timers, randomized question banks, and anti-tamper telemetry.",
    technologies: ["React", "Node.js", "MongoDB", "WebRTC"],
    milestones: ["Timed Exam State Machine", "Automated MCQ Auto-Grading", "Anti-Tamper Event Listener"],
    progressPercent: 0,
    difficulty: "Advanced",
    xpReward: 350,
  },
  {
    id: "proj_resume_analyzer",
    title: "AI-Powered Resume Analyzer & Keyword Parser",
    domain: "AI & Data Engineering",
    starterLanguage: "python",
    description: "Implement an algorithmic resume screening pipeline that extracts technical competencies, computes JD match scores, and highlights missing keywords.",
    technologies: ["Python", "NLP Regex", "FastAPI", "JSON Schema"],
    milestones: ["Resume Tokenizer & Section Extractor", "Skills TF-IDF Matching Engine", "Match Scoring Algorithm"],
    progressPercent: 0,
    difficulty: "Intermediate",
    xpReward: 320,
  },
  {
    id: "proj_inventory_warehouse",
    title: "Inventory & Warehouse State Management",
    domain: "Enterprise Systems",
    starterLanguage: "java",
    description: "Build a warehouse management platform tracking product SKUs, multi-bin storage allocations, and automated low-stock reorder thresholds.",
    technologies: ["Java", "Spring Boot", "PostgreSQL", "JPA"],
    milestones: ["SKU Tracking & Stock Levels", "Order Fulfillment Pipeline", "Low-Stock Event Dispatcher"],
    progressPercent: 0,
    difficulty: "Intermediate",
    xpReward: 310,
  },
  {
    id: "proj_url_shortener",
    title: "High-Scale URL Shortener & Analytics",
    domain: "Backend Systems",
    starterLanguage: "javascript",
    description: "Design a high-throughput URL shortening service with Base62 collision-free encoding, Redis cache lookups, and click geocoding metrics.",
    technologies: ["Node.js", "Base62 Encoding", "Redis", "PostgreSQL"],
    milestones: ["Base62 Hash Tokenizer", "Sub-Millisecond Redis Cache", "Click Analytics Stream"],
    progressPercent: 0,
    difficulty: "Intermediate",
    xpReward: 290,
  },
];

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

  const rawInitialTab = searchParams.get("tab") || location.state?.tab;
  const initialTab = normalizeTabName(rawInitialTab);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Synchronize active tab whenever URL search params or router state changes
  useEffect(() => {
    const tabParam = searchParams.get("tab") || location.state?.tab;
    if (tabParam) {
      const normalized = normalizeTabName(tabParam);
      setActiveTab(normalized);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams, location.state]);

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
  const [activeTrackId, setActiveTrackId] = useState("python");
  const [challenges, setChallenges] = useState([]);
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [resources, setResources] = useState(DEFAULT_RESOURCES);
  const [studyGroups, setStudyGroups] = useState(DEFAULT_STUDY_GROUPS);
  const [stats, setStats] = useState({
    totalXp: 450,
    hoursSpent: 12.5,
    streakDays: 3,
    solvedCount: 1,
    activeTrack: "Python Track",
  });
  const [earnedCertificates, setEarnedCertificates] = useState([]);
  const [certAttempts, setCertAttempts] = useState([]);

  // Filter states inside Challenges tab
  const [challengeDifficulty, setChallengeDifficulty] = useState("all");
  const [challengeCategory, setChallengeCategory] = useState("all");

  // Modals & Active Workspaces
  const [selectedChallengeModal, setSelectedChallengeModal] = useState(null);
  const [selectedProjectModal, setSelectedProjectModal] = useState(null);
  const [selectedExamWorkspace, setSelectedExamWorkspace] = useState(null);
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
  const [curriculumData, setCurriculumData] = useState({ modules: [], unlockLevel: 0 });
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
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
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

  useEffect(() => {
    const handleStorageOrCustom = () => {
      setCompletionTick((t) => t + 1);
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          const name = u.fullName || u.username || u.name || "Learner";
          setCurrentUser({ ...u, name, fullName: u.fullName || name, email: u.email || "user@masteryzone.com" });
        }
      } catch {}
    };

    const handleWindowMessage = (event) => {
      if (
        event.data?.type === "MZ_MODULE_STUDIED" ||
        event.data?.type === "MZ_EXAM_COMPLETED" ||
        event.data?.type === "MZ_ASSIGNMENT_PASSED"
      ) {
        fetchCurriculum(activeTrackId);
        fetchDashboardData();
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
  }, [activeTrackId]);

  /* ────────────────────────────────────────────────────────────
     1. Fetch Unified Dashboard Data
     ──────────────────────────────────────────────────────────── */
  const fetchDashboardData = useCallback(async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/api/coding/data`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          // Merge modules from default tracks if server tracks omit detailed module array
          const merged = data.tracks.map((t) => {
            const def = DEFAULT_TRACKS.find((dt) => dt.id === t.id);
            return {
              ...t,
              badgeText: t.badgeText || def?.badgeText || "Core",
              modules: def?.modules || [],
            };
          });
          setTracks(merged);
        }
        if (Array.isArray(data.challenges) && data.challenges.length > 0) {
          setChallenges(data.challenges);
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
    } catch (err) {
      console.warn("Could not load /api/coding/data, falling back to local catalog:", err);
    }

    // Always fetch challenges directly to guarantee full catalog with question numbers
    try {
      const chRes = await fetch(`${API_BASE}/api/coding/challenges`);
      if (chRes.ok) {
        const chData = await chRes.json();
        if (Array.isArray(chData.challenges) && chData.challenges.length > 0) {
          setChallenges(chData.challenges);
        }
      }
    } catch {}

    // Fetch earned certificates
    if (token) {
      try {
        const certRes = await fetch(`${API_BASE}/api/certifications/my-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (certRes.ok) {
          const certData = await certRes.json();
          if (Array.isArray(certData.certificates)) {
            setEarnedCertificates(certData.certificates);
          }
          if (Array.isArray(certData.attempts)) {
            setCertAttempts(certData.attempts);
          }
        }
      } catch {}
    }

    // Fetch active collaborative study rooms
    try {
      const meetRes = await fetch(`${API_BASE}/api/meetings/study-rooms`);
      if (meetRes.ok) {
        const mData = await meetRes.json();
        if (Array.isArray(mData.rooms) && mData.rooms.length > 0) {
          setStudyGroups((prev) =>
            prev.map((pod) => {
              const liveRoom = mData.rooms.find((r) => r.key === pod.key);
              if (liveRoom) {
                return {
                  ...pod,
                  activeMeetingId: liveRoom.activeMeetingId || pod.activeMeetingId || pod.id,
                  peersCount: liveRoom.liveParticipantsCount > 0 ? liveRoom.liveParticipantsCount : pod.peersCount,
                };
              }
              return pod;
            })
          );
        }
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch real curriculum modules from server
  const fetchCurriculum = useCallback(async (trackId) => {
    if (!trackId) return;
    setLoadingCurriculum(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/curriculum/coding/${trackId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.modules)) {
          setCurriculumData(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch curriculum modules:", err);
    } finally {
      setLoadingCurriculum(false);
    }
  }, []);

  useEffect(() => {
    fetchCurriculum(activeTrackId);
  }, [activeTrackId, fetchCurriculum]);

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

  const displayModules = useMemo(() => {
    if (curriculumData && Array.isArray(curriculumData.modules) && curriculumData.modules.length > 0) {
      return curriculumData.modules;
    }
    return (activeTrack.modules || []).map((m, idx) => ({
      id: m.id || `${activeTrackId}_m${idx + 1}`,
      moduleIndex: typeof m.index === "number" ? m.index : idx,
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

  const completedCount = useMemo(() => {
    return displayModules.filter((m) => m.assessmentPassed || m.assignmentPassed).length;
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

      // Check earned valid certificates
      const cert = earnedCertificates.find((c) => {
        const cId = (c.certificationId || c.certId || "").toLowerCase();
        return (
          cId === target ||
          (target === "js_cert" && cId === "fullstack_cert") ||
          (target === "fullstack_cert" && cId === "js_cert")
        );
      });

      // Check passed attempts (cutoff >= 80% or status PASSED)
      const passedAttempt = certAttempts.find((att) => {
        const aId = (att.certId || "").toLowerCase();
        const matches =
          aId === target ||
          (target === "js_cert" && aId === "fullstack_cert") ||
          (target === "fullstack_cert" && aId === "js_cert");
        return (
          matches &&
          (att.status === "PASSED" || (att.percentage != null && att.percentage >= 80))
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

      const isCompleted = Boolean(cert || passedAttempt);
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

  const handleOpenPlayground = (langId, langName, starterCode) => {
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
    if (!studyRoomCodeInput.trim()) return;
    const clean = studyRoomCodeInput.trim().replace(/^.*\/meeting\//, "").split("?")[0].split("/")[0];
    window.open(`/meeting/${clean}`, "_blank", "noopener,noreferrer");
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
        setActiveTrackId(matchedTrack.id);
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
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/curriculum/coding/${activeTrackId}/${module.moduleIndex}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
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
        fetchCurriculum(activeTrackId);
        fetchDashboardData();
      } catch (err) {
        console.warn("Failed to record study duration:", err);
      }
    }
  };

  // ── Step 2 Complete: Practical Coding Test Passed ──
  const handleAssignmentPassed = () => {
    fetchCurriculum(activeTrackId);
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
    fetchCurriculum(activeTrackId);
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
        toast.success(data.message || "Learning progress reset successfully!");
        setIsResetModalOpen(false);
        fetchCurriculum(activeTrackId);
        fetchDashboardData();
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
    localStorage.clear();
    sessionStorage.clear();
    toast.info("Signed out successfully.");
    navigate("/login");
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
              placeholder='Search by Question # (e.g. 1, 22), Challenge Title, Track, or Project...'
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
                            setActiveTrackId(tr.id);
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
              <LuChevronDown className="mz-c-user-chevron" size={14} />
            </div>

            {showUserDropdown && (
              <div className="mz-c-user-dropdown">
                <div className="mz-c-dropdown-item mz-c-dropdown-header-item">
                  <strong>{currentUser?.name || "Learner"}</strong>
                  <span className="mz-c-dropdown-sub">{currentUser?.email || "learner@masteryzone.com"}</span>
                </div>
                <div className="mz-c-dropdown-divider" />
                <div
                  className="mz-c-dropdown-item"
                  onClick={() => {
                    navigate("/profile");
                    setShowUserDropdown(false);
                  }}
                >
                  <LuUser size={15} /> Profile Settings
                </div>
                <div
                  className="mz-c-dropdown-item"
                  onClick={() => {
                    navigate("/progress");
                    setShowUserDropdown(false);
                  }}
                >
                  <LuTrendingUp size={15} /> My Learning Progress
                </div>
                <div
                  className="mz-c-dropdown-item"
                  onClick={() => {
                    setActiveTab("certification");
                    setShowUserDropdown(false);
                  }}
                >
                  <LuAward size={15} /> My Earned Certificates ({earnedCertificates.length})
                </div>
                <div className="mz-c-dropdown-divider" />
                <div className="mz-c-dropdown-item mz-c-item-danger" onClick={handleLogout}>
                  <LuLogOut size={15} /> Sign Out
                </div>
              </div>
            )}
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
            <LuCode size={16} /> Challenges ({challenges.length || 135})
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
                  onClick={() => setActiveTrackId(tr.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: activeTrackId === tr.id ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                    background: activeTrackId === tr.id ? "#eff6ff" : "#ffffff",
                    color: activeTrackId === tr.id ? "#1d4ed8" : "#475569",
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
                        const nextMod = displayModules.find((m) => !m.assessmentPassed) || displayModules[0];
                        if (nextMod) handleStartPractice(nextMod);
                      }}
                    >
                      {hasStartedLearning ? "Resume Learning" : "Start Learning"} <LuArrowRight size={15} />
                    </button>
                  </div>
                </div>

                {/* Modules Roadmap List with 3-Step Interactive Progression */}
                <div className="mz-c-timeline" style={{ marginTop: "20px" }}>
                  {loadingCurriculum ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                      <p>Loading curriculum modules...</p>
                    </div>
                  ) : (
                    displayModules.map((mod, idx) => {
                      const stepNum = typeof mod.moduleIndex === "number" ? mod.moduleIndex + 1 : idx + 1;
                      const isComplete = Boolean(mod.assessmentPassed);
                      const isStudyDone = Boolean(mod.isStudied);
                      const isCodingDone = Boolean(mod.assignmentPassed || mod.exercisePassed);

                      return (
                        <div key={mod.id || idx} className="mz-c-timeline-step">
                          <div
                            className={`mz-c-timeline-node ${
                              isComplete ? "completed" : isStudyDone || isCodingDone ? "in-progress" : ""
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
                                      : isStudyDone || isCodingDone
                                      ? "in-progress"
                                      : "available"
                                  }`}
                                >
                                  {isComplete
                                    ? "Completed"
                                    : isStudyDone || isCodingDone
                                    ? "In Progress"
                                    : "Available"}
                                </span>
                              </div>

                              <p className="mz-c-module-desc">
                                {mod.subtitle || mod.desc}
                              </p>

                              {/* 3-Step Badges Row */}
                              <div className="mz-c-step-badges-row">
                                <button
                                  type="button"
                                  className={`mz-c-step-badge ${isStudyDone ? "done" : "active-step"}`}
                                  onClick={() => {
                                    const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : idx;
                                    window.open(`/concept-learning/${activeTrackId}/${mIdx}`, "_blank", "noopener,noreferrer");
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
                                      window.open(`/concept-learning/${activeTrackId}/${mIdx}`, "_blank", "noopener,noreferrer");
                                      return;
                                    }
                                    window.open(`/coding-test/${activeTrackId}/${mIdx}`, "_blank", "noopener,noreferrer");
                                  }}
                                  title="Step 2: Practical Coding Test with Monaco IDE"
                                >
                                  <LuCode size={13} />
                                  <span>{isCodingDone ? "✓ Step 2: Coding Test Passed" : "Step 2: Coding Test"}</span>
                                </button>

                                <button
                                  type="button"
                                  className={`mz-c-step-badge ${isComplete ? "done" : isCodingDone ? "active-step" : ""}`}
                                  onClick={() => {
                                    const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : idx;
                                    if (!isStudyDone) {
                                      toast.warn("Please study the concept lesson first (Step 1).");
                                      window.open(`/concept-learning/${activeTrackId}/${mIdx}`, "_blank", "noopener,noreferrer");
                                      return;
                                    }
                                    if (!isCodingDone) {
                                      toast.warn("Please pass the practical coding test first (Step 2).");
                                      window.open(`/coding-test/${activeTrackId}/${mIdx}`, "_blank", "noopener,noreferrer");
                                      return;
                                    }
                                    window.open(`/proctored-assessment/${activeTrackId}/${mIdx}`, "_blank", "noopener,noreferrer");
                                  }}
                                  title="Step 3: Proctored 10-MCQ Exam with Security Gate"
                                >
                                  <LuShieldCheck size={13} />
                                  <span>
                                    {isComplete
                                      ? `✓ Step 3: Exam Passed (${mod.bestScore || 100}%)`
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
                      handleOpenPlayground(
                        activeTrack.id || "python",
                        activeTrack.title || "Python 3",
                        `# ${activeTrack.title || "Python 3"} Sandboxed Environment\n# Real-time execution ready\n\ndef main():\n    print("Mastery Zone Live Coding Environment Ready!")\n\nif __name__ == "__main__":\n    main()\n`
                      )
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
                      <span>+{Math.max(120, ((stats?.totalXp || 350) % 250) + 60)} XP</span>
                    </div>
                    <span className="mz-c-live-metric-tag xp">⚡ High Velocity</span>
                  </div>

                  <div className="mz-c-live-metric-box">
                    <span className="mz-c-live-metric-title">TEST SUITE PASS</span>
                    <div className="mz-c-live-metric-val" style={{ color: "#059669" }}>
                      <LuCircleCheck size={14} color="#10b981" />
                      <span>100% Passed</span>
                    </div>
                    <span className="mz-c-live-metric-tag pass">5/5 Verified</span>
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
                      <h3 className="mz-c-card-heading">Interactive MZ-ASM Playground</h3>
                      <p className="mz-c-card-sub" style={{ margin: "2px 0 0 0", fontSize: "12.5px" }}>
                        MZ-ASM compiler with Python, JS, Java, and C++.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mz-c-link-btn"
                    onClick={() =>
                      handleOpenPlayground(
                        "python",
                        "Python 3",
                        "# Python 3 Sandboxed Runner\ndef solve():\n    print('Hello from MZ-ASM Compiler!')\n\nsolve()\n"
                      )
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
                        handleOpenPlayground(
                          "python",
                          "Python 3",
                          "# Python 3 Sandboxed Runner\ndef main():\n    print('Hello from Python 3 Runner!')\n\nif __name__ == '__main__':\n    main()\n"
                        )
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
                        handleOpenPlayground(
                          "javascript",
                          "JavaScript",
                          "// JavaScript Node.js Runtime\nconsole.log('Hello from JavaScript Node.js Runtime!');\n"
                        )
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
                        handleOpenPlayground(
                          "java",
                          "Java 26",
                          "// Java 26 OpenJDK Compiler\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println(\"Hello from Java 26 OpenJDK!\");\n    }\n}\n"
                        )
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
                        handleOpenPlayground(
                          "cpp",
                          "Modern C++",
                          "// Modern C++ (Clang / G++)\n#include <iostream>\n\nint main() {\n    std::cout << \"Hello from Modern C++!\" << std::endl;\n    return 0;\n}\n"
                        )
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
            {/* Top 135 Challenges Showcase Cover Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #0b1329 0%, #172554 55%, #1e3a8a 100%)",
                borderRadius: "20px",
                padding: "26px 30px",
                color: "#ffffff",
                marginBottom: "22px",
                boxShadow: "0 12px 32px -4px rgba(15, 23, 42, 0.25)",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(59, 130, 246, 0.35)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
              }}
            >
              <div style={{ position: "relative", zIndex: 1, maxWidth: "660px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(59, 130, 246, 0.2)", border: "1px solid rgba(147, 197, 253, 0.4)", padding: "4px 12px", borderRadius: "9999px", marginBottom: "12px" }}>
                  <LuCode size={13} color="#93c5fd" />
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#bfdbfe", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Official LeetCode & FAANG Problem Catalog
                  </span>
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 8px", color: "#ffffff", letterSpacing: "-0.01em" }}>
                  135 Curated Algorithmic Coding Challenges
                </h2>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.55 }}>
                  Practice essential data structures and algorithms across Python, Modern C++, Java, and JavaScript. Every problem features automated multi-test execution, edge-case evaluation, and sub-millisecond benchmarking.
                </p>
              </div>

              {/* Mini Quick Metric Counters */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                <div style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(8px)", padding: "10px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.12)", textAlign: "center", minWidth: "85px" }}>
                  <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Total</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", marginTop: "2px" }}>{challenges.length || 135}</div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(8px)", padding: "10px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.12)", textAlign: "center", minWidth: "85px" }}>
                  <div style={{ fontSize: "10px", color: "#86efac", textTransform: "uppercase", fontWeight: 700 }}>Easy</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#4ade80", marginTop: "2px" }}>
                    {challenges.filter((c) => c.difficulty?.toLowerCase() === "easy").length || 45}
                  </div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(8px)", padding: "10px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.12)", textAlign: "center", minWidth: "85px" }}>
                  <div style={{ fontSize: "10px", color: "#fde047", textTransform: "uppercase", fontWeight: 700 }}>Medium</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#facc15", marginTop: "2px" }}>
                    {challenges.filter((c) => c.difficulty?.toLowerCase() === "medium").length || 65}
                  </div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(8px)", padding: "10px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.12)", textAlign: "center", minWidth: "85px" }}>
                  <div style={{ fontSize: "10px", color: "#fca5a5", textTransform: "uppercase", fontWeight: 700 }}>Hard</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#f87171", marginTop: "2px" }}>
                    {challenges.filter((c) => c.difficulty?.toLowerCase() === "hard").length || 25}
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
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
              }}
            >
              {/* Difficulty Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
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
                      border: challengeDifficulty === diff ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                    }}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", maxWidth: "60%" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
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
                      border: challengeCategory === cat ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Challenges Grid */}
            <div className="mz-c-challenges-grid">
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
                filteredChallenges.map((ch, idx) => {
                  const isDone =
                    ch.isCompleted ||
                    ch.solved ||
                    (currentUserId && typeof window !== "undefined" && window.localStorage?.getItem(`mz_${currentUserId}_ch_solved_${ch.id}`) === "true") ||
                    (!currentUserId && typeof window !== "undefined" && window.localStorage?.getItem(`mz_ch_solved_${ch.id}`) === "true");
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
                          borderBottom: "1px solid #f1f5f9",
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
                              #{ch.questionNumber || idx + 1}
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
                              style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                color: "#059669",
                                background: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                                padding: "3px 8px",
                                borderRadius: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <LuCircleCheck size={13} /> Solved
                            </span>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <TechBrandIcon type={ch.starterLanguage || "python"} size={16} />
                              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>
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
                            color: "#0f172a",
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
                            color: "#64748b",
                            lineHeight: 1.5,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {ch.description ? ch.description.slice(0, 110) + "..." : "Master algorithmic optimization and verify edge cases across automated test suites."}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "11.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                              <LuShieldCheck size={13} color="#2563eb" /> 10 Test Cases
                            </span>
                            <span style={{ fontSize: "11px", color: "#d97706", background: "#fef3c7", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>
                              +40 XP
                            </span>
                          </div>

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
                  );
                })
              )}
            </div>
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
                  placeholder="Search by title, topic, or instructor..."
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
                style={{
                  position: "relative",
                  borderRadius: "18px",
                  overflow: "hidden",
                  marginBottom: "22px",
                  cursor: "pointer",
                  minHeight: "260px",
                  background: "#090d16",
                  border: "1px solid #1e293b",
                  boxShadow: "0 12px 30px -5px rgba(0, 0, 0, 0.25)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <img
                  src={`https://img.youtube.com/vi/${filteredVideoCourses[0].youtubeId}/hqdefault.jpg`}
                  alt={filteredVideoCourses[0].title}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.38,
                    transition: "transform 0.4s ease",
                  }}
                  className="mz-c-spotlight-bg"
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(90deg, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.7) 50%, rgba(15, 23, 42, 0.2) 100%)",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "28px 32px",
                    maxWidth: "700px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        background: "#2563eb",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: "20px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <LuSparkles size={12} /> Spotlight Masterclass
                    </span>
                    <span
                      style={{
                        background: "rgba(255, 255, 255, 0.12)",
                        backdropFilter: "blur(4px)",
                        color: "#e2e8f0",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: "20px",
                      }}
                    >
                      <LuClock size={11} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                      {filteredVideoCourses[0].duration}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", margin: 0, lineHeight: 1.3 }}>
                    {filteredVideoCourses[0].title}
                  </h3>

                  <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
                    Taught by <strong style={{ color: "#f1f5f9" }}>{filteredVideoCourses[0].channelTitle}</strong> • {filteredVideoCourses[0].level} • {filteredVideoCourses[0].category}
                  </p>

                  <div style={{ marginTop: "4px" }}>
                    <button
                      type="button"
                      className="mz-c-btn-solve"
                      style={{
                        padding: "9px 20px",
                        fontSize: "13px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
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
                  12 Production-Grade Industry Engineering Projects
                </h2>
                <p className="mz-c-proj-cover-desc">
                  Architect and deploy end-to-end distributed systems, real-time WebSockets engines, microservices APIs, and high-frequency order books with milestone-by-milestone guided verification.
                </p>

                {/* Interactive Domain Filter Chips inside Cover */}
                <div className="mz-c-proj-cover-filter-row">
                  <span className="mz-c-proj-filter-label">Filter Labs:</span>
                  {[
                    { id: "all", label: "All Projects (12)" },
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
                  <div className="mz-c-proj-stat-num">12</div>
                  <div className="mz-c-proj-stat-sub">Production Grade</div>
                </div>
                <div className="mz-c-proj-stat-box">
                  <div className="mz-c-proj-stat-label">Completed</div>
                  <div className="mz-c-proj-stat-num" style={{ color: "#4ade80" }}>
                    {projects.filter((p) => p.userState?.passed).length}
                  </div>
                  <div className="mz-c-proj-stat-sub">Verified</div>
                </div>
                <div className="mz-c-proj-stat-box">
                  <div className="mz-c-proj-stat-label">Max Reward</div>
                  <div className="mz-c-proj-stat-num" style={{ color: "#38bdf8" }}>+3,600</div>
                  <div className="mz-c-proj-stat-sub">Total XP</div>
                </div>
              </div>
            </div>

            {/* 12 Projects Grid (Blue line above slides removed) */}
            <div className="mz-c-projects-grid">
              {filteredProjects.map((proj) => {
                const isDone = Boolean(
                  proj.userState?.passed ||
                  proj.userState?.status === "PASSED" ||
                  proj.userState?.status === "passed" ||
                  (currentUserId && typeof window !== "undefined" && window.localStorage?.getItem(`mz_${currentUserId}_proj_passed_${proj.id}`) === "true")
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
                            <span className="mz-c-proj-completed-badge">
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
                          {isDone ? "✓ All Milestones Verified" : `${milestonesList.length} Guided Milestones`}
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
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 5: STUDY GROUPS TAB (Interactive Cover Page & Collaborative Live Pods) ── */}
        {activeTab === "study_groups" && (
          <div className="mz-c-study-groups-view mz-c-grid-anim">
            {/* 1. Hero Cover Banner */}
            <div className="mz-c-study-cover-hero">
              <div className="mz-c-study-cover-hero-top">
                <div className="mz-c-study-badges-row">
                  <span className="mz-c-study-live-indicator">
                    <span className="mz-c-live-pulse-dot" /> Live Collaborative Rooms Active
                  </span>
                  <span className="mz-c-study-tech-badge">
                    <LuSparkles size={13} /> WebRTC P2P • Monaco Dual IDE • Infinite Whiteboard
                  </span>
                </div>
                <h2 className="mz-c-study-cover-title">Real-Time Collaborative Coding Pods & Study Rooms</h2>
                <p className="mz-c-study-cover-desc">
                  Step into synchronized live rooms engineered for high-performance software developers. Pair-program with zero latency, dissect algorithmic challenges together, diagram distributed systems on an infinite whiteboard, and conduct realistic FAANG technical mock interviews.
                </p>
              </div>

              {/* Quick Actions Console */}
              <div className="mz-c-study-cover-actions">
                <button
                  type="button"
                  className="mz-c-btn-start-meeting"
                  onClick={() => navigate("/live")}
                  title="Start Meeting"
                >
                  <LuVideo size={16} />
                  <span>Start Meeting</span>
                </button>

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

            {/* 2. Real-Time Capability Highlights */}
            <div className="mz-c-study-pillars-grid">
              <div className="mz-c-study-pillar-card">
                <div className="mz-c-pillar-icon-wrap" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                  <LuVideo size={22} />
                </div>
                <h4 className="mz-c-pillar-title">WebRTC Audio & HD Video</h4>
                <p className="mz-c-pillar-desc">
                  Low-latency peer-to-peer audio mesh, crisp camera feeds, and 60 FPS full-screen code streaming for peer reviews.
                </p>
              </div>

              <div className="mz-c-study-pillar-card">
                <div className="mz-c-pillar-icon-wrap" style={{ background: "rgba(14, 165, 233, 0.1)", color: "#0284c7" }}>
                  <LuTerminal size={22} />
                </div>
                <h4 className="mz-c-pillar-title">Synchronized Monaco IDE</h4>
                <p className="mz-c-pillar-desc">
                  Multi-cursor real-time code editor with integrated compiler support for Python, C++, Java, JavaScript, and Go.
                </p>
              </div>

              <div className="mz-c-study-pillar-card">
                <div className="mz-c-pillar-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
                  <LuPenTool size={22} />
                </div>
                <h4 className="mz-c-pillar-title">Infinite System Whiteboard</h4>
                <p className="mz-c-pillar-desc">
                  Collaborative vector canvas for sketching data structure pointers, database schemas, and microservice architectures.
                </p>
              </div>

              <div className="mz-c-study-pillar-card">
                <div className="mz-c-pillar-icon-wrap" style={{ background: "rgba(147, 51, 234, 0.1)", color: "#9333ea" }}>
                  <LuSparkles size={22} />
                </div>
                <h4 className="mz-c-pillar-title">Session Cloud Sync</h4>
                <p className="mz-c-pillar-desc">
                  Export session code snippets, download whiteboard architectural diagrams, and share room transcripts post-meeting.
                </p>
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
                    border: isVisited ? "1.5px solid #10b981" : "1px solid #e2e8f0",
                    background: "#ffffff",
                    boxShadow: isVisited
                      ? "0 8px 24px -4px rgba(16, 185, 129, 0.14), 0 2px 6px rgba(15, 23, 42, 0.04)"
                      : "0 2px 8px rgba(15, 23, 42, 0.04)",
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
                        <span style={{ fontSize: "12px", fontWeight: 700, color: isVisited ? "#059669" : "#64748b" }}>{resItem.category}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {resItem.official && (
                          <span style={{ fontSize: "10.5px", fontWeight: 800, padding: "2px 7px", borderRadius: "10px", background: "#ecfeff", color: "#0891b2" }}>
                            OFFICIAL DOCS
                          </span>
                        )}
                        {isVisited && (
                          <span
                            className="mz-c-card-completed-badge mz-c-badge-visited"
                            style={{
                              background: "#ecfdf5",
                              color: "#059669",
                              border: "1px solid #a7f3d0",
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
                    <h3 style={{ margin: "0 0 8px", fontSize: "16.5px", fontWeight: 800, color: "#0f172a", lineHeight: 1.35 }}>
                      {resItem.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: 1.55 }}>
                      {resItem.description}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "11.5px", color: isVisited ? "#059669" : "#64748b", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                      {isVisited ? "✓ Reference Explored" : "Reference Manual"}
                    </span>
                    <span style={{ color: isVisited ? "#059669" : "#2563eb", fontSize: "12.5px", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
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
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #1e3a8a 100%)",
                borderRadius: "20px",
                padding: "32px 36px",
                color: "#ffffff",
                marginBottom: "32px",
                boxShadow: "0 12px 36px rgba(15, 23, 42, 0.25)",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(212, 175, 55, 0.3)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -60,
                  right: -60,
                  width: "240px",
                  height: "240px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(212, 175, 55, 0) 70%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(212, 175, 55, 0.18)", border: "1px solid #d4af37", padding: "4px 12px", borderRadius: "9999px", marginBottom: "14px" }}>
                  <span style={{ color: "#fbbf24", fontSize: "13px" }}>★</span>
                  <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#fef08a", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Official Accredited Examination Suite
                  </span>
                </div>
                <h1 style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 10px", color: "#ffffff", letterSpacing: "-0.02em" }}>
                  Mastery Zone Professional Certifications
                </h1>
                <p style={{ margin: "0 0 24px", fontSize: "14.5px", color: "#cbd5e1", maxWidth: "780px", lineHeight: 1.6 }}>
                  Take rigorous, proctored examinations designed to evaluate true engineering competence. Pass 20 MCQs and 2 live algorithmic coding challenges to receive official cryptographic credentials signed by Founder Yashash.
                </p>

                {/* Key Metrics Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginTop: "12px" }}>
                  <div style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(8px)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                    <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Pass Benchmark</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#4ade80", marginTop: "4px" }}>80% Required</div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(8px)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                    <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Proctoring Standard</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#60a5fa", marginTop: "4px" }}>Strict (5 Lives)</div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(8px)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                    <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Time Allowed</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#fef08a", marginTop: "4px" }}>90 Minutes</div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(8px)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                    <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Earned Credentials</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#c084fc", marginTop: "4px" }}>{earnedCertificates.length} Issued</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated My Earned Certificates Section */}
            <div style={{ marginBottom: "40px" }} data-testid="coding-my-certificates-section">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🏆</span> My Earned Certificates ({earnedCertificates.length})
                  </h2>
                  <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b" }}>
                    Official verified Coursera-style credentials signed by Founder Yashash
                  </p>
                </div>
              </div>

              {earnedCertificates.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                  {earnedCertificates.map((cert) => (
                    <div
                      key={cert.certificateId}
                      style={{
                        background: "linear-gradient(180deg, #ffffff 0%, #fffdf8 100%)",
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
                          <span style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669", border: "1px solid #10b981", fontSize: "11px", fontWeight: 800, padding: "3px 9px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <LuShieldCheck size={13} /> VERIFIED CREDENTIAL
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                            {cert.certificateId}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "17.5px", fontWeight: 800, color: "#0f172a", margin: "6px 0 4px" }}>
                          {cert.certTitle || "Professional Certification"}
                        </h3>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 14px", lineHeight: 1.5 }}>
                          Recipient: <strong style={{ color: "#0f172a" }}>{cert.fullName || currentUser?.fullName || currentUser?.name || "Yashash"}</strong> • Grade: <strong style={{ color: "#059669" }}>{cert.grade || "A+"}</strong> ({cert.score || 95}%)
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="mz-c-btn-solve"
                          style={{ flex: 1, minWidth: "100px", padding: "8px 12px", fontSize: "12px", justifyContent: "center", background: "#2563eb", color: "#ffffff", borderRadius: "8px" }}
                          onClick={() => window.open(`${API_BASE}/api/certifications/download/${cert.certificateId}`, "_blank")}
                        >
                          <LuDownload size={13} /> Download PDF
                        </button>
                        <button
                          type="button"
                          className="mz-c-btn-solve"
                          style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1", padding: "8px 12px", fontSize: "12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "5px" }}
                          onClick={() => window.open(`/certification/verify/${cert.certificateId}`, "_blank", "noopener,noreferrer")}
                        >
                          <LuExternalLink size={13} /> Verify
                        </button>
                        <button
                          type="button"
                          className="mz-c-btn-solve"
                          style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "8px 12px", fontSize: "12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "5px", fontWeight: 700 }}
                          onClick={() => window.open(`/assessment-report/${cert.attemptId || cert.certificateId}`, "_blank", "noopener,noreferrer")}
                        >
                          <LuAward size={13} /> View Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "32px 24px", background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)", borderRadius: "16px", border: "1.5px dashed #cbd5e1", textAlign: "center" }}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>📜</div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                    No Earned Credentials Yet
                  </h3>
                  <p style={{ margin: "0 auto 12px", fontSize: "13.5px", color: "#64748b", maxWidth: "560px" }}>
                    Choose an official track below and complete the proctored assessment. Score ≥80% to earn your cryptographic credential and showcase it on LinkedIn.
                  </p>
                  <div style={{ display: "inline-flex", gap: "16px", fontSize: "12px", color: "#475569", fontWeight: 600 }}>
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
                <h3 style={{ fontSize: "19px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Available Professional Certification Examinations
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>
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
                      border: certFilterCategory === cat.id ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                      background: certFilterCategory === cat.id ? "#eff6ff" : "#ffffff",
                      color: certFilterCategory === cat.id ? "#1d4ed8" : "#475569",
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
                        border: isCompleted ? "2px solid #22c55e" : "1px solid #e2e8f0",
                        background: isCompleted ? "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)" : "#ffffff",
                        boxShadow: isCompleted
                          ? "0 6px 20px rgba(34, 197, 94, 0.12)"
                          : "0 4px 16px rgba(15, 23, 42, 0.05)",
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
                            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", padding: "2px 8px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}>
                              {certItem.language.toUpperCase()}
                            </span>
                          </div>
                          {isCompleted ? (
                            <span style={{ fontSize: "11px", fontWeight: 800, padding: "3px 9px", borderRadius: "10px", background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <LuCircleCheck size={13} /> COMPLETED
                            </span>
                          ) : (
                            <span style={{ fontSize: "11px", fontWeight: 800, padding: "3px 9px", borderRadius: "10px", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                              OFFICIAL CERT
                            </span>
                          )}
                        </div>

                        <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                          {certItem.title}
                        </h3>
                        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
                          {certItem.desc}
                        </p>

                        {/* Completed Banner */}
                        {isCompleted && (
                          <div
                            style={{
                              background: "#dcfce7",
                              border: "1.5px solid #86efac",
                              borderRadius: "10px",
                              padding: "10px 12px",
                              marginBottom: "14px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 800, fontSize: "12.5px" }}>
                              <span>🏆</span> Cutoff Cleared (≥80%) • Certificate Awarded
                            </div>
                            {certStatus.certificateId && (
                              <div style={{ fontSize: "11.5px", color: "#15803d", fontFamily: "monospace", marginTop: "3px", fontWeight: 600 }}>
                                Credential ID: {certStatus.certificateId}
                              </div>
                            )}
                            <div style={{ fontSize: "11px", color: "#166534", marginTop: "2px", fontWeight: 600 }}>
                              ✓ Examination completed. Retaking is locked.
                            </div>
                          </div>
                        )}

                        {/* Skills Chips */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                          {certItem.skills.map((sk, sIdx) => (
                            <span key={sIdx} style={{ fontSize: "11px", background: "#f1f5f9", color: "#334155", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                              {sk}
                            </span>
                          ))}
                        </div>

                        {/* Exam Specs Box */}
                        <div style={{ fontSize: "12px", color: "#334155", background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "6px" }}>
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
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  border: "1px solid #bfdbfe",
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
                              color: "#64748b",
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
                                  background: "#fef2f2",
                                  border: "1px solid #fecaca",
                                  borderRadius: "10px",
                                  padding: "8px 12px",
                                  marginTop: "12px",
                                  fontSize: "12px",
                                  color: "#991b1b",
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
      )}

      {/* Project Workspace Modal (Fallback Fixed Overlay) */}
      {selectedProjectModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0b0f19", overflowY: "auto" }}>
          <ProjectWorkspaceModal
            project={selectedProjectModal}
            onClose={() => setSelectedProjectModal(null)}
            onProjectStateUpdated={() => {
              fetchDashboardData();
            }}
          />
        </div>
      )}

      {/* Certification Exam Workspace */}
      {selectedExamWorkspace && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#ffffff" }}>
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
      {selectedModuleChoice && (
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
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "680px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              animation: "mzChoiceModalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Modal Top Header */}
            <div
              style={{
                padding: "22px 24px 18px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
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
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #dbeafe",
                      }}
                    >
                      Module {String(typeof selectedModuleChoice.moduleIndex === "number" ? selectedModuleChoice.moduleIndex + 1 : 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                      {activeTrack.title || "Curriculum Track"}
                    </span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                    {selectedModuleChoice.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedModuleChoice(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                  transition: "all 0.15s ease",
                }}
                aria-label="Close dialog"
              >
                <LuX size={16} />
              </button>
            </div>

            {/* Confirmation Subtitle Banner */}
            <div style={{ padding: "14px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>
                Select the learning mode you wish to proceed with. Practical coding and the 10-MCQ assessment unlock strictly after prerequisite completion.
              </p>
            </div>

            {/* 3 Pathway Choice Options */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* OPTION 1: Learning Module (Theory & Concept) */}
              <div
                className="mz-c-pathway-option active-pathway"
                onClick={() => {
                  const mod = selectedModuleChoice;
                  setSelectedModuleChoice(null);
                  const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : 0;
                  window.open(`/concept-learning/${activeTrackId}/${mIdx}`, "_blank", "noopener,noreferrer");
                }}
                style={{
                  border: "1.5px solid #2563eb",
                  background: "#f0f7ff",
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
                      background: "#dbeafe",
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
                      <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#1e3a8a" }}>
                        1. Learning Module
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 7px",
                          borderRadius: "9999px",
                          background: selectedModuleChoice.isStudied ? "#d1fae5" : "#eff6ff",
                          color: selectedModuleChoice.isStudied ? "#065f46" : "#1d4ed8",
                          border: selectedModuleChoice.isStudied ? "1px solid #a7f3d0" : "1px solid #bfdbfe",
                        }}
                      >
                        {selectedModuleChoice.isStudied ? "✓ Completed" : "Unlocked & Ready"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", lineHeight: 1.4 }}>
                      In-depth concept mastery, syntax breakdown, annotated code examples, and study notes.
                    </p>
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
                  {selectedModuleChoice.isStudied ? "Review Lesson" : "Start Learning"} <LuArrowRight size={13} />
                </button>
              </div>

              {/* OPTION 2: Practical Coding Test (Locked if !isStudied) */}
              {(() => {
                const isUnlocked = Boolean(selectedModuleChoice.isStudied);
                const isPassed = Boolean(selectedModuleChoice.assignmentPassed || selectedModuleChoice.exercisePassed);

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
                      const mod = selectedModuleChoice;
                      setSelectedModuleChoice(null);
                      const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : 0;
                      window.open(`/coding-test/${activeTrackId}/${mIdx}`, "_blank", "noopener,noreferrer");
                    }}
                    style={{
                      border: isUnlocked ? (isPassed ? "1px solid #a7f3d0" : "1.5px solid #3b82f6") : "1px solid #e2e8f0",
                      background: isUnlocked ? (isPassed ? "#f0fdf4" : "#ffffff") : "#f8fafc",
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
                          background: isUnlocked ? (isPassed ? "#dcfce7" : "#eff6ff") : "#e2e8f0",
                          color: isUnlocked ? (isPassed ? "#15803d" : "#2563eb") : "#94a3b8",
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
                          <span style={{ fontSize: "14.5px", fontWeight: 700, color: isUnlocked ? "#0f172a" : "#64748b" }}>
                            2. Practical Coding Test
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "2px 7px",
                              borderRadius: "9999px",
                              background: isPassed ? "#d1fae5" : isUnlocked ? "#eff6ff" : "#f1f5f9",
                              color: isPassed ? "#065f46" : isUnlocked ? "#1d4ed8" : "#64748b",
                              border: isPassed ? "1px solid #a7f3d0" : isUnlocked ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
                            }}
                          >
                            {isPassed ? "✓ Passed (100%)" : isUnlocked ? "Unlocked & Ready" : "🔒 Locked"}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b", lineHeight: 1.4 }}>
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
                        background: isUnlocked ? (isPassed ? "#059669" : "#2563eb") : "#e2e8f0",
                        color: isUnlocked ? "#ffffff" : "#94a3b8",
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
                const isStudyDone = Boolean(selectedModuleChoice.isStudied);
                const isCodingDone = Boolean(selectedModuleChoice.assignmentPassed || selectedModuleChoice.exercisePassed);
                const isUnlocked = isStudyDone && isCodingDone;
                const isPassed = Boolean(selectedModuleChoice.assessmentPassed);

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
                      const mod = selectedModuleChoice;
                      setSelectedModuleChoice(null);
                      const mIdx = typeof mod.moduleIndex === "number" ? mod.moduleIndex : 0;
                      window.open(`/proctored-assessment/${activeTrackId}/${mIdx}`, "_blank", "noopener,noreferrer");
                    }}
                    style={{
                      border: isUnlocked ? (isPassed ? "1px solid #a7f3d0" : "1.5px solid #3b82f6") : "1px solid #e2e8f0",
                      background: isUnlocked ? (isPassed ? "#f0fdf4" : "#ffffff") : "#f8fafc",
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
                          background: isUnlocked ? (isPassed ? "#dcfce7" : "#eff6ff") : "#e2e8f0",
                          color: isUnlocked ? (isPassed ? "#15803d" : "#2563eb") : "#94a3b8",
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
                          <span style={{ fontSize: "14.5px", fontWeight: 700, color: isUnlocked ? "#0f172a" : "#64748b" }}>
                            3. Proctored 10-MCQ Exam
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "2px 7px",
                              borderRadius: "9999px",
                              background: isPassed ? "#d1fae5" : isUnlocked ? "#eff6ff" : "#f1f5f9",
                              color: isPassed ? "#065f46" : isUnlocked ? "#1d4ed8" : "#64748b",
                              border: isPassed ? "1px solid #a7f3d0" : isUnlocked ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
                            }}
                          >
                            {isPassed
                              ? `✓ Passed (${selectedModuleChoice.bestScore || 100}%)`
                              : isUnlocked
                              ? "Unlocked & Ready"
                              : "🔒 Locked"}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b", lineHeight: 1.4 }}>
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
                        background: isUnlocked ? (isPassed ? "#059669" : "#2563eb") : "#e2e8f0",
                        color: isUnlocked ? "#ffffff" : "#94a3b8",
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
                      {isUnlocked ? (isPassed ? "Review Exam" : "Take Assessment") : "🔒 Locked"}{" "}
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
                background: "#f8fafc",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                <LuClock size={13} /> Estimated: {selectedModuleChoice.estimatedTime || "45m"} for all 3 steps
              </span>
              <button
                type="button"
                onClick={() => setSelectedModuleChoice(null)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
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
        <FullScreenConceptLearning
          module={activeStudyModule}
          subjectKey="coding"
          trackId={activeTrackId}
          onClose={() => setActiveStudyModule(null)}
          onComplete={(completedMod) => handleFinishStudy(completedMod)}
        />
      )}

      {/* MODAL 2: Practical Coding Test with Monaco IDE (Step 2) */}
      {activeAssignmentModule && (
        <PracticalAssignmentModal
          module={activeAssignmentModule}
          subjectKey="coding"
          trackId={activeTrackId}
          onClose={() => setActiveAssignmentModule(null)}
          onAssignmentPassed={() => {
            fetchCurriculum(activeTrackId);
            fetchDashboardData();
          }}
          onLaunchAssessment={(mod) => {
            setActiveAssignmentModule(null);
            setActiveAssessmentModule(mod);
          }}
        />
      )}

      {/* MODAL 3: 5-Step Proctored 10-MCQ Exam with Security Gate (Step 3) */}
      {activeAssessmentModule && (
        <ProctoredAssessmentWorkspace
          module={activeAssessmentModule}
          subjectKey="coding"
          trackId={activeTrackId}
          onClose={() => setActiveAssessmentModule(null)}
          onAssessmentCompleted={() => {
            fetchCurriculum(activeTrackId);
            fetchDashboardData();
          }}
        />
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
