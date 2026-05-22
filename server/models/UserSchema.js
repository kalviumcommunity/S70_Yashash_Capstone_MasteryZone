const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  authProvider: { type: String, enum: ["email", "google"], default: "email" },
  avatarUrl: String,
  bio: String,
  interests: [String],
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
  progress: [{ type: mongoose.Schema.Types.ObjectId, ref: "Progress" }],
  role: { type: String, enum: ["user", "admin"], default: "user" }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
