"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Clock, ExternalLink, Loader2, MoreHorizontal, XCircle } from "lucide-react";
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
import { OffsetPagination } from "@/components/ui/offset-pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetAllProjectsAdminQuery, useReviewProjectMutation } from "@/features/projects/projectsApi";
import type { ProjectAdminSummary } from "@/features/projects/projectsApi";
import type { ProjectStatus, StudentProject } from "@/features/projects/projectsTypes";
import { getApiErrorMessage } from "@/lib/api";
import { PROJECT_STATUS_STYLES } from "@/lib/statusColors";

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

const DEFAULT_PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;
const MIN_FILTER_LENGTH = 3;
const INTERACTIVE_SELECTOR = "input,button,a,[role=menuitem],[data-no-row-navigation]";

export function CourseProjectsTab({ intakeId }: { intakeId: string }) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);

  const debouncedQ = useDebouncedValue(q.trim(), FILTER_DEBOUNCE_MS);
  const appliedQ = debouncedQ.length === 0 || debouncedQ.length >= MIN_FILTER_LENGTH ? debouncedQ : "";

  const { data, isLoading, isFetching, isError } = useGetAllProjectsAdminQuery({
    intakeId,
    q: appliedQ || undefined,
    status: statusFilter || undefined,
    limit: pageSize,
    offset,
  });
  const [reviewProject, { isLoading: isReviewing }] = useReviewProjectMutation();
  const [reviewTarget, setReviewTarget] = useState<{ project: StudentProject; status: ProjectStatus } | null>(null);
  const [detailProject, setDetailProject] = useState<StudentProject | null>(null);
  const [feedback, setFeedback] = useState("");
  const projects = data?.projects ?? [];
  const pagination = data?.pagination;

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Search projects by title or student"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setOffset(0);
          }}
          placeholder="Search title or student"
          className="h-9 w-56 shrink-0"
        />
        <FilterPills
          ariaLabel="Filter by project status"
          options={pillOptions}
          active={statusFilter}
          onChange={(key) => {
            setStatusFilter(key);
            setOffset(0);
          }}
        />
      </div>

      <div className="overflow-hidden rounded-md border bg-card" aria-busy={isLoading || isFetching}>
        <Table>
          <TableCaption className="sr-only">Student projects submitted for this course</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="px-4">Project</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
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
                  Could not load projects.
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {q || statusFilter ? "No projects match your filters." : "No projects submitted for this course yet."}
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
                  <TableCell className="max-w-xs whitespace-normal px-4 py-4 font-semibold">{project.title}</TableCell>
                  <TableCell>{project.user?.firstName} {project.user?.lastName}</TableCell>
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
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${project.title}`}>
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
                          disabled={isReviewing || project.status === "APPROVED"}
                          onSelect={() => openReview(project, "APPROVED")}
                        >
                          <CheckCircle2 /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={isReviewing || project.status === "REJECTED"}
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

      {pagination && pagination.total > 0 ? (
        <OffsetPagination
          id="projects-page-size"
          total={pagination.total}
          offset={pagination.offset}
          pageSize={pageSize}
          shownCount={projects.length}
          hasMore={pagination.hasMore}
          onOffsetChange={setOffset}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setOffset(0);
          }}
        />
      ) : null}

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
              Feedback {reviewTarget?.status === "REJECTED" ? <span className="text-red-500" aria-hidden="true">*</span> : "(optional)"}
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
                  <p className="text-sm text-muted-foreground">{detailProject.description}</p>
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
                    <p className="text-sm text-muted-foreground">{detailProject.adminFeedback}</p>
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
