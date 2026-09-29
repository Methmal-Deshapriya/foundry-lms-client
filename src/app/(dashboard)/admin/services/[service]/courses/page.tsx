"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  CalendarCheck,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { AdminCatalogBreadcrumbs } from "@/features/catalog/components/AdminCatalogBreadcrumbs";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { CourseKpiTile } from "@/features/catalog/components/admin/CourseKpiTile";
import { PaymentsProjectsSummary } from "@/features/catalog/components/admin/PaymentsProjectsSummary";
import { CourseForm } from "@/features/catalog/components/CourseForm";
import { CourseTable } from "@/features/catalog/components/CourseTable";
import { LearningServiceForm } from "@/features/catalog/components/LearningServiceForm";
import {
  useDeleteLearningServiceMutation,
  useGetAdminLearningServiceSummariesQuery,
  useGetCoursesQuery,
  useTransitionLearningServiceMutation,
} from "@/features/catalog/catalogApi";
import { hasPermission, PERMISSIONS } from "@/lib/access";
import { getApiErrorMessage } from "@/lib/api";
import { Icons } from "@/lib/icons";
import { LEARNING_SERVICE_STATUS_STYLES } from "@/lib/statusColors";
import { formatLKR } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { selectAuthUser } from "@/features/auth/authSelectors";

export default function ServiceCoursesPage() {
  const router = useRouter();
  const user = useAppSelector(selectAuthUser);
  const canPublish = hasPermission(user, PERMISSIONS.LEARNING_SERVICES_PUBLISH);
  const canDelete = hasPermission(user, PERMISSIONS.LEARNING_SERVICES_DELETE_PERMANENTLY);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
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
  const [transitionService, transitionState] = useTransitionLearningServiceMutation();
  const [deleteService, deleteState] = useDeleteLearningServiceMutation();

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

  const transition = async (action: "activate" | "deactivate" | "archive" | "unarchive") => {
    try {
      await transitionService({ id: service.id, action, expectedStatus: service.status }).unwrap();
      toast.success(`Learning service ${action}d`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not change learning-service status"));
    }
  };

  const remove = async () => {
    if (!window.confirm(`Permanently delete unused service “${service.title}”?`)) return;
    try {
      await deleteService(service.id).unwrap();
      toast.success("Unused learning service permanently deleted");
      router.push("/admin/services");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete learning service"));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogBreadcrumbs
        crumbs={[
          { label: "Services", href: "/admin/services" },
          { label: service.title },
        ]}
      />
      <AdminCatalogPageHeader
        title={service.title}
        description="Everything this service offers, plus the revenue, payments, and outcomes it's produced so far."
        badge={
          <Badge variant="outline" className={`${LEARNING_SERVICE_STATUS_STYLES[service.status]} px-1.5 py-0 text-[10px]`}>
            {service.status}
          </Badge>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={service.status === "ARCHIVED"} onClick={() => setEditOpen(true)}>
              <Pencil /> Edit
            </Button>
            <Button variant="outline" asChild>
              <a href={`/${service.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> <span className="hidden sm:inline">View public page</span>
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label={`More actions for ${service.title}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canPublish && service.status === "DRAFT" ? (
                  <DropdownMenuItem onSelect={() => transition("activate")}>
                    <Eye /> Activate
                  </DropdownMenuItem>
                ) : null}
                {canPublish && service.status === "ACTIVE" ? (
                  <DropdownMenuItem onSelect={() => transition("deactivate")}>
                    <EyeOff /> Return to draft
                  </DropdownMenuItem>
                ) : null}
                {canPublish && service.status === "ARCHIVED" ? (
                  <DropdownMenuItem onSelect={() => transition("unarchive")}>
                    <ArchiveRestore /> Restore as draft
                  </DropdownMenuItem>
                ) : null}
                {canPublish && service.status !== "ARCHIVED" ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={transitionState.isLoading} variant="destructive" onSelect={() => transition("archive")}>
                      <Archive /> Archive
                    </DropdownMenuItem>
                  </>
                ) : null}
                {canDelete && service.status === "ARCHIVED" && service.courseCount === 0 ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" disabled={deleteState.isLoading} onSelect={remove}>
                      <Trash2 /> Delete permanently
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
        <CourseKpiTile
          size="sm"
          className="w-full min-w-0"
          icon={BookOpen}
          label="Courses"
          value={courses.filter((course) => !course.archivedAt).length}
        />
        <CourseKpiTile
          size="sm"
          className="w-full min-w-0"
          icon={CalendarCheck}
          label="Open for enrollment"
          value={courses.filter((course) => course.enrollmentStatus === "OPEN").length}
        />
        <CourseKpiTile
          size="sm"
          className="w-full min-w-0"
          icon={Layers}
          label="Total intakes"
          value={courses.reduce((total, course) => total + course.intakeCount, 0)}
        />
        <CourseKpiTile
          size="sm"
          className="w-full min-w-0"
          icon={Icons.revenue}
          label="Total revenue"
          value={formatLKR(service.revenue.total)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PaymentsProjectsSummary
          payments={service.paymentBreakdown}
          projects={service.projects}
          certificates={service.certificates}
        />
      </div>
      {/* Same "section heading + create button directly above its own
          table" pattern IntakeTable.tsx already uses on the course detail
          page, rather than the create action living up in the page header.
          Stacks below sm — description text otherwise crowds right up
          against the button (or the button gets squeezed) before either
          gets a chance to wrap onto its own line. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Courses</h2>
          <p className="text-sm text-muted-foreground">
            Each course here is a real-world program students browse and enroll in. Its intakes are the scheduled runs — sessions, enrollments, and lifecycle live there.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full bg-[#191919] bg-none hover:bg-[#27272A] sm:w-auto">
          <Plus /> New course
        </Button>
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
        <DialogContent className="max-h-[92vh] sm:max-w-2xl">
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit learning service</DialogTitle>
            <DialogDescription>Identity and policy lock after the first course is created.</DialogDescription>
          </DialogHeader>
          <LearningServiceForm
            initial={service}
            onSuccess={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
