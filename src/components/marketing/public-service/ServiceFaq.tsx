"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Reveal } from "@/components/ui/reveal";
import type { PublicServiceConfig } from "./types";

export function ServiceFaq({ faqSection, accent }: Pick<PublicServiceConfig, "faqSection" | "accent">) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="mb-16 sm:mb-24">
      <Reveal className="max-w-2xl mx-auto text-center mb-6 sm:mb-8">
        <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#191919]">{faqSection.title}</h2>
      </Reveal>

      <Reveal className="max-w-3xl mx-auto divide-y divide-zinc-200 border-t border-b border-zinc-200">
        {faqSection.items.map((item, i) => {
          const isOpen = openIndex === i;
          const panelId = `faq-panel-${i}`;
          const triggerId = `faq-trigger-${i}`;
          return (
            <div key={item.question}>
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-4 sm:py-5 text-left font-sans font-semibold text-sm sm:text-base text-[#191919] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191919]"
              >
                {item.question}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${accent.text} ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {shouldReduceMotion ? (
                isOpen && (
                  <div id={panelId} role="region" aria-labelledby={triggerId} className="pb-4 sm:pb-5 -mt-1">
                    <p className="font-alt text-sm text-[#71717A] leading-relaxed">{item.answer}</p>
                  </div>
                )
              ) : (
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="font-alt text-sm text-[#71717A] leading-relaxed pb-4 sm:pb-5 -mt-1">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
