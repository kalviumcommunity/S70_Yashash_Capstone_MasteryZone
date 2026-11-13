import React, { useState, useEffect } from "react";
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
} from "react-icons/lu";
import { getSharedSocket, releaseSharedSocket } from "../../utils/socketClient";
import { deduplicatedFetch } from "../../utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminLiveActivity = () => {
  const [sessions, setSessions] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let socket = null;

    const fetchLiveFeed = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await deduplicatedFetch(`${API_BASE}/api/admin/live-activity`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cacheTtlMs: 2500,
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success) {
            setSessions(json.activeSessions || []);
            setOnlineCount(json.onlineCount || 0);
          }
        }
      } catch (err) {
        console.error("Live feed fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveFeed();

    // Connect to Socket.IO for real-time live events
    let handleConnect = null;
    let handleSnapshot = null;
    let handleUpdate = null;
    let handleEnded = null;

    try {
      const socketUrl = API_BASE || window.location.origin;
      socket = getSharedSocket(socketUrl);

      handleConnect = () => {
        if (socket) socket.emit("join_admin_monitoring");
      };

      handleSnapshot = (snapshot) => {
        if (isMounted && Array.isArray(snapshot) && snapshot.length > 0) {
          setSessions(snapshot);
          setOnlineCount(snapshot.length);
        }
      };

      handleUpdate = (sessionObj) => {
        if (!isMounted) return;
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
        if (!isMounted) return;
        setSessions((prev) => prev.filter((s) => s.socketId !== socketId));
      };

      socket.on("connect", handleConnect);
      if (socket.connected) {
        handleConnect();
      }
      socket.on("live_sessions_snapshot", handleSnapshot);
      socket.on("live_session_update", handleUpdate);
      socket.on("live_session_ended", handleEnded);
    } catch (e) {
      console.warn("Socket.io admin monitoring connection error:", e);
    }

    return () => {
      isMounted = false;
      if (socket) {
        if (handleConnect) socket.off("connect", handleConnect);
        if (handleSnapshot) socket.off("live_sessions_snapshot", handleSnapshot);
        if (handleUpdate) socket.off("live_session_update", handleUpdate);
        if (handleEnded) socket.off("live_session_ended", handleEnded);
        releaseSharedSocket(socket);
      }
    };
  }, []);

  return (
    <div className="mz-admin-view-container">
      {/* Header */}
      <div className="mz-admin-page-header">
        <div className="mz-admin-page-title-box">
          <div className="mz-admin-page-icon">
            <LuRadio style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="mz-admin-page-title">Live User Activity & Real-Time Monitoring</h1>
            <p className="mz-admin-page-subtitle">
              Live socket telemetry showing active sessions, realtime track navigation, and coding activity.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "var(--mz-green-bg)", border: "1px solid var(--mz-green-border)", borderRadius: 12, color: "#065f46", fontSize: 13, fontWeight: 700 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          <span>{Math.max(onlineCount, sessions.length)} Active Users Online</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mz-admin-grid-4">
        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-blue-bg)", color: "#2563eb" }}>
            <LuCode style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Coding & Compiler</span>
            <span className="mz-admin-stat-value">
              {sessions.filter((s) => s.activity?.toLowerCase().includes("coding") || s.currentPage?.includes("coding")).length}
            </span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-green-bg)", color: "#059669" }}>
            <LuBookOpen style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Learning Tracks</span>
            <span className="mz-admin-stat-value">
              {sessions.filter((s) => s.activity?.toLowerCase().includes("learning") || s.currentPage?.includes("home")).length}
            </span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-purple-bg)", color: "#6366f1" }}>
            <LuFileText style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Assessments & Exams</span>
            <span className="mz-admin-stat-value">
              {sessions.filter((s) => s.activity?.toLowerCase().includes("assessment") || s.currentPage?.includes("cert")).length}
            </span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-amber-bg)", color: "#d97706" }}>
            <LuVideo style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Live Platform Hub</span>
            <span className="mz-admin-stat-value">
              {sessions.filter((s) => s.activity?.toLowerCase().includes("meeting")).length}
            </span>
          </div>
        </div>
      </div>

      {/* Live Sessions Table */}
      <div className="mz-admin-card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--mz-surface-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>Connected Sessions Feed</h3>
            <span style={{ fontSize: 12, color: "var(--mz-text-subtle)" }}>Real-time socket telemetry updating in milliseconds</span>
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
                <th>Device & Telemetry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px 0", color: "var(--mz-text-subtle)" }}>
                    Connecting to live telemetry stream...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px 0", color: "var(--mz-text-subtle)" }}>
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
                          <div style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>{s.fullName || s.username || "Candidate"}</div>
                          <div style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>{s.email || "Web Session"}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: 11.5, background: "var(--mz-surface-subtle)", padding: "3px 8px", borderRadius: 6, border: "1px solid var(--mz-border)", color: "#6366f1", fontWeight: 600 }}>
                        {s.currentPage || "/home"}
                      </span>
                    </td>

                    <td>
                      <span className="mz-admin-badge-blue">
                        {s.activity || "Learning Path"}
                      </span>
                    </td>

                    <td style={{ color: "var(--mz-text-muted)" }}>
                      {new Date(s.startedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>

                    <td style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>
                      {s.duration || `${Math.max(1, Math.round((Date.now() - new Date(s.startedAt || Date.now())) / 60000))}m`}
                    </td>

                    <td style={{ color: "var(--mz-text-muted)", fontSize: 12 }}>
                      {s.device || "Desktop / Chrome"}
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
    </div>
  );
};

export default AdminLiveActivity;
