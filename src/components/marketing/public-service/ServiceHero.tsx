import React from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import type { PublicServiceConfig } from "./types";

export function ServiceHero({ hero, accent }: Pick<PublicServiceConfig, "hero" | "accent">) {
  const hasIllustration = Boolean(hero.illustration);

  return (
    <Reveal
      className={`grid grid-cols-1 gap-8 items-center mb-10 sm:mb-14 ${
        hasIllustration ? "lg:grid-cols-[1.05fr_1fr] lg:gap-12" : "max-w-2xl mx-auto text-center"
      }`}
    >
      <div className={hasIllustration ? "text-left" : ""}>
        <p
          className={`font-alt flex items-center gap-2 text-sm sm:text-base font-semibold tracking-widest text-[#71717A] uppercase mb-3 ${
            hasIllustration ? "" : "justify-center"
          }`}
        >
          <span className="text-[#E91717]">—</span> {hero.eyebrow}
        </p>

        <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold text-[#191919] leading-tight tracking-tight">
          {hero.title}
          {hero.highlight && <> {hero.highlight}</>}
        </h1>

        <p className={`font-alt text-[#71717A] text-sm sm:text-base mt-4 max-w-md ${hasIllustration ? "" : "mx-auto"}`}>
          {hero.description}
        </p>

        <div className={`flex flex-wrap gap-2.5 mt-6 ${hasIllustration ? "" : "justify-center"}`}>
          {hero.indicators.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 font-alt text-xs sm:text-sm text-[#71717A] bg-zinc-100 border border-zinc-200 rounded-full px-3 py-1.5"
            >
              <Icon className={`h-3.5 w-3.5 ${accent.text}`} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {hero.illustration && (
        <div className="hidden lg:block relative">
          <Image
            src={hero.illustration.src}
            alt={hero.illustration.alt}
            width={hero.illustration.width}
            height={hero.illustration.height}
            className="w-full h-auto"
            priority
          />
        </div>
      )}
    </Reveal>
  );
}
