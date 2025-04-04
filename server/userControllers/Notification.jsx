const getUserNotifications = async (req, res) => {
    try {
      const notifications = await Notification.find({ userId: req.params.userId });
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  };
  
  
  
  //      POST
  
  const createNotification = async (req, res) => {
      try {
          // Save notification to DB
          res.status(201).json({ message: "Notification created." });
        } catch (error) {
            res.status(500).json({ error: "Failed to create notification." });
        }
    };
    
  module.exports = { getUserNotifications, createNotification };
  