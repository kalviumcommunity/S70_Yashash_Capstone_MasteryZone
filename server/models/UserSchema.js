const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  authProvider: { type: String, enum: ["email", "google"], default: "email" },
  avatarUrl: String,
  bio: String,
  interests: [String],
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
  progress: [{ type: mongoose.Schema.Types.ObjectId, ref: "Progress" }],
  role: { type: String, enum: ["user", "admin"], default: "user" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
