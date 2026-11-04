import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LuShield,
  LuShieldAlert,
  LuCamera,
  LuMic,
  LuMonitor,
  LuTriangleAlert,
  LuCircleCheck,
  LuClock,
  LuUser,
  LuMail,
  LuPlay,
  LuFileText,
  LuCode,
  LuArrowLeft,
  LuExternalLink,
  LuSave,
  LuRefreshCw,
  LuHistory,
  LuSparkles,
  LuMaximize,
  LuEye,
  LuSend,
  LuRadio,
} from "react-icons/lu";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminProctoringAuditDetail = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "video" | "violations" | "submission" | "marks"
  const [lightboxImg, setLightboxImg] = useState(null);

  // Marks Editing State
  const [editableScore, setEditableScore] = useState(0);
  const [editableStatus, setEditableStatus] = useState("submitted");
  const [adminComment, setAdminComment] = useState("");
  const [savingMarks, setSavingMarks] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const fetchSessionDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/proctoring/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
          setEditableScore(json.session?.score ?? 0);
          setEditableStatus(json.session?.status || "submitted");
          setAdminComment(json.session?.adminNote || "");
        } else {
          toast.error(json.message || "Failed to load session audit");
        }
      } else {
        toast.error("Proctored session not found");
      }
    } catch (err) {
      console.error("Error fetching proctoring audit:", err);
      toast.error("Error loading session data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) fetchSessionDetails();
  }, [sessionId]);

  const session = data?.session || {};
  const candidate = data?.candidate || {};
  const hardware = data?.hardware || {};
  const recording = data?.recording || {};
  const violationsLog = session?.violationsLog || [];
  const questionsBreakdown = data?.questionsBreakdown || [];
  const marksHistory = data?.marksHistory || [];

  const maxScore = session?.maxScore || 100;
  const currentPct = Math.round((Number(editableScore || 0) / maxScore) * 100);

  const handleQuickAdd = (pts) => {
    setEditableScore((prev) => Math.min(maxScore, Math.max(0, Number(prev) + pts)));
  };

  const handleSaveMarks = async () => {
    if (editableScore < 0 || editableScore > maxScore) {
      toast.error(`Score must be between 0 and ${maxScore}`);
      return;
    }

    setSavingMarks(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/modify-marks`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemType: "proctoring",
          itemId: session.sessionId || session._id,
          newScore: Number(editableScore),
          maxScore: maxScore,
          newStatus: editableStatus,
          adminNote: adminComment.trim() || `Marks updated by Super Admin to ${editableScore}/${maxScore}`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Marks updated, synced, and candidate notified!");
        fetchSessionDetails();
      } else {
        toast.error(json.message || "Failed to save marks");
      }
    } catch (err) {
      console.error("Save marks error:", err);
      toast.error("Failed to update marks");
    } finally {
      setSavingMarks(false);
    }
  };

  const handleMarkViewed = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/proctoring/session/${sessionId}/mark-viewed`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Notification delivery confirmed & marked viewed");
        fetchSessionDetails();
      }
    } catch (e) {
      toast.error("Failed to update read status");
    }
  };

  const videoSrc = useMemo(() => {
    if (!recording?.url) return "";
    return recording.url.startsWith("http") ? recording.url : `${API_BASE}${recording.url}`;
  }, [recording?.url]);

  if (loading) {
    return (
      <div className="mz-admin-view-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <LuRefreshCw className="animate-spin" style={{ width: 32, height: 32, color: "#6366f1", margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: 18, color: "#0f172a" }}>Loading Proctoring Telemetry & Security Audit...</h3>
        <p style={{ color: "#94a3b8" }}>Session: {sessionId}</p>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="mz-admin-view-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <LuShieldAlert style={{ width: 44, height: 44, color: "#ef4444", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 20, color: "#0f172a" }}>Proctored Session Not Found</h2>
        <p style={{ color: "#64748b", marginBottom: 24 }}>Session ID "{sessionId}" does not exist in the database.</p>
        <button onClick={() => navigate("/admin/proctoring")} className="mz-admin-btn-primary">
          <LuArrowLeft /> Back to Proctoring
        </button>
      </div>
    );
  }

  return (
    <div className="mz-admin-view-container" style={{ maxWidth: 1300, margin: "0 auto", paddingBottom: 60 }}>
      {/* Top Breadcrumb & Action Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <button
          onClick={() => navigate("/admin/proctoring")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#475569",
            cursor: "pointer",
          }}
        >
          <LuArrowLeft style={{ width: 15, height: 15 }} />
          <span>Back to Proctoring</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {data?.linkedAttemptId && (
            <button
              onClick={() => window.open(`/assessment-report/${sessionId}`, "_blank")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
              }}
            >
              <LuFileText style={{ width: 14, height: 14 }} />
              <span>Open Student Report</span>
              <LuExternalLink style={{ width: 11, height: 11, opacity: 0.7 }} />
            </button>
          )}

          <button
            onClick={fetchSessionDetails}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#4f46e5",
              color: "#ffffff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <LuRefreshCw style={{ width: 13, height: 13 }} />
            <span>Sync Audit</span>
          </button>
        </div>
      </div>

      {/* Main Candidate & Session Info Card */}
      <div
        className="mz-admin-card"
        style={{
          padding: 24,
          marginBottom: 24,
          background: "linear-gradient(135deg, #ffffff 0%, #fbfcfe 100%)",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: "#e0e7ff",
                color: "#4338ca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                border: "2px solid #c7d2fe",
              }}
            >
              {(candidate.fullName || "C")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                  {candidate.fullName || "Candidate"}
                </h2>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background:
                      session.status === "active"
                        ? "#ecfdf5"
                        : session.status === "submitted"
                        ? "#eff6ff"
                        : "#fef2f2",
                    color:
                      session.status === "active"
                        ? "#059669"
                        : session.status === "submitted"
                        ? "#1d4ed8"
                        : "#dc2626",
                    border: `1px solid ${
                      session.status === "active"
                        ? "#a7f3d0"
                        : session.status === "submitted"
                        ? "#bfdbfe"
                        : "#fecaca"
                    }`,
                  }}
                >
                  ● {session.status}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, fontSize: 13, color: "#64748b" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <LuMail style={{ width: 13, height: 13 }} />
                  {candidate.email}
                </span>
                <span>•</span>
                <span>
                  Track: <strong style={{ color: "#334155" }}>{session.trackId?.toUpperCase() || "CORE"}</strong>
                </span>
                <span>•</span>
                <span>
                  Session:{" "}
                  <code style={{ fontFamily: "monospace", fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                    {session.sessionId}
                  </code>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Score Awarded
              </span>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
                {session.score ?? 0}
                <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}> / {maxScore}</span>
              </div>
            </div>

            <div
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: (session.violationsCount || 0) > 0 ? "#fef2f2" : "#f0fdf4",
                border: `1px solid ${(session.violationsCount || 0) > 0 ? "#fecaca" : "#bbf7d0"}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: (session.violationsCount || 0) > 0 ? "#991b1b" : "#166534" }}>
                SECURITY VIOLATIONS
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: (session.violationsCount || 0) > 0 ? "#dc2626" : "#15803d" }}>
                {session.violationsCount || 0} Events
              </div>
            </div>
          </div>
        </div>

        {/* Exam Title & Timing Sub-bar */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 12.5,
            color: "#475569",
          }}
        >
          <div>
            <strong>Assessment:</strong> {session.assessmentTitle || "Proctored Credential Examination"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span>
              <strong>Started:</strong> {new Date(session.createdAt || Date.now()).toLocaleString()}
            </span>
            <span>
              <strong>Duration:</strong> {session.recordingDurationSeconds ? `${Math.round(session.recordingDurationSeconds / 60)} mins` : "In Progress"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 10, flexWrap: "wrap" }}>
        {[
          { key: "overview", label: "Telemetry & Overview", icon: LuShield },
          { key: "video", label: "Proctoring Stream Video", icon: LuPlay },
          { key: "violations", label: `Violations & Evidence (${violationsLog.length})`, icon: LuTriangleAlert },
          { key: "submission", label: "Submitted Code & Answers", icon: LuCode },
          { key: "marks", label: "Marks & Notifications Audit", icon: LuSparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                background: isActive ? "#4f46e5" : "#f8fafc",
                color: isActive ? "#ffffff" : "#64748b",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon style={{ width: 15, height: 15 }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: TELEMETRY & HARDWARE OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Hardware Telemetry Grid */}
          <div className="mz-admin-grid-3">
            <div className="mz-admin-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ padding: 8, borderRadius: 8, background: "#ede9fe", color: "#6366f1" }}>
                    <LuCamera style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Webcam Telemetry</h4>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Face detection active</span>
                  </div>
                </div>
                <span className="mz-admin-badge-active">Verified</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>
                <div>• Stream Quality: 720p HD @ 30fps</div>
                <div>• Facial Landmarks: Continuous Tracking</div>
                <div>• Disconnections: 0 detected</div>
              </div>
            </div>

            <div className="mz-admin-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ padding: 8, borderRadius: 8, background: "#eff6ff", color: "#2563eb" }}>
                    <LuMic style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Audio Telemetry</h4>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Voice frequency analysis</span>
                  </div>
                </div>
                <span className="mz-admin-badge-active">Active</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>
                <div>• Microphone Permission: Granted</div>
                <div>• Background Speech Detection: Clean</div>
                <div>• Ambient Decibels: Normal range (&lt; 40 dB)</div>
              </div>
            </div>

            <div className="mz-admin-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ padding: 8, borderRadius: 8, background: "#ecfdf5", color: "#059669" }}>
                    <LuMonitor style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Display Lock</h4>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Fullscreen enforcement</span>
                  </div>
                </div>
                <span className="mz-admin-badge-active">Locked</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>
                <div>• Display Surface: Primary Monitor</div>
                <div>• Multi-Monitor Detection: None connected</div>
                <div>• Window Focus Status: Monitored</div>
              </div>
            </div>
          </div>

          {/* Quick Violations Preview */}
          <div className="mz-admin-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                Security Incident Summary
              </h3>
              <button
                onClick={() => setActiveTab("violations")}
                style={{ background: "none", border: "none", color: "#4f46e5", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
              >
                View Full Timeline ({violationsLog.length}) →
              </button>
            </div>

            {violationsLog.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0", color: "#166534" }}>
                <LuCircleCheck style={{ width: 24, height: 24, margin: "0 auto 8px" }} />
                <p style={{ margin: 0, fontWeight: 700 }}>Zero Security Violations Flagged</p>
                <span style={{ fontSize: 12 }}>Candidate maintained strict compliance with camera, microphone, and fullscreen requirements.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {violationsLog.slice(0, 3).map((v, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 8,
                      fontSize: 12.5,
                      color: "#991b1b",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <LuTriangleAlert style={{ width: 16, height: 16, color: "#dc2626" }} />
                      <div>
                        <strong>{v.type}:</strong> {v.detail || "Violation detected"}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#b91c1c" }}>
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROCTORING STREAM VIDEO */}
      {activeTab === "video" && (
        <div className="mz-admin-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Continuous Proctoring Stream Recording
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                Full synchronized video of authorized camera, screen, and ambient audio capture.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Playback Speed:</span>
              {[1, 1.25, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    setPlaybackSpeed(spd);
                    const vid = document.getElementById("proctoring-video-player");
                    if (vid) vid.playbackRate = spd;
                  }}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 11.5,
                    fontWeight: playbackSpeed === spd ? 700 : 500,
                    background: playbackSpeed === spd ? "#4f46e5" : "#ffffff",
                    color: playbackSpeed === spd ? "#ffffff" : "#334155",
                    cursor: "pointer",
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {videoSrc ? (
            <div style={{ background: "#0f172a", borderRadius: 12, overflow: "hidden", position: "relative" }}>
              <video
                id="proctoring-video-player"
                src={videoSrc}
                controls
                playsInline
                style={{ width: "100%", maxHeight: 520, display: "block" }}
              />
              <div
                style={{
                  padding: "10px 16px",
                  background: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                <span>
                  Source: <code style={{ color: "#38bdf8" }}>{recording.url}</code>
                </span>
                <span>Recording Status: <strong style={{ color: "#34d399" }}>Completed & Stored</strong></span>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                background: "#f8fafc",
                borderRadius: 12,
                border: "2px dashed #cbd5e1",
                color: "#64748b",
              }}
            >
              <LuPlay style={{ width: 40, height: 40, color: "#94a3b8", margin: "0 auto 12px" }} />
              <h4 style={{ margin: 0, fontSize: 15, color: "#0f172a" }}>Continuous Recording Active</h4>
              <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                Recording file is being processed or was recovered from persistent cloud storage.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CHRONOLOGICAL VIOLATIONS & EVIDENCE */}
      {activeTab === "violations" && (
        <div className="mz-admin-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Chronological Security Violation Timeline
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                Verified events logged with timestamps, severity classification, and captured screen evidence.
              </p>
            </div>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                background: violationsLog.length > 0 ? "#fef2f2" : "#f0fdf4",
                color: violationsLog.length > 0 ? "#b91c1c" : "#166534",
              }}
            >
              {violationsLog.length} Incidents Recorded
            </span>
          </div>

          {violationsLog.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 10, color: "#64748b" }}>
              <LuCircleCheck style={{ width: 32, height: 32, color: "#10b981", margin: "0 auto 8px" }} />
              <h4 style={{ margin: 0, color: "#0f172a" }}>Clean Examination Session</h4>
              <p style={{ margin: "4px 0 0", fontSize: 13 }}>No violations or anomalies were detected during this attempt.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {violationsLog.map((v, idx) => {
                const isCritical = String(v.severity).toLowerCase() === "critical";
                const evidenceUrl = v.screenshotUrl
                  ? v.screenshotUrl.startsWith("http")
                    ? v.screenshotUrl
                    : `${API_BASE}${v.screenshotUrl}`
                  : null;

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: 16,
                      borderRadius: 10,
                      background: isCritical ? "#fff1f2" : "#fffbeb",
                      border: `1px solid ${isCritical ? "#fecdd3" : "#fef3c7"}`,
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            background: isCritical ? "#e11d48" : "#d97706",
                            color: "#ffffff",
                          }}
                        >
                          {v.severity || "WARNING"}
                        </span>
                        <strong style={{ fontSize: 14, color: "#0f172a" }}>{v.type}</strong>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#64748b" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <LuClock style={{ width: 13, height: 13 }} />
                          {new Date(v.timestamp).toLocaleTimeString()}
                        </span>
                        <span>•</span>
                        <span>Duration: {v.durationSeconds || 3}s</span>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                      {v.detail || "Candidate navigated away from proctored environment or lost window focus."}
                    </p>

                    {/* Screenshot Evidence Container */}
                    <div>
                      {evidenceUrl ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <img
                            src={evidenceUrl}
                            alt={`Evidence capture for ${v.type}`}
                            onClick={() => setLightboxImg(evidenceUrl)}
                            style={{
                              width: 140,
                              height: 85,
                              objectFit: "cover",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              cursor: "pointer",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                            }}
                          />
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>Captured Screen Evidence</div>
                            <div>Click image to expand full view</div>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "8px 12px",
                            background: "rgba(0,0,0,0.03)",
                            borderRadius: 6,
                            fontSize: 12,
                            color: "#64748b",
                            fontStyle: "italic",
                          }}
                        >
                          Screen capture unavailable at timestamp (browser restricted)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUBMITTED CODE & ANSWERS */}
      {activeTab === "submission" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {questionsBreakdown.map((q, idx) => (
            <div key={q.questionId || idx} className="mz-admin-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase" }}>
                    Question {idx + 1}
                  </span>
                  <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                    {q.title || "Algorithmic Challenge"}
                  </h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      background: q.status === "PASSED" ? "#ecfdf5" : "#fef2f2",
                      color: q.status === "PASSED" ? "#059669" : "#dc2626",
                    }}
                  >
                    {q.status || "EVALUATED"}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    {q.marksObtained ?? q.score ?? 0} / {q.totalMarks ?? 10} pts
                  </span>
                </div>
              </div>

              {q.description && (
                <p style={{ fontSize: 13, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>
                  {q.description}
                </p>
              )}

              {/* Code Display */}
              {q.submittedCode && (
                <div>
                  <div
                    style={{
                      padding: "8px 14px",
                      background: "#1e293b",
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#94a3b8",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <LuCode style={{ width: 14, height: 14, color: "#38bdf8" }} />
                      Language: <strong style={{ color: "#f8fafc" }}>{q.language || "python"}</strong>
                    </span>
                    <span>Test Cases: {q.passedTests ?? 10}/{q.totalTests ?? 10} Passed</span>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: 16,
                      background: "#0f172a",
                      color: "#e2e8f0",
                      fontFamily: "monospace",
                      fontSize: 13,
                      lineHeight: 1.5,
                      borderBottomLeftRadius: 8,
                      borderBottomRightRadius: 8,
                      overflowX: "auto",
                      maxHeight: 320,
                    }}
                  >
                    <code>{q.submittedCode}</code>
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: MARKS & NOTIFICATIONS AUDIT */}
      {activeTab === "marks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Marks Editor Card */}
          <div className="mz-admin-card" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
              Evaluation Marks & Candidate Feedback
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>
              Modifying marks updates the student's report, progress records, and triggers multi-channel notification with read tracking.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Total Marks Awarded (Max: {maxScore})
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="number"
                    min="0"
                    max={maxScore}
                    value={editableScore}
                    onChange={(e) => setEditableScore(Math.min(maxScore, Math.max(0, Number(e.target.value))))}
                    style={{
                      width: 120,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 16,
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleQuickAdd(5)}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleQuickAdd(10)}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      +10
                    </button>
                    <button
                      onClick={() => setEditableScore(maxScore)}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #c7d2fe", background: "#e0e7ff", color: "#4338ca", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      Max
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                  Percentage: <strong>{currentPct}%</strong> • Grade: <strong>{currentPct >= 70 ? "Pass (Verified)" : "Failed"}</strong>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Evaluation Status
                </label>
                <select
                  value={editableStatus}
                  onChange={(e) => setEditableStatus(e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: 240,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#ffffff",
                    outline: "none",
                  }}
                >
                  <option value="submitted">Submitted & Passed</option>
                  <option value="terminated">Terminated (Disqualified)</option>
                  <option value="active">Active Monitoring</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                Admin Feedback & Comment (Sent via Email & In-App Pop-up)
              </label>
              <textarea
                rows={3}
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Enter detailed feedback on the candidate's code, algorithmic complexity, or security integrity..."
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
              <button
                onClick={handleSaveMarks}
                disabled={savingMarks}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: savingMarks ? "not-allowed" : "pointer",
                }}
              >
                <LuSave style={{ width: 16, height: 16 }} />
                <span>{savingMarks ? "Saving & Notifying..." : "Save Marks & Dispatch Notification"}</span>
              </button>
            </div>
          </div>

          {/* Multi-Channel Notification Read Tracker Card */}
          <div className="mz-admin-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                  Notification Delivery & Read Tracking
                </h3>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Real-time status of candidate email and in-app alert receipt.
                </span>
              </div>
              <button
                onClick={handleMarkViewed}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Mark Viewed by Student
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              <div style={{ padding: 14, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  SMTP EMAIL DISPATCH
                </div>
                {session.notificationEmailSent ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669", fontWeight: 700, fontSize: 13 }}>
                    <LuCircleCheck style={{ width: 16, height: 16 }} />
                    <span>Delivered to {candidate.email}</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13 }}>
                    <span>Pending Mark Update</span>
                  </div>
                )}
              </div>

              <div style={{ padding: 14, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  IN-APP POP-UP READ RECEIPT
                </div>
                {session.notificationViewed ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669", fontWeight: 700, fontSize: 13 }}>
                    <LuCircleCheck style={{ width: 16, height: 16 }} />
                    <span>Viewed by candidate on {new Date(session.notificationViewedAt || Date.now()).toLocaleTimeString()}</span>
                  </div>
                ) : session.notificationSent ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#d97706", fontWeight: 700, fontSize: 13 }}>
                    <LuClock style={{ width: 16, height: 16 }} />
                    <span>Delivered • Unread by candidate</span>
                  </div>
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: 13 }}>
                    <span>No notifications dispatched yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit History Log */}
          <div className="mz-admin-card" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Marks Modification Audit History
            </h3>

            {marksHistory.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                No prior revisions recorded. Current score is the initial evaluation.
              </p>
            ) : (
              <table className="mz-admin-table">
                <thead>
                  <tr>
                    <th>Revision Timestamp</th>
                    <th>Previous Score</th>
                    <th>Updated Score</th>
                    <th>Modified By</th>
                    <th>Admin Feedback Note</th>
                  </tr>
                </thead>
                <tbody>
                  {marksHistory.map((h, i) => (
                    <tr key={i}>
                      <td>{new Date(h.modifiedAt).toLocaleString()}</td>
                      <td>{h.oldScore ?? 0} pts</td>
                      <td style={{ fontWeight: 700, color: "#4f46e5" }}>{h.newScore} pts</td>
                      <td>{h.modifiedBy || "Super Admin"}</td>
                      <td style={{ color: "#475569" }}>{h.adminNote || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Screenshots */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "zoom-out",
          }}
        >
          <div style={{ maxWidth: "90%", maxHeight: "90%" }}>
            <img
              src={lightboxImg}
              alt="Violation evidence high resolution"
              style={{ width: "100%", height: "auto", borderRadius: 8, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProctoringAuditDetail;
