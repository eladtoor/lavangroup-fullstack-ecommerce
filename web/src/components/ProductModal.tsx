'use client';

import { useRouter } from 'next/navigation';
import ProductDetails, { Product } from '@/components/ProductDetails';

export default function ProductModal({ product }: { product: Product }) {
  const router = useRouter();

  const handleClose = () => {
    // Check if we can go back (i.e., there's history)
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
      router.back();
    } else {
      // If coming from external source (like Google) or no history, go to home
      router.push('/');
    }
  };

  return <ProductDetails product={product} mode="modal" onClose={handleClose} />;
}


