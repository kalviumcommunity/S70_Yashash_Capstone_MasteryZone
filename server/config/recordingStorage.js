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

module.exports = {
  getRecordingsDir,
  resolveRecordingFilePath,
};
