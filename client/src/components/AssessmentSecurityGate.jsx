import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import {
  LuShieldCheck,
  LuCamera,
  LuMic,
  LuMonitor,
  LuMaximize,
  LuCheck,
  LuX,
  LuTriangleAlert,
  LuBattery,
  LuBatteryCharging,
  LuBatteryWarning,
  LuArrowRight,
  LuArrowLeft,
  LuRotateCcw,
  LuInfo,
  LuLock,
  LuClock,
  LuFileText,
  LuRocket,
  LuEye,
  LuCircleCheck,
  LuFlame,
  LuCpu,
  LuWifi,
} from "react-icons/lu";
import "./assessmentSecurityGate.css";
import ThemeToggle from "./ThemeToggle.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";
const SIGNAL_RESTORE_MS = 100;

function getActiveFullscreenElement() {
  if (typeof document === "undefined") return null;
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  );
}

function formatVerificationTimestamp(date = new Date()) {
  try {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
}

function sanitizeBrowserDeviceLabel(rawLabel, fallback = "Available") {
  if (!rawLabel || typeof rawLabel !== "string") return fallback;
  // Strip hardware vendor/product hex IDs like (05ac:8514) or [046d:0825] to avoid exposing raw hardware IDs
  const cleaned = rawLabel
    .replace(/\s*[([][0-9a-fA-F]{4}:[0-9a-fA-F]{4}[)\]]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return fallback;
  return cleaned.length > 34 ? `${cleaned.slice(0, 32)}…` : cleaned;
}

function describeMediaPermissionError(err, deviceTitle) {
  const errName = err?.name || "";
  if (errName === "NotAllowedError" || errName === "PermissionDeniedError" || errName === "SecurityError") {
    return `${deviceTitle} permission was denied. Allow access in your browser site permissions and retry.`;
  }
  if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
    return `No ${deviceTitle.toLowerCase()} device was found. Connect a working ${deviceTitle.toLowerCase()} and retry.`;
  }
  if (errName === "NotReadableError" || errName === "TrackStartError") {
    return `${deviceTitle} is unavailable or currently in use by another application.`;
  }
  if (errName === "OverconstrainedError") {
    return `${deviceTitle} does not support the required capture constraints.`;
  }
  if (errName === "AbortError") {
    return `${deviceTitle} connection request was cancelled.`;
  }
  return `${deviceTitle} verification failed: ${err?.message || "Unable to access device."}`;
}

/* ============================================================================
   LIGHTWEIGHT ANALOG CRT TELEVISION STATIC CANVAS
   - Procedural VHF monochrome snow + horizontal RF noise streaks
   - Gradually decelerates and fades out during signal restoration
   - Pauses animation automatically when prefers-reduced-motion is enabled
   ============================================================================ */
function RetroTvStaticCanvas({ phase, seedOffset = 1 }) {
  const canvasRef = useRef(null);
  const phaseRef = useRef(phase);
  const restoreStartRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
    if (phase === "restoring") {
      restoreStartRef.current = performance.now();
    }
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return undefined;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    const buf32 = new Uint32Array(imageData.data.buffer);

    let seed = (0x9e3779b9 ^ (seedOffset * 7919)) >>> 0;
    const nextRand = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return seed >>> 0;
    };

    const drawStaticFrame = (intensity = 1, allowInterference = true) => {
      const tearRow = allowInterference && (nextRand() & 31) === 0 ? nextRand() % (height - 8) : -100;
      const darkBandRow = allowInterference && (nextRand() & 15) === 0 ? nextRand() % height : -100;
      let prevLuma = 120;

      for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        const isTear = y >= tearRow && y < tearRow + 4;
        const isDarkBand = Math.abs(y - darkBandRow) < 6;

        for (let x = 0; x < width; x++) {
          const r = nextRand();
          let raw = r & 255;

          // Analog horizontal RF phosphor streak correlation
          let luma = (raw * 3 + prevLuma) >> 2;
          prevLuma = luma;

          if (isTear) {
            luma = Math.min(255, luma + 85);
          } else if (isDarkBand) {
            luma = luma >> 1;
          }

          // Contrast curve resembling vintage CRT snow
          luma = luma > 180 ? Math.min(255, luma + 34) : luma < 75 ? luma >> 1 : luma;
          luma = Math.round(luma * intensity);

          // Cool CRT phosphor tint (slight blue-white balance)
          const red = (luma * 242) >> 8;
          const green = (luma * 248) >> 8;
          const blue = luma;

          buf32[rowOffset + x] = (255 << 24) | (blue << 16) | (green << 8) | red;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const motionQuery =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    if (motionQuery?.matches) {
      drawStaticFrame(0.65, false);
      return undefined;
    }

    let rafId = null;
    let lastDrawTime = 0;

    const tick = (now) => {
      const currentPhase = phaseRef.current;
      let frameInterval = 46; // ~22fps authentic analog TV cadence
      let intensity = 0.96;
      let allowInterference = true;

      if (currentPhase === "requesting") {
        frameInterval = 38;
        intensity = 0.72;
        allowInterference = false;
      } else if (currentPhase === "restoring") {
        const elapsed = Math.max(0, now - restoreStartRef.current);
        const progress = Math.min(1, elapsed / SIGNAL_RESTORE_MS);
        // Gradually slow down static refresh rate and decay snow contrast
        frameInterval = 46 + progress * 240;
        intensity = Math.max(0.12, 0.88 * (1 - progress * 0.85));
        allowInterference = false;
      }

      if (now - lastDrawTime >= frameInterval) {
        lastDrawTime = now;
        drawStaticFrame(intensity, allowInterference);
      }

      rafId = requestAnimationFrame(tick);
    };

    drawStaticFrame(0.95, true);
    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [seedOffset]);

  return <canvas ref={canvasRef} width={192} height={112} className="mz-crt-static-canvas" aria-hidden="true" />;
}

/* ============================================================================
   RETRO CRT BROKEN TELEVISION OVERLAY (UNVERIFIED -> REQUESTING -> RESTORING)
   ============================================================================ */
function RetroCrtMalfunctionOverlay({
  variant,
  phase,
  channelCode,
  signalBadge,
  title,
  subtitle,
  seedOffset,
  crtStyleVars,
}) {
  if (phase === "verified") return null;

  const isRequesting = phase === "requesting";
  const isRestoring = phase === "restoring";
  const isMiniWindowed = variant === "fullscreen";

  const renderVariantIcon = () => {
    if (isRequesting) {
      return (
        <div className="mz-crt-osd-icon">
          <span className="mz-inline-spinner" style={{ width: 18, height: 18 }} />
        </div>
      );
    }

    if (variant === "mic") {
      return (
        <div className="mz-crt-wave-interference">
          <div className="mz-crt-osd-icon" style={{ marginBottom: 0, width: 34, height: 34 }}>
            <LuMic size={17} />
          </div>
          <svg className="mz-crt-wave-svg" viewBox="0 0 96 28" fill="none" aria-hidden="true">
            <path
              d="M2 14 L14 14 L19 5 L25 23 L31 9 L36 18 L43 14 L52 14 L57 4 L63 24 L69 11 L75 16 L94 14"
              stroke="#e2e8f0"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="3 2"
            />
          </svg>
        </div>
      );
    }

    if (variant === "camera") {
      return (
        <div className="mz-crt-osd-icon">
          <LuCamera size={19} />
        </div>
      );
    }

    if (variant === "screen") {
      return (
        <div className="mz-crt-osd-icon">
          <LuMonitor size={19} />
        </div>
      );
    }

    return (
      <div className="mz-crt-osd-icon" style={{ width: 34, height: 34, marginBottom: 5 }}>
        <LuMaximize size={17} />
      </div>
    );
  };

  const bezelElement = (
    <div
      className={`mz-crt-bezel ${isMiniWindowed ? "mz-crt-bezel-mini" : ""} ${isRestoring ? "is-restoring" : ""}`}
      style={crtStyleVars}
    >
      <div className="mz-crt-tube">
        <div className="mz-crt-tube-inner">
          <div className="mz-crt-static-fallback" />
          <RetroTvStaticCanvas phase={phase} seedOffset={seedOffset} />
          <div className="mz-crt-roll-bar" />
          <div className="mz-crt-interference-bar" />
          <div className="mz-crt-scanlines" />
          <div className="mz-crt-vignette" />

          <div className="mz-crt-channel-tag">
            <span>{channelCode}</span>
            <span className={`mz-crt-signal-pill ${isRequesting ? "tuning" : ""}`}>
              {isRequesting ? "TUNING…" : signalBadge}
            </span>
          </div>

          <div className="mz-crt-osd">
            {renderVariantIcon()}
            <p className="mz-crt-osd-title">{isRequesting ? "ACQUIRING SIGNAL…" : title}</p>
            <p className="mz-crt-osd-sub">
              {isRequesting ? "Awaiting browser hardware authorization…" : subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="mz-crt-bezel-chin">
        <div className="mz-crt-knobs">
          <span className="mz-crt-knob" />
          <span className="mz-crt-knob" />
          <span className="mz-crt-knob" />
        </div>
        <span className="mz-crt-brand-mark">MZ-CRT SECURE MONITOR</span>
        <span
          className={`mz-crt-power-led ${
            isRestoring ? "locked" : isRequesting ? "tuning" : ""
          }`}
        />
      </div>
    </div>
  );

  return (
    <>
      {isMiniWindowed ? (
        <div className={`mz-crt-windowed-stage ${isRestoring ? "is-restoring" : ""}`} style={crtStyleVars}>
          {bezelElement}
        </div>
      ) : (
        bezelElement
      )}
      {isRestoring && <div className="mz-crt-restore-flash" aria-hidden="true" />}
    </>
  );
}

/* ============================================================================
   MAIN COMPONENT: ASSESSMENT SECURITY GATE
   ============================================================================ */
export default function AssessmentSecurityGate({
  assessmentTitle = "Coding Assessment",
  timeLimitMinutes = 60,
  questionId,
  problemData,
  onCancel,
  onStartAssessment,
}) {
  // Step Workflow: 1 = Overview, 2 = Device Verification, 3 = Final Readiness
  const [currentStep, setCurrentStep] = useState(1);

  // 1. Webcam Video states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraPhase, setCameraPhase] = useState("unverified"); // unverified | requesting | restoring | verified
  const [isCameraMirrored, setIsCameraMirrored] = useState(true);
  const [cameraMeta, setCameraMeta] = useState(null);
  const [cameraError, setCameraError] = useState("");

  // 2. Microphone Signal states
  const [micActive, setMicActive] = useState(false);
  const [micStream, setMicStream] = useState(null);
  const [micVolume, setMicVolume] = useState(0);
  const [isMicLoading, setIsMicLoading] = useState(false);
  const [micPhase, setMicPhase] = useState("unverified");
  const [micMeta, setMicMeta] = useState(null);
  const [micError, setMicError] = useState("");

  // 3. Entire Screen Sharing states
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [displaySurface, setDisplaySurface] = useState("monitor");
  const [isScreenLoading, setIsScreenLoading] = useState(false);
  const [screenPhase, setScreenPhase] = useState("unverified");
  const [screenMeta, setScreenMeta] = useState(null);
  const [screenError, setScreenError] = useState("");

  // 4. Fullscreen Mode states
  const [fullscreenActive, setFullscreenActive] = useState(() => Boolean(getActiveFullscreenElement()));
  const [isFullscreenLoading, setIsFullscreenLoading] = useState(false);
  const [fullscreenPhase, setFullscreenPhase] = useState(() =>
    getActiveFullscreenElement() ? "verified" : "unverified"
  );
  const [fullscreenMeta, setFullscreenMeta] = useState(() =>
    getActiveFullscreenElement()
      ? {
          mode: "Fullscreen",
          status: "Active",
          viewport:
            typeof window !== "undefined" ? `${window.innerWidth}×${window.innerHeight}` : "",
          verifiedAt: formatVerificationTimestamp(),
        }
      : null
  );
  const [fullscreenError, setFullscreenError] = useState("");

  const [gateError, setGateError] = useState("");
  const [isStartingExam, setIsStartingExam] = useState(false);

  // Candidate Details for Assessment
  const [candidateName, setCandidateName] = useState(() => {
    try {
      const raw = localStorage.getItem("user") || sessionStorage.getItem("user") || localStorage.getItem("mz_user") || sessionStorage.getItem("mz_user");
      if (raw) {
        const u = JSON.parse(raw);
        const userObj = u.user || u;
        return userObj.fullName || userObj.name || userObj.username || "";
      }
    } catch {
      return "";
    }
    return "";
  });
  const [candidateEmail, setCandidateEmail] = useState(() => {
    try {
      const raw = localStorage.getItem("user") || sessionStorage.getItem("user") || localStorage.getItem("mz_user") || sessionStorage.getItem("mz_user");
      if (raw) {
        const u = JSON.parse(raw);
        const userObj = u.user || u;
        return userObj.email || "";
      }
    } catch {
      return "";
    }
    return "";
  });
  const [candidateId, setCandidateId] = useState(() => `CAND-${Date.now().toString().slice(-6)}`);
  const [organization, setOrganization] = useState("Mastery Zone Candidate Evaluation");
  const [isSupervisorMode, setIsSupervisorMode] = useState(false);
  const [launchedSessionId, setLaunchedSessionId] = useState(null);

  // Battery Telemetry
  const [batteryInfo, setBatteryInfo] = useState({
    percentage: 100,
    charging: false,
    supported: false,
  });

  // Media, lock, timer, and canvas refs
  const cameraStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const handedOffToWorkspaceRef = useRef(false);

  const cameraLockRef = useRef(false);
  const micLockRef = useRef(false);
  const screenLockRef = useRef(false);
  const fsLockRef = useRef(false);

  const restoreTimersRef = useRef({
    camera: null,
    mic: null,
    screen: null,
    fullscreen: null,
  });

  const cameraPreviewRef = useRef(null);
  const screenPreviewRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    micStreamRef.current = micStream;
  }, [micStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  const clearRestoreTimer = useCallback((key) => {
    if (restoreTimersRef.current[key]) {
      clearTimeout(restoreTimersRef.current[key]);
      restoreTimersRef.current[key] = null;
    }
  }, []);

  const triggerSignalRestoration = useCallback(
    (key, setPhaseFn) => {
      clearRestoreTimer(key);
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        setPhaseFn("verified");
        return;
      }

      setPhaseFn("restoring");
      restoreTimersRef.current[key] = setTimeout(() => {
        restoreTimersRef.current[key] = null;
        setPhaseFn("verified");
      }, SIGNAL_RESTORE_MS);
    },
    [clearRestoreTimer]
  );

  // -------------------------------------------------------------
  // BATTERY STATUS MONITORING
  // -------------------------------------------------------------
  useEffect(() => {
    let batteryInstance = null;
    let updateBatteryFn = null;

    if (typeof navigator !== "undefined" && typeof navigator.getBattery === "function") {
      navigator
        .getBattery()
        .then((battery) => {
          batteryInstance = battery;
          updateBatteryFn = () => {
            setBatteryInfo({
              percentage: Math.round(battery.level * 100),
              charging: battery.charging,
              supported: true,
            });
          };
          updateBatteryFn();
          battery.addEventListener("levelchange", updateBatteryFn);
          battery.addEventListener("chargingchange", updateBatteryFn);
        })
        .catch(() => {
          setBatteryInfo({ percentage: 100, charging: true, supported: false });
        });
    } else {
      setBatteryInfo({ percentage: 100, charging: true, supported: false });
    }

    return () => {
      if (batteryInstance && updateBatteryFn) {
        batteryInstance.removeEventListener("levelchange", updateBatteryFn);
        batteryInstance.removeEventListener("chargingchange", updateBatteryFn);
      }
    };
  }, []);

  // -------------------------------------------------------------
  // ATTACH LIVE CAMERA FEED TO PREVIEW
  // -------------------------------------------------------------
  useEffect(() => {
    if (cameraActive && cameraStream && cameraPreviewRef.current) {
      if (cameraPreviewRef.current.srcObject !== cameraStream) {
        cameraPreviewRef.current.srcObject = cameraStream;
      }
      cameraPreviewRef.current.play().catch(() => {});
    }
  }, [cameraActive, cameraStream, currentStep, cameraPhase]);

  // -------------------------------------------------------------
  // ATTACH LIVE SCREEN SHARE FEED TO PREVIEW
  // -------------------------------------------------------------
  useEffect(() => {
    if (screenShareActive && screenStream && screenPreviewRef.current) {
      if (screenPreviewRef.current.srcObject !== screenStream) {
        screenPreviewRef.current.srcObject = screenStream;
      }
      screenPreviewRef.current.play().catch(() => {});
    }
  }, [screenShareActive, screenStream, currentStep, screenPhase]);

  // -------------------------------------------------------------
  // REAL-TIME MICROPHONE AUDIO VISUALIZER (ZERO FAKE ACTIVITY)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!micActive || !micStream) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setMicVolume(0);
      return undefined;
    }

    const analyser = analyserRef.current;
    if (!analyser) return undefined;

    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.fftSize);

    const renderAudioMeter = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteTimeDomainData(timeData);
      analyserRef.current.getByteFrequencyData(freqData);

      // Compute genuine RMS acoustic energy from time-domain waveform (centered at 128)
      let sumSquares = 0;
      for (let i = 0; i < timeData.length; i++) {
        const centered = (timeData[i] - 128) / 128;
        sumSquares += centered * centered;
      }
      const rms = Math.sqrt(sumSquares / timeData.length);

      // Noise-floor threshold so silent rooms show 0% with zero simulated movement
      const cleanPercent = rms < 0.01 ? 0 : Math.min(100, Math.round(rms * 280));
      setMicVolume(cleanPercent);

      const canvas = waveformCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          // Center baseline guide
          ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, height - 4);
          ctx.lineTo(width, height - 4);
          ctx.stroke();

          const barCount = 24;
          const gap = 3;
          const barWidth = Math.max(4, Math.floor((width - gap * (barCount - 1)) / barCount));

          for (let i = 0; i < barCount; i++) {
            const binIndex = Math.min(freqData.length - 1, Math.floor((i / barCount) * (freqData.length * 0.78)));
            const rawVal = cleanPercent === 0 ? 0 : freqData[binIndex] || 0;
            const normalized = rawVal / 255;
            const barHeight = normalized <= 0.02 ? 2 : Math.max(3, Math.round(normalized * (height - 8)));
            const x = i * (barWidth + gap);
            const y = height - 3 - barHeight;

            if (normalized <= 0.02) {
              ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
            } else {
              const gradient = ctx.createLinearGradient(0, height, 0, 0);
              gradient.addColorStop(0, "#2563eb");
              gradient.addColorStop(1, "#10b981");
              ctx.fillStyle = gradient;
            }

            ctx.beginPath();
            if (typeof ctx.roundRect === "function") {
              ctx.roundRect(x, y, barWidth, barHeight, 2);
            } else {
              ctx.rect(x, y, barWidth, barHeight);
            }
            ctx.fill();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(renderAudioMeter);
    };

    animFrameRef.current = requestAnimationFrame(renderAudioMeter);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [micActive, micStream, currentStep]);

  // -------------------------------------------------------------
  // FULLSCREEN & RESIZE EVENT LISTENERS
  // -------------------------------------------------------------
  useEffect(() => {
    const handleFsChange = () => {
      const isNowFs = Boolean(getActiveFullscreenElement());
      setFullscreenActive(isNowFs);

      if (isNowFs) {
        setFullscreenError("");
        setFullscreenMeta((prev) => ({
          mode: "Fullscreen",
          status: "Active",
          viewport: `${window.innerWidth}×${window.innerHeight}`,
          verifiedAt: prev?.verifiedAt || formatVerificationTimestamp(),
        }));
      } else {
        clearRestoreTimer("fullscreen");
        setFullscreenPhase("unverified");
        setFullscreenMeta(null);
      }
    };

    const handleResize = () => {
      if (getActiveFullscreenElement()) {
        setFullscreenMeta((prev) =>
          prev
            ? {
                ...prev,
                viewport: `${window.innerWidth}×${window.innerHeight}`,
              }
            : prev
        );
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange", handleFsChange);
    document.addEventListener("MSFullscreenChange", handleFsChange);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
      document.removeEventListener("MSFullscreenChange", handleFsChange);
      window.removeEventListener("resize", handleResize);
    };
  }, [clearRestoreTimer]);

  // -------------------------------------------------------------
  // HARDWARE DISCONNECTION & PERMISSION REVOCATION WATCHERS
  // -------------------------------------------------------------
  const resetCameraState = useCallback(
    (reasonMessage = "") => {
      clearRestoreTimer("camera");
      if (cameraStreamRef.current) {
        try {
          cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
      }
      if (cameraPreviewRef.current) {
        cameraPreviewRef.current.srcObject = null;
      }
      cameraStreamRef.current = null;
      setCameraStream(null);
      setCameraActive(false);
      setCameraPhase("unverified");
      setCameraMeta(null);
      if (reasonMessage) setCameraError(reasonMessage);
    },
    [clearRestoreTimer]
  );

  const resetMicState = useCallback(
    (reasonMessage = "") => {
      clearRestoreTimer("mic");
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (micStreamRef.current) {
        try {
          micStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
      }
      micStreamRef.current = null;
      setMicStream(null);
      setMicActive(false);
      setMicVolume(0);
      setMicPhase("unverified");
      setMicMeta(null);
      if (reasonMessage) setMicError(reasonMessage);
    },
    [clearRestoreTimer]
  );

  const resetScreenState = useCallback(
    (reasonMessage = "") => {
      clearRestoreTimer("screen");
      if (screenStreamRef.current) {
        try {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
      }
      if (screenPreviewRef.current) {
        screenPreviewRef.current.srcObject = null;
      }
      screenStreamRef.current = null;
      setScreenStream(null);
      setScreenShareActive(false);
      setScreenPhase("unverified");
      setScreenMeta(null);
      if (reasonMessage) setScreenError(reasonMessage);
    },
    [clearRestoreTimer]
  );

  useEffect(() => {
    const handleDeviceChange = () => {
      const camTrack = cameraStreamRef.current?.getVideoTracks?.()[0];
      if (cameraActive && (!camTrack || camTrack.readyState === "ended")) {
        resetCameraState("Camera was disconnected. Reconnect your webcam to continue.");
      }

      const micTrack = micStreamRef.current?.getAudioTracks?.()[0];
      if (micActive && (!micTrack || micTrack.readyState === "ended")) {
        resetMicState("Microphone was disconnected. Reconnect your microphone to continue.");
      }
    };

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    }

    let camPermStatus = null;
    let micPermStatus = null;
    const onCamPermChange = () => {
      if (camPermStatus?.state === "denied") {
        resetCameraState("Camera permission was revoked in browser settings.");
      }
    };
    const onMicPermChange = () => {
      if (micPermStatus?.state === "denied") {
        resetMicState("Microphone permission was revoked in browser settings.");
      }
    };

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "camera" })
        .then((status) => {
          camPermStatus = status;
          status.addEventListener?.("change", onCamPermChange);
        })
        .catch(() => {});

      navigator.permissions
        .query({ name: "microphone" })
        .then((status) => {
          micPermStatus = status;
          status.addEventListener?.("change", onMicPermChange);
        })
        .catch(() => {});
    }

    return () => {
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      }
      camPermStatus?.removeEventListener?.("change", onCamPermChange);
      micPermStatus?.removeEventListener?.("change", onMicPermChange);
    };
  }, [cameraActive, micActive, resetCameraState, resetMicState]);

  // -------------------------------------------------------------
  // FULL STREAM TEARDOWN ON CANCEL / UNMOUNT
  // -------------------------------------------------------------
  const cleanUpStreams = useCallback(() => {
    Object.keys(restoreTimersRef.current).forEach((k) => {
      if (restoreTimersRef.current[k]) {
        clearTimeout(restoreTimersRef.current[k]);
        restoreTimersRef.current[k] = null;
      }
    });

    const streamsToStop = [
      cameraStreamRef.current,
      micStreamRef.current,
      screenStreamRef.current,
    ];

    streamsToStop.forEach((s) => {
      if (s) {
        try {
          s.getTracks().forEach((track) => {
            try {
              track.onended = null;
              track.enabled = false;
              track.stop();
            } catch {}
          });
        } catch {}
      }
    });

    if (cameraPreviewRef.current) {
      try {
        cameraPreviewRef.current.srcObject = null;
      } catch {}
    }

    if (screenPreviewRef.current) {
      try {
        screenPreviewRef.current.srcObject = null;
      } catch {}
    }

    cameraStreamRef.current = null;
    micStreamRef.current = null;
    screenStreamRef.current = null;
    setCameraStream(null);
    setMicStream(null);
    setScreenStream(null);
    setCameraActive(false);
    setMicActive(false);
    setScreenShareActive(false);
    setCameraPhase("unverified");
    setMicPhase("unverified");
    setScreenPhase("unverified");
    setCameraMeta(null);
    setMicMeta(null);
    setScreenMeta(null);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }
    analyserRef.current = null;

    try {
      if (getActiveFullscreenElement()) {
        const exitFn =
          document.exitFullscreen ||
          document.webkitExitFullscreen ||
          document.mozCancelFullScreen ||
          document.msExitFullscreen;
        if (exitFn) {
          exitFn.call(document).catch(() => {});
        }
      }
    } catch {}
    setFullscreenActive(false);
    setFullscreenPhase("unverified");
    setFullscreenMeta(null);
  }, []);

  // Ensure unmount cleans up local timers/frames, and stops media tracks if not handed off to exam workspace
  useEffect(() => {
    return () => {
      Object.keys(restoreTimersRef.current).forEach((k) => {
        if (restoreTimersRef.current[k]) {
          clearTimeout(restoreTimersRef.current[k]);
          restoreTimersRef.current[k] = null;
        }
      });
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (!handedOffToWorkspaceRef.current) {
        [cameraStreamRef.current, micStreamRef.current, screenStreamRef.current].forEach((s) => {
          if (s) {
            try {
              s.getTracks().forEach((t) => {
                t.onended = null;
                t.stop();
              });
            } catch {}
          }
        });
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch(() => {});
        }
      }
    };
  }, []);

  // Cross-tab synchronization: Listen for submit / termination to kill all hardware & fullscreen
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel("mz_proc_sync");
      bc.onmessage = (event) => {
        if (
          event.data?.type === "SESSION_SUBMITTED" ||
          event.data?.type === "SESSION_TERMINATED"
        ) {
          handedOffToWorkspaceRef.current = false;
          cleanUpStreams();
          setIsSupervisorMode(false);
        }
      };
    } catch {}

    return () => {
      if (bc) bc.close();
    };
  }, [cleanUpStreams]);

  const handleClose = () => {
    handedOffToWorkspaceRef.current = false;
    cleanUpStreams();
    if (onCancel) onCancel();
  };

  // -------------------------------------------------------------
  // 1. REQUEST CAMERA
  // -------------------------------------------------------------
  const handleRequestCamera = async () => {
    if (cameraLockRef.current || isCameraLoading) return;
    cameraLockRef.current = true;
    setGateError("");
    setCameraError("");
    setIsCameraLoading(true);
    setCameraPhase("requesting");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser does not support webcam video capture.");
      }

      // Stop any prior camera stream before requesting a fresh one
      if (cameraStreamRef.current) {
        try {
          cameraStreamRef.current.getTracks().forEach((t) => {
            t.onended = null;
            t.stop();
          });
        } catch {}
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      const videoTrack = stream?.getVideoTracks?.()[0];
      if (!videoTrack || videoTrack.readyState !== "live") {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        throw new Error("Webcam stream did not deliver an active video track.");
      }

      videoTrack.onended = () => {
        resetCameraState("Webcam connection ended. Reconnect your camera to continue.");
        toast.warn("Webcam stream was disconnected.");
      };

      const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
      let permState = "Granted";
      if (navigator.permissions?.query) {
        try {
          const p = await navigator.permissions.query({ name: "camera" });
          if (p?.state) {
            permState = p.state.charAt(0).toUpperCase() + p.state.slice(1);
          }
        } catch {}
      }

      const resolution =
        settings.width && settings.height ? `${settings.width}×${settings.height}` : null;

      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setCameraActive(true);
      setCameraMeta({
        deviceLabel: sanitizeBrowserDeviceLabel(videoTrack.label, "Available"),
        permission: permState,
        resolution,
        status: "Connected",
        verifiedAt: formatVerificationTimestamp(),
      });

      triggerSignalRestoration("camera", setCameraPhase);
      toast.success("Webcam connected and verified!", { toastId: "cam_ok" });
    } catch (err) {
      const msg = describeMediaPermissionError(err, "Camera");
      resetCameraState(msg);
      setGateError(msg);
      toast.error("Camera verification failed.");
    } finally {
      setIsCameraLoading(false);
      cameraLockRef.current = false;
    }
  };

  // -------------------------------------------------------------
  // 2. REQUEST MICROPHONE & REAL-TIME AUDIO VISUALIZER
  // -------------------------------------------------------------
  const handleRequestMicrophone = async () => {
    if (micLockRef.current || isMicLoading) return;
    micLockRef.current = true;
    setGateError("");
    setMicError("");
    setIsMicLoading(true);
    setMicPhase("requesting");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser does not support microphone audio capture.");
      }

      if (micStreamRef.current) {
        try {
          micStreamRef.current.getTracks().forEach((t) => {
            t.onended = null;
            t.stop();
          });
        } catch {}
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      const audioTrack = stream?.getAudioTracks?.()[0];
      if (!audioTrack || audioTrack.readyState !== "live") {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        throw new Error("Microphone stream did not deliver an active audio track.");
      }

      audioTrack.onended = () => {
        resetMicState("Microphone input was disconnected. Reconnect your microphone to continue.");
        toast.warn("Microphone disconnected.");
      };

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          await audioContextRef.current.close().catch(() => {});
        }

        const audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") {
          await audioCtx.resume().catch(() => {});
        }
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);
        analyserRef.current = analyser;
      }

      let permState = "Granted";
      if (navigator.permissions?.query) {
        try {
          const p = await navigator.permissions.query({ name: "microphone" });
          if (p?.state) {
            permState = p.state.charAt(0).toUpperCase() + p.state.slice(1);
          }
        } catch {}
      }

      micStreamRef.current = stream;
      setMicStream(stream);
      setMicActive(true);
      setMicMeta({
        deviceLabel: sanitizeBrowserDeviceLabel(audioTrack.label, "Available"),
        permission: permState,
        input: "Active",
        verifiedAt: formatVerificationTimestamp(),
      });

      triggerSignalRestoration("mic", setMicPhase);
      toast.success("Microphone connected and verified!", { toastId: "mic_ok" });
    } catch (err) {
      const msg = describeMediaPermissionError(err, "Microphone");
      resetMicState(msg);
      setGateError(msg);
      toast.error("Microphone verification failed.");
    } finally {
      setIsMicLoading(false);
      micLockRef.current = false;
    }
  };

  // -------------------------------------------------------------
  // 3. REQUEST ENTIRE SCREEN SHARING
  // -------------------------------------------------------------
  const handleRequestScreenShare = async () => {
    if (screenLockRef.current || isScreenLoading) return;
    screenLockRef.current = true;
    setGateError("");
    setScreenError("");
    setIsScreenLoading(true);
    setScreenPhase("requesting");

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("Screen sharing is not supported by your current browser.");
      }

      if (screenStreamRef.current) {
        try {
          screenStreamRef.current.getTracks().forEach((t) => {
            t.onended = null;
            t.stop();
          });
        } catch {}
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: false,
      });

      const videoTrack = stream?.getVideoTracks?.()[0];
      if (!videoTrack || videoTrack.readyState !== "live") {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        throw new Error("Screen capture stream could not be established.");
      }

      const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
      const surface = settings.displaySurface || "monitor";
      setDisplaySurface(surface);

      // Enforce entire screen rather than single browser tab or isolated window
      if (surface === "browser" || surface === "window") {
        videoTrack.stop();
        const tabMsg =
          "Entire Screen Required: You shared a single tab or window. Click 'Share Entire Screen' and select your entire screen/monitor.";
        resetScreenState(tabMsg);
        setGateError(tabMsg);
        toast.warn("Please share your entire screen, not a single tab or window.");
        return;
      }

      videoTrack.onended = () => {
        resetScreenState("Screen sharing was stopped. Re-share your entire screen to continue.");
        toast.warn("Screen sharing was stopped.");
      };

      const resolution =
        settings.width && settings.height ? `${settings.width}×${settings.height}` : null;

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setScreenShareActive(true);
      setScreenMeta({
        display: resolution ? `Shared (${resolution})` : "Shared",
        surface: "Entire Screen",
        status: "Active",
        verifiedAt: formatVerificationTimestamp(),
      });

      triggerSignalRestoration("screen", setScreenPhase);
      toast.success("Entire screen sharing active!", { toastId: "screen_ok" });
    } catch (err) {
      const msg = describeMediaPermissionError(err, "Screen sharing");
      resetScreenState(msg);
      setGateError(msg);
    } finally {
      setIsScreenLoading(false);
      screenLockRef.current = false;
    }
  };

  // -------------------------------------------------------------
  // 4. ENTER FULLSCREEN MODE
  // -------------------------------------------------------------
  const handleRequestFullscreen = async () => {
    if (fsLockRef.current || isFullscreenLoading) return;
    fsLockRef.current = true;
    setGateError("");
    setFullscreenError("");
    setIsFullscreenLoading(true);
    setFullscreenPhase("requesting");

    try {
      const docEl = document.documentElement;
      const reqFn =
        docEl.requestFullscreen ||
        docEl.webkitRequestFullscreen ||
        docEl.mozRequestFullScreen ||
        docEl.msRequestFullscreen;

      if (!reqFn) {
        throw new Error("Fullscreen API is not supported in this browser environment.");
      }

      await reqFn.call(docEl);

      // Verify actual browser fullscreen element rather than assuming click succeeded
      const activeFsEl = getActiveFullscreenElement();
      if (!activeFsEl) {
        throw new Error("Browser did not enter fullscreen mode. Please allow fullscreen and try again.");
      }

      setFullscreenActive(true);
      setFullscreenMeta({
        mode: "Fullscreen",
        viewport: `${window.innerWidth}×${window.innerHeight}`,
        status: "Active",
        verifiedAt: formatVerificationTimestamp(),
      });

      triggerSignalRestoration("fullscreen", setFullscreenPhase);
      toast.success("Fullscreen mode active!", { toastId: "fs_ok" });
    } catch (err) {
      clearRestoreTimer("fullscreen");
      setFullscreenActive(false);
      setFullscreenPhase("unverified");
      setFullscreenMeta(null);
      const msg = `Fullscreen mode could not be activated: ${err?.message || "Permission denied."}`;
      setFullscreenError(msg);
      setGateError(msg);
    } finally {
      setIsFullscreenLoading(false);
      fsLockRef.current = false;
    }
  };

  // Single Source-of-Truth Verification Progress (0/4 -> 4/4)
  const verifiedCount =
    (cameraActive ? 1 : 0) +
    (micActive ? 1 : 0) +
    (screenShareActive ? 1 : 0) +
    (fullscreenActive ? 1 : 0);
  const isAllReady = verifiedCount === 4;
  const progressPercentage = (verifiedCount / 4) * 100;

  // -------------------------------------------------------------
  // START PROCTORED ASSESSMENT
  // -------------------------------------------------------------
  const handleStart = async () => {
    if (!isAllReady) {
      setGateError("Please complete all 4 mandatory security checks before starting.");
      setCurrentStep(2);
      return;
    }

    if (isStartingExam) return;
    setIsStartingExam(true);
    setGateError("");

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      let sid = launchedSessionId;

      // Only invoke backend coding proctored session APIs if explicit coding problem metadata exists
      const hasCodingProblem = Boolean(questionId || problemData?.id);
      if (hasCodingProblem) {
        try {
          const initRes = await fetch(`${API_BASE}/api/coding/proctored-session/init`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              candidateDetails: {
                fullName: candidateName.trim() || "Candidate",
                email: candidateEmail.trim(),
                candidateId: candidateId.trim(),
                organization: organization.trim(),
              },
              questionId: questionId || problemData?.id,
              assessmentTitle: assessmentTitle || problemData?.title || "Coding Assessment",
              problemData,
              timeLimitMinutes,
            }),
          });

          if (initRes.ok) {
            const initData = await initRes.json();
            if (initData?.sessionId) {
              sid = initData.sessionId;
              setLaunchedSessionId(sid);
            }
          }
        } catch (e) {
          console.warn("Coding proctored session init note:", e.message);
        }
      }

      if (!sid) {
        sid = `mz_proc_${Date.now()}`;
        setLaunchedSessionId(sid);
      }

      if (!getActiveFullscreenElement()) {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
          }
        } catch {}
      }

      if (onStartAssessment) {
        handedOffToWorkspaceRef.current = true;
        try {
          await onStartAssessment({
            sessionId: sid,
            cameraStream,
            micStream,
            screenStream,
            audioContext: audioContextRef.current,
            batteryInfo,
            displaySurface,
            candidateDetails: {
              fullName: candidateName.trim(),
              email: candidateEmail.trim(),
              candidateId: candidateId.trim(),
              organization: organization.trim(),
            },
          });
          toast.success("Assessment started with verified hardware and fullscreen security.", {
            toastId: "gate_started_ok",
          });
        } catch (startErr) {
          console.error("onStartAssessment error:", startErr);
          handedOffToWorkspaceRef.current = false;
          setIsStartingExam(false);
          toast.error(startErr.message || "Failed to start assessment");
          return;
        }
      } else {
        const assessmentUrl = `${window.location.origin}/assessment/${sid}`;
        const newTab = window.open(assessmentUrl, "_blank");
        if (newTab) {
          setIsSupervisorMode(true);
          toast.success("Assessment verified! Coding workspace opened in separate tab.");
        }
      }
    } catch (err) {
      console.warn("Session init note:", err.message);
      if (onStartAssessment) {
        handedOffToWorkspaceRef.current = true;
        try {
          await onStartAssessment({
            cameraStream,
            micStream,
            screenStream,
            audioContext: audioContextRef.current,
            batteryInfo,
            displaySurface,
            candidateDetails: {
              fullName: candidateName.trim(),
              email: candidateEmail.trim(),
              candidateId: candidateId.trim(),
              organization: organization.trim(),
            },
          });
        } catch (subErr) {
          handedOffToWorkspaceRef.current = false;
          setIsStartingExam(false);
          toast.error(subErr.message || "Failed to launch assessment");
        }
      }
    } finally {
      setIsStartingExam(false);
    }
  };

  return (
    <div className="mz-gate-overlay">
      {/* Top Header Bar */}
      <header className="mz-gate-header">
        <div className="mz-gate-header-left">
          <div className="mz-gate-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
                stroke="url(#gateGrad)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"
                stroke="url(#gateGrad)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M12 10C10.9 10 10 10.9 10 12"
                stroke="url(#gateGrad)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gateGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="mz-gate-header-title">Mastery Zone Assessment Security Gate</h1>
            <p className="mz-gate-header-subtitle">Pre-assessment identity, environment, and screen verification</p>
          </div>
        </div>

        <div className="mz-gate-header-right">
          <ThemeToggle />
          <button
            type="button"
            className="mz-gate-close-btn"
            onClick={handleClose}
            title="Cancel Setup & Exit"
          >
            <LuX size={18} />
          </button>
        </div>
      </header>

      {isSupervisorMode ? (
        <main className="mz-gate-container mz-anim-fade-in" style={{ maxWidth: "680px", margin: "40px auto", textAlign: "center" }}>
          <div className="mz-gate-hero-card" style={{ padding: "2.5rem" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <LuShieldCheck size={36} color="#10b981" />
            </div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--mz-text-primary)" }}>Coding Workspace Active in Separate Tab</h2>
            <p style={{ color: "var(--mz-text-muted)", fontSize: "0.88rem", margin: "0 0 1.5rem" }}>
              Your proctored coding assessment is running in a dedicated window. Keep this tab open to maintain continuous proctoring supervision and recovery telemetry.
            </p>
            <div style={{ background: "var(--mz-surface-subtle)", border: "1px solid var(--mz-border)", borderRadius: "8px", padding: "1.25rem", textAlign: "left", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--mz-text-muted)" }}>Candidate:</span>
                <strong>{candidateName} ({candidateId})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--mz-text-muted)" }}>Session ID:</span>
                <code style={{ color: "var(--mz-blue-text)", fontFamily: "monospace" }}>{launchedSessionId}</code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--mz-text-muted)" }}>Proctoring State:</span>
                <span style={{ color: "var(--mz-emerald-text)", fontWeight: 700 }}>SYNCHRONIZED (Active)</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                className="mz-gate-btn-primary"
                onClick={() => {
                  window.open(`${window.location.origin}/assessment/${launchedSessionId}`, "_blank");
                }}
              >
                <LuMaximize size={16} />
                <span>Switch to Assessment Tab</span>
              </button>
              <button
                type="button"
                className="mz-gate-btn-secondary"
                onClick={handleClose}
              >
                <span>Exit Assessment</span>
              </button>
            </div>
          </div>
        </main>
      ) : (
        <>
          {/* Three-Step Progress Navigation Bar */}
          <div className="mz-gate-stepper-wrap">
            <div className="mz-gate-stepper">
              {/* STEP 1 TAB */}
              <button
                type="button"
                className={`mz-gate-step-tab ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}
                onClick={() => setCurrentStep(1)}
              >
                <div className="mz-step-num">
                  {currentStep > 1 ? <LuCheck size={14} /> : "1"}
                </div>
                <div className="mz-step-tab-text">
                  <span className="mz-step-tab-title">Step 1</span>
                  <span className="mz-step-tab-sub">Assessment Overview</span>
                </div>
              </button>

              <div className={`mz-step-connector ${currentStep >= 2 ? "active" : ""}`} />

              {/* STEP 2 TAB */}
              <button
                type="button"
                className={`mz-gate-step-tab ${
                  currentStep === 2 ? "active" : isAllReady ? "completed" : ""
                }`}
                onClick={() => setCurrentStep(2)}
              >
                <div className="mz-step-num">
                  {isAllReady ? <LuCheck size={14} /> : "2"}
                </div>
                <div className="mz-step-tab-text">
                  <span className="mz-step-tab-title">Step 2</span>
                  <span className="mz-step-tab-sub">Device Verification ({verifiedCount}/4)</span>
                </div>
              </button>

              <div className={`mz-step-connector ${currentStep >= 3 || isAllReady ? "active" : ""}`} />

              {/* STEP 3 TAB */}
              <button
                type="button"
                className={`mz-gate-step-tab ${currentStep === 3 ? "active" : isAllReady ? "completed" : ""}`}
                onClick={() => {
                  if (isAllReady) setCurrentStep(3);
                }}
                disabled={!isAllReady && currentStep !== 3}
                title={
                  isAllReady
                    ? "Proceed to Final Readiness"
                    : `Complete all 4 device checks first (${verifiedCount}/4 Verified)`
                }
              >
                <div className="mz-step-num">
                  {isAllReady ? <LuCheck size={14} /> : "3"}
                </div>
                <div className="mz-step-tab-text">
                  <span className="mz-step-tab-title">Step 3</span>
                  <span className="mz-step-tab-sub">Final Readiness</span>
                </div>
              </button>
            </div>
          </div>

          {/* Main Container */}
          <main className="mz-gate-container">
            {gateError && currentStep !== 3 && (
              <div className="mz-gate-error-banner" role="alert">
                <LuTriangleAlert size={20} className="mz-error-icon" />
                <div className="mz-error-text">{gateError}</div>
                <button
                  type="button"
                  className="mz-error-dismiss"
                  onClick={() => setGateError("")}
                  title="Dismiss error"
                >
                  <LuX size={15} />
                </button>
              </div>
            )}

            {/* =========================================================================
                STEP 1: ASSESSMENT OVERVIEW & RULES
                ========================================================================= */}
            {currentStep === 1 && (
              <section className="mz-gate-step-view mz-anim-fade-in">
                <div className="mz-gate-hero-card">
                  <div className="mz-gate-hero-top">
                    <span className="mz-gate-hero-pill">
                      <LuShieldCheck size={14} /> Accreditation Proctored Assessment
                    </span>
                    <span className="mz-gate-hero-timer-pill">
                      <LuClock size={14} /> {timeLimitMinutes === 60 ? "60 Minutes (1 Hour)" : `${timeLimitMinutes} Minutes`} Duration
                    </span>
                  </div>

                  <h2 className="mz-gate-hero-title">{assessmentTitle}</h2>
                  <p className="mz-gate-hero-desc">
                    Welcome to the Mastery Zone proctored assessment. This examination is conducted in a secure, sandboxed environment to ensure academic integrity. Before proceeding, please review the examination rules and required permissions.
                  </p>

                  <div className="mz-gate-meta-badges">
                    <div className="mz-meta-badge">
                      <LuFlame size={15} color="#2563eb" />
                      <span>10 Real-time Test Cases</span>
                    </div>
                    <div className="mz-meta-badge">
                      <LuCpu size={15} color="#6366f1" />
                      <span>Sandboxed Cloud Compiler</span>
                    </div>
                    <div className="mz-meta-badge">
                      <LuCircleCheck size={15} color="#059669" />
                      <span>80% Passing Mark</span>
                    </div>
                    <div className="mz-meta-badge">
                      <LuWifi size={15} color="#0891b2" />
                      <span>Real-time Telemetry Synced</span>
                    </div>
                    <div className="mz-meta-badge">
                      {batteryInfo.charging ? (
                        <LuBatteryCharging size={15} color="#2563eb" />
                      ) : batteryInfo.percentage <= 20 ? (
                        <LuBatteryWarning size={15} color="#dc2626" />
                      ) : (
                        <LuBattery size={15} color="#059669" />
                      )}
                      <span>Power: {batteryInfo.percentage}% {batteryInfo.charging ? "(Charging ⚡)" : "(Battery)"}</span>
                    </div>
                  </div>
                </div>

                {/* 4 Core Examination Integrity Rules */}
                <div className="mz-gate-rules-section">
                  <h3 className="mz-gate-section-title">
                    <LuFileText size={18} /> Examination Guidelines & Proctoring Rules
                  </h3>

                  <div className="mz-gate-rules-grid">
                    <div className="mz-gate-rule-card">
                      <div className="mz-rule-icon blue">
                        <LuMaximize size={20} />
                      </div>
                      <div className="mz-rule-content">
                        <h4>1. Dedicated Fullscreen Mode</h4>
                        <p>The assessment must run in continuous edge-to-edge fullscreen. Window blurs, resizing, or switching browser tabs will trigger automated anomaly flags.</p>
                      </div>
                    </div>

                    <div className="mz-gate-rule-card">
                      <div className="mz-rule-icon purple">
                        <LuEye size={20} />
                      </div>
                      <div className="mz-rule-content">
                        <h4>2. Live Audio-Visual Monitoring</h4>
                        <p>Your webcam and microphone will provide real-time ambient telemetry in the compiler sidebar to ensure a solo, quiet, and unassisted testing environment.</p>
                      </div>
                    </div>

                    <div className="mz-gate-rule-card">
                      <div className="mz-rule-icon indigo">
                        <LuMonitor size={20} />
                      </div>
                      <div className="mz-rule-content">
                        <h4>3. Entire Screen Sharing Enforced</h4>
                        <p>You must share your complete primary desktop monitor. Sharing only a single browser tab or isolated window is prohibited and blocked by the gate.</p>
                      </div>
                    </div>

                    <div className="mz-gate-rule-card">
                      <div className="mz-rule-icon green">
                        <LuLock size={20} />
                      </div>
                      <div className="mz-rule-content">
                        <h4>4. Privacy &amp; Data Protection</h4>
                        <p>Camera, audio, and screen feeds are evaluated locally in browser memory. No raw video or audio is recorded or stored on remote servers.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Details Form */}
                <div className="mz-gate-candidate-form-section">
                  <h3 className="mz-gate-section-title">
                    <LuFileText size={18} /> Candidate Assessment Registration
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--mz-text-muted)", margin: "4px 0 12px 0" }}>
                    Confirm candidate identification details. These credentials will be permanently sealed onto your attempt report.
                  </p>
                  <div className="mz-gate-form-grid">
                    <div className="mz-gate-form-group">
                      <label>Candidate Full Name</label>
                      <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                      />
                    </div>
                    <div className="mz-gate-form-group">
                      <label>Official Email Address</label>
                      <input
                        type="email"
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        placeholder="e.g. alex@university.edu"
                      />
                    </div>
                    <div className="mz-gate-form-group">
                      <label>Student / Candidate ID</label>
                      <input
                        type="text"
                        value={candidateId}
                        onChange={(e) => setCandidateId(e.target.value)}
                        placeholder="e.g. CAND-8921"
                      />
                    </div>
                    <div className="mz-gate-form-group">
                      <label>Accreditation Organization</label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="e.g. Mastery Zone Technical Assessment"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mz-gate-step-actions">
                  <button
                    type="button"
                    className="mz-gate-btn-secondary"
                    onClick={handleClose}
                  >
                    <span>Exit Setup</span>
                  </button>

                  <button
                    type="button"
                    className="mz-gate-btn-primary"
                    onClick={() => setCurrentStep(2)}
                  >
                    <span>Proceed to Device Verification</span>
                    <LuArrowRight size={16} />
                  </button>
                </div>
              </section>
            )}

            {/* =========================================================================
                STEP 2: HARDWARE & DEVICE VERIFICATION (4 RETRO CRT -> LIVE SIGNAL CARDS)
                ========================================================================= */}
            {currentStep === 2 && (
              <section className="mz-gate-step-view mz-anim-fade-in">
                <div className="mz-gate-step2-header">
                  <div>
                    <h2 className="mz-gate-view-title">Hardware & Device Verification</h2>
                    <p className="mz-gate-view-sub">
                      Verify camera, microphone, screen share, and fullscreen permissions. All 4 checks must pass before starting.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <div className={`mz-gate-readiness-pill ${isAllReady ? "all-ready" : "pending"}`}>
                      {isAllReady ? <LuCheck size={16} /> : <LuShieldCheck size={16} />}
                      <span>{verifiedCount}/4 Verified</span>
                    </div>
                    <div className="mz-meta-badge" style={{ margin: 0, padding: "7px 14px", borderRadius: "9999px", background: "var(--mz-surface)", border: "1px solid var(--mz-border)" }}>
                      {batteryInfo.charging ? (
                        <LuBatteryCharging size={15} color="#2563eb" />
                      ) : batteryInfo.percentage <= 20 ? (
                        <LuBatteryWarning size={15} color="#dc2626" />
                      ) : (
                        <LuBattery size={15} color="#059669" />
                      )}
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--mz-text-secondary)" }}>
                        Power: {batteryInfo.percentage}% {batteryInfo.charging ? "⚡" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Smart Verification Progress Bar (0/4 -> 4/4) */}
                <div className={`mz-verification-progress-card ${isAllReady ? "complete" : ""}`}>
                  <div className="mz-vp-top-row">
                    <div className="mz-vp-title-group">
                      <LuShieldCheck size={16} color={isAllReady ? "#059669" : "#2563eb"} />
                      <span>
                        {isAllReady
                          ? "All 4 Hardware & Environment Signals Locked"
                          : "Security Signal Verification Progress"}
                      </span>
                    </div>
                    <span className="mz-vp-counter">{verifiedCount}/4 Verified</span>
                  </div>

                  <div
                    className="mz-vp-bar-track"
                    role="progressbar"
                    aria-valuenow={verifiedCount}
                    aria-valuemin={0}
                    aria-valuemax={4}
                  >
                    <div className="mz-vp-bar-fill" style={{ width: `${progressPercentage}%` }} />
                  </div>

                  <div className="mz-vp-checkpoints">
                    <div className={`mz-vp-chip ${cameraActive ? "done" : ""}`}>
                      <span className="mz-vp-chip-dot" />
                      <span>Webcam</span>
                    </div>
                    <div className={`mz-vp-chip ${micActive ? "done" : ""}`}>
                      <span className="mz-vp-chip-dot" />
                      <span>Microphone</span>
                    </div>
                    <div className={`mz-vp-chip ${screenShareActive ? "done" : ""}`}>
                      <span className="mz-vp-chip-dot" />
                      <span>Entire Screen</span>
                    </div>
                    <div className={`mz-vp-chip ${fullscreenActive ? "done" : ""}`}>
                      <span className="mz-vp-chip-dot" />
                      <span>Fullscreen</span>
                    </div>
                  </div>
                </div>

                {/* 4 Independent Verification Cards */}
                <div className="mz-gate-devices-grid">
                  {/* ===========================================================
                      CARD 1: WEBCAM VIDEO
                      =========================================================== */}
                  <div
                    className={`mz-device-card ${
                      cameraActive
                        ? cameraPhase === "restoring"
                          ? "restoring"
                          : "verified"
                        : isCameraLoading
                        ? "requesting"
                        : ""
                    }`}
                  >
                    <div className="mz-device-card-header">
                      <div className="mz-device-icon-wrap blue">
                        <LuCamera size={18} />
                      </div>
                      <div className="mz-device-info">
                        <h4>1. Webcam Video</h4>
                        <span className="mz-device-sub">Identity & attendance telemetry</span>
                      </div>
                      <span
                        className={`mz-device-status-badge ${
                          cameraActive ? "verified" : isCameraLoading ? "requesting" : "pending"
                        }`}
                      >
                        {cameraActive ? (
                          <>
                            <LuCheck size={12} />
                            <span>VERIFIED</span>
                          </>
                        ) : isCameraLoading ? (
                          <>
                            <span className="mz-inline-spinner" style={{ width: 10, height: 10 }} />
                            <span>Requesting</span>
                          </>
                        ) : (
                          <>
                            <span className="mz-status-dot slate" />
                            <span>No Signal</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className={`mz-device-media-viewport ${cameraActive ? "is-verified" : ""}`}>
                      {cameraActive && (
                        <div className="mz-live-preview-stage">
                          <video
                            ref={cameraPreviewRef}
                            autoPlay
                            playsInline
                            muted
                            className={`mz-device-video-stream ${isCameraMirrored ? "mirror" : ""}`}
                          />
                          <div className="mz-device-live-overlay">
                            <span className="mz-live-pill">
                              <span className="mz-live-beacon" /> LIVE WEBCAM
                            </span>
                            <button
                              type="button"
                              className="mz-device-cam-flip"
                              onClick={() => setIsCameraMirrored(!isCameraMirrored)}
                              title="Mirror camera preview"
                            >
                              <LuRotateCcw size={13} />
                            </button>
                          </div>
                        </div>
                      )}

                      <RetroCrtMalfunctionOverlay
                        variant="camera"
                        phase={cameraPhase}
                        channelCode="CH-01 • VIDEO IN"
                        signalBadge="NO SIGNAL"
                        title="NO VIDEO SIGNAL"
                        subtitle="Your camera is waiting for a connection."
                        seedOffset={11}
                        crtStyleVars={{
                          "--crt-cycle": "4.3s",
                          "--crt-roll-speed": "5.6s",
                          "--crt-delay": "0.15s",
                        }}
                      />
                    </div>

                    {cameraActive && cameraMeta && (
                      <div className="mz-device-telemetry-box">
                        <div className="mz-telemetry-headline">
                          <span className="mz-telemetry-headline-text">
                            <LuCircleCheck size={14} color="#059669" />
                            Camera Connected Successfully
                          </span>
                          <span className="mz-telemetry-verified-tag">✓ VERIFIED</span>
                        </div>
                        <div className="mz-telemetry-meta-grid">
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Camera:</span>
                            <span className="mz-telemetry-v" title={cameraMeta.deviceLabel}>
                              {cameraMeta.deviceLabel}
                            </span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Status:</span>
                            <span className="mz-telemetry-v">
                              {cameraMeta.status}
                              {cameraMeta.resolution ? ` (${cameraMeta.resolution})` : ""}
                            </span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Permission:</span>
                            <span className="mz-telemetry-v">{cameraMeta.permission}</span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Verified:</span>
                            <span className="mz-telemetry-v">{cameraMeta.verifiedAt}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!cameraActive && cameraError && (
                      <div className="mz-device-inline-error" role="alert">
                        <LuTriangleAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{cameraError}</span>
                      </div>
                    )}

                    <div className="mz-device-card-footer">
                      {!cameraActive ? (
                        <button
                          type="button"
                          className="mz-device-action-btn primary"
                          onClick={handleRequestCamera}
                          disabled={isCameraLoading}
                        >
                          {isCameraLoading ? (
                            <>
                              <span className="mz-inline-spinner" />
                              <span>Connecting Webcam…</span>
                            </>
                          ) : (
                            <>
                              <LuCamera size={15} />
                              <span>Connect Webcam</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="mz-device-verified-row">
                          <div className="mz-device-ok-tag">
                            <LuCheck size={14} />
                            <span>Video Signal Locked</span>
                          </div>
                          <button
                            type="button"
                            className="mz-device-recheck-btn"
                            onClick={handleRequestCamera}
                            disabled={isCameraLoading}
                            title="Re-verify or switch webcam"
                          >
                            <LuRotateCcw size={12} /> Recheck
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ===========================================================
                      CARD 2: MICROPHONE SIGNAL
                      =========================================================== */}
                  <div
                    className={`mz-device-card ${
                      micActive
                        ? micPhase === "restoring"
                          ? "restoring"
                          : "verified"
                        : isMicLoading
                        ? "requesting"
                        : ""
                    }`}
                  >
                    <div className="mz-device-card-header">
                      <div className="mz-device-icon-wrap purple">
                        <LuMic size={18} />
                      </div>
                      <div className="mz-device-info">
                        <h4>2. Microphone Signal</h4>
                        <span className="mz-device-sub">Acoustic level monitoring</span>
                      </div>
                      <span
                        className={`mz-device-status-badge ${
                          micActive ? "verified" : isMicLoading ? "requesting" : "pending"
                        }`}
                      >
                        {micActive ? (
                          <>
                            <LuCheck size={12} />
                            <span>VERIFIED</span>
                          </>
                        ) : isMicLoading ? (
                          <>
                            <span className="mz-inline-spinner" style={{ width: 10, height: 10 }} />
                            <span>Requesting</span>
                          </>
                        ) : (
                          <>
                            <span className="mz-status-dot slate" />
                            <span>Signal Lost</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className={`mz-device-media-viewport audio-viewport ${micActive ? "is-verified" : ""}`}>
                      {micActive && (
                        <div className="mz-live-preview-stage">
                          <div className="mz-audio-visualizer-box">
                            <div className="mz-audio-meter-header">
                              <span className="mz-audio-meter-label">
                                <span className="mz-status-dot green" />
                                Live Audio Input Level
                              </span>
                              <span
                                className="mz-audio-meter-val"
                                style={{ color: micVolume > 0 ? "#059669" : "#64748b" }}
                              >
                                {micVolume > 0 ? `${micVolume}% (Audio Detected)` : "0% — Silent"}
                              </span>
                            </div>

                            <div className="mz-audio-level-track">
                              <div
                                className="mz-audio-level-fill"
                                style={{ width: `${micVolume}%` }}
                              />
                            </div>

                            <div className="mz-audio-canvas-wrap">
                              <canvas
                                ref={waveformCanvasRef}
                                width={280}
                                height={68}
                                className="mz-audio-canvas"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <RetroCrtMalfunctionOverlay
                        variant="mic"
                        phase={micPhase}
                        channelCode="CH-02 • AUDIO IN"
                        signalBadge="SIGNAL LOST"
                        title="AUDIO SIGNAL LOST"
                        subtitle="Microphone input is not detected."
                        seedOffset={29}
                        crtStyleVars={{
                          "--crt-cycle": "5.1s",
                          "--crt-roll-speed": "6.4s",
                          "--crt-delay": "0.85s",
                        }}
                      />
                    </div>

                    {micActive && micMeta && (
                      <div className="mz-device-telemetry-box">
                        <div className="mz-telemetry-headline">
                          <span className="mz-telemetry-headline-text">
                            <LuCircleCheck size={14} color="#059669" />
                            Microphone Connected Successfully
                          </span>
                          <span className="mz-telemetry-verified-tag">✓ VERIFIED</span>
                        </div>
                        <div className="mz-telemetry-meta-grid">
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Microphone:</span>
                            <span className="mz-telemetry-v" title={micMeta.deviceLabel}>
                              {micMeta.deviceLabel}
                            </span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Input:</span>
                            <span className="mz-telemetry-v">{micMeta.input}</span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Permission:</span>
                            <span className="mz-telemetry-v">{micMeta.permission}</span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Verified:</span>
                            <span className="mz-telemetry-v">{micMeta.verifiedAt}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!micActive && micError && (
                      <div className="mz-device-inline-error" role="alert">
                        <LuTriangleAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{micError}</span>
                      </div>
                    )}

                    <div className="mz-device-card-footer">
                      {!micActive ? (
                        <button
                          type="button"
                          className="mz-device-action-btn primary"
                          onClick={handleRequestMicrophone}
                          disabled={isMicLoading}
                        >
                          {isMicLoading ? (
                            <>
                              <span className="mz-inline-spinner" />
                              <span>Connecting Microphone…</span>
                            </>
                          ) : (
                            <>
                              <LuMic size={15} />
                              <span>Connect Microphone</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="mz-device-verified-row">
                          <div className="mz-device-ok-tag">
                            <LuCheck size={14} />
                            <span>Audio Signal Locked</span>
                          </div>
                          <button
                            type="button"
                            className="mz-device-recheck-btn"
                            onClick={handleRequestMicrophone}
                            disabled={isMicLoading}
                            title="Re-verify microphone"
                          >
                            <LuRotateCcw size={12} /> Recheck
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ===========================================================
                      CARD 3: ENTIRE SCREEN SHARING
                      =========================================================== */}
                  <div
                    className={`mz-device-card ${
                      screenShareActive
                        ? screenPhase === "restoring"
                          ? "restoring"
                          : "verified"
                        : isScreenLoading
                        ? "requesting"
                        : ""
                    }`}
                  >
                    <div className="mz-device-card-header">
                      <div className="mz-device-icon-wrap indigo">
                        <LuMonitor size={18} />
                      </div>
                      <div className="mz-device-info">
                        <h4>3. Entire Screen Sharing</h4>
                        <span className="mz-device-sub">Monitor workspace integrity</span>
                      </div>
                      <span
                        className={`mz-device-status-badge ${
                          screenShareActive ? "verified" : isScreenLoading ? "requesting" : "pending"
                        }`}
                      >
                        {screenShareActive ? (
                          <>
                            <LuCheck size={12} />
                            <span>VERIFIED</span>
                          </>
                        ) : isScreenLoading ? (
                          <>
                            <span className="mz-inline-spinner" style={{ width: 10, height: 10 }} />
                            <span>Requesting</span>
                          </>
                        ) : (
                          <>
                            <span className="mz-status-dot slate" />
                            <span>Signal Lost</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className={`mz-device-media-viewport ${screenShareActive ? "is-verified" : ""}`}>
                      {screenShareActive && (
                        <div className="mz-live-preview-stage">
                          <video
                            ref={screenPreviewRef}
                            autoPlay
                            playsInline
                            muted
                            className="mz-device-video-stream screen"
                          />
                          <div className="mz-device-live-overlay">
                            <span className="mz-live-pill">
                              <span className="mz-live-beacon" /> ENTIRE SCREEN ACTIVE
                            </span>
                          </div>
                        </div>
                      )}

                      <RetroCrtMalfunctionOverlay
                        variant="screen"
                        phase={screenPhase}
                        channelCode="CH-03 • EXT DISPLAY"
                        signalBadge="NO SYNC"
                        title="DISPLAY SIGNAL LOST"
                        subtitle="Your workspace is not being shared."
                        seedOffset={47}
                        crtStyleVars={{
                          "--crt-cycle": "4.8s",
                          "--crt-roll-speed": "5.2s",
                          "--crt-delay": "1.35s",
                        }}
                      />
                    </div>

                    {screenShareActive && screenMeta && (
                      <div className="mz-device-telemetry-box">
                        <div className="mz-telemetry-headline">
                          <span className="mz-telemetry-headline-text">
                            <LuCircleCheck size={14} color="#059669" />
                            Screen Sharing Active
                          </span>
                          <span className="mz-telemetry-verified-tag">✓ VERIFIED</span>
                        </div>
                        <div className="mz-telemetry-meta-grid">
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Display:</span>
                            <span className="mz-telemetry-v">{screenMeta.display}</span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Status:</span>
                            <span className="mz-telemetry-v">{screenMeta.status}</span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Surface:</span>
                            <span className="mz-telemetry-v">{screenMeta.surface}</span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Verified:</span>
                            <span className="mz-telemetry-v">{screenMeta.verifiedAt}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!screenShareActive && screenError && (
                      <div className="mz-device-inline-error" role="alert">
                        <LuTriangleAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{screenError}</span>
                      </div>
                    )}

                    <div className="mz-device-card-footer">
                      {!screenShareActive ? (
                        <button
                          type="button"
                          className="mz-device-action-btn primary"
                          onClick={handleRequestScreenShare}
                          disabled={isScreenLoading}
                        >
                          {isScreenLoading ? (
                            <>
                              <span className="mz-inline-spinner" />
                              <span>Select Entire Screen…</span>
                            </>
                          ) : (
                            <>
                              <LuMonitor size={15} />
                              <span>Share Entire Screen</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="mz-device-verified-row">
                          <div className="mz-device-ok-tag">
                            <LuCheck size={14} />
                            <span>Display Signal Locked</span>
                          </div>
                          <button
                            type="button"
                            className="mz-device-recheck-btn"
                            onClick={handleRequestScreenShare}
                            disabled={isScreenLoading}
                            title="Re-select entire screen"
                          >
                            <LuRotateCcw size={12} /> Reselect
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ===========================================================
                      CARD 4: FULLSCREEN MODE
                      =========================================================== */}
                  <div
                    className={`mz-device-card ${
                      fullscreenActive
                        ? fullscreenPhase === "restoring"
                          ? "restoring"
                          : "verified"
                        : isFullscreenLoading
                        ? "requesting"
                        : ""
                    }`}
                  >
                    <div className="mz-device-card-header">
                      <div className="mz-device-icon-wrap emerald">
                        <LuMaximize size={18} />
                      </div>
                      <div className="mz-device-info">
                        <h4>4. Fullscreen Mode</h4>
                        <span className="mz-device-sub">Isolated browser session</span>
                      </div>
                      <span
                        className={`mz-device-status-badge ${
                          fullscreenActive ? "verified" : isFullscreenLoading ? "requesting" : "pending"
                        }`}
                      >
                        {fullscreenActive ? (
                          <>
                            <LuCheck size={12} />
                            <span>VERIFIED</span>
                          </>
                        ) : isFullscreenLoading ? (
                          <>
                            <span className="mz-inline-spinner" style={{ width: 10, height: 10 }} />
                            <span>Entering</span>
                          </>
                        ) : (
                          <>
                            <span className="mz-status-dot slate" />
                            <span>Windowed</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className={`mz-device-media-viewport fs-viewport ${fullscreenActive ? "is-verified" : ""}`}>
                      {fullscreenActive && (
                        <div className="mz-live-preview-stage">
                          <div className="mz-fs-verified-stage">
                            <div className="mz-fs-screen-diagram">
                              <LuMaximize size={22} color="#059669" />
                              {fullscreenMeta?.viewport && (
                                <span className="mz-fs-diagram-res">{fullscreenMeta.viewport}</span>
                              )}
                            </div>
                            <p className="mz-fs-status-title">Fullscreen Mode Active</p>
                            <p className="mz-fs-status-desc">
                              Edge-to-edge display lock verified. Exiting fullscreen updates status immediately.
                            </p>
                          </div>
                        </div>
                      )}

                      <RetroCrtMalfunctionOverlay
                        variant="fullscreen"
                        phase={fullscreenPhase}
                        channelCode="CH-04 • VIEWPORT"
                        signalBadge="WINDOWED"
                        title="WINDOWED SIGNAL"
                        subtitle="Fullscreen mode has not been activated."
                        seedOffset={73}
                        crtStyleVars={{
                          "--crt-cycle": "5.5s",
                          "--crt-roll-speed": "6.1s",
                          "--crt-delay": "0.55s",
                        }}
                      />
                    </div>

                    {fullscreenActive && fullscreenMeta && (
                      <div className="mz-device-telemetry-box">
                        <div className="mz-telemetry-headline">
                          <span className="mz-telemetry-headline-text">
                            <LuCircleCheck size={14} color="#059669" />
                            Fullscreen Mode Active
                          </span>
                          <span className="mz-telemetry-verified-tag">✓ VERIFIED</span>
                        </div>
                        <div className="mz-telemetry-meta-grid">
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Mode:</span>
                            <span className="mz-telemetry-v">{fullscreenMeta.mode}</span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Status:</span>
                            <span className="mz-telemetry-v">{fullscreenMeta.status}</span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Viewport:</span>
                            <span className="mz-telemetry-v">{fullscreenMeta.viewport || "Fullscreen"}</span>
                          </div>
                          <div className="mz-telemetry-kv">
                            <span className="mz-telemetry-k">Verified:</span>
                            <span className="mz-telemetry-v">{fullscreenMeta.verifiedAt}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!fullscreenActive && fullscreenError && (
                      <div className="mz-device-inline-error" role="alert">
                        <LuTriangleAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{fullscreenError}</span>
                      </div>
                    )}

                    <div className="mz-device-card-footer">
                      {!fullscreenActive ? (
                        <button
                          type="button"
                          className="mz-device-action-btn primary"
                          onClick={handleRequestFullscreen}
                          disabled={isFullscreenLoading}
                        >
                          {isFullscreenLoading ? (
                            <>
                              <span className="mz-inline-spinner" />
                              <span>Entering Fullscreen…</span>
                            </>
                          ) : (
                            <>
                              <LuMaximize size={15} />
                              <span>Enter Fullscreen</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="mz-device-verified-row">
                          <div className="mz-device-ok-tag">
                            <LuCheck size={14} />
                            <span>Fullscreen Signal Locked</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2 Bottom Navigation */}
                <div className="mz-gate-step-actions">
                  <button
                    type="button"
                    className="mz-gate-btn-secondary"
                    onClick={() => setCurrentStep(1)}
                  >
                    <LuArrowLeft size={16} />
                    <span>Back to Overview</span>
                  </button>

                  <button
                    type="button"
                    className="mz-gate-btn-primary"
                    onClick={() => {
                      if (isAllReady) setCurrentStep(3);
                    }}
                    disabled={!isAllReady}
                    title={
                      isAllReady
                        ? "All 4 devices verified — proceed to Final Readiness"
                        : `Complete all 4 verifications to proceed (${verifiedCount}/4 Verified)`
                    }
                  >
                    <span>Proceed to Final Readiness</span>
                    <LuArrowRight size={16} />
                  </button>
                </div>
              </section>
            )}

            {/* =========================================================================
                STEP 3: FINAL READINESS & LAUNCH
                ========================================================================= */}
            {currentStep === 3 && (
              <section className="mz-gate-step-view mz-anim-fade-in">
                <div className="mz-gate-step3-header">
                  <h2 className="mz-gate-view-title">Final Security & Readiness Check</h2>
                  <p className="mz-gate-view-sub">
                    Review your system verification status. All 4 mandatory security checks must be confirmed before the assessment begins.
                  </p>
                </div>

                <div className="mz-gate-readiness-card">
                  <div className="mz-readiness-checklist">
                    {/* 1. Camera Status */}
                    <div className={`mz-checklist-item ${cameraActive ? "pass" : "fail"}`}>
                      <div className="mz-item-status-icon">
                        {cameraActive ? <LuCheck size={16} /> : <LuX size={16} />}
                      </div>
                      <div className="mz-item-content">
                        <strong>1. Webcam Video Feed</strong>
                        <span>
                          {cameraActive
                            ? `Camera Connected Successfully (${cameraMeta?.deviceLabel || "Available"} • Verified ${cameraMeta?.verifiedAt || ""}).`
                            : "Missing: Camera permission has not been granted."}
                        </span>
                      </div>
                      {!cameraActive && (
                        <button
                          type="button"
                          className="mz-checklist-fix-btn"
                          onClick={() => setCurrentStep(2)}
                        >
                          Fix Camera
                        </button>
                      )}
                    </div>

                    {/* 2. Microphone Status */}
                    <div className={`mz-checklist-item ${micActive ? "pass" : "fail"}`}>
                      <div className="mz-item-status-icon">
                        {micActive ? <LuCheck size={16} /> : <LuX size={16} />}
                      </div>
                      <div className="mz-item-content">
                        <strong>2. Microphone Signal Telemetry</strong>
                        <span>
                          {micActive
                            ? `Microphone Connected Successfully (${micMeta?.deviceLabel || "Available"} • Verified ${micMeta?.verifiedAt || ""}).`
                            : "Missing: Microphone access has not been enabled."}
                        </span>
                      </div>
                      {!micActive && (
                        <button
                          type="button"
                          className="mz-checklist-fix-btn"
                          onClick={() => setCurrentStep(2)}
                        >
                          Fix Microphone
                        </button>
                      )}
                    </div>

                    {/* 3. Screen Sharing Status */}
                    <div className={`mz-checklist-item ${screenShareActive ? "pass" : "fail"}`}>
                      <div className="mz-item-status-icon">
                        {screenShareActive ? <LuCheck size={16} /> : <LuX size={16} />}
                      </div>
                      <div className="mz-item-content">
                        <strong>3. Entire Screen Sharing</strong>
                        <span>
                          {screenShareActive
                            ? `Screen Sharing Active (${screenMeta?.display || "Entire Screen"} • Verified ${screenMeta?.verifiedAt || ""}).`
                            : "Missing: Entire screen stream is not currently captured."}
                        </span>
                      </div>
                      {!screenShareActive && (
                        <button
                          type="button"
                          className="mz-checklist-fix-btn"
                          onClick={() => setCurrentStep(2)}
                        >
                          Fix Screen Share
                        </button>
                      )}
                    </div>

                    {/* 4. Fullscreen Status */}
                    <div className={`mz-checklist-item ${fullscreenActive ? "pass" : "fail"}`}>
                      <div className="mz-item-status-icon">
                        {fullscreenActive ? <LuCheck size={16} /> : <LuX size={16} />}
                      </div>
                      <div className="mz-item-content">
                        <strong>4. Dedicated Fullscreen Environment</strong>
                        <span>
                          {fullscreenActive
                            ? `Fullscreen Mode Active (${fullscreenMeta?.viewport || "Fullscreen"} • Verified ${fullscreenMeta?.verifiedAt || ""}).`
                            : "Missing: Fullscreen mode is not engaged."}
                        </span>
                      </div>
                      {!fullscreenActive && (
                        <button
                          type="button"
                          className="mz-checklist-fix-btn"
                          onClick={handleRequestFullscreen}
                        >
                          Enter Fullscreen
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Readiness Outcome Banner */}
                  <div className={`mz-gate-outcome-card ${isAllReady ? "ready" : "unready"}`}>
                    <div className="mz-outcome-icon-wrap">
                      {isAllReady ? <LuRocket size={24} /> : <LuTriangleAlert size={24} />}
                    </div>
                    <div className="mz-outcome-content">
                      <h4>{isAllReady ? "All Security Requirements Cleared!" : `Action Required (${verifiedCount}/4 Verified)`}</h4>
                      <p>
                        {isAllReady
                          ? "Your workstation satisfies all accreditation and proctoring rules. When you are ready, click below to launch your examination workspace."
                          : "One or more required security gates are incomplete. Please complete all 4 device checks above to enable the Start Assessment button."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Workstation Telemetry & Power Health Bar */}
                <div className="mz-gate-meta-badges" style={{ justifyContent: "center", margin: "10px 0 4px" }}>
                  <div className="mz-meta-badge" style={{ background: "var(--mz-surface)" }}>
                    {batteryInfo.charging ? (
                      <LuBatteryCharging size={16} color="#2563eb" />
                    ) : batteryInfo.percentage <= 20 ? (
                      <LuBatteryWarning size={16} color="#dc2626" />
                    ) : (
                      <LuBattery size={16} color="#059669" />
                    )}
                    <span>Workstation Power: {batteryInfo.percentage}% {batteryInfo.charging ? "(Adapter Connected ⚡)" : "(Operating on battery)"}</span>
                  </div>
                  <div className="mz-meta-badge" style={{ background: "var(--mz-surface)" }}>
                    <LuShieldCheck size={16} color="#059669" />
                    <span>System Checks Passed ({verifiedCount}/4 Verified)</span>
                  </div>
                </div>

                {gateError && (
                  <div style={{ padding: "10px 14px", background: "var(--mz-red-bg)", border: "1px solid var(--mz-red-border)", borderRadius: "10px", color: "var(--mz-red-text)", fontSize: "13px", margin: "6px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                    <LuTriangleAlert size={16} style={{ flexShrink: 0 }} />
                    <span>{gateError}</span>
                  </div>
                )}

                {/* Privacy Transparency Strip */}
                <div className="mz-gate-privacy-strip">
                  <LuInfo size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Confidential Examination Guarantee:</strong> Video, audio, and screen feeds are analyzed in local memory only. Streams are never uploaded or stored. Only timestamped anomaly events (e.g. tab switches, fullscreen exits) are logged.
                  </span>
                </div>

                {/* Step 3 Bottom Actions */}
                <div className="mz-gate-step-actions">
                  <button
                    type="button"
                    className="mz-gate-btn-secondary"
                    onClick={() => setCurrentStep(2)}
                  >
                    <LuArrowLeft size={16} />
                    <span>Adjust Devices</span>
                  </button>

                  <button
                    type="button"
                    className={`mz-gate-btn-start-exam ${isAllReady && !isStartingExam ? "ready" : "disabled"}`}
                    onClick={handleStart}
                    disabled={!isAllReady || isStartingExam}
                    title={isAllReady ? "Launch your proctored assessment" : "Complete all 4 checks to unlock"}
                  >
                    <LuRocket size={18} />
                    <span>
                      {isStartingExam
                        ? "Launching Proctored Workspace..."
                        : isAllReady
                        ? "Start Proctored Assessment"
                        : `Complete Checks to Start (${verifiedCount}/4 Verified)`}
                    </span>
                    {isAllReady && !isStartingExam && <LuArrowRight size={18} />}
                  </button>
                </div>
              </section>
            )}
          </main>
        </>
      )}
    </div>
  );
}
