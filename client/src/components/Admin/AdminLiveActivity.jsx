import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LuRadio,
  LuActivity,
  LuUsers,
  LuCode,
  LuBookOpen,
  LuFileText,
  LuVideo,
  LuSmartphone,
  LuClock,
  LuShield,
  LuSearch,
  LuRefreshCw,
  LuWifi,
  LuWifiOff,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import { getSharedSocket, releaseSharedSocket } from "../../utils/socketClient";
import { deduplicatedFetch } from "../../utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "";

const CATEGORY_COLORS = {
  coding: { bg: "var(--mz-blue-bg)", color: "#2563eb", label: "Coding" },
  proctoring: { bg: "var(--mz-red-bg,#fef2f2)", color: "#dc2626", label: "Proctoring" },
  assessment: { bg: "var(--mz-purple-bg)", color: "#6366f1", label: "Assessment" },
  auth: { bg: "var(--mz-green-bg)", color: "#059669", label: "Auth" },
  support: { bg: "var(--mz-amber-bg)", color: "#d97706", label: "Support" },
  system: { bg: "var(--mz-surface-subtle)", color: "#64748b", label: "System" },
};

const SEVERITY_COLORS = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#059669",
  info: "#2563eb",
};

function CategoryBadge({ category }) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.system;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: c.bg,
        color: c.color,
        textTransform: "capitalize",
      }}
    >
      {c.label}
    </span>
  );
}

function SeverityDot({ severity }) {
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.info;
  return (
    <span
      title={severity}
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        marginRight: 4,
      }}
    />
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

const AdminLiveActivity = () => {
  const [sessions, setSessions] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({});
  const [activityTotal, setActivityTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const isMountedRef = useRef(false);
  const socketRef = useRef(null);
  const LIMIT = 20;

  const fetchLiveFeed = useCallback(async (page = 1, category = "all", q = "") => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (category !== "all") params.set("category", category);
      if (q.trim()) params.set("q", q.trim());

      const res = await deduplicatedFetch(
        `${API_BASE}/api/admin/live-activity?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` }, cacheTtlMs: 2500 }
      );
      if (res.ok) {
        const json = await res.json();
        if (isMountedRef.current && json.success) {
          setSessions(json.activeSessions || []);
          setOnlineCount(json.onlineCount || 0);
          setActivities(json.activities || []);
          setStats(json.stats || {});
          setActivityTotal(json.totalActivities || 0);
          setLastRefreshed(new Date());
        }
      }
    } catch (err) {
      console.error("Live feed fetch error:", err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLiveFeed(activityPage, categoryFilter, searchQuery);

    // ---- Socket.IO Real-time feed ----
    let socket = null;
    let handleConnect = null;
    let handleSnapshot = null;
    let handleUpdate = null;
    let handleEnded = null;
    let handleActivityEvent = null;
    let handleFeedConnected = null;

    try {
      const socketUrl = API_BASE || window.location.origin;
      socket = getSharedSocket(socketUrl);
      socketRef.current = socket;

      handleConnect = () => {
        const token = localStorage.getItem("token");
        if (socket) {
          socket.emit("join_admin_monitoring", { token });
          socket.emit("join_admin_feed", { token });
        }
        if (isMountedRef.current) setSocketStatus("connected");
      };

      handleFeedConnected = () => {
        if (isMountedRef.current) setSocketStatus("connected");
      };

      handleSnapshot = (snapshot) => {
        if (isMountedRef.current && Array.isArray(snapshot)) {
          setSessions(snapshot);
          setOnlineCount(snapshot.length);
        }
      };

      handleUpdate = (sessionObj) => {
        if (!isMountedRef.current) return;
        setSessions((prev) => {
          const idx = prev.findIndex((s) => s.socketId === sessionObj.socketId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = sessionObj;
            return next;
          }
          return [sessionObj, ...prev];
        });
      };

      handleEnded = ({ socketId }) => {
        if (!isMountedRef.current) return;
        setSessions((prev) => prev.filter((s) => s.socketId !== socketId));
      };

      // Real-time historical activity feed
      handleActivityEvent = (event) => {
        if (!isMountedRef.current || !event?._id) return;
        setActivities((prev) => {
          // Deduplicate by _id
          if (prev.some((a) => String(a._id) === String(event._id))) return prev;
          // Prepend newest; keep cap at 100
          return [event, ...prev].slice(0, 100);
        });
        setActivityTotal((t) => t + 1);
        // Update stats counters
        setStats((s) => ({
          ...s,
          total: (s.total || 0) + 1,
          [event.category]: ((s[event.category]) || 0) + 1,
        }));
      };

      socket.on("connect", handleConnect);
      socket.on("admin_feed_connected", handleFeedConnected);
      socket.on("disconnect", () => {
        if (isMountedRef.current) setSocketStatus("disconnected");
      });
      socket.on("reconnect_attempt", () => {
        if (isMountedRef.current) setSocketStatus("reconnecting");
      });
      if (socket.connected) handleConnect();

      socket.on("live_sessions_snapshot", handleSnapshot);
      socket.on("live_session_update", handleUpdate);
      socket.on("live_session_ended", handleEnded);
      socket.on("live_activity_event", handleActivityEvent);
    } catch (e) {
      console.warn("Socket admin monitoring error:", e);
    }

    return () => {
      isMountedRef.current = false;
      if (socket) {
        if (handleConnect) socket.off("connect", handleConnect);
        if (handleFeedConnected) socket.off("admin_feed_connected", handleFeedConnected);
        if (handleSnapshot) socket.off("live_sessions_snapshot", handleSnapshot);
        if (handleUpdate) socket.off("live_session_update", handleUpdate);
        if (handleEnded) socket.off("live_session_ended", handleEnded);
        if (handleActivityEvent) socket.off("live_activity_event", handleActivityEvent);
        releaseSharedSocket(socket);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch on filter / page change
  useEffect(() => {
    if (!loading) {
      fetchLiveFeed(activityPage, categoryFilter, searchQuery);
    }
  }, [activityPage, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    setActivityPage(1);
    fetchLiveFeed(1, categoryFilter, searchQuery);
  };

  const handleRefresh = () => {
    setLoading(true);
    setActivityPage(1);
    fetchLiveFeed(1, categoryFilter, searchQuery);
  };

  const totalPages = Math.ceil(activityTotal / LIMIT);

  const socketIndicator = {
    connected: { color: "#10b981", label: "Live" },
    reconnecting: { color: "#f59e0b", label: "Reconnecting..." },
    disconnected: { color: "#ef4444", label: "Disconnected" },
    connecting: { color: "#6366f1", label: "Connecting..." },
  }[socketStatus] || { color: "#6366f1", label: "Connecting..." };

  return (
    <div className="mz-admin-view-container">
      {/* Header */}
      <div className="mz-admin-page-header">
        <div className="mz-admin-page-title-box">
          <div className="mz-admin-page-icon">
            <LuRadio style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="mz-admin-page-title">Live User Activity &amp; Real-Time Monitoring</h1>
            <p className="mz-admin-page-subtitle">
              Real-time socket telemetry + persistent event log from MongoDB ActivityLog.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Socket status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: "var(--mz-surface-subtle)",
              border: "1px solid var(--mz-border)",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: socketIndicator.color,
            }}
          >
            {socketStatus === "connected" ? (
              <LuWifi style={{ width: 13, height: 13 }} />
            ) : (
              <LuWifiOff style={{ width: 13, height: 13 }} />
            )}
            {socketIndicator.label}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "var(--mz-green-bg)",
              border: "1px solid var(--mz-green-border)",
              borderRadius: 12,
              color: "#065f46",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
              }}
            />
            <span>{Math.max(onlineCount, sessions.length)} Active Users Online</span>
          </div>

          <button
            onClick={handleRefresh}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "var(--mz-surface-subtle)",
              border: "1px solid var(--mz-border)",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
              color: "var(--mz-text-primary)",
              fontWeight: 600,
            }}
          >
            <LuRefreshCw style={{ width: 14, height: 14 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI stat cards from real ActivityLog stats */}
      <div className="mz-admin-grid-4">
        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-blue-bg)", color: "#2563eb" }}>
            <LuCode style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Coding Events</span>
            <span className="mz-admin-stat-value">{stats.coding ?? 0}</span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-purple-bg)", color: "#6366f1" }}>
            <LuShield style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Proctoring Events</span>
            <span className="mz-admin-stat-value">{stats.proctoring ?? 0}</span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-green-bg)", color: "#059669" }}>
            <LuUsers style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Auth Events</span>
            <span className="mz-admin-stat-value">{stats.auth ?? 0}</span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-amber-bg)", color: "#d97706" }}>
            <LuActivity style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Total Logged Events</span>
            <span className="mz-admin-stat-value">{stats.total ?? activityTotal}</span>
          </div>
        </div>
      </div>

      {/* Live Connected Sessions Table */}
      <div className="mz-admin-card" style={{ padding: 0 }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--mz-surface-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>
              Connected Sessions (Live Socket Telemetry)
            </h3>
            <span style={{ fontSize: 12, color: "var(--mz-text-subtle)" }}>
              Updates in milliseconds via Socket.IO
            </span>
          </div>
          <span className="mz-admin-badge-purple">Live Feed Active</span>
        </div>

        <div className="mz-admin-table-wrap">
          <table className="mz-admin-table">
            <thead>
              <tr>
                <th>User Candidate</th>
                <th>Current Screen</th>
                <th>Activity Category</th>
                <th>Session Started</th>
                <th>Duration</th>
                <th>Device &amp; Telemetry</th>
                <th>Media Streams</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px 0", color: "var(--mz-text-subtle)" }}>
                    Connecting to live telemetry stream...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px 0", color: "var(--mz-text-subtle)" }}>
                    No active user sessions currently connected.
                  </td>
                </tr>
              ) : (
                sessions.map((s, idx) => (
                  <tr key={s.socketId || idx}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="mz-admin-user-avatar-sm">
                          {(s.fullName || s.username || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>
                            {s.fullName || s.username || "Candidate"}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>
                            {s.email || "Web Session"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11.5,
                          background: "var(--mz-surface-subtle)",
                          padding: "3px 8px",
                          borderRadius: 6,
                          border: "1px solid var(--mz-border)",
                          color: "#6366f1",
                          fontWeight: 600,
                        }}
                      >
                        {s.currentPage || "/home"}
                      </span>
                    </td>

                    <td>
                      <span className="mz-admin-badge-blue">{s.activity || "Learning Path"}</span>
                    </td>

                    <td style={{ color: "var(--mz-text-muted)" }}>
                      {new Date(s.startedAt || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>
                      {s.duration ||
                        `${Math.max(1, Math.round((Date.now() - new Date(s.startedAt || Date.now())) / 60000))}m`}
                    </td>

                    <td style={{ color: "var(--mz-text-muted)", fontSize: 12 }}>
                      {s.device || "Desktop / Chrome"}
                    </td>

                    <td>
                      {s.mediaState ? (
                        <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                          <span
                            title={s.mediaState.isMuted ? "Microphone Muted" : "Microphone Active"}
                            style={{
                              fontSize: 10.5,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: s.mediaState.isMuted ? "var(--mz-red-bg, #fee2e2)" : "var(--mz-green-bg, #dcfce7)",
                              color: s.mediaState.isMuted ? "#dc2626" : "#16a34a",
                              fontWeight: 700,
                            }}
                          >
                            {s.mediaState.isMuted ? "🎤 Off" : "🎤 On"}
                          </span>
                          <span
                            title={s.mediaState.isVideoOff ? "Camera Off" : "Camera Active"}
                            style={{
                              fontSize: 10.5,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: s.mediaState.isVideoOff ? "var(--mz-red-bg, #fee2e2)" : "var(--mz-green-bg, #dcfce7)",
                              color: s.mediaState.isVideoOff ? "#dc2626" : "#16a34a",
                              fontWeight: 700,
                            }}
                          >
                            {s.mediaState.isVideoOff ? "📷 Off" : "📷 On"}
                          </span>
                          {s.mediaState.isScreenSharing && (
                            <span
                              title="Sharing Screen"
                              style={{
                                fontSize: 10.5,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "var(--mz-purple-bg, #ede9fe)",
                                color: "#7c3aed",
                                fontWeight: 700,
                              }}
                            >
                              🖥️ Sharing
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--mz-text-subtle)", fontSize: 11.5 }}>Standard Web</span>
                      )}
                    </td>

                    <td>
                      <span className="mz-admin-badge-active">Online</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Activity Feed from MongoDB ActivityLog */}
      <div className="mz-admin-card" style={{ padding: 0, marginTop: 24 }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--mz-surface-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>
              Historical Activity Feed
            </h3>
            <span style={{ fontSize: 12, color: "var(--mz-text-subtle)" }}>
              {activityTotal} total events from MongoDB ActivityLog •{" "}
              {lastRefreshed ? `Refreshed ${timeAgo(lastRefreshed)}` : "Loading..."}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setActivityPage(1);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid var(--mz-border)",
                background: "var(--mz-surface-subtle)",
                color: "var(--mz-text-primary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <option value="all">All Categories</option>
              <option value="coding">Coding</option>
              <option value="proctoring">Proctoring</option>
              <option value="assessment">Assessment</option>
              <option value="auth">Auth</option>
              <option value="support">Support</option>
              <option value="system">System</option>
            </select>

            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 6 }}>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--mz-border)",
                  background: "var(--mz-surface-subtle)",
                  color: "var(--mz-text-primary)",
                  fontSize: 12,
                  outline: "none",
                  width: 180,
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--mz-border)",
                  background: "var(--mz-surface-subtle)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <LuSearch style={{ width: 13, height: 13 }} />
              </button>
            </form>
          </div>
        </div>

        <div className="mz-admin-table-wrap">
          <table className="mz-admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Event Type</th>
                <th>Detail</th>
                <th>Category</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px 0", color: "var(--mz-text-subtle)" }}>
                    Loading activity log...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px 0", color: "var(--mz-text-subtle)" }}>
                    No events found{categoryFilter !== "all" ? ` for category: ${categoryFilter}` : ""}.
                  </td>
                </tr>
              ) : (
                activities.map((a, idx) => (
                  <tr key={a._id || idx}>
                    <td style={{ color: "var(--mz-text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                      <LuClock style={{ width: 11, height: 11, marginRight: 4, verticalAlign: "middle" }} />
                      {timeAgo(a.createdAt)}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "var(--mz-text-primary)", fontSize: 13 }}>
                        {a.userName || a.userEmail?.split("@")[0] || "System"}
                      </div>
                      {a.userEmail && (
                        <div style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>{a.userEmail}</div>
                      )}
                    </td>

                    <td>
                      <code
                        style={{
                          fontSize: 11,
                          background: "var(--mz-surface-subtle)",
                          padding: "2px 7px",
                          borderRadius: 5,
                          color: "#6366f1",
                          fontWeight: 700,
                          border: "1px solid var(--mz-border)",
                        }}
                      >
                        {a.type}
                      </code>
                    </td>

                    <td style={{ maxWidth: 280 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "var(--mz-text-primary)",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={a.detail || a.title}
                      >
                        {a.detail || a.title || "—"}
                      </div>
                    </td>

                    <td>
                      <CategoryBadge category={a.category} />
                    </td>

                    <td>
                      <SeverityDot severity={a.severity} />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: SEVERITY_COLORS[a.severity] || "#2563eb",
                          textTransform: "capitalize",
                        }}
                      >
                        {a.severity || "info"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--mz-surface-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--mz-text-subtle)" }}>
              Page {activityPage} of {totalPages} ({activityTotal} events)
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                disabled={activityPage <= 1}
                onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "5px 10px",
                  borderRadius: 7,
                  border: "1px solid var(--mz-border)",
                  background: "var(--mz-surface-subtle)",
                  cursor: activityPage <= 1 ? "not-allowed" : "pointer",
                  opacity: activityPage <= 1 ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <LuChevronLeft style={{ width: 14, height: 14 }} />
              </button>
              <button
                disabled={activityPage >= totalPages}
                onClick={() => setActivityPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: "5px 10px",
                  borderRadius: 7,
                  border: "1px solid var(--mz-border)",
                  background: "var(--mz-surface-subtle)",
                  cursor: activityPage >= totalPages ? "not-allowed" : "pointer",
                  opacity: activityPage >= totalPages ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <LuChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLiveActivity;
