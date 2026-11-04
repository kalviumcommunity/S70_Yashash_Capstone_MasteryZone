const mongoose = require("mongoose");

const certificationAttemptSchema = new mongoose.Schema(
  {
    attemptId: {
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
    candidateName: {
      type: String,
      default: "Candidate",
    },
    candidateEmail: {
      type: String,
      default: "",
    },
    certId: {
      type: String,
      required: true,
      default: "dsa_cert",
      index: true,
    },
    certTitle: {
      type: String,
      required: true,
      default: "Data Structures & Algorithms (DSA)",
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "PASSED", "FAILED"],
      default: "IN_PROGRESS",
      index: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    adminNote: {
      type: String,
      default: "",
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      default: 90, // Strict 90 Minutes for Certification
    },
    // Part A: Selected 20 MCQs (stable on page refresh)
    selectedMcqs: [
      {
        id: { type: String, required: true },
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: Number, required: true }, // NEVER exposed in candidate responses
        topic: { type: String, default: "Algorithms" },
        difficulty: { type: String, default: "Medium" },
        explanation: { type: String, default: "" },
      },
    ],
    // Candidate's MCQ Responses
    mcqAnswers: {
      type: Map,
      of: Number,
      default: {},
    },
    mcqScore: {
      type: Number,
      default: 0, // out of 20
    },
    mcqPassed: {
      type: Boolean,
      default: false, // >= 16 / 20 (80%)
    },
    // Part B: Selected 2 Coding Questions (stable on page refresh)
    selectedCodingQuestions: [
      {
        questionId: { type: String, required: true },
        title: { type: String, required: true },
        difficulty: { type: String, default: "Medium" },
        category: { type: String, default: "Algorithms" },
        description: { type: String, default: "" },
        inputFormat: { type: String, default: "" },
        outputFormat: { type: String, default: "" },
        constraints: [String],
        examples: Array,
        starterCode: {
          type: Object,
          default: {},
        },
        publicTests: Array,
        hiddenTests: Array, // Evaluated on server only
      },
    ],
    // Candidate's Coding Submissions
    codingSubmissions: [
      {
        questionId: { type: String, required: true },
        code: { type: String, default: "" },
        language: { type: String, default: "python" },
        solved: { type: Boolean, default: false },
        passedTests: { type: Number, default: 0 },
        totalTests: { type: Number, default: 0 },
        testResults: Array,
        runtimeMs: { type: Number, default: 0 },
        submittedAt: { type: Date },
      },
    ],
    // Proctoring Audit & Telemetry
    proctoring: {
      status: {
        type: String,
        enum: ["COMPLIANT", "FLAGGED"],
        default: "COMPLIANT",
      },
      violationsCount: { type: Number, default: 0 },
      tabSwitches: { type: Number, default: 0 },
      fullscreenExits: { type: Number, default: 0 },
      events: [
        {
          type: { type: String }, // e.g. "TAB_SWITCH", "FULLSCREEN_EXIT", "FOCUS_LOST"
          timestamp: { type: Date, default: Date.now },
          details: { type: String, default: "" },
          screenshotUrl: { type: String, default: "" },
          severity: { type: String, default: "warning" },
        },
      ],
      recordingUrl: { type: String, default: "" },
      recordingDurationSeconds: { type: Number, default: 0 },
      evidenceScreenshots: [
        {
          url: { type: String },
          timestamp: { type: Date, default: Date.now },
          reason: { type: String },
          severity: { type: String, default: "warning" },
        },
      ],
    },
    finalVerdict: {
      type: String,
      enum: ["PENDING", "PASSED", "FAILED"],
      default: "PENDING",
    },
    certificateId: {
      type: String,
      default: null,
      index: true,
    },
    reportId: {
      type: String,
      default: null,
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

certificationAttemptSchema.index({ userId: 1, certId: 1, createdAt: -1 });

const CertificationAttempt =
  mongoose.models.CertificationAttempt ||
  mongoose.model("CertificationAttempt", certificationAttemptSchema);

module.exports = CertificationAttempt;
