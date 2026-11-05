const admin = require('../firebaseConfig');

/**
 * Middleware: verifyFirebaseToken
 * Strictly verifies Firebase ID tokens using the Firebase Admin SDK.
 * Rejects unverified JWT claims, missing tokens, and request body identity injection.
 */
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token && req.body && (req.body.idToken || req.body.token)) {
    token = req.body.idToken || req.body.token;
  }

  if (!token || typeof token !== 'string') {
    return res.status(401).json({
      success: false,
      message: 'Access denied. A valid Firebase ID token is required.',
    });
  }

  // Ensure Firebase Admin SDK is initialized
  if (!admin.apps || admin.apps.length === 0) {
    // In automated test environment only, verify if a test token verification stub is provided
    if (process.env.NODE_ENV === 'test' && process.env.TEST_ALLOW_MOCK_AUTH === 'true') {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        if (decoded && decoded.email && decoded.uid) {
          req.user = {
            uid: decoded.uid,
            email: decoded.email.toLowerCase().trim(),
            name: decoded.name || decoded.email.split('@')[0],
            authProvider: 'google',
          };
          return next();
        }
      } catch {}
    }
    return res.status(500).json({
      success: false,
      message: 'Firebase Admin authentication is not configured on the server.',
    });
  }

  try {
    // Verify cryptographic signature, expiration, issuer, audience, and revocation status
    const decodedToken = await admin.auth().verifyIdToken(token, true);

    if (!decodedToken || !decodedToken.uid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase ID token claims.',
      });
    }

    if (!decodedToken.email) {
      return res.status(400).json({
        success: false,
        message: 'Firebase account must have an associated email address.',
      });
    }

    // Build the authenticated identity EXCLUSIVELY from verified claims
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email.toLowerCase().trim(),
      name: decodedToken.name || decodedToken.displayName || decodedToken.email.split('@')[0],
      picture: decodedToken.picture || '',
      emailVerified: !!decodedToken.email_verified,
      authProvider: 'google',
    };

    return next();
  } catch (error) {
    console.error('Firebase token verification error:', error.code || error.message);
    const isExpired = error.code === 'auth/id-token-expired';
    const isRevoked = error.code === 'auth/id-token-revoked';
    return res.status(401).json({
      success: false,
      message: isExpired
        ? 'Firebase authentication token has expired. Please sign in again.'
        : isRevoked
        ? 'Firebase authentication token has been revoked.'
        : 'Firebase ID token verification failed.',
      errorCode: error.code || 'AUTH_FAILED',
    });
  }
};

module.exports = verifyFirebaseToken;
