import React, { useState, useEffect } from "react";
import { deduplicatedFetch } from "../../utils/apiClient";
import {
  LuTrendingUp,
  LuBookOpen,
  LuClock,
  LuAward,
  LuCircleCheck,
  LuLayers,
  LuCalendar,
  LuFilter,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminLearningAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  const fetchAnalytics = async (selectedRange = range) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await deduplicatedFetch(`${API_BASE}/api/admin/learning-analytics?range=${selectedRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      }, { ttlMs: 15000 });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json.data);
      }
    } catch (err) {
      console.error("Learning analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const tracks = data?.tracks || [];

  return (
    <div className="mz-admin-view-container">
      {/* Header */}
      <div className="mz-admin-header">
        <div className="mz-admin-page-title-box">
          <div className="mz-admin-page-icon">
            <LuTrendingUp style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="mz-admin-page-title">Learning Analytics</h1>
            <p className="mz-admin-page-subtitle">
              Platform-wide learning engagement, track enrollments, and syllabus completion metrics.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid var(--mz-border-strong)",
              background: "var(--mz-surface)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--mz-text-secondary)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "var(--mz-purple-bg)", border: "1px solid var(--mz-purple-border)", borderRadius: 12, color: "#4338ca", fontSize: 13, fontWeight: 700 }}>
            <span>Average Retention: {data?.averageCompletionRate ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* High-Level Overview Cards */}
      <div className="mz-admin-grid-3">
        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-purple-bg)", color: "#6366f1" }}>
            <LuBookOpen style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Total Registered Learners</span>
            <span className="mz-admin-stat-value">{data?.totalEnrolled ?? 0} Students</span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-blue-bg)", color: "#2563eb" }}>
            <LuClock style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Recorded Learning Hours</span>
            <span className="mz-admin-stat-value">{data?.totalLearningHours ?? 0} Hours</span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-green-bg)", color: "#059669" }}>
            <LuCircleCheck style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Average Active Streak</span>
            <span className="mz-admin-stat-value">{data?.averageStreak ?? 0} Days</span>
          </div>
        </div>
      </div>

      {/* Tracks Breakdown Grid */}
      <div className="mz-admin-grid-2">
        {loading ? (
          <div style={{ gridColumn: "span 2", textAlign: "center", padding: 40, color: "var(--mz-text-subtle)" }}>
            Loading track analytics...
          </div>
        ) : tracks.length === 0 ? (
          <div style={{ gridColumn: "span 2", textAlign: "center", padding: 40, color: "var(--mz-text-subtle)" }}>
            No Data Available for the selected time range.
          </div>
        ) : (
          tracks.map((t) => (
            <div key={t.id} className="mz-admin-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="mz-admin-stat-icon" style={{ background: "var(--mz-purple-bg)", color: "#6366f1" }}>
                    <LuLayers style={{ width: 20, height: 20 }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--mz-text-primary)" }}>{t.name}</h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-subtle)" }}>
                      {t.enrolled} Active Learners Enrolled
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#6366f1" }}>{t.completionRate}%</span>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--mz-text-muted)", marginBottom: 6, fontWeight: 600 }}>
                  <span>Track Completion Progress</span>
                  <span>{t.completionRate}% Avg</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "var(--mz-surface-muted)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, #6366f1, #3b82f6)",
                      borderRadius: 999,
                      width: `${t.completionRate}%`,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>

              <div style={{ paddingTop: 12, borderTop: "1px solid var(--mz-surface-muted)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--mz-text-muted)" }}>
                <span>Curriculum Hours: <strong style={{ color: "var(--mz-text-primary)" }}>{t.hours}h</strong></span>
                <span className={t.enrolled > 0 ? "mz-admin-badge-active" : "mz-admin-badge-gray"}>
                  {t.enrolled > 0 ? "Active Track" : "No Enrollment"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminLearningAnalytics;
