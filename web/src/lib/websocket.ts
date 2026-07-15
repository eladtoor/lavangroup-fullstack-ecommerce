'use client';

import { store } from './redux/store';

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
let stableTimer: ReturnType<typeof setTimeout> | null = null;
const maxReconnectAttempts = 10;
// How long a socket must stay open before we call it healthy and reset backoff.
const STABLE_AFTER_MS = 30000;
const isProd = process.env.NODE_ENV === 'production';

export const initializeWebSocket = () => {
  // Prevent multiple connections
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    if (!isProd) console.log('WebSocket already connected or connecting');
    return socket;
  }

  const getWsBaseUrl = () => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) return wsUrl;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return apiUrl.startsWith('https')
      ? apiUrl.replace('https', 'wss')
      : apiUrl.replace('http', 'ws');
  };

  socket = new WebSocket(getWsBaseUrl());

  socket.onopen = () => {
    // Only treat the connection as healthy once it has STAYED up for a while.
    // Resetting immediately on open meant a socket that opened and then died
    // reset the counter every cycle, so the backoff never grew past its first
    // step and maxReconnectAttempts was unreachable — an endless 1s reconnect
    // loop. Clear the timer on close so a short-lived socket keeps its count.
    stableTimer = setTimeout(() => {
      reconnectAttempts = 0;
      stableTimer = null;
    }, STABLE_AFTER_MS);
    if (!isProd) console.log('🟢 WebSocket Connected');
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      // Handle full products update
      if (message.type === 'PRODUCTS_UPDATED') {
        if (message.payload.length) {
          store.dispatch({
            type: 'UPDATE_PRODUCTS_LIST',
            payload: message.payload,
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem('products', JSON.stringify(message.payload));
          }
        } else {
          if (!isProd) console.warn('⚠️ WebSocket: Received empty products list, ignoring update.');
        }
      }

      // Handle single product change (optimized)
      if (message.type === 'PRODUCT_CHANGED') {
        const changedProduct = message.payload;
        if (changedProduct && changedProduct._id) {
          // Get current products
          const state = store.getState();
          const currentProducts = state.products?.products || [];
          
          // Update or add the changed product
          const productIndex = currentProducts.findIndex((p: any) => p._id === changedProduct._id);
          let updatedProducts;
          
          if (productIndex >= 0) {
            // Update existing product
            updatedProducts = [...currentProducts];
            updatedProducts[productIndex] = changedProduct;
          } else {
            // Add new product
            updatedProducts = [...currentProducts, changedProduct];
          }
          
          store.dispatch({
            type: 'UPDATE_PRODUCTS_LIST',
            payload: updatedProducts,
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem('products', JSON.stringify(updatedProducts));
          }
          
          if (!isProd) console.log('✅ Product updated:', changedProduct.שם);
        }
      }

      // Handle categories update
      if (message.type === 'CATEGORIES_UPDATED') {
        // Support both old and new formats
        const categories = Array.isArray(message.payload) 
          ? message.payload 
          : message.payload;

        store.dispatch({
          type: 'SET_CATEGORIES',
          payload: categories,
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('categories', JSON.stringify(categories));
        }
      }
    } catch (error) {
      console.error('❌ WebSocket Message Error:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('❌ WebSocket Error:', error);
  };

  socket.onclose = (event) => {
    socket = null;

    if (stableTimer) {
      clearTimeout(stableTimer);
      stableTimer = null;
    }

    if (!isProd) {
      console.log('🔴 WebSocket Disconnected', event.code, event.reason);
    }

    // 1000 = normal closure (e.g. the page is going away). Reconnecting from it
    // just churns: the old code reconnected on every close regardless of code.
    if (event.code === 1000) return;

    // Exponential backoff reconnection
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30 seconds
      reconnectAttempts++;
      
      if (!isProd) {
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
      }
      
      setTimeout(() => {
        initializeWebSocket();
      }, delay);
    } else {
      console.error('❌ WebSocket: Max reconnection attempts reached');
    }
  };

  return socket;
};

export const getWebSocket = () => socket;

export const closeWebSocket = () => {
  if (stableTimer) {
    clearTimeout(stableTimer);
    stableTimer = null;
  }
  if (socket) {
    socket.close(1000); // normal closure — onclose won't schedule a reconnect
    socket = null;
  }
};
