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
const {
  getDateString,
  daysBetween,
  calculateStreaks,
  getIntensityLevel,
  recordDailyCodingActivity,
  getUserCodingActivity,
} = require("../utils/activityTracker");
const { app, server } = require("../server");

let testServer;
let baseUrl;
let testUser1;
let tokenUser1;
let testUser2;
let tokenUser2;
let adminUser;
let adminToken;
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
  const time = Date.now();

  // Test User 1 (Active developer with submissions)
  testUser1 = await User.create({
    fullName: "Streak Master One",
    username: `streak_user_${time}`,
    email: `streak_user_${time}@test.com`,
    password: "TestPassword123!",
    role: "student",
    isEmailVerified: true,
  });
  tokenUser1 = jwt.sign(
    { userId: testUser1._id, id: testUser1._id, email: testUser1.email, role: testUser1.role },
    secret,
    { expiresIn: "1h" }
  );

  // Test User 2 (Brand new user for empty state verification)
  testUser2 = await User.create({
    fullName: "Brand New Learner",
    username: `new_learner_${time}`,
    email: `new_learner_${time}@test.com`,
    password: "TestPassword123!",
    role: "student",
    isEmailVerified: true,
  });
  tokenUser2 = jwt.sign(
    { userId: testUser2._id, id: testUser2._id, email: testUser2.email, role: testUser2.role },
    secret,
    { expiresIn: "1h" }
  );

  // Admin User
  adminUser = await User.create({
    fullName: "Platform Admin",
    username: `admin_streak_${time}`,
    email: `admin_streak_${time}@test.com`,
    password: "AdminPassword123!",
    role: "SUPER_ADMIN",
    isMainAdmin: true,
    isEmailVerified: true,
  });
  adminToken = jwt.sign(
    { userId: adminUser._id, id: adminUser._id, email: adminUser.email, role: adminUser.role, isMainAdmin: true },
    secret,
    { expiresIn: "1h" }
  );

  await new Promise((resolve) => {
    testServer = server.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function teardown() {
  const userIds = [testUser1?._id, testUser2?._id, adminUser?._id].filter(Boolean);
  if (userIds.length > 0) {
    await User.deleteMany({ _id: { $in: userIds } });
    await DailyCodingActivity.deleteMany({ userId: { $in: userIds } });
    await ChallengeSubmission.deleteMany({ userId: { $in: userIds } });
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
  console.log("🚀 LeetCode-Style Daily Activity Streak Calendar Verification");
  console.log("================================================================================\n");

  await setup();

  try {
    await it("1. Streak calculation: consecutive days logic and timezones", async () => {
      const tz = "Asia/Kolkata";
      const today = getDateString(new Date(), tz);
      const [y, m, d] = today.split("-").map(Number);

      const yesterday = getDateString(new Date(Date.UTC(y, m - 1, d - 1)), tz);
      const twoDaysAgo = getDateString(new Date(Date.UTC(y, m - 1, d - 2)), tz);
      const fourDaysAgo = getDateString(new Date(Date.UTC(y, m - 1, d - 4)), tz);

      // Active today, yesterday, and two days ago -> 3 day streak
      const resA = calculateStreaks([twoDaysAgo, yesterday, today], tz);
      assert.strictEqual(resA.currentStreak, 3);
      assert.strictEqual(resA.longestStreak, 3);
      assert.strictEqual(resA.streakActiveToday, true);

      // Active yesterday and 2 days ago, but NOT yet today -> 2 day streak (not broken today)
      const resB = calculateStreaks([twoDaysAgo, yesterday], tz);
      assert.strictEqual(resB.currentStreak, 2);
      assert.strictEqual(resB.longestStreak, 2);
      assert.strictEqual(resB.streakActiveToday, false);

      // Broken streak: active 4 days ago, skipped yesterday and today -> streak 0
      const resC = calculateStreaks([fourDaysAgo], tz);
      assert.strictEqual(resC.currentStreak, 0);
      assert.strictEqual(resC.longestStreak, 1);
    });

    await it("2. Intensity Level mapping: matches GitHub/LeetCode 0-4 scales", async () => {
      assert.strictEqual(getIntensityLevel(0), 0);
      assert.strictEqual(getIntensityLevel(1), 1);
      assert.strictEqual(getIntensityLevel(2), 1);
      assert.strictEqual(getIntensityLevel(3), 2);
      assert.strictEqual(getIntensityLevel(4), 2);
      assert.strictEqual(getIntensityLevel(5), 3);
      assert.strictEqual(getIntensityLevel(7), 3);
      assert.strictEqual(getIntensityLevel(8), 4);
      assert.strictEqual(getIntensityLevel(15), 4);
    });

    await it("3. Empty state for new users: returns 0 streak and clean calendar", async () => {
      const res = await fetch(`${baseUrl}/api/coding/activity`, {
        headers: { Authorization: `Bearer ${tokenUser2}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.currentStreak, 0);
      assert.strictEqual(data.longestStreak, 0);
      assert.strictEqual(data.totalSubmissions, 0);
      assert.strictEqual(data.totalProblemsSolved, 0);
      assert.strictEqual(data.activeDays, 0);
      assert.strictEqual(data.streakActiveToday, false);
    });

    await it("4. Recording submissions: updates DailyCodingActivity and User.streak", async () => {
      const rec = await recordDailyCodingActivity({
        userId: testUser1._id,
        activityType: "challenge",
        targetId: "two_sum",
        title: "Two Sum Optimal",
        status: "ACCEPTED",
        language: "python",
        score: 100,
        passedTests: 10,
        totalTests: 10,
        timeZone: "Asia/Kolkata",
      });

      assert.ok(rec);
      assert.strictEqual(rec.currentStreak, 1);
      assert.strictEqual(rec.streakActiveToday, true);

      const dbDoc = await DailyCodingActivity.findOne({
        userId: testUser1._id,
        date: getDateString(new Date(), "Asia/Kolkata"),
      });
      assert.ok(dbDoc);
      assert.strictEqual(dbDoc.submissionsCount, 1);
      assert.strictEqual(dbDoc.problemsSolved, 1);
      assert.ok(dbDoc.solvedChallengeIds.includes("two_sum"));

      // Submitting the same problem again increments submissionsCount but avoids duplicate problemsSolved
      await recordDailyCodingActivity({
        userId: testUser1._id,
        activityType: "challenge",
        targetId: "two_sum",
        title: "Two Sum Optimal",
        status: "ACCEPTED",
        language: "python",
        score: 100,
        passedTests: 10,
        totalTests: 10,
        timeZone: "Asia/Kolkata",
      });

      const updatedDoc = await DailyCodingActivity.findOne({
        userId: testUser1._id,
        date: getDateString(new Date(), "Asia/Kolkata"),
      });
      assert.strictEqual(updatedDoc.submissionsCount, 2);
      assert.strictEqual(updatedDoc.problemsSolved, 1, "Duplicate solve of same problem must not inflate problem count");

      // Verify User model was updated with verified streak
      const userDoc = await User.findById(testUser1._id);
      assert.strictEqual(userDoc.streak, 1);
    });

    await it("5. Preserves historical submissions from ChallengeSubmission", async () => {
      // Simulate historical submission from 3 days ago
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      await ChallengeSubmission.create({
        userId: testUser1._id,
        challengeId: "valid_parentheses",
        challengeTitle: "Valid Parentheses",
        language: "javascript",
        code: "function isValid() { return true; }",
        status: "ACCEPTED",
        score: 100,
        passedTests: 8,
        totalTests: 8,
        createdAt: threeDaysAgo,
      });

      const activity = await getUserCodingActivity(testUser1._id, "Asia/Kolkata");
      assert.strictEqual(activity.activeDays >= 2, true);
      assert.strictEqual(activity.totalProblemsSolved >= 2, true);
      assert.strictEqual(activity.totalSubmissions >= 3, true);

      const histDateStr = getDateString(threeDaysAgo, "Asia/Kolkata");
      assert.ok(activity.calendarData[histDateStr]);
      assert.strictEqual(activity.calendarData[histDateStr].count, 1);
      assert.strictEqual(activity.calendarData[histDateStr].solvedCount, 1);
    });

    await it("6. API endpoint GET /api/coding/activity returns authenticated user data", async () => {
      const res = await fetch(`${baseUrl}/api/coding/activity?tz=Asia/Kolkata`, {
        headers: { Authorization: `Bearer ${tokenUser1}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.currentStreak, 1);
      assert.strictEqual(data.streakActiveToday, true);
      assert.strictEqual(data.totalProblemsSolved >= 2, true);
    });

    await it("7. Security check: User cannot view another user's activity without admin rights", async () => {
      // User 2 attempts to query User 1's activity
      const res = await fetch(`${baseUrl}/api/coding/activity/${testUser1._id}`, {
        headers: { Authorization: `Bearer ${tokenUser2}` },
      });
      assert.strictEqual(res.status, 403);
    });

    await it("8. Admin visibility: Admin can query any user's activity heatmap", async () => {
      const res = await fetch(`${baseUrl}/api/coding/activity/${testUser1._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.currentStreak, 1);
      assert.strictEqual(data.activeDays >= 2, true);
    });

    await it("9. Admin portal endpoint GET /api/admin/users/:id includes activityStats", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/${testUser1._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.data.activityStats);
      assert.strictEqual(data.data.activityStats.currentStreak, 1);
      assert.strictEqual(data.data.user.streak, 1);
    });

    console.log(`\n================================================================================`);
    console.log(`Summary: ${passedCount}/${totalCount} tests passed cleanly!`);
    console.log(`================================================================================\n`);
  } finally {
    await teardown();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
