const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');

const User = require('../models/User');
const authRoutes = require('../routes/authRoutes');

function httpRequest(serverUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path || '/', serverUrl);
    const method = options.method || 'GET';
    const headers = options.headers || {};
    let body = options.body;

    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = rawData ? JSON.parse(rawData) : {};
          } catch {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Firebase Login & Auth Verification Test Suite...\n');
  const testEmails = [];

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/auth', authRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const serverPort = server.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  try {
    // Test 1: Rejects missing token
    console.log('Test 1: verifyFirebaseToken rejects request with missing token...');
    const res1 = await httpRequest(baseUrl, {
      method: 'POST',
      path: '/auth/firebase-login',
      body: {},
    });
    assert.strictEqual(res1.status, 401);
    assert.strictEqual(res1.body.success, false);
    assert.ok(res1.body.message.includes('Access denied'));
    console.log('✅ Test 1 Passed: 401 returned for missing token');

    // Test 2: Rejects malformed JWT token
    console.log('Test 2: verifyFirebaseToken rejects malformed token...');
    const res2 = await httpRequest(baseUrl, {
      method: 'POST',
      path: '/auth/firebase-login',
      headers: { Authorization: 'Bearer not-a-valid-jwt-token' },
      body: {},
    });
    assert.strictEqual(res2.status, 401);
    assert.strictEqual(res2.body.success, false);
    assert.ok(res2.body.message.includes('Malformed Firebase ID token header'));
    console.log('✅ Test 2 Passed: 401 returned for malformed token header');

    // Test 3: Rejects token with invalid key ID
    console.log('Test 3: verifyFirebaseToken rejects unrecognized key ID...');
    const fakeToken = jwt.sign(
      { sub: 'test-uid', email: 'test@example.com' },
      'fake-secret',
      { header: { kid: 'non-existent-kid-123456789', alg: 'HS256' } }
    );
    const res3 = await httpRequest(baseUrl, {
      method: 'POST',
      path: '/auth/firebase-login',
      headers: { Authorization: `Bearer ${fakeToken}` },
      body: {},
    });
    assert.strictEqual(res3.status, 401);
    assert.strictEqual(res3.body.success, false);
    assert.ok(res3.body.message.includes('Invalid Firebase ID token key ID'));
    console.log('✅ Test 3 Passed: 401 returned for invalid key ID');

    // Test 4: Existing user authentication
    console.log('Test 4: POST /auth/firebase-login with existing user...');
    const existing = await User.findOne({ email: 'yashashyashash1@gmail.com' });
    assert.ok(existing, 'Expected test admin user to exist in DB');

    const appExisting = express();
    appExisting.use(express.json());
    appExisting.use(cookieParser());
    appExisting.use(
      '/auth',
      (req, res, next) => {
        req.user = {
          uid: 'google-uid-superadmin-123',
          email: existing.email,
          name: existing.fullName || 'Super Admin',
        };
        next();
      },
      authRoutes
    );

    const serverExisting = http.createServer(appExisting);
    await new Promise((resolve) => serverExisting.listen(0, resolve));
    const baseUrlExisting = `http://127.0.0.1:${serverExisting.address().port}`;

    const res4 = await httpRequest(baseUrlExisting, {
      method: 'POST',
      path: '/auth/firebase-login',
      body: {},
    });
    serverExisting.close();

    assert.strictEqual(res4.status, 200);
    assert.strictEqual(res4.body.message, 'Firebase login successful');
    assert.ok(res4.body.token, 'Token must be issued');
    assert.ok(res4.body.csrfToken, 'CSRF token must be issued');
    assert.strictEqual(res4.body.user.email, existing.email);
    assert.ok(res4.headers['set-cookie'], 'Set-Cookie headers must be present');
    const setCookieHeader = JSON.stringify(res4.headers['set-cookie']);
    assert.ok(setCookieHeader.includes('token='), 'HttpOnly token cookie must be set');
    assert.ok(setCookieHeader.includes('mz_csrf_token='), 'CSRF cookie must be set');
    console.log('✅ Test 4 Passed: Existing user authenticated with JWT & secure cookies');

    // Test 5: Brand new user creation & isolated session
    console.log('Test 5: POST /auth/firebase-login creates brand new user safely...');
    const newEmail = `test_google_auth_${Date.now()}@example.com`;
    testEmails.push(newEmail);

    const appNew = express();
    appNew.use(express.json());
    appNew.use(cookieParser());
    appNew.use(
      '/auth',
      (req, res, next) => {
        req.user = {
          uid: `google-uid-${Date.now()}`,
          email: newEmail,
          name: 'New Google Student',
        };
        next();
      },
      authRoutes
    );

    const serverNew = http.createServer(appNew);
    await new Promise((resolve) => serverNew.listen(0, resolve));
    const baseUrlNew = `http://127.0.0.1:${serverNew.address().port}`;

    const res5 = await httpRequest(baseUrlNew, {
      method: 'POST',
      path: '/auth/firebase-login',
      body: {},
    });
    serverNew.close();

    assert.strictEqual(res5.status, 200);
    assert.strictEqual(res5.body.message, 'Firebase login successful');
    assert.ok(res5.body.token);
    assert.strictEqual(res5.body.user.email, newEmail);
    assert.strictEqual(res5.body.user.role, 'user');

    const createdUser = await User.findOne({ email: newEmail });
    assert.ok(createdUser, 'User must exist in DB');
    assert.strictEqual(createdUser.authProvider, 'google');
    assert.ok(createdUser.password, 'Password must be hashed and stored');
    assert.ok(
      createdUser.password.startsWith('$2b$') || createdUser.password.startsWith('$2a$'),
      'Password must be bcrypt hash'
    );
    console.log('✅ Test 5 Passed: Brand new Google user registered safely without collisions');

    // Test 6: Rejection of suspended accounts
    console.log('Test 6: POST /auth/firebase-login rejects suspended user (403)...');
    const suspendedEmail = `suspended_google_${Date.now()}@example.com`;
    testEmails.push(suspendedEmail);

    await User.create({
      username: `susp_${Date.now()}`,
      email: suspendedEmail,
      password: crypto.randomBytes(16).toString('hex'),
      isSuspended: true,
      suspendedReason: 'Account suspended due to policy violation.',
      role: 'user',
    });

    const appSuspended = express();
    appSuspended.use(express.json());
    appSuspended.use(cookieParser());
    appSuspended.use(
      '/auth',
      (req, res, next) => {
        req.user = {
          uid: 'google-uid-suspended',
          email: suspendedEmail,
          name: 'Suspended User',
        };
        next();
      },
      authRoutes
    );

    const serverSuspended = http.createServer(appSuspended);
    await new Promise((resolve) => serverSuspended.listen(0, resolve));
    const baseUrlSuspended = `http://127.0.0.1:${serverSuspended.address().port}`;

    const res6 = await httpRequest(baseUrlSuspended, {
      method: 'POST',
      path: '/auth/firebase-login',
      body: {},
    });
    serverSuspended.close();

    assert.strictEqual(res6.status, 403);
    assert.ok(res6.body.message.includes('Account suspended due to policy violation'));
    console.log('✅ Test 6 Passed: Suspended accounts strictly blocked with 403');

    // Test 7: Missing email claims rejected with 400 or 401
    console.log('Test 7: POST /auth/firebase-login rejects missing email claims (400/401)...');
    const appNoEmail = express();
    appNoEmail.use(express.json());
    appNoEmail.use(cookieParser());
    appNoEmail.use(
      '/auth',
      (req, res, next) => {
        req.user = { uid: 'google-uid-no-email' };
        next();
      },
      authRoutes
    );

    const serverNoEmail = http.createServer(appNoEmail);
    await new Promise((resolve) => serverNoEmail.listen(0, resolve));
    const baseUrlNoEmail = `http://127.0.0.1:${serverNoEmail.address().port}`;

    const res7 = await httpRequest(baseUrlNoEmail, {
      method: 'POST',
      path: '/auth/firebase-login',
      body: {},
    });
    serverNoEmail.close();

    assert.ok(
      [400, 401].includes(res7.status),
      `Expected status 400 or 401 for missing email claims, got ${res7.status}`
    );
    console.log('✅ Test 7 Passed: Missing email claims properly rejected');

    console.log('\n🎉 ALL 7 FIREBASE LOGIN TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
    if (testEmails.length > 0) {
      await User.deleteMany({ email: { $in: testEmails } });
      console.log(`🧹 Cleaned up ${testEmails.length} test accounts.`);
    }
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
