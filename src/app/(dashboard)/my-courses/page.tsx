"use client";

import { useGetMyEnrollmentsQuery } from "@/features/enrollments/enrollmentsApi";
import EnrollmentCard from "@/features/enrollments/components/EnrollmentCard";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ThumbnailFallback } from "@/components/ui/thumbnail-fallback";
import StudentOnlyRoute from "@/components/access/StudentOnlyRoute";
import { LoadingStatus } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * My Courses Page
 *
 * Displays all courses the current student is enrolled in.
 */
export default function MyCoursesPage() {
  const { data, isLoading, isError } = useGetMyEnrollmentsQuery({ limit: 20 });
  const enrollments = data?.enrollments ?? [];

  return (
    <StudentOnlyRoute description="Admins use the catalog and enrollment tools instead of the student classroom.">
      <div className="space-y-8 pb-20">
      {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Access all your enrolled courses and learning materials.
          </p>
        </div>

        {/* State Handling */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6">
            <LoadingStatus label="Loading your courses…" />
            {[0, 1, 2].map((key) => (
              <div key={key} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4" aria-hidden="true">
                <Skeleton className="aspect-video w-28 shrink-0 rounded-md sm:w-40" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-2 w-full max-w-sm rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-12 text-center">
            <h2 className="text-2xl font-bold text-red-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-red-700">
              We couldn&apos;t load your courses. Please try refreshing the page.
            </p>
          </div>
        ) : enrollments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {enrollments.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            eyebrow="Your classroom"
            title="Your courses will live here"
            description="Every course you join shows up on this page, with your progress, sessions and materials one click away."
            steps={[
              { title: "Pick a course", description: "Browse every program on Explore and choose where to start." },
              { title: "Enroll", description: "Free courses join instantly; paid ones are confirmed by our team." },
              { title: "Learn at your pace", description: "Open the classroom, watch sessions and track your progress here." },
            ]}
            action={
              <Button asChild className="bg-[#191919] bg-none text-white hover:bg-[#27272A]">
                <Link href="/explore">Explore courses</Link>
              </Button>
            }
            preview={
              <div className="w-full space-y-3">
                {[
                  { title: "Your first course", service: "Bootcamps", pct: 60 },
                  { title: "Your next course", service: "PreTech Courses", pct: 20 },
                ].map((row) => (
                  <div key={row.title} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
                    <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-md">
                      <ThumbnailFallback label={row.title} className="text-xs" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{row.service}</p>
                      <p className="truncate text-sm font-semibold text-foreground">{row.title}</p>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                        <div className="h-full rounded-full bg-[#191919]" style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                    <span className="hidden text-xs font-semibold tabular-nums text-foreground @sm:block">{row.pct}%</span>
                  </div>
                ))}
              </div>
            }
          />
        )}
      </div>
    </StudentOnlyRoute>
  );
}
