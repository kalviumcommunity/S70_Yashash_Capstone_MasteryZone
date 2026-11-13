const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwtConfig');
const { recordAuthDuration } = require('./timingDiagnostics');

// High-performance token verification cache to avoid duplicate HMAC-SHA256 calculations during parallel requests
const verifiedTokenCache = new Map();
const TOKEN_CACHE_MAX_SIZE = 1000;
const TOKEN_CACHE_TTL_MS = 30000; // 30 seconds

function getCachedDecodedToken(token, secret = getJwtSecret()) {
  const now = Date.now();
  const cached = verifiedTokenCache.get(token);
  if (cached && now < cached.expiresAt) {
    return cached.decoded;
  }
  const decoded = jwt.verify(token, secret);
  const tokenExpMs = typeof decoded.exp === 'number' ? decoded.exp * 1000 : now + TOKEN_CACHE_TTL_MS;
  const expiresAt = Math.min(now + TOKEN_CACHE_TTL_MS, tokenExpMs);

  if (verifiedTokenCache.size > TOKEN_CACHE_MAX_SIZE) {
    for (const [k, v] of verifiedTokenCache.entries()) {
      if (now >= v.expiresAt) verifiedTokenCache.delete(k);
    }
    if (verifiedTokenCache.size > TOKEN_CACHE_MAX_SIZE) {
      const firstKey = verifiedTokenCache.keys().next().value;
      if (firstKey) verifiedTokenCache.delete(firstKey);
    }
  }

  verifiedTokenCache.set(token, { decoded, expiresAt });
  return decoded;
}

function invalidateToken(token) {
  if (token) verifiedTokenCache.delete(token);
}

const authenticateToken = (req, res, next) => {
  const authStart = process.hrtime.bigint();
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    recordAuthDuration(Number(process.hrtime.bigint() - authStart) / 1e6);
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = getCachedDecodedToken(token, getJwtSecret());
    req.user = decoded;
    recordAuthDuration(Number(process.hrtime.bigint() - authStart) / 1e6);
    next();
  } catch (err) {
    recordAuthDuration(Number(process.hrtime.bigint() - authStart) / 1e6);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const optionalAuthenticateToken = (req, res, next) => {
  const authStart = process.hrtime.bigint();
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.user = null;
    recordAuthDuration(Number(process.hrtime.bigint() - authStart) / 1e6);
    return next();
  }

  try {
    const decoded = getCachedDecodedToken(token, getJwtSecret());
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  recordAuthDuration(Number(process.hrtime.bigint() - authStart) / 1e6);
  next();
};

authenticateToken.optionalAuthenticateToken = optionalAuthenticateToken;
authenticateToken.authenticateToken = authenticateToken;
authenticateToken.invalidateToken = invalidateToken;
authenticateToken.getCachedDecodedToken = getCachedDecodedToken;

module.exports = authenticateToken;
module.exports.optionalAuthenticateToken = optionalAuthenticateToken;
module.exports.invalidateToken = invalidateToken;
module.exports.getCachedDecodedToken = getCachedDecodedToken;
