import React from "react";
import Image from "next/image";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_INTERNATIONAL } from "@/lib/contact";

/**
 * Shared full-screen composition for every authentication route. Forms own
 * their width and state; this shell owns the responsive white/image split.
 */
export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh w-full grid-cols-1 bg-white lg:grid-cols-2">
      <main className="flex min-h-dvh flex-col items-center overflow-y-auto p-6 sm:p-10">
        {/* The form stays centered in the space above; the help line sits
            at the bottom, out of the way but always visible. */}
        <div className="flex w-full flex-1 flex-col items-center justify-center">{children}</div>
        <p className="mt-8 text-center font-alt text-xs text-[#71717A]">
          Having trouble? Call or WhatsApp us on{" "}
          <a
            href={`tel:+${CONTACT_PHONE_INTERNATIONAL}`}
            className="font-semibold whitespace-nowrap text-[#191919] underline-offset-2 hover:underline"
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
        </p>
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
