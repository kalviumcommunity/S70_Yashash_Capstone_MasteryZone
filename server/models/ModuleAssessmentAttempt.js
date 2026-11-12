const mongoose = require("mongoose");

const moduleAssessmentAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    subjectKey: {
      type: String,
      default: "coding",
      index: true,
    },
    trackId: {
      type: String,
      required: true,
      index: true,
    },
    moduleIndex: {
      type: Number,
      required: true,
      index: true,
    },
    moduleTitle: {
      type: String,
      required: true,
    },
    assessmentTitle: {
      type: String,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    score: {
      type: Number, // correct answers count
      required: true,
    },
    totalQuestions: {
      type: Number,
      default: 10,
    },
    marksPerQuestion: {
      type: Number,
      default: 1,
    },
    totalMarks: {
      type: Number,
      default: 10,
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
    questionsAttempted: {
      type: Number,
      default: 0,
    },
    questionsUnanswered: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
      default: "F",
    },
    percentage: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    passingScore: {
      type: Number,
      default: 80, // 80% passing mark
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    violationsCount: {
      type: Number,
      default: 0,
    },
    adminNote: {
      type: String,
      default: "",
    },
    proctoringVerified: {
      camera: { type: Boolean, default: false },
      microphone: { type: Boolean, default: false },
      screenShare: { type: Boolean, default: false },
      displaySurface: { type: String, default: "monitor" },
      fullscreen: { type: Boolean, default: false },
    },
    violationsLog: [
      {
        type: { type: String }, // "focus_loss", "tab_switch", "fullscreen_exit"
        timestamp: { type: Date, default: Date.now },
      },
    ],
    userAnswers: {
      type: Map,
      of: Number, // questionIndex => selectedOptionIndex
      default: {},
    },
    questions: {
      type: Array,
      default: [],
    },
    reviewBreakdown: {
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
  { timestamps: true, strict: false }
);

moduleAssessmentAttemptSchema.index({ userId: 1, createdAt: -1 });

module.exports =
  mongoose.models.ModuleAssessmentAttempt ||
  mongoose.model("ModuleAssessmentAttempt", moduleAssessmentAttemptSchema);
