"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Award,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminCatalogBreadcrumbs } from "@/features/catalog/components/AdminCatalogBreadcrumbs";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { CatalogStatusBadge } from "@/features/catalog/components/CatalogStatusBadge";
import { CourseKpiTile } from "@/features/catalog/components/admin/CourseKpiTile";
import { CHART_BODY_HEIGHT, PaymentsProjectsSummary } from "@/features/catalog/components/admin/PaymentsProjectsSummary";
import { Bar, BarChart, XAxis } from "recharts";
import { StatusDonutCard } from "@/components/dataviz/StatusDonutCard";
import { Section } from "@/components/dataviz/StatPrimitives";
import { ENROLLMENT_STATUS_COLORS, TREND_COLOR } from "@/components/dataviz/chartColors";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ThumbnailImage } from "@/components/ui/thumbnail-image";
import { CourseForm } from "@/features/catalog/components/CourseForm";
import { IntakeTable } from "@/features/catalog/components/IntakeTable";
import {
  useArchiveCourseMutation,
  useDeleteCourseMutation,
  useGetCourseAnalyticsQuery,
  useGetCourseIntakesQuery,
  useGetCourseQuery,
  usePublishCourseMutation,
  useUnarchiveCourseMutation,
  useUnpublishCourseMutation,
} from "@/features/catalog/catalogApi";
import { useAppSelector } from "@/store/hooks";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { hasPermission, PERMISSIONS } from "@/lib/access";
import { getApiErrorMessage } from "@/lib/api";
import { Icons } from "@/lib/icons";
import { COURSE_ENROLLMENT_STATUS_STYLES } from "@/lib/statusColors";
import { cn, formatLKR } from "@/lib/utils";
import { AL_STREAMS } from "@/lib/constants";

function enrollmentStatusLabel(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const AL_STREAM_CHART_CONFIG = {
  count: { label: "Students", color: TREND_COLOR },
} satisfies ChartConfig;

export default function CourseDetailPage() {
  const router = useRouter();
  const { service: serviceSlug, courseId } = useParams<{ service: string; courseId: string }>();
  const user = useAppSelector(selectAuthUser);
  const canPublish = hasPermission(user, PERMISSIONS.CATALOG_PUBLISH);
  const canDelete = hasPermission(user, PERMISSIONS.CATALOG_DELETE_PERMANENTLY);
  const [editOpen, setEditOpen] = useState(false);
  const { data: course, isLoading: courseLoading } = useGetCourseQuery(courseId);
  const { data: intakesPage, isLoading: intakesLoading } = useGetCourseIntakesQuery(courseId);
  const { data: analytics } = useGetCourseAnalyticsQuery(courseId, { skip: !course });
  const [publishCourse] = usePublishCourseMutation();
  const [unpublishCourse] = useUnpublishCourseMutation();
  const [archiveCourse, archiveState] = useArchiveCourseMutation();
  const [unarchiveCourse] = useUnarchiveCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const intakes = useMemo(() => intakesPage?.intakes ?? [], [intakesPage]);
  // Computable from data already on the page — no analytics endpoint needed
  // for this one. See the 2026-08-31 course detail page improvement plan §3.
  const totalLearners = useMemo(() => intakes.reduce((total, intake) => total + intake.enrollmentCount, 0), [intakes]);

  if (courseLoading || intakesLoading)
    return (
      <p role="status" aria-live="polite" className="py-16 text-center text-muted-foreground">
        Loading course…
      </p>
    );
  if (!course || course.service.slug !== serviceSlug)
    return (
      <p className="rounded-xl bg-destructive/10 p-6 text-destructive">
        Course not found in this service.
      </p>
    );

  const service = course.service;
  const coursesHref = `/admin/services/${service.slug}/courses`;
  const publicHref = `/${service.slug}/${course.slug}`;
  const isArchived = course.status === "ARCHIVED";
  const canDeleteThisCourse = canDelete && isArchived && course.intakeCount === 0;
  // Only 5 possible streams, so always list every stream — including ones
  // with zero enrolled students — rather than only the ones with data.
  const alStreamCounts = new Map(analytics?.alStreams.map((row) => [row.stream, row.count]));
  const alStreamRows = AL_STREAMS.map((stream) => ({ stream, count: alStreamCounts.get(stream) ?? 0 }));
  const alStreamTotal = alStreamRows.reduce((sum, row) => sum + row.count, 0);

  const togglePublish = async () => {
    try {
      if (course.status === "PUBLISHED") await unpublishCourse(course.id).unwrap();
      else await publishCourse(course.id).unwrap();
      toast.success(course.status === "PUBLISHED" ? "Course unpublished" : "Course published");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not change course"));
    }
  };

  const toggleArchive = async () => {
    try {
      if (course.archivedAt) await unarchiveCourse(course.id).unwrap();
      else await archiveCourse(course.id).unwrap();
      toast.success(course.archivedAt ? "Course restored as a draft" : "Course archived");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not change course"));
    }
  };

  const remove = async () => {
    try {
      await deleteCourse(course.id).unwrap();
      toast.success("Course deleted");
      router.push(coursesHref);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete course"));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogBreadcrumbs
        crumbs={[
          { label: "Services", href: "/admin/services" },
          { label: service.title, href: coursesHref },
          { label: course.title },
        ]}
      />

      <AdminCatalogPageHeader
        title={course.title}
        description={course.summary}
        icon={Icons.myCourses}
        badge={
          <>
            <Badge variant="outline" className={COURSE_ENROLLMENT_STATUS_STYLES[course.enrollmentStatus]}>
              {enrollmentStatusLabel(course.enrollmentStatus)}
            </Badge>
            <Badge variant="outline" className="text-xs">{course.level}</Badge>
            <CatalogStatusBadge status={course.status} />
            {course.certificateEnabled ? (
              <Badge variant="outline" className="gap-1 text-xs">
                <Award className="size-3.5" aria-hidden="true" /> CERTIFICATE
              </Badge>
            ) : null}
          </>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={isArchived} onClick={() => setEditOpen(true)}>
              <Pencil /> Edit
            </Button>
            <Button variant="outline" asChild>
              <a href={publicHref} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> <span className="hidden sm:inline">View public page</span>
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label={`More actions for ${course.title}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canPublish && !isArchived ? (
                  <DropdownMenuItem onSelect={togglePublish}>
                    {course.status === "PUBLISHED" ? <EyeOff /> : <Eye />}
                    {course.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </DropdownMenuItem>
                ) : null}
                {canPublish ? (
                  <DropdownMenuItem disabled={archiveState.isLoading} onSelect={toggleArchive}>
                    {isArchived ? <ArchiveRestore /> : <Archive />}{" "}
                    {isArchived ? "Restore as draft" : "Archive course"}
                  </DropdownMenuItem>
                ) : null}
                {canDeleteThisCourse ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={remove}>
                      <Trash2 /> Delete course
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Grid, not flex-wrap: fixed-width tiles in a flex-wrap row wrap
          unevenly (e.g. 3-then-1) at whatever width happens to fall short by
          one tile — a real grid always divides evenly into its column
          count at every width instead. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CourseKpiTile size="sm" className="w-full min-w-0" icon={Users} label="Total learners" value={totalLearners} />
        <CourseKpiTile size="sm" className="w-full min-w-0" icon={Layers} label="Intakes" value={course.intakeCount} />
        <CourseKpiTile
          size="sm"
          className="w-full min-w-0"
          icon={DollarSign}
          label="Total revenue"
          value={analytics ? formatLKR(analytics.revenue.total) : "—"}
        />
        <CourseKpiTile
          size="sm"
          className="w-full min-w-0"
          icon={CheckCircle2}
          label="Completion rate"
          value={analytics?.successRate.completedPct != null ? `${analytics.successRate.completedPct}%` : "—"}
        />
      </div>

      {/* No card around the thumbnail and no Highlights/Skills/Prerequisites/
          Full payment table beside it anymore — that table never held up
          across screen widths and wasn't essential info. Just the thumbnail
          and the A/L stream card now, sharing one row — but only at lg+
          (1024px). Between roughly 640-1023px there's enough room for the
          thumbnail's fixed aspect-video width to look right, but not enough
          left over for the A/L stream chart's 5 bars to render without
          getting cut off/overflowing — so both stay full-width and stacked
          all the way up through that range, and only go side-by-side once
          lg actually has room for both. The thumbnail's height (lg:h-64) is
          a fixed value close to the A/L stream card's own natural height
          (title + description + chart) rather than derived via flex-stretch
          — a stretched (implicit) height doesn't reliably drive
          aspect-video's width calculation the way an explicit height class
          does, which previously rendered as a badly squeezed thumbnail. */}
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md xl:h-64 xl:w-auto">
          <ThumbnailImage src={course.thumbnailUrl} alt={course.title} label={course.title} className="h-full w-full object-cover" />
          <span className="absolute bottom-2 left-2 rounded-full bg-[#191919] px-2.5 py-1 text-xs font-semibold text-white">
            {service.accessType === "FREE" ? "Free" : formatLKR(course.price)}
          </span>
        </div>

        <Section title="A/L stream" className="w-full min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {alStreamTotal > 0 ? `${alStreamTotal} students with a known stream.` : "No enrolled students yet."}
          </p>
          <ChartContainer config={AL_STREAM_CHART_CONFIG} className={cn(CHART_BODY_HEIGHT, "w-full")}>
            <BarChart data={alStreamRows} barCategoryGap="30%">
              <XAxis dataKey="stream" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" radius={4} maxBarSize={40} fill={TREND_COLOR} />
            </BarChart>
          </ChartContainer>
        </Section>
      </div>

      {analytics ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusDonutCard
            title="Enrollment status"
            className="w-full"
            bodyClassName={CHART_BODY_HEIGHT}
            order={["ACTIVE", "COMPLETED", "CANCELLED"] as const}
            counts={{ ACTIVE: analytics.enrollments.active, COMPLETED: analytics.enrollments.completed, CANCELLED: analytics.enrollments.cancelled }}
            colors={ENROLLMENT_STATUS_COLORS}
          />
          <PaymentsProjectsSummary
            payments={analytics.payments}
            projects={analytics.projects}
            certificates={{ issued: analytics.successRate.certificatesIssued, eligible: analytics.successRate.certificateEligible }}
          />
        </div>
      ) : null}

      <IntakeTable course={course} intakes={intakes} serviceSlug={service.slug} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[92vh] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit course</DialogTitle>
            <DialogDescription>
              Content shared by every intake this course has. Slug, code prefix, certificate policy, and discount are locked after creation.
            </DialogDescription>
          </DialogHeader>
          <CourseForm service={course.service} initial={course} onSuccess={() => setEditOpen(false)} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
