import { Metadata } from 'next';
import { fetchCategories } from '@/lib/api';
import ProductsContent from './ProductsContent';
import StructuredData from '@/components/StructuredData';
import { parseUrlParams } from '@/lib/category-slugs';

type Props = {
  params: { companyName: string; categoryName: string; subcategoryName: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryName, subcategoryName } = parseUrlParams(params);
  
  try {
    const categoriesData = await fetchCategories();
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

    return {
      title: `${subcategoryName} - ${categoryName} | Lavangroup`,
      description: `קנה מוצרי ${subcategoryName} מתוך ${categoryName} באתר לבן גרופ. משלוחים מהירים לכל הארץ.`,
      alternates: {
        canonical: `/${params.companyName}/${params.categoryName}/${params.subcategoryName}/products`,
      },
      openGraph: {
        title: `${subcategoryName} - ${categoryName} | Lavangroup`,
        description: `קנה מוצרי ${subcategoryName} מתוך ${categoryName} באתר לבן גרופ.`,
        url: `/${params.companyName}/${params.categoryName}/${params.subcategoryName}/products`,
        images: subCategory.תמונה ? [{ url: subCategory.תמונה, width: 1200, height: 630, alt: subcategoryName }] : [{ url: '/logo.png', width: 800, height: 600, alt: 'Lavangroup' }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${subcategoryName} - ${categoryName} | Lavangroup`,
        description: `קנה מוצרי ${subcategoryName} מתוך ${categoryName} באתר לבן גרופ. משלוחים מהירים לכל הארץ.`,
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';

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
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${companyName} - ${categoryName}`,
        item: `${baseUrl}/${params.companyName}/${params.categoryName}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: subcategoryName,
        item: `${baseUrl}/${params.companyName}/${params.categoryName}/${params.subcategoryName}/products`,
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
