"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, DollarSign, Plus, Users } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageToolbarPortal } from "@/components/layout/PageToolbar";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { AdminCatalogBreadcrumbs } from "@/features/catalog/components/AdminCatalogBreadcrumbs";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { CourseCertificatesTab } from "@/features/catalog/components/admin/CourseCertificatesTab";
import { CourseKpiTile } from "@/features/catalog/components/admin/CourseKpiTile";
import { CourseOverviewAnalytics } from "@/features/catalog/components/admin/CourseOverviewAnalytics";
import { CourseProjectsTab } from "@/features/catalog/components/admin/CourseProjectsTab";
import { EnrollmentRequestsTab } from "@/features/catalog/components/admin/EnrollmentRequestsTab";
import {
  type IntakeStatus,
  useGetIntakeAnalyticsQuery,
  useGetIntakeQuery,
  useUpdateIntakeStatusMutation,
} from "@/features/catalog/catalogApi";
import ClassRosterTable from "@/features/enrollments/components/ClassRosterTable";
import ManualEnrollmentForm from "@/features/enrollments/components/ManualEnrollmentForm";
import CourseCurriculumManager from "@/features/sessions/components/admin/CourseCurriculumManager";
import { hasPermission, PERMISSIONS } from "@/lib/access";
import { getApiErrorMessage } from "@/lib/api";
import { Icons } from "@/lib/icons";
import { INTAKE_STATUS_STYLES } from "@/lib/statusColors";
import { formatLKR } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

const transitions: Record<IntakeStatus, IntakeStatus[]> = {
  DRAFT: ["OPEN_ACTIVE", "CANCELLED"],
  OPEN_ACTIVE: ["CLOSED_ACTIVE", "CANCELLED"],
  CLOSED_ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
  ARCHIVED: [],
};

export default function IntakeWorkspacePage() {
  const {
    service: serviceSlug,
    courseId,
    intakeId,
  } = useParams<{ service: string; courseId: string; intakeId: string }>();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "overview";
  const initialRequestId = searchParams.get("requestId") ?? undefined;
  const user = useAppSelector(selectAuthUser);
  const canPublish = hasPermission(user, PERMISSIONS.CATALOG_PUBLISH);
  const [enrollDialog, setEnrollDialog] = useState(false);
  const { data: intake, isLoading } = useGetIntakeQuery(intakeId);
  const { data: analytics } = useGetIntakeAnalyticsQuery(intakeId, { skip: !intake });
  const [updateStatus, statusState] = useUpdateIntakeStatusMutation();

  if (isLoading)
    return (
      <p role="status" aria-live="polite" className="py-16 text-center">
        Loading intake…
      </p>
    );
  if (
    !intake ||
    intake.courseId !== courseId ||
    intake.service.slug !== serviceSlug
  )
    return (
      <p className="rounded-xl bg-destructive/10 p-6 text-destructive">
        Intake not found under this course.
      </p>
    );
  const service = intake.service;
  const course = intake.course;

  const courseHref = `/admin/services/${service.slug}/courses/${courseId}`;
  const catalogLocked = course.status === "ARCHIVED" || Boolean(course.archivedAt);
  const readOnly =
    ["COMPLETED", "CANCELLED", "ARCHIVED"].includes(intake.status) || catalogLocked;
  const move = async (status: IntakeStatus) => {
    try {
      await updateStatus({ id: intake.id, status, expectedStatus: intake.status }).unwrap();
      toast.success(`Intake moved to ${status.replace("_", " ")}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not change intake status"));
    }
  };

  const enrolledCount = analytics ? analytics.enrollments.active + analytics.enrollments.completed : null;

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogBreadcrumbs
        crumbs={[
          { label: "Services", href: "/admin/services" },
          { label: service.title, href: `/admin/services/${service.slug}/courses` },
          { label: course.title, href: courseHref },
          { label: intake.intakeKey },
        ]}
      />

      <Tabs defaultValue={defaultTab}>
        <PageToolbarPortal>
          <div className="space-y-6 pt-6 pb-4">
            <AdminCatalogPageHeader
              title={course.title}
              description={`${intake.intakeKey} · ${intake.code} · This intake owns its own sessions, enrollments, and lifecycle.`}
              icon={Icons.myCourses}
              badge={
                <Badge variant="outline" className={INTAKE_STATUS_STYLES[intake.status]}>
                  {intake.status.replace("_", " ")}
                </Badge>
              }
              action={
                transitions[intake.status].length > 0 ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    {transitions[intake.status].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={status === "CANCELLED" || status === "ARCHIVED" ? "destructive" : "outline"}
                        className="w-full sm:w-auto"
                        disabled={
                          (catalogLocked && status === "OPEN_ACTIVE") ||
                          statusState.isLoading ||
                          (["OPEN_ACTIVE", "CLOSED_ACTIVE", "ARCHIVED"].includes(status) && !canPublish)
                        }
                        onClick={() => move(status)}
                      >
                        Move to {status.replace("_", " ").toLowerCase()}
                      </Button>
                    ))}
                  </div>
                ) : undefined
              }
            />

            {/* Grid, not flex-wrap: fixed-width tiles in a flex-wrap row
                wrap unevenly (e.g. 3-then-1) at whatever width happens to
                fall short by one tile — a real grid always divides evenly
                into its column count at every width instead. */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <CourseKpiTile
                size="sm"
                className="w-full min-w-0"
                icon={Users}
                label="Enrolled"
                value={analytics ? `${enrolledCount} / ${analytics.enrollments.capacity ?? "∞"}` : "—"}
              />
              <CourseKpiTile
                size="sm"
                className="w-full min-w-0"
                icon={DollarSign}
                label="Revenue"
                value={analytics ? formatLKR(analytics.revenue.total) : "—"}
              />
              <CourseKpiTile
                size="sm"
                className="w-full min-w-0"
                icon={CheckCircle2}
                label="Success rate"
                value={analytics?.successRate.completedPct != null ? `${analytics.successRate.completedPct}%` : "—"}
              />
            </div>
          </div>

          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            {intake.accessType === "PAID" ? (
              <TabsTrigger value="enrollment-requests">Enrollment Requests</TabsTrigger>
            ) : null}
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
        </PageToolbarPortal>

        <TabsContent value="overview" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Performance overview</h2>
            <p className="text-sm text-muted-foreground">
              Enrollment status, revenue, payments, and completion trends for this intake.
            </p>
          </div>
          <CourseOverviewAnalytics intakeId={intake.id} />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Curriculum and delivery</h2>
            <p className="text-sm text-muted-foreground">
              Every attached row has its own order and learner visibility for this intake.
            </p>
          </div>
          <CourseCurriculumManager intakeId={intake.id} readOnly={readOnly} />
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Learner roster</h2>
              <p className="text-sm text-muted-foreground">
                Enrollments, payment evidence, completion, and certificate issuance belong directly to this intake.
              </p>
            </div>
            {intake.accessType === "PAID" && intake.status === "OPEN_ACTIVE" ? (
              <Button onClick={() => setEnrollDialog(true)} className="w-full bg-[#191919] bg-none hover:bg-[#27272A] sm:w-auto">
                <Plus /> Enroll learners
              </Button>
            ) : null}
          </div>
          <ClassRosterTable
            intakeId={intake.id}
            deliveryMode={intake.accessType === "FREE" ? "FREE" : "PAID"}
            certificateEnabled={intake.certificateEnabled}
          />
        </TabsContent>

        {intake.accessType === "PAID" ? (
          <TabsContent value="enrollment-requests" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Enrollment requests</h2>
              <p className="text-sm text-muted-foreground">
                Visitors who clicked Enroll on the public course page. Contact them, then convert once they&apos;ve paid.
              </p>
            </div>
            <EnrollmentRequestsTab
              intakeId={intake.id}
              coursePrice={course.price}
              discountAmount={course.discountAmount}
              initialRequestId={initialRequestId}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="certificates" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Certificate issuance</h2>
            <p className="text-sm text-muted-foreground">
              Track who&apos;s eligible and issue or revoke certificates for this intake&apos;s completed learners.
            </p>
          </div>
          <CourseCertificatesTab intakeId={intake.id} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Student projects</h2>
            <p className="text-sm text-muted-foreground">
              Review and approve project submissions from this intake&apos;s learners.
            </p>
          </div>
          <CourseProjectsTab intakeId={intake.id} />
        </TabsContent>
      </Tabs>

      <Dialog open={enrollDialog} onOpenChange={setEnrollDialog}>
        <DialogContent className="max-h-[90vh] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Enroll paid learners</DialogTitle>
            <DialogDescription>
              Add verified students who paid for {intake.code}. Capacity is enforced transactionally.
            </DialogDescription>
          </DialogHeader>
          <ManualEnrollmentForm
            intakeId={intake.id}
            coursePrice={course.price}
            discountAmount={course.discountAmount}
            onSuccess={() => setEnrollDialog(false)}
            onCancel={() => setEnrollDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
