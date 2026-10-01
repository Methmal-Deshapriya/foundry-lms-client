"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { getDashboardPath } from "@/lib/access";
import { selectAuthRole, selectIsAuthenticated, selectIsAuthResolved } from "../authSelectors";
import { withEnrollIntent } from "@/lib/enrollIntent";

/**
 * useGuestGuard
 *
 * Redirects to the role-appropriate dashboard once the session resolves as
 * authenticated. Shared by GuestGuard (wraps forgot-password/reset-password/
 * verify-email/sign-in/sign-up routes) and the home page itself, which
 * isn't nested under GuestGuard's route group.
 */
export function useGuestGuard({ enabled = true }: { enabled?: boolean } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAuthResolved = useAppSelector(selectIsAuthResolved);
  const role = useAppSelector(selectAuthRole);

  useEffect(() => {
    if (enabled && isAuthResolved && isAuthenticated) {
      router.replace(withEnrollIntent(getDashboardPath(role), searchParams));
    }
  }, [enabled, isAuthenticated, isAuthResolved, role, router, searchParams]);

  return { isAuthResolved, isAuthenticated };
}
