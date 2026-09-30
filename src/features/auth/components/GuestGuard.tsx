"use client";

import React from "react";
import { useGuestGuard } from "../hooks/useGuestGuard";
import { LoadingStatus } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * GuestGuard Component
 *
 * Protects routes that should only be accessible to guests (e.g.
 * forgot-password, reset-password, verify-email). If the user IS
 * authenticated, it redirects them to the dashboard.
 */
export default function GuestGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthResolved, isAuthenticated } = useGuestGuard();

  // While checking or if already authenticated (before redirect happens)
  if (!isAuthResolved || isAuthenticated) {
    return (
      // A form-shaped placeholder — the sign-in/sign-up/verify screens this
      // guards are all a heading plus a short stack of fields and a button.
      <div className="flex min-h-dvh w-full items-center justify-center px-6">
        <LoadingStatus label={isAuthenticated ? "Redirecting to your dashboard…" : "Loading…"} />
        <div className="w-full max-w-sm space-y-6" aria-hidden="true">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          {[0, 1].map((key) => (
            <div key={key} className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
