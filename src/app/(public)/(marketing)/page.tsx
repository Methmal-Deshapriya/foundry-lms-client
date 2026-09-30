"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AboutVideo } from "@/components/marketing/AboutVideo";
import Services from "@/components/marketing/Services";
import LearningExperience from "@/components/marketing/LearningExperience";
import Instructors from "@/components/marketing/Instructors";
import { Testimonials } from "@/components/marketing/Testimonials";
import { ProjectGallery } from "@/components/marketing/ProjectGallery";
import { PathProvider } from "@/components/marketing/companion/PathContext";
import { PathChoice } from "@/components/marketing/companion/PathChoice";
import { WelcomeSlide } from "@/components/marketing/companion/WelcomeSlide";
import { useAppSelector } from "@/store/hooks";
import {
  selectAuthRole,
  selectIsAuthenticated,
} from "@/features/auth/authSelectors";
import { getDashboardPath } from "@/lib/access";

/**
 * The home page's sections, in normal document flow — no more click-through
 * slide deck. Each section keeps the id it had as a slide (`#services`,
 * `#how-it-works`, ...), so other pages link straight to a section with a
 * plain hash (e.g. `/#services`) instead of the old `?slide=` query param,
 * landing there as a scroll-to-anchor (see globals.css for the smooth-scroll
 * behavior). Sign in/up moved out to their own /sign-in and /sign-up pages,
 * so this ends on a plain closing call-to-action instead of an embedded
 * auth form.
 */
function HomeSections() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectAuthRole);

  return (
    <PathProvider>
      <div className="w-full bg-[#FAFAFA]">
        <section id="welcome" className="px-3 py-16 sm:px-6 sm:py-24">
          <WelcomeSlide />
        </section>

        <section className="px-3 pb-16 sm:px-6 sm:pb-24">
          <PathChoice />
        </section>

        <section id="services" className="px-3 pb-16 sm:px-6 sm:pb-24">
          <Services />
        </section>

        <section id="how-it-works" className="px-3 pb-16 sm:px-6 sm:pb-24">
          <LearningExperience />
        </section>

        <section id="instructors" className="px-3 pb-16 sm:px-6 sm:pb-24">
          <Instructors />
        </section>

        <section id="video" className="px-3 pb-16 sm:px-6 sm:pb-24">
          <AboutVideo />
        </section>

        <section id="testimonials" className="px-3 pb-16 sm:px-6 sm:pb-24">
          <Testimonials />
        </section>

        <ProjectGallery />

        <section className="px-3 pb-16 sm:px-6 sm:pb-24">
          <div className="w-full max-w-6xl mx-auto rounded-3xl bg-[#191919] px-6 py-12 text-center sm:px-12 sm:py-16">
            <h2 className="font-sans text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="font-alt mx-auto mt-3 max-w-md text-sm text-zinc-400 sm:text-base">
              Join Foundry Academy and start building job-ready skills today.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {isAuthenticated ? (
                <Link
                  href={getDashboardPath(role)}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-alt text-sm font-semibold text-[#191919] transition-colors hover:bg-zinc-200 sm:text-base"
                >
                  Go to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-alt text-sm font-semibold text-[#191919] transition-colors hover:bg-zinc-200 sm:text-base"
                  >
                    Get started for free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/sign-in"
                    className="inline-flex h-12 items-center rounded-full border border-zinc-600 px-6 font-alt text-sm font-semibold text-white transition-colors hover:border-zinc-400 sm:text-base"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </PathProvider>
  );
}

// Logged-in visitors can browse the public site like anyone else — no
// redirect to the dashboard. The sign-up/sign-in CTAs (here, in
// WelcomeSlide and in MarketingNavbar) swap to a single "Dashboard" link
// instead.
export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeSections />
    </Suspense>
  );
}
