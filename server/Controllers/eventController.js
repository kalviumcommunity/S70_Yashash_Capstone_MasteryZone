const Event = require("../models/Event");

// GET all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("groupId scheduledBy participants");
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: Create new event
const createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getAllEvents, createEvent };

