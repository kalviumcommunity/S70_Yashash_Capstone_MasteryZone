const mongoose = require("mongoose");

const codingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    activeTrack: {
      type: String,
      default: "Python Track",
    },
    // Track unlock level: { python: 0, javascript: 0, java: 0, cpp: 0, webdev: 0, dsa: 0 }
    // 0 means only module 0 is unlocked. 1 means modules 0 and 1 are unlocked, etc.
    trackUnlocks: {
      type: Map,
      of: Number,
      default: {
        python: 0,
        javascript: 0,
        java: 0,
        cpp: 0,
        webdev: 0,
        dsa: 0,
      },
    },
    // Verified completed modules count per track: { python: 0, ... }
    trackLessons: {
      type: Map,
      of: Number,
      default: {
        python: 0,
        javascript: 0,
        java: 0,
        cpp: 0,
        webdev: 0,
        dsa: 0,
      },
    },
    // Detailed granular module progress: key = `${trackId}_${moduleIndex}`
    moduleProgress: {
      type: Map,
      of: new mongoose.Schema(
        {
          isStudied: { type: Boolean, default: false },
          studiedAt: { type: Date },
          studyTimeSeconds: { type: Number, default: 0 },
          exercisePassed: { type: Boolean, default: false },
          exerciseCode: { type: String, default: "" },
          exerciseDraftCode: { type: String, default: "" },
          exerciseScore: { type: Number, default: 0 },
          lastDraftSavedAt: { type: Date },
          exercisePassedAt: { type: Date },
          assessmentPassed: { type: Boolean, default: false },
          assessmentScore: { type: Number, default: 0 },
          assessmentPassedAt: { type: Date },
          bestScore: { type: Number, default: 0 },
          attemptsCount: { type: Number, default: 0 },
          exerciseAttempts: [
            {
              attemptNumber: { type: Number, default: 1 },
              code: { type: String, default: "" },
              language: { type: String, default: "python" },
              passedTests: { type: Number, default: 0 },
              totalTests: { type: Number, default: 10 },
              score: { type: Number, default: 0 },
              status: { type: String, default: "SUBMITTED" },
              timestamp: { type: Date, default: Date.now },
            },
          ],
        },
        { _id: false }
      ),
      default: {},
    },
    assessmentAttempts: [
      {
        trackId: String,
        moduleIndex: Number,
        moduleTitle: String,
        score: Number,
        percentage: Number,
        passed: Boolean,
        timeSpentSeconds: Number,
        violationsCount: Number,
        attemptedAt: { type: Date, default: Date.now },
      },
    ],
    lastActivity: {
      type: { type: String, default: "welcome" },
      trackId: { type: String, default: "python" },
      moduleIndex: { type: Number, default: 0 },
      title: { type: String, default: "Welcome to Coding Track" },
      timestamp: { type: Date, default: Date.now },
    },
    videoProgress: {
      type: Map,
      of: new mongoose.Schema(
        {
          position: { type: Number, default: 0 },
          duration: { type: Number, default: 0 },
          completed: { type: Boolean, default: false },
          bookmarked: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: {},
    },
    challengesSolved: {
      type: [
        {
          challengeId: String,
          language: String,
          score: Number,
          code: String,
          solvedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    projects: {
      type: Map,
      of: new mongoose.Schema(
        {
          code: { type: String, default: "" },
          completedTasks: { type: [String], default: [] },
          status: { type: String, default: "in-progress" },
          updatedAt: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
      default: {},
    },
    bookmarkedResources: {
      type: [String],
      default: [],
    },
    visitedResources: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CodingProgress ||
  mongoose.model("CodingProgress", codingProgressSchema);
