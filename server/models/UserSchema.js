const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional if using Firebase Auth
  authProvider: { type: String, enum: ["email", "google"], default: "email" },
  avatarUrl: String,
  bio: String,
  interests: [String],
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
  progress: [{ type: mongoose.Schema.Types.ObjectId, ref: "Progress" }],
  role: { type: String, enum: ["user", "admin"], default: "user" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
