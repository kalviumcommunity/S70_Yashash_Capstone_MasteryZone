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
const ChallengeSubmission = require("../models/ChallengeSubmission");
const { app, server } = require("../server");

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
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  }

  const secret = getJwtSecret();

  testUser = await User.create({
    username: `coder_${Date.now()}`,
    fullName: "Coding Verified Student",
    email: `coder_${Date.now()}@example.com`,
    password: "Password123!",
    role: "student",
    streak: 3,
    isEmailVerified: true,
  });

  testToken = jwt.sign(
    { userId: testUser._id, id: testUser._id, email: testUser.email, role: testUser.role },
    secret,
    { expiresIn: "1h" }
  );

  // Add real coding records
  await CodingProgress.create({
    userId: testUser._id,
    completedChallenges: ["ch_1", "ch_2", "ch_3"],
    totalSubmissions: 5,
    trackLessons: new Map([
      ["python", 2],
      ["dsa", 3],
      ["javascript", 1],
    ]),
  });

  await SubjectProgress.create({
    userId: testUser._id,
    subjectKey: "coding",
    activeTrack: "python",
    trackLessons: new Map([
      ["python", 2],
      ["javascript", 1],
    ]),
    moduleProgress: new Map([
      ["python_0", { isStudied: true, exercisePassed: true, studyTimeSeconds: 1200 }],
      ["python_1", { isStudied: true, exercisePassed: true, studyTimeSeconds: 1500 }],
    ]),
  });

  await ChallengeSubmission.create({
    userId: testUser._id,
    challengeId: "ch_1",
    challengeTitle: "Two Sum Optimal",
    language: "python",
    status: "ACCEPTED",
    score: 100,
    totalTests: 10,
    passedTests: 10,
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
  if (testUser?._id) {
    await User.deleteOne({ _id: testUser._id });
    await CodingProgress.deleteMany({ userId: testUser._id });
    await SubjectProgress.deleteMany({ userId: testUser._id });
    await ChallengeSubmission.deleteMany({ userId: testUser._id });
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
  console.log("🚀 Coding-Only Progress Page & Dashboard Verification");
  console.log("================================================================================\n");

  await setup();

  try {
    await it("Progress Dashboard: Exclusively returns genuine coding tracks", async () => {
      const res = await fetch(`${baseUrl}/api/progress/dashboard`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();

      assert.ok(Array.isArray(data.tracksProgress));
      const trackKeys = data.tracksProgress.map((t) => t.key);
      console.log("      Track Keys returned:", trackKeys);

      assert.ok(trackKeys.includes("PYTHON"));
      assert.ok(trackKeys.includes("DSA"));
      assert.ok(trackKeys.includes("JAVASCRIPT"));
      assert.ok(trackKeys.includes("CPP"));
      assert.ok(trackKeys.includes("JAVA"));
      assert.ok(trackKeys.includes("WEBDEV"));

      // Strictly verify no unrelated tracks
      assert.strictEqual(trackKeys.includes("LANGUAGE"), false);
      assert.strictEqual(trackKeys.includes("VEHICLES"), false);
      assert.strictEqual(trackKeys.includes("DRIVING"), false);
      assert.strictEqual(trackKeys.includes("FITNESS"), false);
    });

    await it("Progress Dashboard: Real user coding progress is accurately calculated", async () => {
      const res = await fetch(`${baseUrl}/api/progress/dashboard`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const data = await res.json();

      const pythonTrack = data.tracksProgress.find((t) => t.key === "PYTHON");
      assert.ok(pythonTrack);
      assert.strictEqual(pythonTrack.completedLessons >= 2, true);
      assert.strictEqual(pythonTrack.percentage > 0, true);

      const dsaTrack = data.tracksProgress.find((t) => t.key === "DSA");
      assert.ok(dsaTrack);
      assert.strictEqual(dsaTrack.completedLessons >= 3, true);

      // Verify stats reflect user's real coding activity
      assert.strictEqual(data.stats.streak, 3);
      assert.strictEqual(data.stats.learningHours > 0, true);
    });

    await it("Progress Dashboard: Achievements contain only coding achievements", async () => {
      const res = await fetch(`${baseUrl}/api/progress/dashboard`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const data = await res.json();

      const achievements = data.recentAchievements || [];
      const hasUnrelated = achievements.some((a) =>
        ["LANGUAGE", "FITNESS", "VEHICLES", "DRIVING"].includes(a.track)
      );
      assert.strictEqual(hasUnrelated, false);
    });

    await it("Progress Dashboard: Recent activities reflect real coding submissions", async () => {
      const res = await fetch(`${baseUrl}/api/progress/dashboard`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const data = await res.json();

      const activities = data.recentActivity || [];
      assert.ok(activities.length > 0);
      assert.ok(activities.some((a) => a.title.includes("Two Sum") || a.track === "DSA"));
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
