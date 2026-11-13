const mongoose = require("mongoose");

const ProjectFileSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, required: true },
    language: { type: String, default: "javascript" },
    content: { type: String, default: "" },
  },
  { _id: false }
);

const ProjectWorkspaceStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "submitted", "passed", "needs_improvement"],
      default: "in_progress",
    },
    files: {
      type: [ProjectFileSchema],
      default: [],
    },
    checkedTasks: {
      type: [String],
      default: [],
    },
    lastRunSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    attemptsCount: {
      type: Number,
      default: 0,
    },
    bestScore: {
      type: Number,
      default: 0,
    },
    bestGrade: {
      type: String,
      default: "",
    },
    lastScore: {
      type: Number,
      default: null,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    badgeAwarded: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    latestSubmissionId: {
      type: String,
      default: "",
    },
    latestReportSessionId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

ProjectWorkspaceStateSchema.index({ userId: 1, projectId: 1 }, { unique: true });
ProjectWorkspaceStateSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("ProjectWorkspaceState", ProjectWorkspaceStateSchema);
