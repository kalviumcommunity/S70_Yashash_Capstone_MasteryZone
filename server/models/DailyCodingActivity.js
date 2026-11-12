const mongoose = require("mongoose");

const dailyCodingActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Normalized date string in format "YYYY-MM-DD"
    date: {
      type: String,
      required: true,
      index: true,
    },
    // Total count of verified submissions (compiler test runs / formal submissions) on this day
    submissionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Count of distinct problems / challenges solved (100% test cases passed) on this day
    problemsSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Set of distinct challenge/exercise IDs solved on this day to prevent duplicate counting
    solvedChallengeIds: {
      type: [String],
      default: [],
    },
    // Granular log of verified coding actions performed on this day
    validActivities: [
      {
        activityType: {
          type: String,
          enum: ["challenge", "curriculum_exercise", "assessment_session", "compiler_run"],
          default: "challenge",
        },
        targetId: { type: String, default: "" },
        title: { type: String, default: "" },
        status: { type: String, default: "ACCEPTED" }, // "ACCEPTED", "WRONG_ANSWER", "PASSED", etc.
        language: { type: String, default: "python" },
        score: { type: Number, default: 0 },
        passedTests: { type: Number, default: 0 },
        totalTests: { type: Number, default: 0 },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Guarantee atomic idempotency per user per calendar day
dailyCodingActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports =
  mongoose.models.DailyCodingActivity ||
  mongoose.model("DailyCodingActivity", dailyCodingActivitySchema);
