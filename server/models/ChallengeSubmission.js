const mongoose = require("mongoose");

const challengeSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    challengeId: {
      type: String,
      required: true,
      index: true,
    },
    challengeTitle: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACCEPTED", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED", "COMPILATION_ERROR", "RUNTIME_ERROR"],
      required: true,
    },
    passedTests: {
      type: Number,
      default: 0,
    },
    totalTests: {
      type: Number,
      default: 0,
    },
    runtimeMs: {
      type: Number,
      default: 0,
    },
    output: {
      type: String,
      default: "",
    },
    error: {
      type: String,
      default: "",
    },
    adminNote: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      default: 0,
    },
    testResults: {
      type: Array,
      default: [],
    },
    adminModifiedAt: {
      type: Date,
      default: null,
    },
    adminModifiedBy: {
      type: String,
      default: "",
    },
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
      default: null,
      index: true,
    },
    notificationViewed: {
      type: Boolean,
      default: false,
    },
    notificationViewedAt: {
      type: Date,
      default: null,
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
  },
  { timestamps: true }
);

challengeSubmissionSchema.index({ userId: 1, createdAt: -1 });
challengeSubmissionSchema.index({ userId: 1, challengeId: 1 });
challengeSubmissionSchema.index({ status: 1, createdAt: -1 });
challengeSubmissionSchema.index({ createdAt: -1 });
challengeSubmissionSchema.index({ challengeId: 1, status: 1 });

module.exports =
  mongoose.models.ChallengeSubmission ||
  mongoose.model("ChallengeSubmission", challengeSubmissionSchema);
