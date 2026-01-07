/**
 * Rate Limiting Middleware
 * Prevents brute force attacks, DoS, and spam
 */

const rateLimit = require("express-rate-limit");

// General API rate limiter (100 requests per minute)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: "Too many requests",
    message: "נא לנסות שוב בעוד דקה",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication (5 requests per minute)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: {
    error: "Too many login attempts",
    message: "יותר מדי ניסיונות התחברות. נא לנסות שוב בעוד דקה",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
});

// Rate limiter for payment endpoints (10 requests per minute)
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: "Too many payment requests",
    message: "יותר מדי בקשות תשלום. נא לנסות שוב בעוד דקה",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for email endpoints (3 requests per minute)
const emailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 emails per minute
  message: {
    error: "Too many email requests",
    message: "יותר מדי בקשות שליחת מייל. נא לנסות שוב בעוד דקה",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin operations limiter (20 requests per minute)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    error: "Too many admin requests",
    message: "יותר מדי פעולות ניהול. נא לנסות שוב בעוד דקה",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  emailLimiter,
  adminLimiter,
};
