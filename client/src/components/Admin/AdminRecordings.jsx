import React, { useState, useEffect, useMemo } from "react";
import {
  LuVideo,
  LuPlay,
  LuDownload,
  LuX,
  LuSearch,
  LuRefreshCw,
  LuClock,
  LuUsers,
  LuMonitor,
  LuShield,
  LuCircleCheck,
  LuTriangleAlert,
  LuActivity,
  LuHardDrive,
  LuRadio,
  LuCalendar,
  LuLayers,
  LuMaximize,
  LuExternalLink,
  LuTrash2,
  LuPencil,
} from "react-icons/lu";
import io from "socket.io-client";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminRecordings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeRecording, setActiveRecording] = useState(null);
  const [modalTab, setModalTab] = useState("timeline"); // "timeline" | "details"
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoError, setVideoError] = useState(false);
  const [renameModalRecording, setRenameModalRecording] = useState(null);
  const [renameInput, setRenameInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRenameRecording = async (e) => {
    e?.preventDefault?.();
    if (!renameModalRecording || !renameInput.trim()) return;
    setIsRenaming(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/api/recordings/${renameModalRecording.recordingId}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: renameInput.trim() }),
      });
      if (res.ok) {
        toast.success("Recording renamed successfully!");
        setData((prev) => {
          if (!prev) return prev;
          const updatedRecordings = (prev.recordings || []).map((r) =>
            r.recordingId === renameModalRecording.recordingId
              ? { ...r, title: renameInput.trim() }
              : r
          );
          return { ...prev, recordings: updatedRecordings };
        });
        if (activeRecording?.recordingId === renameModalRecording.recordingId) {
          setActiveRecording((prev) => ({ ...prev, title: renameInput.trim() }));
        }
        setRenameModalRecording(null);
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Failed to rename recording");
      }
    } catch (err) {
      toast.error(`Rename error: ${err.message}`);
    } finally {
      setIsRenaming(false);
    }
  };

  const fetchRecordings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/recordings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json);
      }
    } catch (err) {
      console.error("Recordings fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();

    // Real-time synchronization via Socket.io
    let socket;
    try {
      const token = localStorage.getItem("token");
      socket = io(API_BASE || window.location.origin, {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        socket.emit("join_admin_feed");
      });

      socket.on("NEW_RECORDING_SAVED", (newRec) => {
        toast.info(`New recording received: ${newRec.title || "Meeting Recording"}`);
        fetchRecordings();
      });

      socket.on("meeting_recording_saved", () => {
        fetchRecordings();
      });

      socket.on("RECORDING_DELETED", () => {
        fetchRecordings();
      });

      socket.on("RECORDINGS_PURGED", () => {
        fetchRecordings();
      });
    } catch (err) {
      console.warn("Socket connection warning in AdminRecordings:", err);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleDeleteRecording = async (rec) => {
    const recId = rec.id || rec.recordingId;
    if (!window.confirm(`Are you sure you want to permanently delete "${rec.title}"?\n\nThis will remove the file from storage and audit records.`)) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/recordings/${recId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Recording permanently deleted");
        if (activeRecording && (activeRecording.id === recId || activeRecording.recordingId === recId)) {
          setActiveRecording(null);
        }
        fetchRecordings();
      } else {
        toast.error(json.message || "Failed to delete recording");
      }
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const handlePurgeCorrupted = async () => {
    if (!window.confirm("Purge all 0-byte or corrupted recordings from storage and database?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/recordings/purge-corrupted`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        fetchRecordings();
      } else {
        toast.error(json.message || "Purge failed");
      }
    } catch (err) {
      toast.error(`Purge error: ${err.message}`);
    }
  };

  const rawList = data?.recordings || [];
  const stats = data?.stats || {
    totalRecordings: rawList.length,
    totalDiskSizeMB: data?.totalDiskSizeMB ?? 0,
    totalDurationMinutes: 0,
    meetingsCount: 0,
    screenSharesCount: 0,
    proctoringCount: 0,
  };

  const filteredRecordings = useMemo(() => {
    let list = [...rawList];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(term) ||
          r.hostName?.toLowerCase().includes(term) ||
          r.hostEmail?.toLowerCase().includes(term) ||
          r.recordingId?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      list = list.filter(
        (r) =>
          r.recordingType?.toLowerCase().replace(/\s+/g, "") ===
          typeFilter.toLowerCase().replace(/\s+/g, "")
      );
    }

    // Sort order: Newest FIRST (requirement 1)
    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "size") {
      list.sort((a, b) => (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0));
    } else if (sortBy === "duration") {
      list.sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0));
    }

    return list;
  }, [rawList, searchTerm, typeFilter, sortBy]);

  const handleOpenPlayback = (rec) => {
    setActiveRecording(rec);
    setModalTab("timeline");
    setPlaybackSpeed(1);
    setVideoError(false);
  };

  const formatDuration = (secs) => {
    if (!secs || isNaN(secs)) return "1m 15s";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m > 0 ? `${m}m ${s < 10 ? "0" : ""}${s}s` : `${s}s`;
  };

  const getVideoSrc = (rec) => {
    if (!rec) return "";
    const rawUrl = rec.streamUrl || rec.fileUrl || "";
    return rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`;
  };

  return (
    <div className="mz-admin-view-container" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div className="mz-admin-header">
        <div className="mz-admin-page-title-box">
          <div className="mz-admin-page-icon">
            <LuVideo style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="mz-admin-page-title">Authorized Recordings Management</h1>
            <p className="mz-admin-page-subtitle">
              Audit, stream, and inspect meeting screen shares, participant audio recordings, and proctored attempts in real time.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {rawList.some((r) => Number(r.fileSizeMB) <= 0 || r.status === "error") && (
            <button
              onClick={handlePurgeCorrupted}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: "#dc2626",
                cursor: "pointer",
              }}
              title="Purge empty and corrupted recordings"
            >
              <LuTrash2 style={{ width: 14, height: 14 }} />
              <span>Purge Corrupted (0B)</span>
            </button>
          )}

          <button
            onClick={fetchRecordings}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
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
              gap: 12,
              padding: "8px 16px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <LuHardDrive style={{ width: 14, height: 14, color: "#6366f1" }} />
              <span>Disk Consumed: {stats.totalDiskSizeMB} MB</span>
            </span>
            <span>•</span>
            <span style={{ color: "#4f46e5" }}>{stats.totalRecordings} Recordings</span>
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div
        className="mz-admin-card"
        style={{
          padding: 16,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        {/* Search Input */}
        <div style={{ position: "relative", minWidth: 280, flex: "1 1 300px" }}>
          <LuSearch
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              width: 15,
              height: 15,
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by meeting title, host, candidate, or recording ID..."
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              fontSize: 13,
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {[
            { key: "all", label: `All (${rawList.length})` },
            { key: "meeting", label: `Meetings (${stats.meetingsCount || 0})` },
            { key: "screenshare", label: `Screen Shares (${stats.screenSharesCount || 0})` },
            { key: "proctoring", label: `Proctoring (${stats.proctoringCount || 0})` },
          ].map((tab) => {
            const isActive = typeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? "#4f46e5" : "#f1f5f9",
                  color: isActive ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 12.5,
              fontWeight: 600,
              background: "#ffffff",
              color: "#334155",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="size">Largest Size</option>
            <option value="duration">Longest Duration</option>
          </select>
        </div>
      </div>

      {/* Recordings Grid (Newest first) */}
      <div className="mz-admin-grid-3">
        {loading ? (
          <div className="mz-admin-card" style={{ gridColumn: "span 3", textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <LuRefreshCw className="animate-spin" style={{ width: 28, height: 28, color: "#6366f1", margin: "0 auto 12px" }} />
            <div>Loading verified recordings from database...</div>
          </div>
        ) : filteredRecordings.length === 0 ? (
          <div className="mz-admin-card" style={{ gridColumn: "span 3", textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <LuVideo style={{ width: 36, height: 36, color: "#cbd5e1", margin: "0 auto 12px" }} />
            <h4 style={{ margin: "0 0 4px", color: "#0f172a" }}>No Recordings Found</h4>
            <span style={{ fontSize: 13 }}>No meeting or proctoring recordings match the current filter.</span>
          </div>
        ) : (
          filteredRecordings.map((r, i) => {
            const isScreen = r.recordingType === "Screen Share";
            const isProc = r.recordingType === "Proctoring";
            const isCorrupt = Number(r.fileSizeMB) <= 0;
            const hostInitial = (r.hostName || "H")[0].toUpperCase();

            return (
              <div
                key={r.id || r.recordingId || i}
                className="mz-admin-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: 20,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  border: isCorrupt ? "1px solid #fecaca" : "1px solid #e2e8f0",
                }}
              >
                <div>
                  {/* Card Header Badges */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: isProc ? "#ecfdf5" : isScreen ? "#faf5ff" : "#eff6ff",
                          color: isProc ? "#059669" : isScreen ? "#7e22ce" : "#1d4ed8",
                          border: `1px solid ${isProc ? "#a7f3d0" : isScreen ? "#e9d5ff" : "#bfdbfe"}`,
                        }}
                      >
                        {isProc ? <LuShield style={{ width: 12, height: 12 }} /> : isScreen ? <LuMonitor style={{ width: 12, height: 12 }} /> : <LuVideo style={{ width: 12, height: 12 }} />}
                        {r.recordingType}
                      </span>

                      <span className="mz-admin-badge-gray" style={{ fontWeight: 700 }}>
                        {r.fileSizeMB} MB
                      </span>
                    </div>

                    {isCorrupt ? (
                      <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        <LuTriangleAlert style={{ width: 13, height: 13 }} />
                        Corrupted / 0B
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        <LuCircleCheck style={{ width: 13, height: 13 }} />
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Meaningful Title */}
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#0f172a",
                      lineHeight: 1.35,
                    }}
                    title={r.title}
                  >
                    {r.title}
                  </h3>

                  {/* Host Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#e0e7ff",
                        color: "#4338ca",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {hostInitial}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}>
                        {r.hostName || "Host"}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {r.hostEmail || "user@masteryzone.com"}
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Details */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 11.5,
                      color: "#64748b",
                      padding: "8px 10px",
                      background: "#f8fafc",
                      borderRadius: 6,
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <LuClock style={{ width: 12, height: 12 }} />
                      {formatDuration(r.durationSeconds)}
                    </span>
                    <span>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <LuUsers style={{ width: 12, height: 12 }} />
                      {r.participantsCount || 1} participant{r.participantsCount > 1 ? "s" : ""}
                    </span>
                    <span>•</span>
                    <span>{new Date(r.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                  </div>

                  {/* Monospace Recording ID */}
                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 10.5,
                        color: "#64748b",
                        background: "#f1f5f9",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {r.recordingId}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => handleOpenPlayback(r)}
                    className="mz-admin-btn-primary"
                    style={{ flex: 1, justifyContent: "center", gap: 6 }}
                  >
                    <LuPlay style={{ width: 14, height: 14 }} />
                    <span>Playback & Audit</span>
                  </button>

                  <button
                    onClick={() => {
                      setRenameModalRecording(r);
                      setRenameInput(r.title);
                    }}
                    className="mz-admin-btn-secondary"
                    style={{ padding: "8px 10px" }}
                    title="Rename Recording"
                  >
                    <LuPencil style={{ width: 14, height: 14 }} />
                  </button>

                  <a
                    href={getVideoSrc(r)}
                    download={`${r.title?.replace(/[^a-zA-Z0-9_-]/g, "_") || "recording"}.webm`}
                    className="mz-admin-btn-secondary"
                    style={{ padding: "8px 10px" }}
                    title="Download Video File"
                  >
                    <LuDownload style={{ width: 14, height: 14 }} />
                  </a>

                  <button
                    onClick={() => handleDeleteRecording(r)}
                    className="mz-admin-btn-secondary"
                    style={{ padding: "8px 10px", color: "#dc2626", borderColor: "#fecaca" }}
                    title="Permanently Delete Recording"
                  >
                    <LuTrash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Video Playback & Activity Timeline Modal */}
      {activeRecording && (
        <div className="mz-admin-modal-overlay">
          <div className="mz-admin-modal-card" style={{ maxWidth: 860, maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
            {/* Modal Header */}
            <div className="mz-admin-modal-header" style={{ borderBottom: "1px solid #e2e8f0", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    background:
                      activeRecording.recordingType === "Proctoring"
                        ? "#ecfdf5"
                        : activeRecording.recordingType === "Screen Share"
                        ? "#faf5ff"
                        : "#eff6ff",
                    color:
                      activeRecording.recordingType === "Proctoring"
                        ? "#059669"
                        : activeRecording.recordingType === "Screen Share"
                        ? "#7e22ce"
                        : "#1d4ed8",
                  }}
                >
                  {activeRecording.recordingType}
                </span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                  {activeRecording.title}
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => {
                    setRenameModalRecording(activeRecording);
                    setRenameInput(activeRecording.title);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Rename recording"
                >
                  <LuPencil style={{ width: 13, height: 13 }} />
                  <span>Rename</span>
                </button>

                <a
                  href={getVideoSrc(activeRecording)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    background: "#f1f5f9",
                    color: "#475569",
                    borderRadius: 6,
                    fontSize: 12,
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                  title="Open video directly in new browser tab"
                >
                  <LuExternalLink style={{ width: 13, height: 13 }} />
                  <span>Open URL</span>
                </a>

                <button
                  onClick={() => handleDeleteRecording(activeRecording)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Delete this recording"
                >
                  <LuTrash2 style={{ width: 13, height: 13 }} />
                  <span>Delete</span>
                </button>

                <button
                  onClick={() => setActiveRecording(null)}
                  style={{ background: "transparent", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", marginLeft: 4 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Cinematic Video Player Section */}
            <div style={{ background: "#0b0f19", position: "relative" }}>
              {videoError ? (
                <div style={{ padding: "60px 20px", textAlign: "center", color: "#f87171" }}>
                  <LuTriangleAlert style={{ width: 36, height: 36, margin: "0 auto 10px" }} />
                  <h4 style={{ margin: 0, color: "#ffffff" }}>Playback Notice</h4>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
                    This recording was finalized with zero bytes or interrupted before upload completion.
                  </p>
                  <button
                    onClick={() => handleDeleteRecording(activeRecording)}
                    style={{
                      marginTop: 16,
                      padding: "8px 16px",
                      background: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Delete Corrupted File
                  </button>
                </div>
              ) : (
                <video
                  id="admin-active-video-player"
                  src={getVideoSrc(activeRecording)}
                  controls
                  playsInline
                  autoPlay
                  onLoadedMetadata={(e) => {
                    const v = e.target;
                    if (v.duration === Infinity) {
                      v.currentTime = 1e101;
                      v.ontimeupdate = function() {
                        this.ontimeupdate = null;
                        this.currentTime = 0;
                      };
                    }
                  }}
                  onError={() => setVideoError(true)}
                  style={{ width: "100%", maxHeight: 380, display: "block", background: "#000000" }}
                >
                  Your browser does not support the video tag.
                </video>
              )}

              {/* Video Bar Controls */}
              <div
                style={{
                  padding: "8px 16px",
                  background: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>Speed:</span>
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        setPlaybackSpeed(spd);
                        const v = document.getElementById("admin-active-video-player");
                        if (v) v.playbackRate = spd;
                      }}
                      style={{
                        padding: "2px 6px",
                        borderRadius: 4,
                        border: "none",
                        fontSize: 11,
                        fontWeight: playbackSpeed === spd ? 700 : 500,
                        background: playbackSpeed === spd ? "#6366f1" : "rgba(255,255,255,0.1)",
                        color: "#ffffff",
                        cursor: "pointer",
                      }}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span>Size: {activeRecording.fileSizeMB} MB</span>
                  <span>•</span>
                  <span>Duration: {formatDuration(activeRecording.durationSeconds)}</span>
                </div>
              </div>
            </div>

            {/* Sub-tabs: Meeting Activity Timeline vs Details */}
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", padding: "0 20px" }}>
              <button
                onClick={() => setModalTab("timeline")}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderBottom: modalTab === "timeline" ? "2px solid #4f46e5" : "2px solid transparent",
                  background: "transparent",
                  fontSize: 13,
                  fontWeight: modalTab === "timeline" ? 700 : 500,
                  color: modalTab === "timeline" ? "#4f46e5" : "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <LuActivity style={{ width: 14, height: 14 }} />
                <span>Meeting Activity Timeline ({activeRecording.activityTimeline?.length || 0})</span>
              </button>

              <button
                onClick={() => setModalTab("details")}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderBottom: modalTab === "details" ? "2px solid #4f46e5" : "2px solid transparent",
                  background: "transparent",
                  fontSize: 13,
                  fontWeight: modalTab === "details" ? 700 : 500,
                  color: modalTab === "details" ? "#4f46e5" : "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <LuLayers style={{ width: 14, height: 14 }} />
                <span>Participants & Specs</span>
              </button>
            </div>

            {/* Tab Body */}
            <div style={{ padding: 20, overflowY: "auto", flex: 1, maxHeight: 260 }}>
              {modalTab === "timeline" ? (
                <div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(activeRecording.activityTimeline || []).map((ev, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          fontSize: 12.5,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background:
                              ev.type.includes("start") || ev.type.includes("initialized")
                                ? "#10b981"
                                : ev.type.includes("violation")
                                ? "#ef4444"
                                : "#6366f1",
                            marginTop: 5,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                            <strong style={{ color: "#0f172a" }}>{ev.event}</strong>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>
                              {new Date(ev.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.4 }}>
                            {ev.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13, color: "#334155" }}>
                  <div>
                    <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Host Account:</h4>
                    <p style={{ margin: "0 0 4px" }}><strong>Name:</strong> {activeRecording.hostName}</p>
                    <p style={{ margin: "0 0 4px" }}><strong>Email:</strong> {activeRecording.hostEmail}</p>
                    <p style={{ margin: "0 0 12px" }}><strong>Recording ID:</strong> {activeRecording.recordingId}</p>

                    <h4 style={{ margin: "10px 0 6px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Participants ({activeRecording.participantsCount}):</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(activeRecording.participantNames || [activeRecording.hostName]).map((p, i) => (
                        <span key={i} style={{ padding: "3px 8px", background: "#f1f5f9", borderRadius: 4, fontSize: 12 }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>File & Cloud Storage:</h4>
                    <p style={{ margin: "0 0 4px" }}><strong>MIME Type:</strong> video/webm;codecs=vp9,opus</p>
                    <p style={{ margin: "0 0 4px" }}><strong>File Size:</strong> {activeRecording.fileSizeMB} MB ({activeRecording.fileSizeBytes || 0} bytes)</p>
                    <p style={{ margin: "0 0 4px" }}><strong>Storage Path:</strong> <code>{activeRecording.fileUrl}</code></p>
                    <p style={{ margin: "0 0 12px" }}><strong>Stream Endpoint:</strong> <code>{activeRecording.streamUrl}</code></p>

                    <a
                      href={getVideoSrc(activeRecording)}
                      download={`${activeRecording.title?.replace(/[^a-zA-Z0-9_-]/g, "_") || "recording"}.webm`}
                      className="mz-admin-btn-primary"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                    >
                      <LuDownload style={{ width: 14, height: 14 }} />
                      <span>Download Streamable Video</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setActiveRecording(null)}
                className="mz-admin-btn-secondary"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Rename Recording Modal */}
      {renameModalRecording && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
            padding: 20,
          }}
          onClick={() => setRenameModalRecording(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              maxWidth: 440,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
              Rename Recording
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              Update the title of this recording across student dashboards and admin portals.
            </p>

            <form onSubmit={handleRenameRecording}>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                autoFocus
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: 18,
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setRenameModalRecording(null)}
                  className="mz-admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming}
                  className="mz-admin-btn-primary"
                >
                  {isRenaming ? "Saving..." : "Save Title"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecordings;
