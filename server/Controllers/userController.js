const User = require("../models/User");

// GET all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("groups progress");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: Create new user
const createUser = async (req, res) => {
  try {
    const user = new User(req.body); // Make sure your request includes required fields
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getAllUsers, createUser };
