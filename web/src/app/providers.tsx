'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/lib/redux/store';
import { useEffect, useCallback } from 'react';
import { initializeFirebaseAuth } from '@/lib/firebase';
import { initializeWebSocket } from '@/lib/websocket';
import { revalidateProductsOnFocus } from '@/lib/redux/actions/productActions';
import { revalidateCategoriesOnFocus } from '@/lib/redux/actions/categoryActions';

// Loading skeleton for PersistGate - prevents blank screen during hydration
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* NavBar skeleton */}
      <div className="h-16 bg-white shadow-sm animate-pulse" />
      {/* Content skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

function RevalidationHandler() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to tab - revalidate if needed
        store.dispatch(revalidateProductsOnFocus());
        store.dispatch(revalidateCategoriesOnFocus());
      }
    };

    const handleFocus = () => {
      // User returned to window - revalidate if needed
      store.dispatch(revalidateProductsOnFocus());
      store.dispatch(revalidateCategoriesOnFocus());
    };

    // Listen to visibility changes (tab switch)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen to window focus (browser switch)
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Defer non-critical initialization to after page is interactive
  const deferredInit = useCallback(() => {
    // Initialize Firebase auth listener (deferred to not block FID)
    initializeFirebaseAuth();

    // Initialize WebSocket connection (deferred to not block initial load)
    initializeWebSocket();
  }, []);

  useEffect(() => {
    // Clean up old modal localStorage key (removed modal feature)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lavangroup_visited');
    }

    // Defer heavy initialization until after page is interactive
    // This improves FID (First Input Delay) significantly
    if ('requestIdleCallback' in window) {
      // Use requestIdleCallback for browsers that support it
      const idleId = requestIdleCallback(deferredInit, { timeout: 2000 });
      return () => cancelIdleCallback(idleId);
    } else {
      // Fallback: defer with setTimeout for Safari and older browsers
      const timeoutId = setTimeout(deferredInit, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [deferredInit]);

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSkeleton />} persistor={persistor}>
        <RevalidationHandler />
        {children}
      </PersistGate>
    </Provider>
  );
}
