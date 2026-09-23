"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowRight, BarChart3, Code2, Target } from "lucide-react";
import { usePath, PATH_META, type Path } from "./PathContext";

const OPTIONS: {
  value: Exclude<Path, null>;
  icon: React.ElementType;
  description: string;
}[] = [
  { value: "build", icon: Code2, description: "I want to build apps and websites" },
  { value: "data", icon: BarChart3, description: "I want to analyze and visualize data" },
  { value: "unsure", icon: Target, description: "I'm exploring my options" },
];

/**
 * PathChoice
 *
 * A standalone full-width section, not nested inside the hero — the choice
 * that actually changes what follows: the bootcamp rail later pre-filters
 * based on this pick.
 */
export function PathChoice() {
  const { path, setPath } = usePath();

  return (
    <div className="w-full max-w-6xl mx-auto px-2">
      <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#191919] mb-4 sm:mb-6 text-center">
        So, what brings you here?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {OPTIONS.map(({ value, icon: Icon, description }) => {
          const meta = PATH_META[value];
          const active = path === value;
          return (
            <motion.button
              key={value}
              type="button"
              whileHover={{ y: -2 }}
              onClick={() => setPath(value)}
              className={`group flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors sm:p-5 ${
                active ? "border-[#191919] bg-zinc-50" : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[#191919]">
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-alt font-semibold text-sm text-[#191919]">{meta.label}</p>
                <p className="font-alt text-xs text-[#71717A] mt-0.5">{description}</p>
              </div>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-[#A1A1AA] transition-transform group-hover:translate-x-0.5 group-hover:text-[#191919]"
                aria-hidden="true"
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
