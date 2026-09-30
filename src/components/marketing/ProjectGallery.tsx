"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Reveal } from "@/components/ui/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbnailImage } from "@/components/ui/thumbnail-image";
import { useGetPublicShowcaseQuery } from "@/features/projects/projectsApi";
import type { StudentProject } from "@/features/projects/projectsTypes";
import { cn } from "@/lib/utils";

const MAX_SLIDES = 9;
// One slide per view on phones (with a peek of the next), two on tablets, three on desktop.
const SLIDE_BASIS = "basis-[85%] sm:basis-1/2 lg:basis-1/3";

function GallerySlide({ project }: { project: StudentProject }) {
  const student = [project.user?.firstName, project.user?.lastName].filter(Boolean).join(" ");

  return (
    <Link
      href={`/projects/showcase/${project.id}`}
      className="group relative block aspect-4/5 overflow-hidden rounded-3xl bg-[#191919] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191919]"
    >
      <ThumbnailImage
        src={project.thumbnailUrl}
        alt=""
        // Empty label: the caption below already names the project, so a
        // missing image falls back to a plain dark card, not a second title.
        label=""
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />

      <span className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white text-[#191919] transition-transform duration-300 group-hover:rotate-45">
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </span>

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        {project.course?.title ? (
          <p className="font-alt text-[10px] font-semibold tracking-widest text-white/70 uppercase">{project.course.title}</p>
        ) : null}
        <h3 className="mt-1.5 font-sans text-xl font-bold text-balance text-white">{project.title}</h3>
        {student ? <p className="font-alt mt-1 text-sm text-white/80">by {student}</p> : null}
        {project.technologies.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 3).map((item) => (
              <Badge key={item} className="border-white/20 bg-white/15 text-[10px] font-medium text-white backdrop-blur-sm hover:bg-white/15">
                {item}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

/**
 * Landing-page gallery of approved, public student projects — a shadcn
 * Carousel of tall image cards, deliberately unlike the Services cards
 * above it. Renders nothing until at least one project is public, so the
 * page never shows an empty gallery.
 */
export function ProjectGallery() {
  const { data, isLoading, isError } = useGetPublicShowcaseQuery({ limit: MAX_SLIDES });
  const projects = (data?.projects ?? []).slice(0, MAX_SLIDES);
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    const sync = () => {
      setSelected(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
    };
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  if (isError || (!isLoading && projects.length === 0)) return null;

  return (
    // Owns its own <section> (with the page's standard padding) so that
    // when it renders nothing, it leaves no empty gap behind.
    <section id="projects" className="px-3 pb-16 sm:px-6 sm:pb-24">
      <div className="mx-auto w-full max-w-6xl px-2">
        <Carousel setApi={setApi} opts={{ align: "start", loop: projects.length > 3 }}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6 sm:mb-10">
            <div className="max-w-2xl">
              <p className="font-alt mb-2 flex items-center gap-2 text-xs font-semibold tracking-widest text-[#71717A] uppercase">
                <span className="text-[#E91717]">—</span> Built by our students
              </p>
              <h2 className="font-sans text-3xl leading-tight font-bold tracking-tight text-[#191919] sm:text-4xl">
                Student project gallery
              </h2>
              <p className="font-alt mt-3 text-sm text-[#71717A] sm:text-base">
                Real work from real learners — every project here was built during a Foundry Academy course and reviewed by
                our instructors.
              </p>
            </div>
            {snapCount > 1 ? (
              <div className="flex gap-2">
                <CarouselPrevious className="static size-11 translate-y-0 border-zinc-200 bg-white text-[#191919] hover:bg-zinc-50 disabled:opacity-40" />
                <CarouselNext className="static size-11 translate-y-0 border-[#191919] bg-[#191919] bg-none text-white hover:bg-[#27272A] disabled:opacity-40" />
              </div>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex gap-4 overflow-hidden" aria-hidden="true">
              {[0, 1, 2].map((key) => (
                <Skeleton key={key} className={cn("aspect-4/5 shrink-0 rounded-3xl", SLIDE_BASIS)} />
              ))}
            </div>
          ) : (
            <Reveal>
              <CarouselContent>
                {projects.map((project) => (
                  <CarouselItem key={project.id} className={SLIDE_BASIS}>
                    <GallerySlide project={project} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Reveal>
          )}

          {snapCount > 1 ? (
            <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="Choose project slide">
              {Array.from({ length: snapCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={index === selected}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === selected ? "w-8 bg-[#191919]" : "w-2 bg-zinc-300 hover:bg-zinc-400",
                  )}
                />
              ))}
            </div>
          ) : null}
        </Carousel>
      </div>
    </section>
  );
}
