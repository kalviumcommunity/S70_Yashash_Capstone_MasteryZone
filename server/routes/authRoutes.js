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

const normalizeIndianPhone = (phone) => {
  if (!phone) return null;
  const digits = phone.toString().replace(/\D/g, '');

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }

  if (/^0[6-9]\d{9}$/.test(digits)) {
    return `+91${digits.slice(1)}`;
  }

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^0091[6-9]\d{9}$/.test(digits)) {
    return `+91${digits.slice(3)}`;
  }

  return null;
};

// Signup & Register Route
router.post(['/signup', '/register'], async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'All fields except phone number are required' });
  }

  const normalizedPhone = phoneNumber ? normalizeIndianPhone(phoneNumber) : undefined;
  if (phoneNumber && !normalizedPhone) {
    return res.status(400).json({ message: 'Invalid Indian mobile number format' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    if (normalizedPhone) {
      const existingPhone = await User.findOne({ phoneNumber: normalizedPhone });
      if (existingPhone) return res.status(400).json({ message: 'Phone number already in use' });
    }

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
    const userData = { username, email, password: hashedPassword };
    if (normalizedPhone) {
      userData.phoneNumber = normalizedPhone;
    }

    const newUser = await User.create(userData);
    const safeUser = {
      username: newUser.username,
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
      authProvider: newUser.authProvider,
      interests: newUser.interests,
      groups: newUser.groups,
      progress: newUser.progress,
      role: newUser.role,
      _id: newUser._id,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    res.status(201).json({ message: "User registered successfully!", newUser: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const usernameOrEmail = req.body.usernameOrEmail || req.body.identifier || req.body.email || req.body.username;
  const { password } = req.body;

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

    // Reset certifications for guest user on each login
    const Certification = require('../models/CertificationSchema');
    await Certification.deleteMany({ userId: user._id });

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
    if (!req.user || !req.user.email) {
      return res.status(400).json({ message: 'No email found in Firebase token' });
    }
    const email = req.user.email.toLowerCase().trim();
    const name = req.user.name || 'Firebase User';
    const uid = req.user.uid || req.user.user_id || 'mock-uid';
    
    // Check if user exists in our DB
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if they don't exist
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || 'user';
      const lastName = nameParts.length > 1 ? nameParts[1] : '';
      
      const baseUsername = `${firstName}_${lastName}`.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
      let username = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
      
      // Safety check for username
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // We assign a random password because they log in via Firebase
      const randomPassword = await bcrypt.hash(uid + Math.random().toString(), 10);
      user = await User.create({
        username,
        email,
        password: randomPassword,
        authProvider: 'google'
      });
    }

    // Send login notification asynchronously
    try {
      sendLoginNotification(user.email, user.username);
    } catch (mailErr) {
      console.warn("Mailer notification skipped:", mailErr.message);
    }

    // Issue standard JWT
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json({
      message: 'Firebase login successful',
      token,
      user: {
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Firebase login error:", err);
    return res.status(500).json({ message: 'Server error processing Firebase login', error: err.message });
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
  if (avatarUrl === undefined) return res.status(400).json({ message: 'Avatar string is required' });

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

// Delete Avatar
router.delete('/avatar', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.avatarUrl = null;
    await user.save();

    res.status(200).json({ message: 'Avatar deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Banner
router.put('/banner', verifyToken, async (req, res) => {
  const { bannerUrl } = req.body;
  if (bannerUrl === undefined) return res.status(400).json({ message: 'Banner string is required' });

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.bannerUrl = bannerUrl;
    await user.save();

    res.status(200).json({ message: 'Banner updated successfully', bannerUrl: user.bannerUrl });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete Banner
router.delete('/banner', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.bannerUrl = null;
    await user.save();

    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Profile (Bio, Username)
router.put('/profile', verifyToken, async (req, res) => {
  const { username, bio } = req.body;
  
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (username) {
      // Check for uniqueness if username changed
      if (username !== user.username) {
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username;
    }
    if (bio !== undefined) user.bio = bio;
    
    await user.save();
    res.status(200).json({ message: 'Profile updated successfully', user: { username: user.username, bio: user.bio, avatarUrl: user.avatarUrl, email: user.email, role: user.role } });
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
