const assert = require("assert");
const {
  getSenderAddress,
  getHttpEmailProvider,
  maskEmail,
  sendMailWithRetry,
  sendModuleCompletionEmail,
  sendCertificateAwardedEmail,
  sendSubmissionEvaluationEmail,
  isLegitimateDeliverableEmail,
} = require("../utils/mailer");
const { pushNotification } = require("../utils/notificationService");

async function runAuditTests() {
  console.log("=== STARTING RENDER NOTIFICATION & EMAIL AUDIT TESTS ===");

  // 1. Verify maskEmail preserves privacy and masks recipient
  assert.strictEqual(maskEmail("yashash@example.com"), "y***h@example.com");
  assert.strictEqual(maskEmail("me@domain.org"), "m***@domain.org");
  assert.strictEqual(maskEmail("admin@masteryzone.com"), "a***n@masteryzone.com");
  console.log("✔ Test 1: maskEmail correctly masks recipient identifiers without leaking full addresses");

  // 2. Verify Brevo relay username sanitization in getSenderAddress
  const originalEnv = { ...process.env };
  try {
    process.env.NODE_ENV = "production";
    process.env.SMTP_EMAIL = "7b4c92001@smtp-brevo.com";
    delete process.env.SMTP_FROM;
    delete process.env.BREVO_SENDER_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SMTP_KEY;

    const senderAddr = getSenderAddress("Mastery Zone Academics");
    assert(
      !senderAddr.includes("@smtp-brevo.com"),
      `Sender address should never include relay username @smtp-brevo.com, got: ${senderAddr}`
    );
    assert(
      senderAddr.includes("yashashyashash1@gmail.com") || senderAddr.includes("Mastery Zone"),
      `Sender should fall back to verified administrator address, got: ${senderAddr}`
    );
    console.log("✔ Test 2: Brevo relay usernames are sanitized and fall back to verified sender");
  } finally {
    process.env = { ...originalEnv };
  }

  // 3. Verify Brevo HTTPS API detection with xkeysib- key in BREVO_SMTP_KEY or SMTP_PASSWORD
  try {
    process.env.NODE_ENV = "production";
    delete process.env.BREVO_API_KEY;
    process.env.BREVO_SMTP_KEY = "xkeysib-9876543210abcdef9876543210abcdef";
    process.env.SMTP_EMAIL = "7b4c92001@smtp-brevo.com";
    process.env.BREVO_SENDER_EMAIL = "verified@myzone.edu";

    const httpProvider = getHttpEmailProvider();
    assert(httpProvider !== null, "Brevo HTTPS API provider should be detected when xkeysib- key is in BREVO_SMTP_KEY");
    assert.strictEqual(httpProvider.type, "brevo");
    assert.strictEqual(httpProvider.apiKey, "xkeysib-9876543210abcdef9876543210abcdef");
    assert(httpProvider.from.includes("verified@myzone.edu"), `Provider 'from' should use verified sender, got: ${httpProvider.from}`);
    console.log("✔ Test 3: Brevo HTTPS API is activated via xkeysib- key detection on port 443");
  } finally {
    process.env = { ...originalEnv };
  }

  // 4. Verify Structured Logging output during sendMailWithRetry
  const logsCaptured = [];
  const originalLog = console.log;
  const originalWarn = console.warn;
  console.log = (...args) => {
    logsCaptured.push(args.join(" "));
    originalLog(...args);
  };
  console.warn = (...args) => {
    logsCaptured.push(args.join(" "));
    originalWarn(...args);
  };

  try {
    process.env.NODE_ENV = "test";
    const res = await sendMailWithRetry({
      to: "legitimate_student@example.com",
      subject: "Test Audit Subject",
      html: "<p>Hello</p>",
    }, 1, {
      emailType: "module_completion_update",
      recordId: "mod_1",
    });

    assert(res.success === true, "sendMailWithRetry should succeed in test mock");
    const hasTriggerLog = logsCaptured.some((l) => l.includes("[Email Trigger]") && l.includes("module_completion_update"));
    const hasAttemptLog = logsCaptured.some((l) => l.includes("[Email Attempt]"));
    const hasAcceptedLog = logsCaptured.some((l) => l.includes("[Email Accepted]"));

    assert(hasTriggerLog, `Missing [Email Trigger] structured log in: ${JSON.stringify(logsCaptured)}`);
    assert(hasAttemptLog, `Missing [Email Attempt] structured log in: ${JSON.stringify(logsCaptured)}`);
    assert(hasAcceptedLog, `Missing [Email Accepted] structured log in: ${JSON.stringify(logsCaptured)}`);
    console.log("✔ Test 4: Structured logging emits [Email Trigger], [Email Attempt], and [Email Accepted] logs");
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    process.env = { ...originalEnv };
  }

  // 5. Verify suppression of synthetic test recipient domains to prevent Gmail bounce spam
  try {
    process.env.NODE_ENV = "production";
    const syntheticEmail = "alice_1794478199422@testdomain.org";
    assert.strictEqual(
      isLegitimateDeliverableEmail(syntheticEmail),
      false,
      "Synthetic test domain must be flagged as non-deliverable"
    );

    const suppressedRes = await sendMailWithRetry({
      to: syntheticEmail,
      subject: "Should not be sent",
      html: "<p>Suppressed</p>",
    }, 1, {
      emailType: "certificate_awarded",
    });

    assert.strictEqual(suppressedRes.status, "suppressed");
    assert.strictEqual(suppressedRes.suppressed, true);
    console.log("✔ Test 5: Synthetic domain test emails are permanently suppressed and blocked from SMTP");
  } finally {
    process.env = { ...originalEnv };
  }

  // 6. Verify sendModuleCompletionEmail and sendCertificateAwardedEmail trigger functions
  try {
    process.env.NODE_ENV = "test";
    const modRes = await sendModuleCompletionEmail({
      userEmail: "student@example.com",
      userName: "Alex Student",
      moduleNumber: 2,
      moduleName: "Algorithms & Data Structures",
      mcqMarks: 9,
      mcqMaxMarks: 10,
    });
    assert(modRes.success === true, "sendModuleCompletionEmail should succeed for legitimate student");

    const certRes = await sendCertificateAwardedEmail({
      candidateEmail: "candidate@example.org",
      candidateName: "Jordan Smith",
      certTitle: "Full-Stack Software Engineer",
      certificateId: "MZ-CERT-9901",
      score: 95,
    });
    assert(certRes.success === true, "sendCertificateAwardedEmail should succeed for candidate");

    const evalRes = await sendSubmissionEvaluationEmail({
      userEmail: "candidate@example.org",
      userName: "Jordan Smith",
      challengeTitle: "Binary Tree Inversion",
      score: 100,
      maxScore: 100,
      verdict: "ACCEPTED",
    });
    assert(evalRes.success === true, "sendSubmissionEvaluationEmail should succeed for candidate");

    console.log("✔ Test 6: Module completion, certification award, and assessment evaluation triggers deliver successfully");
  } finally {
    process.env = { ...originalEnv };
  }

  // 7. Verify Notification deduplication in pushNotification
  const Notification = require("../models/NotificationSchema");
  const origCreate = Notification.create;
  const origCount = Notification.countDocuments;
  try {
    let mockIdCounter = 1;
    Notification.create = async (doc) => ({
      _id: `mock_notif_${mockIdCounter++}`,
      ...doc,
      toObject() { return { ...this }; },
    });
    Notification.countDocuments = async () => 1;

    const mockApp = {
      get: () => ({
        to: () => ({ emit: () => {} }),
      }),
    };
    const validUserId = "507f1f77bcf86cd799439011";

    const doc1 = await pushNotification(mockApp, {
      userId: validUserId,
      title: "Module Complete",
      message: "You cleared Module 1 with score 9/10",
      type: "assessment",
    });

    const doc2 = await pushNotification(mockApp, {
      userId: validUserId,
      title: "Module Complete",
      message: "You cleared Module 1 with score 9/10",
      type: "assessment",
    });

    assert(doc1 !== null, "Initial pushNotification should succeed");
    assert(doc2 !== null, "Second rapid pushNotification should return deduplicated doc");
    assert.strictEqual(
      String(doc1._id || doc1.id),
      String(doc2._id || doc2.id),
      "Duplicate notification within dedup window should return identical doc instead of creating a second DB row"
    );
    console.log("✔ Test 7: pushNotification correctly deduplicates rapid repeated events within rate window");
  } finally {
    Notification.create = origCreate;
    Notification.countDocuments = origCount;
  }

  console.log("=== ALL RENDER NOTIFICATION & EMAIL AUDIT TESTS PASSED SUCCESSFULLY ===");
}

runAuditTests().catch((err) => {
  console.error("❌ AUDIT TEST FAILED:", err);
  process.exit(1);
});
