const mongoose = require("mongoose");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");

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
  device = "",
  io = null,
}) => {
  try {
    const safeUserId = (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : null;
    if (!safeUserId) {
      console.warn("⚠️ [ActivityLogger] Rejected event without valid ObjectId userId:", { type, title, userEmail });
      return null;
    }

    // Verify user exists and is a genuine registered account
    const userDoc = await User.findById(safeUserId).select("isGuest isAutomatedTestUser email username fullName avatar profilePicture role").lean();
    if (!userDoc || userDoc.isGuest || userDoc.isAutomatedTestUser) {
      return null;
    }

    const email = (userDoc.email || userEmail || "").toLowerCase();
    const uname = (userDoc.username || "").toLowerCase();
    if (
      email.endsWith("@example.com") ||
      email.endsWith("@test.com") ||
      email.startsWith("guest_") ||
      email.startsWith("candidate_") ||
      email.startsWith("testuser_") ||
      uname.startsWith("guest_") ||
      uname.startsWith("candidate_") ||
      uname.startsWith("testuser_")
    ) {
      return null;
    }

    const resolvedName = userDoc.fullName || userDoc.username || userName || (email ? email.split("@")[0] : "");
    const resolvedAvatar = userDoc.profilePicture || userDoc.avatar || userAvatar || "";

    const doc = await ActivityLog.create({
      userId: safeUserId,
      userEmail: userDoc.email || userEmail || "",
      userName: resolvedName,
      userAvatar: resolvedAvatar,
      type,
      title,
      detail,
      category,
      severity,
      metadata,
      ipAddress,
      device: device || "",
    });

    const activeIo = io || globalIo;
    if (activeIo && typeof activeIo.to === "function") {
      const payload = {
        _id: String(doc._id),
        userId: String(doc.userId),
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
    console.error("🚨 [ActivityLogger Error]:", err);
    return null;
  }
};

module.exports = {
  logActivityAndBroadcast,
  setGlobalActivityIo,
};
