import React, { useState } from "react";
import {
  LuX,
  LuUser,
  LuMail,
  LuPhone,
  LuMapPin,
  LuBriefcase,
  LuCalendar,
  LuClock,
  LuShieldAlert,
  LuShieldCheck,
  LuAward,
  LuCode,
  LuFileText,
  LuSmartphone,
  LuFlame,
  LuCircleCheck,
  LuTriangleAlert,
  LuSparkles,
  LuCompass,
  LuBell,
  LuEye,
  LuZoomIn,
  LuDownload,
  LuPencil,
  LuSave,
  LuCheck,
  LuExternalLink,
  LuCopy,
  LuHistory,
  LuKey,
  LuTrash2,
} from "react-icons/lu";
import { toast } from "react-toastify";
import LeetCodeActivityCalendar from "../LeetCodeActivityCalendar.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminUserDetailModal = ({
  userDetail,
  onClose,
  onToggleStatus,
  onRoleChange,
  onResetPassword,
  onDeleteUser,
}) => {
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "timeline" | "submissions" | "assessments" | "devices"
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Full Photo View Lightbox State
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Attached Report Modal State
  const [activeReport, setActiveReport] = useState(null); // { itemType, id, ...details }
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportSubTab, setReportSubTab] = useState("questions"); // "questions" | "evaluation" | "audit"
  const [mcqFilter, setMcqFilter] = useState("all"); // "all" | "correct" | "incorrect" | "unanswered"
  const [copiedCode, setCopiedCode] = useState(false);

  // Score Editing State inside the Report Modal
  const [isEditingMarks, setIsEditingMarks] = useState(false);
  const [editScoreValue, setEditScoreValue] = useState("");
  const [editStatusValue, setEditStatusValue] = useState("");
  const [editAdminNote, setEditAdminNote] = useState("");
  const [savingMarks, setSavingMarks] = useState(false);

  // Local state for user details so edits update immediately
  const [localData, setLocalData] = useState(userDetail);

  // Copy helper with visual feedback
  const [copiedKey, setCopiedKey] = useState(null);
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Safe Date & Time Helpers
  const formatFullDate = (d) => {
    if (!d) return "Not recorded";
    try {
      return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Not recorded";
    }
  };

  const formatRelativeTime = (d) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "";
      const now = new Date();
      const diffSec = Math.floor((now - date) / 1000);
      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths < 12) return `${diffMonths}mo ago`;
      return `${Math.floor(diffDays / 365)}y ago`;
    } catch {
      return "";
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { label: "Super Admin", className: "mz-admin-badge-purple" };
      case "admin":
        return { label: "Administrator", className: "mz-admin-badge-blue" };
      case "mentor":
        return { label: "Mentor", className: "mz-admin-badge-green" };
      case "instructor":
        return { label: "Instructor", className: "mz-admin-badge-purple" };
      case "student":
      case "user":
      default:
        return { label: "Student", className: "mz-admin-badge-gray" };
    }
  };

  if (!localData) return null;
  const {
    user = {},
    submissions = [],
    certAttempts = [],
    moduleAttempts = [],
    certificates = [],
    timeline = [],
    projects = [],
    proctoredSessions = [],
  } = localData;

  const displayName = user.fullName || user.username || "User";
  const initial = (displayName[0] || "U").toUpperCase();
  const roleBadge = getRoleBadge(user.role);

  // Computed academic metrics
  const totalAssessments = certAttempts.length + moduleAttempts.length;
  const passedCertAttempts = certAttempts.filter(c => c.status === "PASSED" || (c.percentage != null && c.percentage >= 70)).length;
  const passedModuleAttempts = moduleAttempts.filter(m => m.passed || (m.percentage != null && m.percentage >= 70)).length;
  const totalPassed = passedCertAttempts + passedModuleAttempts;
  const passRate = totalAssessments > 0 ? Math.round((totalPassed / totalAssessments) * 100) : 0;
  const totalViolations = proctoredSessions.reduce((acc, ps) => acc + (ps.violationsCount || 0), 0);
  const currentStreak = userDetail.activityStats?.currentStreak !== undefined ? userDetail.activityStats.currentStreak : user.streak || 0;
  const longestStreak = userDetail.activityStats?.longestStreak || currentStreak || 0;
  const totalSubmissionsCount = userDetail.activityStats?.totalSubmissions !== undefined ? userDetail.activityStats.totalSubmissions : submissions.length;
  const totalSolvedCount = userDetail.activityStats?.totalProblemsSolved || 0;

  // Handler to open full report modal for any attempt or submission
  const handleOpenReport = async (itemType, itemId, fallbackData = {}) => {
    try {
      setLoadingReport(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/attempt-report/${itemType}/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.report) {
          setActiveReport(json.report);
          setEditScoreValue(json.report.score != null ? json.report.score : json.report.percentage || 0);
          setEditStatusValue(json.report.status || "PASSED");
          setEditAdminNote(json.report.adminNote || "");
          setIsEditingMarks(false);
          return;
        }
      }
      
      // Fallback to local data if network fetch failed
      setActiveReport({ itemType, id: itemId, ...fallbackData });
      setEditScoreValue(fallbackData.score || fallbackData.percentage || fallbackData.passedTests || 0);
      setEditStatusValue(fallbackData.status || "PASSED");
      setEditAdminNote(fallbackData.adminNote || "");
      setIsEditingMarks(false);
    } catch (err) {
      console.warn("Report load notice:", err);
      setActiveReport({ itemType, id: itemId, ...fallbackData });
    } finally {
      setLoadingReport(false);
    }
  };

  // Handler to save modified marks and update database + reports in real-time
  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!activeReport) return;

    const maxAllowed = activeReport.maxScore || 100;
    const numVal = Number(editScoreValue);
    if (isNaN(numVal) || numVal < 0 || numVal > maxAllowed) {
      toast.error(`Marks must be a valid number between 0 and ${maxAllowed}`);
      return;
    }

    try {
      setSavingMarks(true);
      const token = localStorage.getItem("token");
      const payload = {
        itemType: activeReport.itemType,
        itemId: activeReport.id,
        newScore: numVal,
        newPercentage: activeReport.itemType === "certification" ? numVal : undefined,
        newStatus: editStatusValue,
        adminNote: editAdminNote,
      };

      const res = await fetch(`${API_BASE}/api/admin/modify-marks`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Marks updated successfully! Notifications sent and report synchronized.");

        // Update active report state immediately with backend telemetry
        const returned = json.data || {};
        setActiveReport((prev) => ({
          ...prev,
          ...returned,
          score: numVal,
          percentage: activeReport.itemType === "module"
            ? Math.round((numVal / (activeReport.maxScore || 10)) * 100)
            : numVal,
          status: editStatusValue,
          adminNote: editAdminNote,
          notificationSent: returned.notificationSent ?? true,
          notificationEmailSent: returned.notificationEmailSent ?? true,
          notificationViewed: returned.notificationViewed ?? false,
          notificationViewedAt: returned.notificationViewedAt ?? null,
          marksHistory: [
            ...(prev.marksHistory || []),
            {
              oldScore: prev.score,
              newScore: numVal,
              oldStatus: prev.status,
              newStatus: editStatusValue,
              adminNote: editAdminNote,
              modifiedBy: "Super Admin",
              modifiedAt: new Date(),
            },
          ],
        }));

        // Also update local list so tabs reflect updated scores immediately
        if (activeReport.itemType === "certification") {
          setLocalData((prev) => ({
            ...prev,
            certAttempts: prev.certAttempts.map((c) =>
              c._id === activeReport.id
                ? { ...c, percentage: numVal, score: numVal, status: editStatusValue, adminNote: editAdminNote }
                : c
            ),
          }));
        } else if (activeReport.itemType === "module") {
          setLocalData((prev) => ({
            ...prev,
            moduleAttempts: prev.moduleAttempts.map((m) =>
              m._id === activeReport.id
                ? { ...m, score: numVal, status: editStatusValue, adminNote: editAdminNote }
                : m
            ),
          }));
        } else if (activeReport.itemType === "coding") {
          setLocalData((prev) => ({
            ...prev,
            submissions: prev.submissions.map((s) =>
              s._id === activeReport.id
                ? { ...s, score: numVal, status: editStatusValue, adminNote: editAdminNote }
                : s
            ),
          }));
        }

        setIsEditingMarks(false);
      } else {
        toast.error(json.message || "Failed to update marks");
      }
    } catch (err) {
      console.error("Modify marks error:", err);
      toast.error("Error communicating with server to modify marks");
    } finally {
      setSavingMarks(false);
    }
  };

  return (
    <div className="mz-admin-modal-overlay">
      <div
        className="mz-admin-modal-card"
        style={{
          maxWidth: 960,
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        {/* ────────────────── 1. MODAL HEADER & ACTIONS ────────────────── */}
        <div className="mz-admin-user-modal-header">
          {/* Pinned Top-Right Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="mz-admin-modal-close-btn"
            title="Close Profile (Esc)"
          >
            <LuX style={{ width: 18, height: 18 }} />
          </button>

          {/* User Identity Top Row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, paddingRight: 44 }}>
            {/* Clickable Profile Avatar with Lightbox Preview */}
            <div
              className="mz-admin-photo-trigger"
              onClick={() => setShowPhotoModal(true)}
              title="Click to inspect full photo"
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                color: "#ffffff",
                fontSize: 24,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.25)",
                overflow: "hidden",
                flexShrink: 0,
                border: "2px solid var(--mz-surface)",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initial
              )}
              <div className="mz-admin-photo-hover-overlay">
                <LuZoomIn />
              </div>
            </div>

            {/* Name, Badges & Metadata */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--mz-text-primary)", letterSpacing: "-0.01em" }}>
                  {displayName}
                </h2>

                {/* Status Badge */}
                <span className={user.isSuspended ? "mz-admin-badge-suspended" : "mz-admin-badge-active"}>
                  {user.isSuspended ? "Suspended" : "Active"}
                </span>

                {/* Role Badge */}
                <span className={roleBadge.className} style={{ textTransform: "capitalize", fontSize: 11, fontWeight: 700 }}>
                  {roleBadge.label}
                </span>

                {/* Auth Provider Badge */}
                <span className="mz-admin-badge-blue" style={{ fontSize: 10.5 }}>
                  {user.authProvider === "google" ? "Google OAuth" : "Email & Password"}
                </span>

                {/* Verification Status */}
                {user.isEmailVerified ? (
                  <span className="mz-admin-badge-green" style={{ fontSize: 10.5 }}>
                    <LuCircleCheck style={{ width: 12, height: 12 }} />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="mz-admin-badge-amber" style={{ fontSize: 10.5 }}>
                    <LuTriangleAlert style={{ width: 12, height: 12 }} />
                    <span>Unverified</span>
                  </span>
                )}
              </div>

              {/* Subtitle Details: Email, Username, ID, Joined */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 12.5, color: "var(--mz-text-muted)" }}>
                {/* Email with copy */}
                <span
                  onClick={() => handleCopy(user.email, "email")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", color: "var(--mz-text-primary)", fontWeight: 600 }}
                  title="Click to copy email address"
                >
                  <LuMail style={{ width: 14, height: 14, color: "#6366f1" }} />
                  <span>{user.email}</span>
                  {copiedKey === "email" ? (
                    <LuCheck style={{ width: 13, height: 13, color: "#10b981" }} />
                  ) : (
                    <LuCopy style={{ width: 12, height: 12, color: "var(--mz-text-subtle)" }} />
                  )}
                </span>

                <span style={{ color: "var(--mz-border)" }}>|</span>

                {/* Username */}
                <span style={{ fontWeight: 600, color: "var(--mz-text-secondary)" }}>
                  @{user.username}
                </span>

                <span style={{ color: "var(--mz-border)" }}>|</span>

                {/* User ID with copy */}
                <span
                  onClick={() => handleCopy(user._id, "id")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 11.5, color: "var(--mz-text-subtle)" }}
                  title="Click to copy User ID"
                >
                  <span>ID: {user._id ? `${String(user._id).substring(0, 8)}...` : "N/A"}</span>
                  {copiedKey === "id" ? (
                    <LuCheck style={{ width: 12, height: 12, color: "#10b981" }} />
                  ) : (
                    <LuCopy style={{ width: 11, height: 11 }} />
                  )}
                </span>

                <span style={{ color: "var(--mz-border)" }}>|</span>

                {/* Joined Date */}
                <span style={{ fontSize: 12, color: "var(--mz-text-subtle)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <LuCalendar style={{ width: 13, height: 13 }} />
                  <span>Joined {formatFullDate(user.createdAt)} ({formatRelativeTime(user.createdAt)})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 4, borderTop: "1px solid var(--mz-border-subtle)" }}>
            {/* Quick Role Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--mz-text-subtle)", textTransform: "uppercase" }}>
                Role Level:
              </span>
              <select
                className="mz-admin-role-select"
                value={user.role || "student"}
                onChange={(e) => onRoleChange && onRoleChange(user._id, e.target.value)}
                disabled={user.role === "SUPER_ADMIN"}
                title={user.role === "SUPER_ADMIN" ? "Super Admin role is locked" : "Change user account role"}
              >
                <option value="user">Student (Default)</option>
                <option value="student">Student / Learner</option>
                <option value="mentor">Platform Mentor</option>
                <option value="instructor">Course Instructor</option>
                <option value="admin">Administrator</option>
                {user.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Super Admin</option>}
              </select>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {user.role !== "SUPER_ADMIN" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const temp = window.prompt(
                        `Enter temporary password for ${user.email} (or leave blank to dispatch reset email):`,
                        ""
                      );
                      if (temp === null) return;
                      onResetPassword && onResetPassword(user._id, temp.trim() || null);
                    }}
                    className="mz-admin-btn-action"
                    title="Send password reset email or assign temporary password"
                  >
                    <LuKey style={{ width: 14, height: 14 }} />
                    <span>Reset Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(user._id, !user.isSuspended)}
                    className={user.isSuspended ? "mz-admin-btn-restore" : "mz-admin-btn-suspend"}
                  >
                    {user.isSuspended ? (
                      <>
                        <LuShieldCheck style={{ width: 14, height: 14 }} />
                        <span>Restore Account</span>
                      </>
                    ) : (
                      <>
                        <LuShieldAlert style={{ width: 14, height: 14 }} />
                        <span>Suspend Account</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteUser && onDeleteUser(user._id, user.email)}
                    className="mz-admin-btn-suspend"
                    style={{ background: "rgba(239, 68, 68, 0.08)", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
                    title="Permanently Delete Account"
                  >
                    <LuTrash2 style={{ width: 14, height: 14 }} />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ────────────────── 2. QUICK STATS ROW (6 BALANCED METRICS) ────────────────── */}
        <div className="mz-admin-quick-stats-bar">
          <div className="mz-admin-quick-stat-box">
            <span className="mz-admin-quick-stat-label">
              <LuFlame style={{ width: 13, height: 13, color: "#f97316" }} />
              Active Streak
            </span>
            <span className="mz-admin-quick-stat-value">
              {currentStreak} {currentStreak === 1 ? "Day" : "Days"}
            </span>
            <span className="mz-admin-quick-stat-sub">
              {currentStreak > 0 ? "Currently consistent" : "No active streak"}
            </span>
          </div>

          <div className="mz-admin-quick-stat-box">
            <span className="mz-admin-quick-stat-label">
              <LuSparkles style={{ width: 13, height: 13, color: "#eab308" }} />
              Longest Streak
            </span>
            <span className="mz-admin-quick-stat-value">
              {longestStreak} {longestStreak === 1 ? "Day" : "Days"}
            </span>
            <span className="mz-admin-quick-stat-sub">All-time record</span>
          </div>

          <div className="mz-admin-quick-stat-box">
            <span className="mz-admin-quick-stat-label">
              <LuCode style={{ width: 13, height: 13, color: "#6366f1" }} />
              Submissions
            </span>
            <span className="mz-admin-quick-stat-value">
              {totalSubmissionsCount}
            </span>
            <span className="mz-admin-quick-stat-sub">Code executions</span>
          </div>

          <div className="mz-admin-quick-stat-box">
            <span className="mz-admin-quick-stat-label">
              <LuCircleCheck style={{ width: 13, height: 13, color: "#10b981" }} />
              Solved
            </span>
            <span className="mz-admin-quick-stat-value">
              {totalSolvedCount}
            </span>
            <span className="mz-admin-quick-stat-sub">Challenges completed</span>
          </div>

          <div className="mz-admin-quick-stat-box">
            <span className="mz-admin-quick-stat-label">
              <LuAward style={{ width: 13, height: 13, color: "#f59e0b" }} />
              Certifications
            </span>
            <span className="mz-admin-quick-stat-value">
              {certificates.length}
            </span>
            <span className="mz-admin-quick-stat-sub">Credentials earned</span>
          </div>

          <div className="mz-admin-quick-stat-box">
            <span className="mz-admin-quick-stat-label">
              <LuFileText style={{ width: 13, height: 13, color: "#8b5cf6" }} />
              Assessments
            </span>
            <span className="mz-admin-quick-stat-value">
              {totalAssessments}
            </span>
            <span className="mz-admin-quick-stat-sub">
              {totalAssessments > 0 ? `${passRate}% pass rate` : "No attempts yet"}
            </span>
          </div>
        </div>

        {/* ────────────────── 3. TABS NAVIGATION ────────────────── */}
        <div
          style={{
            padding: "0 24px",
            display: "flex",
            gap: 20,
            borderBottom: "1px solid var(--mz-border)",
            background: "var(--mz-surface)",
            overflowX: "auto",
          }}
        >
          {[
            { id: "profile", label: "Profile & Account", icon: <LuUser size={14} /> },
            { id: "activity", label: "Streak & Heatmap 🔥", icon: <LuFlame size={14} /> },
            { id: "timeline", label: `Timeline (${timeline.length})`, icon: <LuHistory size={14} /> },
            { id: "submissions", label: `Submissions (${submissions.length})`, icon: <LuCode size={14} /> },
            { id: "assessments", label: `Assessments (${totalAssessments})`, icon: <LuAward size={14} /> },
            { id: "projects", label: `Projects (${projects.length})`, icon: <LuFileText size={14} /> },
            { id: "devices", label: `Devices (${user.knownDevices?.length || 1})`, icon: <LuShieldCheck size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: "none",
                background: "transparent",
                padding: "12px 4px",
                borderBottom: activeTab === tab.id ? "2.5px solid #6366f1" : "2.5px solid transparent",
                color: activeTab === tab.id ? "#6366f1" : "var(--mz-text-muted)",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ────────────────── 4. TAB CONTENT AREA ────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* TAB 1: PROFILE & ACCOUNT DETAILS */}
          {activeTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Card 1: Student Information & Contact Details */}
              <div className="mz-admin-detail-card">
                <div className="mz-admin-detail-card-header">
                  <h4 className="mz-admin-detail-card-title">
                    <LuUser style={{ width: 16, height: 16, color: "#6366f1" }} />
                    <span>Personal Information & Contact</span>
                  </h4>
                  <span style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>Primary Identity</span>
                </div>

                <div className="mz-admin-detail-field-grid">
                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Full Name</span>
                    <span className="mz-admin-detail-field-val">
                      {user.fullName ? (
                        user.fullName
                      ) : (
                        <span className="mz-admin-empty-pill">Not configured</span>
                      )}
                    </span>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Username</span>
                    <span className="mz-admin-detail-field-val">
                      @{user.username || "student"}
                    </span>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Email Address</span>
                    <span className="mz-admin-detail-field-val">
                      <LuMail style={{ width: 14, height: 14, color: "#6366f1" }} />
                      <span>{user.email}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(user.email, "email_field")}
                        style={{ border: "none", background: "transparent", cursor: "pointer", padding: "0 2px", color: "var(--mz-text-subtle)" }}
                        title="Copy email"
                      >
                        {copiedKey === "email_field" ? <LuCheck size={12} color="#10b981" /> : <LuCopy size={12} />}
                      </button>
                    </span>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Phone Number</span>
                    <span className="mz-admin-detail-field-val">
                      <LuPhone style={{ width: 14, height: 14, color: "#10b981" }} />
                      {user.phoneNumber && user.phoneNumber !== "Not Provided" ? (
                        user.phoneNumber
                      ) : (
                        <span className="mz-admin-empty-pill">Not configured</span>
                      )}
                    </span>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Location / Region</span>
                    <span className="mz-admin-detail-field-val">
                      <LuMapPin style={{ width: 14, height: 14, color: "#f97316" }} />
                      {user.location && user.location !== "Not Provided" ? (
                        user.location
                      ) : (
                        <span className="mz-admin-empty-pill">Not configured</span>
                      )}
                    </span>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Occupation / Title</span>
                    <span className="mz-admin-detail-field-val">
                      <LuBriefcase style={{ width: 14, height: 14, color: "#8b5cf6" }} />
                      {user.occupation && user.occupation !== "Not Provided" ? (
                        user.occupation
                      ) : (
                        <span className="mz-admin-empty-pill">Learner / Student</span>
                      )}
                    </span>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Registered Date</span>
                    <span className="mz-admin-detail-field-val">
                      <LuCalendar style={{ width: 14, height: 14, color: "var(--mz-text-muted)" }} />
                      <span>{formatFullDate(user.createdAt)}</span>
                      <small style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>({formatRelativeTime(user.createdAt)})</small>
                    </span>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Last Active Timestamp</span>
                    <span className="mz-admin-detail-field-val">
                      <LuClock style={{ width: 14, height: 14, color: "var(--mz-text-muted)" }} />
                      <span>{new Date(user.lastActiveDate || user.createdAt).toLocaleString()}</span>
                      <small style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>({formatRelativeTime(user.lastActiveDate || user.createdAt)})</small>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Account Standing, Security & Role Access */}
              <div className="mz-admin-detail-card">
                <div className="mz-admin-detail-card-header">
                  <h4 className="mz-admin-detail-card-title">
                    <LuShieldCheck style={{ width: 16, height: 16, color: "#10b981" }} />
                    <span>Security, Standing & Access Level</span>
                  </h4>
                  <span style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>Access Credentials</span>
                </div>

                <div className="mz-admin-detail-field-grid">
                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Account Standing</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <span className={user.isSuspended ? "mz-admin-badge-suspended" : "mz-admin-badge-active"}>
                        {user.isSuspended ? "Suspended" : "Active & In Good Standing"}
                      </span>
                      {user.suspendedReason && (
                        <span style={{ fontSize: 11, color: "#ef4444" }}>
                          (Reason: {user.suspendedReason})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Assigned Role</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <span className={roleBadge.className}>
                        {roleBadge.label}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>
                        {user.role === "SUPER_ADMIN" ? "All Platform Powers" : user.role === "admin" ? "Administrative Access" : "Standard Student Rights"}
                      </span>
                    </div>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Authentication Method</span>
                    <span className="mz-admin-detail-field-val">
                      <LuKey style={{ width: 14, height: 14, color: "#6366f1" }} />
                      <span>{user.authProvider === "google" ? "Google OAuth 2.0 Single Sign-On" : "Email & Salted BCrypt Password"}</span>
                    </span>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Email Verification</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      {user.isEmailVerified ? (
                        <span className="mz-admin-badge-green">
                          <LuCircleCheck size={12} />
                          <span>Email Verified</span>
                        </span>
                      ) : (
                        <span className="mz-admin-badge-amber">
                          <LuTriangleAlert size={12} />
                          <span>Pending Verification</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Last Known Login Device</span>
                    <span className="mz-admin-detail-field-val">
                      <LuSmartphone style={{ width: 14, height: 14, color: "var(--mz-text-muted)" }} />
                      <span>{user.lastLoginDevice || "Desktop Browser"}</span>
                    </span>
                  </div>

                  <div className="mz-admin-detail-field">
                    <span className="mz-admin-detail-field-label">Last Known IP Address</span>
                    <span className="mz-admin-detail-field-val">
                      <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>
                        {user.lastLoginIp || "127.0.0.1 (Local / Trusted)"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Learning Tracks, Interests & Performance */}
              <div className="mz-admin-detail-card">
                <div className="mz-admin-detail-card-header">
                  <h4 className="mz-admin-detail-card-title">
                    <LuSparkles style={{ width: 16, height: 16, color: "#eab308" }} />
                    <span>Learning Progress & Academic Standing</span>
                  </h4>
                  <span style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>Platform Analytics</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <span className="mz-admin-detail-field-label" style={{ display: "block", marginBottom: 6 }}>
                      Explored Learning Tracks
                    </span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {user.exploredTracks && user.exploredTracks.length > 0 ? (
                        user.exploredTracks.map((tr, i) => (
                          <span
                            key={i}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              background: "var(--mz-green-bg)",
                              color: "#059669",
                              fontSize: 12,
                              fontWeight: 700,
                              border: "1px solid var(--mz-green-border)",
                            }}
                          >
                            ✓ {tr}
                          </span>
                        ))
                      ) : (
                        <span className="mz-admin-empty-pill">General Software Engineering Track</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="mz-admin-detail-field-label" style={{ display: "block", marginBottom: 6 }}>
                      Selected Learning Interests
                    </span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {user.interests && user.interests.length > 0 && user.interests[0] !== "Not Provided" ? (
                        user.interests.map((it, i) => (
                          <span
                            key={i}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              background: "var(--mz-blue-bg)",
                              color: "#2563eb",
                              fontSize: 12,
                              fontWeight: 700,
                              border: "1px solid var(--mz-blue-border)",
                            }}
                          >
                            #{it}
                          </span>
                        ))
                      ) : (
                        <span className="mz-admin-empty-pill">General Coding, Algorithms & Data Structures</span>
                      )}
                    </div>
                  </div>

                  <div className="mz-admin-detail-field-grid" style={{ paddingTop: 6, borderTop: "1px solid var(--mz-border-subtle)" }}>
                    <div className="mz-admin-detail-field">
                      <span className="mz-admin-detail-field-label">Learning Hours Logged</span>
                      <span className="mz-admin-detail-field-val">
                        ⏱️ {user.learningHours || 0} Hours logged
                      </span>
                    </div>

                    <div className="mz-admin-detail-field">
                      <span className="mz-admin-detail-field-label">Assessment Success Rate</span>
                      <span className="mz-admin-detail-field-val">
                        📊 {passRate}% ({totalPassed} of {totalAssessments} passed)
                      </span>
                    </div>

                    <div className="mz-admin-detail-field">
                      <span className="mz-admin-detail-field-label">Proctored Sessions</span>
                      <span className="mz-admin-detail-field-val">
                        🛡️ {proctoredSessions.length} sessions recorded
                      </span>
                    </div>

                    <div className="mz-admin-detail-field">
                      <span className="mz-admin-detail-field-label">Integrity & Violations</span>
                      <span className="mz-admin-detail-field-val">
                        {totalViolations === 0 ? (
                          <span style={{ color: "#10b981", fontWeight: 700 }}>✅ 0 Violations (Clean Audit)</span>
                        ) : (
                          <span style={{ color: "#ef4444", fontWeight: 700 }}>⚠️ {totalViolations} Violations Flagged</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Biography & Profile Statement */}
              <div className="mz-admin-detail-card">
                <div className="mz-admin-detail-card-header">
                  <h4 className="mz-admin-detail-card-title">
                    <LuFileText style={{ width: 16, height: 16, color: "#8b5cf6" }} />
                    <span>Biography & Student Statement</span>
                  </h4>
                </div>

                {user.bio && user.bio !== "Not Provided" ? (
                  <p style={{ margin: 0, fontSize: 13.5, color: "var(--mz-text-secondary)", lineHeight: 1.6 }}>
                    &ldquo;{user.bio}&rdquo;
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--mz-text-subtle)", fontStyle: "italic" }}>
                    No personal biography provided yet. The student has not customized their bio statement.
                  </p>
                )}
              </div>

              {/* Card 5: Student Activity Streak Calendar & Heatmap Preview */}
              <div style={{ marginTop: 2 }}>
                <LeetCodeActivityCalendar
                  userId={user._id || user.id}
                  initialData={userDetail.activityStats}
                  compact={true}
                />
              </div>
            </div>
          )}

          {/* TAB: DAILY ACTIVITY STREAK CALENDAR & HEATMAP */}
          {activeTab === "activity" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <LeetCodeActivityCalendar
                userId={user._id || user.id}
                initialData={userDetail.activityStats}
                compact={false}
              />
            </div>
          )}

          {/* TAB 2: TIMELINE WITH ATTACHED REPORT ACCESS */}
          {activeTab === "timeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {timeline.length === 0 ? (
                <p style={{ margin: 0, color: "var(--mz-text-subtle)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
                  No recorded activity yet for this account.
                </p>
              ) : (
                timeline.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 14,
                      border: "1px solid var(--mz-border)",
                      background: "var(--mz-surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--mz-text-primary)", fontSize: 13.5 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "var(--mz-text-muted)", marginTop: 2 }}>{item.description}</div>
                      <span style={{ fontSize: 11, color: "var(--mz-text-subtle)", display: "block", marginTop: 4 }}>
                        {new Date(item.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>

                    {/* Attached Report Button for Attempt/Submission events */}
                    {(item.itemType || item.rawId) && (
                      <button
                        onClick={() => handleOpenReport(item.itemType || "coding", item.rawId || item._id, item.reportData || item)}
                        className="mz-admin-btn-report"
                      >
                        <LuFileText style={{ width: 14, height: 14 }} />
                        <span>View Report</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: SUBMISSIONS WITH ATTACHED REPORT ACCESS & CODE INSPECTOR */}
          {activeTab === "submissions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {submissions.length === 0 ? (
                <p style={{ margin: 0, color: "var(--mz-text-subtle)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
                  No coding submissions recorded.
                </p>
              ) : (
                submissions.map((s) => (
                  <div
                    key={s._id}
                    style={{ padding: "16px 18px", borderRadius: 14, border: "1px solid var(--mz-border)", background: "var(--mz-surface)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: "var(--mz-text-primary)", fontSize: 14.5 }}>
                          {s.challengeTitle || s.challengeId}
                        </span>
                        <span className="mz-admin-badge-purple" style={{ textTransform: "uppercase" }}>
                          {s.language}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={s.status === "ACCEPTED" ? "mz-admin-pill-pass" : "mz-admin-pill-fail"}>
                          {s.status}
                        </span>
                        {/* Attached User Report Button */}
                        <button
                          onClick={() => handleOpenReport("coding", s._id, s)}
                          className="mz-admin-btn-report"
                        >
                          <LuFileText style={{ width: 14, height: 14 }} />
                          <span>View Report</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--mz-text-muted)" }}>
                      <span>Tests Passed: <strong>{s.passedTests}/{s.totalTests}</strong></span>
                      <span>•</span>
                      <span>Runtime: {s.runtimeMs || 0}ms</span>
                      <span>•</span>
                      <span>{new Date(s.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                      {s.adminNote && (
                        <>
                          <span>•</span>
                          <span style={{ color: "#d97706", fontWeight: 600 }}>Note: {s.adminNote}</span>
                        </>
                      )}
                    </div>

                    {/* Source Code View */}
                    {s.code && (
                      <div style={{ marginTop: 10 }}>
                        <button
                          onClick={() => setSelectedSubmission(selectedSubmission === s._id ? null : s._id)}
                          style={{ border: "none", background: "transparent", color: "#6366f1", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
                        >
                          {selectedSubmission === s._id ? "Hide Source Code ▲" : "View Source Code ▼"}
                        </button>
                        {selectedSubmission === s._id && (
                          <div className="mz-admin-code-snippet" style={{ marginTop: 8, maxHeight: 180 }}>
                            <pre style={{ margin: 0, fontFamily: "monospace" }}>
                              <code>{s.code}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: ASSESSMENTS & CERTIFICATIONS WITH ATTACHED REPORT ACCESS */}
          {activeTab === "assessments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <h4 style={{ margin: "4px 0 10px", fontSize: 13.5, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                  Certification Exam Attempts
                </h4>
                {certAttempts.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--mz-text-subtle)" }}>No certification exam attempts.</p>
                ) : (
                  certAttempts.map((c) => (
                    <div
                      key={c._id}
                      style={{
                        padding: "14px 18px",
                        borderRadius: 14,
                        border: "1px solid var(--mz-border)",
                        background: "var(--mz-surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--mz-text-primary)" }}>{c.certTitle}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-muted)" }}>
                          Score: <strong>{c.percentage}%</strong> • Attempt #{c.attemptNumber} • {new Date(c.submittedAt || c.createdAt).toLocaleDateString()}
                        </p>
                        {c.adminNote && (
                          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#d97706", fontWeight: 600 }}>
                            Admin Note: {c.adminNote}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={c.status === "PASSED" ? "mz-admin-pill-pass" : "mz-admin-pill-fail"}>
                          {c.status}
                        </span>
                        {/* Attached Report Button */}
                        <button
                          onClick={() => handleOpenReport("certification", c._id, c)}
                          className="mz-admin-btn-report"
                        >
                          <LuFileText style={{ width: 14, height: 14 }} />
                          <span>View Report</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div>
                <h4 style={{ margin: "14px 0 10px", fontSize: 13.5, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                  Module MCQ Tests
                </h4>
                {moduleAttempts.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--mz-text-subtle)" }}>No MCQ tests taken.</p>
                ) : (
                  moduleAttempts.map((m) => (
                    <div
                      key={m._id}
                      style={{
                        padding: "14px 18px",
                        borderRadius: 14,
                        border: "1px solid var(--mz-border)",
                        background: "var(--mz-surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--mz-text-primary)" }}>
                          {m.assessmentTitle || m.moduleTitle}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-muted)" }}>
                          Score: <strong>{m.score} / {m.totalQuestions}</strong> ({m.percentage}%) • {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                        {m.adminNote && (
                          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#d97706", fontWeight: 600 }}>
                            Admin Note: {m.adminNote}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={m.passed ? "mz-admin-pill-pass" : "mz-admin-pill-fail"}>
                          {m.passed ? "Passed" : "Failed"}
                        </span>
                        {/* Attached Report Button */}
                        <button
                          onClick={() => handleOpenReport("module", m._id, m)}
                          className="mz-admin-btn-report"
                        >
                          <LuFileText style={{ width: 14, height: 14 }} />
                          <span>View Report</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PRACTICAL PROJECTS */}
          {activeTab === "projects" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {projects.length === 0 ? (
                <p style={{ margin: 0, color: "var(--mz-text-subtle)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
                  No practical project submissions recorded yet.
                </p>
              ) : (
                projects.map((p) => {
                  const scoreVal = p.marksObtained != null ? p.marksObtained : 0;
                  const total = p.totalMarks || 100;
                  const pct = p.percentage != null ? p.percentage : Math.round((scoreVal / total) * 100);
                  return (
                    <div
                      key={p._id}
                      style={{
                        padding: "16px 18px",
                        borderRadius: 14,
                        border: "1px solid var(--mz-border)",
                        background: "var(--mz-surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--mz-text-primary)", fontSize: 14 }}>
                          {p.projectTitle || "Practical Project Submission"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--mz-text-muted)", marginTop: 2 }}>
                          Score: <strong>{scoreVal} / {total}</strong> ({pct}%) • Submitted {new Date(p.submittedAt || p.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={pct >= 70 ? "mz-admin-pill-pass" : "mz-admin-pill-fail"}>
                          {p.status || (pct >= 70 ? "PASSED" : "NEEDS_IMPROVEMENT")}
                        </span>
                        <button
                          onClick={() => handleOpenReport("project", p._id, p)}
                          className="mz-admin-btn-report"
                        >
                          <LuFileText style={{ width: 14, height: 14 }} />
                          <span>View Report</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 6: DEVICES & SECURITY */}
          {activeTab === "devices" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(user.knownDevices && user.knownDevices.length > 0) ? (
                user.knownDevices.map((dev, idx) => (
                  <div key={idx} style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid var(--mz-border)", background: "var(--mz-surface)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="mz-admin-stat-icon" style={{ background: "var(--mz-surface-muted)", color: "var(--mz-text-secondary)" }}>
                        <LuSmartphone style={{ width: 18, height: 18 }} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "var(--mz-text-primary)" }}>{dev.deviceString || dev.browser || "Web Browser"}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-subtle)" }}>
                          IP: {dev.ip || "Unknown"} • OS: {dev.os || "Desktop OS"}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--mz-text-muted)" }}>
                      Last Seen: {dev.lastSeenAt ? new Date(dev.lastSeenAt).toLocaleDateString() : "Active"}
                    </span>
                  </div>
                ))
              ) : (user.lastLoginDevice || user.lastLoginIp) ? (
                <div style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid var(--mz-border)", background: "var(--mz-surface)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="mz-admin-stat-icon" style={{ background: "var(--mz-surface-muted)", color: "var(--mz-text-secondary)" }}>
                      <LuSmartphone style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "var(--mz-text-primary)" }}>{user.lastLoginDevice || "Desktop / Browser"}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-subtle)" }}>IP: {user.lastLoginIp || "N/A"}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--mz-text-muted)" }}>
                    Last Seen: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Active"}
                  </span>
                </div>
              ) : (
                <p style={{ margin: 0, color: "var(--mz-text-subtle)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
                  No registered login devices recorded yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ────────────────── 5. FULL VIEW PROFILE PHOTO LIGHTBOX ────────────────── */}
      {showPhotoModal && (
        <div className="mz-admin-lightbox-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="mz-admin-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div>
                <h4 style={{ margin: 0, color: "#ffffff", fontSize: 15, fontWeight: 700 }}>Profile Photo Full View</h4>
                <p style={{ margin: "2px 0 0", color: "var(--mz-text-subtle)", fontSize: 12 }}>{displayName} • {user.email}</p>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                style={{ background: "transparent", border: "none", color: "#ffffff", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, background: "#020617" }}>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  style={{ maxWidth: "100%", maxHeight: 420, borderRadius: 14, objectFit: "contain", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
                />
              ) : (
                <div
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: 72,
                    fontWeight: 900,
                    boxShadow: "0 12px 30px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  {initial}
                </div>
              )}
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f172a" }}>
              <span style={{ fontSize: 12, color: "var(--mz-text-subtle)" }}>
                {user.avatarUrl ? "Original student profile upload" : "Default generated profile avatar"}
              </span>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="mz-admin-btn-secondary"
                style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 12 }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── 6. ATTACHED ASSESSMENT / SUBMISSION REPORT MODAL WITH ADMIN MARKS MODIFICATION ────────────────── */}
      {activeReport && (
        <div className="mz-admin-modal-overlay" style={{ zIndex: 99999 }}>
          <div
            className="mz-admin-modal-card"
            style={{
              maxWidth: 920,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Report Header */}
            <div
              className="mz-admin-modal-header"
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid var(--mz-border)",
                background: "var(--mz-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="mz-admin-stat-icon" style={{ background: "var(--mz-purple-bg)", color: "#6366f1" }}>
                  <LuFileText style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                      Candidate Assessment Report
                    </h3>
                    <span className="mz-admin-badge-purple" style={{ textTransform: "uppercase", fontSize: 11 }}>
                      {activeReport.itemType}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-muted)" }}>
                    {activeReport.title} • Candidate: <strong>{activeReport.candidateName || displayName}</strong> ({activeReport.candidateEmail || user.email})
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {activeReport.reportUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(activeReport.reportUrl, "_blank", "noopener,noreferrer")}
                    className="mz-admin-btn-action"
                    style={{
                      background: "var(--mz-blue-bg)",
                      border: "1px solid var(--mz-blue-border)",
                      color: "#1d4ed8",
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                    title="Open accredited fullscreen student-facing report"
                  >
                    <LuExternalLink style={{ width: 13, height: 13 }} />
                    <span>Open Official Report</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveReport(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 20,
                    color: "var(--mz-text-subtle)",
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Navigation Sub-Tabs */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 24px",
                background: "var(--mz-surface-subtle)",
                borderBottom: "1px solid var(--mz-border)",
              }}
            >
              <button
                type="button"
                onClick={() => setReportSubTab("questions")}
                className={`mz-admin-subtab ${reportSubTab === "questions" ? "active" : ""}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: reportSubTab === "questions" ? "1px solid #6366f1" : "1px solid transparent",
                  background: reportSubTab === "questions" ? "var(--mz-purple-bg)" : "transparent",
                  color: reportSubTab === "questions" ? "#4f46e5" : "var(--mz-text-muted)",
                }}
              >
                📋 Question Breakdown & Source Code
              </button>

              <button
                type="button"
                onClick={() => setReportSubTab("evaluation")}
                className={`mz-admin-subtab ${reportSubTab === "evaluation" ? "active" : ""}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: reportSubTab === "evaluation" ? "1px solid #6366f1" : "1px solid transparent",
                  background: reportSubTab === "evaluation" ? "var(--mz-purple-bg)" : "transparent",
                  color: reportSubTab === "evaluation" ? "#4f46e5" : "var(--mz-text-muted)",
                }}
              >
                ✏️ Marks & Admin Feedback {activeReport.adminNote && "•"}
              </button>

              <button
                type="button"
                onClick={() => setReportSubTab("audit")}
                className={`mz-admin-subtab ${reportSubTab === "audit" ? "active" : ""}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: reportSubTab === "audit" ? "1px solid #6366f1" : "1px solid transparent",
                  background: reportSubTab === "audit" ? "var(--mz-purple-bg)" : "transparent",
                  color: reportSubTab === "audit" ? "#4f46e5" : "var(--mz-text-muted)",
                }}
              >
                🛡️ Proctoring & Notification Tracking
              </button>
            </div>

            {/* Report Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Scorecard Hero Banner */}
              <div
                style={{
                  background:
                    activeReport.status === "PASSED" ||
                    activeReport.status === "Passed" ||
                    activeReport.status === "ACCEPTED"
                      ? "linear-gradient(135deg, var(--mz-green-bg) 0%, var(--mz-green-bg) 100%)"
                      : "linear-gradient(135deg, var(--mz-red-bg) 0%, var(--mz-red-bg) 100%)",
                  border:
                    activeReport.status === "PASSED" ||
                    activeReport.status === "Passed" ||
                    activeReport.status === "ACCEPTED"
                      ? "1px solid var(--mz-green-border)"
                      : "1px solid var(--mz-red-border)",
                  borderRadius: 16,
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 14,
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mz-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    OFFICIAL ATTEMPT VERDICT
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "var(--mz-text-primary)" }}>
                      {activeReport.score != null ? activeReport.score : activeReport.percentage}
                      <span style={{ fontSize: 16, color: "var(--mz-text-muted)", fontWeight: 700 }}>
                        {activeReport.maxScore ? ` / ${activeReport.maxScore}` : "%"}
                      </span>
                    </h2>
                    <span
                      className={
                        activeReport.status === "PASSED" ||
                        activeReport.status === "Passed" ||
                        activeReport.status === "ACCEPTED"
                          ? "mz-admin-pill-pass"
                          : "mz-admin-pill-fail"
                      }
                      style={{ fontSize: 13, padding: "5px 12px" }}
                    >
                      {activeReport.status}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--mz-text-muted)" }}>
                    Completed: {new Date(activeReport.date || Date.now()).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>

                {/* Edit Marks Button Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setReportSubTab("evaluation");
                    setIsEditingMarks(true);
                  }}
                  className="mz-admin-btn-action"
                  style={{
                    background: "var(--mz-surface)",
                    border: "1px solid var(--mz-border-strong)",
                    padding: "8px 16px",
                    fontWeight: 700,
                  }}
                >
                  <LuPencil style={{ width: 14, height: 14, color: "#6366f1" }} />
                  <span>Modify Marks & Remarks</span>
                </button>
              </div>

              {/* ────────────────── SUB-TAB 1: QUESTIONS & SOURCE CODE ────────────────── */}
              {reportSubTab === "questions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Detailed Performance Metrics */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 12,
                    }}
                  >
                    <div style={{ padding: 12, background: "var(--mz-surface-subtle)", borderRadius: 10, border: "1px solid var(--mz-border)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mz-text-subtle)" }}>ACCURACY / GRADE</span>
                      <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                        {activeReport.percentage != null ? `${activeReport.percentage}%` : "N/A"} ({activeReport.grade || "Standard"})
                      </p>
                    </div>

                    <div style={{ padding: 12, background: "var(--mz-surface-subtle)", borderRadius: 10, border: "1px solid var(--mz-border)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mz-text-subtle)" }}>DURATION / TIME</span>
                      <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                        {activeReport.durationMinutes ? `${activeReport.durationMinutes} mins` : activeReport.timeSpentSeconds ? `${Math.round(activeReport.timeSpentSeconds / 60)} mins` : `${activeReport.runtimeMs || 12} ms`}
                      </p>
                    </div>

                    <div style={{ padding: 12, background: "var(--mz-surface-subtle)", borderRadius: 10, border: "1px solid var(--mz-border)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mz-text-subtle)" }}>PROCTORING INTEGRITY</span>
                      <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 800, color: activeReport.proctoring?.violationsCount > 0 ? "#dc2626" : "#059669" }}>
                        {activeReport.proctoring?.violationsCount > 0 ? `⚠️ ${activeReport.proctoring.violationsCount} Violations` : "✓ 100% Compliant"}
                      </p>
                    </div>
                  </div>

                  {/* 1A. MCQ QUESTION-BY-QUESTION BREAKDOWN (Module & Certification Part A) */}
                  {((activeReport.reviewBreakdown && activeReport.reviewBreakdown.length > 0) ||
                    (activeReport.selectedMcqs && activeReport.selectedMcqs.length > 0)) && (() => {
                    const rawList = (activeReport.reviewBreakdown && activeReport.reviewBreakdown.length > 0)
                      ? activeReport.reviewBreakdown
                      : activeReport.selectedMcqs.map((q, idx) => {
                          const ansMap = activeReport.mcqAnswers;
                          const sel = ansMap instanceof Map ? ansMap.get(String(q.id)) : (ansMap ? ansMap[q.id] : undefined);
                          const isUnanswered = sel === undefined || sel === null || sel === -1;
                          const isCorr = !isUnanswered && Number(sel) === Number(q.correctAnswer);
                          return {
                            id: q.id || `q_${idx + 1}`,
                            questionIndex: idx,
                            question: q.question,
                            options: q.options || [],
                            userSelected: isUnanswered ? null : Number(sel),
                            correctIndex: Number(q.correctAnswer),
                            isCorrect: isCorr,
                            topic: q.topic || "DSA",
                            explanation: q.explanation || "Fundamental concept test.",
                          };
                        });

                    const filteredList = rawList.filter((item) => {
                      if (mcqFilter === "correct") return item.isCorrect;
                      if (mcqFilter === "incorrect") return !item.isCorrect && item.userSelected !== null;
                      if (mcqFilter === "unanswered") return item.userSelected === null;
                      return true;
                    });

                    const totalCount = rawList.length;
                    const correctCount = rawList.filter((r) => r.isCorrect).length;
                    const unansCount = rawList.filter((r) => r.userSelected === null).length;
                    const incorrectCount = totalCount - correctCount - unansCount;

                    return (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                              MCQ Examination Questions & Candidate Responses ({totalCount} Questions)
                            </h4>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-muted)" }}>
                              Every question audited with candidate's submitted answer and verified answer key.
                            </p>
                          </div>

                          {/* Filter Pills */}
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => setMcqFilter("all")}
                              className={`mz-admin-lang-pill ${mcqFilter === "all" ? "active" : ""}`}
                              style={{ padding: "4px 10px", fontSize: 11 }}
                            >
                              All ({totalCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setMcqFilter("correct")}
                              className={`mz-admin-lang-pill ${mcqFilter === "correct" ? "active" : ""}`}
                              style={{ padding: "4px 10px", fontSize: 11 }}
                            >
                              Correct ({correctCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setMcqFilter("incorrect")}
                              className={`mz-admin-lang-pill ${mcqFilter === "incorrect" ? "active" : ""}`}
                              style={{ padding: "4px 10px", fontSize: 11 }}
                            >
                              Incorrect ({incorrectCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setMcqFilter("unanswered")}
                              className={`mz-admin-lang-pill ${mcqFilter === "unanswered" ? "active" : ""}`}
                              style={{ padding: "4px 10px", fontSize: 11 }}
                            >
                              Unanswered ({unansCount})
                            </button>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {filteredList.map((q, idx) => {
                            const isCorr = q.isCorrect;
                            const isUnans = q.userSelected === null || q.userSelected === undefined;

                            return (
                              <div
                                key={q.id || idx}
                                style={{
                                  padding: "16px 18px",
                                  borderRadius: 12,
                                  border: isCorr
                                    ? "1.5px solid var(--mz-green-border)"
                                    : isUnans
                                    ? "1.5px solid var(--mz-amber-border)"
                                    : "1.5px solid var(--mz-red-border)",
                                  background: isCorr
                                    ? "var(--mz-green-bg)"
                                    : isUnans
                                    ? "var(--mz-amber-bg)"
                                    : "var(--mz-red-bg)",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                                      Question #{idx + 1}
                                    </span>
                                    {q.topic && (
                                      <span className="mz-admin-badge-purple" style={{ fontSize: 10 }}>
                                        {q.topic}
                                      </span>
                                    )}
                                  </div>

                                  <span
                                    className={
                                      isCorr
                                        ? "mz-admin-pill-pass"
                                        : isUnans
                                        ? "mz-admin-badge-suspended"
                                        : "mz-admin-pill-fail"
                                    }
                                    style={{ fontSize: 11 }}
                                  >
                                    {isCorr ? "✓ Correct (1/1)" : isUnans ? "⚠️ Unanswered (0/1)" : "✗ Incorrect (0/1)"}
                                  </span>
                                </div>

                                <p style={{ margin: "0 0 12px", fontSize: 13.5, fontWeight: 700, color: "var(--mz-text-primary)", lineHeight: 1.5 }}>
                                  {q.question}
                                </p>

                                {/* Options List */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {(q.options || []).map((optText, optIdx) => {
                                    const isCorrectChoice = optIdx === q.correctIndex;
                                    const isSelectedByUser = optIdx === q.userSelected;

                                    let optBg = "var(--mz-surface)";
                                    let optBorder = "var(--mz-border)";
                                    let optColor = "var(--mz-text-secondary)";
                                    let optTag = null;

                                    if (isCorrectChoice) {
                                      optBg = "var(--mz-green-bg)";
                                      optBorder = "#059669";
                                      optColor = "#065f46";
                                      optTag = "✓ Correct Answer";
                                    } else if (isSelectedByUser && !isCorr) {
                                      optBg = "var(--mz-red-bg)";
                                      optBorder = "#e11d48";
                                      optColor = "#9f1239";
                                      optTag = "✗ Candidate Selection";
                                    }

                                    return (
                                      <div
                                        key={optIdx}
                                        style={{
                                          padding: "8px 12px",
                                          borderRadius: 8,
                                          border: `1.5px solid ${optBorder}`,
                                          background: optBg,
                                          color: optColor,
                                          fontSize: 12.5,
                                          fontWeight: isCorrectChoice || isSelectedByUser ? 700 : 500,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                          <span
                                            style={{
                                              display: "inline-flex",
                                              width: 20,
                                              height: 20,
                                              borderRadius: "50%",
                                              background: isCorrectChoice ? "#059669" : isSelectedByUser ? "#e11d48" : "var(--mz-border)",
                                              color: isCorrectChoice || isSelectedByUser ? "#ffffff" : "var(--mz-text-secondary)",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: 11,
                                              fontWeight: 800,
                                            }}
                                          >
                                            {String.fromCharCode(65 + optIdx)}
                                          </span>
                                          <span>{optText}</span>
                                        </div>

                                        {optTag && (
                                          <span
                                            style={{
                                              fontSize: 11,
                                              fontWeight: 800,
                                              color: isCorrectChoice ? "#059669" : "#e11d48",
                                            }}
                                          >
                                            {optTag}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {q.explanation && (
                                  <div
                                    style={{
                                      marginTop: 10,
                                      padding: "8px 12px",
                                      borderRadius: 8,
                                      background: "rgba(255, 255, 255, 0.7)",
                                      border: "1px dashed var(--mz-border-strong)",
                                      fontSize: 11.5,
                                      color: "var(--mz-text-secondary)",
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    <strong>Explanation:</strong> {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 1B. SINGLE CODING SUBMISSION INSPECTOR */}
                  {activeReport.code && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                            Submitted Source Code
                          </h4>
                          <span className="mz-admin-badge-purple" style={{ textTransform: "uppercase" }}>
                            {activeReport.language || "python"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(activeReport.code);
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }}
                          className="mz-admin-btn-action"
                          style={{
                            background: "var(--mz-surface)",
                            border: "1px solid var(--mz-border-strong)",
                            padding: "4px 10px",
                            fontSize: 11.5,
                          }}
                        >
                          <LuCopy style={{ width: 12, height: 12 }} />
                          <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                        </button>
                      </div>

                      {/* Dark Code IDE Editor Box */}
                      <div
                        style={{
                          borderRadius: 12,
                          background: "#0d1117",
                          border: "1px solid #30363d",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            padding: "8px 14px",
                            background: "#161b22",
                            borderBottom: "1px solid #30363d",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div style={{ display: "flex", gap: 5 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56" }} />
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f" }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#8b949e", marginLeft: 8 }}>
                            solution.{activeReport.language === "java" ? "java" : activeReport.language === "cpp" ? "cpp" : "py"}
                          </span>
                        </div>

                        <pre
                          style={{
                            margin: 0,
                            padding: 16,
                            fontFamily: "monospace",
                            fontSize: 12.5,
                            lineHeight: 1.55,
                            color: "#e6edf3",
                            maxHeight: 280,
                            overflowY: "auto",
                          }}
                        >
                          <code>{activeReport.code}</code>
                        </pre>
                      </div>

                      {/* Compiler Telemetry */}
                      {(activeReport.output || activeReport.error) && (
                        <div style={{ marginTop: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mz-text-muted)" }}>COMPILER EXECUTION OUTPUT</span>
                          {activeReport.output && (
                            <pre style={{ margin: "4px 0 0", padding: 10, background: "var(--mz-surface-subtle)", borderRadius: 8, border: "1px solid var(--mz-border)", fontSize: 12, color: "#16a34a" }}>
                              {activeReport.output}
                            </pre>
                          )}
                          {activeReport.error && (
                            <pre style={{ margin: "4px 0 0", padding: 10, background: "var(--mz-red-bg)", borderRadius: 8, border: "1px solid var(--mz-red-border)", fontSize: 12, color: "#dc2626" }}>
                              {activeReport.error}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 1C. CERTIFICATION MULTI-CODING QUESTIONS (Part B) */}
                  {activeReport.selectedCodingQuestions && activeReport.selectedCodingQuestions.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                        Part B: Algorithmic Coding Challenges ({activeReport.selectedCodingQuestions.length} Problems)
                      </h4>

                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {activeReport.selectedCodingQuestions.map((cq, cqIdx) => {
                          const sub = (activeReport.codingSubmissions && activeReport.codingSubmissions[cqIdx]) || {};
                          return (
                            <div
                              key={cq.questionId || cqIdx}
                              style={{
                                padding: 16,
                                borderRadius: 12,
                                border: "1px solid var(--mz-border)",
                                background: "var(--mz-surface)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontWeight: 800, color: "var(--mz-text-primary)", fontSize: 14 }}>
                                    Problem #{cqIdx + 1}: {cq.title}
                                  </span>
                                  <span className="mz-admin-badge-purple">{cq.difficulty || "Medium"}</span>
                                </div>
                                <span className={sub.solved ? "mz-admin-pill-pass" : "mz-admin-pill-fail"}>
                                  {sub.solved ? "✓ Solved" : "✗ Incomplete"}
                                </span>
                              </div>

                              <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "var(--mz-text-muted)", lineHeight: 1.5 }}>
                                {cq.description || "Implement the algorithm according to specifications."}
                              </p>

                              {sub.code && (
                                <div style={{ borderRadius: 10, background: "#0d1117", overflow: "hidden", border: "1px solid #30363d" }}>
                                  <div style={{ padding: "6px 12px", background: "#161b22", fontSize: 11, color: "#8b949e", fontFamily: "monospace" }}>
                                    submitted_solution.{sub.language || "py"} • Passed: {sub.passedTests || 0}/{sub.totalTests || 10} Tests
                                  </div>
                                  <pre style={{ margin: 0, padding: 14, fontSize: 12, color: "#e6edf3", maxHeight: 180, overflowY: "auto", fontFamily: "monospace" }}>
                                    <code>{sub.code}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ────────────────── SUB-TAB 2: MARKS & EVALUATION CONTROL ────────────────── */}
              {reportSubTab === "evaluation" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Modify Form */}
                  <form
                    onSubmit={handleSaveMarks}
                    className="mz-admin-mark-edit-card"
                    style={{
                      background: "#f0fdfa",
                      border: "1.5px solid #0d9488",
                      borderRadius: 14,
                      padding: 20,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f766e" }}>
                          ✏️ Admin Marks & Evaluation Override
                        </h4>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#115e59" }}>
                          Edit score, update passing verdict, and provide official academic feedback.
                        </p>
                      </div>
                      <span className="mz-admin-badge-purple">Real-Time Sync</span>
                    </div>

                    {/* Quick Score Presets */}
                    <div style={{ marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#0f766e", display: "block", marginBottom: 6 }}>
                        QUICK PRESETS:
                      </span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {[100, 90, 80, 70, 50, 0].map((preset) => {
                          const maxVal = activeReport.maxScore || 100;
                          const actualPreset = Math.round((preset / 100) * maxVal);
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setEditScoreValue(actualPreset);
                                const isPassed = preset >= 70;
                                setEditStatusValue(
                                  activeReport.itemType === "coding"
                                    ? isPassed ? "ACCEPTED" : "WRONG_ANSWER"
                                    : isPassed ? "PASSED" : "FAILED"
                                );
                              }}
                              className="mz-admin-lang-pill"
                              style={{ padding: "4px 10px", fontSize: 11 }}
                            >
                              {preset}% ({actualPreset})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: "#0f766e" }}>
                          AWARDED MARKS / SCORE (Max Allowed: {activeReport.maxScore || 100})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={activeReport.maxScore || 100}
                          value={editScoreValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditScoreValue(val);
                            const num = Number(val);
                            const maxVal = activeReport.maxScore || 100;
                            const pct = (num / maxVal) * 100;
                            if (activeReport.itemType === "coding") {
                              setEditStatusValue(pct >= 70 ? "ACCEPTED" : "WRONG_ANSWER");
                            } else {
                              setEditStatusValue(pct >= 70 ? "PASSED" : "FAILED");
                            }
                          }}
                          required
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: "1px solid #14b8a6",
                            marginTop: 4,
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--mz-text-primary)",
                            outline: "none",
                            background: "var(--mz-surface)",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: "#0f766e" }}>
                          STATUS VERDICT
                        </label>
                        <select
                          value={editStatusValue}
                          onChange={(e) => setEditStatusValue(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: "1px solid #14b8a6",
                            marginTop: 4,
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--mz-text-primary)",
                            outline: "none",
                            background: "var(--mz-surface)",
                          }}
                        >
                          {activeReport.itemType === "coding" ? (
                            <>
                              <option value="ACCEPTED">ACCEPTED (Pass)</option>
                              <option value="WRONG_ANSWER">WRONG_ANSWER (Failed)</option>
                              <option value="RUNTIME_ERROR">RUNTIME_ERROR</option>
                            </>
                          ) : (
                            <>
                              <option value="PASSED">PASSED</option>
                              <option value="FAILED">FAILED</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: "#0f766e" }}>
                        ADMIN EVALUATION REMARKS & DETAILED FEEDBACK (Delivered to Student)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Manually verified edge case tests, algorithmic complexity approved. Upgraded score with distinction."
                        value={editAdminNote}
                        onChange={(e) => setEditAdminNote(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: "1px solid #14b8a6",
                          marginTop: 4,
                          fontSize: 13,
                          color: "var(--mz-text-primary)",
                          outline: "none",
                          resize: "vertical",
                          fontFamily: "inherit",
                          background: "var(--mz-surface)",
                        }}
                      />
                    </div>

                    {/* Multi-Channel Notification Dispatch Notice */}
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "#ccfbf1",
                        border: "1px solid #99f6e4",
                        fontSize: 12,
                        color: "#0f766e",
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span>🔔</span>
                      <span>
                        Saving will automatically send an official notification email to <strong>{activeReport.candidateEmail || user.email}</strong> and emit an instant in-app pop-up alert to the candidate's active session.
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <button
                        type="submit"
                        disabled={savingMarks}
                        className="mz-admin-btn-primary"
                        style={{
                          padding: "8px 20px",
                          fontSize: 13,
                          background: "#0d9488",
                          borderColor: "#0d9488",
                          fontWeight: 700,
                        }}
                      >
                        <LuSave style={{ width: 14, height: 14 }} />
                        <span>{savingMarks ? "Saving & Notifying Student..." : "Update Marks & Notify Student"}</span>
                      </button>
                    </div>
                  </form>

                  {/* Audit Trail & Update History */}
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: "1px solid var(--mz-border)",
                      background: "var(--mz-surface)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <LuHistory style={{ width: 16, height: 16, color: "#6366f1" }} />
                      <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                        Evaluation Audit Trail & Modification History
                      </h4>
                    </div>

                    {(!activeReport.marksHistory || activeReport.marksHistory.length === 0) ? (
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--mz-text-subtle)" }}>
                        Original candidate score recorded. No administrative modifications have been logged yet.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {activeReport.marksHistory.map((h, hIdx) => (
                          <div
                            key={hIdx}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 8,
                              background: "var(--mz-surface-subtle)",
                              border: "1px solid var(--mz-border)",
                              fontSize: 12,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>
                                Score: {h.oldScore} ({h.oldStatus}) ➜ <strong style={{ color: "#0d9488" }}>{h.newScore} ({h.newStatus})</strong>
                              </span>
                              <span style={{ color: "var(--mz-text-subtle)", fontSize: 11 }}>
                                {new Date(h.modifiedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                              </span>
                            </div>
                            <div style={{ color: "var(--mz-text-muted)" }}>
                              Modified by: <strong>{h.modifiedBy}</strong> • "{h.adminNote}"
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ────────────────── SUB-TAB 3: PROCTORING & NOTIFICATION TRACKING ────────────────── */}
              {reportSubTab === "audit" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Real-Time Student Notification Read Tracker */}
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: "1px solid var(--mz-border)",
                      background: "var(--mz-surface)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <LuBell style={{ width: 16, height: 16, color: "#6366f1" }} />
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                        Multi-Channel Notification Delivery & Real-Time Student Read Audit
                      </h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                      <div style={{ padding: 12, borderRadius: 10, background: "var(--mz-surface-subtle)", border: "1px solid var(--mz-border)" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mz-text-muted)" }}>REGISTERED EMAIL</span>
                        <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: "var(--mz-text-primary)" }}>
                          {activeReport.candidateEmail || user.email}
                        </p>
                        <span style={{ fontSize: 11, color: activeReport.notificationEmailSent ? "#059669" : "var(--mz-text-muted)", fontWeight: 700 }}>
                          {activeReport.notificationEmailSent ? "✓ Email Dispatched via SMTP" : "Ready for dispatch"}
                        </span>
                      </div>

                      <div style={{ padding: 12, borderRadius: 10, background: "var(--mz-surface-subtle)", border: "1px solid var(--mz-border)" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mz-text-muted)" }}>IN-APP NOTIFICATION POPUP</span>
                        <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: "var(--mz-text-primary)" }}>
                          Real-Time Socket Stream
                        </p>
                        <span style={{ fontSize: 11, color: activeReport.notificationSent ? "#059669" : "var(--mz-text-muted)", fontWeight: 700 }}>
                          {activeReport.notificationSent ? "✓ Emitted to Candidate Room" : "Ready for dispatch"}
                        </span>
                      </div>
                    </div>

                    {/* Live Read Audit Status */}
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        background: activeReport.notificationViewed ? "var(--mz-green-bg)" : "var(--mz-amber-bg)",
                        border: activeReport.notificationViewed ? "1.5px solid #10b981" : "1.5px solid #f59e0b",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>
                        {activeReport.notificationViewed ? "🟢" : "🟡"}
                      </span>
                      <div>
                        <strong style={{ fontSize: 13, color: activeReport.notificationViewed ? "#065f46" : "#92400e" }}>
                          {activeReport.notificationViewed
                            ? "Student has opened and viewed the notification"
                            : "Notification delivered • Unread by student"}
                        </strong>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: activeReport.notificationViewed ? "#047857" : "#b45309" }}>
                          {activeReport.notificationViewed
                            ? `Confirmed read at: ${new Date(activeReport.notificationViewedAt || Date.now()).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`
                            : "The student will receive an immediate in-app popup and email on their registered account."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Proctoring Event Log */}
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: "1px solid var(--mz-border)",
                      background: "var(--mz-surface)",
                    }}
                  >
                    <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                      Proctoring Telemetry & Security Violations Log
                    </h4>

                    {(!activeReport.proctoring?.violationsLog || activeReport.proctoring.violationsLog.length === 0) ? (
                      <div style={{ padding: 12, borderRadius: 8, background: "var(--mz-green-bg)", color: "#059669", fontSize: 12.5, fontWeight: 600 }}>
                        ✓ Zero security violations detected. Candidate completed session under verified compliance.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {activeReport.proctoring.violationsLog.map((v, vIdx) => (
                          <div
                            key={vIdx}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 8,
                              background: "var(--mz-red-bg)",
                              border: "1px solid var(--mz-red-border)",
                              fontSize: 12,
                              color: "#dc2626",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>⚠️ {v.type || "Interruption recorded"}</span>
                            <span>{new Date(v.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Report Footer */}
            <div
              style={{
                padding: "12px 24px",
                borderTop: "1px solid var(--mz-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--mz-surface-subtle)",
              }}
            >
              <span style={{ fontSize: 11.5, color: "var(--mz-text-subtle)" }}>
                {activeReport.adminNote ? `Latest Note: ${activeReport.adminNote}` : "Assessment Performance Record"}
              </span>
              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="mz-admin-btn-secondary"
                style={{ padding: "6px 16px", fontSize: 12.5 }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetailModal;
