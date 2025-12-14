import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  unitPrice: number;
  quantity: number;
  image?: string;
  sku?: string;
  [key: string]: any;
}

interface CartState {
  cartItems: CartItem[];
}

const initialState: CartState = {
  cartItems: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;

      const existingItem = state.cartItems.find(
        (item) => item.cartItemId === newItem.cartItemId
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        state.cartItems.push({
          ...newItem,
          price: newItem.price,
          unitPrice: newItem.unitPrice,
          quantity: newItem.quantity,
        });
      }
    },

    increaseQuantity: (
      state,
      action: PayloadAction<{ cartItemId: string; amount?: number }>
    ) => {
      const { cartItemId, amount = 1 } = action.payload;

      const item = state.cartItems.find(
        (item) => item.cartItemId === cartItemId
      );

      if (item) {
        item.quantity += amount;
      }
    },

    decreaseQuantity: (
      state,
      action: PayloadAction<{ cartItemId: string; amount?: number }>
    ) => {
      const { cartItemId, amount = 1 } = action.payload;

      const item = state.cartItems.find(
        (item) => item.cartItemId === cartItemId
      );

      if (item) {
        if (item.quantity > amount) {
          item.quantity -= amount;
        } else {
          state.cartItems = state.cartItems.filter(
            (item) => item.cartItemId !== cartItemId
          );
        }
      }
    },

    removeFromCart: (
      state,
      action: PayloadAction<{ cartItemId: string }>
    ) => {
      const { cartItemId } = action.payload;

      state.cartItems = state.cartItems.filter(
        (item) => item.cartItemId !== cartItemId
      );
    },

    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.cartItems = action.payload;
    },
  },
});

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  setCartItems,
} = cartSlice.actions;

export default cartSlice.reducer;
