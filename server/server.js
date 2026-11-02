
const express = require("express")
const path = require("path")
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
const Meeting = require("./models/Meeting");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const { pushNotification } = require("./utils/notificationService");
const http = require('http');
const { Server } = require('socket.io');
dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = process.env.PORT || 5012; // Use environment variable or fallback to 5012

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io accessible throughout Express app routes
app.set("io", io);

// Store online users: { socketId: username }
const onlineUsers = new Map();

// Active collaborative coding rooms in memory:
// roomId => { code, language, participants: Map(socketId => { user, role, cursor }) }
const codingRooms = new Map();

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  const joinUserRoomFromToken = (rawToken) => {
    if (!rawToken || typeof rawToken !== "string") return null;
    try {
      const cleanToken = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || "supersecretkey");
      const uid = String(decoded.userId || decoded.id || decoded._id || "").trim();
      if (uid) {
        socket.data.userId = uid;
        socket.join(`user_${uid}`);
        console.log(`📡 Socket ${socket.id} authenticated into room user_${uid}`);
        return uid;
      }
    } catch {}
    return null;
  };

  // Auto-join user room if JWT token was passed in Socket.IO handshake auth
  if (socket.handshake?.auth?.token) {
    joinUserRoomFromToken(socket.handshake.auth.token);
  }

  // Authenticated user room registration for real-time notifications & progress updates
  socket.on("register_user_session", (payload) => {
    if (!payload) return;
    if (typeof payload === "object") {
      if (payload.token) joinUserRoomFromToken(payload.token);
      if (payload.userId) {
        const uid = String(payload.userId).trim();
        socket.data.userId = uid;
        socket.join(`user_${uid}`);
        console.log(`📡 Socket ${socket.id} joined personal room user_${uid}`);
      }
      return;
    }
    const str = String(payload).trim();
    if (str.split(".").length === 3) {
      joinUserRoomFromToken(str);
    } else if (str) {
      socket.data.userId = str;
      socket.join(`user_${str}`);
      console.log(`📡 Socket ${socket.id} joined personal room user_${str}`);
    }
  });

  // When a user logs into the app/chat
  socket.on("user_joined", (username) => {
    onlineUsers.set(socket.id, username);
    io.emit("update_online_users", Array.from(onlineUsers.values()));
  });

  // When a user sends a direct message (invite)
  socket.on("send_dm", async ({ toUser, fromUser, roomCode }) => {
    for (const [id, username] of onlineUsers.entries()) {
      if (username === toUser) {
        io.to(id).emit("receive_dm", { fromUser, roomCode });
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
            message: `${fromUser || "A teammate"} invited you to join room ${roomCode || ""}.`,
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
    for (const [id, username] of onlineUsers.entries()) {
      if (username === toUser) {
        io.to(id).emit("receive_private_msg", {
          id: Date.now().toString(),
          fromUser,
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
            title: `Message from ${fromUser || "Teammate"}`,
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
    // messageData: { user: string, text: string, time: string, zone: string }
    io.emit("receive_global_message", messageData);
  });

  // =========================================================
  // REAL-TIME COLLABORATIVE CODING ROOMS
  // =========================================================
  socket.on("join_coding_room", ({ roomId, user, language, initialCode }) => {
    if (!roomId) return;
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
    room.code = code;
    if (language) room.language = language;

    // Broadcast code updates to all other participants in the room
    socket.to(`coding_room_${roomId}`).emit("code_update", {
      code,
      language: room.language,
      cursor,
      fromSocket: socket.id,
    });
  });

  socket.on("cursor_move", ({ roomId, cursor, user }) => {
    if (!roomId || !codingRooms.has(roomId)) return;
    const room = codingRooms.get(roomId);
    if (room.participants.has(socket.id)) {
      room.participants.get(socket.id).cursor = cursor;
    }
    socket.to(`coding_room_${roomId}`).emit("cursor_update", {
      cursor,
      user,
      socketId: socket.id,
    });
  });

  socket.on("coding_chat_message", ({ roomId, text, user, time }) => {
    if (!roomId) return;
    io.to(`coding_room_${roomId}`).emit("coding_chat_message", {
      id: Date.now().toString(),
      text,
      user,
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on("coding_execution_event", ({ roomId, status, user, result }) => {
    if (!roomId) return;
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

        const activeRemaining = m.participants.filter(
          (p) => !p.leftAt && p.socketId && currentSockets.has(p.socketId)
        );
        io.to(roomName).emit("meeting_participants_updated", activeRemaining);
      }
    } catch (err) {
      console.error("Error during meeting leave cleanup:", err);
    }
    sock.data.meetingId = null;
  };

  socket.on("join_meeting", async ({ meetingId, user, mediaState }) => {
    if (!meetingId) return;
    const cleanId = String(meetingId).trim().toLowerCase();
    const nonDashed = cleanId.replace(/-/g, "");

    try {
      let meeting = await Meeting.findOne({
        $or: [{ meetingId: cleanId }, { meetingId: nonDashed }, { invitationCode: cleanId }],
      });

      const targetUid = String(user?._id || user?.id || user?.userId || "");
      const targetName = user?.fullName || user?.username || "Learner";

      // If meeting doesn't exist yet, auto-create it so link/code joining never fails
      if (!meeting) {
        meeting = await Meeting.create({
          meetingId: cleanId,
          title: "Live Meeting Session",
          groupKey: "general",
          groupTitle: "Live Meeting",
          hostUserId: targetUid || String(socket.id),
          hostName: targetName !== "Learner" ? targetName : "Host",
          hostEmail: user?.email || "",
          status: "active",
          invitationCode: nonDashed,
          participants: [],
        });
      }

      // If meeting was ended and creator re-joins, reactivate it
      if (meeting.status === "ended") {
        if (targetUid && String(meeting.hostUserId) === targetUid) {
          meeting.status = "active";
          meeting.endedAt = null;
          await meeting.save();
        }
      }

      const canonicalId = meeting ? meeting.meetingId : cleanId;
      const roomName = `meeting_${canonicalId}`;
      socket.join(roomName);
      if (cleanId !== canonicalId) socket.join(`meeting_${cleanId}`);
      if (nonDashed !== canonicalId) socket.join(`meeting_${nonDashed}`);

      socket.data.meetingId = canonicalId;
      socket.data.meetingUser = user;

      const roomSockets = io.sockets.adapter.rooms.get(roomName) || new Set();

      // Clean up stale or disconnected participants from this meeting record
      meeting.participants.forEach((p) => {
        if (!p.leftAt && p.socketId && p.socketId !== socket.id && !roomSockets.has(p.socketId)) {
          p.leftAt = new Date();
        }
      });

      // Find existing record by socketId, userId, or matching name if socket disconnected
      const existingIdx = meeting.participants.findIndex(
        (p) =>
          p.socketId === socket.id ||
          (targetUid && String(p.userId) === targetUid) ||
          (!p.socketId && String(p.userId) === targetUid) ||
          (!p.leftAt && targetName !== "Learner" && p.fullName === targetName)
      );

      const isHost =
        meeting.hostUserId &&
        ((targetUid && String(meeting.hostUserId) === targetUid) ||
          (user?.id && String(meeting.hostUserId) === String(user.id)) ||
          meeting.hostName === (user?.fullName || user?.username));

      const pData = {
        userId: targetUid || String(socket.id),
        socketId: socket.id,
        fullName: targetName,
        username: user?.username || "learner",
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

      // Return only participants with active live sockets in this room
      const activeParticipants = meeting.participants.filter(
        (p) => !p.leftAt && p.socketId && liveSockets.has(p.socketId)
      );

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

  // WebRTC mesh signaling relays (Offer, Answer, ICE Candidate)
  socket.on("webrtc_offer", ({ targetSocketId, toSocketId, offer, meetingId }) => {
    const target = targetSocketId || toSocketId;
    if (!target || !offer) return;
    io.to(target).emit("webrtc_offer_received", {
      fromSocketId: socket.id,
      user: socket.data.meetingUser,
      offer,
      meetingId: meetingId || socket.data.meetingId,
    });
  });

  socket.on("webrtc_answer", ({ targetSocketId, toSocketId, answer, meetingId }) => {
    const target = targetSocketId || toSocketId;
    if (!target || !answer) return;
    io.to(target).emit("webrtc_answer_received", {
      fromSocketId: socket.id,
      user: socket.data.meetingUser,
      answer,
      meetingId: meetingId || socket.data.meetingId,
    });
  });

  socket.on("webrtc_ice_candidate", ({ targetSocketId, toSocketId, candidate, meetingId }) => {
    const target = targetSocketId || toSocketId;
    if (!target || !candidate) return;
    io.to(target).emit("webrtc_ice_candidate_received", {
      fromSocketId: socket.id,
      candidate,
      meetingId: meetingId || socket.data.meetingId,
    });
  });

  socket.on("webrtc_signal", ({ toSocketId, targetSocketId, signal, type }) => {
    const target = toSocketId || targetSocketId;
    if (!target) return;
    io.to(target).emit("webrtc_signal", {
      fromSocketId: socket.id,
      user: socket.data.meetingUser,
      signal,
      type,
    });
  });

  // Media toggle (mic, camera, screenshare, raise-hand)
  socket.on("meeting_media_toggle", async ({ meetingId, mediaState }) => {
    const mid = socket.data.meetingId || meetingId;
    if (!mid) return;
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
    const mid = socket.data.meetingId || meetingId;
    if (!mid) return;
    const reactionPayload = {
      id: Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      emoji: emoji || "👏",
      user: user || socket.data.meetingUser || { fullName: "A learner" },
      timestamp: new Date().toISOString(),
    };
    io.to(`meeting_${mid}`).emit("meeting_reaction_received", reactionPayload);
    if (meetingId && meetingId !== mid) {
      io.to(`meeting_${meetingId}`).emit("meeting_reaction_received", reactionPayload);
    }
  });

  // Live Chat messages
  socket.on("meeting_chat_message", async ({ meetingId, text, user }) => {
    if (!meetingId || !text) return;
    const msgObj = {
      id: Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      senderId: String(user?._id || user?.id || socket.id),
      senderName: user?.fullName || user?.username || "Learner",
      senderAvatar: user?.avatarUrl || "",
      text,
      timeString: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: new Date(),
    };

    io.to(`meeting_${meetingId}`).emit("meeting_chat_message_received", msgObj);

    try {
      await Meeting.updateOne({ meetingId }, { $push: { messages: msgObj } });
    } catch (err) {}
  });

  // Collaborative Shared Code Sync
  socket.on("meeting_code_change", async ({ meetingId, code, language, user, cursor }) => {
    if (!meetingId) return;
    socket.to(`meeting_${meetingId}`).emit("meeting_code_updated", {
      code,
      language,
      user,
      cursor,
      fromSocketId: socket.id,
    });

    try {
      const updateDoc = {};
      if (code !== undefined) updateDoc["sharedCode.code"] = code;
      if (language !== undefined) updateDoc["sharedCode.language"] = language;
      updateDoc["sharedCode.lastModifiedBy"] = user?.fullName || "Collaborator";
      updateDoc["sharedCode.lastUpdatedAt"] = new Date();
      await Meeting.updateOne({ meetingId }, { $set: updateDoc });
    } catch (err) {}
  });

  // Collaborative Multi-File Operations
  socket.on("meeting_file_select", ({ meetingId, fileId, user }) => {
    if (!meetingId) return;
    socket.to(`meeting_${meetingId}`).emit("meeting_file_selected", { fileId, user, fromSocketId: socket.id });
    Meeting.updateOne({ meetingId }, { $set: { activeFileId: fileId } }).catch(() => {});
  });

  socket.on("meeting_file_update", async ({ meetingId, fileId, name, content, language, user }) => {
    if (!meetingId) return;
    socket.to(`meeting_${meetingId}`).emit("meeting_file_updated", {
      fileId,
      name,
      content,
      language,
      user,
      fromSocketId: socket.id,
    });
    try {
      await Meeting.updateOne(
        { meetingId, "workspaceFiles.id": fileId },
        {
          $set: {
            "workspaceFiles.$.content": content,
            "workspaceFiles.$.name": name,
            "workspaceFiles.$.language": language,
            "workspaceFiles.$.lastModifiedBy": user?.fullName || "Collaborator",
          },
        }
      );
    } catch {}
  });

  socket.on("meeting_file_create", async ({ meetingId, file, user }) => {
    if (!meetingId || !file) return;
    io.to(`meeting_${meetingId}`).emit("meeting_file_created", { file, user });
    try {
      await Meeting.updateOne({ meetingId }, { $push: { workspaceFiles: file } });
    } catch {}
  });

  socket.on("meeting_file_delete", async ({ meetingId, fileId, user }) => {
    if (!meetingId || !fileId) return;
    io.to(`meeting_${meetingId}`).emit("meeting_file_deleted", { fileId, user });
    try {
      await Meeting.updateOne({ meetingId }, { $pull: { workspaceFiles: { id: fileId } } });
    } catch {}
  });

  // Live Peer Cursors & Typing Telemetry
  socket.on("meeting_cursor_move", ({ meetingId, fileId, cursor, user }) => {
    if (!meetingId) return;
    socket.to(`meeting_${meetingId}`).emit("meeting_peer_cursor", {
      socketId: socket.id,
      fileId,
      cursor,
      user,
    });
  });

  socket.on("meeting_typing_status", ({ meetingId, user, isTyping, fileId }) => {
    if (!meetingId) return;
    socket.to(`meeting_${meetingId}`).emit("meeting_typing_status", {
      socketId: socket.id,
      user,
      isTyping,
      fileId,
    });
  });

  // Workspace Permissions (collaborative | host-only | read-only)
  socket.on("meeting_permission_change", async ({ meetingId, permission, user }) => {
    if (!meetingId) return;
    io.to(`meeting_${meetingId}`).emit("meeting_permission_changed", { permission, user });
    try {
      await Meeting.updateOne({ meetingId }, { $set: { codingPermission: permission } });
    } catch {}
  });

  // Collaborative Whiteboard
  socket.on("meeting_whiteboard_stroke", async ({ meetingId, stroke, clearAll, allStrokes }) => {
    if (!meetingId) return;
    socket.to(`meeting_${meetingId}`).emit("meeting_whiteboard_updated", { stroke, clearAll });
    if (allStrokes !== undefined) {
      try {
        await Meeting.updateOne({ meetingId }, { $set: { whiteboardData: JSON.stringify(allStrokes) } });
      } catch {}
    }
  });

  // Code Reviews & Inline Discussions
  socket.on("meeting_code_review_add", async ({ meetingId, review }) => {
    if (!meetingId || !review) return;
    io.to(`meeting_${meetingId}`).emit("meeting_code_review_added", { review });
    try {
      await Meeting.updateOne({ meetingId }, { $push: { codeReviews: review } });
    } catch {}
  });

  socket.on("meeting_code_review_toggle", async ({ meetingId, reviewId, status }) => {
    if (!meetingId || !reviewId) return;
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
    if (!meetingId || !taskId) return;
    io.to(`meeting_${meetingId}`).emit("meeting_task_toggled", { taskId, completed });
    try {
      await Meeting.updateOne(
        { meetingId, "sharedTasks.id": taskId },
        { $set: { "sharedTasks.$.completed": completed } }
      );
    } catch {}
  });

  socket.on("meeting_task_create", async ({ meetingId, task }) => {
    if (!meetingId || !task) return;
    io.to(`meeting_${meetingId}`).emit("meeting_task_created", { task });
    try {
      await Meeting.updateOne({ meetingId }, { $push: { sharedTasks: task } });
    } catch {}
  });

  // Collaborative Notes Sync
  socket.on("meeting_notes_change", async ({ meetingId, notes, user }) => {
    if (!meetingId) return;
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
    if (!meetingId) return;
    io.to(`meeting_${meetingId}`).emit("meeting_code_run_status", {
      status,
      user,
      result,
      timestamp: new Date().toISOString(),
    });
  });

  // Host Controls (mute / kick / end)
  socket.on("meeting_host_action", async ({ meetingId, action, targetSocketId }) => {
    if (!meetingId) return;
    if (action === "end_meeting") {
      io.to(`meeting_${meetingId}`).emit("meeting_ended_by_host");
      try {
        await Meeting.updateOne(
          { meetingId },
          { $set: { status: "ended", endedAt: new Date() } }
        );
      } catch {}
    } else if (action === "mute_user" && targetSocketId) {
      io.to(targetSocketId).emit("meeting_host_muted_you");
    } else if (action === "kick_user" && targetSocketId) {
      io.to(targetSocketId).emit("meeting_host_kicked_you");
    }
  });

  // Meeting Recording Telemetry (Host controls, Peer indicator)
  socket.on("meeting_recording_status", ({ meetingId, isRecording, isPaused, recordingStartedAt, hostName }) => {
    if (!meetingId) return;
    io.to(`meeting_${meetingId}`).emit("meeting_recording_status", {
      isRecording,
      isPaused,
      recordingStartedAt,
      hostName,
    });
  });

  // Participant Permissions (screen share, code editing, chat)
  socket.on("meeting_settings_update", ({ meetingId, settings, user }) => {
    if (!meetingId) return;
    io.to(`meeting_${meetingId}`).emit("meeting_settings_updated", {
      settings,
      user,
    });
  });

  // Collaborative Problem-Solving Mode Toggle
  socket.on("meeting_challenge_mode_toggle", async ({ meetingId, mode, user }) => {
    if (!meetingId) return;
    io.to(`meeting_${meetingId}`).emit("meeting_challenge_mode_toggled", { mode, user });
  });

  // Collaborative Solution Grading Broadcast
  socket.on("meeting_solution_submit", async ({ meetingId, result, user }) => {
    if (!meetingId) return;
    io.to(`meeting_${meetingId}`).emit("meeting_solution_submitted", {
      result,
      user,
      timestamp: new Date().toISOString(),
    });
  });

  // Voluntary leave
  socket.on("leave_meeting", () => {
    handleUserLeavingMeeting(socket);
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", socket.id);
    onlineUsers.delete(socket.id);
    io.emit("update_online_users", Array.from(onlineUsers.values()));

    handleUserLeavingMeeting(socket);

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

// CORS - allow requests from frontend
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' })); // Middleware to parse JSON requests
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Middleware to parse URL-encoded bodies
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
app.use('/recordings', express.static(path.join(__dirname, 'uploads/recordings')));
app.use('/certificates', express.static(path.join(__dirname, 'uploads/certificates')));
app.use("/api", router);

const PRIMARY_MONGO_URI = process.env.MONGODB_URI || process.env.db_url || "mongodb://127.0.0.1:27017/masteryzone";
const ATLAS_FALLBACK_URI = "mongodb+srv://yashashyashash1_db_user:yashash87920@masteryzone1111.gyw8std.mongodb.net/masteryzone?retryWrites=true&w=majority&appName=masteryzone1111";

async function connectDB() {
  try {
    await mongoose.connect(PRIMARY_MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.warn("🔌 Primary MongoDB connection failed, connecting to Atlas fallback...");
    try {
      await mongoose.connect(ATLAS_FALLBACK_URI, { serverSelectionTimeoutMS: 8000 });
      console.log("✅ MongoDB Connected Successfully via Atlas fallback");
    } catch (atlasErr) {
      console.error("🔌 Atlas fallback connection failed:", atlasErr.message);
    }
  }
}
connectDB();



// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all route to serve the React app for non-API requests (SPA routing)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start Server
if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
