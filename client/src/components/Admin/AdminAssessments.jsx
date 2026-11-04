import React, { useState, useEffect } from "react";
import {
  LuFileText,
  LuTrophy,
  LuCircleCheck,
  LuCircleX,
  LuCircleAlert,
  LuSearch,
  LuEye,
  LuRefreshCw,
  LuAward,
  LuCode,
  LuFolderGit2,
  LuDownload,
  LuCopy,
  LuCheck,
  LuSave,
  LuHistory,
  LuBell,
  LuShieldCheck,
  LuShieldAlert,
  LuClock,
  LuUser,
  LuMail,
  LuX,
  LuExternalLink,
} from "react-icons/lu";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminAssessments = () => {
  const [data, setData] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [filterType, setFilterType] = useState("all"); // "all" | "Certification" | "MCQ Assessment" | "Coding Assessment" | "Project Assignment"
  const [search, setSearch] = useState("");
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // Full Details Modal State
  const [activeReport, setActiveReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportSubTab, setReportSubTab] = useState("questions"); // "questions" | "evaluation" | "audit"
  const [mcqFilter, setMcqFilter] = useState("all"); // "all" | "correct" | "incorrect" | "unanswered"
  const [copiedCodeText, setCopiedCodeText] = useState(false);
  const [activeProjectFileIdx, setActiveProjectFileIdx] = useState(0);

  // Marks Editing State
  const [editScoreValue, setEditScoreValue] = useState("");
  const [editStatusValue, setEditStatusValue] = useState("");
  const [editAdminNote, setEditAdminNote] = useState("");
  const [savingMarks, setSavingMarks] = useState(false);

  const fetchAssessments = async (selectedRange = range, showToast = false) => {
    try {
      if (showToast) setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/assessments?range=${selectedRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
          // Backend returns sorted 'assessments' array
          if (json.assessments && Array.isArray(json.assessments)) {
            setAssessments(json.assessments);
          } else {
            // Fallback mapper if old format
            const certs = (json.certificationAttempts || []).map((c) => {
              const pct = c.percentage != null ? c.percentage : (c.score != null ? c.score : 0);
              const isPassed = c.status === "PASSED" || c.finalVerdict === "PASSED" || pct >= 70;
              return {
                id: c._id,
                rawId: c._id,
                itemType: "certification",
                attemptId: c.attemptId,
                user: c.candidateName || c.userId?.fullName || c.userId?.username || "Candidate",
                email: c.candidateEmail || c.userId?.email || "",
                title: c.certTitle || "Data Structures & Algorithms (DSA)",
                type: "Certification",
                category: "Certification",
                score: `${pct}%`,
                rawScore: pct,
                maxScore: 100,
                status: isPassed ? "Passed" : c.status === "IN_PROGRESS" ? "In Progress" : "Failed",
                passed: isPassed,
                date: c.submittedAt || c.createdAt,
                timeSpent: c.durationMinutes ? `${c.durationMinutes}m` : "N/A",
                verificationCode: c.certificateId || String(c.attemptId || c._id).slice(-8).toUpperCase(),
                raw: c,
              };
            });
            const mcqs = (json.moduleAttempts || []).map((m) => {
              const totalQ = m.totalQuestions || 10;
              const scoreVal = m.score != null ? m.score : 0;
              const pct = m.percentage != null ? m.percentage : Math.round((scoreVal / totalQ) * 100);
              return {
                id: m._id,
                rawId: m._id,
                itemType: "module",
                attemptId: m.sessionId || m._id,
                user: m.userId?.fullName || m.userId?.username || "Candidate",
                email: m.userId?.email || "",
                title: m.assessmentTitle || m.moduleTitle || "Module MCQ Test",
                type: "MCQ Assessment",
                category: "MCQ Assessment",
                score: `${scoreVal}/${totalQ} (${pct}%)`,
                rawScore: scoreVal,
                maxScore: totalQ,
                status: m.passed ? "Passed" : "Failed",
                passed: Boolean(m.passed),
                date: m.submittedAt || m.createdAt,
                timeSpent: m.timeSpentSeconds ? `${Math.round(m.timeSpentSeconds / 60)}m` : "N/A",
                verificationCode: String(m.sessionId || m._id).slice(-8).toUpperCase(),
                raw: m,
              };
            });
            setAssessments([...certs, ...mcqs].sort((a, b) => new Date(b.date) - new Date(a.date)));
          }
          if (showToast) toast.success("Assessments synchronized with database");
        }
      }
    } catch (err) {
      console.error("Assessments fetch error:", err);
      if (showToast) toast.error("Failed to fetch assessments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments(range);

    // Socket.io real-time listener for assessment submissions and marks updates
    let socket = null;
    try {
      socket = io(window.location.origin, {
        auth: { token: localStorage.getItem("token") },
      });

      socket.on("connect", () => {
        socket.emit("join_admin_monitoring");
      });

      // Handle new submissions live
      const handleNewAssessmentRecord = () => {
        fetchAssessments(range);
      };

      socket.on("NEW_SUBMISSION", handleNewAssessmentRecord);
      socket.on("NEW_CERTIFICATE", handleNewAssessmentRecord);
      socket.on("NEW_MCQ_REPORT", handleNewAssessmentRecord);

      // Handle marks modified across system
      socket.on("ASSESSMENT_MARKS_UPDATED", (updateData) => {
        if (!updateData) return;
        setAssessments((prev) =>
          prev.map((item) => {
            const match =
              item.id === updateData.id ||
              item.rawId === updateData.id ||
              item.attemptId === updateData.id ||
              (updateData.itemType === item.itemType && String(item.id) === String(updateData.id));
            if (match) {
              const newScoreFormatted =
                item.itemType === "module"
                  ? `${updateData.newScore}/${item.maxScore || 10} (${Math.round((updateData.newScore / (item.maxScore || 10)) * 100)}%)`
                  : `${updateData.newScore}%`;
              const isPassed = updateData.newStatus === "PASSED" || updateData.newStatus === "Passed" || updateData.newStatus === "QUALIFIED";
              return {
                ...item,
                score: newScoreFormatted,
                rawScore: updateData.newScore,
                status: isPassed ? "Passed" : "Failed",
                passed: isPassed,
              };
            }
            return item;
          })
        );
      });
    } catch (e) {
      console.warn("Socket initialization error in AdminAssessments:", e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [range]);

  const stats = data?.stats || {
    total: assessments.length,
    passed: assessments.filter((a) => a.passed).length,
    passPercentage: assessments.length > 0 ? Math.round((assessments.filter((a) => a.passed).length / assessments.length) * 100) : 0,
    certificationsCount: assessments.filter((a) => a.type === "Certification").length,
    mcqCount: assessments.filter((a) => a.type === "MCQ Assessment").length,
    codingCount: assessments.filter((a) => a.type === "Coding Assessment").length,
    projectCount: assessments.filter((a) => a.type === "Project Assignment").length,
  };

  // Filtered List
  const filteredList = assessments.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      item.user?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.title?.toLowerCase().includes(q) ||
      item.verificationCode?.toLowerCase().includes(q) ||
      item.score?.toLowerCase().includes(q);

    let matchType = true;
    if (filterType === "Certification") matchType = item.type === "Certification";
    else if (filterType === "MCQ Assessment") matchType = item.type === "MCQ Assessment";
    else if (filterType === "Coding Assessment") matchType = item.type === "Coding Assessment";
    else if (filterType === "Project Assignment") matchType = item.type === "Project Assignment";

    return matchSearch && matchType;
  });

  // Export to CSV
  const exportToCSV = () => {
    if (filteredList.length === 0) {
      toast.info("No assessments available to export");
      return;
    }
    const headers = [
      "Candidate Name",
      "Email Address",
      "Assessment Title",
      "Category",
      "Score",
      "Status",
      "Verification Code",
      "Completed At",
    ];

    const rows = filteredList.map((item) => [
      `"${(item.user || "").replace(/"/g, '""')}"`,
      `"${(item.email || "").replace(/"/g, '""')}"`,
      `"${(item.title || "").replace(/"/g, '""')}"`,
      `"${(item.type || "").replace(/"/g, '""')}"`,
      `"${(item.score || "").replace(/"/g, '""')}"`,
      `"${(item.status || "").replace(/"/g, '""')}"`,
      `"${(item.verificationCode || "").replace(/"/g, '""')}"`,
      `"${item.date ? new Date(item.date).toLocaleString() : "N/A"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `masteryzone_assessments_${filterType.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredList.length} assessment records to CSV!`);
  };

  // Open Full Details Report Modal
  const handleOpenDetails = async (item) => {
    try {
      setLoadingReport(true);
      setActiveReport({
        ...item,
        itemType: item.itemType || (item.type === "Certification" ? "certification" : "module"),
      });
      setReportSubTab("questions");
      setMcqFilter("all");
      setActiveProjectFileIdx(0);

      const itemType = item.itemType || (item.type === "Certification" ? "certification" : "module");
      const itemId = item.rawId || item.id || item.attemptId;

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
          return;
        }
      }

      // Fallback
      setEditScoreValue(item.rawScore != null ? item.rawScore : 0);
      setEditStatusValue(item.status || "Passed");
      setEditAdminNote("");
    } catch (err) {
      console.warn("Details fetch notice:", err);
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
      toast.error(`Marks must be between 0 and ${maxAllowed}`);
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

        fetchAssessments(range);
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

  // Resolved Questions for the Details Breakdown
  const questionItems =
    activeReport?.reviewBreakdown && activeReport.reviewBreakdown.length > 0
      ? activeReport.reviewBreakdown.map((q, idx) => ({
          id: q.id || idx,
          number: q.questionNumber || idx + 1,
          question: q.question || q.questionText,
          options: q.options || [],
          userChoice: q.userSelected != null ? q.userSelected : q.studentChoice,
          correctKey: q.correctIndex != null ? q.correctIndex : q.correctOptionIndex,
          isCorrect: q.isCorrect,
          marksAwarded: q.marksAwarded != null ? q.marksAwarded : q.isCorrect ? 1 : 0,
          explanation: q.explanation,
          topic: q.topic,
          difficulty: q.difficulty,
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
          topic: q.topic,
          difficulty: q.difficulty,
        }))
      : [];

  return (
    <div style={{ padding: "28px 36px", background: "#f8fafc", minHeight: "100vh", fontFamily: "inherit" }}>
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
              background: "#ede9fe",
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
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
              Assessments & Examination Management
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>
              Manage MCQ assessments, proctored examinations, and official certification results.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Date Filter */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              color: "#334155",
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

          {/* Sync Button */}
          <button
            onClick={() => fetchAssessments(range, true)}
            title="Refresh database records"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            <LuRefreshCw style={{ width: 14, height: 14 }} />
            Sync
          </button>

          {/* Export to CSV */}
          <button
            onClick={exportToCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
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
            <LuDownload style={{ width: 15, height: 15 }} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Total Tests */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "18px 22px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#ede9fe",
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LuFileText style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Total Tests Taken
            </span>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "2px 0 0 0" }}>
              {stats.total ? Number(stats.total).toLocaleString() : 0}
            </p>
          </div>
        </div>

        {/* Passed Exams */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "18px 22px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#ecfdf5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LuCircleCheck style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Passed Exams
            </span>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#059669", margin: "2px 0 0 0" }}>
              {stats.passed ? Number(stats.passed).toLocaleString() : 0}
            </p>
          </div>
        </div>

        {/* Overall Pass Rate */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "18px 22px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LuTrophy style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Overall Pass Rate
            </span>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "2px 0 0 0" }}>
              {stats.passPercentage ?? 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Row */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 340px", maxWidth: 460 }}>
          <LuSearch
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              width: 17,
              height: 17,
            }}
          />
          <input
            type="text"
            placeholder="Search candidate name, email, or assessment title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 40px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              fontSize: 13,
              color: "#1e293b",
              outline: "none",
              background: "#f8fafc",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#6366f1";
              e.target.style.background = "#ffffff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.background = "#f8fafc";
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <LuX style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Tests", count: stats.total },
            { id: "Certification", label: "Certifications", count: stats.certificationsCount },
            { id: "MCQ Assessment", label: "MCQ Assessments", count: stats.mcqCount },
            { id: "Coding Assessment", label: "Coding Challenges", count: stats.codingCount },
            { id: "Project Assignment", label: "Projects", count: stats.projectCount },
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
                  border: isActive ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                  background: isActive ? "#4f46e5" : "#ffffff",
                  color: isActive ? "#ffffff" : "#64748b",
                  boxShadow: isActive ? "0 2px 6px rgba(79, 70, 229, 0.2)" : "none",
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 10,
                    background: isActive ? "rgba(255,255,255,0.22)" : "#f1f5f9",
                    color: isActive ? "#ffffff" : "#475569",
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Container */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          overflow: "hidden",
        }}
      >
        {/* Table Subheader */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Genuine Assessment Submissions
            </h2>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0 0" }}>
              Real attempts from registered student examinations
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#059669",
                background: "#ecfdf5",
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
                fontWeight: 700,
                color: "#4f46e5",
                background: "#eef2ff",
                padding: "4px 12px",
                borderRadius: 20,
              }}
            >
              {filteredList.length} Records
            </span>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th
                  style={{
                    padding: "12px 24px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 200,
                  }}
                >
                  Candidate
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 280,
                  }}
                >
                  Assessment Title
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 140,
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 120,
                  }}
                >
                  Score
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 120,
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    minWidth: 140,
                  }}
                >
                  Completed At
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    textAlign: "right",
                    minWidth: 110,
                  }}
                >
                  Inspect
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <LuRefreshCw style={{ animation: "spin 1s linear infinite", width: 18, height: 18, color: "#6366f1" }} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Loading assessments from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "64px 24px", textAlign: "center" }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: "#f1f5f9",
                        color: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 12px auto",
                      }}
                    >
                      <LuFileText style={{ width: 24, height: 24 }} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: "0 0 4px 0" }}>
                      No assessment records found
                    </p>
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                      {search ? "No submissions match your search query" : "No genuine student submissions in this category"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const initial = (item.user ? item.user[0] : "C").toUpperCase();
                  const isPass = item.passed || item.status === "Passed" || item.status === "PASSED" || item.status === "Qualified";

                  // Category badge styling
                  let catBg = "#eff6ff";
                  let catColor = "#2563eb";
                  let catBorder = "#bfdbfe";

                  if (item.type === "Certification") {
                    catBg = "#ede9fe";
                    catColor = "#6366f1";
                    catBorder = "#c7d2fe";
                  } else if (item.type === "MCQ Assessment") {
                    catBg = "#ecfdf5";
                    catColor = "#059669";
                    catBorder = "#a7f3d0";
                  } else if (item.type === "Project Assignment") {
                    catBg = "#fffbeb";
                    catColor = "#d97706";
                    catBorder = "#fde68a";
                  }

                  return (
                    <tr
                      key={item.id || idx}
                      onClick={() => handleOpenDetails(item)}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                    >
                      {/* Candidate */}
                      <td style={{ padding: "16px 24px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
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
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", display: "block" }}>
                              {item.user}
                            </span>
                            <span style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>
                              {item.email || "Registered Student"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Title */}
                      <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", display: "block", lineHeight: 1.4 }}>
                          {item.title}
                        </span>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: 16,
                            background: catBg,
                            color: catColor,
                            border: `1px solid ${catBorder}`,
                            display: "inline-block",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.type}
                        </span>
                      </td>

                      {/* Score */}
                      <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                          {item.score}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 18px", verticalAlign: "middle" }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: 12,
                            background: isPass ? "#ecfdf5" : item.status === "In Progress" ? "#eff6ff" : "#fef2f2",
                            color: isPass ? "#059669" : item.status === "In Progress" ? "#2563eb" : "#dc2626",
                            display: "inline-block",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "16px 18px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          {item.date
                            ? new Date(item.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
                            : "Recent"}
                        </span>
                      </td>

                      {/* Inspect */}
                      <td style={{ padding: "16px 24px", verticalAlign: "middle", textAlign: "right" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(item);
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#4f46e5",
                            background: "#eef2ff",
                            border: "1px solid #c7d2fe",
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
                            e.currentTarget.style.background = "#eef2ff";
                            e.currentTarget.style.color = "#4f46e5";
                          }}
                        >
                          <LuEye style={{ width: 14, height: 14 }} />
                          <span>Details</span>
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

      {/* ─────────────────────────────────────────────────────────────────────────────
          FULL PROFESSIONAL ASSESSMENT DETAILS MODAL
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
              background: "#ffffff",
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
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
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
                      activeReport.itemType === "certification" || activeReport.type === "Certification"
                        ? "#ede9fe"
                        : activeReport.itemType === "module" || activeReport.type === "MCQ Assessment"
                        ? "#ecfdf5"
                        : activeReport.itemType === "coding"
                        ? "#eff6ff"
                        : "#fffbeb",
                    color:
                      activeReport.itemType === "certification" || activeReport.type === "Certification"
                        ? "#6366f1"
                        : activeReport.itemType === "module" || activeReport.type === "MCQ Assessment"
                        ? "#059669"
                        : activeReport.itemType === "coding"
                        ? "#2563eb"
                        : "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {activeReport.itemType === "certification" ? (
                    <LuAward style={{ width: 22, height: 22 }} />
                  ) : activeReport.itemType === "module" ? (
                    <LuCircleCheck style={{ width: 22, height: 22 }} />
                  ) : activeReport.itemType === "coding" ? (
                    <LuCode style={{ width: 22, height: 22 }} />
                  ) : (
                    <LuFolderGit2 style={{ width: 22, height: 22 }} />
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      {activeReport.title || "Assessment Submission Details"}
                    </h2>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      {activeReport.verificationCode || activeReport.certificateId || "MZ-VERIFIED"}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0 0" }}>
                    Candidate: <strong>{activeReport.candidateName || activeReport.user || "Student"}</strong>{" "}
                    ({activeReport.candidateEmail || activeReport.email || "Registered"}) • Attempt ID:{" "}
                    <code>{activeReport.attemptId || activeReport.sessionId || activeReport.id}</code>
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "6px 12px",
                    borderRadius: 20,
                    background:
                      activeReport.passed ||
                      activeReport.status === "PASSED" ||
                      activeReport.status === "Passed" ||
                      activeReport.grade === "Qualified" ||
                      activeReport.grade === "Distinction"
                        ? "#dcfce7"
                        : "#fee2e2",
                    color:
                      activeReport.passed ||
                      activeReport.status === "PASSED" ||
                      activeReport.status === "Passed" ||
                      activeReport.grade === "Qualified" ||
                      activeReport.grade === "Distinction"
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
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#64748b",
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
                borderBottom: "1px solid #e2e8f0",
                background: "#ffffff",
                padding: "0 24px",
                flexShrink: 0,
              }}
            >
              {[
                { id: "questions", label: "Questions Breakdown & Submissions", icon: LuFileText },
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
                      color: isSelected ? "#4f46e5" : "#64748b",
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
            <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#f8fafc" }}>
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
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                    Retrieving full assessment attempt telemetry and questions breakdown...
                  </p>
                </div>
              ) : (
                <>
                  {/* TAB 1: QUESTIONS BREAKDOWN & SUBMISSIONS */}
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
                            background: "#ffffff",
                            padding: "14px 16px",
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>SCORE AWARDED</span>
                          <p style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "4px 0 0 0" }}>
                            {activeReport.score != null ? activeReport.score : activeReport.rawScore || 0}
                            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
                              {" "}
                              / {activeReport.maxScore || 100}
                            </span>
                          </p>
                        </div>

                        <div
                          style={{
                            background: "#ffffff",
                            padding: "14px 16px",
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>PERCENTAGE / ACCURACY</span>
                          <p style={{ fontSize: 20, fontWeight: 700, color: "#4f46e5", margin: "4px 0 0 0" }}>
                            {activeReport.percentage != null
                              ? `${activeReport.percentage}%`
                              : activeReport.accuracy || "N/A"}
                          </p>
                        </div>

                        <div
                          style={{
                            background: "#ffffff",
                            padding: "14px 16px",
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>EVALUATION ITEMS</span>
                          <p style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "4px 0 0 0" }}>
                            {questionItems.length ||
                              activeReport.codingSubmissions?.length ||
                              activeReport.totalTests ||
                              activeReport.files?.length ||
                              10}{" "}
                            Units
                          </p>
                        </div>

                        <div
                          style={{
                            background: "#ffffff",
                            padding: "14px 16px",
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>FINAL VERDICT</span>
                          <p
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color:
                                activeReport.passed ||
                                activeReport.status === "PASSED" ||
                                activeReport.status === "Passed"
                                  ? "#15803d"
                                  : "#b91c1c",
                              margin: "6px 0 0 0",
                            }}
                          >
                            {activeReport.status || activeReport.grade || "SUBMITTED"}
                          </p>
                        </div>
                      </div>

                      {/* Question-by-Question Breakdown (MCQs) */}
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
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>
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
                                    border: mcqFilter === f.id ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                                    background: mcqFilter === f.id ? "#4f46e5" : "#ffffff",
                                    color: mcqFilter === f.id ? "#ffffff" : "#64748b",
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
                                      background: "#ffffff",
                                      borderRadius: 12,
                                      border: isCorrect
                                        ? "1px solid #bbf7d0"
                                        : isUnanswered
                                        ? "1px solid #e2e8f0"
                                        : "1px solid #fecaca",
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
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span
                                          style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: isCorrect ? "#15803d" : isUnanswered ? "#64748b" : "#b91c1c",
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
                                        {q.topic && (
                                          <span
                                            style={{
                                              fontSize: 10,
                                              padding: "2px 6px",
                                              borderRadius: 4,
                                              background: "#f1f5f9",
                                              color: "#475569",
                                              fontWeight: 600,
                                            }}
                                          >
                                            {q.topic}
                                          </span>
                                        )}
                                      </div>

                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 600,
                                          padding: "2px 8px",
                                          borderRadius: 10,
                                          background: isCorrect ? "#ecfdf5" : isUnanswered ? "#f1f5f9" : "#fef2f2",
                                          color: isCorrect ? "#059669" : isUnanswered ? "#64748b" : "#dc2626",
                                        }}
                                      >
                                        {isCorrect ? `+${q.marksAwarded} Mark` : "0 Marks"}
                                      </span>
                                    </div>

                                    <p
                                      style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "#1e293b",
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

                                        let optBg = "#f8fafc";
                                        let optBorder = "#e2e8f0";
                                        let optColor = "#334155";

                                        if (isAnswerKey) {
                                          optBg = "#ecfdf5";
                                          optBorder = "#86efac";
                                          optColor = "#166534";
                                        }
                                        if (isChosen && !isAnswerKey) {
                                          optBg = "#fef2f2";
                                          optBorder = "#fca5a5";
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
                                                  background: isChosen ? optColor : "#e2e8f0",
                                                  color: isChosen ? "#ffffff" : "#64748b",
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
                                      <p style={{ margin: "10px 0 0 0", fontSize: 11, color: "#64748b", fontStyle: "italic" }}>
                                        💡 Explanation: {q.explanation}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Coding Submissions inside Certification Attempts */}
                      {activeReport.codingSubmissions && activeReport.codingSubmissions.length > 0 && (
                        <div style={{ marginTop: 24 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                            Submitted Coding Solutions ({activeReport.codingSubmissions.length} Challenges)
                          </h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {activeReport.codingSubmissions.map((cs, cIdx) => (
                              <div
                                key={cs._id || cIdx}
                                style={{
                                  background: "#ffffff",
                                  borderRadius: 12,
                                  border: "1px solid #e2e8f0",
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
                                  <div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                      Problem: {cs.questionId || `Coding Task #${cIdx + 1}`}
                                    </span>
                                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 10 }}>
                                      Language: <strong>{cs.language || "Python"}</strong> • Tests Passed:{" "}
                                      <strong>
                                        {cs.passedTests || 0}/{cs.totalTests || 10}
                                      </strong>
                                    </span>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: "3px 8px",
                                      borderRadius: 6,
                                      background: cs.solved ? "#ecfdf5" : "#fef2f2",
                                      color: cs.solved ? "#059669" : "#dc2626",
                                    }}
                                  >
                                    {cs.solved ? "SOLVED" : "INCOMPLETE"}
                                  </span>
                                </div>

                                <pre
                                  style={{
                                    background: "#0f172a",
                                    color: "#f8fafc",
                                    borderRadius: 10,
                                    padding: 14,
                                    fontSize: 12,
                                    fontFamily: "monospace",
                                    overflowX: "auto",
                                    lineHeight: 1.5,
                                    margin: 0,
                                  }}
                                >
                                  <code>{cs.code || "# No code submitted"}</code>
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Standalone Coding Challenge Code */}
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
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>
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
                                background: "#ffffff",
                                border: "1px solid #c7d2fe",
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
                              color: "#f8fafc",
                              borderRadius: 12,
                              padding: 18,
                              fontSize: 12,
                              fontFamily: "monospace",
                              overflowX: "auto",
                              lineHeight: 1.5,
                              border: "1px solid #1e293b",
                            }}
                          >
                            <code>{activeReport.code}</code>
                          </pre>
                        </div>
                      )}

                      {/* Project Files Breakdown */}
                      {activeReport.files && activeReport.files.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
                            Submitted Project Source Files ({activeReport.files.length} Files)
                          </h3>
                          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                            {activeReport.files.map((f, fIdx) => (
                              <button
                                key={fIdx}
                                onClick={() => setActiveProjectFileIdx(fIdx)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: activeProjectFileIdx === fIdx ? 700 : 500,
                                  background: activeProjectFileIdx === fIdx ? "#4f46e5" : "#ffffff",
                                  color: activeProjectFileIdx === fIdx ? "#ffffff" : "#475569",
                                  border: "1px solid #e2e8f0",
                                  cursor: "pointer",
                                }}
                              >
                                {f.name}
                              </button>
                            ))}
                          </div>
                          <pre
                            style={{
                              background: "#0f172a",
                              color: "#f8fafc",
                              borderRadius: 12,
                              padding: 16,
                              fontSize: 12,
                              fontFamily: "monospace",
                              overflowX: "auto",
                              lineHeight: 1.5,
                            }}
                          >
                            <code>{activeReport.files[activeProjectFileIdx]?.content || "// Empty file"}</code>
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
                          background: "#ffffff",
                          borderRadius: 16,
                          padding: 24,
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                      >
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>
                          Adjust Student Marks & Add Evaluation Feedback
                        </h3>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 20px 0" }}>
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
                              color: "#334155",
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
                                border: "1px solid #cbd5e1",
                                fontSize: 16,
                                fontWeight: 700,
                                color: "#0f172a",
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
                                    background: "#eef2ff",
                                    border: "1px solid #c7d2fe",
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
                              color: "#334155",
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
                              border: "1px solid #cbd5e1",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#0f172a",
                              background: "#ffffff",
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
                              color: "#334155",
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
                              border: "1px solid #cbd5e1",
                              fontSize: 13,
                              color: "#1e293b",
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
                            background: "#ffffff",
                            borderRadius: 16,
                            padding: 20,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#0f172a",
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
                                  background: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                  fontSize: 12,
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontWeight: 700, color: "#1e293b" }}>
                                    Score: {rev.originalScore ?? rev.oldScore} ➔ {rev.newScore} ({rev.newStatus})
                                  </span>
                                  <span style={{ color: "#94a3b8" }}>
                                    {new Date(rev.modifiedAt || rev.date).toLocaleString()}
                                  </span>
                                </div>
                                {rev.adminNote && (
                                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontStyle: "italic" }}>
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
                          background: "#ffffff",
                          borderRadius: 16,
                          padding: 20,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0f172a",
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
                              background: activeReport.notificationEmailSent ? "#f0fdf4" : "#f8fafc",
                              border: activeReport.notificationEmailSent ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                              Official Email Delivery Status
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: activeReport.notificationEmailSent ? "#16a34a" : "#64748b",
                              }}
                            >
                              {activeReport.notificationEmailSent
                                ? `Delivered to ${activeReport.candidateEmail || activeReport.email}`
                                : "Pending / On Score Update"}
                            </span>
                          </div>

                          <div
                            style={{
                              padding: "12px 14px",
                              borderRadius: 10,
                              background: activeReport.notificationViewed ? "#f0fdf4" : "#fffbeb",
                              border: activeReport.notificationViewed ? "1px solid #bbf7d0" : "1px solid #fde68a",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
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
                          background: "#ffffff",
                          borderRadius: 16,
                          padding: 20,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0f172a",
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
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              textAlign: "center",
                            }}
                          >
                            <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Webcam Monitoring</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>
                              {activeReport.proctoring?.violationsCount > 0 ? "Violations Detected" : "Active & Compliant"}
                            </span>
                          </div>

                          <div
                            style={{
                              padding: "12px",
                              borderRadius: 8,
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              textAlign: "center",
                            }}
                          >
                            <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Tab Switches</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                              {activeReport.proctoring?.tabSwitches != null ? `${activeReport.proctoring.tabSwitches} Detected` : "0 Detected"}
                            </span>
                          </div>

                          <div
                            style={{
                              padding: "12px",
                              borderRadius: 8,
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              textAlign: "center",
                            }}
                          >
                            <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Audio / Violation Flags</span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: (activeReport.proctoring?.violationsCount || 0) > 0 ? "#dc2626" : "#059669",
                              }}
                            >
                              {activeReport.proctoring?.violationsCount || 0} Flags
                            </span>
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

export default AdminAssessments;
