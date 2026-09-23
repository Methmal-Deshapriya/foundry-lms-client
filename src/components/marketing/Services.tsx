"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useGetPublicLearningServicesQuery } from "@/features/catalog/catalogApi";

const ICONS = [GraduationCap, BookOpen, Users];

const SERVICE_IMAGES: Record<string, { src: string; alt: string }> = {
  bootcamps: { src: "/bootcamps1.webp", alt: "A student coding on a laptop for the Bootcamps program" },
  "pretech-courses": { src: "/pretech1.webp", alt: "A graduating student ready for university with the PreTech Courses program" },
  "free-learning": { src: "/freelearning1.webp", alt: "A student taking a self-paced Free Learning course on a tablet" },
};

export function Services() {
  const { data, isLoading, isError } = useGetPublicLearningServicesQuery();
  const learningServices = data?.services ?? [];
  const cards = learningServices.map((service, index) => ({
    href: `/${service.slug}`,
    icon: ICONS[index % ICONS.length],
    image: SERVICE_IMAGES[service.slug],
    title: service.title,
    description: service.description,
    tags: [
      service.accessType === "FREE" ? "Free access" : "Paid access",
      service.courseMode === "EVERGREEN" ? "Self-paced" : "Seasonal intakes",
      service.enrollmentMode === "SELF"
        ? "Self enrollment"
        : "Admin enrollment",
    ],
  }));

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl px-2">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6 sm:mb-10">
          <div className="max-w-2xl">
            <p className="font-alt flex items-center gap-2 text-xs font-semibold tracking-widest text-[#71717A] uppercase mb-2">
              <span className="text-[#E91717]">—</span> Programs for your growth
            </p>
            <h2 className="font-sans text-3xl font-bold leading-tight tracking-tight text-[#191919] sm:text-4xl">
              What we offer
            </h2>
            <p className="font-alt mt-3 text-sm text-[#71717A] sm:mt-4 sm:text-base">
              Choose a learning service or get support for a project.
            </p>
          </div>
          <div className="hidden items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 sm:flex">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[#191919]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-alt text-sm font-semibold text-[#191919]">Flexible learning</p>
              <p className="font-alt text-xs text-[#71717A]">for a brighter future</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <p
            role="status"
            aria-live="polite"
            className="py-10 text-center text-[#71717A]"
          >
            Loading learning services…
          </p>
        ) : null}
        {isError ? (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]"
          >
            Learning services could not be loaded right now.
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {cards.map(({ href, icon: Icon, image, title, description, tags }) => (
            <Link
              key={href}
              href={href}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-lg"
            >
              {image && (
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-50">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[#191919]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-sans text-lg font-semibold text-[#191919]">
                    {title}
                  </h3>
                </div>
                <p className="font-alt mb-4 text-sm leading-snug text-[#71717A]">
                  {description}
                </p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-alt rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs text-[#71717A]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-end border-t border-zinc-100 pt-3">
                  <span className="font-alt flex items-center gap-1 text-sm font-semibold text-[#191919] transition-all group-hover:gap-2">
                    Explore <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}

          <Link
            href="/consultations"
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-lg"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-50">
              <Image
                src="/projectconsultations1.webp"
                alt="A group of students reviewing a project together for Project Consultations"
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[#191919]">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="font-sans text-lg font-semibold text-[#191919]">
                  Project Consultations
                </h3>
              </div>
              <p className="font-alt mb-4 text-sm leading-snug text-[#71717A]">
                Guidance and support for students working through university and
                research projects.
              </p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {[
                  "University Projects",
                  "Research Projects",
                  "Guidance Toward Success",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="font-alt rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs text-[#71717A]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-end border-t border-zinc-100 pt-3">
                <span className="font-alt flex items-center gap-1 text-sm font-semibold text-[#191919] transition-all group-hover:gap-2">
                  Explore <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Services;
