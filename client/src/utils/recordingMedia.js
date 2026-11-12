import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Mastery Zone — shared recording playback helpers.
 *
 * Every recording (new or legacy, meeting or proctoring) is played through the single
 * authenticated streaming endpoint `/api/recordings/stream/<file>` so playback behaves the
 * same for users and admins, on every OS / browser, and after re-login.
 */
const API_BASE = import.meta.env.VITE_API_URL || "";

const SAFE_NAME = /^[^/\\?#]+$/;

/** Extracts the bare stored filename from a recording object or any recording URL. */
export function getRecordingFilename(recOrUrl) {
  if (!recOrUrl) return "";
  const candidates =
    typeof recOrUrl === "string"
      ? [recOrUrl]
      : [recOrUrl.streamUrl, recOrUrl.fileUrl, recOrUrl.url, recOrUrl.recordingUrl, recOrUrl.fileName, recOrUrl.filePath];

  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue;
    if (raw.startsWith("blob:") || raw.startsWith("data:")) continue;
    const tail = raw.split("?")[0].split("#")[0].split(/[\\/]/).filter(Boolean).pop();
    if (tail && SAFE_NAME.test(tail) && !tail.includes("..")) {
      try {
        return decodeURIComponent(tail);
      } catch {
        return tail;
      }
    }
  }
  if (typeof recOrUrl === "object" && recOrUrl.recordingId) return String(recOrUrl.recordingId);
  return "";
}

function getAuthToken() {
  try {
    const t = localStorage.getItem("token");
    return t && t !== "null" && t !== "undefined" ? t : "";
  } catch {
    return "";
  }
}

/**
 * Builds an authenticated, cross-origin-safe playback URL.
 * @param {object|string} recOrUrl recording document or URL
 * @param {{format?: "mp4", download?: boolean}} [opts]
 */
export function getRecordingStreamUrl(recOrUrl, opts = {}) {
  if (typeof recOrUrl === "string" && (recOrUrl.startsWith("blob:") || recOrUrl.startsWith("data:"))) {
    return recOrUrl;
  }
  const filename = getRecordingFilename(recOrUrl);
  if (!filename) return "";

  const route = opts.download ? "download" : "stream";
  const params = new URLSearchParams();
  const token = getAuthToken();
  if (token) params.set("token", token);
  if (opts.format === "mp4") params.set("format", "mp4");
  const qs = params.toString();
  return `${API_BASE}/api/recordings/${route}/${encodeURIComponent(filename)}${qs ? `?${qs}` : ""}`;
}

/** True when this browser can decode the WebM that MediaRecorder produces. */
export function canPlayWebm() {
  if (typeof document === "undefined") return true;
  try {
    const v = document.createElement("video");
    return Boolean(
      v.canPlayType('video/webm; codecs="vp8, opus"') ||
        v.canPlayType('video/webm; codecs="vp9, opus"') ||
        v.canPlayType("video/webm")
    );
  } catch {
    return true;
  }
}

/**
 * MediaRecorder WebM files have no duration header, so browsers report `Infinity` and the
 * seek bar is broken. Seeking far past the end forces the browser to compute the real
 * duration, then we jump back to where the viewer was.
 */
export function fixInfiniteDuration(video) {
  if (!video || video.__mzDurationFixing) return;
  if (Number.isFinite(video.duration) && video.duration > 0) return;
  video.__mzDurationFixing = true;
  const restoreTo = video.currentTime || 0;
  const done = () => {
    video.removeEventListener("durationchange", onChange);
    video.removeEventListener("timeupdate", onChange);
    video.__mzDurationFixing = false;
    try {
      video.currentTime = restoreTo;
    } catch {}
  };
  const onChange = () => {
    if (Number.isFinite(video.duration) && video.duration > 0) done();
  };
  video.addEventListener("durationchange", onChange);
  video.addEventListener("timeupdate", onChange);
  try {
    video.currentTime = 1e101;
  } catch {
    done();
  }
  setTimeout(() => video.__mzDurationFixing && done(), 4000);
}

/**
 * React hook that yields a robust playback source for a recording, automatically falling
 * back from the original WebM to an on-demand MP4 rendition (Safari / iOS / older Edge)
 * and exposing a retry that re-reads the latest login token.
 */
export function useRecordingPlayback(recording) {
  const identity = recording ? recording.recordingId || getRecordingFilename(recording) : "";
  const recRef = useRef(recording);
  recRef.current = recording;

  const [nonce, setNonce] = useState(0);
  const key = `${identity}|${nonce}`;
  const [state, setState] = useState({ key, attempt: 0, status: "loading" });
  // Reset synchronously whenever a different recording (or a retry) is requested.
  const current = state.key === key ? state : { key, attempt: 0, status: "loading" };
  const { attempt, status } = current;

  const formats = useMemo(() => {
    if (!identity) return [];
    const name = getRecordingFilename(recRef.current).toLowerCase();
    if (name.endsWith(".mp4")) return ["original"];
    return canPlayWebm() ? ["original", "mp4"] : ["mp4", "original"];
  }, [identity]);

  const src = useMemo(() => {
    if (!identity || attempt >= formats.length) return "";
    const fmt = formats[attempt];
    return getRecordingStreamUrl(recRef.current, fmt === "mp4" ? { format: "mp4" } : {});
    // nonce forces a fresh token after retry / re-login
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, attempt, formats, nonce]);

  const onError = useCallback(() => {
    setState((prev) => {
      const base = prev.key === key ? prev : { key, attempt: 0, status: "loading" };
      const next = base.attempt + 1;
      return { key, attempt: next, status: next >= formats.length ? "error" : "converting" };
    });
  }, [key, formats.length]);

  const onLoadedMetadata = useCallback(
    (e) => {
      setState((prev) => ({ ...(prev.key === key ? prev : { key, attempt: 0 }), status: "ready" }));
      fixInfiniteDuration(e?.currentTarget || e?.target);
    },
    [key]
  );

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  // Pick up a fresh token automatically if the user re-logs in in another tab.
  useEffect(() => {
    const onStorage = (ev) => {
      if (ev.key === "token" && ev.newValue) retry();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [retry]);

  return {
    src,
    status,
    failed: status === "error",
    isConverting: status === "converting",
    onError,
    onLoadedMetadata,
    retry,
    downloadUrl: identity ? getRecordingStreamUrl(recRef.current, { download: true }) : "",
  };
}
