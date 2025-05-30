const Resource = require("../models/ResourceSchema");

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

// PUT: Update resource by ID
const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    res.json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getAllResources, createResource, updateResource };

