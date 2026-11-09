/**
 * Mastery Zone — Complete Production Security Regression Suite
 * Tests every critical security area specified in the prompt:
 * 1. Code Execution (Empty code, safety validator, unsupported language, timeouts, Judge0 success, 429, 500, timeout, malformed, prod fail-closed, dev local)
 * 2. Collaborative Coding Room & Chat Security (Unauthenticated rejection, guessing room ID rejection, host role immutability, non-member broadcast prevention, invited collaborator access, cleanup on logout/disconnect, chat anti-spoofing, rate limiting, recipient verification)
 * 3. Genuine Media Audio/Video Integrity (Dual-stream WebM, dual-stream MP4, video-only rejection, audio-only rejection, duration checks, corrupted/truncated rejection, prod fail-closed, orphan file cleanup)
 * 4. Real PDF Parsing via pdf-lib (Genuine certificate, compressed object streams, fake string rejection, renamed text file rejection, truncated/corrupted/empty rejection)
 * 5. Certification Grading & Dual Cutoffs (16 MCQ + 16 Coding)
 * 6. Strict Account Data Isolation (Certificate download, report access)
 */

const assert = require("assert");
const http = require("http");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const ioClient = require("socket.io-client");
const { PDFDocument } = require("pdf-lib");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { getJwtSecret } = require("../config/jwtConfig");
const JWT_SECRET = getJwtSecret();

const {
  executeCode,
  evaluateTestCasesBatch,
  validateCodeSafety,
  isCodeEmptyOrComments,
  isProductionExecutionRestricted,
  executeViaJudge0,
} = require("../services/codeExecutionService");

const {
  calculateCertificationVerdict,
  parseAndValidatePdfStructure,
} = require("../routes/certificationRoutes");

const {
  validateMediaIntegrity,
  inspectMediaBinary,
  probeWithFfprobe,
  verifyFrameDecodability,
} = require("../routes/recordingRoutes");

const { generateCertificatePDF } = require("../utils/certificateGenerator");

const { app, server } = require("../server");
let testServer, baseUrl;

const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
const { execFileSync } = require("child_process");

function createPlayableMedia({ format = "webm", duration = 1, video = true, audio = true } = {}) {
  const ext = format === "mp4" ? "mp4" : "webm";
  const tmpFile = path.join(__dirname, `test_playable_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  const args = ["-y"];

  if (video) {
    args.push("-f", "lavfi", "-i", `testsrc=duration=${duration}:size=320x240:rate=10`);
  }
  if (audio) {
    args.push("-f", "lavfi", "-i", `sine=frequency=1000:duration=${duration}`);
  }

  if (format === "mp4") {
    if (video && audio) {
      args.push("-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac");
    } else if (video) {
      args.push("-c:v", "libx264", "-preset", "ultrafast");
    } else if (audio) {
      args.push("-c:a", "aac");
    }
  } else {
    // webm
    if (video && audio) {
      args.push("-c:v", "libvpx", "-c:a", "libvorbis");
    } else if (video) {
      args.push("-c:v", "libvpx");
    } else if (audio) {
      args.push("-c:a", "libvorbis");
    }
  }

  args.push(tmpFile);
  execFileSync(ffmpegInstaller.path, args, { stdio: "ignore" });
  const buffer = fs.readFileSync(tmpFile);
  return {
    filePath: tmpFile,
    buffer,
    cleanup: () => {
      try { fs.unlinkSync(tmpFile); } catch {}
    },
  };
}

// Fixture helpers for genuine media buffers
function box(type, payload) {
  const len = 8 + payload.length;
  const header = Buffer.alloc(8);
  header.writeUInt32BE(len, 0);
  header.write(type, 4, 4, "ascii");
  return Buffer.concat([header, payload]);
}

function buildDualStreamWebM(opts = {}) {
  const includeVideo = opts.video !== false;
  const includeAudio = opts.audio !== false;

  const ebmlHeader = Buffer.from([
    0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01,
    0x42, 0xf2, 0x81, 0x04, 0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65,
    0x62, 0x6d, 0x42, 0x87, 0x81, 0x04, 0x42, 0x85, 0x81, 0x02,
  ]);
  const segmentHeader = Buffer.from([0x18, 0x53, 0x80, 0x67, 0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
  const segmentInfo = Buffer.from([0x15, 0x49, 0xa9, 0x66, 0x8b, 0x2a, 0xd7, 0xb1, 0x83, 0x0f, 0x42, 0x40]);

  const trackEntries = [];
  if (includeVideo) {
    trackEntries.push(Buffer.from([0xae, 0x8d, 0xd7, 0x81, 0x01, 0x73, 0xc5, 0x81, 0x01, 0x83, 0x81, 0x01, 0x86, 0x85, 0x56, 0x5f, 0x56, 0x50, 0x39]));
  }
  if (includeAudio) {
    trackEntries.push(Buffer.from([0xae, 0x8e, 0xd7, 0x81, 0x02, 0x73, 0xc5, 0x81, 0x02, 0x83, 0x81, 0x02, 0x86, 0x86, 0x41, 0x5f, 0x4f, 0x50, 0x55, 0x53]));
  }
  const tracksPayload = Buffer.concat(trackEntries);
  const tracksHeader = Buffer.from([0x16, 0x54, 0xae, 0x6b, 0x80 | tracksPayload.length]);
  const tracks = Buffer.concat([tracksHeader, tracksPayload]);

  const cluster = Buffer.from([0x1f, 0x43, 0xb6, 0x75, 0x90, 0xe7, 0x81, 0x00, 0xa3, 0x8a, 0x81, 0x00, 0x00, 0x80, 0x01, 0x02, 0x03, 0x04, 0x05]);
  const total = Buffer.concat([ebmlHeader, segmentHeader, segmentInfo, tracks, cluster]);
  return Buffer.concat([total, Buffer.alloc(Math.max(512 - total.length, 32), 0x00)]);
}

function buildMP4(opts = {}) {
  const ftyp = box("ftyp", Buffer.from("mp42\x00\x00\x00\x00isommp42"));
  const tracks = [];
  if (opts.video !== false) {
    const hdlrVideo = box("hdlr", Buffer.concat([Buffer.alloc(8), Buffer.from("vide"), Buffer.alloc(12)]));
    tracks.push(box("trak", box("mdia", hdlrVideo)));
  }
  if (opts.audio !== false) {
    const hdlrAudio = box("hdlr", Buffer.concat([Buffer.alloc(8), Buffer.from("soun"), Buffer.alloc(12)]));
    tracks.push(box("trak", box("mdia", hdlrAudio)));
  }
  const mvhd = box("mvhd", Buffer.concat([Buffer.alloc(12), Buffer.from([0x00, 0x00, 0x03, 0xe8]), Buffer.from([0x00, 0x00, 0x75, 0x30])]));
  const moov = box("moov", Buffer.concat([mvhd, ...tracks]));
  const mdat = box("mdat", Buffer.alloc(256, 0xaa));
  const total = Buffer.concat([ftyp, moov, mdat]);
  return Buffer.concat([total, Buffer.alloc(Math.max(512 - total.length, 32), 0x00)]);
}

let passedTestCount = 0;
let totalTestCount = 0;

function it(name, fn) {
  totalTestCount++;
  return (async () => {
    try {
      await fn();
      passedTestCount++;
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Reason: ${err.message}`);
      throw err;
    }
  })();
}

async function runSuite() {
  console.log("================================================================================");
  console.log("🛡️ Mastery Zone Complete Production Security Regression Verification");
  console.log("================================================================================");

  // Start ephemeral test server
  await new Promise((resolve) => {
    testServer = server.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const User = require("../models/User");
  const Meeting = require("../models/Meeting");
  const CertificationAttempt = require("../models/CertificationAttempt");
  const IssuedCertificate = require("../models/IssuedCertificate");

  // Create two distinct test users
  const userA = await User.findOneAndUpdate(
    { email: "candidate_alice_sec@masteryzone.test" },
    {
      $set: {
        username: "alice_sec",
        fullName: "Alice Security",
        email: "candidate_alice_sec@masteryzone.test",
        role: "user",
        isEmailVerified: true,
      },
    },
    { upsert: true, new: true }
  );

  const userB = await User.findOneAndUpdate(
    { email: "candidate_bob_sec@masteryzone.test" },
    {
      $set: {
        username: "bob_sec",
        fullName: "Bob Security",
        email: "candidate_bob_sec@masteryzone.test",
        role: "user",
        isEmailVerified: true,
      },
    },
    { upsert: true, new: true }
  );

  const tokenA = jwt.sign({ userId: userA._id.toString(), email: userA.email, role: "user" }, JWT_SECRET, { expiresIn: "1h" });
  const tokenB = jwt.sign({ userId: userB._id.toString(), email: userB.email, role: "user" }, JWT_SECRET, { expiresIn: "1h" });

  console.log("\n--- Category 1: Completely Secure Code Execution ---");

  await it("Empty code or comment-only code is safely rejected without invoking sandbox", async () => {
    assert.strictEqual(isCodeEmptyOrComments(""), true);
    assert.strictEqual(isCodeEmptyOrComments("   // just a comment\n/* block */  "), true);
    assert.strictEqual(isCodeEmptyOrComments("# python comment only"), true);
    assert.strictEqual(isCodeEmptyOrComments("print('hello')"), false);

    const batchRes = await evaluateTestCasesBatch("python", "   # comment only\n", [{ input: "1", expectedOutput: "1" }]);
    assert.strictEqual(batchRes[0].passed, false);
    assert(batchRes[0].error.includes("No executable code"));
  });

  await it("validateCodeSafety blocks hazardous system calls in Python, JS, and C/C++", async () => {
    assert.strictEqual(validateCodeSafety("python", "import os; os.system('rm -rf /')").safe, false);
    assert.strictEqual(validateCodeSafety("python", "import subprocess; subprocess.Popen(['ls'])").safe, false);
    assert.strictEqual(validateCodeSafety("javascript", "const { exec } = require('child_process');").safe, false);
    assert.strictEqual(validateCodeSafety("javascript", "import fs from 'fs';").safe, false);
    assert.strictEqual(validateCodeSafety("cpp", "#include <cstdlib>\nint main(){ system('ls'); }").safe, false);
    assert.strictEqual(validateCodeSafety("python", "def add(a, b): return a + b").safe, true);
  });

  await it("executeCode safely handles unsupported languages without crashing", async () => {
    const res = await executeCode({ language: "brainfuck", code: "++[>++<-]" });
    assert.strictEqual(res.exitCode, 1);
    assert(res.error.includes("Unsupported language") || res.error.includes("Security Violation"));
  });

  await it("executeCode handles infinite loops and timeouts without hanging process", async () => {
    const res = await executeCode({
      language: "python",
      code: "while True:\n    pass\n",
      timeoutMs: 1500,
    });
    assert.notStrictEqual(res.exitCode, 0);
    assert(res.error.includes("timed out") || res.error.includes("Process timed out") || res.error.includes("Timeout"));
  });

  await it("executeCode fails closed in production when Judge0 is unconfigured", async () => {
    const prevEnv = process.env.NODE_ENV;
    const prevJudge0 = process.env.JUDGE0_API_HOST;

    try {
      process.env.NODE_ENV = "production";
      delete process.env.JUDGE0_API_HOST;

      const res = await executeCode({
        language: "python",
        code: "print('should not run on host in prod')",
      });
      assert.strictEqual(res.isUnavailable, true);
      assert.strictEqual(res.exitCode, 1);
      assert(res.error.includes("Production execution requires a configured isolated execution environment"));
    } finally {
      process.env.NODE_ENV = prevEnv;
      if (prevJudge0) process.env.JUDGE0_API_HOST = prevJudge0;
    }
  });

  await it("Judge0 real success execution parses stdout and returns exitCode 0", async () => {
    let mockServer;
    await new Promise((resolve) => {
      mockServer = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: { id: 3, description: "Accepted" },
            stdout: Buffer.from("Hello from Judge0 Sandbox\n").toString("base64"),
            stderr: null,
            time: "0.042",
          })
        );
      });
      mockServer.listen(0, resolve);
    });

    const mockPort = mockServer.address().port;
    const prevHost = process.env.JUDGE0_API_HOST;

    try {
      process.env.JUDGE0_API_HOST = `http://127.0.0.1:${mockPort}`;
      const res = await executeCode({
        language: "python",
        code: "print('Hello from Judge0 Sandbox')",
      });
      assert.strictEqual(res.exitCode, 0);
      assert.strictEqual(res.output.trim(), "Hello from Judge0 Sandbox");
      assert.strictEqual(res.engine, "Judge0");
    } finally {
      process.env.JUDGE0_API_HOST = prevHost;
      mockServer.close();
    }
  });

  await it("Judge0 HTTP error / rate limit (429) fails closed cleanly without falling back to host", async () => {
    let mockServer;
    await new Promise((resolve) => {
      mockServer = http.createServer((req, res) => {
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "You have exceeded the rate limit." }));
      });
      mockServer.listen(0, resolve);
    });

    const mockPort = mockServer.address().port;
    const prevHost = process.env.JUDGE0_API_HOST;
    const prevEnv = process.env.NODE_ENV;

    try {
      process.env.JUDGE0_API_HOST = `http://127.0.0.1:${mockPort}`;
      process.env.NODE_ENV = "production";

      const res = await executeCode({
        language: "python",
        code: "print('hello from test')",
      });

      assert.strictEqual(res.isUnavailable, true, "Judge0 429 response must trigger isUnavailable fail-closed");
      assert.strictEqual(res.exitCode, 1);
      assert(res.error.includes("unavailable") || res.error.includes("retry"));
    } finally {
      process.env.JUDGE0_API_HOST = prevHost;
      process.env.NODE_ENV = prevEnv;
      mockServer.close();
    }
  });

  await it("Judge0 HTTP 500 error fails closed cleanly with isUnavailable", async () => {
    let mockServer;
    await new Promise((resolve) => {
      mockServer = http.createServer((req, res) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Internal Judge0 Compiler Error" }));
      });
      mockServer.listen(0, resolve);
    });

    const mockPort = mockServer.address().port;
    const prevHost = process.env.JUDGE0_API_HOST;
    const prevEnv = process.env.NODE_ENV;

    try {
      process.env.JUDGE0_API_HOST = `http://127.0.0.1:${mockPort}`;
      process.env.NODE_ENV = "production";

      const res = await executeCode({
        language: "python",
        code: "print('hello from 500 test')",
      });

      assert.strictEqual(res.isUnavailable, true);
      assert.strictEqual(res.exitCode, 1);
    } finally {
      process.env.JUDGE0_API_HOST = prevHost;
      process.env.NODE_ENV = prevEnv;
      mockServer.close();
    }
  });

  await it("Judge0 malformed response or missing status fails closed cleanly", async () => {
    let mockServer;
    await new Promise((resolve) => {
      mockServer = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ broken: "missing status property" }));
      });
      mockServer.listen(0, resolve);
    });

    const mockPort = mockServer.address().port;
    const prevHost = process.env.JUDGE0_API_HOST;
    const prevEnv = process.env.NODE_ENV;

    try {
      process.env.JUDGE0_API_HOST = `http://127.0.0.1:${mockPort}`;
      process.env.NODE_ENV = "production";

      const res = await executeCode({
        language: "python",
        code: "print('hello from malformed test')",
      });

      assert.strictEqual(res.isUnavailable, true);
      assert.strictEqual(res.exitCode, 1);
    } finally {
      process.env.JUDGE0_API_HOST = prevHost;
      process.env.NODE_ENV = prevEnv;
      mockServer.close();
    }
  });

  await it("Development-only local execution executes safe code cleanly when not in production", async () => {
    const prevEnv = process.env.NODE_ENV;
    const prevHost = process.env.JUDGE0_API_HOST;

    try {
      process.env.NODE_ENV = "test";
      delete process.env.JUDGE0_API_HOST;

      const res = await executeCode({
        language: "python",
        code: "print('local_dev_execution_ok')",
      });
      assert.strictEqual(res.exitCode, 0);
      assert(res.output.includes("local_dev_execution_ok"));
    } finally {
      process.env.NODE_ENV = prevEnv;
      if (prevHost) process.env.JUDGE0_API_HOST = prevHost;
    }
  });

  console.log("\n--- Category 2: Collaborative Socket & Chat Security ---");

  await it("Coding Room: Unauthenticated socket is rejected with coding_room_error", async () => {
    const client = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => client.on("connect", res));

    let errorMessage = null;
    client.on("coding_room_error", (data) => {
      errorMessage = data.message;
    });

    client.emit("join_coding_room", {
      roomId: "protected_room_101",
    });

    await new Promise((r) => setTimeout(r, 200));
    assert(errorMessage && errorMessage.includes("Authentication required"), "Expected authentication requirement error");
    client.disconnect();
  });

  await it("Coding Room: Room creation is authorized; room guessing and squatting are strictly rejected", async () => {
    // 1. User B attempts to join a non-existent room by guessing an uncreated roomId
    const clientB = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientB.on("connect", res));

    let nonExistentError = null;
    clientB.on("coding_room_error", (data) => {
      nonExistentError = data.message;
    });

    clientB.emit("join_coding_room", {
      roomId: "uncreated_guessed_room_xyz",
      token: tokenB,
    });
    await new Promise((r) => setTimeout(r, 200));
    assert(
      nonExistentError && nonExistentError.includes("does not exist"),
      "Joining an uncreated room must fail; arbitrary room creation via join is disallowed"
    );

    // 2. User A explicitly creates a private coding room
    const clientA = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientA.on("connect", res));

    let aCreatedState = null;
    clientA.on("coding_room_created", (data) => {
      aCreatedState = data;
    });

    clientA.emit("create_coding_room", {
      roomId: "private_room_guessing_test",
      token: tokenA,
      language: "python",
      initialCode: "# Initial Authoritative Code",
    });
    await new Promise((r) => setTimeout(r, 200));
    assert(aCreatedState && aCreatedState.roomId === "private_room_guessing_test", "Host must receive room created confirmation");

    // 3. User B attempts to squat/overwrite User A's created room
    let squatError = null;
    clientB.on("coding_room_error", (data) => {
      squatError = data.message;
    });
    clientB.emit("create_coding_room", {
      roomId: "private_room_guessing_test",
      token: tokenB,
    });
    await new Promise((r) => setTimeout(r, 200));
    assert(squatError && squatError.includes("already exists"), "User cannot overwrite or squat an existing room");

    // 4. User B attempts to join User A's private room without invitation
    let joinDeniedError = null;
    clientB.on("coding_room_error", (data) => {
      joinDeniedError = data.message;
    });
    clientB.emit("join_coding_room", {
      roomId: "private_room_guessing_test",
      token: tokenB,
    });
    await new Promise((r) => setTimeout(r, 200));
    assert(joinDeniedError && joinDeniedError.includes("not authorized"), "Uninvited user must be rejected with Access denied");

    clientA.disconnect();
    clientB.disconnect();
  });

  await it("Coding Room: Participant cannot impersonate the host (host role immutability)", async () => {
    // User A creates room as host
    const clientA = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientA.on("connect", res));
    clientA.emit("create_coding_room", { roomId: "room_host_immutability", token: tokenA });
    await new Promise((r) => setTimeout(r, 150));

    // User A invites User B via invite_coding_participant
    clientA.emit("invite_coding_participant", {
      roomId: "room_host_immutability",
      targetUserId: userB._id.toString(),
      targetEmail: userB.email,
    });
    await new Promise((r) => setTimeout(r, 150));

    // User B joins with claim of being Host
    const clientB = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientB.on("connect", res));

    let stateReceived = null;
    clientB.on("coding_room_state", (state) => {
      stateReceived = state;
    });

    clientB.emit("join_coding_room", {
      roomId: "room_host_immutability",
      token: tokenB,
      role: "Host", // Attempted client-side privilege escalation
    });

    await new Promise((r) => setTimeout(r, 200));
    assert(stateReceived, "User B must receive room state");

    const pB = stateReceived.participants.find((p) => p.userId === userB._id.toString());
    assert(pB, "User B must be in participant list");
    assert.strictEqual(pB.role, "Collaborator", "User B's role must be Collaborator, NEVER Host");

    const pA = stateReceived.participants.find((p) => p.userId === userA._id.toString());
    assert(pA && pA.role === "Host", "User A must remain Host");

    clientA.disconnect();
    clientB.disconnect();
  });

  await it("Coding Room: Non-member cannot broadcast code_change or cursor_move into room", async () => {
    // User A creates room_broadcast_prot
    const clientA = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientA.on("connect", res));
    clientA.emit("create_coding_room", { roomId: "room_broadcast_prot", token: tokenA });
    await new Promise((r) => setTimeout(r, 150));

    let receivedUpdate = null;
    clientA.on("code_update", (data) => {
      receivedUpdate = data;
    });

    // Client B connects WITHOUT authorization and tries to emit code_change
    const clientB = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientB.on("connect", res));
    clientB.emit("code_change", {
      roomId: "room_broadcast_prot",
      code: "ATTACKER_INJECTED_CODE",
      language: "python",
    });

    await new Promise((r) => setTimeout(r, 250));
    assert.strictEqual(receivedUpdate, null, "Client A must NEVER receive code_update from non-member socket");

    clientA.disconnect();
    clientB.disconnect();
  });

  await it("Coding Room: Valid invited participant can join and collaborate", async () => {
    const clientA = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientA.on("connect", res));
    clientA.emit("create_coding_room", { roomId: "room_valid_collab", token: tokenA });
    await new Promise((r) => setTimeout(r, 100));

    // User A explicitly invites User B
    clientA.emit("invite_coding_participant", {
      roomId: "room_valid_collab",
      targetUserId: userB._id.toString(),
      targetEmail: userB.email,
    });
    await new Promise((r) => setTimeout(r, 100));

    // User B joins successfully
    const clientB = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientB.on("connect", res));

    let bJoined = false;
    clientB.on("coding_room_state", () => {
      bJoined = true;
    });

    clientB.emit("join_coding_room", {
      roomId: "room_valid_collab",
      token: tokenB,
    });

    await new Promise((r) => setTimeout(r, 200));
    assert.strictEqual(bJoined, true, "Invited collaborator must be granted room entry");

    clientA.disconnect();
    clientB.disconnect();
  });

  await it("Coding Room: Meeting-linked authorization enables active meeting participants to collaborate while rejecting outsiders", async () => {
    const meetingId = `mtg_linked_collab_${Date.now()}`;
    await Meeting.create({
      meetingId,
      title: "Meeting Linked Collab Test",
      hostUserId: String(userA._id),
      hostName: userA.fullName,
      status: "active",
      participants: [
        { userId: String(userA._id), name: userA.fullName },
        { userId: String(userB._id), name: userB.fullName },
      ],
    });

    // 1. Host User A joins meeting coding room
    const clientA = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientA.on("connect", res));
    clientA.emit("join_coding_room", { roomId: meetingId, token: tokenA });
    await new Promise((r) => setTimeout(r, 150));

    // 2. Authorized meeting participant User B joins meeting coding room
    const clientB = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientB.on("connect", res));
    let bState = null;
    clientB.on("coding_room_state", (state) => {
      bState = state;
    });
    clientB.emit("join_coding_room", { roomId: meetingId, token: tokenB });
    await new Promise((r) => setTimeout(r, 200));
    assert(bState, "Meeting participant User B must successfully join meeting coding room");

    // 3. Outsider User C (unauthorized) tries to join meeting coding room
    const unauthedToken = jwt.sign(
      { userId: new mongoose.Types.ObjectId().toString(), email: "outsider@test.com", role: "user" },
      JWT_SECRET
    );
    const clientC = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientC.on("connect", res));
    let cError = null;
    clientC.on("coding_room_error", (data) => {
      cError = data.message;
    });
    clientC.emit("join_coding_room", { roomId: meetingId, token: unauthedToken });
    await new Promise((r) => setTimeout(r, 200));
    assert(cError && cError.includes("not authorized"), "Outsider not in meeting must be rejected with Access denied");

    clientA.disconnect();
    clientB.disconnect();
    clientC.disconnect();
  });

  await it("Coding Room: Rate limiting prevents rapid chat spamming in collaborative room", async () => {
    const clientA = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientA.on("connect", res));
    clientA.emit("create_coding_room", { roomId: "room_rate_limit_test", token: tokenA });
    await new Promise((r) => setTimeout(r, 150));

    let errorReceived = null;
    clientA.on("coding_room_error", (data) => {
      errorReceived = data.message;
    });

    // Send 7 messages in rapid succession (limit is 5)
    for (let i = 0; i < 7; i++) {
      clientA.emit("coding_chat_message", {
        roomId: "room_rate_limit_test",
        text: `Spam attempt ${i}`,
      });
    }

    await new Promise((r) => setTimeout(r, 200));
    assert(errorReceived && errorReceived.includes("too quickly"), "Burst of chat messages must trigger rate limit warning");
    clientA.disconnect();
  });

  await it("Coding Room: Logout and disconnect remove access and update participants correctly", async () => {
    const clientA = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientA.on("connect", res));
    clientA.emit("create_coding_room", { roomId: "room_cleanup_test", token: tokenA });
    await new Promise((r) => setTimeout(r, 100));

    clientA.emit("invite_coding_participant", {
      roomId: "room_cleanup_test",
      targetUserId: userB._id.toString(),
    });
    await new Promise((r) => setTimeout(r, 100));

    const clientB = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientB.on("connect", res));
    clientB.emit("join_coding_room", { roomId: "room_cleanup_test", token: tokenB });
    await new Promise((r) => setTimeout(r, 150));

    let participantListAfterLogout = null;
    clientA.on("coding_room_participants", (list) => {
      participantListAfterLogout = list;
    });

    // Client B logs out
    clientB.emit("logout_user_session");
    await new Promise((r) => setTimeout(r, 200));

    assert(participantListAfterLogout, "Host must receive updated participant list after participant logout");
    const foundB = participantListAfterLogout.find((p) => p.userId === userB._id.toString());
    assert.strictEqual(foundB, undefined, "User B must no longer be present in room after logout");

    clientA.disconnect();
    clientB.disconnect();
  });

  await it("Global Chat: Unauthenticated socket cannot spoof identity; receives chat_error", async () => {
    const unauthedClient = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => unauthedClient.on("connect", res));

    let chatError = null;
    unauthedClient.on("chat_error", (data) => {
      chatError = data.message;
    });

    unauthedClient.emit("send_global_message", {
      user: "System Administrator",
      text: "Malicious Announcement",
    });

    await new Promise((r) => setTimeout(r, 200));
    assert(chatError && chatError.includes("Authenticated session required"), "Expected unauthenticated chat rejection");
    unauthedClient.disconnect();
  });

  await it("Chat: user_joined without authentication is rejected and denied entry", async () => {
    const unauthedClient = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => unauthedClient.on("connect", res));

    let chatError = null;
    unauthedClient.on("chat_error", (data) => {
      chatError = data.message;
    });

    unauthedClient.emit("user_joined", "impostor_admin");
    await new Promise((r) => setTimeout(r, 200));

    assert(chatError && chatError.includes("Authentication required"), "Unauthenticated user_joined must be rejected");
    unauthedClient.disconnect();
  });

  await it("Coding Room: Client-supplied guest fallback without JWT is strictly rejected", async () => {
    const guestClient = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => guestClient.on("connect", res));

    let codingError = null;
    guestClient.on("coding_room_error", (data) => {
      codingError = data.message;
    });

    guestClient.emit("join_coding_room", {
      roomId: "room_bypass_attempt",
      user: { fullName: "guest_hacker", email: "guest_hacker@masteryzone.com" },
    });

    await new Promise((r) => setTimeout(r, 200));
    assert(codingError && codingError.includes("Authentication required"), "Guest fallback without valid JWT must be rejected");
    guestClient.disconnect();
  });

  await it("Direct Messaging: send_dm rejects non-existent recipient", async () => {
    const clientA = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientA.on("connect", res));
    clientA.emit("register_user_session", { token: tokenA });
    await new Promise((r) => setTimeout(r, 100));

    let chatError = null;
    clientA.on("chat_error", (data) => {
      chatError = data.message;
    });

    clientA.emit("send_dm", { toUser: "non_existent_user_99999", roomCode: "room123" });
    await new Promise((r) => setTimeout(r, 200));

    assert(chatError && chatError.includes("Recipient user not found"), "DM to non-existent user must return Recipient user not found");
    clientA.disconnect();
  });

  await it("Chat: Rapid message burst exceeds rate limit and triggers warning", async () => {
    const clientA = ioClient(baseUrl, { transports: ["websocket"] });
    await new Promise((res) => clientA.on("connect", res));
    clientA.emit("register_user_session", { token: tokenA });
    await new Promise((r) => setTimeout(r, 100));

    let rateLimitHit = false;
    clientA.on("chat_error", (data) => {
      if (data.message && data.message.includes("Rate limit exceeded")) {
        rateLimitHit = true;
      }
    });

    for (let i = 0; i < 12; i++) {
      clientA.emit("send_global_message", { text: `Burst message ${i}` });
    }

    await new Promise((r) => setTimeout(r, 250));
    assert.strictEqual(rateLimitHit, true, "Rapid burst of 12 messages must trigger chat rate limit");
    clientA.disconnect();
  });

  console.log("\n--- Category 3: Genuine Recording Audio/Video Integrity ---");

  await it("Media: Genuine playable WebM generated via ffmpeg passes probeWithFfprobe, verifyFrameDecodability, and validateMediaIntegrity", async () => {
    const media = createPlayableMedia({ format: "webm", duration: 1, video: true, audio: true });
    try {
      const probeRes = await probeWithFfprobe(media.filePath);
      assert(probeRes && Array.isArray(probeRes.streams), "FFprobe must return streams for genuine WebM");
      const hasV = probeRes.streams.some((s) => s.codec_type === "video");
      const hasA = probeRes.streams.some((s) => s.codec_type === "audio");
      assert.strictEqual(hasV, true, "Playable WebM must have video stream");
      assert.strictEqual(hasA, true, "Playable WebM must have audio stream");

      const frameRes = await verifyFrameDecodability(media.filePath);
      assert(frameRes && frameRes.valid, "Frame decodability must succeed on playable WebM");

      const integRes = await validateMediaIntegrity(media.filePath, media.buffer, 1);
      assert.strictEqual(integRes.valid, true, "validateMediaIntegrity must pass for genuine playable WebM");
      assert.strictEqual(integRes.hasVideo, true);
      assert.strictEqual(integRes.hasAudio, true);
    } finally {
      media.cleanup();
    }
  });

  await it("Media: Genuine playable MP4 generated via ffmpeg passes probeWithFfprobe, verifyFrameDecodability, and validateMediaIntegrity", async () => {
    const media = createPlayableMedia({ format: "mp4", duration: 1, video: true, audio: true });
    try {
      const probeRes = await probeWithFfprobe(media.filePath);
      assert(probeRes && Array.isArray(probeRes.streams), "FFprobe must return streams for genuine MP4");
      const hasV = probeRes.streams.some((s) => s.codec_type === "video");
      const hasA = probeRes.streams.some((s) => s.codec_type === "audio");
      assert.strictEqual(hasV, true, "Playable MP4 must have video stream");
      assert.strictEqual(hasA, true, "Playable MP4 must have audio stream");

      const frameRes = await verifyFrameDecodability(media.filePath);
      assert(frameRes && frameRes.valid, "Frame decodability must succeed on playable MP4");

      const integRes = await validateMediaIntegrity(media.filePath, media.buffer, 1);
      assert.strictEqual(integRes.valid, true, "validateMediaIntegrity must pass for genuine playable MP4");
    } finally {
      media.cleanup();
    }
  });

  await it("Media: Genuine playable WebM upload succeeds via POST /api/recordings/upload and creates database record", async () => {
    const meetingId = `mtg_playable_upload_${Date.now()}`;
    await Meeting.create({
      meetingId,
      title: "Playable WebM Upload Meeting",
      hostUserId: String(userA._id),
      hostName: userA.fullName,
      status: "active",
      participants: [{ userId: String(userA._id), name: userA.fullName }],
    });

    const media = createPlayableMedia({ format: "webm", duration: 1, video: true, audio: true });
    try {
      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          meetingId,
          title: "Playable Upload Verification",
          durationSeconds: 1,
          base64Data: `data:video/webm;base64,${media.buffer.toString("base64")}`,
        }),
      });

      assert.strictEqual(res.status, 201, "Valid playable recording upload must return 201 Created");
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert(json.recording && json.recording.recordingId, "Recording record must be returned");

      const Recording = require("../models/Recording");
      const saved = await Recording.findOne({ recordingId: json.recording.recordingId }).lean();
      assert(saved, "Recording must be persisted in database");
      assert.strictEqual(String(saved.hostUserId), String(userA._id));
      assert.strictEqual(saved.status, "ready");
      assert(saved.durationSeconds > 0, "Saved duration must be positive");
      const expectedDiskFile = path.join(__dirname, "../uploads/recordings", `${json.recording.recordingId}.webm`);
      assert(fs.existsSync(expectedDiskFile), "Saved video file must exist on disk");
    } finally {
      media.cleanup();
    }
  });

  await it("Media: Video-only genuine media upload fails with missing audio stream (400)", async () => {
    const meetingId = `mtg_video_only_${Date.now()}`;
    await Meeting.create({
      meetingId,
      title: "Video Only Meeting",
      hostUserId: String(userA._id),
      hostName: userA.fullName,
      status: "active",
      participants: [{ userId: String(userA._id), name: userA.fullName }],
    });

    const media = createPlayableMedia({ format: "webm", duration: 1, video: true, audio: false });
    try {
      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          meetingId,
          title: "Video-Only Attempt",
          durationSeconds: 1,
          base64Data: `data:video/webm;base64,${media.buffer.toString("base64")}`,
        }),
      });

      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert(json.error && json.error.includes("missing required audio stream"), "Must reject video-only recording with missing audio error");
    } finally {
      media.cleanup();
    }
  });

  await it("Media: Audio-only genuine media upload fails with missing video stream (400)", async () => {
    const meetingId = `mtg_audio_only_${Date.now()}`;
    await Meeting.create({
      meetingId,
      title: "Audio Only Meeting",
      hostUserId: String(userA._id),
      hostName: userA.fullName,
      status: "active",
      participants: [{ userId: String(userA._id), name: userA.fullName }],
    });

    const media = createPlayableMedia({ format: "webm", duration: 1, video: false, audio: true });
    try {
      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          meetingId,
          title: "Audio-Only Attempt",
          durationSeconds: 1,
          base64Data: `data:video/webm;base64,${media.buffer.toString("base64")}`,
        }),
      });

      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert(json.error && json.error.includes("missing required video stream"), "Must reject audio-only recording with missing video error");
    } finally {
      media.cleanup();
    }
  });

  await it("Media: Missing, zero, and negative duration values are rejected", async () => {
    const dualWebm = buildDualStreamWebM();
    assert.strictEqual(inspectMediaBinary(dualWebm, 0).valid, false);
    assert.strictEqual(inspectMediaBinary(dualWebm, -15).valid, false);
    assert.strictEqual(inspectMediaBinary(dualWebm, "not_a_number").valid, false);
  });

  await it("Media: Corrupted container buffers are rejected", async () => {
    const corruptedBuffer = Buffer.from("CORRUPTED_CONTAINER_DATA".repeat(40));
    const res = inspectMediaBinary(corruptedBuffer, 60);
    assert.strictEqual(res.valid, false);
    assert(res.error.includes("Unrecognized or corrupted"));
  });

  await it("Media: Truncated media buffers (< 500 bytes) are rejected", async () => {
    const truncatedBuffer = Buffer.alloc(300, 0x00);
    const res = inspectMediaBinary(truncatedBuffer, 60);
    assert.strictEqual(res.valid, false);
    assert(res.error.includes("too small"));
  });

  await it("Media: Production mode fail-closed when FFprobe is unavailable", async () => {
    const prevEnv = process.env.NODE_ENV;
    const prevProbe = process.env.FFPROBE_PATH;
    try {
      process.env.NODE_ENV = "production";
      process.env.FFPROBE_PATH = "/bin/nonexistent_ffprobe_binary_path";
      const tmpFile = path.join(__dirname, `prod_probe_test_${Date.now()}.webm`);
      fs.writeFileSync(tmpFile, buildDualStreamWebM());
      const res = await validateMediaIntegrity(tmpFile, buildDualStreamWebM(), 60);
      assert.strictEqual(res.valid, false);
      assert(
        res.error.includes("Production media validation requires FFprobe") ||
        res.error.includes("unavailable") ||
        res.error.includes("disabled in production"),
        "Must fail closed in production when ffprobe is missing"
      );
      try { fs.unlinkSync(tmpFile); } catch {}
    } finally {
      process.env.NODE_ENV = prevEnv;
      if (prevProbe) process.env.FFPROBE_PATH = prevProbe;
      else delete process.env.FFPROBE_PATH;
    }
  });

  await it("Media: Failed recording upload cleans up temporary file immediately from disk (zero orphaned files)", async () => {
    const recDir = path.join(__dirname, "../uploads/recordings");
    const countBefore = fs.existsSync(recDir) ? fs.readdirSync(recDir).length : 0;

    const cleanupMeetingId = `mtg_failed_cleanup_${Date.now()}`;
    await Meeting.create({
      meetingId: cleanupMeetingId,
      title: "Test Meeting Cleanup",
      hostUserId: String(userA._id),
      hostName: userA.fullName,
      status: "active",
      participants: [{ userId: String(userA._id), name: userA.fullName }],
    });

    const res = await fetch(`${baseUrl}/api/recordings/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        meetingId: cleanupMeetingId,
        title: "Failed Recording Attempt",
        durationSeconds: 60,
        base64Data: `data:video/webm;base64,${buildDualStreamWebM({ audio: false }).toString("base64")}`, // Missing audio!
      }),
    });

    assert.strictEqual(res.status, 400);
    const countAfter = fs.existsSync(recDir) ? fs.readdirSync(recDir).length : 0;
    assert.strictEqual(countAfter, countBefore, "Failed upload must never leave an orphaned file on disk");
  });

  console.log("\n--- Category 4: Structural PDF Parser via pdf-lib ---");

  await it("PDF Parser: Genuine PDF generated by certificate generator passes parseAndValidatePdfStructure", async () => {
    const certResult = await generateCertificatePDF({
      certificateId: `MZ-TEST-PARSER-${Date.now()}`,
      userId: userA._id,
      recipientName: "Alice Security",
      certificationTitle: "Advanced Data Structures & Algorithms",
      issueDate: new Date(),
    });

    assert(fs.existsSync(certResult.filePath), "Generated certificate file must exist on disk");
    const isValid = await parseAndValidatePdfStructure(certResult.filePath);
    assert.strictEqual(isValid, true, "Genuinely generated PDF must pass structural parsing");

    try { fs.unlinkSync(certResult.filePath); } catch {}
    if (certResult.flatFilePath && fs.existsSync(certResult.flatFilePath)) {
      try { fs.unlinkSync(certResult.flatFilePath); } catch {}
    }
  });

  await it("PDF Parser: Valid PDF containing compressed object streams passes parseAndValidatePdfStructure", async () => {
    const tmpObjStm = path.join(__dirname, `compressed_objstm_${Date.now()}.pdf`);
    const doc = await PDFDocument.create();
    doc.addPage([600, 400]);
    const bytes = await doc.save({ useObjectStreams: true });
    fs.writeFileSync(tmpObjStm, Buffer.from(bytes));

    try {
      const isValid = await parseAndValidatePdfStructure(tmpObjStm);
      assert.strictEqual(isValid, true, "PDF with compressed object streams must pass parser");
    } finally {
      try { fs.unlinkSync(tmpObjStm); } catch {}
    }
  });

  await it("PDF Parser: Superficial fake string PDF with %PDF- and fake xref is rejected by real parser", async () => {
    const tmpFakePdf = path.join(__dirname, "fake_string_test.pdf");
    try {
      const fakeContent = "%PDF-1.4\n/Type /Catalog\n/Type /Pages /Count 1\n/Type /Page\nstream\nfake\nendstream\nxref\n%%EOF\n" + "Z".repeat(600);
      fs.writeFileSync(tmpFakePdf, fakeContent, "utf8");

      const isValid = await parseAndValidatePdfStructure(tmpFakePdf);
      assert.strictEqual(isValid, false, "Fake string-only PDF must be rejected by real parser");
    } finally {
      try { fs.unlinkSync(tmpFakePdf); } catch {}
    }
  });

  await it("PDF Parser: Plain text file renamed to .pdf is rejected by real parser", async () => {
    const tmpTxt = path.join(__dirname, "renamed_text.pdf");
    try {
      fs.writeFileSync(tmpTxt, "This is just a plain text document pretending to be a PDF.\n".repeat(25), "utf8");
      const isValid = await parseAndValidatePdfStructure(tmpTxt);
      assert.strictEqual(isValid, false, "Renamed plain text file must be rejected by parser");
    } finally {
      try { fs.unlinkSync(tmpTxt); } catch {}
    }
  });

  await it("PDF Parser: Truncated PDF is rejected by real parser", async () => {
    const tmpTruncated = path.join(__dirname, "truncated_test.pdf");
    try {
      fs.writeFileSync(tmpTruncated, "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\n", "utf8");
      const isValid = await parseAndValidatePdfStructure(tmpTruncated);
      assert.strictEqual(isValid, false, "Truncated PDF must be rejected");
    } finally {
      try { fs.unlinkSync(tmpTruncated); } catch {}
    }
  });

  await it("PDF Parser: Corrupted PDF bytes are rejected by real parser", async () => {
    const tmpCorrupted = path.join(__dirname, "corrupted_test.pdf");
    try {
      fs.writeFileSync(tmpCorrupted, Buffer.from("MALFORMED_BINARY_GARBAGE_PAYLOAD".repeat(30)));
      const isValid = await parseAndValidatePdfStructure(tmpCorrupted);
      assert.strictEqual(isValid, false, "Corrupted binary PDF must be rejected");
    } finally {
      try { fs.unlinkSync(tmpCorrupted); } catch {}
    }
  });

  await it("PDF Parser: Empty PDF file is rejected by real parser", async () => {
    const tmpEmpty = path.join(__dirname, "empty_test.pdf");
    try {
      fs.writeFileSync(tmpEmpty, "");
      const isValid = await parseAndValidatePdfStructure(tmpEmpty);
      assert.strictEqual(isValid, false, "Empty PDF file must be rejected");
    } finally {
      try { fs.unlinkSync(tmpEmpty); } catch {}
    }
  });

  console.log("\n--- Category 5: Certification Grading & Dual Cutoffs ---");

  await it("Certification: Dual cutoffs strictly enforced (16 MCQ + 16 Coding) even if total >= 32", async () => {
    const mockAttempt = {
      selectedMcqs: Array.from({ length: 20 }, (_, i) => ({ id: `q${i}`, correctAnswer: 0 })),
      mcqAnswers: new Map(Array.from({ length: 20 }, (_, i) => [`q${i}`, 0])),
      selectedCodingQuestions: [{ questionId: "c1" }, { questionId: "c2" }],
      codingSubmissions: [
        { questionId: "c1", solved: false, passedTests: 10, totalTests: 10 },
        { questionId: "c2", solved: false, passedTests: 0, totalTests: 10 },
      ],
    };

    const verdict = calculateCertificationVerdict(mockAttempt);
    assert.strictEqual(verdict.mcqScore, 20);
    assert.strictEqual(verdict.mcqPassed, true);
    assert.strictEqual(verdict.passedCodingTests, 10);
    assert.strictEqual(verdict.codingPassed, false);
    assert.strictEqual(verdict.passed, false, "Candidate MUST fail because coding marks < 16");
    assert.strictEqual(verdict.finalVerdict, "FAILED");
  });

  await it("Certification: Passing attempt with both cutoffs satisfied produces PASSED verdict", async () => {
    const mockAttempt = {
      selectedMcqs: Array.from({ length: 20 }, (_, i) => ({ id: `q${i}`, correctAnswer: 0 })),
      mcqAnswers: new Map(Array.from({ length: 18 }, (_, i) => [`q${i}`, 0])),
      selectedCodingQuestions: [{ questionId: "c1" }, { questionId: "c2" }],
      codingSubmissions: [
        { questionId: "c1", solved: true, passedTests: 10, totalTests: 10 },
        { questionId: "c2", solved: false, passedTests: 8, totalTests: 10 },
      ],
    };

    const verdict = calculateCertificationVerdict(mockAttempt);
    assert.strictEqual(verdict.mcqScore, 18);
    assert.strictEqual(verdict.mcqPassed, true);
    assert.strictEqual(verdict.passedCodingTests, 18);
    assert.strictEqual(verdict.codingPassed, true);
    assert.strictEqual(verdict.passed, true);
    assert.strictEqual(verdict.finalVerdict, "PASSED");
  });

  console.log("\n--- Category 6: Strict Account Data Isolation ---");

  await it("User B cannot access or download User A's certificate (403 Forbidden)", async () => {
    const certId = `MZ-CERT-TEST-${Date.now()}`;
    await IssuedCertificate.create({
      certificateId: certId,
      attemptId: `att_${Date.now()}`,
      userId: userA._id,
      recipientName: userA.fullName,
      recipientEmail: userA.email,
      certificationId: "cert_dsa",
      certificationTitle: "DSA Master",
      mcqScore: 18,
      mcqScorePercentage: 90,
      verificationUrl: `https://masteryzone.com/verify/${certId}`,
      status: "VALID",
    });

    const resB = await fetch(`${baseUrl}/api/certifications/download/${certId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(resB.status, 403, "Cross-user certificate download must return 403 Forbidden");

    const resUnauth = await fetch(`${baseUrl}/api/certifications/download/${certId}`);
    assert.strictEqual(resUnauth.status, 401, "Unauthenticated certificate download must return 401 Unauthorized");
  });

  await it("User B cannot view User A's certification assessment report (403 Forbidden)", async () => {
    const attemptId = `att_iso_sec_${Date.now()}`;
    await CertificationAttempt.create({
      userId: userA._id,
      attemptId,
      certId: "cert_dsa",
      certTitle: "DSA Certification",
      status: "PASSED",
      score: 95,
      finalVerdict: "PASSED",
      startTime: new Date(),
      selectedMcqs: [{ id: "q1", question: "Binary search?", answer: "O(log n)", correctAnswer: 0 }],
      codingSubmissions: [{ questionId: "c1", solved: true, passedTests: 10, totalTests: 10 }],
    });

    const resB = await fetch(`${baseUrl}/api/certifications/attempt/${attemptId}/report`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(resB.status, 403, "User B must receive 403 Forbidden when viewing User A's report");
  });

  await it("User B cannot inject notifications into User A's inbox or read User A's notifications", async () => {
    // User B attempts to inject a notification into User A's inbox via body.userId
    const resInject = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        userId: String(userA._id), // Injected target
        title: "Malicious Injection",
        message: "Phishing Attempt",
        type: "system",
      }),
    });

    assert.strictEqual(resInject.status, 201);
    const updatedUserA = await User.findById(userA._id).lean();
    const foundInA = (updatedUserA.notifications || []).some(
      (n) => n.title === "Malicious Injection"
    );
    assert.strictEqual(foundInA, false, "Injected notification must NEVER be stored in User A's inbox");

    // User A reads their own notifications
    const resA = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(resA.status, 200);
    const dataA = await resA.json();
    assert(Array.isArray(dataA.notifications));
    const leaked = dataA.notifications.some((n) => n.title === "Malicious Injection");
    assert.strictEqual(leaked, false, "User A's notifications must never contain User B's injected alert");
  });

  console.log("\n--- Category 7: Compiler Normalization & Large Recording Payload Support ---");

  await it("Compiler: HTML and CSS executions return web preview without throwing unsupported language error", async () => {
    const htmlRes = await executeCode({
      language: "html",
      code: "<h1>Mastery Zone</h1>",
    });
    assert.strictEqual(htmlRes.exitCode, 0);
    assert.strictEqual(htmlRes.engine, "Frontend Web Preview");
    assert.strictEqual(htmlRes.output, "<h1>Mastery Zone</h1>");

    const cssRes = await executeCode({
      language: "css",
      code: "body { background: #000; }",
    });
    assert.strictEqual(cssRes.exitCode, 0);
    assert.strictEqual(cssRes.engine, "Frontend Web Preview");
  });

  await it("Compiler: Java public class Solution is normalized for Judge0 compilation", async () => {
    let capturedBody = null;
    const mockJudge0 = http.createServer((req, res) => {
      let b = "";
      req.on("data", (c) => (b += c));
      req.on("end", () => {
        capturedBody = JSON.parse(b);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: { id: 3, description: "Accepted" },
            stdout: Buffer.from("Normalized Java Execution Success\n").toString("base64"),
            time: "0.08",
          })
        );
      });
    });

    const mockPort = 8993;
    await new Promise((r) => mockJudge0.listen(mockPort, r));
    const origHost = process.env.JUDGE0_API_HOST;
    process.env.JUDGE0_API_HOST = `http://127.0.0.1:${mockPort}`;

    try {
      const codeWithSolution = "public class Solution { public static void main(String[] args) { System.out.println(42); } }";
      const result = await executeViaJudge0("java", codeWithSolution, "");
      assert.strictEqual(result.exitCode, 0);
      assert(capturedBody && capturedBody.source_code, "Must send submission to Judge0");
      const decodedSource = Buffer.from(capturedBody.source_code, "base64").toString("utf8");
      assert(
        decodedSource.includes("public class Main"),
        `Java source class must be normalized to Main for Judge0, got: ${decodedSource}`
      );
    } finally {
      process.env.JUDGE0_API_HOST = origHost;
      mockJudge0.close();
    }
  });

  await it("Compiler: Java Solution class without main() is wrapped with reflection test harness for Judge0", async () => {
    let capturedBody = null;
    const mockJudge0 = http.createServer((req, res) => {
      let b = "";
      req.on("data", (c) => (b += c));
      req.on("end", () => {
        capturedBody = JSON.parse(b);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: { id: 3, description: "Accepted" },
            stdout: Buffer.from("42\n").toString("base64"),
            time: "0.05",
          })
        );
      });
    });

    const mockPort = 8994;
    await new Promise((r) => mockJudge0.listen(mockPort, r));
    const origHost = process.env.JUDGE0_API_HOST;
    process.env.JUDGE0_API_HOST = `http://127.0.0.1:${mockPort}`;

    try {
      const solutionWithoutMain = "class Solution { public int add(int a, int b) { return a + b; } }";
      const result = await executeViaJudge0("java", solutionWithoutMain, "20\n22");
      assert.strictEqual(result.exitCode, 0);
      assert(capturedBody && capturedBody.source_code, "Must send submission to Judge0");
      const decodedSource = Buffer.from(capturedBody.source_code, "base64").toString("utf8");
      assert(
        decodedSource.includes("public class Main") && decodedSource.includes("Solution sol = new Solution()"),
        `Java LeetCode solution must be injected with reflection harness, got: ${decodedSource}`
      );
    } finally {
      process.env.JUDGE0_API_HOST = origHost;
      mockJudge0.close();
    }
  });

  await it("Compiler: Curriculum exercise submission succeeds and resolves activeSession without ReferenceError", async () => {
    // Valid python function solution to python curriculum module 0 (filter_and_square)
    const pythonCode = [
      "def filter_and_square(nums):",
      "    return sorted([x ** 2 for x in nums if x > 0 and x % 2 == 0])",
    ].join("\n");

    const res = await fetch(`${baseUrl}/api/coding/curriculum/exercise/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        trackId: "python",
        moduleIndex: 0,
        language: "python",
        code: pythonCode,
      }),
    });

    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.status, "PASSED", "All 10 test cases must pass");
    assert.strictEqual(data.passed, true);
    assert.strictEqual(data.score, 100);
    assert.strictEqual(data.passedCount, 10);
    assert.strictEqual(data.totalTests, 10);
    assert(data.sessionId, "Must return activeSession sessionId without ReferenceError");

    // Verify ProctoredCodingSession was actually created/updated in the database
    const ProctoredCodingSession = require("../models/ProctoredCodingSession");
    const sessionDoc = await ProctoredCodingSession.findOne({ sessionId: data.sessionId });
    assert(sessionDoc, "ProctoredCodingSession document must exist for the submission");
    assert.strictEqual(sessionDoc.userId.toString(), userA._id.toString());
  });

  await it("Storage Engine: Centralized storage path honors RECORDINGS_STORAGE_PATH and streaming handles ?token query param", async () => {
    const { getRecordingsDir, resolveRecordingFilePath } = require("../config/recordingStorage");
    const customTestDir = path.join(__dirname, `custom_rec_test_${Date.now()}`);
    fs.mkdirSync(customTestDir, { recursive: true });

    const prevEnv = process.env.RECORDINGS_STORAGE_PATH;
    process.env.RECORDINGS_STORAGE_PATH = customTestDir;

    try {
      assert.strictEqual(getRecordingsDir(), path.resolve(customTestDir), "getRecordingsDir must honor RECORDINGS_STORAGE_PATH");

      // Create a genuine playable webm in the custom directory
      const media = createPlayableMedia({ format: "webm", duration: 1, video: true, audio: true });
      const testFilename = `rec_central_storage_test_${Date.now()}.webm`;
      const finalDest = path.join(customTestDir, testFilename);
      fs.writeFileSync(finalDest, media.buffer);
      media.cleanup();

      // Create recording record in DB
      const Recording = require("../models/Recording");
      const recDoc = await Recording.create({
        recordingId: `rec_test_${Date.now()}`,
        meetingId: `mtg_custom_${Date.now()}`,
        hostUserId: userA._id.toString(),
        hostEmail: userA.email,
        fileName: testFilename,
        filePath: finalDest,
        streamUrl: `/api/recordings/stream/${testFilename}`,
        fileUrl: `/recordings/${testFilename}`,
        status: "ready",
        durationSeconds: 1,
        fileSize: fs.statSync(finalDest).size,
      });

      const resolved = resolveRecordingFilePath(testFilename, recDoc);
      assert.strictEqual(resolved, finalDest, "resolveRecordingFilePath must resolve to custom storage dir file");

      // Verify streaming via GET /api/recordings/stream/:filename?token=... with Range
      const streamRes = await fetch(`${baseUrl}/api/recordings/stream/${testFilename}?token=${encodeURIComponent(tokenA)}`, {
        headers: { Range: "bytes=0-100" },
      });
      assert.strictEqual(streamRes.status, 206, `Stream endpoint with token query param must return 206, got ${streamRes.status}`);
      assert.strictEqual(streamRes.headers.get("content-type"), "video/webm");
      assert(streamRes.headers.get("content-range"), "Must return Content-Range header");

      // Verify direct streaming via GET /recordings/:filename?token=... with Range
      const directRes = await fetch(`${baseUrl}/recordings/${testFilename}?token=${encodeURIComponent(tokenA)}`, {
        headers: { Range: "bytes=0-100" },
      });
      assert.strictEqual(directRes.status, 206, `Direct /recordings route with token query param must return 206, got ${directRes.status}`);

      // Clean up test file and doc
      await Recording.deleteOne({ _id: recDoc._id });
      try { fs.unlinkSync(finalDest); } catch {}
    } finally {
      if (prevEnv !== undefined) {
        process.env.RECORDINGS_STORAGE_PATH = prevEnv;
      } else {
        delete process.env.RECORDINGS_STORAGE_PATH;
      }
      try { fs.rmSync(customTestDir, { recursive: true, force: true }); } catch {}
    }
  });

  await it("Recording Upload: Large payload (>2MB) does NOT trigger HTTP 413 Payload Too Large", async () => {
    // Generate a 2.5MB payload string to verify express.json({ limit: '100mb' }) in server.js
    const largeDummyBase64 = "A".repeat(2500000);
    const res = await fetch(`${baseUrl}/api/recordings/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        meetingId: "mtg_large_payload_check",
        base64Data: `data:video/webm;base64,${largeDummyBase64}`,
      }),
    });

    // It may fail validation (e.g. 404 meeting or 400 corrupted binary), but must NEVER fail with 413 Payload Too Large!
    assert.notStrictEqual(
      res.status,
      413,
      "Express body parser must NOT reject 2.5MB+ recording payloads with 413 Payload Too Large"
    );
  });

  console.log("\n================================================================================");
  console.log(`Summary: ${passedTestCount}/${totalTestCount} Complete Security Regression Tests Passed (100%)`);
  console.log("================================================================================");

  if (testServer) testServer.close();
  process.exit(0);
}

runSuite().catch((err) => {
  console.error("Test Suite Execution Failed:", err);
  if (testServer) testServer.close();
  process.exit(1);
});
