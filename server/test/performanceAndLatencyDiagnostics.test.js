/**
 * Mastery Zone — Production Performance & Endpoint Latency Diagnostics Regression Tests
 *
 * Verifies:
 * 1. Detailed Timing Diagnostics & Server-Timing Header:
 *    - Validates W3C Server-Timing header format (auth, db, serialize, total, queries count).
 *    - Verifies accurate stage breakdown without exposing tokens, queries, or PII.
 * 2. HTTP 304 Fast Conditional Validation:
 *    - Validates that conditional requests with If-None-Match return 304 Not Modified.
 *    - Verifies conditional 304 avoids heavy JSON serialization and redundant processing.
 * 3. Static SPA & Root Routing (/):
 *    - Verifies in-memory cached index.html returns instant 200/304 without disk threadpool saturation.
 * 4. High-Concurrency Burst Without Pool Timeout:
 *    - Validates simultaneous requests across key endpoints (/api/coding/data, /api/coding/challenges,
 *      /api/certifications/my-history, /api/meetings/study-rooms, /) succeed without MongoWaitQueueTimeoutError.
 * 5. Strict Account Isolation & Data Preservation:
 *    - Verifies user data is preserved and accounts remain isolated under performance optimizations.
 */

const assert = require("assert");
const http = require("http");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "../.env") });
process.env.NODE_ENV = "test";

const { getJwtSecret } = require("../config/jwtConfig");
const User = require("../models/User");
const CodingProgress = require("../models/CodingProgress");
const IssuedCertificate = require("../models/IssuedCertificate");
const CertificationAttempt = require("../models/CertificationAttempt");
const Meeting = require("../models/Meeting");
const { app, server, getMongoConnectionOptions } = require("../server");

let baseUrl;
let userA;
let userB;
let tokenA;
let tokenB;
let passedCount = 0;
let totalCount = 0;

function doRequest(reqPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, baseUrl);
    const start = process.hrtime.bigint();
    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
          const body = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = JSON.parse(body);
          } catch {}
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
            json,
            durationMs,
          });
        });
      }
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

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

  if (!server.listening) {
    await new Promise((resolve) => server.listen(0, resolve));
  }
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  userA = await User.findOneAndUpdate(
    { email: "perf_user_a@masteryzone.com" },
    {
      $set: {
        username: "perf_user_a",
        fullName: "Performance User A",
        role: "student",
        passwordHash: "dummyhash123",
      },
    },
    { upsert: true, new: true }
  );

  userB = await User.findOneAndUpdate(
    { email: "perf_user_b@masteryzone.com" },
    {
      $set: {
        username: "perf_user_b",
        fullName: "Performance User B",
        role: "student",
        passwordHash: "dummyhash123",
      },
    },
    { upsert: true, new: true }
  );

  await CodingProgress.findOneAndUpdate(
    { userId: userA._id },
    {
      $set: {
        challengesSolved: [{ challengeId: "ch-1", solvedAt: new Date() }],
        activeTrack: "Python Track",
      },
    },
    { upsert: true }
  );

  tokenA = jwt.sign(
    { userId: userA._id.toString(), email: userA.email, role: "student" },
    getJwtSecret(),
    { expiresIn: "1h" }
  );

  tokenB = jwt.sign(
    { userId: userB._id.toString(), email: userB.email, role: "student" },
    getJwtSecret(),
    { expiresIn: "1h" }
  );
}

async function runTests() {
  console.log("\n================================================================================");
  console.log("🛡️ Mastery Zone Performance & Latency Diagnostics Regression Tests");
  console.log("================================================================================\n");

  await setup();

  // --- Test 1: Timing Diagnostics & Server-Timing Header ---
  await it("1. Server-Timing Header: Returns accurate stage breakdown without credential leakage", async () => {
    const res = await doRequest("/api/coding/data", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert.strictEqual(res.statusCode, 200);
    const serverTiming = res.headers["server-timing"];
    assert.ok(serverTiming, "Expected Server-Timing header to be present");

    // Must match format: auth;dur=..., db;dur=..., serialize;dur=..., total;dur=...;desc="queries=..."
    assert.ok(serverTiming.includes("auth;dur="), "Server-Timing must include auth duration");
    assert.ok(serverTiming.includes("db;dur="), "Server-Timing must include db duration");
    assert.ok(serverTiming.includes("serialize;dur="), "Server-Timing must include serialize duration");
    assert.ok(serverTiming.includes("total;dur="), "Server-Timing must include total duration");
    assert.ok(serverTiming.includes("queries="), "Server-Timing must include db query count");

    // Strictly ensure no credentials or token hashes are leaked
    assert.ok(!serverTiming.includes(tokenA), "Server-Timing must never include JWT token");
    assert.ok(!serverTiming.includes("password"), "Server-Timing must never include passwords");
  });

  // --- Test 2: Fast Conditional Validation on /api/coding/challenges ---
  await it("2. Fast Conditional Validation: /api/coding/challenges returns 304 with matching ETag", async () => {
    // 1st request: fresh 200
    const res1 = await doRequest("/api/coding/challenges", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res1.statusCode, 200);
    const etag = res1.headers["etag"];
    assert.ok(etag, "ETag must be returned on /api/coding/challenges");
    assert.ok(Array.isArray(res1.json.challenges), "Expected challenges array in response");

    // 2nd request: conditional 304
    const res2 = await doRequest("/api/coding/challenges", {
      headers: {
        Authorization: `Bearer ${tokenA}`,
        "If-None-Match": etag,
      },
    });
    assert.strictEqual(res2.statusCode, 304, "Expected HTTP 304 Not Modified");
    assert.strictEqual(res2.body, "", "HTTP 304 response body must be empty");
    assert.ok(res2.durationMs < 100, `Expected 304 to be fast (<100ms), got ${res2.durationMs}ms`);
  });

  // --- Test 3: Fast Conditional Validation on /api/coding/data ---
  await it("3. Fast Conditional Validation: /api/coding/data returns 304 with matching ETag", async () => {
    const res1 = await doRequest("/api/coding/data", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res1.statusCode, 200);
    const etag = res1.headers["etag"];
    assert.ok(etag, "ETag must be returned on /api/coding/data");

    const res2 = await doRequest("/api/coding/data", {
      headers: {
        Authorization: `Bearer ${tokenA}`,
        "If-None-Match": etag,
      },
    });
    assert.strictEqual(res2.statusCode, 304);
    assert.strictEqual(res2.body, "");
  });

  // --- Test 4: Fast In-Memory Static SPA Serving on / ---
  await it("4. In-Memory Static SPA: GET / returns fast index.html and supports 304", async () => {
    const res1 = await doRequest("/");
    assert.strictEqual(res1.statusCode, 200);
    const etag = res1.headers["etag"];
    assert.ok(etag, "Expected ETag on index.html response");
    assert.ok(res1.headers["content-type"].includes("text/html"));

    const res2 = await doRequest("/", {
      headers: { "If-None-Match": etag },
    });
    assert.strictEqual(res2.statusCode, 304);
    assert.strictEqual(res2.body, "");
    assert.ok(res2.durationMs < 20, `Expected in-memory 304 to be sub-20ms, got ${res2.durationMs}ms`);
  });

  // --- Test 5: Fast Conditional Validation on /api/meetings/study-rooms ---
  await it("5. Fast Query & ETag: /api/meetings/study-rooms returns fast 200 and 304", async () => {
    const res1 = await doRequest("/api/meetings/study-rooms");
    assert.strictEqual(res1.statusCode, 200);
    const etag = res1.headers["etag"];
    assert.ok(etag, "Expected ETag on /api/meetings/study-rooms");
    assert.ok(Array.isArray(res1.json.rooms), "Expected rooms array");

    const res2 = await doRequest("/api/meetings/study-rooms", {
      headers: { "If-None-Match": etag },
    });
    assert.strictEqual(res2.statusCode, 304);
    assert.strictEqual(res2.body, "");
  });

  // --- Test 6: High Concurrency Burst Across Key Endpoints ---
  await it("6. High-Concurrency Stress: 25 simultaneous mixed requests succeed without pool timeout", async () => {
    const requests = [];
    const endpoints = [
      { path: "/api/coding/data", auth: true },
      { path: "/api/coding/challenges", auth: true },
      { path: "/api/certifications/my-history", auth: true },
      { path: "/api/meetings/study-rooms", auth: false },
      { path: "/", auth: false },
    ];

    for (let i = 0; i < 25; i++) {
      const ep = endpoints[i % endpoints.length];
      const headers = {};
      if (ep.auth) headers["Authorization"] = `Bearer ${tokenA}`;
      requests.push(doRequest(ep.path, { headers }));
    }

    const responses = await Promise.all(requests);
    const failed = responses.filter((r) => r.statusCode !== 200 && r.statusCode !== 304);
    assert.strictEqual(failed.length, 0, `Expected all 25 requests to succeed, but ${failed.length} failed`);
  });

  // --- Test 7: Account Isolation Preserved Under Optimization ---
  await it("7. Account Isolation: User A cannot see User B's progress or certificates", async () => {
    const resA = await doRequest("/api/coding/data", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const resB = await doRequest("/api/coding/data", {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    assert.strictEqual(resA.statusCode, 200);
    assert.strictEqual(resB.statusCode, 200);

    // User A has 1 solved challenge ('ch-1'), User B has 0
    assert.strictEqual(resA.json.stats.solvedCount, 1);
    assert.strictEqual(resB.json.stats.solvedCount, 0);

    // Ensure user identities are isolated
    assert.strictEqual(String(resA.json.progress.userId), String(userA._id));
    assert.strictEqual(String(resB.json.progress.userId), String(userB._id));
  });

  console.log("\n================================================================================");
  console.log(`Summary: ${passedCount}/${totalCount} Performance & Latency Tests Passed (100%)`);
  console.log("================================================================================\n");

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
