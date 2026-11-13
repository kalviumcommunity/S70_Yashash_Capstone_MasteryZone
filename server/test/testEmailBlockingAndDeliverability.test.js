process.env.NODE_ENV = "test";
const assert = require("assert");
const {
  isLegitimateDeliverableEmail,
  isGuestAccount,
  sendMailWithRetry,
  sendCertificateAwardedEmail,
  sendLoginNotification,
  sendSignupNotification,
  sendOtpEmail,
  sendPasswordResetEmail,
  getTransporter,
  resetTransporter,
} = require("../utils/mailer");

async function runTests() {
  console.log("================================================================================");
  console.log("🧪 Mastery Zone: Test Email Blocking & Production Deliverability Verification");
  console.log("================================================================================");

  let passed = 0;
  let total = 0;

  async function it(label, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${label}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${label}`);
      console.error(`     Reason: ${err.message}`);
      throw err;
    }
  }

  // 1. Synthetic domain blocking
  await it("Blocks synthetic test domain testdomain.org", () => {
    assert.strictEqual(isLegitimateDeliverableEmail("alice_1794478199422@testdomain.org"), false);
    assert.strictEqual(isGuestAccount("alice_1794478199422@testdomain.org"), true);
  });

  await it("Blocks synthetic test domain testdomain.com", () => {
    assert.strictEqual(isLegitimateDeliverableEmail("alice_123@testdomain.com"), false);
    assert.strictEqual(isGuestAccount("alice_123@testdomain.com"), true);
  });

  await it("Blocks synthetic test domains (*.test, *.invalid, *.local, example.com, test.com)", () => {
    assert.strictEqual(isLegitimateDeliverableEmail("user@masteryzone.test"), false);
    assert.strictEqual(isLegitimateDeliverableEmail("test@test.com"), false);
    assert.strictEqual(isLegitimateDeliverableEmail("john@invalid"), false);
    assert.strictEqual(isGuestAccount("test@masteryzone.local"), true);
  });

  await it("Blocks test recipient patterns (e.g. alice_cert_*, candidate_*, dummy, fake)", () => {
    assert.strictEqual(isLegitimateDeliverableEmail("alice_cert_123@gmail.com"), false);
    assert.strictEqual(isLegitimateDeliverableEmail("candidate_sec@gmail.com"), false);
    assert.strictEqual(isLegitimateDeliverableEmail("dummy@gmail.com"), false);
    assert.strictEqual(isLegitimateDeliverableEmail("fake_user@gmail.com"), false);
    assert.strictEqual(isGuestAccount("guest_user_99@gmail.com"), true);
  });

  // 2. Real user email validation
  await it("Allows genuine real registered user email addresses", () => {
    assert.strictEqual(isLegitimateDeliverableEmail("student.learning@gmail.com"), true);
    assert.strictEqual(isLegitimateDeliverableEmail("developer_master@yahoo.com"), true);
    assert.strictEqual(isLegitimateDeliverableEmail("learner.zone@outlook.com"), true);
    assert.strictEqual(isLegitimateDeliverableEmail("engineer@company.org"), true);
    assert.strictEqual(isGuestAccount("student.learning@gmail.com"), false);
  });

  // 3. Automated test safe transporter
  await it("Test environment initializes in-memory jsonTransport without connecting to real SMTP", async () => {
    resetTransporter();
    const tp = await getTransporter();
    assert.ok(tp, "Transporter must be created");
    assert.ok(
      tp.options?.jsonTransport === true || tp.isTestTransport === true || tp.transporter?.name === 'JSON',
      "Transporter must be in-memory mock during tests"
    );
  });

  // 4. Test account emails are suppressed
  await it("sendCertificateAwardedEmail suppresses synthetic test accounts", async () => {
    const res = await sendCertificateAwardedEmail({
      candidateEmail: "alice_1794478199422@testdomain.org",
      candidateName: "Alice Candidate",
      certTitle: "DSA Certification",
      certificateId: "MZ-CERT-TEST",
      score: 95,
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.status === "skipped_guest" || res.status === "suppressed");
  });

  await it("sendLoginNotification suppresses synthetic test accounts", async () => {
    const res = await sendLoginNotification({
      email: "alice_1794478199422@testdomain.org",
      fullName: "Alice Test",
      role: "student",
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.status === "skipped_guest" || res.status === "suppressed");
  });

  await it("sendSignupNotification suppresses synthetic test accounts", async () => {
    const res = await sendSignupNotification({
      email: "bob_1794478199422@testdomain.com",
      fullName: "Bob Test",
      role: "student",
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.status === "skipped_guest" || res.status === "suppressed");
  });

  await it("sendOtpEmail suppresses synthetic test accounts", async () => {
    const res = await sendOtpEmail("candidate_sec_123@gmail.com", "123456");
    assert.strictEqual(res.success, true);
    assert.ok(res.status === "skipped_guest" || res.status === "suppressed");
  });

  console.log("--------------------------------------------------------------------------------");
  console.log(`🎉 All ${passed}/${total} email deliverability & test blocking tests passed!`);
  console.log("================================================================================");
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failure:", err);
    process.exit(1);
  });
