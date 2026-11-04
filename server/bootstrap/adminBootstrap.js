const bcrypt = require("bcrypt");
const User = require("../models/User");

const MAIN_ADMIN_EMAIL = (
  process.env.MAIN_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  "yashashyashash1@gmail.com"
)
  .toLowerCase()
  .trim();

const MAIN_ADMIN_RAW_PASS = process.env.ADMIN_PASSWORD || "miqtinlszsdfayvi";

/**
 * Ensures the designated Main Admin (yashashyashash1@gmail.com) is initialized,
 * verified with role SUPER_ADMIN, isMainAdmin: true, and full permissions.
 * Preserves secondary admins and legacy accounts without destructive wipes.
 */
async function bootstrapSuperAdmin() {
  try {
    console.log(`🔐 Verifying Main Admin account (${MAIN_ADMIN_EMAIL})...`);

    let mainAdmin = await User.findOne({ email: MAIN_ADMIN_EMAIL });
    const hashedPassword = await bcrypt.hash(MAIN_ADMIN_RAW_PASS, 10);

    if (!mainAdmin) {
      console.log(`✨ Initializing designated Main Admin account: ${MAIN_ADMIN_EMAIL}`);
      let username = "main_admin";
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        username = `admin_${Date.now().toString().slice(-4)}`;
      }

      mainAdmin = await User.create({
        username,
        email: MAIN_ADMIN_EMAIL,
        fullName: "MasteryZone Main Admin",
        role: "SUPER_ADMIN",
        isMainAdmin: true,
        adminPermissions: ["*"],
        password: hashedPassword,
        authProvider: "email",
        notificationsInitialized: true,
        isSuspended: false,
      });
      console.log(`✅ Main Admin created successfully [ID: ${mainAdmin._id}]`);
    } else {
      let needsSave = false;
      if (mainAdmin.role !== "SUPER_ADMIN") {
        mainAdmin.role = "SUPER_ADMIN";
        needsSave = true;
      }
      if (!mainAdmin.isMainAdmin) {
        mainAdmin.isMainAdmin = true;
        needsSave = true;
      }
      if (!mainAdmin.adminPermissions || mainAdmin.adminPermissions.length === 0) {
        mainAdmin.adminPermissions = ["*"];
        needsSave = true;
      }
      if (mainAdmin.isSuspended) {
        mainAdmin.isSuspended = false;
        needsSave = true;
      }

      // Synchronize configured environment password
      const passMatch = await bcrypt.compare(MAIN_ADMIN_RAW_PASS, mainAdmin.password);
      if (!passMatch) {
        mainAdmin.password = hashedPassword;
        needsSave = true;
      }

      if (needsSave) {
        await mainAdmin.save();
        console.log(`✅ Main Admin verified & synchronized: ${MAIN_ADMIN_EMAIL}`);
      } else {
        console.log(`✅ Main Admin already initialized & verified: ${MAIN_ADMIN_EMAIL}`);
      }
    }

    // Also ensure previous legacy admin (yashashyash1@gmail.com) remains a valid administrator
    // so all historical marks, sessions, and audits stay completely intact
    const legacyAdmin = await User.findOne({ email: "yashashyash1@gmail.com" });
    if (legacyAdmin && legacyAdmin.role !== "SUPER_ADMIN" && legacyAdmin.role !== "admin") {
      legacyAdmin.role = "admin";
      legacyAdmin.adminPermissions = ["*"];
      await legacyAdmin.save();
    }

    return mainAdmin;
  } catch (err) {
    console.error("❌ Error bootstrapping Main Admin:", err.message);
  }
}

module.exports = {
  bootstrapSuperAdmin,
  MAIN_ADMIN_EMAIL,
  SUPER_ADMIN_EMAIL: MAIN_ADMIN_EMAIL,
};
