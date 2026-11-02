const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  groupId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Group", 
    required: false 
  },
  track: { 
    type: String, 
    enum: ["CODING", "LANGUAGE", "VEHICLES", "DRIVING", "FITNESS", "GENERAL"], 
    default: "GENERAL" 
  },
  task: { 
    type: String, 
    required: true 
  },
  moduleName: { 
    type: String, 
    default: "" 
  },
  xpEarned: { 
    type: Number, 
    default: 20 
  },
  hoursSpent: { 
    type: Number, 
    default: 0.5 
  },
  score: { 
    type: Number, 
    default: 100 
  },
  status: { 
    type: String, 
    enum: ["pending", "in-progress", "completed"], 
    default: "completed" 
  },
  notes: String,
  date: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Check if model already compiled to avoid OverwriteModelError
module.exports = mongoose.models.Progress || mongoose.model("Progress", progressSchema);
