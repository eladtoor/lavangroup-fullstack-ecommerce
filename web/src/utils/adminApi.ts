/**
 * Admin API Utilities
 * Provides authenticated fetch functions for admin operations
 */

import { auth } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Get the current user's Firebase ID token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.error('No authenticated user');
      return null;
    }

    const token = await user.getIdToken(true); // Force refresh to get fresh token
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Make an authenticated API request
 * Automatically adds the Authorization header with Firebase ID token
 */
export const adminFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated. Please log in again.');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle auth errors
  if (response.status === 401) {
    throw new Error('Session expired. Please log in again.');
  }

  if (response.status === 403) {
    throw new Error('Access denied. Admin privileges required.');
  }

  return response;
};

/**
 * GET request with authentication
 */
export const adminGet = async (endpoint: string): Promise<Response> => {
  return adminFetch(endpoint, { method: 'GET' });
};

/**
 * POST request with authentication
 */
export const adminPost = async (endpoint: string, data: any): Promise<Response> => {
  return adminFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request with authentication
 */
export const adminPut = async (endpoint: string, data: any): Promise<Response> => {
  return adminFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request with authentication
 */
export const adminDelete = async (endpoint: string): Promise<Response> => {
  return adminFetch(endpoint, { method: 'DELETE' });
};
