const express = require("express");
const {
  getSiteStats,
  updateSiteStats,
} = require("../controllers/siteStatsController");
const { adminOnly } = require("../middleware/authMiddleware");
const router = express.Router();

// Public: GET site stats
router.get("/", getSiteStats);

// Admin-only: PUT update site stats
router.put("/", adminOnly, updateSiteStats);

module.exports = router;
