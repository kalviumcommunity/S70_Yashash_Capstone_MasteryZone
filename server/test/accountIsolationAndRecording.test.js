const assert = require("assert");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { getJwtSecret } = require("../config/jwtConfig");
const User = require("../models/User");
const CertificationAttempt = require("../models/CertificationAttempt");
const Meeting = require("../models/Meeting");
const Recording = require("../models/Recording");
const CodingProgress = require("../models/CodingProgress");
const ModuleAssessmentAttempt = require("../models/ModuleAssessmentAttempt");
const { app } = require("../server");

let testServer;
let baseUrl;

let userA;
let tokenA;
let userB;
let tokenB;
let adminUser;
let tokenAdmin;

async function setup() {
  const mongoUri = process.env.MONGODB_URI || process.env.db_url || "mongodb://127.0.0.1:27017/masteryzone";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  }

  const secret = getJwtSecret();

  // Create User A
  userA = await User.findOne({ email: "usera_isolation@masteryzone.com" });
  if (!userA) {
    userA = await User.create({
      username: "user_a_tester",
      fullName: "User Alpha",
      email: "usera_isolation@masteryzone.com",
      password: "HashedPassword123!",
      role: "user",
    });
  }
  tokenA = jwt.sign(
    { userId: userA._id, id: userA._id, email: userA.email, role: "user" },
    secret,
    { expiresIn: "2h" }
  );

  // Create User B
  userB = await User.findOne({ email: "userb_isolation@masteryzone.com" });
  if (!userB) {
    userB = await User.create({
      username: "user_b_tester",
      fullName: "User Beta",
      email: "userb_isolation@masteryzone.com",
      password: "HashedPassword123!",
      role: "user",
    });
  }
  tokenB = jwt.sign(
    { userId: userB._id, id: userB._id, email: userB.email, role: "user" },
    secret,
    { expiresIn: "2h" }
  );

  // Admin User
  adminUser = await User.findOne({ role: "admin" });
  if (!adminUser) {
    adminUser = await User.create({
      username: "admin_iso_test",
      fullName: "Admin Isolator",
      email: "admin_iso@masteryzone.com",
      password: "HashedPassword123!",
      role: "admin",
    });
  }
  tokenAdmin = jwt.sign(
    { userId: adminUser._id, id: adminUser._id, email: adminUser.email, role: "admin" },
    secret,
    { expiresIn: "2h" }
  );

  // Start ephemeral HTTP server
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

async function runTests() {
  console.log("================================================================================");
  console.log("🛡️ Mastery Zone: Audio/Video Recording & Strict Account Data Isolation Suite");
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
    // SECTION 1: Audio and Video Meeting Recording Pipeline
    // =========================================================================
    console.log("\n--- Section 1: Meeting Video & Audio Recording Pipeline ---");

    // Valid WebM container with real EBML header [0x1A, 0x45, 0xDF, 0xA3]
    const validWebmBytes = Buffer.from([
      0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2, 0x81, 0x04,
      0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, 0x42, 0x87, 0x81, 0x04, 0x42, 0x85,
      0x81, 0x02, 0x18, 0x53, 0x80, 0x67, 0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x15, 0x49, 0xa9,
      0x66, 0x99, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00,
    ]);
    const b64WithCodecs = `data:video/webm;codecs=vp9,opus;base64,${validWebmBytes.toString("base64")}`;

    let recordingAId = "";
    let recordingAFile = "";

    await it("POST /api/recordings/upload preserves EBML container header and writes genuine video file", async () => {
      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          meetingId: "mtg_alpha_video_test",
          title: "Alpha Video Collaboration & Code Review",
          recordingType: "Meeting",
          durationSeconds: 90,
          participantNames: ["User Alpha"],
          base64Data: b64WithCodecs,
          mimeType: "video/webm;codecs=vp9,opus",
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert(data.recording && data.recording.recordingId);

      recordingAId = data.recording.recordingId;
      recordingAFile = path.basename(data.recording.fileUrl);

      // Verify file on disk exists and contains genuine WebM magic bytes (0x1A 0x45 0xDF 0xA3)
      const diskPath = path.join(__dirname, "../uploads/recordings", recordingAFile);
      assert(fs.existsSync(diskPath), "Saved file must physically exist on disk");
      const diskBytes = fs.readFileSync(diskPath);

      assert.strictEqual(diskBytes[0], 0x1a, "First byte must be EBML ID 0x1A");
      assert.strictEqual(diskBytes[1], 0x45, "Second byte must be EBML ID 0x45");
      assert.strictEqual(diskBytes[2], 0xdf, "Third byte must be EBML ID 0xDF");
      assert.strictEqual(diskBytes[3], 0xa3, "Fourth byte must be EBML ID 0xA3");
      assert.strictEqual(diskBytes.length, validWebmBytes.length, "Saved byte length must match exactly");
    });

    await it("GET /api/recordings/stream/:filename supports HTTP 206 partial streaming with video/webm type", async () => {
      const res = await fetch(`${baseUrl}/api/recordings/stream/${recordingAFile}`, {
        headers: { Range: "bytes=0-15" },
      });
      assert.strictEqual(res.status, 206, "Should return 206 Partial Content");
      assert.strictEqual(res.headers.get("accept-ranges"), "bytes");
      assert(res.headers.get("content-type").includes("video/webm"));
      assert.strictEqual(res.headers.get("content-range"), `bytes 0-15/${validWebmBytes.length}`);
    });

    // =========================================================================
    // SECTION 2: Strict Individual Account Data Isolation
    // =========================================================================
    console.log("\n--- Section 2: Strict Account Data Isolation ---");

    await it("User A saves coding track progress; User B cannot see User A's progress", async () => {
      // User A records study completion on Python module 0
      const resA = await fetch(`${baseUrl}/api/coding/curriculum/study`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          trackId: "python",
          moduleIndex: 0,
          studyTimeSeconds: 45,
        }),
      });
      assert.strictEqual(resA.status, 200);

      // User A inspects /api/coding/data -> python module 0 is studied
      const dataA = await (
        await fetch(`${baseUrl}/api/coding/data`, {
          headers: { Authorization: `Bearer ${tokenA}` },
        })
      ).json();
      assert.strictEqual(dataA.progress.userId.toString(), userA._id.toString());

      // User B inspects /api/coding/data -> User B has fresh separate progress record
      const dataB = await (
        await fetch(`${baseUrl}/api/coding/data`, {
          headers: { Authorization: `Bearer ${tokenB}` },
        })
      ).json();
      assert.strictEqual(dataB.progress.userId.toString(), userB._id.toString());
      assert.notStrictEqual(dataB.progress.userId.toString(), dataA.progress.userId.toString());
    });

    await it("User A creates a private recording; User B is strictly forbidden from viewing or streaming it", async () => {
      // User A lists recordings -> Sees recordingA
      const resA = await fetch(`${baseUrl}/api/recordings`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(resA.status, 200);
      const recsA = (await resA.json()).recordings;
      const foundInA = recsA.find((r) => r.recordingId === recordingAId);
      assert(foundInA, "User A must see their own recording");

      // User B lists recordings -> User A's recording MUST NOT appear
      const resB = await fetch(`${baseUrl}/api/recordings`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(resB.status, 200);
      const recsB = (await resB.json()).recordings;
      const foundInB = recsB.find((r) => r.recordingId === recordingAId);
      assert.strictEqual(foundInB, undefined, "User B must NEVER see User A's private recording in list");

      // User B tries to fetch User A's recording directly by ID -> 403 Forbidden
      const directB = await fetch(`${baseUrl}/api/recordings/${recordingAId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(directB.status, 403, "Direct access by unauthorized user must return 403 Forbidden");

      // Admin accesses User A's recording -> Permitted
      const directAdmin = await fetch(`${baseUrl}/api/recordings/${recordingAId}`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      assert.strictEqual(directAdmin.status, 200, "Admin must be able to view recording");
    });

    await it("User A's certification report cannot be accessed by User B (403 Forbidden)", async () => {
      const attemptId = `att_cert_iso_${Date.now()}`;
      await CertificationAttempt.create({
        userId: userA._id,
        attemptId,
        certId: "cert_dsa",
        certTitle: "DSA Certification",
        status: "PASSED",
        score: 92,
        finalVerdict: "PASSED",
        startTime: new Date(),
        selectedMcqs: [{ id: "mcq_1", question: "Binary search complexity?", answer: "O(log n)", correctAnswer: 0 }],
        proctoring: { status: "COMPLIANT", violationsCount: 0, events: [] },
      });

      // User A accesses their report -> 200 OK
      const resA = await fetch(`${baseUrl}/api/certifications/attempt/${attemptId}/report`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(resA.status, 200);
      const dataA = await resA.json();
      assert.strictEqual(dataA.report.attemptId, attemptId);

      // User B accesses User A's report -> 403 Forbidden
      const resB = await fetch(`${baseUrl}/api/certifications/attempt/${attemptId}/report`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(resB.status, 403, "User B must be rejected with 403 Forbidden");

      // Admin accesses User A's report -> 200 OK
      const resAdmin = await fetch(`${baseUrl}/api/certifications/attempt/${attemptId}/report`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      assert.strictEqual(resAdmin.status, 200);
    });

    await it("User A's MCQ assessment attempt report cannot be accessed by User B (403 Forbidden)", async () => {
      const mcqAttempt = await ModuleAssessmentAttempt.create({
        userId: userA._id,
        subjectKey: "coding",
        trackId: "python",
        moduleIndex: 1,
        moduleTitle: "Control Flow",
        score: 9,
        totalQuestions: 10,
        totalMarks: 10,
        percentage: 90,
        passed: true,
        userAnswers: { 0: 1, 1: 2 },
      });

      // User A accesses their MCQ report -> 200 OK
      const resA = await fetch(`${baseUrl}/api/curriculum/assessment-attempt/${mcqAttempt._id}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(resA.status, 200);

      // User B accesses User A's MCQ report -> 403 Forbidden
      const resB = await fetch(`${baseUrl}/api/curriculum/assessment-attempt/${mcqAttempt._id}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(resB.status, 403, "User B must be rejected from viewing User A's MCQ attempt");
    });

    await it("User B cannot inject notifications into User A's inbox via req.body.userId", async () => {
      // User B tries to send a notification targeting User A
      const resSpoof = await fetch(`${baseUrl}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({
          userId: userA._id.toString(),
          title: "Spoofed Alert",
          message: "You have been compromised!",
        }),
      });
      assert.strictEqual(resSpoof.status, 201);
      const dataSpoof = await resSpoof.json();

      // The notification MUST belong to User B (caller identity), NOT User A!
      assert.strictEqual(
        dataSpoof.notification.userId.toString(),
        userB._id.toString(),
        "Non-admin cannot target another user's inbox"
      );

      // Verify User A's notifications does not contain the spoofed alert
      const resA = await fetch(`${baseUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const notifsA = (await resA.json()).notifications;
      const foundSpoof = notifsA.find((n) => n.title === "Spoofed Alert");
      assert.strictEqual(foundSpoof, undefined, "User A's inbox must not receive the spoofed alert");
    });

    await it("Shared meeting recording allows both Host (User A) and Participant (User B) access", async () => {
      // User A creates a meeting with User B as participant
      const meetingId = `mtg_shared_${Date.now()}`;
      await Meeting.create({
        meetingId,
        title: "Shared Pair Programming Session",
        hostUserId: userA._id.toString(),
        participants: [
          { userId: userA._id, fullName: userA.fullName, email: userA.email },
          { userId: userB._id, fullName: userB.fullName, email: userB.email },
        ],
        status: "ended",
      });

      // User A uploads recording of this meeting
      const resUp = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          meetingId,
          title: "Shared Pair Programming Session — Collaboration",
          recordingType: "Meeting",
          durationSeconds: 150,
          participantNames: [userA.fullName, userB.fullName],
          base64Data: b64WithCodecs,
        }),
      });
      assert.strictEqual(resUp.status, 201);
      const recId = (await resUp.json()).recording.recordingId;

      // Both User A and User B can access the recording
      const getA = await fetch(`${baseUrl}/api/recordings/${recId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(getA.status, 200, "Host User A must be able to view shared recording");

      const getB = await fetch(`${baseUrl}/api/recordings/${recId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(getB.status, 200, "Registered participant User B must be able to view shared recording");

      // Verify Admin also sees the recording in Admin Portal
      const getAdmin = await fetch(`${baseUrl}/api/admin/recordings`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      assert.strictEqual(getAdmin.status, 200);
      const adminRecs = (await getAdmin.json()).recordings;
      const foundAdmin = adminRecs.find((r) => r.recordingId === recId);
      assert(foundAdmin, "Admin must be able to view all meeting recordings");
      assert.strictEqual(foundAdmin.hostName, userA.fullName);
    });

  } finally {
    await teardown();
  }

  console.log("\n================================================================================");
  console.log(`Summary: ${passed}/${total} account isolation & recording tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log("================================================================================");

  process.exit(passed === total ? 0 : 1);
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
