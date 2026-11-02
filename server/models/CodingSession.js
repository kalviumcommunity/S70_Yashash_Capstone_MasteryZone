const mongoose = require("mongoose");

const codingSessionSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      default: "Collaborative Coding Room",
      trim: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostName: {
      type: String,
      default: "Host",
    },
    language: {
      type: String,
      default: "python",
    },
    code: {
      type: String,
      default: "",
    },
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        avatarUrl: String,
        role: { type: String, enum: ["host", "editor", "viewer"], default: "editor" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CodingSession ||
  mongoose.model("CodingSession", codingSessionSchema);
