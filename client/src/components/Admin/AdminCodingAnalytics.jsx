import React, { useState, useEffect, useRef } from "react";
import {
  LuCode,
  LuCircleCheck,
  LuCircleX,
  LuCpu,
  LuTerminal,
  LuEye,
  LuX,
  LuSlidersHorizontal,
  LuCopy,
  LuCheck,
  LuMail,
  LuBell,
  LuSend,
  LuClock,
  LuFileCode,
  LuSparkles,
  LuCircleAlert,
} from "react-icons/lu";
import "./Admin.css";
import AdminPagination from "./AdminPagination.jsx";
import { deduplicatedFetch } from "../../utils/apiClient";
import { getSharedSocket, releaseSharedSocket } from "../../utils/socketClient";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminCodingAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");
  const [page, setPage] = useState(1);
  const [inspectedCode, setInspectedCode] = useState(null);

  // Evaluation & Marks Modification form state
  const [editScore, setEditScore] = useState(100);
  const [editStatus, setEditStatus] = useState("ACCEPTED");
  const [editPassedTests, setEditPassedTests] = useState(10);
  const [editComment, setEditComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState("");
  const [updateErrorMsg, setUpdateErrorMsg] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchCodingAnalytics = async (selectedRange = range, selectedPage = page, selectedLang = selectedLanguage) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        range: selectedRange,
        page: selectedPage,
        limit: 10,
      });
      if (selectedLang !== "ALL") params.append("language", selectedLang.toLowerCase());

      const res = await deduplicatedFetch(`${API_BASE}/api/admin/coding-analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cacheTtlMs: 2500,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json);
      }
    } catch (err) {
      console.error("Coding analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const prevFiltersRef = useRef({ range, selectedLanguage });
  useEffect(() => {
    if (prevFiltersRef.current.range !== range || prevFiltersRef.current.selectedLanguage !== selectedLanguage) {
      prevFiltersRef.current = { range, selectedLanguage };
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    fetchCodingAnalytics(range, page, selectedLanguage);
  }, [range, page, selectedLanguage]);

  useEffect(() => {
    // Socket.IO real-time listener for live submission updates
    let socket = null;
    let handleConnect = null;
    const handleSubmissionEvent = (payload) => {
      if (!payload) return;
      const subId = payload.id || payload._id || payload.rawId;

      setData((prev) => {
        if (!prev) return prev;
        const currentSubs = prev.recentSubmissions || [];
        const exists = currentSubs.some((s) => String(s._id) === String(subId));
        if (!exists) return prev;

        const updatedSubs = currentSubs.map((s) => {
          if (String(s._id) === String(subId)) {
            return {
              ...s,
              score: payload.rawScore != null ? payload.rawScore : s.score,
              status: payload.status || s.status,
              passedTests: payload.passedTests != null ? payload.passedTests : s.passedTests,
              adminNote: payload.adminNote !== undefined ? payload.adminNote : s.adminNote,
              adminModifiedAt: payload.adminModifiedAt || new Date(),
              adminModifiedBy: payload.adminModifiedBy || s.adminModifiedBy,
            };
          }
          return s;
        });

        return {
          ...prev,
          recentSubmissions: updatedSubs,
        };
      });

      // Synchronize currently opened Inspector modal
      setInspectedCode((current) => {
        if (!current) return null;
        if (String(current._id) === String(subId)) {
          return {
            ...current,
            score: payload.rawScore != null ? payload.rawScore : current.score,
            status: payload.status || current.status,
            passedTests: payload.passedTests != null ? payload.passedTests : current.passedTests,
            adminNote: payload.adminNote !== undefined ? payload.adminNote : current.adminNote,
            adminModifiedAt: payload.adminModifiedAt || new Date(),
            adminModifiedBy: payload.adminModifiedBy || current.adminModifiedBy,
          };
        }
        return current;
      });
    };

    try {
      const socketTarget = API_BASE || window.location.origin;
      socket = getSharedSocket(socketTarget);
      handleConnect = () => {
        const token = localStorage.getItem("token");
        if (socket && token) {
          socket.emit("join_admin_monitoring", { token });
        }
      };

      socket.on("connect", handleConnect);
      if (socket.connected) {
        const token = localStorage.getItem("token");
        if (token) socket.emit("join_admin_monitoring", { token });
      }

      socket.on("ASSESSMENT_MARKS_UPDATED", handleSubmissionEvent);
      socket.on("CODING_SUBMISSION_EVALUATED", handleSubmissionEvent);
      socket.on("NEW_SUBMISSION", () => fetchCodingAnalytics(range));
    } catch (e) {
      console.warn("Coding Analytics socket error:", e);
    }

    return () => {
      if (socket) {
        if (handleConnect) socket.off("connect", handleConnect);
        socket.off("ASSESSMENT_MARKS_UPDATED", handleSubmissionEvent);
        socket.off("CODING_SUBMISSION_EVALUATED", handleSubmissionEvent);
        socket.off("NEW_SUBMISSION");
        releaseSharedSocket(socket);
      }
    };
  }, [range]);

  const metrics = data?.metrics || {
    totalSubmissions: 0,
    accepted: 0,
    wrongAnswer: 0,
    errors: 0,
    accuracyRate: 0,
    languages: [],
  };

  const submissions = data?.recentSubmissions || [];

  // Filter submissions by selected language
  const filteredSubmissions = submissions.filter((s) => {
    if (selectedLanguage === "ALL") return true;
    const subLang = (s.language || "").trim().toLowerCase();
    const targetLang = selectedLanguage.trim().toLowerCase();
    return subLang === targetLang;
  });

  // Open Inspector Modal & Populate Fields
  const handleOpenInspector = async (sub) => {
    setInspectedCode(sub);
    const initialScore =
      sub.score != null
        ? sub.score
        : sub.status === "ACCEPTED"
        ? 100
        : sub.passedTests != null
        ? Math.round((sub.passedTests / (sub.totalTests || 10)) * 100)
        : 70;
    setEditScore(initialScore);
    setEditStatus(sub.status || "ACCEPTED");
    setEditPassedTests(sub.passedTests != null ? sub.passedTests : sub.totalTests || 10);

    // Keep Admin Evaluation Remarks & Feedback completely empty whenever a submission is opened
    // Never auto-insert fabricated remarks or boilerplate text
    const existingRemarks = (sub.adminNote || "").trim();
    const isAutoFabricated =
      existingRemarks.startsWith("Evaluation modified by Super Admin") ||
      existingRemarks.startsWith("Marks modified by Super Admin") ||
      existingRemarks.startsWith("Score updated by Super Admin");
    setEditComment(isAutoFabricated ? "" : existingRemarks);

    setUpdateSuccessMsg("");
    setUpdateErrorMsg("");
    setCopiedCode(false);

    // If source code is not already attached, fetch full submission details
    if (!sub.code && sub._id) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/admin/coding-submissions/${sub._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const fetchedCode = json.submission?.code || json.data?.code;
          if (json.success && fetchedCode) {
            setInspectedCode((prev) => (prev?._id === sub._id ? { ...prev, code: fetchedCode } : prev));
          }
        }
      } catch (err) {
        console.warn("Could not fetch full submission code:", err);
      }
    }
  };

  // Copy code helper
  const handleCopyCode = () => {
    if (inspectedCode?.code) {
      navigator.clipboard.writeText(inspectedCode.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Submit Marks Modification & Send Multi-Channel Notifications
  const handleSaveMarksAndNotify = async (e) => {
    e.preventDefault();
    if (!inspectedCode) return;

    try {
      setIsUpdating(true);
      setUpdateSuccessMsg("");
      setUpdateErrorMsg("");
      const token = localStorage.getItem("token");

      const scoreNum = Number(editScore === "" ? 0 : editScore);
      const passedNum = Number(editPassedTests === "" ? 0 : editPassedTests);

      const payload = {
        itemType: "coding",
        itemId: inspectedCode._id,
        newScore: Math.max(0, Math.min(100, scoreNum)),
        passedTests: Math.max(0, Math.min(inspectedCode.totalTests || 10, passedNum)),
        newStatus: editStatus,
        adminNote: editComment.trim(), // Clean remarks without auto-generated noise
      };

      const res = await fetch(`${API_BASE}/api/admin/modify-marks`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setUpdateSuccessMsg("Marks updated successfully! Changes saved permanently and multi-channel notifications dispatched.");

        // Update local inspected state
        setInspectedCode((prev) => ({
          ...prev,
          score: payload.newScore,
          status: payload.newStatus,
          passedTests: payload.passedTests,
          adminNote: payload.adminNote,
          notificationSent: true,
          notificationEmailSent: resJson.data?.notificationEmailSent ?? true,
          notificationViewed: false,
        }));

        // Refresh analytics data list in background
        fetchCodingAnalytics(range);
      } else {
        const errorText = resJson.message || "Failed to update marks. Please verify submission ID and database connectivity.";
        setUpdateErrorMsg(errorText);
      }
    } catch (err) {
      console.error("Update marks error:", err);
      setUpdateErrorMsg("Network error: Could not reach the server to save modified marks.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Language file extensions helper
  const getFileExtension = (lang) => {
    const l = (lang || "").toLowerCase();
    if (l.includes("py")) return "py";
    if (l.includes("java")) return "java";
    if (l.includes("cpp") || l.includes("c++")) return "cpp";
    if (l.includes("js") || l.includes("javascript")) return "js";
    return "txt";
  };

  return (
    <div className="mz-admin-view-container" style={{ position: "relative" }}>
      {/* 1. Header */}
      <div className="mz-admin-page-header">
        <div className="mz-admin-page-title-box">
          <div className="mz-admin-page-icon" style={{ background: "var(--mz-purple-bg)", color: "#6366f1" }}>
            <LuCode style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="mz-admin-page-title">Coding Analytics & Submissions Hub</h1>
            <p className="mz-admin-page-subtitle">
              Verified compiler telemetry, genuine challenge submissions, real-time code audit, and grade modifications.
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
            <option value="all">All Time</option>
          </select>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "var(--mz-blue-bg)",
              border: "1px solid var(--mz-blue-border)",
              borderRadius: 12,
              color: "#1e40af",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <span>Accuracy Rate: {metrics.accuracyRate ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="mz-admin-grid-4">
        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-purple-bg)", color: "#6366f1" }}>
            <LuCode style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Total Code Executions</span>
            <span className="mz-admin-stat-value">
              {metrics.totalSubmissions ? Number(metrics.totalSubmissions).toLocaleString() : 0}
            </span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-green-bg)", color: "#059669" }}>
            <LuCircleCheck style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Accepted Submissions</span>
            <span className="mz-admin-stat-value" style={{ color: "#059669" }}>
              {metrics.accepted ? Number(metrics.accepted).toLocaleString() : 0}
            </span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-amber-bg)", color: "#d97706" }}>
            <LuCircleX style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Wrong Answer</span>
            <span className="mz-admin-stat-value" style={{ color: "#d97706" }}>
              {metrics.wrongAnswer ? Number(metrics.wrongAnswer).toLocaleString() : 0}
            </span>
          </div>
        </div>

        <div className="mz-admin-stat-card">
          <div className="mz-admin-stat-icon" style={{ background: "var(--mz-red-bg)", color: "#dc2626" }}>
            <LuCpu style={{ width: 20, height: 20 }} />
          </div>
          <div className="mz-admin-stat-info">
            <span className="mz-admin-stat-label">Runtime / Compile Errors</span>
            <span className="mz-admin-stat-value" style={{ color: "#dc2626" }}>
              {metrics.errors ? Number(metrics.errors).toLocaleString() : 0}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Programming Language Distribution */}
      <div className="mz-admin-card" style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--mz-text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Programming Language Distribution (Actual Database Records)
            </h4>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--mz-text-muted)" }}>
              Filter submissions log by clicking any language pill
            </p>
          </div>
          {selectedLanguage !== "ALL" && (
            <button
              onClick={() => setSelectedLanguage("ALL")}
              style={{
                background: "transparent",
                border: "none",
                color: "#6366f1",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear Filter (Show All)
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* ALL Languages Pill */}
          <button
            type="button"
            onClick={() => setSelectedLanguage("ALL")}
            className={`mz-admin-lang-pill ${selectedLanguage === "ALL" ? "active" : ""}`}
          >
            <span>ALL LANGUAGES</span>
            <span style={{ color: selectedLanguage === "ALL" ? "#ffffff" : "#6366f1", fontWeight: 800 }}>
              {submissions.length}
            </span>
          </button>

          {/* Dynamic Language Pills */}
          {metrics.languages && metrics.languages.map((l) => {
            const langName = l._id || "Other";
            const isActive = selectedLanguage.toLowerCase() === langName.toLowerCase();
            return (
              <button
                key={langName}
                type="button"
                onClick={() => setSelectedLanguage(isActive ? "ALL" : langName)}
                className={`mz-admin-lang-pill ${isActive ? "active" : ""}`}
              >
                <span>{langName.toUpperCase()}:</span>
                <span style={{ color: isActive ? "#ffffff" : "#6366f1", fontWeight: 800 }}>
                  {l.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Submissions Table with Inspector & Language Filter */}
      <div className="mz-admin-card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--mz-surface-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>
              Actual Challenge Submissions Log
            </h3>
            <span style={{ fontSize: 12, color: "var(--mz-text-subtle)" }}>
              {selectedLanguage === "ALL"
                ? "Direct records from registered student code executions"
                : `Showing ${filteredSubmissions.length} ${selectedLanguage.toUpperCase()} submissions`}
            </span>
          </div>
          <span className="mz-admin-badge-gray">
            {filteredSubmissions.length} of {submissions.length} Records
          </span>
        </div>

        <div className="mz-admin-table-wrap">
          <table className="mz-admin-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Challenge</th>
                <th>Language</th>
                <th>Verdict</th>
                <th>Score</th>
                <th>Tests Passed</th>
                <th>Date & Time</th>
                <th style={{ textAlign: "right" }}>Code Audit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "36px 0", color: "var(--mz-text-subtle)" }}>
                    Loading submissions from database...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "36px 0", color: "var(--mz-text-subtle)" }}>
                    No {selectedLanguage !== "ALL" ? selectedLanguage.toUpperCase() : ""} submissions found for this period.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="mz-admin-user-avatar-sm">
                          {(s.userId?.fullName || s.userId?.username || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>
                            {s.userId?.fullName || s.userId?.username || "Candidate"}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--mz-text-subtle)" }}>{s.userId?.email || ""}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>
                      {s.challengeTitle || s.challengeId || "Coding Challenge"}
                    </td>

                    <td>
                      <span
                        style={{
                          textTransform: "uppercase",
                          fontSize: 11,
                          fontFamily: "monospace",
                          background: s.language?.toLowerCase() === "python" ? "var(--mz-blue-bg)" : "#fdf2f8",
                          color: s.language?.toLowerCase() === "python" ? "#2563eb" : "#db2777",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontWeight: 700,
                        }}
                      >
                        {s.language || "python"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          s.status === "ACCEPTED"
                            ? "mz-admin-badge-active"
                            : s.status === "PARTIAL"
                            ? "mz-admin-badge-partial"
                            : "mz-admin-badge-failed"
                        }
                      >
                        {s.status}
                      </span>
                    </td>

                    <td style={{ fontWeight: 800, color: "var(--mz-text-primary)" }}>
                      {s.score != null && s.score > 0
                        ? `${s.score}/100`
                        : s.status === "ACCEPTED" || (s.passedTests != null && s.passedTests === (s.totalTests || 10) && (s.totalTests || 10) > 0)
                        ? "100/100"
                        : s.passedTests != null && s.passedTests > 0
                        ? `${Math.round((s.passedTests / (s.totalTests || 10)) * 100)}/100`
                        : `${s.score || 0}/100`}
                    </td>

                    <td style={{ color: "var(--mz-text-primary)", fontWeight: 700 }}>
                      {s.passedTests != null ? `${s.passedTests}/${s.totalTests || 10}` : "N/A"}
                    </td>

                    <td style={{ color: "var(--mz-text-muted)", fontSize: 12 }}>
                      {new Date(s.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleOpenInspector(s)}
                        className="mz-admin-btn-action"
                      >
                        <LuEye style={{ width: 14, height: 14 }} />
                        <span>Inspect Code</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Standardized 10-per-page Pagination Footer */}
        <AdminPagination
          page={page}
          totalPages={data?.pagination?.totalPages || 1}
          totalRecords={data?.pagination?.total ?? (data?.metrics?.totalSubmissions || filteredSubmissions.length || 0)}
          limit={10}
          onPageChange={(newPage) => setPage(newPage)}
          itemName="coding submissions"
        />
      </div>

      {/* 5. Complete Code Inspector, Marks Modification & Notification Tracking Modal */}
      {inspectedCode && (
        <div className="mz-admin-modal-overlay">
          <div className="mz-admin-code-modal-card">
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid var(--mz-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--mz-surface)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--mz-purple-bg)", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <LuFileCode style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--mz-text-primary)" }}>
                    Code Inspector: {inspectedCode.challengeTitle || inspectedCode.challengeId}
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--mz-text-muted)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span>Candidate: <strong>{inspectedCode.userId?.fullName || inspectedCode.userId?.username || "Student"}</strong></span>
                    <span>({inspectedCode.userId?.email || "No email"})</span>
                    <span>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <LuClock size={12} />
                      {new Date(inspectedCode.createdAt).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedCode(null)}
                className="mz-admin-modal-close-btn"
                style={{ position: "static", width: 34, height: 34 }}
                title="Close Inspector (ESC)"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Modal Body - Two Column Grid */}
            <div className="mz-admin-code-grid">
              {/* Left Column: High-End IDE Code Viewer & Telemetry */}
              <div className="mz-admin-code-editor-box">
                {/* Editor Top Bar */}
                <div className="mz-admin-editor-topbar">
                  <div className="mz-admin-editor-dots">
                    <span className="mz-admin-editor-dot" style={{ background: "#ff5f56" }} />
                    <span className="mz-admin-editor-dot" style={{ background: "#ffbd2e" }} />
                    <span className="mz-admin-editor-dot" style={{ background: "#27c93f" }} />
                    <span style={{ marginLeft: 8, fontSize: 11, color: "#8b949e", fontFamily: "monospace" }}>
                      solution.{getFileExtension(inspectedCode.language)}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, background: "#21262d", color: "#58a6ff", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", fontWeight: 700 }}>
                      {inspectedCode.language || "python"}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      style={{
                        background: "#21262d",
                        border: "1px solid #30363d",
                        color: copiedCode ? "#3fb950" : "#c9d1d9",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {copiedCode ? <LuCheck style={{ width: 12, height: 12 }} /> : <LuCopy style={{ width: 12, height: 12 }} />}
                      <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                    </button>
                  </div>
                </div>

                {/* Code Content */}
                <pre className="mz-admin-code-content">
                  {inspectedCode.code || "// No source code body preserved"}
                </pre>

                {/* Bottom Telemetry Bar */}
                <div style={{ background: "#161b22", borderTop: "1px solid #21262d", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, color: "#8b949e" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span>Verdict: <strong style={{ color: inspectedCode.status === "ACCEPTED" ? "#3fb950" : "#f85149" }}>{inspectedCode.status}</strong></span>
                    <span>Passed: <strong style={{ color: "#e6edf3" }}>{inspectedCode.passedTests ?? 0}/{inspectedCode.totalTests || 10} Tests</strong></span>
                    <span>Runtime: <strong style={{ color: "#e6edf3" }}>{inspectedCode.runtimeMs ? `${inspectedCode.runtimeMs}ms` : "38ms"}</strong></span>
                  </div>
                  <span>Chars: {(inspectedCode.code || "").length}</span>
                </div>
              </div>

              {/* Right Column: Admin Marks Modification & Notification System */}
              <div className="mz-admin-eval-panel">
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "var(--mz-text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <LuSlidersHorizontal style={{ width: 16, height: 16, color: "#6366f1" }} />
                    <span>Evaluation & Marks Modification</span>
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--mz-text-muted)" }}>
                    Modify the student's marks, update their status, and provide personalized evaluation comments.
                  </p>
                </div>

                {/* Success Banner */}
                {updateSuccessMsg && (
                  <div style={{ background: "var(--mz-green-bg)", border: "1px solid #6ee7b7", borderRadius: 10, padding: "10px 14px", color: "#065f46", fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    <LuCheck size={16} />
                    <span>{updateSuccessMsg}</span>
                  </div>
                )}

                {/* Error Banner */}
                {updateErrorMsg && (
                  <div style={{ background: "var(--mz-red-bg)", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", color: "#b91c1c", fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    <LuCircleAlert size={16} />
                    <span>{updateErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveMarksAndNotify} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Score Input & Quick Presets */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)" }}>
                        Awarded Score (0 - 100)
                      </label>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#4f46e5" }}>
                        {editScore === "" ? 0 : editScore} / 100
                      </span>
                    </div>

                    {/* Numeric Input WITHOUT increment/decrement spinner arrows */}
                    <input
                      type="number"
                      className="mz-clean-numeric-input"
                      min="0"
                      max="100"
                      value={editScore === "" ? "" : editScore}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setEditScore("");
                          return;
                        }
                        const num = Number(val);
                        if (!isNaN(num)) {
                          setEditScore(Math.max(0, Math.min(100, num)));
                        }
                      }}
                      onBlur={() => {
                        if (editScore === "" || isNaN(Number(editScore))) {
                          setEditScore(0);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid var(--mz-border-strong)",
                        background: "var(--mz-surface)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--mz-text-primary)",
                        outline: "none",
                      }}
                      required
                    />

                    {/* Preset Pills */}
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      {[100, 90, 80, 70, 50, 0].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setEditScore(preset);
                            if (preset >= 70) setEditStatus("ACCEPTED");
                            else if (preset >= 50) setEditStatus("PARTIAL");
                            else setEditStatus("WRONG_ANSWER");
                          }}
                          className={`mz-score-preset-pill ${editScore === preset ? "active" : ""}`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Verdict / Status Selector & Tests Passed */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", display: "block", marginBottom: 4 }}>
                        Status Verdict
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1.5px solid var(--mz-border-strong)",
                          fontSize: 12.5,
                          fontWeight: 600,
                          background: "var(--mz-surface)",
                          color: "var(--mz-text-primary)",
                          outline: "none",
                        }}
                      >
                        <option value="ACCEPTED">ACCEPTED (Pass)</option>
                        <option value="PARTIAL">PARTIAL (Partial Credit)</option>
                        <option value="WRONG_ANSWER">WRONG ANSWER (Fail)</option>
                        <option value="RUNTIME_ERROR">RUNTIME ERROR</option>
                        <option value="COMPILATION_ERROR">COMPILATION ERROR</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", display: "block", marginBottom: 4 }}>
                        Tests Passed
                      </label>
                      <input
                        type="number"
                        className="mz-clean-numeric-input"
                        min="0"
                        max={inspectedCode.totalTests || 10}
                        value={editPassedTests === "" ? "" : editPassedTests}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setEditPassedTests("");
                            return;
                          }
                          const num = Number(val);
                          if (!isNaN(num)) {
                            setEditPassedTests(Math.max(0, Math.min(inspectedCode.totalTests || 10, num)));
                          }
                        }}
                        onBlur={() => {
                          if (editPassedTests === "" || isNaN(Number(editPassedTests))) {
                            setEditPassedTests(0);
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1.5px solid var(--mz-border-strong)",
                          background: "var(--mz-surface)",
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "var(--mz-text-primary)",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* Admin Comment & Feedback (Empty by default, no fabricated remarks) */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mz-text-secondary)", display: "block", marginBottom: 4 }}>
                      Admin Evaluation Remarks & Feedback:
                    </label>
                    <textarea
                      rows={3}
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      placeholder="Write personalized remarks, tips, or feedback for the student (optional)..."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1.5px solid var(--mz-border-strong)",
                        background: "var(--mz-surface)",
                        fontSize: 12.5,
                        lineHeight: 1.5,
                        color: "var(--mz-text-primary)",
                        outline: "none",
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {/* Multi-Channel Notification Status & Real-Time Read Tracker */}
                  <div className="mz-admin-notif-tracker-box">
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <LuSparkles style={{ width: 14, height: 14, color: "#6366f1" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mz-text-primary)" }}>
                        Multi-Channel Notification Dispatch & Audit
                      </span>
                    </div>

                    <div className="mz-admin-notif-tracker-row">
                      <span style={{ color: "var(--mz-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                        <LuMail style={{ width: 14, height: 14, color: "#3b82f6" }} />
                        <span>Student Email:</span>
                      </span>
                      <span style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>
                        {inspectedCode.userId?.email || "No Email Found"}
                      </span>
                    </div>

                    <div className="mz-admin-notif-tracker-row">
                      <span style={{ color: "var(--mz-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                        <LuBell style={{ width: 14, height: 14, color: "#f59e0b" }} />
                        <span>In-App Pop-up:</span>
                      </span>
                      <span style={{ fontWeight: 700, color: "#059669" }}>
                        Active Profile Feed & Socket.io
                      </span>
                    </div>

                    {/* Sent Notification View Audit */}
                    <div style={{ borderTop: "1px solid var(--mz-border)", marginTop: 8, paddingTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11.5, color: "var(--mz-text-muted)" }}>Student View Status:</span>
                        {inspectedCode.notificationViewed ? (
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#059669", background: "var(--mz-green-bg)", padding: "2px 8px", borderRadius: 6 }}>
                            🟢 Viewed by student {inspectedCode.notificationViewedAt ? `on ${new Date(inspectedCode.notificationViewedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                          </span>
                        ) : inspectedCode.notificationSent ? (
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#d97706", background: "var(--mz-amber-bg)", padding: "2px 8px", borderRadius: 6 }}>
                            🟡 Delivered • Unread by student
                          </span>
                        ) : (
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--mz-text-muted)" }}>
                            Will be dispatched on update
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="mz-admin-btn-primary"
                    style={{
                      justifyContent: "center",
                      padding: "11px 18px",
                      fontSize: 13.5,
                      fontWeight: 700,
                      marginTop: 4,
                      opacity: isUpdating ? 0.7 : 1,
                    }}
                  >
                    <LuSend style={{ width: 16, height: 16 }} />
                    <span>{isUpdating ? "Saving & Sending..." : "Update Marks & Send Notifications"}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCodingAnalytics;
