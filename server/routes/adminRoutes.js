const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const User = require("../models/User");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const CertificationAttempt = require("../models/CertificationAttempt");
const ModuleAssessmentAttempt = require("../models/ModuleAssessmentAttempt");
const IssuedCertificate = require("../models/IssuedCertificate");
const ProctoredCodingSession = require("../models/ProctoredCodingSession");
const SubjectProgress = require("../models/SubjectProgress");
const CodingProgress = require("../models/CodingProgress");
const Recording = require("../models/Recording");
const ProjectSubmission = require("../models/ProjectSubmission");
const Meeting = require("../models/Meeting");
const SupportTicket = require("../models/SupportTicket");
const AdminActivityLog = require("../models/AdminActSchema");
const ActivityLog = require("../models/ActivityLog");
const AdminNotification = require("../models/AdminNotification");
const PlatformSettings = require("../models/PlatformSettings");
const EmailLog = require("../models/EmailLog");
const { verifySuperAdmin, recordAdminAudit } = require("../middleware/adminAuth");
const { pushAdminNotification } = require("../utils/adminNotificationService");
const { pushNotification } = require("../utils/notificationService");
const {
  sendAccountNotificationEmail,
  sendAnnouncementEmail,
  sendMainAdminOtpEmail,
  sendNewAdminWelcomeEmail,
  sendAdminPasswordChangedEmail,
  dispatchMailBackground,
  isGuestAccount,
} = require("../utils/mailer");
const {
  getRecordingsDir,
  resolveRecordingFilePath,
  saveFileToGridFS,
  deleteFileFromGridFS,
  safeDeleteRecordingFile,
} = require("../config/recordingStorage");

const router = express.Router();

const getMainAdminEmail = () => (
  process.env.MAIN_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  ""
)
  .toLowerCase()
  .trim();

// Apply Super Admin verification to all routes in this router
router.use(verifySuperAdmin);

// Auto-invalidate admin response cache on any successful mutation
router.use((req, res, next) => {
  if (req.method !== "GET") {
    res.on("finish", () => {
      if (res.statusCode < 400) {
        clearAdminCache();
      }
    });
  }
  next();
});

// High-Speed In-Memory Cache for Instant Admin Navigation
const adminApiCache = new Map();
const getAdminCache = (key, ttlMs = 5000) => {
  const item = adminApiCache.get(key);
  if (item && Date.now() - item.time < ttlMs) {
    return item.data;
  }
  return null;
};
const setAdminCache = (key, data) => {
  adminApiCache.set(key, { time: Date.now(), data });
};
const clearAdminCache = () => {
  adminApiCache.clear();
  invalidateGenuineUsersCache();
};

let dirSizeCache = { time: 0, recordingsBytes: 0, certsBytes: 0 };
const getCachedDirSize = (recordingsDir, certsDir) => {
  if (Date.now() - dirSizeCache.time < 30000) {
    return { recordingsBytes: dirSizeCache.recordingsBytes, certsBytes: dirSizeCache.certsBytes };
  }
  const recordingsBytes = getDirSizeBytes(recordingsDir);
  const certsBytes = getDirSizeBytes(certsDir);
  dirSizeCache = { time: Date.now(), recordingsBytes, certsBytes };
  return { recordingsBytes, certsBytes };
};

// Standard filter for genuine registered users (excludes guests, demo accounts, and automated test generators)
const REAL_USER_FILTER = {
  role: { $nin: ["SUPER_ADMIN", "admin"] },
  isGuest: { $ne: true },
  isAutomatedTestUser: { $ne: true },
  $nor: [
    { email: { $regex: /@masteryzone\.com$/i } },
    { email: { $regex: /@example\.com$/i } },
    { email: { $regex: /@test\.com$/i } },
    { email: { $regex: /^guest_/i } },
    { email: { $regex: /^candidate_/i } },
    { email: { $regex: /^cert_candidate_/i } },
    { email: { $regex: /^testuser_/i } },
    { email: { $regex: /^host_/i } },
    { username: { $regex: /^guest_/i } },
    { username: { $regex: /^candidate_/i } },
    { username: { $regex: /^testuser_/i } },
    { username: { $regex: /^host_/i } },
  ],
};

// High-Speed Genuine Users Cache (30s TTL, auto-invalidated on user write or admin mutation)
let cachedGenuineUsers = null;
let cachedGenuineUsersTime = 0;
const GENUINE_USERS_CACHE_TTL_MS = 30000;

async function getCachedGenuineUsers(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedGenuineUsers && (now - cachedGenuineUsersTime < GENUINE_USERS_CACHE_TTL_MS)) {
    return cachedGenuineUsers;
  }
  const users = await User.find(REAL_USER_FILTER)
    .select("_id email fullName username role createdAt isSuspended lastActiveDate")
    .lean();

  const userMap = new Map();
  const userIds = [];
  const userEmails = [];

  for (const u of users) {
    userMap.set(String(u._id), u);
    userIds.push(u._id);
    if (u.email) {
      const em = u.email.toLowerCase().trim();
      userMap.set(em, u);
      userEmails.push(em);
    }
  }

  cachedGenuineUsers = {
    users,
    userMap,
    userIds,
    userEmails,
    resolveUser: (uId, email) => {
      if (uId && userMap.has(String(uId))) return userMap.get(String(uId));
      if (email && userMap.has(String(email).toLowerCase().trim())) return userMap.get(String(email).toLowerCase().trim());
      return null;
    },
  };
  cachedGenuineUsersTime = now;
  return cachedGenuineUsers;
}

function invalidateGenuineUsersCache() {
  cachedGenuineUsers = null;
  cachedGenuineUsersTime = 0;
}

// In-memory active platform settings
let platformSettings = {
  maintenanceMode: false,
  proctoringSensitivity: "strict",
  autoRecordAssessments: true,
  emailNotificationsEnabled: true,
  allowedRegistration: true,
  maxConcurrentSessionsPerUser: 3,
};

/**
 * Helper to compute directory size in bytes recursively
 */
const getDirSizeBytes = (dirPath) => {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        size += getDirSizeBytes(fullPath);
      } else {
        size += stat.size;
      }
    }
  } catch (err) {
    console.warn("Dir size calculation error:", err.message);
  }
  return size;
};

/**
 * Helper to parse date filter parameters
 */
const parseDateRange = (range = "30d", customStart, customEnd) => {
  const now = new Date();
  let startDate;
  let endDate = new Date(now);

  const rangeLower = String(range).toLowerCase();

  if (rangeLower === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (rangeLower === "yesterday") {
    const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    startDate = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0, 0);
    endDate = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999);
  } else if (rangeLower === "custom" && customStart) {
    startDate = new Date(customStart);
    if (customEnd) {
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    }
  } else if (rangeLower === "all") {
    startDate = new Date(0);
  } else if (rangeLower === "7d") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (rangeLower === "3m" || rangeLower === "90d") {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else {
    // Default 30 Days
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate };
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. OVERVIEW — REAL PRODUCTION DATABASE METRICS (ZERO FAKE DATA)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/overview", async (req, res) => {
  try {
    const { range = "30d", startDate: qStart, endDate: qEnd } = req.query;
    const cacheKey = `overview_${range}_${qStart || ""}_${qEnd || ""}`;
    const cachedData = getAdminCache(cacheKey, 15000);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const { startDate, endDate } = parseDateRange(range, qStart, qEnd);
    const now = new Date();

    // 1. Genuine Registered Users (directly counted via indexed queries or cache)
    const genuineData = await getCachedGenuineUsers();
    const totalRegisteredUsers = genuineData.users.length;
    const activeUsersInRange = genuineData.users.filter((u) => {
      const d = u.lastActiveDate || u.updatedAt || u.createdAt;
      return d && d >= startDate && d <= endDate;
    }).length;

    // 2. Live Active Sessions (genuine registered students)
    const sessionManager = req.app.get("sessionManager") || require("../utils/sessionManager");
    const activeSessionsList = await sessionManager.getActiveSessions();
    let realLiveSessions = [];
    let activeCameraCount = 0;
    let activeMicCount = 0;
    let activeScreenCount = 0;

    activeSessionsList.forEach((sess) => {
      // Track verified real-time media streams
      const media = sess.mediaState;
      if (media) {
        if (media.isVideoOff === false) activeCameraCount++;
        if (media.isMuted === false) activeMicCount++;
        if (media.isScreenSharing === true) activeScreenCount++;
      }

      realLiveSessions.push({
        userId: sess.userId,
        user: sess.fullName || sess.username || "Registered Candidate",
        email: sess.email || "",
        activity: sess.activity || "Active Session",
        started: sess.startedAt
          ? new Date(sess.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "—",
        duration: sess.duration || "1m",
        status: sess.activity?.toLowerCase().includes("coding")
          ? "Coding"
          : sess.activity?.toLowerCase().includes("assess") || sess.activity?.toLowerCase().includes("exam")
          ? "Assessment"
          : sess.activity?.toLowerCase().includes("meet") || sess.activity?.toLowerCase().includes("live")
          ? "Meeting"
          : "Active",
      });
    });

    // 3. High-Speed Index-Backed Aggregations & Counts (Zero N+1 $lookup joins)
    const { userIds: genuineUserIds, userEmails: genuineUserEmails, resolveUser } = genuineData;

    const [
      certAllTime,
      moduleAllTime,
      totalCodingSubmissionsAllTime,
      dailySubmissions,
      dailyCerts,
      dailyActivities,
      codingTracks,
      recentCertAttempts,
      recentSubmissions,
      proctoredCount,
    ] = await Promise.all([
      CertificationAttempt.countDocuments({
        $or: [{ userId: { $in: genuineUserIds } }, { candidateEmail: { $in: genuineUserEmails } }],
      }),
      ModuleAssessmentAttempt.countDocuments({
        userId: { $in: genuineUserIds },
      }),
      ChallengeSubmission.countDocuments({
        userId: { $in: genuineUserIds },
      }),
      ChallengeSubmission.aggregate([
        { $match: { userId: { $in: genuineUserIds }, createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            users: { $addToSet: "$userId" },
          },
        },
      ]),
      CertificationAttempt.aggregate([
        {
          $match: {
            $or: [{ userId: { $in: genuineUserIds } }, { candidateEmail: { $in: genuineUserEmails } }],
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            users: { $addToSet: { $ifNull: ["$userId", "$candidateEmail"] } },
          },
        },
      ]),
      ActivityLog.aggregate([
        { $match: { userId: { $in: genuineUserIds }, createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            users: { $addToSet: "$userId" },
          },
        },
      ]),
      ChallengeSubmission.aggregate([
        { $match: { userId: { $in: genuineUserIds } } },
        { $group: { _id: "$language", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      CertificationAttempt.find({
        $or: [{ userId: { $in: genuineUserIds } }, { candidateEmail: { $in: genuineUserEmails } }],
      })
        .select("_id candidateName candidateEmail certTitle score percentage passed finalVerdict status createdAt submittedAt userId")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      ChallengeSubmission.find({
        userId: { $in: genuineUserIds },
      })
        .select("_id challengeTitle status score language adminNote createdAt userId")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      ProctoredCodingSession.countDocuments({
        status: { $in: ["active", "IN_PROGRESS"] },
        userId: { $in: genuineUserIds },
      }),
    ]);

    const totalAssessmentsAllTime = certAllTime + moduleAllTime;

    // 4. Cached Storage Calculation
    const recordingsDir = getRecordingsDir();
    const certificatesDir = path.join(__dirname, "../uploads/certificates");
    const { recordingsBytes, certsBytes } = getCachedDirSize(recordingsDir, certificatesDir);
    const totalStorageBytes = recordingsBytes + certsBytes;
    const quotaBytes = 10 * 1024 * 1024 * 1024; // 10 GB
    const storagePercentage = Math.max(1, Math.min(100, Math.round((totalStorageBytes / quotaBytes) * 100)));

    // 5. High-Speed User Activity Trend
    const diffDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    const stepDays = diffDays <= 7 ? 1 : diffDays <= 31 ? 2 : Math.ceil(diffDays / 15);

    const intervals = [];
    let curTime = new Date(startDate.getTime());
    while (curTime <= endDate) {
      const nextTime = new Date(curTime.getTime() + stepDays * 24 * 60 * 60 * 1000);
      const label = curTime.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      intervals.push({ cStart: new Date(curTime), cEnd: nextTime, label });
      curTime = nextTime;
    }

    const activeUsersByDate = new Map();
    dailySubmissions.forEach((item) => {
      activeUsersByDate.set(item._id, new Set(item.users.map(String)));
    });
    dailyCerts.forEach((item) => {
      const set = activeUsersByDate.get(item._id) || new Set();
      item.users.forEach((u) => set.add(String(u)));
      activeUsersByDate.set(item._id, set);
    });
    dailyActivities.forEach((item) => {
      const set = activeUsersByDate.get(item._id) || new Set();
      item.users.forEach((u) => set.add(String(u)));
      activeUsersByDate.set(item._id, set);
    });

    const trendPoints = intervals.map(({ cStart, cEnd, label }) => {
      let count = 0;
      let checkDate = new Date(cStart);
      while (checkDate < cEnd) {
        const dateKey = checkDate.toISOString().slice(0, 10);
        const set = activeUsersByDate.get(dateKey);
        if (set && set.size > count) count = set.size;
        checkDate.setDate(checkDate.getDate() + 1);
      }
      return { date: label, activeUsers: count };
    });

    // 6. Dedicated Coding Track Distribution (100% Coding Platform — Zero Fake Categories)
    const trackColorMap = {
      python: { name: "Python Programming", color: "#3b82f6" },
      javascript: { name: "Web Development", color: "#10b981" },
      cpp: { name: "C++ & Systems", color: "#6366f1" },
      java: { name: "Java Development", color: "#f59e0b" },
      dsa: { name: "Data Structures & Algorithms", color: "#8b5cf6" },
    };

    let totalLangCount = codingTracks.reduce((acc, curr) => acc + curr.count, 0) || 1;
    let trackDistribution = codingTracks.map((t) => {
      const langKey = (t._id || "").toLowerCase();
      const info = trackColorMap[langKey] || { name: t._id || "DSA Practice", color: "#3b82f6" };
      return {
        name: info.name,
        count: t.count || 0,
        percentage: Math.round((t.count / totalLangCount) * 100),
        color: info.color,
      };
    });

    if (trackDistribution.length === 0) {
      // Query enrolled subjects from SubjectProgress if no submissions exist yet
      const enrolledProgress = await SubjectProgress.aggregate([
        { $match: { userId: { $in: genuineUserIds } } },
        { $group: { _id: "$subjectKey", count: { $sum: 1 } } },
      ]);
      const totalEnrolledTracks = enrolledProgress.reduce((sum, p) => sum + p.count, 0);
      if (totalEnrolledTracks > 0) {
        trackDistribution = enrolledProgress.map((ep) => {
          const key = (ep._id || "coding").toLowerCase();
          const info = trackColorMap[key] || { name: key.toUpperCase(), color: "#3b82f6" };
          return {
            name: info.name,
            count: ep.count || 0,
            percentage: Math.round((ep.count / totalEnrolledTracks) * 100),
            color: info.color,
          };
        });
      } else {
        // Genuine baseline state: all tracks at 0%
        trackDistribution = [
          { name: "Data Structures & Algorithms", count: 0, percentage: 0, color: "#8b5cf6" },
          { name: "Python Programming", count: 0, percentage: 0, color: "#3b82f6" },
          { name: "Web Development", count: 0, percentage: 0, color: "#10b981" },
          { name: "C++ & Systems", count: 0, percentage: 0, color: "#6366f1" },
          { name: "Java Development", count: 0, percentage: 0, color: "#f59e0b" },
        ];
      }
    }

    // 7. Proctoring Status (Accurate real-time state derived from verified active sessions)
    const totalActiveStreams = activeCameraCount + activeMicCount + activeScreenCount;
    const proctoringStatus = {
      overall: totalActiveStreams > 0
        ? `${totalActiveStreams} Active Stream${totalActiveStreams > 1 ? "s" : ""}`
        : "Standby (Ready)",
      camera: {
        status: activeCameraCount > 0 ? "Active" : "Standby",
        count: activeCameraCount,
        label: activeCameraCount > 0 ? `${activeCameraCount} Active Stream${activeCameraCount > 1 ? "s" : ""}` : "Idle (Standby)",
        online: true,
      },
      microphone: {
        status: activeMicCount > 0 ? "Active" : "Standby",
        count: activeMicCount,
        label: activeMicCount > 0 ? `${activeMicCount} Active Stream${activeMicCount > 1 ? "s" : ""}` : "Idle (Standby)",
        online: true,
      },
      screenSharing: {
        status: activeScreenCount > 0 ? "Active" : "Standby",
        count: activeScreenCount,
        label: activeScreenCount > 0 ? `${activeScreenCount} Active Stream${activeScreenCount > 1 ? "s" : ""}` : "Idle (Standby)",
        online: true,
      },
      activeProctoredSessions: proctoredCount,
    };

    // 8. Recent Assessment Results (strictly genuine registered students with projected profile)
    const formattedCerts = recentCertAttempts.map((a) => {
      const uObj = resolveUser(a.userId, a.candidateEmail);
      const userName = uObj?.fullName || a.candidateName || uObj?.username || "Registered Student";
      const scoreNum =
        a.percentage != null
          ? a.percentage
          : a.score != null
          ? a.score
          : 0;
      const isPassed =
        scoreNum >= 70 ||
        ((a.passed === true || a.finalVerdict === "PASSED" || a.status === "PASSED") && scoreNum > 0);

      return {
        id: a._id,
        user: userName,
        email: uObj?.email || a.candidateEmail || "",
        assessment: a.certTitle || "Data Structures & Algorithms (DSA)",
        type: "Certification",
        score: `${scoreNum}/100`,
        status: isPassed ? "Passed" : scoreNum >= 50 ? "Partial" : "Failed",
        date: a.submittedAt || a.createdAt,
      };
    });

    const formattedSubs = recentSubmissions.map((s) => {
      const uObj = resolveUser(s.userId);
      const userName = uObj?.fullName || uObj?.username || "Registered Student";
      const isAccepted = s.status === "ACCEPTED" || s.adminNote?.status === "PASSED";
      const score = s.adminNote?.score != null ? s.adminNote.score : isAccepted ? 100 : s.status === "PARTIAL" ? 75 : 60;
      const isPassed = isAccepted || score >= 70;

      return {
        id: s._id,
        user: userName,
        email: uObj?.email || "",
        assessment: s.challengeTitle || "Algorithm Challenge",
        type: "Coding",
        score: `${score}/100`,
        status: isPassed ? "Passed" : score >= 50 ? "Partial" : "Failed",
        date: s.createdAt,
      };
    });

    const combinedAssessments = [...formattedSubs.slice(0, 3), ...formattedCerts.slice(0, 2)]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const responsePayload = {
      success: true,
      data: {
        filter: {
          range,
          startDate,
          endDate,
        },
        stats: {
          totalUsers: {
            value: totalRegisteredUsers,
            trend: "+0% real verified",
          },
          activeToday: {
            value: activeUsersInRange,
            trend: "Genuine verified users",
          },
          activeSessions: {
            value: realLiveSessions.length,
            trend: `${realLiveSessions.length} active live`,
          },
          assessments: {
            value: totalAssessmentsAllTime,
            trend: "Genuine submissions",
          },
          codingSubmissions: {
            value: totalCodingSubmissionsAllTime,
            trend: "Verified database records",
          },
          storageUsed: {
            percentage: storagePercentage,
            consumedMB: (totalStorageBytes / (1024 * 1024)).toFixed(1),
          },
        },
        activityTrend: trendPoints,
        learningTrackDistribution: trackDistribution,
        proctoringStatus,
        recentAssessmentResults: combinedAssessments,
        liveSessions: realLiveSessions,
      },
    };

    setAdminCache(cacheKey, responsePayload);
    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Overview fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch overview metrics", error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. USER MANAGEMENT — GENUINE REGISTERED USERS ONLY (ZERO GUESTS)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const {
      search = "",
      status = "all", // "all" | "active" | "suspended"
      role = "all", // "all" | "student" | "mentor" | "instructor" | "admin"
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    let query = { ...REAL_USER_FILTER };

    if (search.trim()) {
      const trimmed = search.trim();
      const isExactId = mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24;
      const regex = new RegExp(trimmed, "i");
      const orConditions = [{ fullName: regex }, { username: regex }, { email: regex }];
      
      if (isExactId) {
        // If an admin searches by exact ObjectId, allow matching that specific user directly
        query = {
          $or: [
            { _id: new mongoose.Types.ObjectId(trimmed) },
            { $and: [{ ...REAL_USER_FILTER }, { $or: orConditions }] },
          ],
        };
      } else {
        query.$or = orConditions;
      }
    }

    if (status === "active") {
      query.isSuspended = { $ne: true };
    } else if (status === "suspended") {
      query.isSuspended = true;
    }

    if (role && role !== "all") {
      if (role === "admin") {
        delete query.role;
        query.role = { $in: ["admin", "SUPER_ADMIN"] };
      } else if (role === "student" || role === "user") {
        query.role = { $in: ["student", "user"] };
      } else {
        query.role = role;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    let totalUsers = 0;
    let users = [];

    const isDefaultQuery = !search.trim() && (!status || status === "all") && (!role || role === "all");
    if (isDefaultQuery) {
      const genuineData = await getCachedGenuineUsers();
      totalUsers = genuineData.users.length;
      const sorted = [...genuineData.users].sort((a, b) => {
        const valA = a[sortBy] || a.createdAt || 0;
        const valB = b[sortBy] || b.createdAt || 0;
        if (sortOrder === "asc") return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
      });
      const pageSlice = sorted.slice(skip, skip + limitNum);
      const pageIds = pageSlice.map((u) => u._id);
      users = await User.find({ _id: { $in: pageIds } })
        .select("-password -resetPasswordToken -otpCodeHash")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .lean();
    } else {
      [totalUsers, users] = await Promise.all([
        User.countDocuments(query),
        User.find(query)
          .select("-password -resetPasswordToken -otpCodeHash")
          .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
      ]);
    }

    const userIds = users.map((u) => u._id);
    const userEmails = users.map((u) => (u.email || "").toLowerCase()).filter(Boolean);

    // High-speed parallel aggregation across all assessment models for accurate user metrics
    const [subCounts, certCounts, moduleCounts, procCounts] = await Promise.all([
      ChallengeSubmission.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
      ]),
      CertificationAttempt.aggregate([
        {
          $match: {
            $or: [{ userId: { $in: userIds } }, { candidateEmail: { $in: userEmails } }],
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$userId", "$candidateEmail"] },
            count: { $sum: 1 },
          },
        },
      ]),
      ModuleAssessmentAttempt.aggregate([
        {
          $match: {
            $or: [{ userId: { $in: userIds } }, { candidateEmail: { $in: userEmails } }, { userEmail: { $in: userEmails } }],
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$userId", "$candidateEmail"] },
            count: { $sum: 1 },
          },
        },
      ]),
      ProctoredCodingSession.aggregate([
        {
          $match: {
            $or: [{ userId: { $in: userIds } }, { "candidateDetails.email": { $in: userEmails } }],
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$userId", "$candidateDetails.email"] },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const subMap = new Map();
    subCounts.forEach((s) => subMap.set(String(s._id), s.count));

    const certMap = new Map();
    certCounts.forEach((c) => certMap.set(String(c._id).toLowerCase(), c.count));

    const moduleMap = new Map();
    moduleCounts.forEach((m) => moduleMap.set(String(m._id).toLowerCase(), m.count));

    const procMap = new Map();
    procCounts.forEach((p) => procMap.set(String(p._id).toLowerCase(), p.count));

    const enhancedUsers = users.map((u) => {
      const uIdStr = String(u._id).toLowerCase();
      const emailStr = String(u.email || "").toLowerCase();
      const submissionsCount = subMap.get(String(u._id)) || 0;
      const certCount = certMap.get(uIdStr) || certMap.get(emailStr) || 0;
      const modCount = moduleMap.get(uIdStr) || moduleMap.get(emailStr) || 0;
      const pCount = procMap.get(uIdStr) || procMap.get(emailStr) || 0;
      const assessmentsCount = certCount + modCount + pCount;

      return {
        ...u,
        bio: u.bio || "Not Provided",
        location: u.location || "Not Provided",
        phoneNumber: u.phoneNumber || "Not Provided",
        interests: u.interests && u.interests.length > 0 ? u.interests : ["Not Provided"],
        submissionsCount,
        assessmentsCount,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        users: enhancedUsers,
        pagination: {
          total: totalUsers,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalUsers / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error("Admin Users API Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch registered users" });
  }
});

// Comprehensive Single User Profile
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(id)
      .select("-password -resetPasswordToken -otpCodeHash")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { getUserCodingActivity } = require("../utils/activityTracker");

    // Fetch actual user activity across the entire platform in a single parallel batch
    const [
      submissions,
      certAttempts,
      moduleAttempts,
      issuedCerts,
      subjectProgressList,
      codingProgress,
      projectSubmissions,
      supportTickets,
      meetings,
      recordings,
      proctoredSessions,
      activityStats,
    ] = await Promise.all([
      ChallengeSubmission.find({ userId: id })
        .select("-code -testResults -evaluationFeedback")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      CertificationAttempt.find({
        $or: [{ userId: id }, { candidateEmail: user.email }],
      })
        .select("-answers -questions -codeSubmissions")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      ModuleAssessmentAttempt.find({ userId: id })
        .select("-answers -questions")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      IssuedCertificate.find({
        $or: [{ userId: id }, { candidateEmail: user.email }],
      })
        .select("-metadata.rawPayload")
        .sort({ issuedAt: -1 })
        .limit(50)
        .lean(),
      SubjectProgress.find({ userId: id }).lean(),
      CodingProgress.findOne({ userId: id }).lean(),
      ProjectSubmission.find({
        $or: [{ userId: id }, { "candidateDetails.email": user.email }],
      })
        .select("-files -codeSnapshots -testResults -evaluationFeedback")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      SupportTicket.find({
        $or: [{ userId: id }, { userEmail: user.email }],
      })
        .select("-attachments.data -messages.attachments.data")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Meeting.find({
        $or: [{ hostUserId: String(id) }, { hostEmail: user.email }, { "participants.userId": String(id) }],
      })
        .select("-chatHistory -whiteboardData -sharedTasks")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Recording.find({
        $or: [{ hostUserId: String(id) }, { hostEmail: user.email }],
      })
        .select("-activityTimeline -notes")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      ProctoredCodingSession.find({
        $or: [{ userId: id }, { "candidateDetails.email": user.email }],
      })
        .select("-screenshots -violationLogs -codeSnapshots -questions -submissionResult.code -submissionResult.testResults")
        .sort({ updatedAt: -1 })
        .limit(30)
        .lean(),
      getUserCodingActivity(id, req.query.tz),
    ]);

    // Build genuine chronological activity timeline
    const timeline = [];

    // Account creation event
    timeline.push({
      type: "ACCOUNT_REGISTERED",
      title: "Account Registered",
      description: `User signed up on MasteryZone with email ${user.email}`,
      timestamp: user.createdAt,
    });

    // Submissions
    submissions.forEach((s) => {
      timeline.push({
        type: "CODING_SUBMISSION",
        title: `Code Submission: ${s.challengeTitle || s.challengeId}`,
        description: `Executed ${s.language?.toUpperCase()} with status ${s.status} (${s.passedTests}/${s.totalTests} passed)`,
        timestamp: s.createdAt,
        itemType: "coding",
        rawId: s._id,
        reportData: s,
      });
    });

    // Certifications
    certAttempts.forEach((c) => {
      timeline.push({
        type: "CERTIFICATION_ATTEMPT",
        title: `Exam Attempt: ${c.certTitle}`,
        description: `Completed proctored assessment with score ${c.percentage}% (${c.status})`,
        timestamp: c.submittedAt || c.createdAt,
        itemType: "certification",
        rawId: c._id,
        reportData: c,
      });
    });

    // Module Assessments
    moduleAttempts.forEach((m) => {
      timeline.push({
        type: "MODULE_ASSESSMENT",
        title: `Module Assessment: ${m.assessmentTitle || m.moduleTitle}`,
        description: `Completed MCQ test with score ${m.score}/${m.totalQuestions} (${m.percentage}%)`,
        timestamp: m.submittedAt || m.createdAt,
        itemType: "module",
        rawId: m._id,
        reportData: m,
      });
    });

    // Practical Project Assignments
    projectSubmissions.forEach((p) => {
      const scoreVal = p.marksObtained != null ? p.marksObtained : 0;
      const total = p.totalMarks || 100;
      const pct = p.percentage != null ? p.percentage : Math.round((scoreVal / total) * 100);
      timeline.push({
        type: "PROJECT_SUBMISSION",
        title: `Project: ${p.projectTitle || "Practical Project"}`,
        description: `Submitted assignment with score ${scoreVal}/${total} (${pct}% - ${p.status || "NEEDS_IMPROVEMENT"})`,
        timestamp: p.submittedAt || p.createdAt,
        itemType: "project",
        rawId: p._id,
        sessionId: p.sessionId,
        reportData: p,
      });
    });

    // Issued Certificates
    issuedCerts.forEach((crt) => {
      timeline.push({
        type: "CERTIFICATE_EARNED",
        title: `Certificate Earned: ${crt.certTitle}`,
        description: `Verified Certificate Code: ${crt.verificationCode}`,
        timestamp: crt.issuedAt,
        itemType: "certificate",
        rawId: crt._id,
        reportData: crt,
      });
    });

    // Proctored Sessions
    proctoredSessions.forEach((ps) => {
      timeline.push({
        type: "PROCTORING_SESSION",
        title: `Proctored Session: ${ps.assessmentTitle || "Certification Pre-check"}`,
        description: `Proctored exam session with status ${ps.status} (${ps.violationsCount || 0} violations recorded)`,
        timestamp: ps.updatedAt || ps.createdAt,
        itemType: "proctoring",
        rawId: ps._id,
        sessionId: ps.sessionId,
      });
    });

    // Video Meetings
    meetings.forEach((m) => {
      timeline.push({
        type: "MEETING_HOSTED",
        title: `Live Meeting: ${m.title || "Collaboration Session"}`,
        description: `Meeting hosted with status ${m.status || "ended"}`,
        timestamp: m.startTime || m.createdAt,
        itemType: "meeting",
        rawId: m._id,
      });
    });

    // Session Recordings
    recordings.forEach((r) => {
      timeline.push({
        type: "RECORDING_SAVED",
        title: `Recording: ${r.title || "Meeting Stream"}`,
        description: `Session recording captured (${r.recordingType || "Video"})`,
        timestamp: r.createdAt,
        itemType: "recording",
        rawId: r._id,
      });
    });

    // Support Tickets
    supportTickets.forEach((t) => {
      timeline.push({
        type: "SUPPORT_TICKET",
        title: `Support Ticket: ${t.subject || "Student Inquiry"}`,
        description: `Ticket status: ${t.status || "OPEN"} [Priority: ${t.priority || "NORMAL"}]`,
        timestamp: t.createdAt,
        itemType: "ticket",
        rawId: t._id,
      });
    });

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user,
          streak: activityStats.currentStreak,
          bio: user.bio || "Not Provided",
          location: user.location || "Not Provided",
          phoneNumber: user.phoneNumber || "Not Provided",
          interests: user.interests && user.interests.length > 0 ? user.interests : ["Not Provided"],
        },
        activityStats,
        submissions,
        certAttempts,
        moduleAttempts,
        certificates: issuedCerts,
        subjectProgress: subjectProgressList,
        codingProgress,
        projects: projectSubmissions,
        supportTickets,
        meetings,
        recordings,
        proctoredSessions,
        timeline: timeline.slice(0, 50),
      },
    });
  } catch (error) {
    console.error("Admin User Detail Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user details" });
  }
});

// Suspend or Activate Account
router.put("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isSuspended, reason = "" } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "SUPER_ADMIN" || user.email === "yashashyash1@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "Cannot modify status of exclusive Super Admin account.",
      });
    }

    user.isSuspended = Boolean(isSuspended);
    user.suspendedReason = reason;
    await user.save();

    await recordAdminAudit({
      adminId: req.user._id,
      action: isSuspended ? "USER_SUSPENDED" : "USER_RESTORED",
      targetId: user._id,
      note: `User ${user.email} marked as ${isSuspended ? "SUSPENDED" : "ACTIVE"}. Reason: ${reason || "N/A"}`,
      ip: req.ip,
    });

    // Disconnect active socket session if user is suspended
    if (isSuspended) {
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${user._id}`).emit("account_suspended", {
          reason: reason || "Your account has been suspended by administration.",
        });
      }
    }

    // In-app notification
    pushNotification(req.app, {
      userId: user._id,
      title: isSuspended ? "Account Suspended" : "Account Reactivated",
      message: isSuspended
        ? `Your Mastery Zone account has been suspended by administration.${reason ? ` Reason: ${reason}` : ""}`
        : "Your Mastery Zone account has been restored to active status.",
      type: "security",
      severity: isSuspended ? "danger" : "success",
      actionUrl: "/settings",
      actionLabel: "Account",
    }).catch(() => {});

    // Email notification
    if (!isGuestAccount(user.email, user.role)) {
      dispatchMailBackground(async () => {
        return await sendAccountNotificationEmail({
          toEmail: user.email,
          userName: user.fullName || user.username,
          changeType: "status",
          statusText: isSuspended ? "Suspended" : "Active",
          reason,
          req,
        });
      }, { type: "account_status_changed", recipient: user.email });
    }

    res.status(200).json({
      success: true,
      message: `User ${user.email} status updated to ${isSuspended ? "Suspended" : "Active"}`,
      user: {
        _id: user._id,
        isSuspended: user.isSuspended,
        suspendedReason: user.suspendedReason,
      },
    });
  } catch (error) {
    console.error("Admin update user status error:", error);
    res.status(500).json({ success: false, message: "Failed to update account status" });
  }
});

// Modify User Role (Promote / Demote)
router.put("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["user", "student", "mentor", "instructor", "admin"];
    if (!role || !validRoles.includes(String(role).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${validRoles.join(", ")}`,
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const mainAdminEmail = getMainAdminEmail();
    if ((mainAdminEmail && user.email.toLowerCase().trim() === mainAdminEmail) || user.role === "SUPER_ADMIN" || user.isMainAdmin === true) {
      return res.status(403).json({
        success: false,
        message: "Cannot modify role of the exclusive Main Admin account.",
      });
    }

    const previousRole = user.role;
    user.role = String(role).toLowerCase();
    await user.save();

    await recordAdminAudit({
      adminId: req.user._id,
      action: "USER_ROLE_MODIFIED",
      targetId: user._id,
      note: `User ${user.email} role changed from ${previousRole} to ${user.role}.`,
      ip: req.ip,
    });

    clearAdminCache();

    // Broadcast role change to socket
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${user._id}`).emit("role_updated", { role: user.role });
    }

    // In-app notification
    pushNotification(req.app, {
      userId: user._id,
      title: "Role Updated",
      message: `Your Mastery Zone account role has been updated to "${user.role}".`,
      type: "account",
      severity: "info",
      actionUrl: "/settings",
      actionLabel: "Profile",
    }).catch(() => {});

    // Email notification
    if (!isGuestAccount(user.email, user.role)) {
      dispatchMailBackground(async () => {
        return await sendAccountNotificationEmail({
          toEmail: user.email,
          userName: user.fullName || user.username,
          changeType: "role",
          role: user.role,
          req,
        });
      }, { type: "user_role_updated", recipient: user.email });
    }

    res.status(200).json({
      success: true,
      message: `User ${user.email} role updated to "${user.role}" successfully.`,
      user: {
        _id: user._id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Admin update user role error:", error);
    res.status(500).json({ success: false, message: "Failed to update user role", error: error.message });
  }
});

// Broadcast Platform Announcement
router.post("/announcements", async (req, res) => {
  try {
    const { title, message, sendEmail = true, type = "general", targetRole } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required for announcement." });
    }

    const query = { isSuspended: false };
    if (targetRole && targetRole !== "all") {
      query.role = targetRole;
    }

    const users = await User.find(query).select("_id fullName username email role preferences").lean();
    let emailDispatchedCount = 0;
    let inAppCount = 0;

    for (const u of users) {
      if (isGuestAccount(u.email, u.role)) continue;
      inAppCount++;
      pushNotification(req.app, {
        userId: u._id,
        title: `Announcement: ${title}`,
        message: String(message).slice(0, 200),
        type: "announcement",
        severity: "info",
        actionUrl: "/home",
        actionLabel: "View Details",
      }).catch(() => {});

      if (sendEmail && (u.preferences?.notifications !== false)) {
        emailDispatchedCount++;
        dispatchMailBackground(async () => {
          return await sendAnnouncementEmail({
            toEmail: u.email,
            userName: u.fullName || u.username || "Student",
            title,
            message,
            announcementType: type,
            actionUrl: "/home",
            req,
          });
        }, { type: "admin_announcement", recipient: u.email });
      }
    }

    await recordAdminAudit({
      adminId: req.user._id,
      action: "PLATFORM_ANNOUNCEMENT_BROADCAST",
      targetId: req.user._id,
      note: `Announcement "${title}" broadcast to ${inAppCount} users (${emailDispatchedCount} emails queued).`,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Announcement broadcast successfully to ${inAppCount} users.`,
      dispatchedCount: inAppCount,
      emailQueuedCount: emailDispatchedCount,
    });
  } catch (error) {
    console.error("Admin announcement broadcast error:", error);
    res.status(500).json({ success: false, message: "Failed to broadcast announcement", error: error.message });
  }
});

// Permanently Delete User Account & Cascade Records
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const mainAdminEmail = getMainAdminEmail();
    if ((mainAdminEmail && user.email.toLowerCase().trim() === mainAdminEmail) || user.role === "SUPER_ADMIN" || user.isMainAdmin === true) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete the exclusive Main Admin account.",
      });
    }

    // Cascade clean up user data
    await Promise.all([
      CodingProgress.deleteMany({ userId: user._id }),
      SubjectProgress.deleteMany({ userId: user._id }),
      AdminNotification.deleteMany({ targetId: String(user._id) }),
      User.deleteOne({ _id: user._id }),
    ]);

    await recordAdminAudit({
      adminId: req.user._id,
      action: "USER_DELETED",
      targetId: user._id,
      note: `User account ${user.email} (${user.fullName || user.username}) permanently deleted from system.`,
      ip: req.ip,
    });

    clearAdminCache();

    res.status(200).json({
      success: true,
      message: `User account ${user.email} has been permanently deleted.`,
    });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user account", error: error.message });
  }
});

// Admin-Initiated User Password Reset
router.post("/users/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, sendEmail = true } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const bcrypt = require("bcrypt");
    const { sendPasswordResetEmail, dispatchMailBackground } = require("../utils/mailer");

    if (newPassword && typeof newPassword === "string" && newPassword.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.mustChangePassword = true;
      await user.save();

      await recordAdminAudit({
        adminId: req.user._id,
        action: "USER_PASSWORD_RESET_BY_ADMIN",
        targetId: user._id,
        note: `Admin set a direct temporary password for user ${user.email}.`,
        ip: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: `Temporary password updated for user ${user.email}. User will be prompted to change password on next sign-in.`,
      });
    }

    // Generate reset token and email
    const crypto = require("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    if (sendEmail) {
      dispatchMailBackground(async () => {
        return await sendPasswordResetEmail({
          to: user.email,
          resetToken,
          candidateName: user.fullName || user.username,
          req,
        });
      }, { type: 'admin_user_password_reset', recipient: user.email });
    }

    await recordAdminAudit({
      adminId: req.user._id,
      action: "USER_RESET_EMAIL_DISPATCHED",
      targetId: user._id,
      note: `Admin dispatched official password reset email to ${user.email}.`,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Password reset instructions sent to ${user.email}.`,
      resetToken,
    });
  } catch (error) {
    console.error("Admin user password reset error:", error);
    res.status(500).json({ success: false, message: "Failed to reset user password", error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2B. ATTEMPT REPORT & REAL-TIME MARKS MODIFICATION (CENTRALIZED)
// ─────────────────────────────────────────────────────────────────────────────

// Fetch Full Comprehensive Report for any Attempt or Submission
router.get("/attempt-report/:type/:id", async (req, res) => {
  try {
    let { type, id } = req.params;
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({ success: false, message: "Invalid record ID" });
    }

    const Notification = require("../models/NotificationSchema");
    let report = null;

    // Handle Certificate event in timeline: resolve to its parent CertificationAttempt
    if (type === "certificate") {
      let certDoc = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        certDoc = await IssuedCertificate.findById(id).lean();
      }
      if (!certDoc) {
        certDoc = await IssuedCertificate.findOne({
          $or: [{ certificateId: id }, { verificationCode: id }, { attemptId: id }],
        }).lean();
      }
      if (certDoc && certDoc.attemptId) {
        const linkedAttempt = await CertificationAttempt.findOne({
          $or: [{ attemptId: certDoc.attemptId }, { certificateId: certDoc.certificateId }],
        }).lean();
        if (linkedAttempt) {
          id = String(linkedAttempt._id);
          type = "certification";
        }
      }
    }

    if (type === "certification") {
      let doc = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        doc = await CertificationAttempt.findById(id)
          .populate("userId", "fullName username email phoneNumber location avatarUrl")
          .lean();
      }
      if (!doc) {
        doc = await CertificationAttempt.findOne({
          $or: [{ attemptId: id }, { certificateId: id }],
        })
          .populate("userId", "fullName username email phoneNumber location avatarUrl")
          .lean();
      }
      if (!doc) return res.status(404).json({ success: false, message: "Certification record not found" });

      const user = doc.userId || {};
      let isViewed = Boolean(doc.notificationViewed);
      let viewedAt = doc.notificationViewedAt || null;

      if (!isViewed && doc.notificationInAppId) {
        const notifDoc = await Notification.findById(doc.notificationInAppId).select("isRead readAt updatedAt").lean();
        if (notifDoc && notifDoc.isRead) {
          isViewed = true;
          viewedAt = notifDoc.readAt || notifDoc.updatedAt || new Date();
          await CertificationAttempt.updateOne(
            { _id: doc._id },
            { $set: { notificationViewed: true, notificationViewedAt: viewedAt } }
          );
        }
      }

      const parsedPct = doc.percentage != null ? doc.percentage : Math.round(((doc.score || 0) / 40) * 100);

      const reviewBreakdown = (doc.selectedMcqs || []).map((q, idx) => {
        let userSelected = null;
        if (doc.mcqAnswers) {
          userSelected = typeof doc.mcqAnswers.get === "function"
            ? doc.mcqAnswers.get(q.id)
            : doc.mcqAnswers[q.id] ?? doc.mcqAnswers[String(q.id)] ?? doc.mcqAnswers[idx];
        }
        const hasAnswered = userSelected !== null && userSelected !== undefined && userSelected !== -1;
        const isCorrect = hasAnswered && Number(userSelected) === Number(q.correctAnswer);
        return {
          id: q.id || `q_${idx + 1}`,
          questionNumber: idx + 1,
          question: q.question,
          options: q.options || [],
          userSelected: hasAnswered ? Number(userSelected) : null,
          correctIndex: q.correctAnswer,
          isCorrect: Boolean(isCorrect),
          marksAwarded: isCorrect ? 1 : 0,
          maxMarks: 1,
          explanation: q.explanation || "Refer to core curriculum algorithms and specifications.",
          topic: q.topic || "Core Subject",
          difficulty: q.difficulty || "Intermediate",
        };
      });

      report = {
        itemType: "certification",
        id: doc._id,
        attemptId: doc.attemptId,
        title: doc.certTitle || "Professional Certification Examination",
        candidateName: doc.candidateName || user.fullName || user.username || "Student",
        candidateEmail: doc.candidateEmail || user.email || "",
        avatarUrl: user.avatarUrl,
        date: doc.submittedAt || doc.createdAt,
        startTime: doc.startTime,
        durationMinutes: doc.durationMinutes || 90,
        score: parsedPct,
        maxScore: 100,
        percentage: parsedPct,
        status: doc.status || doc.finalVerdict || "PENDING",
        grade: parsedPct >= 90 ? "Distinction" : parsedPct >= 80 ? "A" : parsedPct >= 70 ? "Pass" : "Failed",
        mcqScore: doc.mcqScore != null ? doc.mcqScore : Math.round((parsedPct / 100) * 20),
        mcqPassed: parsedPct >= 70,
        selectedMcqs: doc.selectedMcqs || [],
        mcqAnswers: doc.mcqAnswers || {},
        reviewBreakdown,
        selectedCodingQuestions: doc.selectedCodingQuestions || [],
        codingSubmissions: doc.codingSubmissions || [],
        proctoring: doc.proctoring || { status: "COMPLIANT", violationsCount: 0 },
        certificateId: doc.certificateId,
        adminNote: doc.adminNote || "",
        adminModifiedAt: doc.adminModifiedAt || null,
        adminModifiedBy: doc.adminModifiedBy || "",
        marksHistory: doc.marksHistory || [],
        notificationSent: Boolean(doc.notificationSent),
        notificationEmailSent: Boolean(doc.notificationEmailSent),
        notificationViewed: isViewed,
        notificationViewedAt: viewedAt,
        reportUrl: `/assessment-report/${doc.attemptId}`,
      };
    } else if (type === "module") {
      let doc = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        doc = await ModuleAssessmentAttempt.findById(id)
          .populate("userId", "fullName username email phoneNumber location avatarUrl")
          .lean();
      }
      if (!doc) {
        doc = await ModuleAssessmentAttempt.findOne({ sessionId: id })
          .populate("userId", "fullName username email phoneNumber location avatarUrl")
          .lean();
      }
      if (!doc) return res.status(404).json({ success: false, message: "Module assessment record not found" });

      const user = doc.userId || {};
      const totalQ = doc.totalQuestions || 10;
      let isViewed = Boolean(doc.notificationViewed);
      let viewedAt = doc.notificationViewedAt || null;

      if (!isViewed && doc.notificationInAppId) {
        const notifDoc = await Notification.findById(doc.notificationInAppId).select("isRead readAt updatedAt").lean();
        if (notifDoc && notifDoc.isRead) {
          isViewed = true;
          viewedAt = notifDoc.readAt || notifDoc.updatedAt || new Date();
          await ModuleAssessmentAttempt.updateOne(
            { _id: doc._id },
            { $set: { notificationViewed: true, notificationViewedAt: viewedAt } }
          );
        }
      }

      // Reconstruct reviewBreakdown if not already present
      let reviewBreakdown = doc.reviewBreakdown || [];
      if (!reviewBreakdown || reviewBreakdown.length === 0) {
        const questionsList = Array.isArray(doc.questions) && doc.questions.length > 0 ? doc.questions : [];
        reviewBreakdown = questionsList.map((q, idx) => {
          let userSelected = null;
          if (doc.userAnswers) {
            userSelected = typeof doc.userAnswers.get === "function"
              ? doc.userAnswers.get(String(idx))
              : doc.userAnswers[idx] ?? doc.userAnswers[String(idx)];
          }
          const hasAnswered = userSelected !== null && userSelected !== undefined && userSelected !== -1;
          const isCorrect = hasAnswered && Number(userSelected) === Number(q.correctIndex);
          return {
            id: q.id || `q_${idx + 1}`,
            questionIndex: idx,
            question: q.question,
            options: q.options || [],
            userSelected: hasAnswered ? Number(userSelected) : null,
            correctIndex: q.correctIndex,
            isCorrect: Boolean(isCorrect),
            marksAwarded: isCorrect ? 1 : 0,
            maxMarks: 1,
            explanation: q.explanation || "Review course fundamentals for this question.",
          };
        });
      }

      const parsedPct = doc.percentage != null ? doc.percentage : Math.round(((doc.score || 0) / totalQ) * 100);

      report = {
        itemType: "module",
        id: doc._id,
        sessionId: doc.sessionId || `attempt_${doc._id}`,
        title: doc.assessmentTitle || doc.moduleTitle || "Module Assessment",
        moduleTitle: doc.moduleTitle,
        trackId: doc.trackId,
        candidateName: user.fullName || user.username || "Student",
        candidateEmail: user.email || "",
        avatarUrl: user.avatarUrl,
        date: doc.submittedAt || doc.createdAt,
        startTime: doc.startTime,
        score: doc.score != null ? doc.score : 0,
        maxScore: totalQ,
        marksObtained: doc.marksObtained != null ? doc.marksObtained : doc.score,
        totalMarks: doc.totalMarks || totalQ,
        percentage: parsedPct,
        accuracy: doc.accuracy != null ? doc.accuracy : parsedPct,
        grade: doc.grade || (parsedPct >= 70 ? "Passed" : "Failed"),
        status: doc.passed ? "Passed" : "Failed",
        passed: doc.passed,
        passingScore: doc.passingScore || 80,
        timeSpentSeconds: doc.timeSpentSeconds || 0,
        proctoring: {
          violationsCount: doc.violationsCount || 0,
          verified: doc.proctoringVerified,
          violationsLog: doc.violationsLog || [],
        },
        questions: doc.questions || [],
        userAnswers: doc.userAnswers || {},
        reviewBreakdown,
        adminNote: doc.adminNote || "",
        adminModifiedAt: doc.adminModifiedAt || null,
        adminModifiedBy: doc.adminModifiedBy || "",
        marksHistory: doc.marksHistory || [],
        notificationSent: Boolean(doc.notificationSent),
        notificationEmailSent: Boolean(doc.notificationEmailSent),
        notificationViewed: isViewed,
        notificationViewedAt: viewedAt,
        reportUrl: `/assessment-report/${doc.sessionId || `attempt_${doc._id}`}`,
      };
    } else if (type === "coding") {
      let doc = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        doc = await ChallengeSubmission.findById(id)
          .populate("userId", "fullName username email phoneNumber location avatarUrl")
          .lean();
      }
      if (!doc) {
        // Check ProctoredCodingSession
        let sessionDoc = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          sessionDoc = await ProctoredCodingSession.findById(id)
            .populate("userId", "fullName username email phoneNumber location avatarUrl")
            .lean();
        }
        if (!sessionDoc) {
          sessionDoc = await ProctoredCodingSession.findOne({ sessionId: id })
            .populate("userId", "fullName username email phoneNumber location avatarUrl")
            .lean();
        }
        if (sessionDoc) {
          const user = sessionDoc.userId || {};
          const subResult = sessionDoc.submissionResult || {};
          const primaryQ = (sessionDoc.questions && sessionDoc.questions[0]) || {};
          const score = subResult.score !== undefined ? subResult.score : (primaryQ.score !== undefined ? primaryQ.score : 0);
          const totalT = subResult.totalTests || primaryQ.totalTests || 10;
          const passedT = subResult.passedTests !== undefined ? subResult.passedTests : (primaryQ.passedTests !== undefined ? primaryQ.passedTests : 0);
          const isPassed = subResult.passed !== undefined ? subResult.passed : score >= 80;

          report = {
            itemType: "coding",
            id: sessionDoc._id,
            sessionId: sessionDoc.sessionId,
            title: sessionDoc.assessmentTitle || primaryQ.title || "Coding Challenge",
            challengeId: sessionDoc.questionId,
            candidateName: sessionDoc.candidateDetails?.fullName || user.fullName || user.username || "Student",
            candidateEmail: sessionDoc.candidateDetails?.email || user.email || "",
            avatarUrl: user.avatarUrl,
            date: subResult.submittedAt || sessionDoc.updatedAt || sessionDoc.createdAt,
            language: subResult.language || primaryQ.language || "python",
            code: subResult.code || primaryQ.submittedCode || "",
            score,
            maxScore: 100,
            percentage: score,
            status: isPassed ? "ACCEPTED" : "FAILED",
            passed: isPassed,
            passedTests: passedT,
            totalTests: totalT,
            runtimeMs: 0,
            output: isPassed ? "All test assertions passed." : "Evaluation completed.",
            error: "",
            testResults: subResult.testResults || primaryQ.testResults || [],
            adminNote: "",
            marksHistory: [],
            notificationSent: true,
            notificationEmailSent: false,
            notificationViewed: true,
            notificationViewedAt: subResult.submittedAt,
            reportUrl: `/assessment-report/${sessionDoc.sessionId}`,
          };
          return res.status(200).json({ success: true, report });
        }
      }

      if (!doc) return res.status(404).json({ success: false, message: "Coding submission not found" });

      const user = doc.userId || {};
      const totalT = doc.totalTests || 10;
      const passedT = doc.passedTests != null ? doc.passedTests : 0;
      const pct = doc.score != null ? doc.score : Math.round((passedT / (totalT || 1)) * 100);

      let isViewed = Boolean(doc.notificationViewed);
      let viewedAt = doc.notificationViewedAt || null;

      if (!isViewed && doc.notificationInAppId) {
        const notifDoc = await Notification.findById(doc.notificationInAppId).select("isRead readAt updatedAt").lean();
        if (notifDoc && notifDoc.isRead) {
          isViewed = true;
          viewedAt = notifDoc.readAt || notifDoc.updatedAt || new Date();
          await ChallengeSubmission.updateOne(
            { _id: doc._id },
            { $set: { notificationViewed: true, notificationViewedAt: viewedAt } }
          );
        }
      }

      report = {
        itemType: "coding",
        id: doc._id,
        title: doc.challengeTitle || doc.challengeId || "Coding Challenge",
        challengeId: doc.challengeId,
        candidateName: user.fullName || user.username || "Student",
        candidateEmail: user.email || "",
        avatarUrl: user.avatarUrl,
        date: doc.createdAt,
        language: doc.language,
        code: doc.code,
        score: pct,
        maxScore: 100,
        percentage: pct,
        status: doc.status,
        passedTests: passedT,
        totalTests: totalT,
        runtimeMs: doc.runtimeMs || 0,
        output: doc.output,
        error: doc.error,
        adminNote: doc.adminNote || "",
        adminModifiedAt: doc.adminModifiedAt || null,
        adminModifiedBy: doc.adminModifiedBy || "",
        marksHistory: doc.marksHistory || [],
        notificationSent: Boolean(doc.notificationSent),
        notificationEmailSent: Boolean(doc.notificationEmailSent),
        notificationViewed: isViewed,
        notificationViewedAt: viewedAt,
        reportUrl: `/assessment-report/${doc._id}`,
      };
    } else if (type === "project") {
      let doc = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        doc = await ProjectSubmission.findById(id)
          .populate("userId", "fullName username email phoneNumber location avatarUrl")
          .lean();
      }
      if (!doc) {
        doc = await ProjectSubmission.findOne({ sessionId: id })
          .populate("userId", "fullName username email phoneNumber location avatarUrl")
          .lean();
      }
      if (!doc) return res.status(404).json({ success: false, message: "Project submission not found" });

      const user = doc.userId || {};
      const maxScore = doc.totalMarks || 100;
      const scoreVal = doc.marksObtained !== undefined ? doc.marksObtained : (doc.score || 0);
      const pct = doc.percentage != null ? doc.percentage : Math.round((scoreVal / maxScore) * 100);
      const isPassed = Boolean(doc.passed || scoreVal >= (doc.passingMarks || 80));

      let isViewed = Boolean(doc.notificationViewed);
      let viewedAt = doc.notificationViewedAt || null;
      if (!isViewed && doc.notificationInAppId) {
        const notifDoc = await Notification.findById(doc.notificationInAppId).select("isRead readAt updatedAt").lean();
        if (notifDoc && notifDoc.isRead) {
          isViewed = true;
          viewedAt = notifDoc.readAt || notifDoc.updatedAt || new Date();
          await ProjectSubmission.updateOne(
            { _id: doc._id },
            { $set: { notificationViewed: true, notificationViewedAt: viewedAt } }
          );
        }
      }

      report = {
        itemType: "project",
        id: doc._id,
        sessionId: doc.sessionId,
        title: doc.projectTitle || "Practical Project Assignment",
        category: doc.projectCategory || "Project Assignment",
        track: doc.track || "Coding",
        difficulty: doc.difficulty || "Intermediate",
        candidateName: doc.candidateDetails?.fullName || user.fullName || user.username || "Candidate",
        candidateEmail: doc.candidateDetails?.email || user.email || "",
        avatarUrl: user.avatarUrl,
        date: doc.submittedAt || doc.createdAt,
        score: scoreVal,
        maxScore,
        percentage: pct,
        status: isPassed ? "PASSED" : "NEEDS_IMPROVEMENT",
        passed: isPassed,
        grade: doc.grade || (isPassed ? "Passed" : "Needs Improvement"),
        files: doc.files || [],
        technologies: doc.technologies || [],
        rubricBreakdown: doc.rubricBreakdown || {},
        testResults: doc.testResults || [],
        passedTests: doc.passedTests || 0,
        totalTests: doc.totalTests || 6,
        adminNote: doc.adminNote || "",
        marksHistory: doc.marksHistory || [],
        notificationSent: Boolean(doc.notificationSent),
        notificationEmailSent: Boolean(doc.notificationEmailSent),
        notificationViewed: isViewed,
        notificationViewedAt: viewedAt,
        reportUrl: `/assessment-report/${doc.sessionId}`,
      };
    } else if (type === "proctoring" || type === "session") {
      let doc = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        doc = await ProctoredCodingSession.findById(id).lean();
      }
      if (!doc) {
        doc = await ProctoredCodingSession.findOne({ sessionId: id }).lean();
      }
      if (!doc) return res.status(404).json({ success: false, message: "Proctored session not found" });

      let user = null;
      if (doc.userId && mongoose.Types.ObjectId.isValid(String(doc.userId))) {
        user = await User.findById(doc.userId).select("fullName username email phoneNumber location avatarUrl").lean();
      }
      const candidate = doc.candidateDetails || {};
      const subResult = doc.submissionResult || {};
      const maxScore = doc.maxScore || 100;
      const scoreVal = doc.score != null ? doc.score : (subResult.score != null ? subResult.score : 0);
      const pct = doc.percentage != null ? doc.percentage : Math.round((scoreVal / maxScore) * 100);
      const isPassed = doc.evaluationVerdict === "PASSED" || subResult.passed || pct >= 70;

      let isViewed = Boolean(doc.notificationViewed);
      let viewedAt = doc.notificationViewedAt || null;
      if (!isViewed && doc.notificationInAppId) {
        const notifDoc = await Notification.findById(doc.notificationInAppId).select("isRead readAt updatedAt").lean();
        if (notifDoc && notifDoc.isRead) {
          isViewed = true;
          viewedAt = notifDoc.readAt || notifDoc.updatedAt || new Date();
          await ProctoredCodingSession.updateOne(
            { _id: doc._id },
            { $set: { notificationViewed: true, notificationViewedAt: viewedAt } }
          );
        }
      }

      report = {
        itemType: "proctoring",
        id: doc._id,
        sessionId: doc.sessionId,
        title: doc.assessmentTitle || "Proctored Coding Examination",
        track: doc.trackId || "Coding",
        candidateName: candidate.fullName || user?.fullName || user?.username || "Candidate",
        candidateEmail: candidate.email || user?.email || "",
        avatarUrl: user?.avatarUrl,
        date: subResult.submittedAt || doc.updatedAt || doc.createdAt,
        score: scoreVal,
        maxScore,
        percentage: pct,
        status: doc.status || (isPassed ? "PASSED" : "TERMINATED"),
        evaluationVerdict: doc.evaluationVerdict || (isPassed ? "PASSED" : "FAILED"),
        passed: isPassed,
        grade: isPassed ? (pct >= 90 ? "Distinction" : "Passed") : "Failed",
        questions: doc.questions || [],
        submissionResult: subResult,
        deviceInfo: doc.deviceInfo || {},
        violationsCount: doc.violationsCount || (doc.violationsLog ? doc.violationsLog.length : 0),
        violationsLog: doc.violationsLog || [],
        recordingUrl: doc.recordingUrl || "",
        adminNote: doc.adminNote || "",
        adminModifiedAt: doc.adminModifiedAt || null,
        adminModifiedBy: doc.adminModifiedBy || "",
        marksHistory: doc.marksHistory || [],
        notificationSent: Boolean(doc.notificationSent),
        notificationEmailSent: Boolean(doc.notificationEmailSent),
        notificationViewed: isViewed,
        notificationViewedAt: viewedAt,
        reportUrl: `/assessment-report/${doc.sessionId}`,
      };
    } else {
      return res.status(400).json({ success: false, message: "Unsupported attempt type" });
    }

    res.status(200).json({ success: true, report });
  } catch (err) {
    console.error("Fetch attempt report error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch attempt report", error: err.message });
  }
});

// Centralized Modify Student Marks & Real-Time Synchronization Endpoint
router.put("/modify-marks", async (req, res) => {
  try {
    const { itemType, itemId, newScore, newPercentage, newStatus, adminNote = "" } = req.body;
    if (!itemType || !itemId) {
      return res.status(400).json({ success: false, message: "itemType and itemId are required" });
    }

    const { pushNotification } = require("../utils/notificationService");
    const { sendSubmissionEvaluationEmail, dispatchMailBackground, isGuestAccount } = require("../utils/mailer");

    let updatedResult = null;
    let targetUserId = null;
    let studentUser = null;
    let notifCreated = null;
    let emailResult = null;

    if (itemType === "certification") {
      const attempt = await CertificationAttempt.findById(itemId);
      if (!attempt) return res.status(404).json({ success: false, message: "Certification attempt not found" });

      targetUserId = attempt.userId;
      if (targetUserId && mongoose.Types.ObjectId.isValid(String(targetUserId))) {
        studentUser = await User.findById(targetUserId).select("fullName username email").lean();
      }
      if (!studentUser && attempt.candidateEmail) {
        studentUser = await User.findOne({ email: String(attempt.candidateEmail).toLowerCase().trim() }).select("fullName username email").lean();
      }

      // Validate score (0 to 100)
      const parsedPct = Math.max(0, Math.min(100, Number(newPercentage != null ? newPercentage : newScore)));
      const prevScore = attempt.score != null ? attempt.score : attempt.percentage || 0;
      const prevStatus = attempt.status || attempt.finalVerdict || "PENDING";
      const statusVerdict = newStatus || (parsedPct >= 70 ? "PASSED" : "FAILED");

      // Audit trail entry
      if (!attempt.marksHistory) attempt.marksHistory = [];
      attempt.marksHistory.push({
        oldScore: prevScore,
        newScore: parsedPct,
        oldStatus: prevStatus,
        newStatus: statusVerdict,
        adminNote,
        modifiedBy: req.user?.email || "Super Admin",
        modifiedAt: new Date(),
      });

      attempt.percentage = parsedPct;
      attempt.score = parsedPct;
      attempt.finalScorePercentage = parsedPct;
      attempt.totalMarksObtained = Math.round((parsedPct / 100) * 40);
      attempt.mcqScore = Math.min(20, Math.round((parsedPct / 100) * 20));
      attempt.status = statusVerdict;
      attempt.finalVerdict = statusVerdict;
      attempt.adminNote = (adminNote || "").trim();
      attempt.adminModifiedAt = new Date();
      attempt.adminModifiedBy = req.user?.email || "Super Admin";

      // Synchronize associated IssuedCertificate
      await IssuedCertificate.updateMany(
        { $or: [{ attemptId: attempt.attemptId }, { attemptId: String(attempt._id) }] },
        {
          $set: {
            mcqScorePercentage: parsedPct,
            mcqScore: attempt.mcqScore,
            status: statusVerdict === "PASSED" ? "VALID" : "REVOKED",
          },
        }
      );

      // Multi-Channel Notifications
      if (studentUser) {
        try {
          notifCreated = await pushNotification(req.app, {
            userId: studentUser._id,
            title: `Certification Exam Evaluated: ${attempt.certTitle}`,
            message: `Super Admin evaluated your examination: ${parsedPct}/100 (${statusVerdict}). ${adminNote ? `Feedback: "${adminNote}"` : ""}`,
            type: "assessment",
            severity: statusVerdict === "PASSED" ? "success" : "warning",
            actionUrl: `/assessment-report/${attempt.attemptId}`,
            actionLabel: "View Examination Report",
            meta: {
              attemptId: attempt.attemptId,
              score: parsedPct,
              status: statusVerdict,
              feedback: adminNote,
            },
          });
          if (notifCreated) {
            attempt.notificationSent = true;
            attempt.notificationInAppId = notifCreated._id;
            attempt.notificationViewed = false;
            attempt.notificationViewedAt = null;
          }
        } catch (notifErr) {
          console.warn("Certification in-app notification error:", notifErr.message);
        }
      }

      const recipientEmail = studentUser?.email || attempt.candidateEmail;
      const recipientName = studentUser?.fullName || studentUser?.username || attempt.candidateName || "Student";
      if (recipientEmail && !isGuestAccount(recipientEmail)) {
        const emailRes = await sendSubmissionEvaluationEmail({
          userEmail: recipientEmail,
          userName: recipientName,
          assessmentTitle: attempt.certTitle,
          assessmentType: "certification",
          score: parsedPct,
          maxScore: 100,
          percentage: parsedPct,
          verdict: statusVerdict,
          adminComment: adminNote,
          reviewedAt: attempt.adminModifiedAt,
          reportUrl: `/assessment-report/${attempt.attemptId}`,
          req,
        }).catch((emailErr) => {
          console.warn("Certification email notification error:", emailErr?.message);
          return { success: false };
        });
        attempt.notificationEmailSent = !!(emailRes && emailRes.success);
      }

      await attempt.save();

      updatedResult = {
        id: attempt._id,
        itemType: "certification",
        score: `${parsedPct}/100`,
        percentage: parsedPct,
        status: statusVerdict,
        adminNote: attempt.adminNote,
        notificationSent: attempt.notificationSent,
        notificationEmailSent: attempt.notificationEmailSent,
        notificationViewed: attempt.notificationViewed,
        notificationViewedAt: attempt.notificationViewedAt,
        studentEmail: studentUser?.email,
      };
    } else if (itemType === "module") {
      const attempt = await ModuleAssessmentAttempt.findById(itemId);
      if (!attempt) return res.status(404).json({ success: false, message: "Module assessment attempt not found" });

      targetUserId = attempt.userId;
      if (targetUserId && mongoose.Types.ObjectId.isValid(String(targetUserId))) {
        studentUser = await User.findById(targetUserId).select("fullName username email").lean();
      }
      if (!studentUser && attempt.candidateEmail) {
        studentUser = await User.findOne({ email: String(attempt.candidateEmail).toLowerCase().trim() }).select("fullName username email").lean();
      }

      const totalQ = attempt.totalQuestions || 10;
      // Validate score (0 to totalQuestions)
      const parsedScore = Math.max(0, Math.min(totalQ, Number(newScore != null ? newScore : Math.round((Number(newPercentage) / 100) * totalQ))));
      const parsedPct = Math.round((parsedScore / totalQ) * 100);
      const prevScore = attempt.score != null ? attempt.score : 0;
      const prevStatus = attempt.passed ? "Passed" : "Failed";
      const passed = newStatus ? (newStatus === "Passed" || newStatus === "PASSED") : parsedPct >= 70;

      // Audit trail entry
      if (!attempt.marksHistory) attempt.marksHistory = [];
      attempt.marksHistory.push({
        oldScore: prevScore,
        newScore: parsedScore,
        oldStatus: prevStatus,
        newStatus: passed ? "Passed" : "Failed",
        adminNote,
        modifiedBy: req.user?.email || "Super Admin",
        modifiedAt: new Date(),
      });

      attempt.score = parsedScore;
      attempt.marksObtained = parsedScore * (attempt.marksPerQuestion || 1);
      attempt.correctCount = parsedScore;
      attempt.incorrectCount = Math.max(0, totalQ - parsedScore);
      attempt.percentage = parsedPct;
      attempt.accuracy = parsedPct;
      attempt.passed = passed;
      attempt.grade = parsedPct >= 90 ? "A+" : parsedPct >= 80 ? "A" : parsedPct >= 70 ? "B" : "F";
      attempt.adminNote = (adminNote || "").trim();
      attempt.adminModifiedAt = new Date();
      attempt.adminModifiedBy = req.user?.email || "Super Admin";

      // Synchronize SubjectProgress in real time
      try {
        const pKey = `${attempt.trackId}_${attempt.moduleIndex}`;
        const subProg = await SubjectProgress.findOne({ userId: attempt.userId, subjectKey: attempt.subjectKey || "coding" });
        if (subProg) {
          if (!subProg.moduleProgress) subProg.moduleProgress = new Map();
          const curr = typeof subProg.moduleProgress.get === "function" ? subProg.moduleProgress.get(pKey) : subProg.moduleProgress[pKey];
          const updatedMod = {
            ...(curr || {}),
            assessmentScore: parsedScore,
            assessmentPassed: passed,
            assessmentPercentage: parsedPct,
          };
          if (typeof subProg.moduleProgress.set === "function") subProg.moduleProgress.set(pKey, updatedMod);
          else subProg.moduleProgress[pKey] = updatedMod;
          await subProg.save();
        }
      } catch (subErr) {
        console.warn("SubjectProgress sync warning:", subErr.message);
      }

      const repUrl = `/assessment-report/${attempt.sessionId || `attempt_${attempt._id}`}`;
      // Multi-Channel Notifications
      if (studentUser) {
        try {
          notifCreated = await pushNotification(req.app, {
            userId: studentUser._id,
            title: `Module Assessment Evaluated: ${attempt.assessmentTitle || attempt.moduleTitle}`,
            message: `Super Admin evaluated your assessment: ${parsedScore}/${totalQ} (${parsedPct}% - ${passed ? "Passed" : "Failed"}). ${adminNote ? `Feedback: "${adminNote}"` : ""}`,
            type: "assessment",
            severity: passed ? "success" : "warning",
            actionUrl: repUrl,
            actionLabel: "View Assessment Report",
            meta: {
              attemptId: attempt._id,
              score: parsedScore,
              status: passed ? "Passed" : "Failed",
              feedback: adminNote,
            },
          });
          if (notifCreated) {
            attempt.notificationSent = true;
            attempt.notificationInAppId = notifCreated._id;
            attempt.notificationViewed = false;
            attempt.notificationViewedAt = null;
          }
        } catch (notifErr) {
          console.warn("Module in-app notification error:", notifErr.message);
        }
      }

      const recipientEmail = studentUser?.email || attempt.candidateEmail || attempt.userEmail;
      const recipientName = studentUser?.fullName || studentUser?.username || attempt.candidateName || attempt.userName || "Student";
      if (recipientEmail && !isGuestAccount(recipientEmail)) {
        const emailRes = await sendSubmissionEvaluationEmail({
          userEmail: recipientEmail,
          userName: recipientName,
          assessmentTitle: attempt.assessmentTitle || attempt.moduleTitle,
          assessmentType: "module",
          score: parsedScore,
          maxScore: totalQ,
          percentage: parsedPct,
          verdict: passed ? "PASSED" : "FAILED",
          adminComment: adminNote,
          reviewedAt: attempt.adminModifiedAt,
          reportUrl: repUrl,
          req,
        }).catch((emailErr) => {
          console.warn("Module email notification error:", emailErr?.message);
          return { success: false };
        });
        attempt.notificationEmailSent = !!(emailRes && emailRes.success);
      }

      await attempt.save();

      updatedResult = {
        id: attempt._id,
        itemType: "module",
        score: `${parsedScore} / ${totalQ} (${parsedPct}%)`,
        percentage: parsedPct,
        status: passed ? "Passed" : "Failed",
        adminNote: attempt.adminNote,
        notificationSent: attempt.notificationSent,
        notificationEmailSent: attempt.notificationEmailSent,
        notificationViewed: attempt.notificationViewed,
        notificationViewedAt: attempt.notificationViewedAt,
        studentEmail: studentUser?.email,
      };
    } else if (itemType === "coding") {
      const sub = await ChallengeSubmission.findById(itemId);
      if (!sub) return res.status(404).json({ success: false, message: "Challenge submission not found" });

      targetUserId = sub.userId;
      studentUser = await User.findById(targetUserId).select("fullName username email role").lean();

      const totalT = sub.totalTests || 10;
      // Validate score (0 to 100)
      const parsedScore = Math.max(0, Math.min(100, Number(newScore != null ? newScore : 100)));
      const parsedPassed = Number(
        req.body.passedTests != null
          ? req.body.passedTests
          : Math.min(totalT, Math.max(0, Math.round((parsedScore / 100) * totalT)))
      );
      const prevScore = sub.score != null ? sub.score : 0;
      const prevStatus = sub.status || "WRONG_ANSWER";
      const finalStatus = newStatus || (parsedScore >= 70 || parsedPassed === totalT ? "ACCEPTED" : "WRONG_ANSWER");
      const cleanRemarks = (adminNote || "").trim();
      const modAt = new Date();
      const modBy = req.user?.email || "Super Admin";

      // Audit trail entry
      if (!sub.marksHistory) sub.marksHistory = [];
      sub.marksHistory.push({
        oldScore: prevScore,
        newScore: parsedScore,
        oldStatus: prevStatus,
        newStatus: finalStatus,
        adminNote: cleanRemarks,
        modifiedBy: modBy,
        modifiedAt: modAt,
      });

      sub.score = parsedScore;
      sub.passedTests = parsedPassed;
      sub.status = finalStatus;
      sub.adminNote = cleanRemarks; // Clean user-entered remarks only, never auto-fabricated
      sub.adminModifiedAt = modAt;
      sub.adminModifiedBy = modBy;

      // 1. SAVE PERMANENTLY TO DATABASE FIRST (Fail fast if DB write fails)
      await sub.save();

      // 2. Synchronize CodingProgress challengesSolved
      if (studentUser) {
        try {
          const CodingProgress = require("../models/CodingProgress");
          let codingProg = await CodingProgress.findOne({ userId: studentUser._id });
          if (!codingProg) {
            codingProg = new CodingProgress({ userId: studentUser._id, challengesSolved: [] });
          }
          if (!codingProg.challengesSolved) codingProg.challengesSolved = [];
          const existingIdx = codingProg.challengesSolved.findIndex(c => c.challengeId === sub.challengeId);
          if (sub.status === "ACCEPTED") {
            if (existingIdx >= 0) {
              codingProg.challengesSolved[existingIdx].score = parsedScore;
              codingProg.challengesSolved[existingIdx].solvedAt = new Date();
              codingProg.challengesSolved[existingIdx].code = sub.code || "";
            } else {
              codingProg.challengesSolved.push({
                challengeId: sub.challengeId,
                language: sub.language || "python",
                score: parsedScore,
                code: sub.code || "",
                solvedAt: new Date(),
              });
            }
          } else if (existingIdx >= 0) {
            const otherAccepted = await ChallengeSubmission.findOne({
              userId: studentUser._id,
              challengeId: sub.challengeId,
              status: "ACCEPTED",
              _id: { $ne: sub._id },
            });
            if (!otherAccepted) {
              codingProg.challengesSolved.splice(existingIdx, 1);
            }
          }
          await codingProg.save();
        } catch (progErr) {
          console.warn("Could not sync CodingProgress on admin evaluation:", progErr.message);
        }
      }

      // 3. Clear In-Memory Admin & Analytics Caches
      clearAdminCache();

      // 4. Send Multi-Channel Notifications (In-App + Email) AFTER DB SAVE SUCCEEDED
      if (studentUser) {
        try {
          notifCreated = await pushNotification(req.app, {
            userId: studentUser._id,
            title: `Coding Submission Evaluated: ${sub.challengeTitle || "Challenge"}`,
            message: `Super Admin evaluated your submission: ${parsedScore}/100 (${sub.status}).${cleanRemarks ? ` Feedback: "${cleanRemarks}"` : ""}`,
            type: "assessment",
            severity: sub.status === "ACCEPTED" || parsedScore >= 70 ? "success" : "warning",
            actionUrl: `/assessment-report/${sub._id}`,
            actionLabel: "View Code Report",
            meta: {
              submissionId: sub._id,
              score: parsedScore,
              status: sub.status,
              feedback: cleanRemarks,
            },
          });
          if (notifCreated) {
            sub.notificationSent = true;
            sub.notificationInAppId = notifCreated._id;
            sub.notificationViewed = false;
            sub.notificationViewedAt = null;
            await ChallengeSubmission.updateOne(
              { _id: sub._id },
              {
                $set: {
                  notificationSent: true,
                  notificationInAppId: notifCreated._id,
                  notificationViewed: false,
                  notificationViewedAt: null,
                },
              }
            );
          }
        } catch (notifErr) {
          console.warn("Coding in-app notification error:", notifErr.message);
        }
      }

      const recipientEmail = studentUser?.email || sub.userEmail;
      const recipientName = studentUser?.fullName || studentUser?.username || sub.userName || "Student";
      if (recipientEmail && !isGuestAccount(recipientEmail)) {
        try {
          const emailRes = await sendSubmissionEvaluationEmail({
            userEmail: recipientEmail,
            userName: recipientName,
            challengeTitle: sub.challengeTitle || sub.challengeId || "Coding Challenge",
            assessmentType: "coding",
            language: sub.language || "python",
            score: parsedScore,
            maxScore: 100,
            verdict: sub.status,
            adminComment: cleanRemarks,
            reviewedAt: sub.adminModifiedAt,
            reportUrl: `/assessment-report/${sub._id}`,
            req,
          });
          if (emailRes && emailRes.success) {
            sub.notificationEmailSent = true;
            await ChallengeSubmission.updateOne(
              { _id: sub._id },
              { $set: { notificationEmailSent: true } }
            );
          }
        } catch (emailErr) {
          console.warn("Coding email notification error:", emailErr?.message);
        }
      }

      // 5. Emit real-time Socket.IO events for live dashboard and candidate sync
      try {
        const io = req.app.get("io");
        if (io) {
          const updatePayload = {
            id: sub._id,
            rawId: sub._id,
            itemType: "coding",
            challengeId: sub.challengeId,
            userId: String(sub.userId),
            studentId: String(sub.userId),
            score: `${parsedScore}/100`,
            rawScore: parsedScore,
            status: sub.status,
            passedTests: sub.passedTests,
            totalTests: totalT,
            adminNote: cleanRemarks,
            adminModifiedAt: sub.adminModifiedAt,
            adminModifiedBy: sub.adminModifiedBy,
          };

          io.emit("ASSESSMENT_MARKS_UPDATED", updatePayload);
          io.emit("CODING_SUBMISSION_EVALUATED", updatePayload);
          io.to(`user_${sub.userId}`).emit("USER_SUBMISSION_UPDATED", updatePayload);

          io.emit("NEW_REPORT", {
            id: sub._id,
            rawId: sub._id,
            itemType: "coding",
            sessionId: String(sub._id),
            title: `${sub.challengeTitle || sub.challengeId || "Coding Challenge"} — Challenge Submission Report`,
            type: "Coding Challenge Report",
            recipient: recipientName,
            email: recipientEmail,
            score: `${parsedScore}%`,
            rawScore: parsedScore,
            maxScore: 100,
            grade: sub.status === "ACCEPTED" ? "Accepted" : "Wrong Answer",
            verificationCode: String(sub._id).slice(-8).toUpperCase(),
            date: sub.adminModifiedAt || sub.createdAt,
            status: sub.status,
            passedTests: sub.passedTests,
            totalTests: totalT,
            reportUrl: `/assessment-report/${sub._id}`,
          });
        }
      } catch (sockErr) {
        console.warn("Socket broadcast error:", sockErr.message);
      }

      updatedResult = {
        id: sub._id,
        itemType: "coding",
        score: `${parsedScore}/100`,
        rawScore: parsedScore,
        status: sub.status,
        passedTests: sub.passedTests,
        totalTests: totalT,
        adminNote: cleanRemarks,
        notificationSent: sub.notificationSent,
        notificationEmailSent: sub.notificationEmailSent,
        notificationViewed: sub.notificationViewed,
        notificationViewedAt: sub.notificationViewedAt,
        studentEmail: studentUser?.email,
      };
    } else if (itemType === "proctoring" || itemType === "session") {
      let session = null;
      if (mongoose.Types.ObjectId.isValid(itemId)) {
        session = await ProctoredCodingSession.findById(itemId);
      }
      if (!session) {
        session = await ProctoredCodingSession.findOne({ sessionId: itemId });
      }
      if (!session) return res.status(404).json({ success: false, message: "Proctored session not found" });

      targetUserId = session.userId;
      if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
        studentUser = await User.findById(targetUserId).select("fullName username email").lean();
      }

      const maxScore = Number(req.body.maxScore || session.maxScore || 100);
      const parsedScore = Math.max(0, Math.min(maxScore, Number(newScore != null ? newScore : 0)));
      const parsedPct = Math.max(0, Math.min(100, Math.round((parsedScore / maxScore) * 100)));
      const passed = parsedPct >= 70;
      const finalStatus = newStatus || (passed ? "submitted" : "terminated");
      const prevScore = session.score != null ? session.score : (session.submissionResult?.score ?? 0);
      const prevStatus = session.status || "active";

      if (!session.marksHistory) session.marksHistory = [];
      session.marksHistory.push({
        oldScore: prevScore,
        originalScore: prevScore,
        newScore: parsedScore,
        maxScore,
        oldStatus: prevStatus,
        originalStatus: prevStatus,
        newStatus: finalStatus,
        adminNote,
        modifiedBy: req.user?.email || "Super Admin",
        modifiedAt: new Date(),
      });

      session.score = parsedScore;
      session.maxScore = maxScore;
      session.percentage = parsedPct;
      session.status = finalStatus;
      session.evaluationVerdict = passed ? "PASSED" : "FAILED";
      session.adminNote = adminNote || `Evaluation modified by Super Admin to ${parsedScore}/${maxScore} (${parsedPct}%) on ${new Date().toLocaleDateString()}`;
      session.adminModifiedAt = new Date();
      session.adminModifiedBy = req.user?.email || "Super Admin";

      if (session.submissionResult && typeof session.submissionResult === "object") {
        session.submissionResult.score = parsedPct;
        session.submissionResult.marksObtained = parsedScore;
        session.submissionResult.totalMarks = maxScore;
        session.submissionResult.passed = passed;
        session.submissionResult.status = passed ? "PASSED" : "FAILED";
        session.markModified("submissionResult");
      }

      // Synchronize linked certification attempt strictly by exact sessionId
      try {
        const linkedCert = await CertificationAttempt.findOne({
          proctoringSessionId: session.sessionId,
        });
        if (linkedCert) {
          linkedCert.score = parsedPct;
          linkedCert.percentage = parsedPct;
          linkedCert.status = passed ? "PASSED" : "FAILED";
          linkedCert.finalVerdict = passed ? "PASSED" : "FAILED";
          linkedCert.adminNote = adminNote;
          linkedCert.adminModifiedAt = new Date();
          linkedCert.adminModifiedBy = req.user?.email || "Super Admin";
          await linkedCert.save();
        }
      } catch (certErr) {
        console.warn("Linked cert attempt sync warning:", certErr.message);
      }

      const repUrl = `/assessment-report/${session.sessionId}`;
      // Multi-Channel Notifications
      if (studentUser) {
        try {
          notifCreated = await pushNotification(req.app, {
            userId: studentUser._id,
            title: `Proctored Assessment Evaluated: ${session.assessmentTitle || "Certification Examination"}`,
            message: `Super Admin evaluated your proctored examination: ${parsedScore}/${maxScore} (${parsedPct}% - ${passed ? "Passed" : "Terminated/Failed"}). ${adminNote ? `Feedback: "${adminNote}"` : ""}`,
            type: "proctoring",
            severity: passed ? "success" : "warning",
            actionUrl: repUrl,
            actionLabel: "View Examination Report",
            meta: {
              sessionId: session.sessionId,
              score: parsedScore,
              maxScore,
              status: passed ? "Passed" : "Failed",
              feedback: adminNote,
            },
          });
          if (notifCreated) {
            session.notificationSent = true;
            session.notificationInAppId = notifCreated._id;
            session.notificationViewed = false;
            session.notificationViewedAt = null;
          }
        } catch (notifErr) {
          console.warn("Proctoring in-app notification error:", notifErr.message);
        }
      }

      const recipientEmail = studentUser?.email || session.candidateDetails?.email;
      const recipientName = studentUser?.fullName || studentUser?.username || session.candidateDetails?.fullName || "Candidate";
      if (recipientEmail && !isGuestAccount(recipientEmail)) {
        const emailRes = await sendSubmissionEvaluationEmail({
          userEmail: recipientEmail,
          userName: recipientName,
          assessmentTitle: session.assessmentTitle || "Proctored Examination",
          assessmentType: "proctoring",
          score: parsedScore,
          maxScore,
          percentage: parsedPct,
          verdict: passed ? "PASSED" : "FAILED",
          adminComment: adminNote,
          reviewedAt: session.adminModifiedAt,
          reportUrl: repUrl,
          req,
        }).catch((emailErr) => {
          console.warn("Proctoring email notification error:", emailErr?.message);
          return { success: false };
        });
        session.notificationEmailSent = !!(emailRes && emailRes.success);
      }
      await session.save();

      require("../utils/proctoringSync").emitProctoringSessionUpdate(
        req.app.get("io"),
        session.sessionId,
        "marks_updated",
        {
          score: session.score,
          status: session.status,
          notificationSent: session.notificationSent,
          notificationEmailSent: session.notificationEmailSent,
        }
      );

      updatedResult = {
        id: session._id,
        sessionId: session.sessionId,
        itemType: "proctoring",
        score: `${parsedScore} / ${maxScore} (${parsedPct}%)`,
        rawScore: parsedScore,
        maxScore,
        percentage: parsedPct,
        status: session.status,
        evaluationVerdict: session.evaluationVerdict,
        adminNote: session.adminNote,
        notificationSent: session.notificationSent,
        notificationEmailSent: session.notificationEmailSent,
        notificationViewed: session.notificationViewed,
        notificationViewedAt: session.notificationViewedAt,
        studentEmail: studentUser?.email || session.candidateDetails?.email,
      };
    } else if (itemType === "project") {
      let sub = null;
      if (mongoose.Types.ObjectId.isValid(itemId)) {
        sub = await ProjectSubmission.findById(itemId);
      }
      if (!sub) {
        sub = await ProjectSubmission.findOne({ sessionId: itemId });
      }
      if (!sub) return res.status(404).json({ success: false, message: "Project submission not found" });

      targetUserId = sub.userId;
      if (targetUserId && mongoose.Types.ObjectId.isValid(String(targetUserId))) {
        studentUser = await User.findById(targetUserId).select("fullName username email").lean();
      }
      if (!studentUser && sub.candidateDetails?.email) {
        studentUser = await User.findOne({ email: String(sub.candidateDetails.email).toLowerCase().trim() }).select("fullName username email").lean();
      }

      const maxScore = Number(sub.totalMarks || 100);
      const parsedScore = Math.max(
        0,
        Math.min(
          maxScore,
          Number(newScore != null ? newScore : (newPercentage != null ? Math.round((Number(newPercentage) / 100) * maxScore) : 0))
        )
      );
      const parsedPct = Math.max(0, Math.min(100, Math.round((parsedScore / maxScore) * 100)));
      const passingThreshold = sub.passingMarks || 80;
      const isPassed = newStatus
        ? newStatus === "PASSED" || newStatus === "Passed" || newStatus === "ACCEPTED"
        : parsedScore >= passingThreshold;
      const finalStatus = isPassed ? "PASSED" : "NEEDS_IMPROVEMENT";
      const prevScore = sub.marksObtained != null ? sub.marksObtained : 0;
      const prevStatus = sub.status || "NEEDS_IMPROVEMENT";

      if (!sub.marksHistory) sub.marksHistory = [];
      sub.marksHistory.push({
        oldScore: prevScore,
        newScore: parsedScore,
        oldStatus: prevStatus,
        newStatus: finalStatus,
        adminNote,
        modifiedBy: req.user?.email || "Super Admin",
        modifiedAt: new Date(),
      });

      sub.marksObtained = parsedScore;
      sub.percentage = parsedPct;
      sub.status = finalStatus;
      sub.passed = isPassed;
      sub.grade = parsedPct >= 90 ? "A+" : parsedPct >= 80 ? "A" : parsedPct >= 70 ? "B" : "Needs Improvement";
      sub.adminNote = adminNote || `Evaluation modified by Super Admin to ${parsedScore}/${maxScore} (${parsedPct}%) on ${new Date().toLocaleDateString()}`;
      sub.adminModifiedAt = new Date();
      sub.adminModifiedBy = req.user?.email || "Super Admin";

      const repUrl = `/assessment-report/${sub.sessionId}`;

      // In-app Notification
      if (studentUser) {
        try {
          notifCreated = await pushNotification(req.app, {
            userId: studentUser._id,
            title: `Project Assignment Evaluated: ${sub.projectTitle || "Project"}`,
            message: `Super Admin evaluated your project: ${parsedScore}/${maxScore} (${parsedPct}% - ${finalStatus}). ${adminNote ? `Feedback: "${adminNote}"` : ""}`,
            type: "assessment",
            severity: isPassed ? "success" : "warning",
            actionUrl: repUrl,
            actionLabel: "View Project Report",
            meta: {
              sessionId: sub.sessionId,
              score: parsedScore,
              maxScore,
              status: finalStatus,
              feedback: adminNote,
            },
          });
          if (notifCreated) {
            sub.notificationSent = true;
            sub.notificationInAppId = notifCreated._id;
            sub.notificationViewed = false;
            sub.notificationViewedAt = null;
          }
        } catch (notifErr) {
          console.warn("Project in-app notification error:", notifErr.message);
        }
      }

      // Email Notification
      const recipientEmail = studentUser?.email || sub.candidateDetails?.email;
      const recipientName = studentUser?.fullName || studentUser?.username || sub.candidateDetails?.fullName || "Candidate";
      if (recipientEmail && !isGuestAccount(recipientEmail)) {
        const emailRes = await sendSubmissionEvaluationEmail({
          userEmail: recipientEmail,
          userName: recipientName,
          assessmentTitle: sub.projectTitle || "Practical Project Assignment",
          assessmentType: "project",
          score: parsedScore,
          maxScore,
          percentage: parsedPct,
          verdict: finalStatus,
          adminComment: adminNote,
          reviewedAt: sub.adminModifiedAt,
          reportUrl: repUrl,
          req,
        }).catch((emailErr) => {
          console.warn("Project email notification error:", emailErr?.message);
          return { success: false };
        });
        sub.notificationEmailSent = !!(emailRes && emailRes.success);
      }

      await sub.save();

      // Emit real-time socket events for marks update & reports sync
      try {
        const io = req.app.get("io");
        if (io) {
          io.emit("ASSESSMENT_MARKS_UPDATED", {
            id: sub._id,
            rawId: sub._id,
            sessionId: sub.sessionId,
            itemType: "project",
            score: `${parsedScore} / ${maxScore} (${parsedPct}%)`,
            rawScore: parsedScore,
            maxScore,
            percentage: parsedPct,
            status: finalStatus,
            passed: isPassed,
            adminNote: sub.adminNote,
            adminModifiedAt: sub.adminModifiedAt,
            adminModifiedBy: sub.adminModifiedBy,
          });
          io.emit("NEW_REPORT", {
            id: sub._id,
            rawId: sub._id,
            itemType: "project",
            sessionId: sub.sessionId,
            title: `${sub.projectTitle || "Practical Project"} — Project Assessment Report`,
            type: "Project Assessment Report",
            recipient: recipientName,
            email: recipientEmail,
            score: `${parsedPct}%`,
            rawScore: parsedScore,
            maxScore,
            grade: sub.grade,
            verificationCode: String(sub.sessionId || sub._id).slice(-8).toUpperCase(),
            date: sub.adminModifiedAt || sub.submittedAt || sub.createdAt,
            status: finalStatus,
            reportUrl: repUrl,
          });
        }
      } catch {}

      updatedResult = {
        id: sub._id,
        sessionId: sub.sessionId,
        itemType: "project",
        score: `${parsedScore} / ${maxScore} (${parsedPct}%)`,
        rawScore: parsedScore,
        maxScore,
        percentage: parsedPct,
        status: finalStatus,
        passed: isPassed,
        grade: sub.grade,
        adminNote: sub.adminNote,
        notificationSent: sub.notificationSent,
        notificationEmailSent: sub.notificationEmailSent,
        notificationViewed: sub.notificationViewed,
        notificationViewedAt: sub.notificationViewedAt,
        studentEmail: studentUser?.email || sub.candidateDetails?.email,
      };
    } else {
      return res.status(400).json({ success: false, message: `Unsupported itemType: ${itemType}` });
    }

    // Emit real-time synchronization event across application via Socket.io
    try {
      const io = req.app.get("io");
      if (io && targetUserId) {
        io.to(`user_${targetUserId}`).emit("ASSESSMENT_MARKS_UPDATED", {
          itemType,
          itemId,
          updatedResult,
        });
      }
    } catch (socketErr) {
      console.warn("Socket notification broadcast warning:", socketErr.message);
    }

    // Record Immutable Admin Audit Log
    await recordAdminAudit({
      adminId: req.user._id,
      action: "MARKS_MODIFIED",
      targetId: itemId,
      note: `Super Admin modified marks for ${itemType} (ID: ${itemId}) to ${newScore ?? newPercentage}. Note: ${adminNote}`,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Student marks successfully updated, synchronized, and notified.",
      data: updatedResult,
    });
  } catch (err) {
    console.error("Modify marks error:", err);
    res.status(500).json({ success: false, message: "Failed to modify marks", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ADMIN NOTIFICATIONS — SEPARATE & REAL-TIME
// ─────────────────────────────────────────────────────────────────────────────
router.get("/notifications", async (req, res) => {
  try {
    // If no notifications exist yet, seed initial notifications from recent database events
    const count = await AdminNotification.countDocuments();
    if (count === 0) {
      const recentUsers = await User.find(REAL_USER_FILTER)
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      for (const u of recentUsers) {
        await AdminNotification.create({
          title: "New Student Registration",
          message: `${u.fullName || u.username} (${u.email}) joined MasteryZone.`,
          type: "registration",
          severity: "info",
          targetId: String(u._id),
          targetUser: { fullName: u.fullName, email: u.email, username: u.username },
          actionUrl: "/admin/users",
          isRead: false,
          createdAt: u.createdAt,
        });
      }

      const recentSubs = await ChallengeSubmission.find()
        .populate("userId", "fullName username email")
        .sort({ createdAt: -1 })
        .limit(2)
        .lean();

      for (const s of recentSubs) {
        await AdminNotification.create({
          title: "Code Challenge Execution",
          message: `${s.userId?.fullName || "Candidate"} submitted solution for ${s.challengeTitle || s.challengeId} (${s.status}).`,
          type: "coding",
          severity: s.status === "ACCEPTED" ? "success" : "warning",
          targetId: String(s._id),
          actionUrl: "/admin/coding-analytics",
          isRead: false,
          createdAt: s.createdAt,
        });
      }
    }

    const notifications = await AdminNotification.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await AdminNotification.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Fetch Admin Notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

router.put("/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    await AdminNotification.findByIdAndUpdate(id, {
      isRead: true,
      readAt: new Date(),
    });
    const unreadCount = await AdminNotification.countDocuments({ isRead: false });
    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark notification read" });
  }
});

router.put("/notifications/read-all", async (req, res) => {
  try {
    await AdminNotification.updateMany({ isRead: false }, { isRead: true, readAt: new Date() });
    res.status(200).json({ success: true, unreadCount: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark all notifications read" });
  }
});

router.delete("/notifications/clear", async (req, res) => {
  try {
    await AdminNotification.deleteMany({});
    res.status(200).json({ success: true, unreadCount: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to clear notifications" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. LIVE USER ACTIVITY & REAL-TIME MONITORING (AUTHENTICATED ONLY)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/live-activity", async (req, res) => {
  try {
    const {
      category = "all",
      type = "all",
      range = "30d",
      startDate: qStart,
      endDate: qEnd,
      q = "",
      page = 1,
      limit = 10,
    } = req.query;

    const { startDate, endDate } = parseDateRange(range, qStart, qEnd);

    // 1 & 2. Fetch live active sessions and genuine user IDs in parallel
    const sessionManager = req.app.get("sessionManager") || require("../utils/sessionManager");
    const [activeList, genuineData] = await Promise.all([
      sessionManager.getActiveSessions(),
      getCachedGenuineUsers(),
    ]);
    const realUserIds = genuineData.userIds;

    const activityQuery = {
      userId: { $in: realUserIds },
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (category && category !== "all") {
      activityQuery.category = category;
    }

    if (type && type !== "all") {
      activityQuery.type = type;
    }

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      activityQuery.$or = [
        { userName: regex },
        { userEmail: regex },
        { title: regex },
        { detail: regex },
      ];
      if (mongoose.Types.ObjectId.isValid(q.trim())) {
        activityQuery.$or.push({ userId: new mongoose.Types.ObjectId(q.trim()) });
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [activities, totalActivities, todayCount, categoryAgg] =
      await Promise.all([
        ActivityLog.find(activityQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        ActivityLog.countDocuments(activityQuery),
        ActivityLog.countDocuments({
          userId: { $in: realUserIds },
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        }),
        ActivityLog.aggregate([
          { $match: { userId: { $in: realUserIds }, category: { $in: ["coding", "proctoring", "assessment", "auth"] } } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ]),
      ]);

    let codingCount = 0;
    let procCount = 0;
    let assessCount = 0;
    let authCount = 0;
    (categoryAgg || []).forEach((c) => {
      if (c._id === "coding") codingCount = c.count;
      else if (c._id === "proctoring") procCount = c.count;
      else if (c._id === "assessment") assessCount = c.count;
      else if (c._id === "auth") authCount = c.count;
    });

    res.status(200).json({
      success: true,
      activeSessions: activeList,
      onlineCount: activeList.length,
      activities: activities || [],
      totalActivities,
      page: pageNum,
      totalPages: Math.ceil(totalActivities / limitNum) || 1,
      stats: {
        online: activeList.length,
        today: todayCount,
        coding: codingCount,
        proctoring: procCount,
        assessment: assessCount,
        auth: authCount,
        total: totalActivities,
      },
    });
  } catch (error) {
    console.error("Admin live activity feed error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch live activity feed" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. LEARNING ANALYTICS — ACTUAL USER DATA ONLY
// ─────────────────────────────────────────────────────────────────────────────
router.get("/learning-analytics", async (req, res) => {
  try {
    const { userId, range = "30d", startDate: qStart, endDate: qEnd } = req.query;
    const { startDate, endDate } = parseDateRange(range, qStart, qEnd);

    const genuineData = await getCachedGenuineUsers();

    let totalEnrolled = 0;
    let totalLearningHours = 0;
    let totalStreaks = 0;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const u = genuineData.userMap.get(String(userId)) || (await User.findById(userId).lean());
      if (u) {
        totalEnrolled = 1;
        totalLearningHours = u.learningHours || 0;
        totalStreaks = u.streak || 0;
      }
    } else {
      totalEnrolled = genuineData.users.length;
      totalLearningHours = genuineData.users.reduce((s, u) => s + (u.learningHours || 0), 0);
      totalStreaks = genuineData.users.reduce((s, u) => s + (u.streak || 0), 0);
    }

    const [subjectProgressDocs, codingProgressCount] = await Promise.all([
      SubjectProgress.find({
        ...(userId ? { userId } : { userId: { $in: genuineData.userIds } }),
        updatedAt: { $gte: startDate, $lte: endDate },
      }).lean(),
      CodingProgress.countDocuments(userId ? { userId } : { userId: { $in: genuineData.userIds } }),
    ]);

    // Track statistics calculations
    const trackStatsMap = {
      coding: { enrolled: 0, completedLessons: 0, totalHours: 0 },
      driving: { enrolled: 0, completedLessons: 0, totalHours: 0 },
      language: { enrolled: 0, completedLessons: 0, totalHours: 0 },
      fitness: { enrolled: 0, completedLessons: 0, totalHours: 0 },
    };

    subjectProgressDocs.forEach((doc) => {
      const key = doc.subjectKey || "coding";
      if (!trackStatsMap[key]) trackStatsMap[key] = { enrolled: 0, completedLessons: 0, totalHours: 0 };
      trackStatsMap[key].enrolled += 1;

      // Count completed modules
      if (doc.moduleProgress && typeof doc.moduleProgress === "object") {
        Object.values(doc.moduleProgress).forEach((mod) => {
          if (mod.isStudied || mod.assignmentPassed || mod.exercisePassed) {
            trackStatsMap[key].completedLessons += 1;
          }
          if (mod.studyTimeSeconds) {
            trackStatsMap[key].totalHours += Math.round(mod.studyTimeSeconds / 3600);
          }
        });
      }
    });

    trackStatsMap.coding.enrolled = Math.max(trackStatsMap.coding.enrolled, codingProgressCount);

    const tracks = [
      {
        id: "coding",
        name: "Coding & Software Engineering",
        enrolled: trackStatsMap.coding.enrolled,
        completionRate:
          trackStatsMap.coding.enrolled > 0
            ? Math.min(100, Math.round((trackStatsMap.coding.completedLessons / (trackStatsMap.coding.enrolled * 4 || 1)) * 100))
            : 0,
        hours: trackStatsMap.coding.totalHours || 0,
      },
      {
        id: "language",
        name: "Global Languages & Fluency",
        enrolled: trackStatsMap.language.enrolled,
        completionRate:
          trackStatsMap.language.enrolled > 0
            ? Math.min(100, Math.round((trackStatsMap.language.completedLessons / (trackStatsMap.language.enrolled * 4 || 1)) * 100))
            : 0,
        hours: trackStatsMap.language.totalHours || 0,
      },
      {
        id: "vehicles",
        name: "Vehicles & Mechanical Engineering",
        enrolled: trackStatsMap.driving.enrolled,
        completionRate:
          trackStatsMap.driving.enrolled > 0
            ? Math.min(100, Math.round((trackStatsMap.driving.completedLessons / (trackStatsMap.driving.enrolled * 4 || 1)) * 100))
            : 0,
        hours: trackStatsMap.driving.totalHours || 0,
      },
      {
        id: "fitness",
        name: "Health, Gym & Physical Conditioning",
        enrolled: trackStatsMap.fitness.enrolled,
        completionRate:
          trackStatsMap.fitness.enrolled > 0
            ? Math.min(100, Math.round((trackStatsMap.fitness.completedLessons / (trackStatsMap.fitness.enrolled * 4 || 1)) * 100))
            : 0,
        hours: trackStatsMap.fitness.totalHours || 0,
      },
    ];

    const totalActiveTracks = tracks.filter((t) => t.enrolled > 0);
    const avgCompletion =
      totalActiveTracks.length > 0
        ? Math.round(
            totalActiveTracks.reduce((acc, t) => acc + t.completionRate, 0) /
              totalActiveTracks.length
          )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalEnrolled,
        totalLearningHours,
        averageCompletionRate: avgCompletion,
        averageStreak: totalEnrolled > 0 ? (totalStreaks / totalEnrolled).toFixed(1) : 0,
        tracks,
      },
    });
  } catch (error) {
    console.error("Learning Analytics API Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch learning analytics" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CODING ANALYTICS — ACTUAL COMPILER EXECUTION DATA
// ─────────────────────────────────────────────────────────────────────────────
router.get("/coding-analytics", async (req, res) => {
  try {
    const {
      range = "30d",
      startDate: qStart,
      endDate: qEnd,
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      language = "all",
      all = "false",
    } = req.query;
    const { startDate, endDate } = parseDateRange(range, qStart, qEnd);

    const genuineData = await getCachedGenuineUsers();
    const genuineUsers = genuineData.users;
    const genuineUserIds = genuineData.userIds;

    const baseFilter = {
      userId: { $in: genuineUserIds },
    };
    if (String(range).toLowerCase() !== "all") {
      baseFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const [aggResult] = await ChallengeSubmission.aggregate([
      { $match: baseFilter },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          languages: [
            { $group: { _id: "$language", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          total: [
            { $count: "count" },
          ],
        },
      },
    ]);

    const totalSubmissions = aggResult?.total?.[0]?.count || 0;
    let acceptedCount = 0;
    let wrongAnswerCount = 0;
    let errorCount = 0;
    (aggResult?.statusCounts || []).forEach((sc) => {
      if (sc._id === "ACCEPTED") acceptedCount += sc.count;
      else if (sc._id === "WRONG_ANSWER" || sc._id === "PARTIAL") wrongAnswerCount += sc.count;
      else if (["RUNTIME_ERROR", "COMPILATION_ERROR", "TIME_LIMIT_EXCEEDED"].includes(sc._id)) errorCount += sc.count;
    });

    const accuracyRate =
      totalSubmissions > 0 ? Math.round((acceptedCount / totalSubmissions) * 100) : 0;
    const languages = aggResult?.languages || [];

    // Filter query for submissions list
    const listFilter = { ...baseFilter };

    if (status && status !== "all") {
      listFilter.status = status;
    }
    if (language && language !== "all") {
      listFilter.language = language;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      const matchedUserIds = genuineUsers
        .filter(u => regex.test(u.fullName) || regex.test(u.email) || regex.test(u.username) || (mongoose.Types.ObjectId.isValid(q) && String(u._id) === q))
        .map(u => u._id);

      const orConditions = [
        { challengeTitle: regex },
        { challengeId: regex },
        { userId: { $in: matchedUserIds } },
      ];
      if (mongoose.Types.ObjectId.isValid(q)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(q) });
      }
      listFilter.$or = orConditions;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = all === "true" || all === "1" ? 1000 : Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const totalFiltered = await ChallengeSubmission.countDocuments(listFilter);
    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;

    // High-speed recent submissions with candidate details (projected fields for instant performance)
    const Notification = require("../models/NotificationSchema");
    const recentSubmissions = await ChallengeSubmission.find(listFilter)
      .select("_id userId challengeId challengeTitle language code status score executionTime passedTests totalTests adminNote createdAt notificationSent notificationViewed notificationViewedAt notificationInAppId")
      .populate("userId", "fullName username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const pendingNotifIds = recentSubmissions
      .filter((s) => s.notificationInAppId && !s.notificationViewed)
      .map((s) => s.notificationInAppId);

    if (pendingNotifIds.length > 0) {
      const readNotifs = await Notification.find({ _id: { $in: pendingNotifIds }, isRead: true })
        .select("_id readAt updatedAt")
        .lean();
      const readMap = new Map();
      readNotifs.forEach((n) => readMap.set(String(n._id), n.readAt || n.updatedAt || new Date()));

      for (const sub of recentSubmissions) {
        if (sub.notificationInAppId && readMap.has(String(sub.notificationInAppId))) {
          sub.notificationViewed = true;
          sub.notificationViewedAt = readMap.get(String(sub.notificationInAppId));
        }
      }
    }

    res.status(200).json({
      success: true,
      metrics: {
        totalSubmissions,
        accepted: acceptedCount,
        wrongAnswer: wrongAnswerCount,
        errors: errorCount,
        accuracyRate,
        languages: languages.length > 0 ? languages : [{ _id: "python", count: 0 }],
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages,
      },
      recentSubmissions,
    });
  } catch (error) {
    console.error("Coding Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch coding analytics" });
  }
});

// Single Submission Details with Real-time Code & Notification View Audit
router.get("/coding-submissions/:id", async (req, res) => {
  try {
    const Notification = require("../models/NotificationSchema");
    const sub = await ChallengeSubmission.findById(req.params.id)
      .populate("userId", "fullName username email")
      .lean();

    if (!sub) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    let isViewed = sub.notificationViewed;
    let viewedAt = sub.notificationViewedAt;

    if (sub.notificationInAppId && !isViewed) {
      const notif = await Notification.findById(sub.notificationInAppId).select("isRead readAt").lean();
      if (notif && notif.isRead) {
        isViewed = true;
        viewedAt = notif.readAt || new Date();
        await ChallengeSubmission.updateOne(
          { _id: sub._id },
          { $set: { notificationViewed: true, notificationViewedAt: viewedAt } }
        );
      }
    }

    const payload = {
      ...sub,
      notificationViewed: isViewed,
      notificationViewedAt: viewedAt,
    };

    res.status(200).json({
      success: true,
      submission: payload,
      data: payload,
    });
  } catch (err) {
    console.error("Fetch coding submission error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch submission details" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. ASSESSMENTS MANAGEMENT — ACTUAL EXAM RECORDS
// ─────────────────────────────────────────────────────────────────────────────
router.get("/assessments", async (req, res) => {
  try {
    const {
      range = "30d",
      startDate: qStart,
      endDate: qEnd,
      page = 1,
      limit = 10,
      search = "",
      category = "all",
      status = "all",
      userId = "",
      all = "false",
    } = req.query;
    const { startDate, endDate } = parseDateRange(range, qStart, qEnd);

    const cacheKey = `assessments_base_${range}_${qStart || ""}_${qEnd || ""}_${userId || "all"}_${all}`;
    let cachedBase = getAdminCache(cacheKey, 15000);
    let allAssessments;
    let stats;
    let certAttempts = [];
    let moduleAttempts = [];

    if (cachedBase) {
      allAssessments = cachedBase.allAssessments;
      stats = cachedBase.stats;
      certAttempts = cachedBase.certAttempts || [];
      moduleAttempts = cachedBase.moduleAttempts || [];
    } else {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      let genuineUserIds = [];
      let genuineUserEmails = [];
      let resolveUser;

      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        const targetUser = await User.findById(userId).select("_id email fullName username").lean();
        const userMap = new Map();
        if (targetUser) {
          genuineUserIds = [targetUser._id];
          userMap.set(String(targetUser._id), targetUser);
          if (targetUser.email) {
            genuineUserEmails = [targetUser.email.toLowerCase()];
            userMap.set(targetUser.email.toLowerCase(), targetUser);
          }
        }
        resolveUser = (uId, email) => {
          if (uId && userMap.has(String(uId))) return userMap.get(String(uId));
          if (email && userMap.has(email.toLowerCase())) return userMap.get(email.toLowerCase());
          return null;
        };
      } else {
        const genuineData = await getCachedGenuineUsers();
        genuineUserIds = genuineData.userIds;
        genuineUserEmails = genuineData.userEmails;
        resolveUser = genuineData.resolveUser;
      }

      const baseDateFilter =
        String(range).toLowerCase() === "all"
          ? {}
          : { createdAt: { $gte: startDate, $lte: endDate } };

      const perModelLimit = all === "true" || all === "1" ? 500 : Math.min(200, Math.max(50, pageNum * limitNum * 3));

      let challengeSubs, projectSubs, proctoredSessions;
      [certAttempts, moduleAttempts, challengeSubs, projectSubs, proctoredSessions] = await Promise.all([
        CertificationAttempt.find({
          ...baseDateFilter,
          $or: [{ userId: { $in: genuineUserIds } }, { candidateEmail: { $in: genuineUserEmails } }],
        })
          .select("_id attemptId userId candidateName candidateEmail certTitle percentage score status finalVerdict submittedAt createdAt durationMinutes certificateId")
          .sort({ createdAt: -1 })
          .limit(perModelLimit)
          .lean(),
        ModuleAssessmentAttempt.find({
          ...baseDateFilter,
          $or: [
            { userId: { $in: genuineUserIds } },
            { candidateEmail: { $in: genuineUserEmails } },
            { userEmail: { $in: genuineUserEmails } },
          ],
        })
          .select("_id sessionId userId candidateEmail userEmail assessmentTitle moduleTitle totalQuestions score percentage passed submittedAt createdAt timeSpentSeconds")
          .sort({ createdAt: -1 })
          .limit(perModelLimit)
          .lean(),
        ChallengeSubmission.find({
          ...baseDateFilter,
          userId: { $in: genuineUserIds },
        })
          .select("_id userId challengeTitle challengeId totalTests passedTests score status createdAt runtimeMs")
          .sort({ createdAt: -1 })
          .limit(perModelLimit)
          .lean(),
        ProjectSubmission.find({
          ...baseDateFilter,
          $or: [{ userId: { $in: genuineUserIds } }, { "candidateDetails.email": { $in: genuineUserEmails } }],
        })
          .select("_id sessionId userId candidateDetails projectTitle totalMarks marksObtained percentage passed status passingMarks submittedAt createdAt")
          .sort({ createdAt: -1 })
          .limit(perModelLimit)
          .lean(),
        ProctoredCodingSession.find({
          ...baseDateFilter,
          $or: [{ userId: { $in: genuineUserIds } }, { "candidateDetails.email": { $in: genuineUserEmails } }],
        })
          .select("_id sessionId userId assessmentTitle questionId status durationSeconds score violationsCount deviceInfo violationFlags recordingUrl submissionResult submittedAt createdAt candidateDetails")
          .sort({ createdAt: -1 })
          .limit(perModelLimit)
          .lean(),
      ]);

      const formattedCerts = certAttempts.map((c) => {
        const uObj = resolveUser(c.userId, c.candidateEmail);
        const pct = c.percentage != null ? c.percentage : (c.score != null ? c.score : 0);
        const isPassed = c.status === "PASSED" || c.finalVerdict === "PASSED" || pct >= 70;
        return {
          id: c._id,
          rawId: c._id,
          itemType: "certification",
          attemptId: c.attemptId,
          userId: c.userId ? String(c.userId) : (uObj?._id ? String(uObj._id) : ""),
          user: c.candidateName || uObj?.fullName || uObj?.username || "Candidate",
          email: c.candidateEmail || uObj?.email || "",
          title: c.certTitle || "Data Structures & Algorithms (DSA)",
          type: "Certification",
          category: "Certification",
          score: `${pct}%`,
          rawScore: pct,
          maxScore: 100,
          status: isPassed ? "Passed" : c.status === "IN_PROGRESS" ? "In Progress" : "Failed",
          passed: isPassed,
          date: c.submittedAt || c.createdAt,
          timeSpent: c.durationMinutes ? `${c.durationMinutes}m` : "N/A",
          verificationCode: c.certificateId || String(c.attemptId || c._id).slice(-8).toUpperCase(),
        };
      });

      const formattedMcqs = moduleAttempts.map((m) => {
        const uObj = resolveUser(m.userId, m.candidateEmail || m.userEmail);
        const totalQ = m.totalQuestions || 10;
        const scoreVal = m.score != null ? m.score : 0;
        const pct = m.percentage != null ? m.percentage : Math.round((scoreVal / totalQ) * 100);
        return {
          id: m._id,
          rawId: m._id,
          itemType: "module",
          attemptId: m.sessionId || m._id,
          userId: m.userId ? String(m.userId) : (uObj?._id ? String(uObj._id) : ""),
          user: uObj?.fullName || uObj?.username || "Candidate",
          email: uObj?.email || m.candidateEmail || m.userEmail || "",
          title: m.assessmentTitle || m.moduleTitle || "Module MCQ Test",
          type: "MCQ Assessment",
          category: "MCQ Assessment",
          score: `${scoreVal}/${totalQ} (${pct}%)`,
          rawScore: scoreVal,
          maxScore: totalQ,
          status: m.passed ? "Passed" : "Failed",
          passed: Boolean(m.passed),
          date: m.submittedAt || m.createdAt,
          timeSpent: m.timeSpentSeconds ? `${Math.round(m.timeSpentSeconds / 60)}m` : "N/A",
          verificationCode: String(m.sessionId || m._id).slice(-8).toUpperCase(),
        };
      });

      const formattedCoding = challengeSubs.map((s) => {
        const uObj = resolveUser(s.userId);
        const totalT = s.totalTests || 10;
        const passedT = s.passedTests != null ? s.passedTests : 0;
        const pct = s.score != null ? s.score : Math.round((passedT / totalT) * 100);
        const isAccepted = s.status === "ACCEPTED" || passedT === totalT;
        return {
          id: s._id,
          rawId: s._id,
          itemType: "coding",
          attemptId: s._id,
          userId: s.userId ? String(s.userId) : "",
          user: uObj?.fullName || uObj?.username || "Candidate",
          email: uObj?.email || "",
          title: s.challengeTitle || s.challengeId || "Coding Challenge Assessment",
          type: "Coding Assessment",
          category: "Coding Assessment",
          score: `${passedT}/${totalT} (${pct}%)`,
          rawScore: passedT,
          maxScore: totalT,
          status: isAccepted ? "Passed" : "Failed",
          passed: isAccepted,
          date: s.createdAt,
          timeSpent: s.runtimeMs ? `${s.runtimeMs}ms` : "N/A",
          verificationCode: String(s._id).slice(-8).toUpperCase(),
        };
      });

      const formattedProjects = projectSubs.map((p) => {
        const uObj = resolveUser(p.userId, p.candidateDetails?.email);
        const maxScore = p.totalMarks || 100;
        const scoreVal = p.marksObtained != null ? p.marksObtained : 0;
        const pct = p.percentage != null ? p.percentage : Math.round((scoreVal / maxScore) * 100);
        const isPassed = Boolean(p.passed || p.status === "PASSED" || scoreVal >= (p.passingMarks || 80));
        return {
          id: p._id,
          rawId: p._id,
          itemType: "project",
          attemptId: p.sessionId || p._id,
          userId: p.userId ? String(p.userId) : (uObj?._id ? String(uObj._id) : ""),
          user: p.candidateDetails?.fullName || uObj?.fullName || uObj?.username || "Candidate",
          email: p.candidateDetails?.email || uObj?.email || "",
          title: p.projectTitle || "Practical Project Assignment",
          type: "Project Assignment",
          category: "Project Assignment",
          score: `${scoreVal}/${maxScore} (${pct}%)`,
          rawScore: scoreVal,
          maxScore,
          status: isPassed ? "Passed" : "Needs Improvement",
          passed: isPassed,
          date: p.submittedAt || p.createdAt,
          timeSpent: "Project",
          verificationCode: String(p.sessionId || p._id).slice(-8).toUpperCase(),
        };
      });

      const formattedProctored = proctoredSessions.map((p) => {
        const uObj = resolveUser(p.userId, p.candidateDetails?.email);
        const user = p.candidateDetails?.fullName || uObj?.fullName || uObj?.username || "Candidate";
        const email = p.candidateDetails?.email || uObj?.email || "";
        const score = p.submissionResult?.score != null ? p.submissionResult.score : (p.score != null ? p.score : 0);
        const isPassed = p.status === "submitted" && (score >= 70 || p.submissionResult?.passed);
        return {
          id: p._id,
          rawId: p._id,
          itemType: "proctoring",
          attemptId: p.sessionId,
          userId: p.userId ? String(p.userId) : (uObj?._id ? String(uObj._id) : ""),
          user,
          email,
          title: p.assessmentTitle || "Proctored Coding Exam",
          type: "Proctored Exam",
          category: "Proctored Exam",
          score: `${score}/100 (${score}%)`,
          rawScore: score,
          maxScore: 100,
          status: isPassed ? "Passed" : p.status === "terminated" ? "Terminated" : p.status === "active" ? "In Progress" : "Failed",
          passed: isPassed,
          date: p.submissionResult?.submittedAt || p.updatedAt || p.createdAt,
          timeSpent: p.durationSeconds ? `${Math.round(p.durationSeconds / 60)}m` : "N/A",
          verificationCode: String(p.sessionId).slice(-8).toUpperCase(),
        };
      });

      allAssessments = [...formattedCerts, ...formattedProctored, ...formattedMcqs, ...formattedCoding, ...formattedProjects].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      const totalCount = allAssessments.length;
      const passedCount = allAssessments.filter((a) => a.passed).length;
      const passPercentage = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
      stats = {
        total: totalCount,
        passed: passedCount,
        failed: totalCount - passedCount,
        passPercentage,
        certificationsCount: formattedCerts.length,
        mcqCount: formattedMcqs.length,
        codingCount: formattedCoding.length,
        projectCount: formattedProjects.length,
        proctoredCount: formattedProctored.length,
      };

      setAdminCache(cacheKey, { allAssessments, stats, certAttempts, moduleAttempts });
    }

    // Filter unified records
    let filteredAssessments = allAssessments;

    // 1. Category Filter
    if (category && category !== "all") {
      filteredAssessments = filteredAssessments.filter((item) => {
        if (category === "Certification") return item.type === "Certification";
        if (category === "MCQ Assessment") return item.type === "MCQ Assessment";
        if (category === "Coding Assessment" || category === "Coding Challenge") return item.type === "Coding Assessment";
        if (category === "Project Assignment" || category === "Project") return item.type === "Project Assignment";
        if (category === "Proctored Exam" || category === "Proctoring") return item.type === "Proctored Exam";
        return item.category === category || item.type === category;
      });
    }

    // 2. Status Filter
    if (status && status !== "all") {
      const targetStatus = status.toLowerCase();
      filteredAssessments = filteredAssessments.filter((item) => {
        const itemStatus = (item.status || "").toLowerCase();
        if (targetStatus === "passed") return item.passed || itemStatus === "passed";
        if (targetStatus === "failed") return !item.passed && itemStatus !== "in progress";
        if (targetStatus === "in progress") return itemStatus === "in progress";
        if (targetStatus === "needs improvement") return itemStatus === "needs improvement";
        return itemStatus === targetStatus;
      });
    }

    // 3. Search Filter (User ID, Name, Email, Title, Code)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredAssessments = filteredAssessments.filter((item) => {
        return (
          (item.user && item.user.toLowerCase().includes(q)) ||
          (item.email && item.email.toLowerCase().includes(q)) ||
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.verificationCode && item.verificationCode.toLowerCase().includes(q)) ||
          (item.score && item.score.toLowerCase().includes(q)) ||
          (item.userId && item.userId.toLowerCase().includes(q)) ||
          (item.id && String(item.id).toLowerCase().includes(q)) ||
          (item.attemptId && String(item.attemptId).toLowerCase().includes(q))
        );
      });
    }

    // 4. Server-side Pagination (10 records per page)
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum =
      all === "true" || all === "1"
        ? filteredAssessments.length || 1
        : Math.max(1, parseInt(limit, 10) || 10);
    const totalFiltered = filteredAssessments.length;
    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;
    const skip = (pageNum - 1) * limitNum;
    const pagedAssessments = filteredAssessments.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages,
      },
      assessments: pagedAssessments,
      certificationAttempts: certAttempts,
      moduleAttempts,
    });
  } catch (error) {
    console.error("Assessments fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch assessments", error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. PROCTORING INTEGRITY — REAL HARDWARE & VIOLATION TELEMETRY
// ─────────────────────────────────────────────────────────────────────────────
router.get("/proctoring", async (req, res) => {
  try {
    const {
      q,
      status,
      dateRange,
      page = 1,
      limit = 10,
      all = "false",
    } = req.query;
    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (q && q.trim()) {
      const trimmedQ = q.trim();
      const regex = new RegExp(trimmedQ, "i");
      const orConditions = [
        { "candidateDetails.fullName": regex },
        { "candidateDetails.email": regex },
        { assessmentTitle: regex },
        { sessionId: regex },
        { questionId: regex },
      ];
      if (mongoose.Types.ObjectId.isValid(trimmedQ)) {
        orConditions.push({ userId: new mongoose.Types.ObjectId(trimmedQ) });
      }
      query.$or = orConditions;
    }

    if (dateRange && dateRange !== "all") {
      const now = new Date();
      if (dateRange === "today") {
        const start = new Date(now.setHours(0, 0, 0, 0));
        query.createdAt = { $gte: start };
      } else if (dateRange === "yesterday") {
        const yStart = new Date(now.setDate(now.getDate() - 1));
        yStart.setHours(0, 0, 0, 0);
        const yEnd = new Date(yStart);
        yEnd.setHours(23, 59, 59, 999);
        query.createdAt = { $gte: yStart, $lte: yEnd };
      } else if (dateRange === "30d") {
        const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: d30 };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = all === "true" || all === "1" ? 1000 : Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [totalFiltered, sessions, activeSessionsCount, totalMonitored] = await Promise.all([
      ProctoredCodingSession.countDocuments(query),
      ProctoredCodingSession.find(query)
        .select("_id sessionId userId assessmentTitle questionId status durationSeconds score maxScore submissionResult violationsCount deviceInfo violationFlags recordingUrl recordingStatus submittedAt createdAt serverStartTime candidateDetails")
        .populate("userId", "fullName username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProctoredCodingSession.countDocuments({ status: "active" }),
      ProctoredCodingSession.estimatedDocumentCount(),
    ]);

    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;

    const enrichedSessions = sessions.map((s) => {
      const userObj = s.userId && typeof s.userId === "object" ? s.userId : null;
      const candidate = {
        fullName: s.candidateDetails?.fullName || userObj?.fullName || userObj?.username || "Candidate",
        email: s.candidateDetails?.email || userObj?.email || "",
        avatar: userObj?.avatar || "",
      };

      const cameraGranted = s.deviceInfo?.camera === true || s.deviceInfo?.cameraPermission === "Granted";
      const screenShareGranted = s.deviceInfo?.screenShare === true || s.deviceInfo?.screenSharePermission === "Granted";
      const resolvedScore = s.score != null ? s.score : (s.submissionResult?.score ?? null);
      const resolvedDuration = s.durationSeconds || s.submissionResult?.durationSeconds || 0;

      return {
        ...s,
        score: resolvedScore,
        durationSeconds: resolvedDuration,
        submittedAt: s.submittedAt || s.submissionResult?.submittedAt || null,
        candidateDetails: candidate,
        cameraGranted,
        screenShareGranted,
        recordingUrl: s.recordingUrl || "",
        recordingStatus: s.recordingStatus || (s.recordingUrl ? "available" : "not_recorded"),
      };
    });

    let totalViolations = 0;
    let cameraActiveCount = 0;
    let micActiveCount = 0;
    let screenActiveCount = 0;

    enrichedSessions.forEach((s) => {
      totalViolations += Number(s.violationsCount || 0);
      if (s.deviceInfo?.camera === true) cameraActiveCount++;
      if (s.deviceInfo?.microphone === true) micActiveCount++;
      if (s.deviceInfo?.screenShare === true) screenActiveCount++;
    });

    res.status(200).json({
      success: true,
      stats: {
        activeSessions: activeSessionsCount,
        totalMonitored,
        totalViolations,
        cameraOnline: cameraActiveCount > 0,
        microphoneOnline: micActiveCount > 0,
        screenSharingOnline: screenActiveCount > 0,
        cameraActiveCount,
        micActiveCount,
        screenActiveCount,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages,
      },
      sessions: enrichedSessions,
    });
  } catch (error) {
    console.error("Proctoring fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch proctoring sessions" });
  }
});

// Single Proctoring Session Full Audit Detail — Strictly Real, Verified, Zero Fabrication
router.get("/proctoring/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ProctoredCodingSession.findOne({ sessionId }).lean();
    if (!session) {
      return res.status(404).json({ success: false, message: `Session ${sessionId} not found` });
    }

    const Notification = require("../models/NotificationSchema");
    const Recording = require("../models/Recording");
    const { getFileFromGridFS } = require("../config/recordingStorage");

    // Lookup user details
    let candidateUser = null;
    if (session.userId && mongoose.Types.ObjectId.isValid(session.userId)) {
      candidateUser = await User.findById(session.userId)
        .select("fullName username email avatar role createdAt")
        .lean();
    }

    // Strict Session Linking ONLY — never match broadly by { userId } alone
    let linkedAttempt = await CertificationAttempt.findOne({
      proctoringSessionId: session.sessionId,
    }).lean();

    if (!linkedAttempt) {
      linkedAttempt = await ModuleAssessmentAttempt.findOne({
        sessionId: session.sessionId,
      }).lean();
    }

    // ─── 1. Genuine Recording Verification (Disk + GridFS + DB Recording) ───
    const recordingsDir = getRecordingsDir();
    const linkedRecording = await Recording.findOne({
      $or: [
        ...(session.recordingId ? [{ recordingId: session.recordingId }] : []),
        { meetingId: session.sessionId, recordingType: "Proctoring" },
      ],
    }).lean();

    let resolvedUrl = session.recordingUrl || linkedRecording?.streamUrl || linkedRecording?.fileUrl || "";
    let resolvedFileSize = session.recordingFileSize || linkedRecording?.fileSize || 0;
    let resolvedDuration = session.recordingDurationSeconds || linkedRecording?.durationSeconds || 0;
    let resolvedMimeType = session.recordingMimeType || linkedRecording?.mimeType || "";
    let resolvedStatus = session.recordingStatus || "not_recorded";
    let recordingExistsInStorage = false;
    let recordingError = session.recordingUploadError || "";

    if (resolvedUrl) {
      const recFilename = path.basename(resolvedUrl.split("?")[0]);
      const localPath = path.join(recordingsDir, recFilename);
      if (fs.existsSync(localPath)) {
        try {
          const stat = fs.statSync(localPath);
          if (stat.size > 0) {
            recordingExistsInStorage = true;
            if (!resolvedFileSize) resolvedFileSize = stat.size;
          }
        } catch {}
      }
      if (!recordingExistsInStorage) {
        try {
          const gridFile = await getFileFromGridFS(recFilename);
          if (gridFile && gridFile.length > 0) {
            recordingExistsInStorage = true;
            if (!resolvedFileSize) resolvedFileSize = gridFile.length;
          }
        } catch {}
      }

      if (recordingExistsInStorage) {
        resolvedStatus = "available";
      } else if (["completed", "available"].includes(resolvedStatus)) {
        resolvedStatus = "failed";
        recordingError = recordingError || "Recording file is missing from persistent storage.";
      }
    } else if (resolvedStatus === "completed") {
      // Fix legacy default "completed" when no recording URL ever existed
      resolvedStatus = "not_recorded";
    }

    const recordingInfo = {
      recordingId: session.recordingId || linkedRecording?.recordingId || "",
      url: recordingExistsInStorage ? resolvedUrl : "",
      durationSeconds: resolvedDuration,
      fileSize: resolvedFileSize,
      mimeType: resolvedMimeType,
      startedAt: session.recordingStartedAt || linkedRecording?.startTime || null,
      completedAt: session.recordingCompletedAt || linkedRecording?.endTime || null,
      status: resolvedStatus, // "not_recorded" | "recording" | "uploading" | "processing" | "available" | "failed"
      verifiedInStorage: recordingExistsInStorage,
      error: recordingError,
    };

    // ─── 2. Strict Violations vs Lifecycle Events & Evidence Linking ───
    const LIFECYCLE_TYPES = new Set([
      "session_created",
      "session_initialized",
      "session_resumed",
      "assessment_finalized",
      "heartbeat",
    ]);

    const evidenceMapByEventId = {};
    (session.evidenceScreenshots || []).forEach((ev) => {
      if (ev.violationEventId && ev.url) {
        evidenceMapByEventId[ev.violationEventId] = ev.url;
      }
    });

    const rawLogs = Array.isArray(session.violationsLog) ? session.violationsLog : [];
    const lifecycleEvents = [];
    const genuineViolations = [];

    for (const v of rawLogs) {
      const normalizedType = String(v.type || "").toLowerCase();
      if (LIFECYCLE_TYPES.has(normalizedType)) {
        lifecycleEvents.push({
          type: v.type,
          detail: v.detail || "",
          timestamp: v.timestamp || null,
        });
        continue;
      }

      // Only attach screenshotUrl if explicitly linked to this event or violationEventId
      const linkedScreenshotUrl = v.screenshotUrl || (v.eventId ? evidenceMapByEventId[v.eventId] : "") || null;
      genuineViolations.push({
        eventId: v.eventId || "",
        type: v.type || "unspecified_event",
        detail: v.detail || "",
        severity: v.severity || "warning",
        durationSeconds: v.durationSeconds || 0,
        screenshotUrl: linkedScreenshotUrl,
        screenshotCaptured: Boolean(linkedScreenshotUrl),
        screenshotReason: v.screenshotReason || (linkedScreenshotUrl ? "Captured" : "Not captured"),
        timestamp: v.timestamp || null,
      });
    }

    // ─── 3. Honest Hardware & Browser Telemetry ───
    const dev = session.deviceInfo || {};
    const resolveBoolState = (val, perm, stream) => {
      if (perm) return perm;
      if (val === true) return "Granted";
      if (val === false) return "Denied";
      if (stream && stream !== "Not Recorded") return stream;
      return "Not Recorded";
    };

    const hardware = {
      camera: resolveBoolState(dev.camera, dev.cameraPermission, dev.cameraStreamStatus),
      cameraPermission: dev.cameraPermission || (dev.camera === true ? "Granted" : dev.camera === false ? "Denied" : "Not Recorded"),
      cameraStreamStatus: dev.cameraStreamStatus || (dev.camera === true ? "Active" : dev.camera === false ? "Inactive" : "Not Recorded"),
      cameraLabel: dev.cameraLabel || "",
      cameraDisconnections: typeof dev.cameraDisconnections === "number" ? dev.cameraDisconnections : null,

      microphone: resolveBoolState(dev.microphone, dev.microphonePermission, dev.microphoneStreamStatus),
      microphonePermission: dev.microphonePermission || (dev.microphone === true ? "Granted" : dev.microphone === false ? "Denied" : "Not Recorded"),
      microphoneStreamStatus: dev.microphoneStreamStatus || (dev.microphone === true ? "Active" : dev.microphone === false ? "Inactive" : "Not Recorded"),
      microphoneLabel: dev.microphoneLabel || "",
      microphoneDisconnections: typeof dev.microphoneDisconnections === "number" ? dev.microphoneDisconnections : null,

      screenShare: resolveBoolState(dev.screenShare, dev.screenSharePermission, dev.screenShareStreamStatus),
      screenSharePermission: dev.screenSharePermission || (dev.screenShare === true ? "Granted" : dev.screenShare === false ? "Denied" : "Not Recorded"),
      screenShareStreamStatus: dev.screenShareStreamStatus || (dev.screenShare === true ? "Active" : dev.screenShare === false ? "Inactive" : "Not Recorded"),
      displaySurface: dev.displaySurface || "",

      fullscreen: dev.fullscreen === true ? "Enforced" : dev.fullscreen === false ? "Exited" : "Not Recorded",
      windowFocused: dev.windowFocused === true ? "Focused" : dev.windowFocused === false ? "Focus Lost" : "Not Recorded",
      fullscreenExitsCount: typeof dev.fullscreenExitsCount === "number" ? dev.fullscreenExitsCount : null,
      focusLossCount: typeof dev.focusLossCount === "number" ? dev.focusLossCount : null,

      batterySupported: dev.battery?.supported === true ? true : dev.battery?.supported === false ? false : null,
      batteryPercentage: dev.battery?.supported === true && typeof dev.battery?.percentage === "number" ? dev.battery.percentage : null,
      batteryCharging: dev.battery?.supported === true && typeof dev.battery?.charging === "boolean" ? dev.battery.charging : null,

      browser: dev.browser || "",
      platform: dev.platform || "",
      screenResolution: dev.screenResolution || "",
      connectionType: dev.connectionType || "",
      monitoringActive: Boolean(dev.monitoringActive),
      telemetryUpdatedAt: dev.telemetryUpdatedAt || session.lastHeartbeat || null,
    };

    // ─── 4. In-App Notification Read Status ───
    let notificationViewed = session.notificationViewed || false;
    let notificationViewedAt = session.notificationViewedAt || null;
    if (session.notificationInAppId) {
      try {
        const notifDoc = await Notification.findById(session.notificationInAppId).lean();
        if (notifDoc && notifDoc.isRead) {
          notificationViewed = true;
          notificationViewedAt = notifDoc.readAt || notifDoc.updatedAt || null;
        }
      } catch (nErr) {
        console.warn("Notification read check error:", nErr.message);
      }
    }

    // ─── 5. Genuine Questions & Submitted Code Breakdown (ZERO Fabrication) ───
    let questionsBreakdown = [];
    if (Array.isArray(session.questions) && session.questions.length > 0) {
      questionsBreakdown = session.questions.map((q) => {
        const hasRealCode = Boolean(q.submittedCode && String(q.submittedCode).trim().length > 0);
        const wasAttempted = Boolean(q.attempted || q.submittedAt || (q.testResults && q.testResults.length > 0));
        return {
          questionId: q.questionId,
          title: q.title,
          difficulty: q.difficulty || "",
          category: q.category || "",
          description: q.description || "",
          submittedCode: hasRealCode ? q.submittedCode : "",
          language: q.language || "",
          status: wasAttempted ? (q.status || "EVALUATED") : "NO_SUBMISSION",
          score: q.score ?? null,
          marksObtained: q.marksObtained ?? null,
          totalMarks: q.totalMarks ?? null,
          passedTests: wasAttempted ? (q.passedTests ?? 0) : 0,
          totalTests: Array.isArray(q.testResults) && q.testResults.length > 0 ? q.testResults.length : (q.totalTests ?? 0),
          testResults: Array.isArray(q.testResults) ? q.testResults : [],
          runtimeMs: q.runtimeMs ?? null,
          memoryMb: q.memoryMb ?? null,
          submittedAt: q.submittedAt || null,
          attempted: wasAttempted,
        };
      });
    } else if (session.submissionResult && session.submissionResult.submittedAt) {
      questionsBreakdown = [
        {
          questionId: session.questionId || "",
          title: session.problemData?.title || session.assessmentTitle || "Proctored Assessment",
          difficulty: session.problemData?.difficulty || "",
          category: session.problemData?.category || "",
          description: session.problemData?.description || "",
          submittedCode: session.submissionResult.code || "",
          language: session.submissionResult.language || "",
          status: session.submissionResult.status || "SUBMITTED",
          score: session.submissionResult.score ?? null,
          marksObtained: session.submissionResult.marksObtained ?? session.submissionResult.score ?? null,
          totalMarks: session.submissionResult.totalMarks ?? 100,
          passedTests: session.submissionResult.passedTests ?? 0,
          totalTests: session.submissionResult.totalTests ?? 0,
          testResults: Array.isArray(session.submissionResult.testResults) ? session.submissionResult.testResults : [],
          submittedAt: session.submissionResult.submittedAt,
          attempted: true,
        },
      ];
    }

    // ─── 6. Accurate Session Duration & Score ───
    const resolvedScore = session.score != null ? session.score : (session.submissionResult?.score ?? null);
    const resolvedMaxScore = session.maxScore || session.submissionResult?.totalMarks || 100;
    let resolvedSessionDuration = session.durationSeconds || session.submissionResult?.durationSeconds || 0;
    if (!resolvedSessionDuration && session.submittedAt && session.serverStartTime) {
      resolvedSessionDuration = Math.max(
        1,
        Math.round((new Date(session.submittedAt).getTime() - new Date(session.serverStartTime).getTime()) / 1000) -
          (session.totalPauseDurationSeconds || 0)
      );
    }

    res.status(200).json({
      success: true,
      session: {
        ...session,
        score: resolvedScore,
        maxScore: resolvedMaxScore,
        durationSeconds: resolvedSessionDuration,
        submittedAt: session.submittedAt || session.submissionResult?.submittedAt || null,
        violationsCount: genuineViolations.length,
        violationsLog: genuineViolations,
        lifecycleEvents,
        evidenceScreenshots: session.evidenceScreenshots || [],
        recordingUrl: recordingInfo.url,
        recordingStatus: recordingInfo.status,
        notificationViewed,
        notificationViewedAt,
      },
      candidate: {
        fullName: session.candidateDetails?.fullName || candidateUser?.fullName || candidateUser?.username || "Candidate",
        email: session.candidateDetails?.email || candidateUser?.email || "",
        username: candidateUser?.username || "",
        avatar: candidateUser?.avatar || "",
        role: candidateUser?.role || "student",
        userId: session.userId,
      },
      hardware,
      recording: recordingInfo,
      questionsBreakdown,
      marksHistory: session.marksHistory || [],
      linkedAttemptId: linkedAttempt?._id || null,
    });
  } catch (error) {
    console.error("Proctoring session detail error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch proctoring session details" });
  }
});

// Mark student notification as viewed
router.patch("/proctoring/session/:sessionId/mark-viewed", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ProctoredCodingSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    const Notification = require("../models/NotificationSchema");

    session.notificationViewed = true;
    session.notificationViewedAt = new Date();
    await session.save();

    if (session.notificationInAppId) {
      try {
        await Notification.findByIdAndUpdate(session.notificationInAppId, { isRead: true, readAt: new Date() });
      } catch (e) {}
    }

    require("../utils/proctoringSync").emitProctoringSessionUpdate(
      req.app.get("io"),
      session.sessionId,
      "notification_viewed",
      {
        notificationViewed: true,
        notificationViewedAt: session.notificationViewedAt,
      }
    );

    res.status(200).json({
      success: true,
      message: "Notification marked as viewed",
      notificationViewed: true,
      notificationViewedAt: session.notificationViewedAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. CENTRALIZED REPORTS
// ─────────────────────────────────────────────────────────────────────────────
router.get("/reports", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "all",
      range = "all",
      startDate: qStart,
      endDate: qEnd,
      all = "false",
    } = req.query;

    const { startDate, endDate } = range && range !== "all"
      ? parseDateRange(range, qStart, qEnd)
      : { startDate: new Date(0), endDate: new Date(Date.now() + 86400000) };

    const cacheKey = `reports_base_${range}_${qStart || ""}_${qEnd || ""}_${all}`;
    let cachedBase = getAdminCache(cacheKey, 15000);
    let allReports, certReports, assessReports, mcqReports, projectReports, codingReports, challengeReports;

    if (cachedBase) {
      ({ allReports, certReports, assessReports, mcqReports, projectReports, codingReports, challengeReports } = cachedBase);
    } else {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const { userIds: genuineUserIds, userEmails: genuineUserEmails, resolveUser } = await getCachedGenuineUsers();

      const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
      const perModelLimit = all === "true" || all === "1" ? 1000 : Math.min(250, Math.max(50, pageNum * limitNum * 3));

      const [certs, attempts, moduleAttempts, projectSubs, codingSessions, challengeSubs] = await Promise.all([
        IssuedCertificate.find({
          $and: [
            dateFilter,
            { $or: [{ userId: { $in: genuineUserIds } }, { candidateEmail: { $in: genuineUserEmails } }] },
          ],
        })
          .select("_id attemptId certificateId verificationCode certificationTitle certTitle recipientName candidateEmail userId mcqScorePercentage percentage issueDate issuedAt createdAt status")
          .sort({ issueDate: -1, issuedAt: -1, createdAt: -1 })
          .limit(perModelLimit)
          .lean(),
        CertificationAttempt.find({
          $and: [
            dateFilter,
            { $or: [{ userId: { $in: genuineUserIds } }, { candidateEmail: { $in: genuineUserEmails } }] },
          ],
        })
          .select("_id attemptId userId candidateName candidateEmail certTitle percentage score passed status finalVerdict certificateId submittedAt createdAt")
          .sort({ createdAt: -1 })
          .limit(perModelLimit)
          .lean(),
        ModuleAssessmentAttempt.find({
          $and: [
            dateFilter,
            {
              $or: [
                { userId: { $in: genuineUserIds } },
                { candidateEmail: { $in: genuineUserEmails } },
                { userEmail: { $in: genuineUserEmails } },
              ],
            },
          ],
        })
          .select("_id sessionId userId candidateEmail userEmail assessmentTitle moduleTitle totalQuestions score percentage passed submittedAt createdAt timeSpentSeconds accuracy")
          .sort({ createdAt: -1 })
          .limit(perModelLimit)
          .lean(),
        ProjectSubmission.find({
          $and: [
            dateFilter,
            { $or: [{ userId: { $in: genuineUserIds } }, { "candidateDetails.email": { $in: genuineUserEmails } }] },
          ],
        })
          .select("_id sessionId projectId projectTitle projectCategory difficulty userId candidateDetails marksObtained totalMarks percentage grade passed status badgeAwarded passedTests totalTests submittedAt createdAt")
          .sort({ submittedAt: -1, createdAt: -1 })
          .limit(perModelLimit)
          .lean(),
        ProctoredCodingSession.find({
          $and: [
            dateFilter,
            { $or: [{ status: "submitted" }, { "submissionResult.submittedAt": { $exists: true } }] },
            { $or: [{ userId: { $in: genuineUserIds } }, { "candidateDetails.email": { $in: genuineUserEmails } }] },
          ],
        })
          .select("_id sessionId questionId assessmentTitle trackId userId candidateDetails status submissionResult questions.title questions.score questions.totalTests questions.passedTests updatedAt createdAt violationsCount")
          .sort({ updatedAt: -1 })
          .limit(perModelLimit)
          .lean(),
        ChallengeSubmission.find({
          $and: [
            dateFilter,
            { userId: { $in: genuineUserIds } },
          ],
        })
          .select("_id userId challengeTitle challengeId totalTests passedTests score status createdAt runtimeMs adminNote language")
          .sort({ createdAt: -1 })
          .limit(perModelLimit)
          .lean(),
      ]);

      const attemptMap = new Map();
      attempts.forEach((a) => {
        if (a.attemptId) attemptMap.set(String(a.attemptId), a);
      });

      certReports = certs.map((c) => {
        const uObj = resolveUser(c.userId, c.candidateEmail);
        const matchedAttempt = c.attemptId ? attemptMap.get(String(c.attemptId)) : null;
        const pct = c.mcqScorePercentage != null ? c.mcqScorePercentage : (c.percentage || 100);
        const title = `${c.certificationTitle || c.certTitle || matchedAttempt?.certTitle || "Data Structures & Algorithms (DSA)"} — Official Certificate`;
        const recipient = c.recipientName || matchedAttempt?.candidateName || uObj?.fullName || uObj?.username || "Verified Student";
        const email = uObj?.email || matchedAttempt?.candidateEmail || c.candidateEmail || "";
        return {
          id: c._id,
          rawId: c._id,
          itemType: "certificate",
          attemptId: c.attemptId,
          title,
          type: "Certification Report",
          recipient,
          email,
          score: `${pct}%`,
          rawScore: pct,
          grade: pct >= 90 ? "Distinction" : "First Class",
          verificationCode: c.certificateId || c.verificationCode || "MZ-CERT",
          date: c.issueDate || c.issuedAt || c.createdAt,
          status: c.status || "VALID",
          reportUrl: `/assessment-report/${c.attemptId || c.certificateId}`,
        };
      });

      assessReports = attempts.map((a) => {
        const uObj = resolveUser(a.userId, a.candidateEmail);
        const pct = a.percentage != null ? a.percentage : (a.score != null ? a.score : 0);
        const isQualified = a.status === "PASSED" || a.finalVerdict === "PASSED" || pct >= 70;
        return {
          id: a._id,
          rawId: a._id,
          itemType: "certification",
          attemptId: a.attemptId,
          title: `${a.certTitle || "Data Structures & Algorithms (DSA)"} — Assessment Scorecard`,
          type: "Assessment Report",
          recipient: a.candidateName || uObj?.fullName || uObj?.username || "Candidate",
          email: a.candidateEmail || uObj?.email || "",
          score: `${pct}%`,
          rawScore: pct,
          grade: isQualified ? "Qualified" : "Not Qualified",
          verificationCode: a.certificateId || String(a.attemptId || a._id).slice(-8).toUpperCase(),
          date: a.submittedAt || a.createdAt,
          status: a.status || a.finalVerdict || "PENDING",
          reportUrl: `/assessment-report/${a.attemptId}`,
        };
      });

      mcqReports = moduleAttempts.map((m) => {
        const uObj = resolveUser(m.userId, m.candidateEmail || m.userEmail);
        const scoreVal = m.score != null ? m.score : 0;
        const totalQ = m.totalQuestions || 10;
        const pct = m.percentage != null ? m.percentage : Math.round((scoreVal / totalQ) * 100);
        return {
          id: m._id,
          rawId: m._id,
          itemType: "module",
          sessionId: m.sessionId,
          title: `${m.assessmentTitle || m.moduleTitle || "Curriculum Module"} — 10-Mark MCQ Assessment`,
          type: "MCQ Assessment Report",
          recipient: uObj?.fullName || uObj?.username || "Student",
          email: uObj?.email || m.candidateEmail || m.userEmail || "",
          score: `${scoreVal}/${totalQ} (${pct}%)`,
          rawScore: scoreVal,
          maxScore: totalQ,
          grade: m.passed ? "Passed" : "Failed",
          verificationCode: String(m.sessionId || m._id).slice(-8).toUpperCase(),
          date: m.submittedAt || m.createdAt,
          status: m.passed ? "Passed" : "Failed",
          timeSpent: m.timeSpentSeconds ? `${Math.round(m.timeSpentSeconds / 60)} mins` : "N/A",
          accuracy: `${m.accuracy != null ? m.accuracy : pct}%`,
          reportUrl: `/assessment-report/${m.sessionId || `attempt_${m._id}`}`,
        };
      });

      projectReports = (projectSubs || []).map((ps) => {
        const uObj = resolveUser(ps.userId, ps.candidateDetails?.email);
        const marks = ps.marksObtained != null ? ps.marksObtained : 0;
        const total = ps.totalMarks || 100;
        const pct = ps.percentage != null ? ps.percentage : Math.round((marks / total) * 100);
        const isPassed = Boolean(ps.passed || marks >= (ps.passingMarks || 80));
        const recipient = ps.candidateDetails?.fullName || uObj?.fullName || uObj?.username || "Candidate";
        const email = ps.candidateDetails?.email || uObj?.email || "";
        return {
          id: ps._id,
          rawId: ps._id,
          itemType: "project",
          sessionId: ps.sessionId,
          title: `${ps.projectTitle || "Practical Project"} — Project Assessment Report`,
          type: "Project Assessment Report",
          recipient,
          email,
          score: `${marks}/${total} (${pct}%)`,
          rawScore: pct,
          maxScore: total,
          grade: ps.grade || (isPassed ? "Passed" : "Needs Improvement"),
          verificationCode: String(ps.sessionId || ps._id).slice(-8).toUpperCase(),
          date: ps.submittedAt || ps.createdAt,
          status: isPassed ? "PASSED" : "NEEDS_IMPROVEMENT",
          reportUrl: `/assessment-report/${ps.sessionId}`,
        };
      });

      codingReports = (codingSessions || []).map((cs) => {
        const uObj = resolveUser(cs.userId, cs.candidateDetails?.email);
        const subResult = cs.submissionResult || {};
        const primaryQ = (cs.questions && cs.questions[0]) || {};
        const score = subResult.score !== undefined ? subResult.score : (primaryQ.score !== undefined ? primaryQ.score : 0);
        const totalTests = subResult.totalTests || primaryQ.totalTests || 10;
        const passedTests = subResult.passedTests !== undefined ? subResult.passedTests : (primaryQ.passedTests !== undefined ? primaryQ.passedTests : 0);
        const isPassed = subResult.passed !== undefined ? subResult.passed : score >= 80;
        const recipient = cs.candidateDetails?.fullName || uObj?.fullName || uObj?.username || "Candidate";
        const email = cs.candidateDetails?.email || uObj?.email || "";
        const title = `${cs.assessmentTitle || primaryQ.title || "Algorithmic Challenge"} — Coding Assessment Report`;
        return {
          id: cs._id,
          rawId: cs._id,
          itemType: "coding",
          sessionId: cs.sessionId,
          title,
          type: "Coding Challenge Report",
          recipient,
          email,
          score: `${score}%`,
          rawScore: score,
          maxScore: 100,
          grade: subResult.grade || (isPassed ? "Accepted" : "Failed"),
          verificationCode: String(cs.sessionId || cs._id).slice(-8).toUpperCase(),
          date: subResult.submittedAt || cs.updatedAt || cs.createdAt,
          status: isPassed ? "ACCEPTED" : "FAILED",
          passedTests,
          totalTests,
          reportUrl: `/assessment-report/${cs.sessionId}`,
        };
      });

      challengeReports = (challengeSubs || []).map((cs) => {
        const user = resolveUser(cs.userId) || {};
        const totalT = cs.totalTests || 10;
        const passedT = cs.passedTests != null ? cs.passedTests : 0;
        const pct = cs.score != null ? cs.score : Math.round((passedT / totalT) * 100);
        const isAccepted = cs.status === "ACCEPTED";
        return {
          id: cs._id,
          rawId: cs._id,
          itemType: "coding",
          sessionId: String(cs._id),
          title: `${cs.challengeTitle || cs.challengeId || "Coding Challenge"} — Challenge Submission Report`,
          type: "Coding Challenge Report",
          recipient: user.fullName || user.username || "Candidate",
          email: user.email || "",
          score: `${pct}%`,
          rawScore: pct,
          maxScore: 100,
          grade: isAccepted ? "Accepted" : "Wrong Answer",
          verificationCode: String(cs._id).slice(-8).toUpperCase(),
          date: cs.createdAt,
          status: cs.status,
          passedTests: passedT,
          totalTests: totalT,
          reportUrl: `/assessment-report/${cs._id}`,
        };
      });

      allReports = [...certReports, ...assessReports, ...mcqReports, ...projectReports, ...codingReports, ...challengeReports].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setAdminCache(cacheKey, {
        allReports,
        certReports,
        assessReports,
        mcqReports,
        projectReports,
        codingReports,
        challengeReports,
      });
    }

    let filteredReports = allReports;
    if (type && type !== "all") {
      filteredReports = filteredReports.filter((r) => {
        if (type === "certification") return r.itemType === "certificate" || r.itemType === "certification";
        if (type === "module") return r.itemType === "module";
        if (type === "project") return r.itemType === "project";
        if (type === "coding") return r.itemType === "coding";
        return r.type?.toLowerCase().includes(type.toLowerCase()) || r.itemType === type;
      });
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredReports = filteredReports.filter((r) => {
        return (
          (r.recipient && r.recipient.toLowerCase().includes(q)) ||
          (r.email && r.email.toLowerCase().includes(q)) ||
          (r.title && r.title.toLowerCase().includes(q)) ||
          (r.verificationCode && r.verificationCode.toLowerCase().includes(q)) ||
          (r.id && String(r.id).toLowerCase().includes(q))
        );
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = all === "true" || all === "1" ? filteredReports.length || 1 : Math.max(1, parseInt(limit, 10) || 10);
    const totalFiltered = filteredReports.length;
    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;
    const skip = (pageNum - 1) * limitNum;
    const pagedReports = filteredReports.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      stats: {
        total: allReports.length,
        certificationsCount: certReports.length,
        assessmentsCount: assessReports.length,
        mcqReportsCount: mcqReports.length,
        projectsCount: projectReports.length,
        codingCount: codingReports.length + challengeReports.length,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages,
      },
      reports: pagedReports,
    });
  } catch (error) {
    console.error("Reports API error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reports", error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. RECORDINGS MANAGEMENT — REAL-TIME VIDEO & MEETING AUDIT
// ─────────────────────────────────────────────────────────────────────────────
router.get("/recordings", async (req, res) => {
  try {
    const {
      q,
      type,
      page = 1,
      limit = 10,
      all = "false",
    } = req.query;
    const recordingsDir = getRecordingsDir();
    let totalBytes = 0;

    // 1. Fetch genuine database recording records via high-speed cache
    const genuineData = await getCachedGenuineUsers();
    const genuineUserIds = genuineData.userIds;
    const genuineUserEmails = genuineData.userEmails;
    const usersMap = {};
    genuineData.users.forEach((u) => {
      usersMap[String(u._id)] = u;
    });

    const [dbRecords, proctoredSessions] = await Promise.all([
      Recording.find({
        $or: [
          { hostUserId: { $in: genuineUserIds } },
          { hostEmail: { $in: genuineUserEmails } },
        ],
      })
        .select("_id recordingId meetingId hostUserId hostEmail title durationSeconds fileSize filePath fileUrl gridfsId mimeType recordingType activityTimeline participants count status createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean(),
      ProctoredCodingSession.find({
        $and: [
          { recordingUrl: { $exists: true, $ne: "" } },
          {
            $or: [
              { userId: { $in: genuineUserIds } },
              { "candidateDetails.email": { $in: genuineUserEmails } },
            ],
          },
        ],
      })
        .select("_id sessionId userId candidateDetails assessmentTitle recordingUrl durationSeconds status violationsCount violationFlags deviceInfo startedAt completedAt createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // 3. Inspect physical files on disk with error resilience
    let diskFiles = {};
    if (fs.existsSync(recordingsDir)) {
      try {
        const files = fs.readdirSync(recordingsDir);
        for (const f of files) {
          if (!f.startsWith(".")) {
            try {
              const filePath = path.join(recordingsDir, f);
              const stat = fs.statSync(filePath);
              totalBytes += stat.size;
              diskFiles[f] = {
                filename: f,
                sizeBytes: stat.size,
                sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
                createdAt: stat.birthtime || stat.mtime,
              };
            } catch {}
          }
        }
      } catch {}
    }

    let unifiedRecordings = [];

    // Map DB Meeting & Screen Share Recordings
    dbRecords.forEach((r) => {
      const filename = path.basename(r.filePath || r.fileUrl || "");
      const diskInfo = diskFiles[filename];
      const actualSize = diskInfo ? diskInfo.sizeBytes : (r.fileSize || 0);
      const matchedUser = usersMap[String(r.hostUserId)];

      const isScreenShare =
        r.title?.toLowerCase().includes("screen") || r.recordingType === "Screen Share";

      const timeline = Array.isArray(r.activityTimeline) ? r.activityTimeline : [];
      const durationSec = r.durationSeconds || 0;
      const hasFile = actualSize > 0 || (r.gridfsId && r.gridfsId !== "");
      let status = "ready";
      if (r.status === "uploading" || r.status === "processing") {
        status = "processing";
      } else if (!hasFile || actualSize <= 0) {
        status = "error";
      } else {
        status = r.status || "ready";
      }

      unifiedRecordings.push({
        id: r._id,
        recordingId: r.recordingId || `rec_${r._id}`,
        meetingId: r.meetingId || "",
        title: r.title || `Meeting Recording (${new Date(r.createdAt).toLocaleDateString()})`,
        recordingType: isScreenShare ? "Screen Share" : "Meeting",
        hostName: r.hostName || matchedUser?.fullName || matchedUser?.username || "Host",
        hostEmail: r.hostEmail || matchedUser?.email || "",
        durationSeconds: durationSec,
        fileSizeMB: (actualSize / (1024 * 1024)).toFixed(2),
        fileSizeBytes: actualSize,
        fileUrl: `/recordings/${filename}`,
        streamUrl: `/api/recordings/stream/${filename || r.recordingId}`,
        status,
        participantsCount: r.participantsCount || 1,
        participantNames:
          r.participantNames && r.participantNames.length > 0 ? r.participantNames : [r.hostName || "Host"],
        chapters: r.chapters || [],
        activityTimeline: timeline,
        createdAt: r.createdAt || r.startTime || new Date(),
      });
    });

    // Map Proctored Examination Sessions with Recordings
    proctoredSessions.forEach((p) => {
      let filename = p.recordingUrl ? path.basename(p.recordingUrl) : "";
      if (!filename && p.sessionId) {
        const matchedDisk = Object.keys(diskFiles).find((df) => df.includes(p.sessionId));
        if (matchedDisk) filename = matchedDisk;
      }

      const diskInfo = diskFiles[filename];
      const actualSize = diskInfo ? diskInfo.sizeBytes : (p.recordingFileSize || 0);
      if (actualSize <= 0 && (!p.recordingUrl || p.recordingUrl.trim() === "")) return;

      const matchedUser = usersMap[String(p.userId)];
      const candidateName = p.candidateDetails?.fullName || matchedUser?.fullName || matchedUser?.username || "Candidate";
      const candidateEmail = p.candidateDetails?.email || matchedUser?.email || "";
      const durationSec = p.recordingDurationSeconds || p.durationSeconds || 0;

      const timeline = Array.isArray(p.violationsLog) && p.violationsLog.length > 0
        ? p.violationsLog.map((v) => ({
            type: "violation_detected",
            event: `Security Event: ${v.type || "Focus Interruption"}`,
            description: v.detail || "Candidate triggered an anomalous focus loss or tab navigation",
            timestamp: v.timestamp || new Date(),
            user: candidateName,
            role: "Security Sentinel",
          }))
        : [];

      unifiedRecordings.push({
        id: p._id,
        recordingId: p.sessionId || `proc_${p._id}`,
        meetingId: p.sessionId || "",
        title: `${p.assessmentTitle || "Proctored Examination"} — Candidate Audit`,
        recordingType: "Proctoring",
        hostName: candidateName,
        hostEmail: candidateEmail,
        durationSeconds: durationSec,
        fileSizeMB: (actualSize / (1024 * 1024)).toFixed(2),
        fileSizeBytes: actualSize,
        fileUrl: `/recordings/${filename}`,
        streamUrl: `/api/recordings/stream/${filename || p.sessionId}`,
        status: actualSize > 0 ? "ready" : "error",
        participantsCount: 1,
        participantNames: [candidateName],
        chapters: [],
        activityTimeline: timeline,
        createdAt: p.createdAt || new Date(),
      });
    });

    // SORT: Newest FIRST (requirement 1)
    unifiedRecordings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const allRecordings = unifiedRecordings;

    // Compute overall stats before filtering
    let meetingsCount = 0;
    let screenSharesCount = 0;
    let proctoringCount = 0;
    let totalSecs = 0;
    let totalDiskBytes = 0;

    allRecordings.forEach((r) => {
      totalSecs += r.durationSeconds || 0;
      totalDiskBytes += r.fileSizeBytes || 0;
      if (r.recordingType === "Meeting") meetingsCount++;
      else if (r.recordingType === "Screen Share") screenSharesCount++;
      else if (r.recordingType === "Proctoring") proctoringCount++;
    });

    let filteredRecordings = allRecordings;

    // Filter by search
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      filteredRecordings = filteredRecordings.filter(
        (r) =>
          regex.test(r.title) ||
          regex.test(r.hostName) ||
          regex.test(r.hostEmail) ||
          regex.test(r.recordingId) ||
          regex.test(r.meetingId)
      );
    }

    // Filter by type
    if (type && type !== "all") {
      filteredRecordings = filteredRecordings.filter(
        (r) =>
          r.recordingType.toLowerCase().replace(/\s+/g, "") ===
          type.toLowerCase().replace(/\s+/g, "")
      );
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = all === "true" || all === "1" ? filteredRecordings.length || 1 : Math.max(1, parseInt(limit, 10) || 10);
    const totalFiltered = filteredRecordings.length;
    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;
    const skip = (pageNum - 1) * limitNum;
    const pagedRecordings = filteredRecordings.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      stats: {
        totalRecordings: allRecordings.length,
        totalDiskSizeMB: (totalDiskBytes / (1024 * 1024)).toFixed(1),
        totalDurationMinutes: Math.round(totalSecs / 60),
        meetingsCount,
        screenSharesCount,
        proctoringCount,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages,
      },
      recordings: pagedRecordings,
    });
  } catch (error) {
    console.error("Recordings fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recordings", error: error.message });
  }
});

// Upload / Add Video directly in Admin Recordings
router.post("/recordings/upload", async (req, res) => {
  const Busboy = require("busboy");
  const { execFile } = require("child_process");
  let tempFilePath = null;
  let finalFilePath = null;

  try {
    const recordingsDir = getRecordingsDir();
    const recordingId = `rec_admin_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const parsed = await new Promise((resolve, reject) => {
      const busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: 500 * 1024 * 1024, files: 1 },
      });

      const fields = {};
      let fileInfo = null;
      let fileWritePromise = null;

      busboy.on("field", (name, val) => {
        fields[name] = val;
      });

      busboy.on("file", (fieldname, file, info) => {
        const origName = info?.filename || "video.mp4";
        const mimeType = info?.mimeType || "video/mp4";
        const extMatch = path.extname(origName).toLowerCase();
        const allowedExts = [".mp4", ".webm", ".mov", ".mkv", ".ogg", ".avi", ".m4v"];
        const ext = allowedExts.includes(extMatch)
          ? extMatch
          : mimeType.includes("mp4")
          ? ".mp4"
          : mimeType.includes("quicktime")
          ? ".mov"
          : ".webm";

        const filename = `${recordingId}${ext}`;
        tempFilePath = path.join(recordingsDir, `${recordingId}.tmp${ext}`);
        finalFilePath = path.join(recordingsDir, filename);

        let bytesWritten = 0;
        let limitExceeded = false;
        const out = fs.createWriteStream(tempFilePath);

        file.on("data", (chunk) => {
          bytesWritten += chunk.length;
        });
        file.on("limit", () => {
          limitExceeded = true;
          out.destroy();
          reject(Object.assign(new Error("Video file exceeds 500MB maximum limit."), { status: 413 }));
        });

        fileWritePromise = new Promise((resWrite, rejWrite) => {
          out.on("finish", () => {
            if (limitExceeded) return;
            fileInfo = { filename, ext, mimeType, bytesWritten, origName };
            resWrite();
          });
          out.on("error", rejWrite);
        });

        file.pipe(out);
      });

      busboy.on("finish", async () => {
        try {
          if (fileWritePromise) await fileWritePromise;
          if (!fileInfo || !tempFilePath || !fs.existsSync(tempFilePath)) {
            return reject(Object.assign(new Error("No video file was provided."), { status: 400 }));
          }
          if (fileInfo.bytesWritten < 100) {
            return reject(Object.assign(new Error("Uploaded video file is empty or too small."), { status: 400 }));
          }
          fs.renameSync(tempFilePath, finalFilePath);
          tempFilePath = null;
          resolve({ fields, fileInfo });
        } catch (err) {
          reject(err);
        }
      });

      busboy.on("error", reject);
      req.pipe(busboy);
    });

    const { fields, fileInfo } = parsed;
    const allowedTypes = ["Meeting", "Screen Share", "Proctoring"];
    const recordingType = allowedTypes.includes(fields.recordingType) ? fields.recordingType : "Meeting";
    const cleanTitle =
      String(fields.title || "").trim() ||
      path.basename(fileInfo.origName, path.extname(fileInfo.origName)) ||
      "Admin Uploaded Video";

    let durationSeconds = Math.max(0, Math.round(Number(fields.durationSeconds) || 0));
    if (durationSeconds <= 0) {
      try {
        const ffprobePath = require("@ffprobe-installer/ffprobe").path;
        const probed = await new Promise((resolveProbe) => {
          execFile(
            ffprobePath,
            ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", finalFilePath],
            { timeout: 10000 },
            (err, stdout) => {
              if (err) return resolveProbe(0);
              const val = parseFloat(String(stdout || "").trim());
              resolveProbe(Number.isFinite(val) && val > 0 ? Math.round(val) : 0);
            }
          );
        });
        if (probed > 0) durationSeconds = probed;
      } catch {}
    }

    const hostUserId = String(req.user?._id || req.user?.userId || req.user?.id || "admin");
    const hostName = req.user?.fullName || req.user?.name || "Admin";
    const hostEmail = req.user?.email || "";

    await saveFileToGridFS(fileInfo.filename, finalFilePath, {
      recordingId,
      recordingType,
      hostUserId,
      mimeType: fileInfo.mimeType,
      durationSeconds,
    }).catch((err) => {
      console.warn("[AdminRecordings] GridFS backup warning:", err.message);
    });

    const doc = await Recording.create({
      recordingId,
      meetingId: `admin_upload_${Date.now()}`,
      title: cleanTitle,
      hostUserId,
      hostName,
      hostEmail,
      recordingType,
      durationSeconds,
      filePath: finalFilePath,
      fileUrl: `/recordings/${fileInfo.filename}`,
      streamUrl: `/api/recordings/stream/${fileInfo.filename}`,
      fileSize: fileInfo.bytesWritten,
      mimeType: fileInfo.mimeType,
      participantsCount: 1,
      participantUserIds: [hostUserId],
      participantNames: [hostName],
      status: "ready",
      startTime: new Date(),
      endTime: new Date(),
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("NEW_RECORDING_SAVED", {
        recordingId: doc.recordingId,
        title: doc.title,
        recordingType: doc.recordingType,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Video uploaded and added to recordings successfully",
      recording: doc,
    });
  } catch (err) {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch {}
    }
    if (finalFilePath && fs.existsSync(finalFilePath)) {
      try { fs.unlinkSync(finalFilePath); } catch {}
    }
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to upload video",
    });
  }
});

// Helper to permanently delete a recording by id/filename from DB, disk, GridFS, and proctoring links
async function permanentlyDeleteSingleRecording(recordingId, recordingsDir) {
  const query = {
    $or: [
      { recordingId },
      ...(mongoose.Types.ObjectId.isValid(recordingId) ? [{ _id: recordingId }] : []),
      { filePath: new RegExp(recordingId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { fileUrl: new RegExp(recordingId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    ],
  };

  const recs = await Recording.find(query);
  for (const rec of recs) {
    await safeDeleteRecordingFile(rec);
    const fname = rec.fileUrl ? path.basename(rec.fileUrl) : `${rec.recordingId}.webm`;
    await deleteFileFromGridFS(fname).catch(() => {});
    if (rec.recordingId) {
      await deleteFileFromGridFS(`${rec.recordingId}.webm`).catch(() => {});
      await deleteFileFromGridFS(`${rec.recordingId}.mp4`).catch(() => {});
    }
    await Recording.deleteOne({ _id: rec._id });
  }

  // Unlink from ProctoredCodingSession if this was a proctoring recording
  await ProctoredCodingSession.updateMany(
    { $or: [{ sessionId: recordingId }, { recordingId }] },
    {
      $set: {
        recordingUrl: "",
        recordingId: "",
        recordingStatus: "not_recorded",
        recordingFileSize: 0,
        recordingDurationSeconds: 0,
      },
    }
  ).catch(() => {});

  // Clean up any matching physical disk files and GridFS by bare ID
  const cleanId = recordingId.replace(/\.[^/.]+$/, "");
  await deleteFileFromGridFS(recordingId).catch(() => {});
  if (fs.existsSync(recordingsDir)) {
    const files = fs.readdirSync(recordingsDir);
    for (const f of files) {
      if (f === recordingId || f.startsWith(cleanId)) {
        try {
          fs.unlinkSync(path.join(recordingsDir, f));
        } catch {}
        await deleteFileFromGridFS(f).catch(() => {});
      }
    }
  }
}

router.post("/recordings/bulk-delete", async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.recordingIds) ? req.body.recordingIds.filter(Boolean) : [];
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: "No recordingIds provided" });
    }
    const recordingsDir = getRecordingsDir();
    for (const id of ids) {
      await permanentlyDeleteSingleRecording(String(id), recordingsDir);
    }
    const io = req.app.get("io");
    if (io) {
      io.emit("RECORDING_DELETED", { recordingIds: ids });
    }
    return res.status(200).json({
      success: true,
      deletedCount: ids.length,
      message: `${ids.length} recording(s) permanently deleted`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/recordings/:recordingId", async (req, res) => {
  try {
    const { recordingId } = req.params;
    const recordingsDir = getRecordingsDir();
    await permanentlyDeleteSingleRecording(recordingId, recordingsDir);

    // Broadcast deletion to admin feeds
    const io = req.app.get("io");
    if (io) {
      io.emit("RECORDING_DELETED", { recordingId });
    }

    res.status(200).json({ success: true, message: "Recording permanently removed from database and storage" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Purge corrupted/0-byte recordings
router.post("/recordings/purge-corrupted", async (req, res) => {
  try {
    const recordingsDir = getRecordingsDir();
    let purgedFiles = 0;
    let purgedDb = 0;

    if (fs.existsSync(recordingsDir)) {
      const files = fs.readdirSync(recordingsDir);
      for (const f of files) {
        if (!f.startsWith(".")) {
          const fp = path.join(recordingsDir, f);
          try {
            const stat = fs.statSync(fp);
            if (stat.size <= 100) {
              fs.unlinkSync(fp);
              purgedFiles++;
              const delRes = await Recording.deleteMany({
                $or: [{ filePath: new RegExp(f, "i") }, { fileUrl: new RegExp(f, "i") }],
              });
              purgedDb += delRes.deletedCount || 0;
            }
          } catch (e) {}
        }
      }
    }

    // Also remove DB recordings where fileSize <= 100
    const dbPurge = await Recording.deleteMany({ fileSize: { $lte: 100 } });
    purgedDb += dbPurge.deletedCount || 0;

    const io = req.app.get("io");
    if (io) {
      io.emit("RECORDINGS_PURGED");
    }

    res.status(200).json({
      success: true,
      message: `Cleaned up ${purgedFiles} corrupted disk files and ${purgedDb} database records.`,
      purgedFiles,
      purgedDb,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. STORAGE & CLOUD INFRASTRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
router.get("/storage", async (req, res) => {
  try {
    const cachedStorage = getAdminCache("admin_storage", 15000);
    if (cachedStorage) {
      return res.status(200).json(cachedStorage);
    }

    const recordingsDir = getRecordingsDir();
    const certsDir = path.join(__dirname, "../uploads/certificates");

    const countFilesAsync = async (dir) => {
      try {
        const entries = await fs.promises.readdir(dir);
        return entries.filter((f) => !f.startsWith(".")).length;
      } catch {
        return 0;
      }
    };

    const { recordingsBytes: recBytes, certsBytes: certBytes } = getCachedDirSize(recordingsDir, certsDir);

    const genuineData = await getCachedGenuineUsers();

    const [
      recCount,
      certCount,
      challengeCount,
      certAttemptCount,
      moduleAttemptCount,
      issuedCertCount,
      subjectProgressCount,
      codingProgressCount,
      recordingCount,
    ] = await Promise.all([
      countFilesAsync(recordingsDir),
      countFilesAsync(certsDir),
      ChallengeSubmission.estimatedDocumentCount(),
      CertificationAttempt.estimatedDocumentCount(),
      ModuleAssessmentAttempt.estimatedDocumentCount(),
      IssuedCertificate.estimatedDocumentCount(),
      SubjectProgress.estimatedDocumentCount(),
      CodingProgress.estimatedDocumentCount(),
      Recording.estimatedDocumentCount(),
    ]);
    const usersCount = genuineData.users.length;

    const collections = [
      { name: "Users (Registered)", count: usersCount },
      { name: "ChallengeSubmissions", count: challengeCount },
      { name: "CertificationAttempts", count: certAttemptCount },
      { name: "ModuleAssessmentAttempts", count: moduleAttemptCount },
      { name: "IssuedCertificates", count: issuedCertCount },
      { name: "SubjectProgress", count: subjectProgressCount },
      { name: "CodingProgress", count: codingProgressCount },
      { name: "Recordings", count: recordingCount },
    ];

    const payload = {
      success: true,
      data: {
        recordings: { fileCount: recCount, mb: (recBytes / (1024 * 1024)).toFixed(1) },
        certificates: { fileCount: certCount, mb: (certBytes / (1024 * 1024)).toFixed(1) },
        database: { collections },
      },
    };
    setAdminCache("admin_storage", payload);
    res.status(200).json(payload);
  } catch (error) {
    console.error("Storage fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch storage info" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. PLATFORM SETTINGS & AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────
router.get("/settings", async (req, res) => {
  try {
    const cachedSettings = getAdminCache("admin_settings", 15000);
    if (cachedSettings) {
      return res.status(200).json(cachedSettings);
    }

    let [persistedSettings, auditLogs] = await Promise.all([
      PlatformSettings.findOne({ key: "global_platform_settings" }).lean(),
      AdminActivityLog.find()
        .populate("adminId", "email fullName")
        .sort({ timestamp: -1 })
        .limit(30)
        .lean(),
    ]);

    if (!persistedSettings) {
      persistedSettings = await PlatformSettings.create({
        key: "global_platform_settings",
        ...platformSettings,
      });
    }

    platformSettings = {
      ...platformSettings,
      maintenanceMode: persistedSettings.maintenanceMode,
      proctoringSensitivity: persistedSettings.proctoringSensitivity,
      autoRecordAssessments: persistedSettings.autoRecordAssessments,
      emailNotificationsEnabled: persistedSettings.emailNotificationsEnabled,
      allowedRegistration: persistedSettings.allowedRegistration,
      maxConcurrentSessionsPerUser: persistedSettings.maxConcurrentSessionsPerUser || 3,
    };

    const payload = {
      success: true,
      settings: platformSettings,
      auditLogs,
    };
    setAdminCache("admin_settings", payload);
    res.status(200).json(payload);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const {
      maintenanceMode,
      proctoringSensitivity,
      autoRecordAssessments,
      emailNotificationsEnabled,
      allowedRegistration,
      maxConcurrentSessionsPerUser,
    } = req.body;

    const updates = {};
    if (maintenanceMode !== undefined) updates.maintenanceMode = Boolean(maintenanceMode);
    if (proctoringSensitivity !== undefined) updates.proctoringSensitivity = proctoringSensitivity;
    if (autoRecordAssessments !== undefined) updates.autoRecordAssessments = Boolean(autoRecordAssessments);
    if (emailNotificationsEnabled !== undefined) updates.emailNotificationsEnabled = Boolean(emailNotificationsEnabled);
    if (allowedRegistration !== undefined) updates.allowedRegistration = Boolean(allowedRegistration);
    if (maxConcurrentSessionsPerUser !== undefined) updates.maxConcurrentSessionsPerUser = Number(maxConcurrentSessionsPerUser);
    updates.updatedBy = req.user?._id;

    const updated = await PlatformSettings.findOneAndUpdate(
      { key: "global_platform_settings" },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    platformSettings = {
      ...platformSettings,
      maintenanceMode: updated.maintenanceMode,
      proctoringSensitivity: updated.proctoringSensitivity,
      autoRecordAssessments: updated.autoRecordAssessments,
      emailNotificationsEnabled: updated.emailNotificationsEnabled,
      allowedRegistration: updated.allowedRegistration,
      maxConcurrentSessionsPerUser: updated.maxConcurrentSessionsPerUser,
    };

    await recordAdminAudit({
      adminId: req.user._id,
      action: "PLATFORM_SETTINGS_UPDATED",
      note: `Updated platform configuration: Sensitivity=${platformSettings.proctoringSensitivity}, Maintenance=${platformSettings.maintenanceMode}, EmailNotifications=${platformSettings.emailNotificationsEnabled}`,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Platform settings updated successfully",
      settings: platformSettings,
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
});

// ── Email Health Check, Diagnostics & Test Email ──
router.get("/email/status", async (req, res) => {
  try {
    const { verifySmtpConnection, getSmtpConfig, maskEmail } = require("../utils/mailer");
    const config = getSmtpConfig();
    const verification = await verifySmtpConnection();
    const isOk = Boolean(verification.success ?? verification.ok);

    res.status(200).json({
      success: isOk,
      configured: Boolean(verification.configured ?? config.isConfigured),
      provider: verification.provider || "smtp",
      host: verification.host || config.host || null,
      port: verification.port || config.port || null,
      secure: verification.secure !== undefined ? verification.secure : config.secure,
      sender: verification.sender || (config.auth?.user ? maskEmail(config.auth.user) : null),
      verification: {
        ok: isOk,
        status: verification.status || (isOk ? "connected" : "failed"),
        message: verification.message,
        errorCode: verification.errorCode || null,
      },
    });
  } catch (err) {
    console.error("Admin email status check error:", err);
    res.status(500).json({
      success: false,
      configured: false,
      message: "Failed to check email service status",
      error: err.message,
    });
  }
});

router.get("/email/brevo-senders", async (req, res) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return res.json({ error: "No BREVO_API_KEY configured" });
    const bRes = await fetch("https://api.brevo.com/v3/senders", {
      headers: { "api-key": apiKey },
    });
    const data = await bRes.json();
    res.json({ status: bRes.status, senders: data });
  } catch (e) {
    res.json({ error: e.message });
  }
});

router.post("/email/test", async (req, res) => {
  try {
    const { sendTestEmail } = require("../utils/mailer");
    const { toEmail } = req.body;

    const targetEmail = (toEmail || req.user?.email || "").toLowerCase().trim();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return res.status(400).json({
        success: false,
        message: "A valid recipient email address is required for testing.",
      });
    }

    const result = await sendTestEmail({
      toEmail: targetEmail,
      requestedBy: req.user?.fullName || req.user?.email || "Super Admin",
      req,
    });

    if (result && result.success) {
      await recordAdminAudit({
        adminId: req.user._id,
        action: "TEST_EMAIL_DISPATCHED",
        note: `Admin test email dispatched to ${targetEmail} (messageId: ${result.messageId})`,
        ip: req.ip,
      });

      return res.status(200).json({
        success: true,
        status: "accepted",
        message: `Test email successfully accepted by SMTP provider for ${targetEmail}. Note: SMTP acceptance indicates dispatch to provider; inbox delivery depends on recipient mail server.`,
        messageId: result.messageId,
      });
    } else {
      return res.status(502).json({
        success: false,
        status: "failed",
        errorCode: result?.errorCode || "SMTP_DISPATCH_FAILED",
        message: result?.message || "Failed to dispatch test email through configured SMTP provider.",
      });
    }
  } catch (err) {
    console.error("Admin test email error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Internal server error dispatching test email",
    });
  }
});

router.get("/email/logs", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const logs = await EmailLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (err) {
    console.error("Failed to fetch email logs:", err);
    res.status(500).json({ success: false, message: "Failed to fetch email logs" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. MAIN ADMIN SECURITY VERIFICATION & ADMIN MANAGEMENT (EXCLUSIVE)
// ─────────────────────────────────────────────────────────────────────────────
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminOtp = require("../models/AdminOtp");
const { getJwtSecret } = require("../config/jwtConfig");
const JWT_SECRET = getJwtSecret();

// Dynamically resolved configured Main Admin email
const MAIN_ADMIN_EMAIL = getMainAdminEmail();

// Step 1: Main Admin Password Verification & 6-Digit OTP Dispatch
router.post("/main-admin/verify-password", async (req, res) => {
  try {
    const userEmail = (req.user?.email || "").toLowerCase().trim();
    const mainAdminEmail = getMainAdminEmail();
    if (!mainAdminEmail || userEmail !== mainAdminEmail) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Only designated Main Administrator (${MAIN_ADMIN_EMAIL}) has authority to manage administrators.`,
      });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid administrator password" });
    }

    // Generate secure single-use 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unverified OTPs
    await AdminOtp.deleteMany({ email: MAIN_ADMIN_EMAIL, verified: false });

    await AdminOtp.create({
      email: MAIN_ADMIN_EMAIL,
      otp,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    // Send OTP to yashashyashash1@gmail.com
    const mailResult = await sendMainAdminOtpEmail({
      toEmail: MAIN_ADMIN_EMAIL,
      otp,
      expiresMinutes: 10,
      req,
    });

    if (mailResult && !mailResult.success) {
      console.warn("Main Admin OTP email dispatch failed:", mailResult.message);
      return res.status(500).json({
        success: false,
        message: mailResult.message || `Failed to dispatch OTP email to ${MAIN_ADMIN_EMAIL}. Check SMTP server status.`,
        errorCode: mailResult.errorCode,
      });
    }

    await recordAdminAudit({
      adminId: req.user._id,
      action: "MAIN_ADMIN_OTP_REQUESTED",
      note: `Main Admin initiated password verification; 6-digit OTP dispatched to ${MAIN_ADMIN_EMAIL}`,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Security OTP successfully sent to ${MAIN_ADMIN_EMAIL}`,
      email: MAIN_ADMIN_EMAIL,
      expiresInMinutes: 10,
    });
  } catch (err) {
    console.error("Main Admin password verification error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Step 1b: Main Admin OTP Resend (Authorized Session)
router.post("/main-admin/resend-otp", async (req, res) => {
  try {
    const userEmail = (req.user?.email || "").toLowerCase().trim();
    if (userEmail !== MAIN_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Only designated Main Administrator (${MAIN_ADMIN_EMAIL}) has authority to request OTP codes.`,
      });
    }

    if (req.body?.password) {
      const user = await User.findById(req.user._id);
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid administrator password" });
      }
    }

    // Generate secure single-use 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unverified OTPs
    await AdminOtp.deleteMany({ email: MAIN_ADMIN_EMAIL, verified: false });

    await AdminOtp.create({
      email: MAIN_ADMIN_EMAIL,
      otp,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    // Send OTP to yashashyashash1@gmail.com
    const mailResult = await sendMainAdminOtpEmail({
      toEmail: MAIN_ADMIN_EMAIL,
      otp,
      expiresMinutes: 10,
      req,
    });

    if (mailResult && !mailResult.success) {
      console.warn("Main Admin OTP email resend failed:", mailResult.message);
      return res.status(500).json({
        success: false,
        message: mailResult.message || `Failed to dispatch OTP email to ${MAIN_ADMIN_EMAIL}. Check SMTP server status.`,
        errorCode: mailResult.errorCode,
      });
    }

    await recordAdminAudit({
      adminId: req.user._id,
      action: "MAIN_ADMIN_OTP_RESENT",
      note: `Main Admin requested OTP resend; 6-digit OTP dispatched to ${MAIN_ADMIN_EMAIL}`,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `A fresh 6-digit OTP code has been dispatched to ${MAIN_ADMIN_EMAIL}.`,
      email: MAIN_ADMIN_EMAIL,
      expiresInMinutes: 10,
    });
  } catch (err) {
    console.error("Main Admin OTP resend error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Step 2: Main Admin OTP Verification & Session Unlock Token
router.post("/main-admin/verify-otp", async (req, res) => {
  try {
    const userEmail = (req.user?.email || "").toLowerCase().trim();
    if (userEmail !== MAIN_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: "Unauthorized account" });
    }

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: "6-digit OTP is required" });
    }

    const otpRecord = await AdminOtp.findOne({
      email: MAIN_ADMIN_EMAIL,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found. Please request a new verification code.",
      });
    }

    if (otpRecord.attempts >= 5) {
      await AdminOtp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Security session locked. Please re-enter your password.",
      });
    }

    if (otpRecord.otp !== otp.trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${5 - otpRecord.attempts} attempts remaining.`,
      });
    }

    // Mark as single-use verified
    otpRecord.verified = true;
    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    // Issue signed short-lived Admin Management token (1 hour)
    const adminMgmtToken = jwt.sign(
      {
        email: MAIN_ADMIN_EMAIL,
        scope: "admin_management",
        verifiedAt: Date.now(),
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    await recordAdminAudit({
      adminId: req.user._id,
      action: "MAIN_ADMIN_OTP_VERIFIED",
      note: `Main Admin successfully verified 2FA OTP. Admin Management unlocked.`,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      adminMgmtToken,
      message: "Main Administrator authentication verified.",
    });
  } catch (err) {
    console.error("Main Admin OTP verification error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// List All Administrators
router.get("/admins", async (req, res) => {
  try {
    const admins = await User.find({
      $or: [
        { role: "SUPER_ADMIN" },
        { role: "admin" },
        { email: MAIN_ADMIN_EMAIL },
      ],
    })
      .select("-password")
      .sort({ isMainAdmin: -1, createdAt: 1 })
      .lean();

    const enriched = admins.map((a) => {
      const isMain =
        a.email?.toLowerCase().trim() === MAIN_ADMIN_EMAIL || a.isMainAdmin === true;
      return {
        _id: a._id,
        fullName: a.fullName || (isMain ? "MasteryZone Main Admin" : "Administrator"),
        email: a.email,
        username: a.username,
        role: isMain ? "Main Admin (Sole Owner)" : "Secondary Admin",
        rawRole: a.role,
        isMainAdmin: isMain,
        adminPermissions: isMain ? ["*"] : a.adminPermissions || [],
        isSuspended: a.isSuspended || false,
        mustChangePassword: a.mustChangePassword || false,
        createdAt: a.createdAt,
        lastLoginAt: a.lastLoginAt,
      };
    });

    res.status(200).json({
      success: true,
      mainAdminEmail: MAIN_ADMIN_EMAIL,
      admins: enriched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create Secondary Administrator & Dispatch Credentials
router.post("/admins/create", async (req, res) => {
  try {
    const userEmail = (req.user?.email || "").toLowerCase().trim();
    if (userEmail !== MAIN_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Only Main Administrator can create secondary administrators.",
      });
    }

    const {
      email,
      fullName,
      initialPassword,
      adminPermissions = [],
      requirePasswordChange = true,
    } = req.body;

    if (!email || !initialPassword) {
      return res.status(400).json({ success: false, message: "Email and initial password are required" });
    }

    const targetEmail = email.toLowerCase().trim();
    if (targetEmail === MAIN_ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: "Cannot modify or duplicate Main Administrator account." });
    }

    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    let targetUser = await User.findOne({ email: targetEmail });

    const defaultPerms = [
      "reports",
      "assessments",
      "coding",
      "proctoring",
      "recordings",
      "users",
      "overview",
    ];

    const finalPerms = adminPermissions.length > 0 ? adminPermissions : defaultPerms;

    if (targetUser) {
      if (targetUser.isMainAdmin) {
        return res.status(400).json({ success: false, message: "Cannot alter Main Administrator privileges." });
      }
      targetUser.role = "admin";
      targetUser.isMainAdmin = false;
      targetUser.adminPermissions = finalPerms;
      targetUser.password = hashedPassword;
      targetUser.mustChangePassword = Boolean(requirePasswordChange);
      targetUser.adminCreatedBy = MAIN_ADMIN_EMAIL;
      targetUser.adminCreatedAt = new Date();
      targetUser.isSuspended = false;
      if (fullName) targetUser.fullName = fullName;
      await targetUser.save();
    } else {
      let username = targetEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
      const existingUser = await User.findOne({ username });
      if (existingUser) username = `${username}_${Date.now().toString().slice(-4)}`;

      targetUser = await User.create({
        username,
        email: targetEmail,
        fullName: fullName || "Secondary Admin",
        role: "admin",
        isMainAdmin: false,
        adminPermissions: finalPerms,
        password: hashedPassword,
        mustChangePassword: Boolean(requirePasswordChange),
        adminCreatedBy: MAIN_ADMIN_EMAIL,
        adminCreatedAt: new Date(),
        authProvider: "email",
        isSuspended: false,
      });
    }

    // Send Welcome Email with Initial Password asynchronously without freezing UI
    dispatchMailBackground(async () => {
      return await sendNewAdminWelcomeEmail({
        adminEmail: targetEmail,
        adminName: targetUser.fullName || "Administrator",
        tempPassword: initialPassword,
        permissions: targetUser.adminPermissions,
        req,
      });
    }, { type: 'new_admin_welcome', recipient: targetEmail });

    await recordAdminAudit({
      adminId: req.user._id,
      action: "ADMIN_CREATED",
      targetId: targetUser._id,
      note: `Created secondary admin ${targetEmail} with permissions: ${targetUser.adminPermissions.join(", ")}`,
      ip: req.ip,
    });

    const io = req.app.get("io");
    if (io) io.emit("ADMINS_UPDATED");

    res.status(201).json({
      success: true,
      message: `Secondary administrator ${targetEmail} created successfully and credentials dispatched via email.`,
      admin: {
        _id: targetUser._id,
        email: targetUser.email,
        fullName: targetUser.fullName,
        role: targetUser.role,
        adminPermissions: targetUser.adminPermissions,
      },
    });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle Administrator Status (Active / Suspended)
router.patch("/admins/:id/status", async (req, res) => {
  try {
    const userEmail = (req.user?.email || "").toLowerCase().trim();
    if (userEmail !== MAIN_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: "Only Main Administrator can alter administrator status." });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: "Administrator account not found" });

    if (target.email?.toLowerCase().trim() === MAIN_ADMIN_EMAIL || target.isMainAdmin) {
      return res.status(400).json({ success: false, message: "Main Administrator cannot be suspended." });
    }

    target.isSuspended = !target.isSuspended;
    await target.save();

    await recordAdminAudit({
      adminId: req.user._id,
      action: target.isSuspended ? "ADMIN_SUSPENDED" : "ADMIN_ACTIVATED",
      targetId: target._id,
      note: `${target.isSuspended ? "Suspended" : "Activated"} secondary admin ${target.email}`,
      ip: req.ip,
    });

    const io = req.app.get("io");
    if (io) io.emit("ADMINS_UPDATED");

    res.status(200).json({
      success: true,
      message: `Administrator ${target.email} is now ${target.isSuspended ? "suspended" : "active"}.`,
      isSuspended: target.isSuspended,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset / Edit Secondary Administrator Password
router.patch("/admins/:id/password", async (req, res) => {
  try {
    const userEmail = (req.user?.email || "").toLowerCase().trim();
    if (userEmail !== MAIN_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: "Only Main Administrator can reset administrator passwords." });
    }

    const { newPassword, requirePasswordChange = true } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: "Administrator not found" });

    if (target.email?.toLowerCase().trim() === MAIN_ADMIN_EMAIL || target.isMainAdmin) {
      return res.status(400).json({
        success: false,
        message: "Cannot reset Main Admin password via secondary admin flow.",
      });
    }

    target.password = await bcrypt.hash(newPassword, 10);
    target.mustChangePassword = Boolean(requirePasswordChange);
    await target.save();

    dispatchMailBackground(async () => {
      return await sendAdminPasswordChangedEmail({
        adminEmail: target.email,
        adminName: target.fullName || "Administrator",
        changedBy: "Main Administrator",
        req,
      });
    }, { type: 'admin_password_changed', recipient: target.email });

    await recordAdminAudit({
      adminId: req.user._id,
      action: "ADMIN_PASSWORD_RESET",
      targetId: target._id,
      note: `Reset password for secondary admin ${target.email}`,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Password successfully updated for ${target.email} and notification email sent.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove Secondary Administrator (Revoke Privileges)
router.delete("/admins/:id", async (req, res) => {
  try {
    const userEmail = (req.user?.email || "").toLowerCase().trim();
    if (userEmail !== MAIN_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: "Only Main Administrator can remove administrators." });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: "Administrator not found" });

    if (target.email?.toLowerCase().trim() === MAIN_ADMIN_EMAIL || target.isMainAdmin) {
      return res.status(400).json({ success: false, message: "Cannot remove Main Administrator." });
    }

    target.role = "user";
    target.isMainAdmin = false;
    target.adminPermissions = [];
    await target.save();

    await recordAdminAudit({
      adminId: req.user._id,
      action: "ADMIN_REMOVED",
      targetId: target._id,
      note: `Revoked admin privileges for ${target.email}. Returned to standard user role.`,
      ip: req.ip,
    });

    const io = req.app.get("io");
    if (io) io.emit("ADMINS_UPDATED");

    res.status(200).json({
      success: true,
      message: `Administrator privileges successfully revoked for ${target.email}.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
