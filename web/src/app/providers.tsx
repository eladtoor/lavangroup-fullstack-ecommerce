'use client';

import { Provider } from 'react-redux';
import { store, INITIAL_STATE } from '@/lib/redux/store';
import { useEffect, useCallback } from 'react';
import { initializeFirebaseAuth } from '@/lib/firebase';
import { initializeWebSocket } from '@/lib/websocket';
import { revalidateProductsOnFocus } from '@/lib/redux/actions/productActions';
import { revalidateCategoriesOnFocus } from '@/lib/redux/actions/categoryActions';

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
    // No PersistGate: it rendered a skeleton on the server, so pages reached search engines without
    // their content. Children now render immediately; persisted state (user, product/category cache)
    // rehydrates in the background. The cart is not persisted (it is loaded from Firestore per user).
    // Guards that depend on the persisted user wait for rehydration via usePersistRehydrated().
    <Provider store={store} serverState={INITIAL_STATE}>
      <RevalidationHandler />
      {children}
    </Provider>
  );
}
