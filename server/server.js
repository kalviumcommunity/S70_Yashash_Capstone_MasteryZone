
const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const router = require("./route")
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = process.env.PORT || 5012; // Use environment variable or fallback to 5012


app.use(express.json({ limit: '50mb' })); // Middleware to parse JSON requests
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Middleware to parse URL-encoded bodies
app.use(cookieParser()); // Use cookie parser
app.use("/api", router)
app.use('/auth', authRoutes);

mongoose.connect(process.env.db_url)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err)=>console.log("🔌Error connecting to MongoDB"))


// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port http://localhost:${PORT}`);
});
