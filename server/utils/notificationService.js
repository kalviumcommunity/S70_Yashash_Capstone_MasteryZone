const mongoose = require("mongoose");
const Notification = require("../models/NotificationSchema");
const User = require("../models/User");

let globalIo = null;
const initializedUsersCache = new Set();
const recentNotificationsCache = new Map();
const NOTIF_DEDUP_WINDOW_MS = 5000;

function setGlobalIo(ioInstance) {
  if (ioInstance) {
    globalIo = ioInstance;
  }
}

function resolveIo(ioOrApp) {
  if (ioOrApp) {
    if (typeof ioOrApp.emit === "function" && typeof ioOrApp.to === "function") {
      return ioOrApp;
    }
    if (typeof ioOrApp.get === "function") {
      const resolved = ioOrApp.get("io");
      if (resolved) return resolved;
    }
  }
  return globalIo;
}

function normalizeUserId(rawUserId) {
  if (!rawUserId) return null;
  const str = String(rawUserId).trim();
  if (!mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
}

/**
 * Creates a persistent notification in MongoDB and broadcasts it in real time
 * to the user's personal Socket.IO room (`user_<userId>`).
 * Protects against duplicate notifications triggered by reconnects or double-fires within 5s.
 */
async function pushNotification(
  ioOrApp,
  {
    userId,
    title = "Mastery Zone Alert",
    message,
    type = "system",
    severity = "info",
    actionUrl = "",
    actionLabel = "",
    meta = {},
  }
) {
  try {
    const userObjId = normalizeUserId(userId);
    if (!userObjId || !message) return null;

    // Deduplication check: Avoid inserting identical notifications for the same user within rate window
    const dedupKey = `${userObjId.toString()}::${title}::${message}`;
    const now = Date.now();
    const existing = recentNotificationsCache.get(dedupKey);
    if (existing && now - existing.timestamp < NOTIF_DEDUP_WINDOW_MS) {
      return existing.doc;
    }

    const doc = await Notification.create({
      userId: userObjId,
      title,
      message,
      type,
      severity,
      actionUrl,
      actionLabel,
      meta,
      isRead: false,
      createdAt: new Date(),
    });

    if (recentNotificationsCache.size > 200) {
      for (const [k, v] of recentNotificationsCache.entries()) {
        if (now - v.timestamp > NOTIF_DEDUP_WINDOW_MS * 2) {
          recentNotificationsCache.delete(k);
        }
      }
    }
    recentNotificationsCache.set(dedupKey, { timestamp: now, doc });

    const unreadCount = await Notification.countDocuments({
      userId: userObjId,
      isRead: false,
    });

    const io = resolveIo(ioOrApp);
    if (io) {
      io.to(`user_${userObjId.toString()}`).emit("new_notification", {
        notification: doc.toObject(),
        unreadCount,
      });
    }

    return doc;
  } catch (err) {
    console.warn("pushNotification warning:", err.message);
    return null;
  }
}

/**
 * Broadcasts read/delete/clear synchronization across all connected tabs/devices
 * for a given user.
 */
async function emitNotificationsSync(ioOrApp, userId, payload = {}) {
  try {
    const userObjId = normalizeUserId(userId);
    if (!userObjId) return;
    const unreadCount =
      payload.unreadCount !== undefined
        ? payload.unreadCount
        : await Notification.countDocuments({ userId: userObjId, isRead: false });

    const io = resolveIo(ioOrApp);
    if (io) {
      io.to(`user_${userObjId.toString()}`).emit("notifications_updated", {
        ...payload,
        unreadCount,
      });
    }
  } catch (err) {
    console.warn("emitNotificationsSync warning:", err.message);
  }
}

/**
 * Backfills genuine recent notifications once for existing accounts that had
 * activity before real-time notifications were enabled.
 */
async function ensureInitialUserNotifications(userId) {
  try {
    const userObjId = normalizeUserId(userId);
    if (!userObjId) return;
    const uidStr = userObjId.toString();
    if (initializedUsersCache.has(uidStr)) return;

    const user = await User.findById(userObjId).select("fullName notificationsInitialized createdAt").lean();
    if (!user) return;
    if (user.notificationsInitialized) {
      initializedUsersCache.add(uidStr);
      return;
    }

    const existingCount = await Notification.countDocuments({ userId: userObjId });
    if (existingCount === 0) {
      const seedDocs = [];

      // Backfill up to 3 real recent MCQ assessment attempts if present
      try {
        const ModuleAssessmentAttempt = require("../models/ModuleAssessmentAttempt");
        const mcqAttempts = await ModuleAssessmentAttempt.find({ userId: userObjId })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();

        mcqAttempts.forEach((a) => {
          const totalM = a.totalMarks || a.totalQuestions || 10;
          const marksObt = a.marksObtained !== undefined ? a.marksObtained : a.score || 0;
          const pct = a.percentage !== undefined ? a.percentage : Math.round((marksObt / totalM) * 100);
          const passed = Boolean(a.passed || pct >= (a.passingScore || 80));
          const sid = a.sessionId || `attempt_${a._id}`;
          seedDocs.push({
            userId: userObjId,
            title: passed ? "Assessment Passed — Report Ready" : "Assessment Graded — Review Ready",
            message: `${a.moduleTitle || "Proctored Assessment"}: Scored ${marksObt}/${totalM} marks (${pct}%).`,
            type: "assessment",
            severity: passed ? "success" : "warning",
            actionUrl: `/assessment-report/${sid}`,
            actionLabel: "View Grade Report",
            isRead: false,
            createdAt: a.submittedAt || a.createdAt || new Date(),
          });
        });
      } catch {}

      // Backfill up to 2 real recent Proctored Coding sessions if present
      try {
        const ProctoredCodingSession = require("../models/ProctoredCodingSession");
        const codingSessions = await ProctoredCodingSession.find({
          userId: userObjId,
          status: "submitted",
        })
          .sort({ updatedAt: -1 })
          .limit(2)
          .lean();

        codingSessions.forEach((s) => {
          const pct = s.submissionResult?.score || 0;
          const passed = Boolean(s.submissionResult?.passed || pct >= 80);
          seedDocs.push({
            userId: userObjId,
            title: passed ? "Coding Assessment Passed" : "Coding Assessment Evaluated",
            message: `${s.assessmentTitle || "Coding Challenge"}: ${s.submissionResult?.passedTests || 0}/${s.submissionResult?.totalTests || 10} test cases passed (${pct}%).`,
            type: "assessment",
            severity: passed ? "success" : "warning",
            actionUrl: `/assessment-report/${s.sessionId}`,
            actionLabel: "View Coding Report",
            isRead: false,
            createdAt: s.submissionResult?.submittedAt || s.updatedAt || new Date(),
          });
        });
      } catch {}

      if (seedDocs.length === 0) {
        seedDocs.push({
          userId: userObjId,
          title: "Real-Time Notifications Active",
          message: `Welcome${user.fullName ? `, ${user.fullName}` : ""}! Live alerts for assessments, challenges, study progress, and collaboration are active.`,
          type: "account",
          severity: "info",
          actionUrl: "/progress",
          actionLabel: "Explore Progress",
          isRead: false,
          createdAt: new Date(),
        });
      }

      if (seedDocs.length > 0) {
        await Notification.insertMany(seedDocs);
      }
    }

    await User.updateOne({ _id: userObjId }, { $set: { notificationsInitialized: true } });
    initializedUsersCache.add(uidStr);
  } catch (err) {
    console.warn("ensureInitialUserNotifications warning:", err.message);
  }
}

module.exports = {
  pushNotification,
  emitNotificationsSync,
  ensureInitialUserNotifications,
  setGlobalIo,
};
