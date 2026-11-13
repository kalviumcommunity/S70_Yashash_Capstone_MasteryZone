const ActivityLog = require("../models/ActivityLog");

let globalIo = null;

const setGlobalActivityIo = (ioInstance) => {
  if (ioInstance) {
    globalIo = ioInstance;
  }
};

/**
 * Log a genuine platform activity to MongoDB and broadcast to super_admin_room in real time.
 */
const logActivityAndBroadcast = async ({
  userId = null,
  userEmail = "",
  userName = "",
  userAvatar = "",
  type,
  title,
  detail = "",
  category = "coding",
  severity = "info",
  metadata = {},
  ipAddress = "",
  device = "Desktop / Chrome",
  io = null,
}) => {
  try {
    const doc = await ActivityLog.create({
      userId: userId || null,
      userEmail: userEmail || "",
      userName: userName || (userEmail ? userEmail.split("@")[0] : "Student"),
      userAvatar: userAvatar || "",
      type,
      title,
      detail,
      category,
      severity,
      metadata,
      ipAddress,
      device,
    });

    const activeIo = io || globalIo;
    if (activeIo && typeof activeIo.to === "function") {
      const payload = {
        _id: String(doc._id),
        userId: doc.userId ? String(doc.userId) : null,
        userEmail: doc.userEmail,
        userName: doc.userName,
        userAvatar: doc.userAvatar,
        type: doc.type,
        title: doc.title,
        detail: doc.detail,
        category: doc.category,
        severity: doc.severity,
        metadata: doc.metadata,
        device: doc.device,
        createdAt: doc.createdAt,
      };

      // Broadcast to real-time Admin Live Activity and Proctoring rooms
      activeIo.to("super_admin_room").emit("live_activity_event", payload);

      // Dedicated event triggers for proctoring dashboard
      if (type === "PROCTORING_VIOLATION") {
        activeIo.to("super_admin_room").emit("PROCTORING_VIOLATION", {
          candidate: doc.userName,
          email: doc.userEmail,
          type: doc.detail,
          sessionId: metadata.sessionId,
          severity: doc.severity,
          timestamp: doc.createdAt,
        });
      } else if (type === "PROCTORING_STARTED") {
        activeIo.to("super_admin_room").emit("NEW_PROCTORED_SESSION", {
          sessionId: metadata.sessionId,
          candidate: doc.userName,
          assessmentTitle: doc.title,
          timestamp: doc.createdAt,
        });
      } else if (type === "PROCTORING_COMPLETED" || type === "PROCTORING_TERMINATED") {
        activeIo.to("super_admin_room").emit("PROCTORING_SESSION_UPDATED", {
          sessionId: metadata.sessionId,
          status: metadata.status,
          score: metadata.score,
          timestamp: doc.createdAt,
        });
      }
    }

    return doc;
  } catch (err) {
    console.warn("Activity logger warning:", err.message);
    return null;
  }
};

module.exports = {
  logActivityAndBroadcast,
  setGlobalActivityIo,
};
