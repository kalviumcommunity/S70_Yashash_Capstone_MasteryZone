import React, { useState, useEffect } from "react";
import {
  LuCpu,
  LuSparkles,
  LuShieldCheck,
  LuRotateCcw,
} from "react-icons/lu";
import "./EvaluatingResultsLoader.css";

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

export default function EvaluatingResultsLoader({
  title = "Assessment",
  assignmentType = "Assessment",
  subtitle = "",
  isInline = false,
}) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % EVALUATION_PHASES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentPhase = EVALUATION_PHASES[phaseIndex];

  const content = (
    <div
      className="mz-eval-card"
      role="status"
      aria-live="polite"
      aria-label="Evaluating assessment results"
    >
      {/* Central Concentric Animated Emblem */}
      <div className="mz-eval-emblem-wrap">
        <div className="mz-eval-pulse-halo" />
        <div className="mz-eval-conic-ring" />
        <div className="mz-eval-core-circle">
          <LuCpu className="mz-eval-core-icon" />
        </div>
        <div className="mz-eval-sparkle-pill">
          <LuSparkles className="mz-eval-sparkle-icon" />
        </div>
      </div>

      {/* Top Status Pill */}
      <div className="mz-eval-status-pill">
        <span className="mz-eval-status-dot" />
        <span>Evaluation In Progress</span>
      </div>

      {/* Primary Headline */}
      <h2 className="mz-eval-title">
        Evaluating Results
        <span className="mz-eval-dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </h2>

      {/* Subtitle with Context */}
      <p className="mz-eval-subtitle">
        {subtitle || (
          <>
            Please wait while your submission for{" "}
            <strong>{title}</strong> is compiled, verified against test suites, and audited.
          </>
        )}
      </p>

      {/* Animated Linear Progress Bar */}
      <div className="mz-eval-progress-box">
        <div className="mz-eval-track">
          <div className="mz-eval-bar" />
          <div className="mz-eval-shimmer" />
        </div>
        <div className="mz-eval-phase-info">
          <span className="mz-eval-phase-text">
            <LuRotateCcw className="mz-eval-spin-icon" />
            <span key={phaseIndex} className="mz-eval-phase-fade">
              {currentPhase.label}
            </span>
          </span>
          <span className="mz-eval-phase-tag">{currentPhase.metric}</span>
        </div>
      </div>

      {/* Bottom Trust & Integrity Badge */}
      <div className="mz-eval-trust-footer">
        <LuShieldCheck className="mz-eval-trust-icon" />
        <span>MasteryZone Sandboxed Runner • Official Evaluation Ledger</span>
      </div>
    </div>
  );

  if (isInline) {
    return <div className="mz-eval-inline-wrap">{content}</div>;
  }

  return (
    <div
      className="mz-results-preparing-screen mz-eval-screen"
      data-testid="assessment-results-preparing"
    >
      {content}
    </div>
  );
}
