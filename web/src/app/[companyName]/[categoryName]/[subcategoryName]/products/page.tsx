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
  isValidCompanySlug,
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
  seoContent?: string;
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

// Fetch products for a subcategory (for SSR)
async function fetchSubcategoryProducts(categoryName: string, subcategoryName: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/products/category/${encodeURIComponent(categoryName)}/${encodeURIComponent(subcategoryName)}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch {
    return [];
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
  // Check if company slug is valid (e.g., "tambour")
  // If not (e.g., "/construction-materials/something/something"), redirect to canonical
  const actualCompanySlug = decodeURIComponent(params.companyName || '');

  if (!isValidCompanySlug(actualCompanySlug)) {
    // Invalid company slug - treat the first segment as a category and redirect
    const realCategoryName = parseUrlParams({ categoryName: params.companyName }).categoryName;
    const realSubcategoryName = parseUrlParams({ subcategoryName: params.categoryName }).subcategoryName;
    const canonicalPath = getCategoryCanonicalPath('טמבור', realCategoryName, realSubcategoryName);
    permanentRedirect(canonicalPath);
  }

  const { categoryName, subcategoryName, companyName } = parseUrlParams(params);
  const canonicalPath = getCategoryCanonicalPath(companyName, categoryName, subcategoryName);
  const categoryPath = getCategoryCanonicalPath(companyName, categoryName);

  // Enforce canonical URL: redirect if params don't match English slugs
  if (!paramsMatchCanonical(params, companyName, categoryName, subcategoryName)) {
    permanentRedirect(canonicalPath);
  }

  // Fetch products and SEO text on server for SSR
  const [products, seoText] = await Promise.all([
    fetchSubcategoryProducts(categoryName, subcategoryName),
    fetchSubcategorySeoText(categoryName, subcategoryName)
  ]);

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
      <ProductsContent
        initialProducts={products}
        initialSeoText={seoText}
        categoryName={categoryName}
        subcategoryName={subcategoryName}
        companyName={companyName}
      />
    </>
  );
}
