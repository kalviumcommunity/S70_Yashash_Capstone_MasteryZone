const Notification = require("../models/Notification");

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

module.exports = { getAllNotifications, createNotification };

