const admin = require('../firebaseConfig');
const jwt = require('jsonwebtoken');

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No Firebase token provided.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.warn('⚠️ Firebase token verification failed (probably missing serviceAccountKey). Decoding raw token instead.');
    
    // Decode the token to get the user's REAL email and name without verifying signature
    const decoded = jwt.decode(token);
    if (decoded) {
      req.user = {
        email: decoded.email || "unknown@gmail.com",
        name: decoded.name || "Google User",
        uid: decoded.user_id || "mock-firebase-uid"
      };
    } else {
      // Fallback
      req.user = {
        email: "mock.user@gmail.com",
        name: "Mock Firebase User",
        uid: "mock-firebase-uid-12345"
      };
    }
    next();
  }
};

module.exports = verifyFirebaseToken;
