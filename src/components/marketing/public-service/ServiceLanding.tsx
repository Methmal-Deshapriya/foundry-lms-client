"use client";

import { BookOpen, GraduationCap, Sparkles, Users } from "lucide-react";
import type {
  LearningServiceSlug,
  PublicCourseCard,
  PublicLearningService,
} from "@/features/catalog/catalogTypes";
import { PublicServicePage } from "./PublicServicePage";
import { SERVICE_ACCENT } from "./accent";
import type { PublicServiceConfig } from "./types";

// One fixed icon per service — matches the home page's own Services.tsx,
// which assigns one icon per service rather than a per-item icon (the
// Category layer used to carry a per-item visualKey; removed 2026-09-22).
const SERVICE_ICONS: Record<string, typeof GraduationCap> = {
  bootcamps: GraduationCap,
  "pretech-courses": BookOpen,
  "free-learning": Users,
};

// The 3 services that existed before this page became fully DB-driven had
// their hero illustration baked into a hardcoded frontend config at these
// exact pixel dimensions. They haven't been re-uploaded through the new
// admin UI (which now enforces a fixed 1374x1145 for every service going
// forward), so this is a one-time, slug-keyed fallback that only applies
// while `definition.heroImageUrl` is still empty for these 3 rows — see the
// 2026-09-24 dynamic service content plan.
const LEGACY_HERO_ILLUSTRATION: Record<
  string,
  { src: string; alt: string; width: number; height: number }
> = {
  bootcamps: {
    src: "/bootcamp.png",
    alt: "A student learning to code at a laptop, representing IT bootcamps",
    width: 1374,
    height: 1145,
  },
  "pretech-courses": {
    src: "/pretech.webp",
    alt: "A student preparing for university with PreTech coursework",
    width: 1536,
    height: 1024,
  },
  "free-learning": {
    src: "/freelearning.webp",
    alt: "A student taking a self-paced Free Learning course",
    width: 1536,
    height: 1024,
  },
};

export function ServiceLanding({
  service,
  courses,
  definition,
}: {
  service: LearningServiceSlug;
  courses: PublicCourseCard[];
  definition?: PublicLearningService;
}) {
  const Icon = SERVICE_ICONS[service] ?? Sparkles;
  const title = definition?.title ?? "Explore";
  const courseCountLabel = `${courses.length} ${courses.length === 1 ? "course" : "courses"}`;
  const legacyIllustration = LEGACY_HERO_ILLUSTRATION[service];
  const hasR2Illustration = Boolean(definition?.heroImageUrl);
  const primaryIllustrationSrc = definition?.heroImageUrl ?? legacyIllustration?.src ?? null;

  const config: PublicServiceConfig = {
    basePath: `/${service}`,
    accent: SERVICE_ACCENT,
    hero: {
      eyebrow: title,
      title: definition?.heroHeadline || title,
      description: definition?.description ?? "",
      illustration: primaryIllustrationSrc
        ? {
            src: primaryIllustrationSrc,
            alt: hasR2Illustration ? `${title} hero image` : (legacyIllustration?.alt ?? `${title} hero image`),
            // Only offer a second attempt when the primary was the R2 image
            // and a legacy local asset also exists for this slug — a legacy
            // asset used as the primary has nowhere further to fall back to.
            fallbackSrc: hasR2Illustration ? legacyIllustration?.src : undefined,
            fallbackAlt: hasR2Illustration ? legacyIllustration?.alt : undefined,
          }
        : undefined,
      indicators: [
        { icon: Sparkles, label: courseCountLabel },
        ...(definition?.heroTags ?? []).map((label) => ({ icon: Sparkles, label })),
      ],
    },
    categorySection: {
      title: "Choose a",
      highlight: "course",
      description: "Compare what's available and start at the level that matches you.",
      itemLabel: "courses",
      items: courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.summary,
        href: `/${service}/${course.slug}`,
        icon: Icon,
        badge:
          course.enrollmentStatus === "COMING_SOON"
            ? "Coming soon"
            : course.enrollmentStatus === "REOPENING_SOON"
              ? "Reopening soon"
              : undefined,
        metadata: [
          course.durationLabel
            ? `${course.levelLabel} · ${course.durationLabel}`
            : course.levelLabel,
          course.accessType === "FREE" ? "Free enrollment" : "Paid enrollment",
        ],
      })),
    },
    processSection: {
      title: `How ${title} works`,
      description: "A clear process from getting started to finishing what you set out to do.",
      steps: definition?.processSteps ?? [],
    },
    faqSection: {
      title: "Frequently asked questions",
      items: definition?.faqItems ?? [],
    },
    ctaSection: {
      title: `Ready to get started with ${title}?`,
      description: "Compare what's available and begin at the level that matches where you are right now.",
      primaryLabel: `Explore ${title}`,
      secondaryLabel: "Not sure where to begin?",
      secondaryHref: "/consultations",
    },
  };

  return <PublicServicePage config={config} />;
}
