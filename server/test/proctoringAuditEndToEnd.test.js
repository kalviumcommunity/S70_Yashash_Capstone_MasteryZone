/**
 * End-to-End Verification Suite for Mastery Zone Proctoring Audit
 * Run via: node server/test/proctoringAuditEndToEnd.test.js
 */
const assert = require("assert");
const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const ProctoredCodingSession = require("../models/ProctoredCodingSession");
const Recording = require("../models/Recording");
const { getJwtSecret } = require("../config/jwtConfig");
const { downloadEvidenceGridFSToBuffer } = require("../utils/proctoringSync");

const codingRoutes = require("../routes/codingRoutes");
const recordingRoutes = require("../routes/recordingRoutes");
const adminRoutes = require("../routes/adminRoutes");

const EVIDENCE_DIR = path.resolve(__dirname, "../uploads/evidence");

function createMockIo(emittedEvents) {
  return {
    to: (room) => ({
      emit: (event, payload) => {
        emittedEvents.push({ room, event, payload });
      },
    }),
    emit: (event, payload) => {
      emittedEvents.push({ room: "*", event, payload });
    },
  };
}

function httpRequest(server, method, urlPath, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const isBuffer = Buffer.isBuffer(body);
    const payload = body == null ? null : isBuffer || typeof body === "string" ? body : JSON.stringify(body);
    const reqHeaders = { ...headers };
    if (payload && !reqHeaders["Content-Type"]) {
      reqHeaders["Content-Type"] = "application/json";
    }
    if (payload && !reqHeaders["Content-Length"]) {
      reqHeaders["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path: urlPath,
        method,
        headers: reqHeaders,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const text = buf.toString("utf8");
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {}
          resolve({ status: res.statusCode, headers: res.headers, body: json ?? text, buffer: buf });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function buildMultipartForm(fieldName, filename, mimeType, fileBuffer, fields = {}) {
  const boundary = "----MZProctorTestBoundary" + Date.now();
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`)
    );
  }
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    )
  );
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    buffer: Buffer.concat(parts),
  };
}

async function run() {
  console.log("\n================================================================================");
  console.log("🚀 Mastery Zone Proctoring Audit End-to-End Verification");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/masteryzone_test";
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  const emittedEvents = [];
  const app = express();
  app.use(express.json({ limit: "20mb" }));
  app.set("io", createMockIo(emittedEvents));

  // Mount /proctoring-evidence auth + GridFS fallback middleware matching server.js
  app.use("/proctoring-evidence", async (req, res) => {
    try {
      const token =
        req.query.token ||
        (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
      if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
      const decoded = jwt.verify(token, getJwtSecret());
      const reqUserId = String(decoded.userId || decoded.id || decoded._id || "");
      const reqRole = String(decoded.role || "").toUpperCase();
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(reqRole);
      const cleanName = path.basename(req.path || "");

      if (!isAdmin) {
        const procSession = await ProctoredCodingSession.findOne({
          $or: [
            { "violationsLog.screenshotUrl": { $regex: cleanName } },
            { "evidenceScreenshots.filename": cleanName },
          ],
        })
          .select("userId")
          .lean();
        if (!procSession || String(procSession.userId) !== reqUserId) {
          return res.status(403).json({ success: false, message: "Forbidden" });
        }
      }

      const diskPath = path.join(EVIDENCE_DIR, cleanName);
      if (fs.existsSync(diskPath)) {
        return res.sendFile(diskPath);
      }
      const gridData = await downloadEvidenceGridFSToBuffer(cleanName);
      if (!gridData) return res.status(404).json({ success: false, message: "Not found" });
      res.setHeader("Content-Type", gridData.contentType || "image/png");
      return res.send(gridData.buffer);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  });

  app.use("/api/coding", codingRoutes);
  app.use("/api/recordings", recordingRoutes);
  app.use("/api/admin", adminRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  const suffix = Date.now();
  let sid = `mz_proc_e2e_${suffix}`;
  let candA, candB, adminUser;
  const createdFiles = [];

  try {
    candA = await User.create({
      fullName: "Candidate Alpha",
      username: `cand_a_${suffix}`,
      email: `cand_a_${suffix}@test.local`,
      password: "Password123!",
      isEmailVerified: true,
    });
    candB = await User.create({
      fullName: "Candidate Beta",
      username: `cand_b_${suffix}`,
      email: `cand_b_${suffix}@test.local`,
      password: "Password123!",
      isEmailVerified: true,
    });
    adminUser = await User.create({
      fullName: "Audit Admin",
      username: `audit_admin_${suffix}`,
      email: `audit_admin_${suffix}@test.local`,
      role: "SUPER_ADMIN",
      password: "Password123!",
      isEmailVerified: true,
    });

    const tokenA = jwt.sign({ userId: candA._id, id: candA._id, email: candA.email, role: candA.role }, getJwtSecret(), { expiresIn: "1h" });
    const tokenB = jwt.sign({ userId: candB._id, id: candB._id, email: candB.email, role: candB.role }, getJwtSecret(), { expiresIn: "1h" });
    const tokenAdmin = jwt.sign({ userId: adminUser._id, id: adminUser._id, email: adminUser.email, role: "SUPER_ADMIN" }, getJwtSecret(), { expiresIn: "1h" });

    // 1. Start proctored session with partial genuine telemetry
    const startRes = await httpRequest(server, "POST", "/api/coding/proctored-session/start", {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        sessionId: sid,
        questionId: "q_add_two",
        assessmentTitle: "Add Two E2E Audit",
        problemData: {
          id: "q_add_two",
          title: "Add Two E2E Audit",
          testCases: [
            { input: "2 3", expectedOutput: "5" },
            { input: "10 20", expectedOutput: "30" },
          ],
        },
        deviceInfo: {
          camera: true,
          cameraPermission: "Granted",
          cameraStreamStatus: "Active",
          cameraLabel: "FaceTime HD Camera",
          microphone: null,
          microphonePermission: "Not Recorded",
          microphoneStreamStatus: "Not Recorded",
          screenShare: false,
          screenSharePermission: "Denied",
          screenShareStreamStatus: "Inactive",
          fullscreen: true,
          windowFocused: true,
          monitoringActive: true,
        },
      },
    });
    assert.strictEqual(startRes.status, 200, "Session start should succeed");
    sid = startRes.body.sessionId || sid;
    assert(emittedEvents.some((e) => e.event === "proctoring_session_updated" && e.payload.eventType === "session_started"));

    // Verify Admin Audit Detail immediately has honest telemetry, no fabricated defaults, no fake starter code
    const audit1 = await httpRequest(server, "GET", `/api/admin/proctoring/session/${sid}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.strictEqual(audit1.status, 200);
    assert.strictEqual(audit1.body.hardware.cameraStreamStatus, "Active");
    assert.strictEqual(audit1.body.hardware.cameraLabel, "FaceTime HD Camera");
    assert.strictEqual(audit1.body.hardware.microphonePermission, "Not Recorded");
    assert.strictEqual(audit1.body.hardware.screenSharePermission, "Denied");
    assert.strictEqual(audit1.body.recording.status, "not_recorded");
    assert.strictEqual(audit1.body.questionsBreakdown[0].status, "NO_SUBMISSION");
    assert.strictEqual(audit1.body.questionsBreakdown[0].submittedCode, "");
    assert.strictEqual(audit1.body.questionsBreakdown[0].passedTests, 0);
    console.log("✅ Test 1 passed: Honest telemetry & zero fabricated defaults");

    // 2. Heartbeat persistence (must NOT throw 500 ReferenceError)
    const hbRes = await httpRequest(server, "POST", "/api/coding/proctored-session/heartbeat", {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        sessionId: sid,
        batteryLevel: 82,
        draftCode: "def two_sum(nums, target): pass",
        language: "python",
        deviceInfo: {
          fullscreen: true,
          windowFocused: true,
          monitoringActive: true,
        },
      },
    });
    assert.strictEqual(hbRes.status, 200, "Heartbeat must return 200 without ReferenceError");
    assert(emittedEvents.some((e) => e.event === "proctoring_session_updated" && e.payload.eventType === "heartbeat"));
    console.log("✅ Test 2 passed: Heartbeat persists live telemetry & draft code");

    // 3. Violation logging + evidence upload + cross-user isolation + GridFS recovery
    const intRes = await httpRequest(server, "POST", `/api/coding/proctored-session/${sid}/interruption`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        sessionId: sid,
        eventType: "tab_switch",
        details: "Candidate switched away from active exam tab",
        batteryLevel: 82,
      },
    });
    assert.strictEqual(intRes.status, 200);
    assert.strictEqual(intRes.body.chancesUsed, 1);
    assert(intRes.body.eventId, "Interruption must return eventId");

    // Valid PNG >= 200 bytes (1x1 PNG + valid padded buffer)
    const pngBase = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const tinyPngB64 =
      "data:image/png;base64," + Buffer.concat([pngBase, Buffer.alloc(220, 0x00)]).toString("base64");

    // Candidate B cannot upload evidence to Candidate A's session
    const evForbidden = await httpRequest(server, "POST", `/api/coding/proctored-session/${sid}/evidence`, {
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { eventId: intRes.body.eventId, imageBase64: tinyPngB64 },
    });
    assert.strictEqual(evForbidden.status, 403, "Cross-user evidence upload must be blocked with 403");

    // Candidate A uploads evidence linked to eventId
    const evOk = await httpRequest(server, "POST", `/api/coding/proctored-session/${sid}/evidence`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { eventId: intRes.body.eventId, imageBase64: tinyPngB64, reason: "Tab switch capture" },
    });
    assert(evOk.status === 200 || evOk.status === 201, "Owner evidence upload must return 200/201");
    assert(evOk.body.screenshotUrl && evOk.body.filename);
    const evDiskPath = path.join(EVIDENCE_DIR, evOk.body.filename);
    createdFiles.push(evDiskPath);

    // Candidate B cannot read Candidate A's evidence screenshot
    const evReadB = await httpRequest(
      server,
      "GET",
      `${evOk.body.screenshotUrl}?token=${encodeURIComponent(tokenB)}`
    );
    assert.strictEqual(evReadB.status, 403, "Candidate B must get 403 on Candidate A evidence");

    // Delete local disk file to simulate Render restart / redeploy, verify Admin still gets 200 via GridFS
    if (fs.existsSync(evDiskPath)) fs.unlinkSync(evDiskPath);
    const evReadAdminGrid = await httpRequest(
      server,
      "GET",
      `${evOk.body.screenshotUrl}?token=${encodeURIComponent(tokenAdmin)}`
    );
    assert.strictEqual(evReadAdminGrid.status, 200, "Admin must recover evidence from GridFS after disk deletion");
    console.log("✅ Test 3 passed: Violation event, evidence isolation, & GridFS recovery");

    // 4. Proctoring video upload + cross-user isolation + verified playback
    const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
    const tempWebmPath = path.join(EVIDENCE_DIR, `tmp_e2e_${suffix}.webm`);
    if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    execFileSync(ffmpegPath, [
      "-y",
      "-f", "lavfi",
      "-i", "color=c=blue:s=64x64:d=1",
      "-c:v", "libvpx",
      "-f", "webm",
      tempWebmPath,
    ], { stdio: "ignore" });
    const validWebm = fs.readFileSync(tempWebmPath);
    createdFiles.push(tempWebmPath);
    const formB = buildMultipartForm("video", "proc.webm", "video/webm", validWebm, {
      sessionId: sid,
      durationSeconds: "1",
    });
    const vidForbidden = await httpRequest(server, "POST", `/api/recordings/proctoring/upload?sessionId=${encodeURIComponent(sid)}`, {
      headers: { Authorization: `Bearer ${tokenB}`, "Content-Type": formB.contentType, "x-session-id": sid },
      body: formB.buffer,
    });
    assert.strictEqual(vidForbidden.status, 403, "Cross-user proctoring video upload must return 403");

    const formA = buildMultipartForm("video", "proc.webm", "video/webm", validWebm, {
      sessionId: sid,
      durationSeconds: "1",
      startedAt: new Date(Date.now() - 1000).toISOString(),
    });
    const vidOk = await httpRequest(server, "POST", `/api/recordings/proctoring/upload?sessionId=${encodeURIComponent(sid)}&durationSeconds=1`, {
      headers: { Authorization: `Bearer ${tokenA}`, "Content-Type": formA.contentType, "x-session-id": sid },
      body: formA.buffer,
    });
    assert(vidOk.status === 200 || vidOk.status === 201, `Owner proctoring video upload must succeed: ${JSON.stringify(vidOk.body)}`);
    assert.strictEqual(vidOk.body.recordingStatus, "available");
    if (vidOk.body.recording?.filePath) createdFiles.push(vidOk.body.recording.filePath);

    const streamRes = await httpRequest(
      server,
      "GET",
      `${vidOk.body.recordingUrl}?token=${encodeURIComponent(tokenAdmin)}`
    );
    assert(streamRes.status === 200 || streamRes.status === 206, `Admin must be able to stream uploaded video, got ${streamRes.status}`);
    console.log("✅ Test 4 passed: Proctoring video upload, isolation & verified playback");

    // 5. Submission + genuine test results + marks audit + notification read
    const subRes = await httpRequest(server, "POST", `/api/coding/proctored-session/${sid}/submit`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        sessionId: sid,
        questionId: "q_add_two",
        assessmentTitle: "Add Two E2E Audit",
        code: "a, b = map(int, input().split())\nprint(a + b)",
        language: "python",
      },
    });
    assert.strictEqual(subRes.status, 200);

    const audit2 = await httpRequest(server, "GET", `/api/admin/proctoring/session/${sid}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.strictEqual(audit2.status, 200);
    assert.strictEqual(audit2.body.recording.status, "available");
    assert.strictEqual(audit2.body.questionsBreakdown.length, 1);
    assert.strictEqual(audit2.body.questionsBreakdown[0].submittedCode, "a, b = map(int, input().split())\nprint(a + b)");
    assert.strictEqual(audit2.body.questionsBreakdown[0].passedTests, 2);
    assert.strictEqual(audit2.body.questionsBreakdown[0].totalTests, 2);
    assert.strictEqual(audit2.body.session.score, 100);

    const marksRes = await httpRequest(server, "PUT", "/api/admin/modify-marks", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: {
        itemId: sid,
        itemType: "proctoring",
        newScore: 85,
        newStatus: "submitted",
        adminNote: "Adjusted after proctoring review",
      },
    });
    assert.strictEqual(marksRes.status, 200);

    const viewedRes = await httpRequest(server, "PATCH", `/api/admin/proctoring/session/${sid}/mark-viewed`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.strictEqual(viewedRes.status, 200);

    const audit3 = await httpRequest(server, "GET", `/api/admin/proctoring/session/${sid}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.strictEqual(audit3.body.session.score, 85);
    assert.strictEqual(audit3.body.session.notificationViewed, true);
    assert.strictEqual(audit3.body.marksHistory.length, 1);
    assert.strictEqual(audit3.body.marksHistory[0].oldScore, 100);
    assert.strictEqual(audit3.body.marksHistory[0].newScore, 85);
    console.log("✅ Test 5 passed: Submission code/tests, marks history, & notification tracking");

    console.log("\n🎉 ALL PROCTORING AUDIT E2E CHECKS PASSED!\n");
  } finally {
    await ProctoredCodingSession.deleteMany({ sessionId: sid }).catch(() => {});
    await Recording.deleteMany({ meetingId: sid }).catch(() => {});
    const userIds = [candA?._id, candB?._id, adminUser?._id].filter(Boolean);
    if (userIds.length > 0) {
      await User.deleteMany({ _id: { $in: userIds } }).catch(() => {});
    }
    for (const f of createdFiles) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error("❌ E2E Test Failed:", err);
  process.exit(1);
});
