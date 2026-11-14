const http = require("http");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { getJwtSecret } = require("../config/jwtConfig");
const User = require("../models/User");

function doRequest(baseUrl, reqPath, token, method = "GET", postData = null, ifNoneMatch = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, baseUrl);
    const start = process.hrtime.bigint();
    const headers = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (ifNoneMatch) {
      headers["If-None-Match"] = ifNoneMatch;
    }
    if (postData) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request(
      url,
      {
        method,
        headers,
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
            durationMs,
            bodyLength: Buffer.byteLength(body),
            serverTiming: res.headers["server-timing"] || "none",
            body,
          });
        });
      }
    );
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  const PORT = process.env.PORT || 5012;
  const baseUrl = `http://127.0.0.1:${PORT}`;

  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/masteryzone";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Admin user
  const adminUser = await User.findOne({
    $or: [{ role: "admin" }, { role: "SUPER_ADMIN" }, { isMainAdmin: true }],
    isGuest: { $ne: true },
  }).lean();

  // Student/User
  const studentUser = await User.findOne({
    role: { $in: ["user", "student"] },
    isGuest: { $ne: true },
    isAutomatedTestUser: { $ne: true },
  }).lean();

  const secret = getJwtSecret();
  const adminToken = jwt.sign(
    { userId: adminUser._id.toString(), email: adminUser.email, role: adminUser.role || "SUPER_ADMIN" },
    secret,
    { expiresIn: "2h" }
  );

  const studentToken = studentUser
    ? jwt.sign(
        { userId: studentUser._id.toString(), email: studentUser.email, role: studentUser.role || "student" },
        secret,
        { expiresIn: "2h" }
      )
    : adminToken;

  console.log("================================================================================");
  console.log("⚡ PHASE 2 — COMPREHENSIVE END-TO-END API PERFORMANCE AUDIT");
  console.log(`Target: ${baseUrl}`);
  console.log(`Admin Account: ${adminUser.email} (${adminUser._id})`);
  console.log(`Student Account: ${studentUser ? studentUser.email : "none"} (${studentUser ? studentUser._id : "none"})`);
  console.log("================================================================================");

  const endpoints = [
    // --- ADMIN PORTAL ENDPOINTS ---
    { group: "Admin", name: "Overview", path: "/api/admin/overview", token: adminToken },
    { group: "Admin", name: "Users List (P1)", path: "/api/admin/users?page=1&limit=10", token: adminToken },
    { group: "Admin", name: "Single User Detail", path: `/api/admin/users/${studentUser ? studentUser._id : adminUser._id}`, token: adminToken },
    { group: "Admin", name: "Live User Activity", path: "/api/admin/live-activity?page=1&limit=10", token: adminToken },
    { group: "Admin", name: "Learning Analytics", path: "/api/admin/learning-analytics", token: adminToken },
    { group: "Admin", name: "Coding Analytics", path: "/api/admin/coding-analytics?page=1&limit=10", token: adminToken },
    { group: "Admin", name: "Assessments (P1)", path: "/api/admin/assessments?page=1&limit=10", token: adminToken },
    { group: "Admin", name: "Proctoring Sessions", path: "/api/admin/proctoring?page=1&limit=10", token: adminToken },
    { group: "Admin", name: "Reports Management", path: "/api/admin/reports?page=1&limit=10", token: adminToken },
    { group: "Admin", name: "Recordings Management", path: "/api/admin/recordings?page=1&limit=10", token: adminToken },
    { group: "Admin", name: "Storage Diagnostics", path: "/api/admin/storage", token: adminToken },
    { group: "Admin", name: "Platform Settings", path: "/api/admin/settings", token: adminToken },
    { group: "Admin", name: "Notifications Feed", path: "/api/admin/notifications", token: adminToken },

    // --- USER DASHBOARD & STUDENT APIS ---
    { group: "User", name: "Auth /me Profile", path: "/api/auth/me", token: studentToken },
    { group: "User", name: "Coding Progress & Data", path: "/api/coding/data", token: studentToken },
    { group: "User", name: "Coding Challenges List", path: "/api/coding/challenges", token: studentToken },
    { group: "User", name: "Coding Submissions History", path: "/api/coding/submissions", token: studentToken },
    { group: "User", name: "Certifications Catalog", path: "/api/certifications", token: studentToken },
    { group: "User", name: "Certifications History", path: "/api/certifications/my-history", token: studentToken },
    { group: "User", name: "Subject Curriculum (Python)", path: "/api/curriculum/python", token: studentToken },
    { group: "User", name: "Progress Track (Python)", path: "/api/progress/python", token: studentToken },
    { group: "User", name: "Study Rooms (Meetings)", path: "/api/meetings/study-rooms", token: studentToken },
    { group: "User", name: "Support Tickets List", path: "/api/support/tickets", token: studentToken },
    { group: "User", name: "Student Notifications", path: "/api/notifications", token: studentToken },
  ];

  const results = [];
  console.log("\n[Endpoint Latency & Size Audit]\n");
  console.log(`${"Group".padEnd(8)} | ${"Endpoint Name".padEnd(28)} | ${"Status"} | ${"Cold (ms)".padStart(10)} | ${"Warm (ms)".padStart(10)} | ${"Payload".padStart(10)} | ${"DB Timing"}`);
  console.log("-".repeat(110));

  for (const ep of endpoints) {
    const res1 = await doRequest(baseUrl, ep.path, ep.token);
    const res2 = await doRequest(baseUrl, ep.path, ep.token, "GET", null, res1.headers?.["etag"]);

    const coldStr = res1.durationMs.toFixed(1);
    const warmStr = res2.durationMs.toFixed(1);
    const payloadStr = res1.bodyLength > 1024 ? `${(res1.bodyLength / 1024).toFixed(1)} KB` : `${res1.bodyLength} B`;

    console.log(
      `${ep.group.padEnd(8)} | ${ep.name.padEnd(28)} | ${String(res1.statusCode).padEnd(6)} | ${coldStr.padStart(10)} | ${warmStr.padStart(10)} | ${payloadStr.padStart(10)} | ${res1.serverTiming}`
    );

    results.push({
      group: ep.group,
      name: ep.name,
      path: ep.path,
      statusCode: res1.statusCode,
      coldMs: res1.durationMs,
      warmMs: res2.durationMs,
      payloadBytes: res1.bodyLength,
      serverTiming: res1.serverTiming,
    });
  }

  console.log("-".repeat(110));
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
