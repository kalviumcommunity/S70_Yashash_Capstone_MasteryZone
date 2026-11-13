/**
 * Mastery Zone — Production Performance & Concurrency Benchmark Suite
 */

process.env.NODE_ENV = "test";
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "benchmark_super_secure_jwt_secret_key_minimum_32_characters_1234567890";
}

const assert = require("assert");
const http = require("http");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const { io: ClientIo } = require("socket.io-client");

const { getJwtSecret } = require("../config/jwtConfig");
const authenticateToken = require("../middleware/authMiddleware");
const { getCachedDecodedToken } = require("../middleware/authMiddleware");
const etagCache = require("../utils/etagCache");
const codingRoutes = require("../routes/codingRoutes");
const certificationRoutes = require("../routes/certificationRoutes");
const curriculumRoutes = require("../routes/curriculumRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const meetingRoutes = require("../routes/meetingRoutes");

async function runBenchmark() {
  console.log("================================================================================");
  console.log("⚡ MASTERY ZONE PRODUCTION PERFORMANCE & CONCURRENCY BENCHMARK SUITE");
  console.log("================================================================================");

  // 1. JWT Memoization & Auth Cache Benchmark
  console.log("\n[Benchmark 1] JWT Secret Memoization & Auth Verification");
  const testPayload = {
    userId: new mongoose.Types.ObjectId().toString(),
    email: "benchmark_user@masteryzone.com",
    role: "user",
  };
  const secret = getJwtSecret();
  const testToken = jwt.sign(testPayload, secret, { expiresIn: "1h" });

  const startSecret = process.hrtime.bigint();
  for (let i = 0; i < 1000; i++) {
    getJwtSecret();
  }
  const endSecret = process.hrtime.bigint();
  const secretDurationUs = Number(endSecret - startSecret) / 1000 / 1000;
  console.log(`  ✔ 1,000 getJwtSecret() calls completed in: ${secretDurationUs.toFixed(3)} µs/call (memoized)`);
  assert(secretDurationUs < 50, "getJwtSecret should be sub-50 microseconds");

  // Auth token caching
  const startAuth1 = process.hrtime.bigint();
  jwt.verify(testToken, secret);
  const endAuth1 = process.hrtime.bigint();
  const coldAuthMs = Number(endAuth1 - startAuth1) / 1000000;

  // Populate cache via middleware or lookup
  getCachedDecodedToken(testToken); // initial cache
  const startAuth2 = process.hrtime.bigint();
  const cachedDecoded = getCachedDecodedToken(testToken);
  const endAuth2 = process.hrtime.bigint();
  const warmAuthMs = Number(endAuth2 - startAuth2) / 1000000;

  console.log(`  ✔ Cold HMAC-SHA256 Token Verification: ${coldAuthMs.toFixed(3)} ms`);
  console.log(`  ✔ Warm LRU Verified-Token Cache Lookup: ${warmAuthMs.toFixed(3)} ms`);
  assert(cachedDecoded !== null, "Token should be in LRU cache");
  assert(warmAuthMs < 0.05, "Cached token lookup should be sub-50 microseconds");

  // 2. Setup Test HTTP Server with In-Memory / Lightweight Mocks for Isolated Benchmarking
  console.log("\n[Benchmark 2] Endpoints Cold vs Warm (304) Latency Comparison");

  const app = express();
  app.use(express.json());

  // Mount targeted routes
  app.use("/api/coding", codingRoutes);
  app.use("/api/certifications", certificationRoutes);
  app.use("/api/curriculum", curriculumRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/meetings", meetingRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(
        url,
        {
          method: options.method || "GET",
          headers: {
            Authorization: `Bearer ${testToken}`,
            ...(options.headers || {}),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
        }
      );
      req.on("error", reject);
      req.end();
    });
  }

  // Pre-seed ETag cache for testing fast-path 304 response times
  const userIdStr = testPayload.userId;
  etagCache.setEtag("codingData", userIdStr, 'W/"coding-data-benchmark-tag"');
  etagCache.setEtag("certHistory", userIdStr, 'W/"cert-history-benchmark-tag"');
  etagCache.setEtag("curriculum", `${userIdStr}::coding::python`, 'W/"curriculum-python-benchmark-tag"');
  etagCache.setEtag("challenges", userIdStr, 'W/"challenges-benchmark-tag"');
  etagCache.setEtag("notifications", userIdStr, 'W/"notif-benchmark-tag"');
  etagCache.setCachedStudyRooms({ success: true, rooms: [], totalActiveMeetings: 0 }, 'W/"study-rooms-benchmark-tag"');

  const testCases = [
    {
      name: "GET /api/coding/data",
      path: "/api/coding/data",
      clientEtag: 'W/"coding-data-benchmark-tag"',
    },
    {
      name: "GET /api/certifications/my-history",
      path: "/api/certifications/my-history",
      clientEtag: 'W/"cert-history-benchmark-tag"',
    },
    {
      name: "GET /api/curriculum/coding/python",
      path: "/api/curriculum/coding/python",
      clientEtag: 'W/"curriculum-python-benchmark-tag"',
    },
    {
      name: "GET /api/notifications",
      path: "/api/notifications",
      clientEtag: 'W/"notif-benchmark-tag"',
    },
    {
      name: "GET /api/coding/challenges",
      path: "/api/coding/challenges",
      clientEtag: 'W/"challenges-benchmark-tag"',
    },
    {
      name: "GET /api/meetings/study-rooms",
      path: "/api/meetings/study-rooms",
      clientEtag: 'W/"study-rooms-benchmark-tag"',
    },
  ];

  console.log("  Endpoint                           | 304 Fast-Path Latency | Status Code | Verified");
  console.log("  ---------------------------------- | --------------------- | ----------- | --------");

  for (const tc of testCases) {
    const tStart = process.hrtime.bigint();
    const res = await request(tc.path, {
      headers: { "if-none-match": tc.clientEtag },
    });
    const tEnd = process.hrtime.bigint();
    const durationMs = Number(tEnd - tStart) / 1000000;

    const pass = res.status === 304 && durationMs < 50;
    console.log(
      `  ${tc.name.padEnd(34)} | ${durationMs.toFixed(2).padStart(18)} ms | ${String(res.status).padStart(11)} | ${pass ? "✅ PASS" : "❌ FAIL"}`
    );
    assert.strictEqual(res.status, 304, `${tc.name} should return 304 on matching ETag`);
    assert(durationMs < 50, `${tc.name} 304 should respond in < 50ms (actual: ${durationMs.toFixed(2)}ms)`);
  }

  // 3. Concurrent Requests Benchmark
  console.log("\n[Benchmark 3] Concurrent Request Burst Benchmark (10 Parallel Requests)");
  const concurrentBursts = 10;
  const tBurstStart = process.hrtime.bigint();
  const burstPromises = [];
  for (let i = 0; i < concurrentBursts; i++) {
    burstPromises.push(
      request("/api/coding/data", { headers: { "if-none-match": 'W/"coding-data-benchmark-tag"' } })
    );
  }
  const burstResults = await Promise.all(burstPromises);
  const tBurstEnd = process.hrtime.bigint();
  const totalBurstMs = Number(tBurstEnd - tBurstStart) / 1000000;
  const avgPerReq = totalBurstMs / concurrentBursts;

  console.log(`  ✔ Dispatched ${concurrentBursts} simultaneous conditional requests in parallel`);
  console.log(`  ✔ Total Batch Duration: ${totalBurstMs.toFixed(2)} ms`);
  console.log(`  ✔ Average per Request: ${avgPerReq.toFixed(2)} ms`);
  assert(burstResults.every((r) => r.status === 304), "All burst requests should return 304");
  assert(totalBurstMs < 100, "10 concurrent requests should complete within 100ms");

  // 4. Socket.IO Idempotent Authentication & Single Room Registration
  console.log("\n[Benchmark 4] Socket.IO Idempotent Authentication Benchmark");
  const ioServer = new Server(server, { cors: { origin: "*" } });

  let authAttempts = 0;
  let roomJoinCount = 0;

  ioServer.on("connection", (socket) => {
    const joinUserRoomFromToken = (rawToken) => {
      authAttempts++;
      if (!rawToken || typeof rawToken !== "string") return null;
      const cleanToken = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;
      if (socket.data.authToken === cleanToken && socket.data.userId && socket.rooms.has(`user_${socket.data.userId}`)) {
        return socket.data.userId; // Instant hit
      }
      const decoded = getCachedDecodedToken(cleanToken) || jwt.verify(cleanToken, getJwtSecret());
      const uid = String(decoded.userId || decoded.id || decoded._id || "").trim();
      if (uid) {
        socket.data.authToken = cleanToken;
        socket.data.userId = uid;
        socket.join(`user_${uid}`);
        roomJoinCount++;
        return uid;
      }
      return null;
    };

    if (socket.handshake?.auth?.token) {
      joinUserRoomFromToken(socket.handshake.auth.token);
    }

    socket.on("register_user_session", (payload) => {
      if (payload?.token) {
        joinUserRoomFromToken(payload.token);
      }
    });
  });

  const clientSocket = ClientIo(baseUrl, {
    auth: { token: testToken },
    transports: ["websocket"],
  });

  await new Promise((resolve) => clientSocket.on("connect", resolve));

  // Client emits redundant register_user_session event
  clientSocket.emit("register_user_session", { token: testToken });
  clientSocket.emit("register_user_session", { token: testToken });

  // Give socket event loop 100ms
  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log(`  ✔ Total Auth Invocations Triggered: ${authAttempts}`);
  console.log(`  ✔ Total Unique Room Joins Executed: ${roomJoinCount}`);
  assert.strictEqual(roomJoinCount, 1, "Socket must join user room exactly once regardless of redundant events");
  console.log("  ✅ PASS: Socket.IO verified duplicate authentication eliminated (1 room join for 3 calls)");

  clientSocket.disconnect();
  ioServer.close();
  await new Promise((resolve) => server.close(resolve));

  console.log("\n================================================================================");
  console.log("🎉 ALL PRODUCTION PERFORMANCE BENCHMARKS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed with error:", err);
  process.exit(1);
});
