"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Award,
  ArrowRight,
  BookOpen,
  Cake,
  CheckCircle2,
  FolderGit2,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  MapPin,
  Phone,
  PlayCircle,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import { CourseKpiTile } from "@/features/catalog/components/admin/CourseKpiTile";
import { Section } from "@/components/dataviz/StatPrimitives";
import { CatalogIcon } from "@/components/marketing/catalog/visuals";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { useAppSelector } from "@/store/hooks";
import { ENROLLMENT_STATUS_STYLES } from "@/lib/statusColors";
import { useGetMyCertificatesQuery } from "@/features/certificates/certificatesApi";
import { useGetMyProjectsQuery } from "@/features/projects/projectsApi";
import type { ProjectStatus, StudentProject } from "@/features/projects/projectsTypes";
import { useGetStudentDashboardQuery } from "../dashboardApi";
import type { ActivityItem, ContinueLearningPointer, RecentEnrollmentSummary } from "../dashboardTypes";
import { ActivityHeatmap } from "./ActivityHeatmap";

function getInitials(firstName?: string, lastName?: string) {
  const initials = `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`;
  return initials.toUpperCase() || "U";
}

/**
 * The student dashboard, laid out to the 2026-09-14 sketch: the page itself
 * never scrolls at desktop width — only the courses list scrolls internally
 * — with a full-height profile rail on the right. Below `lg` there's no
 * room for that, so it falls back to a normal stacked, page-scrolling
 * layout instead of squeezing everything into a fixed box.
 */
export default function StudentDashboard({ firstName }: { firstName?: string }) {
  const { data, isLoading } = useGetStudentDashboardQuery();
  const { data: projectsPage } = useGetMyProjectsQuery({ limit: 50 });

  const projects = projectsPage?.projects ?? [];
  const projectCounts: Record<ProjectStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const project of projects) projectCounts[project.status]++;

  return (
    <div className="grid grid-cols-1 gap-4 lg:h-[calc(100svh-7rem)] lg:grid-cols-[minmax(0,1fr)_27.5rem]">
      <div className="flex flex-col gap-4 lg:min-h-0">
        <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Welcome back, {firstName}! 👋</h1>
            <p className="mt-1 text-muted-foreground">
              Here&apos;s what&apos;s happening with your learning journey today.
            </p>
          </div>
          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link href="/explore">
              Explore More Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="flex shrink-0 flex-wrap gap-4">
          <CourseKpiTile
            icon={BookOpen}
            label="Active courses"
            value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : data?.coursesEnrolled ?? 0}
          />
          <CourseKpiTile
            icon={CheckCircle2}
            label="Completed"
            value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : data?.coursesCompleted ?? 0}
          />
          <CourseKpiTile
            icon={FolderGit2}
            label="Projects in review"
            value={projectCounts.PENDING}
            secondary={`${projectCounts.APPROVED} approved`}
          />
          <CourseKpiTile
            icon={Award}
            label="Certificates earned"
            value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : data?.certificatesEarned ?? 0}
          />
        </div>

        <div className="shrink-0">
          <NotificationPanel continueLearning={data?.continueLearning ?? null} items={data?.recentActivity ?? []} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-5">
          <Section
            title="Your courses"
            className="lg:col-span-3 lg:flex lg:h-full lg:min-h-0 lg:flex-col"
            action={
              <Link href="/my-courses" className="text-xs font-semibold text-primary hover:text-primary/80">
                View all
              </Link>
            }
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : !data || data.recentEnrollments.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background">
                  <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Once you enroll in a course, it will show up here.</p>
              </div>
            ) : (
              <div className="space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
                {data.recentEnrollments.map((enrollment) => (
                  <DashboardCourseCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            )}
          </Section>

          <div className="flex flex-col gap-4 lg:col-span-2 lg:h-full lg:min-h-0 lg:overflow-y-auto">
            <ActivityHeatmap heatmap={data?.heatmap ?? []} />
            <ProjectAnalyticsCard projects={projects} className="lg:min-h-0 lg:flex-1" />
          </div>
        </div>
      </div>

      <ProfileRail projects={projects} />
    </div>
  );
}

const ACTIVITY_ICON: Record<ActivityItem["type"], LucideIcon> = {
  CERTIFICATE_ISSUED: Award,
  PROJECT_APPROVED: CheckCircle2,
  PROJECT_REJECTED: XCircle,
  COURSE_COMPLETED: GraduationCap,
};

const PROJECT_BADGE_CLASS: Record<ProjectStatus, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  APPROVED: "bg-emerald-50 text-emerald-600",
  REJECTED: "bg-rose-50 text-rose-600",
};

function activityLabel(item: ActivityItem) {
  const title = item.title ?? "a course";
  switch (item.type) {
    case "CERTIFICATE_ISSUED":
      return `Certificate issued for ${title}`;
    case "PROJECT_APPROVED":
      return `Project "${title}" approved`;
    case "PROJECT_REJECTED":
      return `Project "${title}" needs changes`;
    case "COURSE_COMPLETED":
      return `Completed ${title}`;
  }
}

// The sketch's "notification panel" — there's no real notifications table
// (no read state, no triggers) so this is a cheap derived feed: the next
// incomplete session for the most recently active course pinned at top,
// then a handful of recent events already visible elsewhere on the
// dashboard (certificate issuance, project decisions, course completions).
function NotificationPanel({
  continueLearning,
  items,
}: {
  continueLearning: ContinueLearningPointer | null;
  items: ActivityItem[];
}) {
  const isEmpty = !continueLearning && items.length === 0;

  return (
    <Section title="Notifications">
      {isEmpty ? (
        <p className="py-1 text-sm text-muted-foreground">Nothing new yet.</p>
      ) : (
        <div className="space-y-3">
          {continueLearning ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary/5 p-3">
              <div className="flex min-w-0 items-center gap-2.5 text-sm">
                <PlayCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">Continue: {continueLearning.courseTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">{continueLearning.sessionTitle}</p>
                </div>
              </div>
              <Button asChild size="sm">
                <Link href={`/my-courses/${continueLearning.enrollmentId}`}>
                  Resume
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : null}

          {items.length > 0 ? (
            <ul className="space-y-2.5">
              {items.map((item) => {
                const Icon = ACTIVITY_ICON[item.type];
                return (
                  <li
                    key={`${item.type}-${item.occurredAt}-${item.title}`}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-foreground">{activityLabel(item)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.occurredAt), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      )}
    </Section>
  );
}

// Same status colors as the badges elsewhere on this dashboard (ProfileRail's
// project list, PROJECT_BADGE_CLASS) — a pie's slice color IS its identity
// here, so it has to match every other place these three statuses appear,
// not draw from the generic --chart-1..5 categorical ramp.
const PROJECT_CHART_CONFIG = {
  count: { label: "Projects" },
  pending: { label: "Pending", color: "#f59e0b" },
  approved: { label: "Approved", color: "#10b981" },
  rejected: { label: "Rejected", color: "#f43f5e" },
} satisfies ChartConfig;

function ProjectAnalyticsCard({ projects, className }: { projects: StudentProject[]; className?: string }) {
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
    <Section title="Project analytics" className={`lg:flex lg:flex-col ${className ?? ""}`}>
      <div className="flex items-center gap-4 lg:min-h-0 lg:flex-1">
        <ChartContainer config={PROJECT_CHART_CONFIG} className="mx-auto aspect-square h-32 w-32 shrink-0">
          <PieChart>
            {hasProjects ? <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="label" />} /> : null}
            <Pie data={chartData} dataKey="count" nameKey="label" innerRadius={32} outerRadius={56} strokeWidth={2}>
              {chartData.map((row) => (
                <Cell key={row.status} fill={row.fill} stroke="var(--card)" />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="min-w-0 flex-1 space-y-1.5 text-sm">
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
    </Section>
  );
}

// The full-height right rail, per the 2026-09-15 sketch: a banner + avatar
// header, plain-text identity block (no boxes), a deduped skills chip
// cloud, a 2x2 grid of personal-detail tiles, then a few certificates and
// a few projects — each "show a few" list capped client-side since these
// are just teasers, not the full lists (those live at /certificates and
// /projects).
function ProfileRail({ projects }: { projects: StudentProject[] }) {
  const user = useAppSelector(selectAuthUser);
  const { data: certificatesPage } = useGetMyCertificatesQuery({ limit: 5 });
  if (!user) return null;

  const certificates = certificatesPage?.certificates ?? [];
  const skills = Array.from(new Set(certificates.flatMap((certificate) => certificate.certificateData.skills))).slice(
    0,
    6,
  );

  const detailTiles = (
    [
      user.phone ? { icon: Phone, label: "Phone", value: user.phone, badgeClass: "bg-sky-50 text-sky-600" } : null,
      user.district
        ? { icon: MapPin, label: "District", value: user.district, badgeClass: "bg-emerald-50 text-emerald-600" }
        : null,
      user.alStream
        ? {
            icon: GraduationCap,
            label: "A/L Stream",
            value: user.alStream,
            badgeClass: "bg-violet-50 text-violet-600",
          }
        : null,
      user.dateOfBirth
        ? {
            icon: Cake,
            label: "Date of birth",
            value: format(new Date(user.dateOfBirth), "MMM d, yyyy"),
            badgeClass: "bg-amber-50 text-amber-600",
          }
        : null,
    ] as ({ icon: LucideIcon; label: string; value: string; badgeClass: string } | null)[]
  ).filter((tile): tile is { icon: LucideIcon; label: string; value: string; badgeClass: string } => tile !== null);

  return (
    // Bleeds out of `main`'s p-6 padding (lg only) so it reads as a
    // persistent panel flush against the top bar and the bottom of the
    // viewport, like the app's own left sidebar — not a card floating with
    // gaps around it. Only a left border separates it, no rounded corners,
    // matching that sidebar's visual language.
    <div className="flex flex-col gap-4 overflow-hidden rounded-md border border-input bg-card p-4 pt-0 lg:h-[calc(100svh-4rem)] lg:min-h-0 lg:-my-6 lg:-mr-6 lg:rounded-none lg:border-t-0 lg:border-r-0 lg:border-b-0 lg:border-l lg:pb-6">
      <div className="shrink-0">
        <div className="relative -mx-4 h-24 bg-linear-to-br from-primary to-primary/70">
          <Avatar className="absolute top-full left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-card">
            <AvatarFallback className="rounded-full bg-primary text-2xl text-primary-foreground">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="mt-14 text-center">
          <p className="truncate font-semibold text-foreground">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">Member since {format(new Date(user.createdAt), "MMM yyyy")}</p>
        </div>
      </div>

      <div className="space-y-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        {skills.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1.5">
            {skills.map((skill) => (
              <span key={skill} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {skill}
              </span>
            ))}
          </div>
        ) : null}

        {detailTiles.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {detailTiles.map((tile) => (
              <div key={tile.label} className="flex items-center gap-2.5 rounded-md border border-input p-2.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tile.badgeClass}`}>
                  <tile.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{tile.label}</p>
                  <p className="truncate text-sm font-semibold text-foreground">{tile.value}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Certificates</h4>
            <Link href="/certificates" className="text-xs font-semibold text-primary hover:text-primary/80">
              View all
            </Link>
          </div>
          {certificates.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {certificates.slice(0, 3).map((certificate) => (
                <li key={certificate.id}>
                  <Link
                    href={`/certificates/verify/${certificate.certificateCode}`}
                    className="flex items-center gap-3 rounded-md py-3 text-sm transition-colors hover:bg-muted/60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                      <Award className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{certificate.courseName}</p>
                      <p className="text-xs text-muted-foreground">
                        Issued {format(new Date(certificate.issuedDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Projects</h4>
            <Link href="/projects" className="text-xs font-semibold text-primary hover:text-primary/80">
              View all
            </Link>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {projects.slice(0, 3).map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-3 rounded-md py-3 text-sm transition-colors hover:bg-muted/60"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${PROJECT_BADGE_CLASS[project.status]}`}
                    >
                      <FolderGit2 className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{project.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{project.status.toLowerCase()}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// A compact version of the same "thumbnail/icon + progress + status" card
// language Explore and My Courses already established.
function DashboardCourseCard({ enrollment }: { enrollment: RecentEnrollmentSummary }) {
  const progress = enrollment.progress;
  return (
    <Link
      href={`/my-courses/${enrollment.id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-primary/15 via-primary/5 to-transparent">
        {enrollment.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external, arbitrary admin-supplied URLs
          <img src={enrollment.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <CatalogIcon visualKey={enrollment.categoryVisualKey ?? ""} className="h-4 w-4 text-primary/70" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">{enrollment.courseTitle ?? "Untitled course"}</p>
          <Badge variant="outline" className={ENROLLMENT_STATUS_STYLES[enrollment.status]}>
            {enrollment.status.charAt(0) + enrollment.status.slice(1).toLowerCase()}
          </Badge>
        </div>
        {progress && progress.availableSessionCount > 0 ? (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 w-full max-w-32 overflow-hidden rounded-full bg-primary/15">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress.progressPercent}%` }} />
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {progress.completedCount}/{progress.availableSessionCount}
            </span>
          </div>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {enrollment.intakeCode} · {format(new Date(enrollment.updatedAt), "MMM d, yyyy")}
          </p>
        )}
      </div>
    </Link>
  );
}
