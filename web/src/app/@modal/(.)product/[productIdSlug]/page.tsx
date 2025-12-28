import { notFound, permanentRedirect } from 'next/navigation';
import { fetchProductById } from '@/lib/api';
import ClientModalWrapper from '@/components/ClientModalWrapper';
import { parseProductIdSlug, slugifyProductName, isMongoObjectId } from '@/lib/product-slug';

type Props = {
  params: { productIdSlug: string };
};

export default async function ProductModalRoute({ params }: Props) {
  // TEMPORARY FIX: Disable intercepting route to prevent parallel route issues
  // The intercepting route was causing the product page to not render after redirects
  // TODO: Re-implement modal functionality with a different approach (query params or hash-based)
  return null;

  /* Original code - disabled for now
  console.log('ModalRoute - Called for:', params.productIdSlug);

  const { id, slug } = parseProductIdSlug(params.productIdSlug);
  console.log('ModalRoute - Parsed ID:', id, 'Slug:', slug);

  if (!isMongoObjectId(id)) notFound();

  let product: any;
  try {
    product = await fetchProductById(id);
  } catch {
    notFound();
  }

  if (!product || !product._id) notFound();

  const canonicalSlug = slugifyProductName(product.שם);
  console.log('ModalRoute - Canonical slug:', canonicalSlug, 'Current slug:', slug);

  if (!slug || slug !== canonicalSlug) {
    console.log('ModalRoute - Slug mismatch, returning null');
    return null;
  }

  console.log('ModalRoute - Rendering ClientModalWrapper');
  return <ClientModalWrapper product={product} />;
  */
}


