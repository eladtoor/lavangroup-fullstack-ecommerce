const Product = require("../models/productModel");
const CategoryImage = require("../models/categoryImageModel");

// In-memory cache for categories (avoids rebuilding on every request)
let categoryCache = {
  nav: null,         // Lightweight navigation data
  full: null,        // Full data with products
  lastUpdated: null,
  ttl: 5 * 60 * 1000 // 5 minutes cache
};

// Check if cache is valid
const isCacheValid = (type) => {
  return categoryCache[type] &&
         categoryCache.lastUpdated &&
         (Date.now() - categoryCache.lastUpdated) < categoryCache.ttl;
};

// Invalidate cache (call this when products/categories change)
const invalidateCategoryCache = () => {
  categoryCache.nav = null;
  categoryCache.full = null;
  categoryCache.lastUpdated = null;
};

// Lightweight endpoint - returns only category names and structure (NO products)
// Use this for navigation, dropdowns, and initial page load
const getCategoriesNav = async (req, res) => {
  try {
    // Return cached data if valid
    if (isCacheValid('nav')) {
      return res.status(200).json(categoryCache.nav);
    }

    // Fetch only the categories field from products (much faster!)
    const [products, categoryImages] = await Promise.all([
      Product.find({}, { "קטגוריות": 1 }).lean(), // Only fetch category field
      CategoryImage.find().lean(),
    ]);

    if (!products || products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    // Build category image map
    const categoryImageMap = {};
    categoryImages.forEach((catImg) => {
      categoryImageMap[catImg.name] = catImg.image;
    });

    const categoryMap = {};

    products.forEach((product) => {
      const categories = product["קטגוריות"];
      if (!categories) return;

      const categoryPaths = categories.split(",");

      categoryPaths.forEach((categoryPath) => {
        const categoryParts = categoryPath.split(">");
        const mainCategory = categoryParts[0].trim();
        const subCategories = categoryParts.slice(1).map((sub) => sub.trim());

        if (!categoryMap[mainCategory]) {
          categoryMap[mainCategory] = {
            categoryName: mainCategory,
            categoryImage: categoryImageMap[mainCategory] || null,
            subCategories: [],
          };
        }

        if (subCategories.length > 0) {
          subCategories.forEach((subCategory) => {
            let foundSubCategory = categoryMap[mainCategory].subCategories.find(
              (sc) => sc.subCategoryName === subCategory
            );
            if (!foundSubCategory) {
              const imageKey = `${mainCategory} - ${subCategory}`;
              categoryMap[mainCategory].subCategories.push({
                subCategoryName: subCategory,
                categoryImage: categoryImageMap[imageKey] || null,
              });
            }
          });
        }
      });
    });

    const result = Object.values(categoryMap);

    // Cache the result
    categoryCache.nav = result;
    categoryCache.lastUpdated = Date.now();

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getCategoriesNav:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const buildCategoryStructure = async (req, res) => {
  try {
    // Return cached data if valid
    if (isCacheValid('full')) {
      return res.status(200).json(categoryCache.full);
    }

    // Fetch products and category images in parallel for better performance
    // Use .lean() for faster queries (returns plain JS objects instead of Mongoose docs)
    const [products, categoryImages] = await Promise.all([
      Product.find().lean(),
      CategoryImage.find().lean(),
    ]);

    if (!products || products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    // Create a map of category images for quick lookup
    // Format: { "categoryName": "imageUrl", "categoryName - subCategoryName": "imageUrl" }
    const categoryImageMap = {};
    categoryImages.forEach((catImg) => {
      categoryImageMap[catImg.name] = catImg.image;
    });

    const categoryMap = {};

    products.forEach((product) => {
      const categories = product["קטגוריות"]; // וודא שהמפתח הוא בעברית כפי שמופיע ב-JSON
      if (!categories) {
        return;
      }

      const categoryPaths = categories.split(","); // מחלק לפי פסיקים לקטגוריות שונות

      categoryPaths.forEach((categoryPath) => {
        const categoryParts = categoryPath.split(">"); // מפצל לפי '>'
        const mainCategory = categoryParts[0].trim(); // קטגוריה ראשית
        const subCategories = categoryParts.slice(1).map((sub) => sub.trim()); // תתי קטגוריות

        // אם הקטגוריה הראשית לא קיימת, ניצור אותה במפה
        if (!categoryMap[mainCategory]) {
          categoryMap[mainCategory] = {
            categoryName: mainCategory,
            categoryImage: categoryImageMap[mainCategory] || null,
            subCategories: [],
            products: [], // רשימה למוצרים בקטגוריה הראשית (ללא תתי קטגוריות)
          };
        }

        let currentCategory = categoryMap[mainCategory];

        // אם יש תתי קטגוריות, נוסיף מוצרים לתתי קטגוריות
        if (subCategories.length > 0) {
          subCategories.forEach((subCategory) => {
            let foundSubCategory = currentCategory.subCategories.find(
              (sc) => sc.subCategoryName === subCategory
            );
            if (!foundSubCategory) {
              const imageKey = `${mainCategory} - ${subCategory}`;
              foundSubCategory = {
                subCategoryName: subCategory,
                categoryImage: categoryImageMap[imageKey] || null,
                products: [],
              };
              currentCategory.subCategories.push(foundSubCategory);
            }

            // הוספת המוצר לתוך תת הקטגוריה עם כל השדות של המוצר
            foundSubCategory.products.push(product); // lean() returns plain objects
          });
        } else {
          // אם אין תתי קטגוריות, נוסיף את המוצרים ישירות לקטגוריה הראשית
          currentCategory.products.push(product); // lean() returns plain objects
        }
      });
    });

    // הפיכת המפה לאובייקט היררכי
    const result = Object.values(categoryMap);

    // Cache the result
    categoryCache.full = result;
    categoryCache.lastUpdated = Date.now();

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in buildCategoryStructure:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  buildCategoryStructure,
  getCategoriesNav,
  invalidateCategoryCache,
};
