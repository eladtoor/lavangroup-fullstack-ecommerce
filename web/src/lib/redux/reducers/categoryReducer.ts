export interface Category {
  name: string;
  subcategories: Subcategory[];
  [key: string]: any;
}

export interface Subcategory {
  name: string;
  products?: any[];
  [key: string]: any;
}

export interface CategoryStructure {
  companyName: string;
  companyCategories: Category[];
}

interface CategoryState {
  categories: CategoryStructure | Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
};

type CategoryAction =
  | { type: "SET_CATEGORIES"; payload: CategoryStructure | Category[] }
  | { type: "FETCH_CATEGORIES_REQUEST" }
  | { type: "FETCH_CATEGORIES_SUCCESS"; payload: CategoryStructure | Category[] }
  | { type: "FETCH_CATEGORIES_FAILURE"; payload: string }
  | { type: "SET_CATEGORIES_FROM_STORAGE"; payload: CategoryStructure | Category[] };

const categoryReducer = (
  state = initialState,
  action: CategoryAction
): CategoryState => {
  switch (action.type) {
    case "SET_CATEGORIES":
      return {
        ...state,
        categories: action.payload,
        loading: false,
        error: null,
      };
    case "FETCH_CATEGORIES_REQUEST":
      return {
        ...state,
        loading: true,
      };
    case "FETCH_CATEGORIES_SUCCESS":
      return {
        ...state,
        loading: false,
        categories: action.payload,
      };
    case "FETCH_CATEGORIES_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case "SET_CATEGORIES_FROM_STORAGE":
      return {
        ...state,
        categories: action.payload,
      };

    default:
      return state;
  }
};

export default categoryReducer;
