// routes/categorySeoTextRoutes.js
const express = require("express");
const router = express.Router();
const CategorySeoText = require("../models/categorySeoTextModel");
const { adminOnly } = require("../middleware/authMiddleware");
const cache = require("../utils/responseCache");

const SEO_TTL = 5 * 60 * 1000; // 5 min — SEO text changes rarely

// Get all SEO texts (public for frontend metadata)
router.get("/", async (req, res) => {
  try {
    const seoTexts = await cache.singleFlight("seo:__all", SEO_TTL, () =>
      CategorySeoText.find().lean()
    );
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
    // Single-flight + TTL, and cache the "not found" result too (negative cache)
    // so crawlers hitting non-existent names can't re-trigger a query each time.
    const seoText = await cache.singleFlight(`seo:${decodedName}`, SEO_TTL, () =>
      CategorySeoText.findOne({ name: decodedName }).lean()
    );
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
    cache.clear(`seo:${name}`);
    cache.clear("seo:__all");
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
    cache.clear(`seo:${decodedName}`);
    cache.clear("seo:__all");
    res.json({ message: "SEO text deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
