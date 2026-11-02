import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LuArrowLeft,
  LuClock,
  LuCheck,
  LuBookOpen,
  LuCircleCheck,
  LuCodeXml,
  LuSparkles,
  LuCopy,
  LuLayers,
  LuLightbulb,
  LuTriangleAlert,
  LuArrowRight,
  LuFlame,
  LuCpu,
} from "react-icons/lu";
import "./FullScreenConceptLearning.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function FullScreenConceptLearning({
  module: propModule,
  subjectKey = "coding",
  trackId: propTrackId,
  onClose,
  onComplete,
  isStandalone = false,
}) {
  const { trackId: paramTrackId, moduleId: paramModuleId } = useParams();
  const navigate = useNavigate();

  const effectiveTrackId = propTrackId || paramTrackId || "python";
  const effectiveModuleIndex = propModule?.moduleIndex ?? (paramModuleId !== undefined ? parseInt(paramModuleId, 10) : 0);

  const [module, setModule] = useState(propModule || null);
  const [loading, setLoading] = useState(!propModule);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isCompleted, setIsCompleted] = useState(Boolean(propModule?.isStudied));
  const startTimeRef = useRef(Date.now());
  const bodyRef = useRef(null);

  // Fetch module if standalone / not supplied via prop
  useEffect(() => {
    if (propModule) {
      setModule(propModule);
      setIsCompleted(Boolean(propModule.isStudied));
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`${API_BASE}/api/coding/curriculum/${effectiveTrackId}/${effectiveModuleIndex}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setModule(data);
          setIsCompleted(Boolean(data.progressState?.isStudied || data.isStudied));
        }
      })
      .catch((err) => console.error("Failed to load concept learning module:", err))
      .finally(() => setLoading(false));
  }, [propModule, effectiveTrackId, effectiveModuleIndex]);

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

  // Monitor scroll progression
  const handleScroll = (e) => {
    const el = e.target;
    const totalHeight = el.scrollHeight - el.clientHeight;
    if (totalHeight > 0) {
      const pct = Math.min(100, Math.max(0, Math.round((el.scrollTop / totalHeight) * 100)));
      setScrollProgress(pct);
    }
  };

  const handleCopyCode = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.info("Code example copied to clipboard!", { autoClose: 1500 });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Mark as Completed Handler
  const handleMarkAsCompleted = async () => {
    if (isMarkingComplete) return;
    setIsMarkingComplete(true);

    const durationSec = Math.max(15, Math.round((Date.now() - startTimeRef.current) / 1000));
    const token = localStorage.getItem("token");
    const mIdx = module?.moduleIndex ?? 0;
    const tId = trackId || module?.trackId || "python";
    const sKey = subjectKey || module?.subjectKey || "coding";

    try {
      if (token) {
        // Post to the appropriate study endpoint
        const endpoint = sKey === "coding"
          ? `${API_BASE}/api/coding/curriculum/study`
          : `${API_BASE}/api/curriculum/study`;

        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subjectKey: sKey,
            trackId: tId,
            moduleIndex: mIdx,
            studyTimeSeconds: durationSec,
          }),
        });
      }

      setIsCompleted(true);
      toast.success("✓ Theory & Concept Notes marked as completed! Practical exercise unlocked.", {
        autoClose: 2500,
      });

      if (onComplete) {
        onComplete({ ...module, isStudied: true });
      }
    } catch (err) {
      console.warn("Failed to persist study progress:", err);
      // Still mark completed locally so candidate is never blocked
      setIsCompleted(true);
      toast.success("Theory marked as completed!");
      if (onComplete) {
        onComplete({ ...module, isStudied: true });
      }
    } finally {
      setIsMarkingComplete(false);
    }
  };

  // Subject title resolution
  const resolvedSubjectTitle =
    subjectKey === "coding"
      ? "Coding & Software Engineering"
      : subjectKey === "language"
      ? "Linguistic Fluency & Grammar"
      : subjectKey === "driving"
      ? "Vehicle Dynamics & Road Safety"
      : "Exercise Physiology & Biomechanics";

  // Visual diagram generator tailored to subject
  const renderVisualArchitectureDiagram = () => {
    if (subjectKey === "coding") {
      return (
        <div className="mz-fs-diagram-canvas">
          <svg viewBox="0 0 760 160" width="100%" height="auto" style={{ maxHeight: "200px" }}>
            <defs>
              <linearGradient id="codeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="codeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
              <linearGradient id="codeGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
            {/* Box 1: High-Level Source / Symbol Table */}
            <rect x="20" y="30" width="200" height="100" rx="10" fill="url(#codeGrad1)" opacity="0.9" />
            <text x="120" y="65" fill="#ffffff" fontWeight="700" fontSize="13" textAnchor="middle">1. Lexical Scope & Symbols</text>
            <text x="120" y="88" fill="#e0e7ff" fontSize="11" textAnchor="middle">Variable Identifier Binding</text>
            <text x="120" y="106" fill="#bfdbfe" fontSize="10" textAnchor="middle">Local / Enclosing / Global / Built-in</text>

            {/* Arrow 1 */}
            <path d="M 225 80 L 275 80" stroke="#60a5fa" strokeWidth="2.5" markerEnd="url(#arrow)" />
            <polygon points="275,76 283,80 275,84" fill="#60a5fa" />

            {/* Box 2: Memory Model / Heap Object */}
            <rect x="285" y="30" width="200" height="100" rx="10" fill="url(#codeGrad2)" opacity="0.9" />
            <text x="385" y="65" fill="#ffffff" fontWeight="700" fontSize="13" textAnchor="middle">2. Heap Object Allocation</text>
            <text x="385" y="88" fill="#f5d0fe" fontSize="11" textAnchor="middle">Type Descriptor & Ref Count</text>
            <text x="385" y="106" fill="#e9d5ff" fontSize="10" textAnchor="middle">Mutable vs Immutable Value Slot</text>

            {/* Arrow 2 */}
            <path d="M 490 80 L 540 80" stroke="#a78bfa" strokeWidth="2.5" />
            <polygon points="540,76 548,80 540,84" fill="#a78bfa" />

            {/* Box 3: Runtime Execution & Evaluator */}
            <rect x="550" y="30" width="190" height="100" rx="10" fill="url(#codeGrad3)" opacity="0.9" />
            <text x="645" y="65" fill="#ffffff" fontWeight="700" fontSize="13" textAnchor="middle">3. Runtime Execution</text>
            <text x="645" y="88" fill="#d1fae5" fontSize="11" textAnchor="middle">Bytecode Instruction Cycle</text>
            <text x="645" y="106" fill="#a7f3d0" fontSize="10" textAnchor="middle">Call Stack Frame Push/Pop</text>
          </svg>
        </div>
      );
    }

    if (subjectKey === "language") {
      return (
        <div className="mz-fs-diagram-canvas">
          <svg viewBox="0 0 760 150" width="100%" height="auto" style={{ maxHeight: "200px" }}>
            <rect x="20" y="25" width="210" height="95" rx="10" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
            <text x="125" y="58" fill="#1d4ed8" fontWeight="700" fontSize="13" textAnchor="middle">Syntactic Subject / Agent</text>
            <text x="125" y="82" fill="#334155" fontSize="11" textAnchor="middle">Person, Number, Gender Agreement</text>
            <text x="125" y="100" fill="#64748b" fontSize="10" textAnchor="middle">e.g. Él / Ella / Nosotros</text>

            <path d="M 235 72 L 275 72" stroke="#3b82f6" strokeWidth="2" />
            <polygon points="275,68 283,72 275,76" fill="#3b82f6" />

            <rect x="285" y="25" width="200" height="95" rx="10" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
            <text x="385" y="58" fill="#6d28d9" fontWeight="700" fontSize="13" textAnchor="middle">Predicate Auxiliary / Copula</text>
            <text x="385" y="82" fill="#334155" fontSize="11" textAnchor="middle">Tense, Aspect, Mood Inflection</text>
            <text x="385" y="100" fill="#64748b" fontSize="10" textAnchor="middle">e.g. Ser (Trait) vs Estar (State)</text>

            <path d="M 490 72 L 530 72" stroke="#8b5cf6" strokeWidth="2" />
            <polygon points="530,68 538,72 530,76" fill="#8b5cf6" />

            <rect x="540" y="25" width="200" height="95" rx="10" fill="#ffffff" stroke="#10b981" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
            <text x="640" y="58" fill="#047857" fontWeight="700" fontSize="13" textAnchor="middle">Object & Prepositional State</text>
            <text x="640" y="82" fill="#334155" fontSize="11" textAnchor="middle">Direct / Indirect Case Binding</text>
            <text x="640" y="100" fill="#64748b" fontSize="10" textAnchor="middle">Semantic Resolution</text>
          </svg>
        </div>
      );
    }

    if (subjectKey === "driving") {
      return (
        <div className="mz-fs-diagram-canvas">
          <svg viewBox="0 0 760 150" width="100%" height="auto" style={{ maxHeight: "200px" }}>
            <rect x="20" y="25" width="210" height="95" rx="10" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
            <text x="125" y="56" fill="#0369a1" fontWeight="700" fontSize="13" textAnchor="middle">1. Perception-Reaction ($d_t$)</text>
            <text x="125" y="78" fill="#334155" fontSize="11" textAnchor="middle">$d_t = v \times t_r$</text>
            <text x="125" y="98" fill="#64748b" fontSize="10" textAnchor="middle">Human reaction delay (~1.0s)</text>

            <text x="250" y="77" fill="#64748b" fontSize="18" fontWeight="800">+</text>

            <rect x="275" y="25" width="210" height="95" rx="10" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
            <text x="380" y="56" fill="#b45309" fontWeight="700" fontSize="13" textAnchor="middle">2. Braking Distance ($d_b$)</text>
            <text x="380" y="78" fill="#334155" fontSize="11" textAnchor="middle">$d_b = v^2 / (2\mu g)$</text>
            <text x="380" y="98" fill="#64748b" fontSize="10" textAnchor="middle">Kinetic Energy Dissipation</text>

            <text x="505" y="77" fill="#64748b" fontSize="18" fontWeight="800">=</text>

            <rect x="530" y="25" width="210" height="95" rx="10" fill="#ffffff" stroke="#ef4444" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
            <text x="635" y="56" fill="#b91c1c" fontWeight="700" fontSize="13" textAnchor="middle">Total Stopping Distance</text>
            <text x="635" y="78" fill="#334155" fontSize="11" textAnchor="middle">Quadruples with 2× Speed</text>
            <text x="635" y="98" fill="#64748b" fontSize="10" textAnchor="middle">Kamm Friction Adhesion Limit</text>
          </svg>
        </div>
      );
    }

    // Default: Fitness / Biomechanics
    return (
      <div className="mz-fs-diagram-canvas">
        <svg viewBox="0 0 760 150" width="100%" height="auto" style={{ maxHeight: "200px" }}>
          <rect x="20" y="25" width="210" height="95" rx="10" fill="#ffffff" stroke="#ec4899" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
          <text x="125" y="56" fill="#be185d" fontWeight="700" fontSize="13" textAnchor="middle">Barbell Gravitational Line</text>
          <text x="125" y="78" fill="#334155" fontSize="11" textAnchor="middle">$F = m \times g$ (Vertical Vector)</text>
          <text x="125" y="98" fill="#64748b" fontSize="10" textAnchor="middle">Must track over midfoot center</text>

          <path d="M 235 72 L 275 72" stroke="#ec4899" strokeWidth="2" />
          <polygon points="275,68 283,72 275,76" fill="#ec4899" />

          <rect x="285" y="25" width="200" height="95" rx="10" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
          <text x="385" y="56" fill="#6d28d9" fontWeight="700" fontSize="13" textAnchor="middle">Joint Moment Arm ($d_\perp$)</text>
          <text x="385" y="78" fill="#334155" fontSize="11" textAnchor="middle">$\tau = F \times d_\perp$ (Torque)</text>
          <text x="385" y="98" fill="#64748b" fontSize="10" textAnchor="middle">Hip vs Knee Lever Demands</text>

          <path d="M 490 72 L 530 72" stroke="#8b5cf6" strokeWidth="2" />
          <polygon points="530,68 538,72 530,76" fill="#8b5cf6" />

          <rect x="540" y="25" width="200" height="95" rx="10" fill="#ffffff" stroke="#10b981" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
          <text x="640" y="56" fill="#047857" fontWeight="700" fontSize="13" textAnchor="middle">Spinal Force Distribution</text>
          <text x="640" y="78" fill="#334155" fontSize="11" textAnchor="middle">Compressive vs Shear Loads</text>
          <text x="640" y="98" fill="#64748b" fontSize="10" textAnchor="middle">Intra-Abdominal Pneumatic Cylinder</text>
        </svg>
      </div>
    );
  };

  if (loading || !module) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
          color: "#475569",
          fontFamily: "'Inter', sans-serif",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #2563eb",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ fontSize: "14px", fontWeight: 600 }}>Loading Module Study Materials...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="mz-fs-concept-overlay">
      {/* -------------------------------------------------------------
          TOP FIXED NAVIGATION BAR
          ------------------------------------------------------------- */}
      <header className="mz-fs-navbar">
        {/* Scroll Progress Bar */}
        <div className="mz-fs-scroll-indicator" style={{ width: `${scrollProgress}%` }} />

        <div className="mz-fs-nav-left">
          <button
            type="button"
            className="mz-fs-back-btn"
            onClick={handleClose}
            title="Return to module curriculum"
          >
            <LuArrowLeft size={16} />
            <span>Back to Modules</span>
          </button>

          <div className="mz-fs-breadcrumbs">
            <span className="mz-fs-badge-subject">{subjectKey}</span>
            <span className="mz-fs-badge-module">
              Module {(module?.moduleIndex ?? 0) + 1}: {module?.title || "Concept Notes"}
            </span>
          </div>
        </div>

        <div className="mz-fs-nav-right">
          <div className="mz-fs-time-badge" title="Recommended reading duration">
            <LuClock size={14} />
            <span>{module?.estimatedTime || "30 mins"}</span>
          </div>

          <div className={`mz-fs-status-pill ${isCompleted ? "done" : "pending"}`}>
            {isCompleted ? <LuCheck size={14} /> : <LuBookOpen size={14} />}
            <span>{isCompleted ? "Theory Completed" : "Reading in Progress"}</span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN SCROLLABLE CONCEPT BODY
          ------------------------------------------------------------- */}
      <main className="mz-fs-body" ref={bodyRef} onScroll={handleScroll}>
        <div className="mz-fs-container">
          {/* Hero Banner */}
          <div className="mz-fs-hero">
            <div className="mz-fs-hero-top">
              <span className="mz-fs-hero-category">{resolvedSubjectTitle}</span>
              <span style={{ color: "#64748b" }}>•</span>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Module {(module?.moduleIndex ?? 0) + 1} Masterclass</span>
            </div>

            <h1 className="mz-fs-hero-title">{module?.title}</h1>
            <p className="mz-fs-hero-sub">{module?.subtitle}</p>

            {/* Overview Box */}
            <div className="mz-fs-overview-card">
              <h4>Conceptual Architecture & Core Objectives</h4>
              <p>{module?.overview}</p>
            </div>

            {/* Meta badges */}
            <div className="mz-fs-meta-pills">
              <div className="mz-fs-meta-pill">
                <LuLayers size={14} color="#60a5fa" />
                <span>{module?.sections?.length || 3} Deep-Dive Concept Sections</span>
              </div>
              <div className="mz-fs-meta-pill">
                <LuCpu size={14} color="#a78bfa" />
                <span>Standardized Theory Specification</span>
              </div>
              <div className="mz-fs-meta-pill">
                <LuFlame size={14} color="#f59e0b" />
                <span>Unlocks Step 2 Practical Exercise</span>
              </div>
            </div>
          </div>

          {/* Interactive Architectural Diagram Card */}
          <div className="mz-fs-diagram-card">
            <div className="mz-fs-diagram-header">
              <div className="mz-fs-diagram-title">
                <LuLayers size={18} />
                <span>System Architecture & Visual Mechanics Model</span>
              </div>
              <span className="mz-fs-diagram-badge">Visual Blueprint</span>
            </div>
            {renderVisualArchitectureDiagram()}
          </div>

          {/* Detailed Conceptual Sections */}
          <div className="mz-fs-sections-list">
            {module?.sections?.map((section, idx) => {
              const codeText = section.codeExample || section.example || "";
              return (
                <article key={idx} className="mz-fs-section-card">
                  <div className="mz-fs-sec-header">
                    <div className="mz-fs-sec-number">{idx + 1}</div>
                    <h2 className="mz-fs-sec-title">{section.title}</h2>
                  </div>

                  <div className="mz-fs-sec-body">{section.content}</div>

                  {/* Code / Syntax / Formula Box */}
                  {codeText && (
                    <div className="mz-fs-code-box">
                      <div className="mz-fs-code-header">
                        <span>{subjectKey === "coding" ? "Syntax & Implementation Specification" : "Demonstration Example"}</span>
                        <button
                          type="button"
                          className="mz-fs-btn-copy"
                          onClick={() => handleCopyCode(codeText, idx)}
                          title="Copy snippet"
                        >
                          {copiedIndex === idx ? <LuCheck size={13} color="#10b981" /> : <LuCopy size={13} />}
                          <span>{copiedIndex === idx ? "Copied!" : "Copy"}</span>
                        </button>
                      </div>
                      <pre className="mz-fs-code-snippet">{codeText}</pre>
                    </div>
                  )}

                  {/* Industry Use Case & Pitfall Tips */}
                  <div className="mz-fs-callout usecase">
                    <div className="mz-fs-callout-icon">
                      <LuSparkles size={16} />
                    </div>
                    <div className="mz-fs-callout-text">
                      <h5>Practical Industry Use Case</h5>
                      <p>
                        Understanding this fundamental principle is vital in real-world scenarios to avoid hidden bugs, maximize operational efficiency, and satisfy industry quality standards.
                      </p>
                    </div>
                  </div>

                  <div className="mz-fs-callout tip">
                    <div className="mz-fs-callout-icon">
                      <LuLightbulb size={16} />
                    </div>
                    <div className="mz-fs-callout-text">
                      <h5>Key Takeaway & Best Practice</h5>
                      <p>
                        Always verify structural boundaries, leverage immutable constructs where state stability is required, and measure performance implications under production workloads.
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>

      {/* -------------------------------------------------------------
          BOTTOM ACTION BAR (MARK AS COMPLETED)
          ------------------------------------------------------------- */}
      <footer className="mz-fs-footer">
        <div className="mz-fs-footer-info">
          <div className="mz-fs-footer-text">
            <h4>
              {isCompleted
                ? "✓ Theory Activity Completed!"
                : "Ready to advance to Step 2 Practical Exercise?"}
            </h4>
            <p>
              {isCompleted
                ? "You have successfully studied this module's theory notes. You may review them anytime or proceed to the coding exercise."
                : "Review the instructional material thoroughly, then click 'Mark as Completed' to unlock the practical assignment."}
            </p>
          </div>
        </div>

        <div className="mz-fs-footer-actions">
          <button
            type="button"
            className="mz-fs-btn-cancel"
            onClick={handleClose}
          >
            <span>Return to Modules</span>
          </button>

          {isCompleted && (
            <button
              type="button"
              className="mz-fs-btn-complete"
              style={{ background: "#059669" }}
              onClick={() => {
                if (isStandalone || !propModule) {
                  navigate(`/coding-test/${tId}/${mIdx}`);
                } else if (onComplete) {
                  onComplete({ ...module, isStudied: true });
                }
              }}
            >
              <LuArrowRight size={16} />
              <span>Proceed to Step 2: Coding Test</span>
            </button>
          )}

          {!isCompleted && (
            <button
              type="button"
              className="mz-fs-btn-complete"
              onClick={handleMarkAsCompleted}
              disabled={isMarkingComplete}
            >
              <LuCircleCheck size={18} />
              <span>
                {isMarkingComplete
                  ? "Recording Progress..."
                  : "Mark as Completed & Unlock Exercise"}
              </span>
              <LuArrowRight size={16} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
