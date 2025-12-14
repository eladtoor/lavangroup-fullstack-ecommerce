'use client';

import { store } from './redux/store';

let socket: WebSocket | null = null;
const isProd = process.env.NODE_ENV === 'production';

export const initializeWebSocket = () => {
  // Prevent multiple connections
  if (socket && socket.readyState === WebSocket.OPEN) {
    if (!isProd) console.log('WebSocket already connected');
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
    // WebSocket connected successfully
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

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

      if (message.type === 'CATEGORIES_UPDATED') {
        const formattedCategories = {
          companyName: 'טמבור',
          companyCategories: message.payload,
        };

        store.dispatch({
          type: 'SET_CATEGORIES',
          payload: formattedCategories,
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('categories', JSON.stringify(formattedCategories));
        }
      }
    } catch (error) {
      console.error('❌ WebSocket Message Error:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('❌ WebSocket Error:', error);
  };

  socket.onclose = () => {
    if (!isProd) console.log('🔴 WebSocket Disconnected');
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      if (!isProd) console.log('🔄 Attempting to reconnect WebSocket...');
      initializeWebSocket();
    }, 5000);
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
