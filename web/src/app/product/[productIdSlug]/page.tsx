import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetails from '@/components/ProductDetails';
import ProductSchema from '@/components/ProductSchema';
import StructuredData from '@/components/StructuredData';
import Breadcrumbs from '@/components/Breadcrumbs';
import { fetchProductById, fetchCategories } from '@/lib/api';
import {
  buildProductCanonicalPath,
  isMongoObjectId,
  parseProductIdSlug,
  slugifyProductName,
} from '@/lib/product-slug';
import { buildCategoryUrl } from '@/lib/category-slugs';

type Props = {
  params: { productIdSlug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';
  const { id } = parseProductIdSlug(params.productIdSlug);

  if (!isMongoObjectId(id)) {
    return { title: 'מוצר לא נמצא | Lavangroup', robots: { index: false, follow: true } };
  }

  try {
    const product = await fetchProductById(id);
    if (!product || !product._id) {
      return { title: 'מוצר לא נמצא | Lavangroup', robots: { index: false, follow: true } };
    }

    const canonicalPath = buildProductCanonicalPath(product);
    const title = `${product.שם} | Lavangroup`;
    const description =
      product['תיאור קצר'] ||
      product['תיאור'] ||
      `קנה את ${product.שם} באתר לבן גרופ. משלוחים מהירים לכל הארץ.`;
    const image = product.תמונות || '/logo.png';

    return {
      title,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title,
        description,
        url: canonicalPath,
        images: [{ url: image, width: 1200, height: 630, alt: product.שם }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
      // If slug mismatches, the page will 308 to canonical anyway; this keeps indexing clean.
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return { title: 'מוצר לא נמצא | Lavangroup', robots: { index: false, follow: true } };
  }
}

export default async function ProductPage({ params }: Props) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';
  const { id, slug } = parseProductIdSlug(params.productIdSlug);

  if (!isMongoObjectId(id)) notFound();

  let product: any;
  try {
    product = await fetchProductById(id);
  } catch {
    notFound();
  }

  if (!product || !product._id) notFound();

  const canonicalSlug = slugifyProductName(product.שם);
  const canonicalPath = `/product/${product._id}-${canonicalSlug}`;

  // NOTE: We don't redirect for slug mismatches anymore to prevent redirect loops
  // This happens when product names change after Google indexes them
  // The canonical URL is still set in metadata for SEO
  // Only redirect if there's NO slug at all
  if (!slug) {
    permanentRedirect(canonicalPath);
  }

  // Build breadcrumb schema from breadcrumb items
  let breadcrumbJsonLd = {
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
        name: product.שם,
        item: `${baseUrl}${canonicalPath}`,
      },
    ],
  };

  // Build full breadcrumb path by finding which category contains this product
  const breadcrumbItems = [{ label: 'דף הבית', href: '/' }];

  try {
    const categoriesData = await fetchCategories();
    const categories: any[] = Array.isArray(categoriesData)
      ? categoriesData
      : Object.values(categoriesData || {});

    // Find which category and subcategory this product belongs to
    let foundProduct = false;
    for (const category of categories) {
      // Check if product is in main category products
      if (category.products?.some((p: any) => p._id === product._id || p.productId === product._id)) {
        breadcrumbItems.push({
          label: category.categoryName,
          href: buildCategoryUrl('טמבור', category.categoryName),
        });
        foundProduct = true;
        break;
      }

      // Check subcategories
      if (category.subCategories && Array.isArray(category.subCategories)) {
        for (const subcategory of category.subCategories) {
          if (subcategory.products?.some((p: any) => p._id === product._id || p.productId === product._id)) {
            breadcrumbItems.push({
              label: category.categoryName,
              href: buildCategoryUrl('טמבור', category.categoryName),
            });
            breadcrumbItems.push({
              label: subcategory.subCategoryName,
              href: buildCategoryUrl('טמבור', category.categoryName, subcategory.subCategoryName),
            });
            foundProduct = true;
            break;
          }
        }
        if (foundProduct) break;
      }
    }
  } catch (error) {
    console.error('Error fetching categories for breadcrumbs:', error);
  }

  // Add product name as final breadcrumb
  breadcrumbItems.push({ label: product.שם });

  // Update breadcrumb schema with full path
  breadcrumbJsonLd.itemListElement = breadcrumbItems.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: item.href ? `${baseUrl}${item.href}` : `${baseUrl}${canonicalPath}`,
  }));

  return (
    <main className="min-h-screen max-w-6xl mx-auto pt-36 md:pt-40 pb-12 px-4 sm:px-6" dir="rtl">
      <StructuredData data={breadcrumbJsonLd} />
      <ProductSchema
        product={product}
        finalPrice={product['מחיר רגיל']}
        availability="InStock"
        url={`${baseUrl}${canonicalPath}`}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <ProductDetails product={product} mode="page" priority />
    </main>
  );
}


