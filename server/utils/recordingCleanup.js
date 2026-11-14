const mongoose = require("mongoose");
const Recording = require("../models/Recording");
const User = require("../models/User");

const REAL_USER_FILTER = {
  isGuest: { $ne: true },
  isAutomatedTestUser: { $ne: true },
  $nor: [
    { email: { $regex: /@example\.com$/i } },
    { email: { $regex: /@test\.com$/i } },
    { email: { $regex: /^guest_/i } },
    { email: { $regex: /^candidate_/i } },
    { email: { $regex: /^testuser_/i } },
    { username: { $regex: /^guest_/i } },
    { username: { $regex: /^candidate_/i } },
    { username: { $regex: /^testuser_/i } },
  ],
};

/**
 * Remove fake, dummy, orphan, and simulated recordings not linked to genuine registered accounts
 */
async function cleanInvalidRecordings() {
  try {
    const realUsers = await User.find(REAL_USER_FILTER).select("_id email username role").lean();
    const realUserIds = realUsers.map((u) => String(u._id));
    const realUserEmails = realUsers.map((u) => (u.email || "").toLowerCase()).filter(Boolean);

    // Delete recording documents whose hostUserId does not match any genuine registered user,
    // or dummy test recordings with fake 17-byte / 68-byte file sizes from automated scripts
    const deleteResult = await Recording.deleteMany({
      $or: [
        { hostUserId: { $nin: realUserIds } },
        { hostEmail: { $regex: /@example\.com$/i } },
        { hostEmail: { $regex: /@test\.com$/i } },
        { hostEmail: { $regex: /^guest_/i } },
        { title: { $regex: /Confidential Strategy Meeting \(User A Only\)/i } },
        { title: { $regex: /Alpha Video Collaboration & Code Review/i } },
        { title: { $regex: /Shared Pair Programming Session — Collaboration/i } },
        { title: { $regex: /Algorithmic Review Sprint/i } },
        { title: { $regex: /System Integration Architecture Review/i } },
        { fileSize: { $in: [17, 41, 68] } },
      ],
    });

    if (deleteResult.deletedCount > 0) {
      console.log(`🧹 [RecordingCleanup] Purged ${deleteResult.deletedCount} fake/dummy/orphan recording records.`);
    }

    return deleteResult.deletedCount;
  } catch (err) {
    console.warn("Recording cleanup error:", err.message);
    return 0;
  }
}

module.exports = {
  cleanInvalidRecordings,
  REAL_USER_FILTER,
};
