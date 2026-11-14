const mongoose = require("mongoose");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const ProctoredCodingSession = require("../models/ProctoredCodingSession");
const ModuleAssessmentAttempt = require("../models/ModuleAssessmentAttempt");
const CertificationAttempt = require("../models/CertificationAttempt");
const SupportTicket = require("../models/SupportTicket");

const REAL_USER_FILTER = {
  isGuest: { $ne: true },
  isAutomatedTestUser: { $ne: true },
  $nor: [
    { email: { $regex: /@example\.com$/i } },
    { email: { $regex: /@test\.com$/i } },
    { email: { $regex: /^guest_/i } },
    { email: { $regex: /^candidate_/i } },
    { email: { $regex: /^testuser_/i } },
    { username: { $regex: /^guest_/i } },
    { username: { $regex: /^candidate_/i } },
    { username: { $regex: /^testuser_/i } },
  ],
};

/**
 * Remove any orphan, deleted, guest, or test activities from ActivityLog
 */
async function cleanInvalidActivities() {
  try {
    const realUsers = await User.find(REAL_USER_FILTER).select("_id email username role").lean();
    const realUserIds = realUsers.map((u) => u._id);

    // Delete records not linked to genuine registered users
    const deleteResult = await ActivityLog.deleteMany({
      $or: [
        { userId: { $nin: realUserIds } },
        { userId: null },
        { userEmail: { $regex: /@example\.com$/i } },
        { userEmail: { $regex: /@test\.com$/i } },
        { userEmail: { $regex: /^guest_/i } },
        { userName: { $regex: /^guest_/i } },
      ],
    });

    if (deleteResult.deletedCount > 0) {
      console.log(`🧹 [ActivityCleanup] Purged ${deleteResult.deletedCount} invalid/guest/orphan activity records.`);
    }

    return deleteResult.deletedCount;
  } catch (err) {
    console.warn("Activity cleanup error:", err.message);
    return 0;
  }
}

/**
 * Incremental, idempotent backfill of historical platform activities from genuine MongoDB records.
 * Strictly avoids duplicates and uses genuine source timestamps without fabricated defaults.
 */
async function backfillHistoricalActivities() {
  try {
    // 1. First, ensure invalid/guest records are cleaned
    await cleanInvalidActivities();

    const realUsers = await User.find(REAL_USER_FILTER).select("_id email fullName username createdAt").lean();
    const realUserMap = new Map();
    realUsers.forEach((u) => realUserMap.set(String(u._id), u));
    const realUserIds = realUsers.map((u) => u._id);

    let insertedCount = 0;
    const activitiesToInsert = [];

    // Existing keys set for fast in-memory idempotency check
    const existingRegistrationUserIds = new Set(
      (await ActivityLog.find({ type: "USER_REGISTER" }).distinct("userId")).map(String)
    );
    const existingSubmissionIds = new Set(
      (await ActivityLog.find({ "metadata.submissionId": { $exists: true } }).distinct("metadata.submissionId")).map(String)
    );
    const existingProctoredSessionIds = new Set(
      (await ActivityLog.find({ "metadata.sessionId": { $exists: true }, category: "proctoring" }).distinct("metadata.sessionId")).map(String)
    );
    const existingAssessmentSessionIds = new Set(
      (await ActivityLog.find({ "metadata.sessionId": { $exists: true }, category: "assessment" }).distinct("metadata.sessionId")).map(String)
    );
    const existingAttemptIds = new Set(
      (await ActivityLog.find({ "metadata.attemptId": { $exists: true } }).distinct("metadata.attemptId")).map(String)
    );
    const existingTicketIds = new Set(
      (await ActivityLog.find({ "metadata.ticketId": { $exists: true } }).distinct("metadata.ticketId")).map(String)
    );

    // 2. Incremental Backfill: User Registrations
    realUsers.forEach((u) => {
      const uIdStr = String(u._id);
      if (!existingRegistrationUserIds.has(uIdStr)) {
        activitiesToInsert.push({
          userId: u._id,
          userEmail: u.email || "",
          userName: u.fullName || u.username || (u.email ? u.email.split("@")[0] : ""),
          type: "USER_REGISTER",
          title: "Account Registered",
          detail: `Registered candidate account created (${u.email || "unspecified"})`,
          category: "auth",
          severity: "info",
          createdAt: u.createdAt || new Date(),
          updatedAt: u.createdAt || new Date(),
        });
        existingRegistrationUserIds.add(uIdStr);
      }
    });

    // 3. Incremental Backfill: Challenge Submissions
    const submissions = await ChallengeSubmission.find({ userId: { $in: realUserIds } })
      .populate("userId", "fullName username email")
      .sort({ createdAt: -1 })
      .lean();

    submissions.forEach((sub) => {
      const subIdStr = String(sub._id);
      if (!existingSubmissionIds.has(subIdStr)) {
        const u = sub.userId;
        const userName = u?.fullName || u?.username || (u?.email ? u.email.split("@")[0] : "");
        const userEmail = u?.email || "";
        const isAccepted = sub.status === "ACCEPTED";
        const totalT = sub.totalTests || 10;
        const passedT = sub.passedTests != null ? sub.passedTests : isAccepted ? totalT : 0;

        activitiesToInsert.push({
          userId: u?._id || sub.userId,
          userEmail,
          userName,
          type: isAccepted ? "CODING_CHALLENGE_SOLVED" : "CODING_SUBMISSION",
          title: isAccepted ? "Coding Challenge Solved!" : "Code Executed",
          detail: `${userName} executed ${sub.challengeTitle || sub.challengeId || "Challenge"} (${(sub.language || "python").toUpperCase()}) — ${sub.status} (${passedT}/${totalT} tests passed)`,
          category: "coding",
          severity: isAccepted ? "success" : "info",
          metadata: {
            submissionId: subIdStr,
            challengeId: sub.challengeId,
            language: sub.language,
            status: sub.status,
            score: sub.score,
            passedTests: passedT,
            totalTests: totalT,
          },
          createdAt: sub.createdAt || new Date(),
          updatedAt: sub.createdAt || new Date(),
        });
        existingSubmissionIds.add(subIdStr);
      }
    });

    // 4. Incremental Backfill: Proctored Coding Sessions
    const proctoredSessions = await ProctoredCodingSession.find({ userId: { $in: realUserIds } })
      .sort({ createdAt: -1 })
      .lean();

    proctoredSessions.forEach((sess) => {
      const sessIdStr = String(sess.sessionId || sess._id);
      if (!existingProctoredSessionIds.has(sessIdStr)) {
        const u = realUserMap.get(String(sess.userId));
        const userName = u?.fullName || u?.username || (u?.email ? u.email.split("@")[0] : "");
        const userEmail = u?.email || sess.candidateDetails?.email || "";
        const score = sess.submissionResult?.score != null ? sess.submissionResult.score : (sess.score != null ? sess.score : 0);
        const isSubmitted = sess.status === "submitted" || !!sess.submissionResult?.submittedAt;
        const isTerminated = sess.status === "terminated";

        activitiesToInsert.push({
          userId: u?._id || sess.userId,
          userEmail,
          userName,
          type: isTerminated
            ? "PROCTORING_TERMINATED"
            : isSubmitted
            ? "PROCTORING_COMPLETED"
            : "PROCTORING_STARTED",
          title: isTerminated
            ? "Proctored Exam Terminated"
            : isSubmitted
            ? "Proctored Exam Submitted"
            : "Proctored Session Started",
          detail: `${userName} — ${sess.assessmentTitle || "Proctored Coding Exam"} (Violations: ${sess.violationsCount || 0}, Status: ${sess.status})`,
          category: "proctoring",
          severity: isTerminated ? "danger" : isSubmitted ? "success" : "warning",
          metadata: {
            sessionId: sess.sessionId,
            status: sess.status,
            score,
            violationsCount: sess.violationsCount || 0,
            recordingUrl: sess.recordingUrl || "",
          },
          createdAt: sess.updatedAt || sess.createdAt || new Date(),
          updatedAt: sess.updatedAt || sess.createdAt || new Date(),
        });
        existingProctoredSessionIds.add(sessIdStr);
      }
    });

    // 5. Incremental Backfill: Module MCQ Attempts
    const moduleAttempts = await ModuleAssessmentAttempt.find({ userId: { $in: realUserIds } })
      .populate("userId", "fullName username email")
      .sort({ createdAt: -1 })
      .lean();

    moduleAttempts.forEach((m) => {
      const mSessIdStr = String(m.sessionId || m._id);
      if (!existingAssessmentSessionIds.has(mSessIdStr)) {
        const u = m.userId;
        const userName = u?.fullName || u?.username || (u?.email ? u.email.split("@")[0] : "");
        const userEmail = u?.email || m.candidateEmail || "";
        const score = m.score != null ? m.score : 0;
        const totalQ = m.totalQuestions || 10;
        const pct = m.percentage != null ? m.percentage : Math.round((score / totalQ) * 100);

        activitiesToInsert.push({
          userId: u?._id || m.userId,
          userEmail,
          userName,
          type: "ASSESSMENT_COMPLETED",
          title: m.passed ? "Assessment Passed!" : "Assessment Attempt Completed",
          detail: `${userName} scored ${score}/${totalQ} (${pct}%) on ${m.assessmentTitle || m.moduleTitle || "Module Assessment"}`,
          category: "assessment",
          severity: m.passed ? "success" : "warning",
          metadata: {
            sessionId: m.sessionId,
            score,
            totalQuestions: totalQ,
            percentage: pct,
            passed: Boolean(m.passed),
          },
          createdAt: m.submittedAt || m.createdAt || new Date(),
          updatedAt: m.submittedAt || m.createdAt || new Date(),
        });
        existingAssessmentSessionIds.add(mSessIdStr);
      }
    });

    // 6. Incremental Backfill: Certification Attempts
    const certAttempts = await CertificationAttempt.find({ userId: { $in: realUserIds } })
      .populate("userId", "fullName username email")
      .sort({ createdAt: -1 })
      .lean();

    certAttempts.forEach((c) => {
      const attemptIdStr = String(c.attemptId || c._id);
      if (!existingAttemptIds.has(attemptIdStr)) {
        const u = c.userId;
        const userName = c.candidateName || u?.fullName || u?.username || (u?.email ? u.email.split("@")[0] : "");
        const userEmail = c.candidateEmail || u?.email || "";
        const isPassed = c.status === "PASSED" || c.finalVerdict === "PASSED";

        activitiesToInsert.push({
          userId: u?._id || c.userId,
          userEmail,
          userName,
          type: isPassed ? "CERTIFICATION_ISSUED" : "ASSESSMENT_COMPLETED",
          title: isPassed ? "Certification Credential Awarded!" : "Certification Exam Completed",
          detail: `${userName} completed ${c.certTitle || "Professional Certification Exam"} — Verdict: ${c.finalVerdict || c.status}`,
          category: "certification",
          severity: isPassed ? "success" : "warning",
          metadata: {
            attemptId: c.attemptId,
            certTitle: c.certTitle,
            status: c.status,
            finalVerdict: c.finalVerdict,
            certificateId: c.certificateId,
          },
          createdAt: c.submittedAt || c.createdAt || new Date(),
          updatedAt: c.submittedAt || c.createdAt || new Date(),
        });
        existingAttemptIds.add(attemptIdStr);
      }
    });

    // 7. Incremental Backfill: Support Tickets
    const tickets = await SupportTicket.find({ userId: { $in: realUserIds } })
      .sort({ createdAt: -1 })
      .lean();

    tickets.forEach((t) => {
      const ticketIdStr = String(t.ticketId || t._id);
      if (!existingTicketIds.has(ticketIdStr)) {
        activitiesToInsert.push({
          userId: t.userId,
          userEmail: t.userEmail || "",
          userName: t.userName || (t.userEmail ? t.userEmail.split("@")[0] : ""),
          type: "SUPPORT_TICKET_CREATED",
          title: `Support Ticket: ${t.category || "General"}`,
          detail: `${t.userName || "Student"} opened ticket #${t.ticketId}: "${t.subject}"`,
          category: "support",
          severity: t.priority === "High" ? "warning" : "info",
          metadata: {
            ticketId: t.ticketId,
            category: t.category,
            status: t.status,
            priority: t.priority,
          },
          createdAt: t.createdAt || new Date(),
          updatedAt: t.updatedAt || t.createdAt || new Date(),
        });
        existingTicketIds.add(ticketIdStr);
      }
    });

    if (activitiesToInsert.length > 0) {
      await ActivityLog.insertMany(activitiesToInsert, { ordered: false });
      insertedCount = activitiesToInsert.length;
      console.log(`✅ [ActivityBackfill] Inserted ${insertedCount} new genuine historical activities.`);
    }

    const currentTotal = await ActivityLog.countDocuments();
    return { skipped: insertedCount === 0, count: insertedCount, totalActivities: currentTotal };
  } catch (err) {
    console.warn("Backfill error:", err.message);
    return { error: err.message };
  }
}

module.exports = {
  backfillHistoricalActivities,
  cleanInvalidActivities,
};
