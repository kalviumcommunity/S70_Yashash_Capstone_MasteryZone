const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

let evidenceGridFSBucket = null;

function getEvidenceGridFSBucket() {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      if (!evidenceGridFSBucket || evidenceGridFSBucket.s?.db !== mongoose.connection.db) {
        evidenceGridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
          bucketName: "proctoring_evidence",
        });
      }
      return evidenceGridFSBucket;
    }
  } catch (err) {
    console.warn("Could not obtain evidence GridFS bucket:", err.message);
  }
  return null;
}

async function saveEvidenceToGridFS(filename, buffer, metadata = {}) {
  const bucket = getEvidenceGridFSBucket();
  if (!bucket || !Buffer.isBuffer(buffer)) return null;
  const cleanName = path.basename(filename);

  return new Promise((resolve, reject) => {
    const ext = path.extname(cleanName).toLowerCase();
    const contentType =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

    const uploadStream = bucket.openUploadStream(cleanName, {
      contentType,
      metadata: {
        uploadedAt: new Date(),
        ...metadata,
      },
    });

    const fileId = uploadStream.id;
    uploadStream.on("finish", () => resolve({ fileId, filename: cleanName }));
    uploadStream.on("error", reject);
    uploadStream.end(buffer);
  });
}

async function getEvidenceFromGridFS(filename) {
  const bucket = getEvidenceGridFSBucket();
  if (!bucket) return null;
  const cleanName = path.basename(filename);
  try {
    const file = await mongoose.connection.db
      .collection("proctoring_evidence.files")
      .findOne({ filename: cleanName });
    return file || null;
  } catch {
    return null;
  }
}

async function downloadEvidenceGridFSToBuffer(filename) {
  const bucket = getEvidenceGridFSBucket();
  if (!bucket) return null;
  const cleanName = path.basename(filename);
  const fileDoc = await getEvidenceFromGridFS(cleanName);
  if (!fileDoc) return null;

  return new Promise((resolve) => {
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(fileDoc._id);
    downloadStream.on("data", (c) => chunks.push(c));
    downloadStream.on("error", () => resolve(null));
    downloadStream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Emits a real-time proctoring audit synchronization event to authorized admin clients.
 */
function emitProctoringSessionUpdate(io, sessionId, eventType, extra = {}) {
  if (!io || !sessionId) return;
  const payload = {
    sessionId,
    eventType,
    timestamp: new Date().toISOString(),
    ...extra,
  };
  try {
    io.to("super_admin_room").emit("proctoring_session_updated", payload);
    io.to(`proctoring_audit_${sessionId}`).emit("proctoring_session_updated", payload);
  } catch (err) {
    console.warn("Socket proctoring broadcast warning:", err.message);
  }
}

/**
 * Merges incoming client telemetry into session.deviceInfo strictly & honestly.
 * Never fabricates true/Granted/100 when data was not provided.
 */
function mergeDeviceInfo(existing = {}, incoming = {}) {
  if (!incoming || typeof incoming !== "object") return existing;

  const next = {
    ...(existing && typeof existing.toObject === "function" ? existing.toObject() : existing || {}),
  };

  if (!next.battery || typeof next.battery !== "object") {
    next.battery = { percentage: null, charging: null, supported: null };
  }

  // Camera
  if (incoming.camera !== undefined && incoming.camera !== null) {
    next.camera = Boolean(incoming.camera);
    if (!incoming.cameraPermission) {
      next.cameraPermission = next.camera ? "Granted" : "Denied";
    }
    if (!incoming.cameraStreamStatus) {
      next.cameraStreamStatus = next.camera ? "Active" : "Inactive";
    }
  }
  if (incoming.cameraPermission) next.cameraPermission = incoming.cameraPermission;
  if (incoming.cameraStreamStatus) next.cameraStreamStatus = incoming.cameraStreamStatus;
  if (typeof incoming.cameraLabel === "string") next.cameraLabel = incoming.cameraLabel;
  if (typeof incoming.cameraDisconnections === "number") {
    next.cameraDisconnections = incoming.cameraDisconnections;
  }

  // Microphone
  if (incoming.microphone !== undefined && incoming.microphone !== null) {
    next.microphone = Boolean(incoming.microphone);
    if (!incoming.microphonePermission) {
      next.microphonePermission = next.microphone ? "Granted" : "Denied";
    }
    if (!incoming.microphoneStreamStatus) {
      next.microphoneStreamStatus = next.microphone ? "Active" : "Inactive";
    }
  }
  if (incoming.microphonePermission) next.microphonePermission = incoming.microphonePermission;
  if (incoming.microphoneStreamStatus) next.microphoneStreamStatus = incoming.microphoneStreamStatus;
  if (typeof incoming.microphoneLabel === "string") next.microphoneLabel = incoming.microphoneLabel;
  if (typeof incoming.microphoneDisconnections === "number") {
    next.microphoneDisconnections = incoming.microphoneDisconnections;
  }

  // Screen Share
  if (incoming.screenShare !== undefined && incoming.screenShare !== null) {
    next.screenShare = Boolean(incoming.screenShare);
    if (!incoming.screenSharePermission) {
      next.screenSharePermission = next.screenShare ? "Granted" : "Denied";
    }
    if (!incoming.screenShareStreamStatus) {
      next.screenShareStreamStatus = next.screenShare ? "Active" : "Inactive";
    }
  }
  if (incoming.screenSharePermission) next.screenSharePermission = incoming.screenSharePermission;
  if (incoming.screenShareStreamStatus) next.screenShareStreamStatus = incoming.screenShareStreamStatus;
  if (typeof incoming.displaySurface === "string" && incoming.displaySurface) {
    next.displaySurface = incoming.displaySurface;
  }

  // Fullscreen & Window Focus
  if (incoming.fullscreen !== undefined && incoming.fullscreen !== null) {
    next.fullscreen = Boolean(incoming.fullscreen);
  }
  if (incoming.windowFocused !== undefined && incoming.windowFocused !== null) {
    next.windowFocused = Boolean(incoming.windowFocused);
  }
  if (typeof incoming.fullscreenExitsCount === "number") {
    next.fullscreenExitsCount = incoming.fullscreenExitsCount;
  }
  if (typeof incoming.focusLossCount === "number") {
    next.focusLossCount = incoming.focusLossCount;
  }

  // Battery
  if (incoming.battery && typeof incoming.battery === "object") {
    if (incoming.battery.supported !== undefined) next.battery.supported = incoming.battery.supported;
    if (typeof incoming.battery.percentage === "number") next.battery.percentage = incoming.battery.percentage;
    if (incoming.battery.charging !== undefined) next.battery.charging = incoming.battery.charging;
  }

  // Environment metadata
  if (typeof incoming.browser === "string" && incoming.browser) next.browser = incoming.browser;
  if (typeof incoming.platform === "string" && incoming.platform) next.platform = incoming.platform;
  if (typeof incoming.screenResolution === "string" && incoming.screenResolution) {
    next.screenResolution = incoming.screenResolution;
  }
  if (typeof incoming.connectionType === "string" && incoming.connectionType) {
    next.connectionType = incoming.connectionType;
  }
  if (incoming.monitoringActive !== undefined) {
    next.monitoringActive = Boolean(incoming.monitoringActive);
  }

  next.telemetryUpdatedAt = new Date();
  return next;
}

module.exports = {
  getEvidenceGridFSBucket,
  saveEvidenceToGridFS,
  getEvidenceFromGridFS,
  downloadEvidenceGridFSToBuffer,
  emitProctoringSessionUpdate,
  mergeDeviceInfo,
};
