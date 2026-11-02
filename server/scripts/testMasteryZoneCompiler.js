// Rigorous End-to-End Verification of Mastery Zone Real-Time Compiler
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const API_BASE = "http://localhost:5012";

async function run() {
  console.log("=== MASTERY ZONE COMPILER SUITE: AUTOMATED VERIFICATION ===");
  const testUserId = new mongoose.Types.ObjectId().toString();
  const token = jwt.sign({ userId: testUserId, email: "compiler_test@masteryzone.com" }, JWT_SECRET, {
    expiresIn: "1h",
  });

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Helper for requests
  async function post(url, body, headers = authHeaders) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
  }

  async function get(url, headers = authHeaders) {
    const res = await fetch(`${API_BASE}${url}`, { headers });
    return { status: res.status, data: await res.json() };
  }

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  // 1. Multi-Language Compiler / Sandbox Execution
  console.log("\n[TEST 1] Universal Sandboxed Execution (/api/coding/execute)");

  // 1a. Python
  {
    const res = await post("/api/coding/execute", {
      language: "python",
      code: "import sys\nname = sys.stdin.read().strip()\nprint(f'Hello, {name}!')",
      stdin: "MasteryZone",
    });
    assert(res.status === 200, "Python execution HTTP 200");
    assert(res.data.output.trim() === "Hello, MasteryZone!", `Python stdout correct: "${res.data.output.trim()}"`);
    assert(res.data.duration > 0, `Python duration measured: ${res.data.duration}ms`);
  }

  // 1b. JavaScript (Node.js)
  {
    const res = await post("/api/coding/execute", {
      language: "javascript",
      code: "const fs = require('fs'); const n = parseInt(fs.readFileSync(0, 'utf8').trim(), 10); console.log(n * n);",
      stdin: "9",
    });
    assert(res.status === 200, "JavaScript execution HTTP 200");
    assert(res.data.output.trim() === "81", `JS stdout correct: "${res.data.output.trim()}"`);
  }

  // 1c. C++
  {
    const res = await post("/api/coding/execute", {
      language: "cpp",
      code: `#include <iostream>
using namespace std;
int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << (a + b) << endl;
    }
    return 0;
}`,
      stdin: "15 27",
    });
    assert(res.status === 200, "C++ execution HTTP 200");
    assert(res.data.output.trim() === "42", `C++ stdout correct: "${res.data.output.trim()}"`);
  }

  // 1d. Java
  {
    const res = await post("/api/coding/execute", {
      language: "java",
      code: `import java.util.Scanner;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String word = sc.next();
            System.out.println(word.toUpperCase());
        }
    }
}`,
      stdin: "antigravity",
    });
    assert(res.status === 200, "Java execution HTTP 200");
    assert(res.data.output.trim() === "ANTIGRAVITY", `Java stdout correct: "${res.data.output.trim()}"`);
  }

  // 1e. Timeout Enforcement
  console.log("\n[TEST 2] Timeout Enforcement on Infinite Loop");
  {
    const res = await post("/api/coding/execute", {
      language: "python",
      code: "while True:\n    pass",
      stdin: "",
    });
    assert(res.status === 200, "Infinite loop terminated within timeout");
    assert(res.data.error.includes("timed out") || res.data.exitCode !== 0, "Execution returned timeout error");
  }

  // 2. Algorithmic Challenge Submission (10 Test Cases, Hidden Tests Protection & Grading)
  console.log("\n[TEST 3] Catalog Challenge Submission (ch_two_sum) - 10 Test Cases");
  {
    const twoSumPyCode = `import sys, json

def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

if __name__ == "__main__":
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        target = int(lines[1])
        res = twoSum(nums, target)
        print(f"[{res[0]}, {res[1]}]")
`;

    const res = await post("/api/coding/challenges/ch_two_sum/submit", {
      language: "python",
      code: twoSumPyCode,
    });

    assert(res.status === 200, "Challenge submission HTTP 200");
    assert(res.data.status === "ACCEPTED", `Submission status is ACCEPTED (got ${res.data.status})`);
    assert(res.data.totalTests === 10, `Evaluated exactly 10 test cases (got ${res.data.totalTests})`);
    assert(res.data.passedCount === 10, `All 10 test cases passed (got ${res.data.passedCount})`);
    assert(res.data.score === 100, `Score is 100% (got ${res.data.score}%)`);

    // Verify anti-cheat: tests 1, 2, 3 disclosed, tests 4..10 hidden
    const tests = res.data.results;
    assert(tests.length === 10, "10 test result items returned");
    assert(!tests[0].isHidden && tests[0].input !== "[Hidden Test Case]", "Test 1 is disclosed");
    assert(!tests[1].isHidden && tests[1].input !== "[Hidden Test Case]", "Test 2 is disclosed");
    assert(!tests[2].isHidden && tests[2].input !== "[Hidden Test Case]", "Test 3 is disclosed");
    assert(tests[3].isHidden && tests[3].input === "[Hidden Test Case]", "Test 4 input is hidden");
    assert(tests[9].isHidden && tests[9].input === "[Hidden Test Case]", "Test 10 input is hidden");
    assert(tests[3].actual === "[Passed]", "Test 4 actual output string redacted to protect test suite");
  }

  // 3. Partial Marks / Failures Handling (Partial Score)
  console.log("\n[TEST 4] Partial Grading Verification (Bogus Solution)");
  {
    const bogusCode = `import sys
# Always returns [0, 1] - passes only some tests
print("[0, 1]")
`;
    const res = await post("/api/coding/challenges/ch_two_sum/submit", {
      language: "python",
      code: bogusCode,
    });

    assert(res.status === 200, "Partial submission HTTP 200");
    assert(res.data.status === "WRONG_ANSWER", `Status WRONG_ANSWER when score < 80% (got ${res.data.status})`);
    assert(res.data.score < 80, `Partial score calculated accurately: ${res.data.score}%`);
    assert(res.data.totalTests === 10, `All 10 tests evaluated even on failure`);
    assert(res.data.results.length === 10, `All 10 test entries returned without early break`);
  }

  // 4. Curriculum Exercise Submission & Mongoose Persistence
  console.log("\n[TEST 5] Curriculum Exercise Submission (/api/coding/curriculum/exercise/submit)");
  {
    const pyExCode = `import sys, json

def filter_and_square(nums: list[int]) -> list[int]:
    return sorted([x**2 for x in nums if x > 0 and x % 2 == 0])

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        data = json.loads(line)
        print(json.dumps(filter_and_square(data)))
`;
    const res = await post("/api/coding/curriculum/exercise/submit", {
      trackId: "python",
      moduleIndex: 0,
      code: pyExCode,
    });

    assert(res.status === 200, "Curriculum exercise HTTP 200");
    assert(res.data.status === "PASSED", `Exercise status PASSED (got ${res.data.status})`);
    assert(res.data.score === 100, `Exercise score 100%`);
    assert(res.data.totalTests === 10, `Exercise executed 10 test cases`);
    assert(res.data.results.length === 10, `Returned exactly 10 test result objects`);
    assert(!res.data.results[0].isHidden, `Test 1 is public sample`);
    assert(!res.data.results[1].isHidden, `Test 2 is public sample`);
    assert(!res.data.results[2].isHidden, `Test 3 is public sample`);
    assert(res.data.results[3].isHidden, `Test 4 is strictly hidden from client`);
  }

  // 5. In-Progress Draft Code Auto-Save & Retrieval
  console.log("\n[TEST 6] Draft Code Auto-Save and Load");
  {
    const draftCode = "# In-progress solution draft\ndef test(): pass";
    const saveRes = await post("/api/coding/curriculum/exercise/draft", {
      trackId: "python",
      moduleIndex: 1,
      code: draftCode,
    });
    assert(saveRes.status === 200, "Draft saved successfully");

    const loadRes = await get("/api/coding/curriculum/exercise/draft/python/1");
    assert(loadRes.status === 200, "Draft loaded successfully");
    assert(loadRes.data.code === draftCode, "Loaded draft matches saved draft accurately");
  }

  // 6. Mastery Zone Public Sample Runner (/api/coding/curriculum/exercise/run)
  console.log("\n[TEST 7] Mastery Zone 'Run' vs 'Run Tests' (Public Samples & Custom STDIN)");
  {
    const pyExCode = `import sys, json

def filter_and_square(nums: list[int]) -> list[int]:
    return sorted([x**2 for x in nums if x > 0 and x % 2 == 0])

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        data = json.loads(line)
        print(json.dumps(filter_and_square(data)))
`;
    // 6a: Run public sample test cases (1 & 2)
    const runRes = await post("/api/coding/curriculum/exercise/run", {
      trackId: "python",
      moduleIndex: 0,
      code: pyExCode,
      language: "python",
    });
    assert(runRes.status === 200, "Curriculum 'Run' HTTP 200");
    assert(runRes.data.status === "ACCEPTED", "Public sample tests passed");
    assert(runRes.data.results.length === 3, "Evaluated exactly the 3 public samples");
    assert(runRes.data.results[0].input !== undefined, "Sample 1 input disclosed");
    assert(runRes.data.results[0].expected !== undefined, "Sample 1 expected disclosed");

    // 6b: Run with Custom STDIN
    const customRes = await post("/api/coding/curriculum/exercise/run", {
      trackId: "python",
      moduleIndex: 0,
      code: pyExCode,
      language: "python",
      customInput: "[-6, 6, -8, 8, 0, 1, 3]",
    });
    assert(customRes.status === 200, "Custom STDIN run HTTP 200");
    assert(customRes.data.isCustom === true, "isCustom flag set");
    assert(customRes.data.output.trim() === "[36, 64]", `Custom STDIN output correct: "${customRes.data.output.trim()}"`);
  }

  // 7. C++ and JavaScript Mastery Zone Challenge Run
  console.log("\n[TEST 8] C++ and JavaScript Challenge Verification");
  {
    const jsTwoSum = `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (lines.length >= 2) {
    const nums = JSON.parse(lines[0]);
    const target = parseInt(lines[1], 10);
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            console.log(JSON.stringify([map.get(diff), i]).replace(',', ', '));
            process.exit(0);
        }
        map.set(nums[i], i);
    }
}
`;
    const jsRes = await post("/api/coding/challenges/ch_two_sum/submit", {
      language: "javascript",
      code: jsTwoSum,
    });
    assert(jsRes.status === 200, "JS challenge submit HTTP 200");
    assert(jsRes.data.status === "ACCEPTED", "JS challenge ACCEPTED");
    assert(jsRes.data.score === 100, "JS challenge score 100%");
  }

  console.log(`\n======================================================`);
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log(`======================================================\n`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
