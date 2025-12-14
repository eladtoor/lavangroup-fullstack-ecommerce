export interface Product {
  _id: string;
  מזהה: number;
  סוג: 'simple' | 'variable';
  'מק"ט': string;
  שם: string;
  'תיאור קצר'?: string;
  תיאור?: string;
  'מחיר רגיל': number;
  'מחיר מבצע'?: number;
  קטגוריות: string;
  תמונות?: string; // Image URL (Cloudinary) - Hebrew field name
  quantities?: number[];
  materialGroup?: string;
  variations?: any[];
  allowComments?: boolean;
  [key: string]: any;
}

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
};

type ProductAction =
  | { type: "FETCH_PRODUCTS_REQUEST" }
  | { type: "FETCH_PRODUCTS_SUCCESS"; payload: Product[] }
  | { type: "FETCH_PRODUCTS_FAILURE"; payload: string }
  | { type: "CREATE_PRODUCT_REQUEST" }
  | { type: "CREATE_PRODUCT_SUCCESS"; payload: Product }
  | { type: "CREATE_PRODUCT_FAILURE"; payload: string }
  | { type: "SET_PRODUCTS_FROM_STORAGE"; payload: Product[] }
  | { type: "DELETE_PRODUCT_REQUEST" }
  | { type: "DELETE_PRODUCT_SUCCESS"; payload: string }
  | { type: "DELETE_PRODUCT_FAILURE"; payload: string }
  | { type: "UPDATE_PRODUCT_REQUEST" }
  | { type: "UPDATE_PRODUCT_SUCCESS"; payload: Product }
  | { type: "UPDATE_PRODUCTS_LIST"; payload: Product[] }
  | { type: "UPDATE_PRODUCT_FAILURE"; payload: string };

const productReducer = (
  state = initialState,
  action: ProductAction
): ProductState => {
  switch (action.type) {
    case "FETCH_PRODUCTS_REQUEST":
      return { ...state, loading: true };

    case "FETCH_PRODUCTS_SUCCESS":
      if (typeof window !== 'undefined') {
        localStorage.setItem("products", JSON.stringify(action.payload));
      }
      return { ...state, loading: false, products: action.payload };

    case "FETCH_PRODUCTS_FAILURE":
      return { ...state, loading: false, error: action.payload };

    case "CREATE_PRODUCT_REQUEST":
      return { ...state, loading: true };

    case "CREATE_PRODUCT_SUCCESS":
      const newProductList = [...state.products, action.payload];
      if (typeof window !== 'undefined') {
        localStorage.setItem("products", JSON.stringify(newProductList));
      }
      return { ...state, loading: false, products: newProductList };

    case "CREATE_PRODUCT_FAILURE":
      return { ...state, loading: false, error: action.payload };

    case "SET_PRODUCTS_FROM_STORAGE":
      return { ...state, products: action.payload };

    case "DELETE_PRODUCT_REQUEST":
      return { ...state, loading: true };

    case "DELETE_PRODUCT_SUCCESS":
      const updatedProductList = state.products.filter(
        (product) => product._id !== action.payload
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem("products", JSON.stringify(updatedProductList));
      }
      return { ...state, loading: false, products: updatedProductList };

    case "DELETE_PRODUCT_FAILURE":
      return { ...state, loading: false, error: action.payload };

    case "UPDATE_PRODUCT_REQUEST":
      return { ...state, loading: true };

    case "UPDATE_PRODUCT_SUCCESS":
      const modifiedProducts = state.products.map((product) =>
        product._id === action.payload._id ? action.payload : product
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem("products", JSON.stringify(modifiedProducts));
      }
      return { ...state, loading: false, products: modifiedProducts };

    case "UPDATE_PRODUCTS_LIST":
      const filteredProducts = action.payload.map((product) => {
        if (!product['מחיר רגיל'] || product['מחיר רגיל'] === 0) {
          return state.products.find((p) => p._id === product._id) || product;
        }
        return product;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem("products", JSON.stringify(filteredProducts));
      }
      return {
        ...state,
        products: filteredProducts,
      };

    case "UPDATE_PRODUCT_FAILURE":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export default productReducer;
