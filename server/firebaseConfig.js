const admin = require("firebase-admin");

// Note: To make this work locally, the user must provide a serviceAccountKey.json 
// from their Firebase Console -> Project Settings -> Service Accounts.
// We are using a try-catch to mock it if the file doesn't exist, so the server doesn't crash.

try {
  let serviceAccount;
  
  // 1. Check if we have the credentials in an environment variable (for Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // 2. Fallback to local file for local development
    serviceAccount = require("./serviceAccountKey.json");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("🔥 Firebase Admin Initialized Successfully");
} catch (error) {
  console.warn("⚠️ Firebase Admin not initialized. Make sure FIREBASE_SERVICE_ACCOUNT is set on Render!");
}

module.exports = admin;
