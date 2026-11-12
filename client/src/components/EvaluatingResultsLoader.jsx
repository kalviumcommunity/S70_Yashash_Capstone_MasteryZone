import React from "react";
import "./EvaluatingResultsLoader.css";

/**
 * Simple loading indicator shown while a submission is being evaluated,
 * submitted, or while navigating to its report.
 * Props are kept backward compatible with previous usages.
 */
export default function EvaluatingResultsLoader({
  title = "Assessment",
  assignmentType = "Assessment",
  subtitle = "",
  isInline = false,
  mode = null, // "submitting" | "evaluating" | "navigating"
  isNavigating = false,
}) {
  const isNav = Boolean(isNavigating || mode === "navigating");
  const isAssignment = Boolean(
    mode === "submitting" ||
      (!isNav &&
        ((assignmentType && /assignment/i.test(assignmentType)) ||
          (title && /assignment/i.test(title))))
  );

  const label = isNav
    ? "Loading report..."
    : isAssignment
    ? "Submitting..."
    : "Evaluating...";

  const content = (
    <div className="mz-eval-simple" role="status" aria-live="polite" aria-label={label}>
      <span className="mz-eval-spinner" aria-hidden="true" />
      <span className="mz-eval-simple-label">{subtitle || label}</span>
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
