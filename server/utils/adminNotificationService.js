const AdminNotification = require("../models/AdminNotification");

let globalAdminIo = null;

const setGlobalAdminIo = (ioInstance) => {
  if (ioInstance) {
    globalAdminIo = ioInstance;
  }
};

/**
 * Dispatches an event-driven notification exclusively to the Super Admin.
 * Stores in MongoDB and broadcasts via Socket.IO to 'super_admin_room'.
 */
const pushAdminNotification = async ({
  title,
  message,
  type = "system",
  severity = "info",
  targetId = "",
  targetUser = null,
  actionUrl = "",
  io = null,
}) => {
  try {
    const doc = await AdminNotification.create({
      title,
      message,
      type,
      severity,
      targetId,
      targetUser,
      actionUrl,
      isRead: false,
      createdAt: new Date(),
    });

    const activeIo = io || globalAdminIo;
    if (activeIo && typeof activeIo.to === "function") {
      activeIo.to("super_admin_room").emit("admin_notification_received", doc.toObject ? doc.toObject() : doc);
    }

    return doc;
  } catch (err) {
    console.error("Error creating Admin Notification:", err.message);
    return null;
  }
};

module.exports = {
  pushAdminNotification,
  setGlobalAdminIo,
};
