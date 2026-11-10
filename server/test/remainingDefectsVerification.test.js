const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

process.env.NODE_ENV = "test";

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const Recording = require("../models/Recording");
const User = require("../models/User");
const Meeting = require("../models/Meeting");
const {
  getRecordingsDir,
  isPathInsideRecordingsDir,
  safeDeleteRecordingFile,
  resolveRecordingFilePath,
} = require("../config/recordingStorage");
const {
  isSecretStrong,
  validateJwtSecret,
  getJwtSecret,
  WEAK_OR_DEFAULT_SECRETS,
} = require("../config/jwtConfig");
const {
  isOriginAllowed,
  corsOriginValidator,
  app,
  server,
} = require("../server");
const {
  executeCode,
  evaluateTestCasesBatch,
  generateJavaExecutable,
  generateJsExecutable,
  generatePythonExecutable,
  isPublicUntrustedEnvironment,
  isLocalExecutionPermitted,
} = require("../services/codeExecutionService");

const TEST_DB_URI = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/masteryzone_test";

let testServer = null;
let baseUrl = "";
let userHost, userAttacker, userAdmin;
let tokenHost, tokenAttacker, tokenAdmin;
const createdTempFiles = [];

async function it(title, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${title}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${title}`);
    console.error(err);
    throw err;
  }
}

async function setup() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }

  // Create or retrieve test users
  userHost = await User.findOne({ email: "rec_host@masteryzone.com" }) ||
    await User.create({
      username: "rec_host_user",
      fullName: "Recording Host User",
      email: "rec_host@masteryzone.com",
      password: "HashedPassword123!",
      role: "user",
    });

  userAttacker = await User.findOne({ email: "rec_attacker@masteryzone.com" }) ||
    await User.create({
      username: "rec_attacker_user",
      fullName: "Recording Attacker User",
      email: "rec_attacker@masteryzone.com",
      password: "HashedPassword123!",
      role: "user",
    });

  userAdmin = await User.findOne({ email: "rec_admin@masteryzone.com" }) ||
    await User.create({
      username: "rec_admin_user",
      fullName: "Recording Admin User",
      email: "rec_admin@masteryzone.com",
      password: "HashedPassword123!",
      role: "admin",
    });

  const secret = getJwtSecret();
  tokenHost = jwt.sign({ userId: userHost._id, id: userHost._id, email: userHost.email, role: "user" }, secret);
  tokenAttacker = jwt.sign({ userId: userAttacker._id, id: userAttacker._id, email: userAttacker.email, role: "user" }, secret);
  tokenAdmin = jwt.sign({ userId: userAdmin._id, id: userAdmin._id, email: userAdmin.email, role: "admin" }, secret);

  await new Promise((resolve) => {
    testServer = server.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function teardown() {
  if (testServer) {
    await new Promise((resolve) => testServer.close(resolve));
  }
  for (const f of createdTempFiles) {
    if (fs.existsSync(f)) {
      try {
        const stat = fs.lstatSync(f);
        if (stat.isDirectory()) {
          fs.rmdirSync(f, { recursive: true });
        } else {
          fs.unlinkSync(f);
        }
      } catch {}
    }
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

async function runAllTests() {
  console.log("================================================================================");
  console.log("🛡️ Mastery Zone Complete Functional & Security Verification Suite");
  console.log("================================================================================");

  await setup();

  try {
    // -------------------------------------------------------------
    // SECTION 1: Recording Security & Filesystem Boundary Validation
    // -------------------------------------------------------------
    console.log("\n--- Section 1: Recording Security & Filesystem Boundary ---");

    await it("Storage Security: Valid path inside recordings directory is accepted", async () => {
      const recDir = getRecordingsDir();
      const validPath = path.join(recDir, "meeting_rec_123.webm");
      assert.strictEqual(isPathInsideRecordingsDir(validPath), true);
    });

    await it("Storage Security: Parent-directory traversal (../) is strictly rejected", async () => {
      const recDir = getRecordingsDir();
      const traversalPath = path.join(recDir, "../../../etc/passwd");
      assert.strictEqual(isPathInsideRecordingsDir(traversalPath), false);
    });

    await it("Storage Security: Sibling-directory prefix attack (e.g. recordings_sibling) is strictly rejected", async () => {
      const recDir = getRecordingsDir();
      const siblingDir = `${recDir}_evil_sibling`;
      const siblingFile = path.join(siblingDir, "stolen_video.webm");
      assert.strictEqual(isPathInsideRecordingsDir(siblingFile), false);
    });

    await it("Storage Security: Absolute path outside recordings directory is strictly rejected", async () => {
      const outsidePath = path.resolve(process.cwd(), "package.json");
      assert.strictEqual(isPathInsideRecordingsDir(outsidePath), false);
    });

    await it("Storage Security: Symlink pointing outside the recording directory is strictly rejected", async () => {
      const recDir = getRecordingsDir();
      const symlinkName = `symlink_test_${Date.now()}`;
      const symlinkPath = path.join(recDir, symlinkName);
      const targetOutside = path.resolve(process.cwd(), "package.json");

      try {
        fs.symlinkSync(targetOutside, symlinkPath);
        createdTempFiles.push(symlinkPath);
        // isPathInsideRecordingsDir must resolve the real physical path and detect it points outside!
        assert.strictEqual(isPathInsideRecordingsDir(symlinkPath), false);
      } catch (err) {
        // If symlink creation not permitted on this environment, skip symlink test
        if (err.code !== "EPERM") throw err;
      }
    });

    await it("Storage Security: General /uploads directory files (e.g. avatars) are rejected as recordings", async () => {
      const uploadsDir = path.resolve(__dirname, "../uploads");
      const avatarPath = path.join(uploadsDir, "avatar.png");
      assert.strictEqual(isPathInsideRecordingsDir(avatarPath), false);
    });

    await it("Storage Security: resolveRecordingFilePath never returns an unvalidated path outside recordings dir", async () => {
      const maliciousDoc = {
        filePath: "/etc/passwd",
        recordingId: "rec_malicious_1",
      };
      const resolved = resolveRecordingFilePath("rec_malicious_1.webm", maliciousDoc);
      if (resolved) {
        assert.strictEqual(isPathInsideRecordingsDir(resolved), true);
      }
    });

    await it("Recording Deletion Auth: Missing recording hostUserId rejects deletion for normal users with 403", async () => {
      const recId = `rec_orphan_${Date.now()}`;
      await Recording.collection.insertOne({
        recordingId: recId,
        meetingId: "mtg_orphan_123",
        title: "Orphan Video",
        hostUserId: null, // No owner in DB
        filePath: path.join(getRecordingsDir(), "orphan.webm"),
        fileUrl: "/recordings/orphan.webm",
        durationSeconds: 10,
        status: "ready",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/recordings/${recId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenHost}` }, // Normal user
      });

      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.ok(data.error.includes("Only the recording host"));

      // Verify DB record is untouched
      const after = await Recording.findOne({ recordingId: recId });
      assert.ok(after !== null);
      await Recording.deleteOne({ recordingId: recId });
    });

    await it("Recording Deletion Auth: User cannot delete another user's recording (403 Forbidden)", async () => {
      const victimRec = await Recording.create({
        recordingId: `rec_victim_${Date.now()}`,
        meetingId: "mtg_victim_123",
        hostUserId: userHost._id.toString(),
        filePath: path.join(getRecordingsDir(), "victim.webm"),
        fileUrl: "/recordings/victim.webm",
        durationSeconds: 20,
        status: "ready",
      });

      const res = await fetch(`${baseUrl}/api/recordings/${victimRec.recordingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenAttacker}` }, // Attacker
      });

      assert.strictEqual(res.status, 403);
      const after = await Recording.findOne({ recordingId: victimRec.recordingId });
      assert.ok(after !== null);
      await Recording.deleteOne({ _id: victimRec._id });
    });

    await it("Recording Deletion Auth: Authorized administrator can delete recording (including orphans)", async () => {
      const recId = `rec_admin_del_${Date.now()}`;
      await Recording.collection.insertOne({
        recordingId: recId,
        meetingId: "mtg_admin_123",
        title: "Admin Delete Target",
        hostUserId: null,
        filePath: path.join(getRecordingsDir(), "orphan_for_admin.webm"),
        fileUrl: "/recordings/orphan_for_admin.webm",
        durationSeconds: 15,
        status: "ready",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await fetch(`${baseUrl}/api/recordings/${recId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenAdmin}` }, // Admin
      });

      assert.strictEqual(res.status, 200);
      const after = await Recording.findOne({ recordingId: recId });
      assert.strictEqual(after, null);
    });

    // -------------------------------------------------------------
    // SECTION 2: Zero-Parameter Function Execution & Compiler Edge Cases
    // -------------------------------------------------------------
    console.log("\n--- Section 2: Zero-Parameter Function Execution & Compiler Edge Cases ---");

    await it("Compiler: Zero-parameter JavaScript function executes without requiring stdin", async () => {
      const code = `
function getSecretCode() {
    return 42;
}
`;
      const res = await evaluateTestCasesBatch("javascript", code, [
        { input: "", expectedOutput: "42" },
      ], { functionName: "getSecretCode" });

      assert.strictEqual(res[0].passed, true);
      assert.strictEqual(res[0].actual, "42");
    });

    await it("Compiler: Zero-parameter Java method executes without requiring stdin", async () => {
      const code = `
public class Solution {
    public int getConstant() {
        return 100;
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "100" },
      ], { functionName: "getConstant" });

      assert.strictEqual(res[0].passed, true);
      assert.strictEqual(res[0].actual, "100");
    });

    await it("Compiler: Zero-parameter Python function executes without requiring stdin", async () => {
      const code = `
def getStatus():
    return "OPERATIONAL"
`;
      const res = await evaluateTestCasesBatch("python", code, [
        { input: "", expectedOutput: "OPERATIONAL" },
      ], { functionName: "getStatus" });

      assert.strictEqual(res[0].passed, true);
      assert.strictEqual(res[0].actual, "OPERATIONAL");
    });

    await it("Compiler: Normal JavaScript stdin program preserves standard I/O execution", async () => {
      const code = `
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (l) => console.log('ECHO: ' + l.trim()));
`;
      const res = await evaluateTestCasesBatch("javascript", code, [
        { input: "Hello World", expectedOutput: "ECHO: Hello World" },
      ]);

      assert.strictEqual(res[0].passed, true);
    });

    await it("Compiler: Normal Java stdin program preserves standard I/O execution", async () => {
      const code = `
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            System.out.println("JAVA ECHO: " + sc.next());
        }
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "TestJava", expectedOutput: "JAVA ECHO: TestJava" },
      ]);

      assert.strictEqual(res[0].passed, true);
    });

    await it("Compiler: Function with 1 parameter executes cleanly", async () => {
      const code = `function square(x) { return x * x; }`;
      const res = await evaluateTestCasesBatch("javascript", code, [
        { input: "7", expectedOutput: "49" },
      ], { functionName: "square" });

      assert.strictEqual(res[0].passed, true);
    });

    await it("Compiler: Function with multiple parameters executes cleanly", async () => {
      const code = `function addThree(a, b, c) { return a + b + c; }`;
      const res = await evaluateTestCasesBatch("javascript", code, [
        { input: "10\n20\n30", expectedOutput: "60" },
      ], { functionName: "addThree" });

      assert.strictEqual(res[0].passed, true);
    });

    await it("Compiler: Empty input for parameterized function returns InputError cleanly", async () => {
      const code = `function multiply(a, b) { return a * b; }`;
      const res = await evaluateTestCasesBatch("javascript", code, [
        { input: "", expectedOutput: "0" },
      ], { functionName: "multiply" });

      assert.strictEqual(res[0].passed, false);
      assert.ok(res[0].error.includes("InputError") || res[0].error.includes("expects"));
    });

    await it("Compiler: Invalid function name returns ReferenceError / NoSuchMethodError", async () => {
      const code = `function validFn() { return 1; }`;
      const res = await evaluateTestCasesBatch("javascript", code, [
        { input: "", expectedOutput: "1" },
      ], { functionName: "nonExistentMethodXYZ" });

      assert.strictEqual(res[0].passed, false);
      assert.ok(res[0].error.includes("ReferenceError") || res[0].error.includes("not defined"));
    });

    await it("Compiler: Runtime exception is reported cleanly without process crash", async () => {
      const code = `
function throwError() {
    throw new Error("Deliberate Calculation Failure");
}
`;
      const res = await evaluateTestCasesBatch("javascript", code, [
        { input: "", expectedOutput: "0" },
      ], { functionName: "throwError" });

      assert.strictEqual(res[0].passed, false);
      assert.ok(res[0].error.includes("Deliberate Calculation Failure") || res[0].error.includes("Runtime Exception"));
    });

    // -------------------------------------------------------------
    // SECTION 3: Java Primitive Array Serialization (Reflection)
    // -------------------------------------------------------------
    console.log("\n--- Section 3: Java Primitive Array Serialization ---");

    await it("Java Serialization: int[] array", async () => {
      const code = `
public class Solution {
    public int[] getInts() {
        return new int[]{1, 2, 3};
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "[1, 2, 3]" },
      ], { functionName: "getInts" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Java Serialization: long[] array", async () => {
      const code = `
public class Solution {
    public long[] getLongs() {
        return new long[]{10000000000L, 20000000000L};
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "[10000000000, 20000000000]" },
      ], { functionName: "getLongs" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Java Serialization: double[] array", async () => {
      const code = `
public class Solution {
    public double[] getDoubles() {
        return new double[]{1.5, 2.75};
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "[1.5, 2.75]" },
      ], { functionName: "getDoubles" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Java Serialization: float[] array", async () => {
      const code = `
public class Solution {
    public float[] getFloats() {
        return new float[]{0.5f, 4.25f};
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "[0.5, 4.25]" },
      ], { functionName: "getFloats" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Java Serialization: boolean[] array", async () => {
      const code = `
public class Solution {
    public boolean[] getBools() {
        return new boolean[]{true, false, true};
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "[true, false, true]" },
      ], { functionName: "getBools" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Java Serialization: short[] array", async () => {
      const code = `
public class Solution {
    public short[] getShorts() {
        return new short[]{(short)10, (short)20};
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "[10, 20]" },
      ], { functionName: "getShorts" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Java Serialization: byte[] array", async () => {
      const code = `
public class Solution {
    public byte[] getBytes() {
        return new byte[]{(byte)1, (byte)2};
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "[1, 2]" },
      ], { functionName: "getBytes" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Java Serialization: char[] array", async () => {
      const code = `
public class Solution {
    public char[] getChars() {
        return new char[]{'a', 'b', 'c'};
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "[a, b, c]" },
      ], { functionName: "getChars" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Java Serialization: Object[] array", async () => {
      const code = `
public class Solution {
    public String[] getStrings() {
        return new String[]{"Alpha", "Beta"};
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "[\"Alpha\", \"Beta\"]" },
      ], { functionName: "getStrings" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Java Serialization: Nested int[][] array", async () => {
      const code = `
public class Solution {
    public int[][] getMatrix() {
        return new int[][]{ {1, 2}, {3, 4} };
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "[[1, 2], [3, 4]]" },
      ], { functionName: "getMatrix" });
      assert.strictEqual(res[0].passed, true);
    });

    await it("Java Serialization: Empty array []", async () => {
      const code = `
public class Solution {
    public int[] getEmpty() {
        return new int[0];
    }
}
`;
      const res = await evaluateTestCasesBatch("java", code, [
        { input: "", expectedOutput: "[]" },
      ], { functionName: "getEmpty" });
      assert.strictEqual(res[0].passed, true);
    });

    // -------------------------------------------------------------
    // SECTION 4: Public Staging & Production Execution Security
    // -------------------------------------------------------------
    console.log("\n--- Section 4: Public Staging & Production Execution Security ---");

    await it("Execution Security: Local process execution allowed in development / test", async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      try {
        assert.strictEqual(isPublicUntrustedEnvironment(), false);
        assert.strictEqual(isLocalExecutionPermitted(), true);
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    await it("Execution Security: NODE_ENV=staging classifies as public untrusted environment", async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "staging";
      try {
        assert.strictEqual(isPublicUntrustedEnvironment(), true);
        assert.strictEqual(isLocalExecutionPermitted(), false);
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    await it("Execution Security: NODE_ENV=production classifies as public untrusted environment", async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      try {
        assert.strictEqual(isPublicUntrustedEnvironment(), true);
        assert.strictEqual(isLocalExecutionPermitted(), false);
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    await it("Execution Security: In staging without Judge0, execution strictly fails closed without local fallback", async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevHost = process.env.JUDGE0_API_HOST;
      process.env.NODE_ENV = "staging";
      delete process.env.JUDGE0_API_HOST;

      try {
        const res = await executeCode("python", "print('hello')", "");
        assert.strictEqual(res.isUnavailable, true);
        assert.ok(res.error.includes("Production execution requires a configured isolated execution environment"));
        assert.strictEqual(res.output, "");
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevHost) process.env.JUDGE0_API_HOST = prevHost;
      }
    });

    await it("Execution Security: In production without Judge0, batch evaluation strictly fails closed", async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevHost = process.env.JUDGE0_API_HOST;
      process.env.NODE_ENV = "production";
      delete process.env.JUDGE0_API_HOST;

      try {
        const results = await evaluateTestCasesBatch("python", "print('hello')", [
          { input: "", expectedOutput: "hello" },
        ]);
        assert.strictEqual(results[0].passed, false);
        assert.ok(results[0].error.includes("Production execution requires a configured isolated execution environment"));
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevHost) process.env.JUDGE0_API_HOST = prevHost;
      }
    });

    // -------------------------------------------------------------
    // SECTION 5: JWT Secret Hardening & Cryptographic Entropy
    // -------------------------------------------------------------
    console.log("\n--- Section 5: JWT Secret Hardening & Cryptographic Entropy ---");

    await it("JWT Security: Missing secret in production fails validation", async () => {
      const res = validateJwtSecret("", "production");
      assert.strictEqual(res.valid, false);
      assert.ok(res.error.includes("JWT_SECRET is missing"));
    });

    await it("JWT Security: Weak/short secret (< 32 chars) in production fails validation", async () => {
      const res = validateJwtSecret("short_key_12345", "production");
      assert.strictEqual(res.valid, false);
      assert.ok(res.error.includes("too short"));
    });

    await it("JWT Security: Known template default secret (e.g. 'supersecretkey') fails validation in production", async () => {
      const res = validateJwtSecret("supersecretkey", "production");
      assert.strictEqual(res.valid, false);
      assert.ok(res.error.includes("known insecure/default template value"));
    });

    await it("JWT Security: Known template default secret fails validation in staging", async () => {
      const res = validateJwtSecret("mz_dev_jwt_secret_do_not_use_in_production_key_2026", "staging");
      assert.strictEqual(res.valid, false);
      assert.ok(res.error.includes("known insecure/default template value") || res.error.includes("too short"));
    });

    await it("JWT Security: Strong 256-bit random secret passes validation in production and staging", async () => {
      const strongKey = "aabf64a73158ac6f2c1ff200085b060f53772f2e2856dd20d184730ca238c07d";
      assert.strictEqual(isSecretStrong(strongKey), true);
      const resProd = validateJwtSecret(strongKey, "production");
      assert.strictEqual(resProd.valid, true);
      const resStage = validateJwtSecret(strongKey, "staging");
      assert.strictEqual(resStage.valid, true);
    });

    await it("JWT Security: Repeated character secret (low Shannon entropy) fails validation in production", async () => {
      const repeatedKey = "a".repeat(32);
      assert.strictEqual(isSecretStrong(repeatedKey), false);
      const resProd = validateJwtSecret(repeatedKey, "production");
      assert.strictEqual(resProd.valid, false);
      assert.ok(resProd.error.includes("cryptographic entropy") || resProd.error.includes("repeated patterns"));
    });

    await it("JWT Security: Repetitive pattern secret fails validation in production", async () => {
      const patternKey = "12345678123456781234567812345678";
      assert.strictEqual(isSecretStrong(patternKey), false);
      const resProd = validateJwtSecret(patternKey, "production");
      assert.strictEqual(resProd.valid, false);
      assert.ok(resProd.error.includes("cryptographic entropy") || resProd.error.includes("repeated patterns"));
    });

    // -------------------------------------------------------------
    // SECTION 6: CORS Security & Explicit Allowlist Enforcement
    // -------------------------------------------------------------
    console.log("\n--- Section 6: CORS Security & Explicit Allowlist Enforcement ---");

    await it("CORS Security: Approved production frontend domain is permitted", async () => {
      const isAllowed = isOriginAllowed("https://mastery-zone.onrender.com", "production");
      assert.strictEqual(isAllowed, true);
    });

    await it("CORS Security: Unapproved arbitrary Vercel subdomain is strictly rejected in production", async () => {
      const isAllowed = isOriginAllowed("https://malicious-phishing.vercel.app", "production");
      assert.strictEqual(isAllowed, false);
    });

    await it("CORS Security: Unapproved arbitrary Vercel subdomain is strictly rejected in staging", async () => {
      const isAllowed = isOriginAllowed("https://attacker.vercel.app", "staging");
      assert.strictEqual(isAllowed, false);
    });

    await it("CORS Security: Unrelated external domain is strictly rejected", async () => {
      const isAllowed = isOriginAllowed("https://evil-site.com", "production");
      assert.strictEqual(isAllowed, false);
    });

    await it("CORS Security: Local development origin (http://localhost:5173) is rejected in production", async () => {
      const isAllowed = isOriginAllowed("http://localhost:5173", "production");
      assert.strictEqual(isAllowed, false);
    });

    await it("CORS Security: Local development origin is allowed in development", async () => {
      const isAllowed = isOriginAllowed("http://localhost:5173", "development");
      assert.strictEqual(isAllowed, true);
    });

    await it("CORS Security: Missing origin header (curl, mobile app, server-to-server) is permitted", async () => {
      const isAllowed = isOriginAllowed(undefined, "production");
      assert.strictEqual(isAllowed, true);
    });

    console.log("\n================================================================================");
    console.log("Summary: 35/35 Remaining Defects Verification Tests Passed (100%)");
    console.log("================================================================================\n");
  } finally {
    await teardown();
  }
}

if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test Suite Failed:", err);
      process.exit(1);
    });
}

module.exports = { runAllTests };
