/**
 * MASTERY ZONE COMPREHENSIVE COMPILER & EXECUTION ENGINE TEST SUITE
 * Tests all supported languages across all 12 operational scenarios,
 * plus regression tests for helper avoidance on missing target function,
 * and meeting + certification evaluator integrations.
 */

const assert = require("assert");
const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const {
  evaluateTestCasesBatch,
  evaluateSingleTestCase,
  executeCode,
  validateTestCaseOutput,
} = require("../services/codeExecutionService");
const { getProblemExecutionConfig } = require("../data/problemExecutionConfig");
const { server } = require("../server");

const JWT_SECRET = process.env.JWT_SECRET || "mastery_zone_jwt_secret_key_2025_prod_secure";

let passedCount = 0;
let totalCount = 0;
let testServer, baseUrl;

async function it(title, fn) {
  totalCount++;
  try {
    await fn();
    passedCount++;
    console.log(`  ✅ [PASS] ${title}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${title}`);
    console.error(`     Reason: ${err.message}`);
    throw err;
  }
}

async function runCompilerTestSuite() {
  console.log("================================================================================");
  console.log("🔬 Mastery Zone Comprehensive 12-Scenario Multi-Language Compiler Verification");
  console.log("================================================================================");

  if (!server.listening) {
    await new Promise((resolve) => {
      testServer = server.listen(0, () => {
        baseUrl = `http://127.0.0.1:${testServer.address().port}`;
        resolve();
      });
    });
  } else {
    baseUrl = `http://127.0.0.1:${server.address().port || 5012}`;
  }

  // -------------------------------------------------------------
  // 1. Python 3 Tests (All 12 Scenarios)
  // -------------------------------------------------------------
  console.log("\n--- Section 1: Python 3 Verification (12 Scenarios) ---");

  await it("Python #1: Correct function-based solution passes", async () => {
    const code = "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]";
    const res = await evaluateTestCasesBatch("python", code, [
      { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, true);
    assert(res[0].actual === "[0, 1]" || res[0].actual === "[0,1]");
  });

  await it("Python #2: Incorrect function-based solution fails cleanly", async () => {
    const code = "class Solution:\n    def twoSum(self, nums, target):\n        return [99, 99]";
    const res = await evaluateTestCasesBatch("python", code, [
      { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].actual.includes("99"));
  });

  await it("Python #3: Correct standard input/output solution passes", async () => {
    const code = "s = input().strip()\nprint(f'ECHO: {s}')";
    const res = await evaluateTestCasesBatch("python", code, [
      { input: "MasteryZone", expectedOutput: "ECHO: MasteryZone" },
    ]);
    assert.strictEqual(res[0].passed, true);
  });

  await it("Python #4: Wrong output is rejected", async () => {
    const code = "print('WRONG_VAL')";
    const res = await evaluateTestCasesBatch("python", code, [
      { input: "", expectedOutput: "CORRECT_VAL" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert.strictEqual(res[0].actual, "WRONG_VAL");
  });

  await it("Python #5: Missing expected function fails with AttributeError and NEVER invokes helper", async () => {
    const code = [
      "class Solution:",
      "    def swap(self, arr, i, j):",
      "        return 'CALLED_SWAP'",
      "    def helper(self):",
      "        return 'CALLED_HELPER'",
    ].join("\n");
    const res = await evaluateTestCasesBatch("python", code, [
      { input: "[2, 7]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("AttributeError") && res[0].error.includes("twoSum"));
    assert(!res[0].actual.includes("CALLED_SWAP"));
    assert(!res[0].actual.includes("CALLED_HELPER"));
  });

  await it("Python #6: Invalid syntax is rejected with SyntaxError", async () => {
    const code = "def broken(:\n    return";
    const res = await evaluateTestCasesBatch("python", code, [
      { input: "1", expectedOutput: "1" },
    ], { functionName: "broken" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("SyntaxError") || res[0].error.includes("invalid syntax"));
  });

  await it("Python #7: Runtime error (ZeroDivisionError) is handled cleanly", async () => {
    const code = "class Solution:\n    def solve(self, x):\n        return 10 // 0";
    const res = await evaluateTestCasesBatch("python", code, [
      { input: "5", expectedOutput: "2" },
    ], { functionName: "solve" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("division") && res[0].error.includes("zero"));
  });

  await it("Python #8: Empty or comment-only submission is safely rejected with 0 marks", async () => {
    const code = "   # just a comment\n\n";
    const res = await evaluateTestCasesBatch("python", code, [
      { input: "1", expectedOutput: "1" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("No executable code provided"));
  });

  await it("Python #9: Multiple test cases evaluate independently with partial results", async () => {
    const code = "class Solution:\n    def isEven(self, n):\n        return n % 2 == 0";
    const res = await evaluateTestCasesBatch("python", code, [
      { input: "4", expectedOutput: "true" },
      { input: "5", expectedOutput: "true" }, // deliberate wrong test
      { input: "6", expectedOutput: "true" },
    ], { functionName: "isEven" });
    assert.strictEqual(res.length, 3);
    assert.strictEqual(res[0].passed, true);
    assert.strictEqual(res[1].passed, false);
    assert.strictEqual(res[2].passed, true);
  });

  await it("Python #10: Array and string inputs parse and serialize correctly", async () => {
    const code = "class Solution:\n    def process(self, words):\n        return [w.upper() for w in words]";
    const res = await evaluateTestCasesBatch("python", code, [
      { input: '["alpha", "beta"]', expectedOutput: '["ALPHA", "BETA"]' },
    ], { functionName: "process" });
    assert.strictEqual(res[0].passed, true);
  });

  await it("Python #11: Infinite loop / timeout triggers timeout error without hanging", async () => {
    const code = "class Solution:\n    def loop(self, x):\n        while True: pass";
    const res = await evaluateTestCasesBatch("python", code, [
      { input: "1", expectedOutput: "1" },
    ], { functionName: "loop" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("timed out"));
  });

  await it("Python #12: Selected language is strictly authoritative (rejects Java/C++ code)", async () => {
    const javaCode = "public class Solution { public static void main(String[] args) {} }";
    const res = await evaluateTestCasesBatch("python", javaCode, [
      { input: "", expectedOutput: "" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("SyntaxError") || res[0].error.includes("invalid syntax"));
  });

  // -------------------------------------------------------------
  // 2. JavaScript / Node.js Tests (All 12 Scenarios)
  // -------------------------------------------------------------
  console.log("\n--- Section 2: JavaScript Verification (12 Scenarios) ---");

  await it("JS #1: Correct function-based solution passes", async () => {
    const code = "function twoSum(nums, target) { return [0, 1]; }";
    const res = await evaluateTestCasesBatch("javascript", code, [
      { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, true);
  });

  await it("JS #2: Incorrect function-based solution fails cleanly", async () => {
    const code = "function twoSum(nums, target) { return [42, 42]; }";
    const res = await evaluateTestCasesBatch("javascript", code, [
      { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, false);
  });

  await it("JS #3: Correct standard input/output solution passes via readline", async () => {
    const code = [
      "const readline = require('readline');",
      "const rl = readline.createInterface({ input: process.stdin });",
      "rl.on('line', (l) => console.log('ECHO:' + l));",
    ].join("\n");
    const res = await evaluateTestCasesBatch("javascript", code, [
      { input: "MasteryZone", expectedOutput: "ECHO:MasteryZone" },
    ]);
    assert.strictEqual(res[0].passed, true);
  });

  await it("JS #4: Wrong output is rejected", async () => {
    const code = "console.log('UNEXPECTED');";
    const res = await evaluateTestCasesBatch("javascript", code, [
      { input: "", expectedOutput: "EXPECTED" },
    ]);
    assert.strictEqual(res[0].passed, false);
  });

  await it("JS #5: Missing expected function fails with ReferenceError and NEVER invokes helper", async () => {
    const code = [
      "class Solution {",
      "    swap(a, b) { return 'CALLED_SWAP'; }",
      "    helper() { return 'CALLED_HELPER'; }",
      "}",
    ].join("\n");
    const res = await evaluateTestCasesBatch("javascript", code, [
      { input: "[2, 7]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("ReferenceError") && res[0].error.includes("twoSum"));
    assert(!res[0].actual.includes("CALLED_SWAP"));
  });

  await it("JS #6: Invalid syntax is rejected with SyntaxError", async () => {
    const code = "function broken( { return 0; }";
    const res = await evaluateTestCasesBatch("javascript", code, [
      { input: "1", expectedOutput: "1" },
    ], { functionName: "broken" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("SyntaxError"));
  });

  await it("JS #7: Runtime error (TypeError / null dereference) is handled cleanly", async () => {
    const code = "function solve(x) { const obj = null; return obj.prop; }";
    const res = await evaluateTestCasesBatch("javascript", code, [
      { input: "5", expectedOutput: "5" },
    ], { functionName: "solve" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("TypeError"));
  });

  await it("JS #8: Empty or comment-only submission is safely rejected with 0 marks", async () => {
    const code = "  // empty javascript solution\n";
    const res = await evaluateTestCasesBatch("javascript", code, [
      { input: "1", expectedOutput: "1" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("No executable code provided"));
  });

  await it("JS #9: Multiple test cases evaluate independently with partial results", async () => {
    const code = "function isEven(n) { return n % 2 === 0; }";
    const res = await evaluateTestCasesBatch("javascript", code, [
      { input: "4", expectedOutput: "true" },
      { input: "7", expectedOutput: "true" }, // deliberate wrong test
      { input: "8", expectedOutput: "true" },
    ], { functionName: "isEven" });
    assert.strictEqual(res.length, 3);
    assert.strictEqual(res[0].passed, true);
    assert.strictEqual(res[1].passed, false);
    assert.strictEqual(res[2].passed, true);
  });

  await it("JS #10: Array and string inputs parse and serialize correctly", async () => {
    const code = "function reverseArray(arr) { return arr.reverse(); }";
    const res = await evaluateTestCasesBatch("javascript", code, [
      { input: "[1, 2, 3]", expectedOutput: "[3, 2, 1]" },
    ], { functionName: "reverseArray" });
    assert.strictEqual(res[0].passed, true);
  });

  await it("JS #11: Infinite loop / timeout triggers timeout error without hanging", async () => {
    const code = "function loop(x) { while(true) {} }";
    const res = await evaluateTestCasesBatch("javascript", code, [
      { input: "1", expectedOutput: "1" },
    ], { functionName: "loop" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("timed out"));
  });

  await it("JS #12: Selected language is strictly authoritative (rejects Python def syntax)", async () => {
    const pyCode = "def solve():\n    return 42\n";
    const res = await evaluateTestCasesBatch("javascript", pyCode, [
      { input: "", expectedOutput: "42" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("SyntaxError"));
  });

  // -------------------------------------------------------------
  // 3. Java Tests (All 12 Scenarios)
  // -------------------------------------------------------------
  console.log("\n--- Section 3: Java Verification (12 Scenarios) ---");

  await it("Java #1: Correct function-based solution passes", async () => {
    const code = "class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{0, 1}; } }";
    const res = await evaluateTestCasesBatch("java", code, [
      { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, true);
  });

  await it("Java #2: Incorrect function-based solution fails cleanly", async () => {
    const code = "class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{99, 99}; } }";
    const res = await evaluateTestCasesBatch("java", code, [
      { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, false);
  });

  await it("Java #3: Correct standard input/output solution passes", async () => {
    const code = [
      "import java.util.Scanner;",
      "public class Main {",
      "    public static void main(String[] args) {",
      "        Scanner sc = new Scanner(System.in);",
      "        System.out.println(\"HELLO_JAVA:\" + sc.nextLine().trim());",
      "    }",
      "}",
    ].join("\n");
    const res = await evaluateTestCasesBatch("java", code, [
      { input: "MasteryZone", expectedOutput: "HELLO_JAVA:MasteryZone" },
    ]);
    assert.strictEqual(res[0].passed, true);
  });

  await it("Java #4: Wrong output is rejected", async () => {
    const code = "public class Main { public static void main(String[] args) { System.out.println(100); } }";
    const res = await evaluateTestCasesBatch("java", code, [
      { input: "", expectedOutput: "200" },
    ]);
    assert.strictEqual(res[0].passed, false);
  });

  await it("Java #5: Missing expected method fails with NoSuchMethodError and NEVER invokes helper", async () => {
    const code = [
      "class Solution {",
      "    public void swap(int[] arr) {}",
      "    public void helper() {}",
      "}",
    ].join("\n");
    const res = await evaluateTestCasesBatch("java", code, [
      { input: "[2, 7]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("NoSuchMethodError") && res[0].error.includes("twoSum"));
  });

  await it("Java #6: Invalid syntax is rejected with Java Compilation Error", async () => {
    const code = "public class Main { public static void broken( { } }";
    const res = await evaluateTestCasesBatch("java", code, [
      { input: "", expectedOutput: "" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("Compilation Error (Java)") || res[0].error.includes("error:"));
  });

  await it("Java #7: Runtime error (ArithmeticException divide by zero) is handled cleanly", async () => {
    const code = "class Solution { public int solve(int x) { return 10 / 0; } }";
    const res = await evaluateTestCasesBatch("java", code, [
      { input: "5", expectedOutput: "2" },
    ], { functionName: "solve" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("ArithmeticException") || res[0].error.includes("/ by zero"));
  });

  await it("Java #8: Empty or comment-only submission is safely rejected with 0 marks", async () => {
    const code = "   /* empty java */\n";
    const res = await evaluateTestCasesBatch("java", code, [
      { input: "1", expectedOutput: "1" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("No executable code provided"));
  });

  await it("Java #9: Multiple test cases evaluate independently with partial results", async () => {
    const code = "class Solution { public boolean isEven(int n) { return n % 2 == 0; } }";
    const res = await evaluateTestCasesBatch("java", code, [
      { input: "4", expectedOutput: "true" },
      { input: "7", expectedOutput: "true" }, // wrong test
      { input: "8", expectedOutput: "true" },
    ], { functionName: "isEven" });
    assert.strictEqual(res.length, 3);
    assert.strictEqual(res[0].passed, true);
    assert.strictEqual(res[1].passed, false);
    assert.strictEqual(res[2].passed, true);
  });

  await it("Java #10: Array and string inputs parse and serialize correctly", async () => {
    const code = "class Solution { public int sumArray(int[] nums) { int s = 0; for(int n : nums) s += n; return s; } }";
    const res = await evaluateTestCasesBatch("java", code, [
      { input: "[10, 20, 30]", expectedOutput: "60" },
    ], { functionName: "sumArray" });
    assert.strictEqual(res[0].passed, true);
  });

  await it("Java #11: Infinite loop / timeout triggers timeout error without hanging", async () => {
    const code = "class Solution { public int loop(int x) { while(true) {} } }";
    const res = await evaluateTestCasesBatch("java", code, [
      { input: "1", expectedOutput: "1" },
    ], { functionName: "loop" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("timed out"));
  });

  await it("Java #12: Selected language is strictly authoritative (rejects Python def syntax)", async () => {
    const pyCode = "def solve():\n    return 42\n";
    const res = await evaluateTestCasesBatch("java", pyCode, [
      { input: "", expectedOutput: "42" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("Compilation Error (Java)") || res[0].error.includes("class, interface, enum, or record expected"));
  });

  // -------------------------------------------------------------
  // 4. C++ Tests (All 12 Scenarios)
  // -------------------------------------------------------------
  console.log("\n--- Section 4: C++ Verification (12 Scenarios) ---");

  await it("C++ #1: Correct function-based solution passes", async () => {
    const code = [
      "#include <vector>",
      "class Solution {",
      "public:",
      "    std::vector<int> twoSum(std::vector<int>& nums, int target) {",
      "        return {0, 1};",
      "    }",
      "};",
    ].join("\n");
    const res = await evaluateTestCasesBatch("cpp", code, [
      { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, true);
  });

  await it("C++ #2: Incorrect function-based solution fails cleanly", async () => {
    const code = [
      "#include <vector>",
      "class Solution {",
      "public:",
      "    std::vector<int> twoSum(std::vector<int>& nums, int target) {",
      "        return {99, 99};",
      "    }",
      "};",
    ].join("\n");
    const res = await evaluateTestCasesBatch("cpp", code, [
      { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, false);
  });

  await it("C++ #3: Correct standard input/output solution passes", async () => {
    const code = [
      "#include <iostream>",
      "#include <string>",
      "int main() {",
      "    std::string s;",
      "    std::cin >> s;",
      "    std::cout << \"ECHO_CPP:\" << s << std::endl;",
      "    return 0;",
      "}",
    ].join("\n");
    const res = await evaluateTestCasesBatch("cpp", code, [
      { input: "MasteryZone", expectedOutput: "ECHO_CPP:MasteryZone" },
    ]);
    assert.strictEqual(res[0].passed, true);
  });

  await it("C++ #4: Wrong output is rejected", async () => {
    const code = "#include <iostream>\nint main() { std::cout << 999 << std::endl; return 0; }";
    const res = await evaluateTestCasesBatch("cpp", code, [
      { input: "", expectedOutput: "123" },
    ]);
    assert.strictEqual(res[0].passed, false);
  });

  await it("C++ #5: Missing expected method fails compilation and NEVER invokes helper", async () => {
    const code = [
      "class Solution {",
      "public:",
      "    void swap() {}",
      "    void helper() {}",
      "};",
    ].join("\n");
    const res = await evaluateTestCasesBatch("cpp", code, [
      { input: "[2, 7]\n9", expectedOutput: "[0, 1]" },
    ], { functionName: "twoSum" });
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("twoSum") || res[0].error.includes("Compilation Error"));
  });

  await it("C++ #6: Invalid syntax is rejected with C++ Compilation Error", async () => {
    const code = "#include <iostream>\nint main( { return 0; }";
    const res = await evaluateTestCasesBatch("cpp", code, [
      { input: "", expectedOutput: "" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("Compilation Error (C++)"));
  });

  await it("C++ #7: Runtime error (SIGFPE divide by zero) is handled cleanly", async () => {
    const code = "#include <iostream>\nint main() { volatile int a = 0; int b = 10 / a; std::cout << b; return 0; }";
    const res = await evaluateTestCasesBatch("cpp", code, [
      { input: "", expectedOutput: "10" },
    ]);
    assert.strictEqual(res[0].passed, false);
  });

  await it("C++ #8: Empty or comment-only submission is safely rejected with 0 marks", async () => {
    const code = "   // empty c++\n";
    const res = await evaluateTestCasesBatch("cpp", code, [
      { input: "1", expectedOutput: "1" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("No executable code provided"));
  });

  await it("C++ #9: Multiple test cases evaluate independently with partial results", async () => {
    const code = [
      "class Solution {",
      "public:",
      "    bool isEven(int n) { return n % 2 == 0; }",
      "};",
    ].join("\n");
    const res = await evaluateTestCasesBatch("cpp", code, [
      { input: "4", expectedOutput: "true" },
      { input: "7", expectedOutput: "true" }, // wrong test
      { input: "8", expectedOutput: "true" },
    ], { functionName: "isEven" });
    assert.strictEqual(res.length, 3);
    assert.strictEqual(res[0].passed, true);
    assert.strictEqual(res[1].passed, false);
    assert.strictEqual(res[2].passed, true);
  });

  await it("C++ #10: Array and string inputs parse and serialize correctly", async () => {
    const code = [
      "#include <vector>",
      "class Solution {",
      "public:",
      "    int sumArray(std::vector<int>& nums) {",
      "        int s = 0;",
      "        for (int v : nums) s += v;",
      "        return s;",
      "    }",
      "};",
    ].join("\n");
    const res = await evaluateTestCasesBatch("cpp", code, [
      { input: "[10, 20, 30]", expectedOutput: "60" },
    ], { functionName: "sumArray" });
    assert.strictEqual(res[0].passed, true);
  });

  await it("C++ #11: Infinite loop / timeout triggers timeout error without hanging", async () => {
    const code = "#include <iostream>\nint main() { while(true) {} return 0; }";
    const res = await evaluateTestCasesBatch("cpp", code, [
      { input: "1", expectedOutput: "1" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("timed out"));
  });

  await it("C++ #12: Selected language is strictly authoritative (rejects Python syntax)", async () => {
    const pyCode = "def solve():\n    return 42\n";
    const res = await evaluateTestCasesBatch("cpp", pyCode, [
      { input: "", expectedOutput: "42" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("Compilation Error (C++)"));
  });

  // -------------------------------------------------------------
  // 5. C Tests (Standard I/O, Syntax, Timeout, Wrong Output)
  // -------------------------------------------------------------
  console.log("\n--- Section 5: C Verification ---");

  await it("C: Correct standard input/output solution passes", async () => {
    const code = [
      "#include <stdio.h>",
      "int main() {",
      "    char buf[64];",
      "    if (scanf(\"%63s\", buf) == 1) {",
      "        printf(\"ECHO_C:%s\\n\", buf);",
      "    }",
      "    return 0;",
      "}",
    ].join("\n");
    const res = await evaluateTestCasesBatch("c", code, [
      { input: "MasteryZone", expectedOutput: "ECHO_C:MasteryZone" },
    ]);
    assert.strictEqual(res[0].passed, true);
  });

  await it("C: Invalid syntax fails compilation cleanly", async () => {
    const code = "#include <stdio.h>\nint main( { return 0; }";
    const res = await evaluateTestCasesBatch("c", code, [
      { input: "", expectedOutput: "" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("Compilation Error (C)"));
  });

  await it("C: Infinite loop triggers timeout cleanly", async () => {
    const code = "int main() { while(1); return 0; }";
    const res = await evaluateTestCasesBatch("c", code, [
      { input: "", expectedOutput: "" },
    ]);
    assert.strictEqual(res[0].passed, false);
    assert(res[0].error.includes("timed out"));
  });

  // -------------------------------------------------------------
  // 6. Evaluator Integrations (Meeting & Certification)
  // -------------------------------------------------------------
  console.log("\n--- Section 6: Evaluator Integrations Verification ---");

  await it("Integration: Meeting Evaluator passes problem execution configuration correctly", async () => {
    const Meeting = require("../models/Meeting");
    const testMeetingId = `meet_eval_test_${Date.now()}`;
    const mockHostId = new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ userId: mockHostId, role: "user" }, JWT_SECRET, { expiresIn: "1h" });

    await Meeting.create({
      meetingId: testMeetingId,
      title: "Evaluation Test Meeting",
      hostUserId: mockHostId,
      scheduledDate: new Date(),
      status: "active",
      participants: [{ userId: mockHostId, username: "HostUser", role: "host" }],
    });

    const response = await fetch(`${baseUrl}/api/meetings/${testMeetingId}/run-tests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        language: "python",
        problemId: "ch_two_sum",
        functionName: "twoSum",
        code: "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]",
        testCases: [{ input: "[2, 7]\n9", expectedOutput: "[0, 1]" }],
      }),
    });

    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.strictEqual(data.passedCount, 1);
    assert.strictEqual(data.testResults[0].passed, true);
  });

  await it("Integration: Certification Evaluator executes with resolved problem execution config", async () => {
    const CertificationAttempt = require("../models/CertificationAttempt");
    const testUserId = new mongoose.Types.ObjectId().toString();
    const testAttemptId = `cert_eval_att_${Date.now()}`;
    const token = jwt.sign({ userId: testUserId, role: "user" }, JWT_SECRET, { expiresIn: "1h" });

    await CertificationAttempt.create({
      attemptId: testAttemptId,
      userId: testUserId,
      candidateName: "Exam Candidate",
      candidateEmail: "candidate@masteryzone.com",
      certId: "dsa_mastery",
      certTitle: "DSA Certification",
      attemptNumber: 1,
      status: "IN_PROGRESS",
      startTime: new Date(),
      durationMinutes: 90,
      selectedMcqs: [],
      mcqAnswers: {},
      selectedCodingQuestions: [
        {
          questionId: "ch_two_sum",
          functionName: "twoSum",
          title: "Two Sum",
          publicTests: [{ input: "[2, 7]\n9", expectedOutput: "[0, 1]" }],
          hiddenTests: [{ input: "[3, 3]\n6", expectedOutput: "[0, 1]" }],
        },
      ],
      codingSubmissions: [
        {
          questionId: "ch_two_sum",
          code: "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]",
          language: "python",
          solved: false,
          passedTests: 0,
          totalTests: 2,
          testResults: [],
        },
      ],
      proctoring: { status: "COMPLIANT", violationsCount: 0 },
    });

    // Submit code via official endpoint
    const submitRes = await fetch(`${baseUrl}/api/certifications/attempt/${testAttemptId}/submit-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        questionIndex: 0,
        language: "python",
        code: "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]",
      }),
    });

    assert.strictEqual(submitRes.status, 200);
    const submitData = await submitRes.json();
    assert.strictEqual(submitData.solved, true);
    assert.strictEqual(submitData.passedTests, 2);
  });

  if (testServer) {
    await new Promise((resolve) => testServer.close(resolve));
  }

  console.log("\n================================================================================");
  console.log(`Summary: ${passedCount}/${totalCount} Compiler Multi-Language Scenarios Passed (100%)`);
  console.log("================================================================================");
}

// Run test suite
(async () => {
  if (mongoose.connection.readyState === 0) {
    await new Promise((resolve) => mongoose.connection.once("open", resolve));
  }

  try {
    await runCompilerTestSuite();
    process.exit(0);
  } catch (e) {
    console.error("Test failure:", e);
    process.exit(1);
  }
})();
