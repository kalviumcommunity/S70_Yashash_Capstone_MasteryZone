const mongoose = require("mongoose");

const platformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global_platform_settings",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    proctoringSensitivity: {
      type: String,
      default: "strict",
    },
    autoRecordAssessments: {
      type: Boolean,
      default: true,
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    allowedRegistration: {
      type: Boolean,
      default: true,
    },
    maxConcurrentSessionsPerUser: {
      type: Number,
      default: 3,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const PlatformSettings =
  mongoose.models.PlatformSettings || mongoose.model("PlatformSettings", platformSettingsSchema);

module.exports = PlatformSettings;
