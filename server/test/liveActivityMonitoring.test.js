/**
 * Comprehensive Test Suite for MasteryZone Admin Live User Activity & Real-Time Monitoring
 * Runs directly via: node server/test/liveActivityMonitoring.test.js
 */
const assert = require("assert");
const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { io: Client } = require("socket.io-client");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { getJwtSecret } = require("../config/jwtConfig");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const ActiveSession = require("../models/ActiveSession");
const sessionManager = require("../utils/sessionManager");
const { backfillHistoricalActivities, cleanInvalidActivities } = require("../utils/activityBackfill");
const { logActivityAndBroadcast, setGlobalActivityIo } = require("../utils/activityLogger");
const adminRoutes = require("../routes/adminRoutes");

const app = express();
app.use(express.json());
app.set("sessionManager", sessionManager);
app.use("/api/admin", adminRoutes);

let server;
let io;
let serverPort;
let adminToken;
let studentToken;
let testStudent;
let testAdmin;

function makeRequest(path, token = adminToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: serverPort,
      path,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function createSocketClient(authPayload) {
  return new Promise((resolve) => {
    const socket = Client(`http://127.0.0.1:${serverPort}`, {
      auth: authPayload,
      transports: ["websocket"],
      reconnection: false,
    });
    socket.on("connect", () => resolve(socket));
  });
}

async function runLiveActivityAuditSuite() {
  console.log("\n" + "=".repeat(80));
  console.log("🚀 MasteryZone Live User Activity & Real-Time Monitoring Audit Suite");
  console.log("=".repeat(80) + "\n");

  const mongoUri = process.env.MONGODB_URI || process.env.TEST_MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB Connected to Atlas/Database");

  // Setup server and socket.io
  server = http.createServer(app);
  io = new Server(server, { cors: { origin: "*" } });
  setGlobalActivityIo(io);
  app.set("io", io);

  // Wire Socket logic matching server.js
  io.on("connection", (socket) => {
    const rawToken = socket.handshake?.auth?.token;
    if (rawToken) {
      try {
        const clean = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;
        const decoded = jwt.verify(clean, getJwtSecret());
        socket.data.userId = String(decoded.userId || decoded.id || decoded._id);
        socket.data.userRole = decoded.role || "user";
      } catch {}
    }

    socket.on("join_admin_monitoring", async () => {
      socket.join("super_admin_room");
      const active = await sessionManager.getActiveSessions();
      socket.emit("live_sessions_snapshot", active);
    });

    socket.on("user_activity_heartbeat", async (data) => {
      if (!data) return;
      let uid = socket.data.userId;
      if (!uid && data.token) {
        try {
          const clean = data.token.startsWith("Bearer ") ? data.token.slice(7) : data.token;
          const decoded = jwt.verify(clean, getJwtSecret());
          uid = String(decoded.userId || decoded.id || decoded._id);
          socket.data.userId = uid;
          socket.data.userRole = decoded.role || "user";
        } catch {}
      }
      if (!uid || uid === "guest") return;

      const userDoc = await User.findById(uid).lean();
      if (!userDoc || !sessionManager.isGenuineRegisteredUser(userDoc)) return;

      const sessionObj = await sessionManager.recordHeartbeat({
        socketId: socket.id,
        user: userDoc,
        page: data.page || "",
        activity: data.activity || "",
        device: data.device || "",
        mediaState: data.mediaState || null,
      });

      if (sessionObj) {
        io.to("super_admin_room").emit("live_session_update", sessionObj);
      }
    });

    socket.on("disconnect", async () => {
      const res = await sessionManager.handleDisconnect(socket.id);
      if (res?.sessionEnded) {
        io.to("super_admin_room").emit("live_session_ended", { userId: res.userId, socketId: socket.id });
      } else if (res?.session) {
        io.to("super_admin_room").emit("live_session_update", res.session);
      }
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  serverPort = server.address().port;
  console.log(`📡 Harness running on port ${serverPort}`);

  // Fetch or setup test registered users
  testAdmin = await User.findOne({ email: "yashashyashash1@gmail.com" });
  if (!testAdmin) {
    testAdmin = await User.create({
      fullName: "Super Admin Yashash",
      username: "yashash_admin",
      email: "yashashyashash1@gmail.com",
      role: "SUPER_ADMIN",
      password: "Password123!",
      isEmailVerified: true,
    });
  }
  adminToken = jwt.sign(
    { userId: testAdmin._id, id: testAdmin._id, email: testAdmin.email, role: "SUPER_ADMIN" },
    getJwtSecret(),
    { expiresIn: "1h" }
  );

  testStudent = await User.findOne({ email: "yashashyashash333@gmail.com" });
  if (!testStudent) {
    testStudent = await User.create({
      fullName: "Yashash Student",
      username: "yashash_student",
      email: "yashashyashash333@gmail.com",
      role: "student",
      password: "Password123!",
      isEmailVerified: true,
      isGuest: false,
    });
  }
  studentToken = jwt.sign(
    { userId: testStudent._id, id: testStudent._id, email: testStudent.email, role: "student" },
    getJwtSecret(),
    { expiresIn: "1h" }
  );

  await sessionManager.initSessionManager();

  let passed = 0;
  let total = 0;
  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Database sanitization: Zero guest/orphan records in ActivityLog
  await test("1. Audit: Cleaned ActivityLog contains zero guest candidates or orphan users", async () => {
    const invalidCount = await ActivityLog.countDocuments({
      $or: [
        { userId: null },
        { userEmail: { $regex: /@example\.com$/i } },
        { userEmail: { $regex: /^guest_/i } },
        { userName: { $regex: /^guest_/i } },
      ],
    });
    assert.strictEqual(invalidCount, 0, "All invalid or guest activity records must be 0");
    const totalCount = await ActivityLog.countDocuments();
    assert.ok(totalCount > 0, "Authentic historical records must be preserved");
  });

  // 2. Heartbeat creates active session for authenticated student
  await test("2. Connected Session: Real authenticated student heartbeat registers session", async () => {
    const studentSock = await createSocketClient({ token: studentToken });
    studentSock.emit("user_activity_heartbeat", {
      page: "/coding",
      activity: "Coding Challenges & IDE",
      device: "macOS / Chrome",
      mediaState: { isMuted: false, isVideoOff: true },
    });

    // Allow async persistence
    await new Promise((r) => setTimeout(r, 200));

    const activeList = await sessionManager.getActiveSessions();
    const found = activeList.find((s) => String(s.userId) === String(testStudent._id));
    assert.ok(found, "Active session must be present for student");
    assert.strictEqual(found.currentPage, "/coding");
    assert.strictEqual(found.activity, "Coding Challenges & IDE");
    assert.strictEqual(found.device, "macOS / Chrome");
    assert.strictEqual(found.tabCount, 1);
    assert.strictEqual(found.status, "Connected");

    studentSock.disconnect();
    await new Promise((r) => setTimeout(r, 200));
  });

  // 3. Multi-Tab Deduplication
  await test("3. Multi-Tab: Multiple tabs for the same user count as 1 unique online user with tabCount", async () => {
    const tab1 = await createSocketClient({ token: studentToken });
    const tab2 = await createSocketClient({ token: studentToken });

    tab1.emit("user_activity_heartbeat", {
      page: "/coding",
      activity: "Coding Challenges & IDE",
      device: "macOS / Chrome",
    });
    tab2.emit("user_activity_heartbeat", {
      page: "/assessments",
      activity: "Proctored Assessment",
      device: "macOS / Chrome",
    });

    await new Promise((r) => setTimeout(r, 200));

    const activeList = await sessionManager.getActiveSessions();
    const studentSessions = activeList.filter((s) => String(s.userId) === String(testStudent._id));
    assert.strictEqual(studentSessions.length, 1, "Must deduplicate tabs into 1 user record");
    assert.strictEqual(studentSessions[0].tabCount, 2, "Tab count must reflect 2 tabs");

    // Close Tab 1
    tab1.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    const activeListAfterTab1 = await sessionManager.getActiveSessions();
    const stillOnline = activeListAfterTab1.find((s) => String(s.userId) === String(testStudent._id));
    assert.ok(stillOnline, "User must stay online while Tab 2 remains open");
    assert.strictEqual(stillOnline.tabCount, 1, "Tab count must decrement to 1");

    // Close Tab 2
    tab2.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    const activeListAfterTab2 = await sessionManager.getActiveSessions();
    const gone = activeListAfterTab2.find((s) => String(s.userId) === String(testStudent._id));
    assert.strictEqual(gone, undefined, "User must disconnect when last tab closes");
  });

  // 4. Guest account rejection
  await test("4. Security: Guest or unauthenticated sockets are strictly rejected from telemetry", async () => {
    const guestSock = await createSocketClient({});
    guestSock.emit("user_activity_heartbeat", {
      page: "/home",
      activity: "Guest Browsing",
      device: "Desktop",
    });

    await new Promise((r) => setTimeout(r, 200));

    const activeList = await sessionManager.getActiveSessions();
    const guestFound = activeList.find((s) => s.email?.startsWith("guest_") || s.userId === "guest");
    assert.strictEqual(guestFound, undefined, "Guest session must not be registered");
    guestSock.disconnect();
  });

  // 5. Real-Time Admin Telemetry Broadcast
  await test("5. Real-Time Sync: Super Admin socket receives live snapshot and immediate updates", async () => {
    const adminSock = await createSocketClient({ token: adminToken });
    let snapshotReceived = false;
    let liveUpdateReceived = false;

    adminSock.on("live_sessions_snapshot", (list) => {
      snapshotReceived = true;
      assert.ok(Array.isArray(list));
    });

    adminSock.on("live_session_update", (sessionObj) => {
      if (String(sessionObj.userId) === String(testStudent._id)) {
        liveUpdateReceived = true;
      }
    });

    adminSock.emit("join_admin_monitoring");
    await new Promise((r) => setTimeout(r, 200));
    assert.ok(snapshotReceived, "Super Admin must receive live sessions snapshot");

    // Student connects and triggers live update
    const studentSock = await createSocketClient({ token: studentToken });
    studentSock.emit("user_activity_heartbeat", {
      page: "/live",
      activity: "Live Video Meeting",
      device: "macOS / Safari",
    });

    await new Promise((r) => setTimeout(r, 200));
    assert.ok(liveUpdateReceived, "Super Admin must receive real-time live_session_update");

    studentSock.disconnect();
    adminSock.disconnect();
    await new Promise((r) => setTimeout(r, 200));
  });

  // 6. Live Activity API Endpoint (Zero fake defaults & pagination)
  await test("6. Live Activity API: Enforces 10 items, zero fake defaults, and genuine stats", async () => {
    const res = await makeRequest("/api/admin/live-activity?page=1&limit=10");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.activeSessions));
    assert.strictEqual(typeof res.body.onlineCount, "number");
    assert.ok(Array.isArray(res.body.activities));
    assert.ok(res.body.activities.length <= 10, "Historical activities must be <= 10");
    assert.ok(res.body.stats, "Stats must be returned");
    assert.strictEqual(typeof res.body.stats.coding, "number");
    assert.strictEqual(typeof res.body.stats.proctoring, "number");

    // Ensure activities have no fake guest users
    res.body.activities.forEach((act) => {
      assert.ok(act.userId, "Every activity must have a userId");
      assert.ok(!String(act.userEmail || "").includes("@example.com"), "No @example.com test emails in feed");
      assert.ok(!String(act.userName || "").startsWith("guest_"), "No guest users in feed");
    });
  });

  // 7. Activity Logger: Rejects guests & logs genuine events
  await test("7. Activity Logger: Validates user identity and records genuine activity", async () => {
    const doc = await logActivityAndBroadcast({
      userId: testStudent._id,
      userEmail: testStudent.email,
      userName: testStudent.fullName,
      type: "LEARNING_MODULE_PROGRESS",
      title: "Module Completed",
      detail: "Completed Arrays and Strings",
      category: "learning",
      severity: "success",
    });

    assert.ok(doc, "Genuine user event must be logged");
    assert.strictEqual(String(doc.userId), String(testStudent._id));
    assert.strictEqual(doc.category, "learning");

    // Attempting to log for fake/guest ID must be rejected
    const rejected = await logActivityAndBroadcast({
      userId: new mongoose.Types.ObjectId(), // Non-existent user
      type: "USER_LOGIN",
      title: "Fake Login",
    });
    assert.strictEqual(rejected, null, "Non-existent user event must be rejected");
  });

  // 8. Idempotent Backfill: Prevents duplicates
  await test("8. Backfill: Running backfillHistoricalActivities() is incremental and idempotent", async () => {
    const countBefore = await ActivityLog.countDocuments();
    const result = await backfillHistoricalActivities();
    const countAfter = await ActivityLog.countDocuments();
    assert.strictEqual(countBefore, countAfter, "Re-running backfill must not create duplicate activities");
    assert.strictEqual(result.count, 0, "No duplicate rows should be inserted");
  });

  server.close();
  await mongoose.connection.close();

  console.log("\n" + "=".repeat(80));
  console.log(`Summary: ${passed}/${total} Live Activity & Real-Time Monitoring tests passed!`);
  console.log("=".repeat(80) + "\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runLiveActivityAuditSuite().catch((err) => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
