import React from "react";
import Image from "next/image";

/**
 * Shared full-screen composition for every authentication route. Forms own
 * their width and state; this shell owns the responsive white/image split.
 */
export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh w-full grid-cols-1 bg-white lg:grid-cols-2">
      <main className="flex min-h-dvh flex-col items-center justify-center overflow-y-auto p-6 sm:p-10">
        {children}
      </main>

      <div className="relative hidden lg:block" aria-hidden="true">
        <Image
          src="/side1.png"
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 0px"
          className="object-cover"
          priority
        />
        <div className="pointer-events-none absolute inset-0 bg-black/20" />
      </div>
    </div>
  );
}
