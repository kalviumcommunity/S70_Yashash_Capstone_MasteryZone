const mongoose = require("mongoose");

const activeSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      default: "",
    },
    fullName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
      index: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    currentPage: {
      type: String,
      default: "",
    },
    activity: {
      type: String,
      default: "",
    },
    device: {
      type: String,
      default: "",
    },
    mediaState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    sockets: [
      {
        socketId: { type: String, required: true },
        device: { type: String, default: "" },
        currentPage: { type: String, default: "" },
        activity: { type: String, default: "" },
        mediaState: { type: mongoose.Schema.Types.Mixed, default: null },
        connectedAt: { type: Date, default: Date.now },
        lastHeartbeat: { type: Date, default: Date.now },
      },
    ],
    tabCount: {
      type: Number,
      default: 1,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

activeSessionSchema.index({ lastHeartbeat: 1 });
activeSessionSchema.index({ isActive: 1, lastHeartbeat: 1 });

module.exports =
  mongoose.models.ActiveSession || mongoose.model("ActiveSession", activeSessionSchema);
