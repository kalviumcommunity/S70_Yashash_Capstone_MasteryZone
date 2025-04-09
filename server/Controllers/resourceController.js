const Resource = require("../models/Resource");

// GET all resources
const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find().populate("groupId userId");
    res.status(200).json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: Add a new resource
const createResource = async (req, res) => {
  try {
    const resource = new Resource(req.body);
    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getAllResources, createResource };

