const Product = require("../models/productModel");
const cache = require("../utils/responseCache");
const { notifyProductChange } = require("../utils/changeNotifier");

// TTLs for cached read endpoints. Short enough that edits surface quickly
// (the frontend already keeps its own 5-min localStorage cache), long enough
// to absorb a crawler stampede.
const PRODUCTS_TTL = 60 * 1000; // 60s

// Invalidate every product-derived cache key. Called on any product write so
// edits are reflected within the TTL ceiling at the latest, usually immediately.
// Every write must ALSO call notifyProductChange() afterwards — that is what
// pushes the edit to open tabs now (the DB change stream is gone, see core.js).
// Note "product:" does not prefix-match "products:all" (the 8th char differs),
// so the single-product keys and the all-products key are cleared separately.
const invalidateProductCaches = () => {
  cache.clear("products:all");
  cache.clearPrefix("category:");
  cache.clearPrefix("product:");
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
    notifyProductChange(savedProduct._id);
    res.status(201).send(savedProduct);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// פונקציה לקבלת פרטי מוצר לפי מזהה
const getProduct = async (req, res) => {
  try {
    // Single-flight + TTL per product id. Every product page SSR hits this, and
    // ?_rsc= prefetches fan out ~10 at a time off one category page, so it was
    // the last hot read still issuing an uncached Mongo op per request.
    // Caching `null` negative-caches 404s (see responseCache.get).
    const body = await cache.singleFlight(`product:${req.params.id}`, PRODUCTS_TTL, async () => {
      const product = await Product.findById(req.params.id).lean();
      return product ? JSON.stringify(product) : null;
    });

    if (body === null) {
      return res.status(404).send("Product not found");
    }
    res.type("application/json").send(body);
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
    notifyProductChange(updatedProduct._id);
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
    notifyProductChange(); // no id -> full-list push to open tabs
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


// ---------------------------------------------------------------------------
// Bulk price update (admin "Excel" tab).
// Body: { changes: [{ id, expected: { regular, sale, variations }, regular?, sale?, variations?: [{ index, attr, price }] }] }
//  - regular / sale: number = set, null = remove (sale only), undefined = leave as is.
//  - expected: the values the admin saw in the preview. If the product changed in the
//    meantime, that product is skipped and reported, so a stale file never overwrites
//    a newer edit.
// Only price fields are touched. One bulkWrite, one cache invalidation, one push.
// ---------------------------------------------------------------------------
const MAX_PRICE = 1000000;
const isPrice = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= MAX_PRICE;
const toNum = (v) => (v === undefined || v === null || v === "" ? null : Number(v));
const same = (a, b) => (a === null && b === null) || (a !== null && b !== null && Math.abs(a - b) < 0.005);

const bulkUpdatePrices = async (req, res) => {
  try {
    const changes = Array.isArray(req.body?.changes) ? req.body.changes : null;
    if (!changes || changes.length === 0) return res.status(400).json({ error: "no changes" });
    if (changes.length > 2000) return res.status(400).json({ error: "too many changes" });

    const ids = changes.map((c) => String(c?.id || ""));
    if (ids.some((id) => !/^[a-f0-9]{24}$/i.test(id))) return res.status(400).json({ error: "invalid product id" });

    const docs = await Product.find({ _id: { $in: ids } }, { שם: 1, "מחיר רגיל": 1, "מחיר מבצע": 1, variations: 1 }).lean();
    const byId = new Map(docs.map((d) => [String(d._id), d]));

    const ops = [];
    const skipped = [];
    for (const c of changes) {
      const doc = byId.get(String(c.id));
      if (!doc) { skipped.push({ id: c.id, reason: "המוצר לא נמצא" }); continue; }
      const exp = c.expected || {};
      const set = {};
      const unset = {};

      if (c.regular !== undefined) {
        if (!isPrice(c.regular)) { skipped.push({ id: c.id, name: doc.שם, reason: "מחיר רגיל לא תקין" }); continue; }
        if (!same(toNum(doc["מחיר רגיל"]), toNum(exp.regular))) { skipped.push({ id: c.id, name: doc.שם, reason: "המחיר השתנה מאז הייצוא" }); continue; }
        set["מחיר רגיל"] = c.regular;
      }
      if (c.sale !== undefined) {
        if (c.sale !== null && !isPrice(c.sale)) { skipped.push({ id: c.id, name: doc.שם, reason: "מחיר מבצע לא תקין" }); continue; }
        if (!same(toNum(doc["מחיר מבצע"]), toNum(exp.sale))) { skipped.push({ id: c.id, name: doc.שם, reason: "מחיר המבצע השתנה מאז הייצוא" }); continue; }
        if (c.sale === null) unset["מחיר מבצע"] = ""; else set["מחיר מבצע"] = c.sale;
      }

      if (Array.isArray(c.variations) && c.variations.length) {
        const variations = JSON.parse(JSON.stringify(doc.variations || []));
        let bad = null;
        for (const v of c.variations) {
          const target = variations[v.index];
          const attr = target && target.attributes && target.attributes[v.attr];
          if (!attr || typeof attr !== "object") { bad = "וריאציה לא נמצאה"; break; }
          const key = `${v.index}|${v.attr}`;
          if (v.price !== undefined) {
            if (!isPrice(v.price)) { bad = "מחיר וריאציה לא תקין"; break; }
            const expected = exp.variations && exp.variations[key];
            if (!same(toNum(attr.price), toNum(expected))) { bad = "מחיר הווריאציה השתנה מאז הייצוא"; break; }
            attr.price = v.price;
          }
          // Variation sale price: a number sets it, null removes it.
          if (v.sale !== undefined) {
            if (v.sale !== null && !isPrice(v.sale)) { bad = "מחיר מבצע לווריאציה לא תקין"; break; }
            const expectedSale = exp.variationSales && exp.variationSales[key];
            if (!same(toNum(attr.salePrice), toNum(expectedSale))) { bad = "מחיר המבצע של הווריאציה השתנה מאז הייצוא"; break; }
            if (v.sale === null) delete attr.salePrice; else attr.salePrice = v.sale;
          }
        }
        if (bad) { skipped.push({ id: c.id, name: doc.שם, reason: bad }); continue; }
        set.variations = variations;
      }

      if (!Object.keys(set).length && !Object.keys(unset).length) continue;
      const update = {};
      if (Object.keys(set).length) update.$set = set;
      if (Object.keys(unset).length) update.$unset = unset;
      ops.push({ updateOne: { filter: { _id: doc._id }, update } });
    }

    let updated = 0;
    if (ops.length) {
      const r = await Product.bulkWrite(ops, { ordered: false });
      updated = r.modifiedCount || 0;
      invalidateProductCaches();
      notifyProductChange(); // full-list push
    }
    console.log(`[BULK-PRICES] requested=${changes.length} updated=${updated} skipped=${skipped.length} by=${req.user?.uid || "?"}`);
    res.json({ updated, skipped });
  } catch (error) {
    console.error("[REQ-ERR] bulkUpdatePrices:", error);
    res.status(500).json({ error: "bulk update failed" });
  }
};

module.exports = {
  bulkUpdatePrices,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductsByCategory,
};
