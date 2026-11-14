const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "registration",
        "assessment",
        "coding",
        "certification",
        "proctoring",
        "account",
        "system",
        "support",
        "ticket",
      ],
      default: "system",
      index: true,
    },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "alert"],
      default: "info",
    },
    targetId: {
      type: String,
      default: "",
    },
    targetUser: {
      fullName: String,
      email: String,
      username: String,
      userId: String,
    },
    actionUrl: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

adminNotificationSchema.index({ isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.AdminNotification ||
  mongoose.model("AdminNotification", adminNotificationSchema);
