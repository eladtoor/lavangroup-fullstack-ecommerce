const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { adminOnly } = require("../middleware/authMiddleware");

// Public routes
router.get("/getAll", productController.getAllProducts);
router.get("/:id", productController.getProduct);

// Admin-only routes (protected)
router.post("/create", adminOnly, productController.createProduct);
router.put("/update/:id", adminOnly, productController.updateProduct);
router.delete("/delete/:id", adminOnly, productController.deleteProduct);

module.exports = router;
