const mongoose = require('mongoose');

const CertificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  zone: {
    type: String,
    enum: ['FITNESS', 'CODING', 'DRIVING', 'LANGUAGE'],
    required: true
  },
  certId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  progress: {
    type: Number,
    default: 0, // 0 to 100 percentage
    min: 0,
    max: 100
  },
  currentModule: {
    type: Number,
    default: 1
  },
  totalModules: {
    type: Number,
    required: true
  },
  isTrial: {
    type: Boolean,
    default: false
  },
  trialExpiresAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  }
}, { timestamps: true });

// Prevent duplicate enrollment in the same cert for the same user
CertificationSchema.index({ userId: 1, certId: 1 }, { unique: true });

const Certification = mongoose.models.Certification || mongoose.model('Certification', CertificationSchema);

module.exports = Certification;
