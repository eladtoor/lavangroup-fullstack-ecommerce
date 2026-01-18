import { AppDispatch } from '../store';
import { CategoryStructure, Category } from '../reducers/categoryReducer';

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Fetch Categories from Server (lightweight - for navigation only)
export const fetchCategories = () => async (dispatch: AppDispatch) => {
  dispatch({ type: 'FETCH_CATEGORIES_REQUEST' });

  try {
    // Use lightweight endpoint - only category names, no products (much faster!)
    const response = await fetch(`${getBaseUrl()}/api/categories/nav`);

    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('❌ Server returned non-JSON response', await response.text());
      return;
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn('⚠️ Empty categories received, ignoring update.');
      return;
    }

    // API returns an array directly, save it as array
    // The reducer accepts both CategoryStructure and Category[]
    const newData: CategoryStructure | Category[] = Array.isArray(data) 
      ? data  // Save as array directly
      : {
          companyName: 'טמבור',
          companyCategories: data,
        };

    if (typeof window !== 'undefined') {
      localStorage.setItem('categories', JSON.stringify(newData));
      localStorage.setItem('categoriesLastFetched', String(Date.now()));
    }

    dispatch({ type: 'FETCH_CATEGORIES_SUCCESS', payload: newData });
  } catch (error) {
    console.error('❌ Error Fetching Categories:', error);
    dispatch({
      type: 'FETCH_CATEGORIES_FAILURE',
      payload: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Cache duration: 5 minutes (reduced from 30 for better freshness)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Maybe Fetch Categories (with improved caching)
export const maybeFetchCategories = (forceRefresh = false) => async (dispatch: AppDispatch) => {
  if (typeof window === 'undefined') {
    // On server, just fetch fresh data
    return dispatch(fetchCategories());
  }

  const cached = localStorage.getItem('categories');
  const lastFetched = localStorage.getItem('categoriesLastFetched');

  const isExpired =
    !lastFetched || Date.now() - Number(lastFetched) > CACHE_DURATION;

  // Always show cached data immediately for better UX
  if (cached && !forceRefresh) {
    dispatch({
      type: 'SET_CATEGORIES_FROM_STORAGE',
      payload: JSON.parse(cached),
    });
  }

  // Fetch fresh data if expired or forced
  if (!cached || isExpired || forceRefresh) {
    dispatch(fetchCategories());
  }
};

// Revalidate categories when user returns to page (focus/visibility)
export const revalidateCategoriesOnFocus = () => async (dispatch: AppDispatch) => {
  if (typeof window === 'undefined') return;

  const lastFetched = localStorage.getItem('categoriesLastFetched');
  if (!lastFetched) return;

  const timeSinceLastFetch = Date.now() - Number(lastFetched);
  // Revalidate if cache is older than 2 minutes (stale-while-revalidate pattern)
  if (timeSinceLastFetch > 2 * 60 * 1000) {
    // Fetch in background without blocking UI
    dispatch(fetchCategories());
  }
};

// Set categories (from WebSocket)
export const setCategories = (categories: CategoryStructure) => ({
  type: 'SET_CATEGORIES',
  payload: categories,
});
