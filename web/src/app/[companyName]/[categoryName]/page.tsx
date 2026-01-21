import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { fetchCategories } from '@/lib/api';
import CategoryContent from './CategoryContent';
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
  params: { companyName: string; categoryName: string };
};

// Fetch SEO text for a category
async function fetchCategorySeoText(categoryName: string): Promise<{
  seoTitle?: string;
  seoDescription?: string;
} | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/category-seo-text/${encodeURIComponent(categoryName)}`,
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
  const { categoryName, companyName } = parseUrlParams(params);
  const canonicalUrl = getCategoryCanonicalUrl(companyName, categoryName);
  const canonicalPath = getCategoryCanonicalPath(companyName, categoryName);

  try {
    // Fetch categories and SEO text in parallel
    const [categoriesData, seoText] = await Promise.all([
      fetchCategories(),
      fetchCategorySeoText(categoryName)
    ]);

    const categories: any[] = Array.isArray(categoriesData)
      ? categoriesData
      : Object.values(categoriesData || {});

    const category = categories.find((c: any) => c.categoryName === categoryName);

    if (!category) {
      return {
        title: 'קטגוריה לא נמצאה | Lavangroup',
        robots: {
          index: false,
        }
      };
    }

    // Use SEO text from database if available, otherwise fallback to default
    const title = seoText?.seoTitle || `${categoryName} | Lavangroup`;
    const description = seoText?.seoDescription || `מוצרים בקטגוריה ${categoryName} באתר לבן גרופ. מגוון רחב של חומרי בניין ושיפוצים.`;

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
        type: 'website',
        images: category.תמונה ? [{ url: category.תמונה, width: 1200, height: 630, alt: categoryName }] : [{ url: '/logo.png', width: 800, height: 600, alt: 'Lavangroup' }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: category.תמונה ? [category.תמונה] : ['/logo.png'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: `${categoryName} | Lavangroup`,
    };
  }
}

export default async function Page({ params }: Props) {
  // Check if company slug is valid (e.g., "tambour")
  // If not (e.g., "/construction-materials/construction-materials"), redirect to canonical
  const actualCompanySlug = decodeURIComponent(params.companyName || '');

  if (!isValidCompanySlug(actualCompanySlug)) {
    // Invalid company slug - treat the first segment as a category and redirect to /tambour/category
    // The "categoryName" in the URL is actually the real category
    const realCategoryName = parseUrlParams({ categoryName: params.companyName }).categoryName;
    const canonicalPath = getCategoryCanonicalPath('טמבור', realCategoryName);
    permanentRedirect(canonicalPath);
  }

  const { categoryName, companyName } = parseUrlParams(params);
  const canonicalPath = getCategoryCanonicalPath(companyName, categoryName);

  // Enforce canonical URL: redirect if params don't match English slugs
  if (!paramsMatchCanonical(params, companyName, categoryName)) {
    permanentRedirect(canonicalPath);
  }

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
        item: `${CANONICAL_BASE_URL}${canonicalPath}`,
      },
    ],
  };

  return (
    <>
      <StructuredData data={breadcrumbJsonLd} />
      <CategoryContent />
    </>
  );
}
