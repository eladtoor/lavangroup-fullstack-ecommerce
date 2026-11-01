'use client';

import { useEffect, useState } from 'react';
import { persistor } from './store';

/**
 * True once redux-persist has restored the saved state (e.g. the logged-in user) from localStorage.
 * Starts as false on both server and client, so it never causes a hydration mismatch.
 * Use it before making decisions that depend on persisted state, such as role-based redirects.
 */
export function usePersistRehydrated(): boolean {
  const [rehydrated, setRehydrated] = useState(false);

  useEffect(() => {
    const check = () => {
      if (persistor.getState().bootstrapped) setRehydrated(true);
    };
    check();
    const unsubscribe = persistor.subscribe(check);
    return unsubscribe;
  }, []);

  return rehydrated;
}
