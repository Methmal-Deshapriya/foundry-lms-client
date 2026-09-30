"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

// Same look as the 404 page (src/app/not-found.tsx), for runtime failures —
// usually the catalog API being briefly unreachable.
export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#FAFAFA] px-5 py-16">
      <div className="w-full max-w-md text-center">
        <p className="font-alt flex items-center justify-center gap-2 text-xs font-semibold tracking-widest text-[#71717A] uppercase">
          <span className="text-[#E91717]">—</span> Something went wrong
        </p>
        <h1 className="mt-4 font-sans text-2xl font-bold tracking-tight text-balance text-[#191919] sm:text-3xl">
          We couldn&apos;t load this page
        </h1>
        <p className="font-alt mt-3 text-sm text-[#71717A]">
          The learning catalog may be temporarily unavailable. Please try again in a moment.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#191919] px-6 font-alt text-sm font-semibold text-white transition-colors hover:bg-[#27272A] sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-6 font-alt text-sm font-semibold text-[#191919] transition-colors hover:border-zinc-300 hover:bg-zinc-50 sm:w-auto"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
