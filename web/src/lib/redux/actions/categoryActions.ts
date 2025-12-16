import { AppDispatch } from '../store';
import { CategoryStructure, Category } from '../reducers/categoryReducer';

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Fetch Categories from Server
export const fetchCategories = () => async (dispatch: AppDispatch) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('categoriesLastFetched', String(Date.now()));
  }

  dispatch({ type: 'FETCH_CATEGORIES_REQUEST' });

  try {
    const response = await fetch(`${getBaseUrl()}/api/categories`);

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

// Maybe Fetch Categories (with caching)
export const maybeFetchCategories = () => async (dispatch: AppDispatch) => {
  if (typeof window === 'undefined') {
    // On server, just fetch fresh data
    return dispatch(fetchCategories());
  }

  const cached = localStorage.getItem('categories');
  const lastFetched = localStorage.getItem('categoriesLastFetched');

  const isExpired =
    !lastFetched || Date.now() - Number(lastFetched) > 30 * 60 * 1000; // 30 minutes

  if (cached) {
    dispatch({
      type: 'SET_CATEGORIES_FROM_STORAGE',
      payload: JSON.parse(cached),
    });
  }

  if (!cached || isExpired) {
    dispatch(fetchCategories());
  }
};

// Set categories (from WebSocket)
export const setCategories = (categories: CategoryStructure) => ({
  type: 'SET_CATEGORIES',
  payload: categories,
});
