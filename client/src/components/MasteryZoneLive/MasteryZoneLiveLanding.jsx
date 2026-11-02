import React, { useState, useEffect } from "react";
import {
  LuGraduationCap,
  LuSearch,
  LuBell,
  LuPlay,
  LuCode,
  LuSparkles,
  LuArrowRight,
  LuUsers,
  LuLock,
  LuX,
  LuVideo,
  LuCalendar,
  LuHistory,
  LuPlus,
  LuCheck,
  LuShieldCheck,
} from "react-icons/lu";
import { toast } from "react-toastify";

const QUICK_TRACKS = [
  {
    key: "dsa",
    title: "DSA & Algorithms",
    description: "Practice data structures, two-pointers, trees & dynamic programming in real-time.",
    icon: "⚡",
    tag: "High Priority",
  },
  {
    key: "coding",
    title: "Full-Stack Collaboration",
    description: "Build full-stack components, multi-file modules, and APIs together with peers.",
    icon: "</>",
    tag: "Development",
  },
  {
    key: "project",
    title: "Project Development",
    description: "Collaborative design, code reviews, and live debugging on real-world projects.",
    icon: "💡",
    tag: "Engineering",
  },
  {
    key: "interview",
    title: "Mock Technical Interview",
    description: "Pair programming interview simulation with timing and problem assessment.",
    icon: "💼",
    tag: "Career",
  },
];

export default function MasteryZoneLiveLanding({
  currentUser,
  onStartMeeting,
  onJoinMeetingById,
  onNavigateHome,
}) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [newMeetingTitle, setNewMeetingTitle] = useState("DSA Practice Session");
  const [newMeetingGroup, setNewMeetingGroup] = useState("dsa");
  const [isCreating, setIsCreating] = useState(false);
  const [recentMeetings, setRecentMeetings] = useState([]);

  // Fetch recent meetings for this user
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("token") || "";
    fetch("/api/meetings/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && Array.isArray(data.meetings)) {
          setRecentMeetings(data.meetings.slice(0, 4));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartSubmit = async (e) => {
    e?.preventDefault();
    if (!newMeetingTitle.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }
    setIsCreating(true);
    try {
      await onStartMeeting({
        title: newMeetingTitle.trim(),
        groupKey: newMeetingGroup,
      });
      setShowCreateModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to start meeting");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSubmit = (e) => {
    e?.preventDefault();
    let cleanCode = inputCode.trim().toLowerCase();
    if (!cleanCode) {
      toast.error("Please enter a meeting code or link");
      return;
    }
    if (cleanCode.includes("/meeting/")) {
      cleanCode = cleanCode.split("/meeting/").pop().split("?")[0].split("/")[0];
    }
    const alphanumeric = cleanCode.replace(/[^a-z0-9]/g, "");
    if (alphanumeric.length === 10) {
      cleanCode = `${alphanumeric.slice(0, 3)}-${alphanumeric.slice(3, 7)}-${alphanumeric.slice(7, 10)}`;
    }
    setShowJoinModal(false);
    onJoinMeetingById(cleanCode);
  };

  const handleQuickLaunchTrack = async (track) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      await onStartMeeting({
        title: `${track.title} Session`,
        groupKey: track.key,
      });
    } catch (err) {
      toast.error("Failed to start session: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const userInitial =
    currentUser?.fullName?.[0]?.toUpperCase() ||
    currentUser?.username?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="mzl-container">
      {/* 1. TOP NAVIGATION / HEADER */}
      <header className="mzl-top-nav">
        <div className="mzl-nav-left">
          <div className="mzl-brand-logo" onClick={onNavigateHome}>
            <div className="mzl-logo-badge">MZ</div>
            <span className="mzl-brand-title">Mastery Zone</span>
          </div>
          <span className="mzl-pro-pill">
            <LuSparkles size={12} />
            Live Collaboration Hub
          </span>
        </div>

        <div className="mzl-nav-center">
          <form onSubmit={handleJoinSubmit} className="mzl-quick-join-header-form">
            <div className="mzl-search-wrap">
              <LuSearch className="mzl-search-icon" />
              <input
                type="text"
                className="mzl-search-input"
                placeholder="Enter meeting code or link to join..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                data-testid="mzl-header-join-input"
              />
              {inputCode.trim() && (
                <button type="submit" className="mzl-header-quick-join-btn">
                  Join
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mzl-nav-right">
          <button
            className="mzl-nav-btn"
            title="Notifications"
            onClick={() => toast.info("No new live meeting notifications.")}
          >
            <LuBell size={18} />
            <span className="mzl-bell-badge" />
          </button>
          <div className="mzl-user-avatar" title={currentUser?.fullName || "User"}>
            {userInitial}
          </div>
        </div>
      </header>

      {/* 2. MAIN BODY */}
      <main className="mzl-landing-body">
        {/* Title Header */}
        <div className="mzl-hero-heading-block">
          <div className="mzl-badge-row">
            <span className="mzl-platform-pill">
              <LuGraduationCap size={14} />
              Google Meet-Style Real-Time Collaboration
            </span>
          </div>
          <h1 className="mzl-hero-title">
            <LuVideo size={28} color="#2563eb" />
            Mastery Zone Live Meeting
          </h1>
          <p className="mzl-hero-subtitle">
            HD video meetings, multi-party audio, and real-time MZ-ASM cloud compiler in a single workspace.
          </p>
        </div>

        {/* Hero Card */}
        <section className="mzl-hero-card">
          <div className="mzl-hero-col-left">
            <h1>
              Code together.
              <span>Build together in real time.</span>
            </h1>
            <p>
              Instantly start a high-performance meeting with integrated code editing, remote cursors, test execution, and cloud video recording.
            </p>
            <div className="mzl-hero-actions">
              <button
                className="mzl-btn-primary"
                onClick={() => setShowCreateModal(true)}
                data-testid="mzl-start-meeting-btn"
              >
                <LuPlay size={16} />
                Start Instant Meeting
              </button>
              <button
                className="mzl-btn-outline"
                onClick={() => setShowJoinModal(true)}
                data-testid="mzl-join-meeting-btn"
              >
                <LuCode size={16} />
                Join with a Code
                <LuArrowRight size={15} />
              </button>
            </div>
          </div>

          <div className="mzl-hero-col-right">
            {/* Floating Badges */}
            <div className="mzl-float-badge mzl-fb-1" title="Real-Time Audio & Video">
              📹
            </div>
            <div className="mzl-float-badge mzl-fb-2" title="Multi-Language Compiler">
              ⚡
            </div>
            <div className="mzl-float-badge mzl-fb-3" title="Cloud Recording">
              🔴
            </div>
            <div className="mzl-float-badge mzl-fb-4" title="Live Shared Cursors">
              💬
            </div>

            {/* 2x2 Live Preview Box */}
            <div className="mzl-hero-preview-box">
              <div className="mzl-preview-grid">
                <div
                  className="mzl-preview-tile"
                  style={{
                    background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                  }}
                >
                  <div
                    className="mzl-preview-avatar"
                    style={{ background: "#3b82f6" }}
                  >
                    AC
                  </div>
                  <span className="mzl-preview-speech">Compiling code... 💡</span>
                  <span className="mzl-preview-name-tag">Alex C. (Host)</span>
                </div>

                <div
                  className="mzl-preview-tile"
                  style={{
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                  }}
                >
                  <div
                    className="mzl-preview-avatar"
                    style={{ background: "#10b981" }}
                  >
                    SM
                  </div>
                  <span className="mzl-preview-name-tag">Sarah M.</span>
                </div>

                <div
                  className="mzl-preview-tile"
                  style={{
                    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                  }}
                >
                  <div
                    className="mzl-preview-avatar"
                    style={{ background: "#8b5cf6" }}
                  >
                    DK
                  </div>
                  <span className="mzl-preview-name-tag">David K.</span>
                </div>

                <div
                  className="mzl-preview-tile"
                  style={{
                    background: "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
                  }}
                >
                  <div
                    className="mzl-preview-avatar"
                    style={{ background: "#ec4899" }}
                  >
                    ER
                  </div>
                  <span className="mzl-preview-name-tag">Emily R.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Launch Tracks */}
        <section className="mzl-tracks-section" style={{ marginTop: 32 }}>
          <div className="mzl-section-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Instant Collaboration Tracks
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                Select a focused technical session to launch your room with pre-configured templates
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {QUICK_TRACKS.map((track) => (
              <div
                key={track.key}
                className="mzl-track-card"
                onClick={() => handleQuickLaunchTrack(track)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: "18px 20px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#2563eb",
                      }}
                    >
                      {track.icon}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 20,
                        background: "#f1f5f9",
                        color: "#475569",
                      }}
                    >
                      {track.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                    {track.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                    {track.description}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 14,
                    marginTop: 14,
                    borderTop: "1px solid #f1f5f9",
                    color: "#2563eb",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <span>Launch Session</span>
                  <LuArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Meetings History if any */}
        {recentMeetings.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Recent Live Sessions
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {recentMeetings.map((m) => (
                <div
                  key={m.meetingId}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Host: {m.hostName} • ID: {m.meetingId}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mzl-btn-primary"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                    onClick={() => onJoinMeetingById(m.meetingId)}
                  >
                    Rejoin
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* MODAL: Start a Meeting */}
      {showCreateModal && (
        <div
          className="mzl-modal-backdrop"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="mzl-modal-card"
            onClick={(e) => e.stopPropagation()}
            data-testid="mzl-create-meeting-modal"
          >
            <h3 className="mzl-modal-title">Start a Live Meeting</h3>
            <p className="mzl-modal-subtitle">
              Set up your collaborative room with video, audio, and live MZ-ASM coding.
            </p>

            <form onSubmit={handleStartSubmit}>
              <div className="mzl-input-group">
                <label className="mzl-input-label">Meeting Title</label>
                <input
                  type="text"
                  className="mzl-modal-input"
                  placeholder="e.g. Study Group: DSA Practice"
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  autoFocus
                  required
                  data-testid="mzl-meeting-title-input"
                />
              </div>

              <div className="mzl-input-group">
                <label className="mzl-input-label">Technical Track</label>
                <select
                  className="mzl-modal-input"
                  value={newMeetingGroup}
                  onChange={(e) => setNewMeetingGroup(e.target.value)}
                >
                  <option value="dsa">⚡ DSA & Algorithms Practice</option>
                  <option value="coding">{"</>"} Full-Stack Development</option>
                  <option value="project">💡 Project Engineering</option>
                  <option value="python">🐍 Python Developers</option>
                  <option value="interview">💼 Mock Technical Interview</option>
                </select>
              </div>

              <div className="mzl-modal-actions">
                <button
                  type="button"
                  className="mzl-btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mzl-btn-primary"
                  disabled={isCreating}
                  data-testid="mzl-submit-create-btn"
                >
                  {isCreating ? "Starting..." : "Start Meeting Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Join Meeting with Code */}
      {showJoinModal && (
        <div
          className="mzl-modal-backdrop"
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="mzl-modal-card"
            onClick={(e) => e.stopPropagation()}
            data-testid="mzl-join-modal"
          >
            <h3 className="mzl-modal-title">Join a Meeting</h3>
            <p className="mzl-modal-subtitle">
              Enter the meeting ID or full meeting invite URL.
            </p>

            <form onSubmit={handleJoinSubmit}>
              <div className="mzl-input-group">
                <label className="mzl-input-label">Meeting ID or URL</label>
                <input
                  type="text"
                  className="mzl-modal-input"
                  placeholder="e.g. mzt-kpwq-dxj or full meeting URL"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  autoFocus
                  required
                  data-testid="mzl-modal-code-input"
                />
              </div>

              <div className="mzl-modal-actions">
                <button
                  type="button"
                  className="mzl-btn-outline"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mzl-btn-primary"
                  data-testid="mzl-submit-join-btn"
                >
                  Join Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
