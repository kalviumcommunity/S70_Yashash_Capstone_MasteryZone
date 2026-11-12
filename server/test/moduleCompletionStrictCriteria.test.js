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
  const uniqueEmail = `strict_tester_${Date.now()}@example.com`;

  testUser = await User.create({
    fullName: "Strict Criteria Tester",
    username: `strict_tester_${Date.now()}`,
    email: uniqueEmail,
    password: "TestPassword123!",
    role: "student",
    isEmailVerified: true,
  });

  testToken = jwt.sign(
    { userId: testUser._id, id: testUser._id, email: testUser.email, role: testUser.role },
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
  if (testUser?._id) {
    await User.deleteOne({ _id: testUser._id });
    await CodingProgress.deleteMany({ userId: testUser._id });
    await SubjectProgress.deleteMany({ userId: testUser._id });
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
  console.log("🚀 Module Completion Strict Criteria Verification");
  console.log("================================================================================\n");

  await setup();

  try {
    await it("Case 1: Module with only theory learning studied must NOT be completed", async () => {
      await SubjectProgress.create({
        userId: testUser._id,
        subjectKey: "coding",
        activeTrack: "python",
        moduleProgress: new Map([
          ["python_0", { isStudied: true, exercisePassed: false, assessmentPassed: false, bestScore: 0 }],
        ]),
      });

      const res = await fetch(`${baseUrl}/api/curriculum/coding/python`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);

      const mod0 = data.modules.find((m) => m.moduleIndex === 0);
      assert.ok(mod0);
      assert.strictEqual(mod0.isStudied, true);
      assert.strictEqual(mod0.isCompleted, false, "Module should not be completed when coding & MCQ are pending");
      assert.notStrictEqual(mod0.status, "completed");
    });

    await it("Case 2: Module with study + coding passed but MCQ not attempted must NOT be completed", async () => {
      let subProg = await SubjectProgress.findOne({ userId: testUser._id, subjectKey: "coding" });
      subProg.moduleProgress.set("python_0", {
        isStudied: true,
        exercisePassed: true,
        assignmentPassed: true,
        assessmentPassed: false,
        bestScore: 0,
      });
      subProg.markModified("moduleProgress");
      await subProg.save();

      const res = await fetch(`${baseUrl}/api/curriculum/coding/python`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const data = await res.json();
      const mod0 = data.modules.find((m) => m.moduleIndex === 0);
      assert.strictEqual(mod0.isStudied, true);
      assert.strictEqual(mod0.assignmentPassed, true);
      assert.strictEqual(mod0.isCompleted, false, "Module should not be completed when MCQ is pending");
    });

    await it("Case 3: Module with study + coding passed but MCQ score 70% (<80% cutoff) must NOT be completed", async () => {
      let subProg = await SubjectProgress.findOne({ userId: testUser._id, subjectKey: "coding" });
      subProg.moduleProgress.set("python_0", {
        isStudied: true,
        exercisePassed: true,
        assignmentPassed: true,
        assessmentPassed: true,
        bestScore: 70,
      });
      subProg.markModified("moduleProgress");
      await subProg.save();

      const res = await fetch(`${baseUrl}/api/curriculum/coding/python`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const data = await res.json();
      const mod0 = data.modules.find((m) => m.moduleIndex === 0);
      assert.strictEqual(mod0.isStudied, true);
      assert.strictEqual(mod0.assignmentPassed, true);
      assert.strictEqual(mod0.bestScore, 70);
      assert.strictEqual(mod0.isCompleted, false, "Module must NOT be completed when MCQ cutoff (<80%) is not met");
    });

    await it("Case 4: Module with study + coding passed + MCQ score 80% (>=80% cutoff) MUST be completed", async () => {
      let subProg = await SubjectProgress.findOne({ userId: testUser._id, subjectKey: "coding" });
      subProg.moduleProgress.set("python_0", {
        isStudied: true,
        exercisePassed: true,
        assignmentPassed: true,
        assessmentPassed: true,
        bestScore: 80,
      });
      subProg.markModified("moduleProgress");
      await subProg.save();

      const res = await fetch(`${baseUrl}/api/curriculum/coding/python`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const data = await res.json();
      const mod0 = data.modules.find((m) => m.moduleIndex === 0);
      assert.strictEqual(mod0.isStudied, true);
      assert.strictEqual(mod0.assignmentPassed, true);
      assert.strictEqual(mod0.bestScore, 80);
      assert.strictEqual(mod0.isCompleted, true, "Module MUST be completed when study, coding, and MCQ (>=80%) are satisfied");
      assert.strictEqual(mod0.status, "completed");
    });

    await it("Case 5: Module with MCQ score 100% but NO study or coding must NOT be completed", async () => {
      let subProg = await SubjectProgress.findOne({ userId: testUser._id, subjectKey: "coding" });
      subProg.moduleProgress.set("python_1", {
        isStudied: false,
        exercisePassed: false,
        assignmentPassed: false,
        assessmentPassed: true,
        bestScore: 100,
      });
      subProg.markModified("moduleProgress");
      await subProg.save();

      const res = await fetch(`${baseUrl}/api/curriculum/coding/python`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const data = await res.json();
      const mod1 = data.modules.find((m) => m.moduleIndex === 1);
      assert.strictEqual(mod1.isStudied, false);
      assert.strictEqual(mod1.assignmentPassed, false);
      assert.strictEqual(mod1.isCompleted, false, "Module must NOT be completed when only MCQ was done");
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
