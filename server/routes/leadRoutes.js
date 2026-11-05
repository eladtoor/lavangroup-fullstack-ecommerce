const express = require("express");
const rateLimit = require("express-rate-limit");
const { createLead, listLeads, updateLead, exportLeadsCsv } = require("../controllers/leadController");
const { adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Public form submissions: 5 per 10 minutes per IP (stops form spam without bothering real visitors).
const leadSubmitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: "יותר מדי פניות. נא לנסות שוב בעוד כמה דקות או להתקשר 050-5342813" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", leadSubmitLimiter, createLead);

// Admin only
router.get("/export.csv", adminOnly, exportLeadsCsv);
router.get("/", adminOnly, listLeads);
router.patch("/:id", adminOnly, updateLead);

module.exports = router;
