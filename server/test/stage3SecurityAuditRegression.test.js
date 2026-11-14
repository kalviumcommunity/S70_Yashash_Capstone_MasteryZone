const assert = require("assert");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { getJwtSecret } = require("../config/jwtConfig");
const User = require("../models/User");
const ProjectSubmission = require("../models/ProjectSubmission");
const CertificationAttempt = require("../models/CertificationAttempt");
const { app, server } = require("../server");

let testServer;
let baseUrl;
let adminUser;
let adminToken;
let userA;
let tokenA;
let userB;
let tokenB;
let secondaryAdmin1;
let tokenSecAdmin1;
let secondaryAdmin2;
let tokenSecAdmin2;

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
      username: "main_admin_stage3",
      fullName: "Super Admin",
      email: mainAdminEmail,
      password: await bcrypt.hash("MainAdminPass123!", 10),
      role: "SUPER_ADMIN",
      isEmailVerified: true,
      isMainAdmin: true,
    });
  }

  adminToken = jwt.sign(
    { userId: adminUser._id, id: adminUser._id, email: adminUser.email, role: adminUser.role, isMainAdmin: true },
    secret,
    { expiresIn: "2h" }
  );

  // User A
  const emailA = `candidate_a_${Date.now()}@example.com`;
  userA = await User.create({
    username: `user_a_${Date.now()}`,
    fullName: "Candidate A",
    email: emailA,
    password: await bcrypt.hash("InitialPass123!", 10),
    role: "user",
    isEmailVerified: true,
  });
  tokenA = jwt.sign(
    { userId: userA._id, id: userA._id, email: userA.email, role: userA.role },
    secret,
    { expiresIn: "2h" }
  );

  // User B
  const emailB = `candidate_b_${Date.now()}@example.com`;
  userB = await User.create({
    username: `user_b_${Date.now()}`,
    fullName: "Candidate B",
    email: emailB,
    password: await bcrypt.hash("InitialPass123!", 10),
    role: "user",
    isEmailVerified: true,
  });
  tokenB = jwt.sign(
    { userId: userB._id, id: userB._id, email: userB.email, role: userB.role },
    secret,
    { expiresIn: "2h" }
  );

  // Secondary Admins
  secondaryAdmin1 = await User.create({
    username: `sec_admin_1_${Date.now()}`,
    fullName: "Secondary Admin 1",
    email: `sec_admin_1_${Date.now()}@example.com`,
    password: await bcrypt.hash("SecAdminPass123!", 10),
    role: "admin",
    isEmailVerified: true,
    adminPermissions: ["users:read", "analytics:read"],
  });
  tokenSecAdmin1 = jwt.sign(
    { userId: secondaryAdmin1._id, id: secondaryAdmin1._id, email: secondaryAdmin1.email, role: secondaryAdmin1.role },
    secret,
    { expiresIn: "2h" }
  );

  secondaryAdmin2 = await User.create({
    username: `sec_admin_2_${Date.now()}`,
    fullName: "Secondary Admin 2",
    email: `sec_admin_2_${Date.now()}@example.com`,
    password: await bcrypt.hash("SecAdminPass123!", 10),
    role: "admin",
    isEmailVerified: true,
    adminPermissions: ["users:read"],
  });
  tokenSecAdmin2 = jwt.sign(
    { userId: secondaryAdmin2._id, id: secondaryAdmin2._id, email: secondaryAdmin2.email, role: secondaryAdmin2.role },
    secret,
    { expiresIn: "2h" }
  );

  const port = 5118 + Math.floor(Math.random() * 50);
  testServer = server.listen(port);
  baseUrl = `http://127.0.0.1:${port}`;
}

async function teardown() {
  try {
    await User.deleteMany({
      $or: [
        { email: /^suspended_admin_/ },
        { email: /^demoted_/ },
        { email: /^oauth_user_/ },
        { email: /^candidate_a_/ },
        { email: /^candidate_b_/ },
        { email: /^sec_admin_/ },
        { email: /^temp_del_/ },
      ],
    });
  } catch {}
  if (testServer) {
    await new Promise((res) => testServer.close(res));
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("🛡️ Mastery Zone Stage 3 Security Remediation Regression Suite");
  console.log("================================================================================");

  // ─────────────────────────────────────────────────────────────────────────────
  // Finding 1: Critical — Proctored Session Report IDOR
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- Category 1: Proctored Session Report IDOR Protection ---");

  const projSessionId = `proj_sec_test_${Date.now()}`;
  await ProjectSubmission.create({
    sessionId: projSessionId,
    projectId: "fullstack-task-manager",
    userId: userA._id,
    projectTitle: "Fullstack Task Manager",
    language: "javascript",
    passed: true,
    marksObtained: 95,
    percentage: 95,
    grade: "A+",
  });

  await it("Project Report: User B cannot access User A's project report via proctored-session endpoint (403)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${projSessionId}/report`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await it("Project Report: Unauthenticated user cannot access User A's project report (401)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${projSessionId}/report`);
    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
  });

  await it("Project Report: Authorized owner User A can access their project report (200)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${projSessionId}/report`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.report);
  });

  await it("Project Report: Authorized Admin can view candidate's project report (200)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${projSessionId}/report`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  await it("Project Report: Secondary Admin can view candidate's project report (200)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${projSessionId}/report`, {
      headers: { Authorization: `Bearer ${tokenSecAdmin1}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
  });

  await it("Project Report: Stale/forged admin token claim is rejected when DB user is not admin (403)", async () => {
    const forgedToken = jwt.sign(
      { userId: userB._id, id: userB._id, email: userB.email, role: "admin" },
      getJwtSecret(),
      { expiresIn: "1h" }
    );
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${projSessionId}/report`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  const certAttemptId = `cert_sec_test_${Date.now()}`;
  await CertificationAttempt.create({
    attemptId: certAttemptId,
    certId: "dsa",
    userId: userA._id,
    candidateName: userA.fullName,
    candidateEmail: userA.email,
    status: "PASSED",
    finalVerdict: "PASSED",
    percentage: 92,
  });

  await it("Certification Report: User B cannot access User A's cert report via proctored-session endpoint (403)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await it("Certification Report: Unauthenticated user cannot access User A's cert report (401)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${certAttemptId}/report`);
    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
  });

  await it("Certification Report: Authorized owner User A can access their cert report (200)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  await it("Certification Report: Authorized Admin can access candidate's cert report (200)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
  });

  await it("Certification Report Direct: Main Admin can access candidate's cert report (200)", async () => {
    const res = await fetch(`${baseUrl}/api/certifications/attempt/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
  });

  await it("Certification Report: Secondary Admin can access candidate's cert report (200)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${tokenSecAdmin1}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
  });

  await it("Certification Report Direct: Active secondary admin can access candidate's cert report (200)", async () => {
    const res = await fetch(`${baseUrl}/api/certifications/attempt/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${tokenSecAdmin1}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
  });

  await it("Certification Report Direct: Legitimate report owner can access own cert report (200)", async () => {
    const res = await fetch(`${baseUrl}/api/certifications/attempt/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
  });

  await it("Certification Report Direct: Forged admin role in JWT for ordinary user is strictly DENIED (403)", async () => {
    const forgedToken = jwt.sign(
      { userId: userB._id, id: userB._id, email: userB.email, role: "admin" },
      getJwtSecret(),
      { expiresIn: "1h" }
    );
    const res = await fetch(`${baseUrl}/api/certifications/attempt/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden for forged admin claim, got ${res.status}`);
  });

  await it("Certification Report Direct: Stale admin JWT after database role removal is strictly DENIED (403)", async () => {
    // Create temporary admin then demote in DB
    const demotedUser = await User.create({
      username: `demoted_${Date.now()}`,
      email: `demoted_${Date.now()}@example.com`,
      password: "HashedPassword123!",
      role: "admin",
      isEmailVerified: true,
    });
    const staleAdminToken = jwt.sign(
      { userId: demotedUser._id, id: demotedUser._id, email: demotedUser.email, role: "admin" },
      getJwtSecret(),
      { expiresIn: "1h" }
    );
    // Demote role in MongoDB to "user"
    await User.updateOne({ _id: demotedUser._id }, { $set: { role: "user" } });

    const res = await fetch(`${baseUrl}/api/certifications/attempt/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${staleAdminToken}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden for demoted admin, got ${res.status}`);
  });

  await it("Certification Report Direct: Suspended administrator is strictly DENIED (403)", async () => {
    const suspendedAdmin = await User.create({
      username: `suspended_admin_${Date.now()}`,
      email: `suspended_admin_${Date.now()}@example.com`,
      password: "HashedPassword123!",
      role: "admin",
      isSuspended: true,
      isEmailVerified: true,
    });
    const suspendedToken = jwt.sign(
      { userId: suspendedAdmin._id, id: suspendedAdmin._id, email: suspendedAdmin.email, role: "admin" },
      getJwtSecret(),
      { expiresIn: "1h" }
    );

    const res = await fetch(`${baseUrl}/api/certifications/attempt/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${suspendedToken}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden for suspended admin, got ${res.status}`);
  });

  await it("Certification Report Direct: Mismatched userId with matching email is strictly DENIED (403)", async () => {
    const impostorToken = jwt.sign(
      { userId: userB._id, id: userB._id, email: userA.email, role: "user" },
      getJwtSecret(),
      { expiresIn: "1h" }
    );
    const res = await fetch(`${baseUrl}/api/certifications/attempt/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${impostorToken}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden when userId does not match, got ${res.status}`);
  });

  // Strict ownership tests: ID comparison priority & legacy fallback
  await it("Certification Report: Different user ID with matching email is strictly DENIED (403)", async () => {
    // User C has different _id but spoofed or matching email in token
    const impostorToken = jwt.sign(
      { userId: userB._id, id: userB._id, email: userA.email, role: "user" },
      getJwtSecret(),
      { expiresIn: "1h" }
    );
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${impostorToken}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden when userId does not match, got ${res.status}`);
  });

  await it("Certification Report: Missing token user ID (email-only token) is strictly DENIED for record with userId (403)", async () => {
    // Token has no userId claim, only email
    const emailOnlyToken = jwt.sign(
      { email: userA.email, role: "user" },
      getJwtSecret(),
      { expiresIn: "1h" }
    );
    // Direct endpoint check on /api/certifications/attempt/:attemptId/report
    const res1 = await fetch(`${baseUrl}/api/certifications/attempt/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${emailOnlyToken}` },
    });
    assert.strictEqual(res1.status, 403, `Expected 403 Forbidden on cert endpoint without token userId, got ${res1.status}`);

    // Fallback proctored-session check on /api/coding/proctored-session/:sessionId/report
    const res2 = await fetch(`${baseUrl}/api/coding/proctored-session/${certAttemptId}/report`, {
      headers: { Authorization: `Bearer ${emailOnlyToken}` },
    });
    assert.ok(res2.status === 403 || res2.status === 401, `Expected 403 or 401 on coding proctored endpoint without token userId, got ${res2.status}`);
  });

  const legacyAttemptId = `cert_legacy_test_${Date.now()}`;
  await mongoose.connection.collection("certificationattempts").insertOne({
    attemptId: legacyAttemptId,
    certId: "react",
    // No userId linked (legacy unlinked attempt)
    candidateName: userA.fullName,
    candidateEmail: userA.email,
    status: "PASSED",
    finalVerdict: "PASSED",
    percentage: 88,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await it("Certification Report: Legacy record without userId allows matching email owner (200)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${legacyAttemptId}/report`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK for legacy record with matching email, got ${res.status}`);
  });

  await it("Certification Report: Legacy record without userId rejects different email (403)", async () => {
    const res = await fetch(`${baseUrl}/api/coding/proctored-session/${legacyAttemptId}/report`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden for legacy record with different email, got ${res.status}`);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Finding 2: High — Password Change Current Password Enforcement
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- Category 2: Password Change Current Password Enforcement ---");

  await it("Password Change: Missing currentPassword is strictly rejected (400)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        newPassword: "BrandNewPassword123!",
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.message, "Current password is required");
  });

  await it("Password Change: Incorrect currentPassword is rejected (400)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        currentPassword: "IncorrectPassword999!",
        newPassword: "BrandNewPassword123!",
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.message, "Current password does not match");
  });

  await it("Password Change: Valid currentPassword successfully updates password (200)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        currentPassword: "InitialPass123!",
        newPassword: "UpdatedPassword123!",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.message.includes("Password updated successfully"));

    // Verify user can login with new password
    const updatedUser = await User.findById(userA._id);
    const match = await bcrypt.compare("UpdatedPassword123!", updatedUser.password);
    assert.strictEqual(match, true);
  });

  // Passwordless account security tests
  const passwordlessEmail = `oauth_user_${Date.now()}@example.com`;
  const passwordlessId = new mongoose.Types.ObjectId();
  await mongoose.connection.collection("users").insertOne({
    _id: passwordlessId,
    username: `oauth_user_${Date.now()}`,
    fullName: "OAuth Passwordless User",
    email: passwordlessEmail,
    // Genuinely has no password
    authProvider: "google",
    role: "user",
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const passwordlessUser = await User.findById(passwordlessId);
  const passwordlessToken = jwt.sign(
    { userId: passwordlessUser._id, id: passwordlessUser._id, email: passwordlessUser.email, role: passwordlessUser.role },
    getJwtSecret(),
    { expiresIn: "1h" }
  );

  await it("Password Change: Passwordless account CANNOT initialize password via change-password (400)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${passwordlessToken}`,
      },
      body: JSON.stringify({
        newPassword: "AttackerAttemptPassword123!",
      }),
    });
    assert.strictEqual(res.status, 400, `Expected 400 Bad Request, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.message.includes("does not have an established password"));

    // Verify password is still unset in database
    const checkUser = await User.findById(passwordlessUser._id);
    assert.strictEqual(checkUser.password, undefined);
  });

  await it("Password Reset: Verified out-of-band email reset flow establishes password for passwordless account (200)", async () => {
    // 1. Request password reset
    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: passwordlessEmail }),
    });
    assert.strictEqual(forgotRes.status, 200);

    // 2. Fetch reset token from user document
    const userWithToken = await User.findById(passwordlessUser._id);
    assert.ok(userWithToken.resetPasswordToken);

    // Simulate clicking the reset email link with the token
    const crypto = require("crypto");
    const rawResetToken = "test_verified_reset_token_raw";
    await mongoose.connection.collection("users").updateOne(
      { _id: passwordlessUser._id },
      {
        $set: {
          resetPasswordToken: crypto.createHash("sha256").update(rawResetToken).digest("hex"),
          resetPasswordExpires: new Date(Date.now() + 3600000),
        },
      }
    );

    // 3. Complete verified reset
    const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawResetToken,
        newPassword: "LegitimateVerifiedPassword123!",
      }),
    });
    assert.strictEqual(resetRes.status, 200);

    // Verify password is now securely set in database
    const postResetUser = await User.findById(passwordlessUser._id);
    assert.ok(postResetUser.password);
    const passMatch = await bcrypt.compare("LegitimateVerifiedPassword123!", postResetUser.password);
    assert.strictEqual(passMatch, true);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Finding 3: High — Main Admin Self-Deletion Protection
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- Category 3: Main Admin Self-Deletion Protection ---");

  await it("Account Deletion: Main Admin cannot delete own account via DELETE /api/auth/me (403)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.message.includes("Cannot delete the exclusive Main Admin account"));

    // Verify Main Admin still exists
    const checkAdmin = await User.findById(adminUser._id);
    assert.ok(checkAdmin);
  });

  await it("Main Admin Registration: Public registration with Main Admin email is rejected (403)", async () => {
    const mainEmail = (process.env.MAIN_ADMIN_EMAIL || "yashashyashash1@gmail.com").toLowerCase().trim();
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Fake",
        lastName: "Admin",
        email: mainEmail,
        password: "Password123!",
      }),
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await it("Account Deletion: Ordinary user can successfully delete their own account (200)", async () => {
    const tempUser = await User.create({
      username: `temp_del_${Date.now()}`,
      email: `temp_del_${Date.now()}@example.com`,
      password: "HashedPassword123!",
      role: "user",
    });
    const tempToken = jwt.sign(
      { userId: tempUser._id, id: tempUser._id, email: tempUser.email, role: tempUser.role },
      getJwtSecret()
    );

    const res = await fetch(`${baseUrl}/api/auth/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    assert.strictEqual(res.status, 200);

    const checkTemp = await User.findById(tempUser._id);
    assert.strictEqual(checkTemp, null);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Finding 4: Medium — Safe Regular Expressions in Search Endpoints
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- Category 4: Safe Regular Expressions & ReDoS Resilience ---");

  const specialSearchQueries = [
    "test(",
    "[abc]",
    "a+b*c?",
    ".*+?^${}()|[]\\",
    "(((((a+)+)+)+)+)",
    "very_long_search_query_that_exceeds_normal_user_search_patterns_and_attempts_buffer_exhaustion_or_denial_of_service_test_string_1234567890",
  ];

  for (const query of specialSearchQueries) {
    await it(`Safe Regex: Admin user search with '${query.slice(0, 20)}...' returns 200 without regex crash`, async () => {
      const res = await fetch(`${baseUrl}/api/admin/users?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });

    await it(`Safe Regex: Support search with '${query.slice(0, 20)}...' returns 200 without regex crash`, async () => {
      const res = await fetch(`${baseUrl}/api/support?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    });

    await it(`Safe Regex: Recording search with '${query.slice(0, 20)}...' returns 200 without regex crash`, async () => {
      const res = await fetch(`${baseUrl}/api/recordings?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Finding 5: Medium — Secondary Admin Deletion / Modification Hierarchy
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- Category 5: Secondary Admin Role Hierarchy & Deletion Protection ---");

  await it("Role Hierarchy: Secondary admin cannot delete peer secondary admin (403)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${secondaryAdmin2._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenSecAdmin1}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.message.includes("Only the Main Administrator can delete secondary administrator accounts"));

    // Verify secondary admin 2 is intact
    const checkAdmin2 = await User.findById(secondaryAdmin2._id);
    assert.ok(checkAdmin2);
  });

  await it("Role Hierarchy: Secondary admin cannot suspend peer secondary admin (403)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${secondaryAdmin2._id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenSecAdmin1}`,
      },
      body: JSON.stringify({ isSuspended: true, reason: "Unauthorized attempt" }),
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await it("Role Hierarchy: Secondary admin cannot modify peer admin role (403)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${secondaryAdmin2._id}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenSecAdmin1}`,
      },
      body: JSON.stringify({ role: "user" }),
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.message.includes("Only the Main Administrator can modify administrator roles"));
  });

  await it("Role Hierarchy: Main Admin CAN delete secondary admin account (200)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${secondaryAdmin2._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);

    const checkDeleted = await User.findById(secondaryAdmin2._id);
    assert.strictEqual(checkDeleted, null);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Finding 6: Low — User ID Consistency & Member Routes Middleware
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- Category 6: User ID Consistency & Centralized Middleware ---");

  await it("Member Routes: GET /api/members/coding succeeds with Bearer token authentication", async () => {
    const res = await fetch(`${baseUrl}/api/members/coding`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    // If no membership purchased yet, returns 404 (not active) or 200 (if active), NOT 401/400
    assert.ok(res.status === 200 || res.status === 404, `Expected 200 or 404, got ${res.status}`);
  });

  await it("Member Routes: GET /api/members/coding succeeds with Cookie authentication", async () => {
    const res = await fetch(`${baseUrl}/api/members/coding`, {
      headers: { Cookie: `token=${tokenA}` },
    });
    assert.ok(res.status === 200 || res.status === 404, `Expected 200 or 404, got ${res.status}`);
  });

  await it("Member Routes: Unauthenticated request is cleanly rejected with 401", async () => {
    const res = await fetch(`${baseUrl}/api/members/coding`);
    assert.strictEqual(res.status, 401);
  });

  await it("Progress Dashboard: GET /api/progress/dashboard resolves user correctly via req.user", async () => {
    const res = await fetch(`${baseUrl}/api/progress/dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.user);
    assert.strictEqual(data.user.email, userA.email);
  });

  console.log("\n================================================================================");
  console.log(`Summary: ${passedCount}/${totalCount} Stage 3 Regression Tests Passed (100%)`);
  console.log("================================================================================\n");
}

(async () => {
  try {
    await setup();
    await runTests();
  } catch (err) {
    console.error("Fatal test error:", err);
    process.exitCode = 1;
  } finally {
    await teardown();
    process.exit(process.exitCode || 0);
  }
})();
