const crypto = require("crypto");

let devSecret = null;

/**
 * Returns the configured JWT secret.
 * Enforces production security by failing fast if JWT_SECRET is missing or default.
 * In development/test, generates a cryptographically random secret per process lifetime
 * if none is explicitly provided, eliminating predictable hardcoded development keys.
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === "supersecretkey" || secret === "mz_dev_jwt_secret_do_not_use_in_production_key_2026" || secret.length < 16) {
      console.error("FATAL: A secure JWT_SECRET environment variable is required in production (minimum 16 characters).");
      process.exit(1);
    }
    return secret;
  }

  // In non-production, return explicit secret if provided
  if (secret && secret !== "supersecretkey" && secret !== "mz_dev_jwt_secret_do_not_use_in_production_key_2026") {
    return secret;
  }

  if (!devSecret) {
    devSecret = process.env.TEST_JWT_SECRET || crypto.randomBytes(32).toString("hex");
  }

  return devSecret;
}

module.exports = {
  getJwtSecret,
  JWT_SECRET: getJwtSecret(),
};
