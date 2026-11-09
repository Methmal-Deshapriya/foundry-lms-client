import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_INTERNATIONAL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Page not found | Foundry Academy",
};

// Every unmatched URL (and every notFound() — an unknown service or course
// slug) lands here. Same visual language as the public marketing pages:
// #FAFAFA ground, house black, red used only as the accent mark.
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-3 sm:px-6">
          <Link href="/" className="font-sans text-lg font-extrabold tracking-tight">
            <span className="text-[#191919]">Foundry</span> <span className="text-[#E91717]">Academy</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-xl text-center">
          <p className="font-alt flex items-center justify-center gap-2 text-xs font-semibold tracking-widest text-[#71717A] uppercase">
            <span className="text-[#E91717]">—</span> Error 404
          </p>
          <p
            className="mt-4 font-sans text-[7rem] leading-none font-extrabold tracking-tighter text-[#191919] sm:text-[9rem]"
            aria-hidden="true"
          >
            4<span className="text-[#E91717]">0</span>4
          </p>
          <h1 className="mt-6 font-sans text-2xl font-bold tracking-tight text-balance text-[#191919] sm:text-3xl">
            This page took a wrong turn
          </h1>
          <p className="font-alt mx-auto mt-3 max-w-md text-sm text-[#71717A] sm:text-base">
            The link may be broken, or the page may have moved. Let&apos;s get you back to learning.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#191919] px-6 font-alt text-sm font-semibold text-white transition-colors hover:bg-[#27272A] sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
            <Link
              href="/#services"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-6 font-alt text-sm font-semibold text-[#191919] transition-colors hover:border-zinc-300 hover:bg-zinc-50 sm:w-auto"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              Browse our programs
            </Link>
          </div>

          <p className="font-alt mt-10 text-xs text-[#71717A]">
            Still stuck? Call or WhatsApp us on{" "}
            <a
              href={`tel:+${CONTACT_PHONE_INTERNATIONAL}`}
              className="font-semibold whitespace-nowrap text-[#191919] underline-offset-2 hover:underline"
            >
              {CONTACT_PHONE_DISPLAY}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
