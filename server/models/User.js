const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    trim: true,
    default: ""
  },
  location: {
    type: String,
    trim: true,
    default: ""
  },
  occupation: {
    type: String,
    trim: true,
    default: ""
  },
  streak: {
    type: Number,
    default: 1
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  },
  learningHours: {
    type: Number,
    default: 0
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  authProvider: { type: String, enum: ["email", "google"], default: "email" },
  avatarUrl: String,
  bannerUrl: String,
  bio: String,
  interests: [String],
  exploredTracks: { type: [String], default: [] },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
  progress: [{ type: mongoose.Schema.Types.ObjectId, ref: "Progress" }],
  role: { type: String, enum: ["user", "admin", "SUPER_ADMIN"], default: "user" },
  isMainAdmin: { type: Boolean, default: false },
  adminPermissions: { type: [String], default: [] },
  mustChangePassword: { type: Boolean, default: false },
  adminCreatedBy: { type: String, default: "" },
  adminCreatedAt: { type: Date },
  isSuspended: { type: Boolean, default: false },
  suspendedReason: { type: String, default: "" },
  preferences: {
    notifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false }
  },
  notificationsInitialized: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  otpCodeHash: String,
  otpExpires: Date,
  lastLoginAt: Date,
  lastLoginIp: String,
  lastLoginDevice: String,
  lastLoginNotificationSentAt: Date,
  knownDevices: [
    {
      deviceString: String,
      browser: String,
      os: String,
      ip: String,
      firstSeenAt: { type: Date, default: Date.now },
      lastSeenAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
