import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import ProctoredAssessmentWorkspace from "./ProctoredAssessmentWorkspace";
import PracticalAssignmentModal from "./PracticalAssignmentModal";
import FullScreenConceptLearning from "./FullScreenConceptLearning";
import {
  LuBookOpen,
  LuClock,
  LuCheck,
  LuLock,
  LuTrophy,
  LuAward,
  LuX,
  LuChevronDown,
  LuLaptop,
  LuCircleCheck,
  LuRotateCcw,
  LuShieldAlert,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function SubjectCurriculumView({
  subjectKey = "language",
  subjectTitle = "Language Curriculum",
  tracks = [],
  defaultTrack = "",
}) {
  const [selectedTrack, setSelectedTrack] = useState(defaultTrack || tracks[0]?.id || "");
  const [curriculumData, setCurriculumData] = useState({ modules: [], unlockLevel: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Modals
  const [activeStudyModule, setActiveStudyModule] = useState(null);
  const [studyTimeElapsed, setStudyTimeElapsed] = useState(0);
  const [activeAssignmentModule, setActiveAssignmentModule] = useState(null);
  const [activeAssessmentModule, setActiveAssessmentModule] = useState(null);

  // Reset Learning Progress State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetScope, setResetScope] = useState("current"); // "current" | "all"
  const [isResetting, setIsResetting] = useState(false);

  const handleResetSubjectLearningProgress = async () => {
    setIsResetting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/curriculum/${subjectKey}/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trackId: resetScope === "current" ? selectedTrack : undefined,
          resetAllTracks: resetScope === "all",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Learning process successfully reset! Modules have returned to initial state.", { toastId: "subj_reset_ok" });
        setIsResetModalOpen(false);
        fetchCurriculum(selectedTrack);
      } else {
        toast.error(data.error || data.message || "Failed to reset learning process");
      }
    } catch (err) {
      toast.error(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const fetchCurriculum = useCallback(async (trackId) => {
    if (!trackId) return;
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE}/api/curriculum/${subjectKey}/${trackId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurriculumData(data);
      }
    } catch {
      console.error("Failed to load curriculum");
    } finally {
      setIsLoading(false);
    }
  }, [subjectKey]);

  useEffect(() => {
    fetchCurriculum(selectedTrack);
  }, [selectedTrack, fetchCurriculum]);

  // Real-time synchronization for curriculum progress across tabs & windows
  useEffect(() => {
    const handleSync = () => {
      if (selectedTrack) {
        fetchCurriculum(selectedTrack);
      }
    };

    const handleStorage = (e) => {
      if (
        !e ||
        e.key === "mz_module_progress_updated" ||
        e.key === "mz_exam_completed" ||
        e.key === "mz_assignment_passed" ||
        e.key === "user"
      ) {
        handleSync();
      }
    };

    let bc = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("mz_module_sync");
        bc.onmessage = () => handleSync();
      }
    } catch {}

    const handleFocus = () => handleSync();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleSync();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("mz_module_studied", handleSync);
    window.addEventListener("mz_assignment_passed", handleSync);
    window.addEventListener("mz_exam_completed", handleSync);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("mz_module_studied", handleSync);
      window.removeEventListener("mz_assignment_passed", handleSync);
      window.removeEventListener("mz_exam_completed", handleSync);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [selectedTrack, fetchCurriculum]);

  // Handle Study Modal Open & Timer
  const handleOpenStudy = async (module) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/curriculum/${subjectKey}/${selectedTrack}/${module.moduleIndex}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveStudyModule(data);
        setStudyTimeElapsed(0);
      }
    } catch {
      toast.error("Failed to load lesson content");
    }
  };

  useEffect(() => {
    let timer = null;
    if (activeStudyModule) {
      timer = setInterval(() => {
        setStudyTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeStudyModule]);

  const handleFinishStudy = async () => {
    if (!activeStudyModule) return;
    const mod = activeStudyModule;
    const token = localStorage.getItem("token");

    // Immediately close study modal and open practical assignment
    setActiveStudyModule(null);
    setActiveAssignmentModule(mod);
    toast.success("Lesson studied! Starting practical assignment.");

    if (token) {
      try {
        await fetch(`${API_BASE}/api/curriculum/study`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subjectKey,
            trackId: selectedTrack,
            moduleIndex: mod.moduleIndex,
            studyTimeSeconds: Math.max(30, studyTimeElapsed),
          }),
        });
        fetchCurriculum(selectedTrack);
      } catch (err) {
        console.warn("Failed to record study duration:", err);
      }
    }
  };

  const currentTrackObj = tracks.find((t) => t.id === selectedTrack) || tracks[0];

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", color: "#0f172a" }}>
      {/* Track Selector Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          background: "#ffffff",
          padding: "18px 24px",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>
            {subjectTitle}
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Structured modules • Practical assignments • Mandatory 5-Step proctored 10-MCQ exams
          </p>
        </div>

        {/* Right Actions: Track Pills & Reset Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {tracks.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setSelectedTrack(t.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: selectedTrack === t.id ? "#3b82f6" : "#e2e8f0",
                  background: selectedTrack === t.id ? "#eff6ff" : "#ffffff",
                  color: selectedTrack === t.id ? "#2563eb" : "#475569",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                  transition: "all 0.2s ease",
                }}
              >
                {t.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            title="Reset Learning Process (modules, tests, and assignments)"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: "20px",
              fontSize: "12.5px",
              fontWeight: "600",
              color: "#e11d48",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <LuRotateCcw size={14} />
            <span>Reset Learning Process</span>
          </button>
        </div>
      </div>

      {/* Modules Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {curriculumData.modules?.map((module, idx) => {
          const stepNum = idx + 1;
          const isUnlocked = true;
          const isStudyDone = Boolean(module.isStudied);
          const isAssignmentDone = Boolean(module.assignmentPassed || module.exercisePassed);
          const isAssessmentDone = Boolean(module.assessmentPassed);

          const isPassed = Boolean(
            module.isCompleted ||
            module.status === "completed" ||
            (isAssignmentDone && isAssessmentDone) ||
            (isStudyDone && isAssignmentDone && isAssessmentDone) ||
            (isAssessmentDone && !module.practicalAssignment && !module.codingExercise) ||
            (isAssignmentDone && !module.assessment)
          );

          return (
            <div
              key={module.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "20px 26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "18px",
                boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
                transition: "all 0.2s ease",
              }}
            >
              {/* Left Side: Number & Info */}
              <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: 1, minWidth: "280px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "14px",
                    flexShrink: 0,
                    background: isPassed ? "#10b981" : "#eff6ff",
                    color: isPassed ? "#ffffff" : "#2563eb",
                    border: isPassed ? "none" : "1.5px solid #bfdbfe",
                  }}
                >
                  {isPassed ? <LuCheck size={18} /> : stepNum}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                      {module.title}
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontWeight: "600",
                      }}
                    >
                      <LuClock size={11} /> {module.estimatedTime}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        letterSpacing: "0.3px",
                        background: isPassed ? "#ecfdf5" : (isStudyDone || isAssignmentDone || isAssessmentDone) ? "#eff6ff" : "#f1f5f9",
                        color: isPassed ? "#059669" : (isStudyDone || isAssignmentDone || isAssessmentDone) ? "#2563eb" : "#64748b",
                        border: `1px solid ${isPassed ? "#a7f3d0" : (isStudyDone || isAssignmentDone || isAssessmentDone) ? "#bfdbfe" : "#e2e8f0"}`,
                      }}
                    >
                      {isPassed ? "Completed" : (isStudyDone || isAssignmentDone || isAssessmentDone) ? "In Progress" : "Available"}
                    </span>
                  </div>

                  <p style={{ margin: "4px 0 8px 0", fontSize: "13px", color: "#475569" }}>
                    {module.subtitle}
                  </p>

                  {/* Verification Badges */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "3px 9px",
                        borderRadius: "12px",
                        background: module.isStudied ? "#ecfdf5" : "#f8fafc",
                        border: `1px solid ${module.isStudied ? "#a7f3d0" : "#e2e8f0"}`,
                        color: module.isStudied ? "#059669" : "#64748b",
                      }}
                    >
                      {module.isStudied ? "✓ Lesson Studied" : "📖 Study Pending"}
                    </span>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "3px 9px",
                        borderRadius: "12px",
                        background: module.assignmentPassed ? "#ecfdf5" : "#f8fafc",
                        border: `1px solid ${module.assignmentPassed ? "#a7f3d0" : "#e2e8f0"}`,
                        color: module.assignmentPassed ? "#059669" : "#64748b",
                      }}
                    >
                      {module.assignmentPassed ? "✓ Practical Assignment Passed" : "📝 Assignment Pending"}
                    </span>

                    {module.previousAttemptGrade !== undefined && module.previousAttemptGrade !== null && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 9px",
                          borderRadius: "12px",
                          background: module.assignmentPassed ? "#ecfdf5" : "#fff1f2",
                          border: `1px solid ${module.assignmentPassed ? "#a7f3d0" : "#fecdd3"}`,
                          color: module.assignmentPassed ? "#059669" : "#e11d48",
                        }}
                      >
                        Previous Attempt: {module.previousAttemptGrade}% ({module.assignmentPassed ? "Passed" : "Not Passed"})
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "3px 9px",
                        borderRadius: "12px",
                        background: module.assessmentPassed ? "#ecfdf5" : "#f8fafc",
                        border: `1px solid ${module.assessmentPassed ? "#a7f3d0" : "#e2e8f0"}`,
                        color: module.assessmentPassed ? "#059669" : "#64748b",
                      }}
                    >
                      {module.assessmentPassed
                        ? `✓ Assessment Passed (${module.bestScore}%)`
                        : "🛡️ Proctored Exam (≥80%)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleOpenStudy(module)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#1e293b",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <LuBookOpen size={14} color="#2563eb" /> {module.isStudied ? "Review" : "Study Lesson"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!module.isStudied) {
                      toast.warn("Please complete Step 1: Study Lesson first.");
                      handleOpenStudy(module);
                      return;
                    }
                    setActiveAssignmentModule(module);
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    background: module.assignmentPassed ? "#ecfdf5" : "#eff6ff",
                    border: `1px solid ${module.assignmentPassed ? "#a7f3d0" : "#bfdbfe"}`,
                    color: module.assignmentPassed ? "#059669" : "#2563eb",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <LuLaptop size={14} /> {module.assignmentPassed ? "Assignment ✓" : "Assignment"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!module.isStudied) {
                      toast.warn("Please complete Step 1: Study Lesson first.");
                      handleOpenStudy(module);
                      return;
                    }
                    if (!module.assignmentPassed) {
                      toast.warn("Please complete and pass Step 2: Practical Assignment first.");
                      setActiveAssignmentModule(module);
                      return;
                    }
                    setActiveAssessmentModule(module);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    background: module.assessmentPassed
                      ? "linear-gradient(135deg, #10b981, #059669)"
                      : "linear-gradient(135deg, #3b82f6, #2563eb)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "12.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <LuTrophy size={14} /> {module.assessmentPassed ? `Retake (${module.bestScore}%)` : "Take Exam"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODAL 1: FULL SCREEN CONCEPT LEARNING ================= */}
      {activeStudyModule && (
        <FullScreenConceptLearning
          module={activeStudyModule}
          subjectKey={subjectKey}
          trackId={selectedTrack}
          onClose={() => setActiveStudyModule(null)}
          onComplete={(updatedMod) => {
            setActiveStudyModule(null);
            fetchCurriculum(selectedTrack);
            setActiveAssignmentModule(updatedMod || activeStudyModule);
          }}
        />
      )}

      {/* ================= MODAL 2: PRACTICAL ASSIGNMENT ================= */}
      {activeAssignmentModule && (
        <PracticalAssignmentModal
          module={activeAssignmentModule}
          subjectKey={subjectKey}
          trackId={selectedTrack}
          onClose={() => setActiveAssignmentModule(null)}
          onAssignmentPassed={() => {
            fetchCurriculum(selectedTrack);
          }}
          onLaunchAssessment={(mod) => {
            setActiveAssignmentModule(null);
            setActiveAssessmentModule(mod);
          }}
        />
      )}

      {/* ================= MODAL 3: 5-STEP PROCTORED 10-MCQ ASSESSMENT ================= */}
      {activeAssessmentModule && (
        <ProctoredAssessmentWorkspace
          module={activeAssessmentModule}
          subjectKey={subjectKey}
          trackId={selectedTrack}
          onClose={() => setActiveAssessmentModule(null)}
          onAssessmentCompleted={() => {
            fetchCurriculum(selectedTrack);
          }}
        />
      )}
      {/* ================= MODAL 4: RESET LEARNING PROGRESS MODAL ================= */}
      {isResetModalOpen && (
        <div
          className="mz-c-modal-overlay"
          onClick={() => !isResetting && setIsResetModalOpen(false)}
        >
          <div className="mz-c-modal mz-reset-learning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mz-reset-modal-header">
              <div className="mz-reset-modal-icon-ring">
                <LuRotateCcw size={22} />
              </div>
              <div>
                <h3 className="mz-reset-modal-title">Reset Learning Process</h3>
                <p className="mz-reset-modal-sub">Clear module completions, assignments, and test assessments</p>
              </div>
              <button
                type="button"
                className="mz-c-modal-close"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="mz-reset-modal-body">
              <div className="mz-reset-warning-banner">
                <LuShieldAlert size={18} />
                <span>
                  This action will reset your learning process, completed lessons, assignments, and tests back to the beginning.
                </span>
              </div>

              <div className="mz-reset-scope-selector">
                <label className="mz-reset-scope-title">Choose Reset Scope:</label>

                <label className={`mz-reset-radio-option ${resetScope === "current" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="subjectResetScope"
                    value="current"
                    checked={resetScope === "current"}
                    onChange={() => setResetScope("current")}
                  />
                  <div className="mz-reset-radio-content">
                    <strong>Reset Current Track ({tracks.find((t) => t.id === selectedTrack)?.name || selectedTrack})</strong>
                    <span>Resets module completions, assignments, and test scores for this track only.</span>
                  </div>
                </label>

                <label className={`mz-reset-radio-option ${resetScope === "all" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="subjectResetScope"
                    value="all"
                    checked={resetScope === "all"}
                    onChange={() => setResetScope("all")}
                  />
                  <div className="mz-reset-radio-content">
                    <strong>Reset All Tracks in {subjectTitle}</strong>
                    <span>Resets all modules, assignments, and tests across all {subjectKey} tracks.</span>
                  </div>
                </label>
              </div>

              <div className="mz-reset-summary-list">
                <div className="mz-reset-summary-item">
                  <LuCheck size={14} color="#dc2626" />
                  <span>Module completions and scores will be reset to 0%. All modules remain accessible for practice.</span>
                </div>
                <div className="mz-reset-summary-item">
                  <LuCheck size={14} color="#dc2626" />
                  <span>Proctored 10-MCQ test exam attempts and scores will be cleared.</span>
                </div>
                <div className="mz-reset-summary-item">
                  <LuCheck size={14} color="#dc2626" />
                  <span>Practical assignment completions and feedback will be reset.</span>
                </div>
              </div>
            </div>

            <div className="mz-reset-modal-actions">
              <button
                type="button"
                className="mz-reset-btn-cancel"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
              >
                Cancel & Keep Progress
              </button>
              <button
                type="button"
                className="mz-reset-btn-confirm"
                onClick={handleResetSubjectLearningProgress}
                disabled={isResetting}
              >
                {isResetting ? "Resetting Progress..." : "Yes, Reset Learning Process"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
