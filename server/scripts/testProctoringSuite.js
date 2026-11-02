const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const API_BASE = "http://localhost:5012";

async function runProctoringSuite() {
  console.log("=== MASTERY ZONE PROCTORING SUITE: AUTOMATED VERIFICATION ===\n");
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
    { userId: testUserId, email: "proctoring_student@masteryzone.com" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  assert(!!token, "Authenticated test student token generated");

  // TEST 1: START PROCTORED SESSION
  console.log("\n[TEST 1] Start Proctored Session (/api/coding/proctored-session/start)");
  let sessionId = "";
  try {
    const res = await fetch(`${API_BASE}/api/coding/proctored-session/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        questionId: "python_0",
        questionTitle: "Two Sum & Hash Table Mastery",
        timeLimitMinutes: 30,
        batteryLevel: 94,
        displaySurface: "monitor",
      }),
    });

    assert(res.status === 200, "Start proctored session HTTP 200");
    const data = await res.json();
    assert(!!data.sessionId, `Session ID returned: ${data.sessionId}`);
    assert((data.status || "").toUpperCase() === "ACTIVE", `Session status is ACTIVE (got ${data.status})`);
    assert(typeof data.serverTime === "number", "Server authoritative timestamp returned");
    assert(typeof data.deadline === "number", "Authoritative server deadline returned");
    assert(data.deadline > data.serverTime, "Server deadline is in the future (+30 mins)");
    sessionId = data.sessionId;
  } catch (err) {
    assert(false, `Start session failed with error: ${err.message}`);
  }

  // TEST 2: PERIODIC HEARTBEAT
  console.log("\n[TEST 2] Periodic Heartbeat (/api/coding/proctored-session/heartbeat)");
  try {
    const res = await fetch(`${API_BASE}/api/coding/proctored-session/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId,
        batteryLevel: 92,
      }),
    });

    assert(res.status === 200, "Heartbeat HTTP 200");
    const data = await res.json();
    assert(data.success === true, "Heartbeat acknowledged by server");
    assert(data.isTerminated === false, "Session is not terminated");
    assert(typeof data.timeRemaining === "number" && data.timeRemaining > 0, "Server returned active remaining seconds");
  } catch (err) {
    assert(false, `Heartbeat failed with error: ${err.message}`);
  }

  // TEST 3: PROCTORING EVENT LOGGING & VIOLATION ESCALATION
  console.log("\n[TEST 3] Proctoring Event Logging & Violation Escalation (/api/coding/proctored-session/event)");
  try {
    // Event 1: Tab Switch
    const res1 = await fetch(`${API_BASE}/api/coding/proctored-session/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId,
        eventType: "TAB_SWITCH",
        details: "Candidate switched to background tab",
        batteryLevel: 91,
      }),
    });
    assert(res1.status === 200, "Log event 1 HTTP 200");
    const d1 = await res1.json();
    assert(d1.violationsCount === 1, `Violations count incremented to 1 (got ${d1.violationsCount})`);
    assert(d1.isTerminated === false, "Assessment continues after 1 violation");

    // Event 2: Fullscreen Exit
    const res2 = await fetch(`${API_BASE}/api/coding/proctored-session/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId,
        eventType: "FULLSCREEN_EXIT",
        details: "Candidate exited fullscreen window",
        batteryLevel: 90,
      }),
    });
    const d2 = await res2.json();
    assert(d2.violationsCount === 2, `Violations count incremented to 2 (got ${d2.violationsCount})`);

    // Event 3: Screenshare Interrupted
    const res3 = await fetch(`${API_BASE}/api/coding/proctored-session/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId,
        eventType: "SCREENSHARE_STOPPED",
        details: "Screen sharing stream was cancelled",
        batteryLevel: 89,
      }),
    });
    const d3 = await res3.json();
    assert(d3.violationsCount === 3, `Violations count incremented to 3 (got ${d3.violationsCount})`);
  } catch (err) {
    assert(false, `Event logging failed with error: ${err.message}`);
  }

  // TEST 4: FINAL SUBMISSION FINALIZATION
  console.log("\n[TEST 4] Final Submission Finalization (/api/coding/proctored-session/submit)");
  try {
    const res = await fetch(`${API_BASE}/api/coding/proctored-session/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId,
        code: "def twoSum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return [lookup[diff], i]\n        lookup[num] = i\n    return []\n",
        language: "python",
        passedTests: 10,
        totalTests: 10,
        score: 100,
        passed: true,
      }),
    });

    assert(res.status === 200, "Submit proctored assessment HTTP 200");
    const data = await res.json();
    assert((data.status || "").toUpperCase() === "SUBMITTED", `Session status finalized to SUBMITTED (got ${data.status})`);
    assert(data.submissionResult.score === 100, "Submission score 100% persisted");
    assert(data.submissionResult.passedTests === 10, "10/10 passed tests persisted");
    assert(data.submissionResult.passed === true, "Session passed state persisted as true");
  } catch (err) {
    assert(false, `Final submission failed with error: ${err.message}`);
  }

  // TEST 5: 5-VIOLATION STRICT TERMINATION
  console.log("\n[TEST 5] 5-Violation Strict Termination Enforcement");
  try {
    // Start a new session to test termination
    const startRes = await fetch(`${API_BASE}/api/coding/proctored-session/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        questionId: "python_1",
        questionTitle: "Binary Search Integrity Test",
        timeLimitMinutes: 15,
        batteryLevel: 85,
        displaySurface: "monitor",
      }),
    });
    const startData = await startRes.json();
    const termSessionId = startData.sessionId;

    // Trigger 5 violations
    let lastData = null;
    for (let i = 1; i <= 5; i++) {
      const vRes = await fetch(`${API_BASE}/api/coding/proctored-session/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: termSessionId,
          eventType: "SECURITY_BREACH",
          details: `Violation test iteration #${i}`,
          batteryLevel: 85 - i,
        }),
      });
      lastData = await vRes.json();
    }

    assert(lastData.violationsCount === 5, `Violations reached 5 (got ${lastData.violationsCount})`);
    assert(lastData.isTerminated === true, "Session auto-terminated upon reaching 5 violations");
    assert((lastData.status || "").toUpperCase() === "TERMINATED", `Session status changed to TERMINATED (got ${lastData.status})`);

    // Verify heartbeat now reports terminated
    const hbRes = await fetch(`${API_BASE}/api/coding/proctored-session/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId: termSessionId,
        batteryLevel: 80,
      }),
    });
    const hbData = await hbRes.json();
    assert(hbData.isTerminated === true, "Heartbeat recognizes server termination flag");
  } catch (err) {
    assert(false, `Termination test failed with error: ${err.message}`);
  }

  console.log("\n======================================================");
  console.log(`PROCTORING TEST SUMMARY: ${passed} / ${assertions} assertions passed (${Math.round((passed / assertions) * 100)}%)`);
  console.log("======================================================\n");

  if (passed === assertions) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runProctoringSuite();
