import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { fetchCategories } from '@/lib/api';
import ProductsContent from './ProductsContent';
import StructuredData from '@/components/StructuredData';
import {
  parseUrlParams,
  getCategoryCanonicalPath,
  getCategoryCanonicalUrl,
  paramsMatchCanonical,
  CANONICAL_BASE_URL,
} from '@/lib/category-slugs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Props = {
  params: { companyName: string; categoryName: string; subcategoryName: string };
};

// Fetch SEO text for a subcategory
async function fetchSubcategorySeoText(categoryName: string, subcategoryName: string): Promise<{
  seoTitle?: string;
  seoDescription?: string;
} | null> {
  try {
    // Naming convention: "category - subcategory"
    const seoName = `${categoryName} - ${subcategoryName}`;
    const response = await fetch(
      `${API_BASE_URL}/api/category-seo-text/${encodeURIComponent(seoName)}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    if (response.ok) {
      return response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryName, subcategoryName, companyName } = parseUrlParams(params);
  const canonicalUrl = getCategoryCanonicalUrl(companyName, categoryName, subcategoryName);
  const canonicalPath = getCategoryCanonicalPath(companyName, categoryName, subcategoryName);

  try {
    // Fetch categories and SEO text in parallel
    const [categoriesData, seoText] = await Promise.all([
      fetchCategories(),
      fetchSubcategorySeoText(categoryName, subcategoryName)
    ]);

    const categories: any[] = Array.isArray(categoriesData)
      ? categoriesData
      : Object.values(categoriesData || {});

    const category = categories.find((c: any) => c.categoryName === categoryName);

    if (!category) {
      return { title: 'קטגוריה לא נמצאה | Lavangroup' };
    }

    const subCategory = category.subCategories?.find(
      (s: any) => s.subCategoryName === subcategoryName
    );

    if (!subCategory) {
      return { title: 'תת קטגוריה לא נמצאה | Lavangroup' };
    }

    // Use SEO text from database if available, otherwise fallback to default
    const title = seoText?.seoTitle || `${subcategoryName} - ${categoryName} | Lavangroup`;
    const description = seoText?.seoDescription || `קנה מוצרי ${subcategoryName} מתוך ${categoryName} באתר לבן גרופ. משלוחים מהירים לכל הארץ.`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalPath,
        images: subCategory.תמונה ? [{ url: subCategory.תמונה, width: 1200, height: 630, alt: subcategoryName }] : [{ url: '/logo.png', width: 800, height: 600, alt: 'Lavangroup' }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: subCategory.תמונה ? [subCategory.תמונה] : ['/logo.png'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: `${subcategoryName} | Lavangroup`,
    };
  }
}

export default async function Page({ params }: Props) {
  const { categoryName, subcategoryName, companyName } = parseUrlParams(params);
  const canonicalPath = getCategoryCanonicalPath(companyName, categoryName, subcategoryName);
  const categoryPath = getCategoryCanonicalPath(companyName, categoryName);

  // Enforce canonical URL: redirect if params don't match English slugs
  if (!paramsMatchCanonical(params, companyName, categoryName, subcategoryName)) {
    permanentRedirect(canonicalPath);
  }

  // Fetch data for Schema Markup
  let products: any[] = [];
  try {
    const categoriesData = await fetchCategories();
    const categories: any[] = Array.isArray(categoriesData) 
      ? categoriesData 
      : Object.values(categoriesData || {});
    
    const category = categories.find((c: any) => c.categoryName === categoryName);
    const subCategory = category?.subCategories?.find(
      (s: any) => s.subCategoryName === subcategoryName
    );
    if (subCategory) {
      products = subCategory.products || [];
    }
  } catch (e) {
    console.error('Error fetching data for schema:', e);
  }

  // Breadcrumb Schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'בית',
        item: CANONICAL_BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${companyName} - ${categoryName}`,
        item: `${CANONICAL_BASE_URL}${categoryPath}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: subcategoryName,
        item: `${CANONICAL_BASE_URL}${canonicalPath}`,
      },
    ],
  };

  // ItemList Schema (Products)
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.שם,
        description: product['תיאור'] || product['תיאור קצר'] || product.שם,
        image: product.תמונות || undefined,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'ILS',
          price: product['מחיר רגיל'] || 0,
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };

  return (
    <>
      <StructuredData data={breadcrumbJsonLd} />
      {products.length > 0 && <StructuredData data={itemListJsonLd} />}
      <ProductsContent />
    </>
  );
}
