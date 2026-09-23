"use client";

import React from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import type { PublicServiceConfig } from "./types";

export function ServiceCta({ ctaSection, accent }: Pick<PublicServiceConfig, "ctaSection" | "accent">) {
  const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Reveal className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
      <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#191919] mb-2">{ctaSection.title}</h2>
      <p className="font-alt text-[#71717A] text-sm sm:text-base mb-6 max-w-md mx-auto">{ctaSection.description}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href="#categories"
          onClick={handleExploreClick}
          className={`inline-flex items-center justify-center h-12 px-6 rounded-full text-white font-alt text-sm sm:text-base font-semibold transition-colors ${accent.button}`}
        >
          {ctaSection.primaryLabel}
        </a>
        <Link
          href={ctaSection.secondaryHref}
          className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-zinc-200 font-alt text-sm sm:text-base font-semibold text-[#191919] hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
        >
          {ctaSection.secondaryLabel}
        </Link>
      </div>
    </Reveal>
  );
}
