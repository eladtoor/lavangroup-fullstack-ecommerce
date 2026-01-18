const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// Lightweight endpoint - category names only (fast, for navigation)
router.get("/categories/nav", categoryController.getCategoriesNav);

// Full endpoint - categories with all products (slower, for category pages)
router.get("/categories", categoryController.buildCategoryStructure);

module.exports = router;
