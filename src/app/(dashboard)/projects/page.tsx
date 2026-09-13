"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, FolderCode, Github, Globe, Loader2, MessageSquare, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterPills, type FilterPillOption } from "@/components/ui/filter-pills";
import StudentOnlyRoute from "@/components/access/StudentOnlyRoute";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_STYLES } from "@/lib/statusColors";
import { projectImageLoader } from "@/lib/projectImage";
import { useGetMyProjectsQuery } from "@/features/projects/projectsApi";
import type { ProjectStatus, StudentProject } from "@/features/projects/projectsTypes";
import { SubmitProjectDialog } from "@/features/projects/components/SubmitProjectDialog";

type FilterKey = "ALL" | ProjectStatus;

const FILTER_ACTIVE_CLASS: Record<FilterKey, string> = {
  ALL: "border-primary/30 bg-primary/10 text-primary",
  PENDING: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  APPROVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  REJECTED: "border-destructive/20 bg-destructive/10 text-destructive",
};

/**
 * My Projects — a student's own submitted-project portfolio. Redesigned to
 * match the house style established across the dashboard, My Courses, and
 * Certificates pages this session (text-lg header, rounded-lg/2xl cards,
 * shared PROJECT_STATUS_STYLES badges) rather than this page's older
 * text-3xl/rounded-3xl look with hand-rolled status colors.
 *
 * A student's own project count is always small, so this fetches everything
 * in one page (`limit: 50`, the same assumption StudentDashboard already
 * makes) and filters client-side via FilterPills — no cursor pagination
 * needed, and status filtering "for free" without new backend work.
 */
export default function MyProjectsPage() {
  const { data, isLoading, isError } = useGetMyProjectsQuery({ limit: 50 });
  const projects = useMemo(() => data?.projects ?? [], [data]);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const counts = useMemo(() => {
    const result: Record<ProjectStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const project of projects) result[project.status]++;
    return result;
  }, [projects]);

  const filtered = filter === "ALL" ? projects : projects.filter((project) => project.status === filter);

  const filterOptions: FilterPillOption<FilterKey>[] = [
    { key: "ALL", label: "All", count: projects.length, activeClassName: FILTER_ACTIVE_CLASS.ALL },
    { key: "PENDING", label: "Pending", count: counts.PENDING, activeClassName: FILTER_ACTIVE_CLASS.PENDING },
    { key: "APPROVED", label: "Approved", count: counts.APPROVED, activeClassName: FILTER_ACTIVE_CLASS.APPROVED },
    { key: "REJECTED", label: "Rejected", count: counts.REJECTED, activeClassName: FILTER_ACTIVE_CLASS.REJECTED },
  ];

  return (
    <StudentOnlyRoute description="Admins no longer need the student project portfolio page. Project review remains available in the admin review section.">
      <div className="space-y-6 pb-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">My Projects</h1>
            <p className="text-sm text-muted-foreground">
              Showcase your work and get feedback from our instructors.
            </p>
          </div>
          <Button onClick={() => setSubmitDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Submit Project
          </Button>
        </div>

        {isLoading ? (
          <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" aria-hidden="true" />
            <p className="font-medium text-muted-foreground">Loading your portfolio...</p>
          </div>
        ) : isError ? (
          <div role="alert" className="rounded-lg border border-red-100 bg-red-50 p-12 text-center">
            <h2 className="mb-2 text-base font-bold text-red-900">Something went wrong</h2>
            <p className="text-sm text-red-700">Failed to load projects. Please try again.</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background">
              <FolderCode className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mb-1 text-base font-bold text-foreground">Portfolio is empty</h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
              You haven&apos;t submitted any projects yet. Show off your skills and build a portfolio that
              instructors and employers will love.
            </p>
            <Button size="sm" onClick={() => setSubmitDialogOpen(true)}>
              Submit your first project
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <FilterPills options={filterOptions} active={filter} onChange={setFilter} ariaLabel="Filter by status" />

            {filtered.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                No {filter.toLowerCase()} projects.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SubmitProjectDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen} />
    </StudentOnlyRoute>
  );
}

function ProjectCard({ project }: { project: StudentProject }) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="relative h-36 overflow-hidden bg-linear-to-br from-primary/15 via-primary/5 to-transparent">
        {project.thumbnailUrl ? (
          <Image
            loader={projectImageLoader}
            unoptimized
            src={project.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FolderCode className="h-10 w-10 text-primary/40" aria-hidden="true" />
          </div>
        )}
        <Badge
          variant="outline"
          className={cn("absolute top-3 right-3 bg-background/90 shadow-sm backdrop-blur", PROJECT_STATUS_STYLES[project.status])}
        >
          {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        {project.course?.title ? (
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">{project.course.title}</p>
        ) : null}
        <h3 className="line-clamp-1 text-lg font-semibold text-foreground">{project.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description || "No description provided for this project."}
        </p>

        {project.technologies.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <span key={tech} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 ? (
              <span className="text-xs text-muted-foreground">+{project.technologies.length - 4} more</span>
            ) : null}
          </div>
        ) : null}

        {project.adminFeedback ? (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-foreground italic">&quot;{project.adminFeedback}&quot;</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-y-2 border-t border-border px-5 py-3">
        <div className="flex items-center gap-1">
          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="-m-2 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
          ) : null}
          {project.demoUrl ? (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="-m-2 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <Globe className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {project.status === "PENDING" ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/projects/edit/${project.id}`}>Edit</Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost" className="group/link">
            <Link href={`/projects/${project.id}`} className="flex items-center gap-1">
              Details
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
