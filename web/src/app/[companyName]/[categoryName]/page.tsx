import { Metadata } from 'next';
import { fetchCategories } from '@/lib/api';
import CategoryContent from './CategoryContent';
import StructuredData from '@/components/StructuredData';
import { parseUrlParams } from '@/lib/category-slugs';

type Props = {
  params: { companyName: string; categoryName: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryName, companyName } = parseUrlParams(params);
  
  try {
    const categoriesData = await fetchCategories();
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

    return {
      title: `${categoryName} | Lavangroup`,
      description: `מוצרים בקטגוריה ${categoryName} באתר לבן גרופ. מגוון רחב של חומרי בניין ושיפוצים.`,
      alternates: {
        canonical: `/${params.companyName}/${params.categoryName}`,
      },
      openGraph: {
        title: `${categoryName} | Lavangroup`,
        description: `מוצרים בקטגוריה ${categoryName} באתר לבן גרופ.`,
        url: `/${params.companyName}/${params.categoryName}`,
        type: 'website',
        images: category.תמונה ? [{ url: category.תמונה, width: 1200, height: 630, alt: categoryName }] : [{ url: '/logo.png', width: 800, height: 600, alt: 'Lavangroup' }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${categoryName} | Lavangroup`,
        description: `מוצרים בקטגוריה ${categoryName} באתר לבן גרופ. מגוון רחב של חומרי בניין ושיפוצים.`,
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
  const { categoryName, companyName } = parseUrlParams(params);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'בית',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${companyName} - ${categoryName}`,
        item: `${baseUrl}/${params.companyName}/${params.categoryName}`,
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
