"use client";

import { useState } from "react";
import { BookOpen, CalendarCheck, Layers, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminCatalogBreadcrumbs } from "@/features/catalog/components/AdminCatalogBreadcrumbs";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { CourseKpiTile } from "@/features/catalog/components/admin/CourseKpiTile";
import { CourseForm } from "@/features/catalog/components/CourseForm";
import { CourseTable } from "@/features/catalog/components/CourseTable";
import {
  useGetAdminLearningServiceSummariesQuery,
  useGetCoursesQuery,
} from "@/features/catalog/catalogApi";

export default function ServiceCoursesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { service: serviceSlug } = useParams<{ service: string }>();
  const { data: servicesData, isLoading: serviceLoading } =
    useGetAdminLearningServiceSummariesQuery();
  const service = servicesData?.services.find((item) => item.slug === serviceSlug);
  const {
    data,
    isLoading: coursesLoading,
    isError,
  } = useGetCoursesQuery(
    service ? { serviceId: service.id, includeArchived: true } : undefined,
    { skip: !service },
  );

  if (serviceLoading || coursesLoading)
    return (
      <p
        role="status"
        aria-live="polite"
        className="py-16 text-center text-muted-foreground"
      >
        Loading courses…
      </p>
    );
  if (!service)
    return (
      <p className="rounded-xl bg-destructive/10 p-6 text-destructive">
        Unknown learning service.
      </p>
    );

  const courses = data?.courses ?? [];
  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogBreadcrumbs
        crumbs={[
          { label: "Services", href: "/admin/services" },
          { label: service.title },
        ]}
      />
      <AdminCatalogPageHeader
        title={`${service.title} courses`}
        description="Each course here is a real-world program students browse and enroll in. Its intakes are the scheduled runs — sessions, enrollments, and lifecycle live there."
        action={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus /> New course
          </Button>
        }
      />
      {/* A grid, not flex-wrap: 3 tiles at min-w-40/flex-1 wrap unevenly
          (2-then-1) right around the width the sidebar appears — the same
          pattern fixed on the admin/student dashboards. min-w-0 overrides
          the shared component's own 160px floor so a narrow-phone cell can
          still shrink enough. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CourseKpiTile
          className="min-w-0"
          icon={BookOpen}
          label="Courses"
          value={courses.filter((course) => !course.archivedAt).length}
          secondary={`${courses.filter((course) => course.archivedAt).length} archived`}
        />
        <CourseKpiTile
          className="min-w-0"
          icon={CalendarCheck}
          label="Open for enrollment"
          value={courses.filter((course) => course.enrollmentStatus === "OPEN").length}
          secondary="Have an open-active intake"
        />
        <CourseKpiTile
          className="min-w-0"
          icon={Layers}
          label="Total intakes"
          value={courses.reduce((total, course) => total + course.intakeCount, 0)}
          secondary="Across every course"
        />
      </div>
      {isError ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 p-6 text-destructive"
        >
          Could not load courses.
        </p>
      ) : (
        <CourseTable
          courses={courses}
          serviceSlug={service.slug}
          service={service}
        />
      )}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New course</DialogTitle>
            <DialogDescription>
              This is what students browse and enroll in. Add its first intake next.
            </DialogDescription>
          </DialogHeader>
          <CourseForm
            service={service}
            onSuccess={() => setCreateDialogOpen(false)}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
