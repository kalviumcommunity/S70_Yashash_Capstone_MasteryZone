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
const { app, server, getMongoConnectionOptions } = require("../server");

function doRequest(baseUrl, reqPath, options = {}) {
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
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
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

async function run() {
  const mongoUri = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/masteryzone_test";
  const poolOpts = getMongoConnectionOptions({ serverSelectionTimeoutMS: 5000, minPoolSize: 2 });
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, poolOpts);
  }

  let port;
  if (!server.listening) {
    await new Promise((resolve) => server.listen(0, resolve));
  }
  port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const testUser = await User.findOneAndUpdate(
    { email: "perf_test_user@masteryzone.com" },
    {
      $set: {
        username: "perf_tester",
        fullName: "Perf Tester",
        role: "student",
        passwordHash: "dummyhash123",
      },
    },
    { upsert: true, new: true }
  );

  await CodingProgress.findOneAndUpdate(
    { userId: testUser._id },
    {
      $set: {
        challengesSolved: [
          { challengeId: "ch-1", solvedAt: new Date() },
          { challengeId: "ch-2", solvedAt: new Date() },
        ],
        activeTrack: "Python Track",
      },
    },
    { upsert: true }
  );

  const testToken = jwt.sign(
    { userId: testUser._id.toString(), email: testUser.email, role: "student" },
    getJwtSecret(),
    { expiresIn: "1h" }
  );

  const endpoints = [
    { name: "/api/coding/data", path: "/api/coding/data", auth: true },
    { name: "/api/coding/challenges", path: "/api/coding/challenges", auth: true },
    { name: "/api/certifications/my-history", path: "/api/certifications/my-history", auth: true },
    { name: "/api/meetings/study-rooms", path: "/api/meetings/study-rooms", auth: false },
    { name: "/ (index.html)", path: "/", auth: false },
  ];

  console.log("\n=======================================================");
  console.log("   PERFORMANCE BASELINE MEASUREMENT (BEFORE FIX)");
  console.log("=======================================================\n");

  const results = [];

  for (const ep of endpoints) {
    const headers = {};
    if (ep.auth) headers["Authorization"] = `Bearer ${testToken}`;

    // 1. Uncached request (HTTP 200)
    const uncachedTimes = [];
    let etag = null;
    console.log(`Testing endpoint: ${ep.name} (${ep.path})`);
    for (let i = 0; i < 3; i++) {
      const res = await doRequest(baseUrl, ep.path, { headers });
      uncachedTimes.push(res.durationMs);
      if (res.headers["etag"]) etag = res.headers["etag"];
    }
    const avgUncached = uncachedTimes.reduce((a, b) => a + b, 0) / uncachedTimes.length;

    // 2. Conditional request with If-None-Match (HTTP 304 if supported)
    const conditionalTimes = [];
    let conditionalStatus = null;
    let queryCountDuring304 = 0;

    if (etag) {
      headers["If-None-Match"] = etag;

      // Track DB queries during 304
      const countQueries = () => { queryCountDuring304++; };
      mongoose.connection.on("query", countQueries);

      for (let i = 0; i < 3; i++) {
        const res = await doRequest(baseUrl, ep.path, { headers });
        conditionalStatus = res.statusCode;
        conditionalTimes.push(res.durationMs);
      }
      mongoose.connection.removeListener("query", countQueries);
    }
    const avgConditional = conditionalTimes.length > 0
      ? conditionalTimes.reduce((a, b) => a + b, 0) / conditionalTimes.length
      : null;

    results.push({
      endpoint: ep.name,
      avgUncachedMs: avgUncached.toFixed(2),
      etagPresent: Boolean(etag),
      conditionalStatus,
      avgConditional304Ms: avgConditional ? avgConditional.toFixed(2) : "N/A",
    });
  }

  // 3. Concurrency test: 15 concurrent requests to /api/coding/data
  console.log("Running concurrency test: 15 simultaneous requests to /api/coding/data...");
  const t0 = process.hrtime.bigint();
  const concurrentPromises = Array.from({ length: 15 }, () =>
    doRequest(baseUrl, "/api/coding/data", {
      headers: { Authorization: `Bearer ${testToken}` },
    })
  );
  const concurrentRes = await Promise.all(concurrentPromises);
  const totalConcurrentDurationMs = Number(process.hrtime.bigint() - t0) / 1e6;
  const maxSingleDurationMs = Math.max(...concurrentRes.map((r) => r.durationMs));
  const minSingleDurationMs = Math.min(...concurrentRes.map((r) => r.durationMs));

  console.table(results);
  console.log(`\nConcurrency 15x /api/coding/data:`);
  console.log(`  Total Batch Duration: ${totalConcurrentDurationMs.toFixed(2)} ms`);
  console.log(`  Min Request Duration: ${minSingleDurationMs.toFixed(2)} ms`);
  console.log(`  Max Request Duration: ${maxSingleDurationMs.toFixed(2)} ms`);

  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  console.log("\nDone.\n");
}

run().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
