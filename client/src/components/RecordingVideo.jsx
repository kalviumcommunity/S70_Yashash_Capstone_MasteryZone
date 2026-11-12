import React, { forwardRef } from "react";
import { useRecordingPlayback } from "../utils/recordingMedia";

/**
 * Drop-in <video> for recorded meetings / proctoring sessions.
 * Handles authenticated streaming, WebM→MP4 fallback for Safari/iOS, MediaRecorder
 * "Infinity" duration repair, loading/converting state, and a retry path.
 * All standard <video> props are forwarded; user-supplied handlers still run.
 */
const RecordingVideo = forwardRef(function RecordingVideo(
  { recording, onLoadedMetadata, onError, style, wrapperStyle, errorStyle, ...videoProps },
  ref
) {
  const pb = useRecordingPlayback(recording);

  if (!recording) return null;

  if (pb.failed) {
    return (
      <div
        role="alert"
        data-testid="recording-playback-error"
        style={{
          width: "100%",
          padding: "48px 20px",
          textAlign: "center",
          color: "#e2e8f0",
          background: "#0f172a",
          ...errorStyle,
        }}
      >
        <h4 style={{ margin: 0, fontSize: 15, color: "#ffffff" }}>This recording couldn't be played</h4>
        <p style={{ margin: "6px 0 14px", fontSize: 13, color: "#94a3b8" }}>
          Your session may have expired, or the file is still being processed. Retry, or sign in again.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={pb.retry}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#6366f1",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Retry playback
          </button>
          {pb.downloadUrl && (
            <a
              href={pb.downloadUrl}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #334155",
                color: "#e2e8f0",
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Download instead
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!pb.src) {
    return (
      <div
        style={{
          width: "100%",
          padding: "60px 20px",
          textAlign: "center",
          color: "#cbd5e1",
          background: "#0f172a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          ...errorStyle,
        }}
      >
        <span className="mz-rec-video-spinner" />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Connecting to recording stream…</span>
        <style>{`.mz-rec-video-spinner{width:30px;height:30px;border-radius:50%;border:3px solid rgba(255,255,255,.18);border-top-color:#818cf8;animation:mzRecSpin .8s linear infinite}@keyframes mzRecSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", ...wrapperStyle }}>
      <video
        ref={ref}
        src={pb.src}
        controls
        playsInline
        preload="metadata"
        {...videoProps}
        style={style}
        onLoadedMetadata={(e) => {
          pb.onLoadedMetadata(e);
          onLoadedMetadata?.(e);
        }}
        onError={(e) => {
          if (!pb.src) return;
          onError?.(e);
          pb.onError(e);
        }}
      />
      {(pb.status === "loading" || pb.isConverting) && (
        <div
          aria-live="polite"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            pointerEvents: "none",
            color: "#cbd5e1",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span className="mz-rec-video-spinner" />
          <span>{pb.isConverting ? "Optimizing video for your device…" : "Loading recording…"}</span>
          <style>{`.mz-rec-video-spinner{width:30px;height:30px;border-radius:50%;border:3px solid rgba(255,255,255,.18);border-top-color:#818cf8;animation:mzRecSpin .8s linear infinite}@keyframes mzRecSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </div>
  );
});

export default RecordingVideo;
