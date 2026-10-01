"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { BookOpen, Calendar, Eye, EyeOff, ExternalLink, Github, Globe, Link2, MessageSquare, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ThumbnailImage } from "@/components/ui/thumbnail-image";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_STYLES } from "@/lib/statusColors";
import type { StudentProject } from "@/features/projects/projectsTypes";
import { useSetProjectVisibilityMutation } from "@/features/projects/projectsApi";
import { getApiErrorMessage } from "@/lib/api";
import { ProjectEditDialog } from "./ProjectEditDialog";

/**
 * Row/card detail view for a student's own project — opened from the My
 * Projects list instead of navigating to a separate page. Editing (while
 * PENDING) opens its own Dialog on top of this Sheet rather than a third
 * route, per the same "Sheet for detail, Dialog for forms" convention the
 * admin catalog pages already use.
 */
export function ProjectDetailSheet({
  project,
  open,
  onOpenChange,
}: {
  project: StudentProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [setVisibility, { isLoading: isChangingVisibility }] = useSetProjectVisibilityMutation();

  if (!project) return null;

  // Students can take a project off the showcase (and their profile) at any
  // time, including after approval — code review M08-01.
  const toggleVisibility = async () => {
    try {
      await setVisibility({ id: project.id, isPublic: !project.isPublic }).unwrap();
      toast.success(project.isPublic ? "Project hidden from the showcase" : "Project will show on the showcase once approved");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not change the project's visibility."));
    }
  };
  const visibilityNote = project.isPublic
    ? project.status === "APPROVED"
      ? "Public: shown on the showcase and your profile."
      : "Public: it will be shown on the showcase once approved."
    : "Hidden: only you and your instructors can see it.";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full overflow-y-auto border-l border-border bg-white sm:max-w-lg"
          style={{ backgroundImage: "none" }}
        >
          <SheetHeader>
            <SheetTitle>{project.title}</SheetTitle>
            {project.course?.title ? <SheetDescription>{project.course.title}</SheetDescription> : null}
          </SheetHeader>

          <div className="space-y-5 px-4 pb-6">
            <div className="relative aspect-1280/780 overflow-hidden rounded-lg">
              <ThumbnailImage src={project.thumbnailUrl} alt="" label={project.title} className="absolute inset-0 h-full w-full object-cover" />
            </div>

            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                PROJECT_STATUS_STYLES[project.status],
              )}
            >
              {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
            </span>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {project.description || "No description provided."}
            </p>

            {project.technologies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <span key={tech} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-[#191919]">
                    {tech}
                  </span>
                ))}
              </div>
            ) : null}

            {project.adminFeedback ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#191919]" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground">Instructor Feedback</p>
                </div>
                <p className="text-sm italic leading-relaxed text-muted-foreground">
                  &ldquo;{project.adminFeedback}&rdquo;
                </p>
              </div>
            ) : null}

            {project.githubUrl || project.demoUrl || project.projectUrl ? (
              <div className="space-y-2">
                {project.githubUrl ? (
                  <Button asChild className="w-full justify-start bg-[#191919] bg-none hover:bg-[#27272A] text-white">
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      View Repository
                    </a>
                  </Button>
                ) : null}
                {project.demoUrl ? (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="mr-2 h-4 w-4 text-[#191919]" />
                      Live Demo
                    </a>
                  </Button>
                ) : null}
                {project.projectUrl ? (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                      <Link2 className="mr-2 h-4 w-4 text-[#191919]" />
                      Project Link
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[#191919]">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Course</p>
                  <p className="truncate text-sm font-medium text-foreground" title={project.course?.title}>
                    {project.course?.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[#191919]">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Submitted On</p>
                  <p className="truncate text-sm font-medium text-foreground">
                    {format(new Date(project.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {project.status === "PENDING" ? (
                <Button variant="outline" className="w-full" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Submission
                </Button>
              ) : null}
              {project.status === "REJECTED" ? (
                <Button className="w-full bg-[#191919] bg-none text-white hover:bg-[#27272A]" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit and resubmit
                </Button>
              ) : null}
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{visibilityNote}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={isChangingVisibility}
                  onClick={() => void toggleVisibility()}
                >
                  {project.isPublic ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                  {project.isPublic ? "Hide" : "Make public"}
                </Button>
              </div>
              {project.status === "APPROVED" && project.isPublic ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/projects/showcase/${project.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View public page
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ProjectEditDialog project={project} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
