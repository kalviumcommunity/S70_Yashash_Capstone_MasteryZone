const getGroupResources = async (req, res) => {
    try {
      const resources = await Resource.find({ groupId: req.params.groupId });
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  };
  
  const getResourceById = async (req, res) => {
    try {
      const resource = await Resource.findById(req.params.resourceId);
      res.json(resource);
    } catch (error) {
      res.status(404).json({ message: "Resource not found" });
    }
  };
  
  
  
  //   POST
  
  const uploadResource = async (req, res) => {
      try {
          // Store file/resource link
          res.status(201).json({ message: "Resource uploaded." });
        } catch (error) {
            res.status(500).json({ error: "Failed to upload resource." });
        }
    };
    
    module.exports = { getGroupResources, getResourceById ,uploadResource};

  