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



const addUserToGroup = async (req, res) => {
  const { userId, groupId } = req.body;

  const group = await Group.findById(groupId);
  const user = await User.findById(userId);

  if (!group || !user) {
    return res.status(404).json({ message: "User or group not found" });
  }

  // Add user to group
  group.members.push(user._id);
  await group.save();

  // Add group to user
  user.groups.push(group._id);
  await user.save();

  res.status(200).json({ message: "User added to group" });
};


module.exports = { getAllGroups, createGroup, updateGroup , addUserToGroup};

