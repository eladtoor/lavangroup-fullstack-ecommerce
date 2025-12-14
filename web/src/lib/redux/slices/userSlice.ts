import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  uid: string;
  email: string | null;
  name?: string;
  userType?: string;
  isAdmin?: boolean;
  isCreditLine?: boolean;
  [key: string]: any;
}

interface UserState {
  user: User | null;
  logoutSuccess: boolean;
}

const initialState: UserState = {
  user: null,
  logoutSuccess: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.logoutSuccess = false;
    },
    logoutUser: (state) => {
      state.user = null;
      state.logoutSuccess = true;
    },
    clearLogoutMessage: (state) => {
      state.logoutSuccess = false;
    },
  },
});

export const { setUser, logoutUser, clearLogoutMessage } = userSlice.actions;
export default userSlice.reducer;
