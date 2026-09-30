"use client";

import { useGetMyEnrollmentsQuery } from "@/features/enrollments/enrollmentsApi";
import EnrollmentCard from "@/features/enrollments/components/EnrollmentCard";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
          <div className="bg-card border border-dashed border-border rounded-3xl p-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-background">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              No enrollments yet
            </h2>
            <p className="mx-auto mb-8 max-w-md text-muted-foreground">
              You are not enrolled in any courses yet. Explore our programs and
              start your tech career today!
            </p>
            <Button
              asChild
              className="h-12 rounded-xl bg-[#191919] bg-none px-8 text-lg text-white hover:bg-[#27272A]"
            >
              <Link href="/explore">Explore courses</Link>
            </Button>
          </div>
        )}
      </div>
    </StudentOnlyRoute>
  );
}
