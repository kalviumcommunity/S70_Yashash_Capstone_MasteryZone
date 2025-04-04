const getGroupDiscussions = async (req, res) => {
    try {
      const discussions = await Discussion.find({ groupId: req.params.groupId });
      res.json(discussions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  };
  
  const getDiscussionById = async (req, res) => {
    try {
      const discussion = await Discussion.findById(req.params.discussionId);
      res.json(discussion);
    } catch (error) {
      res.status(404).json({ message: "Discussion not found" });
    }
  };
  
  const getGroupChatMessages = async (req, res) => {
    try {
      const messages = await ChatMessage.find({ groupId: req.params.groupId });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  };
  
  
  
  //   POST
  
  const createDiscussionPost = async (req, res) => {
      try {
          // Save post to discussion thread
          res.status(201).json({ message: "Post created in discussion." });
        } catch (error) {
            res.status(500).json({ error: "Failed to create post." });
        }
    };
    
    const sendGroupMessage = async (req, res) => {
        try {
            // Add message to chat log
            res.status(201).json({ message: "Message sent." });
        } catch (error) {
            res.status(500).json({ error: "Failed to send message." });
        }
    };
    
    module.exports = { getGroupDiscussions, getDiscussionById, getGroupChatMessages , createDiscussionPost, sendGroupMessage };
  