/**
 * Category Mapper Utility
 * 
 * Fetches categories from server and creates a clean map
 * of categories and subcategories without products
 */

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface CategoryMap {
  [categoryName: string]: {
    subCategories: string[];
  };
}

/**
 * Fetch all categories from server and create a clean map
 */
export async function fetchCategoryMap(): Promise<CategoryMap> {
  try {
    // Use lightweight endpoint - no products included (much faster!)
    const response = await fetch(`${getBaseUrl()}/api/categories/nav`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle both array and object structures
    const categoriesArray = Array.isArray(data) ? data : Object.values(data);
    
    const categoryMap: CategoryMap = {};
    
    categoriesArray.forEach((category: any) => {
      if (!category.categoryName) return;
      
      const categoryName = category.categoryName;
      const subCategories = (category.subCategories || []).map(
        (sub: any) => sub.subCategoryName || sub.name || ''
      ).filter((name: string) => name); // Remove empty names
      
      categoryMap[categoryName] = {
        subCategories,
      };
    });
    
    return categoryMap;
  } catch (error) {
    console.error('Error fetching category map:', error);
    throw error;
  }
}

/**
 * Print category map in a readable format
 */
export function printCategoryMap(map: CategoryMap): void {
  console.log('\n📋 Category Map:');
  console.log('='.repeat(50));
  
  Object.entries(map).forEach(([categoryName, data]) => {
    console.log(`\n📁 ${categoryName}`);
    if (data.subCategories.length > 0) {
      data.subCategories.forEach((subName, index) => {
        console.log(`   ${index + 1}. ${subName}`);
      });
    } else {
      console.log('   (no subcategories)');
    }
  });
  
  console.log('\n' + '='.repeat(50));
}

/**
 * Generate TypeScript map code for category-slugs.ts
 */
export function generateSlugMapCode(map: CategoryMap): string {
  let code = '  // Auto-generated category mappings\n';
  
  Object.entries(map).forEach(([categoryName, data]) => {
    // Add main category
    const categorySlug = categoryName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    
    code += `  '${categoryName}': '${categorySlug}',\n`;
    
    // Add subcategories
    if (data.subCategories.length > 0) {
      code += `  // Sub-Categories for "${categoryName}"\n`;
      data.subCategories.forEach((subName) => {
        const subSlug = subName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '');
        code += `  '${subName}': '${subSlug}',\n`;
      });
    }
  });
  
  return code;
}

