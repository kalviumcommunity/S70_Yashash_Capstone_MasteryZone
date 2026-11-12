import React from "react";
import "./EvaluatingResultsLoader.css";

/**
 * Modern, clean, and highly visible loading component for
 * evaluation, submission, and report navigation.
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

  const cleanTitle = (title || "Assessment").replace(/^Assignment\s*\|\s*/i, "").trim();

  // Clear, readable title and description
  const headline = isNav
    ? "Loading Report..."
    : isAssignment
    ? "Submitting Assignment..."
    : "Evaluating Submission...";

  const description =
    subtitle ||
    (isNav
      ? `Opening performance report for ${cleanTitle}.`
      : isAssignment
      ? `Uploading and verifying ${cleanTitle} against test suites.`
      : `Executing code and validating test cases for ${cleanTitle}.`);

  const content = (
    <div
      className="mz-eval-simple-card"
      role="status"
      aria-live="polite"
      aria-label={headline}
    >
      {/* Prominent, clean circular loading spinner */}
      <div className="mz-eval-spinner-wrapper">
        <div className="mz-eval-spinner-ring" />
      </div>

      {/* Clear, bold headline */}
      <h3 className="mz-eval-simple-title">{headline}</h3>

      {/* Readable subtitle */}
      <p className="mz-eval-simple-desc">{description}</p>

      {/* Smooth, simple indeterminate progress line */}
      <div className="mz-eval-linear-track" aria-hidden="true">
        <div className="mz-eval-linear-indicator" />
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
