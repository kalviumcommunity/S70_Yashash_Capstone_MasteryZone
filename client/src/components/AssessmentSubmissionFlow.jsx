import React from "react";
import { useNavigate } from "react-router-dom";
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
  const score = data.score !== undefined ? data.score : 100;
  const totalMarks = data.totalMarks || 100;
  const grade = data.grade || (score >= 90 ? "A+" : score >= 80 ? "A" : "B");
  const passedTests = data.passedTests !== undefined ? data.passedTests : 10;
  const totalTests = data.totalTests || 10;
  const isPassed = data.passed !== undefined ? data.passed : score >= 80;

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
  // 1. STAGE: PREPARING RESULTS
  // ---------------------------------------------------------------------------
  if (stage === "preparing") {
    return (
      <div className="mz-results-preparing-screen" data-testid="assessment-results-preparing">
        <div className="mz-results-preparing-card">
          <div className="mz-preparing-loader-wrapper">
            <div className="mz-preparing-pulse-ring" />
            <div className="mz-preparing-spinner-core">
              <LuRefreshCw className="mz-spin" size={32} color="#2563eb" />
            </div>
          </div>

          <div className="mz-preparing-badge">
            <LuShieldCheck size={14} /> Evaluation In Progress
          </div>

          <h2 className="mz-preparing-title">Your Results Are Being Prepared...</h2>

          <p className="mz-preparing-subtitle">
            Our automated evaluation engine is evaluating your {assignmentType.toLowerCase()} submission in an isolated, secure execution sandbox. Your final score, verification metrics, and accreditation report are being generated.
          </p>

          <div className="mz-preparing-steps-list">
            <div className="mz-preparing-step done">
              <LuCircleCheck size={17} />
              <span>Submission Captured & Cryptographically Hashed</span>
            </div>
            <div className="mz-preparing-step active">
              <LuRefreshCw className="mz-spin" size={17} />
              <span>Running Test Suite & Grading Accuracy Matrix...</span>
            </div>
            <div className="mz-preparing-step pending">
              <LuClock size={17} />
              <span>Persisting Official Verified Assessment Report</span>
            </div>
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
                {score}% (Grade {grade})
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
                className="mz-report-secondary-btn"
                onClick={handleNavigateReturn}
                data-testid="return-dashboard-btn"
              >
                <LuArrowLeft size={15} />
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
              className="mz-report-secondary-btn"
              onClick={handleNavigateReturn}
            >
              <LuArrowLeft size={15} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
