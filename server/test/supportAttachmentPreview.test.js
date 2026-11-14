/**
 * Test Suite for Support Attachment Preview & Lightbox Image/Document Delivery
 * Run via: node server/test/supportAttachmentPreview.test.js
 */
const assert = require("assert");
const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const SupportTicket = require("../models/SupportTicket");
const { getJwtSecret } = require("../config/jwtConfig");
const supportRoutes = require("../routes/supportRoutes");

function httpReq(server, method, urlPath, { headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path: urlPath,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            buffer: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function run() {
  console.log("\n================================================================================");
  console.log("🎫 Support Attachment Image & Document Preview Test");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(mongoUri);

  const app = express();
  app.use(express.json());
  app.use("/api/support", supportRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  const suffix = Date.now();
  let adminUser, ticketUser, otherUser;

  try {
    adminUser = await User.create({
      fullName: "Support Admin",
      username: `supp_adm_${suffix}`,
      email: `supp_adm_${suffix}@test.local`,
      role: "SUPER_ADMIN",
      password: "Password123!",
      isEmailVerified: true,
    });
    ticketUser = await User.create({
      fullName: "Ticket Owner",
      username: `tkt_own_${suffix}`,
      email: `tkt_own_${suffix}@test.local`,
      password: "Password123!",
      isEmailVerified: true,
    });
    otherUser = await User.create({
      fullName: "Unrelated User",
      username: `unrelated_${suffix}`,
      email: `unrelated_${suffix}@test.local`,
      password: "Password123!",
      isEmailVerified: true,
    });

    const tokenAdmin = jwt.sign(
      { userId: adminUser._id, id: adminUser._id, role: "SUPER_ADMIN" },
      getJwtSecret(),
      { expiresIn: "1h" }
    );
    const tokenOwner = jwt.sign(
      { userId: ticketUser._id, id: ticketUser._id, role: ticketUser.role },
      getJwtSecret(),
      { expiresIn: "1h" }
    );
    const tokenOther = jwt.sign(
      { userId: otherUser._id, id: otherUser._id, role: otherUser.role },
      getJwtSecret(),
      { expiresIn: "1h" }
    );

    // 1. Verify Clg admission pdf and png are accessible by Admin
    const pdfRes = await httpReq(
      server,
      "GET",
      `/api/support/attachments/tkt_att_1794328759971_qmax9c_Clg_admission_pdf.pdf?token=${encodeURIComponent(tokenAdmin)}`
    );
    assert.strictEqual(pdfRes.status, 200, "Admin must be able to view Clg admission pdf");
    assert(pdfRes.headers["content-type"].includes("application/pdf"), "Must return application/pdf");
    assert(pdfRes.buffer.length > 500, "Must contain valid PDF payload");
    console.log("✅ 1. PDF attachment stream verified (Status 200, application/pdf)");

    const pngRes = await httpReq(
      server,
      "GET",
      `/api/support/attachments/tkt_att_1794328759971_qmax9c_Clg_admission_pdf.png?token=${encodeURIComponent(tokenAdmin)}`
    );
    assert.strictEqual(pngRes.status, 200, "Admin must be able to view Clg admission PNG");
    assert(pngRes.headers["content-type"].includes("image/png"), "Must return image/png");
    assert(pngRes.buffer.length > 5000, "Must contain high-resolution image payload");
    console.log("✅ 2. Full image preview verified (Status 200, image/png)");

    // 2. Unauthenticated request is rejected
    const unauth = await httpReq(
      server,
      "GET",
      "/api/support/attachments/tkt_att_1794328759971_qmax9c_Clg_admission_pdf.pdf"
    );
    assert.strictEqual(unauth.status, 401, "Unauthenticated access must be rejected with 401");
    console.log("✅ 3. Unauthenticated access blocked (Status 401)");

    // 3. Test GridFS self-healing: delete local disk file, verify endpoint restores from GridFS
    const diskPdf = path.join(__dirname, "../uploads/support_attachments/tkt_att_1794328759971_qmax9c_Clg_admission_pdf.pdf");
    if (fs.existsSync(diskPdf)) {
      fs.unlinkSync(diskPdf);
      assert(!fs.existsSync(diskPdf), "Local file must be unlinked for test");
    }
    const restoredRes = await httpReq(
      server,
      "GET",
      `/api/support/attachments/tkt_att_1794328759971_qmax9c_Clg_admission_pdf.pdf?token=${encodeURIComponent(tokenAdmin)}`
    );
    assert.strictEqual(restoredRes.status, 200, "Must restore from GridFS with 200");
    assert(fs.existsSync(diskPdf), "File must be re-created on local disk cache");
    console.log("✅ 4. GridFS self-healing recovery verified across disk deletions");

    console.log("\n🎉 ALL SUPPORT ATTACHMENT PREVIEW CHECKS PASSED!\n");
  } finally {
    const ids = [adminUser?._id, ticketUser?._id, otherUser?._id].filter(Boolean);
    if (ids.length) await User.deleteMany({ _id: { $in: ids } }).catch(() => {});
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
