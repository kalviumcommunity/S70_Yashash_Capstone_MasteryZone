const mongoose = require("mongoose");

const recordingSchema = new mongoose.Schema(
  {
    recordingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    meetingId: {
      type: String,
      index: true,
      default: "",
    },
    title: {
      type: String,
      required: true,
      default: "Meeting Recording",
    },
    hostUserId: {
      type: String,
      required: true,
      index: true,
    },
    hostName: {
      type: String,
      default: "Host",
    },
    hostEmail: {
      type: String,
      default: "",
    },
    recordingType: {
      type: String,
      enum: ["Meeting", "Screen Share", "Proctoring"],
      default: "Meeting",
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    streamUrl: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: "video/webm",
    },
    participantsCount: {
      type: Number,
      default: 1,
    },
    participantUserIds: {
      type: [String],
      default: [],
      index: true,
    },
    participantNames: {
      type: [String],
      default: [],
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ready", "processing", "error", "deletion_failed"],
      default: "ready",
    },
    deletionError: {
      type: String,
      default: "",
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: Date.now,
    },
    chapters: [
      {
        timestampSeconds: { type: Number, required: true },
        title: { type: String, required: true },
      },
    ],
    bookmarks: [
      {
        userId: String,
        timestampSeconds: Number,
        note: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activityTimeline: [
      {
        type: { type: String, default: "info" },
        event: { type: String, required: true },
        description: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
        user: { type: String, default: "Host" },
        role: { type: String, default: "Host" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

recordingSchema.index({ hostUserId: 1, createdAt: -1 });
recordingSchema.index({ hostEmail: 1, createdAt: -1 });
recordingSchema.index({ createdAt: -1 });
recordingSchema.index({ participantUserIds: 1, createdAt: -1 });

module.exports = mongoose.model("Recording", recordingSchema);
