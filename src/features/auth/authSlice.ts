import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "./authTypes";

export type AuthStatus =
  | "unknown"
  | "authenticated"
  | "unauthenticated"
  | "unavailable";

export type AuthState = {
  user: User | null;
  status: AuthStatus;
};

const initialState: AuthState = {
  user: null,
  status: "unknown",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
    clearUser(state) {
      state.user = null;
      state.status = "unauthenticated";
    },
    setAuthUnavailable(state) {
      state.user = null;
      state.status = "unavailable";
    },
    resetAuthState(state) {
      state.user = null;
      state.status = "unknown";
    },
  },
});

export const { setUser, clearUser, setAuthUnavailable, resetAuthState } =
  authSlice.actions;
export default authSlice.reducer;
