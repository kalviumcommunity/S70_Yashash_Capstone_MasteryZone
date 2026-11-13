const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userEmail: {
      type: String,
      index: true,
      default: "",
    },
    userName: {
      type: String,
      default: "Candidate",
    },
    userAvatar: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      required: true,
      index: true,
      enum: [
        "USER_LOGIN",
        "USER_LOGOUT",
        "USER_REGISTER",
        "ACCOUNT_VERIFIED",
        "CODING_SUBMISSION",
        "CODING_CHALLENGE_SOLVED",
        "LEARNING_MODULE_PROGRESS",
        "ASSESSMENT_ATTEMPT",
        "ASSESSMENT_COMPLETED",
        "PROJECT_SUBMITTED",
        "CERTIFICATION_EXAM_STARTED",
        "CERTIFICATION_ISSUED",
        "PROCTORING_STARTED",
        "PROCTORING_VIOLATION",
        "PROCTORING_COMPLETED",
        "PROCTORING_TERMINATED",
        "MEETING_JOINED",
        "SUPPORT_TICKET_CREATED",
        "SUPPORT_TICKET_REPLIED",
        "ADMIN_ACTION",
      ],
    },
    title: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["auth", "coding", "learning", "assessment", "proctoring", "project", "certification", "meeting", "support", "admin"],
      default: "coding",
      index: true,
    },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "",
    },
    device: {
      type: String,
      default: "Desktop / Chrome",
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ type: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports =
  mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
