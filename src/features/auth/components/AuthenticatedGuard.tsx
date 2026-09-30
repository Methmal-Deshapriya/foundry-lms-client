"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  selectAuthStatus,
  selectIsAuthenticated,
  selectIsAuthResolved,
} from "../authSelectors";
import { RefreshCw, WifiOff } from "lucide-react";
import { CardGridSkeleton, LoadingStatus } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

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
      <DashboardShellSkeleton />
    );
  }

  return <>{children}</>;
}

// The dashboard frame (sidebar, top bar, a page's worth of blocks) drawn in
// skeleton while the session is verified — so the real shell swaps in over
// the same layout instead of replacing a centered spinner.
function DashboardShellSkeleton() {
  return (
    <div className="fixed inset-0 flex bg-[#FAFAFA]">
      <LoadingStatus label="Checking authorization…" />
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-border bg-background p-4 md:flex" aria-hidden="true">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton key={key} className="h-7 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col" aria-hidden="true">
        <div className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-4 md:px-8">
          <Skeleton className="size-7" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 space-y-6 overflow-hidden p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-16 w-full" />
            ))}
          </div>
          <CardGridSkeleton count={3} className="hidden grid-cols-3 gap-4 lg:grid" />
        </div>
      </div>
    </div>
  );
}
