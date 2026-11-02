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
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ChallengeSubmission ||
  mongoose.model("ChallengeSubmission", challengeSubmissionSchema);
