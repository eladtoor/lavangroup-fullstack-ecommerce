import { AppDispatch } from '../store';
import { Product } from '../reducers/productReducer';
import { getWebSocket } from '@/lib/websocket';

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

// Maybe Fetch Products (with caching)
export const maybeFetchProducts = () => async (dispatch: AppDispatch) => {
  if (typeof window === 'undefined') {
    // On server, just fetch fresh data
    return dispatch(fetchProducts());
  }

  const cached = localStorage.getItem('products');
  const lastFetched = localStorage.getItem('productsLastFetched');

  const isExpired =
    !lastFetched || Date.now() - Number(lastFetched) > 30 * 60 * 1000; // 30 minutes

  if (cached) {
    dispatch({
      type: 'SET_PRODUCTS_FROM_STORAGE',
      payload: JSON.parse(cached),
    });
  }

  if (!cached || isExpired) {
    dispatch(fetchProducts());
  }
};

// Create a New Product
export const createProduct = (newProductData: Partial<Product>) => async (dispatch: AppDispatch) => {
  dispatch({ type: 'CREATE_PRODUCT_REQUEST' });

  try {
    const response = await fetch(`${getBaseUrl()}/api/products/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProductData),
    });

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

// Update a Product
export const updateProduct = (updatedProduct: any) => async (dispatch: AppDispatch) => {
  dispatch({ type: 'UPDATE_PRODUCT_REQUEST' });

  try {
    const response = await fetch(`${getBaseUrl()}/api/products/update/${updatedProduct._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct),
    });

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

// Delete a Product
export const deleteProduct = (id: string) => async (dispatch: AppDispatch) => {
  dispatch({ type: 'DELETE_PRODUCT_REQUEST' });

  try {
    const response = await fetch(`${getBaseUrl()}/api/products/delete/${id}`, {
      method: 'DELETE',
    });

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
