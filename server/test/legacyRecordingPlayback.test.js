/**
 * Regression tests: previously recorded videos must open for owners and admins via every URL
 * shape (legacy /recordings/<file>, /api/recordings/stream/<file>, bare recordingId), after
 * re-login, with re-registered accounts (email match), stale admin token claims, and with
 * Safari-style suffix byte ranges. Private isolation must still hold.
 */
const assert = require("assert");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { getJwtSecret } = require("../config/jwtConfig");
const { getRecordingsDir } = require("../config/recordingStorage");
const User = require("../models/User");
const Recording = require("../models/Recording");
const { app } = require("../server");

const results = [];
async function it(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.error(`  ✗ ${name}\n    ${err.message}`);
  }
}

(async () => {
  const mongoUri = process.env.TEST_MONGODB_URI;
  if (!mongoUri) {
    console.error("TEST_MONGODB_URI required");
    process.exit(1);
  }
  if (mongoose.connection.readyState === 0) await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

  const testServer = app.listen(0);
  const baseUrl = `http://127.0.0.1:${testServer.address().port}`;
  const secret = getJwtSecret();
  const sign = (u, extra = {}) =>
    jwt.sign({ userId: String(u._id), id: String(u._id), email: u.email, role: u.role, ...extra }, secret, { expiresIn: "1h" });

  const mk = async (email, role = "user") =>
    (await User.findOne({ email })) ||
    User.create({ username: email.split("@")[0], fullName: email, email, password: "HashedPassword123!", role });

  const owner = await mk("legacy_owner@masteryzone.test");
  const stranger = await mk("legacy_stranger@masteryzone.test");
  const admin = await mk("legacy_admin@masteryzone.test", "admin");

  const filename = `rec_legacytest_${Date.now()}.webm`;
  const bytes = Buffer.from("1a45dfa3a34286810142f7810142f2810442f381084282847765626d", "hex");
  const filePath = path.join(getRecordingsDir(), filename);
  fs.writeFileSync(filePath, Buffer.concat([bytes, Buffer.alloc(4096, 7)]));
  const size = fs.statSync(filePath).size;

  const recordingId = filename.replace(".webm", "");
  // Legacy shape: no streamUrl, hostUserId from an OLD account id, but same hostEmail.
  await Recording.collection.insertOne({
    recordingId,
    title: "Legacy Session",
    hostUserId: new mongoose.Types.ObjectId().toString(),
    hostEmail: owner.email,
    participantUserIds: [],
    filePath: `/recordings/${filename}`,
    fileUrl: `/recordings/${filename}`,
    status: "ready",
    createdAt: new Date(),
  });

  const ownerToken = sign(owner);
  const staleAdminToken = sign(admin, { role: "user" }); // role claim stale; DB says admin

  const get = (p, token, headers = {}) =>
    fetch(`${baseUrl}${p}${token ? `${p.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : ""}`, { headers });

  console.log("Legacy recording playback");
  await it("owner (re-registered, email match) streams via /api/recordings/stream", async () => {
    const r = await get(`/api/recordings/stream/${filename}`, ownerToken, { Range: "bytes=0-15" });
    assert.strictEqual(r.status, 206);
    assert.strictEqual(r.headers.get("content-range"), `bytes 0-15/${size}`);
  });
  await it("owner streams via legacy /recordings/<file> URL", async () => {
    const r = await get(`/recordings/${filename}`, ownerToken, { Range: "bytes=0-" });
    assert.strictEqual(r.status, 206);
  });
  await it("owner streams via bare recordingId", async () => {
    const r = await get(`/api/recordings/stream/${recordingId}`, ownerToken, { Range: "bytes=0-1" });
    assert.strictEqual(r.status, 206);
  });
  await it("Safari suffix range bytes=-100 returns final 100 bytes", async () => {
    const r = await get(`/api/recordings/stream/${filename}`, ownerToken, { Range: "bytes=-100" });
    assert.strictEqual(r.status, 206);
    assert.strictEqual(r.headers.get("content-range"), `bytes ${size - 100}-${size - 1}/${size}`);
  });
  await it("admin with stale token role claim can still stream (DB role)", async () => {
    const r = await get(`/api/recordings/stream/${filename}`, staleAdminToken, { Range: "bytes=0-15" });
    assert.strictEqual(r.status, 206);
  });
  await it("authorization header (no query token) works", async () => {
    const r = await fetch(`${baseUrl}/api/recordings/stream/${filename}`, {
      headers: { Authorization: `Bearer ${ownerToken}`, Range: "bytes=0-3" },
    });
    assert.strictEqual(r.status, 206);
  });
  await it("download endpoint returns attachment", async () => {
    const r = await get(`/api/recordings/download/${filename}`, ownerToken);
    assert.strictEqual(r.status, 200);
    assert(String(r.headers.get("content-disposition")).startsWith("attachment"));
  });
  await it("stranger is still forbidden (403)", async () => {
    const r = await get(`/api/recordings/stream/${filename}`, sign(stranger), { Range: "bytes=0-15" });
    assert.strictEqual(r.status, 403);
  });
  await it("no token returns 401", async () => {
    const r = await get(`/api/recordings/stream/${filename}`, null);
    assert.strictEqual(r.status, 401);
  });
  await it("path traversal rejected", async () => {
    const r = await get(`/api/recordings/stream/..%2F..%2F.env`, ownerToken);
    assert(r.status === 400 || r.status === 404);
  });
  await it("/recordings SPA page itself is not intercepted as media", async () => {
    const r = await fetch(`${baseUrl}/recordings`);
    assert.notStrictEqual(r.status, 401);
    assert.notStrictEqual(r.status, 400);
  });

  await Recording.deleteOne({ recordingId });
  try { fs.unlinkSync(filePath); } catch {}
  await new Promise((r) => testServer.close(r));
  await mongoose.disconnect();

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
