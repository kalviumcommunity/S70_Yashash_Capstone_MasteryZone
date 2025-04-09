const Progress = require("../models/Progress");

// GET all progress
const getAllProgress = async (req, res) => {
  try {
    const progress = await Progress.find().populate("userId groupId");
    res.status(200).json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: Create progress record
const createProgress = async (req, res) => {
  try {
    const progress = new Progress(req.body);
    await progress.save();
    res.status(201).json(progress);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT: Update progress by ID
const updateProgress = async (req, res) => {
  try {
    const progress = await Progress.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!progress) return res.status(404).json({ error: "Progress not found" });
    res.json(progress);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getAllProgress, createProgress, updateProgress };


