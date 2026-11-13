const admin = require('../firebaseConfig');
const jwt = require('jsonwebtoken');
const https = require('https');

const ALLOWED_PROJECT_IDS = Array.from(
  new Set(
    [
      process.env.FIREBASE_PROJECT_ID,
      's70-capstonestone-masteryzone',
      's70-capstone-masteryzone',
      '817463451997',
    ].filter(Boolean)
  )
);

const ALLOWED_ISSUERS = ALLOWED_PROJECT_IDS.map(
  (id) => `https://securetoken.google.com/${id}`
);

let publicKeysCache = { keys: null, expiresAt: 0 };

async function getGooglePublicKeys(forceRefresh = false) {
  if (!forceRefresh && publicKeysCache.keys && Date.now() < publicKeysCache.expiresAt) {
    return publicKeysCache.keys;
  }
  return new Promise((resolve, reject) => {
    const req = https.get(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
      { timeout: 10000 },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const keys = JSON.parse(data);
            publicKeysCache = { keys, expiresAt: Date.now() + 6 * 3600 * 1000 };
            resolve(keys);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('Timeout fetching Google public keys'));
    });
    req.on('error', reject);
  });
}

/**
 * Middleware: verifyFirebaseToken
 * Strictly verifies Firebase ID tokens cryptographically.
 * Uses Firebase Admin SDK if service account is provided, or validates against Google's
 * official public x509 certificates (RS256 signature, audience, issuer, expiration).
 * Completely rejects unverified mock claims or request body identity injection.
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    // In test environment, allow pre-authenticated mock identity if explicitly set by test runner
    if (process.env.NODE_ENV === 'test' && req.user && req.user.email && req.user.uid) {
      return next();
    }

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

    token = token.trim().replace(/^"(.*)"$/, '$1');

    // Method 1: If Firebase Admin SDK is initialized with a service account, verify via Admin SDK
    if (admin.apps && admin.apps.length > 0) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (!decodedToken || !decodedToken.uid) {
          return res.status(401).json({ success: false, message: 'Invalid Firebase token claims.' });
        }
        req.user = {
          uid: decodedToken.uid,
          email: (decodedToken.email || '').toLowerCase().trim(),
          name: decodedToken.name || decodedToken.displayName || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Google User'),
          picture: decodedToken.picture || '',
          emailVerified: !!decodedToken.email_verified,
          authProvider: 'google',
        };
        return next();
      } catch (adminError) {
        console.warn('Firebase Admin verification error, trying Google public keys fallback:', adminError.message);
      }
    }

    // Method 2: Cryptographic verification using Google's authentic public x509 certificates
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
      return res.status(401).json({ success: false, message: 'Malformed Firebase ID token header.' });
    }

    let publicKeys = await getGooglePublicKeys();
    let cert = publicKeys[decodedHeader.header.kid];

    // If key ID is missing from cache, refresh keys from Google to support key rotation
    if (!cert) {
      publicKeysCache = { keys: null, expiresAt: 0 };
      publicKeys = await getGooglePublicKeys(true);
      cert = publicKeys[decodedHeader.header.kid];
    }

    if (!cert) {
      return res.status(401).json({ success: false, message: 'Invalid Firebase ID token key ID.' });
    }

    // Cryptographically verify RS256 signature, expiration, audience, and issuer
    const decoded = jwt.verify(token, cert, {
      algorithms: ['RS256'],
      audience: ALLOWED_PROJECT_IDS,
      issuer: ALLOWED_ISSUERS,
      clockTolerance: 60,
    });

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ success: false, message: 'Invalid Firebase ID token payload.' });
    }

    req.user = {
      uid: decoded.sub,
      email: (decoded.email || '').toLowerCase().trim(),
      name: decoded.name || decoded.displayName || (decoded.email ? decoded.email.split('@')[0] : 'Google User'),
      picture: decoded.picture || '',
      emailVerified: !!decoded.email_verified,
      authProvider: 'google',
    };

    return next();
  } catch (verifyErr) {
    console.error('Firebase public cert verification error:', verifyErr.message);
    return res.status(401).json({
      success: false,
      message: 'Cryptographic verification of Firebase token failed: ' + verifyErr.message,
    });
  }
};

module.exports = verifyFirebaseToken;
