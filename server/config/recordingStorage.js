const fs = require("fs");
const path = require("path");

/**
 * Mastery Zone Centralized Recording Storage Engine
 * Resolves persistent volume mount paths (RECORDINGS_STORAGE_PATH / RECORDINGS_DIR)
 * consistently across upload, validation, streaming, range requests, download,
 * and administrator management.
 */

function getRecordingsDir() {
  const customPath = process.env.RECORDINGS_STORAGE_PATH || process.env.RECORDINGS_DIR;
  const targetDir = customPath ? path.resolve(customPath) : path.join(__dirname, "../uploads/recordings");
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not ensure recordings directory exists:", err.message);
  }
  return targetDir;
}

function resolveRecordingFilePath(safeFilename, recordingDoc = null) {
  if (!safeFilename) return null;
  const cleanName = path.basename(safeFilename);

  // 1. Check recording doc filePath if populated
  if (recordingDoc && typeof recordingDoc.filePath === "string" && recordingDoc.filePath.trim()) {
    const p = recordingDoc.filePath.trim();
    if (fs.existsSync(p)) {
      return p;
    }
    const relativeToUploads = path.join(__dirname, "../uploads", p.replace(/^\/?(uploads\/)?/, ""));
    if (fs.existsSync(relativeToUploads)) {
      return relativeToUploads;
    }
    const inRecDir = path.join(getRecordingsDir(), path.basename(p));
    if (fs.existsSync(inRecDir)) {
      return inRecDir;
    }
  }

  // 2. Primary configured directory (RECORDINGS_STORAGE_PATH / RECORDINGS_DIR)
  const primaryPath = path.join(getRecordingsDir(), cleanName);
  if (fs.existsSync(primaryPath)) {
    return primaryPath;
  }

  // 3. Fallback to default local upload folder
  const defaultLocalPath = path.join(__dirname, "../uploads/recordings", cleanName);
  if (fs.existsSync(defaultLocalPath)) {
    return defaultLocalPath;
  }

  return primaryPath;
}

/**
 * Validates that a file path strictly resolves inside the authorized recording directories.
 * Prevents directory traversal attacks and arbitrary filesystem deletion.
 */
function isPathInsideRecordingsDir(targetPath) {
  if (!targetPath || typeof targetPath !== "string") return false;
  try {
    const resolved = path.resolve(targetPath);
    const recDir = path.resolve(getRecordingsDir());
    const defaultLocalDir = path.resolve(path.join(__dirname, "../uploads/recordings"));
    const uploadsDir = path.resolve(path.join(__dirname, "../uploads"));
    return resolved.startsWith(recDir) || resolved.startsWith(defaultLocalDir) || resolved.startsWith(uploadsDir);
  } catch {
    return false;
  }
}

/**
 * Atomically & safely removes the physical recording file from the filesystem.
 * Handles missing files, prevents arbitrary deletion, and returns actionable status.
 */
function safeDeleteRecordingFile(recordingDoc) {
  if (!recordingDoc) {
    return { success: false, error: "No recording document provided" };
  }
  const safeFilename = path.basename(
    recordingDoc.filePath ||
    `${recordingDoc.recordingId}.${recordingDoc.mimeType?.includes("mp4") ? "mp4" : "webm"}`
  );
  const resolvedPath = resolveRecordingFilePath(safeFilename, recordingDoc) ||
    (recordingDoc.filePath && fs.existsSync(recordingDoc.filePath) ? path.resolve(recordingDoc.filePath) : null);

  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    // Physical file is already absent on disk
    return { success: true, alreadyMissing: true, path: resolvedPath };
  }

  if (!isPathInsideRecordingsDir(resolvedPath)) {
    return {
      success: false,
      error: `Security violation: Path '${resolvedPath}' is outside the authorized recording storage boundary.`,
      path: resolvedPath,
    };
  }

  try {
    fs.unlinkSync(resolvedPath);
    return { success: true, deletedPath: resolvedPath };
  } catch (err) {
    return { success: false, error: err.message, path: resolvedPath };
  }
}

module.exports = {
  getRecordingsDir,
  resolveRecordingFilePath,
  isPathInsideRecordingsDir,
  safeDeleteRecordingFile,
};
