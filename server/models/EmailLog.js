const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    emailType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      default: "",
    },
    relatedUserId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    relatedRecordId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "failed", "rejected", "suppressed"],
      default: "pending",
      index: true,
    },
    messageId: {
      type: String,
      default: null,
    },
    providerResponse: {
      type: String,
      default: null,
    },
    errorCode: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
    lastAttemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically archive old delivery logs after 90 days
emailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const EmailLog = mongoose.models.EmailLog || mongoose.model("EmailLog", emailLogSchema);

module.exports = EmailLog;
