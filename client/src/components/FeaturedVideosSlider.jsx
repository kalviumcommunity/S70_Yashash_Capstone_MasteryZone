import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { deduplicatedFetch } from "../utils/apiClient";
import {
  LuPlay,
  LuChevronLeft,
  LuChevronRight,
  LuArrowRight,
  LuX,
  LuClock,
  LuSparkles,
  LuCircleCheck,
  LuTv,
  LuSlidersHorizontal,
} from "react-icons/lu";
import "./FeaturedVideosSlider.css";

// TechBrandIcon component self-contained for video tags
export const TechBrandIcon = ({ type, size = 18, className = "" }) => {
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
};

const API_BASE = import.meta.env.VITE_API_URL || "";

// Default verified masterclasses from world-renowned educators
export const DEFAULT_FEATURED_VIDEOS = [
  {
    id: "vid_py_mosh",
    youtubeId: "_uQrJ0TkZlc",
    title: "Python Tutorial for Beginners - Full Course [2024]",
    channelTitle: "Programming with Mosh",
    duration: "6h 14m",
    durationSec: 22440,
    level: "Beginner",
    language: "python",
    category: "Python",
    topics: ["Variables & Expressions", "Control Flow", "Data Structures", "OOP & Classes", "Modules & Pip"],
    verified: true,
  },
  {
    id: "vid_py_fcc",
    youtubeId: "rfscVS0vtbw",
    title: "Python for Beginners - Full Course",
    channelTitle: "freeCodeCamp.org",
    duration: "4hr 26 min",
    durationSec: 15960,
    level: "Beginner to Intermediate",
    language: "python",
    category: "Python",
    topics: ["Syntax", "Lists & Tuples", "Functions", "File I/O", "Building 4 Projects"],
    verified: true,
  },
  {
    id: "vid_js_mosh",
    youtubeId: "W6NZfCO5SIk",
    title: "JavaScript Tutorial for Beginners: Learn JavaScript in 1 Hour",
    channelTitle: "Programming with Mosh",
    duration: "48m 16s",
    durationSec: 2896,
    level: "Beginner",
    language: "javascript",
    category: "JavaScript",
    topics: ["Variables & Constants", "Primitives & Dynamic Typing", "Objects & Arrays", "Functions"],
    verified: true,
  },
  {
    id: "vid_js_fcc",
    youtubeId: "PkZNo7MFNFg",
    title: "Learn JavaScript - Full Course for Beginners",
    channelTitle: "freeCodeCamp.org",
    duration: "3h 26m",
    durationSec: 12360,
    level: "Beginner",
    language: "javascript",
    category: "JavaScript",
    topics: ["Basic JS", "ES6 Features", "Regex", "Object-Oriented JS", "Functional Programming"],
    verified: true,
  },
  {
    id: "vid_java_mosh",
    youtubeId: "eIrMbAQSU34",
    title: "Java Tutorial for Beginners - Full Course",
    channelTitle: "Programming with Mosh",
    duration: "2h 30m",
    durationSec: 9000,
    level: "Beginner",
    language: "java",
    category: "Java",
    topics: ["Variables & Types", "Arrays & Memory", "Methods & Clean Code", "Control Flow"],
    verified: true,
  },
  {
    id: "vid_java_bro",
    youtubeId: "A74TOX803D0",
    title: "Java Full Course for free ☕",
    channelTitle: "Bro Code",
    duration: "4hr 11min",
    durationSec: 15060,
    level: "Beginner to Advanced",
    language: "java",
    category: "Java",
    topics: ["OOP", "Inheritance & Polymorphism", "Interfaces", "Generics", "GUI / Swing"],
    verified: true,
  },
  {
    id: "vid_cpp_fcc",
    youtubeId: "-TkoO8Z07hI",
    title: "C++ Tutorial for Beginners - Full Course",
    channelTitle: "freeCodeCamp.org",
    duration: "6hr",
    durationSec: 21600,
    level: "Beginner",
    language: "cpp",
    category: "C++",
    topics: ["Data Types", "Pointers & References", "Classes & Constructors", "Getters & Setters"],
    verified: true,
  },
  {
    id: "vid_cpp_bro",
    youtubeId: "vLnPwxZdW4Y",
    title: "C++ Full Course for Beginners 💻",
    channelTitle: "Bro Code",
    duration: "4 hr 1min",
    durationSec: 14460,
    level: "Beginner",
    language: "cpp",
    category: "C++",
    topics: ["Memory Models", "References & Pointers", "Dynamic Memory", "Recursion", "Function Templates"],
    verified: true,
  },
  {
    id: "vid_dsa_fcc",
    youtubeId: "8hly31xKli0",
    title: "Data Structures Easy to Advanced Course - Full Tutorial",
    channelTitle: "freeCodeCamp.org",
    duration: "8hr 03min",
    durationSec: 28980,
    level: "Intermediate",
    language: "dsa",
    category: "DSA",
    topics: ["Dynamic Arrays", "Linked Lists", "Stack & Queue", "Binary Search Trees", "Hash Tables", "Fenwick Trees"],
    verified: true,
  },
  {
    id: "vid_react_fcc",
    youtubeId: "bMknfKXIFA8",
    title: "React Course - Beginner's Tutorial for React JavaScript",
    channelTitle: "freeCodeCamp.org",
    duration: "11h 55m",
    durationSec: 42900,
    level: "Intermediate",
    language: "javascript",
    category: "Web Development",
    topics: ["JSX", "Components & Props", "State & Effects", "Custom Hooks", "Building 4 Apps"],
    verified: true,
  },
  {
    id: "vid_ts_fcc",
    youtubeId: "BwuLxPH8IDs",
    title: "TypeScript Course for Beginners 2024 - Learn TypeScript from Scratch",
    channelTitle: "freeCodeCamp.org",
    duration: "5h 12m",
    durationSec: 18720,
    level: "Intermediate",
    language: "typescript",
    category: "TypeScript",
    topics: ["Static Types", "Interfaces & Type Aliases", "Generics", "Type Narrowing", "Decorators"],
    verified: true,
  },
  {
    id: "vid_node_fcc",
    youtubeId: "Oe421EPjeBE",
    title: "Node.js and Express.js - Full Course for Beginners",
    channelTitle: "freeCodeCamp.org",
    duration: "8h 16m",
    durationSec: 29760,
    level: "Intermediate",
    language: "javascript",
    category: "Backend & APIs",
    topics: ["Event Loop", "Streams & Buffers", "Express Middleware", "REST APIs", "JWT Authentication"],
    verified: true,
  },
  {
    id: "vid_sql_mosh",
    youtubeId: "7S_tz1z_5bA",
    title: "SQL Tutorial for Beginners [Full Course]",
    channelTitle: "Programming with Mosh",
    duration: "4h 18m",
    durationSec: 15480,
    level: "Beginner to Intermediate",
    language: "sql",
    category: "Databases",
    topics: ["SELECT & WHERE", "JOINs & Unions", "Aggregate Functions", "Transactions & ACID", "Database Design"],
    verified: true,
  },
  {
    id: "vid_docker_fcc",
    youtubeId: "fqMOX6JJhGo",
    title: "Docker Tutorial for Beginners - Full Course",
    channelTitle: "freeCodeCamp.org",
    duration: "2h 10m",
    durationSec: 7800,
    level: "Beginner to Intermediate",
    language: "devops",
    category: "DevOps & Cloud",
    topics: ["Containers vs VMs", "Dockerfiles", "Port Mapping", "Docker Compose", "Multi-Stage Builds"],
    verified: true,
  },
  {
    id: "vid_git_colt",
    youtubeId: "RGOj5yH7evk",
    title: "Git and GitHub for Beginners - Crash Course",
    channelTitle: "freeCodeCamp.org",
    duration: "1h 08m",
    durationSec: 4080,
    level: "Beginner",
    language: "git",
    category: "Tools & DevOps",
    topics: ["Git Init & Commits", "Branching & Merging", "Merge Conflicts", "Remote Repos", "Pull Requests"],
    verified: true,
  },
  {
    id: "vid_nextjs_fcc",
    youtubeId: "wm5gMKuwSYk",
    title: "Next.js 14 Full Course 2024 - Server Components & Actions",
    channelTitle: "JavaScript Mastery",
    duration: "5h 27m",
    durationSec: 19620,
    level: "Intermediate",
    language: "javascript",
    category: "Web Development",
    topics: ["App Router", "Server Components", "Server Actions", "Route Handlers", "Deployment"],
    verified: true,
  },
  {
    id: "vid_sysdesign_fcc",
    youtubeId: "m8Icp_Cid5o",
    title: "System Design for Beginners - Full Course",
    channelTitle: "freeCodeCamp.org",
    duration: "5h 33m",
    durationSec: 19980,
    level: "Advanced",
    language: "dsa",
    category: "System Design",
    topics: ["Scalability & Latency", "Load Balancers", "Caching Strategies", "Sharding & Replication", "Microservices"],
    verified: true,
  },
  {
    id: "vid_dsa_neetcode",
    youtubeId: "0IAPZzGSbME",
    title: "Data Structures and Algorithms for Beginners - Visual Guide",
    channelTitle: "NeetCode",
    duration: "4h 45m",
    durationSec: 17100,
    level: "Intermediate",
    language: "python",
    category: "Algorithms",
    topics: ["Arrays & HashMaps", "Two Pointers", "Sliding Window", "Trees & Graphs", "Dynamic Programming"],
    verified: true,
  },
  {
    id: "vid_go_fcc",
    youtubeId: "un6ZyFkqFKo",
    title: "Go Programming Language - Full Course for Beginners",
    channelTitle: "freeCodeCamp.org",
    duration: "6h 34m",
    durationSec: 23640,
    level: "Beginner to Intermediate",
    language: "go",
    category: "Backend & Systems",
    topics: ["Go Routines & Channels", "Interfaces & Structs", "Pointers", "Error Handling", "Web Servers"],
    verified: true,
  },
];

export default function FeaturedVideosSlider({
  videos,
  title = "Featured Video Courses",
  subtitle = "Curated full-length masterclasses with embedded learning notes and verified code runner",
  viewAllUrl = "/coding",
  onViewAll,
  onPracticeInLearningPath,
  className = "",
}) {
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  const [rawVideos, setRawVideos] = useState(videos || DEFAULT_FEATURED_VIDEOS);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mouse Drag to Scroll State
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Synchronize videos from parent prop or fall back to default curated catalog
  useEffect(() => {
    if (videos && videos.length > 0) {
      setRawVideos(videos);
    } else if (DEFAULT_FEATURED_VIDEOS && DEFAULT_FEATURED_VIDEOS.length > 0) {
      setRawVideos(DEFAULT_FEATURED_VIDEOS);
    }
  }, [videos]);

  // Filter categories
  const categories = useMemo(() => {
    return [
      { key: "all", label: "All Courses", icon: <LuTv size={13} /> },
      { key: "python", label: "Python", icon: <TechBrandIcon type="python" size={13} /> },
      { key: "javascript", label: "JavaScript", icon: <TechBrandIcon type="javascript" size={13} /> },
      { key: "java", label: "Java", icon: <TechBrandIcon type="java" size={13} /> },
      { key: "cpp", label: "C++", icon: <TechBrandIcon type="cpp" size={13} /> },
      { key: "dsa", label: "Algorithms", icon: <TechBrandIcon type="dsa" size={13} /> },
    ];
  }, []);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === "all") return rawVideos;
    return rawVideos.filter((v) => {
      const lang = (v.language || "").toLowerCase();
      const cat = (v.category || "").toLowerCase();
      if (selectedCategory === "dsa") {
        return lang === "dsa" || cat.includes("algo") || cat.includes("dsa");
      }
      return lang.includes(selectedCategory) || cat.includes(selectedCategory);
    });
  }, [rawVideos, selectedCategory]);

  // Update scroll navigation buttons & progress
  const updateScrollState = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
    } else {
      setScrollProgress(0);
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [filteredVideos, updateScrollState]);

  const handleScroll = (direction) => {
    const el = sliderRef.current;
    if (!el) return;
    const scrollAmount = direction === "left" ? -380 : 380;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Drag-to-scroll & Flow wave cursor handlers
  const waveRafRef = useRef(null);

  const handleMouseDown = (e) => {
    const el = sliderRef.current;
    if (!el) return;
    isDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleTrackMouseMove = useCallback((e) => {
    // 1. Drag-to-scroll if mouse is pressed
    if (isDownRef.current) {
      e.preventDefault();
      const el = sliderRef.current;
      if (!el) return;
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startXRef.current) * 1.6;
      if (Math.abs(walk) > 4) {
        hasMovedRef.current = true;
      }
      el.scrollLeft = scrollLeftRef.current - walk;
      updateScrollState();
    }

    // 2. Fluid harmonic wave effect when sliding cursor left & right
    if (waveRafRef.current) cancelAnimationFrame(waveRafRef.current);
    waveRafRef.current = requestAnimationFrame(() => {
      const track = sliderRef.current;
      if (!track) return;
      const cursorX = e.clientX;
      const cards = track.querySelectorAll(".fvs-card");
      const radius = 340; // Wave reach in pixels

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const dist = Math.abs(cursorX - cardCenterX);

        if (dist < radius) {
          const factor = 1 - dist / radius;
          // Smooth sinusoidal wave displacement
          const wave = Math.sin((factor * Math.PI) / 2);
          const lift = wave * 14; // up to 14px wave elevation
          const scale = 1 + wave * 0.026; // gentle magnification wave
          const glow = wave * 0.45;
          card.style.setProperty("--wave-y", `-${lift.toFixed(1)}px`);
          card.style.setProperty("--wave-scale", `${scale.toFixed(3)}`);
          card.style.setProperty("--wave-glow", `${glow.toFixed(2)}`);
        } else {
          card.style.setProperty("--wave-y", "0px");
          card.style.setProperty("--wave-scale", "1");
          card.style.setProperty("--wave-glow", "0");
        }
      });
    });
  }, [updateScrollState]);

  const handleTrackMouseLeave = useCallback(() => {
    isDownRef.current = false;
    if (waveRafRef.current) cancelAnimationFrame(waveRafRef.current);
    const track = sliderRef.current;
    if (!track) return;
    const cards = track.querySelectorAll(".fvs-card");
    cards.forEach((card) => {
      card.style.setProperty("--wave-y", "0px");
      card.style.setProperty("--wave-scale", "1");
      card.style.setProperty("--wave-glow", "0");
    });
  }, []);

  const handleCardClick = (course) => {
    if (hasMovedRef.current) return;
    setActiveVideoModal(course);
  };

  const handleViewAllClick = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate(viewAllUrl);
    }
  };

  return (
    <section className={`fvs-container ${className}`} aria-label={title}>
      {/* Header with Title, Category Pills & Navigation Buttons */}
      <div className="fvs-header">
        <div className="fvs-header-left">
          <div className="fvs-circle-icon fvs-color-purple">
            <LuPlay size={18} fill="currentColor" />
          </div>
          <div>
            <div className="fvs-heading-row">
              <h3 className="fvs-title">{title}</h3>
              <span className="fvs-count-pill">{filteredVideos.length} Courses</span>
            </div>
            <p className="fvs-subtitle">{subtitle}</p>
          </div>
        </div>

        {/* Slider Controls */}
        <div className="fvs-header-controls">
          <button
            type="button"
            className={`fvs-nav-btn ${!canScrollLeft ? "disabled" : ""}`}
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll video courses left"
            title="Previous videos"
          >
            <LuChevronLeft size={18} />
          </button>

          <button
            type="button"
            className={`fvs-nav-btn ${!canScrollRight ? "disabled" : ""}`}
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll video courses right"
            title="Next videos"
          >
            <LuChevronRight size={18} />
          </button>

          <button
            type="button"
            className="fvs-view-all-btn"
            onClick={handleViewAllClick}
            title="Explore full video library"
          >
            <span>View All Courses</span>
            <LuArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="fvs-category-pills" role="tablist">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            role="tab"
            aria-selected={selectedCategory === cat.key}
            className={`fvs-filter-pill ${selectedCategory === cat.key ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Horizontal Carousel Track */}
      <div
        className="fvs-slider-track"
        ref={sliderRef}
        onScroll={updateScrollState}
        onMouseDown={handleMouseDown}
        onMouseMove={handleTrackMouseMove}
        onMouseUp={handleTrackMouseLeave}
        onMouseLeave={handleTrackMouseLeave}
      >
        {filteredVideos.map((course, idx) => (
          <div
            key={course.id}
            className="fvs-card"
            style={{ animationDelay: `${idx * 0.04}s` }}
            onClick={() => handleCardClick(course)}
            role="button"
            tabIndex={0}
            aria-label={`Play ${course.title} by ${course.channelTitle}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick(course);
              }
            }}
          >
            {/* 16:9 Thumbnail Box */}
            <div className="fvs-thumb-wrap">
              <img
                src={`https://img.youtube.com/vi/${course.youtubeId}/hqdefault.jpg`}
                alt={course.title}
                className="fvs-thumb-img"
                loading="lazy"
              />

              {/* Ambient Play Overlay */}
              <div className="fvs-thumb-overlay">
                <div className="fvs-play-btn-circle">
                  <LuPlay size={22} fill="#ffffff" />
                </div>

                {/* Brand Tech Badge */}
                <div className="fvs-brand-badge">
                  <TechBrandIcon type={course.language} size={17} />
                </div>
              </div>

              {/* Duration Badge */}
              <span className="fvs-duration-badge">
                <LuClock size={11} />
                <span>{course.duration}</span>
              </span>
            </div>

              {/* Card Meta & Details */}
              <div className="fvs-card-info">
                <h4 className="fvs-card-title" title={course.title}>
                  {course.title}
                </h4>

                <div className="fvs-channel-row">
                  <span className="fvs-channel-name">{course.channelTitle}</span>
                  <LuCircleCheck size={13} className="fvs-verified-icon" title="Verified Creator" />
                </div>

                <div className="fvs-tags-row">
                  <span className="fvs-tag fvs-tag-level">{course.level || "Beginner"}</span>
                  <span className="fvs-tag fvs-tag-cat">{course.category || "General"}</span>
                </div>

                {/* Quick Action Button */}
                <div className="fvs-play-action-row">
                  <button
                    type="button"
                    className="fvs-play-cta"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(course);
                    }}
                  >
                    <LuPlay size={13} fill="currentColor" />
                    <span>Watch Masterclass</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Interactive Animated Scroll Progress Bar */}
      <div className="fvs-progress-bar-wrap" aria-hidden="true">
        <div
          className="fvs-progress-indicator"
          style={{ width: `${Math.max(12, scrollProgress)}%` }}
        />
      </div>

      {/* ================= IN-PLATFORM VIDEO MODAL ================= */}
      {activeVideoModal && (
        <div
          className="mz-video-modal-backdrop"
          onClick={() => setActiveVideoModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mz-video-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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
                    <span style={{ fontWeight: 600, color: "#2563eb" }}>
                      {activeVideoModal.channelTitle || "Verified Instructor"}
                    </span>
                    <span>•</span>
                    <span>{activeVideoModal.duration || "Full Length"}</span>
                    <span>•</span>
                    <span className="mz-video-badge">{activeVideoModal.level || "Beginner"}</span>
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

            {/* Video Iframe Embed */}
            <div className="mz-video-embed-stage">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoModal.youtubeId}?autoplay=1&rel=0`}
                title={activeVideoModal.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="mz-video-iframe-player"
              />
            </div>

            {/* Modal Footer */}
            <div className="mz-video-modal-footer">
              <div className="mz-video-footer-left">
                <span className="mz-video-topic-pill">
                  <LuSparkles size={13} color="#2563eb" /> 1080p Verified Masterclass
                </span>
                {activeVideoModal.topics && activeVideoModal.topics.map((t, idx) => (
                  <span key={idx} className="mz-video-topic-pill">
                    {t}
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
                  onClick={() => {
                    const video = activeVideoModal;
                    setActiveVideoModal(null);
                    if (onPracticeInLearningPath) {
                      onPracticeInLearningPath(video);
                    } else {
                      navigate("/coding?tab=learning_path");
                    }
                  }}
                >
                  <span>Practice in Learning Path</span>
                  <LuArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
