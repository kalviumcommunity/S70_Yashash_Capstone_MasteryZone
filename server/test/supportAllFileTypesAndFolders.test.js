const assert = require("assert");
const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const SupportTicket = require("../models/SupportTicket");
const { getJwtSecret } = require("../config/jwtConfig");
const supportRoutes = require("../routes/supportRoutes");

function httpReq(server, method, urlPath, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (payload) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(payload);
    }
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path: urlPath,
        method,
        headers: reqHeaders,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const respBuf = Buffer.concat(chunks);
          let json = null;
          try {
            json = JSON.parse(respBuf.toString("utf8"));
          } catch {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            buffer: respBuf,
            json,
          });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTest() {
  console.log("=== STARTING SUPPORT ALL FILE TYPES & FOLDERS INTEGRATION TEST ===");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGO_URI in environment.");
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected to MongoDB.");

  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use("/api/support", supportRoutes);

  const server = http.createServer(app);
  await new Promise((res) => server.listen(0, "127.0.0.1", res));

  const testEmail = `test_support_${Date.now()}@example.com`;
  const adminEmail = `admin_support_${Date.now()}@example.com`;

  const testUser = await User.create({
    username: `testuser_${Date.now()}`,
    password: "TestPassword123!",
    fullName: "Test Support Candidate",
    email: testEmail,
    role: "user",
    authProvider: "email",
  });

  const testAdmin = await User.create({
    username: `testadmin_${Date.now()}`,
    password: "TestPassword123!",
    fullName: "Test Support Administrator",
    email: adminEmail,
    role: "admin",
    isMainAdmin: true,
    authProvider: "email",
  });

  const jwtSecret = getJwtSecret();
  const userToken = jwt.sign(
    { userId: testUser._id.toString(), id: testUser._id.toString(), email: testUser.email, role: "user" },
    jwtSecret,
    { expiresIn: "1h" }
  );

  const adminToken = jwt.sign(
    { userId: testAdmin._id.toString(), id: testAdmin._id.toString(), email: testAdmin.email, role: "admin", isMainAdmin: true },
    jwtSecret,
    { expiresIn: "1h" }
  );

  // 1. Test uploading multiple file types
  const filesToUpload = [
    {
      name: "algorithm_solution.py",
      type: "text/x-python",
      content: "def two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        if target - num in lookup:\n            return [lookup[target - num], i]\n        lookup[num] = i\n    return []\n",
      relativePath: "my_project/src/algorithm_solution.py",
      isFolderItem: true,
      expectedMime: "text/plain; charset=utf-8",
    },
    {
      name: "compiler_output.log",
      type: "text/plain",
      content: "[2026-11-14 14:00:00] INFO: Compiling test case 1...\n[2026-11-14 14:00:01] PASS: All 15 unit tests executed successfully.\n",
      relativePath: "my_project/logs/compiler_output.log",
      isFolderItem: true,
      expectedMime: "text/plain; charset=utf-8",
    },
    {
      name: "sample_archive.zip",
      type: "application/zip",
      content: "PK\x03\x04mock_zip_binary_payload",
      relativePath: "sample_archive.zip",
      isFolderItem: false,
      expectedMime: "application/zip",
    },
    {
      name: "test_screenshot.png",
      type: "image/png",
      content: "\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82",
      relativePath: "test_screenshot.png",
      isFolderItem: false,
      expectedMime: "image/png",
    },
    {
      name: "audit_document.pdf",
      type: "application/pdf",
      content: "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 300 144]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n162\n%%EOF",
      relativePath: "documents/audit_document.pdf",
      isFolderItem: true,
      expectedMime: "application/pdf",
    },
  ];

  const uploadedAttachments = [];

  for (const item of filesToUpload) {
    const base64Data = Buffer.from(item.content).toString("base64");
    const res = await httpReq(server, "POST", "/api/support/upload", {
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        originalName: item.name,
        mimeType: item.type,
        base64Data,
        relativePath: item.relativePath,
        isFolderItem: item.isFolderItem,
      },
    });

    assert.strictEqual(res.status, 200, `Upload failed for ${item.name}: ${JSON.stringify(res.json)}`);
    assert.strictEqual(res.json.success, true);
    assert(res.json.attachment.fileName, "Missing fileName");
    assert.strictEqual(res.json.attachment.relativePath, item.relativePath);
    assert.strictEqual(res.json.attachment.isFolderItem, item.isFolderItem);

    uploadedAttachments.push(res.json.attachment);
    console.log(`✓ Uploaded ${item.name} -> ${res.json.attachment.fileName} (Relative: ${item.relativePath})`);
  }

  // 2. Test reading back each uploaded attachment with correct Content-Type
  for (let i = 0; i < uploadedAttachments.length; i++) {
    const att = uploadedAttachments[i];
    const expected = filesToUpload[i];
    const res = await httpReq(server, "GET", att.fileUrl, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    assert.strictEqual(res.status, 200, `Failed to stream attachment ${att.fileName}`);
    assert(
      res.headers["content-type"].includes(expected.expectedMime.split(";")[0]),
      `Unexpected Content-Type for ${expected.name}: ${res.headers["content-type"]}, expected: ${expected.expectedMime}`
    );
    console.log(`✓ Streamed ${att.fileName} with Content-Type: ${res.headers["content-type"]}`);
  }

  // 3. Test creating a ticket with these multi-file and folder attachments
  const createRes = await httpReq(server, "POST", "/api/support/tickets", {
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      category: "Coding Compiler Issues",
      subject: "Integration Test Ticket with Full Folder Hierarchy",
      description: "Candidate submitted a project folder containing code, logs, PDF document, and screenshots.",
      priority: "High",
      attachments: uploadedAttachments,
    },
  });

  assert.strictEqual(createRes.status, 201, `Create ticket failed: ${JSON.stringify(createRes.json)}`);
  assert.strictEqual(createRes.json.success, true);
  const ticketId = createRes.json.ticket.ticketId;
  console.log(`✓ Created ticket: ${ticketId} with ${createRes.json.ticket.attachments.length} attachments`);

  // Verify DB record contains relativePath and isFolderItem
  const dbTicket = await SupportTicket.findOne({ ticketId });
  assert(dbTicket, "Ticket not found in DB");
  assert.strictEqual(dbTicket.attachments.length, uploadedAttachments.length);
  for (const att of dbTicket.attachments) {
    assert(att.fileName, "Missing attachment fileName");
    assert(att.relativePath !== undefined, "Missing relativePath in DB attachment");
    console.log(`  - DB Attachment: ${att.originalName} | Path: "${att.relativePath}" | FolderItem: ${att.isFolderItem}`);
  }

  // 4. Test Admin viewing the ticket
  const adminRes = await httpReq(server, "GET", "/api/support/admin/tickets", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert.strictEqual(adminRes.status, 200);
  const foundTicket = (adminRes.json.tickets || []).find((t) => t.ticketId === ticketId);
  assert(foundTicket, "Admin ticket list did not include created ticket");
  assert.strictEqual(foundTicket.attachments.length, uploadedAttachments.length);
  console.log(`✓ Admin retrieved ticket with all ${foundTicket.attachments.length} attachments.`);

  // Cleanup test ticket
  await SupportTicket.deleteOne({ ticketId });
  await User.deleteOne({ email: testEmail });
  await User.deleteOne({ email: adminEmail });
  await new Promise((res) => server.close(res));
  await mongoose.disconnect();

  console.log("=== ALL SUPPORT ALL FILE TYPES & FOLDERS TESTS PASSED SUCCESSFULLY ===");
}

runTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
