"use client";

import { BookOpen, GraduationCap, Sparkles, Users } from "lucide-react";
import type {
  LearningServiceSlug,
  PublicCourseCard,
  PublicLearningService,
} from "@/features/catalog/catalogTypes";
import { PublicServicePage } from "./PublicServicePage";
import { itBootcampsServiceConfig } from "@/data/publicServices/itBootcamps";
import { pretechServiceConfig } from "@/data/publicServices/pretech";
import { contributionsServiceConfig } from "@/data/publicServices/contributions";
import type { PublicServiceConfig } from "./types";

const CONFIGS: Record<string, PublicServiceConfig> = {
  bootcamps: itBootcampsServiceConfig,
  "pretech-courses": pretechServiceConfig,
  "free-learning": contributionsServiceConfig,
};

// One fixed icon per service — matches the home page's own Services.tsx,
// which assigns one icon per service rather than a per-item icon (the
// Category layer used to carry a per-item visualKey; removed 2026-09-22).
const SERVICE_ICONS: Record<string, typeof GraduationCap> = {
  bootcamps: GraduationCap,
  "pretech-courses": BookOpen,
  "free-learning": Users,
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
  const source = CONFIGS[service] ?? {
    ...itBootcampsServiceConfig,
    hero: {
      ...itBootcampsServiceConfig.hero,
      eyebrow: "Learning service",
      title: definition?.title ?? "Explore",
      highlight: "learning pathways",
      description:
        definition?.description ?? itBootcampsServiceConfig.hero.description,
      illustration: undefined,
    },
    categorySection: {
      ...itBootcampsServiceConfig.categorySection,
      title: "Choose a",
      highlight: "course",
      itemLabel: "courses",
    },
  };
  const Icon = SERVICE_ICONS[service] ?? Sparkles;
  const config = {
    ...source,
    basePath: `/${service}`,
    hero: {
      ...source.hero,
      indicators: source.hero.indicators.map((indicator, index) =>
        index === 0
          ? {
              ...indicator,
              label: `${courses.length} ${courses.length === 1 ? "course" : "courses"}`,
            }
          : indicator,
      ),
    },
    categorySection: {
      ...source.categorySection,
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
  };
  return <PublicServicePage config={config} />;
}
