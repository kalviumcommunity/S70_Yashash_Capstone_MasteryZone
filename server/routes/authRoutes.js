const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const verifyFirebaseToken = require('../middleware/firebaseAuth');
const verifyToken = require('../middleware/auth');
const { sendLoginNotification, sendPasswordResetEmail } = require('../utils/mailer');
const { pushNotification } = require('../utils/notificationService');
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
    const fullName = (firstName && lastName) ? `${firstName} ${lastName}`.trim() : (firstName || lastName || "");
    const userData = { username, email, password: hashedPassword, fullName };
    if (normalizedPhone) {
      userData.phoneNumber = normalizedPhone;
    }

    const newUser = await User.create({ ...userData, notificationsInitialized: true });
    await pushNotification(req.app, {
      userId: newUser._id,
      title: "Welcome to Mastery Zone!",
      message: `Hi ${newUser.fullName || newUser.username}, your account is ready. Explore tracks, proctored assessments, and live challenges.`,
      type: "account",
      severity: "success",
      actionUrl: "/home",
      actionLabel: "Explore Hub",
    });
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
    try {
      sendLoginNotification(user.email, user.username);
    } catch (mailErr) {
      console.warn("Mailer notification skipped:", mailErr.message);
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.username
      }
    });
  } catch (err) {
    console.error("Login error:", err);
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
      user = await User.create({
        username: 'guest_user',
        email: guestEmail,
        fullName: 'Guest User',
        password: hashedPassword
      });
    }

    // Reset certifications for guest user on each login (graceful)
    try {
      const Certification = require('../models/CertificationSchema');
      if (Certification) {
        await Certification.deleteMany({ userId: user._id });
      }
    } catch (certErr) {
      console.warn("Could not reset guest certifications:", certErr.message);
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Guest login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || 'Guest User'
      }
    });
  } catch (err) {
    console.error("Guest login error:", err);
    res.status(500).json({ message: 'Server error during guest login', error: err.message });
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
    const rawEmail = req.user?.email || req.body?.email;
    if (!rawEmail) {
      return res.status(400).json({ message: 'No email found in Firebase credentials or request' });
    }
    const email = rawEmail.toLowerCase().trim();
    const name = req.user?.name || req.body?.name || req.body?.displayName || email.split('@')[0];
    const uid = req.user?.uid || req.user?.user_id || req.body?.uid || 'google-uid';
    
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
        fullName: name,
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
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || name
      }
    });

  } catch (err) {
    console.error("Firebase login error:", err);
    return res.status(500).json({ message: 'Server error processing Firebase login', error: err.message });
  }
});

// Profile Routes

// Get current user and calculate real statistics
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update real activity streak
    const now = new Date();
    if (!user.lastActiveDate) {
      user.lastActiveDate = now;
      user.streak = 1;
      await user.save();
    } else {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const lastActive = new Date(user.lastActiveDate);
      const lastDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()).getTime();
      const diffDays = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streak = (user.streak || 1) + 1;
        user.lastActiveDate = now;
        await user.save();
      } else if (diffDays > 1) {
        user.streak = 1;
        user.lastActiveDate = now;
        await user.save();
      }
    }

    // Aggregate genuine learning records from Certification database
    const Certification = require('../models/CertificationSchema');
    const certs = await Certification.find({ userId: req.user.userId });
    
    // Accurately calculate completed modules across enrolled certs
    let completedModules = 0;
    let achievements = 0;
    certs.forEach(c => {
      if (c.status === 'completed') {
        completedModules += (c.totalModules || c.currentModule || 1);
        achievements += 1;
      } else if (c.currentModule > 1) {
        completedModules += (c.currentModule - 1);
      }
    });

    // Real recorded learning time (or calculated 1.5h per module completed)
    const learningTimeHours = Math.round(((user.learningHours || 0) + (completedModules * 1.5)) * 10) / 10;

    // Fetch CodingProgress to accurately reflect completed challenges and coding XP
    const CodingProgress = require('../models/CodingProgress');
    const codingProg = await CodingProgress.findOne({ userId: req.user.userId });
    const solvedChallenges = codingProg?.challengesSolved || [];
    const solvedChallengesCount = solvedChallenges.length;

    // Fetch coding progress records to calculate coding XP and time accurately
    const Progress = require('../models/ProgressSchema');
    const codingProgressRecords = await Progress.find({ userId: req.user.userId, track: 'CODING' });
    const totalCodingXp = codingProgressRecords.reduce((sum, r) => sum + (r.xpEarned || 0), 0);
    const codingHours = codingProgressRecords.reduce((sum, r) => sum + (r.hoursSpent || 0), 0);

    const safeUser = user.toObject();
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpires;
    delete safeUser.otpCodeHash;
    delete safeUser.otpExpires;

    // Aggregate explored tracks from user record + actual certifications + coding progress
    const exploredSet = new Set(user.exploredTracks || []);
    if (solvedChallengesCount > 0 || (codingProg && Object.keys(codingProg.trackLessons || {}).length > 0)) {
      exploredSet.add('Coding');
    }
    certs.forEach(c => {
      const z = (c.zone || "").toUpperCase();
      if (z === 'CODING') exploredSet.add('Coding');
      else if (z === 'LANGUAGE') exploredSet.add('Language');
      else if (z === 'VEHICLES' || z === 'DRIVING') exploredSet.add('Vehicles');
      else if (z === 'FITNESS' || z === 'GYM') exploredSet.add('Fitness');
    });
    safeUser.exploredTracks = Array.from(exploredSet);

    res.status(200).json({ 
      user: safeUser,
      stats: {
        streak: user.streak || 1,
        learningHours: Math.round((learningTimeHours + codingHours) * 10) / 10,
        achievements,
        completedModules,
        certificationsCount: certs.length,
        certifications: certs,
        exploredTracks: safeUser.exploredTracks,
        solvedChallengesCount,
        challengesSolved: solvedChallenges,
        totalCodingXp,
      }
    });
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

// Update Profile (Full Name, Username, Location, Occupation, Bio)
router.put('/profile', verifyToken, async (req, res) => {
  const { fullName, username, location, occupation, bio } = req.body;
  
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (username !== undefined) {
      const cleanUsername = String(username).trim();
      if (!cleanUsername || cleanUsername.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters long' });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
      }
      // Check for uniqueness if username changed
      if (cleanUsername !== user.username) {
        const existing = await User.findOne({ username: cleanUsername });
        if (existing) return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = cleanUsername;
    }

    if (fullName !== undefined) {
      user.fullName = String(fullName).trim();
    }
    if (location !== undefined) {
      user.location = String(location).trim();
    }
    if (occupation !== undefined) {
      user.occupation = String(occupation).trim();
    }
    if (bio !== undefined) {
      user.bio = String(bio).trim();
    }
    
    await user.save();

    await pushNotification(req.app, {
      userId: user._id,
      title: "Profile Updated",
      message: "Your Mastery Zone profile details have been saved successfully.",
      type: "account",
      severity: "info",
      actionUrl: "/profile",
      actionLabel: "View Profile",
    });

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpires;
    delete safeUser.otpCodeHash;
    delete safeUser.otpExpires;

    res.status(200).json({ 
      message: 'Profile updated successfully', 
      user: safeUser 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Record explored track route
router.post('/explore', verifyToken, async (req, res) => {
  const { track } = req.body;
  if (!track || typeof track !== 'string') {
    return res.status(400).json({ message: 'Track name is required' });
  }

  const normalized = track.trim().toLowerCase();
  let canonicalName = "Coding";
  if (normalized.includes("lang")) canonicalName = "Language";
  else if (normalized.includes("veh") || normalized.includes("driv")) canonicalName = "Vehicles";
  else if (normalized.includes("fit") || normalized.includes("gym")) canonicalName = "Fitness";
  else if (normalized.includes("cod")) canonicalName = "Coding";
  else canonicalName = track.trim().charAt(0).toUpperCase() + track.trim().slice(1).toLowerCase();

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.exploredTracks) {
      user.exploredTracks = [];
    }

    if (!user.exploredTracks.includes(canonicalName)) {
      user.exploredTracks.push(canonicalName);
      await user.save();
    }

    res.status(200).json({
      message: 'Exploration recorded successfully',
      exploredTracks: user.exploredTracks
    });
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

// Update Interests
router.put('/interests', verifyToken, async (req, res) => {
  const { interests } = req.body;
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (Array.isArray(interests)) {
      user.interests = interests;
    }
    await user.save();
    res.status(200).json({ message: 'Interests updated successfully', interests: user.interests });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
