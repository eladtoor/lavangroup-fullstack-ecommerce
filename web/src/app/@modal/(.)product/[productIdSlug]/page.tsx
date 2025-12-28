import { notFound, permanentRedirect } from 'next/navigation';
import { fetchProductById } from '@/lib/api';
import ClientModalWrapper from '@/components/ClientModalWrapper';
import { parseProductIdSlug, slugifyProductName, isMongoObjectId } from '@/lib/product-slug';

type Props = {
  params: { productIdSlug: string };
};

export default async function ProductModalRoute({ params }: Props) {
  const { id } = parseProductIdSlug(params.productIdSlug);
  if (!isMongoObjectId(id)) notFound();

  let product: any;
  try {
    product = await fetchProductById(id);
  } catch {
    notFound();
  }

  if (!product || !product._id) notFound();

  // No need to check slug here - we accept any slug as long as ID is valid
  // This prevents issues when product names change after Google indexes them
  return <ClientModalWrapper product={product} />;
}


