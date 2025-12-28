'use client';

import { useEffect, useState } from 'react';
import ProductModal from '@/components/ProductModal';
import { Product } from '@/components/ProductDetails';

export default function ClientModalWrapper({ product }: { product: Product }) {
  const [shouldRenderModal, setShouldRenderModal] = useState(false);

  useEffect(() => {
    // Simple detection: check if we came from the same site
    // For hard navigation from external sources (Google, direct URL), document.referrer will be external or empty
    // For client-side navigation within the app, referrer will be from our domain
    const referrer = document.referrer;
    const currentHost = window.location.host;

    // Show modal if:
    // 1. There's a referrer AND it's from our own site
    // 2. OR if there's browser history (meaning user navigated within the site)
    const isInternalNavigation =
      (referrer && referrer.includes(currentHost)) ||
      (window.history.length > 2 && !referrer.includes('google'));

    if (isInternalNavigation) {
      setShouldRenderModal(true);
    } else {
      setShouldRenderModal(false);
    }
  }, []);

  if (!shouldRenderModal) {
    return null;
  }

  return <ProductModal product={product} />;
}
