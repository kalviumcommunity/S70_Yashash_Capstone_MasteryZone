const mongoose = require("mongoose");
const Notification = require("../models/NotificationSchema");
const { pushNotification, emitNotificationsSync } = require("../utils/notificationService");

const getAllNotifications = async (req, res) => {
  try {
    const userId = String(req.user?.userId || req.user?.id || req.user?._id || "").trim();
    const filter = mongoose.Types.ObjectId.isValid(userId)
      ? { userId: new mongoose.Types.ObjectId(userId) }
      : {};
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(60);
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createNotification = async (req, res) => {
  try {
    const callerId = String(req.user?.userId || req.user?.id || req.user?._id || "").trim();
    const doc = await pushNotification(req.app, {
      userId: req.body.userId || callerId,
      title: req.body.title || "Mastery Zone Alert",
      message: req.body.message,
      type: req.body.type || "system",
      severity: req.body.severity || "info",
      actionUrl: req.body.actionUrl || "",
      actionLabel: req.body.actionLabel || "",
      meta: req.body.meta || {},
    });
    if (!doc) return res.status(400).json({ error: "Invalid notification payload" });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    await emitNotificationsSync(req.app, notification.userId, {
      action: "update",
      id: notification._id.toString(),
    });
    res.json(notification);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getAllNotifications, createNotification, updateNotification };
