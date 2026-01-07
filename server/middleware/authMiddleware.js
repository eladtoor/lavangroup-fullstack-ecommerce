/**
 * Authentication Middleware
 * Verifies Firebase ID tokens and checks admin permissions
 */

const admin = require("../config/firebase");

// List of admin email addresses (as fallback, prefer Firebase Custom Claims)
const ADMIN_EMAILS = [
  "lavangroupapp@gmail.com",
  "eladtoorgeman@gmail.com",
  "eladto@ac.sce.ac.il",
  // Add other admin emails here
];

/**
 * Middleware to verify Firebase ID token
 * Adds user info to req.user
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header",
    });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAdmin: decodedToken.admin === true, // Check custom claim
    };
    next();
  } catch (error) {
    console.error("Token verification failed:", error.code);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        error: "Token expired",
        message: "Please re-authenticate",
      });
    }

    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid token",
    });
  }
};

/**
 * Middleware to check if user is admin
 * Must be used AFTER verifyToken
 */
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  // Check Firebase Custom Claim first (most secure)
  if (req.user.isAdmin) {
    return next();
  }

  // Fallback: Check against admin email list
  if (ADMIN_EMAILS.includes(req.user.email)) {
    // Set custom claim for future requests (one-time setup)
    try {
      await admin.auth().setCustomUserClaims(req.user.uid, { admin: true });
      console.log(`✅ Set admin claim for ${req.user.email}`);
    } catch (err) {
      console.error("Failed to set admin claim:", err);
    }
    return next();
  }

  // Check Firestore as last resort
  try {
    const firestore = admin.firestore();
    const userDoc = await firestore.collection("users").doc(req.user.uid).get();

    if (userDoc.exists && userDoc.data().isAdmin === true) {
      // Set custom claim for future requests
      try {
        await admin.auth().setCustomUserClaims(req.user.uid, { admin: true });
        console.log(`✅ Set admin claim for ${req.user.email} from Firestore`);
      } catch (err) {
        console.error("Failed to set admin claim:", err);
      }
      return next();
    }
  } catch (err) {
    console.error("Firestore check failed:", err);
  }

  return res.status(403).json({
    error: "Forbidden",
    message: "Admin access required",
  });
};

/**
 * Combined middleware for admin-only routes
 */
const adminOnly = [verifyToken, requireAdmin];

module.exports = {
  verifyToken,
  requireAdmin,
  adminOnly,
};
