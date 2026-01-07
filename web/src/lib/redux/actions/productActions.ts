import { AppDispatch } from '../store';
import { Product } from '../reducers/productReducer';
import { getWebSocket } from '@/lib/websocket';
import { adminPost, adminPut, adminDelete } from '@/utils/adminApi';

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Fetch Products from Server
export const fetchProducts = () => async (dispatch: AppDispatch) => {
  dispatch({ type: 'FETCH_PRODUCTS_REQUEST' });

  try {
    const response = await fetch(`${getBaseUrl()}/api/products/getAll`);
    const data: Product[] = await response.json();

    dispatch({ type: 'FETCH_PRODUCTS_SUCCESS', payload: data });

    if (typeof window !== 'undefined') {
      localStorage.setItem('products', JSON.stringify(data));
      localStorage.setItem('productsLastFetched', String(Date.now()));
    }
  } catch (error) {
    console.error('❌ FetchProducts Failed:', error);
    dispatch({
      type: 'FETCH_PRODUCTS_FAILURE',
      payload: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Cache duration: 5 minutes (reduced from 30 for better freshness)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Maybe Fetch Products (with improved caching)
export const maybeFetchProducts = (forceRefresh = false) => async (dispatch: AppDispatch) => {
  if (typeof window === 'undefined') {
    // On server, just fetch fresh data
    return dispatch(fetchProducts());
  }

  const cached = localStorage.getItem('products');
  const lastFetched = localStorage.getItem('productsLastFetched');

  const isExpired =
    !lastFetched || Date.now() - Number(lastFetched) > CACHE_DURATION;

  // Always show cached data immediately for better UX
  if (cached && !forceRefresh) {
    dispatch({
      type: 'SET_PRODUCTS_FROM_STORAGE',
      payload: JSON.parse(cached),
    });
  }

  // Fetch fresh data if expired or forced
  if (!cached || isExpired || forceRefresh) {
    dispatch(fetchProducts());
  }
};

// Revalidate products when user returns to page (focus/visibility)
export const revalidateProductsOnFocus = () => async (dispatch: AppDispatch) => {
  if (typeof window === 'undefined') return;

  const lastFetched = localStorage.getItem('productsLastFetched');
  if (!lastFetched) return;

  const timeSinceLastFetch = Date.now() - Number(lastFetched);
  // Revalidate if cache is older than 2 minutes (stale-while-revalidate pattern)
  if (timeSinceLastFetch > 2 * 60 * 1000) {
    // Fetch in background without blocking UI
    dispatch(fetchProducts());
  }
};

// Create a New Product (Admin only - uses authenticated request)
export const createProduct = (newProductData: Partial<Product>) => async (dispatch: AppDispatch) => {
  dispatch({ type: 'CREATE_PRODUCT_REQUEST' });

  try {
    // Use authenticated POST for admin operations
    const response = await adminPost('/api/products/create', newProductData);

    const data = await response.json();

    if (response.ok) {
      dispatch({ type: 'CREATE_PRODUCT_SUCCESS', payload: data });

      // Notify WebSocket to update all users
      const socket = getWebSocket();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'REQUEST_PRODUCTS_UPDATE' }));
        socket.send(JSON.stringify({ type: 'REQUEST_CATEGORIES_UPDATE' }));
      }
    } else {
      throw new Error(data.message || 'Failed to create product');
    }
  } catch (error) {
    console.error('❌ CreateProduct Failed:', error);
    dispatch({
      type: 'CREATE_PRODUCT_FAILURE',
      payload: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update a Product (Admin only - uses authenticated request)
export const updateProduct = (updatedProduct: any) => async (dispatch: AppDispatch) => {
  dispatch({ type: 'UPDATE_PRODUCT_REQUEST' });

  try {
    // Use authenticated PUT for admin operations
    const response = await adminPut(`/api/products/update/${updatedProduct._id}`, updatedProduct);

    const data = await response.json();

    if (response.ok) {
      dispatch({ type: 'UPDATE_PRODUCT_SUCCESS', payload: data });

      // Notify WebSocket to update all users with the specific product ID
      const socket = getWebSocket();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'REQUEST_PRODUCT_UPDATE',
          productId: updatedProduct._id
        }));
        socket.send(JSON.stringify({ type: 'REQUEST_CATEGORIES_UPDATE' }));
      }
    } else {
      throw new Error(data.message || 'Failed to update product');
    }
  } catch (error) {
    console.error('❌ UpdateProduct Failed:', error);
    dispatch({
      type: 'UPDATE_PRODUCT_FAILURE',
      payload: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete a Product (Admin only - uses authenticated request)
export const deleteProduct = (id: string) => async (dispatch: AppDispatch) => {
  dispatch({ type: 'DELETE_PRODUCT_REQUEST' });

  try {
    // Use authenticated DELETE for admin operations
    const response = await adminDelete(`/api/products/delete/${id}`);

    if (response.ok) {
      dispatch({ type: 'DELETE_PRODUCT_SUCCESS', payload: id });

      // Notify WebSocket to update all users
      const socket = getWebSocket();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'REQUEST_PRODUCTS_UPDATE' }));
        socket.send(JSON.stringify({ type: 'REQUEST_CATEGORIES_UPDATE' }));
      }
    } else {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete product');
    }
  } catch (error) {
    console.error('❌ DeleteProduct Failed:', error);
    dispatch({
      type: 'DELETE_PRODUCT_FAILURE',
      payload: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update products list (from WebSocket)
export const updateProductsList = (products: Product[]) => ({
  type: 'UPDATE_PRODUCTS_LIST',
  payload: products,
});
