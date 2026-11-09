import React from "react";
import { Reveal } from "@/components/ui/reveal";
import { ThumbnailFallback } from "@/components/ui/thumbnail-fallback";
import { useFallbackImage } from "@/hooks/use-fallback-image";
import type { PublicServiceConfig } from "./types";

function HeroIllustration({ illustration, label }: { illustration: NonNullable<PublicServiceConfig["hero"]["illustration"]>; label: string }) {
  const image = useFallbackImage(illustration.src, illustration.fallbackSrc);
  if (!image) return <ThumbnailFallback label={label} className="rounded-2xl" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external, admin-supplied R2 URL (or a locally bundled fallback) with unknown dimensions; next/image needs both a domain allowlist and known dimensions
    <img
      src={image.src}
      alt={image.src === illustration.fallbackSrc ? (illustration.fallbackAlt ?? illustration.alt) : illustration.alt}
      onError={image.onError}
      className="w-full h-auto rounded-2xl object-cover"
    />
  );
}

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
          <HeroIllustration illustration={hero.illustration} label={hero.eyebrow} />
        </div>
      )}
    </Reveal>
  );
}
