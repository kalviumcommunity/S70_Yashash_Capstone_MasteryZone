const assert = require("assert");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { getJwtSecret } = require("../config/jwtConfig");
const User = require("../models/User");
const Meeting = require("../models/Meeting");
const Recording = require("../models/Recording");
const ProctoredCodingSession = require("../models/ProctoredCodingSession");
const { getRecordingsDir, resolveRecordingFilePath } = require("../config/recordingStorage");
const {
  evaluateTestCasesBatch,
  validateTestCaseOutput,
  checkExecutableAvailable,
  getExecutionEnvironment,
} = require("../services/codeExecutionService");
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

const { execFileSync } = require("child_process");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");

function createValidTestWebMBuffer(duration = 1) {
  try {
    const tmpFile = path.join(__dirname, `tmp_playable_${Date.now()}_${Math.random().toString(36).slice(2)}.webm`);
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
  } catch {
    const buf = Buffer.alloc(1024);
    buf[0] = 0x1a; buf[1] = 0x45; buf[2] = 0xdf; buf[3] = 0xa3;
    buf[10] = 0x18; buf[11] = 0x53; buf[12] = 0x80; buf[13] = 0x67;
    buf[20] = 0x16; buf[21] = 0x54; buf[22] = 0xae; buf[23] = 0x6b;
    buf.write("V_VP8", 30, "ascii");
    buf.write("A_OPUS", 50, "ascii");
    buf[80] = 0x1f; buf[81] = 0x43; buf[82] = 0xb6; buf[83] = 0x75;
    return buf;
  }
}

let passedCount = 0;
let totalCount = 0;

async function it(title, fn) {
  totalCount++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${title}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${title}`);
    console.error(`     Reason: ${err.message}`);
    throw err;
  }
}

async function setup() {
  const mongoUri = process.env.TEST_MONGODB_URI;
  if (!mongoUri) {
    console.error("FATAL: TEST_MONGODB_URI required for tests.");
    process.exit(1);
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  }

  const secret = getJwtSecret();

  userA = await User.findOne({ email: "user_a_critical@masteryzone.com" });
  if (!userA) {
    userA = await User.create({
      username: "user_a_crit",
      fullName: "User Alpha Crit",
      email: "user_a_critical@masteryzone.com",
      password: "HashedPassword123!",
      role: "user",
    });
  }
  tokenA = jwt.sign(
    { userId: userA._id, id: userA._id, email: userA.email, role: "user" },
    secret,
    { expiresIn: "2h" }
  );

  userB = await User.findOne({ email: "user_b_critical@masteryzone.com" });
  if (!userB) {
    userB = await User.create({
      username: "user_b_crit",
      fullName: "User Beta Crit",
      email: "user_b_critical@masteryzone.com",
      password: "HashedPassword123!",
      role: "user",
    });
  }
  tokenB = jwt.sign(
    { userId: userB._id, id: userB._id, email: userB.email, role: "user" },
    secret,
    { expiresIn: "2h" }
  );

  adminUser = await User.findOne({ role: "admin" });
  if (!adminUser) {
    adminUser = await User.create({
      username: "admin_crit",
      fullName: "Admin Crit",
      email: "admin_crit@masteryzone.com",
      password: "HashedPassword123!",
      role: "admin",
    });
  }
  tokenAdmin = jwt.sign(
    { userId: adminUser._id, id: adminUser._id, email: adminUser.email, role: "admin" },
    secret,
    { expiresIn: "2h" }
  );

  // Setup meeting with userA as host and userB as participant
  await Meeting.deleteMany({ meetingId: "mtg_crit_test_meeting" });
  await Meeting.create({
    meetingId: "mtg_crit_test_meeting",
    title: "Critical Testing Meeting",
    hostUserId: userA._id.toString(),
    participants: [
      { userId: userA._id, fullName: userA.fullName, email: userA.email },
      { userId: userB._id, fullName: userB.fullName, email: userB.email },
    ],
    status: "active",
  });

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
    const diskPath = path.join(getRecordingsDir(), f);
    if (fs.existsSync(diskPath)) {
      try { fs.unlinkSync(diskPath); } catch {}
    }
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

async function runAllTests() {
  console.log("================================================================================");
  console.log("🛡️ Mastery Zone Critical Defects & Root-Cause Remediation Verification");
  console.log("================================================================================");

  await setup();

  try {
    // -------------------------------------------------------------
    // PHASE 2 & 3: Compiler Output Comparison & Runtime Verification
    // -------------------------------------------------------------
    console.log("\n--- Section 1: Compiler & Output Comparison Verification ---");

    await it("Compiler: Correct Python solution passes", async () => {
      const code = "def twoSum(nums, target):\n    return [0, 1]";
      const res = await evaluateTestCasesBatch("python", code, [
        { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" }
      ], { functionName: "twoSum" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Compiler: Incorrect Python solution fails cleanly", async () => {
      const code = "def twoSum(nums, target):\n    return [99, 99]";
      const res = await evaluateTestCasesBatch("python", code, [
        { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" }
      ], { functionName: "twoSum" });
      assert.strictEqual(res[0].passed, false);
    });

    await it("Compiler: Correct JavaScript solution passes", async () => {
      const code = "function twoSum(nums, target) { return [0, 1]; }";
      const res = await evaluateTestCasesBatch("javascript", code, [
        { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" }
      ], { functionName: "twoSum" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Compiler: Incorrect JavaScript solution fails cleanly", async () => {
      const code = "function twoSum(nums, target) { return [99, 99]; }";
      const res = await evaluateTestCasesBatch("javascript", code, [
        { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" }
      ], { functionName: "twoSum" });
      assert.strictEqual(res[0].passed, false);
    });

    await it("Compiler: Correct Java solution passes", async () => {
      const code = [
        "public class Solution {",
        "    public int[] twoSum(int[] nums, int target) {",
        "        return new int[]{0, 1};",
        "    }",
        "}",
      ].join("\n");
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" }
      ], { functionName: "twoSum" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Compiler: Incorrect Java solution fails cleanly", async () => {
      const code = [
        "public class Solution {",
        "    public int[] twoSum(int[] nums, int target) {",
        "        return new int[]{99, 99};",
        "    }",
        "}",
      ].join("\n");
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" }
      ], { functionName: "twoSum" });
      assert.strictEqual(res[0].passed, false);
    });

    await it("Compiler: Correct C solution passes via standard I/O", async () => {
      const code = [
        "#include <stdio.h>",
        "int main() {",
        "    printf(\"[0, 1]\\n\");",
        "    return 0;",
        "}",
      ].join("\n");
      const res = await evaluateTestCasesBatch("c", code, [
        { input: "9", expectedOutput: "[0, 1]" }
      ]);
      assert.strictEqual(res[0].passed, true);
    });

    await it("Compiler: Incorrect C solution fails cleanly", async () => {
      const code = [
        "#include <stdio.h>",
        "int main() {",
        "    printf(\"[99, 99]\\n\");",
        "    return 0;",
        "}",
      ].join("\n");
      const res = await evaluateTestCasesBatch("c", code, [
        { input: "9", expectedOutput: "[0, 1]" }
      ]);
      assert.strictEqual(res[0].passed, false);
    });

    await it("Compiler: Correct C++ solution passes", async () => {
      const code = [
        "#include <vector>",
        "class Solution {",
        "public:",
        "    std::vector<int> twoSum(std::vector<int>& nums, int target) {",
        "        return {0, 1};",
        "    }",
        "};",
      ].join("\n");
      const res = await evaluateTestCasesBatch("cpp", code, [
        { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" }
      ], { functionName: "twoSum" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Compiler: Incorrect C++ solution fails cleanly", async () => {
      const code = [
        "#include <vector>",
        "class Solution {",
        "public:",
        "    std::vector<int> twoSum(std::vector<int>& nums, int target) {",
        "        return {99, 99};",
        "    }",
        "};",
      ].join("\n");
      const res = await evaluateTestCasesBatch("cpp", code, [
        { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" }
      ], { functionName: "twoSum" });
      assert.strictEqual(res[0].passed, false);
    });

    await it("Comparison: Strict string comparison preserves case sensitivity ('Hello' vs 'hello', 'ABC' vs 'abc')", async () => {
      assert.strictEqual(validateTestCaseOutput("Hello", "hello"), false);
      assert.strictEqual(validateTestCaseOutput("ABC", "abc"), false);
      assert.strictEqual(validateTestCaseOutput("ExactMatch", "ExactMatch"), true);
    });

    await it("Comparison: Array comparison preserves case sensitivity (['ABC'] vs ['abc']) and matches structural elements", async () => {
      assert.strictEqual(validateTestCaseOutput('["ABC"]', '["abc"]'), false);
      assert.strictEqual(validateTestCaseOutput('["ABC"]', '["ABC"]'), true);
      assert.strictEqual(validateTestCaseOutput('[0, 1]', '0 1'), true);
      assert.strictEqual(validateTestCaseOutput('[1, 2, 3]', '[1, 2, 3]'), true);
    });

    await it("Comparison: Nested structured outputs compare correctly", async () => {
      assert.strictEqual(validateTestCaseOutput('{"a": [1, 2]}', '{"a": [1, 2]}'), true);
      assert.strictEqual(validateTestCaseOutput('{"a": [1, 2]}', '{"a": [1, 3]}'), false);
    });

    await it("Comparison: Numeric formatting uses explicit tolerance without converting arbitrary strings", async () => {
      assert.strictEqual(validateTestCaseOutput("3.14159265", "3.14159265"), true);
      assert.strictEqual(validateTestCaseOutput("1.0000001", "1.0"), true);
      assert.strictEqual(validateTestCaseOutput("1.05", "1.0"), false);
    });

    await it("Compiler: Empty submission is safely rejected with 0 marks", async () => {
      const res = await evaluateTestCasesBatch("python", "   # only comments\n   ", [
        { input: "1", expectedOutput: "1" }
      ]);
      assert.strictEqual(res[0].passed, false);
      assert.ok(res[0].error.includes("No executable code"));
    });

    await it("Compiler: Compilation failure returns compilation error cleanly", async () => {
      const res = await evaluateTestCasesBatch("python", "def broken(:", [
        { input: "1", expectedOutput: "1" }
      ], { functionName: "broken" });
      assert.strictEqual(res[0].passed, false);
      assert.ok(res[0].error.toLowerCase().includes("syntax") || res[0].error.length > 0);
    });

    await it("Compiler: Runtime failure returns error cleanly without hanging", async () => {
      const res = await evaluateTestCasesBatch("python", "def divide(a):\n    return 10 / 0", [
        { input: "1", expectedOutput: "1" }
      ], { functionName: "divide" });
      assert.strictEqual(res[0].passed, false);
      assert.ok(res[0].error.includes("division by zero") || res[0].error.includes("Runtime Exception") || res[0].error.includes("ZeroDivisionError"));
    });

    await it("Compiler: Infinite loop triggers timeout error cleanly", async () => {
      const res = await evaluateTestCasesBatch("python", "import time\nwhile True: pass", [
        { input: "1", expectedOutput: "1" }
      ]);
      assert.strictEqual(res[0].passed, false);
      assert.ok(res[0].error.toLowerCase().includes("timed out") || res[0].error.toLowerCase().includes("restricted"));
    });

    await it("Runtime Environment: Missing executable check detects unavailable binary cleanly", async () => {
      const env = getExecutionEnvironment();
      const isFakeAvail = checkExecutableAvailable("non_existent_binary_xyz_12345", env.PATH);
      assert.strictEqual(isFakeAvail, false);
      const isNodeAvail = checkExecutableAvailable("node", env.PATH);
      assert.strictEqual(isNodeAvail, true);
    });

    // -------------------------------------------------------------
    // PHASE 1: Secure Assessment Grading
    // -------------------------------------------------------------
    console.log("\n--- Section 2: Secure Assessment Grading Verification ---");

    await it("Assessment Security: Fabricated full marks in browser payload are completely ignored", async () => {
      const session = await ProctoredCodingSession.create({
        sessionId: `crit_sec_sess_${Date.now()}_1`,
        userId: userA._id.toString(),
        questionId: "ch_two_sum",
        assessmentTitle: "Two Sum Exam",
        status: "active",
        serverStartTime: new Date(),
        serverDeadline: new Date(Date.now() + 3600000),
        timeLimitSeconds: 3600,
      });

      // Browser sends incorrect code BUT fabricates score: 100, marksObtained: 100, passedTests: 10
      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${session.sessionId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          code: "def twoSum(nums, target): return [999, 999]", // Failing code
          language: "python",
          score: 100, // FAKE
          marksObtained: 100, // FAKE
          passedTests: 10, // FAKE
          totalTests: 10,
          grade: "A+", // FAKE
          testResults: [{ passed: true, testIndex: 1 }], // FAKE
        }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      // The server independently executed the code: all tests failed!
      assert.strictEqual(data.submissionResult.score, 0);
      assert.strictEqual(data.submissionResult.passedTests, 0);
      assert.strictEqual(data.submissionResult.grade, "F");
      assert.strictEqual(data.submissionResult.passed, false);
    });

    await it("Assessment Security: Fabricated passed-test count in submitted questions array is ignored", async () => {
      const session = await ProctoredCodingSession.create({
        sessionId: `crit_sec_sess_${Date.now()}_2`,
        userId: userA._id.toString(),
        questionId: "ch_two_sum",
        assessmentTitle: "Two Sum Exam Multi-Q",
        status: "active",
        serverStartTime: new Date(),
        serverDeadline: new Date(Date.now() + 3600000),
        timeLimitSeconds: 3600,
      });

      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${session.sessionId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          questions: [
            {
              questionId: "ch_two_sum",
              code: "def twoSum(nums, target): return [0, 0]", // Wrong
              language: "python",
              score: 100, // FAKE
              passedTests: 10, // FAKE
              marksObtained: 100, // FAKE
            },
          ],
        }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.submissionResult.score, 0);
      assert.strictEqual(data.submissionResult.passedTests, 0);
    });

    await it("Assessment Security: Genuine partial marks are accurately calculated and preserved", async () => {
      const session = await ProctoredCodingSession.create({
        sessionId: `crit_sec_sess_${Date.now()}_3`,
        userId: userA._id.toString(),
        questionId: "ch_two_sum",
        assessmentTitle: "Two Sum Partial Marks",
        status: "active",
        serverStartTime: new Date(),
        serverDeadline: new Date(Date.now() + 3600000),
        timeLimitSeconds: 3600,
      });

      // Pass only test case 1: target 9 -> return [0, 1]
      const partialCode = "def twoSum(nums, target):\n    if target == 9: return [0, 1]\n    return []";
      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${session.sessionId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          code: partialCode,
          language: "python",
        }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.ok(data.submissionResult.passedTests > 0);
      assert.ok(data.submissionResult.passedTests < data.submissionResult.totalTests);
      assert.ok(data.submissionResult.score > 0 && data.submissionResult.score < 100);
    });

    await it("Assessment Security: Duplicate submission of finalized session returns 409 and never re-scores", async () => {
      const session = await ProctoredCodingSession.findOne({
        sessionId: { $regex: /^crit_sec_sess_.*_1$/ },
      });
      assert.ok(session);
      assert.strictEqual(session.status, "submitted");

      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${session.sessionId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          code: "def twoSum(nums, target): return [0, 1]", // Trying to get 100 after finalizing
          language: "python",
        }),
      });

      assert.strictEqual(res.status, 409);
      const data = await res.json();
      assert.strictEqual(data.alreadySubmitted, true);
      assert.strictEqual(data.score, 0); // Original score remains immutable
    });

    // -------------------------------------------------------------
    // PHASE 4: Recording Upload, Retrieval & Deletion
    // -------------------------------------------------------------
    console.log("\n--- Section 3: Recording Security & Lifecycle Verification ---");

    let uploadedRecordingId = null;

    await it("Recording: Meeting host can successfully upload and publish meeting recording", async () => {
      const webmBuffer = createValidTestWebMBuffer();
      const base64Data = `data:video/webm;base64,${webmBuffer.toString("base64")}`;

      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`, // User A is the Host
        },
        body: JSON.stringify({
          meetingId: "mtg_crit_test_meeting",
          title: "Host Published Session",
          durationSeconds: 120,
          base64Data,
          mimeType: "video/webm",
        }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(data.success, true);
      assert.ok(data.recording.recordingId);
      uploadedRecordingId = data.recording.recordingId;
      createdFiles.push(path.basename(data.recording.filePath));
    });

    await it("Recording: Non-host participant upload is strictly rejected with 403 Forbidden", async () => {
      const webmBuffer = createValidTestWebMBuffer();
      const base64Data = `data:video/webm;base64,${webmBuffer.toString("base64")}`;

      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`, // User B is only a participant
        },
        body: JSON.stringify({
          meetingId: "mtg_crit_test_meeting",
          title: "Participant Illegal Recording",
          durationSeconds: 60,
          base64Data,
          mimeType: "video/webm",
        }),
      });

      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.ok(data.error.includes("Only the meeting host"));
    });

    await it("Recording: User from outside the meeting is strictly rejected with 403 Forbidden", async () => {
      let outsider = await User.findOne({ email: "outsider@masteryzone.com" });
      if (!outsider) {
        outsider = await User.create({
          username: "outsider_user",
          fullName: "Outsider",
          email: "outsider@masteryzone.com",
          password: "HashedPassword123!",
          role: "user",
        });
      }
      const outsiderToken = jwt.sign(
        { userId: outsider._id, id: outsider._id, email: outsider.email, role: "user" },
        getJwtSecret()
      );

      const webmBuffer = createValidTestWebMBuffer();
      const base64Data = `data:video/webm;base64,${webmBuffer.toString("base64")}`;

      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${outsiderToken}`,
        },
        body: JSON.stringify({
          meetingId: "mtg_crit_test_meeting",
          title: "Outsider Recording",
          durationSeconds: 60,
          base64Data,
        }),
      });

      assert.strictEqual(res.status, 403);
    });

    await it("Recording: Unauthenticated upload is strictly rejected with 401 Unauthorized", async () => {
      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: "mtg_crit_test_meeting",
          base64Data: "invalid",
        }),
      });
      assert.strictEqual(res.status, 401);
    });

    await it("Recording: Saved recording is retrievable via streaming endpoint", async () => {
      const recording = await Recording.findOne({ recordingId: uploadedRecordingId });
      assert.ok(recording);
      const filename = path.basename(recording.filePath);

      const res = await fetch(`${baseUrl}/api/recordings/stream/${filename}?token=${tokenA}`, {
        headers: { Range: "bytes=0-10" },
      });
      assert.ok(res.status === 206 || res.status === 200);
      assert.ok(res.headers.get("content-type").includes("video") || res.headers.get("content-type").includes("octet-stream"));
    });

    await it("Recording: Non-host user cannot delete host's recording (403 Forbidden)", async () => {
      const res = await fetch(`${baseUrl}/api/recordings/${uploadedRecordingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(res.status, 403);
    });

    await it("Recording: Host deletes recording safely (both disk file and DB doc deleted)", async () => {
      const recording = await Recording.findOne({ recordingId: uploadedRecordingId });
      assert.ok(recording);
      const diskPath = resolveRecordingFilePath(path.basename(recording.filePath), recording);

      const res = await fetch(`${baseUrl}/api/recordings/${uploadedRecordingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenA}` },
      });

      assert.strictEqual(res.status, 200);
      const docAfter = await Recording.findOne({ recordingId: uploadedRecordingId });
      assert.strictEqual(docAfter, null);
      if (diskPath) {
        assert.strictEqual(fs.existsSync(diskPath), false);
      }
    });

    await it("Recording: Deleting when disk file is already missing still safely cleans DB record", async () => {
      const phantom = await Recording.create({
        recordingId: "rec_phantom_test_123",
        meetingId: "mtg_crit_test_meeting",
        hostUserId: userA._id.toString(),
        filePath: "/non/existent/file.webm",
        fileUrl: "/recordings/rec_phantom_test_123.webm",
        durationSeconds: 10,
      });

      const res = await fetch(`${baseUrl}/api/recordings/${phantom.recordingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenA}` },
      });

      assert.strictEqual(res.status, 200);
      const docAfter = await Recording.findOne({ recordingId: phantom.recordingId });
      assert.strictEqual(docAfter, null);
    });

    // -------------------------------------------------------------
    // PHASE 5: Proctored Session Ownership & Cross-Account Isolation
    // -------------------------------------------------------------
    console.log("\n--- Section 4: Proctored Session Ownership & Isolation ---");

    let sessionA;

    await it("Session Security: User A can initialize and access their own proctored session", async () => {
      sessionA = await ProctoredCodingSession.create({
        sessionId: `proc_iso_session_${Date.now()}`,
        userId: userA._id.toString(),
        questionId: "ch_two_sum",
        assessmentTitle: "Algorithms Mastery Exam",
        status: "active",
        serverStartTime: new Date(),
        serverDeadline: new Date(Date.now() + 3600000),
        timeLimitSeconds: 3600,
        maxRecoveryChances: 5,
        recoveryChancesUsed: 0,
      });

      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${sessionA.sessionId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.sessionId, sessionA.sessionId);
    });

    await it("Session Security: User B cannot access User A's session (404/403 Isolated)", async () => {
      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${sessionA.sessionId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(res.status, 404);
    });

    await it("Session Security: User B cannot resume or modify User A's session", async () => {
      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${sessionA.sessionId}/resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({}),
      });
      assert.strictEqual(res.status, 404);
    });

    await it("Session Security: User B cannot submit code to User A's session (403 Forbidden)", async () => {
      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${sessionA.sessionId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({
          sessionId: sessionA.sessionId,
          code: "def twoSum(nums, target): return [0, 1]",
          language: "python",
        }),
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.ok(data.error.includes("You do not own this proctored assessment session"));
    });

    await it("Session Security: Unauthenticated request cannot submit to session (401 Unauthorized)", async () => {
      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${sessionA.sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionA.sessionId,
          code: "print('hello')",
        }),
      });
      assert.strictEqual(res.status, 401);
    });

    await it("Session Security: User B cannot view User A's assessment report (403 Forbidden)", async () => {
      // First let userA submit legitimately
      await fetch(`${baseUrl}/api/coding/proctored-session/${sessionA.sessionId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          sessionId: sessionA.sessionId,
          code: "def twoSum(nums, target): return [0, 1]",
          language: "python",
        }),
      });

      // Now User B tries to view the report
      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${sessionA.sessionId}/report`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(res.status, 403);
    });

    console.log("\n================================================================================");
    console.log(`Summary: ${passedCount}/${totalCount} Critical Remediation Tests Passed (100%)`);
    console.log("================================================================================");
  } finally {
    await teardown();
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test suite error:", err);
  process.exit(1);
});
