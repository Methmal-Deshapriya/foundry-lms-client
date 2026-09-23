import React from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Star } from "lucide-react";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import type { PublicServiceConfig } from "./types";

export function ServiceCategoryGrid({
  categorySection,
}: Pick<PublicServiceConfig, "categorySection" | "accent">) {
  if (categorySection.items.length === 0) {
    return (
      <section id="categories" className="mb-16 scroll-mt-20 sm:mb-24">
        <Reveal className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center sm:px-10 sm:py-16">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-[#191919]">
            <BookOpen className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-sans text-xl font-bold text-[#191919] sm:text-2xl">
            Courses are coming soon
          </h2>
          <p className="mx-auto mt-2 max-w-lg font-alt text-sm leading-relaxed text-[#71717A] sm:text-base">
            We&apos;re preparing the first courses for this service.
            Please check back soon for updates.
          </p>
        </Reveal>
      </section>
    );
  }

  return (
    <section id="categories" className="mb-16 sm:mb-24 scroll-mt-20">
      <Reveal stagger={0.08} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {categorySection.items.map((item) => {
          const Icon = item.icon;
          return (
            <RevealItem key={item.id}>
              <Link
                href={item.href}
                className="group relative flex flex-col h-full bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 transition-all hover:border-zinc-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191919]"
              >
                {item.badge && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 font-alt text-[10px] font-semibold text-[#C91414] bg-[#FFF1F1] rounded-full px-2 py-0.5">
                    <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                    {item.badge}
                  </span>
                )}

                <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 bg-zinc-100 text-[#191919]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <h3 className="font-sans font-semibold text-base text-[#191919] mb-1">{item.title}</h3>
                <p className="font-alt text-sm text-[#71717A] mb-4 leading-snug">{item.description}</p>

                <div className="space-y-1 mb-4">
                  {item.metadata.map((line) => (
                    <p key={line} className="font-alt text-xs text-[#71717A]">
                      {line}
                    </p>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-end gap-1 pt-3 border-t border-zinc-100 font-alt text-sm font-semibold text-[#191919] transition-all group-hover:gap-2">
                  Explore {item.title}
                  <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </div>
              </Link>
            </RevealItem>
          );
        })}
      </Reveal>
    </section>
  );
}
