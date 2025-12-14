require("dotenv").config();

const admin = require("firebase-admin");

/**
 * DO NOT commit service account JSON files.
 *
 * Provide credentials via ONE of:
 * - FIREBASE_SERVICE_ACCOUNT (JSON string)
 * - GOOGLE_APPLICATION_CREDENTIALS (file path managed by your host)
 */
let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credential = admin.credential.cert(serviceAccount);
  } catch (e) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON");
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credential = admin.credential.applicationDefault();
} else {
  throw new Error(
    "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS."
  );
}

admin.initializeApp({
  credential,
  databaseURL:
    "https://hybrid-app-users-default-rtdb.europe-west1.firebasedatabase.app",
});

module.exports = admin;
