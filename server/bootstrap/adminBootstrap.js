const bcrypt = require("bcrypt");
const User = require("../models/User");

const MAIN_ADMIN_EMAIL = (
  process.env.MAIN_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  "yashashyashash1@gmail.com"
)
  .toLowerCase()
  .trim();

const MAIN_ADMIN_RAW_PASS = process.env.ADMIN_PASSWORD;

/**
 * Ensures the designated Main Admin (yashashyashash1@gmail.com) is initialized,
 * verified with role SUPER_ADMIN, isMainAdmin: true, and full permissions.
 * Preserves secondary admins, existing passwords, and legacy accounts without destructive wipes.
 */
async function bootstrapSuperAdmin() {
  try {
    console.log(`🔐 Verifying Main Admin account (${MAIN_ADMIN_EMAIL})...`);

    let mainAdmin = await User.findOne({ email: MAIN_ADMIN_EMAIL });

    if (!mainAdmin) {
      // Missing password credentials handling
      let rawPass = MAIN_ADMIN_RAW_PASS;
      if (!rawPass) {
        if (process.env.NODE_ENV === "production") {
          console.error("❌ Configuration Error: ADMIN_PASSWORD environment variable is required to initialize the production Main Admin account.");
          return null;
        } else {
          // Non-production test/development fallback
          rawPass = process.env.TEST_ADMIN_PASSWORD || "TestAdminSecure2026!";
        }
      }

      console.log(`✨ Initializing designated Main Admin account: ${MAIN_ADMIN_EMAIL}`);
      const hashedPassword = await bcrypt.hash(rawPass, 10);
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

      // DO NOT reset or overwrite an existing admin's password during startup.
      // Passwords are cryptographically preserved in database. Only if an explicit ADMIN_PASSWORD
      // is provided via environment and matches a manual rotation request should it change.

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
