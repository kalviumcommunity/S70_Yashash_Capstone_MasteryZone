const Notification = require("../models/NotificationSchema");

// GET all notifications
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().populate("userId");
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: Create notification
const createNotification = async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT: Update notification by ID
const updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getAllNotifications, createNotification, updateNotification };


