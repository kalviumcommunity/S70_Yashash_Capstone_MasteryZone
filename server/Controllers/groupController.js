const Group = require("../models/Group");

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

module.exports = { getAllGroups, createGroup };

