const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const verifyFirebaseToken = require('../middleware/firebaseAuth');
const verifyToken = require('../middleware/auth');
const { sendLoginNotification, sendPasswordResetEmail } = require('../utils/mailer');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Signup Route
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Generate unique username
    const baseUsername = `${firstName}_${lastName}`.toLowerCase().replace(/[^a-z0-9_]/g, "");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    let username = `${baseUsername}_${randomSuffix}`;
    
    // Safety check for username collision
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ username, email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully!", newUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: 'Username/Email and password are required' });
  }

  try {
    // Find user by either email or username
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail }
      ]
    });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    // Send login notification asynchronously
    sendLoginNotification(user.email, user.username);

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Guest Login Route
router.post('/guest-login', async (req, res) => {
  try {
    const guestEmail = 'guest@masteryzone.com';
    let user = await User.findOne({ email: guestEmail });

    if (!user) {
      const hashedPassword = await bcrypt.hash('GuestPassword123!', 10);
      user = await User.create({ username: 'guest_user', email: guestEmail, password: hashedPassword });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Guest login successful',
      token,
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// Forgot Password Route (Generates Token & Sends Email)
router.post('/forgot-password', async (req, res) => {
  const { usernameOrEmail } = req.body;

  if (!usernameOrEmail) {
    return res.status(400).json({ message: 'Email or Username is required' });
  }

  try {
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail }
      ]
    });

    if (!user) {
      // For security, we can return success even if user not found, but we'll return 404 here for ease of UI
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving to database for security
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    // The frontend must be running on localhost:5173 for local dev
    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
    
    // Send Email asynchronously
    sendPasswordResetEmail(user.email, resetLink);

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Reset Password Route (Validates Token & Saves New Password)
router.post('/reset-password/:token', async (req, res) => {
  const { newPassword } = req.body;
  const { token } = req.params;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() } // Ensure token hasn't expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    // Hash the new password
    user.password = await bcrypt.hash(newPassword, 10);
    
    // Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.status(200).json({ message: 'Password has been successfully reset!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Firebase Login Route
router.post('/firebase-login', verifyFirebaseToken, async (req, res) => {
  try {
    const { email, name, uid } = req.user;
    
    // Check if user exists in our DB
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if they don't exist
      const nameParts = (name || 'Firebase User').split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[1] : '';
      
      const baseUsername = `${firstName}_${lastName}`.toLowerCase().replace(/[^a-z0-9_]/g, "");
      let username = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
      
      // Safety check for username
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // We assign a random password because they log in via Firebase
      const randomPassword = await bcrypt.hash(uid + Math.random().toString(), 10);
      user = await User.create({ username, email, password: randomPassword });
    }

    // Send login notification asynchronously
    sendLoginNotification(user.email, user.username);

    // Issue standard JWT
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Firebase login successful',
      token,
      user: {
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error processing Firebase login', error: err.message });
  }
});

// Profile Routes

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Avatar
router.put('/avatar', verifyToken, async (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl) return res.status(400).json({ message: 'Avatar string is required' });

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.avatarUrl = avatarUrl;
    await user.save();

    res.status(200).json({ message: 'Avatar updated successfully', avatarUrl: user.avatarUrl });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete Account
router.delete('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Preferences
router.put('/preferences', verifyToken, async (req, res) => {
  const { notifications, darkMode } = req.body;
  
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (typeof notifications === 'boolean') {
      user.preferences.notifications = notifications;
    }
    if (typeof darkMode === 'boolean') {
      user.preferences.darkMode = darkMode;
    }
    
    await user.save();
    res.status(200).json({ message: 'Preferences updated successfully', preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
