const getMyProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id); // req.user.id from auth middleware
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  };
  
  const getUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      res.json(user);
    } catch (error) {
      res.status(404).json({ message: "User not found" });
    }
  };
  
  
  




//   POST
const registerUser = async (req, res) => {
    try {
      // Extract and validate data from req.body
      // Hash password if needed, store in DB
      res.status(201).json({ message: "User registered successfully." });
    } catch (error) {
      res.status(500).json({ error: "Registration failed." });
    }
  };
  
  const loginUser = async (req, res) => {
    try {
      // Verify user credentials, generate token
      res.status(200).json({ message: "Login successful." });
    } catch (error) {
      res.status(401).json({ error: "Invalid credentials." });
    }
  };
  
  const googleAuth = async (req, res) => {
    try {
      // Handle Google OAuth login/signup
      res.status(200).json({ message: "Google auth successful." });
    } catch (error) {
      res.status(500).json({ error: "Google auth failed." });
    }
  };
  
  module.exports = { registerUser, loginUser, googleAuth, getMyProfile, getUserProfile };
  