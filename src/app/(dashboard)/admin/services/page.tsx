"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { selectAuthUser } from "@/features/auth/authSelectors";
import {
  type AdminLearningServiceSummary,
  useDeleteLearningServiceMutation,
  useGetAdminLearningServiceSummariesQuery,
  useTransitionLearningServiceMutation,
} from "@/features/catalog/catalogApi";
import { AdminCatalogBreadcrumbs } from "@/features/catalog/components/AdminCatalogBreadcrumbs";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { CourseKpiTile } from "@/features/catalog/components/admin/CourseKpiTile";
import { LearningServiceForm } from "@/features/catalog/components/LearningServiceForm";
import { NavigableTableRow } from "@/features/catalog/components/NavigableTableRow";
import { hasPermission, PERMISSIONS } from "@/lib/access";
import { getApiErrorMessage } from "@/lib/api";
import { Icons } from "@/lib/icons";
import { LEARNING_SERVICE_STATUS_STYLES } from "@/lib/statusColors";
import { useAppSelector } from "@/store/hooks";

// Shared between the desktop table row and the narrow-screen card below —
// same actions, same permission gates, just mounted from two call sites so
// each layout can place the trigger where it makes sense there.
function ServiceActionsMenu({
  service,
  canManage,
  canPublish,
  canDelete,
  isDeleting,
  onEdit,
  onTransition,
  onDelete,
}: {
  service: AdminLearningServiceSummary;
  canManage: boolean;
  canPublish: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onTransition: (action: "activate" | "deactivate" | "archive" | "unarchive") => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${service.title}`} data-no-row-navigation>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canManage && service.status !== "ARCHIVED" ? (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Edit service
          </DropdownMenuItem>
        ) : null}
        {canPublish && service.status === "DRAFT" ? (
          <DropdownMenuItem onSelect={() => onTransition("activate")}>
            <Eye /> Activate
          </DropdownMenuItem>
        ) : null}
        {canPublish && service.status === "ACTIVE" ? (
          <DropdownMenuItem onSelect={() => onTransition("deactivate")}>
            <EyeOff /> Return to draft
          </DropdownMenuItem>
        ) : null}
        {canPublish && service.status === "ARCHIVED" ? (
          <DropdownMenuItem onSelect={() => onTransition("unarchive")}>
            <ArchiveRestore /> Restore as draft
          </DropdownMenuItem>
        ) : null}
        {canPublish && service.status !== "ARCHIVED" ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onTransition("archive")}>
              <Archive /> Archive
            </DropdownMenuItem>
          </>
        ) : null}
        {canDelete && service.status === "ARCHIVED" && service.courseCount === 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={isDeleting} onSelect={onDelete}>
              <Trash2 /> Delete permanently
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ServiceAttentionBadge({ count }: { count: number }) {
  return count ? (
    <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-700">
      <AlertTriangle className="size-2.5" />
      {count}
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-700">
      <CheckCircle2 className="size-2.5" />
      Ready
    </Badge>
  );
}

export default function AdminServicesPage() {
  const user = useAppSelector(selectAuthUser);
  const canManage = hasPermission(user, PERMISSIONS.LEARNING_SERVICES_MANAGE);
  const canPublish = hasPermission(user, PERMISSIONS.LEARNING_SERVICES_PUBLISH);
  const canDelete = hasPermission(
    user,
    PERMISSIONS.LEARNING_SERVICES_DELETE_PERMANENTLY,
  );
  const { data, isLoading, isError, refetch } =
    useGetAdminLearningServiceSummariesQuery();
  const services = data?.services ?? [];
  const [editing, setEditing] = useState<
    AdminLearningServiceSummary | "new" | null
  >(null);
  const [transitionService] = useTransitionLearningServiceMutation();
  const [deleteService, deleteState] = useDeleteLearningServiceMutation();

  const totals = services.reduce(
    (total, service) => ({
      courses: total.courses + service.courses.total,
      intakes: total.intakes + service.intakes.total,
      learners: total.learners + service.learners.activeUnique,
      attention: total.attention + service.attentionCount,
    }),
    { courses: 0, intakes: 0, learners: 0, attention: 0 },
  );

  const transition = async (
    service: AdminLearningServiceSummary,
    action: "activate" | "deactivate" | "archive" | "unarchive",
  ) => {
    try {
      await transitionService({
        id: service.id,
        action,
        expectedStatus: service.status,
      }).unwrap();
      toast.success(`Learning service ${action}d`);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Could not change learning-service status"),
      );
    }
  };

  const remove = async (service: AdminLearningServiceSummary) => {
    if (
      !window.confirm(`Permanently delete unused service “${service.title}”?`)
    )
      return;
    try {
      await deleteService(service.id).unwrap();
      toast.success("Unused learning service permanently deleted");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Could not delete learning service"),
      );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogBreadcrumbs crumbs={[{ label: "Services" }]} />
      <AdminCatalogPageHeader
        title="Services"
        description="Learning services own access, course mode, enrollment, and payment policy for everything below them."
        action={
          canManage ? (
            <Button onClick={() => setEditing("new")} className="bg-[#191919] bg-none hover:bg-[#27272A]">
              <Plus /> New service
            </Button>
          ) : null
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
          icon={Icons.myCourses}
          label="Courses"
          value={totals.courses}
        />
        <CourseKpiTile
          size="sm"
          className="w-full min-w-0"
          icon={Icons.intakes}
          label="Intakes"
          value={totals.intakes}
        />
        <CourseKpiTile
          size="sm"
          className="w-full min-w-0"
          icon={Icons.users}
          label="Active learners"
          value={totals.learners}
        />
        <CourseKpiTile
          size="sm"
          className="w-full min-w-0"
          icon={Icons.attention}
          label="Needs attention"
          value={totals.attention}
        />
      </div>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed min-w-5xl">
          <TableCaption className="sr-only">
            Learning services summary
          </TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-72 px-4">Service</TableHead>
              <TableHead className="w-28 px-3">Courses</TableHead>
              <TableHead className="w-40 px-3">Intake lifecycle</TableHead>
              <TableHead className="w-32 px-3">Learners</TableHead>
              <TableHead className="w-52 px-3">Inherited policy</TableHead>
              <TableHead className="w-20 px-3">Attention</TableHead>
              <TableHead className="w-20 pr-6 pl-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <span role="status" aria-live="polite">
                    Loading services…
                  </span>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <p role="alert" className="text-destructive">
                    Could not load services.
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    onClick={() => refetch()}
                  >
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No learning services exist yet.
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <NavigableTableRow
                  key={service.id}
                  href={`/admin/services/${service.slug}/courses`}
                  label={`Open ${service.title} courses`}
                >
                  <TableCell className="max-w-sm whitespace-normal px-4 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{service.title}</p>
                      <Badge
                        variant="outline"
                        className={`${LEARNING_SERVICE_STATUS_STYLES[service.status]} px-1.5 py-0 text-[10px]`}
                      >
                        {service.status}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground" title={service.description}>
                      {service.description}
                    </p>
                  </TableCell>
                  <TableCell className="px-3">
                    <p className="truncate font-mono">
                      {service.courses.published} /{" "}
                      {service.courses.total - service.courses.archived}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      published / active
                    </p>
                  </TableCell>
                  <TableCell className="px-3">
                    <p
                      className="truncate font-mono"
                      title={`${service.intakes.openActive} / ${service.intakes.closedActive} / ${service.intakes.completed}`}
                    >
                      {service.intakes.openActive} /{" "}
                      {service.intakes.closedActive} /{" "}
                      {service.intakes.completed}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      open / closed-active / completed
                    </p>
                  </TableCell>
                  <TableCell className="px-3">
                    <p className="truncate font-mono">{service.learners.activeUnique}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {service.learners.activeEnrollments} active enrollments
                    </p>
                  </TableCell>
                  <TableCell className="px-3">
                    <p className="truncate font-medium">
                      {service.accessType} · {service.courseMode}
                    </p>
                    <p
                      className="truncate text-xs text-muted-foreground"
                      title={`${service.enrollmentMode} enrollment · payment ${service.paymentRequirement.toLowerCase().replace("_", " ")}`}
                    >
                      {service.enrollmentMode} enrollment · payment{" "}
                      {service.paymentRequirement
                        .toLowerCase()
                        .replace("_", " ")}
                    </p>
                  </TableCell>
                  <TableCell className="px-3">
                    <ServiceAttentionBadge count={service.attentionCount} />
                  </TableCell>
                  <TableCell className="pr-6 pl-3 text-right" data-no-row-navigation>
                    <ServiceActionsMenu
                      service={service}
                      canManage={canManage}
                      canPublish={canPublish}
                      canDelete={canDelete}
                      isDeleting={deleteState.isLoading}
                      onEdit={() => setEditing(service)}
                      onTransition={(action) => transition(service, action)}
                      onDelete={() => remove(service)}
                    />
                  </TableCell>
                </NavigableTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing === "new"
                ? "New learning service"
                : "Edit learning service"}
            </DialogTitle>
            <DialogDescription>
              {editing === "new"
                ? "Every step below feeds the public home page card and the service's own detail page — the service goes live from this data alone."
                : "Identity and policy lock after the first course is created."}
            </DialogDescription>
          </DialogHeader>
          <LearningServiceForm
            initial={editing !== "new" && editing !== null ? editing : undefined}
            onSuccess={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
