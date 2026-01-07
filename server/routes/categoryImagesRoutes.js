// routes/categoryImagesRoutes.js
const express = require("express");
const router = express.Router();
const CategoryImage = require("../models/categoryImageModel");
const { adminOnly } = require("../middleware/authMiddleware");

// Public route - get all category images
router.get("/", async (req, res) => {
  try {
    const categories = await CategoryImage.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only route - update/create category image
router.post("/", adminOnly, async (req, res) => {
  try {
    const { name, image } = req.body;

    if (!name || !image) {
      return res.status(400).json({ error: "name and image are required" });
    }

    const category = await CategoryImage.findOneAndUpdate(
      { name },
      { image },
      { upsert: true, new: true }
    );
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
