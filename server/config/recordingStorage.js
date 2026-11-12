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

function isContainedInside(parentDir, childPath) {
  if (!parentDir || !childPath) return false;
  const rel = path.relative(parentDir, childPath);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function resolveRecordingFilePath(safeFilename, recordingDoc = null) {
  if (!safeFilename) return null;
  const cleanName = path.basename(safeFilename);

  // 1. Check recording doc filePath if populated
  if (recordingDoc && typeof recordingDoc.filePath === "string" && recordingDoc.filePath.trim()) {
    const p = path.resolve(recordingDoc.filePath.trim());
    if (fs.existsSync(p) && isPathInsideRecordingsDir(p)) {
      return p;
    }
    const inRecDir = path.resolve(path.join(getRecordingsDir(), path.basename(p)));
    if (fs.existsSync(inRecDir) && isPathInsideRecordingsDir(inRecDir)) {
      return inRecDir;
    }
    const inDefaultDir = path.resolve(path.join(__dirname, "../uploads/recordings", path.basename(p)));
    if (fs.existsSync(inDefaultDir) && isPathInsideRecordingsDir(inDefaultDir)) {
      return inDefaultDir;
    }
  }

  // 2. Primary configured directory (RECORDINGS_STORAGE_PATH / RECORDINGS_DIR)
  const primaryPath = path.resolve(path.join(getRecordingsDir(), cleanName));
  if (fs.existsSync(primaryPath) && isPathInsideRecordingsDir(primaryPath)) {
    return primaryPath;
  }

  // 3. Fallback to default local upload folder
  const defaultLocalPath = path.resolve(path.join(__dirname, "../uploads/recordings", cleanName));
  if (fs.existsSync(defaultLocalPath) && isPathInsideRecordingsDir(defaultLocalPath)) {
    return defaultLocalPath;
  }

  return null;
}

/**
 * Validates that a file path strictly resolves inside the authorized recording directories.
 * Uses path.relative() boundary verification and symlink resolution.
 * Prevents directory traversal attacks, sibling-directory prefix attacks, and arbitrary filesystem deletion.
 */
function isPathInsideRecordingsDir(targetPath) {
  if (!targetPath || typeof targetPath !== "string") return false;
  try {
    const resolved = path.resolve(targetPath);
    const authorizedDirs = [
      path.resolve(getRecordingsDir()),
      path.resolve(path.join(__dirname, "../uploads/recordings")),
    ];

    // Safe path boundary containment verification using path.relative
    const isWithin = authorizedDirs.some((authDir) => isContainedInside(authDir, resolved));
    if (!isWithin) return false;

    // If physical file exists, verify that its real path (resolving any symlinks) remains inside authorized directories
    if (fs.existsSync(resolved)) {
      const realTarget = fs.realpathSync(resolved);
      const isRealWithin = authorizedDirs.some((authDir) => {
        const realAuthDir = fs.existsSync(authDir) ? fs.realpathSync(authDir) : authDir;
        return isContainedInside(realAuthDir, realTarget);
      });
      if (!isRealWithin) return false;
    }

    return true;
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

  // 1. If recordingDoc has an explicit filePath, verify its path containment first
  if (recordingDoc.filePath && typeof recordingDoc.filePath === "string" && recordingDoc.filePath.trim()) {
    const rawPath = path.resolve(recordingDoc.filePath.trim());
    if (fs.existsSync(rawPath) && !isPathInsideRecordingsDir(rawPath)) {
      return {
        success: false,
        error: `Security violation: Path '${rawPath}' is outside the authorized recording storage boundary.`,
        path: rawPath,
      };
    }
  }

  const safeFilename = path.basename(
    recordingDoc.filePath ||
    `${recordingDoc.recordingId}.${recordingDoc.mimeType?.includes("mp4") ? "mp4" : "webm"}`
  );
  const resolvedPath = resolveRecordingFilePath(safeFilename, recordingDoc) ||
    (recordingDoc.filePath && isPathInsideRecordingsDir(recordingDoc.filePath) ? path.resolve(recordingDoc.filePath) : null);

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
    // Also remove any cached cross-browser MP4 rendition of this recording.
    try {
      const base = path.basename(resolvedPath, path.extname(resolvedPath));
      const rendition = path.join(getRecordingsDir(), ".renditions", `${base}.mp4`);
      if (fs.existsSync(rendition) && isPathInsideRecordingsDir(rendition)) fs.unlinkSync(rendition);
    } catch {}
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
