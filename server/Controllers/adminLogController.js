const AdminActivityLog = require("../models/AdminActSchema");

// GET all admin logs
const getAllAdminLogs = async (req, res) => {
  try {
    const logs = await AdminActivityLog.find().populate("adminId");
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: Log admin activity
const createAdminLog = async (req, res) => {
  try {
    const log = new AdminActivityLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT: Update admin log by ID
const updateAdminLog = async (req, res) => {
  try {
    const log = await AdminActivityLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!log) return res.status(404).json({ error: "Admin log not found" });
    res.json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getAllAdminLogs, createAdminLog, updateAdminLog };

