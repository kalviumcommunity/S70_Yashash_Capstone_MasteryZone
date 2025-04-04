const getAllUsers = async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  };
  
  const getAllGroupsAdmin = async (req, res) => {
    try {
      const groups = await Group.find();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  };
  
  const getActivityLogs = async (req, res) => {
    try {
      const logs = await ActivityLog.find().sort({ createdAt: -1 });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  };
  
  
  
  //   POST
  
  const blockUser = async (req, res) => {
      try {
          // Update user status to "blocked"
          res.status(200).json({ message: "User blocked." });
        } catch (error) {
            res.status(500).json({ error: "Failed to block user." });
        }
    };
    
    module.exports = { getAllUsers, getAllGroupsAdmin, getActivityLogs,  blockUser};
  