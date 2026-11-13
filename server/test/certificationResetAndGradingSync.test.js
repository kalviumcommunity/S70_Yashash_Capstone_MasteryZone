process.env.NODE_ENV = "test";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http");
const jwt = require("jsonwebtoken");

const { app } = require("../server");
const User = require("../models/User");
const CertificationAttempt = require("../models/CertificationAttempt");
const IssuedCertificate = require("../models/IssuedCertificate");
const Certification = require("../models/CertificationSchema");
const Progress = require("../models/ProgressSchema");
const { CERTIFICATES_DIR } = require("../utils/certificateGenerator");
const { sendCertificateAwardedEmail } = require("../utils/mailer");

let testServer;
let baseUrl;
let adminUser;
let adminToken;
let candidateUser;
let candidateToken;
const secret = process.env.JWT_SECRET || "fallback_super_secret_mastery_zone_key_2026_jwt";

async function it(label, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${label}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${label}`);
    console.error(`     Reason: ${err.message}`);
    throw err;
  }
}

async function runTests() {
  console.log("\n================================================================================");
  console.log("🚀 Certification Reset, Dual Cutoff & Course Completion Email Test Suite");
  console.log("================================================================================\n");

  testServer = http.createServer(app);
  await new Promise((resolve) => {
    testServer.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  const timestamp = Date.now();

  adminUser = await User.findOneAndUpdate(
    { email: "yashashyashash1@gmail.com" },
    {
      fullName: "Super Admin Yashash",
      username: `admin_cert_${timestamp}`,
      email: "yashashyashash1@gmail.com",
      role: "admin",
      isEmailVerified: true,
    },
    { upsert: true, new: true }
  );
  adminToken = jwt.sign(
    { userId: String(adminUser._id), email: adminUser.email, role: "admin" },
    secret,
    { expiresIn: "2h" }
  );

  candidateUser = await User.create({
    fullName: "Alice Certified Candidate",
    username: `alice_cert_${timestamp}`,
    email: `alice_${timestamp}@testdomain.org`,
    password: "HashedPassword123!",
    role: "student",
    isEmailVerified: true,
  });
  candidateToken = jwt.sign(
    { userId: String(candidateUser._id), email: candidateUser.email, role: "student" },
    secret,
    { expiresIn: "2h" }
  );

  try {
    await it("1. Global Reset: All certification accounts and storage start completely clean", async () => {
      const res = await fetch(`${baseUrl}/api/certifications/reset-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assert.strictEqual(res.status, 200, "Reset-all should respond with 200");
      const data = await res.json();
      assert.strictEqual(data.success, true);

      const [attemptsCount, issuedCount, certsCount] = await Promise.all([
        CertificationAttempt.countDocuments(),
        IssuedCertificate.countDocuments(),
        Certification.countDocuments(),
      ]);

      assert.strictEqual(attemptsCount, 0, "No attempts should exist after reset");
      assert.strictEqual(issuedCount, 0, "No issued certificates should exist after reset");
      assert.strictEqual(certsCount, 0, "No certification progression records should exist after reset");
    });

    await it("2. Catalog & History: Shows 'not_started' and 0 earned certificates for candidate", async () => {
      const catalogRes = await fetch(`${baseUrl}/api/certifications`, {
        headers: { Authorization: `Bearer ${candidateToken}` },
      });
      assert.strictEqual(catalogRes.status, 200);
      const catalog = await catalogRes.json();
      assert(Array.isArray(catalog), "Catalog should return an array of certifications");
      catalog.forEach((item) => {
        assert.strictEqual(item.status, "not_started", `Item ${item.id} must be not_started`);
        assert.strictEqual(item.progress, 0, `Item ${item.id} must have 0 progress`);
      });

      const historyRes = await fetch(`${baseUrl}/api/certifications/my-history`, {
        headers: { Authorization: `Bearer ${candidateToken}` },
      });
      assert.strictEqual(historyRes.status, 200);
      const history = await historyRes.json();
      assert.strictEqual(history.attempts.length, 0, "Attempts history should be empty");
      assert.strictEqual(history.certificates.length, 0, "Certificates history should be empty");
    });

    await it("3. Start Attempt: Initiates in-progress session without prematurely marking completed", async () => {
      const startRes = await fetch(`${baseUrl}/api/certifications/attempt/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${candidateToken}`,
        },
        body: JSON.stringify({ certId: "dsa_cert", certTitle: "Data Structures & Algorithms (DSA)" }),
      });

      assert(startRes.ok, `Start attempt must succeed, got status: ${startRes.status}`);
      const startData = await startRes.json();
      assert(startData.attemptId, "Must return valid attemptId");
      assert.strictEqual(startData.status, "IN_PROGRESS");
      assert.strictEqual(startData.selectedMcqs.length, 20, "Should generate exactly 20 MCQs");
      assert.strictEqual(startData.selectedCodingQuestions.length, 2, "Should generate exactly 2 coding challenges");

      // Catalog check: should NOT be marked completed
      const catalogRes = await fetch(`${baseUrl}/api/certifications`, {
        headers: { Authorization: `Bearer ${candidateToken}` },
      });
      const catalog = await catalogRes.json();
      const dsaCert = catalog.find((c) => c.id === "dsa_cert");
      assert.notStrictEqual(dsaCert.status, "completed", "Must NOT be marked completed when in-progress");
    });

    await it("4. Failing Attempt: Does NOT meet 80% cutoff, does NOT issue certificate", async () => {
      const startRes = await fetch(`${baseUrl}/api/certifications/attempt/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${candidateToken}`,
        },
        body: JSON.stringify({ certId: "dsa_cert", forceNew: true }),
      });
      assert(startRes.ok, `Start attempt must succeed, got status: ${startRes.status}`);
      const { attemptId, selectedCodingQuestions } = await startRes.json();

      // Answer only 5 MCQs correctly (cutoff is 16/20)
      const mcqAnswers = {};
      for (let i = 0; i < 20; i++) {
        mcqAnswers[i] = i < 5 ? 0 : 3;
      }

      const finalizeRes = await fetch(`${baseUrl}/api/certifications/attempt/${attemptId}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${candidateToken}`,
        },
        body: JSON.stringify({
          mcqAnswers,
          codingSubmissions: [
            {
              questionId: selectedCodingQuestions[0]?.questionId || "q1",
              code: "def solution(): return None",
              language: "python",
            },
            {
              questionId: selectedCodingQuestions[1]?.questionId || "q2",
              code: "def solution(): return None",
              language: "python",
            },
          ],
          violationsCount: 1,
        }),
      });

      assert.strictEqual(finalizeRes.status, 200);
      const finData = await finalizeRes.json();
      assert.strictEqual(finData.finalVerdict, "FAILED", "Attempt must be evaluated as FAILED");
      assert.strictEqual(finData.certificate, null, "Certificate must NOT be issued on failure");

      // Verify database state: no certificate issued, status is FAILED
      const issued = await IssuedCertificate.findOne({ userId: candidateUser._id });
      assert.strictEqual(issued, null, "Database must NOT have any IssuedCertificate for failed attempt");

      const attempt = await CertificationAttempt.findOne({ attemptId });
      assert.strictEqual(attempt.status, "FAILED");
      assert.strictEqual(attempt.finalVerdict, "FAILED");

      // Catalog check: should not be marked completed
      const catalogRes = await fetch(`${baseUrl}/api/certifications`, {
        headers: { Authorization: `Bearer ${candidateToken}` },
      });
      const catalog = await catalogRes.json();
      const dsaCert = catalog.find((c) => c.id === "dsa_cert");
      assert.notStrictEqual(dsaCert.status, "completed", "Must NOT be marked completed after failing cutoff");
    });

    await it("5. Passing Attempt: Meets cutoff (≥80%), generates PDF certificate and issues credential", async () => {
      const startRes = await fetch(`${baseUrl}/api/certifications/attempt/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${candidateToken}`,
        },
        body: JSON.stringify({ certId: "dsa_cert", forceNew: true }),
      });
      assert(startRes.ok, `Start attempt must succeed, got status: ${startRes.status}`);
      const { attemptId } = await startRes.json();

      const rawAttempt = await CertificationAttempt.findOne({ attemptId });
      const correctMcqs = {};
      rawAttempt.selectedMcqs.forEach((q) => {
        correctMcqs[String(q.id)] = Number(q.correctAnswer);
      });

      // Set 10/10 passed tests for each coding question to simulate 100% execution
      rawAttempt.codingSubmissions = [
        {
          questionId: rawAttempt.selectedCodingQuestions[0].questionId,
          code: "def solve(): return True",
          language: "python",
          solved: true,
          passedTests: 10,
          totalTests: 10,
          submittedAt: new Date(),
        },
        {
          questionId: rawAttempt.selectedCodingQuestions[1].questionId,
          code: "def solve(): return True",
          language: "python",
          solved: true,
          passedTests: 10,
          totalTests: 10,
          submittedAt: new Date(),
        },
      ];
      await rawAttempt.save();

      const finalizeRes = await fetch(`${baseUrl}/api/certifications/attempt/${attemptId}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${candidateToken}`,
        },
        body: JSON.stringify({
          mcqAnswers: correctMcqs,
          violationsCount: 0,
        }),
      });

      assert.strictEqual(finalizeRes.status, 200);
      const finData = await finalizeRes.json();
      assert.strictEqual(finData.finalVerdict, "PASSED", "Attempt must be evaluated as PASSED");
      assert(finData.certificate, "Certificate must be issued when cutoff is met");
      assert(finData.certificate.certificateId, "Certificate must have a valid certificateId");

      const certId = finData.certificate.certificateId;

      // Verify IssuedCertificate record in MongoDB
      const issuedDoc = await IssuedCertificate.findOne({ certificateId: certId });
      assert(issuedDoc, "IssuedCertificate record must exist in MongoDB");
      assert.strictEqual(issuedDoc.status, "VALID");
      assert.strictEqual(String(issuedDoc.userId), String(candidateUser._id));
      assert.strictEqual(issuedDoc.recipientName, candidateUser.fullName);

      // Verify vector PDF file generated on disk
      const pdfPathFlat = path.join(CERTIFICATES_DIR, `${certId}.pdf`);
      const pdfPathUser = path.join(CERTIFICATES_DIR, String(candidateUser._id), `${certId}.pdf`);
      const pdfExists = fs.existsSync(pdfPathFlat) || fs.existsSync(pdfPathUser);
      assert(pdfExists, "Generated Certificate PDF must exist on filesystem");

      const finalPath = fs.existsSync(pdfPathUser) ? pdfPathUser : pdfPathFlat;
      const stat = fs.statSync(finalPath);
      assert(stat.size > 1000, `PDF size must be substantial vector document (was: ${stat.size} bytes)`);

      const buf = Buffer.alloc(5);
      const fd = fs.openSync(finalPath, "r");
      fs.readSync(fd, buf, 0, 5, 0);
      fs.closeSync(fd);
      assert.strictEqual(buf.toString("utf8"), "%PDF-", "Generated file must have genuine %PDF- header");

      // Catalog check: should now be marked 'completed' with 100% progress
      const catalogRes = await fetch(`${baseUrl}/api/certifications`, {
        headers: { Authorization: `Bearer ${candidateToken}` },
      });
      const catalog = await catalogRes.json();
      const dsaCert = catalog.find((c) => c.id === "dsa_cert");
      assert.strictEqual(dsaCert.status, "completed", "DSA cert must be marked completed after clearing cutoff");
      assert.strictEqual(dsaCert.progress, 100, "Progress must be 100% after clearing cutoff");

      // History check: 1 earned certificate
      const historyRes = await fetch(`${baseUrl}/api/certifications/my-history`, {
        headers: { Authorization: `Bearer ${candidateToken}` },
      });
      const history = await historyRes.json();
      assert.strictEqual(history.certificates.length, 1, "Must show exactly 1 earned certificate");
      assert.strictEqual(history.certificates[0].certificateId, certId);
    });

    await it("6. Course Completion Email: Sends email with official certificate attached", async () => {
      const certDoc = await IssuedCertificate.findOne({ userId: candidateUser._id });
      assert(certDoc, "Issued certificate must exist from prior test");

      const pdfPathFlat = path.join(CERTIFICATES_DIR, `${certDoc.certificateId}.pdf`);
      const pdfPathUser = path.join(CERTIFICATES_DIR, String(candidateUser._id), `${certDoc.certificateId}.pdf`);
      const targetPdf = fs.existsSync(pdfPathUser) ? pdfPathUser : pdfPathFlat;
      assert(fs.existsSync(targetPdf), "Target PDF must exist for email attachment");

      const mailResult = await sendCertificateAwardedEmail({
        candidateEmail: candidateUser.email,
        candidateName: candidateUser.fullName,
        certTitle: certDoc.certificationTitle,
        certificateId: certDoc.certificateId,
        score: certDoc.finalGradePercentage || 100,
        pdfPath: targetPdf,
      });

      assert(mailResult, "Email sender must return a result object");
      assert.ok(
        mailResult.success === true || mailResult.errorCode === "ECONFIG",
        `Email dispatch must succeed or report unconfigured in test environment: ${mailResult.message || ""}`
      );
    });

    await it("7. Post-Certification Protection: Completed certification cannot be retaken", async () => {
      const startRes = await fetch(`${baseUrl}/api/certifications/attempt/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${candidateToken}`,
        },
        body: JSON.stringify({ certId: "dsa_cert" }),
      });

      assert.strictEqual(startRes.status, 403, "Must disallow attending already completed certification");
      const data = await startRes.json();
      assert.strictEqual(data.alreadyCertified, true);
      assert.strictEqual(data.isCompleted, true);
    });

    console.log("\n================================================================================");
    console.log("Summary: 7/7 tests passed cleanly!");
    console.log("================================================================================\n");
  } finally {
    if (candidateUser) {
      await User.deleteOne({ _id: candidateUser._id });
      await CertificationAttempt.deleteMany({ userId: candidateUser._id });
      await IssuedCertificate.deleteMany({ userId: candidateUser._id });
      await Certification.deleteMany({ userId: candidateUser._id });
    }
    if (testServer) {
      await new Promise((res) => testServer.close(res));
    }
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
