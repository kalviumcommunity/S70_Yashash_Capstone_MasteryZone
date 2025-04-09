const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  type: { type: String, enum: ["link", "file", "video"] },
  url: String,
  description: String,
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Resource", resourceSchema);
