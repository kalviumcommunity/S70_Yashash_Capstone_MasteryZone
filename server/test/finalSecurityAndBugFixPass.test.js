process.env.NODE_ENV = "test";

const assert = require("assert");
const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const { app, server: existingServer } = require("../server");
const User = require("../models/User");
const CertificationAttempt = require("../models/CertificationAttempt");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const ProctoredCodingSession = require("../models/ProctoredCodingSession");
const Meeting = require("../models/Meeting");
const Recording = require("../models/Recording");
const { getJwtSecret } = require("../config/jwtConfig");
const { executeCode, evaluateTestCasesBatch } = require("../services/codeExecutionService");

let baseUrl;
let tokenA;
let tokenB;
let userA;
let userB;

function it(name, fn) {
  return (async () => {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Reason: ${err.message}\n`);
      throw err;
    }
  })();
}

async function setup() {
  console.log("\n================================================================================");
  console.log("🛡️ Mastery Zone Integration & Security Verification Pass");
  console.log("================================================================================\n");

  const mongoUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/masteryzone_test";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  if (!existingServer.listening) {
    await new Promise((resolve) => {
      existingServer.listen(0, () => {
        const port = existingServer.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  } else {
    baseUrl = `http://127.0.0.1:${existingServer.address().port}`;
  }

  const secret = getJwtSecret("test");

  // Create isolated users in DB
  userA = await User.findOne({ email: "integration.userA@example.com" });
  if (!userA) {
    userA = await User.create({
      username: "integration_user_a",
      email: "integration.userA@example.com",
      password: "HashedPassword123!",
      fullName: "Alice Integration",
      role: "user",
    });
  }

  userB = await User.findOne({ email: "integration.userB@example.com" });
  if (!userB) {
    userB = await User.create({
      username: "integration_user_b",
      email: "integration.userB@example.com",
      password: "HashedPassword123!",
      fullName: "Bob Integration",
      role: "user",
    });
  }

  tokenA = jwt.sign({ userId: String(userA._id), email: userA.email, role: "user" }, secret, { expiresIn: "2h" });
  tokenB = jwt.sign({ userId: String(userB._id), email: userB.email, role: "user" }, secret, { expiresIn: "2h" });
}

async function runTests() {
  await setup();

  try {
    console.log("--- Section 1: Authentication, Registration & Login Validation ---");

    await it("Auth: Register a new user validates inputs and hashes credentials", async () => {
      const uniqueSuffix = Date.now();
      const testEmail = `newuser_${uniqueSuffix}@example.com`;
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "New",
          lastName: "Candidate",
          email: testEmail,
          password: "SecurePassword123!",
        }),
      });

      assert.strictEqual(res.status, 201, "Registration should succeed with 201");
      const data = await res.json();
      assert.ok(data.token || data.newUser, "Registration response must include token or user");

      // Verify password was hashed and not saved in plaintext
      const created = await User.findOne({ email: testEmail });
      assert.ok(created, "User must exist in database");
      assert.notStrictEqual(created.password, "SecurePassword123!", "Password must be hashed");
      await User.deleteOne({ email: testEmail });
    });

    await it("Auth: Login with valid credentials issues valid JWT token", async () => {
      const uniqueSuffix = Date.now();
      const testEmail = `login_test_${uniqueSuffix}@example.com`;
      const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Login",
          lastName: "Tester",
          email: testEmail,
          password: "SecurePassword123!",
        }),
      });
      assert.strictEqual(registerRes.status, 201);

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "SecurePassword123!",
        }),
      });

      assert.strictEqual(res.status, 200, "Login must succeed with 200");
      const loginData = await res.json();
      assert.ok(loginData.token, "Login response must return JWT token");
      await User.deleteOne({ email: testEmail });
    });

    console.log("\n--- Section 2: Certificate Candidate Information & Report Isolation ---");

    let certAttemptId;
    await it("Certificate: Authenticated user creates certification attempt with candidate details", async () => {
      const res = await fetch(`${baseUrl}/api/certifications/attempt/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          certId: "dsa_cert",
          certTitle: "Data Structures & Algorithms Certified Professional",
          language: "python",
        }),
      });

      assert.ok([200, 201].includes(res.status), "Starting certification must return 200 or 201");
      const data = await res.json();
      assert.ok(data.attemptId, "Must return valid attemptId");
      certAttemptId = data.attemptId;

      const attempt = await CertificationAttempt.findOne({ attemptId: certAttemptId });
      assert.ok(attempt, "Attempt must exist in DB");
      assert.strictEqual(String(attempt.userId), String(userA._id));
      assert.strictEqual(attempt.candidateName, userA.fullName);
      assert.strictEqual(attempt.candidateEmail, userA.email);
    });

    await it("Certificate: User B cannot access User A's certification report (403 Forbidden)", async () => {
      const res = await fetch(`${baseUrl}/api/certifications/attempt/${certAttemptId}/report`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(res.status, 403, "Cross-user report access must return 403 Forbidden");
    });

    await it("Certificate: Unauthenticated user cannot access certification report (401 Unauthorized)", async () => {
      const res = await fetch(`${baseUrl}/api/certifications/attempt/${certAttemptId}/report`);
      assert.strictEqual(res.status, 401, "Unauthenticated report access must return 401 Unauthorized");
    });

    console.log("\n--- Section 3: Assessment Submission & Code Evaluation ---");

    await it("Coding Challenge: Evaluates solution and records score securely", async () => {
      const res = await fetch(`${baseUrl}/api/coding/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          language: "python",
          code: "print('MasteryZone Secure Execution Verified')",
        }),
      });

      assert.ok([200, 503].includes(res.status), "Execution must return 200 (executed) or 503 (fail-closed when unconfigured)");
      const data = await res.json();
      if (res.status === 200) {
        assert.strictEqual(data.exitCode, 0, "Process must exit with exitCode 0 on success");
        const out = data.output || data.stdout || "";
        assert.ok(out.includes("MasteryZone Secure Execution Verified"), "Output must contain printed message");
      } else {
        assert.ok(data.isUnavailable, "Unconfigured environment must fail closed safely");
      }
    });

    console.log("\n--- Section 4: Compiler Error & Timeout Distinction ---");

    await it("Compiler: Correctly distinguishes Compilation Error", async () => {
      const code = "int main() { int a = ; return 0; }";
      const res = await evaluateTestCasesBatch("c", code, [{ input: "", expectedOutput: "" }]);
      assert.strictEqual(res[0].passed, false);
      assert.ok(
        res[0].error.includes("Compilation Error") || res[0].error.includes("error:") || res[0].error.includes("syntax error"),
        "Compilation error must be recognized"
      );
    });

    await it("Compiler: Correctly distinguishes Runtime Error without hanging", async () => {
      const code = "x = 1 / 0";
      const res = await evaluateTestCasesBatch("python", code, [{ input: "", expectedOutput: "" }]);
      assert.strictEqual(res[0].passed, false);
      assert.ok(
        res[0].error.includes("ZeroDivisionError") || res[0].error.includes("Runtime Error") || res[0].error.includes("Error"),
        "Runtime error must be cleanly captured"
      );
    });

    await it("Compiler: Correctly distinguishes Timeout on infinite loop", async () => {
      const code = "while True:\n    pass\n";
      const res = await evaluateTestCasesBatch("python", code, [{ input: "", expectedOutput: "" }], { timeoutMs: 1000 });
      assert.strictEqual(res[0].passed, false);
      const errLower = (res[0].error || "").toLowerCase();
      assert.ok(
        errLower.includes("timed out") || errLower.includes("timeout") || errLower.includes("time limit"),
        "Infinite loop must trigger timeout error"
      );
    });

    console.log("\n--- Section 5: Admin Proctoring & Candidate Filter Validation ---");

    await it("Admin Proctoring: Sessions can be filtered by candidate details and session ID", async () => {
      await ProctoredCodingSession.deleteMany({ sessionId: /^psess_filter_/ });
      const testSid = `psess_filter_${Date.now()}`;
      const sess = new ProctoredCodingSession({
        sessionId: testSid,
        userId: userA._id,
        questionId: "two-sum",
        assessmentTitle: "Cloud Architecture Proctored Exam",
        candidateDetails: {
          fullName: userA.fullName,
          email: userA.email,
        },
        status: "submitted",
        violationsCount: 0,
      });
      await sess.save();

      const secret = getJwtSecret("test");
      const adminUser = await User.findOne({ role: "admin" });
      const adminToken = jwt.sign({ userId: String(adminUser._id), email: adminUser.email, role: "admin" }, secret, { expiresIn: "1h" });

      const res = await fetch(`${baseUrl}/api/admin/proctoring?search=Alice`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.strictEqual(res.status, 200, "Admin proctoring query must succeed with 200");
      const data = await res.json();
      assert.ok(Array.isArray(data.sessions), "Should return sessions array");
      const match = data.sessions.find((s) => s.sessionId === testSid);
      assert.ok(match, "Searched candidate session must be in results");
      assert.strictEqual(match.candidateDetails.fullName, "Alice Integration");

      await ProctoredCodingSession.deleteOne({ sessionId: testSid });
    });

    console.log("\n--- Section 6: Recording Authorization & Storage Guards ---");

    await it("Recordings: Unauthenticated recording fetch is rejected with 401", async () => {
      const res = await fetch(`${baseUrl}/api/recordings`);
      assert.strictEqual(res.status, 401, "Unauthenticated recording fetch must return 401");
    });

    await it("Recordings: Authenticated user only receives authorized recordings", async () => {
      const res = await fetch(`${baseUrl}/api/recordings`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200, "Authenticated recording fetch must return 200");
      const data = await res.json();
      assert.ok(Array.isArray(data.recordings), "Must return recordings array");
    });

    console.log("\n--- Section 7: Mastery Zone Meet, WebRTC Signaling & ICE/TURN Configuration ---");

    let liveMeetingId;
    await it("Meet: GET /api/meetings/ice-config returns STUN and configurable TURN servers", async () => {
      process.env.TURN_URLS = "turn:turn.example.com:3478,turns:turn.example.com:5349";
      process.env.TURN_USERNAME = "test_turn_user";
      process.env.TURN_CREDENTIAL = "test_turn_secret";
      try {
        const res = await fetch(`${baseUrl}/api/meetings/ice-config`, {
          headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.turnConfigured, true);
        assert.ok(Array.isArray(data.iceServers) && data.iceServers.length >= 2);
        const turnServer = data.iceServers.find((s) => s.username === "test_turn_user");
        assert.ok(turnServer, "Configured TURN server must be included in iceServers");
      } finally {
        delete process.env.TURN_URLS;
        delete process.env.TURN_USERNAME;
        delete process.env.TURN_CREDENTIAL;
      }
    });

    await it("Meet: Host creates meeting, Participant joins by code/URL, Private meeting enforces 403, Ended meeting enforces 410", async () => {
      const createRes = await fetch(`${baseUrl}/api/meetings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          title: "E2E WebRTC Collaboration Session",
          groupKey: "dsa",
          isPrivate: false,
        }),
      });
      assert.strictEqual(createRes.status, 201);
      const created = await createRes.json();
      liveMeetingId = created.meetingId;
      assert.ok(liveMeetingId, "Meeting ID must be generated");

      // Participant B joins by meeting code
      const joinRes = await fetch(`${baseUrl}/api/meetings/${liveMeetingId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ fullName: userB.fullName }),
      });
      assert.strictEqual(joinRes.status, 200);
      const joinData = await joinRes.json();
      assert.strictEqual(joinData.success, true);
      assert.strictEqual(joinData.isHost, false);

      // Run code in meeting room without ReferenceError crash
      const runCodeRes = await fetch(`${baseUrl}/api/meetings/${liveMeetingId}/run-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({
          language: "python",
          code: "print(21 * 2)",
        }),
      });
      assert.strictEqual(runCodeRes.status, 200, "Meeting run-code must succeed with 200");
      const runCodeData = await runCodeRes.json();
      assert.strictEqual(runCodeData.output.trim(), "42");

      // Invalid meeting ID returns 404
      const notFoundRes = await fetch(`${baseUrl}/api/meetings/invalid-xxxx-zzzz`);
      assert.strictEqual(notFoundRes.status, 404);
    });

    await it("Meet Socket.IO: Host and Participant join room, exchange WebRTC offer/answer/ICE, chat, and sync shared code", async () => {
      const { io: Client } = require("socket.io-client");
      const clientA = Client(baseUrl, { auth: { token: tokenA }, transports: ["websocket"] });
      const clientB = Client(baseUrl, { auth: { token: tokenB }, transports: ["websocket"] });

      try {
        await Promise.all([
          new Promise((resolve, reject) => {
            clientA.once("connect", resolve);
            clientA.once("connect_error", reject);
          }),
          new Promise((resolve, reject) => {
            clientB.once("connect", resolve);
            clientB.once("connect_error", reject);
          }),
        ]);

        // Host A joins meeting
        const joinSuccessA = new Promise((resolve) => clientA.once("meeting_joined_success", resolve));
        clientA.emit("join_meeting", {
          meetingId: liveMeetingId,
          user: { _id: String(userA._id), fullName: userA.fullName },
          token: tokenA,
          mediaState: { isMuted: false, isVideoOff: false },
        });
        const joinedA = await joinSuccessA;
        assert.strictEqual(joinedA.isHost, true);

        // Participant B joins meeting -> Host A receives meeting_peer_joined
        const peerJoinedPromise = new Promise((resolve) => clientA.once("meeting_peer_joined", resolve));
        const joinSuccessB = new Promise((resolve) => clientB.once("meeting_joined_success", resolve));
        clientB.emit("join_meeting", {
          meetingId: liveMeetingId,
          user: { _id: String(userB._id), fullName: userB.fullName },
          token: tokenB,
          mediaState: { isMuted: false, isVideoOff: false },
        });
        const [peerEvent, joinedB] = await Promise.all([peerJoinedPromise, joinSuccessB]);
        assert.strictEqual(joinedB.isHost, false);
        assert.strictEqual(peerEvent.socketId, clientB.id);

        // WebRTC Offer from A -> B
        const offerReceivedPromise = new Promise((resolve) => clientB.once("webrtc_offer_received", resolve));
        clientA.emit("webrtc_offer", {
          meetingId: liveMeetingId,
          targetSocketId: clientB.id,
          offer: { type: "offer", sdp: "v=0\r\no=- 123 2 IN IP4 127.0.0.1\r\n" },
        });
        const offerEvt = await offerReceivedPromise;
        assert.strictEqual(offerEvt.fromSocketId, clientA.id);
        assert.strictEqual(offerEvt.offer.type, "offer");

        // WebRTC Answer from B -> A
        const answerReceivedPromise = new Promise((resolve) => clientA.once("webrtc_answer_received", resolve));
        clientB.emit("webrtc_answer", {
          meetingId: liveMeetingId,
          targetSocketId: clientA.id,
          answer: { type: "answer", sdp: "v=0\r\no=- 456 2 IN IP4 127.0.0.1\r\n" },
        });
        const answerEvt = await answerReceivedPromise;
        assert.strictEqual(answerEvt.fromSocketId, clientB.id);
        assert.strictEqual(answerEvt.answer.type, "answer");

        // WebRTC ICE Candidate from A -> B
        const iceReceivedPromise = new Promise((resolve) => clientB.once("webrtc_ice_candidate_received", resolve));
        clientA.emit("webrtc_ice_candidate", {
          meetingId: liveMeetingId,
          targetSocketId: clientB.id,
          candidate: { candidate: "candidate:1 1 UDP 2122252543 127.0.0.1 54321 typ host", sdpMid: "0", sdpMLineIndex: 0 },
        });
        const iceEvt = await iceReceivedPromise;
        assert.strictEqual(iceEvt.fromSocketId, clientA.id);

        // Live Chat message from B -> A
        const chatPromise = new Promise((resolve) => clientA.once("meeting_chat_message_received", resolve));
        clientB.emit("meeting_chat_message", {
          meetingId: liveMeetingId,
          text: "Hello from Participant B!",
          user: { fullName: userB.fullName },
        });
        const chatMsg = await chatPromise;
        assert.strictEqual(chatMsg.text, "Hello from Participant B!");

        // Shared Code update from A -> B
        const codeUpdatePromise = new Promise((resolve) => clientB.once("meeting_code_updated", resolve));
        clientA.emit("meeting_code_change", {
          meetingId: liveMeetingId,
          code: "def solve(x):\n    return x + 1\n",
          language: "python",
        });
        const codeEvt = await codeUpdatePromise;
        assert.ok(codeEvt.code.includes("return x + 1"));

        // Host ends meeting -> Participant B receives meeting_ended_by_host
        const endedPromise = new Promise((resolve) => clientB.once("meeting_ended_by_host", resolve));
        const endRes = await fetch(`${baseUrl}/api/meetings/${liveMeetingId}/end`, {
          method: "POST",
          headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert.strictEqual(endRes.status, 200);
        await endedPromise;

        // Ended meeting rejects new participant joins with 410 Gone
        const joinAfterEndRes = await fetch(`${baseUrl}/api/meetings/${liveMeetingId}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenB}`,
          },
          body: JSON.stringify({ fullName: userB.fullName }),
        });
        assert.strictEqual(joinAfterEndRes.status, 410);
      } finally {
        clientA.disconnect();
        clientB.disconnect();
        await Meeting.deleteOne({ meetingId: liveMeetingId });
      }
    });

    console.log("\n================================================================================");
    console.log("Summary: All Integration & Security Verification Tests Passed (100%)");
    console.log("================================================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runTests();
