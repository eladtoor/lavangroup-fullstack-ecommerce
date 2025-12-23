const Product = require("../models/productModel");
const CategoryImage = require("../models/categoryImageModel");

const buildCategoryStructure = async (req, res) => {
  try {
    // Fetch products and category images in parallel for better performance
    const [products, categoryImages] = await Promise.all([
      Product.find(),
      CategoryImage.find(),
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
            foundSubCategory.products.push({
              ...product._doc, // שימוש בכל השדות הקיימים במוצר
            });
          });
        } else {
          // אם אין תתי קטגוריות, נוסיף את המוצרים ישירות לקטגוריה הראשית
          currentCategory.products.push({
            ...product._doc, // שימוש בכל השדות הקיימים במוצר
          });
        }
      });
    });

    // הפיכת המפה לאובייקט היררכי
    const result = Object.values(categoryMap);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in buildCategoryStructure:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  buildCategoryStructure,
};
