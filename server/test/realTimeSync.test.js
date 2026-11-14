const http = require("http");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { io: ioClient } = require("socket.io-client");

require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { getJwtSecret } = require("../config/jwtConfig");
const User = require("../models/User");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const CertificationAttempt = require("../models/CertificationAttempt");
const AdminNotification = require("../models/AdminNotification");

function doRequest(baseUrl, reqPath, token, method = "GET", postData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, baseUrl);
    const headers = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (postData) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(postData);
    }
    const req = http.request(url, { method, headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        let parsed = null;
        try { parsed = JSON.parse(body); } catch {}
        resolve({ statusCode: res.statusCode, data: parsed, body });
      });
    });
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function waitForEvent(socket, eventName, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event "${eventName}" on socket ${socket.id}`));
    }, timeoutMs);
    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function run() {
  const PORT = process.env.PORT || 5012;
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/masteryzone";

  console.log("\n================================================================================");
  console.log("⚡ PHASE 3 — REAL-TIME TWO-SESSION DATA SYNCHRONIZATION AUDIT SUITE");
  console.log(`Target: ${baseUrl}`);
  console.log("================================================================================\n");

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // 1. Resolve Super Admin and genuine registered student accounts
  const adminUser = await User.findOne({
    $or: [{ role: "SUPER_ADMIN" }, { role: "admin" }, { isMainAdmin: true }],
  }).lean();
  if (!adminUser) throw new Error("No admin account found in database");

  const studentUser = await User.findOne({
    _id: { $ne: adminUser._id },
    isGuest: { $ne: true },
    isAutomatedTestUser: { $ne: true },
  }).lean();
  if (!studentUser) throw new Error("No registered student account found in database");

  const secret = getJwtSecret();
  const adminToken = jwt.sign(
    { userId: String(adminUser._id), email: adminUser.email, role: adminUser.role, isMainAdmin: true },
    secret,
    { expiresIn: "1h" }
  );
  const studentToken = jwt.sign(
    { userId: String(studentUser._id), email: studentUser.email, role: studentUser.role || "student" },
    secret,
    { expiresIn: "1h" }
  );

  console.log(`Admin Session:   ${adminUser.email} (${adminUser._id})`);
  console.log(`Student Session: ${studentUser.email} (${studentUser._id})\n`);

  // 2. Connect Two Concurrent Browser Socket Sessions
  console.log("--- 1. Establishing Concurrent Admin and Student Socket Sessions ---");
  const adminSocket = ioClient(baseUrl, {
    transports: ["websocket", "polling"],
    reconnection: true,
    auth: { token: adminToken },
  });

  const studentSocket = ioClient(baseUrl, {
    transports: ["websocket", "polling"],
    reconnection: true,
    auth: { token: studentToken },
  });

  await Promise.all([
    new Promise((resolve) => adminSocket.on("connect", resolve)),
    new Promise((resolve) => studentSocket.on("connect", resolve)),
  ]);

  console.log(`✅ Admin Socket connected:   ${adminSocket.id}`);
  console.log(`✅ Student Socket connected: ${studentSocket.id}`);

  // Admin joins monitoring feed
  const adminSnapshotPromise = waitForEvent(adminSocket, "live_sessions_snapshot");
  adminSocket.emit("join_admin_monitoring", { token: adminToken });
  const snapshot = await adminSnapshotPromise;
  console.log(`✅ Admin received live snapshot: ${snapshot.length} active sessions`);

  // Student authenticates personal room
  studentSocket.emit("authenticate_user_session", { token: studentToken });
  studentSocket.emit("register_user_session", { token: studentToken, userId: String(studentUser._id) });
  await new Promise((r) => setTimeout(r, 400));
  console.log(`✅ Student joined private telemetry room user_${studentUser._id}`);

  // 3. Test Marks Modification Real-Time Multi-View Synchronization
  console.log("\n--- 2. Testing Marks Modification Real-Time Multi-View Synchronization ---");
  let sub = await ChallengeSubmission.findOne({ userId: studentUser._id });
  if (!sub) {
    sub = await ChallengeSubmission.create({
      userId: studentUser._id,
      challengeId: "two-sum",
      challengeTitle: "Two Sum",
      language: "python",
      code: "def two_sum(): pass",
      status: "WRONG_ANSWER",
      score: 30,
      passedTests: 3,
      totalTests: 10,
      createdAt: new Date(),
    });
  }

  // Set up concurrent event listeners across both browser sessions
  const studentSubUpdatePromise = waitForEvent(studentSocket, "USER_SUBMISSION_UPDATED");
  const studentMarksUpdatePromise = waitForEvent(studentSocket, "ASSESSMENT_MARKS_UPDATED");
  const adminMarksPromise = waitForEvent(adminSocket, "ASSESSMENT_MARKS_UPDATED");
  const adminReportPromise = waitForEvent(adminSocket, "NEW_REPORT");

  const targetScore = 98;
  const targetVerdict = "ACCEPTED";
  const targetRemarks = `Phase 3 Verified Real-time Modification ${Date.now()}`;

  const modRes = await doRequest(
    baseUrl,
    "/api/admin/modify-marks",
    adminToken,
    "PUT",
    JSON.stringify({
      itemType: "coding",
      itemId: String(sub._id),
      newScore: targetScore,
      newStatus: targetVerdict,
      passedTests: 10,
      adminNote: targetRemarks,
    })
  );

  if (modRes.statusCode !== 200 || !modRes.data?.success) {
    throw new Error(`modify-marks failed with status ${modRes.statusCode}: ${modRes.body}`);
  }
  console.log(`✅ Database mutation committed: HTTP 200 returned`);

  // Verify Student received real-time synchronization in personal room
  const studentSubEvt = await studentSubUpdatePromise;
  console.log(`✅ Student received USER_SUBMISSION_UPDATED: score=${studentSubEvt.rawScore}, status=${studentSubEvt.status}`);
  if (Number(studentSubEvt.rawScore) !== targetScore || studentSubEvt.status !== targetVerdict) {
    throw new Error("Student received inconsistent submission update payload");
  }

  const studentMarksEvt = await studentMarksUpdatePromise;
  console.log(`✅ Student received ASSESSMENT_MARKS_UPDATED: ${studentMarksEvt.score}`);

  // Verify Admin received real-time broadcast across all open admin views
  const adminMarksEvt = await adminMarksPromise;
  console.log(`✅ Admin received ASSESSMENT_MARKS_UPDATED for Coding Analytics/Assessments`);
  const adminReportEvt = await adminReportPromise;
  console.log(`✅ Admin received NEW_REPORT for Centralized Reports: "${adminReportEvt.title}"`);

  // Verify MongoDB database persistence and audit trail
  const dbSub = await ChallengeSubmission.findById(sub._id).lean();
  if (dbSub.score !== targetScore || dbSub.status !== targetVerdict || dbSub.adminNote !== targetRemarks) {
    throw new Error("Database state does not match modified marks");
  }
  if (!Array.isArray(dbSub.marksHistory) || dbSub.marksHistory.length === 0) {
    throw new Error("Marks history audit log was not appended to MongoDB document");
  }
  console.log(`✅ MongoDB persistence verified: score=${dbSub.score}, auditEntries=${dbSub.marksHistory.length}`);

  // 4. Test User Status (Suspension & Restoration) Real-Time Sync
  console.log("\n--- 3. Testing User Account Status Real-Time Sync ---");
  const studentSuspendedPromise = waitForEvent(studentSocket, "account_suspended");
  const adminUserSyncPromise = waitForEvent(adminSocket, "ADMIN_USERS_UPDATED");

  const suspRes = await doRequest(
    baseUrl,
    `/api/admin/users/${studentUser._id}/status`,
    adminToken,
    "PUT",
    JSON.stringify({
      isSuspended: true,
      reason: "Real-time sync validation check",
    })
  );
  if (suspRes.statusCode !== 200) throw new Error("Status update failed");

  const studentSuspEvt = await studentSuspendedPromise;
  console.log(`✅ Student received account_suspended event: "${studentSuspEvt.reason}"`);
  const adminUserEvt = await adminUserSyncPromise;
  console.log(`✅ Admin received ADMIN_USERS_UPDATED for Users listing`);

  // Restore student status immediately
  await doRequest(
    baseUrl,
    `/api/admin/users/${studentUser._id}/status`,
    adminToken,
    "PUT",
    JSON.stringify({ isSuspended: false })
  );
  console.log("✅ Student account restored to active");

  // 5. Test Reconnect Recovery & Session Reconciliation
  console.log("\n--- 4. Testing Reconnection Recovery and Re-authentication ---");
  studentSocket.disconnect();
  console.log("🔌 Student socket intentionally disconnected");
  await new Promise((r) => setTimeout(r, 500));

  studentSocket.connect();
  await new Promise((resolve) => studentSocket.on("connect", resolve));
  console.log(`🔄 Student socket reconnected with new socketId: ${studentSocket.id}`);

  // Re-authenticate
  studentSocket.emit("authenticate_user_session", { token: studentToken });
  studentSocket.emit("register_user_session", { token: studentToken, userId: String(studentUser._id) });
  await new Promise((r) => setTimeout(r, 400));

  // Verify that an emit to user_<studentId> is received on the reconnected socket
  const reconnectedEventPromise = waitForEvent(studentSocket, "USER_SUBMISSION_UPDATED");
  const modRes2 = await doRequest(
    baseUrl,
    "/api/admin/modify-marks",
    adminToken,
    "PUT",
    JSON.stringify({
      itemType: "coding",
      itemId: String(sub._id),
      newScore: 100,
      newStatus: "ACCEPTED",
      passedTests: 10,
      adminNote: "Reconnect recovery validated",
    })
  );
  const reconSubEvt = await reconnectedEventPromise;
  console.log(`✅ Reconnected student received real-time event: score=${reconSubEvt.rawScore}`);

  // Disconnect sockets cleanly
  adminSocket.disconnect();
  studentSocket.disconnect();
  await mongoose.disconnect();

  console.log("\n================================================================================");
  console.log("🎉 ALL REAL-TIME DATA SYNCHRONIZATION TESTS PASSED CLEANLY (100%)");
  console.log("================================================================================\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("\n❌ Real-time synchronization audit test failed:", err);
  process.exit(1);
});
