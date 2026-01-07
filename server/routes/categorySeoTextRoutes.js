// routes/categorySeoTextRoutes.js
const express = require("express");
const router = express.Router();
const CategorySeoText = require("../models/categorySeoTextModel");
const { adminOnly } = require("../middleware/authMiddleware");

// Get all SEO texts (public for frontend metadata)
router.get("/", async (req, res) => {
  try {
    const seoTexts = await CategorySeoText.find();
    res.json(seoTexts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get SEO text by name (for a specific category or subcategory)
router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);
    const seoText = await CategorySeoText.findOne({ name: decodedName });
    if (!seoText) {
      return res.status(404).json({ message: "SEO text not found" });
    }
    res.json(seoText);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only: Create or update SEO text (upsert)
router.post("/", adminOnly, async (req, res) => {
  try {
    const { name, seoTitle, seoDescription, seoContent, type, parentCategory } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "name and type are required" });
    }

    const seoText = await CategorySeoText.findOneAndUpdate(
      { name },
      {
        seoTitle,
        seoDescription,
        seoContent,
        type,
        parentCategory,
        updatedAt: Date.now()
      },
      { upsert: true, new: true }
    );
    res.json(seoText);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only: Delete SEO text
router.delete("/:name", adminOnly, async (req, res) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);
    const result = await CategorySeoText.findOneAndDelete({ name: decodedName });
    if (!result) {
      return res.status(404).json({ message: "SEO text not found" });
    }
    res.json({ message: "SEO text deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
