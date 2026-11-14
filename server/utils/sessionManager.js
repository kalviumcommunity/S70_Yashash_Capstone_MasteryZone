const mongoose = require("mongoose");
const ActiveSession = require("../models/ActiveSession");
const User = require("../models/User");

// In-memory caching for sub-millisecond socket operations
// userId -> sessionObj
const memoryActiveUsers = new Map();
// socketId -> userId
const socketToUserMap = new Map();

const STALE_TIMEOUT_MS = 60 * 1000; // 60 seconds

/**
 * Check if a user is a genuine registered student/candidate account
 */
function isGenuineRegisteredUser(u) {
  if (!u || !u._id) return false;
  if (u.isGuest || u.isAutomatedTestUser) return false;
  const email = (u.email || "").toLowerCase();
  const username = (u.username || "").toLowerCase();

  // Exclude test and dummy domains/patterns
  if (
    email.endsWith("@example.com") ||
    email.endsWith("@test.com") ||
    email.startsWith("guest_") ||
    email.startsWith("candidate_") ||
    email.startsWith("testuser_") ||
    username.startsWith("guest_") ||
    username.startsWith("candidate_") ||
    username.startsWith("testuser_")
  ) {
    return false;
  }

  // Live telemetry is dedicated to candidate/student activity
  if (u.role === "SUPER_ADMIN" || email.endsWith("@masteryzone.com")) {
    return false;
  }

  return true;
}

/**
 * Record an authenticated user heartbeat
 */
async function recordHeartbeat({
  socketId,
  user,
  page = "",
  activity = "",
  device = "",
  mediaState = null,
}) {
  if (!socketId || !user || !user._id) return null;
  if (!isGenuineRegisteredUser(user)) return null;

  const userIdStr = String(user._id);
  const now = Date.now();

  socketToUserMap.set(socketId, userIdStr);

  let session = memoryActiveUsers.get(userIdStr);
  if (!session) {
    session = {
      userId: userIdStr,
      username: user.username || "",
      fullName: user.fullName || user.username || "",
      email: user.email || "",
      avatar: user.profilePicture || user.avatar || "",
      currentPage: page || "",
      activity: activity || "",
      device: device || "",
      mediaState: mediaState || null,
      startedAt: now,
      lastHeartbeat: now,
      tabCount: 1,
      sockets: [
        {
          socketId,
          device: device || "",
          currentPage: page || "",
          activity: activity || "",
          mediaState: mediaState || null,
          connectedAt: now,
          lastHeartbeat: now,
        },
      ],
    };
    memoryActiveUsers.set(userIdStr, session);
  } else {
    // Update existing user session
    session.lastHeartbeat = now;
    if (page) session.currentPage = page;
    if (activity) session.activity = activity;
    if (device) session.device = device;
    if (mediaState) session.mediaState = mediaState;

    const sIdx = session.sockets.findIndex((s) => s.socketId === socketId);
    if (sIdx >= 0) {
      session.sockets[sIdx].lastHeartbeat = now;
      if (page) session.sockets[sIdx].currentPage = page;
      if (activity) session.sockets[sIdx].activity = activity;
      if (device) session.sockets[sIdx].device = device;
      if (mediaState) session.sockets[sIdx].mediaState = mediaState;
    } else {
      session.sockets.push({
        socketId,
        device: device || "",
        currentPage: page || "",
        activity: activity || "",
        mediaState: mediaState || null,
        connectedAt: now,
        lastHeartbeat: now,
      });
    }
    session.tabCount = session.sockets.length;
  }

  // Asynchronously persist to MongoDB ActiveSession for multi-instance / restart resilience
  ActiveSession.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        username: session.username,
        fullName: session.fullName,
        email: session.email,
        avatar: session.avatar,
        currentPage: session.currentPage,
        activity: session.activity,
        device: session.device,
        mediaState: session.mediaState,
        lastHeartbeat: new Date(now),
        startedAt: new Date(session.startedAt),
        tabCount: session.tabCount,
        sockets: session.sockets.map((s) => ({
          ...s,
          connectedAt: new Date(s.connectedAt),
          lastHeartbeat: new Date(s.lastHeartbeat),
        })),
        isActive: true,
      },
    },
    { upsert: true, new: true }
  ).catch((err) => {
    console.warn("ActiveSession MongoDB sync warning:", err.message);
  });

  return formatSessionForClient(session);
}

/**
 * Handle socket disconnection
 */
async function handleDisconnect(socketId) {
  if (!socketId) return { sessionEnded: false };
  const userIdStr = socketToUserMap.get(socketId);
  if (!userIdStr) return { sessionEnded: false };

  socketToUserMap.delete(socketId);
  const session = memoryActiveUsers.get(userIdStr);
  if (!session) return { sessionEnded: false };

  session.sockets = session.sockets.filter((s) => s.socketId !== socketId);
  session.tabCount = session.sockets.length;

  if (session.sockets.length === 0) {
    memoryActiveUsers.delete(userIdStr);

    ActiveSession.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userIdStr) },
      {
        $set: {
          isActive: false,
          sockets: [],
          tabCount: 0,
          lastHeartbeat: new Date(),
        },
      }
    ).catch((err) => console.warn("ActiveSession disconnect sync error:", err.message));

    return {
      sessionEnded: true,
      userId: userIdStr,
      socketId,
    };
  } else {
    // Other tabs remain open; switch active page/device to the most recent tab
    const lastActiveSocket = session.sockets[session.sockets.length - 1];
    session.currentPage = lastActiveSocket.currentPage || session.currentPage;
    session.activity = lastActiveSocket.activity || session.activity;
    session.device = lastActiveSocket.device || session.device;

    ActiveSession.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userIdStr) },
      {
        $set: {
          sockets: session.sockets.map((s) => ({
            ...s,
            connectedAt: new Date(s.connectedAt),
            lastHeartbeat: new Date(s.lastHeartbeat),
          })),
          tabCount: session.tabCount,
          currentPage: session.currentPage,
          activity: session.activity,
          device: session.device,
        },
      }
    ).catch((err) => console.warn("ActiveSession tab update error:", err.message));

    return {
      sessionEnded: false,
      session: formatSessionForClient(session),
    };
  }
}

/**
 * Periodic stale session cleanup
 */
async function cleanupStaleSessions(io = null) {
  const now = Date.now();
  const staleThreshold = now - STALE_TIMEOUT_MS;

  for (const [userIdStr, session] of memoryActiveUsers.entries()) {
    session.sockets = session.sockets.filter((s) => s.lastHeartbeat >= staleThreshold);
    session.tabCount = session.sockets.length;

    if (session.sockets.length === 0 || session.lastHeartbeat < staleThreshold) {
      memoryActiveUsers.delete(userIdStr);
      // Clean up reverse map entries
      for (const [sId, uId] of socketToUserMap.entries()) {
        if (uId === userIdStr) socketToUserMap.delete(sId);
      }

      ActiveSession.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userIdStr) },
        {
          $set: {
            isActive: false,
            sockets: [],
            tabCount: 0,
            lastHeartbeat: new Date(now),
          },
        }
      ).catch(() => {});

      if (io && typeof io.to === "function") {
        io.to("super_admin_room").emit("live_session_ended", {
          userId: userIdStr,
          reason: "stale_heartbeat_timeout",
        });
      }
    }
  }

  // Also clean up MongoDB database for inactive sessions across instances
  ActiveSession.updateMany(
    {
      isActive: true,
      lastHeartbeat: { $lt: new Date(staleThreshold) },
    },
    {
      $set: { isActive: false, sockets: [], tabCount: 0 },
    }
  ).catch(() => {});
}

/**
 * Get all current active deduplicated sessions
 */
async function getActiveSessions() {
  const now = Date.now();
  const staleThreshold = now - STALE_TIMEOUT_MS;

  // Filter in-memory active users
  const activeList = [];
  for (const session of memoryActiveUsers.values()) {
    if (session.lastHeartbeat >= staleThreshold && session.sockets.length > 0) {
      activeList.push(formatSessionForClient(session));
    }
  }

  return activeList;
}

/**
 * Format session payload for transmission to client
 */
function formatSessionForClient(s) {
  const now = Date.now();
  const started = s.startedAt ? new Date(s.startedAt).getTime() : now;
  const elapsedMinutes = Math.max(1, Math.round((now - started) / 60000));

  return {
    userId: String(s.userId),
    username: s.username,
    fullName: s.fullName,
    email: s.email,
    avatar: s.avatar,
    currentPage: s.currentPage || "—",
    activity: s.activity || "Active Session",
    device: s.device || "—",
    mediaState: s.mediaState,
    tabCount: s.tabCount || 1,
    startedAt: s.startedAt,
    lastHeartbeat: s.lastHeartbeat,
    duration: `${elapsedMinutes}m`,
    status: "Connected",
  };
}

/**
 * Initialize on server start
 */
async function initSessionManager() {
  try {
    const staleThreshold = new Date(Date.now() - STALE_TIMEOUT_MS);
    // Deactivate stale sessions from previous runs
    await ActiveSession.updateMany(
      { lastHeartbeat: { $lt: staleThreshold } },
      { $set: { isActive: false, sockets: [], tabCount: 0 } }
    );

    // Warm memory cache with any still-fresh sessions if recovering within window
    const recentSessions = await ActiveSession.find({
      isActive: true,
      lastHeartbeat: { $gte: staleThreshold },
    }).lean();

    for (const doc of recentSessions) {
      const uStr = String(doc.userId);
      memoryActiveUsers.set(uStr, {
        userId: uStr,
        username: doc.username,
        fullName: doc.fullName,
        email: doc.email,
        avatar: doc.avatar,
        currentPage: doc.currentPage,
        activity: doc.activity,
        device: doc.device,
        mediaState: doc.mediaState,
        startedAt: doc.startedAt ? new Date(doc.startedAt).getTime() : Date.now(),
        lastHeartbeat: doc.lastHeartbeat ? new Date(doc.lastHeartbeat).getTime() : Date.now(),
        tabCount: doc.tabCount || 1,
        sockets: (doc.sockets || []).map((s) => ({
          socketId: s.socketId,
          device: s.device,
          currentPage: s.currentPage,
          activity: s.activity,
          mediaState: s.mediaState,
          connectedAt: s.connectedAt ? new Date(s.connectedAt).getTime() : Date.now(),
          lastHeartbeat: s.lastHeartbeat ? new Date(s.lastHeartbeat).getTime() : Date.now(),
        })),
      });

      (doc.sockets || []).forEach((s) => {
        socketToUserMap.set(s.socketId, uStr);
      });
    }

    console.log(
      `✅ [SessionManager] Initialized. Restored ${recentSessions.length} active sessions.`
    );
  } catch (err) {
    console.warn("SessionManager init warning:", err.message);
  }
}

module.exports = {
  recordHeartbeat,
  handleDisconnect,
  cleanupStaleSessions,
  getActiveSessions,
  initSessionManager,
  isGenuineRegisteredUser,
};
