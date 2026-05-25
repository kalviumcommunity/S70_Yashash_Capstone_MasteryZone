const admin = require("firebase-admin");

// Note: To make this work locally, the user must provide a serviceAccountKey.json 
// from their Firebase Console -> Project Settings -> Service Accounts.
// We are using a try-catch to mock it if the file doesn't exist, so the server doesn't crash.

try {
  const serviceAccount = require("./serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("🔥 Firebase Admin Initialized Successfully");
} catch (error) {
  console.warn("⚠️ Firebase Admin not initialized. Missing serviceAccountKey.json");
}

module.exports = admin;
