// Real-time Proctoring Hardware Telemetry, Screenshot Evidence, and Stream Recorder
// Strictly reports genuine browser API states — never fabricates or assumes hardware availability.

const getBrowserSummary = () => {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent || "";
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("Chrome/")) return "Google Chrome";
  if (ua.includes("Firefox/")) return "Mozilla Firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Apple Safari";
  return "Web Browser";
};

export const collectLiveDeviceTelemetry = ({
  cameraStream = null,
  micStream = null,
  screenStream = null,
  batteryInfo = null,
  displaySurface = "",
} = {}) => {
  const mediaSupported = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
  const displaySupported = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getDisplayMedia);

  const camTracks = cameraStream?.getVideoTracks?.() || [];
  const liveCamTrack = camTracks.find((t) => t.readyState === "live");
  const camEnded = camTracks.length > 0 && !liveCamTrack;

  const micTracks = micStream?.getAudioTracks?.() || [];
  const liveMicTrack = micTracks.find((t) => t.readyState === "live");
  const micEnded = micTracks.length > 0 && !liveMicTrack;

  const screenTracks = screenStream?.getVideoTracks?.() || [];
  const liveScreenTrack = screenTracks.find((t) => t.readyState === "live");
  const screenEnded = screenTracks.length > 0 && !liveScreenTrack;

  const isFullscreen =
    typeof document !== "undefined" &&
    Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

  const windowFocused = typeof document !== "undefined" ? document.hasFocus() : null;

  const screenSurfaceSetting =
    liveScreenTrack?.getSettings?.()?.displaySurface || displaySurface || "";

  return {
    camera: !mediaSupported ? false : Boolean(liveCamTrack),
    cameraPermission: !mediaSupported
      ? "Unsupported"
      : liveCamTrack || camEnded
      ? "Granted"
      : "Not Recorded",
    cameraStreamStatus: !mediaSupported
      ? "Unsupported"
      : liveCamTrack
      ? "Active"
      : camEnded
      ? "Disconnected"
      : "Inactive",
    cameraLabel: liveCamTrack?.label || "",

    microphone: !mediaSupported ? false : Boolean(liveMicTrack),
    microphonePermission: !mediaSupported
      ? "Unsupported"
      : liveMicTrack || micEnded
      ? "Granted"
      : "Not Recorded",
    microphoneStreamStatus: !mediaSupported
      ? "Unsupported"
      : liveMicTrack
      ? "Active"
      : micEnded
      ? "Disconnected"
      : "Inactive",
    microphoneLabel: liveMicTrack?.label || "",

    screenShare: !displaySupported ? false : Boolean(liveScreenTrack),
    screenSharePermission: !displaySupported
      ? "Unsupported"
      : liveScreenTrack || screenEnded
      ? "Granted"
      : "Not Recorded",
    screenShareStreamStatus: !displaySupported
      ? "Unsupported"
      : liveScreenTrack
      ? "Active"
      : screenEnded
      ? "Ended"
      : "Inactive",
    displaySurface: screenSurfaceSetting,

    fullscreen: isFullscreen,
    windowFocused,

    battery: batteryInfo && typeof batteryInfo.supported === "boolean"
      ? {
          supported: batteryInfo.supported,
          percentage: batteryInfo.supported ? batteryInfo.percentage : null,
          charging: batteryInfo.supported ? batteryInfo.charging : null,
        }
      : { supported: null, percentage: null, charging: null },

    browser: getBrowserSummary(),
    platform: typeof navigator !== "undefined" ? (navigator.platform || "") : "",
    screenResolution:
      typeof window !== "undefined" && window.screen
        ? `${window.screen.width}x${window.screen.height}`
        : "",
    connectionType:
      typeof navigator !== "undefined" && navigator.connection?.effectiveType
        ? navigator.connection.effectiveType
        : "",
    monitoringActive: true,
  };
};

/**
 * Captures a real JPEG frame from an active <video> element or MediaStream.
 * Never fabricates a frame if stream is inactive or video dimensions are 0.
 */
export const captureVideoSnapshot = async (videoElement, fallbackStream = null) => {
  try {
    if (videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0 && videoElement.readyState >= 2) {
      const canvas = document.createElement("canvas");
      const maxWidth = 960;
      const scale = Math.min(1, maxWidth / videoElement.videoWidth);
      canvas.width = Math.round(videoElement.videoWidth * scale);
      canvas.height = Math.round(videoElement.videoHeight * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
      if (dataUrl && dataUrl.length > 500) {
        return { captured: true, imageBase64: dataUrl };
      }
    }

    if (fallbackStream) {
      const liveTrack = fallbackStream.getVideoTracks?.().find((t) => t.readyState === "live");
      if (!liveTrack) {
        return { captured: false, reason: "No live video track available" };
      }
      const tempVideo = document.createElement("video");
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.srcObject = new MediaStream([liveTrack]);
      await tempVideo.play().catch(() => {});
      await new Promise((r) => setTimeout(r, 120));

      if (tempVideo.videoWidth > 0 && tempVideo.videoHeight > 0) {
        const canvas = document.createElement("canvas");
        const maxWidth = 960;
        const scale = Math.min(1, maxWidth / tempVideo.videoWidth);
        canvas.width = Math.round(tempVideo.videoWidth * scale);
        canvas.height = Math.round(tempVideo.videoHeight * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
        tempVideo.srcObject = null;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
        if (dataUrl && dataUrl.length > 500) {
          return { captured: true, imageBase64: dataUrl };
        }
      }
      tempVideo.srcObject = null;
    }

    return { captured: false, reason: "Video stream dimensions unavailable at violation timestamp" };
  } catch (err) {
    return { captured: false, reason: err?.message || "Browser blocked frame capture" };
  }
};

export const uploadViolationEvidence = async ({
  apiBase = "",
  sessionId,
  eventId,
  imageBase64,
  reason,
  severity = "warning",
}) => {
  if (!sessionId || !imageBase64) return null;
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiBase}/api/coding/proctored-session/${sessionId}/evidence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        eventId,
        imageBase64,
        reason,
        severity,
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.ok) return await res.json();
    return null;
  } catch {
    return null;
  }
};

export class ProctoringStreamRecorder {
  constructor({ apiBase = "", sessionId }) {
    this.apiBase = apiBase;
    this.sessionId = sessionId;
    this.recorder = null;
    this.chunks = [];
    this.startedAt = null;
    this.mimeType = "video/webm";
    this.isRecording = false;
    this.hasUploaded = false;
  }

  static pickSupportedMimeType() {
    if (typeof MediaRecorder === "undefined") return null;
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];
    for (const type of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(type)) return type;
      } catch {}
    }
    return "";
  }

  async updateStatus(recordingStatus, extra = {}) {
    if (!this.sessionId) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${this.apiBase}/api/coding/proctored-session/${this.sessionId}/recording-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ recordingStatus, ...extra }),
      });
    } catch {}
  }

  async start({ screenStream, cameraStream, micStream }) {
    if (this.isRecording || typeof MediaRecorder === "undefined") {
      if (typeof MediaRecorder === "undefined") {
        await this.updateStatus("not_recorded", {
          recordingUploadError: "MediaRecorder API is not supported in this browser",
        });
      }
      return false;
    }

    const videoTrack =
      screenStream?.getVideoTracks?.().find((t) => t.readyState === "live") ||
      cameraStream?.getVideoTracks?.().find((t) => t.readyState === "live") ||
      null;

    if (!videoTrack) {
      await this.updateStatus("not_recorded", {
        recordingUploadError: "No active video track available to record",
      });
      return false;
    }

    const tracks = [videoTrack];
    const audioTrack = micStream?.getAudioTracks?.().find((t) => t.readyState === "live");
    if (audioTrack) tracks.push(audioTrack);

    const combinedStream = new MediaStream(tracks);
    const pickedMime = ProctoringStreamRecorder.pickSupportedMimeType();
    if (pickedMime === null) {
      await this.updateStatus("not_recorded", {
        recordingUploadError: "Browser MediaRecorder is unavailable",
      });
      return false;
    }

    this.mimeType = pickedMime || "video/webm";
    this.chunks = [];
    this.startedAt = new Date();

    try {
      const options = pickedMime ? { mimeType: pickedMime, videoBitsPerSecond: 600000 } : { videoBitsPerSecond: 600000 };
      this.recorder = new MediaRecorder(combinedStream, options);
      this.recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };
      this.recorder.start(5000);
      this.isRecording = true;

      await this.updateStatus("recording", {
        recordingMimeType: this.mimeType,
        recordingStartedAt: this.startedAt.toISOString(),
      });
      return true;
    } catch (err) {
      await this.updateStatus("failed", {
        recordingUploadError: err?.message || "Failed to initialize MediaRecorder",
      });
      return false;
    }
  }

  async stopAndUpload() {
    if (!this.recorder || !this.isRecording || this.hasUploaded) return null;
    this.isRecording = false;
    this.hasUploaded = true;

    const endTime = new Date();
    const durationSeconds = Math.max(
      1,
      Math.round((endTime.getTime() - (this.startedAt?.getTime() || endTime.getTime())) / 1000)
    );

    await new Promise((resolve) => {
      if (this.recorder.state === "inactive") return resolve();
      this.recorder.onstop = () => resolve();
      try {
        this.recorder.requestData();
      } catch {}
      try {
        this.recorder.stop();
      } catch {
        resolve();
      }
      setTimeout(resolve, 2500);
    });

    if (this.chunks.length === 0) {
      await this.updateStatus("failed", {
        recordingUploadError: "No media chunks were captured during recording",
      });
      return null;
    }

    const blob = new Blob(this.chunks, { type: this.mimeType || "video/webm" });
    if (blob.size < 500) {
      await this.updateStatus("failed", {
        recordingUploadError: "Captured recording payload was empty",
      });
      return null;
    }

    await this.updateStatus("uploading");

    try {
      const token = localStorage.getItem("token");
      const ext = (this.mimeType || "").includes("mp4") ? "mp4" : "webm";
      const formData = new FormData();
      formData.append("recording", blob, `proctoring_${this.sessionId}.${ext}`);
      formData.append("sessionId", this.sessionId);
      formData.append("durationSeconds", String(durationSeconds));
      formData.append("mimeType", this.mimeType || "video/webm");
      formData.append("startTime", (this.startedAt || endTime).toISOString());
      formData.append("endTime", endTime.toISOString());

      const res = await fetch(
        `${this.apiBase}/api/recordings/proctoring/upload?sessionId=${encodeURIComponent(this.sessionId)}&durationSeconds=${durationSeconds}`,
        {
          method: "POST",
          headers: {
            "x-session-id": this.sessionId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        await this.updateStatus("failed", {
          recordingUploadError: errJson.error || `Upload failed with HTTP ${res.status}`,
        });
        return null;
      }

      return await res.json();
    } catch (err) {
      await this.updateStatus("failed", {
        recordingUploadError: err?.message || "Network error uploading proctoring recording",
      });
      return null;
    }
  }
}
