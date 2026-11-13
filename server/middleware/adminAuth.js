const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AdminActivityLog = require("../models/AdminActSchema");
const { getJwtSecret } = require("../config/jwtConfig");

const getMainAdminEmail = () => (
  process.env.MAIN_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  ""
)
  .toLowerCase()
  .trim();

const JWT_SECRET = getJwtSecret();

/**
 * Verifies any authorized administrator (Main Admin or Secondary Admin with assigned permissions)
 */
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers["x-admin-token"];
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (authHeader) {
      token = authHeader;
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing. Please sign in as an Administrator.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session token.",
      });
    }

    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload.",
      });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const userEmail = (user.email || "").toLowerCase().trim();
    const mainAdminEmail = getMainAdminEmail();
    const isMainAdmin = (mainAdminEmail && userEmail === mainAdminEmail) || user.isMainAdmin === true;
    const isSecondaryAdmin = user.role === "admin" || user.role === "SUPER_ADMIN";

    if (!isMainAdmin && !isSecondaryAdmin) {
      console.warn(`🚨 Unauthorized access attempt to Admin API by: ${user.email} (Role: ${user.role})`);
      return res.status(403).json({
        success: false,
        message: "Access Denied: Administrator authorization required.",
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Administrator account is currently suspended.",
      });
    }

    req.user = user;
    req.adminUser = user;
    req.isMainAdmin = isMainAdmin;
    next();
  } catch (error) {
    console.error("Admin Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authorization.",
    });
  }
};

/**
 * Strict Main Admin Exclusive Verification:
 * Only configured MAIN_ADMIN_EMAIL can access. Secondary admins are rejected.
 */
const verifyMainAdminOnly = async (req, res, next) => {
  await verifyAdmin(req, res, async () => {
    const userEmail = (req.user?.email || "").toLowerCase().trim();
    const mainAdminEmail = getMainAdminEmail();
    if (!mainAdminEmail || userEmail !== mainAdminEmail) {
      console.warn(`🚨 Secondary admin ${userEmail} attempted to access exclusive Main Admin feature.`);
      return res.status(403).json({
        success: false,
        message: "Access Denied: Exclusive Main Administrator authority required.",
      });
    }
    next();
  });
};

/**
 * Permission checker middleware for secondary admins
 */
const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (req.isMainAdmin) return next();

    const permissions = req.user?.adminPermissions || [];
    if (permissions.includes("*") || permissions.includes(permissionKey)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access Denied: Your admin account does not have permission for '${permissionKey}'.`,
    });
  };
};

/**
 * Log an administrative action to MongoDB audit trail
 */
const recordAdminAudit = async (adminIdOrObj, actionArg, targetIdArg = null, noteArg = "") => {
  try {
    let adminId, action, targetId, note;
    if (typeof adminIdOrObj === "object" && adminIdOrObj !== null && !adminIdOrObj._bsontype) {
      adminId = adminIdOrObj.adminId;
      action = adminIdOrObj.action;
      targetId = adminIdOrObj.targetId;
      note = adminIdOrObj.note;
    } else {
      adminId = adminIdOrObj;
      action = actionArg;
      targetId = targetIdArg;
      note = noteArg;
    }

    await AdminActivityLog.create({
      adminId,
      action,
      targetId,
      note,
      timestamp: new Date(),
    });
  } catch (err) {
    console.warn("⚠️ Failed to record admin audit:", err.message);
  }
};

module.exports = {
  verifySuperAdmin: verifyAdmin,
  verifyAdmin,
  verifyMainAdminOnly,
  requirePermission,
  recordAdminAudit,
  getMainAdminEmail,
  get MAIN_ADMIN_EMAIL() {
    return getMainAdminEmail();
  },
  get SUPER_ADMIN_EMAIL() {
    return getMainAdminEmail();
  },
};
