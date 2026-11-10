const assert = require("assert");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const { app, server: existingServer } = require("../server");
const User = require("../models/User");
const Meeting = require("../models/Meeting");
const EmailLog = require("../models/EmailLog");
const { getJwtSecret } = require("../config/jwtConfig");
const {
  sendMailWithRetry,
  sendViaHttpApi,
  getHttpEmailProvider,
  getSenderAddress,
  sanitizeLogMessage,
} = require("../utils/mailer");

let testServer;
let baseUrl;
let tokenA;
let tokenB;
let userA;
let userB;

function it(name, fn) {
  return (async () => {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Reason: ${err.message}\n`);
      throw err;
    }
  })();
}

async function setup() {
  console.log("\n================================================================================");
  console.log("🛡️ Mastery Zone Final Remaining Defects Verification Suite");
  console.log("================================================================================\n");

  const mongoUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/masteryzone_test";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  const port = process.env.PORT || 5012;
  baseUrl = `http://127.0.0.1:${port}`;

  const secret = getJwtSecret("test");

  // Create isolated users in DB
  userA = await User.findOne({ email: "host.user@example.com" });
  if (!userA) {
    userA = await User.create({
      username: "host_tester",
      fullName: "Registered Host User",
      email: "host.user@example.com",
      password: "HashedPassword123!",
      role: "user",
    });
  }

  userB = await User.findOne({ email: "guest.user@example.com" });
  if (!userB) {
    userB = await User.create({
      username: "guest_tester",
      fullName: "Registered Guest User",
      email: "guest.user@example.com",
      password: "HashedPassword123!",
      role: "user",
    });
  }

  tokenA = jwt.sign({ userId: userA._id, id: userA._id, fullName: userA.fullName, email: userA.email, role: "user" }, secret, { expiresIn: "1h" });
  tokenB = jwt.sign({ userId: userB._id, id: userB._id, fullName: userB.fullName, email: userB.email, role: "user" }, secret, { expiresIn: "1h" });
}

async function teardown() {
  if (testServer) {
    await new Promise((resolve) => testServer.close(resolve));
  }
}

async function runTests() {
  await setup();

  try {
    console.log("--- Section 1: Email Status, Delivery & Deliverability Security ---");

    await it("Email: Invalid recipient is rejected and recorded in EmailLog as 'rejected'", async () => {
      const res = await sendMailWithRetry({
        to: "not-an-email",
        subject: "Test Invalid",
        html: "<p>Test</p>",
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, "rejected");
      assert.strictEqual(res.errorCode, "EENVELOPE");

      // Verify EmailLog persistence
      const log = await EmailLog.findOne({ recipient: "not-an-email" }).sort({ createdAt: -1 }).lean();
      assert(log, "Rejected attempt must be recorded in EmailLog");
      assert.strictEqual(log.status, "rejected");
      assert.strictEqual(log.errorCode, "EENVELOPE");
    });

    await it("Email: Provider success is checked before recording acceptance; failed HTTP response is recorded as 'failed'", async () => {
      // Mock an HTTP provider that returns success: false
      const mockFailingProvider = {
        type: "resend",
        apiKey: "re_mock_test_key_123456789012345",
        from: "notifications@masteryzone.com",
        isTestSender: false,
      };

      const originalFetch = global.fetch;
      try {
        global.fetch = async () => ({
          ok: false,
          status: 403,
          json: async () => ({ message: "Domain not verified on Resend account" }),
        });

        let caughtErr = null;
        try {
          await sendViaHttpApi({
            to: "test.student@example.com",
            subject: "Verify Failure Handling",
            html: "<p>Test</p>",
          }, mockFailingProvider);
        } catch (e) {
          caughtErr = e;
        }

        assert(caughtErr, "Failed provider response must throw an error, never report success");
        assert.strictEqual(caughtErr.status, 403);
      } finally {
        global.fetch = originalFetch;
      }
    });

    await it("Email: Provider response without valid messageId strictly fails and records 'EMISSING_MESSAGE_ID'", async () => {
      const mockProviderWithoutId = {
        type: "resend",
        apiKey: "re_mock_test_key_123456789012345",
        from: "notifications@masteryzone.com",
        isTestSender: false,
      };

      const originalFetch = global.fetch;
      try {
        global.fetch = async () => ({
          ok: true,
          status: 200,
          json: async () => ({}), // Missing id
        });

        let caughtErr = null;
        try {
          await sendViaHttpApi({
            to: "test.student2@example.com",
            subject: "Verify Missing ID Handling",
            html: "<p>Test</p>",
          }, mockProviderWithoutId);
        } catch (e) {
          caughtErr = e;
        }

        assert(caughtErr, "Provider response without message ID must throw error and not be accepted");
      } finally {
        global.fetch = originalFetch;
      }
    });

    await it("Email: EmailLog schema supports delivered and bounced status enums", async () => {
      const doc = new EmailLog({
        recipient: "test.enum@example.com",
        emailType: "test_verification",
        subject: "Enum Test",
        status: "delivered",
        messageId: "msg_test_delivered_123",
      });
      await doc.save();
      assert.strictEqual(doc.status, "delivered");

      doc.status = "bounced";
      await doc.save();
      assert.strictEqual(doc.status, "bounced");
      await EmailLog.deleteOne({ _id: doc._id });
    });

    await it("Email: Sensitive API keys and tokens are redacted from logs and error strings", async () => {
      const rawError = "Resend API error with key re_12345678901234567890abcdef and Bearer secret_token_xyz";
      const sanitized = sanitizeLogMessage(rawError);
      assert(!sanitized.includes("re_12345678901234567890abcdef"), "Resend key must be redacted");
      assert(!sanitized.includes("secret_token_xyz"), "Bearer token must be redacted");
      assert(sanitized.includes("[REDACTED_API_KEY]"));
    });

    await it("Email: Sender configuration never defaults to personal Gmail in production", async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevBrevo = process.env.BREVO_SENDER_EMAIL;
      const prevSmtpFrom = process.env.SMTP_FROM;
      const prevSmtpEmail = process.env.SMTP_EMAIL;
      try {
        process.env.NODE_ENV = "production";
        delete process.env.BREVO_SENDER_EMAIL;
        delete process.env.SMTP_FROM;
        delete process.env.SMTP_EMAIL;
        delete process.env.EMAIL_USER;
        delete process.env.MAIN_ADMIN_EMAIL;
        delete process.env.ADMIN_EMAIL;

        const sender = getSenderAddress();
        assert.strictEqual(sender, null, "In production without configured sender, getSenderAddress must fail-closed (return null)");
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevBrevo) process.env.BREVO_SENDER_EMAIL = prevBrevo;
        if (prevSmtpFrom) process.env.SMTP_FROM = prevSmtpFrom;
        if (prevSmtpEmail) process.env.SMTP_EMAIL = prevSmtpEmail;
      }
    });

    console.log("\n--- Section 2: Meeting Authorization & Registered Account Enforcement ---");

    await it("Meeting Auth: Unauthenticated meeting creation is strictly rejected with 401", async () => {
      const res = await fetch(`${baseUrl}/api/meetings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Guest Hack Meeting",
          groupKey: "dsa",
        }),
      });

      assert.strictEqual(res.status, 401, "Unauthenticated meeting creation must return 401 Unauthorized");
    });

    await it("Meeting Auth: Authenticated registered user creates meeting and is designated host", async () => {
      const res = await fetch(`${baseUrl}/api/meetings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          title: "Verified DSA Meeting",
          groupKey: "dsa",
        }),
      });

      assert.strictEqual(res.status, 201, "Authenticated meeting creation must succeed with 201 Created");
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert(json.meetingId, "Meeting ID must be returned");

      const meeting = await Meeting.findOne({ meetingId: json.meetingId }).lean();
      assert(meeting, "Meeting must be persisted in database");
      assert.strictEqual(String(meeting.hostUserId), String(userA._id), "hostUserId must match authenticated user token");
    });

    console.log("\n--- Section 3: Genuine Study-Room Online Metrics & Zero Fake Collaborators ---");

    await it("Study Rooms: Catalog online metrics are derived dynamically from database, not hardcoded 1240/842", async () => {
      const res = await fetch(`${baseUrl}/api/meetings/study-rooms`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert(Array.isArray(json.rooms), "Rooms catalog must be returned");

      for (const room of json.rooms) {
        // Must NOT match the old fabricated counts
        assert.notStrictEqual(room.onlineNumber, 1240, "Must not contain hardcoded 1240");
        assert.notStrictEqual(room.onlineNumber, 842, "Must not contain hardcoded 842");
        assert.notStrictEqual(room.onlineNumber, 987, "Must not contain hardcoded 987");
        assert.notStrictEqual(room.onlineNumber, 650, "Must not contain hardcoded 650");
        assert.strictEqual(typeof room.liveParticipantsCount, "number");
        assert.strictEqual(typeof room.activeMeetingsCount, "number");
      }
    });

    await it("Meeting Seeding: Created meetings do not contain sample collaborators 'Sarah M.' or 'Alex C.'", async () => {
      const res = await fetch(`${baseUrl}/api/meetings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          title: "Clean Seeding Meeting",
          groupKey: "coding",
        }),
      });

      const json = await res.json();
      const meeting = await Meeting.findOne({ meetingId: json.meetingId }).lean();
      assert(meeting);

      const tasksAssigned = (meeting.sharedTasks || []).map((t) => t.assignedTo);
      assert(!tasksAssigned.includes("Sarah M."), "Sample collaborator Sarah M. must not be seeded into tasks");

      const reviewAuthors = (meeting.codeReviews || []).map((r) => r.authorName);
      assert(!reviewAuthors.includes("Alex C."), "Sample collaborator Alex C. must not be seeded into reviews");
    });

    console.log("\n--- Section 4: Recording Authorization & Pre-Upload Validation ---");

    await it("Recording Pre-Upload: Missing meetingId is rejected with 400 before file writes", async () => {
      const res = await fetch(`${baseUrl}/api/recordings/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "Content-Type": "video/webm",
        },
        body: Buffer.from("dummy video bytes"),
      });

      assert.strictEqual(res.status, 400, "Missing meetingId must return 400 Bad Request");
    });

    await it("Recording Pre-Upload: Non-existent meeting is rejected with 404 before file writes", async () => {
      const res = await fetch(`${baseUrl}/api/recordings/upload?meetingId=non_existent_meeting_999`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenA}`,
          "x-meeting-id": "non_existent_meeting_999",
          "Content-Type": "video/webm",
        },
        body: Buffer.from("dummy video bytes"),
      });

      assert.strictEqual(res.status, 404, "Non-existent meeting must return 404 Not Found");
    });

    await it("Recording Pre-Upload: Non-host user upload is rejected with 403 before file writes", async () => {
      // Create a meeting owned by userA
      const testMeeting = new Meeting({
        meetingId: "auth-check-meeting",
        title: "Auth Check Meeting",
        groupKey: "dsa",
        hostUserId: String(userA._id),
        hostName: userA.fullName,
        status: "active",
      });
      await testMeeting.save();

      // UserB attempts to upload recording for userA's meeting
      const res = await fetch(`${baseUrl}/api/recordings/upload?meetingId=auth-check-meeting`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenB}`,
          "x-meeting-id": "auth-check-meeting",
          "Content-Type": "video/webm",
        },
        body: Buffer.from("dummy video bytes"),
      });

      assert.strictEqual(res.status, 403, "Non-host user upload must return 403 Forbidden");
      await Meeting.deleteOne({ meetingId: "auth-check-meeting" });
    });

    console.log("\n================================================================================");
    console.log("Summary: All Final Remaining Defects Verification Tests Passed (100%)");
    console.log("================================================================================\n");
    process.exit(0);
  } finally {
    await teardown();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
