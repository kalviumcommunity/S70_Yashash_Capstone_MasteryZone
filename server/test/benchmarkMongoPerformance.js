const http = require("http");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { getJwtSecret } = require("../config/jwtConfig");
const User = require("../models/User");
const dbPoolMonitor = require("../config/dbPoolMonitor");

function doRequest(baseUrl, reqPath, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, baseUrl);
    const start = process.hrtime.bigint();
    const req = http.request(
      url,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept": "application/json",
        },
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
            bodyLength: body.length,
            serverTiming: res.headers["server-timing"] || "none",
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function run() {
  const PORT = process.env.PORT || 5012;
  const baseUrl = `http://127.0.0.1:${PORT}`;

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/masteryzone";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  const adminUser = await User.findOne({
    $or: [{ role: "admin" }, { role: "SUPER_ADMIN" }, { isMainAdmin: true }],
    isGuest: { $ne: true },
  }).lean();

  if (!adminUser) {
    console.error("❌ No admin user found in database!");
    process.exit(1);
  }

  const adminSecret = getJwtSecret();
  const token = jwt.sign(
    {
      userId: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role || "admin",
    },
    adminSecret,
    { expiresIn: "2h" }
  );

  console.log("================================================================================");
  console.log("🔍 MONGODB & API PERFORMANCE BENCHMARK");
  console.log(`Target: ${baseUrl}`);
  console.log(`Authenticated as: ${adminUser.email} (${adminUser.role}) [ID: ${adminUser._id}]`);
  console.log("================================================================================");

  // Pool before
  const poolBeforeRes = await doRequest(baseUrl, "/health/db", token);
  console.log("\n[Initial DB Health & Pool State]");
  try {
    const poolData = JSON.parse(poolBeforeRes.body);
    console.log(`  State: ${poolData.connectionState}, Status: ${poolData.status}`);
    console.log(`  Pool: max=${poolData.pool?.maxPoolSize}, min=${poolData.pool?.minPoolSize}, active=${poolData.pool?.activeConnections}, available=${poolData.pool?.availableConnections}, current=${poolData.pool?.currentPoolSize}, waitQueue=${poolData.pool?.waitQueueSize}, peakWaitQueue=${poolData.pool?.peakWaitQueueSize}`);
  } catch (e) {
    console.log("  Could not parse pool state:", String(poolBeforeRes.body).slice(0, 100));
  }

  const endpoints = [
    { name: "Admin Overview", path: "/api/admin/overview" },
    { name: "Admin Coding Analytics", path: "/api/admin/coding-analytics" },
    { name: "Admin Assessments", path: "/api/admin/assessments" },
    { name: "Admin Reports", path: "/api/admin/reports" },
    { name: "Admin Users (page 1)", path: "/api/admin/users?page=1&limit=10" },
    { name: "Admin Storage", path: "/api/admin/storage" },
    { name: "Admin Recordings", path: "/api/admin/recordings" },
    { name: "Admin Live Activity", path: "/api/admin/live-activity" },
    { name: "User Auth Profile", path: "/api/auth/me" },
  ];

  console.log("\n[Sequential Baseline Measurements]");
  const results = [];
  for (const ep of endpoints) {
    // 1st run (cold / uncached)
    const res1 = await doRequest(baseUrl, ep.path, token);
    // 2nd run (warm)
    const res2 = await doRequest(baseUrl, ep.path, token);

    console.log(`  ${ep.name.padEnd(26)} -> Status: ${res1.statusCode} | Cold: ${res1.durationMs.toFixed(1)}ms (Timing: ${res1.serverTiming}) | Warm: ${res2.durationMs.toFixed(1)}ms`);
    results.push({ name: ep.name, coldMs: res1.durationMs, warmMs: res2.durationMs, timing: res1.serverTiming });
  }

  console.log("\n[Concurrency Burst Test: 10 parallel Admin Overview + Reports + Assessments requests]");
  const burstStart = process.hrtime.bigint();
  const burstPromises = [];
  for (let i = 0; i < 5; i++) {
    burstPromises.push(doRequest(baseUrl, "/api/admin/overview", token));
    burstPromises.push(doRequest(baseUrl, "/api/admin/reports", token));
    burstPromises.push(doRequest(baseUrl, "/api/admin/assessments", token));
  }
  const burstResponses = await Promise.all(burstPromises);
  const burstDurationMs = Number(process.hrtime.bigint() - burstStart) / 1e6;
  const burstAvgMs = burstResponses.reduce((sum, r) => sum + r.durationMs, 0) / burstResponses.length;
  console.log(`  Burst completed 15 requests in ${burstDurationMs.toFixed(1)}ms (Avg: ${burstAvgMs.toFixed(1)}ms per req)`);

  // Pool after
  const poolAfterRes = await doRequest(baseUrl, "/health/db", token);
  console.log("\n[Post-Benchmark DB Pool State]");
  try {
    const poolData = JSON.parse(poolAfterRes.body);
    console.log(`  Pool: current=${poolData.pool?.currentPoolSize}, active=${poolData.pool?.activeConnections}, available=${poolData.pool?.availableConnections}, waitQueue=${poolData.pool?.waitQueueSize}, peakWaitQueue=${poolData.pool?.peakWaitQueueSize}, totalCheckouts=${poolData.pool?.totalCheckouts}`);
  } catch (e) {}

  console.log("\n================================================================================");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
