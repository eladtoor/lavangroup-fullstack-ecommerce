const express = require("express");
const {
  getMaterialGroupSettings,
  updateMaterialGroupSetting,
} = require("../controllers/materialGroupController");
const { adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Public: Get all material group settings
router.get("/", getMaterialGroupSettings);

// Admin-only: Update a material group's minimum price
router.put("/", adminOnly, updateMaterialGroupSetting);

module.exports = router;
