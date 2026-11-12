import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AssessmentSubmissionFlow.css";
import EvaluatingResultsLoader from "./EvaluatingResultsLoader";
import {
  LuRefreshCw,
  LuCircleCheck,
  LuCircleAlert,
  LuClock,
  LuAward,
  LuArrowRight,
  LuRotateCcw,
  LuArrowLeft,
  LuShieldCheck,
  LuFileText,
} from "react-icons/lu";

export default function AssessmentSubmissionFlow({
  stage = "preparing", // "preparing" | "ready" | "error"
  title = "Assessment",
  assignmentType = "Assessment",
  attemptNumber = 1,
  summary = null,
  summaryData = null,
  sessionId = "",
  reportUrl = "",
  errorMessage = "",
  onViewReport = null,
  onRetake = null,
  onReturn = null,
  autoNavigate = false,
  autoNavigateDelay = 3,
}) {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [countdown, setCountdown] = useState(
    autoNavigate ? (typeof autoNavigate === "number" ? autoNavigate : autoNavigateDelay) : null
  );

  const data = summaryData || summary || {};
  const hasScore = data.score !== undefined || data.scoreObtained !== undefined;
  const rawScore = data.score !== undefined ? data.score : data.scoreObtained;
  const score = hasScore ? Number(rawScore) : 0;
  const totalMarks = Number(data.totalMarks || data.maxMarks || 100);
  const percentage = data.percentage !== undefined
    ? Number(data.percentage)
    : hasScore
    ? Math.round((score / Math.max(1, totalMarks)) * 100)
    : 0;
  const grade = data.grade || (hasScore ? (percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 60 ? "B" : percentage >= 40 ? "C" : "F") : "Pending");
  const passedTests = data.passedTests !== undefined ? Number(data.passedTests) : (data.passedCount !== undefined ? Number(data.passedCount) : 0);
  const totalTests = data.totalTests !== undefined ? Number(data.totalTests) : (data.totalCount !== undefined ? Number(data.totalCount) : 0);
  const isPassed = Boolean(data.passed === true || data.status === "PASSED" || (hasScore && percentage >= (data.passingThreshold || 80)));

  const resolvedSessionId =
    sessionId ||
    data.sessionId ||
    data.attemptId ||
    localStorage.getItem("mz_last_assessment_report_sid") ||
    "report";

  const targetReportUrl = reportUrl || `/assessment-report/${resolvedSessionId}`;

  const handleNavigateToReport = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setTimeout(() => {
      if (typeof onViewReport === "function") {
        onViewReport();
      } else {
        navigate(targetReportUrl, { replace: true });
      }
    }, 700);
  };

  // Optional auto-redirect countdown to smooth out workflow from submit to report
  useEffect(() => {
    if (stage !== "ready" || countdown === null || isNavigating) return;
    if (countdown <= 0) {
      handleNavigateToReport();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [stage, countdown, isNavigating]);

  const handleNavigateReturn = () => {
    if (typeof onReturn === "function") {
      onReturn();
    } else {
      navigate("/coding", { replace: true });
    }
  };

  // ---------------------------------------------------------------------------
  // 0. STAGE: NAVIGATING TO REPORT (Simple & Good Loading Animation)
  // ---------------------------------------------------------------------------
  if (isNavigating) {
    return (
      <EvaluatingResultsLoader
        title={title}
        assignmentType={assignmentType}
        mode="navigating"
        isNavigating={true}
        subtitle="Opening your official performance report and verified ledger..."
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 1. STAGE: PREPARING RESULTS (Simple & Good Loading Animation)
  // ---------------------------------------------------------------------------
  if (stage === "preparing") {
    return (
      <EvaluatingResultsLoader
        title={title}
        assignmentType={assignmentType}
        mode={assignmentType.toLowerCase().includes("assignment") ? "submitting" : "evaluating"}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 2. STAGE: REPORT READY
  // ---------------------------------------------------------------------------
  if (stage === "ready") {
    return (
      <div className="mz-report-ready-screen" data-testid="assessment-report-ready">
        <div className="mz-report-ready-card">
          <div className="mz-report-ready-badge-wrapper">
            <div className="mz-report-ready-check-icon">
              <LuCircleCheck size={44} color="#10b981" />
            </div>
          </div>

          <div className="mz-report-ready-tag">
            <LuShieldCheck size={14} /> Evaluation Complete • Verified
          </div>

          <h2 className="mz-report-ready-title">Your Report Is Ready!</h2>

          <p className="mz-report-ready-subtitle">
            Your results for <strong>{title}</strong> have been evaluated, graded, and permanently saved to your audit ledger. Click below to view your full performance report.
          </p>

          <div className="mz-report-summary-box">
            <div className="mz-summary-row">
              <span className="mz-summary-label">Assessment:</span>
              <span className="mz-summary-value">{title}</span>
            </div>
            <div className="mz-summary-row">
              <span className="mz-summary-label">Score Obtained:</span>
              <span className={`mz-summary-value ${isPassed ? "pass" : "fail"}`}>
                {score} / {totalMarks} Marks
              </span>
            </div>
            <div className="mz-summary-row">
              <span className="mz-summary-label">Grade / Accuracy:</span>
              <span className="mz-summary-value">
                {percentage}% (Grade {grade})
              </span>
            </div>
            <div className="mz-summary-row">
              <span className="mz-summary-label">Verification Status:</span>
              <span className={`mz-summary-badge ${isPassed ? "pass" : "fail"}`}>
                {isPassed ? "Criteria Met (Passed)" : "Below Passing Threshold"}
              </span>
            </div>
            {data.details ? (
              <div className="mz-summary-row">
                <span className="mz-summary-label">Details:</span>
                <span className="mz-summary-value">{data.details}</span>
              </div>
            ) : totalTests > 1 ? (
              <div className="mz-summary-row">
                <span className="mz-summary-label">Test Cases Passed:</span>
                <span className="mz-summary-value">
                  {passedTests} / {totalTests} Passed
                </span>
              </div>
            ) : null}
            <div className="mz-summary-row">
              <span className="mz-summary-label">Attempt:</span>
              <span className="mz-summary-value">Attempt #{attemptNumber}</span>
            </div>
          </div>

          {countdown !== null && (
            <div
              className="mz-report-autonav-banner"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                width: "100%",
                padding: "10px 16px",
                borderRadius: "10px",
                background: "rgba(37, 99, 235, 0.08)",
                border: "1px solid rgba(37, 99, 235, 0.22)",
                color: "var(--mz-accent-primary, #2563eb)",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "16px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#2563eb",
                    boxShadow: "0 0 8px rgba(37, 99, 235, 0.7)",
                    display: "inline-block",
                  }}
                />
                <span>
                  Navigating to official report in <strong>{countdown}s</strong>...
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCountdown(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--mz-text-muted, #64748b)",
                  fontSize: "12px",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Pause
              </button>
            </div>
          )}

          <div className="mz-report-ready-actions">
            <button
              type="button"
              className="mz-view-report-primary-btn"
              onClick={handleNavigateToReport}
              disabled={isNavigating}
              data-testid="view-assessment-report-btn"
            >
              {isNavigating ? (
                <>
                  <LuRefreshCw size={18} className="mz-spin" />
                  <span>Loading Report...</span>
                </>
              ) : (
                <>
                  <LuFileText size={18} />
                  <span>View Report</span>
                  <LuArrowRight size={18} />
                </>
              )}
            </button>

            <div className="mz-report-secondary-actions">
              {onRetake && (
                <button
                  type="button"
                  className="mz-report-secondary-btn"
                  onClick={onRetake}
                  data-testid="retake-assessment-btn"
                >
                  <LuRotateCcw size={15} />
                  <span>Retake Assessment</span>
                </button>
              )}

              <button
                type="button"
                className="mz-report-secondary-btn mz-return-dashboard-btn"
                onClick={handleNavigateReturn}
                data-testid="return-dashboard-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 12,
                  background: "var(--mz-surface-subtle)",
                  color: "var(--mz-text-secondary)",
                  fontSize: 14,
                  fontWeight: 600,
                  border: "1.5px solid var(--mz-border-strong)",
                  cursor: "pointer",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <LuArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. STAGE: ERROR
  // ---------------------------------------------------------------------------
  return (
    <div className="mz-report-ready-screen" data-testid="assessment-report-error">
      <div className="mz-report-ready-card error-state">
        <div className="mz-report-ready-badge-wrapper" style={{ background: "rgba(239, 68, 68, 0.15)", borderColor: "#ef4444" }}>
          <div className="mz-report-ready-check-icon" style={{ background: "#ef4444" }}>
            <LuCircleAlert size={44} color="#ffffff" />
          </div>
        </div>

        <div className="mz-report-ready-tag" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", borderColor: "rgba(239, 68, 68, 0.3)" }}>
          Evaluation Warning
        </div>

        <h2 className="mz-report-ready-title">Submission Could Not Complete</h2>

        <p className="mz-report-ready-subtitle">
          {errorMessage || "We encountered an issue while finalizing your report. Your code was preserved and your attempt has not been deducted."}
        </p>

        <div className="mz-report-ready-actions">
          {onRetake ? (
            <button
              type="button"
              className="mz-view-report-primary-btn"
              onClick={onRetake}
            >
              <LuRotateCcw size={18} />
              <span>Retry Submission</span>
            </button>
          ) : (
            <button
              type="button"
              className="mz-view-report-primary-btn"
              onClick={handleNavigateToReport}
            >
              <LuFileText size={18} />
              <span>Inspect Available Ledger</span>
            </button>
          )}

          <div className="mz-report-secondary-actions">
            <button
              type="button"
              className="mz-report-secondary-btn mz-return-dashboard-btn"
              onClick={handleNavigateReturn}
            >
              <LuArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
