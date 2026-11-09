"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Play, Users, TrendingUp } from "lucide-react";
import { scrollToHash } from "@/lib/scrollToHash";
import { useAppSelector } from "@/store/hooks";
import { selectAuthRole, selectIsAuthenticated } from "@/features/auth/authSelectors";
import { getDashboardPath } from "@/lib/access";

const FEATURES = [
  { icon: GraduationCap, title: "Learn", body: "Industry-relevant skills" },
  { icon: Users, title: "Practice", body: "Real-world projects" },
  {
    icon: TrendingUp,
    title: "Grow",
    body: "Build your career with confidence",
  },
];

export function WelcomeSlide() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectAuthRole);

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-6 items-center px-2">
      {/* Left column */}
      <div className="text-left">
        <p className="font-alt flex items-center gap-2 text-xs font-semibold tracking-widest text-[#71717A] uppercase mb-3">
          <span className="text-[#E91717]">—</span> Learn Build Grow
        </p>
        <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold text-[#191919] leading-tight tracking-tight">
          Welcome to Foundry Academy
        </h1>

        <p className="font-alt text-[#71717A] text-sm sm:text-base max-w-md mt-3 sm:mt-4">
          We help beginners become job-ready developers, designers, and analysts
          — through practical bootcamps, real mentorship, and hands-on projects.
        </p>

        <div className="bg-zinc-100 rounded-2xl p-3 sm:p-4 mt-4 sm:mt-5 grid grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <div className="h-8 w-8 rounded-lg bg-white text-[#191919] flex items-center justify-center mb-2">
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-alt text-sm font-semibold text-[#191919]">
                {title}
              </p>
              <p className="font-alt text-xs text-[#71717A] leading-snug">
                {body}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5 sm:mt-6">
          <Link
            href={isAuthenticated ? getDashboardPath(role) : "/sign-up"}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#191919] px-6 font-alt text-sm sm:text-base font-semibold text-white transition-colors hover:bg-[#27272A]"
          >
            {isAuthenticated ? "Go to dashboard" : "Get started for free"}
          </Link>
          <Link
            href="/#video"
            onClick={scrollToHash("video")}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-zinc-200 px-6 font-alt text-sm sm:text-base font-semibold text-[#191919] transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            Watch video
          </Link>
        </div>
      </div>

      {/* Right column — hero3.webp has a transparent background and shows
          the full scene (books, laptop) with nothing tight against the
          frame edge, so it's placed at its native ~7:6 aspect ratio with
          object-contain rather than cropped. The mask fades just the
          bottom-right corner (the laptop's near edge) into the page
          background instead of ending in a hard corner. Below lg it stacks
          under the CTAs, capped so it supports the copy rather than
          pushing the next section a full screen down. */}
      <div
        className="relative mx-auto aspect-1283/1086 w-full max-w-sm sm:max-w-md lg:max-w-xl"
        style={{
          maskImage: "radial-gradient(ellipse 24% 26% at 100% 100%, transparent 0%, black 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 24% 26% at 100% 100%, transparent 0%, black 100%)",
        }}
      >
        <Image
          src="/hero3.webp"
          alt="A Foundry Academy student working on a laptop, with 'Same Students Brighter Tomorrows' text"
          fill
          sizes="(min-width: 1024px) 35vw, (min-width: 640px) 448px, 384px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
