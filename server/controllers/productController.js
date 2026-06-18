const Product = require("../models/productModel");
const cache = require("../utils/responseCache");

// TTLs for cached read endpoints. Short enough that edits surface quickly
// (the frontend already keeps its own 5-min localStorage cache), long enough
// to absorb a crawler stampede.
const PRODUCTS_TTL = 60 * 1000; // 60s

// Invalidate every product-derived cache key. Called on any product write so
// edits are reflected within the TTL ceiling at the latest, usually immediately.
const invalidateProductCaches = () => {
  cache.clear("products:all");
  cache.clearPrefix("category:");
};

// פונקציה ליצירת מוצר חדש
const createProduct = async (req, res) => {
  try {
    // וודא שהמאפיינים נשמרים כ-Map ולא כמחרוזת
    if (req.body.attributes && typeof req.body.attributes === "string") {
      req.body.attributes = JSON.parse(req.body.attributes);
    }

    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    invalidateProductCaches();
    res.status(201).send(savedProduct);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// פונקציה לקבלת פרטי מוצר לפי מזהה
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.status(200).send(product);
  } catch (error) {
    console.error(`[REQ-ERR] GET /api/products/${req.params.id}:`, error);
    res.status(500).send(error.message);
  }
};

// פונקציה לשליפת המוצרים מהדאטה בייס ולהמיר את השדות לאנגלית
const getAllProducts = async (req, res) => {
  try {
    // Single-flight + TTL: one full-collection scan + one JSON.stringify is
    // shared across all concurrent callers. We cache the SERIALIZED string so
    // repeat hits skip both the Mongo round-trip and the (CPU-bound) stringify.
    const body = await cache.singleFlight("products:all", PRODUCTS_TTL, async () => {
      const products = await Product.find().lean(); // lean() = plain JS objects, much faster
      return JSON.stringify(products);
    });

    res.type("application/json").send(body);
  } catch (error) {
    console.error("[REQ-ERR] GET /api/products/getAll:", error);
    res.status(500).json({ error: "Error fetching products" });
  }
};

// פונקציה לעדכון מוצר לפי מזהה
const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).send("Product not found");
    }

    invalidateProductCaches();
    res.status(200).send(updatedProduct);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// פונקציה למחיקת מוצר לפי מזהה
const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).send("Product not found");
    }

    invalidateProductCaches();
    res.status(200).send("Product deleted successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Get products by category name (efficient - only fetches matching products)
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryName, subCategoryName } = req.params;

    if (!categoryName) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Build search pattern based on whether subcategory is provided
    // Categories field format: "Main Category" or "Main Category > Sub Category"
    // Single-flight + TTL per category key: a crawler hitting the same category
    // repeatedly (and the COLLSCAN the regex forces) collapses to one query.
    const cacheKey = `category:${categoryName}::${subCategoryName || ""}`;
    const body = await cache.singleFlight(cacheKey, PRODUCTS_TTL, async () => {
      let searchPattern;
      if (subCategoryName) {
        // Search for specific subcategory: "Main > Sub"
        searchPattern = new RegExp(`(^|,)\\s*${escapeRegex(categoryName)}\\s*>\\s*${escapeRegex(subCategoryName)}\\s*(,|$)`, 'i');
      } else {
        // Search for main category (products directly in category, not subcategories)
        // Match "Category" but not "Category > Subcategory"
        searchPattern = new RegExp(`(^|,)\\s*${escapeRegex(categoryName)}\\s*(,|$)`, 'i');
      }

      const products = await Product.find({
        "קטגוריות": { $regex: searchPattern }
      }).lean();

      return JSON.stringify(products);
    });

    res.type("application/json").send(body);
  } catch (error) {
    console.error(`[REQ-ERR] GET /api/products/category/${req.params.categoryName}${req.params.subCategoryName ? '/' + req.params.subCategoryName : ''}:`, error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to escape regex special characters
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductsByCategory,
};
