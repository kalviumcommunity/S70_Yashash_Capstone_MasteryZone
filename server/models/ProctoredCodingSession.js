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
    // Device Telemetry (Honest real-time browser state — never fabricated)
    deviceInfo: {
      battery: {
        percentage: { type: Number, default: null },
        charging: { type: Boolean, default: null },
        supported: { type: Boolean, default: null },
      },
      camera: { type: Boolean, default: null },
      cameraPermission: {
        type: String,
        enum: ["Granted", "Denied", "Prompt", "Unsupported", "Not Recorded"],
        default: "Not Recorded",
      },
      cameraStreamStatus: {
        type: String,
        enum: ["Active", "Inactive", "Disconnected", "Unsupported", "Not Recorded"],
        default: "Not Recorded",
      },
      cameraLabel: { type: String, default: "" },
      cameraDisconnections: { type: Number, default: 0 },
      microphone: { type: Boolean, default: null },
      microphonePermission: {
        type: String,
        enum: ["Granted", "Denied", "Prompt", "Unsupported", "Not Recorded"],
        default: "Not Recorded",
      },
      microphoneStreamStatus: {
        type: String,
        enum: ["Active", "Inactive", "Disconnected", "Unsupported", "Not Recorded"],
        default: "Not Recorded",
      },
      microphoneLabel: { type: String, default: "" },
      microphoneDisconnections: { type: Number, default: 0 },
      screenShare: { type: Boolean, default: null },
      screenSharePermission: {
        type: String,
        enum: ["Granted", "Denied", "Prompt", "Unsupported", "Not Recorded"],
        default: "Not Recorded",
      },
      screenShareStreamStatus: {
        type: String,
        enum: ["Active", "Inactive", "Ended", "Unsupported", "Not Recorded"],
        default: "Not Recorded",
      },
      displaySurface: { type: String, default: "" },
      fullscreen: { type: Boolean, default: null },
      windowFocused: { type: Boolean, default: null },
      fullscreenExitsCount: { type: Number, default: 0 },
      focusLossCount: { type: Number, default: 0 },
      browser: { type: String, default: "" },
      platform: { type: String, default: "" },
      screenResolution: { type: String, default: "" },
      connectionType: { type: String, default: "" },
      monitoringActive: { type: Boolean, default: false },
      telemetryUpdatedAt: { type: Date, default: null },
    },
    // Violations and Events Timeline
    violationsCount: {
      type: Number,
      default: 0,
    },
    violationsLog: [
      {
        eventId: { type: String, default: "" },
        type: { type: String, required: true },
        detail: String,
        timestamp: { type: Date, default: Date.now },
        severity: { type: String, default: "warning" },
        screenshotUrl: { type: String, default: "" },
        screenshotCaptured: { type: Boolean, default: false },
        screenshotReason: { type: String, default: "" },
        durationSeconds: { type: Number, default: 0 },
      },
    ],
    recordingId: { type: String, default: "" },
    recordingUrl: { type: String, default: "" },
    recordingDurationSeconds: { type: Number, default: 0 },
    recordingFileSize: { type: Number, default: 0 },
    recordingMimeType: { type: String, default: "" },
    recordingStartedAt: { type: Date, default: null },
    recordingCompletedAt: { type: Date, default: null },
    recordingUploadError: { type: String, default: "" },
    recordingStatus: {
      type: String,
      enum: ["not_recorded", "recording", "uploading", "processing", "available", "failed", "completed"],
      default: "not_recorded",
    },
    evidenceScreenshots: [
      {
        url: { type: String },
        filename: { type: String, default: "" },
        violationEventId: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
        reason: { type: String },
        severity: { type: String, default: "warning" },
      },
    ],
    score: { type: Number, default: null },
    maxScore: { type: Number, default: 100 },
    percentage: { type: Number, default: null },
    evaluationVerdict: { type: String, default: "" },
    durationSeconds: { type: Number, default: 0 },
    submittedAt: { type: Date, default: null },
    terminatedReason: { type: String, default: "" },
    adminNote: { type: String, default: "" },
    adminModifiedAt: { type: Date },
    adminModifiedBy: { type: String, default: "" },
    marksHistory: [
      {
        oldScore: Number,
        originalScore: Number,
        newScore: Number,
        maxScore: Number,
        oldStatus: String,
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

proctoredCodingSessionSchema.index({ userId: 1, createdAt: -1 });
proctoredCodingSessionSchema.index({ userId: 1, "submissionResult.submittedAt": -1, updatedAt: -1 });
proctoredCodingSessionSchema.index({ userId: 1, updatedAt: -1 });
proctoredCodingSessionSchema.index({ userId: 1, status: 1 });
proctoredCodingSessionSchema.index({ status: 1, createdAt: -1 });
proctoredCodingSessionSchema.index({ status: 1, userId: 1, createdAt: -1 });
proctoredCodingSessionSchema.index({ recordingUrl: 1, createdAt: -1 });
proctoredCodingSessionSchema.index({ createdAt: -1 });
proctoredCodingSessionSchema.index({ updatedAt: -1 });
proctoredCodingSessionSchema.index({ "candidateDetails.email": 1, createdAt: -1 });

module.exports =
  mongoose.models.ProctoredCodingSession ||
  mongoose.model("ProctoredCodingSession", proctoredCodingSessionSchema);
