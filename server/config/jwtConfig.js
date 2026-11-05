const crypto = require("crypto");

/**
 * Returns the configured JWT secret.
 * Enforces production security by failing fast if JWT_SECRET is missing or default.
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === "supersecretkey" || secret.length < 16) {
      console.error("FATAL: A secure JWT_SECRET environment variable is required in production.");
      process.exit(1);
    }
    return secret;
  }

  // In non-production, return secret if available, else warn and use stable development key
  if (secret && secret !== "supersecretkey") {
    return secret;
  }

  return "mz_dev_jwt_secret_do_not_use_in_production_key_2026";
}

module.exports = {
  getJwtSecret,
  JWT_SECRET: getJwtSecret(),
};
