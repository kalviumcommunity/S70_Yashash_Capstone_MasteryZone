const assert = require("assert");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { getJwtSecret } = require("../config/jwtConfig");
const { attachAuthCookies, clearAuthCookies, generateCsrfToken } = require("../utils/authCookies");
const csrfProtection = require("../middleware/csrfProtection");
const authenticateToken = require("../middleware/authMiddleware");
const verifyToken = require("../middleware/auth");

async function runSuite() {
  console.log("==================================================");
  console.log("🔒 Complete Security Audit & Authentication Fixes Verification");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // ── 1. Credential Security & Insecure Fallbacks ──
  test("1. server.js has NO hardcoded SMTP passwords or credential fallbacks", () => {
    const code = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
    assert.strictEqual(code.includes("miqtinlszsdfayvi"), false);
    assert.strictEqual(code.includes('process.env.SMTP_PASSWORD = "'), false);
    assert.strictEqual(code.includes('process.env.SMTP_EMAIL = "'), false);
  });

  test("2. adminBootstrap.js has NO hardcoded passwords", () => {
    const code = fs.readFileSync(path.join(__dirname, "../bootstrap/adminBootstrap.js"), "utf8");
    assert.strictEqual(code.includes("miqtinlszsdfayvi"), false);
  });

  test("3. test_admin_mgmt_cdp.js has NO hardcoded fallback password", () => {
    const code = fs.readFileSync(path.join(__dirname, "../test_admin_mgmt_cdp.js"), "utf8");
    assert.strictEqual(code.includes("miqtinlszsdfayvi"), false);
  });

  test("4. scratch mailer scripts have NO hardcoded passwords", () => {
    const p1 = path.join(__dirname, "../../scratch/cleanMailerSpam.js");
    const p2 = path.join(__dirname, "../../scratch/permanentlyDeleteSpam.js");
    if (fs.existsSync(p1)) {
      const code = fs.readFileSync(p1, "utf8");
      assert.strictEqual(code.includes("miqtinlszsdfayvi"), false);
    }
    if (fs.existsSync(p2)) {
      const code = fs.readFileSync(p2, "utf8");
      assert.strictEqual(code.includes("miqtinlszsdfayvi"), false);
    }
  });

  test("5. server/.env credentials have been rotated and purged of exposed password", () => {
    const envPath = path.join(__dirname, "../.env");
    const envContent = fs.readFileSync(envPath, "utf8");
    assert.strictEqual(envContent.includes("miqtinlszsdfayvi"), false, "Exposed password miqtinlszsdfayvi must not be in .env");
    assert.ok(envContent.includes("ADMIN_PASSWORD=MzSuperAdmin_"), "ADMIN_PASSWORD must be rotated to secure format");
    assert.ok(envContent.includes("JWT_SECRET="), "JWT_SECRET must be configured");
  });

  // ── 2. HttpOnly Cookie & CSRF Protection Verification ──
  test("6. attachAuthCookies attaches HttpOnly JWT and readable CSRF cookies", () => {
    const cookiesSet = {};
    const mockRes = {
      cookie: (name, val, opts) => {
        cookiesSet[name] = { val, opts };
      },
    };

    const token = "mock.jwt.token";
    const csrfToken = attachAuthCookies(mockRes, token);

    assert.ok(csrfToken && csrfToken.length >= 32, "CSRF token must be strong");
    assert.ok(cookiesSet.token, "JWT token cookie must be set");
    assert.strictEqual(cookiesSet.token.opts.httpOnly, true, "JWT cookie must be HttpOnly");
    assert.strictEqual(cookiesSet.token.opts.path, "/");

    assert.ok(cookiesSet.mz_csrf_token, "CSRF token cookie must be set");
    assert.strictEqual(cookiesSet.mz_csrf_token.opts.httpOnly, false, "CSRF cookie must be readable by client JS");
  });

  test("7. clearAuthCookies wipes both JWT and CSRF cookies on logout", () => {
    const cookiesCleared = {};
    const mockRes = {
      clearCookie: (name, opts) => {
        cookiesCleared[name] = opts;
      },
    };

    clearAuthCookies(mockRes);
    assert.ok(cookiesCleared.token, "JWT cookie must be cleared on logout");
    assert.ok(cookiesCleared.mz_csrf_token, "CSRF cookie must be cleared on logout");
  });

  test("8. CSRF Middleware rejects mutating cookie-authenticated request without CSRF token", () => {
    let nextCalled = false;
    let statusCode = null;
    let responseBody = null;

    const mockReq = {
      method: "POST",
      baseUrl: "/api",
      path: "/interests",
      headers: {},
      cookies: {
        token: "some.cookie.jwt",
        mz_csrf_token: "expected-csrf-token-123456",
      },
      body: { interests: ["Python"] },
    };

    const mockRes = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseBody = data;
          },
        };
      },
    };

    csrfProtection(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false, "Must block mutating request without CSRF header");
    assert.strictEqual(statusCode, 403, "Must return HTTP 403 Forbidden");
    assert.strictEqual(responseBody.error, "CSRF_VALIDATION_FAILED");
  });

  test("9. CSRF Middleware approves mutating cookie-authenticated request with matching X-CSRF-Token", () => {
    let nextCalled = false;
    const csrfValue = "expected-csrf-token-123456";

    const mockReq = {
      method: "POST",
      baseUrl: "/api",
      path: "/interests",
      headers: {
        "x-csrf-token": csrfValue,
      },
      cookies: {
        token: "some.cookie.jwt",
        mz_csrf_token: csrfValue,
      },
      body: { interests: ["Python"] },
    };

    const mockRes = {
      status: () => mockRes,
      json: () => {},
    };

    csrfProtection(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, "Must allow request when CSRF token matches cookie");
  });

  test("10. CSRF Middleware exempts requests using Authorization: Bearer token header", () => {
    let nextCalled = false;

    const mockReq = {
      method: "POST",
      baseUrl: "/api",
      path: "/interests",
      headers: {
        authorization: "Bearer mock.jwt.token",
      },
      cookies: {},
      body: { interests: ["Java"] },
    };

    const mockRes = {
      status: () => mockRes,
      json: () => {},
    };

    csrfProtection(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, "Bearer token requests must pass without CSRF cookie");
  });

  test("11. CSRF Middleware exempts safe GET / HEAD / OPTIONS methods", () => {
    let nextCalled = false;

    const mockReq = {
      method: "GET",
      baseUrl: "/api",
      path: "/profile",
      headers: {},
      cookies: { token: "some.jwt" },
    };

    csrfProtection(mockReq, {}, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, "Safe GET requests must never require CSRF");
  });

  // ── 3. Dual-Source Auth Middleware Verification ──
  test("12. authMiddleware authenticates via Authorization: Bearer header", () => {
    const validToken = jwt.sign({ userId: "u123", email: "user@test.com" }, getJwtSecret(), { expiresIn: "1h" });
    let nextCalled = false;
    const req = {
      headers: { authorization: `Bearer ${validToken}` },
      cookies: {},
    };

    authenticateToken(req, {}, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.userId, "u123");
  });

  test("13. authMiddleware authenticates via HttpOnly cookie (req.cookies.token)", () => {
    const validToken = jwt.sign({ userId: "u456", email: "cookie@test.com" }, getJwtSecret(), { expiresIn: "1h" });
    let nextCalled = false;
    const req = {
      headers: {},
      cookies: { token: validToken },
    };

    authenticateToken(req, {}, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.userId, "u456");
  });

  test("14. verifyToken (auth.js) authenticates via HttpOnly cookie", () => {
    const validToken = jwt.sign({ userId: "u789", email: "vtoken@test.com" }, getJwtSecret(), { expiresIn: "1h" });
    let nextCalled = false;
    const req = {
      headers: {},
      cookies: { token: validToken },
    };

    verifyToken(req, {}, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.userId, "u789");
  });

  // ── 4. ProtectedRoute Fail-Closed Verification ──
  test("15. ProtectedRoute code strictly fails closed and rejects access on server error or network failure", () => {
    const prCode = fs.readFileSync(path.join(__dirname, "../../client/src/components/ProtectedRoute.jsx"), "utf8");

    // Must NOT contain fail-open fallback to cachedUser
    assert.strictEqual(
      prCode.includes('if (cachedUser) {\n            setAuthState("authenticated");'),
      false,
      "ProtectedRoute must not fall back to cachedUser on server error"
    );
    assert.strictEqual(
      prCode.includes('if (cachedUser) {\n          setAuthState("authenticated");'),
      false,
      "ProtectedRoute must not fall back to cachedUser on catch exception"
    );

    // Must contain fail-closed error handling
    assert.ok(prCode.includes("Strictly fail-closed:"), "Must have explicit fail-closed logic");
    assert.ok(prCode.includes('setAuthState("unauthenticated")'), "Must set unauthenticated on failure");
  });

  // ── 5. Targeted Storage Cleanup & Theme Preservation ──
  test("16. Login.jsx and signup.jsx use clearMasteryZoneStorage instead of global localStorage.clear()", () => {
    const loginCode = fs.readFileSync(path.join(__dirname, "../../client/src/components/Login.jsx"), "utf8");
    const signupCode = fs.readFileSync(path.join(__dirname, "../../client/src/components/signup.jsx"), "utf8");

    assert.strictEqual(loginCode.includes("localStorage.clear()"), false, "Login must not call global localStorage.clear()");
    assert.strictEqual(loginCode.includes("sessionStorage.clear()"), false, "Login must not call global sessionStorage.clear()");
    assert.ok(loginCode.includes("clearMasteryZoneStorage()"), "Login must call targeted clearMasteryZoneStorage()");

    assert.strictEqual(signupCode.includes("localStorage.clear()"), false, "Signup must not call global localStorage.clear()");
    assert.strictEqual(signupCode.includes("sessionStorage.clear()"), false, "Signup must not call global sessionStorage.clear()");
    assert.ok(signupCode.includes("clearMasteryZoneStorage()"), "Signup must call targeted clearMasteryZoneStorage()");
  });

  console.log("==================================================");
  console.log(`Summary: ${passed}/${total} security audit tests passed!`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
