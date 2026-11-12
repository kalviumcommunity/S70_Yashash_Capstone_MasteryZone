import React, { useState, useEffect } from "react";
import {
  LuCpu,
  LuSparkles,
  LuShieldCheck,
  LuRotateCcw,
  LuSend,
  LuFileText,
  LuCircleCheck,
  LuAward,
} from "react-icons/lu";
import "./EvaluatingResultsLoader.css";

const SUBMISSION_PHASES = [
  {
    label: "Submitting assignment & initializing sandboxed test runner...",
    metric: "Phase 1/3",
  },
  {
    label: "Executing test cases, edge inputs & performance limits...",
    metric: "Phase 2/3",
  },
  {
    label: "Finalizing scorecard & compiling official audit report...",
    metric: "Phase 3/3",
  },
];

const EVALUATION_PHASES = [
  {
    label: "Compiling code & executing sandboxed test runner...",
    metric: "Phase 1/3",
  },
  {
    label: "Validating edge cases, accuracy & execution limits...",
    metric: "Phase 2/3",
  },
  {
    label: "Finalizing scorecard & generating audit report...",
    metric: "Phase 3/3",
  },
];

const NAVIGATION_PHASES = [
  {
    label: "Connecting to official verified audit ledger...",
    metric: "Step 1/3",
  },
  {
    label: "Loading scorecard telemetry & solution execution...",
    metric: "Step 2/3",
  },
  {
    label: "Opening your detailed performance report dashboard...",
    metric: "Step 3/3",
  },
];

export default function EvaluatingResultsLoader({
  title = "Assessment",
  assignmentType = "Assessment",
  subtitle = "",
  isInline = false,
  mode = null, // "submitting" | "evaluating" | "navigating"
  isNavigating = false,
  progress = null,
}) {
  const isNav = Boolean(isNavigating || mode === "navigating");
  const isAssignment = Boolean(
    mode === "submitting" ||
    (!isNav && (
      (assignmentType && /assignment/i.test(assignmentType)) ||
      (title && /assignment/i.test(title))
    ))
  );

  const activePhases = isNav
    ? NAVIGATION_PHASES
    : isAssignment
    ? SUBMISSION_PHASES
    : EVALUATION_PHASES;

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [smoothProgress, setSmoothProgress] = useState(
    typeof progress === "number" ? progress : isNav ? 35 : 20
  );

  // Clean title for display without duplicate "Assignment |" prefix
  const cleanTitle = (title || "Assessment").replace(/^Assignment\s*\|\s*/i, "").trim();

  // Cycle phase messages smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % activePhases.length);
    }, isNav ? 1400 : 1800);
    return () => clearInterval(interval);
  }, [activePhases.length, isNav]);

  // Smooth realistic progress animation
  useEffect(() => {
    if (typeof progress === "number") {
      setSmoothProgress(Math.min(100, Math.max(0, progress)));
      return;
    }

    const timer = setInterval(() => {
      setSmoothProgress((prev) => {
        if (isNav) {
          if (prev < 92) return prev + Math.floor(Math.random() * 8 + 6);
          return Math.min(98, prev + 1);
        } else {
          if (prev < 50) return prev + Math.floor(Math.random() * 5 + 4);
          if (prev < 80) return prev + Math.floor(Math.random() * 4 + 2);
          if (prev < 94) return prev + 1;
          return prev;
        }
      });
    }, 180);

    return () => clearInterval(timer);
  }, [progress, isNav]);

  const currentPhase = activePhases[phaseIndex] || activePhases[0];

  // Headings & Status texts
  const headline = isNav
    ? "Navigating to Report"
    : isAssignment
    ? "Submitting Assignment"
    : "Evaluating Results";

  const statusLabel = isNav
    ? "Opening Performance Report"
    : isAssignment
    ? "Assignment Submission In Progress"
    : "Evaluation In Progress";

  const defaultSubtitle = isNav ? (
    <>
      Please wait while your verified scorecard and official audit report for{" "}
      <strong>{cleanTitle}</strong> are retrieved.
    </>
  ) : isAssignment ? (
    <>
      Please wait while your assignment for <strong>{cleanTitle}</strong> is
      uploaded, tested against test runner suites, and audited.
    </>
  ) : (
    <>
      Please wait while your submission for <strong>{cleanTitle}</strong> is
      compiled, verified against test suites, and audited.
    </>
  );

  const content = (
    <div
      className={`mz-eval-card ${isNav ? "is-navigating" : isAssignment ? "is-submitting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={headline}
    >
      {/* Central Concentric Animated Emblem */}
      <div className="mz-eval-emblem-wrap">
        <div className={`mz-eval-pulse-halo ${isNav ? "nav-halo" : isAssignment ? "submit-halo" : ""}`} />
        <div className={`mz-eval-conic-ring ${isNav ? "nav-ring" : isAssignment ? "submit-ring" : ""}`} />
        <div className="mz-eval-core-circle">
          {isNav ? (
            <LuAward className="mz-eval-core-icon nav-icon" />
          ) : isAssignment ? (
            <LuSend className="mz-eval-core-icon submit-icon" />
          ) : (
            <LuCpu className="mz-eval-core-icon" />
          )}
        </div>
        <div className="mz-eval-sparkle-pill">
          {isNav ? (
            <LuCircleCheck className="mz-eval-sparkle-icon" />
          ) : (
            <LuSparkles className="mz-eval-sparkle-icon" />
          )}
        </div>
      </div>

      {/* Top Status Pill */}
      <div className={`mz-eval-status-pill ${isNav ? "navigating" : isAssignment ? "submitting" : ""}`}>
        <span className="mz-eval-status-dot" />
        <span>{statusLabel}</span>
      </div>

      {/* Primary Headline */}
      <h2 className="mz-eval-title">
        {headline}
        <span className="mz-eval-dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </h2>

      {/* Subtitle with Context */}
      <p className="mz-eval-subtitle">
        {subtitle || defaultSubtitle}
      </p>

      {/* Animated Linear Progress Bar */}
      <div className="mz-eval-progress-box">
        <div className="mz-eval-track">
          <div
            className={`mz-eval-bar ${isNav ? "nav-bar" : isAssignment ? "submit-bar" : ""}`}
            style={{ width: `${Math.max(8, Math.min(100, smoothProgress))}%` }}
          />
          <div className="mz-eval-shimmer" />
        </div>
        <div className="mz-eval-phase-info">
          <span className="mz-eval-phase-text">
            <LuRotateCcw className="mz-eval-spin-icon" />
            <span key={phaseIndex} className="mz-eval-phase-fade">
              {currentPhase.label}
            </span>
          </span>
          <span className="mz-eval-phase-tag">
            {currentPhase.metric} • {Math.round(smoothProgress)}%
          </span>
        </div>
      </div>

      {/* Bottom Trust & Integrity Badge */}
      <div className="mz-eval-trust-footer">
        <LuShieldCheck className="mz-eval-trust-icon" />
        <span>
          {isNav
            ? "MasteryZone Audit Ledger • Cryptographically Verified Report"
            : "MasteryZone Sandboxed Runner • Official Evaluation Ledger"}
        </span>
      </div>
    </div>
  );

  if (isInline) {
    return <div className="mz-eval-inline-wrap">{content}</div>;
  }

  return (
    <div
      className="mz-results-preparing-screen mz-eval-screen"
      data-testid={isNav ? "assessment-navigating-report" : "assessment-results-preparing"}
    >
      {content}
    </div>
  );
}
