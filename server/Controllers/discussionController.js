const Discussion = require("../models/Discussion");

// GET all discussions
const getAllDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate("groupId userId replies.userId");
    res.status(200).json(discussions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: Create new discussion
const createDiscussion = async (req, res) => {
  try {
    const discussion = new Discussion(req.body);
    await discussion.save();
    res.status(201).json(discussion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT: Update discussion by ID
const updateDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });
    res.json(discussion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getAllDiscussions, createDiscussion, updateDiscussion };

