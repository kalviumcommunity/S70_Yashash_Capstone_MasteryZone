const mongoose = require("mongoose");

const proctoredCodingSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    // Candidate Identification
    candidateDetails: {
      fullName: { type: String, default: "Candidate" },
      email: { type: String, default: "" },
      candidateId: { type: String, default: "" },
      organization: { type: String, default: "Mastery Zone Academy" },
    },
    // Assessment Scope & Problem
    questionId: {
      type: String,
      required: true,
      index: true,
    },
    assessmentTitle: {
      type: String,
      default: "MZ-ASM Proctored Assessment",
    },
    trackId: {
      type: String,
      default: "python",
    },
    moduleIndex: {
      type: Number,
      default: 0,
    },
    problemData: {
      title: String,
      difficulty: String,
      category: String,
      description: String,
      inputFormat: String,
      outputFormat: String,
      constraints: [String],
      examples: Array,
      hints: [String],
      objective: String,
      starterCode: Object,
      testCases: Array,
    },
    // Multi-Question Assessment Support: Array of questions in this assessment
    questions: [
      {
        questionId: { type: String, required: true },
        title: { type: String, required: true },
        difficulty: { type: String, default: "Medium" },
        category: { type: String, default: "Coding" },
        description: { type: String, default: "" },
        inputFormat: { type: String, default: "" },
        outputFormat: { type: String, default: "" },
        constraints: [String],
        examples: Array,
        hints: [String],
        testCases: Array,
        // Individual Question Submission
        submittedCode: { type: String, default: "" },
        language: { type: String, default: "python" },
        status: { type: String, default: "UNATTEMPTED" }, // "PASSED" | "PARTIAL" | "FAILED" | "UNATTEMPTED"
        score: { type: Number, default: 0 },
        marksObtained: { type: Number, default: 0 },
        totalMarks: { type: Number, default: 10 },
        passedTests: { type: Number, default: 0 },
        totalTests: { type: Number, default: 10 },
        testResults: Array,
        runtimeMs: { type: Number, default: 0 },
        memoryMb: { type: Number, default: 0 },
        submittedAt: Date,
        attempted: { type: Boolean, default: false },
      },
    ],
    // Autosaved drafts per question { questionId: { code, language, ... } }
    questionDrafts: {
      type: Map,
      of: Object,
      default: {},
    },
    // Status & Lifecyle
    status: {
      type: String,
      enum: ["precheck", "active", "interrupted", "submitted", "terminated", "expired"],
      default: "precheck",
      index: true,
    },
    serverStartTime: {
      type: Date,
      default: Date.now,
    },
    serverDeadline: {
      type: Date,
    },
    timeLimitSeconds: {
      type: Number,
      default: 3600,
    },
    // Five-Chance Recovery Tracking
    maxRecoveryChances: {
      type: Number,
      default: 5,
    },
    recoveryChancesUsed: {
      type: Number,
      default: 0,
    },
    recoveryHistory: [
      {
        chanceNumber: Number,
        type: { type: String, required: true },
        detail: String,
        interruptedAt: { type: Date, default: Date.now },
        resumedAt: Date,
        pauseDurationSeconds: { type: Number, default: 0 },
      },
    ],
    isTimerPaused: {
      type: Boolean,
      default: false,
    },
    pausedAt: Date,
    totalPauseDurationSeconds: {
      type: Number,
      default: 0,
    },
    // Autosaved Draft State
    draftCode: {
      type: String,
      default: "",
    },
    draftLanguage: {
      type: String,
      default: "python",
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
    // Device Telemetry
    deviceInfo: {
      battery: {
        percentage: { type: Number, default: 100 },
        charging: { type: Boolean, default: false },
        supported: { type: Boolean, default: true },
      },
      camera: { type: Boolean, default: false },
      microphone: { type: Boolean, default: false },
      screenShare: { type: Boolean, default: false },
      displaySurface: { type: String, default: "monitor" },
      fullscreen: { type: Boolean, default: false },
    },
    // Violations and Events Timeline
    violationsCount: {
      type: Number,
      default: 0,
    },
    violationsLog: [
      {
        type: { type: String, required: true },
        detail: String,
        timestamp: { type: Date, default: Date.now },
        severity: { type: String, default: "warning" },
        screenshotUrl: { type: String, default: "" },
        durationSeconds: { type: Number, default: 0 },
      },
    ],
    recordingUrl: { type: String, default: "" },
    recordingDurationSeconds: { type: Number, default: 0 },
    recordingFileSize: { type: Number, default: 0 },
    recordingStatus: { type: String, default: "completed" },
    evidenceScreenshots: [
      {
        url: { type: String },
        timestamp: { type: Date, default: Date.now },
        reason: { type: String },
        severity: { type: String, default: "warning" },
      },
    ],
    adminNote: { type: String, default: "" },
    adminModifiedAt: { type: Date },
    adminModifiedBy: { type: String, default: "" },
    marksHistory: [
      {
        originalScore: Number,
        newScore: Number,
        originalStatus: String,
        newStatus: String,
        adminNote: String,
        modifiedBy: String,
        modifiedAt: { type: Date, default: Date.now },
      },
    ],
    notificationSent: { type: Boolean, default: false },
    notificationEmailSent: { type: Boolean, default: false },
    notificationInAppId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      index: true,
    },
    notificationViewed: { type: Boolean, default: false },
    notificationViewedAt: { type: Date },
    // Immutable Final Submission Results & Report Data
    submissionResult: {
      code: String,
      language: String,
      score: Number,
      grade: String,
      accuracy: Number,
      passed: Boolean,
      status: String,
      passedTests: Number,
      totalTests: Number,
      durationSeconds: Number,
      submittedAt: Date,
      testResults: Array,
      evaluationFeedback: Object,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.ProctoredCodingSession ||
  mongoose.model("ProctoredCodingSession", proctoredCodingSessionSchema);
