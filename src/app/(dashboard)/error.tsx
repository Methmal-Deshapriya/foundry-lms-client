"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard route failed", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">We couldn&apos;t load this dashboard page</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your data was not changed. Try loading the page again.
        </p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}

