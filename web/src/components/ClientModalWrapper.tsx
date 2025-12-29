'use client';

import { useEffect, useState } from 'react';
import ProductModal from '@/components/ProductModal';
import { Product } from '@/components/ProductDetails';

export default function ClientModalWrapper({ product }: { product: Product }) {
  const [shouldRenderModal, setShouldRenderModal] = useState(false);

  useEffect(() => {
    // Use localStorage to track if user has been on the site
    // With a timestamp to auto-clear after 30 minutes
    const storageKey = 'lavangroup_visited';
    const visitData = localStorage.getItem(storageKey);
    const referrer = document.referrer;
    const currentHost = window.location.host;

    console.log('ClientModalWrapper - visitData:', visitData);
    console.log('ClientModalWrapper - referrer:', referrer);
    console.log('ClientModalWrapper - currentHost:', currentHost);

    let hasVisitedBefore = false;

    if (visitData) {
      const { timestamp } = JSON.parse(visitData);
      const thirtyMinutes = 30 * 60 * 1000;
      const isRecent = Date.now() - timestamp < thirtyMinutes;

      if (isRecent) {
        hasVisitedBefore = true;
      } else {
        // Clear old data
        localStorage.removeItem(storageKey);
      }
    }

    // Mark that we've visited the site with current timestamp
    localStorage.setItem(storageKey, JSON.stringify({ timestamp: Date.now() }));

    // Show modal if:
    // 1. User has visited before recently (indicates internal navigation)
    // 2. OR referrer is from our site (extra validation)
    const isInternalNavigation = hasVisitedBefore ||
      (referrer && referrer.includes(currentHost));

    console.log('ClientModalWrapper - hasVisitedBefore:', hasVisitedBefore);
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
