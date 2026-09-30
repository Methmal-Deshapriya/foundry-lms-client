"use client";

import { useState } from "react";
import type { ElementType, ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Award,
  Calendar,
  Check,
  ExternalLink,
  FolderGit2,
  Wallet,
} from "lucide-react";
import { useGetClassroomQuery } from "@/features/sessions/sessionsApi";
import { useGetMyProjectsQuery } from "@/features/projects/projectsApi";
import SessionList from "@/features/sessions/components/SessionList";
import StudentOnlyRoute from "@/components/access/StudentOnlyRoute";
import { AdminCatalogBreadcrumbs } from "@/features/catalog/components/AdminCatalogBreadcrumbs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThumbnailImage } from "@/components/ui/thumbnail-image";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SubmitProjectDialog } from "@/features/projects/components/SubmitProjectDialog";
import { CardGridSkeleton, LoadingStatus } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

const PROJECT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Paid in full",
  PARTIAL: "Partially paid",
  NOT_REQUIRED: "No payment required",
};

// Compact "at a glance" tile — for short facts (a date, a status word), not
// the big-number KPI tiles used on the admin catalog pages, which read too
// heavy for text values like these.
function FactTile({
  icon: Icon,
  label,
  children,
}: {
  icon: ElementType;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-44 flex-1 items-start gap-2.5 rounded-md border border-border bg-background px-3.5 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function LearningPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const {
    data: classroom,
    isLoading,
    error,
  } = useGetClassroomQuery(enrollmentId);
  const { data: projectsPage } = useGetMyProjectsQuery({ limit: 50 });
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  if (isLoading) {
    return (
      // Same shape as the loaded page: header (thumbnail + text), the
      // completion card with its fact tiles, then the session grid.
      <div className="@container space-y-6 pb-20">
        <LoadingStatus label="Preparing your classroom…" />
        <div className="flex flex-col gap-5 @3xl:flex-row @3xl:items-start" aria-hidden="true">
          <Skeleton className="aspect-video w-full max-w-xl shrink-0 rounded-lg @3xl:h-56 @3xl:w-auto" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
        <div className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6" aria-hidden="true">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-16 min-w-44 flex-1" />
            ))}
          </div>
        </div>
        <CardGridSkeleton count={3} className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3" />
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-12 text-center">
        <h2 className="mb-2 text-2xl font-bold text-red-900">
          Classroom unavailable
        </h2>
        <p className="mb-6 text-red-700">
          {getApiErrorMessage(
            error,
            "We could not load this classroom. Check your enrollment and try again.",
          )}
        </p>
        <Button asChild variant="outline">
          <Link href="/my-courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Courses
          </Link>
        </Button>
      </div>
    );
  }

  const { enrollment, sessions, progress } = classroom;
  const { course } = enrollment;
  const isCompletionHistoryReadOnly = enrollment.status === "COMPLETED";
  const isSeasonal = course.instanceKind === "SEASONAL";
  const showPayment =
    enrollment.source === "ADMIN" &&
    enrollment.paymentStatus !== "NOT_REQUIRED";
  const myProject = projectsPage?.projects.find(
    (project) => project.intakeId === progress.intakeId,
  );
  const hasHighlights = course.highlights.length > 0;
  const hasSkills = course.skills.length > 0;
  const hasPrerequisites = course.prerequisites.length > 0;

  return (
    <StudentOnlyRoute description="Admins manage course delivery and enrollments from the admin area.">
      <div className="space-y-6 pb-20">
        <AdminCatalogBreadcrumbs
          crumbs={[
            { label: "My Courses", href: "/my-courses" },
            { label: course.title },
          ]}
        />

        {/* Header + completion card, two plain stacked blocks — no more
            floating/overlap trick, which only made sense when a colored
            backdrop band sat behind the title. */}
        <div className="@container space-y-6">
          {/* Stacked (thumbnail on top, capped width) until the content
              area itself — not the viewport, since the sidebar eats ~256px
              from md up — is wide enough to sit the thumbnail beside the
              text without squeezing it into a one-word-per-line column. */}
          <div className="flex flex-col gap-5 @3xl:flex-row @3xl:items-start">
            <div className="relative aspect-video w-full max-w-xl shrink-0 overflow-hidden rounded-lg @3xl:h-56 @3xl:w-auto @3xl:max-w-none @5xl:h-64">
              <ThumbnailImage src={course.thumbnailUrl} alt="" label={course.title} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <p className="flex items-center gap-2 truncate text-xs font-semibold tracking-widest text-[#71717A] uppercase">
                <span className="text-[#E91717]">—</span> {course.serviceTitle}
              </p>
              <h1 className="text-2xl font-bold text-foreground">
                {course.title}
              </h1>
              {course.description ? (
                <p className="text-sm text-muted-foreground">{course.description}</p>
              ) : null}

              {hasHighlights ? (
                <ul className="space-y-1.5">
                  {course.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#191919]" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}

              {hasSkills ? (
                <div className="flex flex-wrap gap-1.5">
                  {course.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-[#191919] px-2.5 py-1 text-xs text-[#FAFAFA]">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}

              {hasPrerequisites ? (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Prerequisites: </span>
                  {course.prerequisites.join(" · ")}
                </p>
              ) : null}
            </div>
          </div>

          {/* One "at a glance" card: progress + every quick fact together. */}
          <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Course Completion
              </p>
              <p className="text-sm font-bold text-[#191919]">
                {progress.progressPercent}%
              </p>
            </div>
            <Progress value={progress.progressPercent} className="mt-2 h-2.5" />
            <p className="mt-2 text-xs text-muted-foreground">
              {progress.completedCount} of {progress.availableSessionCount}{" "}
              available sessions completed
            </p>
            <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
              <FactTile icon={Calendar} label="Enrolled">
                {format(new Date(enrollment.enrolledAt), "MMM d, yyyy")}
              </FactTile>

              {isSeasonal ? (
                <FactTile icon={Calendar} label="Schedule">
                  {course.startDate && course.expectedEndDate ? (
                    <>
                      {format(new Date(course.startDate), "MMM d")} –{" "}
                      {format(new Date(course.expectedEndDate), "MMM d, yyyy")}
                    </>
                  ) : (
                    "To be announced"
                  )}
                </FactTile>
              ) : null}

              {showPayment ? (
                <FactTile icon={Wallet} label="Payment">
                  {PAYMENT_STATUS_LABELS[enrollment.paymentStatus] ??
                    enrollment.paymentStatus}
                </FactTile>
              ) : null}

              {course.certificateEnabled ? (
                <FactTile icon={Award} label="Certificate">
                  {enrollment.certificate?.status === "ISSUED" ? (
                    <Link
                      href="/certificates"
                      className="inline-flex items-center gap-1 text-[#191919] hover:text-[#E91717]"
                    >
                      View certificate
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : enrollment.certificate?.status === "REVOKED" ? (
                    "Revoked"
                  ) : (
                    "After completion"
                  )}
                </FactTile>
              ) : null}

              <FactTile icon={FolderGit2} label="Project">
                {myProject ? (
                  <span className="flex items-center gap-1.5">
                    <Link
                      href="/projects"
                      className="text-[#191919] hover:text-[#E91717]"
                    >
                      {myProject.title}
                    </Link>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        PROJECT_STATUS_STYLES[myProject.status],
                      )}
                    >
                      {myProject.status}
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSubmitDialogOpen(true)}
                    className="inline-flex items-center gap-1 text-[#191919] hover:text-[#E91717]"
                  >
                    Submit project
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </FactTile>
            </div>
          </div>
        </div>

        {/* "About this course" was removed — its content (description,
            highlights, skills, prerequisites) now lives in the header
            above, so sessions get the full page width instead of sharing
            it with a now-redundant sticky rail. */}
        <section className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-foreground">Your Sessions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sessions appear here as they are released and become available for
              your course.
            </p>
          </div>
          <SessionList
            enrollmentId={enrollment.id}
            sessions={sessions}
            isReadOnly={isCompletionHistoryReadOnly}
          />
        </section>
      </div>

      <SubmitProjectDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        defaultEnrollmentId={enrollment.id}
      />
    </StudentOnlyRoute>
  );
}
