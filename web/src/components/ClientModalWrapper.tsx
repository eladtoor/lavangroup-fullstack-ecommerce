'use client';

import { useEffect, useState } from 'react';
import ProductModal from '@/components/ProductModal';
import { Product } from '@/components/ProductDetails';

export default function ClientModalWrapper({ product }: { product: Product }) {
  const [shouldRenderModal, setShouldRenderModal] = useState(false);

  useEffect(() => {
    // Only run on client side
    // Check if this was a true client-side navigation (soft navigation)
    // by checking if the navigation API has entries (meaning we navigated within the app)
    const navigationEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

    if (navigationEntries.length > 0) {
      const navigationType = navigationEntries[0].type;

      // Only show modal on 'navigate' type (client-side navigation)
      // Don't show on 'reload', 'back_forward', or initial page load
      if (navigationType === 'navigate' && window.history.length > 1) {
        // Additional check: ensure we came from the same origin
        const referrer = document.referrer;
        if (referrer && referrer.includes(window.location.host)) {
          setShouldRenderModal(true);
          return;
        }
      }
    }

    // If we get here, this is a hard navigation (from external source)
    // Don't show modal - the page route will handle rendering
    setShouldRenderModal(false);
  }, []);

  if (!shouldRenderModal) {
    return null;
  }

  return <ProductModal product={product} />;
}
