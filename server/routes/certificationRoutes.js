const express = require("express");
const router = express.Router();
const Certification = require("../models/CertificationSchema");
const authenticateToken = require("../middleware/authMiddleware");

// Get all certifications for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const certs = await Certification.find({ userId: req.user.userId });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Enroll / Start Free Trial
router.post("/enroll", authenticateToken, async (req, res) => {
  try {
    const { zone, certId, name, totalModules, isTrial } = req.body;
    
    const existing = await Certification.findOne({ userId: req.user.userId, certId });
    if (existing) {
      return res.status(400).json({ message: "Already enrolled in this certification" });
    }

    const trialExpiresAt = isTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;
    
    // If purchasing (not a trial), instantly certify
    const status = isTrial ? 'active' : 'completed';
    const progress = isTrial ? 0 : 100;
    const currentModule = isTrial ? 1 : totalModules;

    const newCert = new Certification({
      userId: req.user.userId,
      zone,
      certId,
      name,
      totalModules,
      isTrial,
      trialExpiresAt,
      status,
      progress,
      currentModule
    });

    await newCert.save();
    res.status(201).json({ message: "Successfully enrolled", certification: newCert });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Update Progress (Complete Module)
router.put("/progress", authenticateToken, async (req, res) => {
  try {
    const { certId } = req.body;
    const cert = await Certification.findOne({ userId: req.user.userId, certId });
    
    if (!cert) return res.status(404).json({ message: "Certification not found" });
    
    if (cert.status === 'completed') {
      return res.status(400).json({ message: "Certification already completed" });
    }

    if (cert.isTrial && new Date() > new Date(cert.trialExpiresAt)) {
      cert.status = 'expired';
      await cert.save();
      return res.status(403).json({ message: "Free Trial has expired" });
    }

    cert.currentModule += 1;
    cert.progress = Math.min((cert.currentModule / cert.totalModules) * 100, 100);
    
    if (cert.progress >= 100) {
      cert.status = 'completed';
    }

    await cert.save();
    res.json({ message: "Progress updated", certification: cert });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = router;
