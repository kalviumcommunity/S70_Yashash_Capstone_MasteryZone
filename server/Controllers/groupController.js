const Group = require("../models/GroupSchema");

// GET all groups
const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("createdBy members discussions resources events progressBoard");
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// POST: Create new group
const createGroup = async (req, res) => {
  try {
    const group = new Group(req.body);
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT: Update group by ID
const updateGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.json(group);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getAllGroups, createGroup, updateGroup };

