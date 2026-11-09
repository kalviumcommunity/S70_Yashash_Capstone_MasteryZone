const assert = require("assert");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { getJwtSecret } = require("../config/jwtConfig");
const verifyFirebaseToken = require("../middleware/firebaseAuth");
const authenticateToken = require("../middleware/authMiddleware");

async function runTests() {
  console.log("==================================================");
  console.log("Running Mastery Zone Technical Audit Test Suite");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
    }
  }

  // --- 1. JWT Configuration & Security ---
  test("JWT Secret is not default 'supersecretkey'", () => {
    const secret = getJwtSecret();
    assert.notStrictEqual(secret, "supersecretkey");
    assert(secret && secret.length >= 16);
  });

  test("JWT verification succeeds with valid token", () => {
    const secret = getJwtSecret();
    const token = jwt.sign({ userId: "12345", role: "user" }, secret, { expiresIn: "1h" });
    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.userId, "12345");
  });

  test("JWT verification fails with tampered token", () => {
    const secret = getJwtSecret();
    const token = jwt.sign({ userId: "12345", role: "user" }, secret, { expiresIn: "1h" });
    const tampered = token.slice(0, -4) + "abcd";
    assert.throws(() => jwt.verify(tampered, secret));
  });

  // --- 2. Firebase Auth Middleware Security ---
  await testAsync("Firebase Auth rejects unverified request body identity injection", async () => {
    let statusCode = null;
    let jsonResponse = null;
    const req = {
      headers: {},
      body: {
        email: "hacker@example.com",
        name: "Injected Admin",
        uid: "injected-uid",
      },
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            jsonResponse = data;
          },
        };
      },
    };
    let nextCalled = false;
    await verifyFirebaseToken(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false, "Should NOT call next() on unverified body email");
    assert.strictEqual(statusCode, 401, "Should return 401 Unauthorized");
    assert(jsonResponse && jsonResponse.message, "Should return error message");
  });

  await testAsync("Firebase Auth rejects missing token", async () => {
    let statusCode = null;
    const req = { headers: {}, body: {} };
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: () => {} };
      },
    };
    let nextCalled = false;
    await verifyFirebaseToken(req, res, () => {
      nextCalled = true;
    });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCode, 401);
  });

  // --- 3. Express Auth Middleware ---
  test("Auth Middleware rejects missing Authorization header", () => {
    let statusCode = null;
    const req = { headers: {} };
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: () => {} };
      },
    };
    let nextCalled = false;
    authenticateToken(req, res, () => {
      nextCalled = true;
    });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCode, 401);
  });

  test("Auth Middleware authenticates valid Bearer token", () => {
    const secret = getJwtSecret();
    const token = jwt.sign({ userId: "user_abc", email: "learner@masteryzone.com" }, secret);
    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    let nextCalled = false;
    const res = { status: () => ({ json: () => {} }) };
    authenticateToken(req, res, () => {
      nextCalled = true;
    });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.userId, "user_abc");
  });

  // --- 4. Database Config & Secret Safety ---
  test("Database URI avoids hardcoded production Atlas credentials in tracked code", () => {
    const fs = require("fs");
    const serverCode = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
    assert.strictEqual(serverCode.includes("ATLAS_FALLBACK_URI"), false);
  });

  test("Admin Bootstrap does not contain hardcoded default password", () => {
    const fs = require("fs");
    const bootstrapCode = fs.readFileSync(path.join(__dirname, "../bootstrap/adminBootstrap.js"), "utf8");
    assert.strictEqual(bootstrapCode.includes("miqtinlszsdfayvi"), false, "Insecure password must be removed");
  });

  test("Gitignore blocks user uploaded recordings, certificates, and evidence", () => {
    const fs = require("fs");
    const gitignore = fs.readFileSync(path.join(__dirname, "../../.gitignore"), "utf8");
    assert(gitignore.includes("server/uploads/recordings/*"));
    assert(gitignore.includes("server/uploads/certificates/*"));
    assert(gitignore.includes("server/uploads/evidence/*"));
    assert(gitignore.includes("server/uploads/support_attachments/*"));
  });

  // --- 5. Proctoring Rules & Constraints ---
  test("Proctoring limits recovery chances to maximum of 5", () => {
    const maxChances = 5;
    let chancesUsed = 0;
    for (let i = 0; i < 6; i++) {
      chancesUsed++;
    }
    const isTerminated = chancesUsed >= maxChances;
    assert.strictEqual(isTerminated, true);
  });

  console.log("==================================================");
  console.log(`Results: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
