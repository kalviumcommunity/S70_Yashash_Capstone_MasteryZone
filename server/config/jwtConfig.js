const crypto = require("crypto");

/**
 * Known default, weak, or example secrets that must be strictly rejected
 * in public staging and production environments.
 */
const WEAK_OR_DEFAULT_SECRETS = new Set([
  "supersecretkey",
  "secret",
  "jwt_secret",
  "jwtsecret",
  "password",
  "123456",
  "default_secret",
  "mz_dev_jwt_secret_do_not_use_in_production_key_2026",
  "masteryzone",
  "masteryzone_secret",
  "masteryzone-secret",
  "changeme",
  "test",
  "admin",
  "development",
  "staging",
  "production",
  "your_jwt_secret",
  "your-secret-key",
]);

/**
 * Validates that a candidate secret provides sufficient cryptographic entropy
 * (at least 256 bits / 32 characters) and is not in the list of known weak templates.
 */
function isSecretStrong(secret) {
  if (!secret || typeof secret !== "string") return false;
  const trimmed = secret.trim();
  if (trimmed.length < 32) return false;
  if (WEAK_OR_DEFAULT_SECRETS.has(trimmed.toLowerCase())) return false;
  return true;
}

/**
 * Validates the JWT secret for the specified target runtime environment.
 * In production and public staging, returns valid: false with descriptive error
 * if the secret is missing, weak, or matches a default value.
 */
function validateJwtSecret(secret, env = process.env.NODE_ENV) {
  const normEnv = (env || "development").trim().toLowerCase();
  const isPublic = normEnv === "production" || normEnv === "staging" || normEnv === "prod" || normEnv === "stage";

  if (isPublic) {
    if (!secret || typeof secret !== "string" || !secret.trim()) {
      return {
        valid: false,
        error: "JWT_SECRET is missing. A strong 256-bit secret (minimum 32 characters) is required in public environments.",
      };
    }
    const trimmed = secret.trim();
    if (WEAK_OR_DEFAULT_SECRETS.has(trimmed.toLowerCase())) {
      return {
        valid: false,
        error: "JWT_SECRET matches a known insecure/default template value. Please configure a cryptographically strong secret.",
      };
    }
    if (trimmed.length < 32) {
      return {
        valid: false,
        error: `JWT_SECRET is too short (${trimmed.length} characters). A minimum of 32 characters (256 bits of entropy) is required.`,
      };
    }
    return { valid: true };
  }

  // Development / Test environments:
  if (secret && typeof secret === "string" && secret.trim()) {
    return { valid: true };
  }

  return { valid: true, generated: true };
}

let devSecret = null;

/**
 * Returns the active JWT secret.
 * Enforces production and staging security by failing fast if JWT_SECRET is missing or weak.
 * In development/test, generates a cryptographically secure 256-bit random secret
 * per process lifetime if none is explicitly provided.
 */
function getJwtSecret() {
  const env = (process.env.NODE_ENV || "development").trim().toLowerCase();
  const isPublic = env === "production" || env === "staging" || env === "prod" || env === "stage";
  const secret = process.env.JWT_SECRET;

  const validation = validateJwtSecret(secret, env);
  if (isPublic && !validation.valid) {
    console.error(`FATAL SECURITY ERROR: ${validation.error}`);
    process.exit(1);
  }

  if (secret && isSecretStrong(secret)) {
    return secret.trim();
  }

  if (!isPublic && secret && typeof secret === "string" && secret.trim()) {
    return secret.trim();
  }

  // Local development / testing auto-generate 256-bit cryptographically secure key
  if (!devSecret) {
    devSecret = process.env.TEST_JWT_SECRET || crypto.randomBytes(32).toString("hex");
  }

  return devSecret;
}

module.exports = {
  getJwtSecret,
  isSecretStrong,
  validateJwtSecret,
  WEAK_OR_DEFAULT_SECRETS,
  JWT_SECRET: getJwtSecret(),
};
