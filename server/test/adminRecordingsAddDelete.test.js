/**
 * Integration Verification for Admin Recordings Add & Delete (Single + Bulk)
 * Run via: node server/test/adminRecordingsAddDelete.test.js
 */
const assert = require("assert");
const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const Recording = require("../models/Recording");
const { getJwtSecret } = require("../config/jwtConfig");
const { getFileFromGridFS } = require("../config/recordingStorage");
const adminRoutes = require("../routes/adminRoutes");

function buildMultipart(fieldName, filename, mimeType, fileBuffer, fields = {}) {
  const boundary = "----MZAdminRecBoundary" + Date.now();
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    )
  );
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return { contentType: `multipart/form-data; boundary=${boundary}`, buffer: Buffer.concat(parts) };
}

function httpReq(server, method, urlPath, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const isBuf = Buffer.isBuffer(body);
    const payload = body == null ? null : isBuf || typeof body === "string" ? body : JSON.stringify(body);
    const reqHeaders = { ...headers };
    if (payload && !reqHeaders["Content-Type"]) reqHeaders["Content-Type"] = "application/json";
    if (payload && !reqHeaders["Content-Length"]) reqHeaders["Content-Length"] = Buffer.byteLength(payload);

    const req = http.request({ hostname: "127.0.0.1", port: addr.port, path: urlPath, method, headers: reqHeaders }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let json = null;
        try { json = JSON.parse(text); } catch {}
        resolve({ status: res.statusCode, body: json ?? text });
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/masteryzone_test";
  await mongoose.connect(mongoUri);

  const app = express();
  app.use(express.json());
  app.use("/api/admin", adminRoutes);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  const suffix = Date.now();
  let adminUser, normalUser;
  const tmpFile = path.join(__dirname, `tmp_admin_rec_${suffix}.webm`);

  try {
    adminUser = await User.create({
      fullName: "Admin Rec Tester",
      username: `admin_rec_${suffix}`,
      email: `admin_rec_${suffix}@test.local`,
      role: "SUPER_ADMIN",
      password: "Password123!",
      isEmailVerified: true,
    });
    normalUser = await User.create({
      fullName: "Normal User",
      username: `user_rec_${suffix}`,
      email: `user_rec_${suffix}@test.local`,
      password: "Password123!",
      isEmailVerified: true,
    });

    const tokenAdmin = jwt.sign({ userId: adminUser._id, id: adminUser._id, email: adminUser.email, role: "SUPER_ADMIN" }, getJwtSecret(), { expiresIn: "1h" });
    const tokenUser = jwt.sign({ userId: normalUser._id, id: normalUser._id, email: normalUser.email, role: normalUser.role }, getJwtSecret(), { expiresIn: "1h" });

    const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
    execFileSync(ffmpegPath, ["-y", "-f", "lavfi", "-i", "color=c=green:s=64x64:d=1", "-c:v", "libvpx", "-f", "webm", tmpFile], { stdio: "ignore" });
    const videoBuf = fs.readFileSync(tmpFile);

    // 1. Non-admin is blocked from uploading
    const fDenied = buildMultipart("video", "sample.webm", "video/webm", videoBuf, { title: "Denied Upload" });
    const deniedRes = await httpReq(server, "POST", "/api/admin/recordings/upload", {
      headers: { Authorization: `Bearer ${tokenUser}`, "Content-Type": fDenied.contentType },
      body: fDenied.buffer,
    });
    assert.strictEqual(deniedRes.status, 403, "Non-admin must get 403");

    // 2. Admin uploads a video
    const f1 = buildMultipart("video", "lecture1.webm", "video/webm", videoBuf, {
      title: `Admin Lecture ${suffix}`,
      recordingType: "Meeting",
    });
    const up1 = await httpReq(server, "POST", "/api/admin/recordings/upload", {
      headers: { Authorization: `Bearer ${tokenAdmin}`, "Content-Type": f1.contentType },
      body: f1.buffer,
    });
    assert.strictEqual(up1.status, 201, `Upload should succeed: ${JSON.stringify(up1.body)}`);
    const rec1 = up1.body.recording;
    assert(rec1.recordingId && fs.existsSync(rec1.filePath));
    const g1 = await getFileFromGridFS(path.basename(rec1.filePath));
    assert(g1, "Uploaded video must exist in GridFS");

    // 3. Admin deletes single video -> removed from DB, disk, and GridFS
    const del1 = await httpReq(server, "DELETE", `/api/admin/recordings/${rec1.recordingId}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.strictEqual(del1.status, 200);
    assert.strictEqual(await Recording.findOne({ recordingId: rec1.recordingId }), null);
    assert.strictEqual(fs.existsSync(rec1.filePath), false);
    assert.strictEqual(await getFileFromGridFS(path.basename(rec1.filePath)), null);

    // 4. Admin uploads 2 videos and bulk-deletes them
    const f2 = buildMultipart("video", "rec2.webm", "video/webm", videoBuf, { title: `Bulk 2 ${suffix}`, recordingType: "Screen Share" });
    const f3 = buildMultipart("video", "rec3.webm", "video/webm", videoBuf, { title: `Bulk 3 ${suffix}`, recordingType: "Meeting" });
    const up2 = await httpReq(server, "POST", "/api/admin/recordings/upload", {
      headers: { Authorization: `Bearer ${tokenAdmin}`, "Content-Type": f2.contentType },
      body: f2.buffer,
    });
    const up3 = await httpReq(server, "POST", "/api/admin/recordings/upload", {
      headers: { Authorization: `Bearer ${tokenAdmin}`, "Content-Type": f3.contentType },
      body: f3.buffer,
    });
    assert.strictEqual(up2.status, 201);
    assert.strictEqual(up3.status, 201);

    const id2 = up2.body.recording.recordingId;
    const id3 = up3.body.recording.recordingId;
    const bulkRes = await httpReq(server, "POST", "/api/admin/recordings/bulk-delete", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { recordingIds: [id2, id3] },
    });
    assert.strictEqual(bulkRes.status, 200);
    assert.strictEqual(bulkRes.body.deletedCount, 2);
    assert.strictEqual(await Recording.findOne({ recordingId: id2 }), null);
    assert.strictEqual(await Recording.findOne({ recordingId: id3 }), null);
    assert.strictEqual(fs.existsSync(up2.body.recording.filePath), false);
    assert.strictEqual(fs.existsSync(up3.body.recording.filePath), false);

    console.log("✅ ALL ADMIN RECORDINGS ADD & DELETE TESTS PASSED!");
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    const ids = [adminUser?._id, normalUser?._id].filter(Boolean);
    if (ids.length) await User.deleteMany({ _id: { $in: ids } }).catch(() => {});
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
