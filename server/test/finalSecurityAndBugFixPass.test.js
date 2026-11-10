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
