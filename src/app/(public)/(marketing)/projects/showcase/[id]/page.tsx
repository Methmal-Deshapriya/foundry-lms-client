"use client";

import { use } from "react";
import Link from "next/link";
import { ExternalLink, Github, Globe } from "lucide-react";
import { CardGridSkeleton, LoadingStatus } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetPublicProjectDetailsQuery, useGetPublicShowcaseQuery } from "@/features/projects/projectsApi";
import type { StudentProject } from "@/features/projects/projectsTypes";
import { PageSlide } from "@/components/marketing/catalog/PageSlide";
import { ThumbnailImage } from "@/components/ui/thumbnail-image";

/**
 * Public project detail — the "anyone can view this" counterpart to the
 * student/admin one at /projects/[id]. Only ever reachable for a project
 * that's both APPROVED and marked public (the backend's
 * getPublicProjectDetailsService already enforces that; a 404 here just
 * means "not found or not public", never leaking which).
 */
export default function PublicProjectShowcasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading, isError } = useGetPublicProjectDetailsQuery(id);

  if (isLoading) {
    return (
      <PageSlide background="#FAFAFA">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <LoadingStatus label="Loading project…" />
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="aspect-video w-full rounded-2xl" aria-hidden="true" />
          <div className="space-y-2" aria-hidden="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </PageSlide>
    );
  }

  if (isError || !project) {
    return (
      <PageSlide background="#FAFAFA">
        <div className="mx-auto max-w-lg py-20 text-center">
          <h1 className="font-sans text-2xl font-bold text-[#191919]">Project not found</h1>
          <p className="mt-2 text-[#71717A]">
            This project doesn&apos;t exist, or hasn&apos;t been made public.
          </p>
        </div>
      </PageSlide>
    );
  }

  const studentName = [project.user?.firstName, project.user?.lastName].filter(Boolean).join(" ");

  return (
    <PageSlide background="#FAFAFA">
      <div className="mx-auto w-full max-w-4xl">
        {project.course?.title ? (
          <p className="flex items-center gap-2 text-sm font-semibold tracking-widest text-[#71717A] uppercase">
            <span className="text-[#E91717]">—</span> {project.course.title}
          </p>
        ) : null}
        <h1 className="mt-3 font-sans text-3xl font-bold tracking-tight text-[#191919] sm:text-4xl">
          {project.title}
        </h1>
        {studentName ? <p className="mt-2 text-[#71717A]">By {studentName}</p> : null}

        <div className="mt-8 aspect-video w-full overflow-hidden rounded-lg">
          <ThumbnailImage src={project.thumbnailUrl} alt="" label={project.title} className="h-full w-full object-cover" />
        </div>

        {project.description ? (
          <p className="mt-8 text-base leading-relaxed text-[#71717A]">{project.description}</p>
        ) : null}

        {project.technologies.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-[#191919]"
              >
                {tech}
              </span>
            ))}
          </div>
        ) : null}

        {project.githubUrl || project.demoUrl ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {project.githubUrl ? (
              <Link
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 px-5 text-sm font-semibold text-[#191919] transition-colors hover:border-zinc-300 hover:bg-zinc-50"
              >
                <Github className="size-4" aria-hidden="true" />
                View code
              </Link>
            ) : null}
            {project.demoUrl ? (
              <Link
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#191919] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#27272A]"
              >
                <Globe className="size-4" aria-hidden="true" />
                Live demo
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <MoreStudentProjects excludeId={id} />
    </PageSlide>
  );
}

// Rest of the community's approved, public work — the same showcase feed
// getPublicShowcase already powers, just filtered down to "not this one" and
// capped at a couple of rows so it reads as a sample, not a full listing.
function MoreStudentProjects({ excludeId }: { excludeId: string }) {
  const { data, isLoading } = useGetPublicShowcaseQuery({ limit: 9 });
  const projects = (data?.projects ?? []).filter((project) => project.id !== excludeId).slice(0, 8);

  if (isLoading) {
    return (
      <div className="mx-auto mt-20 w-full max-w-6xl border-t border-zinc-200 pt-12">
        <Skeleton className="mb-6 h-6 w-48" aria-hidden="true" />
        <CardGridSkeleton count={4} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" />
      </div>
    );
  }

  if (projects.length === 0) return null;

  return (
    <section className="mx-auto mt-20 w-full max-w-6xl border-t border-zinc-200 pt-12">
      <p className="flex items-center gap-2 text-sm font-semibold tracking-widest text-[#71717A] uppercase">
        <span className="text-[#E91717]">—</span> More Student Projects
      </p>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ShowcaseProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

function ShowcaseProjectCard({ project }: { project: StudentProject }) {
  const studentName = [project.user?.firstName, project.user?.lastName].filter(Boolean).join(" ");

  return (
    <Link
      href={`/projects/showcase/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <ThumbnailImage
          src={project.thumbnailUrl}
          alt=""
          label={project.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-[#191919]">{project.title}</h3>
        {studentName ? <p className="mt-1 text-sm text-[#71717A]">By {studentName}</p> : null}
      </div>
    </Link>
  );
}
