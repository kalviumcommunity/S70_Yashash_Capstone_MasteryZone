const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");

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
  getJwtRefreshSecret,
  generateCryptographicSecret,
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
  runSandboxedProcess,
  getJudge0Config,
  getJudge0LanguageId,
  bundleMultiFileProject,
} = require("../services/codeExecutionService");
const { getProjectById } = require("../data/projectsCatalog");
const http = require("http");

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
  userHost = await User.findOne({ email: "rec_host@masteryzone.test" }) ||
    await User.create({
      username: "rec_host_user",
      fullName: "Recording Host User",
      email: "rec_host@masteryzone.test",
      password: "HashedPassword123!",
      role: "user",
    });

  userAttacker = await User.findOne({ email: "rec_attacker@masteryzone.test" }) ||
    await User.create({
      username: "rec_attacker_user",
      fullName: "Recording Attacker User",
      email: "rec_attacker@masteryzone.test",
      password: "HashedPassword123!",
      role: "user",
    });

  userAdmin = await User.findOne({ email: "rec_admin@masteryzone.test" }) ||
    await User.create({
      username: "rec_admin_user",
      fullName: "Recording Admin User",
      email: "rec_admin@masteryzone.test",
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

    await it("Execution Security: Missing NODE_ENV strictly fails closed into untrusted mode", async () => {
      const prevEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      delete process.env.ALLOW_LOCAL_CODE_EXECUTION;

      try {
        assert.strictEqual(isPublicUntrustedEnvironment(), true);
        assert.strictEqual(isLocalExecutionPermitted(), false);
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    await it("Execution Security: Unknown NODE_ENV (e.g. 'preview') strictly fails closed into untrusted mode", async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "preview";
      delete process.env.ALLOW_LOCAL_CODE_EXECUTION;

      try {
        assert.strictEqual(isPublicUntrustedEnvironment(), true);
        assert.strictEqual(isLocalExecutionPermitted(), false);
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    await it("Execution Security: Direct runSandboxedProcess call strictly fails closed in untrusted environment", async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "staging";

      try {
        const res = await runSandboxedProcess("node", ["-e", "console.log('danger')"]);
        assert.strictEqual(res.isUnavailable, true);
        assert.ok(res.error.includes("Execution security policy violation"));
        assert.strictEqual(res.output, "");
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    await it("Execution Security: ALLOW_LOCAL_CODE_EXECUTION=true with NODE_ENV=preview strictly fails closed", async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevAllow = process.env.ALLOW_LOCAL_CODE_EXECUTION;
      process.env.NODE_ENV = "preview";
      process.env.ALLOW_LOCAL_CODE_EXECUTION = "true";

      try {
        assert.strictEqual(isPublicUntrustedEnvironment(), true);
        assert.strictEqual(isLocalExecutionPermitted(), false);
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevAllow !== undefined) process.env.ALLOW_LOCAL_CODE_EXECUTION = prevAllow;
        else delete process.env.ALLOW_LOCAL_CODE_EXECUTION;
      }
    });

    await it("Execution Security: ALLOW_LOCAL_CODE_EXECUTION=true with missing NODE_ENV strictly fails closed", async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevAllow = process.env.ALLOW_LOCAL_CODE_EXECUTION;
      delete process.env.NODE_ENV;
      process.env.ALLOW_LOCAL_CODE_EXECUTION = "true";

      try {
        assert.strictEqual(isPublicUntrustedEnvironment(), true);
        assert.strictEqual(isLocalExecutionPermitted(), false);
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevAllow !== undefined) process.env.ALLOW_LOCAL_CODE_EXECUTION = prevAllow;
        else delete process.env.ALLOW_LOCAL_CODE_EXECUTION;
      }
    });

    await it("Execution Security: ALLOW_LOCAL_CODE_EXECUTION=true with NODE_ENV=staging and production strictly fails closed", async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevAllow = process.env.ALLOW_LOCAL_CODE_EXECUTION;
      process.env.ALLOW_LOCAL_CODE_EXECUTION = "true";

      try {
        process.env.NODE_ENV = "staging";
        assert.strictEqual(isLocalExecutionPermitted(), false);
        process.env.NODE_ENV = "production";
        assert.strictEqual(isLocalExecutionPermitted(), false);
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevAllow !== undefined) process.env.ALLOW_LOCAL_CODE_EXECUTION = prevAllow;
        else delete process.env.ALLOW_LOCAL_CODE_EXECUTION;
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

    await it("JWT Security: Missing secret in staging fails validation", async () => {
      const res = validateJwtSecret("", "staging");
      assert.strictEqual(res.valid, false);
      assert.ok(res.error.includes("JWT_SECRET is missing"));
    });

    await it("JWT Security: Missing secret in preview environment fails validation", async () => {
      const res = validateJwtSecret("", "preview");
      assert.strictEqual(res.valid, false);
      assert.ok(res.error.includes("JWT_SECRET is missing"));
    });

    await it("JWT Security: Missing secret with undefined NODE_ENV fails validation", async () => {
      const prevEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      try {
        const res = validateJwtSecret("", "");
        assert.strictEqual(res.valid, false);
        assert.ok(res.error.includes("JWT_SECRET is missing"));
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
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

    await it("JWT Security: generateCryptographicSecret creates valid 256-bit secret", async () => {
      const cryptoKey = generateCryptographicSecret(32);
      assert.strictEqual(typeof cryptoKey, "string");
      assert.strictEqual(cryptoKey.length, 64);
      assert.strictEqual(isSecretStrong(cryptoKey), true);
      assert.strictEqual(validateJwtSecret(cryptoKey, "production").valid, true);
    });

    await it("JWT Security: Validates access and refresh secrets independently", async () => {
      const accessSecret = generateCryptographicSecret(32);
      const refreshSecret = generateCryptographicSecret(32);
      assert.notStrictEqual(accessSecret, refreshSecret);

      const accessValid = validateJwtSecret(accessSecret, "production", "JWT_SECRET");
      assert.strictEqual(accessValid.valid, true);

      const refreshValid = validateJwtSecret(refreshSecret, "production", "JWT_REFRESH_SECRET");
      assert.strictEqual(refreshValid.valid, true);

      const badRefreshValid = validateJwtSecret("short", "production", "JWT_REFRESH_SECRET");
      assert.strictEqual(badRefreshValid.valid, false);
      assert.ok(badRefreshValid.error.includes("JWT_REFRESH_SECRET is too short"));
    });

    await it("JWT Security: getJwtSecret persists consistently across multiple calls in development", async () => {
      const sec1 = getJwtSecret();
      const sec2 = getJwtSecret();
      assert.strictEqual(sec1, sec2);
      assert.ok(sec1.length >= 32);
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

    await it("CORS Security: Local development origin is rejected in preview environment", async () => {
      const isAllowed = isOriginAllowed("http://localhost:5173", "preview");
      assert.strictEqual(isAllowed, false);
    });

    await it("CORS Security: Local development origin is rejected when NODE_ENV is missing/undefined", async () => {
      const isAllowed = isOriginAllowed("http://localhost:5173", "");
      assert.strictEqual(isAllowed, false);
    });

    await it("CORS Security: Missing origin header (curl, mobile app, server-to-server) is permitted", async () => {
      const isAllowed = isOriginAllowed(undefined, "production");
      assert.strictEqual(isAllowed, true);
    });

    // -------------------------------------------------------------
    // SECTION 7: Recording Upload Streaming & Reliability
    // -------------------------------------------------------------
    console.log("\n--- Section 7: Recording Upload Streaming & Reliability ---");

    function createTestWebMBuffer(duration = 1) {
      try {
        const tmpFile = path.join(__dirname, `tmp_stream_${Date.now()}_${Math.random().toString(36).slice(2)}.webm`);
        execFileSync(
          ffmpegInstaller.path,
          [
            "-y",
            "-f", "lavfi", "-i", `testsrc=duration=${duration}:size=320x240:rate=10`,
            "-f", "lavfi", "-i", `sine=frequency=1000:duration=${duration}`,
            "-c:v", "libvpx",
            "-c:a", "libvorbis",
            tmpFile,
          ],
          { stdio: "ignore" }
        );
        const buf = fs.readFileSync(tmpFile);
        try { fs.unlinkSync(tmpFile); } catch {}
        return buf;
      } catch {
        const buf = Buffer.alloc(1024);
        buf[0] = 0x1a; buf[1] = 0x45; buf[2] = 0xdf; buf[3] = 0xa3;
        buf[10] = 0x18; buf[11] = 0x53; buf[12] = 0x80; buf[13] = 0x67;
        buf[20] = 0x16; buf[21] = 0x54; buf[22] = 0xae; buf[23] = 0x6b;
        buf.write("V_VP8", 30, "ascii");
        buf.write("A_OPUS", 50, "ascii");
        buf[80] = 0x1f; buf[81] = 0x43; buf[82] = 0xb6; buf[83] = 0x75;
        return buf;
      }
    }

    const testStreamMtgId = `mtg_stream_${Date.now()}`;
    await Meeting.create({
      meetingId: testStreamMtgId,
      hostUserId: String(userHost._id),
      title: "Streaming Upload Verification Meeting",
      participants: [{ userId: String(userHost._id), name: userHost.fullName }],
    });

    await it("Recording Stream: Raw binary streaming upload pipes directly to storage without memory buffer", async () => {
      const webmBuffer = createTestWebMBuffer();
      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "video/webm",
          "x-meeting-id": testStreamMtgId,
          "x-title": encodeURIComponent("Direct Streamed Session"),
          "x-duration-seconds": "45",
          Authorization: `Bearer ${tokenHost}`,
        },
        body: webmBuffer,
      });

      const json = await res.json();
      if (res.status !== 201) console.log("UPLOAD FAILED WITH:", res.status, json);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(json.success, true);
      assert.ok(json.recording.recordingId);
      createdTempFiles.push(json.recording.filePath);

      const saved = await Recording.findOne({ recordingId: json.recording.recordingId }).lean();
      assert.ok(saved);
      assert.strictEqual(String(saved.hostUserId), String(userHost._id));
      assert.strictEqual(saved.durationSeconds, 45);
      assert.ok(fs.existsSync(saved.filePath));
    });

    const testMultipartMtgId = `mtg_stream_mp_${Date.now()}`;
    await Meeting.create({
      meetingId: testMultipartMtgId,
      hostUserId: String(userHost._id),
      title: "Streaming Multipart Verification Meeting",
      participants: [{ userId: String(userHost._id), name: userHost.fullName }],
    });

    await it("Recording Stream: Multipart streaming upload (busboy) saves genuine recording to storage", async () => {
      const webmBuffer = createTestWebMBuffer();
      const boundary = "----MasteryZoneBoundary" + Date.now();
      const multipartBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="meetingId"\r\n\r\n${testMultipartMtgId}\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nMultipart Streamed Recording\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="durationSeconds"\r\n\r\n60\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="session.webm"\r\nContent-Type: video/webm\r\n\r\n`),
        webmBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);

      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          Authorization: `Bearer ${tokenHost}`,
        },
        body: multipartBody,
      });

      const json = await res.json();
      if (res.status !== 201) console.log("UPLOAD FAILED WITH:", res.status, json);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(json.success, true);
      assert.ok(json.recording.recordingId);
      createdTempFiles.push(json.recording.filePath);
    });

    await it("Recording Stream: Non-host user upload is strictly rejected with 403 Forbidden", async () => {
      const webmBuffer = createTestWebMBuffer();
      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "video/webm",
          "x-meeting-id": testStreamMtgId,
          Authorization: `Bearer ${tokenAttacker}`,
        },
        body: webmBuffer,
      });

      assert.strictEqual(res.status, 403);
      const json = await res.json();
      assert.ok(json.error.includes("Only the meeting host"));
    });

    await it("Recording Stream: Unauthenticated upload is strictly rejected with 401 Unauthorized", async () => {
      const webmBuffer = createTestWebMBuffer();
      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "video/webm",
          "x-meeting-id": testStreamMtgId,
        },
        body: webmBuffer,
      });

      assert.strictEqual(res.status, 401);
    });

    await it("Recording Stream: Invalid container format (non-video text) is rejected with 400", async () => {
      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "video/webm",
          "x-meeting-id": testStreamMtgId,
          Authorization: `Bearer ${tokenHost}`,
        },
        body: Buffer.alloc(1000).fill("A"),
      });

      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.ok(json.error.includes("Invalid video media format") || json.error.includes("Media decoding failed") || json.error.includes("too short"));
    });

    // -------------------------------------------------------------
    // SECTION 8: Production Email Configuration & Deliverability
    // -------------------------------------------------------------
    console.log("\n--- Section 8: Production Email Configuration & Deliverability ---");

    const {
      validateRecipientEmail,
      isDuplicateOutboundEmail,
      getHttpEmailProvider,
    } = require("../utils/mailer");

    await it("Email Config: Valid recipient email formats pass validation", async () => {
      assert.strictEqual(validateRecipientEmail("student@gmail.com"), true);
      assert.strictEqual(validateRecipientEmail("user.name+tag@domain.co.uk"), true);
    });

    await it("Email Config: Invalid recipient email formats fail validation", async () => {
      assert.strictEqual(validateRecipientEmail(""), false);
      assert.strictEqual(validateRecipientEmail("not-an-email"), false);
      assert.strictEqual(validateRecipientEmail("@missinguser.com"), false);
      assert.strictEqual(validateRecipientEmail("missingdomain@"), false);
    });

    await it("Email Config: Rapid duplicate outbound notifications are suppressed within rate window", async () => {
      const to = "duplicate_test@example.com";
      const subject = "System Alert";
      const html = "<p>Your assessment results are ready.</p>";

      const firstSent = isDuplicateOutboundEmail(to, subject, html);
      assert.strictEqual(firstSent, false); // First attempt is not duplicate

      const secondSent = isDuplicateOutboundEmail(to, subject, html);
      assert.strictEqual(secondSent, true); // Immediate retry is suppressed as duplicate
    });

    await it("Email Config: getHttpEmailProvider marks test sender and warns in production", async () => {
      const prevKey = process.env.RESEND_API_KEY;
      const prevFrom = process.env.RESEND_FROM;
      const prevEnv = process.env.NODE_ENV;

      try {
        process.env.RESEND_API_KEY = "re_test_dummy_key_1234567890";
        delete process.env.RESEND_FROM;
        process.env.NODE_ENV = "production";

        const provider = getHttpEmailProvider();
        assert.ok(provider);
        assert.strictEqual(provider.type, "resend");
        assert.strictEqual(provider.isTestSender, true);
        assert.strictEqual(provider.from, "Mastery Zone <onboarding@resend.dev>");
      } finally {
        if (prevKey) process.env.RESEND_API_KEY = prevKey; else delete process.env.RESEND_API_KEY;
        if (prevFrom) process.env.RESEND_FROM = prevFrom; else delete process.env.RESEND_FROM;
        process.env.NODE_ENV = prevEnv;
      }
    });

    await it("Email Config: Verified sender domain in RESEND_FROM is recognized as non-test sender", async () => {
      const prevKey = process.env.RESEND_API_KEY;
      const prevFrom = process.env.RESEND_FROM;
      const prevEnv = process.env.NODE_ENV;

      try {
        process.env.RESEND_API_KEY = "re_test_dummy_key_1234567890";
        process.env.RESEND_FROM = "Mastery Zone <notifications@masteryzone.com>";
        process.env.NODE_ENV = "production";

        const provider = getHttpEmailProvider();
        assert.ok(provider);
        assert.strictEqual(provider.type, "resend");
        assert.strictEqual(provider.isTestSender, false);
        assert.strictEqual(provider.from, "Mastery Zone <notifications@masteryzone.com>");
      } finally {
        if (prevKey) process.env.RESEND_API_KEY = prevKey; else delete process.env.RESEND_API_KEY;
        if (prevFrom) process.env.RESEND_FROM = prevFrom; else delete process.env.RESEND_FROM;
        process.env.NODE_ENV = prevEnv;
      }
    });

    // -------------------------------------------------------------
    // SECTION 9: Production Judge0 Integration (MasteryZone Compiler & Project Compiler)
    // -------------------------------------------------------------
    console.log("\n--- Section 9: Production Judge0 Integration (MasteryZone & Project Compilers) ---");

    await it("Judge0 Config: Validates host URL, RapidAPI key requirement, and custom language IDs", async () => {
      const prevHost = process.env.JUDGE0_API_HOST;
      const prevKey = process.env.JUDGE0_API_KEY;
      const prevPy = process.env.JUDGE0_LANG_PYTHON;

      try {
        delete process.env.JUDGE0_API_HOST;
        delete process.env.JUDGE0_API_KEY;
        assert.strictEqual(getJudge0Config().configured, false);

        process.env.JUDGE0_API_HOST = "://malformed-url";
        const invalidCfg = getJudge0Config();
        assert.strictEqual(invalidCfg.configured, true);
        assert.strictEqual(invalidCfg.valid, false);
        assert.ok(invalidCfg.error.includes("Invalid Judge0 configuration"));

        process.env.JUDGE0_API_HOST = "https://judge0-ce.p.rapidapi.com";
        delete process.env.JUDGE0_API_KEY;
        const missingKeyCfg = getJudge0Config();
        assert.strictEqual(missingKeyCfg.valid, false);
        assert.ok(missingKeyCfg.error.includes("JUDGE0_API_KEY is required"));

        process.env.JUDGE0_API_KEY = "test_rapidapi_key";
        process.env.JUDGE0_LANG_PYTHON = "100";
        const validCfg = getJudge0Config();
        assert.strictEqual(validCfg.valid, true);
        assert.strictEqual(getJudge0LanguageId("python", validCfg), 100);
        assert.strictEqual(getJudge0LanguageId("javascript", validCfg), 63);
        assert.strictEqual(getJudge0LanguageId("java", validCfg), 62);
        assert.strictEqual(getJudge0LanguageId("cpp", validCfg), 54);
        assert.strictEqual(getJudge0LanguageId("c", validCfg), 50);
      } finally {
        if (prevHost) process.env.JUDGE0_API_HOST = prevHost; else delete process.env.JUDGE0_API_HOST;
        if (prevKey) process.env.JUDGE0_API_KEY = prevKey; else delete process.env.JUDGE0_API_KEY;
        if (prevPy) process.env.JUDGE0_LANG_PYTHON = prevPy; else delete process.env.JUDGE0_LANG_PYTHON;
      }
    });

    await it("Judge0 Polling & Base64: Polls queued/processing submissions and forwards stdin across Python, JS, Java, C, C++", async () => {
      let pollCount = 0;
      const seenQueries = [];
      const seenLangIds = [];
      const mockJudge0 = http.createServer((req, res) => {
        seenQueries.push(req.url);
        if (req.method === "POST" && req.url.startsWith("/submissions")) {
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", () => {
            const parsed = JSON.parse(body);
            seenLangIds.push(parsed.language_id);
            const stdinDecoded = Buffer.from(parsed.stdin || "", "base64").toString("utf8").trim();
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                token: `tok_${parsed.language_id}_${stdinDecoded}`,
                status: { id: 1, description: "In Queue" },
              })
            );
          });
          return;
        }
        if (req.method === "GET" && req.url.startsWith("/submissions/tok_")) {
          pollCount++;
          const parts = req.url.split("?")[0].split("_");
          const stdinVal = parts.slice(2).join("_");
          if (pollCount === 1) {
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ token: "tok", status: { id: 2, description: "Processing" } }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              status: { id: 3, description: "Accepted" },
              stdout: Buffer.from(`OUT:${stdinVal}\n`).toString("base64"),
              stderr: null,
              time: "0.025",
            })
          );
        }
        res.writeHead(404).end();
      });

      await new Promise((r) => mockJudge0.listen(0, r));
      const port = mockJudge0.address().port;
      const prevHost = process.env.JUDGE0_API_HOST;
      const prevEnv = process.env.NODE_ENV;

      try {
        process.env.JUDGE0_API_HOST = `http://127.0.0.1:${port}`;
        process.env.NODE_ENV = "production";

        for (const [lang, expectedId] of [
          ["python", 71],
          ["javascript", 63],
          ["java", 62],
          ["cpp", 54],
          ["c", 50],
        ]) {
          const execRes = await executeCode({
            language: lang,
            code: "int main() { return 0; }",
            stdin: "42",
          });
          assert.strictEqual(execRes.exitCode, 0, `Expected exitCode 0 for ${lang}`);
          assert.strictEqual(execRes.output.trim(), "OUT:42");
          assert.ok(seenLangIds.includes(expectedId), `Expected language_id ${expectedId} for ${lang}`);
        }
        assert.ok(seenQueries.some((q) => q.includes("base64_encoded=true")), "Submission URL must include base64_encoded=true");
        assert.ok(pollCount >= 2, "Must poll GET /submissions/:token when status is In Queue (1) / Processing (2)");
      } finally {
        if (prevHost) process.env.JUDGE0_API_HOST = prevHost; else delete process.env.JUDGE0_API_HOST;
        process.env.NODE_ENV = prevEnv;
        mockJudge0.close();
      }
    });

    await it("MasteryZone Compiler (Production Judge0): Handles Accepted, Wrong Answer, Compilation Error, Runtime Error, and Timeout", async () => {
      let currentMode = "accepted";
      const mockJudge0 = http.createServer((req, res) => {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          const parsed = body ? JSON.parse(body) : {};
          const stdinStr = Buffer.from(parsed.stdin || "", "base64").toString("utf8").trim();
          res.writeHead(200, { "Content-Type": "application/json" });

          if (currentMode === "compile_error") {
            return res.end(
              JSON.stringify({
                status: { id: 6, description: "Compilation Error" },
                stdout: null,
                stderr: null,
                compile_output: Buffer.from("main.cpp:3:12: error: expected ';' before '}' token\n").toString("base64"),
                time: "0.00",
              })
            );
          }
          if (currentMode === "runtime_error") {
            return res.end(
              JSON.stringify({
                status: { id: 11, description: "Runtime Error (NZEC)" },
                stdout: null,
                stderr: Buffer.from("ZeroDivisionError: division by zero\n").toString("base64"),
                compile_output: null,
                time: "0.02",
              })
            );
          }
          if (currentMode === "timeout") {
            return res.end(
              JSON.stringify({
                status: { id: 5, description: "Time Limit Exceeded" },
                stdout: null,
                stderr: null,
                compile_output: null,
                time: "4.00",
              })
            );
          }
          if (currentMode === "wrong_answer") {
            return res.end(
              JSON.stringify({
                status: { id: 3, description: "Accepted" },
                stdout: Buffer.from("[99, 99]\n").toString("base64"),
                stderr: null,
                time: "0.02",
              })
            );
          }
          if (currentMode === "empty_output") {
            return res.end(
              JSON.stringify({
                status: { id: 3, description: "Accepted" },
                stdout: Buffer.from("").toString("base64"),
                stderr: null,
                time: "0.01",
              })
            );
          }
          // Default: accepted for ch_tight_bound test cases
          const lines = stdinStr.split(/\r?\n/);
          const coeffs = (lines[1] || "1 1").trim().split(/\s+/).map(Number);
          const sum = coeffs.reduce((a, b) => a + b, 0);
          return res.end(
            JSON.stringify({
              status: { id: 3, description: "Accepted" },
              stdout: Buffer.from(`${coeffs[0]} ${sum} 1\n`).toString("base64"),
              stderr: null,
              time: "0.015",
            })
          );
        });
      });

      await new Promise((r) => mockJudge0.listen(0, r));
      const port = mockJudge0.address().port;
      const prevHost = process.env.JUDGE0_API_HOST;
      const prevEnv = process.env.NODE_ENV;

      try {
        process.env.JUDGE0_API_HOST = `http://127.0.0.1:${port}`;
        process.env.NODE_ENV = "production";

        // 1. Accepted
        currentMode = "accepted";
        const passRes = await fetch(`${baseUrl}/api/coding/challenges/ch_tight_bound/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({ language: "python", code: "k = int(input())\nprint(k)" }),
        });
        assert.strictEqual(passRes.status, 200);
        const passData = await passRes.json();
        assert.strictEqual(passData.status, "ACCEPTED");
        assert.strictEqual(passData.passedCount, passData.total);

        // 2. Wrong Answer
        currentMode = "wrong_answer";
        const wrongRes = await fetch(`${baseUrl}/api/coding/challenges/ch_tight_bound/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({ language: "python", code: "k = int(input())\nprint(999)" }),
        });
        const wrongData = await wrongRes.json();
        assert.strictEqual(wrongData.status, "WRONG_ANSWER");
        assert.strictEqual(wrongData.passedCount, 0);

        // 3. Empty Output -> Never reported as passed
        currentMode = "empty_output";
        const emptyRes = await fetch(`${baseUrl}/api/coding/challenges/ch_tight_bound/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({ language: "python", code: "x = 1\n" }),
        });
        const emptyData = await emptyRes.json();
        assert.strictEqual(emptyData.passedCount, 0);
        assert.ok(emptyData.results.every((r) => r.passed === false));

        // 4. Compilation Error
        currentMode = "compile_error";
        const compRes = await fetch(`${baseUrl}/api/coding/challenges/ch_tight_bound/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({ language: "cpp", code: "int main() { return 0 }" }),
        });
        const compData = await compRes.json();
        assert.strictEqual(compData.passedCount, 0);
        assert.ok(compData.results[0].error.includes("Compilation Error"));

        // 5. Runtime Error
        currentMode = "runtime_error";
        const rtRes = await fetch(`${baseUrl}/api/coding/challenges/ch_tight_bound/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({ language: "python", code: "print(1 / 0)" }),
        });
        const rtData = await rtRes.json();
        assert.strictEqual(rtData.passedCount, 0);
        assert.ok(rtData.results[0].error.includes("ZeroDivisionError"));

        // 6. Timeout
        currentMode = "timeout";
        const toRes = await fetch(`${baseUrl}/api/coding/challenges/ch_tight_bound/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({ language: "python", code: "while True:\n    pass" }),
        });
        const toData = await toRes.json();
        assert.strictEqual(toData.passedCount, 0);
        assert.ok(toData.results[0].error.includes("timed out"));
      } finally {
        if (prevHost) process.env.JUDGE0_API_HOST = prevHost; else delete process.env.JUDGE0_API_HOST;
        process.env.NODE_ENV = prevEnv;
        mockJudge0.close();
      }
    });

    await it("Project Compiler (Production Judge0): Multi-file project bundling, Accepted, Wrong Answer, Compile Error, Runtime Error, Timeout, and Fail-Closed 503", async () => {
      const pyProject = getProjectById("proj_trading_bot");
      assert.ok(pyProject, "proj_trading_bot must exist in catalog");

      let projectMode = "accepted";
      const mockJudge0 = http.createServer((req, res) => {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          const parsed = body ? JSON.parse(body) : {};
          const decodedSource = Buffer.from(parsed.source_code || "", "base64").toString("utf8");
          const decodedStdin = Buffer.from(parsed.stdin || "", "base64").toString("utf8");

          res.writeHead(200, { "Content-Type": "application/json" });

          if (projectMode === "compile_error") {
            return res.end(
              JSON.stringify({
                status: { id: 6, description: "Compilation Error" },
                compile_output: Buffer.from("Syntax Error in indicators.py (line 2): invalid syntax\n").toString("base64"),
                time: "0.01",
              })
            );
          }
          if (projectMode === "runtime_error") {
            return res.end(
              JSON.stringify({
                status: { id: 11, description: "Runtime Error (NZEC)" },
                stderr: Buffer.from("KeyError: 'prices'\n").toString("base64"),
                time: "0.02",
              })
            );
          }
          if (projectMode === "timeout") {
            return res.end(
              JSON.stringify({
                status: { id: 5, description: "Time Limit Exceeded" },
                time: "5.00",
              })
            );
          }
          if (projectMode === "wrong_answer") {
            return res.end(
              JSON.stringify({
                status: { id: 3, description: "Accepted" },
                stdout: Buffer.from('{"ok": false, "wrong": true}\n').toString("base64"),
                time: "0.02",
              })
            );
          }

          // Verify multi-file bundling actually included all project modules
          assert.ok(decodedSource.includes("_MZ_SOURCES") && decodedSource.includes("indicators") && decodedSource.includes("backtester"));

          // Match test case input to expected output from proj_trading_bot
          const matchingTc = (pyProject.testCases || []).find((tc) => (tc.input || "").trim() === decodedStdin.trim());
          const outText = matchingTc ? matchingTc.expectedOutput : '{"ok": true}';
          return res.end(
            JSON.stringify({
              status: { id: 3, description: "Accepted" },
              stdout: Buffer.from(`${outText}\n`).toString("base64"),
              time: "0.03",
            })
          );
        });
      });

      await new Promise((r) => mockJudge0.listen(0, r));
      const port = mockJudge0.address().port;
      const prevHost = process.env.JUDGE0_API_HOST;
      const prevEnv = process.env.NODE_ENV;

      try {
        process.env.JUDGE0_API_HOST = `http://127.0.0.1:${port}`;
        process.env.NODE_ENV = "production";

        // 1. Successful multi-file project execution in production via Judge0
        projectMode = "accepted";
        const runRes = await fetch(`${baseUrl}/api/projects/proj_trading_bot/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({
            mode: "tests",
            files: pyProject.solutionFiles,
          }),
        });
        assert.strictEqual(runRes.status, 200);
        const runData = await runRes.json();
        assert.strictEqual(runData.passedTests, runData.totalTests);
        assert.strictEqual(runData.evaluation.passed, true);

        // 2. Wrong answer in Project Compiler
        projectMode = "wrong_answer";
        const waRes = await fetch(`${baseUrl}/api/projects/proj_trading_bot/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({
            mode: "tests",
            files: pyProject.solutionFiles,
          }),
        });
        const waData = await waRes.json();
        assert.strictEqual(waData.passedTests, 0);
        assert.strictEqual(waData.evaluation.passed, false);

        // 3. Compilation error in Project Compiler
        projectMode = "compile_error";
        const ceRes = await fetch(`${baseUrl}/api/projects/proj_trading_bot/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({
            mode: "tests",
            files: pyProject.solutionFiles,
          }),
        });
        const ceData = await ceRes.json();
        assert.strictEqual(ceData.passedTests, 0);
        assert.ok(ceData.testResults[0].error.includes("Compilation Error") || ceData.testResults[0].error.includes("Syntax Error"));

        // 4. Runtime error in Project Compiler
        projectMode = "runtime_error";
        const reRes = await fetch(`${baseUrl}/api/projects/proj_trading_bot/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({
            mode: "tests",
            files: pyProject.solutionFiles,
          }),
        });
        const reData = await reRes.json();
        assert.strictEqual(reData.passedTests, 0);
        assert.ok(reData.testResults[0].error.includes("KeyError"));

        // 5. Timeout in Project Compiler
        projectMode = "timeout";
        const toRes = await fetch(`${baseUrl}/api/projects/proj_trading_bot/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({
            mode: "tests",
            files: pyProject.solutionFiles,
          }),
        });
        const toData = await toRes.json();
        assert.strictEqual(toData.passedTests, 0);
        assert.ok(toData.testResults[0].error.includes("timed out"));

        // 6. Missing Judge0 in production -> Fail-closed 503 in Project Compiler
        delete process.env.JUDGE0_API_HOST;
        const unconfRes = await fetch(`${baseUrl}/api/projects/proj_trading_bot/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenHost}` },
          body: JSON.stringify({
            mode: "tests",
            files: pyProject.solutionFiles,
          }),
        });
        assert.strictEqual(unconfRes.status, 503);
        const unconfData = await unconfRes.json();
        assert.strictEqual(unconfData.isUnavailable, true);
        assert.ok(unconfData.error.includes("Production execution requires a configured isolated execution environment"));
      } finally {
        if (prevHost) process.env.JUDGE0_API_HOST = prevHost; else delete process.env.JUDGE0_API_HOST;
        process.env.NODE_ENV = prevEnv;
        mockJudge0.close();
      }
    });

    console.log("\n================================================================================");
    console.log("Summary: Comprehensive Verification Tests Passed (100%)");
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
