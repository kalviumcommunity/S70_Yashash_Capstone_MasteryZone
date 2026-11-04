import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuBookOpen,
  LuZap,
  LuTrophy,
  LuRocket,
  LuShieldCheck,
  LuArrowRight,
  LuCirclePlay,
  LuCode,
  LuClock,
  LuCheck,
  LuX,
  LuCompass,
  LuGraduationCap,
  LuLayers,
  LuTerminal,
  LuFolderGit2,
  LuAward,
  LuMail,
  LuMessageSquare,
  LuLifeBuoy,
  LuPlay,
} from "react-icons/lu";

import logoIcon from "../assets/logo_icon_transparent.png";
import heroPedestalArt from "../assets/hero_laptop_4k.svg";
import bannerPython from "../assets/course_banner_python_opt.jpg";
import bannerJava from "../assets/course_banner_java_opt.jpg";
import bannerCpp from "../assets/course_banner_cpp_opt.jpg";
import bannerDsa from "../assets/course_banner_dsa_opt.jpg";
import ctaMortarboardCap from "../assets/cta_mortarboard_cap.png";

import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(Boolean(token));
  }, []);

  // Dashboard navigation follows strict auth logic:
  // Authenticated -> /home (or /coding), Unauthenticated -> /login
  const handleDashboardClick = () => {
    if (isAuthenticated) {
      navigate("/home");
    } else {
      navigate("/login", { state: { from: { pathname: "/home" } } });
    }
  };

  const handleStartLearning = () => {
    if (isAuthenticated) {
      navigate("/coding");
    } else {
      navigate("/signup");
    }
  };

  const handleCourseClick = (trackId) => {
    if (isAuthenticated) {
      navigate(`/coding?track=${trackId}`);
    } else {
      navigate("/login", { state: { from: { pathname: `/coding?track=${trackId}` } } });
    }
  };

  const scrollToCourses = () => {
    const el = document.getElementById("courses");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* ══════════════════════════════════════════════════════════════
     PLATFORM FEATURE CARDS (EXACT 5 FROM REFERENCE)
     ══════════════════════════════════════════════════════════════ */
  const featureCards = [
    {
      id: "expert-courses",
      icon: <LuBookOpen size={22} color="#4f46e5" />,
      iconBg: "#eef2ff",
      title: "Expert-Led Courses",
      description: "Master DSA and core programming concepts.",
      onClick: scrollToCourses,
    },
    {
      id: "coding-challenges",
      icon: <LuZap size={22} color="#2563eb" />,
      iconBg: "#eff6ff",
      title: "Coding Challenges",
      description: "Sharpen your problem-solving skills with real challenges.",
      onClick: () => navigate(isAuthenticated ? "/coding?tab=challenges" : "/login", { state: { from: { pathname: "/coding?tab=challenges" } } }),
    },
    {
      id: "coding-competitions",
      icon: <LuTrophy size={22} color="#d97706" />,
      iconBg: "#fffbeb",
      title: "Coding Competitions",
      description: "Test your skills in exciting competitions.",
      onClick: () => navigate(isAuthenticated ? "/certificates" : "/login", { state: { from: { pathname: "/certificates" } } }),
    },
    {
      id: "real-projects",
      icon: <LuRocket size={22} color="#7c3aed" />,
      iconBg: "#f5f3ff",
      title: "Real Projects",
      description: "Build real-world projects and boost your portfolio.",
      onClick: () => navigate(isAuthenticated ? "/coding?tab=projects" : "/login", { state: { from: { pathname: "/coding?tab=projects" } } }),
    },
    {
      id: "secure-trusted",
      icon: <LuShieldCheck size={22} color="#16a34a" />,
      iconBg: "#f0fdf4",
      title: "Secure & Trusted",
      description: "A safe and reliable platform for your learning journey.",
      onClick: () => navigate("/verify/demo"),
    },
  ];

  /* ══════════════════════════════════════════════════════════════
     FEATURED CODING COURSES (EXACT 4 FROM REFERENCE)
     ══════════════════════════════════════════════════════════════ */
  const featuredCourses = [
    {
      id: "python",
      bannerImg: bannerPython,
      badge: "Popular",
      badgeBg: "#4f46e5",
      title: "Python Programming",
      description: "From basics to advanced",
      duration: "40+ hrs",
    },
    {
      id: "java",
      bannerImg: bannerJava,
      badge: "Trending",
      badgeBg: "#ea580c",
      title: "Java Development",
      description: "Build powerful applications",
      duration: "50+ hrs",
    },
    {
      id: "cpp",
      bannerImg: bannerCpp,
      title: "C++ Mastery",
      description: "Master C++ programming",
      duration: "45+ hrs",
    },
    {
      id: "dsa",
      bannerImg: bannerDsa,
      title: "Data Structures & Algorithms",
      description: "Crack DSA with ease",
      duration: "60+ hrs",
    },
  ];

  return (
    <div className="mz-ref-landing">
      {/* Soft Ambient Radial Glows */}
      <div className="mz-ambient-glow glow-top" aria-hidden="true" />
      <div className="mz-ambient-glow glow-right" aria-hidden="true" />
      <div className="mz-ambient-glow glow-bottom" aria-hidden="true" />

      {/* Subtle Dot Grids (Decorative accents from reference) */}
      <div className="mz-dot-grid grid-top-left" aria-hidden="true" />
      <div className="mz-dot-grid grid-bottom-right" aria-hidden="true" />

      {/* =================================================================
          HEADER / NAVIGATION
          - Logo and branding on the left
          - Courses, Practice, Projects, Assessments, Help & Support
          - Prominent "Go to Dashboard ->" on the right
          ================================================================= */}
      <header className="mz-ref-navbar">
        <div className="mz-nav-wrapper">
          {/* Logo on Left */}
          <Link to="/" className="mz-ref-brand" aria-label="Mastery Zone Homepage">
            <img src={logoIcon} alt="Mastery Zone" className="mz-brand-icon" />
            <span className="mz-brand-text">Mastery Zone</span>
          </Link>

          {/* Center Navigation Links */}
          <nav className="mz-ref-nav-links" aria-label="Main Navigation">
            <button
              type="button"
              className="mz-ref-nav-item active"
              onClick={scrollToCourses}
            >
              Courses
            </button>
            <button
              type="button"
              className="mz-ref-nav-item"
              onClick={() => navigate(isAuthenticated ? "/coding?tab=challenges" : "/login", { state: { from: { pathname: "/coding?tab=challenges" } } })}
            >
              Practice
            </button>
            <button
              type="button"
              className="mz-ref-nav-item"
              onClick={() => navigate(isAuthenticated ? "/coding?tab=projects" : "/login", { state: { from: { pathname: "/coding?tab=projects" } } })}
            >
              Projects
            </button>
            <button
              type="button"
              className="mz-ref-nav-item"
              onClick={() => navigate(isAuthenticated ? "/certificates" : "/login", { state: { from: { pathname: "/certificates" } } })}
            >
              Assessments
            </button>
            <button
              type="button"
              className="mz-ref-nav-item"
              onClick={() => setSupportModalOpen(true)}
            >
              Help &amp; Support
            </button>
          </nav>

          {/* Prominent "Go to Dashboard" Button on Right */}
          <div className="mz-ref-nav-right">
            <button
              type="button"
              className="mz-ref-dashboard-btn"
              onClick={handleDashboardClick}
            >
              <span>Go to Dashboard</span>
              <LuArrowRight size={15} className="mz-dash-arrow" />
            </button>
          </div>
        </div>
      </header>

      {/* =================================================================
          HERO SECTION
          - Soft white & pastel-purple background
          - Left: badge, headline with purple "Better" and curved underline,
            supporting text, Start Learning & Explore Platform buttons
          - Right: 3D perspective laptop on pedestal with code and floating elements
          ================================================================= */}
      <section className="mz-ref-hero">
        <div className="mz-hero-container">
          {/* Left Column: Hero Copy */}
          <div className="mz-hero-copy">
            <div className="mz-pill-badge">
              <span className="mz-pill-bolt">⚡</span>
              <span>Learn • Practice • Excel</span>
            </div>

            <h1 className="mz-hero-heading">
              Master Coding. <br />
              Build a{" "}
              <span className="mz-better-wrap">
                <span className="mz-better-text">Better</span>
                <svg
                  className="mz-better-curve"
                  viewBox="0 0 140 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M3 10C42 2 98 2 137 10"
                    stroke="#6366f1"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              Tomorrow.
            </h1>

            <p className="mz-hero-description">
              Your complete coding platform to learn, practice and grow with
              structured courses, real challenges and hands-on projects.
            </p>

            <div className="mz-hero-cta-row">
              {/* Start Learning Button: Normal text with right arrow */}
              <button
                type="button"
                className="mz-btn-start-learning"
                onClick={handleStartLearning}
              >
                <span>Start Learning</span>
                <LuArrowRight size={15} />
              </button>

              {/* Explore Platform Button */}
              <button
                type="button"
                className="mz-btn-explore-platform"
                onClick={() => setTourModalOpen(true)}
              >
                <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", display: "inline-flex", alignItems: "center", color: "#4f46e5" }}>
                  &lt;&gt;
                </span>
                <span>Explore Platform</span>
              </button>
            </div>
          </div>

          {/* Right Column: 3D Laptop on Pedestal with Floating Elements */}
          <div className="mz-hero-visual-col" aria-hidden="true">
            <div className="mz-pedestal-scene-stage">
              <img
                src={heroPedestalArt}
                alt="Mastery Zone 3D Interactive Platform"
                className="mz-hero-pedestal-art"
                loading="eager"
                decoding="async"
                width="540"
                height="387"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          PLATFORM FEATURE CARDS (5 CLEAN CARDS ROW)
          ================================================================= */}
      <section className="mz-features-section">
        <div className="mz-features-grid">
          {featureCards.map((feat) => (
            <div
              key={feat.id}
              className="mz-feature-card"
              onClick={feat.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") feat.onClick();
              }}
            >
              <div className="mz-feature-icon-box" style={{ background: feat.iconBg }}>
                {feat.icon}
              </div>
              <h3 className="mz-feature-title">{feat.title}</h3>
              <p className="mz-feature-desc">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =================================================================
          FEATURED CODING COURSES
          - Left: Explore Learning Paths badge, Featured Coding Courses,
            short description, Browse Courses button
          - Right: 4 course cards with visual banner, title, duration, arrow
          ================================================================= */}
      <section className="mz-courses-section" id="courses">
        <div className="mz-courses-layout">
          {/* Left Side: Header & Browse Action */}
          <div className="mz-courses-sidebar">
            <div className="mz-learning-paths-badge">
              <LuCompass size={14} color="#6366f1" />
              <span>Explore Learning Paths</span>
            </div>

            <h2 className="mz-courses-main-heading">
              Featured <span className="mz-heading-accent">Coding</span> Courses
            </h2>

            <p className="mz-courses-intro">
              Curated learning paths to help you master programming and advance
              your skills.
            </p>

            <button
              type="button"
              className="mz-btn-browse-courses"
              onClick={handleStartLearning}
            >
              <span>Browse Courses</span>
              <LuArrowRight size={15} />
            </button>
          </div>

          {/* Right Side: 4 Course Cards Grid */}
          <div className="mz-courses-grid-4">
            {featuredCourses.map((c) => (
              <div
                key={c.id}
                className="mz-ref-course-card"
                onClick={() => handleCourseClick(c.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleCourseClick(c.id);
                }}
              >
                {/* Visual Banner */}
                <div className="mz-course-banner-wrap" style={{ position: "relative" }}>
                  {c.badge && (
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        zIndex: 2,
                        background: c.badgeBg || "#4f46e5",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: "9999px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                        letterSpacing: "0.2px",
                      }}
                    >
                      {c.badge}
                    </span>
                  )}
                  <img
                    src={c.bannerImg}
                    alt={c.title}
                    className="mz-course-banner-img"
                    loading="lazy"
                    decoding="async"
                    width="260"
                    height="140"
                  />
                </div>

                {/* Course Details */}
                <div className="mz-course-card-body">
                  <h3 className="mz-course-card-title">{c.title}</h3>
                  <p className="mz-course-card-sub">{c.description}</p>

                  <div className="mz-course-card-bottom">
                    <div className="mz-duration-pill">
                      <LuCirclePlay size={13} className="mz-duration-icon" />
                      <span>{c.duration}</span>
                    </div>

                    <div
                      className="mz-card-arrow-btn"
                      aria-label={`Open ${c.title}`}
                    >
                      <LuArrowRight size={13} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================================
          FINAL CTA BANNER
          - Ready to Start Your Coding Journey?
          - Join Mastery Zone today and unlock your potential...
          - Get Started Free button
          ================================================================= */}
      <section className="mz-final-cta-section">
        <div className="mz-final-cta-card">
          <div className="mz-cta-left-content">
            <div className="mz-cta-cap-icon-box">
              <img
                src={ctaMortarboardCap}
                alt="Mastery Zone Coding Certification"
                className="mz-cta-cap-img"
              />
            </div>

            <div className="mz-cta-text-block">
              <h3 className="mz-cta-heading">Ready to Start Your Coding Journey?</h3>
              <p className="mz-cta-description">
                Join Mastery Zone today and unlock your potential in the world of programming.
              </p>
            </div>
          </div>

          <div className="mz-cta-right-btn">
            <button
              type="button"
              className="mz-btn-get-started-free"
              onClick={handleStartLearning}
            >
              <span>Get Started Free</span>
              <LuArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* =================================================================
          PLATFORM TOUR VIDEO MODAL
          ================================================================= */}
      {tourModalOpen && (
        <div
          className="mz-modal-backdrop"
          onClick={() => setTourModalOpen(false)}
        >
          <div
            className="mz-modal-dialog mz-tour-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mz-modal-head">
              <div className="mz-modal-head-title">
                <LuCirclePlay size={22} color="#4f46e5" />
                <h3>Mastery Zone Platform Tour</h3>
              </div>
              <button
                type="button"
                className="mz-modal-close"
                onClick={() => setTourModalOpen(false)}
                aria-label="Close modal"
              >
                <LuX size={18} />
              </button>
            </div>
            <div className="mz-modal-content">
              {/* Interactive Video Showcase Frame */}
              <div className="mz-tour-video-box">
                <div className="mz-tour-video-header">
                  <div className="mz-tour-video-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <span className="mz-tour-video-url">masteryzone.com/tour</span>
                </div>
                <div className="mz-tour-video-preview">
                  <div className="mz-tour-play-glow">
                    <LuCirclePlay size={56} color="#ffffff" />
                  </div>
                  <div className="mz-tour-preview-overlay">
                    <h4>Interactive Coding Environment</h4>
                    <p>Live In-Browser Code Compiler • Real-Time Test Cases • Proctored Certificates</p>
                  </div>
                </div>
              </div>

              <div className="mz-tour-highlights">
                <div className="mz-tour-pill">
                  <LuCheck size={14} color="#16a34a" />
                  <span>Structured Learning Tracks</span>
                </div>
                <div className="mz-tour-pill">
                  <LuCheck size={14} color="#16a34a" />
                  <span>100+ Hands-on Challenges</span>
                </div>
                <div className="mz-tour-pill">
                  <LuCheck size={14} color="#16a34a" />
                  <span>Portfolio Ready Projects</span>
                </div>
              </div>

              <div className="mz-modal-actions">
                <button
                  type="button"
                  className="mz-btn-start-learning"
                  onClick={() => {
                    setTourModalOpen(false);
                    handleStartLearning();
                  }}
                >
                  <span>Start Learning Free</span>
                  <LuArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          HELP & SUPPORT MODAL
          ================================================================= */}
      {supportModalOpen && (
        <div
          className="mz-modal-backdrop"
          onClick={() => setSupportModalOpen(false)}
        >
          <div
            className="mz-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mz-modal-head">
              <div className="mz-modal-head-title">
                <LuLifeBuoy size={20} color="#4f46e5" />
                <h3>Mastery Zone Help &amp; Support</h3>
              </div>
              <button
                type="button"
                className="mz-modal-close"
                onClick={() => setSupportModalOpen(false)}
                aria-label="Close modal"
              >
                <LuX size={18} />
              </button>
            </div>
            <div className="mz-modal-content">
              <p className="mz-modal-desc">
                Need guidance on learning paths, coding challenges, or certificate verification? Our team is here to assist you.
              </p>
              <div className="mz-support-channels">
                <div className="mz-support-row">
                  <LuMail size={18} color="#4f46e5" />
                  <div>
                    <strong>Email Support</strong>
                    <p>support@masteryzone.com</p>
                  </div>
                </div>
                <div className="mz-support-row">
                  <LuTerminal size={18} color="#16a34a" />
                  <div>
                    <strong>Interactive Documentation</strong>
                    <p>Access our built-in coding guidelines and API references</p>
                  </div>
                </div>
                <div className="mz-support-row">
                  <LuShieldCheck size={18} color="#d97706" />
                  <div>
                    <strong>Proctored Examination Verification</strong>
                    <p>Instant verification at /verify/:certificateId</p>
                  </div>
                </div>
              </div>
              <div className="mz-modal-actions">
                <button
                  type="button"
                  className="mz-ref-dashboard-btn"
                  onClick={() => {
                    setSupportModalOpen(false);
                    handleDashboardClick();
                  }}
                >
                  <span>Go to Dashboard</span>
                  <LuArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
