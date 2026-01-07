const mongoose = require("mongoose");

const categorySeoTextSchema = new mongoose.Schema({
  // Unique identifier: category name or "category - subcategory" for subcategories
  name: { type: String, required: true, unique: true },
  // SEO title for the page
  seoTitle: { type: String, required: false },
  // SEO meta description
  seoDescription: { type: String, required: false },
  // Main SEO content text (displayed on the page)
  seoContent: { type: String, required: false },
  // Type: 'category' or 'subcategory'
  type: { type: String, enum: ["category", "subcategory"], required: true },
  // Reference to parent category (for subcategories)
  parentCategory: { type: String, required: false },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
categorySeoTextSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model(
  "CategorySeoText",
  categorySeoTextSchema,
  "categoryseotexts"
);
