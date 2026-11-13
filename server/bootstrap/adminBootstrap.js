const bcrypt = require("bcrypt");
const User = require("../models/User");

const getMainAdminEmail = () => (
  process.env.MAIN_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  ""
)
  .toLowerCase()
  .trim();

const MAIN_ADMIN_RAW_PASS = process.env.ADMIN_PASSWORD;

/**
 * Ensures the designated Main Admin is initialized,
 * verified with role SUPER_ADMIN, isMainAdmin: true, and full permissions.
 * Preserves secondary admins, existing passwords, and legacy accounts without destructive wipes.
 */
async function bootstrapSuperAdmin() {
  try {
    const adminEmail = getMainAdminEmail();
    if (!adminEmail) {
      console.log("ℹ️ [Bootstrap] No administrator email configured in environment (MAIN_ADMIN_EMAIL / ADMIN_EMAIL). Skipping admin bootstrap.");
      return null;
    }

    console.log(`🔐 Verifying Main Admin account (${adminEmail})...`);

    let mainAdmin = await User.findOne({ email: adminEmail });

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

      console.log(`✨ Initializing designated Main Admin account: ${adminEmail}`);
      const hashedPassword = await bcrypt.hash(rawPass, 10);
      let username = "main_admin";
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        username = `admin_${Date.now().toString().slice(-4)}`;
      }

      mainAdmin = await User.create({
        username,
        email: adminEmail,
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
      if (!mainAdmin.adminPermissions || !mainAdmin.adminPermissions.includes("*")) {
        mainAdmin.adminPermissions = ["*"];
        needsSave = true;
      }
      if (mainAdmin.isSuspended) {
        mainAdmin.isSuspended = false;
        needsSave = true;
      }

      if (needsSave) {
        await mainAdmin.save();
        console.log(`✅ Main Admin privileges synchronized for ${adminEmail}`);
      } else {
        console.log(`✅ Main Admin already initialized & verified: ${adminEmail}`);
      }
    }

    return mainAdmin;
  } catch (error) {
    console.error("❌ Error verifying/bootstrapping Main Admin account:", error.message);
    return null;
  }
}

module.exports = {
  bootstrapSuperAdmin,
  getMainAdminEmail,
  get MAIN_ADMIN_EMAIL() {
    return getMainAdminEmail();
  },
  get SUPER_ADMIN_EMAIL() {
    return getMainAdminEmail();
  },
};
