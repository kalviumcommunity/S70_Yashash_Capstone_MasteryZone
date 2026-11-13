const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwtConfig');
const { recordAuthDuration } = require('./timingDiagnostics');

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
    const decoded = jwt.verify(token, getJwtSecret());
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
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  recordAuthDuration(Number(process.hrtime.bigint() - authStart) / 1e6);
  next();
};

authenticateToken.optionalAuthenticateToken = optionalAuthenticateToken;
authenticateToken.authenticateToken = authenticateToken;

module.exports = authenticateToken;
module.exports.optionalAuthenticateToken = optionalAuthenticateToken;
