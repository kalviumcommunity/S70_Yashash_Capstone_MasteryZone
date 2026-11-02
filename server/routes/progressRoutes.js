const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authenticateToken = require("../middleware/authMiddleware");
const Progress = require("../models/ProgressSchema");
const Certification = require("../models/CertificationSchema");
const User = require("../models/User");
const CodingProgress = require("../models/CodingProgress");
const SubjectProgress = require("../models/SubjectProgress");
const ModuleAssessmentAttempt = require("../models/ModuleAssessmentAttempt");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const ProctoredCodingSession = require("../models/ProctoredCodingSession");
const ProjectWorkspaceState = require("../models/ProjectWorkspaceState");
const ProjectSubmission = require("../models/ProjectSubmission");
const { PROJECTS_CATALOG, getProjectById } = require("../data/projectsCatalog");
const { pushNotification } = require("../utils/notificationService");

// Helper to calculate relative time string (e.g., "2 hours ago", "1 day ago")
function getRelativeTime(date) {
  if (!date) return "Recently";
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "1 day ago";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? "s" : ""} ago`;
  return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Format date to local YYYY-MM-DD
function getLocalDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// -------------------------------------------------------------
// GET /api/progress/dashboard
// Aggregates real user statistics, tracks, charts, achievements
// -------------------------------------------------------------
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Maintain Streak Integrity
    const now = new Date();
    let currentStreak = user.streak || 1;
    if (user.lastActiveDate) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const lastActive = new Date(user.lastActiveDate);
      const lastDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()).getTime();
      const diffDays = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak = (user.streak || 1) + 1;
        user.streak = currentStreak;
        user.lastActiveDate = now;
        await user.save();
      } else if (diffDays > 1) {
        currentStreak = 1;
        user.streak = 1;
        user.lastActiveDate = now;
        await user.save();
      }
    } else {
      user.lastActiveDate = now;
      user.streak = 1;
      await user.save();
    }

    // 2. Fetch User's Genuine Data Records
    const certs = await Certification.find({ userId }).sort({ createdAt: -1 });
    const progressRecords = await Progress.find({ userId }).sort({ date: -1 });
    const projectStates = await ProjectWorkspaceState.find({ userId }).sort({ updatedAt: -1 }).lean();
    const projectSubmissions = await ProjectSubmission.find({ userId }).sort({ submittedAt: -1 }).lean();

    const completedProjects = projectStates
      .filter((st) => st.passed && st.badgeAwarded)
      .map((st) => {
        const proj = getProjectById(st.projectId) || {};
        const latestPassedSub =
          projectSubmissions.find((s) => s.projectId === st.projectId && s.passed) ||
          projectSubmissions.find((s) => s.projectId === st.projectId);
        const sessionId = st.latestReportSessionId || latestPassedSub?.sessionId || null;
        return {
          projectId: st.projectId,
          title: proj.title || latestPassedSub?.projectTitle || st.projectId,
          category: proj.category || latestPassedSub?.projectCategory || "Full-Stack Engineering",
          difficulty: proj.difficulty || latestPassedSub?.difficulty || "Intermediate",
          language: proj.starterLanguage || latestPassedSub?.language || "javascript",
          technologies: proj.technologies || [],
          marksObtained: st.bestScore || latestPassedSub?.marksObtained || 100,
          totalMarks: proj.totalMarks || 100,
          percentage: st.bestPercentage || latestPassedSub?.percentage || 100,
          grade: st.bestGrade || latestPassedSub?.grade || "A+",
          passed: true,
          badgeAwarded: true,
          badgeLabel: "PROJECT COMPLETED",
          xpReward: proj.xpReward || 450,
          attemptsCount: st.attemptsCount || 1,
          completedAt: st.completedAt || latestPassedSub?.submittedAt || st.updatedAt,
          timeAgo: getRelativeTime(st.completedAt || latestPassedSub?.submittedAt || st.updatedAt),
          sessionId,
          reportUrl: sessionId ? `/assessment-report/${sessionId}` : null,
        };
      });

    const inProgressProjectsCount = projectStates.filter((st) => !st.passed && st.status !== "NOT_STARTED").length;
    const totalProjectXp = completedProjects.reduce((sum, cp) => sum + (cp.xpReward || 400), 0);

    // 3. Calculate 7-Day Window Timestamps
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 4. Calculate Completed Modules
    let certCompletedModules = 0;
    let certCompletedThisWeek = 0;
    certs.forEach((c) => {
      const cDate = new Date(c.updatedAt || c.createdAt);
      if (c.status === "completed") {
        const count = c.totalModules || c.currentModule || 1;
        certCompletedModules += count;
        if (cDate >= oneWeekAgo) {
          certCompletedThisWeek += count;
        }
      } else if (c.currentModule > 1) {
        const count = c.currentModule - 1;
        certCompletedModules += count;
        if (cDate >= oneWeekAgo) {
          certCompletedThisWeek += count;
        }
      }
    });

    const completedProgressItems = progressRecords.filter((p) => p.status === "completed");
    const completedProgressThisWeek = completedProgressItems.filter(
      (p) => new Date(p.date || p.createdAt) >= oneWeekAgo
    );

    const totalCompletedModules = certCompletedModules + completedProgressItems.length;
    const modulesCompletedThisWeek = certCompletedThisWeek + completedProgressThisWeek.length;

    // 5. Calculate Real Learning Hours
    const progressHours = progressRecords.reduce((acc, curr) => acc + (Number(curr.hoursSpent) || 0.5), 0);
    const certHours = certCompletedModules * 1.5;
    const totalLearningHours = Math.round(((user.learningHours || 0) + progressHours + certHours) * 10) / 10;

    const progressHoursThisWeek = completedProgressThisWeek.reduce(
      (acc, curr) => acc + (Number(curr.hoursSpent) || 0.5),
      0
    );
    const certHoursThisWeek = certCompletedThisWeek * 1.5;
    const learningHoursThisWeek = Math.round((progressHoursThisWeek + certHoursThisWeek) * 10) / 10;

    // 6. Track Progress Calculations (Coding, Language, Vehicles, Fitness)
    const trackConfigs = [
      {
        key: "CODING",
        title: "Coding",
        subtitle: "Python • JavaScript • Web Development",
        route: "/coding",
        totalLessons: 20,
        defaultCurrent: "Python Fundamentals & Syntax",
        color: "#3b82f6",
        badgeBg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
        fillColor: "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)",
      },
      {
        key: "LANGUAGE",
        title: "Language",
        subtitle: "English • Spanish • French",
        route: "/language",
        totalLessons: 15,
        defaultCurrent: "Conversational Spanish & Vocabulary",
        color: "#10b981",
        badgeBg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
        fillColor: "linear-gradient(90deg, #10b981 0%, #14b8a6 100%)",
      },
      {
        key: "VEHICLES",
        title: "Vehicles",
        subtitle: "Automotive • Electric Vehicles • Maintenance",
        route: "/driving",
        totalLessons: 12,
        defaultCurrent: "EV Powertrain & Battery Diagnostics",
        color: "#0284c7",
        badgeBg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        fillColor: "linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)",
      },
      {
        key: "FITNESS",
        title: "Gym & Fitness",
        subtitle: "Strength • Nutrition • Wellness",
        route: "/fitness",
        totalLessons: 10,
        defaultCurrent: "Progressive Overload & Periodization",
        color: "#ec4899",
        badgeBg: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
        fillColor: "linear-gradient(90deg, #ec4899 0%, #f43f5e 100%)",
      },
    ];

    const tracksProgress = trackConfigs.map((trackCfg) => {
      // Find certs for this zone
      const zoneCert = certs.find(
        (c) =>
          c.zone === trackCfg.key ||
          (trackCfg.key === "VEHICLES" && c.zone === "DRIVING")
      );

      // Find progress tasks for this track
      const trackProgressItems = progressRecords.filter(
        (p) =>
          p.track === trackCfg.key ||
          (trackCfg.key === "VEHICLES" && p.track === "DRIVING")
      );

      let completed = 0;
      let currentModule = trackCfg.defaultCurrent;

      if (zoneCert) {
        if (zoneCert.status === "completed") {
          completed = trackCfg.totalLessons;
          currentModule = `${zoneCert.name} (Certified)`;
        } else {
          completed = Math.min(
            trackCfg.totalLessons,
            zoneCert.currentModule || 1
          );
          currentModule = `${zoneCert.name} - Module ${zoneCert.currentModule}`;
        }
      }

      // Add standalone progress items
      completed = Math.min(trackCfg.totalLessons, completed + trackProgressItems.length);
      if (trackProgressItems.length > 0 && (!zoneCert || zoneCert.status !== "completed")) {
        currentModule = trackProgressItems[0].moduleName || trackProgressItems[0].task || currentModule;
      }

      const percentage = Math.min(
        100,
        Math.round((completed / trackCfg.totalLessons) * 100)
      );

      const isExplored = (user.exploredTracks || []).some(
        (t) => t.toLowerCase().includes(trackCfg.title.toLowerCase().slice(0, 4))
      ) || completed > 0;

      return {
        key: trackCfg.key,
        title: trackCfg.title,
        subtitle: trackCfg.subtitle,
        route: trackCfg.route,
        totalLessons: trackCfg.totalLessons,
        completedLessons: completed,
        percentage,
        currentModule,
        isExplored,
        color: trackCfg.color,
        fillColor: trackCfg.fillColor,
        badgeBg: trackCfg.badgeBg,
      };
    });

    // 7. Overall Progress Calculation (Weighted average of tracks)
    const totalPossibleLessons = tracksProgress.reduce((acc, t) => acc + t.totalLessons, 0);
    const totalFinishedLessons = tracksProgress.reduce((acc, t) => acc + t.completedLessons, 0);
    const overallPercentage = totalPossibleLessons > 0
      ? Math.round((totalFinishedLessons / totalPossibleLessons) * 100)
      : 0;

    const overallBreakdown = tracksProgress.map((t) => ({
      key: t.key,
      title: t.title,
      percentage: t.percentage,
      color: t.color,
    }));

    // 8. Weekly Learning Activity Bar Chart (Mon - Sun of Current Week)
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const curr = new Date();
    // Calculate Monday of current week
    const currentDayOfWeek = curr.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const weeklyActivity = dayNames.map((dayName, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);
      const dayKey = getLocalDateKey(dayDate);

      // Aggregate progress records matching this day
      let dayHours = 0;
      let dayLessons = 0;

      progressRecords.forEach((p) => {
        const pKey = getLocalDateKey(p.date || p.createdAt);
        if (pKey === dayKey) {
          dayHours += Number(p.hoursSpent) || 0.5;
          dayLessons += 1;
        }
      });

      // Also check certs updated on this day
      certs.forEach((c) => {
        const cKey = getLocalDateKey(c.updatedAt || c.createdAt);
        if (cKey === dayKey && c.status === "completed") {
          dayHours += 1.5;
          dayLessons += 1;
        }
      });

      return {
        day: dayName,
        dateKey: dayKey,
        hours: Math.round(dayHours * 10) / 10,
        lessons: dayLessons,
        isToday: dayKey === getLocalDateKey(now),
      };
    });

    // 9. Verified Performance-Based Achievements Calculation
    const allPossibleAchievements = [
      {
        id: "ach_getting_started",
        name: "Getting Started",
        description: "Completed your first module",
        track: "GENERAL",
        iconType: "shield_check",
        badgeColor: "#10b981",
        grade: "Grade B",
        tier: "Bronze",
        isEligible: totalCompletedModules >= 1,
        earnedAt: progressRecords[progressRecords.length - 1]?.date || certs[0]?.createdAt || user.createdAt,
      },
      {
        id: "ach_code_explorer",
        name: "Code Explorer",
        description: "Completed 5 coding lessons",
        track: "CODING",
        iconType: "code",
        badgeColor: "#8b5cf6",
        grade: "Grade A",
        tier: "Silver",
        isEligible: tracksProgress.find((t) => t.key === "CODING")?.completedLessons >= 5,
        earnedAt: progressRecords.find((p) => p.track === "CODING")?.date || user.lastActiveDate,
      },
      {
        id: "ach_fitness_enthusiast",
        name: "Fitness Enthusiast",
        description: "Logged 5 workout sessions",
        track: "FITNESS",
        iconType: "fitness",
        badgeColor: "#ec4899",
        grade: "Grade A",
        tier: "Silver",
        isEligible: tracksProgress.find((t) => t.key === "FITNESS")?.completedLessons >= 5,
        earnedAt: progressRecords.find((p) => p.track === "FITNESS")?.date || user.lastActiveDate,
      },
      {
        id: "ach_polyglot_novice",
        name: "Language Scholar",
        description: "Completed 5 language practices",
        track: "LANGUAGE",
        iconType: "language",
        badgeColor: "#10b981",
        grade: "Grade A",
        tier: "Silver",
        isEligible: tracksProgress.find((t) => t.key === "LANGUAGE")?.completedLessons >= 5,
        earnedAt: progressRecords.find((p) => p.track === "LANGUAGE")?.date || user.lastActiveDate,
      },
      {
        id: "ach_vehicle_mechanic",
        name: "Drive Master",
        description: "Mastered 3 vehicle diagnostics modules",
        track: "VEHICLES",
        iconType: "car",
        badgeColor: "#0284c7",
        grade: "Grade A",
        tier: "Silver",
        isEligible: tracksProgress.find((t) => t.key === "VEHICLES")?.completedLessons >= 3,
        earnedAt: progressRecords.find((p) => p.track === "VEHICLES")?.date || user.lastActiveDate,
      },
      {
        id: "ach_streak_flame",
        name: "Consistency Flame",
        description: "Maintained a 5-day learning streak",
        track: "GENERAL",
        iconType: "flame",
        badgeColor: "#f59e0b",
        grade: "Grade A+",
        tier: "Gold",
        isEligible: currentStreak >= 5,
        earnedAt: user.lastActiveDate || now,
      },
      {
        id: "ach_certified_master",
        name: "Certified Specialist",
        description: "Earned an official Mastery Zone certification",
        track: "GENERAL",
        iconType: "trophy",
        badgeColor: "#6366f1",
        grade: "Grade A+",
        tier: "Platinum",
        isEligible: certs.some((c) => c.status === "completed"),
        earnedAt: certs.find((c) => c.status === "completed")?.updatedAt || user.lastActiveDate,
      },
      {
        id: "ach_project_architect",
        name: "Project Completed Architect",
        description: "Passed a real-world multi-file engineering project with >= 80/100 marks",
        track: "CODING",
        iconType: "trophy",
        badgeColor: "#10b981",
        grade: completedProjects[0]?.grade ? `Grade ${completedProjects[0].grade}` : "Grade A+",
        tier: "Gold",
        isEligible: completedProjects.length >= 1,
        earnedAt: completedProjects[0]?.completedAt || user.lastActiveDate,
      },
      {
        id: "ach_fullstack_master",
        name: "Full-Stack Portfolio Builder",
        description: "Passed 3+ production engineering projects across Mastery Zone",
        track: "CODING",
        iconType: "code",
        badgeColor: "#2563eb",
        grade: "Grade A+",
        tier: "Platinum",
        isEligible: completedProjects.length >= 3,
        earnedAt: completedProjects[0]?.completedAt || user.lastActiveDate,
      },
    ];

    const earnedAchievements = allPossibleAchievements
      .filter((a) => a.isEligible)
      .map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        track: a.track,
        iconType: a.iconType,
        badgeColor: a.badgeColor,
        grade: a.grade,
        tier: a.tier,
        earnedAt: a.earnedAt,
        timeAgo: getRelativeTime(a.earnedAt),
      }));

    const achievementsThisWeekCount = earnedAchievements.filter(
      (a) => new Date(a.earnedAt) >= oneWeekAgo
    ).length;

    // 10. Recent Activity Log Generation (Zero Fake Data)
    const recentActivities = [];

    // Add progress items
    progressRecords.slice(0, 10).forEach((p) => {
      recentActivities.push({
        id: p._id.toString(),
        type: "progress",
        track: p.track,
        title: p.task || "Completed a lesson",
        subtitle: p.moduleName || p.notes || "Learning session",
        timestamp: p.date || p.createdAt,
        timeAgo: getRelativeTime(p.date || p.createdAt),
        xp: p.xpEarned || 20,
        hours: p.hoursSpent || 0.5,
      });
    });

    // Add cert events
    certs.forEach((c) => {
      recentActivities.push({
        id: `cert_${c._id.toString()}`,
        type: "cert",
        track: c.zone === "DRIVING" ? "VEHICLES" : c.zone,
        title: c.status === "completed" ? "Completed certification" : "Enrolled in certification",
        subtitle: `${c.name} (${c.status === "completed" ? "100% Certified" : `Module ${c.currentModule}/${c.totalModules}`})`,
        timestamp: c.updatedAt || c.createdAt,
        timeAgo: getRelativeTime(c.updatedAt || c.createdAt),
        xp: c.status === "completed" ? 100 : 25,
        hours: 1.5,
      });
    });

    // Sort combined activities desc by date
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName || user.username,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        location: user.location || "Location not set",
        createdAt: user.createdAt,
      },
      stats: {
        streak: currentStreak,
        streakTrend: currentStreak >= 3 ? "Keep it going! 🔥" : "Start your streak today!",
        learningHours: totalLearningHours,
        learningHoursThisWeek: learningHoursThisWeek,
        completedModules: totalCompletedModules,
        completedModulesThisWeek: modulesCompletedThisWeek,
        achievementsCount: earnedAchievements.length,
        achievementsThisWeek: achievementsThisWeekCount,
        completedProjectsCount: completedProjects.length,
        totalProjectsCount: PROJECTS_CATALOG.length,
        totalProjectXp,
      },
      tracksProgress,
      overallProgress: {
        percentage: overallPercentage,
        breakdown: overallBreakdown,
      },
      weeklyActivity,
      recentActivity: recentActivities.slice(0, 8),
      recentAchievements: earnedAchievements.slice(0, 4),
      allAchievements: allPossibleAchievements.map((a) => ({
        ...a,
        timeAgo: a.isEligible ? getRelativeTime(a.earnedAt) : null,
      })),
      certifications: certs,
      completedProjects,
      projectStats: {
        totalProjects: PROJECTS_CATALOG.length,
        completedCount: completedProjects.length,
        inProgressCount: inProgressProjectsCount,
        totalProjectXp,
      },
    });
  } catch (err) {
    console.error("Dashboard calculation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/progress/log
// Explicitly logs a genuine learning activity, lesson, or workout
// -------------------------------------------------------------
router.post("/log", authenticateToken, async (req, res) => {
  const { track, task, moduleName, hoursSpent, xpEarned, score, notes } = req.body;

  if (!task || !task.trim()) {
    return res.status(400).json({ message: "Task description is required" });
  }

  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Normalize track
    let normalizedTrack = "GENERAL";
    const trackUpper = (track || "").toUpperCase();
    if (trackUpper.includes("COD")) normalizedTrack = "CODING";
    else if (trackUpper.includes("LANG")) normalizedTrack = "LANGUAGE";
    else if (trackUpper.includes("VEH") || trackUpper.includes("DRIV")) normalizedTrack = "VEHICLES";
    else if (trackUpper.includes("FIT") || trackUpper.includes("GYM")) normalizedTrack = "FITNESS";

    const parsedHours = Math.max(0.1, Number(hoursSpent) || 0.5);
    const parsedXP = Math.max(5, Number(xpEarned) || 20);

    const progressRecord = new Progress({
      userId,
      track: normalizedTrack,
      task: task.trim(),
      moduleName: (moduleName || "").trim(),
      hoursSpent: parsedHours,
      xpEarned: parsedXP,
      score: Number(score) || 100,
      notes: (notes || "").trim(),
      status: "completed",
      date: new Date(),
    });

    await progressRecord.save();

    // Update user stats
    const now = new Date();
    user.lastActiveDate = now;
    user.learningHours = Math.round(((user.learningHours || 0) + parsedHours) * 10) / 10;
    
    // Add to explored tracks if not already present
    let trackName = "Coding";
    if (normalizedTrack === "LANGUAGE") trackName = "Language";
    else if (normalizedTrack === "VEHICLES") trackName = "Vehicles";
    else if (normalizedTrack === "FITNESS") trackName = "Fitness";

    if (!user.exploredTracks) user.exploredTracks = [];
    if (!user.exploredTracks.includes(trackName)) {
      user.exploredTracks.push(trackName);
    }

    await user.save();

    await pushNotification(req.app, {
      userId,
      title: "Learning Activity Logged",
      message: `${trackName}: "${task.trim()}" (+${parsedXP} XP, ${parsedHours}h logged).`,
      type: "progress",
      severity: "success",
      actionUrl: "/progress",
      actionLabel: "View Progress",
      meta: { track: normalizedTrack, xpEarned: parsedXP, hoursSpent: parsedHours },
    });

    res.status(201).json({
      message: "Progress record created successfully",
      progress: progressRecord,
      learningHours: user.learningHours,
    });
  } catch (err) {
    console.error("Progress log error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// -------------------------------------------------------------
// POST /api/progress/reset
// Resets learning process, modules, tests, and assessment attempts
// -------------------------------------------------------------
router.post("/reset", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { scope = "all", trackId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Reset ModuleAssessmentAttempt
    const assessmentQuery = { userId };
    if (scope !== "all") {
      assessmentQuery.subjectKey = scope;
    }
    if (trackId && trackId !== "all") {
      assessmentQuery.trackId = trackId;
    }
    await ModuleAssessmentAttempt.deleteMany(assessmentQuery);

    // 2. Reset CodingProgress
    if (scope === "all" || scope === "coding") {
      let codingProg = await CodingProgress.findOne({ userId });
      if (codingProg) {
        if (trackId && trackId !== "all") {
          const tId = trackId.toLowerCase();
          if (codingProg.trackUnlocks) codingProg.trackUnlocks.set(tId, 0);
          if (codingProg.trackLessons) codingProg.trackLessons.set(tId, 0);
          if (codingProg.moduleProgress) {
            for (const key of Array.from(codingProg.moduleProgress.keys())) {
              if (key.startsWith(`${tId}_`)) {
                codingProg.moduleProgress.delete(key);
              }
            }
          }
          if (codingProg.assessmentAttempts) {
            codingProg.assessmentAttempts = codingProg.assessmentAttempts.filter(
              (a) => a.trackId !== tId
            );
          }
        } else {
          codingProg.trackUnlocks = new Map([
            ["python", 0],
            ["javascript", 0],
            ["java", 0],
            ["cpp", 0],
            ["webdev", 0],
            ["dsa", 0],
          ]);
          codingProg.trackLessons = new Map([
            ["python", 0],
            ["javascript", 0],
            ["java", 0],
            ["cpp", 0],
            ["webdev", 0],
            ["dsa", 0],
          ]);
          codingProg.moduleProgress = new Map();
          codingProg.assessmentAttempts = [];
          codingProg.challengesSolved = [];
          codingProg.videoProgress = new Map();
          codingProg.projects = new Map();
          codingProg.bookmarkedResources = [];
          codingProg.lastActivity = {
            type: "welcome",
            trackId: "python",
            moduleIndex: 0,
            title: "Welcome to Coding Track",
            timestamp: new Date(),
          };
        }
        await codingProg.save();
      }

      if (!trackId || trackId === "all") {
        await ChallengeSubmission.deleteMany({ userId });
        await ProctoredCodingSession.deleteMany({ userId });
        await ProjectWorkspaceState.deleteMany({ userId });
        await ProjectSubmission.deleteMany({ userId });
      }
    }

    // 3. Reset SubjectProgress (for language, driving, fitness, and coding)
    const subjectProgressQuery = { userId };
    if (scope !== "all") {
      subjectProgressQuery.subjectKey = scope;
    }
    const subjects = await SubjectProgress.find(subjectProgressQuery);
    for (const sp of subjects) {
      if (trackId && trackId !== "all") {
        if (sp.trackUnlocks) sp.trackUnlocks.delete(trackId);
        if (sp.trackLessons) sp.trackLessons.delete(trackId);
        if (sp.moduleProgress) {
          for (const key of Array.from(sp.moduleProgress.keys())) {
            if (key.startsWith(`${trackId}_`)) {
              sp.moduleProgress.delete(key);
            }
          }
        }
        if (sp.assessmentAttempts) {
          sp.assessmentAttempts = sp.assessmentAttempts.filter((a) => a.trackId !== trackId);
        }
      } else {
        sp.trackUnlocks = new Map();
        sp.trackLessons = new Map();
        sp.moduleProgress = new Map();
        sp.assessmentAttempts = [];
        sp.lastActivity = {};
      }
      await sp.save();
    }

    // 4. Reset Activity Logs in ProgressSchema
    const progressQuery = { userId };
    if (scope !== "all") {
      const trackName = scope === "coding" ? "CODING" : scope === "language" ? "LANGUAGE" : scope === "driving" ? "DRIVING" : scope === "fitness" ? "FITNESS" : scope.toUpperCase();
      progressQuery.track = trackName;
    }
    await Progress.deleteMany(progressQuery);

    // 5. Update User stats if resetting all
    if (scope === "all") {
      user.learningHours = 0;
      user.streak = 1;
      user.progress = [];
      user.exploredTracks = [];
      await user.save();
    }

    res.json({
      success: true,
      message: `Learning process successfully reset for ${scope === "all" ? "all tracks and modules" : scope}${trackId ? ` (${trackId})` : ""}.`,
      scope,
      trackId: trackId || "all",
    });
  } catch (err) {
    console.error("Reset learning process error:", err);
    res.status(500).json({ message: "Failed to reset learning process", error: err.message });
  }
});

module.exports = router;
