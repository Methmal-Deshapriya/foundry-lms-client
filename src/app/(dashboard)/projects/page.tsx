"use client";

import { useMemo, useState } from "react";
import { ChevronRight, FolderCode, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterPills, type FilterPillOption } from "@/components/ui/filter-pills";
import { ThumbnailImage } from "@/components/ui/thumbnail-image";
import StudentOnlyRoute from "@/components/access/StudentOnlyRoute";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_STYLES } from "@/lib/statusColors";
import { useGetMyProjectsQuery } from "@/features/projects/projectsApi";
import type { ProjectStatus, StudentProject } from "@/features/projects/projectsTypes";
import { SubmitProjectDialog } from "@/features/projects/components/SubmitProjectDialog";
import { ProjectDetailSheet } from "@/features/projects/components/ProjectDetailSheet";
import { CardGridSkeleton, LoadingStatus } from "@/components/ui/loading-skeletons";

type FilterKey = "ALL" | ProjectStatus;

const FILTER_ACTIVE_CLASS: Record<FilterKey, string> = {
  ALL: "border-zinc-300 bg-zinc-100 text-[#191919]",
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  // Looked up by id (not a frozen snapshot) so the Sheet reflects fresh data
  // once an edit invalidates and refetches this same query.
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;

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
          <Button onClick={() => setSubmitDialogOpen(true)} className="bg-[#191919] bg-none hover:bg-[#27272A]">
            <Plus className="h-4 w-4" />
            Submit Project
          </Button>
        </div>

        {isLoading ? (
          <div className="@container">
            <LoadingStatus label="Loading your portfolio…" />
            <CardGridSkeleton
              count={4}
              className="grid grid-cols-1 gap-4 @md:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-5"
            />
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
            <Button size="sm" onClick={() => setSubmitDialogOpen(true)} className="bg-[#191919] bg-none hover:bg-[#27272A]">
              Submit your first project
            </Button>
          </div>
        ) : (
          <div className="@container space-y-4">
            <FilterPills options={filterOptions} active={filter} onChange={setFilter} ariaLabel="Filter by status" />

            {filtered.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                No {filter.toLowerCase()} projects.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-5">
                {filtered.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={() => setSelectedProjectId(project.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SubmitProjectDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen} />
      <ProjectDetailSheet
        project={selectedProject}
        open={selectedProjectId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProjectId(null);
        }}
      />
    </StudentOnlyRoute>
  );
}

// Sized and structured to match the Explore course cards exactly: aspect-video
// thumbnail, p-4 content, one merged row at the bottom for tags + the single
// "Details" trigger — no separate bordered footer. Opens the detail Sheet
// (GitHub/demo links, feedback, and the Edit action all live there) instead
// of navigating to a separate page.
function ProjectCard({ project, onOpen }: { project: StudentProject; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden">
        <ThumbnailImage
          src={project.thumbnailUrl}
          alt=""
          label={project.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge
          variant="outline"
          className={cn("absolute top-3 right-3 bg-background/90 shadow-sm backdrop-blur", PROJECT_STATUS_STYLES[project.status])}
        >
          {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {project.course?.title ? (
          <p className="mb-1 text-[11px] font-semibold tracking-wide text-[#191919] uppercase">{project.course.title}</p>
        ) : null}
        <h3 className="mb-1.5 line-clamp-1 text-base font-semibold text-foreground">{project.title}</h3>
        <p className="mb-3 line-clamp-1 text-sm text-muted-foreground">
          {project.description || "No description provided for this project."}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-2">
          {project.technologies.slice(0, 2).map((tech) => (
            <span key={tech} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {tech}
            </span>
          ))}
          {project.technologies.length > 2 ? (
            <span className="text-xs text-muted-foreground">+{project.technologies.length - 2}</span>
          ) : null}

          <span className="ml-auto flex shrink-0 items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors group-hover:text-[#191919]">
            Details
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
