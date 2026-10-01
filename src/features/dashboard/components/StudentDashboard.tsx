"use client";

import Link from "next/link";
import {
  Award,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FolderGit2,
  LayoutDashboard,
} from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import { cn } from "@/lib/utils";
import { CourseKpiTile } from "@/features/catalog/components/admin/CourseKpiTile";
import { Section } from "@/components/dataviz/StatPrimitives";
import { DonutSkeleton, KpiValueSkeleton, LoadingStatus } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { PROJECT_STATUS_COLORS } from "@/components/dataviz/chartColors";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ThumbnailImage } from "@/components/ui/thumbnail-image";
import { useGetMyProjectsQuery } from "@/features/projects/projectsApi";
import type { ProjectStatus, StudentProject } from "@/features/projects/projectsTypes";
import { useGetStudentDashboardQuery } from "../dashboardApi";
import type { ContinueLearningPointer, RecentEnrollmentSummary } from "../dashboardTypes";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { PinnedNotifications } from "@/features/notifications/components/PinnedNotifications";

/**
 * The student dashboard, laid out to the 2026-09-14 sketch: the page itself
 * lays out as a normal page-scrolling stack — no fixed-height/internal-
 * scroll gymnastics, since those existed only to fit a full-height profile
 * rail that no longer exists on this page (removed along with the
 * certificates fetch it was the sole user of).
 */
export default function StudentDashboard({ firstName }: { firstName?: string }) {
  const { data, isLoading } = useGetStudentDashboardQuery();
  const { data: projectsPage, isLoading: isProjectsLoading } = useGetMyProjectsQuery({ limit: 50 });

  const projects = projectsPage?.projects ?? [];
  const projectCounts: Record<ProjectStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const project of projects) projectCounts[project.status]++;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Welcome back, {firstName}! 👋</h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s what&apos;s happening with your learning journey today.
          </p>
        </div>
        {/* self-start: the parent flex-col row (below `sm`) defaults to
            stretching its children to full width — this hugs its own
            content instead of becoming a giant full-width bar. */}
        <Button asChild className="self-start bg-[#191919] bg-none text-white hover:bg-[#27272A]">
          <Link href="/explore">
            Explore Courses
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* A grid, not a flex-wrap row: with 4 tiles wrapping unevenly (e.g.
          3 on one line, 1 stranded alone on the next, each hugging its
          own content) never looks intentional — a grid's columns always
          split the row's full width evenly, at every size, with no dead
          gaps and no lonely leftover tile. 2 columns where space is
          tight, 4 once there's room for a single row. min-w-0 overrides
          the shared component's own min-w-40 floor, which would
          otherwise stop a grid cell shrinking below 160px and force
          overflow on a narrow phone. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CourseKpiTile
          size="sm"
          className="min-w-0"
          icon={BookOpen}
          label="Active courses"
          value={isLoading ? <KpiValueSkeleton /> : data?.coursesEnrolled ?? 0}
        />
        <CourseKpiTile
          size="sm"
          className="min-w-0"
          icon={CheckCircle2}
          label="Completed"
          value={isLoading ? <KpiValueSkeleton /> : data?.coursesCompleted ?? 0}
        />
        <CourseKpiTile
          size="sm"
          className="min-w-0"
          icon={FolderGit2}
          label="Projects in review"
          value={isProjectsLoading ? <KpiValueSkeleton /> : projectCounts.PENDING}
        />
        <CourseKpiTile
          size="sm"
          className="min-w-0"
          icon={Award}
          label="Certificates earned"
          value={isLoading ? <KpiValueSkeleton /> : data?.certificatesEarned ?? 0}
        />
      </div>

      <PinnedNotifications />

      {data?.continueLearning && data.recentEnrollments[0] ? (
        <ContinueLearningHero continueLearning={data.continueLearning} topEnrollment={data.recentEnrollments[0]} />
      ) : null}

      {/* "Your courses" gets its own full-width row — it's the page's
          primary content, and squeezing it into a 70% column left it
          visually dwarfed by a tall, mostly-empty sidebar whenever a
          student only has a couple of courses. Learning activity/Project
          analytics are secondary at-a-glance insights, so they move below
          as their own row instead of competing for height alongside the
          course list. */}
      <Section
        title="Your courses"
        action={
          <Link href="/my-courses" className="text-xs font-semibold text-[#191919] hover:text-[#E91717]">
            View all
          </Link>
        }
      >
        {isLoading ? (
          <div className="divide-y divide-border">
            <LoadingStatus label="Loading your courses…" />
            {[0, 1].map((key) => (
              <div key={key} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0" aria-hidden="true">
                <Skeleton className="aspect-video h-16 shrink-0 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !data || data.recentEnrollments.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background">
              <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Once you enroll in a course, it will show up here.</p>
          </div>
        ) : (
          // @container: each row's columns key off the list's real width,
          // not the viewport — the sidebar appearing at md makes the content
          // narrower at 768px than at 640px, so viewport breakpoints showed
          // more columns exactly when there was less room for them.
          <div className="@container divide-y divide-border">
            {data.recentEnrollments.slice(0, 3).map((enrollment) => (
              <CourseListRow key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </Section>

      {/* Stacked until lg, side by side at 70/30 from there. Not sm/md: the
          dashboard sidebar appears at md and takes ~256px, so the content
          area at 768px is narrower than at 640px — splitting there left the
          project card a sliver. [&>*]:min-w-0: grid items default to
          min-width:auto, so the heatmap's 52-week grid would otherwise force
          its column past the viewport instead of using its own internal
          horizontal scroll. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr] *:min-w-0">
        <ActivityHeatmap heatmap={data?.heatmap ?? []} isLoading={isLoading} />
        <ProjectAnalyticsCard projects={projects} isLoading={isProjectsLoading} />
      </div>
    </div>
  );
}

// Shared thumbnail treatment for both the Continue Learning hero and each
// "Your courses" row — a thin wrapper over the shared ThumbnailImage so both
// call sites get the same graceful fallback (missing URL, or a failed load
// e.g. an R2 outage) without repeating the null-title default at each site.
function CourseThumbnail({
  src,
  title,
  className,
}: {
  src: string | null;
  title: string | null;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <ThumbnailImage src={src} alt="" label={title ?? "Untitled course"} className="h-full w-full object-cover" />
    </div>
  );
}

// The one hero-level "what to do next" card: the next incomplete session
// for whichever enrollment was most recently active (recentEnrollments[0]
// and continueLearning always describe the same enrollment — see
// dashboard.repository.js).
function ContinueLearningHero({
  continueLearning,
  topEnrollment,
}: {
  continueLearning: ContinueLearningPointer;
  topEnrollment: RecentEnrollmentSummary;
}) {
  const progress = topEnrollment.progress;
  return (
    // @container: side-by-side only once the card itself is wide enough —
    // at 768px the sidebar leaves this card ~464px, too narrow for a 256px
    // thumbnail plus the progress bar and button beside it.
    <div className="@container overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col @2xl:h-36 @2xl:flex-row">
        <CourseThumbnail
          src={topEnrollment.thumbnailUrl}
          title={continueLearning.courseTitle}
          className="aspect-video w-full shrink-0 @2xl:aspect-auto @2xl:h-full @2xl:w-64"
        />
        <div className="flex flex-1 flex-col justify-center gap-1 overflow-hidden p-4">
          <h2 className="truncate text-base font-semibold text-foreground @2xl:text-lg">
            {continueLearning.sessionTitle}{" "}
            <span className="font-normal text-muted-foreground">
              ({continueLearning.courseTitle ?? "Your course"})
            </span>
          </h2>

          {/* flex-wrap + min-w-40: the button drops under the progress bar
              when there isn't room for both, instead of squeezing it. */}
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {progress && progress.availableSessionCount > 0 ? (
              <div className="min-w-40 flex-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-[#191919]"
                    style={{ width: `${progress.progressPercent}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {progress.completedCount} of {progress.availableSessionCount} lessons
                  </span>
                  <span>{progress.progressPercent}%</span>
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            <Button asChild size="sm" className="shrink-0 bg-[#191919] bg-none text-white hover:bg-[#27272A]">
              <Link href={`/my-courses/${continueLearning.enrollmentId}`}>
                Continue lesson
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_DOT_CLASS: Record<"ACTIVE" | "COMPLETED", string> = {
  ACTIVE: "bg-sky-500",
  COMPLETED: "bg-emerald-500",
};
const STATUS_LABEL: Record<"ACTIVE" | "COMPLETED", string> = {
  ACTIVE: "In progress",
  COMPLETED: "Completed",
};

// One row per recent course: thumbnail, title, progress bar + fraction,
// percentage, and a status dot — the same information the compact card
// used to show, just laid out like a proper course list rather than a
// bare-text row.
function CourseListRow({ enrollment }: { enrollment: RecentEnrollmentSummary }) {
  const progress = enrollment.progress;
  const statusKey = enrollment.status === "CANCELLED" ? null : enrollment.status;

  return (
    <Link
      href={`/my-courses/${enrollment.id}`}
      className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/60 @md:gap-4 @md:p-4"
    >
      <CourseThumbnail
        src={enrollment.thumbnailUrl}
        title={enrollment.courseTitle}
        className="aspect-video h-16 shrink-0 rounded-lg @xl:h-20 @3xl:h-24"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground @xl:text-base @3xl:text-lg">
          {enrollment.courseTitle ?? "Untitled course"}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground @xl:text-sm">
          {progress
            ? `${progress.availableSessionCount} lesson${progress.availableSessionCount === 1 ? "" : "s"}`
            : enrollment.intakeCode}
        </p>
      </div>

      {progress && progress.availableSessionCount > 0 ? (
        <div className="hidden w-36 shrink-0 @xl:block">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full rounded-full bg-[#191919]" style={{ width: `${progress.progressPercent}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {progress.completedCount} of {progress.availableSessionCount} lessons
          </p>
        </div>
      ) : null}

      {progress ? (
        <span className="hidden w-9 shrink-0 text-right text-sm font-medium text-foreground @sm:block">
          {progress.progressPercent}%
        </span>
      ) : null}

      {statusKey ? (
        <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground @3xl:flex">
          <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASS[statusKey])} />
          {STATUS_LABEL[statusKey]}
        </span>
      ) : null}

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

// A pie's slice color IS its identity here, so it has to match every other
// place these three project statuses appear, not draw from the generic
// --chart-1..5 categorical ramp.
const PROJECT_CHART_CONFIG = {
  count: { label: "Projects" },
  pending: { label: "Pending", color: PROJECT_STATUS_COLORS.PENDING },
  approved: { label: "Approved", color: PROJECT_STATUS_COLORS.APPROVED },
  rejected: { label: "Rejected", color: PROJECT_STATUS_COLORS.REJECTED },
} satisfies ChartConfig;

function ProjectAnalyticsCard({
  projects,
  isLoading,
  className,
}: {
  projects: StudentProject[];
  isLoading?: boolean;
  className?: string;
}) {
  const counts: Record<ProjectStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const project of projects) counts[project.status]++;
  const totalLikes = projects.reduce((sum, project) => sum + project.likeCount, 0);

  const hasProjects = projects.length > 0;
  // An empty donut still reads as "a chart with nothing in it yet" rather
  // than hiding the widget outright — one neutral slice filling the ring.
  const chartData = hasProjects
    ? [
        { status: "pending", label: "Pending", count: counts.PENDING, fill: PROJECT_CHART_CONFIG.pending.color },
        { status: "approved", label: "Approved", count: counts.APPROVED, fill: PROJECT_CHART_CONFIG.approved.color },
        { status: "rejected", label: "Rejected", count: counts.REJECTED, fill: PROJECT_CHART_CONFIG.rejected.color },
      ].filter((row) => row.count > 0)
    : [{ status: "empty", label: "No projects yet", count: 1, fill: "var(--muted)" }];

  return (
    // @container: the row below needs to know its OWN rendered width, not
    // the viewport's — this card sits in a column whose actual width varies
    // a lot (a cramped desktop split vs. a full-width mobile stack)
    // independent of screen size. Below 18rem there's no room for the
    // legend text beside the chart, and stacking it underneath just makes
    // the card taller for no real benefit — hovering a slice already shows
    // what it is via the tooltip, so the legend is dropped entirely rather
    // than stacked. Past 18rem, chart and legend sit side by side.
    <Section title="Project analytics" className={`@container xl:flex xl:flex-col ${className ?? ""}`}>
      {isLoading ? (
        <DonutSkeleton className="xl:min-h-0 xl:flex-1" />
      ) : (
      <div className="flex items-center justify-center gap-4 @2xs:justify-start xl:min-h-0 xl:flex-1">
        <ChartContainer config={PROJECT_CHART_CONFIG} className="mx-auto aspect-square h-32 w-32 shrink-0">
          <PieChart>
            {hasProjects ? <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="label" />} /> : null}
            <Pie data={chartData} dataKey="count" nameKey="label" innerRadius={32} outerRadius={56} strokeWidth={2}>
              {chartData.map((row) => (
                <Cell key={row.status} fill={row.fill} stroke="var(--card)" />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="hidden min-w-0 flex-1 space-y-1.5 text-sm @2xs:block">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: PROJECT_CHART_CONFIG.pending.color }}
              />
              Pending
            </span>
            <span className="font-medium tabular-nums text-foreground">{counts.PENDING}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: PROJECT_CHART_CONFIG.approved.color }}
              />
              Approved
            </span>
            <span className="font-medium tabular-nums text-foreground">{counts.APPROVED}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: PROJECT_CHART_CONFIG.rejected.color }}
              />
              Rejected
            </span>
            <span className="font-medium tabular-nums text-foreground">{counts.REJECTED}</span>
          </div>
          <p className="pt-1 text-xs text-muted-foreground">
            {hasProjects ? `${totalLikes} total like${totalLikes === 1 ? "" : "s"}` : "Submit a project to get started."}
          </p>
        </div>
      </div>
      )}
    </Section>
  );
}
