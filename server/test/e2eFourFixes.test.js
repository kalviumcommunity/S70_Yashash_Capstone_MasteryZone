const assert = require("assert");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const http = require("http");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { getJwtSecret } = require("../config/jwtConfig");
const User = require("../models/User");
const CertificationAttempt = require("../models/CertificationAttempt");
const Meeting = require("../models/Meeting");
const Recording = require("../models/Recording");
const { app } = require("../server");

let testServer;
let baseUrl;
let testUser;
let testUserToken;
let adminUser;
let adminToken;

async function setup() {
  const mongoUri = process.env.TEST_MONGODB_URI;
  if (!mongoUri) {
    console.error("FATAL: TEST_MONGODB_URI is required to run tests safely. Tests will not run against production or development database.");
    process.exit(1);
  }
  const appDb = process.env.MONGODB_URI || process.env.db_url;
  if (appDb && mongoUri.trim() === appDb.trim()) {
    console.error("FATAL: TEST_MONGODB_URI cannot point to the application production/development database!");
    process.exit(1);
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  }

  // Find or create test user
  testUser = await User.findOne({ email: "testcandidate@masteryzone.test" });
  if (!testUser) {
    testUser = await User.create({
      username: "testcandidate",
      fullName: "Test Candidate",
      email: "testcandidate@masteryzone.test",
      password: "HashedPassword123!",
      role: "user",
    });
  }

  // Find or create admin user
  adminUser = await User.findOne({ role: "admin" });
  if (!adminUser) {
    adminUser = await User.create({
      username: "superadmin_test",
      fullName: "Admin Tester",
      email: "admintester@masteryzone.test",
      password: "HashedPassword123!",
      role: "admin",
    });
  }

  const secret = getJwtSecret();
  testUserToken = jwt.sign(
    { userId: testUser._id, id: testUser._id, email: testUser.email, role: testUser.role || "user" },
    secret,
    { expiresIn: "2h" }
  );

  adminToken = jwt.sign(
    { userId: adminUser._id, id: adminUser._id, email: adminUser.email, role: "admin" },
    secret,
    { expiresIn: "2h" }
  );

  // Start test HTTP server on random port
  await new Promise((resolve) => {
    testServer = app.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function teardown() {
  if (testServer) {
    await new Promise((resolve) => testServer.close(resolve));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

async function runAllTests() {
  console.log("================================================================================");
  console.log("🧪 Mastery Zone 4-Pillar Comprehensive Integration Verification");
  console.log("================================================================================");

  let passed = 0;
  let total = 0;

  async function it(title, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${title}`);
      console.error(`     Reason: ${err.message}`);
    }
  }

  try {
    await setup();

    // =========================================================================
    // PILLAR 1: Certification Page Loading Optimization
    // =========================================================================
    console.log("\n--- Pillar 1: Certification Loading & History Optimization ---");

    await it("CertificationAttempt model defines compound index on { userId: 1, createdAt: -1 }", async () => {
      const indexes = CertificationAttempt.schema.indexes();
      const hasCompoundIndex = indexes.some(
        ([fields]) => fields && fields.userId === 1 && fields.createdAt === -1
      );
      assert(hasCompoundIndex, "Missing compound index { userId: 1, createdAt: -1 } in schema");
    });

    await it("GET /api/certifications/my-history returns optimized lean summary with pagination", async () => {
      // Seed a test attempt if needed
      await CertificationAttempt.create({
        userId: testUser._id,
        attemptId: `att_test_${Date.now()}`,
        certId: "cert_fullstack",
        certTitle: "Full Stack Web Developer Certification",
        attemptNumber: 1,
        status: "PASSED",
        percentage: 95,
        score: 95,
        mcqScore: 50,
        mcqPassed: true,
        finalVerdict: "PASSED",
        startTime: new Date(),
        submittedAt: new Date(),
        selectedMcqs: [{ id: "mcq_1", question: "Heavy question block that must NOT be returned in summary", answer: "A", correctAnswer: 0 }],
        proctoring: { status: "COMPLIANT", violationsCount: 0, events: [] },
      });

      // Warm-up query
      await fetch(`${baseUrl}/api/certifications/my-history?page=1&limit=1`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      const start = Date.now();
      const res = await fetch(`${baseUrl}/api/certifications/my-history?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const duration = Date.now() - start;

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert(Array.isArray(data.attempts), "attempts should be array");
      assert(Array.isArray(data.certificates), "certificates should be array");
      assert(data.pagination, "pagination object should be present");
      assert.strictEqual(data.pagination.page, 1);
      assert.strictEqual(data.pagination.limit, 5);

      // Verify projection: selectedMcqs was excluded from lean summary
      const sample = data.attempts[0];
      assert(sample, "Should have returned seeded attempt");
      assert.strictEqual(sample.selectedMcqs, undefined, "Heavy selectedMcqs must NOT be included in summary response");
      assert(duration < 500, `API response should be fast (took ${duration}ms)`);
    });

    // =========================================================================
    // PILLAR 2: Proctoring Tab-Switch Detection and Interruption Warning
    // =========================================================================
    console.log("\n--- Pillar 2: Proctoring Tab-Switch Detection & Telemetry ---");

    await it("Proctoring proctoring-event endpoint deduplicates rapid tab-switch events within 5000ms", async () => {
      const attemptId = `att_proctor_${Date.now()}`;
      await CertificationAttempt.create({
        userId: testUser._id,
        attemptId,
        certId: "cert_python",
        certTitle: "Python Developer Certification",
        status: "IN_PROGRESS",
        startTime: new Date(),
        proctoring: { status: "COMPLIANT", violationsCount: 0, events: [] },
      });

      // Rapidly fire Event 1 (tab_switch)
      const res1 = await fetch(`${baseUrl}/api/certifications/attempt/${attemptId}/proctoring-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          eventType: "tab_switch",
          description: "Student switched browser tabs",
          timestamp: new Date().toISOString(),
        }),
      });
      const data1 = await res1.json();
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(data1.violationsCount, 1, "First tab switch event should count 1 violation");
      assert.strictEqual(data1.chancesRemaining, 4, "Chances remaining should be 4 (5 - 1)");

      // Immediately fire Event 2 (duplicate tab_switch within 500ms)
      const res2 = await fetch(`${baseUrl}/api/certifications/attempt/${attemptId}/proctoring-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          eventType: "tab_switch",
          description: "Window blur / duplicate tab switch",
          timestamp: new Date().toISOString(),
        }),
      });
      const data2 = await res2.json();
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(data2.deduplicated, true, "Rapid successive event should be marked deduplicated");
      assert.strictEqual(data2.violationsCount, 1, "Violation count must NOT increment twice on single tab switch");
      assert.strictEqual(data2.chancesRemaining, 4, "Chances remaining must stay 4");

      // Verify database record has exactly 1 proctoring event entry
      const updatedAttempt = await CertificationAttempt.findOne({ attemptId }).lean();
      assert.strictEqual(updatedAttempt.proctoring.violationsCount, 1);
      assert.strictEqual(updatedAttempt.proctoring.events.length, 1);
    });

    // =========================================================================
    // PILLAR 3: Meeting Link Joining
    // =========================================================================
    console.log("\n--- Pillar 3: Meeting Link Workflow & Joining ---");

    await it("GET /api/meetings/:id rejects invalid meeting ID with 404 and does not create fake meetings", async () => {
      const bogusId = "invalid-bogus-uuid-9999";
      const res = await fetch(`${baseUrl}/api/meetings/${bogusId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      assert.strictEqual(res.status, 404, "Invalid meeting ID must return 404");
      const data = await res.json();
      assert(data.message.includes("Meeting not found"), "Should give clear meeting not found error");

      // Verify no meeting was auto-created in database
      const count = await Meeting.countDocuments({ meetingId: bogusId });
      assert.strictEqual(count, 0, "Non-existent meeting must never be auto-created");
    });

    let liveMeetingId = "";
    await it("POST /api/meetings/create creates a valid meeting accessible by meeting link", async () => {
      const res = await fetch(`${baseUrl}/api/meetings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          title: "System Integration Architecture Review",
          description: "Testing link join and recording workflow",
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert(data.meeting && data.meeting.meetingId, "Must return created meeting with meetingId");
      liveMeetingId = data.meeting.meetingId;
    });

    await it("GET /api/meetings/:meetingId retrieves correct meeting and join link", async () => {
      const res = await fetch(`${baseUrl}/api/meetings/${liveMeetingId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.meeting.meetingId, liveMeetingId);
      assert.strictEqual(data.meeting.title, "System Integration Architecture Review");
      assert.strictEqual(data.isEnded, false);
    });

    await it("POST /api/meetings/:meetingId/join registers candidate in meeting participants", async () => {
      const res = await fetch(`${baseUrl}/api/meetings/${liveMeetingId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({}),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.meeting.meetingId, liveMeetingId);

      // Verify participant list in DB includes test candidate
      const meetingInDb = await Meeting.findOne({ meetingId: liveMeetingId }).lean();
      const isParticipant = meetingInDb.participants.some(
        (p) => String(p.userId) === String(testUser._id)
      );
      assert(isParticipant, "Test candidate should be registered in meeting participants");
    });

    await it("Concluded meeting returns isEnded: true when joining via meeting link", async () => {
      await Meeting.updateOne({ meetingId: liveMeetingId }, { status: "ended", isEnded: true, endedAt: new Date() });

      const res = await fetch(`${baseUrl}/api/meetings/${liveMeetingId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.isEnded, true, "Meeting link should indicate session has concluded");
    });

    // =========================================================================
    // PILLAR 4: Real-Time Meeting Video Recording
    // =========================================================================
    console.log("\n--- Pillar 4: Meeting Video Recording, Upload, and Playback ---");

    const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
    const { execFileSync } = require("child_process");

    function generatePlayableWebmBuffer(duration = 1) {
      const tmpFile = path.join(__dirname, `tmp_playable_e2e_${Date.now()}_${Math.random().toString(36).slice(2)}.webm`);
      execFileSync(
        ffmpegInstaller.path,
        [
          "-y",
          "-f", "lavfi", "-i", `testsrc=duration=${duration}:size=320x240:rate=10`,
          "-f", "lavfi", "-i", `sine=frequency=1000:duration=${duration}`,
          "-c:v", "libvpx",
          "-c:a", "libvorbis",
          tmpFile,
        ],
        { stdio: "ignore" }
      );
      const buf = fs.readFileSync(tmpFile);
      try { fs.unlinkSync(tmpFile); } catch {}
      return buf;
    }

    const sampleWebmBytes = generatePlayableWebmBuffer(1);
    const sampleBase64 = `data:video/webm;base64,${sampleWebmBytes.toString("base64")}`;
    let savedRecordingObj = null;

    await it("POST /api/recordings/upload saves genuine video file to storage and creates database record", async () => {
      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          meetingId: liveMeetingId,
          title: "System Integration Architecture Review — Collaboration",
          recordingType: "Meeting",
          durationSeconds: 120,
          participantNames: ["Test Candidate", "Admin Tester"],
          base64Data: sampleBase64,
          mimeType: "video/webm",
          hostUserId: testUser._id,
          hostName: testUser.fullName,
          hostEmail: testUser.email,
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert(data.recording && data.recording._id, "Recording record should be created");
      savedRecordingObj = data.recording;

      assert(savedRecordingObj.streamUrl, "Must include streamUrl");
      assert(savedRecordingObj.fileUrl, "Must include fileUrl");
      assert.strictEqual(savedRecordingObj.status, "ready");

      // Verify file actually exists on server filesystem
      const uploadsDir = path.join(__dirname, "../uploads/recordings");
      const fileName = path.basename(savedRecordingObj.fileUrl);
      const filePath = path.join(uploadsDir, fileName);
      assert(fs.existsSync(filePath), `Physical recording file must exist on disk at ${filePath}`);
      const diskSize = fs.statSync(filePath).size;
      assert.strictEqual(diskSize, sampleWebmBytes.length, "File on disk must match recorded bytes exactly");
    });

    await it("GET /api/recordings/stream/:filename streams video with range request headers", async () => {
      const fileName = path.basename(savedRecordingObj.fileUrl);

      // Test byte-range request
      const res = await fetch(`${baseUrl}/api/recordings/stream/${fileName}`, {
        headers: {
          Range: "bytes=0-20",
          Authorization: `Bearer ${testUserToken}`,
        },
      });
      assert.strictEqual(res.status, 206, "Range request should return 206 Partial Content");
      assert.strictEqual(res.headers.get("accept-ranges"), "bytes");
      assert(res.headers.get("content-type").includes("video/webm"));
      assert.strictEqual(res.headers.get("content-range"), `bytes 0-20/${sampleWebmBytes.length}`);

      const chunk = await res.arrayBuffer();
      assert.strictEqual(chunk.byteLength, 21);
    });

    await it("GET /api/recordings returns candidate's recorded meetings for Home -> Recordings tab", async () => {
      const res = await fetch(`${baseUrl}/api/recordings`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.recordings), "recordings must be an array");
      const found = data.recordings.find((r) => r.recordingId === savedRecordingObj.recordingId);
      assert(found, "Saved recording must appear in user's Recordings list");
      assert.strictEqual(found.title, savedRecordingObj.title);
      assert.strictEqual(found.durationSeconds, 120);
    });

    await it("GET /api/admin/recordings returns recordings for Admin Portal", async () => {
      const res = await fetch(`${baseUrl}/api/admin/recordings`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.recordings), "admin recordings must be an array");
      const found = data.recordings.find((r) => r.recordingId === savedRecordingObj.recordingId || String(r._id) === String(savedRecordingObj._id));
      assert(found, "Admin portal must list the new recording");
      assert.strictEqual(found.hostName, "Test Candidate");
    });

  } finally {
    await teardown();
  }

  console.log("\n================================================================================");
  console.log(`Summary: ${passed}/${total} integration tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log("================================================================================");

  process.exit(passed === total ? 0 : 1);
}

runAllTests().catch((err) => {
  console.error("Unhandled test suite exception:", err);
  process.exit(1);
});
