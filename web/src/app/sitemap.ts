import { MetadataRoute } from 'next';
import { fetchAllProducts, fetchCategories } from '@/lib/api';
import { buildCategoryUrl, CANONICAL_BASE_URL } from '@/lib/category-slugs';
import { buildProductCanonicalPath } from '@/lib/product-slug';

// Generate sitemap at runtime, not build time
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Regenerate every hour

type SubCategory = {
  subCategoryName: string;
  [key: string]: any;
};

type Category = {
  categoryName: string;
  subCategories?: SubCategory[];
  [key: string]: any;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Always use canonical www URL for sitemap
  const baseUrl = CANONICAL_BASE_URL;
  
  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/delivery-days`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  try {
    // Dynamic routes
    // Note: Assuming 'טמבור' is the default company name as seen in categoryActions.ts
    // If multiple companies are supported, this logic needs to be updated to fetch companies first.
    const companyName = 'טמבור'; 
    const categoriesData = await fetchCategories();
    
    // categoriesData might be an array or object based on API response
    // categoryActions.ts treats it as array then wraps in object
    const categories: Category[] = Array.isArray(categoriesData) 
      ? categoriesData 
      : Object.values(categoriesData || {});

    const categoryRoutes: MetadataRoute.Sitemap = [];

    categories.forEach((category) => {
      if (!category.categoryName) return;

      // Category Page
      const categoryUrl = buildCategoryUrl(companyName, category.categoryName);
      categoryRoutes.push({
        url: `${baseUrl}${categoryUrl}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });

      // Subcategory Pages
      if (category.subCategories && Array.isArray(category.subCategories)) {
        category.subCategories.forEach((subCategory) => {
          if (!subCategory.subCategoryName) return;

          const subcategoryUrl = buildCategoryUrl(companyName, category.categoryName, subCategory.subCategoryName);
          categoryRoutes.push({
            url: `${baseUrl}${subcategoryUrl}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        });
      }
    });

    // Product pages (indexable)
    // Note: If you have a LOT of products, consider capping or generating sitemap index files.
    const productRoutes: MetadataRoute.Sitemap = [];
    try {
      const productsData = await fetchAllProducts();
      const productsArray: any[] = Array.isArray(productsData) ? productsData : Object.values(productsData || {});

      // Basic cap to avoid producing a massive sitemap response.
      const MAX_PRODUCTS_IN_SITEMAP = 5000;
      productsArray.slice(0, MAX_PRODUCTS_IN_SITEMAP).forEach((product) => {
        if (!product?._id) return;
        if (!product?.שם) return;
        productRoutes.push({
          url: `${baseUrl}${buildProductCanonicalPath(product)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      });
    } catch (e) {
      console.error('Error generating product routes for sitemap:', e);
    }

    return [...routes, ...categoryRoutes, ...productRoutes];

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return routes;
  }
}

