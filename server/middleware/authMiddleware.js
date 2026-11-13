const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwtConfig');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};

authenticateToken.optionalAuthenticateToken = optionalAuthenticateToken;
authenticateToken.authenticateToken = authenticateToken;

module.exports = authenticateToken;
module.exports.optionalAuthenticateToken = optionalAuthenticateToken;
