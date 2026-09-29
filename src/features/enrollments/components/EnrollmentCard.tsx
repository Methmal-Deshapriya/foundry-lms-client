"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { ChevronRight, LockKeyhole } from "lucide-react";
import type { MyEnrollment } from "../enrollmentsTypes";
import { Progress } from "@/components/ui/progress";
import { ThumbnailImage } from "@/components/ui/thumbnail-image";

interface EnrollmentCardProps {
  enrollment: MyEnrollment;
}

const accessibleCourseStatuses = new Set([
  "OPEN_ACTIVE",
  "CLOSED_ACTIVE",
  "COMPLETED",
  "ARCHIVED",
]);

function getAccessMessage(enrollment: MyEnrollment) {
  if (enrollment.status === "CANCELLED") {
    return "This enrollment was cancelled. Contact support if this is unexpected.";
  }
  if (enrollment.source === "ADMIN" && enrollment.paymentStatus !== "COMPLETED") {
    return "Classroom access opens after an admin confirms the completed payment.";
  }
  if (!accessibleCourseStatuses.has(enrollment.course.intakeStatus)) {
    return "This intake is not currently available for learning.";
  }
  return null;
}

export default function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
  const { course, progress } = enrollment;
  const accessMessage = getAccessMessage(enrollment);
  const isAccessible = accessMessage === null;
  const hasSessions = (progress?.availableSessionCount ?? 0) > 0;

  const Wrapper: ElementType = isAccessible ? Link : "div";
  const wrapperProps = isAccessible ? { href: `/my-courses/${enrollment.id}` } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`group block overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-lg ${isAccessible ? "cursor-pointer" : ""}`}
    >
      <div className="flex md:h-36">
        <div className="relative hidden shrink-0 overflow-hidden md:flex md:w-64">
          <ThumbnailImage src={course.thumbnailUrl} alt="" label={course.title} className="h-full w-full object-cover" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-foreground">{course.title}</h3>
            <p className="line-clamp-1 text-sm text-muted-foreground">{course.summary}</p>
          </div>

          {isAccessible ? (
            <div className="flex items-center gap-2 lg:hidden">
              <Progress value={hasSessions ? progress!.progressPercent : 0} className="h-1.5 w-full max-w-xs" />
              <span className="text-xs text-muted-foreground">
                {hasSessions
                  ? `${progress!.completedCount}/${progress!.availableSessionCount} · ${progress!.progressPercent}%`
                  : "No sessions yet"}
              </span>
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
              {accessMessage}
            </p>
          )}
        </div>

        {isAccessible ? (
          <div className="hidden flex-1 items-center justify-center px-4 lg:flex">
            <div className="flex w-full max-w-xs items-center gap-2">
              <Progress value={hasSessions ? progress!.progressPercent : 0} className="h-1.5 flex-1" />
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {hasSessions
                  ? `${progress!.completedCount}/${progress!.availableSessionCount} · ${progress!.progressPercent}%`
                  : "No sessions yet"}
              </span>
            </div>
          </div>
        ) : null}

        <div className="flex shrink-0 items-center justify-center pr-4">
          {isAccessible ? (
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </span>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground">
              <LockKeyhole className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
