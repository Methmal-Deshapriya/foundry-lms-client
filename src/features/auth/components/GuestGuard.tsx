"use client";

import React from "react";
import { useGuestGuard } from "../hooks/useGuestGuard";
import { Loader2 } from "lucide-react";

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
      <div className="flex h-[80vh] w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#191919]" />
        <p className="mt-4 text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return <>{children}</>;
}
