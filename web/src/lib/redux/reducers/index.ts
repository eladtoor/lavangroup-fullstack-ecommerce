import { combineReducers } from "redux";
import userReducer from "../slices/userSlice";
import productReducer from "./productReducer";
import categoryReducer from "./categoryReducer";
import cartReducer from "../slices/cartSlice";

const rootReducer = combineReducers({
  user: userReducer,
  products: productReducer,
  categories: categoryReducer,
  cart: cartReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
