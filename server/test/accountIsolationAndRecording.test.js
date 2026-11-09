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
const { app, server } = require("../server");

let testServer;
let baseUrl;

let userA;
let tokenA;
let userB;
let tokenB;
let adminUser;
let tokenAdmin;
const createdFiles = [];

async function setup() {
  const mongoUri = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/masteryzone";
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    } catch {
      await mongoose.connect("mongodb://127.0.0.1:27017/masteryzone", { serverSelectionTimeoutMS: 3000 });
    }
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

  // Pre-create Alpha test meeting so it genuinely exists for upload verification
  await Meeting.deleteMany({ meetingId: "mtg_alpha_video_test" });
  await Meeting.create({
    meetingId: "mtg_alpha_video_test",
    title: "Alpha Video Collaboration & Code Review",
    hostUserId: userA._id.toString(),
    participants: [
      { userId: userA._id, fullName: userA.fullName, email: userA.email },
    ],
    status: "active",
  });

  // Start ephemeral HTTP server with Socket.IO attached
  await new Promise((resolve) => {
    testServer = server.listen(0, () => {
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
  for (const f of createdFiles) {
    const diskPath = path.join(__dirname, "../uploads/recordings", f);
    if (fs.existsSync(diskPath)) {
      try { fs.unlinkSync(diskPath); } catch (e) {}
    }
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
    const headerBytes = [
      0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2, 0x81, 0x04,
      0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, 0x42, 0x87, 0x81, 0x04, 0x42, 0x85,
      0x81, 0x02, 0x18, 0x53, 0x80, 0x67, 0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x15, 0x49, 0xa9,
      0x66, 0x99, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00,
    ];
    const validWebmBytes = Buffer.concat([
      Buffer.from(headerBytes),
      Buffer.alloc(512 - headerBytes.length, 0x00),
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
      createdFiles.push(recordingAFile);

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
        headers: {
          Range: "bytes=0-15",
          Authorization: `Bearer ${tokenA}`,
        },
      });
      assert.strictEqual(res.status, 206, "Should return 206 Partial Content");
      assert.strictEqual(res.headers.get("accept-ranges"), "bytes");
      assert(res.headers.get("content-type").includes("video/webm"));
      assert.strictEqual(res.headers.get("content-range"), `bytes 0-15/${validWebmBytes.length}`);
    });

    await it("Unauthenticated request to GET /api/recordings/stream/:filename returns 401 Unauthorized", async () => {
      const res = await fetch(`${baseUrl}/api/recordings/stream/${recordingAFile}`, {
        headers: { Range: "bytes=0-15" },
      });
      assert.strictEqual(res.status, 401, "Unauthenticated stream request must return 401");
    });

    await it("User B attempting to stream User A's private recording returns 403 Forbidden", async () => {
      const res = await fetch(`${baseUrl}/api/recordings/stream/${recordingAFile}`, {
        headers: {
          Range: "bytes=0-15",
          Authorization: `Bearer ${tokenB}`,
        },
      });
      assert.strictEqual(res.status, 403, "User B must not be permitted to stream User A's recording");
    });

    await it("User B cannot view or join User A's private meeting (returns 403 Forbidden)", async () => {
      // User A creates a private meeting
      const resCreate = await fetch(`${baseUrl}/api/meetings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          title: "Alpha Confidential Strategy Meeting",
          isPrivate: true,
          scheduledStartTime: new Date(),
        }),
      });
      assert.strictEqual(resCreate.status, 201);
      const dataM = await resCreate.json();
      const privateMeetingId = dataM.meeting.meetingId;

      // User B tries to view private meeting details -> 403 Forbidden
      const resGet = await fetch(`${baseUrl}/api/meetings/${privateMeetingId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(resGet.status, 403, "User B must receive 403 Forbidden for private meeting info");

      // User B tries to join private meeting -> 403 Forbidden
      const resJoin = await fetch(`${baseUrl}/api/meetings/${privateMeetingId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({
          role: "attendee",
        }),
      });
      assert.strictEqual(resJoin.status, 403, "User B must receive 403 Forbidden when attempting to join private meeting");

      // User B tries to upload recording against User A's private meeting -> 403 Forbidden
      const resFakeUpload = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({
          meetingId: privateMeetingId,
          title: "Hijacked Recording",
          base64Data: b64WithCodecs,
        }),
      });
      assert.strictEqual(resFakeUpload.status, 403, "User B must NOT be allowed to upload a recording for User A's meeting");
    });

    await it("User B cannot delete User A's private recording (returns 403 Forbidden)", async () => {
      const resDel = await fetch(`${baseUrl}/api/recordings/${recordingAId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(resDel.status, 403, "User B must be rejected when attempting to delete User A's recording");
    });

    await it("Socket.IO: User B cannot join User A's support ticket room (ticket_auth_error emitted)", async () => {
      const SupportTicket = require("../models/SupportTicket");
      const ticket = await SupportTicket.create({
        ticketId: `tkt_iso_${Date.now()}`,
        userId: userA._id,
        userEmail: userA.email,
        userName: userA.fullName,
        subject: "Isolation Private Technical Inquiry",
        description: "Secret ticket body contents",
        category: "Other Technical Issues",
        priority: "High",
      });

      const { io: ioClient } = require("socket.io-client");
      const socketB = ioClient(baseUrl, {
        auth: { token: tokenB },
        transports: ["websocket"],
      });

      await new Promise((resolve, reject) => {
        socketB.on("connect", () => {
          socketB.emit("join_ticket_room", { ticketId: ticket.ticketId });
        });
        socketB.on("ticket_auth_error", (errData) => {
          assert(errData && errData.message);
          socketB.disconnect();
          resolve();
        });
        socketB.on("ticket_room_joined", () => {
          socketB.disconnect();
          reject(new Error("User B should NOT have been allowed to join User A's ticket room!"));
        });
        setTimeout(() => {
          socketB.disconnect();
          reject(new Error("Timeout waiting for socket response"));
        }, 5000);
      });
    });

    await it("Socket.IO: Authenticated identity switch leaves previous user's private room", async () => {
      const { io: ioClient } = require("socket.io-client");
      const clientSocket = ioClient(baseUrl, {
        auth: { token: tokenA },
        transports: ["websocket"],
      });

      let receivedForA = false;

      await new Promise((resolve, reject) => {
        clientSocket.on("connect", () => {
          clientSocket.on("NEW_NOTIFICATION", (notif) => {
            if (notif.title === "User A Private Alert") {
              receivedForA = true;
            }
          });

          // Switch socket identity to User B using tokenB
          clientSocket.emit("register_user_session", { token: tokenB });

          setTimeout(async () => {
            // Push notification specifically to User A's room
            const { pushNotification } = require("../utils/notificationService");
            await pushNotification(app.get("io"), {
              userId: userA._id,
              title: "User A Private Alert",
              message: "Confidential message for User A",
            });

            setTimeout(() => {
              clientSocket.disconnect();
              assert.strictEqual(receivedForA, false, "Socket switched to User B must NOT receive notifications sent to User A");
              resolve();
            }, 600);
          }, 400);
        });

        setTimeout(() => {
          clientSocket.disconnect();
          reject(new Error("Timeout in socket identity switch test"));
        }, 5000);
      });
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
      const upData = await resUp.json();
      const recId = upData.recording.recordingId;
      if (upData.recording.fileUrl) {
        createdFiles.push(path.basename(upData.recording.fileUrl));
      }

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

    await it("Unauthorized or invalid meeting upload leaves NO orphaned files on disk", async () => {
      const recDir = path.join(__dirname, "../uploads/recordings");
      const filesBefore = fs.existsSync(recDir) ? fs.readdirSync(recDir) : [];

      const resInvalid = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          meetingId: "mtg_nonexistent_orphaned_check",
          title: "Ghost Meeting Recording Attempt",
          recordingType: "Meeting",
          durationSeconds: 30,
          base64Data: b64WithCodecs,
        }),
      });

      assert.strictEqual(resInvalid.status, 404, "Upload for nonexistent meeting must return 404");
      const filesAfter = fs.existsSync(recDir) ? fs.readdirSync(recDir) : [];
      assert.strictEqual(filesAfter.length, filesBefore.length, "No orphaned files must be written on rejected uploads");
    });

    await it("Personal bookmarks are strictly isolated (User B cannot read User A's private notes)", async () => {
      // User A adds a personal bookmark to recording A
      const bmRes = await fetch(`${baseUrl}/api/recordings/${recordingAId}/bookmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          timestampSeconds: 42,
          note: "User A confidential interview notes",
        }),
      });
      assert.strictEqual(bmRes.status, 200);

      // User A fetches recording -> Sees their bookmark
      const getA = await fetch(`${baseUrl}/api/recordings/${recordingAId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const recA = (await getA.json()).recording;
      const foundA = (recA.bookmarks || []).find((b) => b.note === "User A confidential interview notes");
      assert(foundA, "User A must see their own bookmark");

      // Shared meeting recording where User B is participant
      const sharedRec = await Recording.findOne({ meetingId: { $regex: /^mtg_shared_/ } });
      if (sharedRec) {
        // User A adds personal bookmark to shared recording
        await fetch(`${baseUrl}/api/recordings/${sharedRec.recordingId}/bookmarks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenA}`,
          },
          body: JSON.stringify({
            timestampSeconds: 15,
            note: "Host private performance note on User B",
          }),
        });

        // User B views the shared recording -> User A's bookmark MUST be excluded
        const getB = await fetch(`${baseUrl}/api/recordings/${sharedRec.recordingId}`, {
          headers: { Authorization: `Bearer ${tokenB}` },
        });
        const recB = (await getB.json()).recording;
        const leakedNote = (recB.bookmarks || []).find((b) => b.note === "Host private performance note on User B");
        assert.strictEqual(leakedNote, undefined, "User B must never see User A's personal bookmark");
      }
    });

    await it("Media validation rejects fake or corrupted video payloads", async () => {
      const fakeVideoBuffer = Buffer.from("NOT_A_REAL_VIDEO_HEADER_JUST_TEXT_DATA".repeat(20));
      const fakeB64 = `data:video/webm;base64,${fakeVideoBuffer.toString("base64")}`;

      const resFake = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          meetingId: "mtg_alpha_video_test",
          title: "Corrupted Payload Test",
          recordingType: "Meeting",
          durationSeconds: 10,
          base64Data: fakeB64,
        }),
      });

      assert.strictEqual(resFake.status, 400, "Corrupted video payload must be rejected with 400");
    });

    await it("WebRTC cross-meeting signaling is blocked between disparate meetings", async () => {
      const { io: ClientIO } = require("socket.io-client");

      const sock1 = ClientIO(baseUrl, {
        auth: { token: tokenA },
        transports: ["websocket"],
      });
      const sock2 = ClientIO(baseUrl, {
        auth: { token: tokenB },
        transports: ["websocket"],
      });

      await new Promise((resolve) => {
        let connected = 0;
        const check = () => { if (++connected === 2) resolve(); };
        sock1.on("connect", check);
        sock2.on("connect", check);
      });

      // Socket 1 joins meeting alpha
      sock1.emit("join_meeting", {
        meetingId: "mtg_alpha_video_test",
        user: { fullName: "User Alpha", id: userA._id },
      });

      // Socket 2 joins a completely different meeting
      const mtgBetaId = `mtg_beta_${Date.now()}`;
      await Meeting.create({
        meetingId: mtgBetaId,
        title: "Beta Disparate Meeting",
        hostUserId: userB._id.toString(),
        participants: [{ userId: userB._id, fullName: userB.fullName }],
        status: "active",
      });

      sock2.emit("join_meeting", {
        meetingId: mtgBetaId,
        user: { fullName: "User Beta", id: userB._id },
      });

      // Allow joins to complete
      await new Promise((r) => setTimeout(r, 200));

      let crossSignalReceived = false;
      sock2.on("webrtc_offer_received", () => {
        crossSignalReceived = true;
      });

      // Socket 1 maliciously attempts to signal Socket 2 across meeting rooms
      sock1.emit("webrtc_offer", {
        targetSocketId: sock2.id,
        offer: { type: "offer", sdp: "dummy" },
        meetingId: "mtg_alpha_video_test",
      });

      await new Promise((r) => setTimeout(r, 200));
      assert.strictEqual(crossSignalReceived, false, "Cross-meeting WebRTC signaling must be blocked");

      sock1.disconnect();
      sock2.disconnect();
    });

    await it("Certificate download requires authentication and strictly prevents cross-user access (401/403)", async () => {
      const IssuedCertificate = require("../models/IssuedCertificate");
      const certId = `MZ-DSA-TEST-${Date.now()}`;
      await IssuedCertificate.create({
        certificateId: certId,
        attemptId: `att_${Date.now()}`,
        userId: userA._id,
        recipientName: userA.fullName,
        certificationId: "cert_dsa",
        certificationTitle: "Data Structures & Algorithms",
        issueDate: new Date(),
        mcqScore: 20,
        mcqScorePercentage: 100,
        codingScore: "2/2 Challenges Passed",
        finalGradePercentage: 100,
        verificationUrl: `https://masteryzone.com/verify/${certId}`,
        status: "VALID",
      });

      // 1. Unauthenticated request -> 401
      const resUnauth = await fetch(`${baseUrl}/api/certifications/certificate/${certId}/download`);
      assert.strictEqual(resUnauth.status, 401, "Unauthenticated download must return 401");

      // 2. User B requests User A's certificate -> 403 Forbidden
      const resUserB = await fetch(`${baseUrl}/api/certifications/certificate/${certId}/download`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(resUserB.status, 403, "User B must be rejected with 403 Forbidden");

      // 3. User A requests their own certificate -> Permitted (200 OK)
      const resUserA = await fetch(`${baseUrl}/api/certifications/certificate/${certId}/download`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(resUserA.status, 200, "Owner User A must be allowed to download certificate");
    });

    await it("Proctoring evidence route strictly blocks cross-user access (401/403)", async () => {
      // Create confidential snapshot linked to User A's attempt
      const attemptWithEvidence = `att_ev_${Date.now()}`;
      await CertificationAttempt.create({
        userId: userA._id,
        attemptId: attemptWithEvidence,
        certId: "cert_dsa",
        certTitle: "DSA Exam",
        status: "IN_PROGRESS",
        proctoring: {
          status: "COMPLIANT",
          violationsCount: 0,
          snapshots: ["snapshot_userA_confidential.jpg"],
        },
      });

      // 1. Unauthenticated request to /proctoring-evidence -> 401
      const resUnauth = await fetch(`${baseUrl}/proctoring-evidence/snapshot_userA_confidential.jpg`);
      assert.strictEqual(resUnauth.status, 401, "Unauthenticated evidence access must return 401");

      // 2. User B requests evidence belonging to User A's attempt -> 403 Forbidden
      const resUserB = await fetch(`${baseUrl}/proctoring-evidence/snapshot_userA_confidential.jpg`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(resUserB.status, 403, "User B must be blocked with 403 Forbidden");
    });

    await it("Certification finalization re-evaluates modified code and refuses to inherit old test results", async () => {
      const attemptId = `att_cert_reeval_${Date.now()}`;
      await CertificationAttempt.create({
        userId: userA._id,
        attemptId,
        certId: "cert_dsa",
        certTitle: "DSA Certification",
        status: "IN_PROGRESS",
        candidateName: userA.fullName,
        candidateEmail: userA.email,
        selectedMcqs: Array.from({ length: 20 }, (_, i) => ({ id: `mcq_${i}`, question: `Q${i}`, answer: "A", correctAnswer: 0 })),
        mcqAnswers: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [String(i), 0])),
        selectedCodingQuestions: [
          {
            questionId: "q_1",
            title: "Sum Two Numbers",
            publicTests: [{ input: "1 2", expectedOutput: "3" }],
            hiddenTests: [{ input: "5 5", expectedOutput: "10" }],
          },
        ],
        codingSubmissions: [
          {
            questionId: "q_1",
            code: "def solve(a, b): return a + b",
            solved: true,
            passedTests: 2,
            totalTests: 2,
            submittedAt: new Date(Date.now() - 60000),
          },
        ],
        proctoring: { status: "COMPLIANT", violationsCount: 0 },
      });

      // User A submits different broken code in finalize payload: "broken code"
      const resFin = await fetch(`${baseUrl}/api/certifications/attempt/${attemptId}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          codingSubmissions: [
            {
              questionId: "q_1",
              code: "def solve(a, b): return -9999", // Intentional wrong code
              language: "python",
            },
          ],
        }),
      });

      assert.strictEqual(resFin.status, 200);
      const finData = await resFin.json();

      // Check updated attempt: passedTests must NOT remain 2!
      const updated = await CertificationAttempt.findOne({ attemptId });
      assert.notStrictEqual(updated.codingSubmissions[0].passedTests, 2, "Replaced code must not inherit previous 100% passed tests");
      assert.strictEqual(updated.codingSubmissions[0].solved, false, "Broken code must not be marked solved");
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
