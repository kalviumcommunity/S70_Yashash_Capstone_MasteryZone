const getGroupProgress = async (req, res) => {
    try {
      const progress = await Progress.find({ groupId: req.params.groupId });
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group progress" });
    }
  };
  
  const getUserProgress = async (req, res) => {
    try {
      const progress = await Progress.find({ userId: req.params.userId });
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user progress" });
    }
  };
  
  
  
  //   POST
  
  const createProgressEntry = async (req, res) => {
      try {
          // Save progress data
          res.status(201).json({ message: "Progress recorded." });
        } catch (error) {
            res.status(500).json({ error: "Failed to record progress." });
        }
    };
    
    module.exports = { getGroupProgress, getUserProgress, createProgressEntry };
  