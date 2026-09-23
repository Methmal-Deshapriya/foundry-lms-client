import React from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";

// Fades the bottom of a portrait into the page's white background instead
// of ending in a hard edge or a boxed card.
const FADE_MASK: React.CSSProperties = {
  maskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
};

const INSTRUCTORS = [
  {
    id: "pasindu",
    name: "Pasindu Athukorala",
    professionalRole: "Leading A/L ICT Teacher",
    achievement: "Island Rank 10 — Technology Stream, 2021",
    education: "Undergraduate — University of Sri Jayewardenepura",
    imageSrc: "/assets/prageesha.webp",
    imageAlt: "Pasindu Athukorala, Programme Supervisor at Foundry Academy",
    suffix: "(Supervisor)",
  },
  {
    id: "anushka",
    name: "Anushka Sudheera",
    professionalRole: "AI/ML Engineer at Olee AI",
    achievement: "Island Rank 5 — Technology Stream, 2021",
    education: "Undergraduate — University of Sri Jayewardenepura",
    imageSrc: "/assets/anushkas-Photoroom.webp",
    imageAlt: "Anushka Sudheera, AI/ML Instructor at Foundry Academy",
  },
  {
    id: "methmal",
    name: "Methmal Deshapriya",
    professionalRole: "Software Engineer at Olee AI",
    achievement: "Island Rank 15 — Technology Stream, 2021",
    education: "Undergraduate — University of Sri Jayewardenepura",
    imageSrc: "/assets/methmals-Photoroom.webp",
    imageAlt:
      "Methmal Deshapriya, Software Engineering Instructor at Foundry Academy",
  },
];

export function Instructors() {
  return (
    <div className="w-full max-w-6xl mx-auto px-2">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 sm:mb-10">
        <div className="max-w-2xl">
          <p className="font-alt flex items-center gap-2 text-xs font-semibold tracking-widest text-[#71717A] uppercase mb-2">
            <span className="text-[#E91717]">—</span> The people behind your learning
          </p>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold text-[#191919] leading-tight tracking-tight">
            Meet the people behind your learning
          </h2>
          <p className="font-alt text-[#71717A] text-sm sm:text-base mt-3">
            A dedicated team of educators and engineers committed to helping you grow.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-zinc-200 px-5 font-alt text-sm font-semibold text-[#191919] transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          Our team
        </button>
      </div>

      {/* Supervisor + instructors — one connected photo frame, all shown
          at the same size/prominence. */}
      <Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {INSTRUCTORS.map((person) => (
            <div
              key={person.id}
              className="relative aspect-3/4"
              style={FADE_MASK}
            >
              <Image
                src={person.imageSrc}
                alt={person.imageAlt}
                fill
                className="object-cover object-top"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-5 mt-4">
          {INSTRUCTORS.map((person) => (
            <div key={person.id} className="text-center">
              <p className="font-sans font-semibold text-base text-[#191919]">
                {person.name}
                {person.suffix && ` ${person.suffix}`}
              </p>
              <p className="font-alt text-xs text-[#71717A] mt-1">
                {person.professionalRole}
              </p>
              <div className="mt-2 pt-2 border-t border-zinc-100 space-y-0.5">
                <p className="font-alt text-xs text-[#71717A]">
                  {person.achievement}
                </p>
                <p className="font-alt text-xs text-[#71717A]">
                  {person.education}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

export default Instructors;
