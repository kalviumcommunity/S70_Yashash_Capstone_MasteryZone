const mongoose = require("mongoose");

const adminOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto expire from MongoDB via TTL index
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

adminOtpSchema.index({ email: 1, verified: 1, createdAt: -1 });
adminOtpSchema.index({ email: 1, expiresAt: 1, verified: 1 });

module.exports = mongoose.model("AdminOtp", adminOtpSchema);
