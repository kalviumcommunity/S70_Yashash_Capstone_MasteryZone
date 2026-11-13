const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const Notification = require("../models/NotificationSchema");
const {
  pushNotification,
  emitNotificationsSync,
  ensureInitialUserNotifications,
  markNotificationsInitialized,
  isNotificationsInitialized,
} = require("../utils/notificationService");
const { isValidEtag, setEtag, invalidateEtag } = require("../utils/etagCache");

function resolveReqUserId(req) {
  return String(req.user?.userId || req.user?.id || req.user?._id || "").trim();
}

// GET /api/notifications (Optimized dual-index parallel query with ETag caching)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = resolveReqUserId(req);
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: "Invalid user session" });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);

    const clientEtag = req.headers["if-none-match"];
    if (isValidEtag("notifications", userId, clientEtag)) {
      res.setHeader("ETag", clientEtag);
      res.setHeader("Cache-Control", "private, no-cache, must-revalidate");
      return res.status(304).end();
    }

    // Fast indexed parallel queries: 60 recent notifications + unread count
    let [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId: userObjId })
        .sort({ createdAt: -1 })
        .limit(60)
        .lean(),
      Notification.countDocuments({ userId: userObjId, isRead: false }),
    ]);

    // Backfill seed check only for new accounts with 0 notifications
    if (notifications.length === 0 && !isNotificationsInitialized(userId)) {
      await ensureInitialUserNotifications(userObjId);
      [notifications, unreadCount] = await Promise.all([
        Notification.find({ userId: userObjId })
          .sort({ createdAt: -1 })
          .limit(60)
          .lean(),
        Notification.countDocuments({ userId: userObjId, isRead: false }),
      ]);
    } else {
      markNotificationsInitialized(userId);
    }

    // Fast conditional validation using ETag
    const latestTimestamp = notifications[0]?.createdAt ? new Date(notifications[0].createdAt).getTime() : 0;
    const etag = `W/"notif-${userObjId.toString()}-${unreadCount}-${latestTimestamp}-${notifications.length}"`;
    setEtag("notifications", userId, etag);
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "private, no-cache, must-revalidate");

    if (clientEtag && (clientEtag === etag || clientEtag.replace(/^W\//, "") === etag.replace(/^W\//, ""))) {
      return res.status(304).end();
    }

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications
router.post("/", authenticateToken, async (req, res) => {
  try {
    const callerUserId = resolveReqUserId(req);
    const targetUserId = (req.user?.role === "admin" && req.body.userId) ? req.body.userId : callerUserId;
    const {
      title = "Mastery Zone Alert",
      message,
      type = "system",
      severity = "info",
      actionUrl = "",
      actionLabel = "",
      meta = {},
    } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Notification message is required" });
    }

    const doc = await pushNotification(req.app, {
      userId: targetUserId,
      title,
      message,
      type,
      severity,
      actionUrl,
      actionLabel,
      meta,
    });

    if (!doc) {
      return res.status(400).json({ error: "Could not create notification" });
    }

    res.status(201).json({ success: true, notification: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH or POST /api/notifications/read-all
const markAllReadHandler = async (req, res) => {
  try {
    const userId = resolveReqUserId(req);
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: "Invalid user session" });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);

    await Notification.updateMany(
      { userId: userObjId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    // Synchronize ChallengeSubmission, CertificationAttempt, and ModuleAssessmentAttempt view tracking
    try {
      const ChallengeSubmission = require("../models/ChallengeSubmission");
      const CertificationAttempt = require("../models/CertificationAttempt");
      const ModuleAssessmentAttempt = require("../models/ModuleAssessmentAttempt");
      await Promise.allSettled([
        ChallengeSubmission.updateMany(
          { userId: userObjId, notificationSent: true, notificationViewed: false },
          { $set: { notificationViewed: true, notificationViewedAt: new Date() } }
        ),
        CertificationAttempt.updateMany(
          { userId: userObjId, notificationSent: true, notificationViewed: false },
          { $set: { notificationViewed: true, notificationViewedAt: new Date() } }
        ),
        ModuleAssessmentAttempt.updateMany(
          { userId: userObjId, notificationSent: true, notificationViewed: false },
          { $set: { notificationViewed: true, notificationViewedAt: new Date() } }
        ),
      ]);
    } catch (subErr) {
      console.warn("Notification view tracking sync warning:", subErr.message);
    }

    await emitNotificationsSync(req.app, userObjId, {
      action: "mark_all_read",
      unreadCount: 0,
    });

    invalidateEtag("notifications", userId);

    res.json({ success: true, unreadCount: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.patch("/read-all", authenticateToken, markAllReadHandler);
router.post("/read-all", authenticateToken, markAllReadHandler);

// PATCH or PUT /api/notifications/:id/read
const markOneReadHandler = async (req, res) => {
  try {
    const userId = resolveReqUserId(req);
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid notification or user ID" });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);

    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId: userObjId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Synchronize ChallengeSubmission, CertificationAttempt, and ModuleAssessmentAttempt view tracking
    try {
      const ChallengeSubmission = require("../models/ChallengeSubmission");
      const CertificationAttempt = require("../models/CertificationAttempt");
      const ModuleAssessmentAttempt = require("../models/ModuleAssessmentAttempt");
      await Promise.allSettled([
        ChallengeSubmission.updateMany(
          { notificationInAppId: id },
          { $set: { notificationViewed: true, notificationViewedAt: new Date() } }
        ),
        CertificationAttempt.updateMany(
          { notificationInAppId: id },
          { $set: { notificationViewed: true, notificationViewedAt: new Date() } }
        ),
        ModuleAssessmentAttempt.updateMany(
          { notificationInAppId: id },
          { $set: { notificationViewed: true, notificationViewedAt: new Date() } }
        ),
      ]);
    } catch (subErr) {
      console.warn("Notification view tracking sync warning:", subErr.message);
    }

    const unreadCount = await Notification.countDocuments({ userId: userObjId, isRead: false });

    await emitNotificationsSync(req.app, userObjId, {
      action: "mark_read",
      id,
      unreadCount,
    });

    invalidateEtag("notifications", userId);

    res.json({ success: true, notification: updated, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.patch("/:id/read", authenticateToken, markOneReadHandler);
router.put("/:id/read", authenticateToken, markOneReadHandler);

// DELETE /api/notifications/clear
router.delete("/clear", authenticateToken, async (req, res) => {
  try {
    const userId = resolveReqUserId(req);
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: "Invalid user session" });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);
    const readOnly = req.query.readOnly === "true";

    const filter = readOnly ? { userId: userObjId, isRead: true } : { userId: userObjId };
    await Notification.deleteMany(filter);

    const unreadCount = await Notification.countDocuments({ userId: userObjId, isRead: false });

    await emitNotificationsSync(req.app, userObjId, {
      action: "clear",
      readOnly,
      unreadCount,
    });

    invalidateEtag("notifications", userId);

    res.json({ success: true, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = resolveReqUserId(req);
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }
    const userObjId = new mongoose.Types.ObjectId(userId);

    const deleted = await Notification.findOneAndDelete({ _id: id, userId: userObjId });
    if (!deleted) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const unreadCount = await Notification.countDocuments({ userId: userObjId, isRead: false });

    await emitNotificationsSync(req.app, userObjId, {
      action: "delete",
      id,
      unreadCount,
    });

    invalidateEtag("notifications", userId);

    res.json({ success: true, id, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
