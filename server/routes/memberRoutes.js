const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Membership = require('../models/Membership');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token." });
  }
};

// GET /api/members/:zone - Fetch membership pass and roster for a specific zone
router.get('/:zone', verifyToken, async (req, res) => {
  try {
    const { zone } = req.params;
    const membership = await Membership.findOne({ userId: req.user.id, zone: zone.toUpperCase() });
    
    if (!membership) {
      return res.status(404).json({ message: "No active membership found for this zone." });
    }
    
    res.json(membership);
  } catch (error) {
    console.error("Error fetching membership:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/members/:zone/purchase - Purchase or update a membership pass
router.post('/:zone/purchase', verifyToken, async (req, res) => {
  try {
    const { zone } = req.params;
    const { tier, cycle, primaryName, email, accentColor } = req.body;

    const passId = "MZ-PASS-DEV-" + Math.floor(10000 + Math.random() * 90000);

    let membership = await Membership.findOne({ userId: req.user.id, zone: zone.toUpperCase() });

    if (membership) {
      // Update existing
      membership.tier = tier || membership.tier;
      membership.cycle = cycle || membership.cycle;
      membership.primaryName = primaryName || membership.primaryName;
      membership.email = email || membership.email;
      membership.accentColor = accentColor || membership.accentColor;
      membership.updatedAt = Date.now();
      await membership.save();
    } else {
      // Create new
      membership = new Membership({
        userId: req.user.id,
        zone: zone.toUpperCase(),
        tier: tier || 'gold',
        cycle: cycle || 'monthly',
        primaryName,
        email,
        accentColor: accentColor || '#00A859',
        passId,
        roster: []
      });
      await membership.save();
    }

    res.status(200).json({ message: "Membership active!", membership });
  } catch (error) {
    console.error("Error purchasing membership:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/members/:zone/roster - Add a teammate to the roster
router.post('/:zone/roster', verifyToken, async (req, res) => {
  try {
    const { zone } = req.params;
    const { name, age, relationship, goal } = req.body;

    const membership = await Membership.findOne({ userId: req.user.id, zone: zone.toUpperCase() });
    
    if (!membership) {
      return res.status(404).json({ error: "You must purchase a membership pass first." });
    }

    membership.roster.push({ name, age, relationship, goal });
    membership.updatedAt = Date.now();
    await membership.save();

    res.status(200).json({ message: "Teammate added!", roster: membership.roster });
  } catch (error) {
    console.error("Error adding to roster:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/members/:zone/roster/:memberId - Remove a teammate from the roster
router.delete('/:zone/roster/:memberId', verifyToken, async (req, res) => {
  try {
    const { zone, memberId } = req.params;

    const membership = await Membership.findOne({ userId: req.user.id, zone: zone.toUpperCase() });
    
    if (!membership) {
      return res.status(404).json({ error: "Membership not found." });
    }

    membership.roster = membership.roster.filter(member => member._id.toString() !== memberId);
    membership.updatedAt = Date.now();
    await membership.save();

    res.status(200).json({ message: "Teammate removed!", roster: membership.roster });
  } catch (error) {
    console.error("Error removing from roster:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/members/:zone/theme - Update the pass accent color
router.put('/:zone/theme', verifyToken, async (req, res) => {
  try {
    const { zone } = req.params;
    const { accentColor } = req.body;

    const membership = await Membership.findOne({ userId: req.user.id, zone: zone.toUpperCase() });
    
    if (!membership) {
      return res.status(404).json({ error: "Membership not found." });
    }

    membership.accentColor = accentColor;
    membership.updatedAt = Date.now();
    await membership.save();

    res.status(200).json({ message: "Theme updated!", accentColor: membership.accentColor });
  } catch (error) {
    console.error("Error updating theme:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
