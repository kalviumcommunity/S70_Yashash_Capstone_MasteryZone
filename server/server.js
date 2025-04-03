import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = 5011; // Use environment variable or fallback to 5001


app.use(express.json()); // Middleware to parse JSON requests

mongoose.connect(process.env.db_url)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err)=>console.log("🔌Error connecting to MongoDB"))


// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
