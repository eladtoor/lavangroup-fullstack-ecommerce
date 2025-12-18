'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/lib/redux/store';
import { useEffect } from 'react';
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
  useEffect(() => {
    // Initialize Firebase auth listener
    initializeFirebaseAuth();

    // Initialize WebSocket connection
    initializeWebSocket();

    return () => {
      // Cleanup on unmount
      // Note: We keep WebSocket alive for the session
    };
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RevalidationHandler />
        {children}
      </PersistGate>
    </Provider>
  );
}
