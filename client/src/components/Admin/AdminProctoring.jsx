import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LuShield,
  LuCamera,
  LuMic,
  LuMonitor,
  LuTriangleAlert,
  LuCircleCheck,
  LuShieldAlert,
  LuEye,
  LuSearch,
  LuRefreshCw,
  LuActivity,
  LuExternalLink,
  LuRadio,
  LuX,
} from "react-icons/lu";
import { getSharedSocket, releaseSharedSocket } from "../../utils/socketClient";
import { deduplicatedFetch } from "../../utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminProctoring = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [statusFilter, setStatusFilter] = useState("all");
  const [liveAlerts, setLiveAlerts] = useState([]);

  const fetchProctoring = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await deduplicatedFetch(`${API_BASE}/api/admin/proctoring`, {
        headers: { Authorization: `Bearer ${token}` },
        cacheTtlMs: 3000,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json);
      }
    } catch (err) {
      console.error("Proctoring fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProctoring();

    // Setup real-time Socket.io listener for proctoring violations & sessions
    let socket;
    const handleConnect = () => {
      const token = localStorage.getItem("token");
      if (socket) socket.emit("join_admin_feed", { token });
    };

    const handleViolation = (payload) => {
      setLiveAlerts((prev) => [
        {
          id: Date.now() + Math.random(),
          candidate: payload?.candidate || "Student",
          type: payload?.type || "Security Incident",
          sessionId: payload?.sessionId,
          timestamp: new Date(),
        },
        ...prev.slice(0, 4),
      ]);
      // Auto refresh table state
      fetchProctoring();
    };

    const handleSessionUpdate = () => {
      fetchProctoring();
    };

    try {
      socket = getSharedSocket(API_BASE || window.location.origin);

      socket.on("connect", handleConnect);
      if (socket.connected) {
        const token = localStorage.getItem("token");
        socket.emit("join_admin_feed", { token });
      }

      socket.on("PROCTORING_VIOLATION", handleViolation);
      socket.on("PROCTORING_SESSION_UPDATED", handleSessionUpdate);
      socket.on("NEW_PROCTORED_SESSION", handleSessionUpdate);
    } catch (socketErr) {
      console.warn("Socket connection warning:", socketErr);
    }

    return () => {
      if (socket) {
        socket.off("connect", handleConnect);
        socket.off("PROCTORING_VIOLATION", handleViolation);
        socket.off("PROCTORING_SESSION_UPDATED", handleSessionUpdate);
        socket.off("NEW_PROCTORED_SESSION", handleSessionUpdate);
        releaseSharedSocket(socket);
      }
    };
  }, []);

  const stats = data?.stats || {
    activeSessions: 0,
    totalMonitored: 0,
    totalViolations: 0,
    cameraOnline: true,
    microphoneOnline: true,
    screenSharingOnline: true,
  };

  const sessions = useMemo(() => {
    const list = data?.sessions || [];
    return list.filter((s) => {
      const matchSearch =
        !searchTerm.trim() ||
        s.candidateDetails?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.candidateDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.assessmentTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sessionId?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "violations") return (s.violationsCount || 0) > 0;
      return s.status?.toLowerCase() === statusFilter.toLowerCase();
    });
  }, [data?.sessions, searchTerm, statusFilter]);

  const handleOpenAudit = (sessionId) => {
    // Per specification: Open dedicated audit page in a separate browser tab
    window.open(`/admin/proctoring/audit/${sessionId}`, "_blank");
  };

  return (
    <div className="mz-admin-view-container">
      {/* Real-time Live Security Alerts Banner */}
      {liveAlerts.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {liveAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                background: "var(--mz-red-bg)",
                border: "1px solid var(--mz-red-border)",
                borderRadius: 10,
                color: "#991b1b",
                fontSize: 13,
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <LuTriangleAlert style={{ width: 18, height: 18, color: "#dc2626" }} />
                <span>
                  <strong>Real-Time Alert:</strong> Candidate <strong>{alert.candidate}</strong> triggered{" "}
                  <strong>{alert.type}</strong> in session{" "}
                  <code style={{ fontFamily: "monospace", fontSize: 12 }}>{alert.sessionId}</code>.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, color: "#b91c1c" }}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => handleOpenAudit(alert.sessionId)}
                  style={{
                    padding: "4px 10px",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Inspect Audit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="mz-admin-page-header">
        <div className="mz-admin-page-title-box">
          <div className="mz-admin-page-icon">
            <LuShield style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="mz-admin-page-title">Proctoring & Examination Integrity</h1>
            <p className="mz-admin-page-subtitle">
              Real-time hardware verification, biometric stream telemetry, fullscreen enforcement, and security violations log.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={fetchProctoring}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "var(--mz-surface)",
              border: "1px solid var(--mz-border)",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--mz-text-secondary)",
              cursor: "pointer",
            }}
          >
            <LuRefreshCw style={{ width: 14, height: 14 }} />
            <span>Sync</span>
          </button>

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
                boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)",
              }}
            />
            <span>All Proctoring Systems Online</span>
          </div>
        </div>
      </div>

      {/* Hardware Status Cards */}
      <div className="mz-admin-grid-3">
        <div className="mz-admin-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="mz-admin-stat-icon" style={{ background: "var(--mz-purple-bg)", color: "#6366f1" }}>
              <LuCamera style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--mz-text-primary)" }}>Webcam Monitor</h4>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-subtle)" }}>Facial & stream telemetry</p>
            </div>
          </div>
          <span className="mz-admin-badge-active">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            Active
          </span>
        </div>

        <div className="mz-admin-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="mz-admin-stat-icon" style={{ background: "var(--mz-blue-bg)", color: "#2563eb" }}>
              <LuMic style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--mz-text-primary)" }}>Audio Telemetry</h4>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-subtle)" }}>Ambient voice frequency</p>
            </div>
          </div>
          <span className="mz-admin-badge-active">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            Active
          </span>
        </div>

        <div className="mz-admin-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="mz-admin-stat-icon" style={{ background: "var(--mz-green-bg)", color: "#059669" }}>
              <LuMonitor style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--mz-text-primary)" }}>Screen Lock Telemetry</h4>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-subtle)" }}>Display & fullscreen lock</p>
            </div>
          </div>
          <span className="mz-admin-badge-active">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            Active
          </span>
        </div>
      </div>

      {/* Proctored Sessions Table */}
      <div className="mz-admin-card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--mz-surface-muted)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>Proctored Examination Sessions</h3>
            <span style={{ fontSize: 12, color: "var(--mz-text-subtle)" }}>
              Live & historical candidate attempts ({sessions.length} records)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Filter Pills */}
            <div style={{ display: "flex", background: "var(--mz-surface-subtle)", padding: 3, borderRadius: 10, border: "1px solid var(--mz-border)" }}>
              {[
                { key: "all", label: "All Sessions" },
                { key: "active", label: "Active" },
                { key: "submitted", label: "Submitted" },
                { key: "terminated", label: "Terminated" },
                { key: "violations", label: "With Violations" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    padding: "5px 12px",
                    border: "none",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: statusFilter === tab.key ? 700 : 500,
                    background: statusFilter === tab.key ? "#4f46e5" : "transparent",
                    color: statusFilter === tab.key ? "#ffffff" : "var(--mz-text-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="mz-admin-badge-purple" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <LuRadio style={{ width: 12, height: 12, color: "#7c3aed" }} />
              Realtime Monitoring
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--mz-surface-muted)", background: "var(--mz-surface-subtle)" }}>
          <div ref={searchContainerRef} style={{ position: "relative", maxWidth: 380 }}>
            <LuSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--mz-text-subtle)", width: 14, height: 14 }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => {
                if (searchTerm.trim()) setShowSearchDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowSearchDropdown(false);
              }}
              placeholder="Search..."
              style={{
                width: "100%",
                padding: "8px 30px 8px 34px",
                fontSize: 13,
                border: "1px solid var(--mz-border)",
                borderRadius: 8,
                outline: "none",
                background: "var(--mz-surface)",
              }}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setShowSearchDropdown(false);
                }}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--mz-text-subtle)",
                  cursor: "pointer",
                }}
              >
                <LuX style={{ width: 13, height: 13 }} />
              </button>
            )}

            {showSearchDropdown && searchTerm.trim().length > 0 && (
              <div className="mz-global-search-dropdown">
                <div className="mz-global-search-header">
                  <span>Sessions matching &ldquo;{searchTerm.trim()}&rdquo;</span>
                  <span className="mz-global-search-esc"><kbd>ESC</kbd> to dismiss</span>
                </div>
                {sessions.length === 0 ? (
                  <div className="mz-global-search-empty">
                    <p>No proctoring sessions match &ldquo;{searchTerm}&rdquo;</p>
                    <small>Try searching by candidate name, email, or session ID</small>
                  </div>
                ) : (
                  <div className="mz-global-search-group">
                    {sessions.slice(0, 6).map((s) => (
                      <div
                        key={s.sessionId}
                        className="mz-global-search-item"
                        onClick={() => {
                          setShowSearchDropdown(false);
                          handleOpenAudit(s.sessionId);
                        }}
                      >
                        <span className="mz-global-search-item-icon">🛡️</span>
                        <div className="mz-global-search-item-content">
                          <div className="mz-global-search-item-title">
                            {s.candidateDetails?.fullName || "Candidate"}
                          </div>
                          <div className="mz-global-search-item-sub">
                            {s.assessmentTitle || "Proctored Exam"} • {s.sessionId}
                          </div>
                        </div>
                        <span className="mz-global-search-item-action">Audit Log →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mz-admin-table-wrap">
          <table className="mz-admin-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Examination Name</th>
                <th>Session ID</th>
                <th>Camera Access</th>
                <th>Screen Share</th>
                <th>Violations Flagged</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Audit Log</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px 0", color: "var(--mz-text-subtle)" }}>
                    Loading proctored sessions from database...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px 0", color: "var(--mz-text-subtle)" }}>
                    No proctored examination sessions match your filter.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => {
                  const initial = (s.candidateDetails?.fullName || "C")[0].toUpperCase();
                  const isViolation = (s.violationsCount || 0) > 0;
                  const isActive = s.status === "active";
                  const isSubmitted = s.status === "submitted";

                  return (
                    <tr key={s._id || s.sessionId}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "var(--mz-indigo-border)",
                              color: "#4338ca",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>
                              {s.candidateDetails?.fullName || "Candidate"}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>
                              {s.candidateDetails?.email || "candidate@masteryzone.com"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--mz-text-secondary)" }}>
                        {s.assessmentTitle || "Proctored Examination"}
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
                            color: "var(--mz-text-secondary)",
                          }}
                        >
                          {s.sessionId}
                        </span>
                      </td>
                      <td>
                        <span className="mz-admin-badge-green">Granted</span>
                      </td>
                      <td>
                        <span className="mz-admin-badge-green">Granted</span>
                      </td>
                      <td>
                        <span
                          className={
                            isViolation ? "mz-admin-pill-fail" : "mz-admin-pill-pass"
                          }
                          style={{
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11.5,
                          }}
                        >
                          {s.violationsCount || 0} Events
                        </span>
                      </td>
                      <td>
                        {isActive ? (
                          <span className="mz-admin-badge-active" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                            active
                          </span>
                        ) : isSubmitted ? (
                          <span style={{ padding: "3px 8px", borderRadius: 6, background: "var(--mz-blue-bg)", color: "#1d4ed8", fontSize: 11.5, fontWeight: 700 }}>
                            submitted
                          </span>
                        ) : (
                          <span className="mz-admin-badge-gray">
                            {s.status || "terminated"}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenAudit(s.sessionId)}
                          className="mz-admin-btn-action"
                          title="Open dedicated examination audit log in separate tab"
                        >
                          <LuEye style={{ width: 14, height: 14 }} />
                          <span>Audit Log</span>
                          <LuExternalLink style={{ width: 11, height: 11, opacity: 0.6 }} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProctoring;
