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
  const headersList = await headers();
  const referer = headersList.get('referer');
  const host = headersList.get('host');

  // Debug logging
  console.log('Modal Route - Referer:', referer);
  console.log('Modal Route - Host:', host);
  console.log('Modal Route - User Agent:', headersList.get('user-agent'));

  // Only render modal if navigating from within our own site (soft navigation)
  // If no referer or referer is external, don't show modal
  const isSoftNavigation = referer && host && referer.includes(host);

  console.log('Modal Route - Is soft navigation:', isSoftNavigation);

  if (!isSoftNavigation) {
    console.log('Modal Route - Returning null (not rendering modal)');
    return null;
  }

  console.log('Modal Route - Rendering modal');

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


