import React, { useState, useEffect, useRef } from "react";
import "./MasteryZoneGlobalLoader.css";
import logoIcon from "../assets/logo_icon_transparent.png";

/**
 * MasteryZoneGlobalLoader (Minimal & Elegant Edition)
 * 
 * Features:
 * - Clean white background (#ffffff)
 * - Centered Mastery Zone logo with original branding
 * - Subtle logo fade-in animation
 * - "Mastery Zone" typography below the logo
 * - One slim blue-purple progress bar with smooth transition
 * - Small rotating circular spinner + "Loading your workspace..."
 * - Full-screen responsive layout (100vw × 100vh)
 * - Smooth fade-out when loading completes
 * - Respects reduced-motion accessibility preferences
 */
export default function MasteryZoneGlobalLoader({
  progress = null, // Dynamic 0-100 or null for smooth auto-advance
  message = "Loading your workspace...",
  fullScreen = true,
  onComplete = null,
  minDuration = 100,
}) {
  const [displayProgress, setDisplayProgress] = useState(
    typeof progress === "number" ? progress : 40
  );
  const [statusMessage, setStatusMessage] = useState(message);
  const [isExiting, setIsExiting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  // Sync external progress prop if supplied
  useEffect(() => {
    if (typeof progress === "number") {
      const clamped = Math.min(100, Math.max(0, progress));
      setDisplayProgress(clamped);

      if (clamped >= 100) {
        const elapsed = Date.now() - startTimeRef.current;
        const delay = Math.max(20, minDuration - elapsed);
        const exitTimer = setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            onComplete?.();
          }, 150);
        }, delay);
        return () => clearTimeout(exitTimer);
      }
    }
  }, [progress, minDuration, onComplete]);

  // Sync external message prop
  useEffect(() => {
    if (message) {
      setStatusMessage(message);
    }
  }, [message]);

  // Fast & responsive realistic progression when no explicit percentage is provided
  useEffect(() => {
    if (typeof progress === "number") return;

    const stages = [
      { target: 70, step: 4, interval: 15 },
      { target: 90, step: 2, interval: 20 },
      { target: 98, step: 1, interval: 35 },
    ];

    let currentStageIdx = 0;

    timerRef.current = setInterval(() => {
      setDisplayProgress((prev) => {
        const stage = stages[currentStageIdx];
        if (!stage) return prev;

        if (prev < stage.target) {
          return Math.min(stage.target, prev + stage.step);
        } else if (currentStageIdx < stages.length - 1) {
          currentStageIdx++;
        }
        return prev;
      });
    }, 40);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [progress]);

  return (
    <div
      className={`mz-simple-loader-overlay ${fullScreen ? "mz-fullscreen" : "mz-inline"} ${
        isExiting ? "mz-fade-out" : ""
      }`}
      role="status"
      aria-live="polite"
      aria-label={statusMessage}
    >
      <div className="mz-simple-loader-content">
        {/* Centered Mastery Zone Original Logo */}
        <div className="mz-simple-logo-wrap">
          <img
            src={logoIcon}
            alt="Mastery Zone"
            className="mz-simple-logo-img"
          />
        </div>

        {/* Brand Title below logo */}
        <h1 className="mz-simple-brand-title">
          Mastery<span>Zone</span>
        </h1>

        {/* One slim blue-purple progress bar */}
        <div
          className="mz-simple-progress-bar-track"
          role="progressbar"
          aria-valuenow={Math.round(displayProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="mz-simple-progress-bar-fill"
            style={{ width: `${Math.max(4, Math.min(100, displayProgress))}%` }}
          />
        </div>

        {/* Status text */}
        <div className="mz-simple-status-row">
          <span className="mz-simple-status-text">
            {statusMessage}
          </span>
        </div>
      </div>
    </div>
  );
}
