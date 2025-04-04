const getAllGroups = async (req, res) => {
    try {
      const groups = await Group.find();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  };
  
  const getGroupById = async (req, res) => {
    try {
      const group = await Group.findById(req.params.groupId);
      res.json(group);
    } catch (error) {
      res.status(404).json({ message: "Group not found" });
    }
  };
  
  const getUserGroups = async (req, res) => {
    try {
      const groups = await Group.find({ members: req.params.userId });
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  };
  
  
  
  //   POST
  
  const createGroup = async (req, res) => {
      try {
          // Save group info to DB
          res.status(201).json({ message: "Group created successfully." });
        } catch (error) {
            res.status(500).json({ error: "Failed to create group." });
        }
    };
    
    const joinGroup = async (req, res) => {
        try {
            // Add user to group’s member list
            res.status(200).json({ message: "Joined group successfully." });
        } catch (error) {
            res.status(500).json({ error: "Failed to join group." });
        }
    };
    
    const leaveGroup = async (req, res) => {
        try {
            // Remove user from group’s member list
            res.status(200).json({ message: "Left group successfully." });
        } catch (error) {
            res.status(500).json({ error: "Failed to leave group." });
        }
    };
    
    module.exports = { getAllGroups, getGroupById, getUserGroups, createGroup, joinGroup, leaveGroup  };
  