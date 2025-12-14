'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/lib/redux/store';
import { useEffect } from 'react';
import { initializeFirebaseAuth } from '@/lib/firebase';
import { initializeWebSocket } from '@/lib/websocket';

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
        {children}
      </PersistGate>
    </Provider>
  );
}
