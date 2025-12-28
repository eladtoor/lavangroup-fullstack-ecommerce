import { notFound, permanentRedirect } from 'next/navigation';
import { headers } from 'next/headers';
import { fetchProductById } from '@/lib/api';
import ProductModal from '@/components/ProductModal';
import { parseProductIdSlug, slugifyProductName, isMongoObjectId } from '@/lib/product-slug';

type Props = {
  params: { productIdSlug: string };
};

export default async function ProductModalRoute({ params }: Props) {
  // Check if this is a hard navigation (direct access from external source)
  // Modal should only render on soft navigation (client-side routing within the app)
  const headersList = headers();
  const referer = headersList.get('referer');
  const host = headersList.get('host');

  // If no referer or referer is from external domain, don't render modal
  // This prevents modal from showing when accessing directly from Google, bookmarks, etc.
  if (!referer || !host || !referer.includes(host)) {
    return null;
  }

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
  if (!slug || slug !== canonicalSlug) {
    permanentRedirect(`/product/${product._id}-${canonicalSlug}`);
  }

  return <ProductModal product={product} />;
}


