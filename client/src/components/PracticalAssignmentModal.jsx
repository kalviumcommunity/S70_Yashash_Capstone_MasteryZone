import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import MasteryZoneCompilerWorkspace from "./MasteryZoneCompilerWorkspace";
import AssessmentSubmissionFlow from "./AssessmentSubmissionFlow";
import {
  LuLaptop,
  LuCheck,
  LuCircleCheck,
  LuTriangleAlert,
  LuArrowRight,
  LuRotateCcw,
  LuTrophy,
  LuSparkles,
  LuX,
  LuClock,
  LuFileText,
  LuSend,
  LuLightbulb,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function PracticalAssignmentModal({
  module: propModule,
  subjectKey = "coding",
  trackId: propTrackId,
  onClose,
  onAssignmentPassed,
  onLaunchAssessment,
  isStandalone = false,
}) {
  const { trackId: paramTrackId, moduleId: paramModuleId } = useParams();
  const navigate = useNavigate();

  const [module, setModule] = useState(propModule || null);
  const [loading, setLoading] = useState(!propModule);

  const tId = propTrackId || paramTrackId || module?.trackId || "python";
  const mIdx = module?.moduleIndex ?? (paramModuleId !== undefined ? parseInt(paramModuleId, 10) : 0);
  const isCoding = subjectKey === "coding" || Boolean(module?.codingExercise);

  // Language setup for coding
  const defaultLang =
    tId === "python"
      ? "python"
      : tId === "javascript" || tId === "webdev" || tId === "dsa"
      ? "javascript"
      : tId === "java"
      ? "java"
      : tId === "cpp"
      ? "cpp"
      : "python";

  const [activeExercise, setActiveExercise] = useState(propModule?.codingExercise || null);
  const [initialCode, setInitialCode] = useState(propModule?.codingExercise?.starterCode || "");
  const [historyData, setHistoryData] = useState(null);

  // Non-coding practical assignment state
  const [userSubmissionText, setUserSubmissionText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [submissionFlowStage, setSubmissionFlowStage] = useState(null); // null | "preparing" | "ready" | "error"

  // Fetch module if standalone / not supplied via prop
  useEffect(() => {
    if (propModule) {
      setModule(propModule);
      if (propModule.codingExercise) {
        setActiveExercise(propModule.codingExercise);
        setInitialCode(propModule.codingExercise.starterCode || "");
      }
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`${API_BASE}/api/coding/curriculum/${tId}/${mIdx}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setModule(data);
          if (data.codingExercise) {
            setActiveExercise(data.codingExercise);
            setInitialCode(data.codingExercise.starterCode || "");
          }
        }
      })
      .catch((err) => console.error("Failed to load assignment module:", err))
      .finally(() => setLoading(false));
  }, [propModule, tId, mIdx]);

  const handleClose = () => {
    if (onClose) onClose();
    if (isStandalone || !propModule) {
      if (window.opener) {
        window.close();
      } else {
        navigate("/coding");
      }
    }
  };

  const handleProceedToMcq = () => {
    if (isStandalone || !propModule) {
      navigate(`/proctored-assessment/${tId}/${mIdx}`);
    } else {
      if (onClose) onClose();
      if (onLaunchAssessment) onLaunchAssessment(module);
    }
  };

  // Ensure full module details and attempt history are loaded
  useEffect(() => {
    if (!isCoding) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    // 1. If codingExercise details are missing or incomplete, fetch full module
    if (!activeExercise || !activeExercise.prompt || !activeExercise.inputFormat) {
      fetch(`${API_BASE}/api/coding/curriculum/${tId}/${mIdx}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.codingExercise) {
            setActiveExercise(data.codingExercise);
            if (!initialCode && data.codingExercise.starterCode) {
              setInitialCode(data.codingExercise.starterCode);
            }
          }
        })
        .catch(() => {});
    }

    // 2. Fetch saved draft
    fetch(`${API_BASE}/api/coding/curriculum/exercise/draft/${tId}/${mIdx}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.code && data.code.trim()) {
          setInitialCode(data.code);
        }
      })
      .catch(() => {});

    // 3. Fetch attempt history
    fetch(`${API_BASE}/api/coding/curriculum/exercise/history/${tId}/${mIdx}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setHistoryData(data);
      })
      .catch(() => {});
  }, [isCoding, tId, mIdx, activeExercise, initialCode]);

  const notifyAssignmentCompletion = useCallback((resultData) => {
    try {
      localStorage.setItem(
        "mz_module_progress_updated",
        JSON.stringify({
          type: "MZ_ASSIGNMENT_PASSED",
          subjectKey,
          trackId: tId,
          moduleIndex: mIdx,
          time: Date.now(),
        })
      );
    } catch {}

    if (typeof window !== "undefined" && window.opener) {
      try {
        window.opener.postMessage(
          {
            type: "MZ_ASSIGNMENT_PASSED",
            subjectKey,
            trackId: tId,
            moduleIndex: mIdx,
          },
          "*"
        );
      } catch {}
    }

    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("mz_module_sync");
        bc.postMessage({
          type: "MZ_ASSIGNMENT_PASSED",
          subjectKey,
          trackId: tId,
          moduleIndex: mIdx,
          timestamp: Date.now(),
        });
        bc.close();
      }
    } catch {}

    try {
      window.dispatchEvent(
        new CustomEvent("mz_assignment_passed", {
          detail: { subjectKey, trackId: tId, moduleIndex: mIdx, result: resultData },
        })
      );
    } catch {}
  }, [subjectKey, tId, mIdx]);

  // Handle Non-Coding Practical Assignment Submission
  const handleSubmitNonCodingAssignment = async () => {
    if (!userSubmissionText.trim()) {
      toast.warn("Please write your solution before submitting.");
      return;
    }

    setIsEvaluating(true);
    setSubmissionFlowStage("preparing");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE}/api/curriculum/assignment/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectKey,
          trackId: tId,
          moduleIndex: mIdx,
          submissionData: userSubmissionText,
        }),
      });

      const data = await res.json();
      setEvalResult(data);

      if (data.status === "PASSED" || data.isAccepted || data.passed) {
        toast.success(data.feedback || "Assignment approved! Practical requirement cleared.", {
          toastId: "practical_test_result",
        });
        notifyAssignmentCompletion(data);
        if (onAssignmentPassed) onAssignmentPassed(data);
        setSubmissionFlowStage("ready");
      } else {
        toast.warn(data.feedback || "Submission needs refinement. Please review criteria and retry.", {
          toastId: "practical_test_result",
        });
        setSubmissionFlowStage("ready");
      }
    } catch (err) {
      toast.error(`Evaluation error: ${err.message}`);
      setSubmissionFlowStage("error");
    } finally {
      setIsEvaluating(false);
    }
  };

  // If coding activity: render the authentic Mastery Zone Assessment Compiler interface
  if (loading || !module) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#0d1117",
          color: "#94a3b8",
          fontFamily: "'Inter', sans-serif",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #3b82f6",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ fontSize: "14px", fontWeight: 500 }}>Loading Practical Coding Test...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isCoding) {
    const codingEx = activeExercise || module.codingExercise;

    return (
      <MasteryZoneCompilerWorkspace
        title={`Assignment | ${codingEx?.taskTitle || module.title}`}
        questionId={`${tId}_${mIdx}`}
        isProctored={true}
        problemData={
          codingEx
            ? {
                ...codingEx,
                title: codingEx.taskTitle || module.title,
                taskTitle: codingEx.taskTitle || module.title,
                description: codingEx.prompt || module.overview,
                prompt: codingEx.prompt,
                moduleTitle: module.title,
                moduleOverview: module.overview,
                trackId: tId,
                moduleIndex: mIdx,
                difficulty: codingEx.difficulty || (mIdx <= 1 ? "Easy" : mIdx <= 3 ? "Medium" : "Hard"),
                category: codingEx.category || module.title,
                points: "100 XP / 100 Marks",
                inputFormat: codingEx.inputFormat,
                outputFormat: codingEx.outputFormat,
                objective: codingEx.objective,
                conceptualExplanation: codingEx.conceptualExplanation,
                examples: codingEx.examples,
                constraints: codingEx.constraints,
                hints: codingEx.hints,
                testCases: codingEx.testCases || [],
              }
            : null
        }
        starterCodeMap={{
          [defaultLang]: codingEx?.starterCode || "",
        }}
        defaultLanguage={defaultLang}
        testCases={codingEx?.testCases || []}
        initialDraft={initialCode}
        historyUrl={`${API_BASE}/api/coding/curriculum/exercise/history/${tId}/${mIdx}`}
        initialHistory={historyData}
        onSaveDraft={async (savedCode) => {
          const token = localStorage.getItem("token");
          if (!token) return;
          await fetch(`${API_BASE}/api/coding/curriculum/exercise/draft`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              trackId: tId,
              moduleIndex: mIdx,
              code: savedCode,
            }),
          });
        }}
        onRun={async (runCode, lang, customInput) => {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/api/coding/curriculum/exercise/run`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              trackId: tId,
              moduleIndex: mIdx,
              code: runCode,
              language: lang,
              customInput: customInput?.trim() ? customInput : undefined,
            }),
          });
          const text = await res.text();
          try {
            return text ? JSON.parse(text) : {};
          } catch {
            return { error: text || `Server error (${res.status})` };
          }
        }}
        onRunTests={async (runCode, lang) => {
          const token = localStorage.getItem("token");
          const activeSid = sessionStorage.getItem("mz_active_proctored_session") || localStorage.getItem("mz_active_proctored_session");
          if (runCode) {
            try {
              localStorage.setItem("mz_recent_submitted_code", runCode);
              if (activeSid) localStorage.setItem(`mz_draft_${activeSid}`, runCode);
            } catch {}
          }
          const res = await fetch(`${API_BASE}/api/coding/curriculum/exercise/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              trackId: tId,
              moduleIndex: mIdx,
              code: runCode,
              language: lang,
              sessionId: activeSid || undefined,
            }),
          });
          const text = await res.text();
          let data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch {
            data = { error: text || `Server error (${res.status})` };
          }
          if (data.status === "PASSED" || data.passed || data.score >= 80) {
            notifyAssignmentCompletion(data);
            if (onAssignmentPassed) onAssignmentPassed(data);
          }
          return data;
        }}
        onSubmit={async (submitCode, lang) => {
          const token = localStorage.getItem("token");
          const activeSid = sessionStorage.getItem("mz_active_proctored_session") || localStorage.getItem("mz_active_proctored_session");
          if (submitCode) {
            try {
              localStorage.setItem("mz_recent_submitted_code", submitCode);
              if (activeSid) localStorage.setItem(`mz_draft_${activeSid}`, submitCode);
            } catch {}
          }
          const res = await fetch(`${API_BASE}/api/coding/curriculum/exercise/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              trackId: tId,
              moduleIndex: mIdx,
              code: submitCode,
              language: lang,
              sessionId: activeSid || undefined,
            }),
          });
          const text = await res.text();
          let data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch {
            data = { error: text || `Server error (${res.status})` };
          }
          if (data.status === "PASSED" || data.passed || data.score >= 80) {
            notifyAssignmentCompletion(data);
            if (onAssignmentPassed) onAssignmentPassed(data);
          }
          return data;
        }}
        onClose={handleClose}
      />
    );
  }

  // Non-coding practical interactive assignment (Language, Driving, Fitness)
  const practical = module.practicalAssignment || {
    taskTitle: `${module.title} Practical Scenario`,
    instructions: "Apply the principles learned in theory to analyze and solve this real-world task.",
    promptText: module.overview || "Demonstrate your understanding by submitting a detailed response.",
    criteria: "Accurately apply concepts and core vocabulary.",
  };

  const isPassed = evalResult?.status === "PASSED" || evalResult?.isAccepted || evalResult?.passed || Boolean(module.assignmentPassed);

  if (submissionFlowStage === "preparing" || isEvaluating) {
    return (
      <AssessmentSubmissionFlow
        stage="preparing"
        title={practical.taskTitle || "Practical Assignment"}
        assignmentType="Practical Assignment"
      />
    );
  }

  if (submissionFlowStage === "ready" || (isPassed && evalResult)) {
    return (
      <AssessmentSubmissionFlow
        stage="ready"
        title={practical.taskTitle || "Practical Assignment"}
        assignmentType="Practical Assignment"
        summary={{
          score: evalResult?.score !== undefined ? evalResult.score : (isPassed ? 100 : 60),
          totalMarks: 100,
          grade: isPassed ? "A" : "Needs Revision",
          passedTests: evalResult?.passedCount || (isPassed ? 1 : 0),
          totalTests: evalResult?.totalTests || 1,
          passed: isPassed,
          attemptNumber: 1,
          submittedAt: new Date().toISOString(),
        }}
        onViewReport={handleProceedToMcq}
        onRetake={() => {
          setSubmissionFlowStage(null);
          setEvalResult(null);
        }}
        onReturn={handleClose}
      />
    );
  }

  if (submissionFlowStage === "error") {
    return (
      <AssessmentSubmissionFlow
        stage="error"
        title={practical.taskTitle || "Practical Assignment"}
        assignmentType="Practical Assignment"
        errorMessage="Evaluation encountered an error. Please retry."
        onRetake={() => setSubmissionFlowStage(null)}
        onReturn={handleClose}
      />
    );
  }

  return (
    <div className="mz-proc-overlay" style={{ zIndex: 100000, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)" }}>
      <div
        style={{
          width: "92vw",
          maxWidth: "880px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "32px",
          color: "#0f172a",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.15)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  background: "rgba(37, 99, 235, 0.08)",
                  color: "#2563eb",
                  border: "1px solid rgba(37, 99, 235, 0.25)",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                {subjectKey} • Module {mIdx + 1}
              </span>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Step 2 of 3: Practical Assessment</span>
            </div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>
              {practical.taskTitle || "Practical Assessment"}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#475569",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Problem Scenario & Prompt Box */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563eb", fontWeight: "700", fontSize: "13px", marginBottom: "8px" }}>
            <LuFileText size={16} />
            <span>Scenario & Instructions</span>
          </div>
          <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>
            {practical.instructions}
          </p>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "14px 16px",
              fontSize: "13.5px",
              color: "#0f172a",
              whiteSpace: "pre-line",
              fontFamily: "monospace",
              lineHeight: "1.5",
            }}
          >
            {practical.promptText}
          </div>

          {practical.criteria && (
            <div style={{ marginTop: "12px", fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
              <LuLightbulb size={14} color="#f59e0b" />
              <span><strong>Evaluation Criteria:</strong> {practical.criteria}</span>
            </div>
          )}
        </div>

        {/* Interactive Response Editor */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
            Your Practical Solution / Translation / Calculations:
          </label>
          <textarea
            rows={7}
            value={userSubmissionText}
            onChange={(e) => setUserSubmissionText(e.target.value)}
            placeholder="Type your complete solution, mathematical working, or translation here..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "14px 16px",
              color: "#0f172a",
              fontSize: "14px",
              lineHeight: "1.6",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          />
        </div>

        {/* Real-time Evaluation Results Box */}
        {evalResult && (
          <div
            style={{
              background: isPassed ? "#ecfdf5" : "#fffbeb",
              border: `1px solid ${isPassed ? "#a7f3d0" : "#fde68a"}`,
              borderRadius: "12px",
              padding: "18px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            {isPassed ? <LuCircleCheck size={24} color="#10b981" /> : <LuTriangleAlert size={24} color="#f59e0b" />}
            <div>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: isPassed ? "#059669" : "#d97706", fontWeight: "700" }}>
                {isPassed ? "Practical Assignment Passed!" : "Needs Revision"}
              </h4>
              <p style={{ margin: 0, fontSize: "13.5px", color: isPassed ? "#166534" : "#92400e", lineHeight: "1.5" }}>
                {evalResult.feedback}
              </p>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#475569",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            Close
          </button>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleSubmitNonCodingAssignment}
              disabled={isEvaluating}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                border: "none",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: "700",
                cursor: isEvaluating ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
              }}
            >
              <LuSend size={15} />
              <span>{isEvaluating ? "Evaluating Solution..." : "Run & Evaluate Assignment"}</span>
            </button>

            {isPassed && (
              <button
                type="button"
                onClick={handleProceedToMcq}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  color: "#ffffff",
                  padding: "10px 22px",
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                }}
              >
                <LuTrophy size={16} />
                <span>Proceed to Proctored MCQ Exam</span>
                <LuArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
