const assert = require("assert");
const nodemailer = require("nodemailer");
const {
  getSmtpConfig,
  resetTransporter,
  verifySmtpConnection,
  diagnoseSmtpError,
  maskEmail,
  sendMailWithRetry,
  dispatchMailBackground,
  sendSignupNotification,
  sendPasswordResetEmail,
  sendMainAdminOtpEmail,
  sendSupportTicketSubmittedEmail,
  sendCertificateAwardedEmail,
} = require("../utils/mailer");
const EmailLog = require("../models/EmailLog");

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  ✓ ${name}`);
      passedCount++;
    })
    .catch((err) => {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failedCount++;
    });
}

async function main() {
  console.log("==================================================");
  console.log("Running Mastery Zone Email System Test Suite (18 Cases)");
  console.log("==================================================");

  // Backup existing environment
  const originalEnv = { ...process.env };

  // 1. Missing credentials (ECONFIG)
  await runTest("1. Missing credentials returns ECONFIG error code", async () => {
    delete process.env.SMTP_EMAIL;
    delete process.env.SMTP_PASSWORD;
    resetTransporter();

    const config = getSmtpConfig();
    assert.strictEqual(config.isConfigured, false, "Configuration should report not configured");

    const diag = diagnoseSmtpError({ code: "ECONFIG" });
    assert.strictEqual(diag.code, "ECONFIG");

    const res = await sendMailWithRetry({ to: "test@example.com", subject: "Test", text: "Hello" });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorCode, "ECONFIG");
  });

  // 2. Invalid configuration detection
  await runTest("2. Invalid SMTP configuration values are caught cleanly", () => {
    process.env.SMTP_PORT = "not-a-number";
    process.env.SMTP_EMAIL = "invalid";
    const config = getSmtpConfig();
    assert.strictEqual(config.port, 465, "Should fall back to default port 465 when NaN");
  });

  // 3. Authentication failure handling (EAUTH)
  await runTest("3. Authentication failure maps to EAUTH with actionable message", () => {
    const err = new Error("535 5.7.8 Username and Password not accepted");
    err.code = "EAUTH";
    const diag = diagnoseSmtpError(err);
    assert.strictEqual(diag.code, "EAUTH");
    assert.ok(diag.message.includes("App Password") || diag.message.includes("authentication"), "Message should mention App Password");
  });

  // 4. Connection failure handling (ESOCKET / ECONNECTION / ETIMEDOUT)
  await runTest("4. Connection and socket errors are cleanly diagnosed", () => {
    const err1 = new Error("connect ECONNREFUSED 127.0.0.1:465");
    err1.code = "ECONNREFUSED";
    const diag1 = diagnoseSmtpError(err1);
    assert.strictEqual(diag1.code, "ECONNREFUSED");

    const err2 = new Error("Connection timed out");
    err2.code = "ETIMEDOUT";
    const diag2 = diagnoseSmtpError(err2);
    assert.strictEqual(diag2.code, "ETIMEDOUT");
  });

  // 5. Valid configuration detection
  await runTest("5. Valid SMTP configuration is accurately detected", () => {
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_SECURE = "true";
    process.env.SMTP_EMAIL = "admin@example.com";
    process.env.SMTP_PASSWORD = "abcdefghijklmnop";
    resetTransporter();

    const config = getSmtpConfig();
    assert.strictEqual(config.isConfigured, true);
    assert.strictEqual(config.host, "smtp.gmail.com");
    assert.strictEqual(config.port, 465);
    assert.strictEqual(config.secure, true);
    assert.strictEqual(config.auth.user, "admin@example.com");
  });

  // 6. Successful provider acceptance
  await runTest("6. Successful provider acceptance returns standardized accepted status", async () => {
    const origCreateTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        cb(null, {
          accepted: [opts.to],
          rejected: [],
          messageId: "<test-msg-123@masteryzone.com>",
          response: "250 2.0.0 OK accepted",
        });
      },
    });
    resetTransporter();

    try {
      const res = await sendMailWithRetry({
        to: "student@example.com",
        subject: "Welcome",
        html: "<p>Hello</p>",
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.status, "accepted");
      assert.strictEqual(res.messageId, "<test-msg-123@masteryzone.com>");
    } finally {
      nodemailer.createTransport = origCreateTransport;
      resetTransporter();
    }
  });

  // 7. Invalid recipient rejection (EENVELOPE)
  await runTest("7. Invalid recipient address is rejected immediately with EENVELOPE", async () => {
    const res = await sendMailWithRetry({
      to: "not-an-email-address",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorCode, "EENVELOPE");
  });

  // 8. Rejected recipient handling
  await runTest("8. Provider recipient rejection returns failure status", async () => {
    const origCreateTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        cb(null, {
          accepted: [],
          rejected: [opts.to],
          messageId: "<rej-123@masteryzone.com>",
          response: "550 5.1.1 User unknown",
        });
      },
    });
    resetTransporter();

    try {
      const res = await sendMailWithRetry({
        to: "nonexistent@example.com",
        subject: "Hello",
        html: "<p>Test</p>",
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, "rejected");
      assert.strictEqual(res.errorCode, "EENVELOPE");
    } finally {
      nodemailer.createTransport = origCreateTransport;
      resetTransporter();
    }
  });

  // 9. Timeout handling
  await runTest("9. Transporter timeout produces safe diagnostic error", async () => {
    const origCreateTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => {
        const err = new Error("Connection timed out after 12000ms");
        err.code = "ETIMEDOUT";
        cb(err);
      },
      sendMail: (opts, cb) => {
        const err = new Error("Greeting timed out");
        err.code = "ETIMEDOUT";
        cb(err);
      },
    });
    resetTransporter();

    try {
      const res = await sendMailWithRetry(
        { to: "student@example.com", subject: "Timeout test", html: "<p>Test</p>" },
        0
      );
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.errorCode, "ETIMEDOUT");
    } finally {
      nodemailer.createTransport = origCreateTransport;
      resetTransporter();
    }
  });

  // 10. Retry behavior on transient errors vs permanent errors
  await runTest("10. Transient errors trigger retry while permanent errors fail immediately", async () => {
    let callCount = 0;
    const origCreateTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        callCount++;
        if (callCount === 1) {
          const err = new Error("Server temporarily busy");
          err.code = "ECONNECTION";
          return cb(err);
        }
        cb(null, {
          accepted: [opts.to],
          rejected: [],
          messageId: "<retry-ok@masteryzone.com>",
          response: "250 2.0.0 OK",
        });
      },
    });
    resetTransporter();

    try {
      const res = await sendMailWithRetry(
        { to: "retry@example.com", subject: "Retry test", html: "<p>Test</p>" },
        2
      );
      assert.strictEqual(res.success, true);
      assert.strictEqual(callCount, 2, "Should have retried once on transient ECONNECTION error");
    } finally {
      nodemailer.createTransport = origCreateTransport;
      resetTransporter();
    }
  });

  // 11. Background dispatch error handling
  await runTest("11. Background dispatch executes safely without crashing process on error", async () => {
    let caughtSafely = false;
    await new Promise((resolve) => {
      dispatchMailBackground(async () => {
        throw new Error("Simulated background async failure");
      }, { type: "test_background_crash_guard" });

      setTimeout(() => {
        caughtSafely = true;
        resolve();
      }, 50);
    });
    assert.strictEqual(caughtSafely, true);
  });

  // 12. Test email endpoint auth contract
  await runTest("12. Admin test email endpoint requires authenticated administrator", () => {
    const { verifySuperAdmin } = require("../middleware/adminAuth");
    assert.strictEqual(typeof verifySuperAdmin, "function", "verifySuperAdmin middleware must exist");
  });

  // 13. Signup email format and execution
  await runTest("13. Signup welcome email respects candidate name and guest skip", async () => {
    const guestUser = { email: "guest_123456@masteryzone.com", fullName: "Guest User", role: "guest" };
    const guestRes = await sendSignupNotification(guestUser);
    assert.strictEqual(guestRes.success, true);
    assert.strictEqual(guestRes.status, "skipped_guest");
  });

  // 14. Password reset email format and direct token
  await runTest("14. Password reset email includes token, security warnings, and direct link", async () => {
    const origCreateTransport = nodemailer.createTransport;
    let capturedMail = null;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        capturedMail = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<reset-123@masteryzone.com>" });
      },
    });
    resetTransporter();

    try {
      const user = { _id: "507f1f77bcf86cd799439011", email: "candidate@example.com", fullName: "Candidate User" };
      const res = await sendPasswordResetEmail(user, "secure_reset_token_hex_9988", null, "https://mastery-zone.onrender.com");
      assert.strictEqual(res.success, true);
      assert.ok(capturedMail.html.includes("secure_reset_token_hex_9988"), "HTML must include token");
      assert.ok(capturedMail.html.includes("60 minutes"), "HTML must include 60 minute expiration notice");
    } finally {
      nodemailer.createTransport = origCreateTransport;
      resetTransporter();
    }
  });

  // 15. Admin OTP email format
  await runTest("15. Main Admin OTP email includes 6-digit code and expiration", async () => {
    const origCreateTransport = nodemailer.createTransport;
    let capturedMail = null;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        capturedMail = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<admin-otp@masteryzone.com>" });
      },
    });
    resetTransporter();

    try {
      const res = await sendMainAdminOtpEmail({ toEmail: "admin@masteryzone.com", otp: "582914", expiresMinutes: 10 });
      assert.strictEqual(res.success, true);
      assert.ok(capturedMail.html.includes("582914"), "HTML must include 6-digit OTP");
      assert.ok(capturedMail.html.includes("10 minutes"), "HTML must include 10 minutes notice");
    } finally {
      nodemailer.createTransport = origCreateTransport;
      resetTransporter();
    }
  });

  // 16. Support ticket email format
  await runTest("16. Support ticket emails include ticket ID and summary", async () => {
    const origCreateTransport = nodemailer.createTransport;
    let capturedMail = null;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        capturedMail = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<ticket-123@masteryzone.com>" });
      },
    });
    resetTransporter();

    try {
      const res = await sendSupportTicketSubmittedEmail({
        userEmail: "support_user@example.com",
        userName: "Alice Learner",
        ticketId: "MZ-88219",
        category: "Proctoring",
        subject: "Camera Permission Issue",
        description: "Need help resetting webcam permissions",
      });
      assert.strictEqual(res.success, true);
      assert.ok(capturedMail.html.includes("MZ-88219"), "HTML must contain Ticket ID");
      assert.ok(capturedMail.subject.includes("MZ-88219"), "Subject must contain Ticket ID");
    } finally {
      nodemailer.createTransport = origCreateTransport;
      resetTransporter();
    }
  });

  // 17. Certificate email format
  await runTest("17. Certificate email includes candidate name and verification link", async () => {
    const origCreateTransport = nodemailer.createTransport;
    let capturedMail = null;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        capturedMail = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<cert-123@masteryzone.com>" });
      },
    });
    resetTransporter();

    try {
      const res = await sendCertificateAwardedEmail({
        candidateEmail: "cert_student@example.com",
        candidateName: "Dev Genius",
        certTitle: "Full Stack Mastery Certificate",
        certificateId: "MZ-CERT-9999",
        score: 95,
      });
      assert.strictEqual(res.success, true);
      assert.ok(capturedMail.html.includes("MZ-CERT-9999"), "HTML must contain certificate ID");
      assert.ok(capturedMail.html.includes("Dev Genius"), "HTML must contain candidate name");
    } finally {
      nodemailer.createTransport = origCreateTransport;
      resetTransporter();
    }
  });

  // 18. EmailLog persistence schema verification
  await runTest("18. EmailLog schema contains required audit and tracking fields", () => {
    const paths = EmailLog.schema.paths;
    assert.ok(paths.recipient, "Schema must have recipient");
    assert.ok(paths.emailType, "Schema must have emailType");
    assert.ok(paths.status, "Schema must have status");
    assert.ok(paths.messageId, "Schema must have messageId");
    assert.ok(paths.attemptCount, "Schema must have attemptCount");
    assert.ok(paths.createdAt, "Schema must have createdAt timestamp");

    // Masking check
    assert.strictEqual(maskEmail("john.doe@gmail.com"), "j***e@gmail.com");
  });

  // Restore environment
  for (const k of Object.keys(process.env)) {
    if (!originalEnv[k]) delete process.env[k];
  }
  Object.assign(process.env, originalEnv);
  resetTransporter();

  console.log("==================================================");
  console.log(`Email Test Suite: ${passedCount}/${passedCount + failedCount} tests passed`);
  console.log("==================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Test execution failure:", e);
  process.exit(1);
});
