"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  selectAuthStatus,
  selectIsAuthenticated,
  selectIsAuthResolved,
} from "../authSelectors";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";

/**
 * AuthenticatedGuard Component
 *
 * Protects routes that require a user to be logged in.
 * If the user is NOT authenticated, it redirects them to the sign-in
 * section on the landing page.
 */
export default function AuthenticatedGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const authStatus = useAppSelector(selectAuthStatus);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAuthResolved = useAppSelector(selectIsAuthResolved);

  useEffect(() => {
    // If we've checked the session and the user is NOT authenticated
    if (isAuthResolved && !isAuthenticated) {
      router.replace("/sign-in");
    }
  }, [isAuthenticated, isAuthResolved, router]);

  if (authStatus === "unavailable") {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center px-6 text-center">
        <WifiOff className="h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">Unable to reach the server</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          The dashboard cannot verify your session because the Foundry LMS API
          is unavailable. Start the backend server, then try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" />
          Retry connection
        </button>
      </div>
    );
  }

  // While checking or if not authenticated (before redirect happens)
  if (!isAuthResolved || !isAuthenticated) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#191919]" />
        <p className="mt-4 text-muted-foreground">Checking authorization...</p>
      </div>
    );
  }

  return <>{children}</>;
}
