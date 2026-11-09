import type { RootState } from "@/store/store";

export const selectAuthState = (state: RootState) => state.auth;

export const selectAuthUser = (state: RootState) => state.auth.user;

export const selectAuthStatus = (state: RootState) => state.auth.status;

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.status === "authenticated";

export const selectIsAuthResolved = (state: RootState) =>
  state.auth.status !== "unknown";

export const selectAuthRole = (state: RootState) => state.auth.user?.role ?? null;

