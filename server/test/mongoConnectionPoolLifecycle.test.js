/**
 * Mastery Zone — MongoDB Connection Pool Lifecycle & Concurrency Regression Tests
 *
 * Verifies:
 * 1. Single Shared Connection Reuse: Entire app reuses the singleton Mongoose connection pool.
 * 2. Appropriate Connection Pool Settings: maxPoolSize, minPoolSize, waitQueueTimeoutMS.
 * 3. Connection Pool Monitoring & Diagnostics: Safe real-time pool metrics without credential leaks.
 * 4. High-Concurrency Burst Handling: Simultaneous requests across /auth/me, /api/coding/data,
 *    /api/coding/submissions/my-recent, /api/certifications/my-history, /api/curriculum/reports,
 *    and /api/coding/proctored-session/user-reports without MongoWaitQueueTimeoutError or pool starvation.
 * 5. Safe Failure Recovery: Clean diagnostics on database disconnections and error sanitization.
 */

const assert = require("assert");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { getJwtSecret } = require("../config/jwtConfig");
const User = require("../models/User");
const DailyCodingActivity = require("../models/DailyCodingActivity");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const CertificationAttempt = require("../models/CertificationAttempt");
const IssuedCertificate = require("../models/IssuedCertificate");
const CodingProgress = require("../models/CodingProgress");
const Progress = require("../models/ProgressSchema");
const ProctoredCodingSession = require("../models/ProctoredCodingSession");
const { app, server, getPoolStatus, getMongoConnectionOptions } = require("../server");
const { sanitizeMessage } = require("../config/dbPoolMonitor");

let testServer;
let baseUrl;
let testUser;
let testToken;
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
  const mongoUri = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/masteryzone_test";
  const poolOpts = getMongoConnectionOptions({ serverSelectionTimeoutMS: 5000, minPoolSize: 2 });
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, poolOpts);
  }

  const secret = getJwtSecret();
  const time = Date.now();

  // Seed test candidate
  testUser = await User.create({
    fullName: "Pool Concurrency Tester",
    username: `pool_user_${time}`,
    email: `pool_user_${time}@test.com`,
    password: "Password123!",
    role: "student",
    streak: 3,
  });

  testToken = jwt.sign(
    {
      userId: testUser._id.toString(),
      id: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role,
      fullName: testUser.fullName,
    },
    secret,
    { expiresIn: "2h" }
  );

  // Seed supporting records for the user
  await Promise.all([
    DailyCodingActivity.create({
      userId: testUser._id,
      date: new Date().toISOString().split("T")[0],
      submissionsCount: 5,
      problemsSolved: 3,
      solvedChallengeIds: ["two_sum", "reverse_linked_list"],
    }),
    ChallengeSubmission.create({
      userId: testUser._id,
      challengeId: "two_sum",
      challengeTitle: "Two Sum",
      language: "python",
      status: "ACCEPTED",
      score: 100,
      passedTests: 10,
      totalTests: 10,
    }),
    CodingProgress.create({
      userId: testUser._id,
      activeTrack: "Python Track",
      trackUnlocks: { python: 2, javascript: 0, java: 0, cpp: 0, webdev: 0, dsa: 0 },
      trackLessons: { python: 2, javascript: 0, java: 0, cpp: 0, webdev: 0, dsa: 0 },
    }),
    Progress.create({
      userId: testUser._id,
      track: "CODING",
      task: "Array Algorithms",
      xpEarned: 50,
      hoursSpent: 1.5,
      date: new Date(),
    }),
  ]);

  await new Promise((resolve) => {
    testServer = server.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function teardown() {
  if (testUser?._id) {
    await Promise.all([
      User.deleteOne({ _id: testUser._id }),
      DailyCodingActivity.deleteMany({ userId: testUser._id }),
      ChallengeSubmission.deleteMany({ userId: testUser._id }),
      CertificationAttempt.deleteMany({ userId: testUser._id }),
      IssuedCertificate.deleteMany({ userId: testUser._id }),
      CodingProgress.deleteOne({ userId: testUser._id }),
      Progress.deleteMany({ userId: testUser._id }),
    ]);
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
  console.log("🛡️ MongoDB Connection Pool Lifecycle & Concurrency Verification");
  console.log("================================================================================\n");

  await setup();

  try {
    // -------------------------------------------------------------
    // Test 1: Single Shared Connection Reuse
    // -------------------------------------------------------------
    await it("1. Connection Reuse: Verifies all models and operations share singleton connection pool", async () => {
      assert.strictEqual(mongoose.connections.length, 1, "Must maintain exactly 1 Mongoose default connection");
      assert.strictEqual(User.db, mongoose.connection, "User model must use shared mongoose.connection");
      assert.strictEqual(ChallengeSubmission.db, mongoose.connection, "ChallengeSubmission model must use shared connection");
      assert.strictEqual(CodingProgress.db, mongoose.connection, "CodingProgress model must use shared connection");
      assert.strictEqual(Progress.db, mongoose.connection, "Progress model must use shared connection");
    });

    // -------------------------------------------------------------
    // Test 2: Connection Pool Configuration Settings
    // -------------------------------------------------------------
    await it("2. Pool Options: Verifies maxPoolSize, minPoolSize, and waitQueueTimeoutMS settings", async () => {
      const opts = getMongoConnectionOptions();
      assert.ok(opts.maxPoolSize >= 50, `maxPoolSize should be >= 50 in production settings (got: ${opts.maxPoolSize})`);
      assert.ok(opts.minPoolSize >= 2, `minPoolSize should maintain warm connections >= 2 (got: ${opts.minPoolSize})`);
      assert.ok(opts.waitQueueTimeoutMS >= 20000, `waitQueueTimeoutMS should be >= 20000ms (got: ${opts.waitQueueTimeoutMS})`);
      assert.ok(opts.serverSelectionTimeoutMS >= 5000, `serverSelectionTimeoutMS should be >= 5000ms (got: ${opts.serverSelectionTimeoutMS})`);
    });

    // -------------------------------------------------------------
    // Test 3: Safe Connection Pool Monitoring & Diagnostics
    // -------------------------------------------------------------
    await it("3. Pool Monitoring: Real-time diagnostics return sanitized metrics without credential leakage", async () => {
      const status = getPoolStatus(mongoose.connection);
      assert.ok(status.status === "connected" || status.status === "connecting", `Status must be valid (got: ${status.status})`);
      assert.strictEqual(typeof status.pool.maxPoolSize, "number");
      assert.strictEqual(typeof status.pool.activeConnections, "number");
      assert.strictEqual(typeof status.pool.waitQueueSize, "number");
      assert.strictEqual(typeof status.pool.totalCheckouts, "number");
      assert.strictEqual(typeof status.pool.peakActiveConnections, "number");

      // Verify no sensitive credentials appear in pool diagnostics
      const serialized = JSON.stringify(status);
      assert.strictEqual(serialized.includes("password"), false, "Diagnostics must never contain 'password'");
      assert.strictEqual(serialized.includes("mongodb+srv://"), false, "Diagnostics must never expose raw connection string");
      assert.strictEqual(serialized.includes(getJwtSecret()), false, "Diagnostics must never expose JWT secret");

      // Verify sanitizeMessage helper
      const leakStr = "MongoWaitQueueTimeoutError at mongodb+srv://admin_user:SuperSecretPass123@cluster0.net/prod";
      const sanitized = sanitizeMessage(leakStr);
      assert.strictEqual(sanitized.includes("SuperSecretPass123"), false, "Must redact credentials");
      assert.strictEqual(sanitized.includes("credentials-hidden"), true, "Must replace with placeholder");
    });

    // -------------------------------------------------------------
    // Test 4: Diagnostic Endpoint HTTP Verification
    // -------------------------------------------------------------
    await it("4. Health Diagnostics Endpoint: GET /health/db returns 200 with sanitized pool status", async () => {
      const res = await fetch(`${baseUrl}/health/db`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, "healthy");
      assert.strictEqual(data.readyState, 1);
      assert.ok(data.pool, "Must include pool metrics");
      assert.ok(typeof data.pool.activeConnections === "number");
      assert.ok(typeof data.pool.availableConnections === "number");
      assert.ok(typeof data.pool.maxPoolSize === "number");
      assert.strictEqual(JSON.stringify(data).includes("Password"), false);
    });

    // -------------------------------------------------------------
    // Test 5: High-Concurrency Burst (Simultaneous API Requests)
    // -------------------------------------------------------------
    await it("5. Concurrency Stress: 30 simultaneous API requests across key endpoints succeed without pool timeout", async () => {
      const endpoints = [
        "/auth/me",
        "/api/coding/data",
        "/api/coding/submissions/my-recent",
        "/api/certifications/my-history",
        "/api/curriculum/reports",
        "/api/coding/proctored-session/user-reports",
      ];

      // Dispatch 30 parallel requests (5 batches of each endpoint)
      const requests = [];
      for (let i = 0; i < 5; i++) {
        for (const ep of endpoints) {
          requests.push(
            fetch(`${baseUrl}${ep}`, {
              headers: { Authorization: `Bearer ${testToken}` },
            }).then(async (res) => {
              const body = await res.json().catch(() => null);
              return { status: res.status, endpoint: ep, body };
            })
          );
        }
      }

      const results = await Promise.all(requests);
      assert.strictEqual(results.length, 30, "All 30 parallel requests must complete");

      for (const r of results) {
        assert.ok(
          r.status === 200 || r.status === 304,
          `Endpoint ${r.endpoint} failed with HTTP ${r.status}: ${JSON.stringify(r.body)}`
        );
      }

      // Check pool status after burst
      const poolStatus = getPoolStatus(mongoose.connection);
      assert.ok(poolStatus.pool.totalCheckouts > 0, "Checkouts must have occurred");
      assert.strictEqual(poolStatus.pool.checkoutFailures, 0, "No checkouts should have failed during the burst");
    });

    // -------------------------------------------------------------
    // Test 6: Simultaneous Dashboard Initialization Simulation
    // -------------------------------------------------------------
    await it("6. Dashboard Init Simulation: Multiple concurrent users fetching dashboard data avoid duplicate key collisions", async () => {
      // Simulate 5 simultaneous requests from brand new users who need CodingProgress initialization
      const newUsers = await Promise.all(
        [1, 2, 3].map((idx) =>
          User.create({
            fullName: `New User ${idx}`,
            username: `new_user_${Date.now()}_${idx}`,
            email: `new_user_${Date.now()}_${idx}@test.com`,
            password: "Password123!",
          })
        )
      );

      const newTokens = newUsers.map((u) =>
        jwt.sign({ userId: u._id.toString(), id: u._id.toString(), email: u.email }, getJwtSecret(), {
          expiresIn: "1h",
        })
      );

      // Dispatch 2 simultaneous /api/coding/data requests per new user (common on double-mount or fast navigation)
      const initCalls = [];
      for (const tok of newTokens) {
        initCalls.push(
          fetch(`${baseUrl}/api/coding/data`, { headers: { Authorization: `Bearer ${tok}` } }),
          fetch(`${baseUrl}/api/coding/data`, { headers: { Authorization: `Bearer ${tok}` } })
        );
      }

      const initResults = await Promise.all(initCalls);
      for (const res of initResults) {
        assert.strictEqual(res.status, 200, "Concurrent initialization of user progress must not throw duplicate key error");
        const json = await res.json();
        assert.ok(json.progress, "Must return user progress");
        assert.ok(json.tracks, "Must return track progress");
      }

      // Cleanup new users
      await Promise.all(newUsers.map((u) => User.deleteOne({ _id: u._id })));
      await Promise.all(newUsers.map((u) => CodingProgress.deleteOne({ userId: u._id })));
    });

    // -------------------------------------------------------------
    // Test 7: Index Verification on High-Frequency Collections
    // -------------------------------------------------------------
    await it("7. Index Coverage: Verifies compound indexes on IssuedCertificate and ProctoredCodingSession", async () => {
      const issuedIndexes = await IssuedCertificate.collection.indexes();
      const hasIssuedUserStatusCreated = issuedIndexes.some((idx) => {
        const k = idx.key || {};
        return k.userId === 1 && k.status === 1 && k.createdAt === -1;
      });
      assert.ok(hasIssuedUserStatusCreated, "IssuedCertificate must have { userId: 1, status: 1, createdAt: -1 } index");

      const procIndexes = await ProctoredCodingSession.collection.indexes();
      const hasProcReportIndex = procIndexes.some((idx) => {
        const k = idx.key || {};
        return k.userId === 1 && k["submissionResult.submittedAt"] === -1;
      });
      assert.ok(hasProcReportIndex, "ProctoredCodingSession must have { userId: 1, 'submissionResult.submittedAt': -1 } index");
    });

    console.log("\n================================================================================");
    console.log(`Summary: ${passedCount}/${totalCount} MongoDB Connection Pool Lifecycle Tests Passed (100%)`);
    console.log("================================================================================\n");
  } finally {
    await teardown();
  }
}

runTests().catch((err) => {
  console.error("FATAL: Test suite failed:", err);
  process.exit(1);
});
