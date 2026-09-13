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
 * — with a full-height profile rail on the right. That needs real room: a
 * 16rem sidebar plus a 5-column nested split easily outgrows `lg` (1024px),
 * which is exactly where it used to visibly overflow — so this switches at
 * `xl` (1280px) instead. Below that there's no room for it, so it falls
 * back to a normal stacked, page-scrolling layout instead of squeezing
 * everything into a fixed box, and the profile rail (see ProfileRail)
 * hides outright rather than stacking under the main content.
 *
 * The rail's own width isn't fixed: `min(27.5rem, 22.5vw)` makes it track
 * viewport width fluidly, capped at the 27.5rem it reaches once the
 * viewport hits ~1950px — wider than that and it just stops growing rather
 * than eating an ever-larger, disproportionate share of the screen.
 */
export default function StudentDashboard({ firstName }: { firstName?: string }) {
  const { data, isLoading } = useGetStudentDashboardQuery();
  const { data: projectsPage } = useGetMyProjectsQuery({ limit: 50 });

  const projects = projectsPage?.projects ?? [];
  const projectCounts: Record<ProjectStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const project of projects) projectCounts[project.status]++;

  return (
    <div className="grid grid-cols-1 gap-4 xl:h-[calc(100svh-7rem)] xl:grid-cols-[minmax(0,1fr)_min(27.5rem,22.5vw)]">
      <div className="flex flex-col gap-4 xl:min-h-0">
        <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Welcome back, {firstName}! 👋</h1>
            <p className="mt-1 text-muted-foreground">
              Here&apos;s what&apos;s happening with your learning journey today.
            </p>
          </div>
          {/* self-start: the parent flex-col row (below `sm`) defaults to
              stretching its children to full width — this hugs its own
              content instead of becoming a giant full-width bar. */}
          <Button asChild className="self-start bg-primary text-white hover:bg-primary/90">
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
            value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : data?.coursesEnrolled ?? 0}
          />
          <CourseKpiTile
            size="sm"
            className="min-w-0"
            icon={CheckCircle2}
            label="Completed"
            value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : data?.coursesCompleted ?? 0}
          />
          <CourseKpiTile
            size="sm"
            className="min-w-0"
            icon={FolderGit2}
            label="Projects in review"
            value={projectCounts.PENDING}
          />
          <CourseKpiTile
            size="sm"
            className="min-w-0"
            icon={Award}
            label="Certificates earned"
            value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : data?.certificatesEarned ?? 0}
          />
        </div>

        <div className="shrink-0">
          <NotificationPanel continueLearning={data?.continueLearning ?? null} items={data?.recentActivity ?? []} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-5">
          <Section
            title="Your courses"
            className="xl:col-span-3 xl:flex xl:h-full xl:min-h-0 xl:flex-col"
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
              <div className="space-y-2 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
                {data.recentEnrollments.map((enrollment) => (
                  <DashboardCourseCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            )}
          </Section>

          {/* Below `sm`, stacked full-width each — too narrow to split.
              From `sm` up to just below `xl`, side by side at 70/30: the
              heatmap's 26-week grid genuinely wants the extra width, and
              the project chart's own @container already copes fine with a
              narrower share. At `xl`+, this whole div becomes the narrow
              xl:col-span-2 column beside "Your courses" — too tight for a
              70/30 split, so xl:grid-cols-1 reverts to stacking. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[7fr_3fr] xl:col-span-2 xl:h-full xl:min-h-0 xl:grid-cols-1 xl:overflow-y-auto">
            <ActivityHeatmap heatmap={data?.heatmap ?? []} />
            <ProjectAnalyticsCard projects={projects} />
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
    // No title row — this reads as one more KPI-row-height tile, not a
    // titled section like the rest of the page.
    <div className="rounded-md border border-input bg-card px-4 py-3">
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">Nothing new yet.</p>
      ) : (
        <div className="space-y-2">
          {continueLearning ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary/5 p-2.5">
              <div className="flex min-w-0 items-center gap-2.5 text-sm">
                <PlayCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate leading-tight font-medium text-foreground">
                    Continue: {continueLearning.courseTitle}
                  </p>
                  <p className="truncate text-xs leading-tight text-muted-foreground">
                    {continueLearning.sessionTitle}
                  </p>
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
            <ul>
              {items.slice(0, 1).map((item) => {
                const Icon = ACTIVITY_ICON[item.type];
                return (
                  <li
                    key={`${item.type}-${item.occurredAt}-${item.title}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <p className="min-w-0 truncate text-foreground">
                      {activityLabel(item)}
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        · {formatDistanceToNow(new Date(item.occurredAt), { addSuffix: true })}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      )}
    </div>
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
    // @container: the row below needs to know its OWN rendered width, not
    // the viewport's — this card sits in a column whose actual width varies
    // a lot (a cramped desktop split vs. a full-width mobile stack)
    // independent of screen size. Below 18rem there's no room for the
    // legend text beside the chart, and stacking it underneath just makes
    // the card taller for no real benefit — hovering a slice already shows
    // what it is via the tooltip, so the legend is dropped entirely rather
    // than stacked. Past 18rem, chart and legend sit side by side.
    <Section title="Project analytics" className={`@container xl:flex xl:flex-col ${className ?? ""}`}>
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

  type DetailTile = { icon: LucideIcon; label: string; value: string; badgeClass: string; secondary?: boolean };
  const detailTiles = (
    [
      user.phone ? { icon: Phone, label: "Phone", value: user.phone, badgeClass: "bg-sky-50 text-sky-600" } : null,
      user.district
        ? { icon: MapPin, label: "District", value: user.district, badgeClass: "bg-emerald-50 text-emerald-600" }
        : null,
      // Secondary: dropped first when the panel narrows and tiles stack to
      // one column — phone/district stay as the two that always matter.
      user.alStream
        ? {
            icon: GraduationCap,
            label: "A/L Stream",
            value: user.alStream,
            badgeClass: "bg-violet-50 text-violet-600",
            secondary: true,
          }
        : null,
      user.dateOfBirth
        ? {
            icon: Cake,
            label: "Date of birth",
            value: format(new Date(user.dateOfBirth), "MMM d, yyyy"),
            badgeClass: "bg-amber-50 text-amber-600",
            secondary: true,
          }
        : null,
    ] as (DetailTile | null)[]
  ).filter((tile): tile is DetailTile => tile !== null);

  return (
    // Bleeds out of `main`'s p-6 padding (xl only) so it reads as a
    // persistent panel flush against the top bar and the bottom of the
    // viewport, like the app's own left sidebar — not a card floating with
    // gaps around it. Only a left border separates it, no rounded corners,
    // matching that sidebar's visual language. Hidden below `xl` entirely
    // (rather than stacking under the main content, like it used to) — the
    // rail's own fluid width already shrinks it to nothing usable by then,
    // and a student's profile is still one click away at /account.
    // @container: the detail-tile grid below reflows off this panel's own
    // width, which is now fluid and decoupled from viewport breakpoints.
    <div className="@container hidden flex-col gap-4 overflow-hidden rounded-md border border-input bg-card p-4 pt-0 xl:flex xl:h-[calc(100svh-4rem)] xl:min-h-0 xl:-my-6 xl:-mr-6 xl:rounded-none xl:border-t-0 xl:border-r-0 xl:border-b-0 xl:border-l xl:pb-6">
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

      <div className="space-y-6 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
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
          <div className="grid grid-cols-1 gap-3 @xs:grid-cols-2">
            {detailTiles.map((tile) => (
              <div
                key={tile.label}
                className={`flex items-center gap-2.5 rounded-md border border-input p-2.5 ${tile.secondary ? "hidden @xs:flex" : ""}`}
              >
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
