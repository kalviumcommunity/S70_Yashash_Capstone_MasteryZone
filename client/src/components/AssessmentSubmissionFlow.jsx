import React from "react";
import { useNavigate } from "react-router-dom";
import "./AssessmentSubmissionFlow.css";
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
}) {
  const navigate = useNavigate();

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
    if (typeof onViewReport === "function") {
      onViewReport();
    } else {
      navigate(targetReportUrl, { replace: true });
    }
  };

  const handleNavigateReturn = () => {
    if (typeof onReturn === "function") {
      onReturn();
    } else {
      navigate("/coding", { replace: true });
    }
  };

  // ---------------------------------------------------------------------------
  // 1. STAGE: PREPARING RESULTS (Single Clean Animated Progress Bar)
  // ---------------------------------------------------------------------------
  if (stage === "preparing") {
    return (
      <div className="mz-results-preparing-screen" data-testid="assessment-results-preparing">
        <div className="mz-results-preparing-card mz-simple-loading-card">
          <h2 className="mz-preparing-title">Loading Results...</h2>

          <p className="mz-preparing-subtitle">
            Please wait while your submission is being evaluated.
          </p>

          <div className="mz-simple-progress-bar">
            <div className="mz-simple-progress-fill" />
          </div>
        </div>
      </div>
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

          <div className="mz-report-ready-actions">
            <button
              type="button"
              className="mz-view-report-primary-btn"
              onClick={handleNavigateToReport}
              data-testid="view-assessment-report-btn"
            >
              <LuFileText size={18} />
              <span>View Report</span>
              <LuArrowRight size={18} />
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
                  background: "#f8fafc",
                  color: "#334155",
                  fontSize: 14,
                  fontWeight: 600,
                  border: "1.5px solid #cbd5e1",
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
