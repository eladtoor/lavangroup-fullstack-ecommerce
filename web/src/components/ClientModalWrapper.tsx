'use client';

import { useEffect, useState } from 'react';
import ProductModal from '@/components/ProductModal';
import { Product } from '@/components/ProductDetails';

export default function ClientModalWrapper({ product }: { product: Product }) {
  const [shouldRenderModal, setShouldRenderModal] = useState(false);

  useEffect(() => {
    // Use sessionStorage to track if user has been on the site
    // This persists across client-side navigations but clears when browser is closed
    const hasVisitedBefore = sessionStorage.getItem('hasVisited');
    const referrer = document.referrer;
    const currentHost = window.location.host;

    console.log('ClientModalWrapper - hasVisitedBefore:', hasVisitedBefore);
    console.log('ClientModalWrapper - referrer:', referrer);
    console.log('ClientModalWrapper - currentHost:', currentHost);

    // Mark that we've visited the site
    sessionStorage.setItem('hasVisited', 'true');

    // Show modal if:
    // 1. User has visited before in this session (indicates internal navigation)
    // 2. AND referrer is from our site (extra validation)
    const isInternalNavigation = hasVisitedBefore === 'true' ||
      (referrer && referrer.includes(currentHost));

    console.log('ClientModalWrapper - isInternalNavigation:', isInternalNavigation);

    if (isInternalNavigation) {
      setShouldRenderModal(true);
    } else {
      setShouldRenderModal(false);
    }
  }, []);

  console.log('ClientModalWrapper - shouldRenderModal:', shouldRenderModal);

  if (!shouldRenderModal) {
    return null;
  }

  return <ProductModal product={product} />;
}
