import React from "react";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import type { PublicServiceConfig } from "./types";

export function ServiceProcess({
  processSection,
  accent,
}: Pick<PublicServiceConfig, "processSection" | "accent">) {
  return (
    <section className="mb-16 sm:mb-24">
      <Reveal className="max-w-2xl mb-8 sm:mb-10">
        <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#191919]">{processSection.title}</h2>
        <p className="font-alt text-sm text-[#71717A] mt-1">{processSection.description}</p>
      </Reveal>

      <Reveal stagger={0.1} className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
        {processSection.steps.map((step, i) => (
          <RevealItem
            key={step.title}
            className="relative flex md:flex-col items-start md:items-center gap-4 md:gap-0 md:text-center"
          >
            {i > 0 && (
              <>
                <span className="md:hidden absolute -top-8 left-6 -translate-x-1/2 w-px h-8 bg-zinc-200" aria-hidden="true" />
                <span className="hidden md:block absolute top-6 right-1/2 w-full h-px bg-zinc-200 -z-10" aria-hidden="true" />
              </>
            )}
            <div
              className={`relative shrink-0 h-12 w-12 rounded-full flex items-center justify-center font-sans font-bold text-white ${accent.button}`}
            >
              {i + 1}
            </div>
            <div className="md:mt-4">
              <h3 className="font-sans font-semibold text-base text-[#191919] mb-1">{step.title}</h3>
              <p className="font-alt text-sm text-[#71717A] leading-snug">{step.description}</p>
            </div>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}
