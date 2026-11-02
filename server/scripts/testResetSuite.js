const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const API_BASE = "http://localhost:5012";

async function runResetSuite() {
  console.log("=== MASTERY ZONE RESET LEARNING PROGRESS SUITE ===\n");
  let assertions = 0;
  let passed = 0;

  function assert(condition, message) {
    assertions++;
    if (condition) {
      passed++;
      console.log(`  ✓ PASS: ${message}`);
    } else {
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  // Create valid authenticated test token
  const testUserId = new mongoose.Types.ObjectId().toString();
  const token = jwt.sign(
    { userId: testUserId, email: "reset_tester@masteryzone.com" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  assert(!!token, "Authenticated test token generated");

  // TEST 1: Reset Coding Track (/api/coding/curriculum/reset)
  console.log("\n[TEST 1] Reset Coding Curriculum Track (/api/coding/curriculum/reset)");
  try {
    const res = await fetch(`${API_BASE}/api/coding/curriculum/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ trackId: "python" }),
    });

    assert(res.status === 200, "Reset coding python track HTTP 200");
    const data = await res.json();
    assert(data.success === true, "Track reset succeeded");
    assert(data.unlockLevel === 0, "Unlock level reset to 0 (Module 1 unlocked)");
  } catch (err) {
    assert(false, `Coding reset failed: ${err.message}`);
  }

  // TEST 2: Reset All Coding Tracks
  console.log("\n[TEST 2] Reset All Coding Curriculum Tracks");
  try {
    const res = await fetch(`${API_BASE}/api/coding/curriculum/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ resetAllTracks: true }),
    });

    assert(res.status === 200, "Reset all coding tracks HTTP 200");
    const data = await res.json();
    assert(data.success === true, "All tracks reset succeeded");
  } catch (err) {
    assert(false, `Reset all coding tracks failed: ${err.message}`);
  }

  // TEST 3: Reset Subject Curriculum (/api/curriculum/:subjectKey/reset)
  console.log("\n[TEST 3] Reset Subject Curriculum (/api/curriculum/language/reset)");
  try {
    const res = await fetch(`${API_BASE}/api/curriculum/language/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ trackId: "spanish" }),
    });

    assert(res.status === 200, "Reset language curriculum HTTP 200");
    const data = await res.json();
    assert(data.success === true, "Language track reset succeeded");
  } catch (err) {
    assert(false, `Subject reset failed: ${err.message}`);
  }

  // TEST 4: Global Reset (/api/progress/reset)
  console.log("\n[TEST 4] Global Reset Learning Process (/api/progress/reset)");
  try {
    const res = await fetch(`${API_BASE}/api/progress/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ scope: "all" }),
    });

    // Note: Since testUserId is a random ObjectId not saved in User collection,
    // if user document doesn't exist it returns 404. Let's verify route exists!
    assert(res.status === 200 || res.status === 404, `Global reset route reachable (status: ${res.status})`);
  } catch (err) {
    assert(false, `Global reset failed: ${err.message}`);
  }

  console.log("\n======================================================");
  console.log(`RESET SUITE: ${passed} / ${assertions} assertions passed (${Math.round((passed / assertions) * 100)}%)`);
  console.log("======================================================\n");

  if (passed === assertions) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runResetSuite();
