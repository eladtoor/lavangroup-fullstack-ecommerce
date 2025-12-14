import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetails from '@/components/ProductDetails';
import ProductSchema from '@/components/ProductSchema';
import StructuredData from '@/components/StructuredData';
import { fetchProductById } from '@/lib/api';
import {
  buildProductCanonicalPath,
  isMongoObjectId,
  parseProductIdSlug,
  slugifyProductName,
} from '@/lib/product-slug';

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

  // Enforce ONE canonical URL (id + correct slug).
  if (!slug || slug !== canonicalSlug) {
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

  return (
    <main className="min-h-screen max-w-4xl mx-auto pt-32 md:pt-36 p-4 sm:p-6" dir="rtl">
      <StructuredData data={breadcrumbJsonLd} />
      <ProductSchema
        product={product}
        finalPrice={product['מחיר רגיל']}
        availability="InStock"
        url={`${baseUrl}${canonicalPath}`}
      />

      <ProductDetails product={product} mode="page" priority />
    </main>
  );
}


