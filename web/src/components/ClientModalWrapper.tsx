'use client';

import { useEffect, useState } from 'react';
import ProductModal from '@/components/ProductModal';
import { Product } from '@/components/ProductDetails';

export default function ClientModalWrapper({ product }: { product: Product }) {
  const [shouldRenderModal, setShouldRenderModal] = useState(false);

  useEffect(() => {
    console.log('ClientModalWrapper - useEffect running');
    // Only run on client side
    // Check if this was a true client-side navigation (soft navigation)
    // by checking if the navigation API has entries (meaning we navigated within the app)
    const navigationEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

    console.log('ClientModalWrapper - Navigation entries:', navigationEntries.length);

    if (navigationEntries.length > 0) {
      const navigationType = navigationEntries[0].type;
      console.log('ClientModalWrapper - Navigation type:', navigationType);
      console.log('ClientModalWrapper - History length:', window.history.length);
      console.log('ClientModalWrapper - Referrer:', document.referrer);

      // Only show modal on 'navigate' type (client-side navigation)
      // Don't show on 'reload', 'back_forward', or initial page load
      if (navigationType === 'navigate' && window.history.length > 1) {
        // Additional check: ensure we came from the same origin
        const referrer = document.referrer;
        if (referrer && referrer.includes(window.location.host)) {
          console.log('ClientModalWrapper - Setting shouldRenderModal to TRUE');
          setShouldRenderModal(true);
          return;
        }
      }
    }

    // If we get here, this is a hard navigation (from external source)
    // Don't show modal - the page route will handle rendering
    console.log('ClientModalWrapper - Setting shouldRenderModal to FALSE');
    setShouldRenderModal(false);
  }, []);

  console.log('ClientModalWrapper - Rendering, shouldRenderModal:', shouldRenderModal);

  if (!shouldRenderModal) {
    return null;
  }

  return <ProductModal product={product} />;
}
