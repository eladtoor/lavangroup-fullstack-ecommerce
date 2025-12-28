'use client';

import { useRouter } from 'next/navigation';
import ProductDetails, { Product } from '@/components/ProductDetails';

export default function ProductModal({ product }: { product: Product }) {
  const router = useRouter();
  return <ProductDetails product={product} mode="modal" onClose={() => router.back()} />;
}


