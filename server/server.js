
const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const router = require("./route")
const cookieParser = require('cookie-parser');
const groupRoutes = require('./routes/groupRoutes');
const authRoutes = require('./routes/authRoutes');
dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = 5012; // Use environment variable or fallback to 5001


app.use(express.json()); // Middleware to parse JSON requests
app.use("/api",router)
app.use('/auth', authRoutes);
app.use('/api/groups', groupRoutes);

mongoose.connect(process.env.db_url)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err)=>console.log("🔌Error connecting to MongoDB"))


// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port http://localhost:${PORT}`);
});





