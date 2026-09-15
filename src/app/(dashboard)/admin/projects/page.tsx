"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Clock, ExternalLink, FolderGit2, Loader2, MoreHorizontal, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CursorPagination } from "@/components/ui/cursor-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterPills, type FilterPillOption } from "@/components/ui/filter-pills";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetAllProjectsAdminQuery, useReviewProjectMutation, type ProjectAdminSummary } from "@/features/projects/projectsApi";
import type { ProjectStatus, StudentProject } from "@/features/projects/projectsTypes";
import { getApiErrorMessage } from "@/lib/api";
import { PROJECT_STATUS_STYLES } from "@/lib/statusColors";
import { cn } from "@/lib/utils";

const statusStyles = PROJECT_STATUS_STYLES;

const STATUS_PILLS: { key: ProjectStatus | ""; label: string; countKey: keyof ProjectAdminSummary }[] = [
  { key: "", label: "All", countKey: "all" },
  { key: "PENDING", label: "Pending", countKey: "pending" },
  { key: "APPROVED", label: "Approved", countKey: "approved" },
  { key: "REJECTED", label: "Rejected", countKey: "rejected" },
];
const PILL_ACTIVE_CLASS: Record<ProjectStatus | "", string> = {
  "": "border-primary bg-primary/10 text-primary",
  PENDING: statusStyles.PENDING,
  APPROVED: statusStyles.APPROVED,
  REJECTED: statusStyles.REJECTED,
};

const FILTER_DEBOUNCE_MS = 300;
const MIN_FILTER_LENGTH = 3;
const INTERACTIVE_SELECTOR = "input,button,a,[role=menuitem],[data-no-row-navigation]";

/**
 * The global, cross-course project review queue. Mirrors
 * CourseProjectsTab.tsx (the course workspace's per-intake Projects tab) —
 * same search/FilterPills/Badge/Dialog-review/Sheet-detail shape — just
 * cursor-paginated instead of offset-paginated, with a Course column since
 * rows aren't already scoped to one intake.
 */
export default function AdminProjectsPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const page = cursors.length - 1;

  const debouncedQ = useDebouncedValue(q.trim(), FILTER_DEBOUNCE_MS);
  const appliedQ = debouncedQ.length === 0 || debouncedQ.length >= MIN_FILTER_LENGTH ? debouncedQ : "";

  const { data, isLoading, isFetching, isError } = useGetAllProjectsAdminQuery({
    q: appliedQ || undefined,
    status: statusFilter || undefined,
    cursor: cursors[page],
    limit: 50,
  });
  const [reviewProject, { isLoading: isReviewing }] = useReviewProjectMutation();
  const [reviewTarget, setReviewTarget] = useState<{ project: StudentProject; status: ProjectStatus } | null>(null);
  const [detailProject, setDetailProject] = useState<StudentProject | null>(null);
  const [feedback, setFeedback] = useState("");
  const projects = data?.projects ?? [];

  const resetToFirstPage = () => setCursors([undefined]);

  const openReview = (project: StudentProject, status: ProjectStatus) => {
    setFeedback("");
    setReviewTarget({ project, status });
  };

  const confirmReview = async () => {
    if (!reviewTarget) return;
    try {
      await reviewProject({
        id: reviewTarget.project.id,
        data: { status: reviewTarget.status, adminFeedback: feedback.trim() || null },
      }).unwrap();
      toast.success(`Project ${reviewTarget.status.toLowerCase()}`);
      setReviewTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update project status"));
    }
  };

  const pillOptions: FilterPillOption<ProjectStatus | "">[] = STATUS_PILLS.map(({ key, label, countKey }) => ({
    key,
    label,
    count: data?.summary?.[countKey] ?? 0,
    activeClassName: PILL_ACTIVE_CLASS[key],
  }));

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogPageHeader
        title="Project Review"
        description="Review student project submissions across every course and provide feedback."
        icon={FolderGit2}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Search projects by title, student, or course"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            resetToFirstPage();
          }}
          placeholder="Search title, student, or course"
          className="h-9 w-64 shrink-0"
        />
        <FilterPills
          ariaLabel="Filter by project status"
          options={pillOptions}
          active={statusFilter}
          onChange={(key) => {
            setStatusFilter(key);
            resetToFirstPage();
          }}
        />
      </div>

      <div className="overflow-hidden rounded-md border bg-card" aria-busy={isLoading || isFetching}>
        <Table className="table-fixed">
          <TableCaption className="sr-only">Student projects awaiting or carrying an administrative review</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="px-4">Project</TableHead>
              <TableHead className="w-48">Student / Course</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-28">Submitted</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading projects…
                  </span>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-destructive">
                  <span role="alert">Failed to load projects. Please try again.</span>
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 whitespace-normal text-center text-muted-foreground">
                  {appliedQ || statusFilter ? "No projects match your filters." : "There are no student projects to review yet."}
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow
                  key={project.id}
                  tabIndex={0}
                  aria-label={`View details for ${project.title}`}
                  className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  onClick={(event) => {
                    if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
                    setDetailProject(project);
                  }}
                  onKeyDown={(event) => {
                    if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setDetailProject(project);
                    }
                  }}
                >
                  <TableCell className="max-w-0 px-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="min-w-0 truncate font-semibold" title={project.title}>
                        {project.title}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0",
                          project.isPublic
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "border-muted-foreground/25 bg-muted text-muted-foreground",
                        )}
                      >
                        {project.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-0">
                    <p className="wrap-break-word font-medium">
                      {project.user?.firstName} {project.user?.lastName}
                    </p>
                    <p className="wrap-break-word text-sm text-muted-foreground">{project.course?.title}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[project.status]}>
                      <span className="inline-flex items-center gap-1.5">
                        {project.status === "APPROVED" ? <CheckCircle2 className="size-3" aria-hidden="true" /> : null}
                        {project.status === "REJECTED" ? <XCircle className="size-3" aria-hidden="true" /> : null}
                        {project.status === "PENDING" ? <Clock className="size-3" aria-hidden="true" /> : null}
                        {project.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(project.createdAt), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="pr-4 text-right" data-no-row-navigation>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-lg" aria-label={`Actions for ${project.title}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}`}>
                            <ExternalLink /> View project
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={project.status === "APPROVED"}
                          onSelect={() => openReview(project, "APPROVED")}
                        >
                          <CheckCircle2 /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={project.status === "REJECTED"}
                          onSelect={() => openReview(project, "REJECTED")}
                        >
                          <XCircle /> Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CursorPagination
        page={page}
        hasMore={Boolean(data?.nextCursor)}
        isFetching={isFetching}
        onPrevious={() => setCursors((current) => current.slice(0, -1))}
        onNext={() => {
          const nextCursor = data?.nextCursor;
          if (nextCursor) setCursors((current) => [...current, nextCursor]);
        }}
      />

      <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewTarget?.status === "APPROVED" ? "Approve" : "Reject"} project?</DialogTitle>
            <DialogDescription>
              {reviewTarget?.status === "APPROVED" ? "Approve" : "Reject"} &quot;{reviewTarget?.project.title}&quot;
              {reviewTarget?.status === "REJECTED" ? " — feedback is required so the student knows what to fix." : "."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="project-feedback">
              Feedback{" "}
              {reviewTarget?.status === "REJECTED" ? (
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              ) : (
                "(optional)"
              )}
            </Label>
            <textarea
              id="project-feedback"
              className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder={reviewTarget?.status === "REJECTED" ? "Explain what needs to change" : "Leave blank if none"}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReviewTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={reviewTarget?.status === "REJECTED" ? "destructive" : "default"}
              disabled={isReviewing || (reviewTarget?.status === "REJECTED" && feedback.trim().length === 0)}
              onClick={confirmReview}
            >
              {isReviewing ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              {reviewTarget?.status === "APPROVED" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={Boolean(detailProject)} onOpenChange={(open) => !open && setDetailProject(null)}>
        <SheetContent className="flex flex-col sm:max-w-lg">
          {detailProject ? (
            <>
              <SheetHeader>
                <SheetTitle>{detailProject.title}</SheetTitle>
                <SheetDescription>
                  {detailProject.user?.firstName} {detailProject.user?.lastName}
                  {detailProject.course?.title ? ` · ${detailProject.course.title}` : ""}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-5 overflow-y-auto px-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={statusStyles[detailProject.status]}>
                    {detailProject.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {detailProject.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                {detailProject.description ? (
                  <p className="wrap-break-word text-sm text-muted-foreground">{detailProject.description}</p>
                ) : null}
                {detailProject.technologies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {detailProject.technologies.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {detailProject.adminFeedback ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Feedback</p>
                    <p className="wrap-break-word text-sm text-muted-foreground">{detailProject.adminFeedback}</p>
                  </div>
                ) : null}
                <div className="space-y-1.5 text-sm">
                  <p className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="font-medium">{format(new Date(detailProject.createdAt), "MMM dd, yyyy")}</span>
                  </p>
                  {detailProject.reviewedAt ? (
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Reviewed</span>
                      <span className="font-medium">{format(new Date(detailProject.reviewedAt), "MMM dd, yyyy")}</span>
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/projects/${detailProject.id}`}>
                      <ExternalLink className="mr-2 size-4" aria-hidden="true" /> Open project
                    </Link>
                  </Button>
                  {detailProject.githubUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={detailProject.githubUrl} target="_blank">
                        GitHub
                      </Link>
                    </Button>
                  ) : null}
                  {detailProject.demoUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={detailProject.demoUrl} target="_blank">
                        Live demo
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
