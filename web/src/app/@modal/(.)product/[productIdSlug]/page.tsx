import { notFound, permanentRedirect } from 'next/navigation';
import { fetchProductById } from '@/lib/api';
import ClientModalWrapper from '@/components/ClientModalWrapper';
import { parseProductIdSlug, slugifyProductName, isMongoObjectId } from '@/lib/product-slug';

type Props = {
  params: { productIdSlug: string };
};

export default async function ProductModalRoute({ params }: Props) {
  const { id, slug } = parseProductIdSlug(params.productIdSlug);
  if (!isMongoObjectId(id)) notFound();

  let product: any;
  try {
    product = await fetchProductById(id);
  } catch {
    notFound();
  }

  if (!product || !product._id) notFound();

  // Don't redirect here - let the page route handle canonical URL redirects
  // Otherwise both routes redirect simultaneously and create a loop
  const canonicalSlug = slugifyProductName(product.שם);
  if (!slug || slug !== canonicalSlug) {
    // Wrong slug - don't render modal, let the page route redirect
    return null;
  }

  return <ClientModalWrapper product={product} />;
}


