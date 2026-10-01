"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Github, Globe, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ObjectUploadField } from "@/features/storage/components/ObjectUploadField";
import { useUpdateProjectMutation } from "@/features/projects/projectsApi";
import type { StudentProject } from "@/features/projects/projectsTypes";
import { getApiErrorMessage } from "@/lib/api";

function formFromProject(project: StudentProject) {
  return {
    title: project.title,
    description: project.description || "",
    thumbnailObjectId: project.thumbnailObjectId ?? null,
    projectUrl: project.projectUrl || "",
    githubUrl: project.githubUrl || "",
    demoUrl: project.demoUrl || "",
    technologies: project.technologies.join(", "),
    isPublic: project.isPublic,
  };
}

/**
 * Editing a PENDING project, or fixing a REJECTED one and sending it back
 * for review (code review M08-02) — a Dialog opened from
 * ProjectDetailSheet. Same "Sheet for detail, Dialog for forms" split as the
 * admin catalog pages.
 */
export function ProjectEditDialog({
  project,
  open,
  onOpenChange,
}: {
  project: StudentProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [form, setForm] = useState(() => formFromProject(project));
  const isResubmission = project.status === "REJECTED";

  // Reset the form to the project's current data whenever this transitions
  // from closed to open — adjusted during render rather than an effect, per
  // React's guidance for "reset state when a prop changes" (same pattern as
  // SubmitProjectDialog).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setForm(formFromProject(project));
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await updateProject({
        id: project.id,
        data: {
          title: form.title,
          // A cleared field is sent as null so the server actually clears it
          // (undefined means "leave unchanged") — code review M08-06.
          description: form.description.trim() || null,
          thumbnailObjectId: form.thumbnailObjectId,
          projectUrl: form.projectUrl.trim() || null,
          githubUrl: form.githubUrl.trim() || null,
          demoUrl: form.demoUrl.trim() || null,
          technologies: form.technologies
            .split(",")
            .map((tech) => tech.trim())
            .filter(Boolean),
          isPublic: form.isPublic,
        },
      }).unwrap();
      toast.success(isResubmission ? "Project sent back for review" : "Project updated successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update project."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] border-border bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isResubmission ? "Edit and resubmit" : "Edit project"}</DialogTitle>
          <DialogDescription>
            {isResubmission
              ? "Make the changes your instructor asked for. Saving sends the project back for review."
              : "Update your submission while it’s still pending review."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Project title</Label>
            <Input
              id="edit-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              rows={4}
              className="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-githubUrl" className="flex items-center gap-1.5">
                <Github className="size-3.5" /> GitHub repository
              </Label>
              <Input
                id="edit-githubUrl"
                placeholder="https://github.com/..."
                value={form.githubUrl}
                onChange={(event) => setForm({ ...form, githubUrl: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-demoUrl" className="flex items-center gap-1.5">
                <Globe className="size-3.5" /> Live demo URL
              </Label>
              <Input
                id="edit-demoUrl"
                placeholder="https://..."
                value={form.demoUrl}
                onChange={(event) => setForm({ ...form, demoUrl: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-projectUrl" className="flex items-center gap-1.5">
              <Link2 className="size-3.5" /> Project link
            </Label>
            <Input
              id="edit-projectUrl"
              placeholder="https://..."
              value={form.projectUrl}
              onChange={(event) => setForm({ ...form, projectUrl: event.target.value })}
            />
          </div>

          <ObjectUploadField
            label="Thumbnail image"
            purpose="PROJECT_THUMBNAIL"
            accept="image/jpeg,image/png,image/webp,image/avif"
            value={form.thumbnailObjectId}
            initialObject={project.thumbnailObject}
            onChange={(id) => setForm({ ...form, thumbnailObjectId: id })}
          />

          <div className="space-y-2">
            <Label htmlFor="edit-technologies">Technologies (comma separated)</Label>
            <Input
              id="edit-technologies"
              value={form.technologies}
              onChange={(event) => setForm({ ...form, technologies: event.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 rounded-md border border-input p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Make project public</p>
              <p className="text-xs text-muted-foreground">
                Public projects appear in our community showcase after approval.
              </p>
            </div>
            <input
              type="checkbox"
              className="size-5 rounded border-input"
              checked={form.isPublic}
              onChange={(event) => setForm({ ...form, isPublic: event.target.checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating} className="bg-[#191919] bg-none hover:bg-[#27272A]">
              {isUpdating ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              {isResubmission ? "Save and resubmit" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
