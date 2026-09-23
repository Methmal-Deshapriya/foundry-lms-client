"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Award,
  BookOpen,
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
import { formatLKR } from "@/lib/utils";

function enrollmentStatusLabel(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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

      {/* A grid, not flex-wrap: 4 tiles at min-w-40/flex-1 wrap unevenly
          (e.g. 3-then-1) in the pre-sidebar viewport range — the same
          pattern fixed on the admin/student dashboards. 2x2 below `sm`,
          one row from `sm` up; min-w-0 overrides the shared component's
          own 160px floor so a narrow-phone cell can still shrink enough. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CourseKpiTile className="min-w-0" icon={Users} label="Total learners" value={totalLearners} secondary="Across every intake" />
        <CourseKpiTile className="min-w-0" icon={Layers} label="Intakes" value={course.intakeCount} secondary="Ever run" />
        <CourseKpiTile
          className="min-w-0"
          icon={DollarSign}
          label="Total revenue"
          value={analytics ? formatLKR(analytics.revenue.total) : "—"}
          secondary="All-time, this program"
        />
        <CourseKpiTile
          className="min-w-0"
          icon={CheckCircle2}
          label="Completion rate"
          value={analytics?.successRate.completedPct != null ? `${analytics.successRate.completedPct}%` : "—"}
          secondary={
            analytics && course.certificateEnabled
              ? `${analytics.successRate.certificatesIssued} / ${analytics.successRate.certificateEligible} certified`
              : undefined
          }
        />
      </div>

      {/* lg not md: md (768px) is exactly where the dashboard's own sidebar
          appears, so switching to 2 columns in that same instant compounds
          into a sharper squeeze than a graduated step-down. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-md border border-input bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Program details</h2>
            <p className="mt-1 text-sm text-muted-foreground">{course.description}</p>
          </div>
          {(
            [
              ["Highlights", course.highlights],
              ["Skills", course.skills],
              ["Prerequisites", course.prerequisites],
            ] as const
          ).map(([label, list]) =>
            list.length > 0 ? (
              <div key={label} className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((item) => (
                    <Badge key={item} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </div>

        <div className="space-y-3 rounded-md border border-input bg-card p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Award className="size-4 text-muted-foreground" aria-hidden="true" /> Policy
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">{service.accessType === "FREE" ? "Free" : formatLKR(course.price)}</span>
            </div>
            {service.accessType === "PAID" && course.discountAmount > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Full-payment discount</span>
                <span className="font-medium">{formatLKR(course.discountAmount)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Certificate policy</span>
              <span className="font-medium">{course.certificateEnabled ? "Issues certificates" : "No certificates"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Intake code prefix</span>
              <span className="font-mono font-medium">{course.intakeCodePrefix}</span>
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="size-3.5" aria-hidden="true" /> All locked after creation — every intake inherits them.
          </p>
        </div>
      </div>

      <IntakeTable course={course} intakes={intakes} serviceSlug={service.slug} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
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
