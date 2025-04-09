const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  goal: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  discussions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Discussion" }],
  resources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  progressBoard: [{ type: mongoose.Schema.Types.ObjectId, ref: "Progress" }]
}, { timestamps: true });

module.exports = mongoose.model("Group", groupSchema);
