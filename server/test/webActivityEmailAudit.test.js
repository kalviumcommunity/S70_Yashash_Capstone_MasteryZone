process.env.NODE_ENV = "test";
const assert = require("assert");
const nodemailer = require("nodemailer");
const {
  getSmtpConfig,
  resetTransporter,
  verifySmtpConnection,
  diagnoseSmtpError,
  isLegitimateDeliverableEmail,
  isGuestAccount,
  sendMailWithRetry,
  sendSignupNotification,
  sendLoginNotification,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendOtpEmail,
  sendSubmissionEvaluationEmail,
  sendModuleCompletionEmail,
  sendCertificateAwardedEmail,
  sendMeetingInvitationEmail,
  sendAnnouncementEmail,
  sendAccountNotificationEmail,
  isDuplicateOutboundEmail,
  clearSentNotificationCache,
  getHttpEmailProvider,
  sendViaHttpApi,
} = require("../utils/mailer");

async function runAuditSuite() {
  console.log("================================================================================");
  console.log("📧 Comprehensive Web-Activity Email Notifications Audit & Verification Suite");
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

  // --- Category 1: User Registration & Email Verification ---
  console.log("\n[Category 1] User Registration & Email Verification");
  await it("1.1 Registration welcome email formats correctly and skips guest accounts", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<welcome-test-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      // Real student registration
      const realUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "student_genuine@gmail.com",
        fullName: "Alex Genuine",
        username: "alexgen",
        role: "user",
      };
      const res = await sendSignupNotification(realUser);
      assert.strictEqual(res.success, true);
      assert.ok(captured, "Expected email dispatch");
      assert.strictEqual(captured.to, "student_genuine@gmail.com");
      assert.ok(captured.subject.includes("Welcome to Mastery Zone"));
      assert.ok(captured.html.includes("Alex Genuine"));

      // Guest registration skip
      const guestRes = await sendSignupNotification({
        email: "guest_visitor_888@masteryzone.com",
        fullName: "Guest",
        role: "guest",
      });
      assert.strictEqual(guestRes.success, true);
      assert.strictEqual(guestRes.status, "skipped_guest");
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  await it("1.2 Verification OTP email delivers securely with 6-digit code", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<otp-test-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      const res = await sendOtpEmail("student_genuine@gmail.com", "749201");
      assert.strictEqual(res.success, true);
      assert.ok(captured);
      assert.ok(captured.html.includes("749201"), "Email must render OTP code");
      assert.ok(captured.subject.includes("Verification") || captured.subject.includes("Code") || captured.subject.includes("One-Time"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  // --- Category 2: Password Reset ---
  console.log("\n[Category 2] Password Reset Flow");
  await it("2.1 Password reset request email generates secure link and expiry notification", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<reset-test-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      const user = { email: "student_genuine@gmail.com", fullName: "Alex Genuine" };
      const res = await sendPasswordResetEmail(user, "secure-token-abcdef123456");
      assert.strictEqual(res.success, true);
      assert.ok(captured);
      assert.ok(captured.html.includes("secure-token-abcdef123456"));
      assert.ok(captured.subject.toLowerCase().includes("password"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  await it("2.2 Password reset success confirmation sends security audit notification", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<reset-ok-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      const user = { email: "student_genuine@gmail.com", fullName: "Alex Genuine" };
      const res = await sendPasswordResetSuccessEmail(user);
      assert.strictEqual(res.success, true);
      assert.ok(captured);
      assert.ok(captured.html.includes("Password Changed Successfully"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  // --- Category 3: Coding Challenges & Submissions ---
  console.log("\n[Category 3] Coding Challenges, Submissions & Test Results");
  await it("3.1 Challenge submission sends evaluation scorecard with language, verdict and score", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<eval-coding-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      const res = await sendSubmissionEvaluationEmail({
        userEmail: "student_genuine@gmail.com",
        userName: "Alex Genuine",
        challengeTitle: "Binary Tree Maximum Path Sum",
        assessmentType: "coding",
        language: "javascript",
        score: 100,
        maxScore: 100,
        percentage: 100,
        verdict: "ACCEPTED",
        reportUrl: "/assessment-report/sub_12345",
      });
      assert.strictEqual(res.success, true);
      assert.ok(captured);
      assert.ok(captured.subject.includes("Binary Tree Maximum Path Sum"));
      assert.ok(captured.html.includes("ACCEPTED") || captured.html.includes("PASSED"));
      assert.ok(captured.html.includes("100%"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  // --- Category 4: Module Completion & Assessments ---
  console.log("\n[Category 4] Module Completion & Assessments");
  await it("4.1 Qualifying module completion sends comprehensive congratulations email", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<mod-comp-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      const res = await sendModuleCompletionEmail({
        userEmail: "student_genuine@gmail.com",
        userName: "Alex Genuine",
        moduleNumber: 3,
        moduleName: "Asynchronous JavaScript & Event Loop",
        codingMarks: "100 / 100",
        codingMaxMarks: 100,
        mcqMarks: 10,
        mcqMaxMarks: 10,
        combinedMarks: "100%",
        mcqCutoff: "8/10",
        completionStatus: "COMPLETED",
        completionDate: new Date(),
        reportUrl: "/assessment-report/mod_3_attempt",
      });
      assert.strictEqual(res.success, true);
      assert.ok(captured);
      assert.ok(captured.subject.includes("Module 3") && captured.subject.includes("Completion"));
      assert.ok(captured.html.includes("Asynchronous JavaScript & Event Loop"));
      assert.ok(captured.html.includes("10 / 10"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  await it("4.2 Non-passing assessment attempt triggers scorecard evaluation email", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<mod-eval-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      const res = await sendSubmissionEvaluationEmail({
        userEmail: "student_genuine@gmail.com",
        userName: "Alex Genuine",
        assessmentTitle: "Asynchronous JavaScript & Event Loop",
        assessmentType: "module",
        score: 6,
        maxScore: 10,
        percentage: 60,
        verdict: "FAILED",
        reportUrl: "/assessment-report/mod_3_attempt_failed",
      });
      assert.strictEqual(res.success, true);
      assert.ok(captured);
      assert.ok(captured.html.includes("60%"));
      assert.ok(captured.html.includes("FAILED") || captured.html.includes("Review"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  // --- Category 5: Projects & Project Updates ---
  console.log("\n[Category 5] Projects & Project Updates");
  await it("5.1 Project submission evaluation email formats score and rubric result", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<proj-eval-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      const res = await sendSubmissionEvaluationEmail({
        userEmail: "student_genuine@gmail.com",
        userName: "Alex Genuine",
        assessmentTitle: "Real-Time Collaborative Code Editor",
        assessmentType: "project",
        score: 92,
        maxScore: 100,
        percentage: 92,
        verdict: "PASSED",
        reportUrl: "/assessment-report/proj_session_456",
      });
      assert.strictEqual(res.success, true);
      assert.ok(captured);
      assert.ok(captured.subject.includes("Real-Time Collaborative Code Editor"));
      assert.ok(captured.html.includes("92%"));
      assert.ok(captured.html.includes("PASSED"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  // --- Category 6: Certifications & Certificate Awards ---
  console.log("\n[Category 6] Certifications & Certificate Awards");
  await it("6.1 Certified student receives official certificate award email with verification ID", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<cert-award-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      const res = await sendCertificateAwardedEmail({
        candidateEmail: "student_genuine@gmail.com",
        candidateName: "Alex Genuine",
        certTitle: "Full-Stack Software Engineering Professional",
        certificateId: "MZ-CERT-2026-9876",
        score: 96,
      });
      assert.strictEqual(res.success, true);
      assert.ok(captured);
      assert.ok(captured.subject.includes("Certificate") && captured.subject.includes("MZ-CERT-2026-9876"));
      assert.ok(captured.html.includes("MZ-CERT-2026-9876"));
      assert.ok(captured.html.includes("Full-Stack Software Engineering Professional"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  // --- Category 7: Meetings & Invitations ---
  console.log("\n[Category 7] Meetings, Study Rooms & Live Collaboration");
  await it("7.1 Meeting invitation dispatches interactive link with host details", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<meeting-inv-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      const res = await sendMeetingInvitationEmail({
        toEmail: "student_genuine@gmail.com",
        meetingId: "MZ-ROOM-404",
        meetingTitle: "System Architecture & Scalability Study Group",
        hostName: "Senior Architect",
        hostEmail: "architect@masteryzone.com",
        joinUrl: "https://mastery-zone.onrender.com/meeting/MZ-ROOM-404?inviteToken=testtoken",
        customNote: "Please review the database partitioning notes before our live session.",
      });
      assert.strictEqual(res.success, true);
      assert.ok(captured);
      assert.ok(captured.subject.includes("System Architecture & Scalability Study Group"));
      assert.ok(captured.html.includes("MZ-ROOM-404"));
      assert.ok(captured.html.includes("Please review the database partitioning notes"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  // --- Category 8: Admin Announcements & Account Notifications ---
  console.log("\n[Category 8] Admin Announcements & Important Account Notifications");
  await it("8.1 Admin announcement email delivers broadcast message to community", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<announcement-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      const res = await sendAnnouncementEmail({
        toEmail: "student_genuine@gmail.com",
        userName: "Alex Genuine",
        title: "Platform Maintenance & Upcoming Hackathon",
        message: "We will be rolling out compiler updates on Saturday. Join us for our 48-hour algorithmic hackathon starting Sunday!",
        announcementType: "event",
      });
      assert.strictEqual(res.success, true);
      assert.ok(captured);
      assert.ok(captured.subject.includes("Platform Maintenance & Upcoming Hackathon"));
      assert.ok(captured.html.includes("algorithmic hackathon"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  await it("8.2 Account status change notification informs user of suspension or reactivation", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<status-notice-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      // Suspension email
      const suspRes = await sendAccountNotificationEmail({
        toEmail: "student_genuine@gmail.com",
        userName: "Alex Genuine",
        changeType: "status",
        statusText: "Suspended",
        reason: "Multiple suspicious proctoring alerts detected during certification exam.",
      });
      assert.strictEqual(suspRes.success, true);
      assert.ok(captured);
      assert.ok(captured.subject.includes("status"));
      assert.ok(captured.html.includes("Suspended"));
      assert.ok(captured.html.includes("suspicious proctoring alerts"));

      // Reactivation email
      captured = null;
      const reactRes = await sendAccountNotificationEmail({
        toEmail: "student_genuine@gmail.com",
        userName: "Alex Genuine",
        changeType: "status",
        statusText: "Active",
      });
      assert.strictEqual(reactRes.success, true);
      assert.ok(captured);
      assert.ok(captured.html.includes("reactivated") || captured.html.includes("restored"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  await it("8.3 Role update notification informs user of new privileges", async () => {
    let captured = null;
    const origTransport = nodemailer.createTransport;
    nodemailer.createTransport = () => ({
      verify: (cb) => cb(null, true),
      sendMail: (opts, cb) => {
        captured = opts;
        cb(null, { accepted: [opts.to], rejected: [], messageId: "<role-notice-123@masteryzone.com>", response: "250 OK" });
      },
    });
    resetTransporter();

    try {
      const roleRes = await sendAccountNotificationEmail({
        toEmail: "student_genuine@gmail.com",
        userName: "Alex Genuine",
        changeType: "role",
        role: "mentor",
      });
      assert.strictEqual(roleRes.success, true);
      assert.ok(captured);
      assert.ok(captured.subject.includes("mentor"));
      assert.ok(captured.html.includes("mentor"));
    } finally {
      nodemailer.createTransport = origTransport;
      resetTransporter();
    }
  });

  // --- Category 9: Brevo SMTP / API Fallback & Settings ---
  console.log("\n[Category 9] Brevo SMTP & Multi-Provider Architecture");
  await it("9.1 Brevo SMTP relay configuration detects port 587 and requireTLS", () => {
    const origHost = process.env.SMTP_HOST;
    const origPort = process.env.SMTP_PORT;
    const origUser = process.env.SMTP_EMAIL;
    const origPass = process.env.SMTP_PASSWORD;

    try {
      process.env.SMTP_HOST = "smtp-relay.brevo.com";
      delete process.env.SMTP_PORT;
      process.env.SMTP_EMAIL = "brevo-user@masteryzone.com";
      process.env.SMTP_PASSWORD = "brevo-secure-smtp-key";

      const cfg = getSmtpConfig();
      assert.strictEqual(cfg.host, "smtp-relay.brevo.com");
      assert.strictEqual(cfg.port, 587, "Brevo SMTP relay should default to STARTTLS port 587");
      assert.strictEqual(cfg.secure, false, "Port 587 must use STARTTLS (secure: false)");
      assert.strictEqual(cfg.isConfigured, true);
    } finally {
      if (origHost) process.env.SMTP_HOST = origHost; else delete process.env.SMTP_HOST;
      if (origPort) process.env.SMTP_PORT = origPort; else delete process.env.SMTP_PORT;
      if (origUser) process.env.SMTP_EMAIL = origUser; else delete process.env.SMTP_EMAIL;
      if (origPass) process.env.SMTP_PASSWORD = origPass; else delete process.env.SMTP_PASSWORD;
    }
  });

  console.log("\n================================================================================");
  console.log(`Summary: ${passed}/${total} Web-Activity Email Audit Tests Passed (100%)`);
  console.log("================================================================================\n");

  process.exit(0);
}

runAuditSuite().catch((err) => {
  console.error("Audit suite fatal error:", err);
  process.exit(1);
});
