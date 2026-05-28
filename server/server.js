
const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const cors = require("cors")
const router = require("./route")
const cookieParser = require('cookie-parser');
const authRoutes = require("./routes/authRoutes");
const certificationRoutes = require("./routes/certificationRoutes");
const memberRoutes = require("./routes/memberRoutes");
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

// Store online users: { socketId: username }
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // When a user logs into the app/chat
  socket.on("user_joined", (username) => {
    onlineUsers.set(socket.id, username);
    io.emit("update_online_users", Array.from(onlineUsers.values()));
  });

  // When a user sends a direct message
  socket.on("send_dm", ({ toUser, fromUser, roomCode }) => {
    // Find socket id of toUser
    for (const [id, username] of onlineUsers.entries()) {
      if (username === toUser) {
        io.to(id).emit("receive_dm", { fromUser, roomCode });
        break;
      }
    }
  });

  // When a user sends a global chat message
  socket.on("send_global_message", (messageData) => {
    // messageData: { user: string, text: string, time: string, zone: string }
    io.emit("receive_global_message", messageData);
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", socket.id);
    onlineUsers.delete(socket.id);
    io.emit("update_online_users", Array.from(onlineUsers.values()));
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
app.use("/api", router)
app.use('/auth', authRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/members', memberRoutes);

const MONGO_URI = process.env.db_url || "mongodb+srv://yashashyashash1_db_user:yashash87920@masteryzone1111.gyw8std.mongodb.net/masteryzone?retryWrites=true&w=majority&appName=masteryzone1111";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err)=>console.log("🔌Error connecting to MongoDB:", err.message))


const path = require('path');

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all route to serve the React app for non-API requests (SPA routing)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port http://localhost:${PORT}`);
});
