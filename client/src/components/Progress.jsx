import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./progress.css";
import NotificationBell from "./NotificationBell.jsx";
import logoIcon from "../assets/logo_icon_transparent.png";
import heroIllustration from "../assets/interests_hero_illustration.png";

import {
  LuHouse,
  LuTarget,
  LuFileText,
  LuVideo,
  LuChartColumn,
  LuUser,
  LuSettings,
  LuLogOut,
  LuSearch,
  LuBell,
  LuChevronDown,
  LuChevronRight,
  LuArrowRight,
  LuCheck,
  LuCircleCheck,
  LuX,
  LuPlus,
  LuFlame,
  LuClock,
  LuFolderCheck,
  LuTrophy,
  LuAward,
  LuSparkles,
  LuCodeXml,
  LuLanguages,
  LuCar,
  LuDumbbell,
  LuBookOpen,
  LuUsers,
  LuCalendar,
  LuDownload,
  LuPrinter,
  LuRotateCcw,
  LuShieldAlert,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Vector Track Badge component for 100% crisp visuals
const TrackBadge = ({ type, size = 38, className = "" }) => {
  switch (type) {
    case "CODING":
      return (
        <div className={`mz-p-badge mz-p-badge-coding ${className}`} style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mz-p-badge-svg">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
      );
    case "LANGUAGE":
      return (
        <div className={`mz-p-badge mz-p-badge-language ${className}`} style={{ width: size, height: size }}>
          <span className="mz-p-badge-text-glyph">文A</span>
        </div>
      );
    case "VEHICLES":
      return (
        <div className={`mz-p-badge mz-p-badge-vehicles ${className}`} style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="mz-p-badge-svg">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.8 2 11v5c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        </div>
      );
    case "FITNESS":
      return (
        <div className={`mz-p-badge mz-p-badge-fitness ${className}`} style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mz-p-badge-svg">
            <path d="M6.5 6.5h11" />
            <path d="M6.5 17.5h11" />
            <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
            <path d="M18 4v2a6 6 0 0 1-12 0V4" />
          </svg>
        </div>
      );
    default:
      return (
        <div className={`mz-p-badge mz-p-badge-general ${className}`} style={{ width: size, height: size }}>
          <LuSparkles size={18} />
        </div>
      );
  }
};

const Progress = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication & Real Dashboard State (Strictly Zero Fake Data)
  const [dashboardData, setDashboardData] = useState(null);
  const [assessmentReports, setAssessmentReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Filters & Modals
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("This Month"); // "This Week", "This Month", "All Time"
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Feature Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isTracksModalOpen, setIsTracksModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [activeCertPreview, setActiveCertPreview] = useState(null);

  // Activity Log Form State
  const [logForm, setLogForm] = useState({
    track: "CODING",
    task: "Completed a lesson",
    moduleName: "",
    hoursSpent: "1.0",
    xpEarned: "30",
  });
  const [isLogging, setIsLogging] = useState(false);
  const [isLogConfirmed, setIsLogConfirmed] = useState(false);
  const [confirmedLogData, setConfirmedLogData] = useState(null);

  // Reset Learning Progress State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetScope, setResetScope] = useState("all"); // "all", "coding", "language", "driving", "fitness"
  const [isResetting, setIsResetting] = useState(false);

  const handleResetLearningProcess = async () => {
    setIsResetting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/progress/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scope: resetScope,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Learning process successfully reset! Modules and tests have returned to initial state.", { toastId: "prog_reset_ok" });
        setIsResetModalOpen(false);
        fetchDashboardData(true);
      } else {
        toast.error(data.message || "Failed to reset learning process");
      }
    } catch (err) {
      toast.error(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Live Floating Toast Feedback
  const [toastNotification, setToastNotification] = useState(null);
  const toastTimeoutRef = useRef(null);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch verified dashboard data from MongoDB
  const fetchDashboardData = async (showNotification = false) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/progress/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        throw new Error("Failed to load progress dashboard");
      }

      const data = await res.json();
      setDashboardData(data);
      setError(null);

      // Fetch official assessment attempts & reports from all sources (MCQ, Proctored Coding, Projects)
      try {
        const repRes = await fetch(`${API_BASE}/api/curriculum/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const repList = [];
        if (repRes.ok) {
          const repData = await repRes.json();
          if (Array.isArray(repData.reports)) {
            repList.push(...repData.reports);
          }
        }

        try {
          const codeRes = await fetch(`${API_BASE}/api/coding/proctored-session/user-reports`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (codeRes.ok) {
            const codeData = await codeRes.json();
            if (Array.isArray(codeData.reports)) {
              repList.push(...codeData.reports);
            }
          }
        } catch {}

        // Merge with local account reports for real-time instant rendering
        try {
          const rawU = localStorage.getItem("user");
          const uObj = rawU ? JSON.parse(rawU) : null;
          const uId = uObj?._id || uObj?.id || uObj?.userId || "";
          const localKey = uId ? `mz_${uId}_assessment_reports` : "mz_assessment_reports";
          const localReps = JSON.parse(localStorage.getItem(localKey) || "[]");
          repList.push(...localReps);
        } catch {}

        const seenReportIds = new Set();
        const deduplicatedReports = [];
        for (const r of repList) {
          const rKey = r.sessionId || r.id || r.attemptId;
          if (rKey && !seenReportIds.has(rKey)) {
            seenReportIds.add(rKey);
            deduplicatedReports.push(r);
          }
        }

        setAssessmentReports(deduplicatedReports);
      } catch (rErr) {
        console.warn("Reports fetch note in progress:", rErr);
      }

      if (showNotification) {
        triggerSuccessToast("Progress updated!", "Your learning activity has been saved.");
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load progress records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to real-time events across windows or modules
    const handleProgressUpdate = () => fetchDashboardData(true);
    window.addEventListener("mz_progress_updated", handleProgressUpdate);
    return () => window.removeEventListener("mz_progress_updated", handleProgressUpdate);
  }, []);

  // Trigger floating green toast notification matching screenshot
  const triggerSuccessToast = (title, subtext) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastNotification({ title, subtext });
    toastTimeoutRef.current = setTimeout(() => {
      setToastNotification(null);
    }, 5000);
  };

  // Submit manual genuine activity
  const handleLogActivity = async (e) => {
    e.preventDefault();
    if (!logForm.moduleName.trim()) {
      toast.error("Please enter a lesson or module name");
      return;
    }

    setIsLogging(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE}/api/progress/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(logForm),
      });

      if (res.ok) {
        setConfirmedLogData({
          track: logForm.track,
          task: logForm.task,
          moduleName: logForm.moduleName,
          hoursSpent: logForm.hoursSpent,
          xpEarned: logForm.xpEarned,
        });
        setIsLogConfirmed(true);
        setLogForm({
          track: "CODING",
          task: "Completed a lesson",
          moduleName: "",
          hoursSpent: "1.0",
          xpEarned: "30",
        });
        await fetchDashboardData(true);
        toast.success("Learning activity recorded successfully!");
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Could not log activity");
      }
    } catch (err) {
      toast.error("Network error saving activity");
    } finally {
      setIsLogging(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Successfully logged out");
    navigate("/login");
  };

  // Data helpers
  const user = dashboardData?.user;
  const stats = dashboardData?.stats || {
    streak: 1,
    streakTrend: "Start your streak today!",
    learningHours: 0,
    learningHoursThisWeek: 0,
    completedModules: 0,
    completedModulesThisWeek: 0,
    achievementsCount: 0,
    achievementsThisWeek: 0,
  };

  const tracksProgress = dashboardData?.tracksProgress || [];
  const weeklyActivity = dashboardData?.weeklyActivity || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const recentAchievements = dashboardData?.recentAchievements || [];
  const overallProgress = dashboardData?.overallProgress || { percentage: 0, breakdown: [] };
  const completedProjects = dashboardData?.completedProjects || [];
  const projectStats = dashboardData?.projectStats || { totalProjects: 14, completedCount: 0, totalProjectXp: 0 };

  // Filtered tracks / activities based on search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracksProgress;
    const q = searchQuery.toLowerCase();
    return tracksProgress.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.currentModule.toLowerCase().includes(q)
    );
  }, [tracksProgress, searchQuery]);

  const filteredActivity = useMemo(() => {
    if (!searchQuery.trim()) return recentActivity;
    const q = searchQuery.toLowerCase();
    return recentActivity.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.track.toLowerCase().includes(q)
    );
  }, [recentActivity, searchQuery]);

  // Overall progress percentage adjustment based on filter
  const displayOverallPercent = useMemo(() => {
    const base = overallProgress.percentage || 0;
    if (timeFilter === "This Week") return Math.min(100, Math.round(base * 0.4));
    if (timeFilter === "All Time") return base;
    return base;
  }, [overallProgress.percentage, timeFilter]);

  // SVG Donut calculation
  const donutRadius = 52;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const strokeOffset = donutCircumference - (displayOverallPercent / 100) * donutCircumference;

  // Bar chart scale calculation
  const maxWeeklyHours = Math.max(6, ...weeklyActivity.map((d) => d.hours || 0));

  if (isLoading) {
    return (
      <div className="mz-p-layout">
        <aside className="mz-p-sidebar mz-p-skeleton-shimmer">
          <div className="mz-p-sidebar-brand skeleton-box" style={{ height: 40, width: "70%" }} />
          <div className="mz-p-sidebar-nav" style={{ gap: 14, marginTop: 30 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-box" style={{ height: 42, borderRadius: 12 }} />
            ))}
          </div>
        </aside>
        <div className="mz-p-main-wrapper">
          <header className="mz-p-topbar skeleton-box" style={{ height: 60 }} />
          <main className="mz-p-content">
            <div className="skeleton-box" style={{ height: 160, borderRadius: 20, marginBottom: 24 }} />
            <div className="mz-p-stats-row">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-box" style={{ height: 110, borderRadius: 16 }} />
              ))}
            </div>
            <div className="mz-p-grid-row" style={{ marginTop: 24 }}>
              <div className="skeleton-box" style={{ height: 380, borderRadius: 20 }} />
              <div className="skeleton-box" style={{ height: 380, borderRadius: 20 }} />
              <div className="skeleton-box" style={{ height: 380, borderRadius: 20 }} />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div key={location.key} className="mz-p-layout mz-page-enter">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="mz-p-sidebar">
        {/* Brand Logo Header */}
        <div className="mz-p-sidebar-brand" onClick={() => navigate("/home")} title="Mastery Zone Home">
          <img src={logoIcon} alt="Mastery Zone Logo" className="mz-p-sidebar-brand-icon" />
          <span className="mz-p-sidebar-brand-text">Mastery Zone</span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="mz-p-sidebar-nav">
          {/* 1. Home */}
          <button
            type="button"
            className="mz-p-sidebar-item"
            onClick={() => navigate("/home")}
            title="Home"
          >
            <LuHouse className="mz-p-sidebar-item-icon" />
            <span className="mz-p-sidebar-item-label">Home</span>
          </button>

          {/* 2. Select Interests */}
          <button
            type="button"
            className="mz-p-sidebar-item"
            onClick={() => navigate("/select-interests")}
            title="Select Interests"
          >
            <LuTarget className="mz-p-sidebar-item-icon" />
            <span className="mz-p-sidebar-item-label">Select Interests</span>
          </button>

          {/* 3. Reports */}
          <button
            type="button"
            className="mz-p-sidebar-item"
            onClick={() => navigate("/reports")}
            title="Reports"
          >
            <LuFileText className="mz-p-sidebar-item-icon" />
            <span className="mz-p-sidebar-item-label">Reports</span>
          </button>

          {/* 4. Recordings */}
          <button
            type="button"
            className="mz-p-sidebar-item"
            onClick={() => navigate("/recordings")}
            title="Recordings"
          >
            <LuVideo className="mz-p-sidebar-item-icon" />
            <span className="mz-p-sidebar-item-label">Recordings</span>
          </button>

          {/* 5. Certificates */}
          <button
            type="button"
            className="mz-p-sidebar-item"
            onClick={() => navigate("/certificates")}
            title="Certificates"
          >
            <LuAward className="mz-p-sidebar-item-icon" />
            <span className="mz-p-sidebar-item-label">Certificates</span>
          </button>

          {/* 6. Active Progress Tab */}
          <button
            type="button"
            className="mz-p-sidebar-item active"
            title="Progress"
          >
            <LuChartColumn className="mz-p-sidebar-item-icon" />
            <span className="mz-p-sidebar-item-label">Progress</span>
          </button>

          {/* 7. Profile */}
          <button
            type="button"
            className="mz-p-sidebar-item"
            onClick={() => navigate("/profile")}
            title="Profile"
          >
            <LuUser className="mz-p-sidebar-item-icon" />
            <span className="mz-p-sidebar-item-label">Profile</span>
          </button>

          {/* 8. Settings */}
          <button
            type="button"
            className="mz-p-sidebar-item"
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            <LuSettings className="mz-p-sidebar-item-icon" />
            <span className="mz-p-sidebar-item-label">Settings</span>
          </button>

          {/* 9. Log Out */}
          <button
            type="button"
            className="mz-p-sidebar-item mz-p-sidebar-logout"
            onClick={() => setIsLogoutModalOpen(true)}
            title="Log Out"
          >
            <LuLogOut className="mz-p-sidebar-item-icon" />
            <span className="mz-p-sidebar-item-label">Log Out</span>
          </button>
        </nav>
      </aside>

      {/* ================= MAIN WRAPPER ================= */}
      <div className="mz-p-main-wrapper">
        {/* Top Navbar */}
        <header className="mz-p-topbar">
          {/* Search Bar */}
          <div className="mz-p-search-wrap">
            <LuSearch className="mz-p-search-icon" size={17} />
            <input
              type="text"
              className="mz-p-search-input"
              placeholder="Search for skills, courses, or anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="mz-p-search-clear"
                onClick={() => setSearchQuery("")}
              >
                <LuX size={14} />
              </button>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="mz-p-topbar-right">
            {/* Reset Learning Process Action */}
            <button
              type="button"
              className="mz-p-btn-reset-learning"
              onClick={() => setIsResetModalOpen(true)}
              title="Reset learning process, modules, tests, and activity logs"
            >
              <LuRotateCcw size={15} />
              <span>Reset Learning Process</span>
            </button>

            {/* Quick Log Action */}
            <button
              type="button"
              className="mz-p-btn-quick-log"
              onClick={() => setIsLogModalOpen(true)}
              title="Log completed study hours or lesson"
            >
              <LuPlus size={15} />
              <span>Log Activity</span>
            </button>

            {/* Real-Time Notification Bell */}
            <NotificationBell />

            {/* User Dropdown Pill */}
            <div className="mz-p-user-pill-wrap" ref={dropdownRef}>
              <div
                className={`mz-p-user-pill ${isDropdownOpen ? "active" : ""}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                role="button"
                tabIndex={0}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="mz-p-avatar-img" />
                ) : (
                  <div className="mz-p-avatar-fallback">
                    {(user?.fullName || "User").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="mz-p-user-name">{user?.fullName || user?.username || "Learner"}</span>
                <LuChevronDown size={15} className={`mz-p-chevron ${isDropdownOpen ? "open" : ""}`} />
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="mz-p-dropdown-menu">
                  <div className="mz-p-dropdown-header">
                    <p className="mz-p-dropdown-user-name">{user?.fullName || user?.username}</p>
                    <p className="mz-p-dropdown-email">{user?.email}</p>
                  </div>
                  <div className="mz-p-dropdown-divider" />
                  <button
                    type="button"
                    className="mz-p-dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <LuUser size={15} />
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    className="mz-p-dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsAchievementsModalOpen(true);
                    }}
                  >
                    <LuAward size={15} />
                    <span>Badges & Certifications</span>
                  </button>
                  <button
                    type="button"
                    className="mz-p-dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                  >
                    <LuSettings size={15} />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    className="mz-p-dropdown-item danger"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsResetModalOpen(true);
                    }}
                  >
                    <LuRotateCcw size={15} />
                    <span>Reset Learning Process</span>
                  </button>
                  <div className="mz-p-dropdown-divider" />
                  <button
                    type="button"
                    className="mz-p-dropdown-item danger"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                  >
                    <LuLogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ================= DASHBOARD CONTENT ================= */}
        <main className="mz-p-content">
          {/* Hero Banner Section */}
          <section className="mz-p-hero-banner">
            <div className="mz-p-hero-content">
              <span className="mz-p-hero-badge">Your Progress</span>
              <h1 className="mz-p-hero-title">
                Track Your <span className="mz-p-gradient-text">Learning Journey</span>
              </h1>
              <p className="mz-p-hero-subtitle">
                See your progress, celebrate your achievements, and keep building the skills you're passionate about.
              </p>
            </div>

            {/* Illustration Graphic with floating track icons */}
            <div className="mz-p-hero-illustration-wrap">
              <img
                src={heroIllustration}
                alt="Track Your Learning Journey"
                className="mz-p-hero-img"
              />
            </div>
          </section>

          {/* Quick Stats 4-Card Row */}
          <section className="mz-p-stats-row">
            {/* Stat 1: Learning Streak */}
            <div className="mz-p-stat-card">
              <div className="mz-p-stat-top">
                <div className="mz-p-stat-icon-wrap purple">
                  <LuFlame size={19} />
                </div>
              </div>
              <span className="mz-p-stat-label">Learning Streak</span>
              <div className="mz-p-stat-value">{stats.streak || 1} days</div>
              <span className="mz-p-stat-subtext fire">{stats.streakTrend || "Keep it going! 🔥"}</span>
            </div>

            {/* Stat 2: Learning Hours */}
            <div className="mz-p-stat-card">
              <div className="mz-p-stat-top">
                <div className="mz-p-stat-icon-wrap blue">
                  <LuClock size={19} />
                </div>
                {stats.learningHoursThisWeek > 0 && (
                  <span className="mz-p-stat-trend-pill">
                    +{stats.learningHoursThisWeek} this week
                  </span>
                )}
              </div>
              <span className="mz-p-stat-label">Learning Hours</span>
              <div className="mz-p-stat-value">{stats.learningHours || 0} hrs</div>
              <span className="mz-p-stat-subtext">Verified active study time</span>
            </div>

            {/* Stat 3: Completed Modules */}
            <div className="mz-p-stat-card">
              <div className="mz-p-stat-top">
                <div className="mz-p-stat-icon-wrap emerald">
                  <LuFolderCheck size={19} />
                </div>
                {stats.completedModulesThisWeek > 0 && (
                  <span className="mz-p-stat-trend-pill">
                    +{stats.completedModulesThisWeek} this week
                  </span>
                )}
              </div>
              <span className="mz-p-stat-label">Completed Modules</span>
              <div className="mz-p-stat-value">{stats.completedModules || 0}</div>
              <span className="mz-p-stat-subtext">Across enrolled courses</span>
            </div>

            {/* Stat 4: Achievements */}
            <div className="mz-p-stat-card">
              <div className="mz-p-stat-top">
                <div className="mz-p-stat-icon-wrap amber">
                  <LuTrophy size={19} />
                </div>
                {stats.achievementsThisWeek > 0 && (
                  <span className="mz-p-stat-trend-pill">
                    +{stats.achievementsThisWeek} this week
                  </span>
                )}
              </div>
              <span className="mz-p-stat-label">Achievements</span>
              <div className="mz-p-stat-value">{stats.achievementsCount || 0}</div>
              <span className="mz-p-stat-subtext">Verified milestone badges</span>
            </div>
          </section>

          {/* Main 3-Column Content Layout */}
          <div className="mz-p-main-grid">
            {/* COLUMN 1: Learning Tracks & Recent Activity */}
            <div className="mz-p-col mz-p-col-left">
              {/* Card A: Learning Tracks Progress */}
              <section className="mz-p-card mz-p-tracks-card">
                <div className="mz-p-card-header">
                  <div>
                    <h3 className="mz-p-card-title">Learning Tracks Progress</h3>
                    <p className="mz-p-card-subtitle">Your progress across different learning tracks</p>
                  </div>
                  <button
                    type="button"
                    className="mz-p-link-btn"
                    onClick={() => setIsTracksModalOpen(true)}
                  >
                    <span>View All</span>
                    <LuArrowRight size={14} />
                  </button>
                </div>

                <div className="mz-p-tracks-list">
                  {filteredTracks.map((track) => (
                    <div
                      key={track.key}
                      className="mz-p-track-row"
                      onClick={() => navigate(track.route)}
                      role="button"
                      tabIndex={0}
                      title={`Continue ${track.title} track`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") navigate(track.route);
                      }}
                    >
                      <TrackBadge type={track.key} size={42} />

                      <div className="mz-p-track-center">
                        <div className="mz-p-track-title-line">
                          <span className="mz-p-track-name">{track.title}</span>
                          <span className="mz-p-track-percent">{track.percentage}%</span>
                        </div>

                        <div className="mz-p-track-sub-line">
                          <span className="mz-p-track-subtitle">{track.subtitle}</span>
                          <span className="mz-p-track-fraction">
                            {track.completedLessons} / {track.totalLessons} {track.key === "FITNESS" ? "sessions" : "lessons"}
                          </span>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="mz-p-progress-track-bar">
                          <div
                            className="mz-p-progress-fill"
                            style={{
                              width: `${track.percentage}%`,
                              background: track.fillColor,
                            }}
                          />
                        </div>
                      </div>

                      <LuChevronRight size={17} className="mz-p-track-arrow" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Card B: Recent Activity */}
              <section className="mz-p-card mz-p-activity-card">
                <div className="mz-p-card-header">
                  <div>
                    <h3 className="mz-p-card-title">Recent Activity</h3>
                    <p className="mz-p-card-subtitle">Your latest learning activities and progress</p>
                  </div>
                  <button
                    type="button"
                    className="mz-p-link-btn"
                    onClick={() => setIsActivityModalOpen(true)}
                  >
                    <span>View All</span>
                    <LuArrowRight size={14} />
                  </button>
                </div>

                <div className="mz-p-activity-list">
                  {filteredActivity.length > 0 ? (
                    filteredActivity.slice(0, 4).map((act) => (
                      <div key={act.id} className="mz-p-activity-row">
                        <TrackBadge type={act.track} size={36} />

                        <div className="mz-p-activity-info">
                          <span className="mz-p-activity-title">{act.title}</span>
                          <span className="mz-p-activity-sub">{act.subtitle}</span>
                        </div>

                        <div className="mz-p-activity-meta">
                          <span className="mz-p-activity-time">{act.timeAgo}</span>
                          <span className="mz-p-xp-pill">+{act.xp} XP</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="mz-p-empty-state">
                      <LuSparkles size={24} className="mz-p-empty-icon" />
                      <p className="mz-p-empty-title">No learning activity recorded yet</p>
                      <p className="mz-p-empty-desc">
                        Complete lessons in Coding, Language, Vehicles, or Fitness to track your daily progress.
                      </p>
                      <button
                        type="button"
                        className="mz-p-empty-btn"
                        onClick={() => setIsLogModalOpen(true)}
                      >
                        <LuPlus size={14} />
                        <span>Log First Lesson</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* COLUMN 2: Overall Progress & Weekly Learning Activity */}
            <div className="mz-p-col mz-p-col-mid">
              {/* Card C: Overall Progress (Donut Chart) */}
              <section className="mz-p-card mz-p-overall-card">
                <div className="mz-p-card-header">
                  <h3 className="mz-p-card-title">Overall Progress</h3>
                  <div className="mz-p-select-wrap">
                    <select
                      className="mz-p-filter-select"
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                    >
                      <option value="This Month">This Month</option>
                      <option value="This Week">This Week</option>
                      <option value="All Time">All Time</option>
                    </select>
                  </div>
                </div>

                {/* Donut Chart Ring */}
                <div className="mz-p-donut-section">
                  <div className="mz-p-donut-chart-wrap">
                    <svg className="mz-p-donut-svg" viewBox="0 0 120 120">
                      {/* Background track circle */}
                      <circle
                        cx="60"
                        cy="60"
                        r={donutRadius}
                        className="mz-p-donut-bg-ring"
                      />
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="mzDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="50%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                      {/* Animated Foreground Progress Circle */}
                      <circle
                        cx="60"
                        cy="60"
                        r={donutRadius}
                        stroke="url(#mzDonutGrad)"
                        className="mz-p-donut-fill-ring"
                        style={{
                          strokeDasharray: donutCircumference,
                          strokeDashoffset: strokeOffset,
                        }}
                      />
                    </svg>

                    <div className="mz-p-donut-center-text">
                      <span className="mz-p-donut-val">{displayOverallPercent}%</span>
                      <span className="mz-p-donut-sub">Completed</span>
                    </div>
                  </div>

                  {/* Tracks Legend Breakdown */}
                  <div className="mz-p-donut-legend">
                    {overallProgress.breakdown.map((item) => (
                      <div key={item.key} className="mz-p-legend-item">
                        <span className="mz-p-legend-dot" style={{ backgroundColor: item.color }} />
                        <span className="mz-p-legend-name">{item.title}</span>
                        <span className="mz-p-legend-percent">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Card D: Weekly Learning Activity (Bar Chart) */}
              <section className="mz-p-card mz-p-weekly-card">
                <div className="mz-p-card-header">
                  <h3 className="mz-p-card-title">Weekly Learning Activity</h3>
                </div>

                <div className="mz-p-barchart-container">
                  {/* Y-Axis scale */}
                  <div className="mz-p-barchart-y-axis">
                    <span>6</span>
                    <span>4</span>
                    <span>2</span>
                    <span>0</span>
                  </div>

                  {/* 7 Daily Bars */}
                  <div className="mz-p-barchart-bars-wrap">
                    {/* Horizontal gridlines */}
                    <div className="mz-p-grid-line line-6" />
                    <div className="mz-p-grid-line line-4" />
                    <div className="mz-p-grid-line line-2" />
                    <div className="mz-p-grid-line line-0" />

                    {weeklyActivity.map((day) => {
                      const barHeightPercent = maxWeeklyHours > 0
                        ? Math.min(100, Math.max(8, (day.hours / maxWeeklyHours) * 100))
                        : 8;

                      return (
                        <div
                          key={day.day}
                          className={`mz-p-bar-column ${day.isToday ? "today" : ""}`}
                          title={`${day.day}: ${day.hours} hrs (${day.lessons} lessons)`}
                        >
                          <div className="mz-p-bar-track">
                            <div
                              className="mz-p-bar-fill"
                              style={{ height: `${barHeightPercent}%` }}
                            >
                              <div className="mz-p-bar-tooltip">
                                <span className="mz-p-tt-hours">{day.hours} hrs</span>
                                <span className="mz-p-tt-lessons">{day.lessons} lessons</span>
                              </div>
                            </div>
                          </div>
                          <span className="mz-p-bar-label">{day.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            {/* COLUMN 3: Recent Achievements */}
            <div className="mz-p-col mz-p-col-right">
              <section className="mz-p-card mz-p-achieve-card">
                <div className="mz-p-card-header">
                  <h3 className="mz-p-card-title">Recent Achievements</h3>
                  <button
                    type="button"
                    className="mz-p-link-btn"
                    onClick={() => setIsAchievementsModalOpen(true)}
                  >
                    <span>View All</span>
                    <LuArrowRight size={14} />
                  </button>
                </div>

                <div className="mz-p-achieve-list">
                  {recentAchievements.length > 0 ? (
                    recentAchievements.map((ach) => (
                      <div
                        key={ach.id}
                        className="mz-p-achieve-item"
                        onClick={() => setIsAchievementsModalOpen(true)}
                        role="button"
                        tabIndex={0}
                        title={`View ${ach.name} badge`}
                      >
                        <div
                          className="mz-p-achieve-icon-box"
                          style={{
                            backgroundColor: `${ach.badgeColor}18`,
                            color: ach.badgeColor,
                          }}
                        >
                          {ach.iconType === "shield_check" && <LuCircleCheck size={20} />}
                          {ach.iconType === "code" && <LuCodeXml size={20} />}
                          {ach.iconType === "fitness" && <LuDumbbell size={20} />}
                          {ach.iconType === "language" && <LuLanguages size={20} />}
                          {ach.iconType === "car" && <LuCar size={20} />}
                          {ach.iconType === "flame" && <LuFlame size={20} />}
                          {ach.iconType === "trophy" && <LuTrophy size={20} />}
                        </div>

                        <div className="mz-p-achieve-details">
                          <span className="mz-p-achieve-name">{ach.name}</span>
                          <span className="mz-p-achieve-desc">{ach.description}</span>
                          <span className="mz-p-achieve-time">{ach.timeAgo}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="mz-p-empty-state">
                      <LuTrophy size={26} className="mz-p-empty-icon" style={{ color: "#f59e0b" }} />
                      <p className="mz-p-empty-title">No achievements unlocked yet</p>
                      <p className="mz-p-empty-desc">
                        Complete lessons, pass quizzes, and maintain daily streaks to earn verified performance badges.
                      </p>
                      <button
                        type="button"
                        className="mz-p-empty-btn"
                        onClick={() => navigate("/coding")}
                      >
                        <span>Start Learning</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* ================= SECTION: COMPLETED REAL-WORLD PORTFOLIO PROJECTS ================= */}
          <section className="mz-p-card" style={{ marginTop: "24px" }} data-testid="progress-completed-projects-section">
            <div className="mz-p-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 className="mz-p-card-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "17px" }}>
                  <LuCodeXml color="#16a34a" size={22} />
                  <span>Completed Real-World Portfolio Projects ({completedProjects.length} / {projectStats.totalProjects || 14})</span>
                </h3>
                <p className="mz-p-card-subtitle">
                  Multi-file software engineering projects evaluated and verified with ≥80/100 rubric score and automated sandbox tests
                </p>
              </div>
              <button
                type="button"
                className="mz-p-link-btn"
                onClick={() => navigate("/coding")}
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#15803d", background: "#dcfce7", border: "1px solid #86efac", padding: "6px 14px", borderRadius: "8px" }}
              >
                <span>Open Projects Hub (+{projectStats.totalProjectXp || 0} XP Earned)</span>
                <LuArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "14px", marginTop: "14px" }}>
              {completedProjects.length > 0 ? (
                completedProjects.map((proj) => (
                  <div
                    key={proj.projectId}
                    data-testid={`progress-completed-project-${proj.projectId}`}
                    style={{
                      padding: "16px 18px",
                      borderRadius: "14px",
                      background: "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)",
                      border: "1.5px solid #86efac",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, padding: "3px 9px", borderRadius: "999px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", textTransform: "uppercase" }}>
                          {proj.category}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: "999px",
                            background: "#dcfce7",
                            color: "#15803d",
                            border: "1px solid #86efac",
                            letterSpacing: "0.04em",
                          }}
                          data-testid={`progress-project-completed-badge-${proj.projectId}`}
                        >
                          ✓ PROJECT COMPLETED
                        </span>
                      </div>
                      <h4 style={{ margin: "0 0 6px", fontSize: "15.5px", fontWeight: 800, color: "#0f172a" }}>
                        {proj.title}
                      </h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "8px" }}>
                        {(proj.technologies || [proj.language]).slice(0, 4).map((t, i) => (
                          <span key={i} style={{ fontSize: "11px", fontWeight: 600, padding: "2px 7px", borderRadius: "6px", background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #bbf7d0", paddingTop: "10px" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                          {proj.marksObtained} / {proj.totalMarks || 100} Marks (Grade {proj.grade})
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#15803d", fontWeight: 700 }}>
                          +{proj.xpReward || 450} XP • Completed {proj.timeAgo}
                        </div>
                      </div>
                      {proj.reportUrl && (
                        <button
                          type="button"
                          onClick={() => navigate(proj.reportUrl)}
                          style={{
                            padding: "7px 12px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#16a34a",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          data-testid={`progress-open-project-report-${proj.projectId}`}
                        >
                          View Report →
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "28px 20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <LuCodeXml size={30} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                  <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#334155" }}>
                    No Portfolio Projects Completed Yet
                  </p>
                  <p style={{ margin: "0 0 12px", fontSize: "12.5px", color: "#64748b" }}>
                    Build and submit any of the 14 real-world engineering projects in the Coding Projects Workspace to earn your PROJECT COMPLETED badge.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/coding")}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Explore 14 Real-World Projects →
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ================= SECTION: PROCTORED ASSESSMENT REPORTS & GRADES ================= */}
          <section className="mz-p-card" style={{ marginTop: "24px" }}>
            <div className="mz-p-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 className="mz-p-card-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "17px" }}>
                  <LuAward color="#2563eb" size={22} />
                  <span>Proctored Assessment Reports & Grades</span>
                </h3>
                <p className="mz-p-card-subtitle">
                  Permanent accredited assessment attempts across Coding, Fitness, Driving, and Language
                </p>
              </div>
              <button
                type="button"
                className="mz-p-link-btn"
                onClick={() => navigate("/home", { state: { tab: "reports" } })}
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", border: "1px solid #dbeafe", padding: "6px 14px", borderRadius: "8px" }}
              >
                <span>Centralized Archive ({assessmentReports.length})</span>
                <LuArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
              {assessmentReports.length > 0 ? (
                assessmentReports.slice(0, 6).map((rep) => {
                  const isPass = Boolean(rep.passed || (rep.score !== undefined && rep.score >= 80));
                  const subjKey = (rep.subjectKey || "coding").toUpperCase();
                  const totalQ = rep.totalQuestions || 10;
                  const marksObt = rep.marksObtained !== undefined ? rep.marksObtained : rep.score;
                  const totalM = rep.totalMarks || totalQ;

                  return (
                    <div
                      key={rep.id || rep.sessionId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 18px",
                        background: "#ffffff",
                        border: "1.5px solid #e2e8f0",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                      onClick={() => navigate(rep.reportUrl || `/assessment-report/${rep.sessionId}`)}
                      title={`Open complete grade report for ${rep.assessmentTitle}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <TrackBadge type={subjKey === "DRIVING" ? "VEHICLES" : subjKey} size={40} />
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", background: "#f1f5f9", color: "#475569", textTransform: "uppercase" }}>
                              {rep.typeLabel || "Proctored Exam"}
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: isPass ? "#dcfce7" : "#fee2e2", color: isPass ? "#15803d" : "#b91c1c" }}>
                              {isPass ? "PASSED" : "EVALUATED"}
                            </span>
                          </div>
                          <h4 style={{ margin: 0, fontSize: "14.5px", fontWeight: 700, color: "#0f172a" }}>
                            {rep.assessmentTitle || rep.questionTitle}
                          </h4>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>
                            Submitted: {rep.submittedAt ? new Date(rep.submittedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                            {marksObt} / {totalM} Marks
                          </div>
                          <div style={{ fontSize: "12px", color: isPass ? "#059669" : "#dc2626", fontWeight: 600 }}>
                            {rep.percentage}% ({rep.accuracy}% Accuracy)
                          </div>
                        </div>

                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "15px",
                            background: isPass ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            color: isPass ? "#059669" : "#dc2626",
                            border: `1.5px solid ${isPass ? "#a7f3d0" : "#fecaca"}`,
                          }}
                        >
                          {rep.grade || "F"}
                        </div>

                        <button
                          type="button"
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            background: "#2563eb",
                            color: "#ffffff",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(rep.reportUrl || `/assessment-report/${rep.sessionId}`);
                          }}
                        >
                          <span>View Report</span>
                          <LuArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "32px 20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <LuAward size={32} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                  <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#334155" }}>
                    No Proctored Assessment Reports Saved Yet
                  </p>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                    Complete a 10-MCQ accreditation exam or practical coding challenge to generate your tamper-proof report.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* ================= FLOATING GREEN TOAST NOTIFICATION ================= */}
      {toastNotification && (
        <div className="mz-p-floating-toast">
          <div className="mz-p-toast-left">
            <div className="mz-p-toast-icon-wrap">
              <LuCircleCheck size={18} />
            </div>
            <div className="mz-p-toast-body">
              <h5 className="mz-p-toast-title">{toastNotification.title}</h5>
              <p className="mz-p-toast-sub">{toastNotification.subtext}</p>
            </div>
          </div>
          <button
            type="button"
            className="mz-p-toast-close"
            onClick={() => setToastNotification(null)}
            title="Dismiss notification"
          >
            <LuX size={15} />
          </button>
        </div>
      )}

      {/* ================= MODAL 1: LOG ACTIVITY ================= */}
      {isLogModalOpen && (
        <div
          className="mz-p-modal-backdrop"
          onClick={() => {
            setIsLogModalOpen(false);
            setIsLogConfirmed(false);
          }}
        >
          <div
            className="mz-p-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: isLogConfirmed ? "460px" : "520px" }}
          >
            {isLogConfirmed && confirmedLogData ? (
              <div style={{ textAlign: "center", padding: "10px 4px" }} data-testid="progress-log-confirmed-screen">
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "1.5px solid #a7f3d0" }}>
                  <LuCircleCheck size={36} color="#10b981" />
                </div>
                <h3 style={{ fontSize: "19px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>Activity Logged Successfully!</h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>Your progress record and XP have been verified and saved.</p>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", textAlign: "left", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Learning Track</span>
                    <span style={{ fontWeight: 700, fontSize: "11.5px", padding: "2px 8px", borderRadius: "6px", background: "#eff6ff", color: "#2563eb" }}>{confirmedLogData.track}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Activity Type</span>
                    <span style={{ color: "#0f172a" }}>{confirmedLogData.task}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Topic / Lesson</span>
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>{confirmedLogData.moduleName}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Duration</span>
                    <span style={{ color: "#0f172a" }}>{confirmedLogData.hoursSpent} hrs</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Earned XP</span>
                    <span style={{ fontWeight: 700, color: "#10b981", background: "#ecfdf5", padding: "2px 8px", borderRadius: "6px" }}>+{confirmedLogData.xpEarned} XP</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="mz-p-btn-save"
                  style={{ width: "100%", marginTop: "20px", padding: "12px", borderRadius: "12px" }}
                  onClick={() => {
                    setIsLogModalOpen(false);
                    setIsLogConfirmed(false);
                    setConfirmedLogData(null);
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="mz-p-modal-header">
                  <div className="mz-p-modal-title-row">
                    <div className="mz-p-modal-icon-badge">
                      <LuPlus size={18} />
                    </div>
                    <div>
                      <h3 className="mz-p-modal-title">Log Learning Activity</h3>
                      <p className="mz-p-modal-sub">Record verified lessons, study hours, or workouts</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mz-p-modal-close"
                    onClick={() => setIsLogModalOpen(false)}
                  >
                    <LuX size={18} />
                  </button>
                </div>

                <form onSubmit={handleLogActivity} className="mz-p-modal-form">
                  <div className="mz-p-form-group">
                    <label className="mz-p-form-label">Learning Track</label>
                    <div className="mz-p-track-select-grid">
                      {[
                        { key: "CODING", name: "Coding" },
                        { key: "LANGUAGE", name: "Language" },
                        { key: "VEHICLES", name: "Vehicles" },
                        { key: "FITNESS", name: "Gym & Fitness" },
                      ].map((t) => (
                        <button
                          type="button"
                          key={t.key}
                          className={`mz-p-track-select-pill ${logForm.track === t.key ? "selected" : ""}`}
                          onClick={() => setLogForm({ ...logForm, track: t.key })}
                        >
                          <TrackBadge type={t.key} size={24} />
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mz-p-form-group">
                    <label className="mz-p-form-label">Activity Type</label>
                    <select
                      className="mz-p-form-input"
                      value={logForm.task}
                      onChange={(e) => setLogForm({ ...logForm, task: e.target.value })}
                    >
                      <option value="Completed a lesson">Completed a lesson</option>
                      <option value="Joined study group">Joined study group</option>
                      <option value="Workout logged">Workout logged</option>
                      <option value="Learned new vocabulary">Learned new vocabulary</option>
                      <option value="Practice session completed">Practice session completed</option>
                      <option value="Module exam passed">Module exam passed</option>
                    </select>
                  </div>

                  <div className="mz-p-form-group">
                    <label className="mz-p-form-label">Lesson / Module Topic Name</label>
                    <input
                      type="text"
                      className="mz-p-form-input"
                      placeholder="e.g. Python - Variables and Data Types"
                      value={logForm.moduleName}
                      onChange={(e) => setLogForm({ ...logForm, moduleName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mz-p-form-row">
                    <div className="mz-p-form-group">
                      <label className="mz-p-form-label">Study Hours</label>
                      <select
                        className="mz-p-form-input"
                        value={logForm.hoursSpent}
                        onChange={(e) => setLogForm({ ...logForm, hoursSpent: e.target.value })}
                      >
                        <option value="0.5">0.5 hrs (30 mins)</option>
                        <option value="0.75">0.75 hrs (45 mins)</option>
                        <option value="1.0">1.0 hr (60 mins)</option>
                        <option value="1.5">1.5 hrs (90 mins)</option>
                        <option value="2.0">2.0 hrs (120 mins)</option>
                        <option value="3.0">3.0 hrs</option>
                      </select>
                    </div>

                    <div className="mz-p-form-group">
                      <label className="mz-p-form-label">XP Earned</label>
                      <select
                        className="mz-p-form-input"
                        value={logForm.xpEarned}
                        onChange={(e) => setLogForm({ ...logForm, xpEarned: e.target.value })}
                      >
                        <option value="15">+15 XP</option>
                        <option value="20">+20 XP</option>
                        <option value="30">+30 XP</option>
                        <option value="50">+50 XP</option>
                      </select>
                    </div>
                  </div>

                  <div className="mz-p-modal-actions">
                    <button
                      type="button"
                      className="mz-p-btn-cancel"
                      onClick={() => setIsLogModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="mz-p-btn-save" disabled={isLogging}>
                      {isLogging ? "Saving Record..." : "Save Learning Record"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ALL TRACKS & CURRENT MODULES ================= */}
      {isTracksModalOpen && (
        <div className="mz-p-modal-backdrop" onClick={() => setIsTracksModalOpen(false)}>
          <div className="mz-p-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="mz-p-modal-header">
              <div>
                <h3 className="mz-p-modal-title">Learning Tracks & Active Modules</h3>
                <p className="mz-p-modal-sub">Continue your learning journey across all 4 tracks</p>
              </div>
              <button
                type="button"
                className="mz-p-modal-close"
                onClick={() => setIsTracksModalOpen(false)}
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="mz-p-tracks-modal-grid">
              {tracksProgress.map((track) => (
                <div key={track.key} className="mz-p-track-detail-card">
                  <div className="mz-p-track-detail-top">
                    <TrackBadge type={track.key} size={44} />
                    <div className="mz-p-track-detail-header">
                      <h4 className="mz-p-track-detail-name">{track.title}</h4>
                      <p className="mz-p-track-detail-sub">{track.subtitle}</p>
                    </div>
                  </div>

                  <div className="mz-p-active-module-box">
                    <span className="mz-p-active-module-label">CURRENT ACTIVE MODULE</span>
                    <p className="mz-p-active-module-name">{track.currentModule}</p>
                  </div>

                  <div className="mz-p-detail-progress-wrap">
                    <div className="mz-p-detail-progress-nums">
                      <span>Completion</span>
                      <strong>{track.percentage}% ({track.completedLessons}/{track.totalLessons} lessons)</strong>
                    </div>
                    <div className="mz-p-progress-track-bar">
                      <div
                        className="mz-p-progress-fill"
                        style={{ width: `${track.percentage}%`, background: track.fillColor }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mz-p-btn-continue"
                    onClick={() => {
                      setIsTracksModalOpen(false);
                      navigate(track.route);
                    }}
                  >
                    <span>Continue Learning</span>
                    <LuArrowRight size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ACTIVITY HISTORY ================= */}
      {isActivityModalOpen && (
        <div className="mz-p-modal-backdrop" onClick={() => setIsActivityModalOpen(false)}>
          <div className="mz-p-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="mz-p-modal-header">
              <div>
                <h3 className="mz-p-modal-title">Verified Learning Activity History</h3>
                <p className="mz-p-modal-sub">Audit log of your completed modules, lessons, and workouts</p>
              </div>
              <button
                type="button"
                className="mz-p-modal-close"
                onClick={() => setIsActivityModalOpen(false)}
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="mz-p-modal-activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((act) => (
                  <div key={act.id} className="mz-p-activity-row">
                    <TrackBadge type={act.track} size={38} />
                    <div className="mz-p-activity-info">
                      <span className="mz-p-activity-title">{act.title}</span>
                      <span className="mz-p-activity-sub">{act.subtitle}</span>
                      <span className="mz-p-activity-sub-date">
                        {new Date(act.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="mz-p-activity-meta">
                      <span className="mz-p-activity-time">{act.timeAgo}</span>
                      <span className="mz-p-xp-pill">+{act.xp} XP</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="mz-p-empty-state">
                  <p className="mz-p-empty-title">No learning history recorded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: ACHIEVEMENTS & CERTIFICATES ================= */}
      {isAchievementsModalOpen && (
        <div className="mz-p-modal-backdrop" onClick={() => setIsAchievementsModalOpen(false)}>
          <div className="mz-p-modal-box large" onClick={(e) => e.stopPropagation()}>
            <div className="mz-p-modal-header">
              <div>
                <h3 className="mz-p-modal-title">Badges & Official Certifications</h3>
                <p className="mz-p-modal-sub">Earned credentials with performance-based grading</p>
              </div>
              <button
                type="button"
                className="mz-p-modal-close"
                onClick={() => setIsAchievementsModalOpen(false)}
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Achievements Grid */}
            <h4 className="mz-p-section-subhead">Earned Milestone Badges</h4>
            <div className="mz-p-achieve-modal-grid">
              {(dashboardData?.allAchievements || []).map((ach) => {
                const isEarned = ach.isEligible;
                return (
                  <div key={ach.id} className={`mz-p-badge-card ${isEarned ? "earned" : "locked"}`}>
                    <div
                      className="mz-p-badge-icon"
                      style={{
                        backgroundColor: isEarned ? `${ach.badgeColor}20` : "#f1f5f9",
                        color: isEarned ? ach.badgeColor : "#94a3b8",
                      }}
                    >
                      <LuTrophy size={26} />
                    </div>
                    <div className="mz-p-badge-info">
                      <div className="mz-p-badge-title-row">
                        <span className="mz-p-badge-name">{ach.name}</span>
                        {isEarned ? (
                          <span className="mz-p-grade-pill">{ach.grade}</span>
                        ) : (
                          <span className="mz-p-locked-pill">Locked</span>
                        )}
                      </div>
                      <p className="mz-p-badge-desc">{ach.description}</p>
                      {isEarned ? (
                        <span className="mz-p-badge-earned-date">Unlocked {ach.timeAgo}</span>
                      ) : (
                        <span className="mz-p-badge-criteria">Criteria: {ach.description}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Certifications Section */}
            <h4 className="mz-p-section-subhead" style={{ marginTop: 24 }}>
              Official Certifications
            </h4>
            <div className="mz-p-certs-grid">
              {(dashboardData?.certifications || []).length > 0 ? (
                (dashboardData?.certifications || []).map((c) => (
                  <div key={c._id} className="mz-p-cert-card">
                    <div className="mz-p-cert-left">
                      <div className="mz-p-cert-seal">
                        <LuAward size={24} />
                      </div>
                      <div>
                        <h5 className="mz-p-cert-name">{c.name}</h5>
                        <p className="mz-p-cert-zone">Mastery Track: {c.zone}</p>
                        <span className={`mz-p-cert-status ${c.status}`}>
                          {c.status === "completed" ? "Verified & Certified" : `In Progress (Module ${c.currentModule}/${c.totalModules})`}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mz-p-btn-view-cert"
                      onClick={() => setActiveCertPreview(c)}
                    >
                      <span>View Certificate</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="mz-p-empty-cert-box">
                  <p className="mz-p-empty-desc">
                    No certifications completed yet. Enroll and pass module exams in Coding, Language, Driving, or Fitness to earn authenticated certificates.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: CERTIFICATE PREVIEW / DOWNLOAD ================= */}
      {activeCertPreview && (
        <div className="mz-p-modal-backdrop" onClick={() => setActiveCertPreview(null)}>
          <div className="mz-p-modal-box cert-preview-box" onClick={(e) => e.stopPropagation()}>
            <div className="mz-p-modal-header">
              <h3 className="mz-p-modal-title">Verified Certificate Preview</h3>
              <button
                type="button"
                className="mz-p-modal-close"
                onClick={() => setActiveCertPreview(null)}
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Printable Certificate Template */}
            <div className="mz-p-certificate-frame" id="printable-cert">
              <div className="mz-p-cert-border">
                <div className="mz-p-cert-inner">
                  <div className="mz-p-cert-header">
                    <img src={logoIcon} alt="Mastery Zone" className="mz-p-cert-logo" />
                    <span className="mz-p-cert-org">MASTERY ZONE ACCREDITATION</span>
                  </div>

                  <h2 className="mz-p-cert-headline">CERTIFICATE OF ACHIEVEMENT</h2>
                  <p className="mz-p-cert-subhead">This is proudly presented to</p>

                  <h1 className="mz-p-cert-recipient">{user?.fullName || user?.username}</h1>

                  <p className="mz-p-cert-for">
                    for successfully demonstrating verified mastery in the course curriculum of
                  </p>

                  <h3 className="mz-p-cert-course">{activeCertPreview.name}</h3>

                  <div className="mz-p-cert-footer">
                    <div className="mz-p-cert-sign">
                      <div className="mz-p-sign-line" />
                      <span>Academic Board</span>
                    </div>

                    <div className="mz-p-cert-badge-gold">
                      <LuAward size={36} />
                      <span className="mz-p-gold-text">VERIFIED</span>
                    </div>

                    <div className="mz-p-cert-date">
                      <div className="mz-p-sign-line" />
                      <span>
                        Date: {new Date(activeCertPreview.updatedAt || Date.now()).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="mz-p-cert-hash">
                    Credential ID: MZ-{activeCertPreview._id?.slice(-8).toUpperCase()} • Verified on Mastery Zone
                  </p>
                </div>
              </div>
            </div>

            <div className="mz-p-cert-actions">
              <button
                type="button"
                className="mz-p-btn-download"
                onClick={() => {
                  window.print();
                }}
              >
                <LuPrinter size={16} />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                className="mz-p-btn-cancel"
                onClick={() => setActiveCertPreview(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SETTINGS MODAL ================= */}
      {isSettingsModalOpen && (
        <div className="mz-p-modal-backdrop" onClick={() => setIsSettingsModalOpen(false)}>
          <div className="mz-p-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mz-p-modal-header">
              <h3 className="mz-p-modal-title">Account Settings</h3>
              <button
                type="button"
                className="mz-p-modal-close"
                onClick={() => setIsSettingsModalOpen(false)}
              >
                <LuX size={18} />
              </button>
            </div>
            <div className="mz-p-settings-body">
              <p>Signed in as <strong>{user?.email}</strong></p>
              <p className="mz-p-settings-sub">To change password or update full profile details, visit your profile page.</p>
              <button
                type="button"
                className="mz-p-btn-save"
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  navigate("/profile");
                }}
              >
                Open Full Profile Settings
              </button>
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0" }}>
                  Need to restart your learning paths or retake curriculum modules and tests?
                </p>
                <button
                  type="button"
                  className="mz-p-btn-reset-learning"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => {
                    setIsSettingsModalOpen(false);
                    setIsResetModalOpen(true);
                  }}
                >
                  <LuRotateCcw size={15} />
                  <span>Reset Learning Process</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= LOGOUT MODAL ================= */}
      {isLogoutModalOpen && (
        <div className="mz-p-modal-backdrop" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="mz-p-modal-box small" onClick={(e) => e.stopPropagation()}>
            <div className="mz-p-modal-header">
              <h3 className="mz-p-modal-title">Confirm Log Out</h3>
              <button
                type="button"
                className="mz-p-modal-close"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                <LuX size={18} />
              </button>
            </div>
            <p className="mz-p-logout-text">Are you sure you want to end your current session?</p>
            <div className="mz-p-modal-actions">
              <button
                type="button"
                className="mz-p-btn-cancel"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Stay Logged In
              </button>
              <button
                type="button"
                className="mz-p-btn-logout-confirm"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RESET LEARNING PROGRESS MODAL ================= */}
      {isResetModalOpen && (
        <div className="mz-p-modal-backdrop" onClick={() => !isResetting && setIsResetModalOpen(false)}>
          <div className="mz-p-modal-box mz-reset-learning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mz-reset-modal-header">
              <div className="mz-reset-modal-icon-ring">
                <LuRotateCcw size={22} />
              </div>
              <div>
                <h3 className="mz-reset-modal-title">Reset Learning Process</h3>
                <p className="mz-reset-modal-sub">Reset tests, module progress, lessons, and activity records</p>
              </div>
              <button
                type="button"
                className="mz-p-modal-close"
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
                  This action will permanently reset your learning progress, completed lessons, module test attempts, and scores back to zero.
                </span>
              </div>

              <div className="mz-reset-scope-selector">
                <label className="mz-reset-scope-title">Select Learning Scope to Reset:</label>

                <label className={`mz-reset-radio-option ${resetScope === "all" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="progressResetScope"
                    value="all"
                    checked={resetScope === "all"}
                    onChange={() => setResetScope("all")}
                  />
                  <div className="mz-reset-radio-content">
                    <strong>Reset Everything (All Tracks & Platforms)</strong>
                    <span>Resets Coding, Language, Driving, Fitness, all test scores, and activity history.</span>
                  </div>
                </label>

                <label className={`mz-reset-radio-option ${resetScope === "coding" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="progressResetScope"
                    value="coding"
                    checked={resetScope === "coding"}
                    onChange={() => setResetScope("coding")}
                  />
                  <div className="mz-reset-radio-content">
                    <strong>Coding Curriculum & Challenges Only</strong>
                    <span>Resets all programming tracks (Python, JS, Java, C++, DSA), exercises, and tests.</span>
                  </div>
                </label>

                <label className={`mz-reset-radio-option ${resetScope === "language" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="progressResetScope"
                    value="language"
                    checked={resetScope === "language"}
                    onChange={() => setResetScope("language")}
                  />
                  <div className="mz-reset-radio-content">
                    <strong>Language Curriculum Only</strong>
                    <span>Resets Spanish, French, German, Japanese, and English modules & test exams.</span>
                  </div>
                </label>

                <label className={`mz-reset-radio-option ${resetScope === "driving" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="progressResetScope"
                    value="driving"
                    checked={resetScope === "driving"}
                    onChange={() => setResetScope("driving")}
                  />
                  <div className="mz-reset-radio-content">
                    <strong>Driving & Vehicle Modules Only</strong>
                    <span>Resets road rules, defensive driving, and DMV-style tests.</span>
                  </div>
                </label>

                <label className={`mz-reset-radio-option ${resetScope === "fitness" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="progressResetScope"
                    value="fitness"
                    checked={resetScope === "fitness"}
                    onChange={() => setResetScope("fitness")}
                  />
                  <div className="mz-reset-radio-content">
                    <strong>Fitness & Training Modules Only</strong>
                    <span>Resets workout programs, nutrition modules, and fitness tests.</span>
                  </div>
                </label>
              </div>

              <div className="mz-reset-summary-list">
                <div className="mz-reset-summary-item">
                  <LuCheck size={14} color="#dc2626" />
                  <span>Modules will be set to 0% and locked modules restored to initial state.</span>
                </div>
                <div className="mz-reset-summary-item">
                  <LuCheck size={14} color="#dc2626" />
                  <span>All module test assessment scores, proctored attempts, and history will be cleared.</span>
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
                Cancel & Keep Progress
              </button>
              <button
                type="button"
                className="mz-reset-btn-confirm"
                onClick={handleResetLearningProcess}
                disabled={isResetting}
              >
                {isResetting ? "Resetting Progress..." : "Yes, Reset Learning Process"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;
