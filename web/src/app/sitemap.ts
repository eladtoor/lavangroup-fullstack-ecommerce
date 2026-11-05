import { MetadataRoute } from 'next';
import { ARTICLES } from '@/content/articles';
import { unstable_cache } from 'next/cache';
import { fetchAllProducts, fetchCategories } from '@/lib/api';
import { buildCategoryUrl, CANONICAL_BASE_URL } from '@/lib/category-slugs';
import { buildProductCanonicalPath } from '@/lib/product-slug';

// Generate sitemap at runtime, not build time. This must stay force-dynamic:
// the Render build runs `npm run build` before the server process exists, so a
// statically generated sitemap would fetch an API that isn't listening yet.
export const dynamic = 'force-dynamic';

// A route-level `revalidate` is ignored under force-dynamic, so every hit used
// to refetch the whole catalog and rebuild up to 5000 URLs. Cache the data
// instead — same hourly refresh, without giving up runtime generation.
const getSitemapData = unstable_cache(
  async () => {
    const [categoriesData, productsData] = await Promise.all([
      fetchCategories(),
      fetchAllProducts().catch(() => null), // products are optional; categories are not
    ]);
    return { categoriesData, productsData };
  },
  ['sitemap-data'],
  { revalidate: 3600 }
);

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
      url: `${baseUrl}/lavan-group`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/lavan-group/poland`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...['/contact', '/soil-testing', '/real-estate-poland', '/real-estate-germany'].map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...ARTICLES.map((a) => ({
      url: `${baseUrl}/articles/${a.slug}`,
      lastModified: new Date(a.datePublished),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
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
    const { categoriesData, productsData } = await getSitemapData();

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

