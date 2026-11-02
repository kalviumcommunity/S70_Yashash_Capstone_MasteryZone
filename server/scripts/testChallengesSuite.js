const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const API_BASE = "http://localhost:5012";

async function run() {
  console.log("=== RUNNING CODING CHALLENGES VALIDATION SUITE ===");

  // Connect to DB directly to check / clean test user data
  const mongoUri = process.env.db_url || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/masteryzone";
  await mongoose.connect(mongoUri);

  const User = require("../models/User");
  const CodingProgress = require("../models/CodingProgress");
  const Progress = require("../models/ProgressSchema");
  const ChallengeSubmission = require("../models/ChallengeSubmission");

  // Find or create test user
  let user = await User.findOne({ email: "learner@masteryzone.com" });
  if (!user) {
    user = await User.findOne({});
  }
  if (!user) {
    console.error("No test user found in MongoDB");
    process.exit(1);
  }

  const userId = user._id.toString();
  console.log(`Using test user: ${user.email} (${userId})`);

  const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
  const token = jwt.sign({ userId, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      testsFailed++;
    }
  }

  // 1. Fetch coding data
  console.log("\n[TEST 1] GET /api/coding/data - 65 Challenges & 15 Topics");
  const dataRes = await fetch(`${API_BASE}/api/coding/data`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(dataRes.status === 200, "GET /api/coding/data returns 200 OK");
  const codingData = await dataRes.json();

  assert(Array.isArray(codingData.challenges), "codingData contains challenges array");
  assert(codingData.challenges.length === 65, `Expected 65 challenges, got ${codingData.challenges.length}`);

  const categories = new Set(codingData.challenges.map(c => c.category));
  console.log(`  Detected categories: ${Array.from(categories).join(", ")}`);
  assert(categories.size >= 15, `Expected at least 15 categories, found ${categories.size}`);

  const sampleChallenge = codingData.challenges.find(c => c.id === "ch_two_sum");
  assert(sampleChallenge && sampleChallenge.testCases.length === 10, "ch_two_sum has 10 test cases");

  // 2. Strict Completion Rule: Failing partial test case awards 0 XP
  console.log("\n[TEST 2] Strict Completion Rule - Partial test pass awards 0 XP");
  // Clean prior solutions for ch_two_sum
  await CodingProgress.updateOne({ userId }, { $pull: { challengesSolved: { challengeId: "ch_two_sum" } } });
  await Progress.deleteMany({ userId, task: { $regex: /ch_two_sum|Two Sum/i } });

  // Code that only works for test 1 and fails others
  const partialCode = `import sys
lines = sys.stdin.read().strip().split('\\n')
print('[0, 1]')
`;

  const submitPartialRes = await fetch(`${API_BASE}/api/coding/challenges/ch_two_sum/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ language: "python", code: partialCode })
  });

  const partialData = await submitPartialRes.json();
  assert(submitPartialRes.status === 200, "Partial submission returns 200");
  assert(partialData.passed === false, "Partial submission passed === false");
  assert(partialData.status === "WRONG_ANSWER", "Partial submission status === 'WRONG_ANSWER'");
  assert(partialData.xpEarned === 0, `Partial submission xpEarned is 0 (got ${partialData.xpEarned})`);

  // Verify DB did NOT award XP or add to challengesSolved
  const userProgAfterPartial = await CodingProgress.findOne({ userId });
  const isRecordedPartial = (userProgAfterPartial?.challengesSolved || []).some(c => c.challengeId === "ch_two_sum");
  assert(!isRecordedPartial, "Partial submission NOT recorded in CodingProgress.challengesSolved");

  // 3. 100% Pass: Strict Completion succeeds and awards XP
  console.log("\n[TEST 3] 100% Test Pass - Awards XP & records completed challenge");
  const fullPassCode = `import sys, json

lines = sys.stdin.read().strip().split('\\n')
nums = json.loads(lines[0])
target = int(lines[1])

seen = {}
for i, num in enumerate(nums):
    diff = target - num
    if diff in seen:
        print(f"[{seen[diff]}, {i}]")
        sys.exit(0)
    seen[num] = i
`;

  const initialProgressCount = await Progress.countDocuments({ userId, track: "CODING" });

  const submitFullRes = await fetch(`${API_BASE}/api/coding/challenges/ch_two_sum/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ language: "python", code: fullPassCode })
  });

  const fullData = await submitFullRes.json();
  assert(submitFullRes.status === 200, "100% submission returns 200");
  assert(fullData.passed === true, "100% submission passed === true");
  assert(fullData.status === "ACCEPTED", "100% submission status === 'ACCEPTED'");
  assert(fullData.score === 100, `Score is 100% (got ${fullData.score}%)`);
  assert(fullData.passedCount === 10, `Passed 10/10 tests (got ${fullData.passedCount})`);
  assert(fullData.xpEarned === 50, `Awarded Easy XP 50 (got ${fullData.xpEarned})`);
  assert(fullData.alreadySolved === false, "First-time solve alreadySolved === false");

  // Verify DB state
  const userProgAfterFull = await CodingProgress.findOne({ userId });
  const recorded = (userProgAfterFull?.challengesSolved || []).find(c => c.challengeId === "ch_two_sum");
  assert(!!recorded && recorded.score === 100, "ch_two_sum recorded in challengesSolved with score 100");

  const progressAfterFull = await Progress.countDocuments({ userId, track: "CODING" });
  assert(progressAfterFull === initialProgressCount + 1, "New Progress document created in database");

  // 4. Duplicate rewards prevention
  console.log("\n[TEST 4] Duplicate Rewards Prevention on Re-submission");
  const resubmitRes = await fetch(`${API_BASE}/api/coding/challenges/ch_two_sum/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ language: "python", code: fullPassCode })
  });

  const resubmitData = await resubmitRes.json();
  assert(resubmitData.passed === true, "Resubmission is still passed === true");
  assert(resubmitData.alreadySolved === true, "Resubmission detected alreadySolved === true");
  assert(resubmitData.xpEarned === 0, `Resubmission awards 0 additional XP (got ${resubmitData.xpEarned})`);

  const progressAfterResubmit = await Progress.countDocuments({ userId, track: "CODING" });
  assert(progressAfterResubmit === progressAfterFull, "No duplicate Progress document created in database");

  // 5. Verify /auth/me reflects completed challenges and badges on user profile
  console.log("\n[TEST 5] GET /auth/me - Profile tracking & Badges");
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(meRes.status === 200, "GET /auth/me returns 200");
  const meData = await meRes.json();
  assert(meData.stats.solvedChallengesCount >= 1, `Profile reflects solvedChallengesCount >= 1 (got ${meData.stats.solvedChallengesCount})`);
  assert(meData.stats.totalCodingXp >= 50, `Profile reflects totalCodingXp >= 50 (got ${meData.stats.totalCodingXp})`);
  assert(Array.isArray(meData.stats.challengesSolved), "Profile contains challengesSolved array");

  // 6. Verify GET /api/coding/data reflects completed status
  console.log("\n[TEST 6] GET /api/coding/data - Challenge marked as completed");
  const reDataRes = await fetch(`${API_BASE}/api/coding/data`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const reData = await reDataRes.json();
  const updatedChallenge = reData.challenges.find(c => c.id === "ch_two_sum");
  assert(updatedChallenge.solved === true, "ch_two_sum has solved === true");
  assert(updatedChallenge.isCompleted === true, "ch_two_sum has isCompleted === true");
  assert(reData.stats.solvedCount >= 1, `codingData.stats.solvedCount is updated (got ${reData.stats.solvedCount})`);

  console.log(`\n=== TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED ===\n`);
  await mongoose.disconnect();
  process.exit(testsFailed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
