
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config();

// Ensure Judge0 isolated execution sandbox host is always configured for runtime execution
if (process.env.NODE_ENV !== "test" && !process.env.JUDGE0_API_HOST && !process.env.JUDGE0_API_URL) {
  process.env.JUDGE0_API_HOST = "https://ce.judge0.com";
}

// Require explicit administrator email configuration in environment
const configuredAdminEmail = (process.env.MAIN_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "").toLowerCase().trim();
if (!configuredAdminEmail && process.env.NODE_ENV === "production") {
  console.warn("⚠️ [Security] MAIN_ADMIN_EMAIL or ADMIN_EMAIL is not set. Administrator provisioning will remain disabled until explicitly configured.");
}

const express = require("express")
const fs = require("fs")
const crypto = require("crypto")
const mongoose = require("mongoose")
const { initMongooseTiming, timingDiagnosticsMiddleware } = require("./middleware/timingDiagnostics")
initMongooseTiming(mongoose)
const dotenv = require("dotenv")
const cors = require("cors")
const router = require("./route")
const cookieParser = require('cookie-parser');
const authRoutes = require("./routes/authRoutes");
const certificationRoutes = require("./routes/certificationRoutes");
const memberRoutes = require("./routes/memberRoutes");
const progressRoutes = require("./routes/progressRoutes");
const codingRoutes = require("./routes/codingRoutes");
const curriculumRoutes = require("./routes/curriculumRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { router: projectRoutes } = require("./routes/projectRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const recordingRoutes = require("./routes/recordingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const supportRoutes = require("./routes/supportRoutes");
const { bootstrapSuperAdmin } = require("./bootstrap/adminBootstrap");
const Meeting = require("./models/Meeting");
const SupportTicket = require("./models/SupportTicket");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("./config/jwtConfig");
const { getCachedDecodedToken } = require("./middleware/authMiddleware");
const User = require("./models/User");
const { pushNotification, setGlobalIo } = require("./utils/notificationService");
const { setGlobalAdminIo } = require("./utils/adminNotificationService");
const { setGlobalActivityIo, logActivityAndBroadcast } = require("./utils/activityLogger");
const http = require('http');
const { Server } = require('socket.io');
dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = process.env.PORT || 5012; // Use environment variable or fallback to 5012

// Create HTTP Server
const server = http.createServer(app);

// Explicit Trusted Origins for Strict CORS Enforcement
const EXPLICIT_ALLOWED_ORIGINS = new Set(
  [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : null,
    "https://mastery-zone.onrender.com",
    "https://mastery-zone-api.onrender.com",
    "https://mastery-zone.vercel.app",
    "https://masteryzone.netlify.app",
    "https://masteryzone1111.netlify.app",
    "https://s70yashashcapstonemasteryzonekalv.vercel.app",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
  ]
    .flat()
    .filter(Boolean)
    .map((o) => o.trim().replace(/\/+$/, ""))
);

const LOCAL_DEV_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const TRUSTED_LOCAL_ENVS = new Set(["development", "test"]);

function isOriginAllowed(origin, env) {
  const targetEnv = env !== undefined ? env : (process.env.NODE_ENV || "");
  if (!origin) return true; // Mobile clients, server-to-server, curl, same-origin
  const normalized = origin.trim().replace(/\/+$/, "");

  // Check explicit production allowlist
  if (EXPLICIT_ALLOWED_ORIGINS.has(normalized)) {
    return true;
  }

  // Allow project-specific Vercel preview and production deployments
  if (
    /^https:\/\/(mastery-zone|s70-yashash-capstone-mastery-zone|s70yashashcapstonemasteryzone)[a-zA-Z0-9-]*\.vercel\.app$/.test(normalized)
  ) {
    return true;
  }

  // Local development origins permitted ONLY in explicitly trusted local environments (development, test)
  // Unknown, preview, staging, production, and missing NODE_ENV environments MUST reject localhost origins
  const normEnv = (targetEnv || "").trim().toLowerCase();
  const isTrustedLocal = TRUSTED_LOCAL_ENVS.has(normEnv);

  if (isTrustedLocal && LOCAL_DEV_ORIGIN_REGEX.test(normalized)) {
    return true;
  }

  return false;
}

function corsOriginValidator(origin, callback) {
  if (isOriginAllowed(origin)) {
    return callback(null, true);
  }
  console.warn(`⚠️ [CORS Blocked] Request origin "${origin}" is not in the allowed list.`);
  return callback(new Error("CORS policy violation: Origin not allowed"), false);
}

const corsOptions = {
  origin: corsOriginValidator,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-meeting-id",
    "x-title",
    "x-duration-seconds",
    "x-participant-names",
    "x-thumbnail-url",
    "X-CSRF-Token",
    "x-csrf-token",
    "X-XSRF-Token",
    "Range",
  ],
  exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length", "Content-Type", "Server-Timing", "ETag"],
  credentials: true,
};

// Initialize Socket.io with production-ready options
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
  pingTimeout: 30000,
  pingInterval: 25000,
  allowEIO3: true,
  maxHttpBufferSize: 2e6,
});

// Wire Socket.IO globally for instantaneous notification dispatch
setGlobalIo(io);
setGlobalAdminIo(io);
setGlobalActivityIo(io);

// Make io accessible throughout Express app routes
app.set("io", io);
app.set("logActivityAndBroadcast", logActivityAndBroadcast);

// Store online users: { socketId: username }
const onlineUsers = new Map();

// Real-Time Collaborative Coding Rooms: roomId => { code, language, hostUserId, hostSocketId, authorizedUsers, authorizedEmails, participants, createdAt }
const codingRooms = new Map();
const codingChatLimitMap = new Map();
const codingEditLimitMap = new Map();
app.set("codingRooms", codingRooms);
server.codingRooms = codingRooms;

// Active User Sessions Map for Real-Time Super Admin Monitoring:
// socketId => { socketId, userId, username, fullName, email, currentPage, activity, startedAt, lastHeartbeat, device }
const activeUserSessions = new Map();
app.set("activeUserSessions", activeUserSessions);

// Debounced online users broadcaster to prevent network flooding
let onlineUsersUpdateTimer = null;
function broadcastOnlineUsers() {
  if (onlineUsersUpdateTimer) return;
  onlineUsersUpdateTimer = setTimeout(() => {
    onlineUsersUpdateTimer = null;
    io.emit("update_online_users", Array.from(new Set(onlineUsers.values())));
  }, 1000);
}

// Periodic cleanup for stale active user sessions (heartbeat older than 5 minutes)
const sessionCleanupInterval = setInterval(() => {
  const staleThreshold = Date.now() - 5 * 60 * 1000;
  for (const [sId, sess] of activeUserSessions.entries()) {
    if (sess.lastHeartbeat && sess.lastHeartbeat < staleThreshold) {
      activeUserSessions.delete(sId);
      io.to("super_admin_room").emit("live_session_ended", { socketId: sId, userId: sess.userId });
    }
  }
}, 5 * 60 * 1000);
if (sessionCleanupInterval.unref) sessionCleanupInterval.unref();

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  const handleUserLeavingMeeting = async (sock) => {
    const mId = sock.data?.meetingId;
    if (!mId) return;
    const roomName = `meeting_${mId}`;
    sock.leave(roomName);
    sock.to(roomName).emit("meeting_peer_left", { socketId: sock.id });

    try {
      const m = await Meeting.findOne({ meetingId: mId });
      if (m) {
        let changed = false;
        const currentSockets = io.sockets.adapter.rooms.get(roomName) || new Set();

        m.participants.forEach((p) => {
          if (p.socketId === sock.id || (p.socketId && !currentSockets.has(p.socketId))) {
            if (!p.leftAt) {
              p.leftAt = new Date();
              changed = true;
            }
          }
        });

        if (changed) {
          await m.save();
        }

        const seenActive = new Set();
        const activeRemaining = [];
        for (let i = m.participants.length - 1; i >= 0; i--) {
          const p = m.participants[i];
          if (p.leftAt || !p.socketId || !currentSockets.has(p.socketId)) continue;
          const uKey = String(p.userId || p.socketId);
          const nameKey = (p.fullName || "").trim().toLowerCase();
          if (seenActive.has(uKey) || (nameKey && nameKey !== "learner" && seenActive.has(nameKey))) continue;
          seenActive.add(uKey);
          if (nameKey && nameKey !== "learner") seenActive.add(nameKey);
          activeRemaining.unshift(p);
        }

        io.to(roomName).emit("meeting_participants_updated", activeRemaining);
      }
    } catch (err) {
      console.error("Error during meeting leave cleanup:", err);
    }
    sock.data.meetingId = null;
  };

  const joinUserRoomFromToken = (rawToken) => {
    if (!rawToken || typeof rawToken !== "string") return null;
    try {
      const cleanToken = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;
      // Fast path: If this socket is already authenticated with this exact token and in its room, return immediately
      if (socket.data.authToken === cleanToken && socket.data.userId && socket.rooms.has(`user_${socket.data.userId}`)) {
        return socket.data.userId;
      }
      const decoded = getCachedDecodedToken(cleanToken) || jwt.verify(cleanToken, getJwtSecret());
      const uid = String(decoded.userId || decoded.id || decoded._id || "").trim();
      if (uid) {
        // Idempotency guard: If this socket is already authenticated for this exact user and in their room, update authToken and return immediately
        if (socket.data.userId === uid && socket.rooms.has(`user_${uid}`)) {
          socket.data.authToken = cleanToken;
          return uid;
        }

        const oldUid = socket.data.userId;
        if (oldUid && oldUid !== uid) {
          // Leave old user's private notification and session room
          socket.leave(`user_${oldUid}`);
          console.log(`🔌 Socket ${socket.id} left previous room user_${oldUid} on account switch`);
          // Leave old user's meeting session if any
          if (socket.data.meetingId) {
            handleUserLeavingMeeting(socket);
          }
          // Leave any user-specific ticket rooms, admin rooms, or meeting rooms previously joined
          for (const roomName of socket.rooms) {
            if (
              roomName.startsWith("ticket_") ||
              roomName.startsWith("meeting_") ||
              roomName.startsWith("coding_room_") ||
              roomName === "super_admin_room"
            ) {
              socket.leave(roomName);
            }
          }
          if (socket.data.codingRoomId && codingRooms.has(socket.data.codingRoomId)) {
            const cRoom = codingRooms.get(socket.data.codingRoomId);
            cRoom.participants.delete(socket.id);
            const rKey = `coding_room_${socket.data.codingRoomId}`;
            io.to(rKey).emit("coding_room_participants", Array.from(cRoom.participants.values()));
            if (cRoom.participants.size === 0) {
              codingRooms.delete(socket.data.codingRoomId);
            }
            socket.data.codingRoomId = null;
          }
          // Clean up old user session in super admin monitor
          if (activeUserSessions.has(socket.id)) {
            const sess = activeUserSessions.get(socket.id);
            activeUserSessions.delete(socket.id);
            io.to("super_admin_room").emit("live_session_ended", { socketId: socket.id, userId: sess?.userId });
          }
        }
        socket.data.authToken = cleanToken;
        socket.data.userId = uid;
        socket.data.userRole = decoded.role || "user";
        socket.data.role = decoded.role || "user";
        socket.data.isMainAdmin = Boolean(decoded.isMainAdmin || decoded.role === "admin" || decoded.role === "SUPER_ADMIN");
        socket.data.userEmail = decoded.email || "";
        socket.data.userFullName = decoded.fullName || decoded.name || decoded.username || decoded.email || "";
        socket.data.username = decoded.username || "";
        const verifiedName = socket.data.userFullName || socket.data.username || socket.data.userEmail || `User_${uid.slice(-4)}`;
        onlineUsers.set(socket.id, verifiedName);
        broadcastOnlineUsers();
        socket.join(`user_${uid}`);
        console.log(`📡 Socket ${socket.id} authenticated into room user_${uid}`);
        return uid;
      }
    } catch (err) {
      console.warn(`Socket auth failed for ${socket.id}:`, err.message);
    }
    return null;
  };

  // Auto-join user room if JWT token was passed in Socket.IO handshake auth
  if (socket.handshake?.auth?.token) {
    joinUserRoomFromToken(socket.handshake.auth.token);
  }

  // Explicit socket logout & room purge on sign out
  socket.on("logout_user_session", () => {
    const oldUid = socket.data.userId;
    if (oldUid) {
      socket.leave(`user_${oldUid}`);
    }
    if (socket.data.meetingId) {
      handleUserLeavingMeeting(socket);
    }
    for (const roomName of socket.rooms) {
      if (
        roomName.startsWith("ticket_") ||
        roomName.startsWith("meeting_") ||
        roomName.startsWith("coding_room_") ||
        roomName === "super_admin_room"
      ) {
        socket.leave(roomName);
      }
    }
    if (socket.data.codingRoomId && codingRooms.has(socket.data.codingRoomId)) {
      const cRoom = codingRooms.get(socket.data.codingRoomId);
      cRoom.participants.delete(socket.id);
      const rKey = `coding_room_${socket.data.codingRoomId}`;
      io.to(rKey).emit("coding_room_participants", Array.from(cRoom.participants.values()));
      if (cRoom.participants.size === 0) {
        codingRooms.delete(socket.data.codingRoomId);
      }
      delete socket.data.codingRoomId;
    }
    if (activeUserSessions.has(socket.id)) {
      const sess = activeUserSessions.get(socket.id);
      activeUserSessions.delete(socket.id);
      io.to("super_admin_room").emit("live_session_ended", { socketId: socket.id, userId: sess?.userId });
    }
    delete socket.data.authToken;
    delete socket.data.userId;
    delete socket.data.userRole;
    delete socket.data.role;
    delete socket.data.isMainAdmin;
    delete socket.data.userEmail;
    delete socket.data.userFullName;
    delete socket.data.username;
    delete socket.data.meetingId;
    delete socket.data.meetingUser;
    onlineUsers.delete(socket.id);
    broadcastOnlineUsers();
    console.log(`🔌 Socket ${socket.id} logged out and purged private rooms${oldUid ? ` for user_${oldUid}` : ""}`);
  });

  // Authenticated user room registration for real-time notifications & progress updates
  socket.on("register_user_session", (payload) => {
    if (!payload) return;
    if (typeof payload === "object") {
      if (payload.token) {
        joinUserRoomFromToken(payload.token);
      } else if (payload.userId && socket.data.userId && String(payload.userId).trim() === socket.data.userId) {
        if (!socket.rooms.has(`user_${socket.data.userId}`)) {
          socket.join(`user_${socket.data.userId}`);
        }
      }
      return;
    }
    const str = String(payload).trim();
    if (str.split(".").length === 3) {
      joinUserRoomFromToken(str);
    }
  });

  // When a user logs into the app/chat (Strictly Authenticated)
  socket.on("user_joined", (payload) => {
    let token = null;
    if (typeof payload === "object" && payload !== null) {
      token = payload.token;
    } else if (typeof payload === "string" && payload.split(".").length === 3) {
      token = payload;
    }
    if (token) {
      joinUserRoomFromToken(token);
    }
    if (!socket.data.userId) {
      socket.emit("chat_error", { message: "Authentication required to join online users." });
      return;
    }
    const verifiedName = socket.data.userFullName || socket.data.username || socket.data.userEmail || `User_${socket.data.userId.slice(-4)}`;
    onlineUsers.set(socket.id, verifiedName);
    broadcastOnlineUsers();
  });

  // Real-time Support Ticket Chat & Typing Rooms (Strictly Authenticated & Authorized)
  socket.on("join_ticket_room", async (data) => {
    const ticketId = typeof data === "object" ? data.ticketId : data;
    const token = typeof data === "object" ? data.token : null;
    if (!ticketId) return;

    if (token) {
      joinUserRoomFromToken(token);
    }

    const uid = socket.data.userId;
    const role = socket.data.userRole;
    const isAdmin = role === "admin" || role === "SUPER_ADMIN" || socket.data.isMainAdmin;

    if (!uid && !isAdmin) {
      socket.emit("ticket_auth_error", { message: "Authentication required to access support ticket." });
      return;
    }

    if (isAdmin) {
      socket.join(`ticket_${ticketId}`);
      console.log(`📡 Admin socket ${socket.id} joined room ticket_${ticketId}`);
      return;
    }

    try {
      const ticket = await SupportTicket.findOne({ ticketId }).select("userId").lean();
      if (!ticket) {
        socket.emit("ticket_auth_error", { message: "Support ticket not found." });
        return;
      }
      if (String(ticket.userId) !== String(uid)) {
        console.warn(`🚨 Unauthorized socket ${socket.id} (user ${uid}) attempted to access ticket_${ticketId}`);
        socket.emit("ticket_auth_error", { message: "Access denied. You do not own this ticket." });
        return;
      }
      socket.join(`ticket_${ticketId}`);
      console.log(`📡 Authorized student socket ${socket.id} joined room ticket_${ticketId}`);
    } catch (err) {
      console.error("Ticket room auth error:", err.message);
    }
  });

  socket.on("leave_ticket_room", (data) => {
    const ticketId = typeof data === "object" ? data.ticketId : data;
    if (ticketId) {
      socket.leave(`ticket_${ticketId}`);
      console.log(`📡 Socket ${socket.id} left room ticket_${ticketId}`);
    }
  });

  socket.on("ticket_typing", (data) => {
    if (data?.ticketId && socket.data.userId) {
      socket.to(`ticket_${data.ticketId}`).emit("ticket_typing_update", {
        ticketId: data.ticketId,
        userName: data.userName || "User",
        userRole: data.userRole || "USER",
        isTyping: !!data.isTyping,
      });
    }
  });

  // Real-time user activity heartbeat for Super Admin live activity monitoring
  socket.on("user_activity_heartbeat", async (data) => {
    if (!data) return;
    // Derive identity strictly from authenticated socket session; never trust client-supplied data.userId
    const uid = socket.data.userId;
    if (!uid || uid === "guest") return; // Exclude non-authenticated guest sessions

    let userInfo = null;
    if (uid && mongoose.Types.ObjectId.isValid(uid)) {
      try {
        userInfo = await User.findById(uid).select("username fullName email isGuest role lastLoginDevice");
      } catch {}
    }

    // Strictly ensure only genuine registered student accounts are added to real-time telemetry
    if (
      !userInfo ||
      userInfo.isGuest ||
      userInfo.role === "SUPER_ADMIN" ||
      String(userInfo.email || "").includes("@masteryzone.com") ||
      String(userInfo.username || "").startsWith("guest_")
    ) {
      return;
    }

    const sessionObj = {
      socketId: socket.id,
      userId: String(userInfo._id),
      username: userInfo.username,
      fullName: userInfo.fullName || userInfo.username,
      email: userInfo.email,
      currentPage: data.page || "/home",
      activity: data.activity || "Learning Path",
      startedAt: activeUserSessions.get(socket.id)?.startedAt || Date.now(),
      lastHeartbeat: Date.now(),
      device: data.device || userInfo.lastLoginDevice || "Desktop / Chrome",
      mediaState: data.mediaState || activeUserSessions.get(socket.id)?.mediaState || null,
    };

    activeUserSessions.set(socket.id, sessionObj);

    // Notify Super Admin live monitoring channel in real time
    io.to("super_admin_room").emit("live_session_update", sessionObj);
  });

  // Super Admin joins real-time live monitoring & proctoring feed room (Restricted to verified administrators)
  const handleAdminJoin = async (payload) => {
    let isAdmin = socket.data.userRole === "admin" || socket.data.userRole === "SUPER_ADMIN";
    
    // Check if a token was sent with the event or handshake
    const candidateToken = (payload && typeof payload === "object" ? payload.token : payload) || socket.handshake?.auth?.token;
    if (!isAdmin && candidateToken && typeof candidateToken === "string") {
      try {
        const clean = candidateToken.startsWith("Bearer ") ? candidateToken.slice(7) : candidateToken;
        const decoded = getCachedDecodedToken(clean) || jwt.verify(clean, getJwtSecret());
        const u = await User.findById(decoded.userId || decoded.id || decoded._id).select("role isMainAdmin email").lean();
        if (u && (u.role === "admin" || u.role === "SUPER_ADMIN" || u.isMainAdmin)) {
          isAdmin = true;
          socket.data.userId = String(u._id);
          socket.data.userRole = u.role;
        }
      } catch {}
    }

    if (!isAdmin) {
      console.warn(`🚨 Unauthorized socket ${socket.id} attempted to join super_admin_room`);
      socket.emit("admin_auth_error", { message: "Access denied. Administrator privileges required." });
      return;
    }

    socket.join("super_admin_room");
    // Filter snapshot to ensure only valid registered student accounts are transmitted
    const validSessions = Array.from(activeUserSessions.values()).filter(
      (s) =>
        s.userId &&
        s.userId !== "guest" &&
        !String(s.email || "").includes("@masteryzone.com") &&
        !String(s.username || "").startsWith("guest_")
    );
    socket.emit("live_sessions_snapshot", validSessions);
    socket.emit("admin_feed_connected", { success: true, timestamp: new Date() });
  };

  socket.on("join_admin_monitoring", handleAdminJoin);
  socket.on("join_admin_feed", handleAdminJoin);

  // Rate limiting helper for chat and direct messaging
  const checkChatRateLimit = (sock) => {
    const now = Date.now();
    sock.data.msgTimestamps = (sock.data.msgTimestamps || []).filter((t) => now - t < 5000);
    if (sock.data.msgTimestamps.length >= 10) {
      return false;
    }
    sock.data.msgTimestamps.push(now);
    return true;
  };

  // When a user sends a direct message (invite)
  socket.on("send_dm", async ({ toUser, roomCode }) => {
    if (!socket.data.userId) {
      socket.emit("chat_error", { message: "Authenticated session required to send direct messages." });
      return;
    }
    if (!checkChatRateLimit(socket)) {
      socket.emit("chat_error", { message: "Rate limit exceeded. Please wait a few seconds before sending another message." });
      return;
    }
    const verifiedSender = socket.data.userFullName || socket.data.username || socket.data.meetingUser?.fullName || socket.data.userEmail || `User_${socket.data.userId.slice(-4)}`;
    if (!toUser || typeof toUser !== "string" || toUser.length > 100) return;
    const cleanRoomCode = String(roomCode || "").slice(0, 50);

    let recipient = null;
    try {
      recipient = await User.findOne({
        $or: [{ username: toUser }, { fullName: toUser }, { email: toUser.toLowerCase() }],
      }).select("_id username fullName email").lean();
    } catch {}

    if (!recipient) {
      socket.emit("chat_error", { message: "Recipient user not found." });
      return;
    }

    for (const [id, username] of onlineUsers.entries()) {
      if (username === toUser || username === recipient.fullName || username === recipient.username) {
        io.to(id).emit("receive_dm", { fromUser: verifiedSender, roomCode: cleanRoomCode });
        break;
      }
    }

    if (cleanRoomCode && codingRooms.has(cleanRoomCode)) {
      const cRoom = codingRooms.get(cleanRoomCode);
      if (String(cRoom.hostUserId) === String(socket.data.userId) || cRoom.authorizedUsers?.has(socket.data.userId)) {
        cRoom.authorizedUsers.add(recipient._id.toString());
        if (recipient.email) cRoom.authorizedEmails.add(recipient.email.toLowerCase());
      }
    }

    try {
      await pushNotification(io, {
        userId: recipient._id,
        title: "Collaboration Room Invite",
        message: `${verifiedSender} invited you to join room ${cleanRoomCode}.`,
        type: "collaboration",
        severity: "info",
        actionUrl: "/coding",
        actionLabel: "Join Session",
      });
    } catch {}
  });

  // When a user sends a private 1-on-1 chat message
  socket.on("send_private_msg", async (messageData) => {
    if (!socket.data.userId) {
      socket.emit("chat_error", { message: "Authenticated session required to send private messages." });
      return;
    }
    if (!checkChatRateLimit(socket)) {
      socket.emit("chat_error", { message: "Rate limit exceeded. Please wait a few seconds before sending another message." });
      return;
    }
    const verifiedSender = socket.data.userFullName || socket.data.username || socket.data.meetingUser?.fullName || socket.data.userEmail || `User_${socket.data.userId.slice(-4)}`;
    const { toUser, text } = messageData || {};
    if (!toUser || typeof toUser !== "string" || toUser.length > 100) return;
    const cleanText = String(text || "").trim();
    if (!cleanText || cleanText.length > 2000) return;

    let recipient = null;
    try {
      recipient = await User.findOne({
        $or: [{ username: toUser }, { fullName: toUser }, { email: toUser.toLowerCase() }],
      }).select("_id username fullName email").lean();
    } catch {}

    if (!recipient) {
      socket.emit("chat_error", { message: "Recipient user not found." });
      return;
    }

    for (const [id, username] of onlineUsers.entries()) {
      if (username === toUser || username === recipient.fullName || username === recipient.username) {
        io.to(id).emit("receive_private_msg", {
          id: Date.now().toString(),
          fromUser: verifiedSender,
          text: cleanText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        break;
      }
    }

    try {
      const preview = cleanText.length > 72 ? `${cleanText.slice(0, 70)}…` : cleanText;
      await pushNotification(io, {
        userId: recipient._id,
        title: `Message from ${verifiedSender}`,
        message: preview,
        type: "collaboration",
        severity: "info",
      });
    } catch {}
  });

  // When a user sends a global chat message
  socket.on("send_global_message", (messageData) => {
    if (!socket.data.userId) {
      socket.emit("chat_error", { message: "Authenticated session required to send global messages." });
      return;
    }
    if (!checkChatRateLimit(socket)) {
      socket.emit("chat_error", { message: "Rate limit exceeded. Please wait a few seconds before sending another message." });
      return;
    }
    if (!messageData || typeof messageData !== "object") return;
    const text = String(messageData.text || "").trim();
    if (!text || text.length > 2000) return;
    const verifiedUser = socket.data.userFullName || socket.data.username || socket.data.meetingUser?.fullName || socket.data.userEmail || `User_${socket.data.userId.slice(-4)}`;

    io.emit("receive_global_message", {
      id: Date.now().toString(),
      text,
      user: verifiedUser,
      zone: String(messageData.zone || "Global").slice(0, 50),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  // =========================================================
  // REAL-TIME COLLABORATIVE CODING ROOMS
  // =========================================================
  const authenticateCodingSocket = (token) => {
    let authUser = null;
    if (token && typeof token === "string") {
      try {
        const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;
        const decoded = getCachedDecodedToken(cleanToken) || jwt.verify(cleanToken, getJwtSecret());
        if (decoded) {
          authUser = {
            userId: String(decoded.userId || decoded.id || decoded._id),
            fullName: decoded.fullName || decoded.username || decoded.name || decoded.email,
            email: decoded.email || "",
          };
          socket.data.userId = authUser.userId;
          socket.data.userEmail = authUser.email;
          socket.data.userFullName = authUser.fullName;
        }
      } catch {}
    }

    if (!authUser && socket.data.userId) {
      authUser = {
        userId: String(socket.data.userId),
        fullName: socket.data.userFullName || socket.data.username || socket.data.meetingUser?.fullName || socket.data.userEmail || `User_${socket.data.userId.slice(-4)}`,
        email: socket.data.userEmail || "",
      };
    }
    return authUser;
  };

  // 1. Explicit Room Creation (Authorized operation)
  socket.on("create_coding_room", async ({ roomId, language, initialCode, token, invitedUserIds = [], invitedEmails = [] }) => {
    const authUser = authenticateCodingSocket(token);
    if (!authUser) {
      socket.emit("coding_room_error", { message: "Authentication required to create a collaborative coding room." });
      return;
    }

    let targetRoomId = roomId;
    if (!targetRoomId || typeof targetRoomId !== "string") {
      targetRoomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    if (!/^[a-zA-Z0-9_\-]{3,64}$/.test(targetRoomId)) {
      socket.emit("coding_room_error", { message: "Invalid room identifier format. Room ID must be 3-64 alphanumeric characters." });
      return;
    }

    if (codingRooms.has(targetRoomId)) {
      socket.emit("coding_room_error", { message: "Room already exists. You cannot overwrite or squat an existing room." });
      return;
    }

    const safeLanguage = ["python", "py", "javascript", "js", "node", "cpp", "c++", "c", "java", "html", "css"].includes(String(language).toLowerCase())
      ? String(language).toLowerCase()
      : "python";

    const authorizedUsers = new Set([authUser.userId]);
    const authorizedEmails = new Set([authUser.email ? authUser.email.toLowerCase() : ""]);

    // If invitations were specified, validate them against real User records in MongoDB
    if (Array.isArray(invitedUserIds) && invitedUserIds.length > 0) {
      const User = require("./models/User");
      const validUsers = await User.find({ _id: { $in: invitedUserIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } }).select("_id email").lean();
      for (const u of validUsers) {
        authorizedUsers.add(String(u._id));
        if (u.email) authorizedEmails.add(u.email.toLowerCase());
      }
    }

    if (Array.isArray(invitedEmails) && invitedEmails.length > 0) {
      const User = require("./models/User");
      const validEmails = await User.find({ email: { $in: invitedEmails.map(e => String(e).toLowerCase().trim()) } }).select("_id email").lean();
      for (const u of validEmails) {
        authorizedUsers.add(String(u._id));
        if (u.email) authorizedEmails.add(u.email.toLowerCase());
      }
    }

    // Leave any previous coding room
    if (socket.data.codingRoomId && socket.data.codingRoomId !== targetRoomId) {
      const prevRoomKey = `coding_room_${socket.data.codingRoomId}`;
      socket.leave(prevRoomKey);
      const prevRoom = codingRooms.get(socket.data.codingRoomId);
      if (prevRoom) {
        prevRoom.participants.delete(socket.id);
        io.to(prevRoomKey).emit("coding_room_participants", Array.from(prevRoom.participants.values()));
        io.to(prevRoomKey).emit("coding_system_msg", {
          text: `${authUser.fullName} left the session`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    }

    const newRoom = {
      roomId: targetRoomId,
      code: typeof initialCode === "string" ? initialCode.slice(0, 500000) : "",
      language: safeLanguage,
      hostUserId: authUser.userId,
      hostSocketId: socket.id,
      authorizedUsers,
      authorizedEmails,
      participants: new Map(),
      createdAt: new Date(),
    };

    codingRooms.set(targetRoomId, newRoom);
    socket.data.codingRoomId = targetRoomId;
    const roomKey = `coding_room_${targetRoomId}`;
    socket.join(roomKey);

    const participantInfo = {
      socketId: socket.id,
      userId: authUser.userId,
      user: { fullName: authUser.fullName, email: authUser.email },
      role: "Host",
      joinedAt: new Date().toISOString(),
      cursor: null,
    };
    newRoom.participants.set(socket.id, participantInfo);

    socket.emit("coding_room_created", {
      roomId: targetRoomId,
      hostUserId: authUser.userId,
    });

    socket.emit("coding_room_state", {
      code: newRoom.code,
      language: newRoom.language,
      participants: Array.from(newRoom.participants.values()),
    });

    io.to(roomKey).emit("coding_room_participants", Array.from(newRoom.participants.values()));
  });

  // 2. Room Joining (Requires existing authorized room)
  socket.on("join_coding_room", async ({ roomId, user, language, initialCode, token }) => {
    if (!roomId || typeof roomId !== "string" || !/^[a-zA-Z0-9_\-]{3,64}$/.test(roomId)) {
      socket.emit("coding_room_error", { message: "Invalid room identifier." });
      return;
    }

    const authUser = authenticateCodingSocket(token);
    if (!authUser) {
      socket.emit("coding_room_error", { message: "Authentication required to access collaborative coding room." });
      return;
    }

    let room = codingRooms.get(roomId);

    // If room does not exist in memory, verify if it corresponds to an active Meeting in DB where user is host
    if (!room) {
      const isPossibleMeetingId =
        roomId.startsWith("mtg_") ||
        roomId.startsWith("meeting_") ||
        /^[a-f0-9]{24}$/i.test(roomId) ||
        /^[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}$/.test(roomId);

      if (isPossibleMeetingId) {
        try {
          const Meeting = require("./models/Meeting");
          const meeting = await Meeting.findOne({
            $or: [{ meetingId: roomId }, { meetingId: roomId.replace(/-/g, "") }],
            status: { $ne: "ended" },
          }).lean();

          if (meeting && String(meeting.hostUserId) === String(authUser.userId)) {
            // Initialize meeting coding room
            const authorizedUsers = new Set([authUser.userId]);
            const authorizedEmails = new Set([authUser.email ? authUser.email.toLowerCase() : ""]);
            if (Array.isArray(meeting.participants)) {
              meeting.participants.forEach(p => {
                if (p.userId) authorizedUsers.add(String(p.userId));
              });
            }
            const safeLanguage = ["python", "py", "javascript", "js", "node", "cpp", "c++", "c", "java", "html", "css"].includes(String(language).toLowerCase())
              ? String(language).toLowerCase()
              : "python";

            room = {
              roomId,
              code: typeof initialCode === "string" ? initialCode.slice(0, 500000) : "",
              language: safeLanguage,
              hostUserId: authUser.userId,
              hostSocketId: socket.id,
              authorizedUsers,
              authorizedEmails,
              participants: new Map(),
              createdAt: new Date(),
            };
            codingRooms.set(roomId, room);
          }
        } catch {}
      }

      if (!room) {
        socket.emit("coding_room_error", {
          message: "Coding room does not exist. Rooms must be created via create_coding_room before joining.",
        });
        return;
      }
    }

    // Verify room authorization
    const isHost = String(room.hostUserId) === String(authUser.userId);
    const isAuthorizedUser = room.authorizedUsers && room.authorizedUsers.has(authUser.userId);
    const isAuthorizedEmail = authUser.email && room.authorizedEmails && room.authorizedEmails.has(authUser.email.toLowerCase());

    let isMeetingAuthorized = false;
    try {
      const Meeting = require("./models/Meeting");
      const meeting = await Meeting.findOne({
        $or: [{ meetingId: roomId }, { meetingId: roomId.replace(/-/g, "") }],
        status: { $ne: "ended" },
      }).lean();
      if (meeting) {
        isMeetingAuthorized =
          String(meeting.hostUserId) === String(authUser.userId) ||
          (Array.isArray(meeting.participants) &&
            meeting.participants.some((p) => String(p.userId || p._id || "") === String(authUser.userId)));
      }
    } catch {}

    if (!isHost && !isAuthorizedUser && !isAuthorizedEmail && !isMeetingAuthorized) {
      socket.emit("coding_room_error", {
        message: "Access denied. You are not authorized to join this private collaborative coding room.",
      });
      return;
    }

    if (socket.data.codingRoomId && socket.data.codingRoomId !== roomId) {
      const prevRoomKey = `coding_room_${socket.data.codingRoomId}`;
      socket.leave(prevRoomKey);
      const prevRoom = codingRooms.get(socket.data.codingRoomId);
      if (prevRoom) {
        prevRoom.participants.delete(socket.id);
        io.to(prevRoomKey).emit("coding_room_participants", Array.from(prevRoom.participants.values()));
        io.to(prevRoomKey).emit("coding_system_msg", {
          text: `${authUser.fullName} left the session`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    }

    socket.data.codingRoomId = roomId;
    if (authUser && authUser.userId) {
      socket.data.userId = authUser.userId;
      socket.data.userRole = authUser.role;
      socket.data.userEmail = authUser.email;
      socket.data.userFullName = authUser.fullName;
    }
    const roomKey = `coding_room_${roomId}`;
    socket.join(roomKey);

    const participantInfo = {
      socketId: socket.id,
      userId: authUser.userId,
      user: { fullName: authUser.fullName, email: authUser.email },
      role: isHost ? "Host" : "Collaborator",
      joinedAt: new Date().toISOString(),
      cursor: null,
    };
    room.participants.set(socket.id, participantInfo);

    // Send the current code state to the newly joined client
    socket.emit("coding_room_state", {
      code: room.code,
      language: room.language,
      participants: Array.from(room.participants.values()),
    });

    // Broadcast updated participant list to everyone in this room
    io.to(roomKey).emit("coding_room_participants", Array.from(room.participants.values()));

    // Broadcast system message
    io.to(roomKey).emit("coding_system_msg", {
      text: `${authUser.fullName} joined the session`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on("invite_coding_participant", async ({ roomId, targetUserId, targetEmail }) => {
    if (!socket.data.userId || !roomId || !codingRooms.has(roomId)) return;
    const room = codingRooms.get(roomId);
    if (String(room.hostUserId) !== String(socket.data.userId)) {
      socket.emit("coding_room_error", { message: "Only the room host can invite collaborators." });
      return;
    }

    const User = require("./models/User");
    let added = false;
    if (targetUserId) {
      const cleanId = String(targetUserId).trim();
      if (mongoose.Types.ObjectId.isValid(cleanId)) {
        const u = await User.findById(cleanId).select("_id email fullName").lean();
        if (u) {
          room.authorizedUsers.add(String(u._id));
          if (u.email) room.authorizedEmails.add(u.email.toLowerCase());
          added = true;
          io.to(`user_${u._id}`).emit("coding_room_invitation", {
            roomId,
            inviterName: socket.data.userFullName || "The Host",
          });
        }
      } else {
        room.authorizedUsers.add(cleanId);
        added = true;
      }
    }

    if (targetEmail) {
      const cleanEmail = String(targetEmail).toLowerCase().trim();
      const u = await User.findOne({ email: cleanEmail }).select("_id email fullName").lean();
      if (u) {
        room.authorizedUsers.add(String(u._id));
        room.authorizedEmails.add(cleanEmail);
        added = true;
        io.to(`user_${u._id}`).emit("coding_room_invitation", {
          roomId,
          inviterName: socket.data.userFullName || "The Host",
        });
      } else {
        room.authorizedEmails.add(cleanEmail);
        added = true;
      }
    }

    if (added) {
      socket.emit("coding_system_msg", {
        text: "Collaborator invited to session",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } else {
      socket.emit("coding_room_error", { message: "Could not find user to invite." });
    }
  });

  socket.on("code_change", ({ roomId, code, language, cursor }) => {
    if (!roomId || socket.data.codingRoomId !== roomId || !codingRooms.has(roomId)) return;
    const room = codingRooms.get(roomId);
    if (!room.participants.has(socket.id)) return;
    if (String(room.hostUserId) !== String(socket.data.userId) && !room.authorizedUsers?.has(socket.data.userId)) return;

    // Rate limit edits: max 50 edits per 1 second per socket
    const now = Date.now();
    const editHistory = (codingEditLimitMap.get(socket.id) || []).filter((t) => now - t < 1000);
    if (editHistory.length >= 50) return;
    editHistory.push(now);
    codingEditLimitMap.set(socket.id, editHistory);

    room.code = typeof code === "string" ? code.slice(0, 500000) : "";
    if (language) {
      const safeLang = ["python", "py", "javascript", "js", "node", "cpp", "c++", "c", "java", "html", "css"].includes(String(language).toLowerCase())
        ? String(language).toLowerCase()
        : room.language;
      room.language = safeLang;
    }

    // Broadcast code updates to all other participants in the room
    socket.to(`coding_room_${roomId}`).emit("code_update", {
      code: room.code,
      language: room.language,
      cursor,
      fromSocket: socket.id,
    });
  });

  socket.on("cursor_move", ({ roomId, cursor }) => {
    if (!roomId || socket.data.codingRoomId !== roomId || !codingRooms.has(roomId)) return;
    const room = codingRooms.get(roomId);
    if (!room.participants.has(socket.id)) return;
    if (String(room.hostUserId) !== String(socket.data.userId) && !room.authorizedUsers?.has(socket.data.userId)) return;
    const p = room.participants.get(socket.id);
    if (cursor && typeof cursor === "object") {
      const line = Number(cursor.line);
      const ch = Number(cursor.ch);
      p.cursor = {
        line: Number.isFinite(line) && line >= 0 ? line : 0,
        ch: Number.isFinite(ch) && ch >= 0 ? ch : 0,
      };
    }
    socket.to(`coding_room_${roomId}`).emit("cursor_update", {
      cursor: p.cursor,
      user: p.user,
      socketId: socket.id,
    });
  });

  socket.on("coding_chat_message", ({ roomId, text }) => {
    if (!roomId || socket.data.codingRoomId !== roomId || !codingRooms.has(roomId)) return;
    const room = codingRooms.get(roomId);
    if (!room.participants.has(socket.id)) return;
    if (String(room.hostUserId) !== String(socket.data.userId) && !room.authorizedUsers?.has(socket.data.userId)) return;

    // Rate limit chat: max 5 messages per 3 seconds
    const now = Date.now();
    const chatHistory = (codingChatLimitMap.get(socket.id) || []).filter((t) => now - t < 3000);
    if (chatHistory.length >= 5) {
      socket.emit("coding_room_error", { message: "You are sending messages too quickly. Please wait a moment." });
      return;
    }
    chatHistory.push(now);
    codingChatLimitMap.set(socket.id, chatHistory);

    const cleanText = String(text || "").trim();
    if (!cleanText || cleanText.length > 2000) return;
    const p = room.participants.get(socket.id);

    io.to(`coding_room_${roomId}`).emit("coding_chat_message", {
      id: Date.now().toString(),
      text: cleanText,
      user: p.user,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on("coding_execution_event", ({ roomId, status, result }) => {
    if (!roomId || socket.data.codingRoomId !== roomId || !codingRooms.has(roomId)) return;
    const room = codingRooms.get(roomId);
    if (!room.participants.has(socket.id)) return;
    if (String(room.hostUserId) !== String(socket.data.userId) && !room.authorizedUsers?.has(socket.data.userId)) return;
    const p = room.participants.get(socket.id);

    io.to(`coding_room_${roomId}`).emit("coding_execution_event", {
      status: String(status || "completed").slice(0, 50),
      user: p.user,
      result: result ? {
        output: String(result.output || "").slice(0, 50000),
        error: String(result.error || "").slice(0, 50000),
        ok: Boolean(result.ok),
        durationMs: Number(result.durationMs) || 0,
      } : null,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("leave_coding_room", ({ roomId }) => {
    if (!roomId || socket.data.codingRoomId !== roomId || !codingRooms.has(roomId)) return;
    const roomKey = `coding_room_${roomId}`;
    socket.leave(roomKey);
    socket.data.codingRoomId = null;
    const room = codingRooms.get(roomId);
    const participant = room.participants.get(socket.id);
    room.participants.delete(socket.id);

    io.to(roomKey).emit("coding_room_participants", Array.from(room.participants.values()));
    if (participant) {
      io.to(roomKey).emit("coding_system_msg", {
        text: `${participant.user?.fullName || "A developer"} left the session`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    if (room.participants.size === 0) {
      codingRooms.delete(roomId);
    }
  });

  // ==========================================
  // MASTERY ZONE LIVE — REAL-TIME COLLABORATION & WEBRTC
  // ==========================================
  const isAuthorizedMeetingMember = (sock, meetingId) => {
    if (!sock || !meetingId) return false;
    const authedMid = sock.data?.meetingId;
    if (!authedMid) return false;

    // The requested meetingId must match the socket's authenticated meetingId
    const cleanRequested = String(meetingId).trim().toLowerCase().replace(/-/g, "");
    const cleanAuthed = String(authedMid).trim().toLowerCase().replace(/-/g, "");
    if (cleanRequested !== cleanAuthed) {
      return false;
    }

    return (
      sock.rooms.has(`meeting_${authedMid}`) ||
      sock.rooms.has(`meeting_${cleanAuthed}`) ||
      sock.rooms.has(`meeting_${String(meetingId).trim().toLowerCase()}`)
    );
  };

  const isMeetingHostOrAdmin = (sock, meeting) => {
    if (!sock || !meeting) return false;
    const role = sock.data?.role || sock.data?.userRole;
    if (role === "admin" || role === "SUPER_ADMIN" || sock.data?.isMainAdmin) return true;
    const uid = sock.data?.userId;
    if (uid && meeting.hostUserId && String(meeting.hostUserId) === String(uid)) return true;
    return false;
  };

  const canRelayBetweenSockets = (srcSocket, targetSocketId, meetingId) => {
    if (!targetSocketId || !srcSocket) return false;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (!targetSocket) return false;

    const mid = srcSocket.data?.meetingId;
    if (!mid) return false;

    // Both sockets must have the exact matching authorized meetingId
    const targetMid = targetSocket.data?.meetingId;
    if (!targetMid) return false;
    const cleanMid = String(mid).trim().toLowerCase().replace(/-/g, "");
    const cleanTargetMid = String(targetMid).trim().toLowerCase().replace(/-/g, "");
    if (cleanMid !== cleanTargetMid) return false;

    const roomMatches = (s) =>
      s.rooms.has(`meeting_${mid}`) ||
      s.rooms.has(`meeting_${cleanMid}`) ||
      s.rooms.has(`meeting_${String(meetingId || mid).trim().toLowerCase()}`);

    return roomMatches(srcSocket) && roomMatches(targetSocket);
  };

  socket.on("join_meeting", async ({ meetingId, user, mediaState, token, inviteToken }) => {
    if (!meetingId) return;
    const cleanId = String(meetingId).trim().toLowerCase();
    const nonDashed = cleanId.replace(/-/g, "");

    // Authenticate token if not already authenticated
    if (!socket.data?.userId && token) {
      joinUserRoomFromToken(token);
    }

    try {
      let meeting = await Meeting.findOne({
        $or: [{ meetingId: cleanId }, { meetingId: nonDashed }, { invitationCode: cleanId }],
      });

      // 1. Validate that the meeting genuinely exists before allowing a socket to join
      if (!meeting) {
        socket.emit("meeting_error", { message: "Meeting session not found. Please verify the meeting ID or link." });
        return;
      }

      // Authoritative user identity lookup: never trust unverified client credentials
      let targetUid = socket.data?.userId ? String(socket.data.userId) : "";
      let verifiedUser = null;
      if (targetUid) {
        try {
          verifiedUser = await User.findById(targetUid).select("fullName username email role avatar").lean();
        } catch {}
      }

      if (!targetUid) {
        const candidateGuestId = String(user?._id || user?.userId || user?.id || "").trim();
        if (/^guest_[a-zA-Z0-9_-]{4,32}$/.test(candidateGuestId)) {
          targetUid = candidateGuestId;
        } else {
          targetUid = `guest_${socket.id.slice(0, 8)}`;
        }
      }

      const targetName = verifiedUser?.fullName || verifiedUser?.username || user?.fullName || user?.username || "Learner";
      const targetEmail = verifiedUser?.email || user?.email || "";
      const targetRole = verifiedUser?.role || socket.data?.role || "user";

      // 2. Enforce private meeting access authorization
      const isHost =
        Boolean(meeting.hostUserId) &&
        Boolean(socket.data?.userId) &&
        String(meeting.hostUserId) === String(socket.data.userId);

      const isAdmin = Boolean(
        targetRole === "admin" ||
        targetRole === "SUPER_ADMIN" ||
        socket.data?.role === "admin" ||
        socket.data?.role === "SUPER_ADMIN" ||
        socket.data?.isMainAdmin
      );

      const isAdmitted = (meeting.participants || []).some(
        (p) => String(p.userId) === targetUid || (socket.data?.userId && String(p.userId) === String(socket.data.userId))
      );
      const inviteTokenHash = inviteToken
        ? require("crypto").createHash("sha256").update(String(inviteToken)).digest("hex")
        : "";
      const hasValidInvite = Boolean(inviteTokenHash && (meeting.inviteAccessTokens || []).some((entry) =>
        entry.tokenHash === inviteTokenHash && new Date(entry.expiresAt).getTime() > Date.now() &&
        (!targetEmail || String(entry.email).toLowerCase() === String(targetEmail).toLowerCase())
      ));

      if (meeting.isPrivate && !isHost && !isAdmitted && !isAdmin && !hasValidInvite) {
        socket.emit("meeting_error", { message: "Access denied. This is a private meeting." });
        return;
      }

      // If meeting was ended and creator re-joins, reactivate it
      if (meeting.status === "ended") {
        if (targetUid && String(meeting.hostUserId) === targetUid) {
          meeting.status = "active";
          meeting.endedAt = null;
          await meeting.save();

      // Log genuine meeting activity for Admin Live Telemetry
      logActivityAndBroadcast({
        userId: targetUid,
        userEmail: targetEmail,
        userName: targetName,
        type: "MEETING_JOINED",
        title: "Joined Meeting Session",
        detail: `${targetName} joined meeting "${meeting.title || canonicalId}"`,
        category: "meeting",
        severity: "info",
        device: "Desktop / WebRTC",
        io,
      }).catch(() => {});
        } else {
          socket.emit("meeting_error", { message: "This meeting session has ended." });
          return;
        }
      }

      const canonicalId = meeting ? meeting.meetingId : cleanId;

      // If socket is currently registered in a different meeting room, cleanly depart first
      if (socket.data?.meetingId && socket.data.meetingId !== canonicalId) {
        try {
          await handleUserLeavingMeeting(socket);
        } catch (e) {
          console.warn("Error cleaning up previous meeting state on switch:", e.message);
        }
        for (const roomName of Array.from(socket.rooms)) {
          if (roomName.startsWith("meeting_")) {
            socket.leave(roomName);
          }
        }
      }

      const roomName = `meeting_${canonicalId}`;
      socket.join(roomName);
      if (cleanId !== canonicalId) socket.join(`meeting_${cleanId}`);
      if (nonDashed !== canonicalId) socket.join(`meeting_${nonDashed}`);

      socket.data.meetingId = canonicalId;
      socket.data.meetingUser = {
        _id: targetUid,
        userId: targetUid,
        fullName: targetName,
        username: verifiedUser?.username || user?.username || "learner",
        email: targetEmail,
        role: targetRole,
        isHost,
      };

      const roomSockets = io.sockets.adapter.rooms.get(roomName) || new Set();

      // Clean up stale or disconnected participants from this meeting record
      // And mark any previous participant records for this user as left so a user never has multiple active tiles
      meeting.participants.forEach((p) => {
        if (!p.leftAt) {
          const isSameUser =
            (targetUid && String(p.userId) === targetUid) ||
            (!p.socketId && targetUid && String(p.userId) === targetUid) ||
            (targetName && targetName !== "Learner" && p.fullName === targetName);
          const isSameSocket = p.socketId === socket.id;
          const isStaleSocket = p.socketId && !roomSockets.has(p.socketId);

          if (isStaleSocket || (!isSameSocket && isSameUser) || (!p.socketId && isSameUser)) {
            p.leftAt = new Date();
          }
        }
      });

      // Find existing record by socketId, or active matching user
      const existingIdx = meeting.participants.findIndex(
        (p) =>
          p.socketId === socket.id ||
          (targetUid && String(p.userId) === targetUid && !p.leftAt) ||
          (!p.leftAt && targetName !== "Learner" && p.fullName === targetName)
      );

      const pData = {
        userId: targetUid || String(socket.id),
        socketId: socket.id,
        fullName: targetName,
        username: user?.username || "learner",
        email: user?.email || "",
        avatarUrl: user?.avatarUrl || "",
        role: isHost ? "host" : "participant",
        isMuted: mediaState?.isMuted ?? false,
        isVideoOff: mediaState?.isVideoOff ?? false,
        isScreenSharing: mediaState?.isScreenSharing ?? false,
        isHandRaised: mediaState?.isHandRaised ?? false,
        joinedAt: new Date(),
        leftAt: null,
      };

      if (existingIdx >= 0) {
        meeting.participants[existingIdx] = {
          ...meeting.participants[existingIdx].toObject(),
          ...pData,
        };
      } else {
        meeting.participants.push(pData);
      }
      await meeting.save();

      // Log genuine meeting activity for Admin Live Telemetry
      logActivityAndBroadcast({
        userId: targetUid,
        userEmail: targetEmail,
        userName: targetName,
        type: "MEETING_JOINED",
        title: "Joined Meeting Session",
        detail: `${targetName} joined meeting "${meeting.title || canonicalId}"`,
        category: "meeting",
        severity: "info",
        device: "Desktop / WebRTC",
        io,
      }).catch(() => {});

      const liveSockets = io.sockets.adapter.rooms.get(roomName) || new Set();
      liveSockets.add(socket.id);

      // Return strictly unique active participants (deduplicated by userId and fullName)
      const seenRoster = new Set();
      const activeParticipants = [];
      for (let i = meeting.participants.length - 1; i >= 0; i--) {
        const p = meeting.participants[i];
        if (p.leftAt || !p.socketId || !liveSockets.has(p.socketId)) continue;
        const uKey = String(p.userId || p.socketId);
        const nameKey = (p.fullName || "").trim().toLowerCase();
        if (seenRoster.has(uKey) || (nameKey && nameKey !== "learner" && seenRoster.has(nameKey))) continue;
        seenRoster.add(uKey);
        if (nameKey && nameKey !== "learner") seenRoster.add(nameKey);
        activeParticipants.unshift(p);
      }

      socket.emit("meeting_joined_success", {
        meetingId: canonicalId,
        title: meeting.title,
        groupTitle: meeting.groupTitle,
        hostUserId: meeting.hostUserId,
        hostName: meeting.hostName,
        isHost,
        meeting: {
          meetingId: canonicalId,
          title: meeting.title,
          groupTitle: meeting.groupTitle,
          hostUserId: meeting.hostUserId,
          hostName: meeting.hostName,
          status: meeting.status,
          messages: meeting.messages || [],
          whiteboardData: meeting.whiteboardData || "[]",
          isHost,
        },
        sharedCode: meeting.sharedCode,
        codingPermission: meeting.codingPermission || "collaborative",
        workspaceFiles: meeting.workspaceFiles || [],
        activeFileId: meeting.activeFileId || "file_0",
        testCases: meeting.testCases || [],
        codeReviews: meeting.codeReviews || [],
        whiteboardData: meeting.whiteboardData || "[]",
        sharedTasks: meeting.sharedTasks || [],
        notes: meeting.notes,
        messages: meeting.messages || [],
        participants: activeParticipants,
        socketId: socket.id,
      });

      // Notify other peers in this room that a peer joined
      socket.to(roomName).emit("meeting_peer_joined", {
        socketId: socket.id,
        user: pData,
      });

      // Broadcast updated participant roster
      io.to(roomName).emit("meeting_participants_updated", activeParticipants);
    } catch (err) {
      console.error("join_meeting error:", err);
      socket.emit("meeting_error", { message: err.message });
    }
  });

  // WebRTC mesh signaling relays (Offer, Answer, ICE Candidate) - Strictly Authorized & Isolated to Same Room
  socket.on("webrtc_offer", ({ targetSocketId, toSocketId, offer, meetingId }) => {
    const target = targetSocketId || toSocketId;
    if (!target || !offer) return;
    const mid = meetingId || socket.data.meetingId;
    if (!canRelayBetweenSockets(socket, target, mid)) return;
    io.to(target).emit("webrtc_offer_received", {
      fromSocketId: socket.id,
      user: socket.data.meetingUser,
      offer,
      meetingId: mid,
    });
  });

  socket.on("webrtc_answer", ({ targetSocketId, toSocketId, answer, meetingId }) => {
    const target = targetSocketId || toSocketId;
    if (!target || !answer) return;
    const mid = meetingId || socket.data.meetingId;
    if (!canRelayBetweenSockets(socket, target, mid)) return;
    io.to(target).emit("webrtc_answer_received", {
      fromSocketId: socket.id,
      user: socket.data.meetingUser,
      answer,
      meetingId: mid,
    });
  });

  socket.on("webrtc_ice_candidate", ({ targetSocketId, toSocketId, candidate, meetingId }) => {
    const target = targetSocketId || toSocketId;
    if (!target || !candidate) return;
    const mid = meetingId || socket.data.meetingId;
    if (!canRelayBetweenSockets(socket, target, mid)) return;
    io.to(target).emit("webrtc_ice_candidate_received", {
      fromSocketId: socket.id,
      candidate,
      meetingId: mid,
    });
  });

  socket.on("webrtc_signal", ({ toSocketId, targetSocketId, signal, type, meetingId }) => {
    const target = toSocketId || targetSocketId;
    if (!target) return;
    const mid = meetingId || socket.data.meetingId;
    if (!canRelayBetweenSockets(socket, target, mid)) return;
    io.to(target).emit("webrtc_signal", {
      fromSocketId: socket.id,
      user: socket.data.meetingUser,
      signal,
      type,
      meetingId: mid,
    });
  });

  // Media toggle (mic, camera, screenshare, raise-hand)
  socket.on("meeting_media_toggle", async ({ meetingId, mediaState }) => {
    const mid = socket.data.meetingId || meetingId;
    if (!mid || !isAuthorizedMeetingMember(socket, mid)) return;
    const roomName = `meeting_${mid}`;
    socket.to(roomName).emit("meeting_peer_media_changed", {
      socketId: socket.id,
      mediaState,
    });

    if (activeUserSessions.has(socket.id)) {
      const sess = activeUserSessions.get(socket.id);
      sess.mediaState = {
        ...(sess.mediaState || {}),
        ...mediaState,
      };
      io.to("super_admin_room").emit("live_session_update", sess);
    }

    try {
      const updateFields = {};
      if (mediaState.isMuted !== undefined) updateFields["participants.$.isMuted"] = mediaState.isMuted;
      if (mediaState.isVideoOff !== undefined) updateFields["participants.$.isVideoOff"] = mediaState.isVideoOff;
      if (mediaState.isScreenSharing !== undefined) updateFields["participants.$.isScreenSharing"] = mediaState.isScreenSharing;
      if (mediaState.isHandRaised !== undefined) updateFields["participants.$.isHandRaised"] = mediaState.isHandRaised;

      if (Object.keys(updateFields).length > 0) {
        await Meeting.updateOne(
          { meetingId: mid, "participants.socketId": socket.id },
          { $set: updateFields }
        );
      }
    } catch (err) {}
  });

  // Reactions (emojis floating on peer screens)
  socket.on("meeting_reaction", ({ meetingId, emoji, user }) => {
    const mid = socket.data.meetingId;
    if (!mid || !isAuthorizedMeetingMember(socket, meetingId || mid)) return;
    const reactionPayload = {
      id: Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      emoji: emoji || "👏",
      user: socket.data.meetingUser || { fullName: "A learner" },
      timestamp: new Date().toISOString(),
    };
    io.to(`meeting_${mid}`).emit("meeting_reaction_received", reactionPayload);
  });

  // Live Chat messages
  socket.on("meeting_chat_message", async ({ meetingId, text, user }) => {
    const mid = socket.data.meetingId;
    if (!mid || !text || !isAuthorizedMeetingMember(socket, meetingId || mid)) return;
    const u = socket.data.meetingUser || {};
    const msgObj = {
      id: Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      senderId: String(socket.data.userId || socket.id),
      senderName: u.fullName || u.username || user?.fullName || "Learner",
      senderAvatar: u.avatarUrl || user?.avatarUrl || "",
      text,
      timeString: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: new Date(),
    };

    io.to(`meeting_${mid}`).emit("meeting_chat_message_received", msgObj);

    try {
      await Meeting.updateOne({ meetingId: mid }, { $push: { messages: msgObj } });
    } catch (err) {}
  });

  // Collaborative Shared Code Sync
  socket.on("meeting_code_change", async ({ meetingId, code, language, user, cursor }) => {
    const mid = socket.data.meetingId;
    if (!mid || !isAuthorizedMeetingMember(socket, meetingId || mid)) return;

    try {
      const meeting = await Meeting.findOne({ meetingId: mid }).select("codingPermission hostUserId").lean();
      if (meeting && (meeting.codingPermission === "host-only" || meeting.codingPermission === "read-only") && !isMeetingHostOrAdmin(socket, meeting)) {
        socket.emit("meeting_error", { message: "Only the host can modify code in this workspace." });
        return;
      }

      const u = socket.data.meetingUser || {};
      socket.to(`meeting_${mid}`).emit("meeting_code_updated", {
        code,
        language,
        user: u,
        cursor,
        fromSocketId: socket.id,
      });

      const updateDoc = {};
      if (code !== undefined) updateDoc["sharedCode.code"] = code;
      if (language !== undefined) updateDoc["sharedCode.language"] = language;
      updateDoc["sharedCode.lastModifiedBy"] = u.fullName || "Collaborator";
      updateDoc["sharedCode.lastUpdatedAt"] = new Date();
      await Meeting.updateOne({ meetingId: mid }, { $set: updateDoc });
    } catch (err) {}
  });

  // Collaborative Multi-File Operations
  socket.on("meeting_file_select", ({ meetingId, fileId, user }) => {
    const mid = socket.data.meetingId;
    if (!mid || !isAuthorizedMeetingMember(socket, meetingId || mid)) return;
    socket.to(`meeting_${mid}`).emit("meeting_file_selected", { fileId, user: socket.data.meetingUser, fromSocketId: socket.id });
    Meeting.updateOne({ meetingId: mid }, { $set: { activeFileId: fileId } }).catch(() => {});
  });

  socket.on("meeting_file_update", async ({ meetingId, fileId, name, content, language, user }) => {
    const mid = socket.data.meetingId;
    if (!mid || !isAuthorizedMeetingMember(socket, meetingId || mid)) return;

    try {
      const meeting = await Meeting.findOne({ meetingId: mid }).select("codingPermission hostUserId").lean();
      if (meeting && (meeting.codingPermission === "host-only" || meeting.codingPermission === "read-only") && !isMeetingHostOrAdmin(socket, meeting)) {
        socket.emit("meeting_error", { message: "Only the host can modify files in this workspace." });
        return;
      }

      socket.to(`meeting_${mid}`).emit("meeting_file_updated", {
        fileId,
        name,
        content,
        language,
        user: socket.data.meetingUser,
        fromSocketId: socket.id,
      });

      await Meeting.updateOne(
        { meetingId: mid, "workspaceFiles.id": fileId },
        {
          $set: {
            "workspaceFiles.$.content": content,
            "workspaceFiles.$.name": name,
            "workspaceFiles.$.language": language,
            "workspaceFiles.$.lastModifiedBy": socket.data.meetingUser?.fullName || "Collaborator",
          },
        }
      );
    } catch {}
  });

  socket.on("meeting_file_create", async ({ meetingId, file, user }) => {
    const mid = socket.data.meetingId;
    if (!mid || !file || !isAuthorizedMeetingMember(socket, meetingId || mid)) return;

    try {
      const meeting = await Meeting.findOne({ meetingId: mid }).select("codingPermission hostUserId").lean();
      if (meeting && (meeting.codingPermission === "host-only" || meeting.codingPermission === "read-only") && !isMeetingHostOrAdmin(socket, meeting)) {
        socket.emit("meeting_error", { message: "Only the host can create files in this workspace." });
        return;
      }

      io.to(`meeting_${mid}`).emit("meeting_file_created", { file, user: socket.data.meetingUser });
      await Meeting.updateOne({ meetingId: mid }, { $push: { workspaceFiles: file } });
    } catch {}
  });

  socket.on("meeting_file_delete", async ({ meetingId, fileId, user }) => {
    const mid = socket.data.meetingId;
    if (!mid || !fileId || !isAuthorizedMeetingMember(socket, meetingId || mid)) return;

    try {
      const meeting = await Meeting.findOne({ meetingId: mid }).select("codingPermission hostUserId").lean();
      if (meeting && (meeting.codingPermission === "host-only" || meeting.codingPermission === "read-only") && !isMeetingHostOrAdmin(socket, meeting)) {
        socket.emit("meeting_error", { message: "Only the host can delete files in this workspace." });
        return;
      }

      io.to(`meeting_${mid}`).emit("meeting_file_deleted", { fileId, user: socket.data.meetingUser });
      await Meeting.updateOne({ meetingId: mid }, { $pull: { workspaceFiles: { id: fileId } } });
    } catch {}
  });

  // Live Peer Cursors & Typing Telemetry
  socket.on("meeting_cursor_move", ({ meetingId, fileId, cursor, user }) => {
    if (!meetingId || !isAuthorizedMeetingMember(socket, meetingId)) return;
    socket.to(`meeting_${meetingId}`).emit("meeting_peer_cursor", {
      socketId: socket.id,
      fileId,
      cursor,
      user,
    });
  });

  socket.on("meeting_typing_status", ({ meetingId, user, isTyping, fileId }) => {
    if (!meetingId || !isAuthorizedMeetingMember(socket, meetingId)) return;
    socket.to(`meeting_${meetingId}`).emit("meeting_typing_status", {
      socketId: socket.id,
      user,
      isTyping,
      fileId,
    });
  });

  // Workspace Permissions (collaborative | host-only | read-only) - Host or Admin only
  socket.on("meeting_permission_change", async ({ meetingId, permission, user }) => {
    if (!meetingId || !isAuthorizedMeetingMember(socket, meetingId)) return;
    const meeting = await Meeting.findOne({ meetingId }).select("hostUserId").lean();
    if (!meeting || !isMeetingHostOrAdmin(socket, meeting)) {
      socket.emit("meeting_error", { message: "Only the host can modify workspace permissions." });
      return;
    }
    io.to(`meeting_${meetingId}`).emit("meeting_permission_changed", { permission, user });
    try {
      await Meeting.updateOne({ meetingId }, { $set: { codingPermission: permission } });
    } catch {}
  });

  // Collaborative Whiteboard
  socket.on("meeting_whiteboard_stroke", async ({ meetingId, stroke, clearAll, allStrokes }) => {
    if (!meetingId || !isAuthorizedMeetingMember(socket, meetingId)) return;
    socket.to(`meeting_${meetingId}`).emit("meeting_whiteboard_updated", { stroke, clearAll });
    if (allStrokes !== undefined) {
      try {
        await Meeting.updateOne({ meetingId }, { $set: { whiteboardData: JSON.stringify(allStrokes) } });
      } catch {}
    }
  });

  // Code Reviews & Inline Discussions
  socket.on("meeting_code_review_add", async ({ meetingId, review }) => {
    if (!meetingId || !review || !isAuthorizedMeetingMember(socket, meetingId)) return;
    io.to(`meeting_${meetingId}`).emit("meeting_code_review_added", { review });
    try {
      await Meeting.updateOne({ meetingId }, { $push: { codeReviews: review } });
    } catch {}
  });

  socket.on("meeting_code_review_toggle", async ({ meetingId, reviewId, status }) => {
    if (!meetingId || !reviewId || !isAuthorizedMeetingMember(socket, meetingId)) return;
    io.to(`meeting_${meetingId}`).emit("meeting_code_review_toggled", { reviewId, status });
    try {
      await Meeting.updateOne(
        { meetingId, "codeReviews.id": reviewId },
        { $set: { "codeReviews.$.status": status } }
      );
    } catch {}
  });

  // Collaborative Tasks
  socket.on("meeting_task_toggle", async ({ meetingId, taskId, completed }) => {
    if (!meetingId || !taskId || !isAuthorizedMeetingMember(socket, meetingId)) return;
    io.to(`meeting_${meetingId}`).emit("meeting_task_toggled", { taskId, completed });
    try {
      await Meeting.updateOne(
        { meetingId, "sharedTasks.id": taskId },
        { $set: { "sharedTasks.$.completed": completed } }
      );
    } catch {}
  });

  socket.on("meeting_task_create", async ({ meetingId, task }) => {
    if (!meetingId || !task || !isAuthorizedMeetingMember(socket, meetingId)) return;
    io.to(`meeting_${meetingId}`).emit("meeting_task_created", { task });
    try {
      await Meeting.updateOne({ meetingId }, { $push: { sharedTasks: task } });
    } catch {}
  });

  // Collaborative Notes Sync
  socket.on("meeting_notes_change", async ({ meetingId, notes, user }) => {
    if (!meetingId || !isAuthorizedMeetingMember(socket, meetingId)) return;
    socket.to(`meeting_${meetingId}`).emit("meeting_notes_updated", {
      notes,
      user,
      fromSocketId: socket.id,
    });

    try {
      await Meeting.updateOne(
        { meetingId },
        {
          $set: {
            "notes.content": notes,
            "notes.lastModifiedBy": user?.fullName || "Collaborator",
            "notes.lastUpdatedAt": new Date(),
          },
        }
      );
    } catch (err) {}
  });

  // Shared Code Execution Broadcast
  socket.on("meeting_code_run_status", ({ meetingId, status, user, result }) => {
    if (!meetingId || !isAuthorizedMeetingMember(socket, meetingId)) return;
    io.to(`meeting_${meetingId}`).emit("meeting_code_run_status", {
      status,
      user,
      result,
      timestamp: new Date().toISOString(),
    });
  });

  // Host Controls (mute / kick / end) - Authorized strictly to verified Meeting Host or Admin
  socket.on("meeting_host_action", async ({ meetingId, action, targetSocketId }) => {
    if (!meetingId) return;
    try {
      const meeting = await Meeting.findOne({ meetingId }).select("hostUserId hostName").lean();
      if (!meeting) return;

      const isHost = isMeetingHostOrAdmin(socket, meeting);

      if (!isHost) {
        console.warn(`🚨 Unauthorized socket ${socket.id} attempted host action ${action} on meeting ${meetingId}`);
        socket.emit("meeting_error", { message: "Only the meeting host can perform this action." });
        return;
      }

      if (action === "end_meeting") {
        io.to(`meeting_${meetingId}`).emit("meeting_ended_by_host");
        await Meeting.updateOne(
          { meetingId },
          { $set: { status: "ended", endedAt: new Date() } }
        );
      } else if (action === "mute_user" && targetSocketId) {
        const roomSockets = io.sockets.adapter.rooms.get(`meeting_${meetingId}`);
        if (roomSockets && roomSockets.has(targetSocketId)) {
          io.to(targetSocketId).emit("meeting_host_muted_you");
        }
      } else if (action === "kick_user" && targetSocketId) {
        const roomSockets = io.sockets.adapter.rooms.get(`meeting_${meetingId}`);
        if (roomSockets && roomSockets.has(targetSocketId)) {
          io.to(targetSocketId).emit("meeting_host_kicked_you");
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            targetSocket.leave(`meeting_${meetingId}`);
          }
        }
      }
    } catch (hostErr) {
      console.error("meeting_host_action error:", hostErr);
    }
  });

  // Meeting Recording Telemetry (Host controls, Peer indicator) - Authorized strictly to Host or Admin
  socket.on("meeting_recording_status", async ({ meetingId, isRecording, isPaused, recordingStartedAt, hostName }) => {
    const mid = meetingId || socket.data.meetingId;
    if (!mid || !isAuthorizedMeetingMember(socket, mid)) return;
    const meeting = await Meeting.findOne({
      $or: [{ meetingId: mid }, { invitationCode: mid }],
    }).select("hostUserId").lean();
    if (!meeting || !isMeetingHostOrAdmin(socket, meeting)) {
      socket.emit("meeting_error", { message: "Only the meeting host can modify recording status." });
      return;
    }
    io.to(`meeting_${mid}`).emit("meeting_recording_status", {
      isRecording,
      isPaused,
      recordingStartedAt,
      hostName,
    });
  });

  // Participant Permissions (screen share, code editing, chat) - Host or Admin only
  socket.on("meeting_settings_update", async ({ meetingId, settings, user }) => {
    if (!meetingId || !isAuthorizedMeetingMember(socket, meetingId)) return;
    const meeting = await Meeting.findOne({ meetingId }).select("hostUserId").lean();
    if (!meeting || !isMeetingHostOrAdmin(socket, meeting)) {
      socket.emit("meeting_error", { message: "Only the host can modify meeting settings." });
      return;
    }
    io.to(`meeting_${meetingId}`).emit("meeting_settings_updated", {
      settings,
      user,
    });
  });

  // Collaborative Problem-Solving Mode Toggle - Host or Admin only, strictly authorized to meeting room
  socket.on("meeting_challenge_mode_toggle", async ({ meetingId, mode, user }) => {
    if (!meetingId || !isAuthorizedMeetingMember(socket, meetingId)) return;
    const meeting = await Meeting.findOne({ meetingId }).select("hostUserId").lean();
    if (!meeting || !isMeetingHostOrAdmin(socket, meeting)) {
      socket.emit("meeting_error", { message: "Only the host can toggle challenge mode." });
      return;
    }
    io.to(`meeting_${meetingId}`).emit("meeting_challenge_mode_toggled", { mode, user });
  });

  // Collaborative Solution Grading Broadcast - Authorized room members only
  socket.on("meeting_solution_submit", async ({ meetingId, result, user }) => {
    if (!meetingId || !isAuthorizedMeetingMember(socket, meetingId)) return;
    io.to(`meeting_${meetingId}`).emit("meeting_solution_submitted", {
      result,
      user,
      timestamp: new Date().toISOString(),
    });
  });

  // Voluntary leave
  socket.on("leave_meeting", () => {
    handleUserLeavingMeeting(socket);

    // Clean up active session for Super Admin live activity
    if (activeUserSessions.has(socket.id)) {
      const sess = activeUserSessions.get(socket.id);
      activeUserSessions.delete(socket.id);
      io.to("super_admin_room").emit("live_session_ended", { socketId: socket.id, userId: sess?.userId });
    }
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", socket.id);
    onlineUsers.delete(socket.id);
    codingChatLimitMap.delete(socket.id);
    codingEditLimitMap.delete(socket.id);
    broadcastOnlineUsers();

    handleUserLeavingMeeting(socket);

    // Clean up active session for Super Admin live activity
    if (activeUserSessions.has(socket.id)) {
      const sess = activeUserSessions.get(socket.id);
      activeUserSessions.delete(socket.id);
      io.to("super_admin_room").emit("live_session_ended", { socketId: socket.id, userId: sess?.userId });
    }

    // Clean up coding rooms
    for (const [roomId, room] of codingRooms.entries()) {
      if (room.participants.has(socket.id)) {
        const participant = room.participants.get(socket.id);
        room.participants.delete(socket.id);
        const roomKey = `coding_room_${roomId}`;
        io.to(roomKey).emit("coding_room_participants", Array.from(room.participants.values()));
        if (participant) {
          io.to(roomKey).emit("coding_system_msg", {
            text: `${participant.user?.fullName || "A developer"} disconnected`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
        if (room.participants.size === 0) {
          codingRooms.delete(roomId);
        }
      }
    }
  });
});

// CORS - explicitly restricted to trusted origins with credentials
app.use(cors(corsOptions));

// High-performance gzip/deflate response compression for ultra-fast page loading and API responsiveness
const compression = require("compression");
app.use(compression({
  threshold: 1024, // only compress responses above 1KB
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    // Don't compress already compressed media streams
    if (req.path.startsWith("/recordings/") && (req.path.endsWith(".webm") || req.path.endsWith(".mp4"))) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Comprehensive API and static route latency diagnostics with stage breakdown (auth, db, serialize, total)
// Logs slow requests (>=1000ms) with sanitized timing diagnostics and attaches W3C Server-Timing header.
app.use(timingDiagnosticsMiddleware);

const { initPoolMonitoring, getPoolStatus } = require("./config/dbPoolMonitor");

// Cheap process-liveness endpoint for Render health checks. Keep this independent of
// MongoDB so a transient database slowdown does not make the web process look dead.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptimeSeconds: Math.floor(process.uptime()) });
});

// Dedicated connection pool and database diagnostics endpoint
app.get(["/health/db", "/api/health/db", "/api/admin/db-pool-status"], (_req, res) => {
  const status = getPoolStatus(mongoose.connection);
  const isHealthy = status.readyState === 1;
  res.status(isHealthy ? 200 : 503).json({
    connectionState: status.status,
    ...status,
    status: isHealthy ? "healthy" : "degraded",
  });
});

// In-memory cache for SPA index.html to avoid disk I/O and threadpool saturation on every request
const indexPath = path.join(__dirname, '../client/dist/index.html');
let cachedIndexHtml = null;
let cachedIndexEtag = null;
let cachedIndexMtime = null;

function getCachedIndexHtml() {
  try {
    if (fs.existsSync(indexPath)) {
      const stat = fs.statSync(indexPath);
      if (!cachedIndexHtml || cachedIndexMtime !== stat.mtimeMs) {
        cachedIndexHtml = fs.readFileSync(indexPath, 'utf8');
        cachedIndexMtime = stat.mtimeMs;
        const hash = crypto.createHash('md5').update(cachedIndexHtml).digest('hex').slice(0, 16);
        cachedIndexEtag = `W/"index-${hash}"`;
      }
    }
  } catch {}
  return { html: cachedIndexHtml, etag: cachedIndexEtag };
}

function serveSpaIndex(req, res) {
  const { html, etag } = getCachedIndexHtml();
  if (html) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    if (etag) {
      res.setHeader('ETag', etag);
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
    }
    return res.type('html').send(html);
  }
  return res.status(200).send('Mastery Zone Academy of Computer Science');
}

// Serve root SPA entrypoint immediately from memory before body parsers and API routers (0 DB queries, <0.5ms)
app.get(['/', '/index.html'], serveSpaIndex);

// Standard JSON and URL-encoded body limit (video recording uploads use streaming multipart/binary directly)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser()); // Use cookie parser
const csrfProtection = require('./middleware/csrfProtection');
app.use(csrfProtection);
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin/support', supportRoutes);

// Legacy recording URLs (/recordings/<file>) — served by the same unified playback engine as /api/recordings/stream
app.use("/recordings", (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const requested = path.basename(req.path || "");
  // "/recordings" itself is a client-side (SPA) page — only file requests are media.
  if (!requested || !path.extname(requested)) return next();
  const { handleRecordingRequest } = require("./utils/recordingStream");
  return handleRecordingRequest(req, res, requested);
});

// Authorized Certificate Asset Serving (Strict Owner & Admin Verification)
app.use('/certificates', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.split(' ')[1]) ||
                req.query.token ||
                req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Authentication required to access certificate archives" });
  }

  let decoded;
  try {
    decoded = getCachedDecodedToken(token) || jwt.verify(token, getJwtSecret());
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const currentUserId = String(decoded.userId || decoded.id || decoded._id || "");
  const isAdmin = Boolean(decoded.role === "admin" || decoded.role === "SUPER_ADMIN" || decoded.isMainAdmin);

  const safeFilename = path.basename(req.path);
  const certId = safeFilename.replace(/\.pdf$/i, "");
  const IssuedCertificate = require("./models/IssuedCertificate");
  const cert = await IssuedCertificate.findOne({
    $or: [{ certificateId: certId }, { attemptId: certId }],
  }).lean();

  if (cert && !isAdmin && String(cert.userId) !== currentUserId) {
    return res.status(403).json({ message: "Forbidden: You do not own this certificate" });
  } else if (!cert && !isAdmin) {
    return res.status(404).json({ message: "Certificate record not found" });
  }

  const safePath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(__dirname, 'uploads/certificates', safePath);
  if (!fullPath.startsWith(path.join(__dirname, 'uploads/certificates'))) {
    return res.status(403).json({ message: "Directory traversal forbidden" });
  }
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ message: "Certificate file not found" });
  }
  return res.sendFile(fullPath);
});

// Strictly Protected Proctoring Evidence (Candidate Owner & Admin Only)
app.use('/proctoring-evidence', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.split(' ')[1]) ||
                req.query.token ||
                req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Authentication required to access proctoring evidence" });
  }

  let decoded;
  try {
    decoded = getCachedDecodedToken(token) || jwt.verify(token, getJwtSecret());
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const currentUserId = String(decoded.userId || decoded.id || decoded._id || "");
  const isAdmin = Boolean(decoded.role === "admin" || decoded.role === "SUPER_ADMIN" || decoded.isMainAdmin);

  const safeFilename = path.basename(req.path);
  const filePath = path.join(__dirname, 'uploads/evidence', safeFilename);

  if (!isAdmin) {
    const CertificationAttempt = require("./models/CertificationAttempt");
    const matchedAttempt = await CertificationAttempt.findOne({
      $or: [
        { "proctoring.snapshots": { $regex: safeFilename } },
        { "proctoring.candidatePhoto": { $regex: safeFilename } },
        { attemptId: { $regex: safeFilename.split("_")[0] || "" } },
      ],
      userId: currentUserId,
    }).lean();

    if (!matchedAttempt) {
      return res.status(403).json({ message: "Forbidden: You do not own this proctoring evidence" });
    }
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Evidence snapshot not found" });
  }

  return res.sendFile(filePath);
});

// Forward legacy /uploads/support_attachments to authorized /api/support/attachments endpoint
app.use('/uploads/support_attachments/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const tokenQuery = req.query.token ? `?token=${encodeURIComponent(req.query.token)}` : '';
  return res.redirect(`/api/support/attachments/${safeFilename}${tokenQuery}`);
});

// Generic Uploads: Prevent Direct Access to Evidence/Recordings/Certificates/Support subdirectories
app.use('/uploads', (req, res, next) => {
  const norm = path.normalize(req.path);
  if (
    norm.startsWith('/evidence') ||
    norm.startsWith('/recordings') ||
    norm.startsWith('/certificates') ||
    norm.startsWith('/support_attachments')
  ) {
    return res.status(403).json({ message: "Access forbidden. Use dedicated authorized endpoints." });
  }
  return res.status(403).json({ message: "Direct public upload access forbidden." });
});
app.use("/api", router);

const PRIMARY_MONGO_URI = process.env.MONGODB_URI || process.env.db_url;

function parseMongoUri(uriStr) {
  if (!uriStr || typeof uriStr !== "string") return null;
  try {
    const normalized = uriStr.replace(/^mongodb(\+srv)?:\/\//i, "http://");
    const parsed = new URL(normalized);
    let host = (parsed.hostname || "").toLowerCase();
    if (host === "localhost") host = "127.0.0.1";
    const port = parsed.port || "27017";
    let pathname = (parsed.pathname || "").replace(/^\//, "").split("?")[0].trim().toLowerCase();
    return { host, port, dbName: pathname };
  } catch {
    return null;
  }
}

function isSameOrProductionDatabase(testUri, prodUri) {
  if (!testUri) return false;
  const testParsed = parseMongoUri(testUri);
  if (!testParsed) return false;

  const testDb = testParsed.dbName;
  if (
    testDb === "masteryzone" ||
    testDb === "production" ||
    testDb === "prod" ||
    testDb.endsWith("_prod") ||
    testDb.endsWith("-prod")
  ) {
    return true;
  }

  if (!prodUri) return false;
  if (testUri.trim() === prodUri.trim()) return true;

  const prodParsed = parseMongoUri(prodUri);
  if (!prodParsed) return false;

  if (testParsed.host === prodParsed.host && testParsed.dbName === prodParsed.dbName) {
    return true;
  }

  return false;
}

function getMongoConnectionOptions(overrides = {}) {
  const maxPoolSize = Math.max(10, parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) || 50);
  const minPoolSize = Math.max(1, parseInt(process.env.MONGO_MIN_POOL_SIZE, 10) || 15);
  const waitQueueTimeoutMS = Math.max(5000, parseInt(process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS, 10) || 20000);
  const serverSelectionTimeoutMS = Math.max(3000, parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10) || 15000);
  const connectTimeoutMS = 30000;
  const socketTimeoutMS = 45000;
  const maxIdleTimeMS = 60000;

  return {
    maxPoolSize,
    minPoolSize,
    waitQueueTimeoutMS,
    serverSelectionTimeoutMS,
    connectTimeoutMS,
    socketTimeoutMS,
    maxIdleTimeMS,
    ...overrides,
  };
}

async function connectDB() {
  if (process.env.NODE_ENV === "test") {
    const testUri = process.env.TEST_MONGODB_URI;
    if (!testUri) {
      console.error("FATAL: TEST_MONGODB_URI is required to run in test mode safely.");
      throw new Error("TEST_MONGODB_URI required for test mode");
    }
    if (isSameOrProductionDatabase(testUri, PRIMARY_MONGO_URI)) {
      console.error("FATAL: TEST_MONGODB_URI cannot point to the production/development database or alias.");
      throw new Error("TEST_MONGODB_URI points to production database");
    }
    try {
      const testOpts = getMongoConnectionOptions({ serverSelectionTimeoutMS: 5000, minPoolSize: 2 });
      initPoolMonitoring(mongoose.connection, testOpts);
      await mongoose.connect(testUri, testOpts);
      console.log("✅ MongoDB Connected to Isolated Test Database");
      await bootstrapSuperAdmin();
    } catch (err) {
      console.error("🔌 Test MongoDB connection failed:", err.message);
      throw err;
    }
    return;
  }

  if (!PRIMARY_MONGO_URI) {
    if (process.env.NODE_ENV === "production") {
      console.error("FATAL: MONGODB_URI or db_url environment variable is missing in production.");
      process.exit(1);
    }
    console.warn("⚠️ No MONGODB_URI configured. Falling back to local MongoDB for development.");
  }

  const mongoUri = PRIMARY_MONGO_URI || "mongodb://127.0.0.1:27017/masteryzone";
  const poolOpts = getMongoConnectionOptions();
  initPoolMonitoring(mongoose.connection, poolOpts);

  try {
    await mongoose.connect(mongoUri, poolOpts);
    console.log(`✅ MongoDB Connected Successfully [Pool: min=${poolOpts.minPoolSize}, max=${poolOpts.maxPoolSize}, waitQueueTimeout=${poolOpts.waitQueueTimeoutMS}ms]`);
    await bootstrapSuperAdmin();
    // Asynchronously trigger background cloud recording self-healing and GridFS sync
    try {
      const { syncRecordingsToGridFS } = require("./utils/recordingSync");
      syncRecordingsToGridFS().catch((sErr) => console.warn("[RecordingSync] Background sync note:", sErr.message));
    } catch {}
    // Idempotent ActivityLog backfill for Admin Live Activity monitoring
    try {
      const { backfillHistoricalActivities } = require("./utils/activityBackfill");
      backfillHistoricalActivities().catch((bErr) => console.warn("[ActivityBackfill] Note:", bErr.message));
    } catch {}
  } catch (err) {
    console.error("🔌 MongoDB connection failed:", err.message);
    if (process.env.NODE_ENV !== "production" && mongoUri !== "mongodb://127.0.0.1:27017/masteryzone") {
      console.log("🔄 Retrying with local MongoDB fallback (mongodb://127.0.0.1:27017/masteryzone)...");
      try {
        await mongoose.disconnect();
      } catch {}
      try {
        const localOpts = getMongoConnectionOptions({ serverSelectionTimeoutMS: 3000, minPoolSize: 2 });
        initPoolMonitoring(mongoose.connection, localOpts);
        await mongoose.connect("mongodb://127.0.0.1:27017/masteryzone", localOpts);
        console.log("✅ MongoDB Connected Successfully (Local Fallback)");
        await bootstrapSuperAdmin();
      } catch (localErr) {
        console.error("🔌 Local MongoDB connection also failed:", localErr.message);
        throw localErr;
      }
    } else {
      throw err;
    }
  }
}
const databaseReady = connectDB();



// Serve static frontend files with proper cache policies
app.use(express.static(path.join(__dirname, '../client/dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    } else if (filePath.includes('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// If an asset chunk is requested that no longer exists after a new deployment, return 404
// rather than serving index.html (which would cause "TypeError: Failed to fetch dynamically imported module")
app.use('/assets', (req, res) => {
  res.status(404).type('text/plain').send('Asset chunk not found');
});

// Catch-all route to serve the React app for non-API requests (SPA routing)
app.get(/.*/, serveSpaIndex);

// Start Server
if (process.env.NODE_ENV !== "test") {
  if (!process.env.JUDGE0_API_HOST && !process.env.JUDGE0_API_URL) {
    process.env.JUDGE0_API_HOST = "https://ce.judge0.com";
  }
  databaseReady
    .then(() => {
      server.listen(PORT, () => {
        console.log(`🚀 Server running on port http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("FATAL: Server startup aborted because the database is unavailable:", err.message);
      process.exit(1);
    });
}

const gracefulShutdown = async () => {
  if (sessionCleanupInterval) clearInterval(sessionCleanupInterval);
  if (onlineUsersUpdateTimer) clearTimeout(onlineUsersUpdateTimer);
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log("🔌 MongoDB connection pool closed cleanly on shutdown");
    }
  } catch {}
};
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = {
  app,
  server,
  isSameOrProductionDatabase,
  parseMongoUri,
  isOriginAllowed,
  corsOriginValidator,
  corsOptions,
  EXPLICIT_ALLOWED_ORIGINS,
  gracefulShutdown,
  getPoolStatus,
  getMongoConnectionOptions,
};
