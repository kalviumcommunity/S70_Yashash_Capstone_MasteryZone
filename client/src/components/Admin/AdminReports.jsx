import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LuFileText,
  LuAward,
  LuDownload,
  LuSearch,
  LuEye,
  LuCircleCheck,
  LuCircleX,
  LuCircleAlert,
  LuClock,
  LuCopy,
  LuCheck,
  LuRefreshCw,
  LuShieldAlert,
  LuShieldCheck,
  LuCode,
  LuUser,
  LuMail,
  LuSave,
  LuSparkles,
  LuHistory,
  LuBell,
  LuX,
  LuExternalLink,
  LuFolderGit2,
} from "react-icons/lu";
import { toast } from "react-toastify";
import AdminPagination from "./AdminPagination.jsx";
import { getSharedSocket, releaseSharedSocket } from "../../utils/socketClient";
import { deduplicatedFetch } from "../../utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    certificationsCount: 0,
    assessmentsCount: 0,
    mcqReportsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
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
  const [filterType, setFilterType] = useState("all"); // "all" | "Certification Report" | "Assessment Report" | "MCQ Assessment Report"
  const [dateRange, setDateRange] = useState("all"); // "all" | "today" | "yesterday" | "7d" | "30d" | "90d"
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // Modal State for Inspecting / Modifying Report
  const [activeReport, setActiveReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportSubTab, setReportSubTab] = useState("questions"); // "questions" | "evaluation" | "audit"
  const [mcqFilter, setMcqFilter] = useState("all"); // "all" | "correct" | "incorrect" | "unanswered"
  const [copiedCodeText, setCopiedCodeText] = useState(false);

  // Score Editing State
  const [editScoreValue, setEditScoreValue] = useState("");
  const [editStatusValue, setEditStatusValue] = useState("");
  const [editAdminNote, setEditAdminNote] = useState("");
  const [savingMarks, setSavingMarks] = useState(false);

  // Fetch Reports
  const fetchReports = async (
    selectedPage = page,
    selectedSearch = search,
    selectedType = filterType,
    selectedRange = dateRange,
    showToast = false
  ) => {
    try {
      if (showToast) setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: selectedPage,
        limit: 10,
      });
      if (selectedSearch.trim()) params.append("search", selectedSearch.trim());
      if (selectedType !== "all") params.append("type", selectedType);
      if (selectedRange && selectedRange !== "all") params.append("range", selectedRange);

      const res = await deduplicatedFetch(`${API_BASE}/api/admin/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cacheTtlMs: 3000,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setReports(json.reports || []);
          if (json.pagination) {
            setPagination(json.pagination);
          }
          if (json.stats) {
            setStats(json.stats);
          }
          if (showToast) toast.success("Reports synchronized with database");
        }
      }
    } catch (err) {
      console.error("Reports fetch error:", err);
      if (showToast) toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const prevFiltersRef = useRef({ search, filterType, dateRange });
  useEffect(() => {
    if (
      prevFiltersRef.current.search !== search ||
      prevFiltersRef.current.filterType !== filterType ||
      prevFiltersRef.current.dateRange !== dateRange
    ) {
      prevFiltersRef.current = { search, filterType, dateRange };
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    const timer = setTimeout(() => {
      fetchReports(page, search, filterType, dateRange);
    }, 200);
    return () => clearTimeout(timer);
  }, [page, search, filterType, dateRange]);

  useEffect(() => {
    fetchReports();

    // Socket.io real-time listener for reports updates
    let socket = null;
    const handleConnect = () => {
      if (socket) socket.emit("join_admin_monitoring");
    };

    // Handle new reports generated
    const handleIncomingReport = (newRecord) => {
      if (!newRecord) return;
      setReports((prev) => {
        const exists = prev.some((r) => r.id === newRecord.id || (newRecord.rawId && r.rawId === newRecord.rawId));
        if (exists) return prev;
        return [newRecord, ...prev];
      });
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        certificationsCount:
          newRecord.type === "Certification Report" ? prev.certificationsCount + 1 : prev.certificationsCount,
        assessmentsCount:
          newRecord.type === "Assessment Report" ? prev.assessmentsCount + 1 : prev.assessmentsCount,
        mcqReportsCount:
          newRecord.type === "MCQ Assessment Report" ? prev.mcqReportsCount + 1 : prev.mcqReportsCount,
        projectsCount:
          newRecord.type === "Project Assessment Report" ? (prev.projectsCount || 0) + 1 : (prev.projectsCount || 0),
        codingCount:
          newRecord.type === "Coding Challenge Report" ? (prev.codingCount || 0) + 1 : (prev.codingCount || 0),
      }));
    };

    const handleRefetch = () => {
      fetchReports();
    };

    // Handle marks modified across system
    const handleMarksUpdated = (updateData) => {
      if (!updateData) return;
      setReports((prev) =>
        prev.map((r) => {
          const match =
            r.id === updateData.id ||
            r.rawId === updateData.id ||
            r.attemptId === updateData.id ||
            (updateData.itemType === r.itemType && String(r.id) === String(updateData.id));
          if (match) {
            const newScoreFormatted =
              r.itemType === "module"
                ? `${updateData.newScore}/${r.maxScore || 10} (${Math.round((updateData.newScore / (r.maxScore || 10)) * 100)}%)`
                : `${updateData.newScore}%`;
            return {
              ...r,
              score: newScoreFormatted,
              rawScore: updateData.newScore,
              status: updateData.newStatus || r.status,
              grade:
                updateData.newStatus === "PASSED" || updateData.newStatus === "QUALIFIED"
                  ? updateData.newScore >= 90
                    ? "Distinction"
                    : "First Class"
                  : "Not Qualified",
            };
          }
          return r;
        })
      );
    };

    try {
      const socketTarget = API_BASE || window.location.origin;
      socket = getSharedSocket(socketTarget);

      socket.on("connect", handleConnect);
      if (socket.connected) {
        socket.emit("join_admin_monitoring");
      }

      socket.on("NEW_REPORT", handleIncomingReport);
      socket.on("NEW_CERTIFICATE", handleRefetch);
      socket.on("NEW_MCQ_REPORT", handleRefetch);
      socket.on("NEW_SUBMISSION", handleRefetch);
      socket.on("ASSESSMENT_MARKS_UPDATED", handleMarksUpdated);
    } catch (e) {
      console.warn("Socket initialization error in AdminReports:", e);
    }

    return () => {
      if (socket) {
        socket.off("connect", handleConnect);
        socket.off("NEW_REPORT", handleIncomingReport);
        socket.off("NEW_CERTIFICATE", handleRefetch);
        socket.off("NEW_MCQ_REPORT", handleRefetch);
        socket.off("NEW_SUBMISSION", handleRefetch);
        socket.off("ASSESSMENT_MARKS_UPDATED", handleMarksUpdated);
        releaseSharedSocket(socket);
      }
    };
  }, []);

  // Filter Logic
  const filteredReports = reports;

  // Export to CSV across complete matching database records
  const exportToCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        all: "true",
      });
      if (search.trim()) params.append("search", search.trim());
      if (filterType !== "all") params.append("type", filterType);
      if (dateRange && dateRange !== "all") params.append("range", dateRange);

      let exportItems = filteredReports;
      const res = await deduplicatedFetch(`${API_BASE}/api/admin/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cacheTtlMs: 2000,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.reports && Array.isArray(json.reports)) {
          exportItems = json.reports;
        }
      }

      if (!exportItems || exportItems.length === 0) {
        toast.info("No reports available to export");
        return;
      }
      const headers = [
        "Report Title",
        "Category",
        "Recipient Student",
        "Email Address",
        "Score / Marks",
        "Grade / Status",
        "Verification Code",
        "Date Issued / Submitted",
      ];

      const rows = exportItems.map((r) => [
        `"${(r.title || "").replace(/"/g, '""')}"`,
        `"${(r.type || "").replace(/"/g, '""')}"`,
        `"${(r.recipient || "").replace(/"/g, '""')}"`,
        `"${(r.email || "").replace(/"/g, '""')}"`,
        `"${(r.score || "").replace(/"/g, '""')}"`,
        `"${(r.grade || r.status || "").replace(/"/g, '""')}"`,
        `"${(r.verificationCode || "").replace(/"/g, '""')}"`,
        `"${r.date ? new Date(r.date).toLocaleString() : "N/A"}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `masteryzone_reports_${filterType.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${exportItems.length} reports to CSV!`);
    } catch (err) {
      console.error("CSV Export error:", err);
      toast.error("Failed to generate CSV export");
    }
  };

  // Copy Verification Code
  const handleCopyCode = (code, id, e) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    toast.success(`Copied verification code: ${code}`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Open Full Report Inspection Modal
  const handleOpenReportModal = async (reportItem) => {
    try {
      setLoadingReport(true);
      setActiveReport({
        ...reportItem,
        itemType: reportItem.itemType || (reportItem.type === "Certification Report" ? "certificate" : "certification"),
      });
      setReportSubTab("questions");
      setMcqFilter("all");

      const itemType = reportItem.itemType || (reportItem.type === "Certification Report" ? "certificate" : "certification");
      const itemId = reportItem.rawId || reportItem.id || reportItem.attemptId;

      const token = localStorage.getItem("token");
      const res = await deduplicatedFetch(`${API_BASE}/api/admin/attempt-report/${itemType}/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cacheTtlMs: 5000,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.report) {
          setActiveReport(json.report);
          setEditScoreValue(json.report.score != null ? json.report.score : json.report.percentage || 0);
          setEditStatusValue(json.report.status || "PASSED");
          setEditAdminNote(json.report.adminNote || "");
          return;
        }
      }

      // Fallback
      setEditScoreValue(reportItem.rawScore != null ? reportItem.rawScore : 0);
      setEditStatusValue(reportItem.status || "PASSED");
      setEditAdminNote("");
    } catch (err) {
      console.warn("Report modal load error:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  // Modify Marks Handler
  const handleSaveMarks = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!activeReport) return;

    const maxAllowed = activeReport.maxScore || 100;
    const numVal = Number(editScoreValue);
    if (isNaN(numVal) || numVal < 0 || numVal > maxAllowed) {
      toast.error(`Score must be between 0 and ${maxAllowed}`);
      return;
    }

    try {
      setSavingMarks(true);
      const token = localStorage.getItem("token");
      const payload = {
        itemType: activeReport.itemType,
        itemId: activeReport.id || activeReport.rawId,
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

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Marks updated, synchronized, and student notified!");

        // Update active modal report state
        setActiveReport((prev) => ({
          ...prev,
          score: numVal,
          percentage: activeReport.itemType === "certification" ? numVal : prev.percentage,
          status: editStatusValue,
          finalVerdict: editStatusValue,
          grade: editStatusValue === "PASSED" || editStatusValue === "QUALIFIED" ? (numVal >= 90 ? "Distinction" : "Passed") : "Failed",
          adminNote: editAdminNote,
          adminModifiedAt: new Date().toISOString(),
          notificationSent: true,
          notificationEmailSent: true,
          marksHistory: [
            ...(prev.marksHistory || []),
            {
              originalScore: prev.score,
              newScore: numVal,
              originalStatus: prev.status,
              newStatus: editStatusValue,
              adminNote: editAdminNote,
              modifiedAt: new Date().toISOString(),
            },
          ],
        }));

        // Refresh reports list
        fetchReports();
      } else {
        toast.error(data.message || "Failed to update marks");
      }
    } catch (err) {
      console.error("Modify marks error:", err);
      toast.error("Failed to connect to server");
    } finally {
      setSavingMarks(false);
    }
  };

  // Resolved Question List for Questions Tab
  const questionItems =
    activeReport?.reviewBreakdown && activeReport.reviewBreakdown.length > 0
      ? activeReport.reviewBreakdown.map((q, idx) => ({
          id: q.id || idx,
          number: idx + 1,
          question: q.question || q.questionText,
          options: q.options || [],
          userChoice: q.userSelected != null ? q.userSelected : q.studentChoice,
          correctKey: q.correctIndex != null ? q.correctIndex : q.correctOptionIndex,
          isCorrect: q.isCorrect,
          marksAwarded: q.marksAwarded != null ? q.marksAwarded : q.isCorrect ? 1 : 0,
          explanation: q.explanation,
        }))
      : activeReport?.questionsBreakdown && activeReport.questionsBreakdown.length > 0
      ? activeReport.questionsBreakdown.map((q, idx) => ({
          id: q.questionId || idx,
          number: q.questionNumber || idx + 1,
          question: q.questionText || q.question,
          options: q.options || [],
          userChoice: q.studentChoice != null ? q.studentChoice : q.userSelected,
          correctKey: q.correctOptionIndex != null ? q.correctOptionIndex : q.correctIndex,
          isCorrect: q.isCorrect,
          marksAwarded: q.marksAwarded != null ? q.marksAwarded : q.isCorrect ? 1 : 0,
          explanation: q.explanation,
        }))
      : [];

  return (
    <div style={{ padding: "28px 36px", background: "var(--mz-surface-subtle)", minHeight: "100vh", fontFamily: "inherit" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "var(--mz-purple-bg)",
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.15)",
            }}
          >
            <LuFileText style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
              Centralized Reports Management
            </h1>
            <p style={{ fontSize: 13, color: "var(--mz-text-muted)", margin: "4px 0 0 0" }}>
              Audit, filter, and export verified certificates, assessment scorecards, and learning transcripts.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => fetchReports(true)}
            title="Refresh database records"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--mz-text-secondary)",
              background: "var(--mz-surface)",
              border: "1px solid var(--mz-border)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mz-surface-muted)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--mz-surface)")}
          >
            <LuRefreshCw style={{ width: 15, height: 15 }} />
            Sync Now
          </button>

          <button
            onClick={exportToCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "#ffffff",
              background: "#4f46e5",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#4338ca")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#4f46e5")}
          >
            <LuDownload style={{ width: 16, height: 16 }} />
            Export All to CSV
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          background: "var(--mz-surface)",
          borderRadius: 16,
          padding: "16px 20px",
          border: "1px solid var(--mz-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Search Input */}
        <div ref={searchContainerRef} style={{ position: "relative", flex: "1 1 340px", maxWidth: 460 }}>
          <LuSearch
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--mz-text-subtle)",
              width: 17,
              height: 17,
            }}
          />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#6366f1";
              e.target.style.background = "var(--mz-surface)";
              if (search.trim()) setShowSearchDropdown(true);
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--mz-border)";
              e.target.style.background = "var(--mz-surface-subtle)";
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowSearchDropdown(false);
            }}
            style={{
              width: "100%",
              padding: "10px 14px 10px 40px",
              borderRadius: 10,
              border: "1px solid var(--mz-border)",
              fontSize: 13,
              color: "var(--mz-text-body)",
              outline: "none",
              background: "var(--mz-surface-subtle)",
              transition: "all 0.15s ease",
            }}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setShowSearchDropdown(false);
              }}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--mz-text-subtle)",
                cursor: "pointer",
              }}
            >
              <LuX style={{ width: 14, height: 14 }} />
            </button>
          )}

          {showSearchDropdown && search.trim().length > 0 && (
            <div className="mz-global-search-dropdown">
              <div className="mz-global-search-header">
                <span>Reports matching &ldquo;{search.trim()}&rdquo;</span>
                <span className="mz-global-search-esc"><kbd>ESC</kbd> to dismiss</span>
              </div>
              {filteredReports.length === 0 ? (
                <div className="mz-global-search-empty">
                  <p>No reports match &ldquo;{search}&rdquo;</p>
                  <small>Try searching by recipient, title, or verification code</small>
                </div>
              ) : (
                <div className="mz-global-search-group">
                  {filteredReports.slice(0, 6).map((r, idx) => (
                    <div
                      key={r.id || idx}
                      className="mz-global-search-item"
                      onClick={() => {
                        setShowSearchDropdown(false);
                        handleOpenReportModal(r);
                      }}
                    >
                      <span className="mz-global-search-item-icon">📊</span>
                      <div className="mz-global-search-item-content">
                        <div className="mz-global-search-item-title">{r.title || "Report"}</div>
                        <div className="mz-global-search-item-sub">
                          {r.recipient} ({r.email}) • Score: {r.score}
                        </div>
                      </div>
                      <span className="mz-global-search-item-action">View Report →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Reports", count: stats.total },
            { id: "Certification Report", label: "Certification Report", count: stats.certificationsCount },
            { id: "Assessment Report", label: "Assessment Report", count: stats.assessmentsCount },
            { id: "Project Assessment Report", label: "Practical Projects", count: stats.projectsCount || 0 },
            { id: "Coding Challenge Report", label: "Coding Challenges", count: stats.codingCount || 0 },
            { id: "MCQ Assessment Report", label: "MCQ Assessment Report — 10 Marks", count: stats.mcqReportsCount },
          ].map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: isActive ? "1px solid #4f46e5" : "1px solid var(--mz-border)",
                  background: isActive ? "#4f46e5" : "var(--mz-surface)",
                  color: isActive ? "#ffffff" : "var(--mz-text-muted)",
                  boxShadow: isActive ? "0 2px 6px rgba(79, 70, 229, 0.2)" : "none",
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 10,
                    background: isActive ? "rgba(255,255,255,0.22)" : "var(--mz-surface-muted)",
                    color: isActive ? "#ffffff" : "var(--mz-text-secondary)",
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Date Range Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--mz-text-muted)", fontWeight: 600 }}>Date Range:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid var(--mz-border-strong)",
              fontSize: 12.5,
              fontWeight: 600,
              background: "var(--mz-surface)",
              color: "var(--mz-text-secondary)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Main Reports Table Container */}
      <div
        style={{
          background: "var(--mz-surface)",
          borderRadius: 16,
          border: "1px solid var(--mz-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          overflow: "hidden",
        }}
      >
        {/* Table Subheader */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--mz-surface-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>
              Generated Platform Reports
            </h2>
            <p style={{ fontSize: 12, color: "var(--mz-text-subtle)", margin: "2px 0 0 0" }}>
              {filteredReports.length} {filteredReports.length === 1 ? "record" : "records"} available
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#059669",
                background: "var(--mz-green-bg)",
                padding: "4px 10px",
                borderRadius: 20,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                }}
              />
              Live Sync Active
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#4f46e5",
                background: "var(--mz-indigo-bg)",
                padding: "4px 10px",
                borderRadius: 20,
              }}
            >
              Export Ready
            </span>
          </div>
        </div>

        {/* Reports Table with explicit column widths */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--mz-surface-subtle)", borderBottom: "1px solid var(--mz-border)" }}>
                <th
                  style={{
                    padding: "12px 24px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--mz-text-muted)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 280,
                  }}
                >
                  Report Title
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--mz-text-muted)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 150,
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--mz-text-muted)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 180,
                  }}
                >
                  Recipient Candidate
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--mz-text-muted)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 140,
                  }}
                >
                  Score / Grade
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--mz-text-muted)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 120,
                  }}
                >
                  Verification Code
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--mz-text-muted)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 110,
                  }}
                >
                  Date Issued
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--mz-text-muted)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    textAlign: "right",
                    minWidth: 120,
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "var(--mz-text-muted)" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <LuRefreshCw style={{ animation: "spin 1s linear infinite", width: 18, height: 18, color: "#6366f1" }} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Loading verified platform reports...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "64px 24px", textAlign: "center" }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: "var(--mz-surface-muted)",
                        color: "var(--mz-text-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 12px auto",
                      }}
                    >
                      <LuFileText style={{ width: 24, height: 24 }} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "var(--mz-text-body)", margin: "0 0 4px 0" }}>
                      No reports found
                    </p>
                    <p style={{ fontSize: 13, color: "var(--mz-text-muted)", margin: 0 }}>
                      {search ? "Try adjusting your search keywords" : "No student reports exist in this category yet"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r, idx) => {
                  const isCert = r.type === "Certification Report";
                  const isMcq = r.type === "MCQ Assessment Report";
                  const isProj = r.type === "Project Assessment Report";
                  const isCoding = r.type === "Coding Challenge Report";

                  const categoryBg = isCert ? "var(--mz-blue-bg)" : isMcq ? "var(--mz-green-bg)" : isProj ? "var(--mz-purple-bg)" : isCoding ? "var(--mz-green-bg)" : "var(--mz-indigo-bg)";
                  const categoryColor = isCert ? "#2563eb" : isMcq ? "#059669" : isProj ? "#7c3aed" : isCoding ? "#16a34a" : "#4f46e5";
                  const categoryBorder = isCert ? "var(--mz-blue-border)" : isMcq ? "var(--mz-green-border)" : isProj ? "var(--mz-purple-border)" : isCoding ? "var(--mz-green-border)" : "var(--mz-indigo-border)";

                  const initial = (r.recipient ? r.recipient[0] : "S").toUpperCase();
                  const isPass =
                    r.status === "PASSED" ||
                    r.status === "ACCEPTED" ||
                    r.grade === "Qualified" ||
                    r.grade === "Distinction" ||
                    r.grade === "First Class" ||
                    r.grade === "Passed" ||
                    r.grade === "Accepted";

                  return (
                    <tr
                      key={r.id || idx}
                      onClick={() => handleOpenReportModal(r)}
                      style={{
                        borderBottom: "1px solid var(--mz-surface-muted)",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mz-surface-subtle)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--mz-surface)")}
                    >
                      {/* Report Title */}
                      <td style={{ padding: "16px 24px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: categoryBg,
                              color: categoryColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {isCert ? (
                              <LuAward style={{ width: 16, height: 16 }} />
                            ) : isMcq ? (
                              <LuCircleCheck style={{ width: 16, height: 16 }} />
                            ) : isProj ? (
                              <LuFolderGit2 style={{ width: 16, height: 16 }} />
                            ) : isCoding ? (
                              <LuCode style={{ width: 16, height: 16 }} />
                            ) : (
                              <LuFileText style={{ width: 16, height: 16 }} />
                            )}
                          </div>
                          <div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--mz-text-primary)",
                                display: "block",
                                lineHeight: 1.4,
                              }}
                            >
                              {r.title}
                            </span>
                            {isMcq && (
                              <span style={{ fontSize: 11, color: "var(--mz-text-muted)" }}>
                                {r.accuracy ? `Accuracy: ${r.accuracy}` : "10 MCQs evaluated"}
                                {r.timeSpent ? ` • Time: ${r.timeSpent}` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Pill */}
                      <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: 16,
                            background: categoryBg,
                            color: categoryColor,
                            border: `1px solid ${categoryBorder}`,
                            display: "inline-block",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.type}
                        </span>
                      </td>

                      {/* Recipient Candidate */}
                      <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              background: "#3b82f6",
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mz-text-body)", display: "block" }}>
                              {r.recipient || "Candidate"}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--mz-text-subtle)", display: "block" }}>
                              {r.email || "No email"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Score / Grade */}
                      <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mz-text-primary)" }}>{r.score}</span>
                          <span style={{ color: "var(--mz-text-subtle)", fontSize: 12 }}>•</span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: isPass ? "#059669" : "#dc2626",
                            }}
                          >
                            {r.grade || (isPass ? "Qualified" : "Not Qualified")}
                          </span>
                        </div>
                      </td>

                      {/* Verification Code */}
                      <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                        <button
                          onClick={(e) => handleCopyCode(r.verificationCode, r.id, e)}
                          title="Click to copy verification code"
                          style={{
                            background: "var(--mz-blue-bg)",
                            border: "1px solid var(--mz-blue-border)",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#2563eb",
                            letterSpacing: "0.04em",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mz-blue-bg)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--mz-blue-bg)")}
                        >
                          {copiedCodeId === r.id ? (
                            <>
                              <LuCheck style={{ width: 12, height: 12, color: "#16a34a" }} />
                              <span style={{ color: "#16a34a" }}>Copied</span>
                            </>
                          ) : (
                            <>
                              <span>{r.verificationCode || "MZ-VERIF"}</span>
                              <LuCopy style={{ width: 11, height: 11, opacity: 0.7 }} />
                            </>
                          )}
                        </button>
                      </td>

                      {/* Date Issued */}
                      <td style={{ padding: "16px 18px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 12, color: "var(--mz-text-muted)" }}>
                          {r.date
                            ? new Date(r.date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Recent"}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "16px 24px", verticalAlign: "middle", textAlign: "right" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReportModal(r);
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#4f46e5",
                            background: "var(--mz-indigo-bg)",
                            border: "1px solid var(--mz-indigo-border)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#4f46e5";
                            e.currentTarget.style.color = "#ffffff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--mz-indigo-bg)";
                            e.currentTarget.style.color = "#4f46e5";
                          }}
                        >
                          <LuEye style={{ width: 14, height: 14 }} />
                          Inspect Report
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standardized 10-per-page Pagination Footer */}
        <AdminPagination
          page={page}
          totalPages={pagination?.totalPages || 1}
          totalRecords={pagination?.total ?? (stats.total || filteredReports.length || 0)}
          limit={10}
          onPageChange={(newPage) => setPage(newPage)}
          itemName="assessment reports"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          FULL DETAILED REPORT INSPECTION & MARKS EDITING MODAL
         ───────────────────────────────────────────────────────────────────────────── */}
      {activeReport && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setActiveReport(null)}
        >
          <div
            style={{
              background: "var(--mz-surface)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 980,
              height: "88vh",
              maxHeight: 900,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--mz-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--mz-surface-subtle)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background:
                      activeReport.type === "Certification Report"
                        ? "var(--mz-blue-bg)"
                        : activeReport.type === "MCQ Assessment Report"
                        ? "var(--mz-green-bg)"
                        : "var(--mz-purple-bg)",
                    color:
                      activeReport.type === "Certification Report"
                        ? "#2563eb"
                        : activeReport.type === "MCQ Assessment Report"
                        ? "#059669"
                        : "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {activeReport.type === "Certification Report" ? (
                    <LuAward style={{ width: 22, height: 22 }} />
                  ) : activeReport.type === "MCQ Assessment Report" ? (
                    <LuCircleCheck style={{ width: 22, height: 22 }} />
                  ) : (
                    <LuFileText style={{ width: 22, height: 22 }} />
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>
                      {activeReport.title || "Candidate Assessment Report"}
                    </h2>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "var(--mz-blue-bg)",
                        color: "#2563eb",
                        border: "1px solid var(--mz-blue-border)",
                      }}
                    >
                      {activeReport.verificationCode || activeReport.certificateId || "MZ-VERIFIED"}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--mz-text-muted)", margin: "4px 0 0 0" }}>
                    Candidate: <strong>{activeReport.recipient || activeReport.candidateName || "Student"}</strong>{" "}
                    ({activeReport.email || activeReport.candidateEmail || "Registered"}) • Submitted on{" "}
                    {activeReport.date
                      ? new Date(activeReport.date).toLocaleString()
                      : "Recent"}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#059669",
                    background: "var(--mz-green-bg)",
                    border: "1px solid var(--mz-green-border)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                  title="Print or save official PDF scorecard"
                >
                  <LuDownload style={{ width: 13, height: 13 }} />
                  <span>Download PDF Scorecard</span>
                </button>

                {Boolean(activeReport.reportUrl || activeReport.sessionId || activeReport.attemptId) && (
                  <button
                    type="button"
                    onClick={() => {
                      const url = activeReport.reportUrl || `/assessment-report/${activeReport.sessionId || activeReport.attemptId}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#4f46e5",
                      background: "var(--mz-indigo-bg)",
                      border: "1px solid var(--mz-indigo-border)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.15s ease",
                    }}
                    title="View candidate's full report in dedicated viewer"
                  >
                    <span>Open Full Report</span>
                    <LuExternalLink style={{ width: 13, height: 13 }} />
                  </button>
                )}

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "6px 12px",
                    borderRadius: 20,
                    background:
                      activeReport.status === "PASSED" ||
                      activeReport.status === "ACCEPTED" ||
                      activeReport.grade === "Qualified" ||
                      activeReport.grade === "Passed" ||
                      activeReport.grade === "Accepted"
                        ? "var(--mz-green-bg)"
                        : "var(--mz-red-bg)",
                    color:
                      activeReport.status === "PASSED" ||
                      activeReport.status === "ACCEPTED" ||
                      activeReport.grade === "Qualified" ||
                      activeReport.grade === "Passed" ||
                      activeReport.grade === "Accepted"
                        ? "#15803d"
                        : "#b91c1c",
                  }}
                >
                  {activeReport.status || activeReport.grade || "SUBMITTED"}
                </span>

                <button
                  onClick={() => setActiveReport(null)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: "1px solid var(--mz-border)",
                    background: "var(--mz-surface)",
                    color: "var(--mz-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <LuX style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>

            {/* Sub-tabs Navigation */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid var(--mz-border)",
                background: "var(--mz-surface)",
                padding: "0 24px",
                flexShrink: 0,
              }}
            >
              {[
                { id: "questions", label: "Questions Breakdown & Source Code", icon: LuFileText },
                { id: "evaluation", label: "Marks & Admin Feedback", icon: LuSave },
                { id: "audit", label: "Proctoring & Notification Tracking", icon: LuBell },
              ].map((tab) => {
                const isSelected = reportSubTab === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setReportSubTab(tab.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "14px 18px",
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? "#4f46e5" : "var(--mz-text-muted)",
                      borderBottom: isSelected ? "2px solid #4f46e5" : "2px solid transparent",
                      background: "none",
                      borderTop: "none",
                      borderLeft: "none",
                      borderRight: "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <IconComponent style={{ width: 16, height: 16 }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "var(--mz-surface-subtle)" }}>
              {loadingReport ? (
                <div style={{ padding: "60px 0", textAlign: "center" }}>
                  <LuRefreshCw
                    style={{
                      animation: "spin 1s linear infinite",
                      width: 24,
                      height: 24,
                      color: "#6366f1",
                      margin: "0 auto 12px auto",
                    }}
                  />
                  <p style={{ fontSize: 13, color: "var(--mz-text-muted)", margin: 0 }}>
                    Retrieving full breakdown and source evaluation...
                  </p>
                </div>
              ) : (
                <>
                  {/* TAB 1: QUESTIONS BREAKDOWN & SOURCE CODE */}
                  {reportSubTab === "questions" && (
                    <div>
                      {/* Metric Summary Cards */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: 14,
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            background: "var(--mz-surface)",
                            padding: "14px 16px",
                            borderRadius: 12,
                            border: "1px solid var(--mz-border)",
                          }}
                        >
                          <span style={{ fontSize: 11, color: "var(--mz-text-muted)", fontWeight: 600 }}>SCORE AWARDED</span>
                          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--mz-text-primary)", margin: "4px 0 0 0" }}>
                            {activeReport.score != null ? activeReport.score : activeReport.rawScore || 0}
                            <span style={{ fontSize: 13, color: "var(--mz-text-subtle)", fontWeight: 500 }}>
                              {" "}
                              / {activeReport.maxScore || 100}
                            </span>
                          </p>
                        </div>
                        <div
                          style={{
                            background: "var(--mz-surface)",
                            padding: "14px 16px",
                            borderRadius: 12,
                            border: "1px solid var(--mz-border)",
                          }}
                        >
                          <span style={{ fontSize: 11, color: "var(--mz-text-muted)", fontWeight: 600 }}>PERCENTAGE / ACCURACY</span>
                          <p style={{ fontSize: 20, fontWeight: 700, color: "#4f46e5", margin: "4px 0 0 0" }}>
                            {activeReport.percentage != null
                              ? `${activeReport.percentage}%`
                              : activeReport.accuracy || "N/A"}
                          </p>
                        </div>
                        <div
                          style={{
                            background: "var(--mz-surface)",
                            padding: "14px 16px",
                            borderRadius: 12,
                            border: "1px solid var(--mz-border)",
                          }}
                        >
                          <span style={{ fontSize: 11, color: "var(--mz-text-muted)", fontWeight: 600 }}>TEST / QUESTION COUNT</span>
                          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--mz-text-primary)", margin: "4px 0 0 0" }}>
                            {questionItems.length || activeReport.testResults?.length || 10} Items
                          </p>
                        </div>
                        <div
                          style={{
                            background: "var(--mz-surface)",
                            padding: "14px 16px",
                            borderRadius: 12,
                            border: "1px solid var(--mz-border)",
                          }}
                        >
                          <span style={{ fontSize: 11, color: "var(--mz-text-muted)", fontWeight: 600 }}>FINAL VERDICT</span>
                          <p
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color:
                                activeReport.status === "PASSED" || activeReport.grade === "Qualified"
                                  ? "#15803d"
                                  : "#b91c1c",
                              margin: "6px 0 0 0",
                            }}
                          >
                            {activeReport.status || activeReport.grade || "SUBMITTED"}
                          </p>
                        </div>
                      </div>

                      {/* Questions Breakdown List (for MCQs) */}
                      {questionItems.length > 0 && (
                        <div>
                          {/* MCQ Filter Bar */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 14,
                            }}
                          >
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>
                              Question-by-Question Evaluation ({questionItems.length} Questions)
                            </h3>
                            <div style={{ display: "flex", gap: 6 }}>
                              {[
                                { id: "all", label: "All" },
                                { id: "correct", label: "Correct" },
                                { id: "incorrect", label: "Incorrect" },
                                { id: "unanswered", label: "Unanswered" },
                              ].map((f) => (
                                <button
                                  key={f.id}
                                  onClick={() => setMcqFilter(f.id)}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: 14,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    border: mcqFilter === f.id ? "1px solid #4f46e5" : "1px solid var(--mz-border)",
                                    background: mcqFilter === f.id ? "#4f46e5" : "var(--mz-surface)",
                                    color: mcqFilter === f.id ? "#ffffff" : "var(--mz-text-muted)",
                                  }}
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {questionItems
                              .filter((q) => {
                                if (mcqFilter === "correct") return q.isCorrect;
                                if (mcqFilter === "incorrect") return !q.isCorrect && q.userChoice != null;
                                if (mcqFilter === "unanswered") return q.userChoice == null;
                                return true;
                              })
                              .map((q, qIdx) => {
                                const isCorrect = q.isCorrect;
                                const isUnanswered = q.userChoice == null;

                                return (
                                  <div
                                    key={q.id || qIdx}
                                    style={{
                                      background: "var(--mz-surface)",
                                      borderRadius: 12,
                                      border: isCorrect
                                        ? "1px solid var(--mz-green-border)"
                                        : isUnanswered
                                        ? "1px solid var(--mz-border)"
                                        : "1px solid var(--mz-red-border)",
                                      padding: 16,
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: 10,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 700,
                                          color: isCorrect ? "#15803d" : isUnanswered ? "var(--mz-text-muted)" : "#b91c1c",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 6,
                                        }}
                                      >
                                        {isCorrect ? (
                                          <LuCircleCheck style={{ width: 15, height: 15 }} />
                                        ) : isUnanswered ? (
                                          <LuCircleAlert style={{ width: 15, height: 15 }} />
                                        ) : (
                                          <LuCircleX style={{ width: 15, height: 15 }} />
                                        )}
                                        Question #{q.number}
                                      </span>

                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 600,
                                          padding: "2px 8px",
                                          borderRadius: 10,
                                          background: isCorrect ? "var(--mz-green-bg)" : isUnanswered ? "var(--mz-surface-muted)" : "var(--mz-red-bg)",
                                          color: isCorrect ? "#059669" : isUnanswered ? "var(--mz-text-muted)" : "#dc2626",
                                        }}
                                      >
                                        {isCorrect ? `+${q.marksAwarded} Mark` : "0 Marks"}
                                      </span>
                                    </div>

                                    <p
                                      style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "var(--mz-text-body)",
                                        margin: "0 0 12px 0",
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {q.question}
                                    </p>

                                    {/* Options */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                      {q.options?.map((opt, oIdx) => {
                                        const isChosen = q.userChoice === oIdx || q.userChoice === opt;
                                        const isAnswerKey = q.correctKey === oIdx || q.correctKey === opt;

                                        let optBg = "var(--mz-surface-subtle)";
                                        let optBorder = "var(--mz-border)";
                                        let optColor = "var(--mz-text-secondary)";

                                        if (isAnswerKey) {
                                          optBg = "var(--mz-green-bg)";
                                          optBorder = "var(--mz-green-border)";
                                          optColor = "#166534";
                                        }
                                        if (isChosen && !isAnswerKey) {
                                          optBg = "var(--mz-red-bg)";
                                          optBorder = "var(--mz-red-border)";
                                          optColor = "#991b1b";
                                        }

                                        return (
                                          <div
                                            key={oIdx}
                                            style={{
                                              padding: "8px 12px",
                                              borderRadius: 8,
                                              background: optBg,
                                              border: `1px solid ${optBorder}`,
                                              color: optColor,
                                              fontSize: 12,
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                            }}
                                          >
                                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                              <span
                                                style={{
                                                  width: 18,
                                                  height: 18,
                                                  borderRadius: "50%",
                                                  display: "inline-flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                  fontSize: 10,
                                                  fontWeight: 700,
                                                  background: isChosen ? optColor : "var(--mz-border)",
                                                  color: isChosen ? "#ffffff" : "var(--mz-text-muted)",
                                                }}
                                              >
                                                {String.fromCharCode(65 + oIdx)}
                                              </span>
                                              {opt}
                                            </span>

                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                              {isChosen && (
                                                <span
                                                  style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    padding: "2px 6px",
                                                    borderRadius: 4,
                                                    background: isCorrect ? "#15803d" : "#b91c1c",
                                                    color: "#ffffff",
                                                  }}
                                                >
                                                  Student's Selection
                                                </span>
                                              )}
                                              {isAnswerKey && (
                                                <span
                                                  style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    padding: "2px 6px",
                                                    borderRadius: 4,
                                                    background: "#059669",
                                                    color: "#ffffff",
                                                  }}
                                                >
                                                  Correct Key
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {q.explanation && (
                                      <p style={{ margin: "10px 0 0 0", fontSize: 11, color: "var(--mz-text-muted)", fontStyle: "italic" }}>
                                        💡 Explanation: {q.explanation}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Submitted Source Code View (for Coding assessments) */}
                      {activeReport.code && (
                        <div style={{ marginTop: 20 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 10,
                            }}
                          >
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>
                              Submitted Source Code ({activeReport.language || "Python"})
                            </h3>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(activeReport.code);
                                setCopiedCodeText(true);
                                setTimeout(() => setCopiedCodeText(false), 2000);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 10px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#4f46e5",
                                background: "var(--mz-surface)",
                                border: "1px solid var(--mz-indigo-border)",
                                cursor: "pointer",
                              }}
                            >
                              {copiedCodeText ? <LuCheck style={{ width: 13, height: 13 }} /> : <LuCopy style={{ width: 13, height: 13 }} />}
                              {copiedCodeText ? "Copied" : "Copy Source"}
                            </button>
                          </div>

                          <pre
                            style={{
                              background: "#0f172a",
                              color: "var(--mz-surface-subtle)",
                              borderRadius: 12,
                              padding: 18,
                              fontSize: 12,
                              fontFamily: "monospace",
                              overflowX: "auto",
                              lineHeight: 1.5,
                              border: "1px solid var(--mz-text-body)",
                            }}
                          >
                            <code>{activeReport.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: MARKS & ADMIN FEEDBACK */}
                  {reportSubTab === "evaluation" && (
                    <div style={{ maxWidth: 640, margin: "0 auto" }}>
                      <div
                        style={{
                          background: "var(--mz-surface)",
                          borderRadius: 16,
                          padding: 24,
                          border: "1px solid var(--mz-border)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                      >
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--mz-text-primary)", margin: "0 0 4px 0" }}>
                          Adjust Student Marks & Add Evaluation Feedback
                        </h3>
                        <p style={{ fontSize: 12, color: "var(--mz-text-muted)", margin: "0 0 20px 0" }}>
                          Modifying marks permanently updates MongoDB, sends an official notification email to the
                          candidate, and triggers an immediate in-app popup.
                        </p>

                        {/* Marks Input */}
                        <div style={{ marginBottom: 18 }}>
                          <label
                            style={{
                              display: "block",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--mz-text-secondary)",
                              marginBottom: 6,
                            }}
                          >
                            Marks Awarded (Max Allowed: {activeReport.maxScore || 100})
                          </label>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <input
                              type="number"
                              min="0"
                              max={activeReport.maxScore || 100}
                              value={editScoreValue}
                              onChange={(e) => setEditScoreValue(e.target.value)}
                              required
                              style={{
                                width: 140,
                                padding: "10px 14px",
                                borderRadius: 8,
                                border: "1px solid var(--mz-border-strong)",
                                fontSize: 16,
                                fontWeight: 700,
                                color: "var(--mz-text-primary)",
                                outline: "none",
                              }}
                            />
                            {/* Preset Buttons */}
                            <div style={{ display: "flex", gap: 6 }}>
                              {[
                                {
                                  label: "+1",
                                  val: Math.min(
                                    (Number(editScoreValue) || 0) + 1,
                                    activeReport.maxScore || 100
                                  ),
                                },
                                {
                                  label: "+2",
                                  val: Math.min(
                                    (Number(editScoreValue) || 0) + 2,
                                    activeReport.maxScore || 100
                                  ),
                                },
                                {
                                  label: "Max Score",
                                  val: activeReport.maxScore || 100,
                                },
                              ].map((btn, bIdx) => (
                                <button
                                  type="button"
                                  key={bIdx}
                                  onClick={() => setEditScoreValue(btn.val)}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#4f46e5",
                                    background: "var(--mz-indigo-bg)",
                                    border: "1px solid var(--mz-indigo-border)",
                                    cursor: "pointer",
                                  }}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Status Select */}
                        <div style={{ marginBottom: 18 }}>
                          <label
                            style={{
                              display: "block",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--mz-text-secondary)",
                              marginBottom: 6,
                            }}
                          >
                            Evaluation Status
                          </label>
                          <select
                            value={editStatusValue}
                            onChange={(e) => setEditStatusValue(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: 8,
                              border: "1px solid var(--mz-border-strong)",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--mz-text-primary)",
                              background: "var(--mz-surface)",
                              outline: "none",
                            }}
                          >
                            <option value="PASSED">PASSED / QUALIFIED</option>
                            <option value="FAILED">FAILED / NOT QUALIFIED</option>
                            <option value="UNDER_REVIEW">UNDER REVIEW</option>
                          </select>
                        </div>

                        {/* Admin Feedback Comment */}
                        <div style={{ marginBottom: 20 }}>
                          <label
                            style={{
                              display: "block",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--mz-text-secondary)",
                              marginBottom: 6,
                            }}
                          >
                            Official Admin Comments & Feedback (Sent to student via email & in-app)
                          </label>
                          <textarea
                            rows={4}
                            placeholder="Enter evaluation notes, marks adjustments rationale, or guidance for the student..."
                            value={editAdminNote}
                            onChange={(e) => setEditAdminNote(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: 8,
                              border: "1px solid var(--mz-border-strong)",
                              fontSize: 13,
                              color: "var(--mz-text-body)",
                              lineHeight: 1.5,
                              outline: "none",
                            }}
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          type="button"
                          onClick={handleSaveMarks}
                          disabled={savingMarks}
                          style={{
                            width: "100%",
                            padding: "12px 20px",
                            borderRadius: 10,
                            background: "#4f46e5",
                            color: "#ffffff",
                            fontSize: 14,
                            fontWeight: 700,
                            border: "none",
                            cursor: savingMarks ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                          }}
                        >
                          {savingMarks ? (
                            <>
                              <LuRefreshCw style={{ animation: "spin 1s linear infinite", width: 16, height: 16 }} />
                              Updating & Notifying Student...
                            </>
                          ) : (
                            <>
                              <LuSave style={{ width: 16, height: 16 }} />
                              Save Marks & Dispatch Notification
                            </>
                          )}
                        </button>
                      </div>

                      {/* Marks Revision Audit History */}
                      {activeReport.marksHistory && activeReport.marksHistory.length > 0 && (
                        <div
                          style={{
                            marginTop: 20,
                            background: "var(--mz-surface)",
                            borderRadius: 16,
                            padding: 20,
                            border: "1px solid var(--mz-border)",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--mz-text-primary)",
                              margin: "0 0 12px 0",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <LuHistory style={{ width: 15, height: 15, color: "#6366f1" }} />
                            Marks Audit Trail ({activeReport.marksHistory.length} revisions)
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {activeReport.marksHistory.map((rev, rIdx) => (
                              <div
                                key={rIdx}
                                style={{
                                  padding: "10px 14px",
                                  borderRadius: 8,
                                  background: "var(--mz-surface-subtle)",
                                  border: "1px solid var(--mz-border)",
                                  fontSize: 12,
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontWeight: 700, color: "var(--mz-text-body)" }}>
                                    Score: {rev.originalScore} ➔ {rev.newScore} ({rev.newStatus})
                                  </span>
                                  <span style={{ color: "var(--mz-text-subtle)" }}>
                                    {new Date(rev.modifiedAt || rev.date).toLocaleString()}
                                  </span>
                                </div>
                                {rev.adminNote && (
                                  <p style={{ margin: "4px 0 0 0", color: "var(--mz-text-muted)", fontStyle: "italic" }}>
                                    "{rev.adminNote}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: PROCTORING & NOTIFICATION TRACKING */}
                  {reportSubTab === "audit" && (
                    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
                      {/* Notification Delivery & Read Status Card */}
                      <div
                        style={{
                          background: "var(--mz-surface)",
                          borderRadius: 16,
                          padding: 20,
                          border: "1px solid var(--mz-border)",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--mz-text-primary)",
                            margin: "0 0 14px 0",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <LuBell style={{ width: 16, height: 16, color: "#4f46e5" }} />
                          Student Notification & View Tracking
                        </h4>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div
                            style={{
                              padding: "12px 14px",
                              borderRadius: 10,
                              background: activeReport.notificationEmailSent ? "var(--mz-green-bg)" : "var(--mz-surface-subtle)",
                              border: activeReport.notificationEmailSent ? "1px solid var(--mz-green-border)" : "1px solid var(--mz-border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mz-text-body)" }}>
                              Official Email Delivery Status
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: activeReport.notificationEmailSent ? "#16a34a" : "var(--mz-text-muted)",
                              }}
                            >
                              {activeReport.notificationEmailSent
                                ? `Delivered to ${activeReport.email || activeReport.candidateEmail}`
                                : "Pending / On Score Update"}
                            </span>
                          </div>

                          <div
                            style={{
                              padding: "12px 14px",
                              borderRadius: 10,
                              background: activeReport.notificationViewed ? "var(--mz-green-bg)" : "var(--mz-amber-bg)",
                              border: activeReport.notificationViewed ? "1px solid var(--mz-green-border)" : "1px solid var(--mz-amber-border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mz-text-body)" }}>
                              In-App Student Notification Status
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: activeReport.notificationViewed ? "#16a34a" : "#d97706",
                              }}
                            >
                              {activeReport.notificationViewed
                                ? `Viewed by student on ${new Date(activeReport.notificationViewedAt).toLocaleString()}`
                                : activeReport.notificationSent
                                ? "Delivered • Unread by student"
                                : "Ready for next update"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Proctoring Integrity Summary */}
                      <div
                        style={{
                          background: "var(--mz-surface)",
                          borderRadius: 16,
                          padding: 20,
                          border: "1px solid var(--mz-border)",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--mz-text-primary)",
                            margin: "0 0 14px 0",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <LuShieldCheck style={{ width: 16, height: 16, color: "#059669" }} />
                          Proctoring Security & Telemetry
                        </h4>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                          <div
                            style={{
                              padding: "12px",
                              borderRadius: 8,
                              background: "var(--mz-surface-subtle)",
                              border: "1px solid var(--mz-border)",
                              textAlign: "center",
                            }}
                          >
                            <span style={{ fontSize: 11, color: "var(--mz-text-muted)", display: "block" }}>Webcam Monitoring</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>Active & Verified</span>
                          </div>
                          <div
                            style={{
                              padding: "12px",
                              borderRadius: 8,
                              background: "var(--mz-surface-subtle)",
                              border: "1px solid var(--mz-border)",
                              textAlign: "center",
                            }}
                          >
                            <span style={{ fontSize: 11, color: "var(--mz-text-muted)", display: "block" }}>Tab Switches</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mz-text-primary)" }}>0 Detected</span>
                          </div>
                          <div
                            style={{
                              padding: "12px",
                              borderRadius: 8,
                              background: "var(--mz-surface-subtle)",
                              border: "1px solid var(--mz-border)",
                              textAlign: "center",
                            }}
                          >
                            <span style={{ fontSize: 11, color: "var(--mz-text-muted)", display: "block" }}>Audio Proctor</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>Normal Levels</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
