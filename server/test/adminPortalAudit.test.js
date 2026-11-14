/**
 * Standalone Node.js Test Suite for MasteryZone Admin Portal Audit & Pagination
 * Runs directly via: node server/test/adminPortalAudit.test.js
 */
const assert = require("assert");
const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const User = require("../models/User");
const adminRoutes = require("../routes/adminRoutes");

const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/jwtConfig");

const app = express();
app.use(express.json());
app.use("/api/admin", adminRoutes);

let authToken = "";

function makeRequest(server, path) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const port = addr.port;
    const options = {
      hostname: "127.0.0.1",
      port,
      path,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function runAuditSuite() {
  console.log("\n" + "=".repeat(80));
  console.log("🚀 MasteryZone Admin Portal Audit & Pagination Test Suite");
  console.log("=".repeat(80) + "\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/masteryzone_test";
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB Connected to Atlas/Database");

  let adminUser = await User.findOne({ email: "yashashyashash1@gmail.com" });
  if (!adminUser) {
    adminUser = await User.create({
      fullName: "Super Admin Yashash",
      username: "yashash_admin",
      email: "yashashyashash1@gmail.com",
      role: "SUPER_ADMIN",
      password: "SuperSecretPassword123!",
      isEmailVerified: true,
    });
  } else {
    adminUser.role = "SUPER_ADMIN";
    await adminUser.save();
  }

  authToken = jwt.sign(
    { userId: adminUser._id, id: adminUser._id, email: adminUser.email, role: "SUPER_ADMIN" },
    getJwtSecret(),
    { expiresIn: "1h" }
  );
  console.log("🔐 Super Admin JWT Auth Token generated for test runner");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  console.log(`📡 Local Test Harness running on port ${port}\n`);

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Assessments API Pagination (limit=10)
  await test("Assessments API: enforces 10 records per page and returns pagination metadata", async () => {
    const res = await makeRequest(server, "/api/admin/assessments?page=1&limit=10");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.assessments));
    assert.ok(res.body.assessments.length <= 10, "Assessments count must be <= 10");
    assert.ok(res.body.pagination, "Pagination metadata must be present");
    assert.strictEqual(res.body.pagination.limit, 10);
    assert.strictEqual(res.body.pagination.page, 1);
    assert.strictEqual(typeof res.body.pagination.total, "number");
    assert.strictEqual(typeof res.body.pagination.totalPages, "number");
  });

  // 2. Assessments Category Filtering
  await test("Assessments API: category filtering isolates requested assessment type", async () => {
    const res = await makeRequest(server, "/api/admin/assessments?page=1&limit=10&category=Certification");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    if (res.body.assessments.length > 0) {
      res.body.assessments.forEach((item) => {
        assert.strictEqual(item.type, "Certification");
      });
    }
  });

  // 3. Users API Pagination & Exact ID Search
  await test("Users API: enforces 10 records per page and supports exact ObjectId search", async () => {
    let anyUser = await User.findOne({
      role: { $nin: ["SUPER_ADMIN", "admin"] },
      isGuest: { $ne: true },
      email: { $not: /@example\.com$/i },
    }).lean();

    if (!anyUser) {
      anyUser = await User.create({
        fullName: "Genuine Candidate Yashash",
        username: "yashash_candidate_audit",
        email: "candidate_audit_yashash@gmail.com",
        role: "student",
        isGuest: false,
      });
    }
    assert.ok(anyUser, "Should find or have at least one registered genuine user");

    // Exact ObjectId search
    const idRes = await makeRequest(server, `/api/admin/users?search=${anyUser._id}&limit=10`);
    assert.strictEqual(idRes.status, 200);
    assert.strictEqual(idRes.body.success, true);
    const users = idRes.body.data?.users || idRes.body.users;
    assert.ok(users.length >= 1, "Should find matched user by exact ID");
    assert.strictEqual(String(users[0]._id), String(anyUser._id));
    assert.ok(users.length <= 10, "User page size must be <= 10");
  });

  // 4. Coding Analytics API Pagination
  await test("Coding Analytics API: enforces 10 submissions per page", async () => {
    const res = await makeRequest(server, "/api/admin/coding-analytics?page=1&limit=10");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.recentSubmissions));
    assert.ok(res.body.recentSubmissions.length <= 10, "Submissions count must be <= 10");
    assert.ok(res.body.pagination, "Pagination must be defined");
    assert.strictEqual(res.body.pagination.limit, 10);
  });

  // 5. Reports API Pagination
  await test("Reports API: enforces 10 reports per page with pagination metadata", async () => {
    const res = await makeRequest(server, "/api/admin/reports?page=1&limit=10");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.reports));
    assert.ok(res.body.reports.length <= 10, "Reports count must be <= 10");
    assert.ok(res.body.pagination, "Pagination metadata must be defined");
    assert.strictEqual(res.body.pagination.limit, 10);
  });

  // 6. Proctoring API Pagination
  await test("Proctoring API: enforces 10 proctoring sessions per page", async () => {
    const res = await makeRequest(server, "/api/admin/proctoring?page=1&limit=10");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.sessions));
    assert.ok(res.body.sessions.length <= 10, "Proctoring sessions must be <= 10");
    assert.ok(res.body.pagination, "Pagination must be defined");
    assert.strictEqual(res.body.pagination.limit, 10);
  });

  // 7. Recordings API Pagination
  await test("Recordings API: enforces 10 recordings per page", async () => {
    const res = await makeRequest(server, "/api/admin/recordings?page=1&limit=10");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.recordings));
    assert.ok(res.body.recordings.length <= 10, "Recordings must be <= 10");
    assert.ok(res.body.pagination, "Pagination must be defined");
    assert.strictEqual(res.body.pagination.limit, 10);
  });

  // 8. Live Activity API Pagination
  await test("Live Activity API: enforces 10 activities per page", async () => {
    const res = await makeRequest(server, "/api/admin/live-activity?page=1&limit=10");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.activities));
    assert.ok(res.body.activities.length <= 10, "Activities must be <= 10");
    assert.strictEqual(res.body.page, 1);
  });

  server.close();
  await mongoose.connection.close();

  console.log("\n" + "=".repeat(80));
  console.log(`Summary: ${passed}/${total} audit & pagination tests passed cleanly!`);
  console.log("=".repeat(80) + "\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runAuditSuite().catch((err) => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
