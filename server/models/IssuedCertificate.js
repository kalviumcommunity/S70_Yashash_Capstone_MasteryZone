const mongoose = require("mongoose");

const issuedCertificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    attemptId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
    },
    certificationId: {
      type: String,
      required: true,
      default: "dsa_cert",
    },
    certificationTitle: {
      type: String,
      required: true,
      default: "Data Structures & Algorithms (DSA)",
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    mcqScore: {
      type: Number,
      required: true, // out of 20
    },
    mcqScorePercentage: {
      type: Number,
      required: true, // e.g. 90%
    },
    codingScore: {
      type: String,
      default: "2/2 Solved (100% Tests Passed)",
    },
    issuingOrganization: {
      type: String,
      default: "Mastery Zone Academy of Computer Science",
    },
    verificationUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["VALID", "REVOKED"],
      default: "VALID",
      index: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

issuedCertificateSchema.index({ userId: 1, certificationId: 1 });

const IssuedCertificate =
  mongoose.models.IssuedCertificate ||
  mongoose.model("IssuedCertificate", issuedCertificateSchema);

module.exports = IssuedCertificate;
