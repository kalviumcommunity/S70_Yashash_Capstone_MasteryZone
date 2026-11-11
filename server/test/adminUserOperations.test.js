const assert = require("assert");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { getJwtSecret } = require("../config/jwtConfig");
const User = require("../models/User");
const CodingProgress = require("../models/CodingProgress");
const SubjectProgress = require("../models/SubjectProgress");
const { app, server } = require("../server");

let testServer;
let baseUrl;
let adminUser;
let adminToken;
let candidateUser;

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
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  }

  const secret = getJwtSecret();
  const mainAdminEmail = (process.env.MAIN_ADMIN_EMAIL || "yashashyashash1@gmail.com").toLowerCase().trim();

  adminUser = await User.findOne({ email: mainAdminEmail });
  if (!adminUser) {
    adminUser = await User.create({
      username: "main_admin_test",
      fullName: "Super Admin",
      email: mainAdminEmail,
      password: "HashedPassword123!",
      role: "SUPER_ADMIN",
      isEmailVerified: true,
    });
  }

  adminToken = jwt.sign(
    { userId: adminUser._id, id: adminUser._id, email: adminUser.email, role: adminUser.role },
    secret,
    { expiresIn: "1h" }
  );

  candidateUser = await User.create({
    username: `learner_${Date.now()}`,
    fullName: "Test Learner",
    email: `learner_${Date.now()}@example.com`,
    password: "Password123!",
    role: "student",
    isEmailVerified: true,
  });

  await CodingProgress.create({
    userId: candidateUser._id,
    completedChallenges: ["c1", "c2"],
    totalSubmissions: 5,
  });

  await SubjectProgress.create({
    userId: candidateUser._id,
    subjectKey: "coding",
    completedLessons: ["l1"],
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
  if (candidateUser?._id) {
    await User.deleteOne({ _id: candidateUser._id });
    await CodingProgress.deleteMany({ userId: candidateUser._id });
    await SubjectProgress.deleteMany({ userId: candidateUser._id });
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
  console.log("🛡️ Admin Portal User Operations & Live Analytics Verification");
  console.log("================================================================================\n");

  await setup();

  try {
    await it("Admin Role Update: Successfully updates user role to mentor", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/${candidateUser._id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: "mentor" }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, "mentor");

      const inDb = await User.findById(candidateUser._id);
      assert.strictEqual(inDb.role, "mentor");
    });

    await it("Admin Role Update: Rejects invalid role names with 400", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/${candidateUser._id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: "unauthorized_role" }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
    });

    await it("Main Admin Protection: Strictly refuses demoting or modifying Main Admin role (403)", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/${adminUser._id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: "student" }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 403);
      assert.strictEqual(data.success, false);
    });

    await it("Admin Password Reset: Sets direct temporary password and flags mustChangePassword", async () => {
      const tempPass = "TempPass2026!Secure";
      const res = await fetch(`${baseUrl}/api/admin/users/${candidateUser._id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ newPassword: tempPass }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);

      const inDb = await User.findById(candidateUser._id);
      assert.strictEqual(inDb.mustChangePassword, true);

      const bcrypt = require("bcrypt");
      const matched = await bcrypt.compare(tempPass, inDb.password);
      assert.strictEqual(matched, true);
    });

    await it("Admin Password Reset: Generates reset token when no direct password is provided", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/${candidateUser._id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ sendEmail: false }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.resetToken, "resetToken must be returned");

      const inDb = await User.findById(candidateUser._id);
      assert.ok(inDb.resetPasswordToken);
      assert.ok(inDb.resetPasswordExpires > Date.now());
    });

    await it("Main Admin Protection: Strictly refuses deleting Main Admin account (403)", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/${adminUser._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 403);
      assert.strictEqual(data.success, false);
    });

    await it("Admin Delete User: Permanently deletes candidate account and cascades records", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/${candidateUser._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);

      const userInDb = await User.findById(candidateUser._id);
      assert.strictEqual(userInDb, null);

      const cp = await CodingProgress.findOne({ userId: candidateUser._id });
      assert.strictEqual(cp, null);

      const sp = await SubjectProgress.findOne({ userId: candidateUser._id });
      assert.strictEqual(sp, null);
    });

    await it("Admin Overview: Returns real track distribution without hardcoded fake data", async () => {
      const res = await fetch(`${baseUrl}/api/admin/overview?range=30d`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data.learningTrackDistribution));
      assert.ok(Array.isArray(data.data.activityTrend));
      // Ensure zero placeholder names
      const jsonStr = JSON.stringify(data);
      assert.ok(!jsonStr.includes("Jagathpriyan"));
      assert.ok(!jsonStr.includes("candidate@masteryzone.com"));
    });

    console.log(`\n================================================================================`);
    console.log(`Summary: ${passedCount}/${totalCount} tests passed cleanly!`);
    console.log(`================================================================================\n`);
  } finally {
    await teardown();
  }
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
