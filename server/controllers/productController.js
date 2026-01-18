const Product = require("../models/productModel");

// פונקציה ליצירת מוצר חדש
const createProduct = async (req, res) => {
  try {
    // וודא שהמאפיינים נשמרים כ-Map ולא כמחרוזת
    if (req.body.attributes && typeof req.body.attributes === "string") {
      req.body.attributes = JSON.parse(req.body.attributes);
    }

    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).send(savedProduct);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// פונקציה לקבלת פרטי מוצר לפי מזהה
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.status(200).send(product);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// פונקציה לשליפת המוצרים מהדאטה בייס ולהמיר את השדות לאנגלית
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find(); // שליפת כל המוצרים מהדאטה בייס

    res.json(products);
  } catch (error) {
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

    res.status(200).json(products);
  } catch (error) {
    console.error("Error in getProductsByCategory:", error.message);
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
