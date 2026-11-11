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
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Smooth SVG sparklines matching the reference mockup
const Sparkline = ({ stroke = "#3b82f6", d }) => (
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
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AdminOverview = () => {
  const [filterRange, setFilterRange] = useState("30d"); // "today" | "yesterday" | "30d" | "3m" | "custom"
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateLabel, setDateLabel] = useState("Last 30 Days");

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activeTab, setActiveTab] = useState("30d");
  const datePickerRef = useRef(null);

  const fetchOverview = async (range = filterRange, start = customStart, end = customEnd) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let url = `${API_BASE}/api/admin/overview?range=${range}`;
      if (range === "custom" && start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOverviewData(json.data);
        }
      }
    } catch (err) {
      console.error("Overview fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(filterRange, customStart, customEnd);
    const interval = setInterval(() => {
      fetchOverview(filterRange, customStart, customEnd);
    }, 20000); // 20s auto-refresh for real-time live data

    const handleOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [filterRange]);

  const handleSelectRange = (rangeKey, label) => {
    setFilterRange(rangeKey);
    setActiveTab(rangeKey);
    setDateLabel(label);
    if (rangeKey !== "custom") {
      setShowDatePicker(false);
      fetchOverview(rangeKey);
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

  const stats = overviewData?.stats || {};
  const trendPoints = overviewData?.activityTrend || [];
  const trackDistribution = overviewData?.learningTrackDistribution || [
    { name: "Python", percentage: 0, color: "#3b82f6" },
    { name: "DSA", percentage: 0, color: "#10b981" },
    { name: "Web Development", percentage: 0, color: "#f59e0b" },
    { name: "C++ & Systems", percentage: 0, color: "#8b5cf6" },
    { name: "Java Development", percentage: 0, color: "#ec4899" },
  ];
  const recentAssessments = overviewData?.recentAssessmentResults || [];
  const liveSessions = overviewData?.liveSessions || [];
  const proctoring = overviewData?.proctoringStatus || {
    overall: "All Systems Online",
    camera: { status: "Active" },
    microphone: { status: "Active" },
    screenSharing: { status: "Active" },
  };

  // Top track calculation for center of donut
  const topTrack = trackDistribution.reduce(
    (max, t) => (t.percentage > (max?.percentage || 0) ? t : max),
    trackDistribution[0] || { name: "Python", percentage: 0 }
  );

  // Dynamic SVG Trend Chart Calculations
  const chartSvgRef = useRef(null);
  const [hoverPixel, setHoverPixel] = useState(null);

  // Scale Y max nicely (e.g. 1.5k or calculated max)
  const rawMax = Math.max(1, ...trendPoints.map((p) => Number(p.activeUsers || 0)));
  const maxActive = rawMax > 500 ? 1500 : rawMax > 50 ? 100 : Math.max(10, rawMax);
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

  // Milestone labels along the bottom (clean 5 spaced dates matching reference)
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, margin: "0 auto", paddingBottom: 48 }}>
      {/* ────────────────── 1. HEADER SECTION & DATE FILTER ────────────────── */}
      <div className="mz-admin-page-header">
        <div className="mz-admin-page-title-box">
          <div className="mz-admin-page-icon" style={{ background: "var(--mz-purple-bg)", color: "#6366f1" }}>
            <LuChartBar style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="mz-admin-page-title">Platform Overview</h1>
            <p className="mz-admin-page-subtitle">
              Monitor, analyze and manage your MasteryZone platform
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
                  { key: "30d", label: "Last 30 Days" },
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
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1px solid var(--mz-border)", fontSize: 12, marginTop: 2, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--mz-text-muted)" }}>End Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      required
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1px solid var(--mz-border)", fontSize: 12, marginTop: 2, outline: "none" }}
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

      {/* ────────────────── 2. SIX METRIC CARDS (MATCHING REFERENCE) ────────────────── */}
      <div className="mz-admin-metrics-row">
        {/* Card 1: Total Users */}
        <div className="mz-admin-metric-card">
          <div className="mz-admin-metric-icon" style={{ background: "var(--mz-blue-bg)", color: "#3b82f6" }}>
            <LuUsers style={{ width: 20, height: 20 }} />
          </div>
          <p className="mz-admin-metric-label">Total Users</p>
          <h3 className="mz-admin-metric-value">
            {loading ? <span className="mz-skeleton-text" style={{ width: 64, height: 26 }} /> : Number(stats.totalUsers?.value || 0).toLocaleString()}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 11.5, fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: 3 }}>
            <span>↑</span>
            <span>{stats.totalUsers?.trend || "Registered & Verified"}</span>
          </p>
          <Sparkline stroke="#3b82f6" d="M 0 28 C 30 28, 45 10, 75 18 C 105 26, 125 12, 160 16" />
        </div>

        {/* Card 2: Active Today */}
        <div className="mz-admin-metric-card">
          <div className="mz-admin-metric-icon" style={{ background: "var(--mz-green-bg)", color: "#10b981" }}>
            <LuUserCheck style={{ width: 20, height: 20 }} />
          </div>
          <p className="mz-admin-metric-label">Active Today</p>
          <h3 className="mz-admin-metric-value">
            {loading ? <span className="mz-skeleton-text" style={{ width: 48, height: 26 }} /> : Number(stats.activeToday?.value || 0).toLocaleString()}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 11.5, fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: 3 }}>
            <span>↑</span>
            <span>{stats.activeToday?.trend || "Active within range"}</span>
          </p>
          <Sparkline stroke="#10b981" d="M 0 26 C 25 30, 45 14, 75 22 C 105 30, 130 8, 160 14" />
        </div>

        {/* Card 3: Active Sessions */}
        <div className="mz-admin-metric-card">
          <div className="mz-admin-metric-icon" style={{ background: "var(--mz-purple-bg)", color: "#8b5cf6" }}>
            <LuZap style={{ width: 20, height: 20 }} />
          </div>
          <p className="mz-admin-metric-label">Active Sessions</p>
          <h3 className="mz-admin-metric-value">
            {loading ? <span className="mz-skeleton-text" style={{ width: 36, height: 26 }} /> : Number(stats.activeSessions?.value || 0).toLocaleString()}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 11.5, fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: 3 }}>
            <span>↑</span>
            <span>{stats.activeSessions?.trend || "Live socket sessions"}</span>
          </p>
          <Sparkline stroke="#8b5cf6" d="M 0 24 C 30 32, 50 12, 85 24 C 115 34, 135 16, 160 20" />
        </div>

        {/* Card 4: Assessments */}
        <div className="mz-admin-metric-card">
          <div className="mz-admin-metric-icon" style={{ background: "var(--mz-amber-bg)", color: "#f59e0b" }}>
            <LuFileText style={{ width: 20, height: 20 }} />
          </div>
          <p className="mz-admin-metric-label">Assessments</p>
          <h3 className="mz-admin-metric-value">
            {loading ? <span className="mz-skeleton-text" style={{ width: 54, height: 26 }} /> : Number(stats.assessments?.value || 0).toLocaleString()}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 11.5, fontWeight: 600, color: "#f59e0b", display: "flex", alignItems: "center", gap: 3 }}>
            <span>↑</span>
            <span>{stats.assessments?.trend || "Completed exams"}</span>
          </p>
          <Sparkline stroke="#f59e0b" d="M 0 30 C 35 30, 55 12, 85 20 C 115 28, 135 10, 160 12" />
        </div>

        {/* Card 5: Coding Submissions */}
        <div className="mz-admin-metric-card">
          <div className="mz-admin-metric-icon" style={{ background: "var(--mz-green-bg)", color: "#10b981" }}>
            <LuCode style={{ width: 20, height: 20 }} />
          </div>
          <p className="mz-admin-metric-label">Coding Submissions</p>
          <h3 className="mz-admin-metric-value">
            {loading ? <span className="mz-skeleton-text" style={{ width: 58, height: 26 }} /> : Number(stats.codingSubmissions?.value || 0).toLocaleString()}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 11.5, fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: 3 }}>
            <span>↑</span>
            <span>{stats.codingSubmissions?.trend || "Compiler evaluations"}</span>
          </p>
          <Sparkline stroke="#10b981" d="M 0 26 C 30 26, 50 8, 80 18 C 110 28, 130 14, 160 10" />
        </div>

        {/* Card 6: Storage Used */}
        <div className="mz-admin-metric-card">
          <div className="mz-admin-metric-icon" style={{ background: "var(--mz-purple-bg)", color: "#8b5cf6" }}>
            <LuDatabase style={{ width: 20, height: 20 }} />
          </div>
          <p className="mz-admin-metric-label">Storage Used</p>
          <h3 className="mz-admin-metric-value">
            {loading ? <span className="mz-skeleton-text" style={{ width: 44, height: 26 }} /> : `${stats.storageUsed?.percentage || 0}%`}
          </h3>
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 7, background: "var(--mz-surface-muted)", borderRadius: 9999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${stats.storageUsed?.percentage || 0}%`,
                  height: "100%",
                  background: "#6366f1",
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
            <h3 className="mz-admin-card-title">
              <LuTrendingUp style={{ width: 18, height: 18, color: "#6366f1" }} />
              <span>User Activity Trend</span>
            </h3>

            {/* Range Switcher Tabs */}
            <div
              className="mz-admin-filter-tabs"
              style={{
                background: "var(--mz-surface-muted)",
                padding: "3px",
                borderRadius: 8,
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
                    fontWeight: activeTab === t.key ? 700 : 500,
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11.5,
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
            style={{ position: "relative", height: 215, marginTop: 10, userSelect: "none" }}
            onMouseMove={handleChartMouseMove}
            onMouseLeave={handleChartMouseLeave}
          >
            {/* Y-axis grid lines with clean values: 1.5k, 1k, 500, 0 */}
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 11, color: "var(--mz-text-subtle)", pointerEvents: "none", paddingBottom: 28 }}>
              <div style={{ borderBottom: "1px dashed var(--mz-surface-muted)", display: "flex", justifyContent: "flex-start", paddingBottom: 2 }}>
                <span style={{ fontWeight: 500, width: 34 }}>1.5k</span>
              </div>
              <div style={{ borderBottom: "1px dashed var(--mz-surface-muted)", display: "flex", justifyContent: "flex-start", paddingBottom: 2 }}>
                <span style={{ fontWeight: 500, width: 34 }}>1k</span>
              </div>
              <div style={{ borderBottom: "1px dashed var(--mz-surface-muted)", display: "flex", justifyContent: "flex-start", paddingBottom: 2 }}>
                <span style={{ fontWeight: 500, width: 34 }}>500</span>
              </div>
              <div style={{ borderBottom: "1px solid var(--mz-surface-muted)", display: "flex", justifyContent: "flex-start", paddingBottom: 2 }}>
                <span style={{ fontWeight: 500, width: 34 }}>0</span>
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
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
                  <stop offset="70%" stopColor="#818cf8" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="var(--mz-indigo-border)" stopOpacity="0.0" />
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
                  stroke="var(--mz-indigo-border)"
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

            {/* Floating Interactive Tooltip matching reference */}
            {activeHighlightedPoint && (
              <div
                className="mz-chart-tooltip"
                style={{
                  left: hoverPixel ? `${hoverPixel.x}px` : `${(activeHighlightedPoint.x / chartWidth) * 100}%`,
                  top: hoverPixel ? `${hoverPixel.y}px` : `${activeHighlightedPoint.y}px`,
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--mz-text-muted)", marginBottom: 2 }}>
                  {activeHighlightedPoint.date || "Oct 21"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                    {activeHighlightedPoint?.activeUsers != null ? `${activeHighlightedPoint.activeUsers.toLocaleString()} Active Users` : "0 Active Users"}
                  </span>
                </div>
              </div>
            )}

            {/* Clean Milestone X-Axis Labels: Oct 1, Oct 7, Oct 14, Oct 21, Oct 30 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                fontWeight: 500,
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
        </div>

        {/* B. Learning Track Distribution Donut Chart */}
        <div className="mz-admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="mz-admin-card-header">
            <h3 className="mz-admin-card-title">
              <LuSlidersHorizontal style={{ width: 18, height: 18, color: "#6366f1" }} />
              <span>Learning Track Distribution</span>
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "18px 4px" }}>
            {/* SVG Donut */}
            <div style={{ position: "relative", width: 128, height: 128, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--mz-surface-muted)" strokeWidth="12" />
                {(() => {
                  let accumulated = 0;
                  const circumference = 238.76;
                  return trackDistribution.map((t, idx) => {
                    const strokeLen = (t.percentage / 100) * circumference;
                    const dashArray = `${strokeLen} ${circumference - strokeLen}`;
                    const offset = -accumulated;
                    accumulated += strokeLen;
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={t.color}
                        strokeWidth="12"
                        strokeDasharray={dashArray}
                        strokeDashoffset={offset}
                      />
                    );
                  });
                })()}
              </svg>

              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--mz-text-primary)", lineHeight: 1 }}>
                  {topTrack?.percentage || 0}%
                </span>
                <span style={{ fontSize: 11, color: "var(--mz-text-muted)", fontWeight: 600, marginTop: 3 }}>
                  {topTrack?.name || "Python"}
                </span>
              </div>
            </div>

            {/* Legend List matching reference */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, flex: 1 }}>
              {trackDistribution.map((t) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: t.color, display: "inline-block" }} />
                    <span style={{ color: "var(--mz-text-secondary)", fontWeight: 500 }}>{t.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>
                    {t.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* C. Proctoring Status matching reference */}
        <div className="mz-admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="mz-admin-card-header">
            <h3 className="mz-admin-card-title">
              <LuShield style={{ width: 18, height: 18, color: "#3b82f6" }} />
              <span>Proctoring Status</span>
            </h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#059669", background: "var(--mz-green-bg)", padding: "4px 10px", borderRadius: 9999 }}>
              All Systems Online
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "14px 4px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <LuCamera style={{ width: 18, height: 18, color: "var(--mz-text-muted)" }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--mz-text-secondary)" }}>Camera</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#059669", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                Active
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <LuMic style={{ width: 18, height: 18, color: "var(--mz-text-muted)" }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--mz-text-secondary)" }}>Microphone</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#059669", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                Active
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <LuMonitor style={{ width: 18, height: 18, color: "var(--mz-text-muted)" }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--mz-text-secondary)" }}>Screen Sharing</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#059669", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── 4. BOTTOM ROW: TABLES MATCHING REFERENCE ────────────────── */}
      <div className="mz-admin-bottom-row">
        {/* Table 1: Recent Assessment Results */}
        <div className="mz-admin-card" style={{ padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--mz-surface-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LuTrophy style={{ width: 18, height: 18, color: "#f59e0b" }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>
                Recent Assessment Results
              </h3>
            </div>
            <Link to="/admin/assessments" style={{ color: "#6366f1", fontSize: 12.5, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
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
                    <td colSpan="6" style={{ textAlign: "center", padding: "30px 0", color: "var(--mz-text-subtle)" }}>
                      No assessment records found in this date range.
                    </td>
                  </tr>
                ) : (
                  recentAssessments.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td style={{ fontWeight: 600, color: "var(--mz-text-primary)" }}>{row.user}</td>
                      <td style={{ color: "var(--mz-text-secondary)", fontWeight: 500 }}>{row.assessment}</td>
                      <td style={{ color: "var(--mz-text-muted)" }}>{row.type}</td>
                      <td style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>{row.score}</td>
                      <td>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            background:
                              row.status === "Passed"
                                ? "var(--mz-green-bg)"
                                : row.status === "Partial"
                                ? "var(--mz-amber-bg)"
                                : "var(--mz-red-bg)",
                            color:
                              row.status === "Passed"
                                ? "#059669"
                                : row.status === "Partial"
                                ? "#d97706"
                                : "#dc2626",
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--mz-text-muted)", fontSize: 12 }}>
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
        <div className="mz-admin-card" style={{ padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--mz-surface-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LuRadio style={{ width: 18, height: 18, color: "#3b82f6" }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>
                Live Sessions
              </h3>
            </div>
            <Link to="/admin/live-activity" style={{ color: "#6366f1", fontSize: 12.5, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
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
                    <td colSpan="5" style={{ textAlign: "center", padding: "30px 0", color: "var(--mz-text-subtle)" }}>
                      No active sessions currently connected.
                    </td>
                  </tr>
                ) : (
                  liveSessions.map((sess, idx) => (
                    <tr key={sess.socketId || idx}>
                      <td style={{ fontWeight: 600, color: "var(--mz-text-primary)" }}>{sess.user}</td>
                      <td style={{ color: "var(--mz-text-secondary)", fontWeight: 500 }}>{sess.activity}</td>
                      <td style={{ color: "var(--mz-text-muted)" }}>{sess.started}</td>
                      <td style={{ fontWeight: 600, color: "var(--mz-text-primary)" }}>{sess.duration}</td>
                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            display: "flex",
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
