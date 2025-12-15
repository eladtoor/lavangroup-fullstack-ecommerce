'use client';

import { store } from './redux/store';

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
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
    reconnectAttempts = 0; // Reset on successful connection
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
    
    if (!isProd) {
      console.log('🔴 WebSocket Disconnected', event.code, event.reason);
    }
    
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
  if (socket) {
    socket.close();
    socket = null;
  }
};
