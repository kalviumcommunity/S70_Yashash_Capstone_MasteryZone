const mongoose = require("mongoose");

const SubmittedProjectFileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    language: { type: String, default: "javascript" },
    content: { type: String, default: "" },
    sizeBytes: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProjectSubmissionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    candidateDetails: {
      fullName: { type: String, default: "Candidate" },
      email: { type: String, default: "" },
      candidateId: { type: String, default: "" },
    },
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    projectTitle: {
      type: String,
      required: true,
    },
    projectCategory: {
      type: String,
      default: "Full-Stack & Web",
    },
    track: {
      type: String,
      default: "Coding",
    },
    difficulty: {
      type: String,
      default: "Intermediate",
    },
    starterLanguage: {
      type: String,
      default: "javascript",
    },
    technologies: {
      type: [String],
      default: [],
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    files: {
      type: [SubmittedProjectFileSchema],
      default: [],
    },
    combinedCodeSnapshot: {
      type: String,
      default: "",
    },
    rubricBreakdown: {
      functionalCorrectness: {
        obtained: { type: Number, default: 0 },
        max: { type: Number, default: 40 },
        details: { type: String, default: "" },
      },
      testCaseExecution: {
        obtained: { type: Number, default: 0 },
        max: { type: Number, default: 20 },
        details: { type: String, default: "" },
      },
      codeQualityAndStructure: {
        obtained: { type: Number, default: 0 },
        max: { type: Number, default: 15 },
        details: { type: String, default: "" },
      },
      technicalRequirements: {
        obtained: { type: Number, default: 0 },
        max: { type: Number, default: 15 },
        details: { type: String, default: "" },
      },
      errorHandlingAndEdgeCases: {
        obtained: { type: Number, default: 0 },
        max: { type: Number, default: 10 },
        details: { type: String, default: "" },
      },
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passingMarks: {
      type: Number,
      default: 80,
    },
    grade: {
      type: String,
      default: "F",
    },
    passed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["PASSED", "NEEDS_IMPROVEMENT"],
      default: "NEEDS_IMPROVEMENT",
    },
    badgeAwarded: {
      type: Boolean,
      default: false,
    },
    xpAwarded: {
      type: Number,
      default: 0,
    },
    tasksEvaluation: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    requirementsEvaluation: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    testResults: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    passedTests: {
      type: Number,
      default: 0,
    },
    totalTests: {
      type: Number,
      default: 6,
    },
    evaluationFeedback: {
      summary: { type: String, default: "" },
      strengths: { type: [String], default: [] },
      deductions: { type: [String], default: [] },
      recommendations: { type: [String], default: [] },
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    durationSeconds: {
      type: Number,
      default: 60,
    },
    adminNote: {
      type: String,
      default: "",
    },
    adminModifiedAt: {
      type: Date,
    },
    adminModifiedBy: {
      type: String,
      default: "",
    },
    marksHistory: [
      {
        oldScore: Number,
        newScore: Number,
        oldStatus: String,
        newStatus: String,
        adminNote: String,
        modifiedBy: String,
        modifiedAt: { type: Date, default: Date.now },
      },
    ],
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationEmailSent: {
      type: Boolean,
      default: false,
    },
    notificationInAppId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      index: true,
    },
    notificationViewed: {
      type: Boolean,
      default: false,
    },
    notificationViewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

ProjectSubmissionSchema.index({ userId: 1, projectId: 1, createdAt: -1 });
ProjectSubmissionSchema.index({ userId: 1, createdAt: -1 });
ProjectSubmissionSchema.index({ userId: 1, submittedAt: -1 });
ProjectSubmissionSchema.index({ createdAt: -1 });
ProjectSubmissionSchema.index({ submittedAt: -1 });
ProjectSubmissionSchema.index({ "candidateDetails.email": 1, createdAt: -1 });

module.exports = mongoose.model("ProjectSubmission", ProjectSubmissionSchema);
