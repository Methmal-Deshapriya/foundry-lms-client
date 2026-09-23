"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { formatLKR } from "@/lib/utils";
import { COURSE_ENROLLMENT_STATUS_STYLES } from "@/lib/statusColors";
import type { LearningServiceSlug } from "../catalogTypes";
import {
  type AdminCourse,
  type LearningService,
  useArchiveCourseMutation,
  useDeleteCourseMutation,
  usePublishCourseMutation,
  useUnarchiveCourseMutation,
  useUnpublishCourseMutation,
} from "../catalogApi";
import { CatalogStatusBadge } from "./CatalogStatusBadge";
import { CourseForm } from "./CourseForm";

function enrollmentStatusLabel(status: AdminCourse["enrollmentStatus"]) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function CourseTable({
  courses,
  serviceSlug,
  service,
}: {
  courses: AdminCourse[];
  serviceSlug: LearningServiceSlug;
  service: LearningService;
}) {
  const router = useRouter();
  const user = useAppSelector(selectAuthUser);
  const canPublish = hasPermission(user, PERMISSIONS.CATALOG_PUBLISH);
  const canDelete = hasPermission(user, PERMISSIONS.CATALOG_DELETE_PERMANENTLY);
  const [editTarget, setEditTarget] = useState<AdminCourse | null>(null);
  const [publishCourse] = usePublishCourseMutation();
  const [unpublishCourse] = useUnpublishCourseMutation();
  const [archiveCourse] = useArchiveCourseMutation();
  const [unarchiveCourse] = useUnarchiveCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();
  const base = `/admin/services/${serviceSlug}/courses`;

  const togglePublish = async (course: AdminCourse) => {
    try {
      if (course.status === "PUBLISHED") await unpublishCourse(course.id).unwrap();
      else await publishCourse(course.id).unwrap();
      toast.success(course.status === "PUBLISHED" ? "Course unpublished" : "Course published");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not change course"));
    }
  };

  const toggleArchive = async (course: AdminCourse) => {
    try {
      if (course.archivedAt) await unarchiveCourse(course.id).unwrap();
      else await archiveCourse(course.id).unwrap();
      toast.success(course.archivedAt ? "Course restored as a draft" : "Course archived");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not change course"));
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="px-4">Course</TableHead>
              <TableHead className="w-20">Level</TableHead>
              <TableHead className="w-24">Price</TableHead>
              <TableHead className="w-20">Intakes</TableHead>
              <TableHead className="w-32">Enrollment</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center text-muted-foreground">
                  No courses have been created for this service yet.
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => {
                const isArchived = course.status === "ARCHIVED";
                return (
                  <TableRow
                    key={course.id}
                    className="cursor-pointer hover:bg-muted/50"
                    tabIndex={0}
                    onClick={() => router.push(`${base}/${course.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") router.push(`${base}/${course.id}`);
                    }}
                  >
                    <TableCell className="max-w-0 py-4">
                      <p className="truncate font-semibold" title={course.title}>
                        {course.title}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground" title={`/${course.slug} · ${course.intakeCodePrefix}`}>
                        /{course.slug} · {course.intakeCodePrefix}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs">{course.level}</TableCell>
                    <TableCell>
                      {course.service.accessType === "FREE" ? "Free" : formatLKR(course.price)}
                    </TableCell>
                    <TableCell className="font-mono">{course.intakeCount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={COURSE_ENROLLMENT_STATUS_STYLES[course.enrollmentStatus]}>
                        {enrollmentStatusLabel(course.enrollmentStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <CatalogStatusBadge status={course.status} />
                    </TableCell>
                    <TableCell className="pr-4 text-right" onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${course.title}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled={isArchived} onSelect={() => setEditTarget(course)}>
                            <Pencil /> Edit course
                          </DropdownMenuItem>
                          {canPublish && !isArchived ? (
                            <DropdownMenuItem onSelect={() => togglePublish(course)}>
                              {course.status === "PUBLISHED" ? <EyeOff /> : <Eye />}
                              {course.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                            </DropdownMenuItem>
                          ) : null}
                          {canPublish ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant={isArchived ? undefined : "destructive"}
                                onSelect={() => toggleArchive(course)}
                              >
                                {isArchived ? <ArchiveRestore /> : <Archive />}{" "}
                                {isArchived ? "Restore as draft" : "Archive course"}
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          {canDelete && isArchived && course.intakeCount === 0 ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() =>
                                  deleteCourse(course.id)
                                    .unwrap()
                                    .then(() => toast.success("Course deleted"))
                                    .catch((error) => toast.error(getApiErrorMessage(error, "Could not delete course")))
                                }
                              >
                                <Trash2 /> Delete course
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit course</DialogTitle>
            <DialogDescription>
              Content shared by every intake this course has. Slug, code prefix, certificate policy, and discount are locked after creation.
            </DialogDescription>
          </DialogHeader>
          {editTarget ? (
            <CourseForm service={service} initial={editTarget} onSuccess={() => setEditTarget(null)} onCancel={() => setEditTarget(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
