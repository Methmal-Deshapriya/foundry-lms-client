"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/store/hooks";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { hasPermission, PERMISSIONS } from "@/lib/access";
import { getApiErrorMessage } from "@/lib/api";
import { INTAKE_STATUS_STYLES } from "@/lib/statusColors";
import {
  type AdminCourse,
  type AdminIntake,
  type IntakeStatus,
  useDeleteIntakePermanentlyMutation,
  useUpdateIntakeStatusMutation,
} from "../catalogApi";
import { IntakeForm } from "./IntakeForm";

const transitions: Record<IntakeStatus, IntakeStatus[]> = {
  DRAFT: ["OPEN_ACTIVE", "CANCELLED"],
  OPEN_ACTIVE: ["CLOSED_ACTIVE", "CANCELLED"],
  CLOSED_ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
  ARCHIVED: [],
};

function statusLabel(status: IntakeStatus) {
  return status.replace("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function IntakeTable({
  course,
  intakes,
  serviceSlug,
  categoryId,
}: {
  course: AdminCourse;
  intakes: AdminIntake[];
  serviceSlug: string;
  categoryId: string;
}) {
  const router = useRouter();
  const user = useAppSelector(selectAuthUser);
  const canPublish = hasPermission(user, PERMISSIONS.CATALOG_PUBLISH);
  const canDelete = hasPermission(user, PERMISSIONS.CATALOG_DELETE_PERMANENTLY);
  const [intakeDialog, setIntakeDialog] = useState<{ intake?: AdminIntake } | null>(null);
  const [updateStatus, statusState] = useUpdateIntakeStatusMutation();
  const [deleteIntake] = useDeleteIntakePermanentlyMutation();
  const base = `/admin/services/${serviceSlug}/categories/${categoryId}/courses/${course.id}/intakes`;
  const courseReadOnly = Boolean(course.archivedAt) || course.category.status === "ARCHIVED";
  const evergreenLocked = course.category.service.courseMode === "EVERGREEN" && intakes.length > 0;

  const move = async (intake: AdminIntake, status: IntakeStatus) => {
    try {
      await updateStatus({ id: intake.id, status, expectedStatus: intake.status }).unwrap();
      toast.success(`${intake.code} moved to ${statusLabel(status)}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not change intake status"));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Intakes</h2>
          <p className="text-sm text-muted-foreground">
            Each intake owns its own sessions, enrollments, and lifecycle. Only one can be Open-Active at a time.
          </p>
        </div>
        <Button
          disabled={courseReadOnly || evergreenLocked}
          onClick={() => setIntakeDialog({})}
        >
          <Plus /> New intake
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="px-4">Intake</TableHead>
              <TableHead className="w-28">Dates</TableHead>
              <TableHead className="w-24">Curriculum</TableHead>
              <TableHead className="w-24">Learners</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {intakes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Button variant="link" disabled={courseReadOnly} onClick={() => setIntakeDialog({})}>
                    + Create the first intake
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              intakes.map((intake) => (
                <TableRow
                  key={intake.id}
                  className="cursor-pointer hover:bg-muted/50"
                  tabIndex={0}
                  onClick={() => router.push(`${base}/${intake.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") router.push(`${base}/${intake.id}`);
                  }}
                >
                  <TableCell className="max-w-0 py-4">
                    <p className="truncate font-semibold" title={intake.intakeKey}>
                      {intake.intakeKey}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground" title={intake.code}>
                      {intake.code}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs">
                    {intake.instanceKind === "EVERGREEN" ? (
                      "Evergreen"
                    ) : (
                      <>
                        {intake.startDate ? new Date(intake.startDate).toLocaleDateString() : "—"}
                        <br />
                        {intake.expectedEndDate ? new Date(intake.expectedEndDate).toLocaleDateString() : "—"}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">{intake.sessionCount}</TableCell>
                  <TableCell className="font-mono">
                    {intake.enrollmentCount}
                    {intake.capacity ? ` / ${intake.capacity}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge className={INTAKE_STATUS_STYLES[intake.status]}>{statusLabel(intake.status)}</Badge>
                  </TableCell>
                  <TableCell className="pr-4 text-right" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${intake.code}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={courseReadOnly || ["COMPLETED", "CANCELLED", "ARCHIVED"].includes(intake.status)}
                          onSelect={() => setIntakeDialog({ intake })}
                        >
                          <Pencil /> Edit intake setup
                        </DropdownMenuItem>
                        {transitions[intake.status].map((target) => (
                          <DropdownMenuItem
                            key={target}
                            disabled={
                              (courseReadOnly && target === "OPEN_ACTIVE") ||
                              statusState.isLoading ||
                              (["OPEN_ACTIVE", "CLOSED_ACTIVE", "ARCHIVED"].includes(target) && !canPublish)
                            }
                            onSelect={() => move(intake, target)}
                          >
                            {statusLabel(target)}
                          </DropdownMenuItem>
                        ))}
                        {canDelete &&
                        intake.status === "ARCHIVED" &&
                        intake.sessionCount === 0 &&
                        intake.enrollmentCount === 0 &&
                        intake.projectCount === 0 ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() =>
                                deleteIntake(intake.id)
                                  .unwrap()
                                  .then(() => toast.success("Intake deleted"))
                                  .catch((error) => toast.error(getApiErrorMessage(error, "Could not delete intake")))
                              }
                            >
                              <Trash2 /> Delete permanently
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(intakeDialog)} onOpenChange={(open) => !open && setIntakeDialog(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{intakeDialog?.intake ? "Edit intake setup" : "Create a new intake"}</DialogTitle>
            <DialogDescription>
              Almost everything here is inherited from {course.title} — only dates, timezone, and capacity are its own.
            </DialogDescription>
          </DialogHeader>
          {intakeDialog ? (
            <IntakeForm
              course={course}
              initial={intakeDialog.intake}
              onSuccess={() => setIntakeDialog(null)}
              onCancel={() => setIntakeDialog(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
