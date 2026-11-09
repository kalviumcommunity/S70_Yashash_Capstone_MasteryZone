
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config();

const express = require("express")
const fs = require("fs")
const mongoose = require("mongoose")
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
const User = require("./models/User");
const { pushNotification, setGlobalIo } = require("./utils/notificationService");
const { setGlobalAdminIo } = require("./utils/adminNotificationService");
const http = require('http');
const { Server } = require('socket.io');
dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = process.env.PORT || 5012; // Use environment variable or fallback to 5012

// Create HTTP Server
const server = http.createServer(app);

// Explicit Trusted Origins for Strict CORS Enforcement
const TRUSTED_ORIGINS = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "https://mastery-zone.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "http://localhost:4173",
].filter(Boolean);

function corsOriginValidator(origin, callback) {
  if (!origin) return callback(null, true);
  if (
    TRUSTED_ORIGINS.includes(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
    /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin) ||
    (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "staging")
  ) {
    return callback(null, true);
  }
  return callback(new Error("CORS policy violation: Origin not allowed"), false);
}

const corsOptions = {
  origin: corsOriginValidator,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

// Make io accessible throughout Express app routes
app.set("io", io);

// Store online users: { socketId: username }
const onlineUsers = new Map();

// Active User Sessions Map for Real-Time Super Admin Monitoring:
// socketId => { socketId, userId, username, fullName, email, currentPage, activity, startedAt, lastHeartbeat, device }
const activeUserSessions = new Map();
app.set("activeUserSessions", activeUserSessions);

// Active collaborative coding rooms in memory:
// roomId => { code, language, participants: Map(socketId => { user, role, cursor }) }
const codingRooms = new Map();

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
      const decoded = jwt.verify(cleanToken, getJwtSecret());
      const uid = String(decoded.userId || decoded.id || decoded._id || "").trim();
      if (uid) {
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
          // Clean up old user session in super admin monitor
          if (activeUserSessions.has(socket.id)) {
            const sess = activeUserSessions.get(socket.id);
            activeUserSessions.delete(socket.id);
            io.to("super_admin_room").emit("live_session_ended", { socketId: socket.id, userId: sess?.userId });
          }
        }
        socket.data.userId = uid;
        socket.data.userRole = decoded.role || "user";
        socket.data.role = decoded.role || "user";
        socket.data.isMainAdmin = Boolean(decoded.isMainAdmin || decoded.role === "admin" || decoded.role === "SUPER_ADMIN");
        socket.data.userEmail = decoded.email || "";
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
      if (activeUserSessions.has(socket.id)) {
        const sess = activeUserSessions.get(socket.id);
        activeUserSessions.delete(socket.id);
        io.to("super_admin_room").emit("live_session_ended", { socketId: socket.id, userId: sess?.userId });
      }
      delete socket.data.userId;
      delete socket.data.userRole;
      delete socket.data.role;
      delete socket.data.isMainAdmin;
      delete socket.data.userEmail;
      delete socket.data.meetingId;
      delete socket.data.meetingUser;
      console.log(`🔌 Socket ${socket.id} logged out and purged private rooms for user_${oldUid}`);
    }
  });

  // Authenticated user room registration for real-time notifications & progress updates
  socket.on("register_user_session", (payload) => {
    if (!payload) return;
    if (typeof payload === "object") {
      if (payload.token) {
        joinUserRoomFromToken(payload.token);
      } else if (payload.userId && socket.data.userId && String(payload.userId).trim() === socket.data.userId) {
        socket.join(`user_${socket.data.userId}`);
      }
      return;
    }
    const str = String(payload).trim();
    if (str.split(".").length === 3) {
      joinUserRoomFromToken(str);
    }
  });

  // When a user logs into the app/chat
  socket.on("user_joined", (username) => {
    onlineUsers.set(socket.id, username);
    io.emit("update_online_users", Array.from(onlineUsers.values()));
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
    };

    activeUserSessions.set(socket.id, sessionObj);

    // Notify Super Admin live monitoring channel in real time
    io.to("super_admin_room").emit("live_session_update", sessionObj);
  });

  // Super Admin joins real-time live monitoring room (Restricted to verified administrators)
  socket.on("join_admin_monitoring", async (payload) => {
    let isAdmin = socket.data.userRole === "admin" || socket.data.userRole === "SUPER_ADMIN";
    
    // Check if a token was sent with the event or handshake
    const candidateToken = (payload && typeof payload === "object" ? payload.token : payload) || socket.handshake?.auth?.token;
    if (!isAdmin && candidateToken && typeof candidateToken === "string") {
      try {
        const clean = candidateToken.startsWith("Bearer ") ? candidateToken.slice(7) : candidateToken;
        const decoded = jwt.verify(clean, getJwtSecret());
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
  });

  // When a user sends a direct message (invite)
  socket.on("send_dm", async ({ toUser, fromUser, roomCode }) => {
    const verifiedSender = onlineUsers.get(socket.id) || socket.data.meetingUser?.fullName || socket.data.userEmail || fromUser;
    for (const [id, username] of onlineUsers.entries()) {
      if (username === toUser) {
        io.to(id).emit("receive_dm", { fromUser: verifiedSender, roomCode });
        break;
      }
    }
    if (toUser) {
      try {
        const recipient = await User.findOne({
          $or: [{ username: toUser }, { fullName: toUser }, { email: toUser.toLowerCase() }],
        }).select("_id").lean();
        if (recipient?._id) {
          await pushNotification(io, {
            userId: recipient._id,
            title: "Collaboration Room Invite",
            message: `${verifiedSender || "A teammate"} invited you to join room ${roomCode || ""}.`,
            type: "collaboration",
            severity: "info",
            actionUrl: "/coding",
            actionLabel: "Join Session",
          });
        }
      } catch {}
    }
  });

  // When a user sends a private 1-on-1 chat message
  socket.on("send_private_msg", async (messageData) => {
    const { toUser, fromUser, text, time } = messageData || {};
    const verifiedSender = onlineUsers.get(socket.id) || socket.data.meetingUser?.fullName || socket.data.userEmail || fromUser;
    for (const [id, username] of onlineUsers.entries()) {
      if (username === toUser) {
        io.to(id).emit("receive_private_msg", {
          id: Date.now().toString(),
          fromUser: verifiedSender,
          text,
          time,
        });
        break;
      }
    }
    if (toUser && text) {
      try {
        const recipient = await User.findOne({
          $or: [{ username: toUser }, { fullName: toUser }, { email: toUser.toLowerCase() }],
        }).select("_id").lean();
        if (recipient?._id) {
          const preview = String(text).length > 72 ? `${String(text).slice(0, 70)}…` : String(text);
          await pushNotification(io, {
            userId: recipient._id,
            title: `Message from ${verifiedSender || "Teammate"}`,
            message: preview,
            type: "collaboration",
            severity: "info",
          });
        }
      } catch {}
    }
  });

  // When a user sends a global chat message
  socket.on("send_global_message", (messageData) => {
    if (!messageData || typeof messageData !== "object") return;
    const text = String(messageData.text || "").trim();
    if (!text || text.length > 2000) return;
    const verifiedUser = onlineUsers.get(socket.id) || socket.data.meetingUser?.fullName || socket.data.userEmail || String(messageData.user || "Learner").slice(0, 50);
    io.emit("receive_global_message", {
      ...messageData,
      text,
      user: verifiedUser,
      time: messageData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  // =========================================================
  // REAL-TIME COLLABORATIVE CODING ROOMS
  // =========================================================
  socket.on("join_coding_room", ({ roomId, user, language, initialCode }) => {
    if (!roomId) return;
    if (socket.data.codingRoomId && socket.data.codingRoomId !== roomId) {
      const prevRoomKey = `coding_room_${socket.data.codingRoomId}`;
      socket.leave(prevRoomKey);
      const prevRoom = codingRooms.get(socket.data.codingRoomId);
      if (prevRoom) {
        prevRoom.participants.delete(socket.id);
        io.to(prevRoomKey).emit("coding_room_participants", Array.from(prevRoom.participants.values()));
      }
    }
    socket.data.codingRoomId = roomId;
    const roomKey = `coding_room_${roomId}`;
    socket.join(roomKey);

    if (!codingRooms.has(roomId)) {
      codingRooms.set(roomId, {
        code: initialCode || "",
        language: language || "python",
        participants: new Map(),
      });
    }

    const room = codingRooms.get(roomId);
    const participantInfo = {
      socketId: socket.id,
      user: user || { fullName: "Anonymous Developer", email: "" },
      role: room.participants.size === 0 ? "Host" : "Collaborator",
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
      text: `${user?.fullName || "A developer"} joined the session`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on("code_change", ({ roomId, code, language, cursor }) => {
    if (!roomId || !codingRooms.has(roomId)) return;
    const room = codingRooms.get(roomId);
    if (!room.participants.has(socket.id)) return;
    room.code = typeof code === "string" ? code.slice(0, 500000) : "";
    if (language) room.language = String(language).slice(0, 30);

    // Broadcast code updates to all other participants in the room
    socket.to(`coding_room_${roomId}`).emit("code_update", {
      code: room.code,
      language: room.language,
      cursor,
      fromSocket: socket.id,
    });
  });

  socket.on("cursor_move", ({ roomId, cursor, user }) => {
    if (!roomId || !codingRooms.has(roomId)) return;
    const room = codingRooms.get(roomId);
    if (!room.participants.has(socket.id)) return;
    room.participants.get(socket.id).cursor = cursor;
    socket.to(`coding_room_${roomId}`).emit("cursor_update", {
      cursor,
      user: socket.data.meetingUser || user,
      socketId: socket.id,
    });
  });

  socket.on("coding_chat_message", ({ roomId, text, user, time }) => {
    if (!roomId || !codingRooms.has(roomId)) return;
    const room = codingRooms.get(roomId);
    if (!room.participants.has(socket.id)) return;
    io.to(`coding_room_${roomId}`).emit("coding_chat_message", {
      id: Date.now().toString(),
      text,
      user,
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on("coding_execution_event", ({ roomId, status, user, result }) => {
    if (!roomId || !codingRooms.has(roomId)) return;
    const room = codingRooms.get(roomId);
    if (!room.participants.has(socket.id)) return;
    io.to(`coding_room_${roomId}`).emit("coding_execution_event", {
      status,
      user,
      result,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("leave_coding_room", ({ roomId }) => {
    if (!roomId || !codingRooms.has(roomId)) return;
    const roomKey = `coding_room_${roomId}`;
    socket.leave(roomKey);
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

  socket.on("join_meeting", async ({ meetingId, user, mediaState, token }) => {
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
        targetUid = `guest_${socket.id.slice(0, 8)}`;
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

      if (meeting.isPrivate && !isHost && !isAdmitted && !isAdmin) {
        socket.emit("meeting_error", { message: "Access denied. This is a private meeting." });
        return;
      }

      // If meeting was ended and creator re-joins, reactivate it
      if (meeting.status === "ended") {
        if (targetUid && String(meeting.hostUserId) === targetUid) {
          meeting.status = "active";
          meeting.endedAt = null;
          await meeting.save();
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
    io.emit("update_online_users", Array.from(onlineUsers.values()));

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

// Standard API request size limit (route-specific 100mb applied on video uploads)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cookieParser()); // Use cookie parser
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

// Authenticated & Range-Supported Meeting Recordings Streaming (Strict Database-Derived Ownership)
app.use('/recordings', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.split(' ')[1]) ||
                req.query.token ||
                req.cookies?.token;

  if (!token) {
    return res.status(401).send("Authentication required to access recordings");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (e) {
    return res.status(401).send("Invalid or expired session token");
  }

  const currentUserId = String(decoded.userId || decoded.id || decoded._id || "");
  const isAdmin = Boolean(decoded.role === "admin" || decoded.role === "SUPER_ADMIN" || decoded.isMainAdmin);

  const safeFilename = path.basename(req.path);
  const filePath = path.join(__dirname, 'uploads/recordings', safeFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Recording file not found");
  }

  // Exact authorization verification against database
  const escapedFilename = safeFilename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const Recording = require("./models/Recording");
  const recording = await Recording.findOne({
    $or: [
      { streamUrl: `/api/recordings/stream/${safeFilename}` },
      { fileUrl: `/recordings/${safeFilename}` },
      { fileUrl: `/uploads/recordings/${safeFilename}` },
      { filePath: { $regex: `(^|[\\\\/])${escapedFilename}$` } },
    ],
  }).lean();

  if (recording && !isAdmin) {
    const isHost = String(recording.hostUserId) === currentUserId;
    const isParticipant = (recording.participantUserIds || []).includes(currentUserId);
    if (!isHost && !isParticipant) {
      return res.status(403).send("Forbidden: You do not have permission to access this recording");
    }
  } else if (!recording && !isAdmin) {
    return res.status(404).send("Recording record not found");
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === ".mp4" ? "video/mp4" : "video/webm";

  if (range && fileSize > 0) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    if (start >= fileSize) {
      return res.status(416).send(`Requested range not satisfiable: ${start} >= ${fileSize}`);
    }
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath).pipe(res);
  }
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
    decoded = jwt.verify(token, getJwtSecret());
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
    decoded = jwt.verify(token, getJwtSecret());
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
      await mongoose.connect(testUri, { serverSelectionTimeoutMS: 3000 });
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

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log("✅ MongoDB Connected Successfully");
    await bootstrapSuperAdmin();
  } catch (err) {
    console.error("🔌 MongoDB connection failed:", err.message);
    if (process.env.NODE_ENV !== "production" && mongoUri !== "mongodb://127.0.0.1:27017/masteryzone") {
      console.log("🔄 Retrying with local MongoDB fallback (mongodb://127.0.0.1:27017/masteryzone)...");
      try {
        await mongoose.disconnect();
      } catch {}
      try {
        await mongoose.connect("mongodb://127.0.0.1:27017/masteryzone", { serverSelectionTimeoutMS: 3000 });
        console.log("✅ MongoDB Connected Successfully (Local Fallback)");
        await bootstrapSuperAdmin();
      } catch (localErr) {
        console.error("🔌 Local MongoDB connection also failed:", localErr.message);
      }
    } else if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}
connectDB();



// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all route to serve the React app for non-API requests (SPA routing)
app.get(/.*/, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start Server
if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port http://localhost:${PORT}`);
  });
}

module.exports = { app, server, isSameOrProductionDatabase, parseMongoUri };
