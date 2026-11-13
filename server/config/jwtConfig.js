const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * Deployment Secret Generation Guidance:
 * To provision a secure, cryptographically random 256-bit secret for staging or production:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * Set the output as JWT_SECRET (and optionally JWT_REFRESH_SECRET) in the environment.
 */
function generateCryptographicSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

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
 * Computes the Shannon entropy of a string (in bits per character).
 */
function calculateEntropy(str) {
  if (!str) return 0;
  const freq = {};
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    freq[ch] = (freq[ch] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const ch in freq) {
    const p = freq[ch] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Validates that a candidate secret provides sufficient cryptographic entropy
 * (at least 256 bits / 32 characters), diverse character set, and is not in the list of known weak templates.
 */
function isSecretStrong(secret) {
  if (!secret || typeof secret !== "string") return false;
  const trimmed = secret.trim();
  if (trimmed.length < 32) return false;
  if (WEAK_OR_DEFAULT_SECRETS.has(trimmed.toLowerCase())) return false;

  // Character diversity: require at least 8 unique characters
  const uniqueChars = new Set(trimmed);
  if (uniqueChars.size < 8) return false;

  // Shannon entropy: minimum 2.5 bits/char
  const entropy = calculateEntropy(trimmed);
  if (entropy < 2.5) return false;

  // Reject repeating single characters (runs >= 6) and repetitive sub-patterns
  if (/(.)\1{5,}/.test(trimmed)) return false;
  if (/^(.{1,8})\1{3,}$/.test(trimmed)) return false;

  return true;
}

const TRUSTED_LOCAL_ENVS = new Set(["development", "test"]);

/**
 * Validates the JWT secret for the specified target runtime environment.
 * In production, public staging, preview, and unknown environments, returns valid: false with descriptive error
 * if the secret is missing, weak, or matches a default value.
 * Missing or unknown environments strictly fail closed.
 */
function validateJwtSecret(secret, env, secretName = "JWT_SECRET") {
  const targetEnv = env !== undefined ? env : (process.env.NODE_ENV || "");
  const normEnv = (targetEnv || "").trim().toLowerCase();
  const isTrustedLocal = TRUSTED_LOCAL_ENVS.has(normEnv);

  if (!isTrustedLocal) {
    if (!secret || typeof secret !== "string" || !secret.trim()) {
      return {
        valid: false,
        error: `${secretName} is missing. A strong 256-bit secret (minimum 32 characters) is required in public and deployed environments.`,
      };
    }
    const trimmed = secret.trim();
    if (WEAK_OR_DEFAULT_SECRETS.has(trimmed.toLowerCase())) {
      return {
        valid: false,
        error: `${secretName} matches a known insecure/default template value. Please configure a cryptographically strong secret.`,
      };
    }
    if (trimmed.length < 32) {
      return {
        valid: false,
        error: `${secretName} is too short (${trimmed.length} characters). A minimum of 32 characters (256 bits of entropy) is required.`,
      };
    }
    if (!isSecretStrong(trimmed)) {
      return {
        valid: false,
        error: `${secretName} lacks sufficient cryptographic entropy or contains predictable repeated patterns.`,
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

const DEV_SECRET_FILE = path.join(__dirname, "../.dev_jwt_secret");
let devSecret = null;

function getPersistentDevSecret() {
  if (devSecret) return devSecret;
  if (process.env.TEST_JWT_SECRET) {
    devSecret = process.env.TEST_JWT_SECRET;
    return devSecret;
  }
  try {
    if (fs.existsSync(DEV_SECRET_FILE)) {
      const persisted = fs.readFileSync(DEV_SECRET_FILE, "utf8").trim();
      if (persisted.length >= 32) {
        devSecret = persisted;
        return devSecret;
      }
    }
    const newlyGenerated = generateCryptographicSecret(32);
    try {
      fs.writeFileSync(DEV_SECRET_FILE, newlyGenerated, { encoding: "utf8", mode: 0o600 });
    } catch {}
    devSecret = newlyGenerated;
    return devSecret;
  } catch {
    devSecret = generateCryptographicSecret(32);
    return devSecret;
  }
}

let cachedValidatedJwtSecret = null;
let lastValidatedSecretInput = null;

/**
 * Returns the active JWT secret.
 * Enforces production and staging security by failing fast if JWT_SECRET is missing or weak.
 * In development/test, persists a cryptographically secure 256-bit random secret
 * so local developer sessions persist across server restarts.
 */
function getJwtSecret() {
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  const isTrustedLocal = TRUSTED_LOCAL_ENVS.has(env);
  const secret = process.env.JWT_SECRET;

  if (cachedValidatedJwtSecret && lastValidatedSecretInput === secret) {
    return cachedValidatedJwtSecret;
  }

  const validation = validateJwtSecret(secret, env, "JWT_SECRET");
  if (!isTrustedLocal && !validation.valid) {
    console.error(`FATAL SECURITY ERROR: ${validation.error}`);
    if (env === "test" || process.env.NODE_ENV === "test") {
      throw new Error(validation.error);
    }
    process.exit(1);
  }

  let resolvedSecret = null;
  if (secret && isSecretStrong(secret)) {
    resolvedSecret = secret.trim();
  } else if (isTrustedLocal && secret && typeof secret === "string" && secret.trim()) {
    resolvedSecret = secret.trim();
  } else if (!isTrustedLocal) {
    // Staging / Production / Preview / Unknown must never reach auto-generation
    console.error("FATAL SECURITY ERROR: Insecure secret fallback blocked in public environment.");
    if (env === "test" || process.env.NODE_ENV === "test") {
      throw new Error("Insecure secret fallback blocked in public environment.");
    }
    process.exit(1);
  } else {
    // Local development / testing persistent 256-bit key
    resolvedSecret = getPersistentDevSecret();
  }

  cachedValidatedJwtSecret = resolvedSecret;
  lastValidatedSecretInput = secret;
  return resolvedSecret;
}

let cachedValidatedRefreshSecret = null;
let lastValidatedRefreshInput = null;

/**
 * Validates and returns the independent refresh token secret where configured.
 */
function getJwtRefreshSecret() {
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  const isTrustedLocal = TRUSTED_LOCAL_ENVS.has(env);
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (cachedValidatedRefreshSecret && lastValidatedRefreshInput === refreshSecret) {
    return cachedValidatedRefreshSecret;
  }

  let resolved = null;
  if (refreshSecret) {
    const validation = validateJwtSecret(refreshSecret, env, "JWT_REFRESH_SECRET");
    if (!isTrustedLocal && !validation.valid) {
      console.error(`FATAL SECURITY ERROR: ${validation.error}`);
      if (env === "test" || process.env.NODE_ENV === "test") {
        throw new Error(validation.error);
      }
      process.exit(1);
    }
    resolved = refreshSecret.trim();
  } else if (!isTrustedLocal) {
    resolved = null;
  } else {
    resolved = getJwtSecret() + "_refresh";
  }

  cachedValidatedRefreshSecret = resolved;
  lastValidatedRefreshInput = refreshSecret;
  return resolved;
}

module.exports = {
  getJwtSecret,
  getJwtRefreshSecret,
  isSecretStrong,
  validateJwtSecret,
  generateCryptographicSecret,
  WEAK_OR_DEFAULT_SECRETS,
  JWT_SECRET: getJwtSecret(),
};
