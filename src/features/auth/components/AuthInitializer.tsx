"use client";

import React, { useEffect } from "react";
import { useGetMeQuery } from "../authApi";
import { useAppDispatch } from "@/store/hooks";
import { setUser, clearUser, setAuthUnavailable } from "../authSlice";
import { isNormalizedApiError } from "@/lib/api";

/**
 * AuthInitializer Component
 *
 * This component is responsible for "bootstrapping" the authentication state.
 * It calls the /auth/me endpoint once on app load to check if a valid session
 * cookie exists.
 *
 * This runs in the background. Protected layouts own their loading state, so
 * public pages do not wait for the API before rendering.
 */
export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  // 1. Trigger the /auth/me query
  // We use skip: false (default) so it runs on mount.
  // RTK Query handles the caching, so this won't re-run unnecessarily.
  const { data, error, isSuccess, isError } = useGetMeQuery(
    undefined,
    {
      // We want to ensure it always tries to fetch on first load
      refetchOnMountOrArgChange: true,
    },
  );

  useEffect(() => {
    if (isSuccess && data) {
      // Session found
      dispatch(setUser(data));
    } else if (isError) {
      if (
        isNormalizedApiError(error) &&
        (error.status === 401 || error.status === 403 || error.status === 404)
      ) {
        // No session, an expired cookie, or a session whose user no longer
        // exists — getMeService intentionally throws a 404 NotFoundError
        // for the latter case (see auth.service.js), not a 401/403, so it
        // has to be recognized here too or it gets misread as the API
        // being unreachable.
        dispatch(clearUser());
      } else {
        // Keep infrastructure failures distinct from a signed-out session so
        // protected routes can explain the problem instead of spinning forever.
        dispatch(setAuthUnavailable());
      }
    }
  }, [data, error, isSuccess, isError, dispatch]);

  return <>{children}</>;
}
