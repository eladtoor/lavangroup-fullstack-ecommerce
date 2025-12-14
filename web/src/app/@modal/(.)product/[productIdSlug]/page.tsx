import { notFound, permanentRedirect } from 'next/navigation';
import { fetchProductById } from '@/lib/api';
import ProductModal from '@/components/ProductModal';
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

  const canonicalSlug = slugifyProductName(product.שם);
  if (!slug || slug !== canonicalSlug) {
    permanentRedirect(`/product/${product._id}-${canonicalSlug}`);
  }

  return <ProductModal product={product} />;
}


