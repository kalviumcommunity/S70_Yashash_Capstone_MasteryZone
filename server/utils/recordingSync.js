/**
 * Mastery Zone — GridFS Cloud Recording Synchronizer & Self-Healer
 *
 * Ensures all genuine recordings are permanently backed up in MongoDB Atlas GridFS.
 * Recovers any recording documents whose physical files were lost across cloud container restarts,
 * so every user and administrator can always stream, seek, and download their recordings.
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const {
  getRecordingsDir,
  getRecordingsGridFSBucket,
  saveFileToGridFS,
  getFileFromGridFS,
  pipeGridFSToFile,
} = require("../config/recordingStorage");
const { cleanInvalidRecordings } = require("./recordingCleanup");

let syncInProgress = false;

async function syncRecordingsToGridFS() {
  if (syncInProgress) return;
  if (!mongoose.connection || mongoose.connection.readyState !== 1) return;
  syncInProgress = true;

  try {
    // 0. Clean any orphan or dummy recordings
    await cleanInvalidRecordings();

    const bucket = getRecordingsGridFSBucket();
    if (!bucket) return;

    const targetDir = getRecordingsDir();
    const Recording = require("../models/Recording");

    // 1. Sync any existing genuine files on local disk into GridFS
    if (fs.existsSync(targetDir)) {
      const diskFiles = fs
        .readdirSync(targetDir)
        .filter((f) => !f.startsWith(".") && (f.endsWith(".webm") || f.endsWith(".mp4")));
      for (const df of diskFiles) {
        try {
          const filePath = path.join(targetDir, df);
          const stat = fs.statSync(filePath);
          if (stat.size > 1024) {
            await saveFileToGridFS(df, filePath, { source: "disk_sync", size: stat.size });
          }
        } catch (e) {
          console.warn("[RecordingSync] Failed to sync disk file to GridFS:", df, e.message);
        }
      }
    }

    // 2. Restore physical files from GridFS if container restarted
    const allRecords = await Recording.find().lean();
    for (const rec of allRecords) {
      try {
        const fn = path.basename(rec.filePath || rec.fileUrl || `${rec.recordingId}.webm`);
        const targetFilePath = path.join(targetDir, fn);
        const onDisk = fs.existsSync(targetFilePath);
        const inGrid = await getFileFromGridFS(fn);

        if (!onDisk && inGrid) {
          // Re-hydrate local disk file from GridFS for fast local streaming
          await pipeGridFSToFile(inGrid._id, targetFilePath);
          console.log(`[RecordingSync] Re-hydrated recording from GridFS: ${fn}`);
        } else if (!onDisk && !inGrid) {
          // Genuinely missing file; mark as error / unavailable, never synthesize fake media
          await Recording.updateOne({ _id: rec._id }, { $set: { status: "error" } });
        }
      } catch (err) {
        console.warn("[RecordingSync] Sync check note:", rec.recordingId, err.message);
      }
    }
  } catch (err) {
    console.warn("[RecordingSync] Overall sync notice:", err.message);
  } finally {
    syncInProgress = false;
  }
}

module.exports = {
  syncRecordingsToGridFS,
};
