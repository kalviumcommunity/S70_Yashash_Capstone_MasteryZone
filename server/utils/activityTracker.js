const mongoose = require("mongoose");
const DailyCodingActivity = require("../models/DailyCodingActivity");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const User = require("../models/User");

/**
 * Returns normalized YYYY-MM-DD date string in target timezone
 */
function getDateString(date = new Date(), timeZone) {
  try {
    if (timeZone) {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return formatter.format(new Date(date));
    }
  } catch {
    // If timezone string is invalid, fallback to UTC or system date
  }
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates absolute difference in days between two YYYY-MM-DD strings
 */
function daysBetween(dateStrA, dateStrB) {
  const [yA, mA, dA] = dateStrA.split("-").map(Number);
  const [yB, mB, dB] = dateStrB.split("-").map(Number);
  const dtA = Date.UTC(yA, mA - 1, dA);
  const dtB = Date.UTC(yB, mB - 1, dB);
  return Math.round((dtB - dtA) / (1000 * 60 * 60 * 24));
}

/**
 * Generates date string offset by N days from a base date
 */
function offsetDateString(baseDateStr, offsetDays) {
  const [y, m, d] = baseDateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Computes consecutive streaks (current streak & longest streak)
 */
function calculateStreaks(activeDateStrings = [], clientTimezone) {
  if (!Array.isArray(activeDateStrings) || activeDateStrings.length === 0) {
    return { currentStreak: 0, longestStreak: 0, streakActiveToday: false };
  }

  // Deduplicate and sort chronologically
  const sortedDates = Array.from(new Set(activeDateStrings)).sort();
  const activeDateSet = new Set(sortedDates);

  const todayStr = getDateString(new Date(), clientTimezone);
  const yesterdayStr = offsetDateString(todayStr, -1);

  // 1. Current Streak calculation (LeetCode convention)
  let currentStreak = 0;
  const streakActiveToday = activeDateSet.has(todayStr);

  if (streakActiveToday) {
    // Streak includes today and counts backward
    let checkDate = todayStr;
    while (activeDateSet.has(checkDate)) {
      currentStreak++;
      checkDate = offsetDateString(checkDate, -1);
    }
  } else if (activeDateSet.has(yesterdayStr)) {
    // Streak is still active from yesterday (not yet broken today)
    let checkDate = yesterdayStr;
    while (activeDateSet.has(checkDate)) {
      currentStreak++;
      checkDate = offsetDateString(checkDate, -1);
    }
  } else {
    // No activity today or yesterday -> streak is 0
    currentStreak = 0;
  }

  // 2. Longest Streak calculation
  let longestStreak = sortedDates.length > 0 ? 1 : 0;
  let currentRun = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = daysBetween(sortedDates[i - 1], sortedDates[i]);
    if (diff === 1) {
      currentRun++;
    } else if (diff > 1) {
      currentRun = 1;
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
  }

  return { currentStreak, longestStreak, streakActiveToday };
}

/**
 * Assigns color intensity level 0-4 based on submission count (GitHub/LeetCode standard)
 */
function getIntensityLevel(count = 0) {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
}

/**
 * Records a verified coding activity in the database.
 * Prevents duplicates, updates streaks, and synchronizes real-time sockets.
 */
async function recordDailyCodingActivity({
  userId,
  activityType = "challenge",
  targetId = "",
  title = "",
  status = "ACCEPTED",
  language = "python",
  score = 100,
  passedTests = 0,
  totalTests = 0,
  timeZone,
  app = null,
}) {
  if (!userId || userId === "guest" || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  const dateStr = getDateString(new Date(), timeZone);
  const isAccepted = status === "ACCEPTED" || status === "PASSED" || (passedTests === totalTests && totalTests > 0);

  try {
    let record = await DailyCodingActivity.findOne({ userId, date: dateStr });
    if (!record) {
      record = new DailyCodingActivity({
        userId,
        date: dateStr,
        submissionsCount: 0,
        problemsSolved: 0,
        solvedChallengeIds: [],
        validActivities: [],
      });
    }

    record.submissionsCount += 1;

    // Check if this problem was already solved on this date to prevent duplicate solve count
    if (isAccepted && targetId) {
      if (!record.solvedChallengeIds.includes(targetId)) {
        record.solvedChallengeIds.push(targetId);
        record.problemsSolved = record.solvedChallengeIds.length;
      }
    }

    record.validActivities.unshift({
      activityType,
      targetId,
      title: title || targetId,
      status,
      language,
      score,
      passedTests,
      totalTests,
      timestamp: new Date(),
    });

    // Keep up to 50 granular log items per day
    if (record.validActivities.length > 50) {
      record.validActivities = record.validActivities.slice(0, 50);
    }

    await record.save();

    // Query all active dates for this user to compute accurate streak
    const allActivities = await DailyCodingActivity.find({ userId, submissionsCount: { $gt: 0 } })
      .select("date")
      .lean();
    const activeDates = allActivities.map((a) => a.date);
    const { currentStreak, longestStreak, streakActiveToday } = calculateStreaks(activeDates, timeZone);

    // Update User model with verified streak
    await User.findByIdAndUpdate(userId, {
      streak: currentStreak,
      lastActiveDate: new Date(),
    });

    // Real-time broadcast
    if (app) {
      try {
        const io = app.get("io");
        if (io) {
          io.to(`user_${userId}`).emit("daily_activity_updated", {
            userId: String(userId),
            date: dateStr,
            currentStreak,
            longestStreak,
            streakActiveToday,
            todaySubmissions: record.submissionsCount,
            problemsSolved: record.problemsSolved,
          });

          // Admin real-time notification
          io.emit("admin_activity_stream", {
            userId: String(userId),
            date: dateStr,
            currentStreak,
            submissionsCount: record.submissionsCount,
            title,
            status,
            language,
          });
        }
      } catch (e) {
        console.warn("Could not emit activity socket event:", e.message);
      }
    }

    return {
      record,
      currentStreak,
      longestStreak,
      streakActiveToday,
    };
  } catch (err) {
    console.error("Error in recordDailyCodingActivity:", err);
    return null;
  }
}

/**
 * Retrieves the full activity calendar, streak stats, and heatmap data for a user.
 * Seamlessly merges existing ChallengeSubmission records with DailyCodingActivity.
 */
async function getUserCodingActivity(userId, clientTimezone) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return {
      calendarData: {},
      currentStreak: 0,
      longestStreak: 0,
      totalProblemsSolved: 0,
      totalSubmissions: 0,
      activeDays: 0,
      todaySubmissions: 0,
      streakActiveToday: false,
      year: new Date().getFullYear(),
      recentActivities: [],
    };
  }

  // 1. Fetch DailyCodingActivity documents
  const dailyRecords = await DailyCodingActivity.find({ userId }).sort({ date: 1 }).lean();

  // 2. Fetch historical ChallengeSubmissions to ensure 100% preservation of historical records
  const historicalSubmissions = await ChallengeSubmission.find({ userId })
    .select("challengeId challengeTitle language status score passedTests totalTests createdAt")
    .sort({ createdAt: -1 })
    .lean();

  // Build calendar map: key = YYYY-MM-DD
  const calendarMap = new Map();
  const allSolvedSet = new Set();
  let totalSubmissionsCount = 0;
  const recentActivitiesList = [];

  // Index daily records
  for (const dr of dailyRecords) {
    const dStr = dr.date;
    const existing = calendarMap.get(dStr) || {
      date: dStr,
      count: 0,
      solvedCount: 0,
      solvedIds: new Set(),
      activities: [],
    };

    existing.count += dr.submissionsCount || 0;
    (dr.solvedChallengeIds || []).forEach((id) => {
      existing.solvedIds.add(id);
      allSolvedSet.add(id);
    });
    existing.solvedCount = existing.solvedIds.size;

    if (Array.isArray(dr.validActivities)) {
      dr.validActivities.forEach((act) => {
        existing.activities.push({
          type: act.activityType || "challenge",
          targetId: act.targetId,
          title: act.title || act.targetId,
          status: act.status,
          language: act.language,
          score: act.score,
          timestamp: act.timestamp,
        });
      });
    }

    calendarMap.set(dStr, existing);
  }

  // Merge historical submissions to guarantee completeness
  for (const sub of historicalSubmissions) {
    const subDateStr = getDateString(sub.createdAt, clientTimezone);
    const isAccepted = sub.status === "ACCEPTED" || (sub.passedTests === sub.totalTests && (sub.totalTests || 0) > 0);

    const existing = calendarMap.get(subDateStr) || {
      date: subDateStr,
      count: 0,
      solvedCount: 0,
      solvedIds: new Set(),
      activities: [],
    };

    // If DailyCodingActivity hadn't counted this historical submission yet:
    // (Check by matching timestamp or if daily records were empty for that day)
    const alreadyLogged = (existing.activities || []).some(
      (a) => a.targetId === sub.challengeId && Math.abs(new Date(a.timestamp || 0) - new Date(sub.createdAt)) < 2000
    );

    if (!alreadyLogged) {
      existing.count += 1;
      existing.activities.push({
        type: "challenge",
        targetId: sub.challengeId,
        title: sub.challengeTitle || sub.challengeId,
        status: sub.status,
        language: sub.language,
        score: sub.score,
        timestamp: sub.createdAt,
      });
    }

    if (isAccepted && sub.challengeId) {
      existing.solvedIds.add(sub.challengeId);
      allSolvedSet.add(sub.challengeId);
    }
    existing.solvedCount = existing.solvedIds.size;

    calendarMap.set(subDateStr, existing);

    if (recentActivitiesList.length < 25) {
      recentActivitiesList.push({
        challengeId: sub.challengeId,
        title: sub.challengeTitle || sub.challengeId,
        language: sub.language,
        status: sub.status,
        score: sub.score,
        timestamp: sub.createdAt,
      });
    }
  }

  // Format final calendar object
  const calendarData = {};
  const activeDates = [];

  for (const [dStr, entry] of calendarMap.entries()) {
    if (entry.count > 0) {
      activeDates.push(dStr);
      totalSubmissionsCount += entry.count;
    }
    calendarData[dStr] = {
      date: dStr,
      count: entry.count,
      solvedCount: entry.solvedCount,
      level: getIntensityLevel(entry.count),
      details: (entry.activities || []).slice(0, 10),
    };
  }

  // Calculate streaks
  const { currentStreak, longestStreak, streakActiveToday } = calculateStreaks(activeDates, clientTimezone);

  const todayStr = getDateString(new Date(), clientTimezone);
  const todayEntry = calendarData[todayStr];
  const todaySubmissions = todayEntry ? todayEntry.count : 0;

  return {
    calendarData,
    currentStreak,
    longestStreak,
    totalProblemsSolved: allSolvedSet.size,
    totalSubmissions: totalSubmissionsCount,
    activeDays: activeDates.length,
    todaySubmissions,
    streakActiveToday,
    year: new Date().getFullYear(),
    recentActivities: recentActivitiesList,
  };
}

module.exports = {
  getDateString,
  daysBetween,
  calculateStreaks,
  getIntensityLevel,
  recordDailyCodingActivity,
  getUserCodingActivity,
};
