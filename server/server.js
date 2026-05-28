
const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const cors = require("cors")
const router = require("./route")
const cookieParser = require('cookie-parser');
const authRoutes = require("./routes/authRoutes");
const certificationRoutes = require("./routes/certificationRoutes");
dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = process.env.PORT || 5012; // Use environment variable or fallback to 5012

// CORS - allow requests from frontend
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' })); // Middleware to parse JSON requests
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Middleware to parse URL-encoded bodies
app.use(cookieParser()); // Use cookie parser
app.use("/api", router)
app.use('/auth', authRoutes);
app.use('/api/certifications', certificationRoutes);

const MONGO_URI = process.env.db_url || "mongodb+srv://yashashyashash1_db_user:yashash87920@masteryzone1111.gyw8std.mongodb.net/masteryzone?retryWrites=true&w=majority&appName=masteryzone1111";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err)=>console.log("🔌Error connecting to MongoDB:", err.message))


const path = require('path');

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all route to serve the React app for non-API requests (SPA routing)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port http://localhost:${PORT}`);
});
