const mongoose = require("mongoose");

const adminActivityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  targetId: mongoose.Schema.Types.ObjectId,
  note: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AdminActivityLog", adminActivityLogSchema);
