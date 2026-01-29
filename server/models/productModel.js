const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  מזהה: { type: Number, required: true }, // Unique product ID
  סוג: { type: String, enum: ["simple", "variable"], default: "simple" }, // Product type (simple or variable)
  'מק"ט': { type: String }, // SKU
  שם: { type: String, required: true }, // Product name
  "תיאור קצר": { type: String }, // Short description
  תיאור: { type: String }, // Full description
  "מחיר רגיל": { type: Number }, // Regular price
  "מחיר מבצע": { type: Number }, // Sale price
  קטגוריות: { type: String }, // Categories as a string
  תמונות: { type: String }, // Image URL
  quantities: { type: [Number], default: [] }, // Quantities as an array of numbers
  allowComments: Boolean,

  // New field for material groups
  materialGroup: {
    type: String,
    enum: ["Colors and Accessories", "Powders", "Gypsum and Tracks"],
    default: null, // Optional, or set a default group like 'Colors and Accessories'
  },

  // Variations
  variations: [
    {
      _id: false, // Disable automatic generation of _id for variations
      מזהה: { type: Number }, // Variation ID
      סוג: { type: String, default: "variation" }, // Variation type
      שם: { type: String }, // Variation name
      "תיאור קצר": { type: String }, // Short description of variation
      attributes: mongoose.Schema.Types.Mixed, // Variation-specific attributes (e.g., color, size)
    },
  ],
});

// Indexes for query performance
productSchema.index({ מזהה: 1 });
productSchema.index({ קטגוריות: 1 });

const Product = mongoose.model("Product", productSchema, "test");

module.exports = Product;
