const mongoose = require("mongoose");

const subjectProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subjectKey: {
      type: String, // "coding", "language", "driving", "fitness"
      required: true,
      enum: ["coding", "language", "driving", "fitness"],
      index: true,
    },
    activeTrack: {
      type: String,
      default: "default",
    },
    // Track unlock level: { trackId: highestUnlockedModuleIndex }
    trackUnlocks: {
      type: Map,
      of: Number,
      default: {},
    },
    // Completed verified modules count per track: { trackId: count }
    trackLessons: {
      type: Map,
      of: Number,
      default: {},
    },
    // Granular progress per module: key = `${trackId}_${moduleIndex}`
    moduleProgress: {
      type: Map,
      of: new mongoose.Schema(
        {
          isStudied: { type: Boolean, default: false },
          studiedAt: { type: Date },
          studyTimeSeconds: { type: Number, default: 0 },
          assignmentPassed: { type: Boolean, default: false },
          assignmentPassedAt: { type: Date },
          assignmentFeedback: { type: String, default: "" },
          exercisePassed: { type: Boolean, default: false }, // for coding backwards compatibility
          exerciseCode: { type: String, default: "" },
          assessmentPassed: { type: Boolean, default: false },
          assessmentScore: { type: Number, default: 0 },
          assessmentPassedAt: { type: Date },
          bestScore: { type: Number, default: 0 },
          attemptsCount: { type: Number, default: 0 },
          isCompleted: { type: Boolean, default: false },
          status: { type: String, default: "in_progress" },
          moduleCompletionEmailSent: { type: Boolean, default: false },
          passedAt: { type: Date },
        },
        { _id: false }
      ),
      default: {},
    },
    assessmentAttempts: [
      {
        attemptId: { type: mongoose.Schema.Types.ObjectId, ref: "ModuleAssessmentAttempt" },
        trackId: { type: String, required: true },
        moduleIndex: { type: Number, required: true },
        score: { type: Number, required: true },
        percentage: { type: Number, required: true },
        passed: { type: Boolean, required: true },
        timeSpentSeconds: { type: Number, default: 0 },
        violationsCount: { type: Number, default: 0 },
        attemptedAt: { type: Date, default: Date.now },
      },
    ],
    lastActivity: {
      type: { type: String }, // "study", "assignment", "assessment"
      trackId: { type: String },
      moduleIndex: { type: Number },
      title: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

subjectProgressSchema.index({ userId: 1, subjectKey: 1 }, { unique: true });

module.exports =
  mongoose.models.SubjectProgress ||
  mongoose.model("SubjectProgress", subjectProgressSchema);
