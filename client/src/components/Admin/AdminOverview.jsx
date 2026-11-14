import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Admin.css";
import {
  LuChartBar,
  LuUsers,
  LuUserCheck,
  LuZap,
  LuFileText,
  LuCode,
  LuDatabase,
  LuCalendar,
  LuShield,
  LuCamera,
  LuMic,
  LuMonitor,
  LuTrophy,
  LuRadio,
  LuSlidersHorizontal,
  LuTrendingUp,
  LuCheck,
  LuCircleAlert,
} from "react-icons/lu";
import { deduplicatedFetch, isDocumentVisible } from "../../utils/apiClient";
import { getSharedSocket, releaseSharedSocket } from "../../utils/socketClient";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Smooth cubic bezier path generator for sparklines
const generateSparklinePath = (points = []) => {
  if (!points || points.length === 0) {
    return "M 0 24 L 160 24";
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 160;
  const height = 32;
  const pad = 6;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1 || 1)) * width;
    const y = height - pad - ((p - min) / range) * (height - 2 * pad);
    return { x, y };
  });
  if (coords.length === 1) return `M 0 ${coords[0].y} L ${width} ${coords[0].y}`;
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const cur = coords[i];
    const cpX1 = prev.x + (cur.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (cur.x - prev.x) / 2;
    const cpY2 = cur.y;
    d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${cur.x} ${cur.y}`;
  }
  return d;
};

// Rich Sparkline with subtle gradient area fill underneath the curve
const Sparkline = ({ id = "spark", stroke = "#3b82f6", data, d }) => {
  const pathData = data && data.length > 0 ? generateSparklinePath(data) : (d || "M 0 24 L 160 24");
  const areaData = `${pathData} L 160 36 L 0 36 Z`;
  const gradId = `spark-grad-${id}`;
  return (
    <svg
      viewBox="0 0 160 36"
      style={{
        width: "100%",
        height: 32,
        display: "block",
        overflow: "visible",
        marginTop: 8,
      }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaData} fill={`url(#${gradId})`} />
      <path
        d={pathData}
        fill="none"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// User Avatar Helpers for human-centric table lists
const getUserMonogram = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name = "") => {
  const colors = [
    { bg: "rgba(99, 102, 241, 0.14)", text: "#6366f1" },
    { bg: "rgba(16, 185, 129, 0.14)", text: "#10b981" },
    { bg: "rgba(245, 158, 11, 0.14)", text: "#d97706" },
    { bg: "rgba(168, 85, 247, 0.14)", text: "#a855f7" },
    { bg: "rgba(239, 68, 68, 0.14)", text: "#ef4444" },
    { bg: "rgba(6, 182, 212, 0.14)", text: "#0891b2" },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Skeleton Loader Component for Seamless First Load
const AdminOverviewSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, margin: "0 auto", paddingBottom: 48, width: "100%" }}>
    {/* Header Skeleton */}
    <div className="mz-admin-page-header">
      <div className="mz-admin-page-title-box">
        <div className="mz-skeleton-text" style={{ width: 44, height: 44, borderRadius: 13 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="mz-skeleton-text" style={{ width: 190, height: 26 }} />
          <div className="mz-skeleton-text" style={{ width: 300, height: 14 }} />
        </div>
      </div>
      <div className="mz-skeleton-text" style={{ width: 150, height: 38, borderRadius: 12 }} />
    </div>

    {/* 6 Metric Cards Skeleton */}
    <div className="mz-admin-metrics-row">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="mz-admin-metric-card" style={{ minHeight: 156 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="mz-skeleton-text" style={{ width: 36, height: 36, borderRadius: 10 }} />
            <div className="mz-skeleton-text" style={{ width: 48, height: 16, borderRadius: 6 }} />
          </div>
          <div className="mz-skeleton-text" style={{ width: 80, height: 12, marginBottom: 6 }} />
          <div className="mz-skeleton-text" style={{ width: 110, height: 28, marginBottom: 8 }} />
          <div className="mz-skeleton-text" style={{ width: 130, height: 12, marginBottom: 10 }} />
          <div className="mz-skeleton-text" style={{ width: "100%", height: 30, borderRadius: 4 }} />
        </div>
      ))}
    </div>

    {/* Middle Row Skeleton */}
    <div className="mz-admin-middle-row">
      <div className="mz-admin-card" style={{ minHeight: 330 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div className="mz-skeleton-text" style={{ width: 180, height: 20 }} />
          <div className="mz-skeleton-text" style={{ width: 120, height: 28, borderRadius: 8 }} />
        </div>
        <div className="mz-skeleton-text" style={{ width: "100%", height: 210, borderRadius: 12 }} />
      </div>

      <div className="mz-admin-card" style={{ minHeight: 330 }}>
        <div className="mz-skeleton-text" style={{ width: 160, height: 20, marginBottom: 20 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 130 }}>
          <div className="mz-skeleton-text" style={{ width: 120, height: 120, borderRadius: "50%" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          <div className="mz-skeleton-text" style={{ width: "100%", height: 16 }} />
          <div className="mz-skeleton-text" style={{ width: "90%", height: 16 }} />
        </div>
      </div>

      <div className="mz-admin-card" style={{ minHeight: 330 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div className="mz-skeleton-text" style={{ width: 140, height: 20 }} />
          <div className="mz-skeleton-text" style={{ width: 80, height: 22, borderRadius: 12 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="mz-skeleton-text" style={{ width: "100%", height: 42, borderRadius: 8 }} />
          <div className="mz-skeleton-text" style={{ width: "100%", height: 42, borderRadius: 8 }} />
          <div className="mz-skeleton-text" style={{ width: "100%", height: 42, borderRadius: 8 }} />
        </div>
      </div>
    </div>

    {/* Bottom Row Skeleton */}
    <div className="mz-admin-bottom-row">
      <div className="mz-admin-card" style={{ minHeight: 280, padding: 20 }}>
        <div className="mz-skeleton-text" style={{ width: 200, height: 20, marginBottom: 16 }} />
        <div className="mz-skeleton-text" style={{ width: "100%", height: 190, borderRadius: 10 }} />
      </div>
      <div className="mz-admin-card" style={{ minHeight: 280, padding: 20 }}>
        <div className="mz-skeleton-text" style={{ width: 160, height: 20, marginBottom: 16 }} />
        <div className="mz-skeleton-text" style={{ width: "100%", height: 190, borderRadius: 10 }} />
      </div>
    </div>
  </div>
);

const AdminOverview = () => {
  const [filterRange, setFilterRange] = useState("30d"); // "today" | "yesterday" | "7d" | "30d" | "3m" | "custom"
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateLabel, setDateLabel] = useState("Last 30 Days");

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoverPixel, setHoverPixel] = useState(null);
  const [hoveredTrack, setHoveredTrack] = useState(null);
  const [activeTab, setActiveTab] = useState("30d");
  const [errorState, setErrorState] = useState(null);
  const datePickerRef = useRef(null);
  const chartSvgRef = useRef(null);

  const fetchOverview = async (range = filterRange, start = customStart, end = customEnd, isBackground = false) => {
    try {
      if (!isBackground && !overviewData) {
        setLoading(true);
      } else {
        setIsFetching(true);
      }
      setErrorState(null);

      const token = localStorage.getItem("token");
      let url = `${API_BASE}/api/admin/overview?range=${range}`;
      if (range === "custom" && start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }

      const res = await deduplicatedFetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cacheTtlMs: 5000,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOverviewData(json.data);
        } else {
          setErrorState(json.message || "Failed to load dashboard metrics");
        }
      } else {
        setErrorState("Server returned an error while loading overview metrics.");
      }
    } catch (err) {
      console.error("Overview fetch error:", err);
      setErrorState(err.message || "Network error loading overview");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchOverview(filterRange, customStart, customEnd);
    const interval = setInterval(() => {
      if (isDocumentVisible()) {
        fetchOverview(filterRange, customStart, customEnd, true);
      }
    }, 20000); // 20s auto-refresh for real-time live data

    const handleOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);

    // Socket real-time synchronization
    const socket = getSharedSocket();
    const handleRealTimeEvent = () => {
      fetchOverview(filterRange, customStart, customEnd, true);
    };

    socket.on("live_session_update", handleRealTimeEvent);
    socket.on("live_session_ended", handleRealTimeEvent);
    socket.on("NEW_SUBMISSION", handleRealTimeEvent);
    socket.on("ASSESSMENT_MARKS_UPDATED", handleRealTimeEvent);
    socket.on("NEW_REPORT", handleRealTimeEvent);
    socket.on("ADMIN_USERS_UPDATED", handleRealTimeEvent);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleOutside);
      socket.off("live_session_update", handleRealTimeEvent);
      socket.off("live_session_ended", handleRealTimeEvent);
      socket.off("NEW_SUBMISSION", handleRealTimeEvent);
      socket.off("ASSESSMENT_MARKS_UPDATED", handleRealTimeEvent);
      socket.off("NEW_REPORT", handleRealTimeEvent);
      socket.off("ADMIN_USERS_UPDATED", handleRealTimeEvent);
      releaseSharedSocket(socket);
    };
  }, [filterRange]);

  const handleSelectRange = (rangeKey, label) => {
    setFilterRange(rangeKey);
    setActiveTab(rangeKey);
    setDateLabel(label);
    if (rangeKey !== "custom") {
      setShowDatePicker(false);
      fetchOverview(rangeKey, customStart, customEnd);
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    const startObj = new Date(customStart);
    const endObj = new Date(customEnd);
    const label = `${startObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    setDateLabel(label);
    setShowDatePicker(false);
    fetchOverview("custom", customStart, customEnd);
  };

  // If initial load with no cached data, display shimmer skeleton
  if (loading && !overviewData) {
    return <AdminOverviewSkeleton />;
  }

  const stats = overviewData?.stats || {};
  const trendPoints = overviewData?.activityTrend || [];
  const trackDistribution = overviewData?.learningTrackDistribution || [
    { name: "Python Programming", count: 0, percentage: 0, color: "#3b82f6" },
    { name: "Web Development", count: 0, percentage: 0, color: "#10b981" },
    { name: "Data Structures & Algorithms", count: 0, percentage: 0, color: "#8b5cf6" },
    { name: "C++ & Systems", count: 0, percentage: 0, color: "#6366f1" },
    { name: "Java Development", count: 0, percentage: 0, color: "#f59e0b" },
  ];
  const recentAssessments = overviewData?.recentAssessmentResults || [];
  const liveSessions = overviewData?.liveSessions || [];
  const proctoring = overviewData?.proctoringStatus || {
    overall: "Standby (Ready)",
    camera: { status: "Standby", count: 0, label: "Idle (Standby)" },
    microphone: { status: "Standby", count: 0, label: "Idle (Standby)" },
    screenSharing: { status: "Standby", count: 0, label: "Idle (Standby)" },
    activeProctoredSessions: 0,
  };

  // Track distribution metrics for center of donut
  const totalTrackUsers = trackDistribution.reduce((acc, t) => acc + (t.count || 0), 0);
  const topTrack = trackDistribution.reduce(
    (max, t) => (t.percentage > (max?.percentage || 0) ? t : max),
    trackDistribution[0] || { name: "Python Programming", count: 0, percentage: 0 }
  );

  // Dynamic SVG Trend Chart Calculations
  const trendValues = trendPoints.map((p) => Number(p.activeUsers || 0));
  const rawMax = Math.max(1, ...trendValues);
  const maxActive = rawMax > 500 ? 1500 : rawMax > 50 ? 100 : Math.max(10, rawMax);

  // Telemetry aggregates based strictly on real dataset
  const peakUsers = trendValues.length > 0 ? Math.max(...trendValues) : 0;
  const avgUsers = trendValues.length > 0 ? Math.round(trendValues.reduce((a, b) => a + b, 0) / trendValues.length) : 0;
  const latestUsers = trendValues.length > 0 ? trendValues[trendValues.length - 1] : 0;
  const totalVolume = trendValues.reduce((a, b) => a + b, 0);

  const formatYLabel = (val) => {
    if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    return Math.round(val);
  };

  const chartHeight = 160;
  const chartWidth = 560;

  const pointsCount = trendPoints.length || 1;
  const svgCoords = trendPoints.map((pt, i) => {
    const x = pointsCount === 1 ? chartWidth / 2 : 24 + (i / (pointsCount - 1)) * (chartWidth - 48);
    const y = chartHeight - 24 - (Number(pt.activeUsers || 0) / maxActive) * (chartHeight - 52);
    return { x, y, date: pt.date, activeUsers: Number(pt.activeUsers || 0) };
  });

  // Default active highlight at 4th milestone or middle point if not hovering
  const activeHighlightedPoint = hoveredPoint || (svgCoords.length >= 4 ? svgCoords[Math.floor(svgCoords.length * 0.75)] : svgCoords[0]);

  // Build smooth cubic bezier curve
  let pathD = "";
  if (svgCoords.length === 1) {
    pathD = `M 0 ${svgCoords[0].y} L ${chartWidth} ${svgCoords[0].y}`;
  } else if (svgCoords.length > 1) {
    pathD = `M ${svgCoords[0].x} ${svgCoords[0].y}`;
    for (let i = 1; i < svgCoords.length; i++) {
      const prev = svgCoords[i - 1];
      const cur = svgCoords[i];
      const cpX1 = prev.x + (cur.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (cur.x - prev.x) / 2;
      const cpY2 = cur.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${cur.x} ${cur.y}`;
    }
  }

  const areaD =
    svgCoords.length > 1
      ? `${pathD} L ${svgCoords[svgCoords.length - 1].x} ${chartHeight} L ${svgCoords[0].x} ${chartHeight} Z`
      : "";

  // Smooth mouse move across entire chart area
  const handleChartMouseMove = (e) => {
    if (!chartSvgRef.current || svgCoords.length === 0) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const relX = (mouseX / rect.width) * chartWidth;

    let closest = svgCoords[0];
    let minDiff = Math.abs(svgCoords[0].x - relX);
    svgCoords.forEach((p) => {
      const diff = Math.abs(p.x - relX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    });

    setHoveredPoint(closest);
    const pixelX = (closest.x / chartWidth) * rect.width;
    const pixelY = (closest.y / chartHeight) * rect.height;
    setHoverPixel({ x: pixelX, y: pixelY });
  };

  const handleChartMouseLeave = () => {
    setHoveredPoint(null);
    setHoverPixel(null);
  };

  // Milestone labels along the bottom (5 evenly spaced dates)
  const milestoneLabels = [];
  if (svgCoords.length <= 5) {
    svgCoords.forEach((p) => milestoneLabels.push(p));
  } else {
    const step = (svgCoords.length - 1) / 4;
    for (let i = 0; i < 5; i++) {
      const idx = Math.min(svgCoords.length - 1, Math.round(i * step));
      milestoneLabels.push(svgCoords[idx]);
    }
  }

  // Format date for tables
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeFormatted = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${dateFormatted} • ${timeFormatted}`;
  };

  const hasAnyActiveStream =
    (proctoring.camera?.count > 0 ||
     proctoring.microphone?.count > 0 ||
     proctoring.screenSharing?.count > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, margin: "0 auto", paddingBottom: 48, position: "relative" }}>
      {/* Background Fetching Indicator */}
      {isFetching && <div className="mz-top-loading-bar" />}

      {/* Error Banner if any */}
      {errorState && (
        <div style={{ padding: "10px 16px", borderRadius: 10, background: "var(--mz-red-bg)", color: "#dc2626", border: "1px solid #fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <LuCircleAlert size={16} />
          <span>{errorState}</span>
        </div>
      )}

      {/* ────────────────── 1. HEADER SECTION & DATE FILTER ────────────────── */}
      <div className="mz-admin-page-header">
        <div className="mz-admin-page-title-box">
          <div className="mz-admin-page-icon">
            <LuChartBar style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="mz-admin-page-title">Platform Overview</h1>
            <p className="mz-admin-page-subtitle">
              Real-time platform telemetry, user metrics, and verified database statistics
            </p>
          </div>
        </div>

        {/* Date Filter Dropdown */}
        <div style={{ position: "relative" }} ref={datePickerRef}>
          <button
            onClick={() => setShowDatePicker((prev) => !prev)}
            className="mz-admin-time-pill"
          >
            <LuCalendar style={{ width: 16, height: 16, color: "#6366f1" }} />
            <span>{dateLabel}</span>
            <span style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>▾</span>
          </button>

          {showDatePicker && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                marginTop: 8,
                width: 280,
                background: "var(--mz-surface)",
                borderRadius: 14,
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                border: "1px solid var(--mz-border)",
                padding: 12,
                zIndex: 60,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                {[
                  { key: "today", label: "Today" },
                  { key: "yesterday", label: "Yesterday" },
                  { key: "7d", label: "Last 7 Days" },
                  { key: "30d", label: "Last 30 Days" },
                  { key: "3m", label: "Last 3 Months" },
                  { key: "custom", label: "Custom Date Range" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleSelectRange(item.key, item.label)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: filterRange === item.key ? "var(--mz-purple-bg)" : "transparent",
                      color: filterRange === item.key ? "#6366f1" : "var(--mz-text-secondary)",
                      fontWeight: filterRange === item.key ? 700 : 500,
                      fontSize: 13,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{item.label}</span>
                    {filterRange === item.key && <LuCheck style={{ width: 14, height: 14 }} />}
                  </button>
                ))}
              </div>

              {filterRange === "custom" && (
                <form onSubmit={handleApplyCustom} style={{ borderTop: "1px solid var(--mz-surface-muted)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--mz-text-muted)" }}>Start Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      required
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1px solid var(--mz-border)", fontSize: 12, marginTop: 2, outline: "none", background: "var(--mz-surface)", color: "var(--mz-text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--mz-text-muted)" }}>End Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      required
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1px solid var(--mz-border)", fontSize: 12, marginTop: 2, outline: "none", background: "var(--mz-surface)", color: "var(--mz-text-primary)" }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="mz-admin-btn-primary"
                    style={{ width: "100%", justifyContent: "center", marginTop: 4, padding: "7px 12px", fontSize: 12 }}
                  >
                    Apply Range
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ────────────────── 2. SIX METRIC CARDS (UNIFORM DIMENSIONS & REAL DB NUMBERS) ────────────────── */}
      <div className="mz-admin-metrics-row">
        {/* Card 1: Total Users */}
        <div className="mz-admin-metric-card" style={{ minHeight: 160 }}>
          <div>
            <div className="mz-admin-metric-card-top">
              <div className="mz-admin-metric-icon" style={{ background: "var(--mz-blue-bg)", color: "#3b82f6" }}>
                <LuUsers style={{ width: 20, height: 20 }} />
              </div>
              <span className="mz-admin-metric-badge" style={{ background: "var(--mz-blue-bg)", color: "#2563eb" }}>
                All Time
              </span>
            </div>
            <p className="mz-admin-metric-label">Total Users</p>
            <h3 className="mz-admin-metric-value">
              {Number(stats.totalUsers?.value || 0).toLocaleString()}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
              <span>↑</span>
              <span>{stats.totalUsers?.trend || "Registered & Verified"}</span>
            </p>
          </div>
          <Sparkline id="totalUsers" stroke="#3b82f6" data={trendValues} />
        </div>

        {/* Card 2: Active Today */}
        <div className="mz-admin-metric-card" style={{ minHeight: 160 }}>
          <div>
            <div className="mz-admin-metric-card-top">
              <div className="mz-admin-metric-icon" style={{ background: "var(--mz-green-bg)", color: "#10b981" }}>
                <LuUserCheck style={{ width: 20, height: 20 }} />
              </div>
              <span className="mz-admin-metric-badge" style={{ background: "var(--mz-green-bg)", color: "#059669" }}>
                Live 24h
              </span>
            </div>
            <p className="mz-admin-metric-label">Active Today</p>
            <h3 className="mz-admin-metric-value">
              {Number(stats.activeToday?.value || 0).toLocaleString()}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
              <span>↑</span>
              <span>{stats.activeToday?.trend || "Active in range"}</span>
            </p>
          </div>
          <Sparkline id="activeToday" stroke="#10b981" data={trendValues} />
        </div>

        {/* Card 3: Active Sessions */}
        <div className="mz-admin-metric-card" style={{ minHeight: 160 }}>
          <div>
            <div className="mz-admin-metric-card-top">
              <div className="mz-admin-metric-icon" style={{ background: "var(--mz-purple-bg)", color: "#8b5cf6" }}>
                <LuZap style={{ width: 20, height: 20 }} />
              </div>
              <span className="mz-admin-metric-badge" style={{ background: "var(--mz-purple-bg)", color: "#7c3aed" }}>
                Real-time
              </span>
            </div>
            <p className="mz-admin-metric-label">Active Sessions</p>
            <h3 className="mz-admin-metric-value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>{Number(stats.activeSessions?.value || 0).toLocaleString()}</span>
              {Number(stats.activeSessions?.value || 0) > 0 && (
                <span className="mz-status-pulsing-dot" style={{ width: 8, height: 8 }} />
              )}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, fontWeight: 600, color: Number(stats.activeSessions?.value || 0) > 0 ? "#10b981" : "var(--mz-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
              <span>●</span>
              <span>{stats.activeSessions?.trend || "Live socket sessions"}</span>
            </p>
          </div>
          <Sparkline id="activeSessions" stroke="#8b5cf6" data={trendValues} />
        </div>

        {/* Card 4: Assessments */}
        <div className="mz-admin-metric-card" style={{ minHeight: 160 }}>
          <div>
            <div className="mz-admin-metric-card-top">
              <div className="mz-admin-metric-icon" style={{ background: "var(--mz-amber-bg)", color: "#f59e0b" }}>
                <LuFileText style={{ width: 20, height: 20 }} />
              </div>
              <span className="mz-admin-metric-badge" style={{ background: "var(--mz-amber-bg)", color: "#d97706" }}>
                Exams
              </span>
            </div>
            <p className="mz-admin-metric-label">Assessments</p>
            <h3 className="mz-admin-metric-value">
              {Number(stats.assessments?.value || 0).toLocaleString()}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, fontWeight: 600, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
              <span>↑</span>
              <span>{stats.assessments?.trend || "Completed exams"}</span>
            </p>
          </div>
          <Sparkline id="assessments" stroke="#f59e0b" data={trendValues} />
        </div>

        {/* Card 5: Coding Submissions */}
        <div className="mz-admin-metric-card" style={{ minHeight: 160 }}>
          <div>
            <div className="mz-admin-metric-card-top">
              <div className="mz-admin-metric-icon" style={{ background: "var(--mz-indigo-bg, #e0e7ff)", color: "#6366f1" }}>
                <LuCode style={{ width: 20, height: 20 }} />
              </div>
              <span className="mz-admin-metric-badge" style={{ background: "var(--mz-indigo-bg, #e0e7ff)", color: "#4f46e5" }}>
                Compiler
              </span>
            </div>
            <p className="mz-admin-metric-label">Coding Submissions</p>
            <h3 className="mz-admin-metric-value">
              {Number(stats.codingSubmissions?.value || 0).toLocaleString()}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
              <span>↑</span>
              <span>{stats.codingSubmissions?.trend || "Compiler evaluations"}</span>
            </p>
          </div>
          <Sparkline id="codingSubmissions" stroke="#6366f1" data={trendValues} />
        </div>

        {/* Card 6: Storage Used */}
        <div className="mz-admin-metric-card" style={{ minHeight: 160 }}>
          <div>
            <div className="mz-admin-metric-card-top">
              <div className="mz-admin-metric-icon" style={{ background: "var(--mz-purple-bg)", color: "#a855f7" }}>
                <LuDatabase style={{ width: 20, height: 20 }} />
              </div>
              <span className="mz-admin-metric-badge" style={{ background: "var(--mz-purple-bg)", color: "#9333ea" }}>
                MongoDB
              </span>
            </div>
            <p className="mz-admin-metric-label">Storage Used</p>
            <h3 className="mz-admin-metric-value">
              {`${stats.storageUsed?.percentage || 0}%`}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, fontWeight: 600, color: "var(--mz-text-muted)" }}>
              {`${stats.storageUsed?.consumedMB || "0.0"} MB of 10 GB`}
            </p>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 8, background: "var(--mz-surface-muted)", borderRadius: 9999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.max(2, Math.min(100, stats.storageUsed?.percentage || 0))}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #6366f1 0%, #a855f7 100%)",
                  borderRadius: 9999,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── 3. MIDDLE ROW: CHARTS & STATUS ────────────────── */}
      <div className="mz-admin-middle-row">
        {/* A. User Activity Trend — Interactive Smooth Bezier Area Chart */}
        <div className="mz-admin-card" style={{ position: "relative" }}>
          <div className="mz-admin-card-header">
            <div>
              <h3 className="mz-admin-card-title">
                <LuTrendingUp style={{ width: 18, height: 18, color: "#6366f1" }} />
                <span>User Activity Trend</span>
              </h3>
              <p className="mz-admin-card-subtitle">
                Telemetry tracking authenticated active users across platform sessions
              </p>
            </div>

            {/* Range Switcher Tabs */}
            <div
              className="mz-admin-filter-tabs"
              style={{
                background: "var(--mz-surface-muted)",
                padding: "3px",
                borderRadius: 9,
                display: "flex",
                gap: 2,
              }}
            >
              {[
                { key: "7d", label: "7D" },
                { key: "30d", label: "30D" },
                { key: "3m", label: "3M" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() =>
                    handleSelectRange(
                      t.key,
                      t.key === "7d"
                        ? "Last 7 Days"
                        : t.key === "30d"
                        ? "Last 30 Days"
                        : "Last 3 Months"
                    )
                  }
                  style={{
                    border: "none",
                    background: activeTab === t.key ? "var(--mz-surface)" : "transparent",
                    color: activeTab === t.key ? "#4f46e5" : "var(--mz-text-muted)",
                    fontWeight: activeTab === t.key ? 700 : 600,
                    padding: "5px 12px",
                    borderRadius: 7,
                    fontSize: 12,
                    cursor: "pointer",
                    boxShadow: activeTab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.18s ease",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Area Chart with Mouse Tracking */}
          <div
            className="mz-chart-container"
            onMouseMove={handleChartMouseMove}
            onMouseLeave={handleChartMouseLeave}
          >
            {/* Y-axis grid lines with dynamic clean values */}
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 11, color: "var(--mz-text-subtle)", pointerEvents: "none", paddingBottom: 28 }}>
              <div style={{ borderBottom: "1px dashed var(--mz-border-subtle)", display: "flex", justifyContent: "flex-start", paddingBottom: 2 }}>
                <span style={{ fontWeight: 600, width: 34 }}>{formatYLabel(maxActive)}</span>
              </div>
              <div style={{ borderBottom: "1px dashed var(--mz-border-subtle)", display: "flex", justifyContent: "flex-start", paddingBottom: 2 }}>
                <span style={{ fontWeight: 600, width: 34 }}>{formatYLabel(maxActive * 0.66)}</span>
              </div>
              <div style={{ borderBottom: "1px dashed var(--mz-border-subtle)", display: "flex", justifyContent: "flex-start", paddingBottom: 2 }}>
                <span style={{ fontWeight: 600, width: 34 }}>{formatYLabel(maxActive * 0.33)}</span>
              </div>
              <div style={{ borderBottom: "1px solid var(--mz-border-subtle)", display: "flex", justifyContent: "flex-start", paddingBottom: 2 }}>
                <span style={{ fontWeight: 600, width: 34 }}>0</span>
              </div>
            </div>

            {/* SVG Curves & Area */}
            <svg
              ref={chartSvgRef}
              style={{ width: "100%", height: chartHeight, marginTop: 4, overflow: "visible", cursor: "crosshair" }}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="trendGradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#818cf8" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>

                <filter id="trendGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.28" />
                </filter>
              </defs>

              {/* Area fill */}
              {areaD && (
                <path
                  d={areaD}
                  fill="url(#trendGradientFill)"
                  style={{ transition: "d 0.35s ease" }}
                />
              )}

              {/* Glowing smooth spline line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  filter="url(#trendGlowFilter)"
                  style={{ transition: "d 0.35s ease" }}
                />
              )}

              {/* Vertical Crosshair Guide */}
              {activeHighlightedPoint && (
                <line
                  x1={activeHighlightedPoint.x}
                  y1={0}
                  x2={activeHighlightedPoint.x}
                  y2={chartHeight}
                  stroke="#818cf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
              )}

              {/* Regular Point Dots */}
              {svgCoords.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="var(--mz-surface)"
                  stroke="#6366f1"
                  strokeWidth="2.2"
                />
              ))}

              {/* Active / Highlighted Marker */}
              {activeHighlightedPoint && (
                <g>
                  <circle
                    cx={activeHighlightedPoint.x}
                    cy={activeHighlightedPoint.y}
                    r="10"
                    fill="#6366f1"
                    opacity="0.22"
                    className="mz-chart-pulse-ring"
                  />
                  <circle
                    cx={activeHighlightedPoint.x}
                    cy={activeHighlightedPoint.y}
                    r="5.5"
                    fill="var(--mz-surface)"
                    stroke="#4f46e5"
                    strokeWidth="3"
                  />
                </g>
              )}
            </svg>

            {/* Floating Interactive Tooltip */}
            {activeHighlightedPoint && (
              <div
                className="mz-chart-tooltip"
                style={{
                  left: hoverPixel ? `${hoverPixel.x}px` : `${(activeHighlightedPoint.x / chartWidth) * 100}%`,
                  top: hoverPixel ? `${hoverPixel.y}px` : `${activeHighlightedPoint.y}px`,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mz-text-muted)", marginBottom: 3 }}>
                  {activeHighlightedPoint.date || "Active Period"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                    {activeHighlightedPoint?.activeUsers != null ? `${activeHighlightedPoint.activeUsers.toLocaleString()} Active User${activeHighlightedPoint.activeUsers === 1 ? "" : "s"}` : "0 Active Users"}
                  </span>
                </div>
                {peakUsers > 0 && (
                  <div style={{ fontSize: 10.5, color: "var(--mz-text-subtle)", marginTop: 2 }}>
                    {Math.round(((activeHighlightedPoint.activeUsers || 0) / peakUsers) * 100)}% of peak
                  </div>
                )}
              </div>
            )}

            {/* Clean Milestone X-Axis Labels */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--mz-text-subtle)",
                marginTop: 8,
                padding: "0 12px 0 38px",
              }}
            >
              {milestoneLabels.map((p, idx) => (
                <span key={idx}>{p.date}</span>
              ))}
            </div>
          </div>

          {/* Dynamic Summary Telemetry Strip (Real Database Analytics) */}
          <div className="mz-chart-summary-strip">
            <div className="mz-chart-summary-col">
              <span className="mz-chart-summary-lbl">Peak Active</span>
              <span className="mz-chart-summary-val" style={{ color: "#6366f1" }}>{peakUsers.toLocaleString()}</span>
            </div>
            <div className="mz-chart-summary-col">
              <span className="mz-chart-summary-lbl">Daily Average</span>
              <span className="mz-chart-summary-val">{avgUsers.toLocaleString()}</span>
            </div>
            <div className="mz-chart-summary-col">
              <span className="mz-chart-summary-lbl">Latest Activity</span>
              <span className="mz-chart-summary-val" style={{ color: "#10b981" }}>{latestUsers.toLocaleString()}</span>
            </div>
            <div className="mz-chart-summary-col">
              <span className="mz-chart-summary-lbl">Range Volume</span>
              <span className="mz-chart-summary-val">{totalVolume.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* B. Learning Track Distribution Donut Chart with User Counts & Proportions */}
        <div className="mz-admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="mz-admin-card-header">
            <div>
              <h3 className="mz-admin-card-title">
                <LuSlidersHorizontal style={{ width: 18, height: 18, color: "#6366f1" }} />
                <span>Track Distribution</span>
              </h3>
              <p className="mz-admin-card-subtitle">
                Student enrollment breakdown
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "8px 2px" }}>
            {/* SVG Donut with Segment Hover Effects */}
            <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--mz-surface-muted)" strokeWidth="12" />
                {(() => {
                  let accumulated = 0;
                  const circumference = 238.76;
                  const hasData = trackDistribution.some((t) => t.percentage > 0);
                  if (!hasData) return null;
                  return trackDistribution.map((t, idx) => {
                    const strokeLen = (t.percentage / 100) * circumference;
                    const dashArray = `${strokeLen} ${circumference - strokeLen}`;
                    const offset = -accumulated;
                    accumulated += strokeLen;
                    const isHovered = hoveredTrack?.name === t.name;
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={t.color}
                        strokeWidth={isHovered ? "14" : "11"}
                        strokeDasharray={dashArray}
                        strokeDashoffset={offset}
                        style={{
                          transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                          cursor: "pointer",
                          opacity: hoveredTrack && !isHovered ? 0.45 : 1,
                        }}
                        onMouseEnter={() => setHoveredTrack(t)}
                        onMouseLeave={() => setHoveredTrack(null)}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Center Donut Dynamic Metric Readout */}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 8, pointerEvents: "none" }}>
                <span style={{ fontSize: 21, fontWeight: 800, color: "var(--mz-text-primary)", lineHeight: 1 }}>
                  {hoveredTrack
                    ? `${hoveredTrack.percentage}%`
                    : totalTrackUsers > 0
                    ? `${topTrack?.percentage || 0}%`
                    : "0%"}
                </span>
                <span style={{ fontSize: 10.5, color: "var(--mz-text-muted)", fontWeight: 700, marginTop: 4, maxWidth: 84, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {hoveredTrack
                    ? hoveredTrack.name.split(" ")[0]
                    : totalTrackUsers > 0
                    ? (topTrack?.name?.split(" ")[0] || "Active")
                    : "No Activity"}
                </span>
                <span style={{ fontSize: 9.5, color: "var(--mz-text-subtle)", fontWeight: 600 }}>
                  {hoveredTrack
                    ? `${hoveredTrack.count || 0} Users`
                    : `${totalTrackUsers} Total`}
                </span>
              </div>
            </div>

            {/* Legend List with Track Name, User Count & Percentage */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, flex: 1, minWidth: 0 }}>
              {trackDistribution.map((t) => {
                const isHovered = hoveredTrack?.name === t.name;
                return (
                  <div
                    key={t.name}
                    className={`mz-donut-legend-item ${isHovered ? "active" : ""}`}
                    onMouseEnter={() => setHoveredTrack(t)}
                    onMouseLeave={() => setHoveredTrack(null)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: t.color, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "var(--mz-text-secondary)", fontWeight: 600, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.name}
                        </div>
                        <div style={{ color: "var(--mz-text-muted)", fontSize: 10.5 }}>
                          {t.count != null ? `${t.count} student${t.count === 1 ? "" : "s"}` : "0 enrolled"}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, color: "var(--mz-text-primary)", fontSize: 12, flexShrink: 0, marginLeft: 6 }}>
                      {t.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* C. Proctoring Status — Dynamic Real-Time Verification */}
        <div className="mz-admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="mz-admin-card-header">
            <div>
              <h3 className="mz-admin-card-title">
                <LuShield style={{ width: 18, height: 18, color: "#3b82f6" }} />
                <span>Proctoring Status</span>
              </h3>
              <p className="mz-admin-card-subtitle">
                Live examination telemetry
              </p>
            </div>
            <span
              className={
                hasAnyActiveStream
                  ? "mz-admin-proctoring-badge-active"
                  : "mz-admin-proctoring-badge-standby"
              }
            >
              {hasAnyActiveStream && <span className="mz-status-pulsing-dot" />}
              {proctoring.overall || "Standby (Ready)"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "6px 2px" }}>
            {/* Camera */}
            <div className="mz-admin-proctor-row">
              <div className="mz-admin-proctor-item-left">
                <div className="mz-admin-proctor-icon">
                  <LuCamera style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mz-text-primary)" }}>Camera</div>
                  <div style={{ fontSize: 10.5, color: "var(--mz-text-muted)" }}>Live stream monitoring</div>
                </div>
              </div>
              <span className={proctoring.camera?.status === "Active" ? "mz-admin-status-dot-active" : "mz-admin-status-dot-standby"}>
                {proctoring.camera?.label || (proctoring.camera?.status === "Active" ? `${proctoring.camera?.count || 1} Active` : "Idle (Standby)")}
              </span>
            </div>

            {/* Microphone */}
            <div className="mz-admin-proctor-row">
              <div className="mz-admin-proctor-item-left">
                <div className="mz-admin-proctor-icon">
                  <LuMic style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mz-text-primary)" }}>Microphone</div>
                  <div style={{ fontSize: 10.5, color: "var(--mz-text-muted)" }}>Audio capture feed</div>
                </div>
              </div>
              <span className={proctoring.microphone?.status === "Active" ? "mz-admin-status-dot-active" : "mz-admin-status-dot-standby"}>
                {proctoring.microphone?.label || (proctoring.microphone?.status === "Active" ? `${proctoring.microphone?.count || 1} Active` : "Idle (Standby)")}
              </span>
            </div>

            {/* Screen Sharing */}
            <div className="mz-admin-proctor-row">
              <div className="mz-admin-proctor-item-left">
                <div className="mz-admin-proctor-icon">
                  <LuMonitor style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mz-text-primary)" }}>Screen Sharing</div>
                  <div style={{ fontSize: 10.5, color: "var(--mz-text-muted)" }}>Display capture stream</div>
                </div>
              </div>
              <span className={proctoring.screenSharing?.status === "Active" ? "mz-admin-status-dot-active" : "mz-admin-status-dot-standby"}>
                {proctoring.screenSharing?.label || (proctoring.screenSharing?.status === "Active" ? `${proctoring.screenSharing?.count || 1} Active` : "Idle (Standby)")}
              </span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--mz-border-subtle)", paddingTop: 10, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--mz-text-muted)" }}>
            <span>Active Exams:</span>
            <span style={{ fontWeight: 800, color: "var(--mz-text-primary)" }}>
              {proctoring.activeProctoredSessions != null ? proctoring.activeProctoredSessions : 0} Session{proctoring.activeProctoredSessions === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────── 4. BOTTOM ROW: TABLES ────────────────── */}
      <div className="mz-admin-bottom-row">
        {/* Table 1: Recent Assessment Results */}
        <div className="mz-admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--mz-border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LuTrophy style={{ width: 18, height: 18, color: "#f59e0b" }} />
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--mz-text-primary)", margin: 0 }}>
                Recent Assessment Results
              </h3>
            </div>
            <Link to="/admin/assessments" className="mz-admin-view-all-link">
              <span>View All</span>
              <span>→</span>
            </Link>
          </div>

          <div className="mz-admin-table-wrap">
            <table className="mz-admin-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>ASSESSMENT</th>
                  <th>TYPE</th>
                  <th>SCORE</th>
                  <th>STATUS</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                {recentAssessments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "36px 0", color: "var(--mz-text-subtle)" }}>
                      No assessment records found in this date range.
                    </td>
                  </tr>
                ) : (
                  recentAssessments.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: getAvatarColor(row.user).bg,
                              color: getAvatarColor(row.user).text,
                              fontSize: 11,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {getUserMonogram(row.user)}
                          </div>
                          <span style={{ fontWeight: 600, color: "var(--mz-text-primary)", whiteSpace: "nowrap" }}>
                            {row.user}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: "var(--mz-text-secondary)", fontWeight: 500 }}>{row.assessment}</td>
                      <td style={{ color: "var(--mz-text-muted)" }}>{row.type}</td>
                      <td style={{ fontWeight: 800, color: "var(--mz-text-primary)" }}>{row.score}</td>
                      <td>
                        <span
                          className={
                            row.status === "Passed"
                              ? "mz-admin-pill-pass"
                              : row.status === "Partial"
                              ? "mz-admin-pill-partial"
                              : "mz-admin-pill-fail"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--mz-text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                        {formatDateTime(row.date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Live Sessions */}
        <div className="mz-admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--mz-border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LuRadio style={{ width: 18, height: 18, color: "#3b82f6" }} />
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--mz-text-primary)", margin: 0 }}>
                Live Sessions
              </h3>
            </div>
            <Link to="/admin/live-activity" className="mz-admin-view-all-link">
              <span>View All</span>
              <span>→</span>
            </Link>
          </div>

          <div className="mz-admin-table-wrap">
            <table className="mz-admin-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>ACTIVITY</th>
                  <th>STARTED</th>
                  <th>DURATION</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {liveSessions.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "36px 0", color: "var(--mz-text-subtle)" }}>
                      No active sessions currently connected.
                    </td>
                  </tr>
                ) : (
                  liveSessions.map((sess, idx) => (
                    <tr key={sess.socketId || idx}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: getAvatarColor(sess.user).bg,
                              color: getAvatarColor(sess.user).text,
                              fontSize: 11,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {getUserMonogram(sess.user)}
                          </div>
                          <span style={{ fontWeight: 600, color: "var(--mz-text-primary)", whiteSpace: "nowrap" }}>
                            {sess.user}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: "var(--mz-text-secondary)", fontWeight: 500 }}>{sess.activity}</td>
                      <td style={{ color: "var(--mz-text-muted)" }}>{sess.started}</td>
                      <td style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>{sess.duration}</td>
                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            color:
                              sess.status === "Coding"
                                ? "#2563eb"
                                : sess.status === "Assessment"
                                ? "#7c3aed"
                                : "#059669",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background:
                                sess.status === "Coding"
                                ? "#3b82f6"
                                : sess.status === "Assessment"
                                ? "#8b5cf6"
                                : "#10b981",
                            }}
                          />
                          {sess.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
