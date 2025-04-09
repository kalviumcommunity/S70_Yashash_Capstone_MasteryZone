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

module.exports = { getAllProgress, createProgress };

