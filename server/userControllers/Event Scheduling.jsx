const getGroupEvents = async (req, res) => {
    try {
      const events = await Event.find({ groupId: req.params.groupId });
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  };
  
  const getEventById = async (req, res) => {
    try {
      const event = await Event.findById(req.params.eventId);
      res.json(event);
    } catch (error) {
      res.status(404).json({ message: "Event not found" });
    }
  };
  
  
  
  //   POST
  
  const scheduleEvent = async (req, res) => {
      try {
          // Create new event in DB
          res.status(201).json({ message: "Event scheduled." });
        } catch (error) {
            res.status(500).json({ error: "Failed to schedule event." });
        }
    };
    
    module.exports = { getGroupEvents, getEventById ,scheduleEvent };
  