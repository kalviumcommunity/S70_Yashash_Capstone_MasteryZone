const assert = require("assert");
const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { app } = require("../server");
const User = require("../models/User");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const ProctoredCodingSession = require("../models/ProctoredCodingSession");
const CodingProgress = require("../models/CodingProgress");

let testServer;
let baseUrl;
let candidate1;
let candidate2;
let adminUser;
let token1;
let token2;
let adminToken;
const secret = process.env.JWT_SECRET || "fallback_super_secret_mastery_zone_key_2026_jwt";

async function it(label, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${label}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${label}`);
    console.error(`     Reason: ${err.message}`);
    throw err;
  }
}

async function setup() {
  const timestamp = Date.now();

  candidate1 = await User.create({
    fullName: "Alice Algorithm",
    username: `alice_${timestamp}`,
    email: `alice_${timestamp}@testdomain.com`,
    password: "Password123!",
    role: "student",
    isEmailVerified: true,
  });

  candidate2 = await User.create({
    fullName: "Bob Builder",
    username: `bob_${timestamp}`,
    email: `bob_${timestamp}@testdomain.com`,
    password: "Password123!",
    role: "student",
    isEmailVerified: true,
  });

  adminUser = await User.create({
    fullName: "Super Administrator",
    username: `admin_${timestamp}`,
    email: `admin_${timestamp}@testdomain.com`,
    password: "AdminPassword123!",
    role: "admin",
    isEmailVerified: true,
  });

  token1 = jwt.sign(
    { userId: candidate1._id, id: candidate1._id, email: candidate1.email, role: candidate1.role },
    secret,
    { expiresIn: "1h" }
  );

  token2 = jwt.sign(
    { userId: candidate2._id, id: candidate2._id, email: candidate2.email, role: candidate2.role },
    secret,
    { expiresIn: "1h" }
  );

  adminToken = jwt.sign(
    { userId: adminUser._id, id: adminUser._id, email: adminUser.email, role: adminUser.role },
    secret,
    { expiresIn: "1h" }
  );

  await new Promise((resolve) => {
    testServer = app.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function teardown() {
  if (candidate1?._id) {
    await User.deleteMany({ _id: { $in: [candidate1._id, candidate2._id, adminUser._id] } });
    await ChallengeSubmission.deleteMany({ userId: { $in: [candidate1._id, candidate2._id] } });
    await ProctoredCodingSession.deleteMany({ userId: { $in: [candidate1._id, candidate2._id] } });
    await CodingProgress.deleteMany({ userId: { $in: [candidate1._id, candidate2._id] } });
  }
  if (testServer) {
    await new Promise((res) => testServer.close(res));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

async function runTests() {
  console.log("\n================================================================================");
  console.log("🚀 Challenge Assignment & Report Data Synchronization Test Suite");
  console.log("================================================================================\n");

  await setup();

  try {
    let subAlice;
    let subBob;

    await it("1. Submit Challenge: Creates authentic database record with real score and code", async () => {
      subAlice = await ChallengeSubmission.create({
        userId: candidate1._id,
        challengeId: "ch_reverse_string",
        challengeTitle: "Reverse String in Place",
        language: "python",
        code: "def reverseString(s):\n    s.reverse()\n",
        status: "ACCEPTED",
        score: 100,
        passedTests: 10,
        totalTests: 10,
        runtimeMs: 42,
        output: "All test cases passed",
      });

      assert.ok(subAlice._id);
      assert.strictEqual(subAlice.status, "ACCEPTED");
      assert.strictEqual(subAlice.score, 100);

      subBob = await ChallengeSubmission.create({
        userId: candidate2._id,
        challengeId: "ch_subarray_sum",
        challengeTitle: "Subarray Sum Equals K",
        language: "python",
        code: "def subarraySum(nums, k):\n    return 0\n",
        status: "WRONG_ANSWER",
        score: 30,
        passedTests: 3,
        totalTests: 10,
        runtimeMs: 55,
        output: "Failed assertion on test 4",
      });

      assert.ok(subBob._id);
      assert.strictEqual(subBob.status, "WRONG_ANSWER");
      assert.strictEqual(subBob.score, 30);
    });

    await it("2. Report Endpoint: Authoritatively returns genuine ChallengeSubmission data", async () => {
      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${subAlice._id}/report`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.report);

      const rep = data.report;
      assert.strictEqual(rep.attemptId, String(subAlice._id));
      assert.strictEqual(rep.questionTitle, "Reverse String in Place");
      assert.strictEqual(rep.candidateDetails.fullName, "Alice Algorithm");
      assert.strictEqual(rep.score, 100);
      assert.strictEqual(rep.passedTests, 10);
      assert.strictEqual(rep.totalTests, 10);
      assert.strictEqual(rep.passed, true);
      assert.strictEqual(rep.submittedCode, "def reverseString(s):\n    s.reverse()\n");
    });

    await it("3. Report Endpoint: Reflects failing status and exact score for Bob's submission", async () => {
      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${subBob._id}/report`, {
        headers: { Authorization: `Bearer ${token2}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.report);

      const rep = data.report;
      assert.strictEqual(rep.attemptId, String(subBob._id));
      assert.strictEqual(rep.questionTitle, "Subarray Sum Equals K");
      assert.strictEqual(rep.candidateDetails.fullName, "Bob Builder");
      assert.strictEqual(rep.score, 30);
      assert.strictEqual(rep.passedTests, 3);
      assert.strictEqual(rep.totalTests, 10);
      assert.strictEqual(rep.passed, false);
    });

    await it("4. Non-Existent Session: Returns 404 without manufacturing fake Two Sum records", async () => {
      const fakeSessionId = "non_existent_session_99999";
      const beforeCount = await ProctoredCodingSession.countDocuments({ sessionId: fakeSessionId });
      assert.strictEqual(beforeCount, 0);

      const res = await fetch(`${baseUrl}/api/coding/proctored-session/${fakeSessionId}/report`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      assert.strictEqual(res.status, 404);

      const afterCount = await ProctoredCodingSession.countDocuments({ sessionId: fakeSessionId });
      assert.strictEqual(afterCount, 0, "No fake record was inserted into database");
    });

    await it("5. User Reports API: Includes authentic ChallengeSubmissions for user dashboard", async () => {
      const res = await fetch(`${baseUrl}/api/coding/proctored-session/user-reports`, {
        headers: { Authorization: `Bearer ${token1}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.reports));

      const aliceReport = data.reports.find((r) => r.sessionId === String(subAlice._id));
      assert.ok(aliceReport, "Alice's challenge submission appears in user reports");
      assert.strictEqual(aliceReport.questionTitle, "Reverse String in Place");
      assert.strictEqual(aliceReport.score, 100);
      assert.strictEqual(aliceReport.passed, true);
    });

    await it("6. Admin Reports API: Includes all authentic ChallengeSubmissions", async () => {
      const res = await fetch(`${baseUrl}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);

      const foundAlice = data.reports.find((r) => r.sessionId === String(subAlice._id));
      assert.ok(foundAlice, "Alice's report found in admin reports list");
      assert.strictEqual(foundAlice.type, "Coding Challenge Report");
      assert.strictEqual(foundAlice.recipient, "Alice Algorithm");
      assert.strictEqual(foundAlice.score, "100%");

      const foundBob = data.reports.find((r) => r.sessionId === String(subBob._id));
      assert.ok(foundBob, "Bob's report found in admin reports list");
      assert.strictEqual(foundBob.recipient, "Bob Builder");
      assert.strictEqual(foundBob.score, "30%");
    });

    await it("7. Admin Evaluation: Updates submission marks, syncs CodingProgress, and updates report", async () => {
      // Admin overrides Bob's score to 85% via PUT /api/admin/modify-marks
      const res = await fetch(`${baseUrl}/api/admin/modify-marks`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          itemId: subBob._id,
          itemType: "coding",
          newScore: 85,
          newStatus: "ACCEPTED",
          adminNote: "Verified by lead reviewer: edge cases validated manually",
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);

      // Verify database updated
      const updatedBob = await ChallengeSubmission.findById(subBob._id);
      assert.strictEqual(updatedBob.score, 85);
      assert.strictEqual(updatedBob.status, "ACCEPTED");
      assert.strictEqual(updatedBob.adminNote, "Verified by lead reviewer: edge cases validated manually");

      // Verify report endpoint immediately reflects the updated evaluation
      const repRes = await fetch(`${baseUrl}/api/coding/proctored-session/${subBob._id}/report`, {
        headers: { Authorization: `Bearer ${token2}` },
      });
      const repData = await repRes.json();
      assert.strictEqual(repData.report.score, 85);
      assert.strictEqual(repData.report.passed, true);
      assert.strictEqual(repData.report.adminNote, "Verified by lead reviewer: edge cases validated manually");
    });

    console.log("\n================================================================================");
    console.log("Summary: 7/7 tests passed cleanly!");
    console.log("================================================================================\n");
  } finally {
    await teardown();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failure:", err);
    process.exit(1);
  });
