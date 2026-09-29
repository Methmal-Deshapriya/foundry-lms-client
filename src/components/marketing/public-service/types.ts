import type { LucideIcon } from "lucide-react";

export interface PublicServiceConfig {
  basePath: string;

  /** Tailwind classes — the one accent this service carries throughout (house black, not per-service color). */
  accent: {
    text: string; // e.g. "text-[#191919]"
    softBg: string; // e.g. "bg-zinc-100"
    button: string; // e.g. "bg-[#191919] hover:bg-[#27272A]"
  };

  hero: {
    eyebrow: string;
    title: string;
    highlight?: string;
    description: string;
    /**
     * `src` is the primary (usually R2-backed, admin-uploaded) image;
     * `fallbackSrc` is an optional locally-bundled asset ServiceHero swaps
     * to if `src` is empty or fails to load at runtime (e.g. an R2 outage) —
     * see useFallbackImage / ServiceHero.tsx.
     */
    illustration?: { src: string; alt: string; fallbackSrc?: string; fallbackAlt?: string };
    indicators: { icon: LucideIcon; label: string }[];
  };

  categorySection: {
    title: string;
    highlight?: string;
    description: string;
    /** Generic word for what the cards represent — "tracks" | "subjects" | "learning areas" */
    itemLabel: string;
    items: {
      id: string;
      title: string;
      description: string;
      href: string;
      icon: LucideIcon;
      badge?: string;
      /** Plain lines only — e.g. ["3 courses", "Beginner to Intermediate"] */
      metadata: string[];
    }[];
  };

  processSection: {
    title: string;
    description: string;
    steps: { title: string; description: string }[];
  };

  faqSection: {
    title: string;
    items: { question: string; answer: string }[];
  };

  ctaSection: {
    title: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
}
