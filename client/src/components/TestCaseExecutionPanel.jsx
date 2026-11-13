import React, { useState, useMemo, useEffect } from "react";
import {
  LuPlay,
  LuLoader,
  LuCircleCheck,
  LuCircleX,
  LuCircle,
  LuClock,
  LuCopy,
  LuCheck,
  LuTerminal,
  LuTriangleAlert,
  LuSparkles,
  LuArrowRight,
  LuRotateCcw,
} from "react-icons/lu";
import { toast } from "react-toastify";
import "./TestCaseExecutionPanel.css";

/**
 * Reusable, Consistent, Professional Test Case Execution Component
 * for Mastery Zone (Certifications, Challenges, Modules, Projects, Live Platform).
 *
 * States per test case:
 * - "waiting": Not yet executed or pending execution.
 * - "running": Actively executing in the sandboxed runner.
 * - "passed": Output matches expected result.
 * - "failed": Output mismatch or runtime/compilation error.
 */
export default function TestCaseExecutionPanel({
  testCases = [],
  isRunning = false,
  onRunTests = null,
  selectedIndex = null,
  onSelectIndex = null,
  passThreshold = 0.8,
  onUseStdin = null,
  canRun = true,
  runButtonText = "Run Tests",
  customHeader = null,
  className = "",
  compact = false,
  theme = null,
  isDark = null,
  dataTestIdPrefix = "mz-testcase",
}) {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);

  const themeClass = isDark !== null ? (isDark ? "is-dark" : "is-light") : (theme ? `is-${theme}` : "");

  // Synchronize controlled vs uncontrolled index
  const activeIndex = selectedIndex !== null && selectedIndex !== undefined
    ? selectedIndex
    : internalSelectedIndex;

  const handleSelectCase = (idx) => {
    if (onSelectIndex) {
      onSelectIndex(idx);
    }
    setInternalSelectedIndex(idx);
  };

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Normalize test case states from various sources (compiler sandbox, project evaluator, judge runner)
  const normalizedCases = useMemo(() => {
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return [];
    }

    return testCases.map((tc, idx) => {
      const index = tc.index || tc.testIndex || idx + 1;
      const title = tc.name || tc.title || `Test Case ${index}`;
      const input = tc.input !== undefined && tc.input !== null ? String(tc.input) : "";
      const expectedOutput = tc.expectedOutput !== undefined && tc.expectedOutput !== null
        ? String(tc.expectedOutput)
        : (tc.expected !== undefined ? String(tc.expected) : "");
      const actualOutput = tc.actualOutput !== undefined && tc.actualOutput !== null
        ? String(tc.actualOutput)
        : (tc.actual !== undefined ? String(tc.actual) : "");
      const error = tc.error || null;
      const duration = tc.duration || tc.durationMs || null;
      const isHidden = Boolean(tc.isHidden);

      // Determine state: waiting, running, passed, failed
      let status = "waiting";
      let passed = null;

      if (isRunning) {
        status = "running";
      } else if (tc.passed === true || tc.passed === "true" || tc.status === "PASSED" || tc.status === "ACCEPTED" || tc.passed === 1) {
        status = "passed";
        passed = true;
      } else if (tc.passed === false || tc.passed === "false" || tc.status === "FAILED" || tc.status === "WRONG_ANSWER" || error) {
        status = "failed";
        passed = false;
      } else if (tc.status === "RUNNING") {
        status = "running";
      }

      return {
        ...tc,
        index,
        title,
        input,
        expectedOutput,
        actualOutput,
        error,
        duration,
        isHidden,
        status,
        passed,
      };
    });
  }, [testCases, isRunning]);

  // Aggregate stats
  const totalCount = normalizedCases.length;
  const passedCount = normalizedCases.filter((tc) => tc.status === "passed").length;
  const failedCount = normalizedCases.filter((tc) => tc.status === "failed").length;
  const isEvaluated = !isRunning && (passedCount > 0 || failedCount > 0);
  const isAllPassed = isEvaluated && passedCount === totalCount && totalCount > 0;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const meetsThreshold = totalCount > 0 && (passedCount / totalCount) >= passThreshold;

  // Selected item
  const activeCase = normalizedCases[activeIndex] || normalizedCases[0] || {};

  // Auto-select first failing test case on completion for quick debugging
  useEffect(() => {
    if (isEvaluated && !isAllPassed) {
      const firstFailIdx = normalizedCases.findIndex((tc) => tc.status === "failed");
      if (firstFailIdx !== -1 && activeIndex === 0 && normalizedCases[0]?.status === "passed") {
        handleSelectCase(firstFailIdx);
      }
    }
  }, [isEvaluated, isAllPassed]);

  return (
    <div
      className={`mz-tc-exec-panel ${compact ? "is-compact" : ""} ${themeClass} ${className}`.trim()}
      data-testid={dataTestIdPrefix === "pw-testcase" ? "pw-testcases-table" : "mz-testcases-panel"}
    >
      {/* 1. TOP HEADER SUMMARY & SUITE EXECUTION STATUS */}
      <div className="mz-tc-exec-header">
        <div className="mz-tc-exec-header-left">
          {customHeader || (
            <div className="mz-tc-suite-status">
              <span className="mz-tc-suite-title">Test Cases</span>
              <span className="mz-tc-suite-count-badge">
                {isEvaluated ? `${passedCount} / ${totalCount} Passed (${passRate}%)` : `${totalCount} Test Cases`}
              </span>
            </div>
          )}

          {/* Suite Evaluation State Pill */}
          {isRunning ? (
            <div className="mz-tc-eval-pill running">
              <LuLoader size={13} className="mz-tc-spin" />
              <span>Running Sandboxed Test Suite...</span>
            </div>
          ) : isAllPassed ? (
            <div className="mz-tc-eval-pill all-passed">
              <LuSparkles size={13} />
              <span>100% Tests Passed — Solution Verified</span>
            </div>
          ) : isEvaluated ? (
            <div className={`mz-tc-eval-pill ${meetsThreshold ? "passed" : "failed"}`}>
              {meetsThreshold ? <LuCircleCheck size={13} /> : <LuCircleX size={13} />}
              <span>{meetsThreshold ? "Passing Criteria Satisfied" : "Keep Revising"}</span>
            </div>
          ) : null}
        </div>

        {/* Action Button: Run Tests */}
        {onRunTests && (
          <div className="mz-tc-exec-header-right">
            <button
              type="button"
              className={`mz-tc-btn-run-tests ${isRunning ? "is-loading" : ""}`}
              disabled={isRunning || !canRun}
              onClick={onRunTests}
              title="Execute solution against automated test cases (Ctrl+Enter)"
            >
              {isRunning ? (
                <>
                  <LuLoader size={13} className="mz-tc-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <LuPlay size={13} fill="currentColor" />
                  <span>{runButtonText}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 2. PROGRESS STRIP ACROSS TESTS */}
      {isEvaluated && totalCount > 0 && (
        <div className="mz-tc-progress-bar-track">
          <div
            className="mz-tc-progress-fill passed"
            style={{ width: `${(passedCount / totalCount) * 100}%` }}
            title={`Passed: ${passedCount}/${totalCount}`}
          />
          <div
            className="mz-tc-progress-fill failed"
            style={{ width: `${(failedCount / totalCount) * 100}%` }}
            title={`Failed: ${failedCount}/${totalCount}`}
          />
        </div>
      )}

      {/* 3. MAIN TWO-COLUMN SPLIT: TEST CASE LIST (LEFT) & DETAIL VIEW (RIGHT) */}
      {normalizedCases.length === 0 ? (
        <div className="mz-tc-empty-state" style={{ padding: "40px 20px", textAlign: "center", color: "var(--mz-text-secondary, #94a3b8)" }}>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>No test cases configured for this problem.</p>
        </div>
      ) : (
      <div className="mz-tc-body-split">
        {/* Left Sidebar: Test Cases List */}
        <div className="mz-tc-sidebar-list" role="tablist" aria-label="Test Cases List">
          {normalizedCases.map((tc, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <button
                key={tc.index || idx}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-testid={`${dataTestIdPrefix}-row-${tc.index || idx + 1}`}
                className={`mz-tc-item ${tc.status} ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelectCase(idx)}
              >
                <div className="mz-tc-item-left">
                  <span className="mz-tc-item-status-icon">
                    {tc.status === "running" && (
                      <LuLoader size={14} className="mz-tc-spin text-blue" />
                    )}
                    {tc.status === "passed" && (
                      <LuCircleCheck size={15} className="text-green" />
                    )}
                    {tc.status === "failed" && (
                      <LuCircleX size={15} className="text-red" />
                    )}
                    {tc.status === "waiting" && (
                      <LuCircle size={14} className="text-muted" />
                    )}
                  </span>
                  <span className="mz-tc-item-label">
                    {tc.title}
                  </span>
                </div>

                <div className="mz-tc-item-right">
                  {tc.status === "running" && (
                    <span className="mz-tc-badge running">Running</span>
                  )}
                  {tc.status === "passed" && (
                    <span className="mz-tc-badge passed">
                      {tc.duration ? `${tc.duration}ms` : "Passed"}
                    </span>
                  )}
                  {tc.status === "failed" && (
                    <span className="mz-tc-badge failed">
                      {tc.duration ? `${tc.duration}ms` : "Failed"}
                    </span>
                  )}
                  {tc.status === "waiting" && (
                    <span className="mz-tc-badge waiting">Waiting</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detail Pane: Active Test Case Specifications & Execution Results */}
        <div className="mz-tc-detail-pane" role="tabpanel">
          {activeCase && (
            <div className="mz-tc-detail-content">
              {/* Detail Header Strip */}
              <div className="mz-tc-detail-top-strip">
                <div className="mz-tc-detail-title-wrap">
                  <span className="mz-tc-detail-case-heading">
                    {activeCase.title || `Test Case #${activeCase.index}`}
                  </span>
                  <span className={`mz-tc-detail-state-pill ${activeCase.status}`}>
                    {activeCase.status === "running" && (
                      <>
                        <LuLoader size={12} className="mz-tc-spin" />
                        <span>Evaluating...</span>
                      </>
                    )}
                    {activeCase.status === "passed" && (
                      <>
                        <LuCircleCheck size={12} />
                        <span>Passed {activeCase.duration ? `(${activeCase.duration}ms)` : ""}</span>
                      </>
                    )}
                    {activeCase.status === "failed" && (
                      <>
                        <LuCircleX size={12} />
                        <span>Failed {activeCase.duration ? `(${activeCase.duration}ms)` : ""}</span>
                      </>
                    )}
                    {activeCase.status === "waiting" && (
                      <>
                        <LuClock size={12} />
                        <span>Waiting to Run</span>
                      </>
                    )}
                  </span>
                  {activeCase.isHidden && (
                    <span className="mz-tc-hidden-badge" title="Hidden Assessment Test Case">
                      Hidden Spec
                    </span>
                  )}
                </div>

                {onUseStdin && activeCase.input && !activeCase.isHidden && (
                  <button
                    type="button"
                    className="mz-tc-btn-use-stdin"
                    onClick={() => onUseStdin(activeCase.input)}
                    title="Load this test case input into the interactive STDIN terminal"
                  >
                    <LuTerminal size={12} />
                    <span>Use in STDIN</span>
                  </button>
                )}
              </div>

              {/* Execution State Blocks */}
              <div className="mz-tc-io-stack">
                {/* 1. INPUT */}
                <div className="mz-tc-io-card">
                  <div className="mz-tc-io-card-header">
                    <span className="mz-tc-io-label">Input</span>
                    {activeCase.input && !activeCase.isHidden && (
                      <button
                        type="button"
                        className="mz-tc-btn-copy"
                        onClick={() => handleCopy(activeCase.input, `input_${activeCase.index}`)}
                        title="Copy Input"
                      >
                        {copiedKey === `input_${activeCase.index}` ? (
                          <LuCheck size={11} className="text-green" />
                        ) : (
                          <LuCopy size={11} />
                        )}
                        <span>{copiedKey === `input_${activeCase.index}` ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <pre className="mz-tc-code-box">
                    <code>
                      {activeCase.isHidden
                        ? "[Hidden Test Case — Input is strictly isolated on the assessment backend]"
                        : (activeCase.input || "[Empty Input]")}
                    </code>
                  </pre>
                </div>

                {/* 2. EXPECTED OUTPUT */}
                <div className="mz-tc-io-card">
                  <div className="mz-tc-io-card-header">
                    <span className="mz-tc-io-label">Expected Output</span>
                    {activeCase.expectedOutput && !activeCase.isHidden && (
                      <button
                        type="button"
                        className="mz-tc-btn-copy"
                        onClick={() => handleCopy(activeCase.expectedOutput, `expected_${activeCase.index}`)}
                        title="Copy Expected Output"
                      >
                        {copiedKey === `expected_${activeCase.index}` ? (
                          <LuCheck size={11} className="text-green" />
                        ) : (
                          <LuCopy size={11} />
                        )}
                        <span>{copiedKey === `expected_${activeCase.index}` ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <pre className="mz-tc-code-box">
                    <code>
                      {activeCase.isHidden
                        ? "[Hidden Expected Output — Graded cryptographically]"
                        : (activeCase.expectedOutput || "[Empty Expected Output]")}
                    </code>
                  </pre>
                </div>

                {/* 3. ACTUAL OUTPUT / ERROR */}
                <div className="mz-tc-io-card">
                  <div className="mz-tc-io-card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="mz-tc-io-label">Actual Output</span>
                      {activeCase.duration && (
                        <span className="mz-tc-exec-time-pill">
                          ⏱ {activeCase.duration}ms
                        </span>
                      )}
                    </div>
                    {activeCase.actualOutput && (
                      <button
                        type="button"
                        className="mz-tc-btn-copy"
                        onClick={() => handleCopy(activeCase.actualOutput, `actual_${activeCase.index}`)}
                        title="Copy Actual Output"
                      >
                        {copiedKey === `actual_${activeCase.index}` ? (
                          <LuCheck size={11} className="text-green" />
                        ) : (
                          <LuCopy size={11} />
                        )}
                        <span>{copiedKey === `actual_${activeCase.index}` ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>

                  {activeCase.status === "running" ? (
                    <div className="mz-tc-running-placeholder">
                      <LuLoader size={18} className="mz-tc-spin text-blue" />
                      <span>Executing in isolated sandbox runner...</span>
                    </div>
                  ) : activeCase.status === "waiting" ? (
                    <pre className="mz-tc-code-box is-waiting">
                      <code>[Test case has not been executed yet. Click &apos;Run Tests&apos; to evaluate.]</code>
                    </pre>
                  ) : (
                    <div className="mz-tc-output-container">
                      <pre className={`mz-tc-code-box ${activeCase.status === "passed" ? "is-passed" : "is-failed"}`}>
                        <code>
                          {activeCase.actualOutput !== undefined && activeCase.actualOutput !== null && String(activeCase.actualOutput).length > 0
                            ? activeCase.actualOutput
                            : "(No output produced)"}
                        </code>
                      </pre>

                      {/* Error or Traceback Block */}
                      {activeCase.error && (
                        <div className="mz-tc-error-box">
                          <div className="mz-tc-error-header">
                            <LuTriangleAlert size={13} />
                            <span>Execution Diagnostic / Traceback</span>
                          </div>
                          <pre className="mz-tc-error-body">
                            <code>{activeCase.error}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
