"use client";

import { Fragment, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Github, Globe, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { cn } from "@/lib/utils";
import { useGetMyEnrollmentsQuery } from "@/features/enrollments/enrollmentsApi";
import { useSubmitProjectMutation } from "@/features/projects/projectsApi";
import { getApiErrorMessage } from "@/lib/api";

const WIZARD_STEPS = [
  { step: 1 as const, label: "Basics" },
  { step: 2 as const, label: "Links & tech" },
  { step: 3 as const, label: "Review" },
];
type WizardStep = (typeof WIZARD_STEPS)[number]["step"];
const LAST_STEP: WizardStep = WIZARD_STEPS[WIZARD_STEPS.length - 1].step;

const EMPTY_FORM = {
  enrollmentId: "",
  title: "",
  description: "",
  thumbnailUrl: "",
  projectUrl: "",
  githubUrl: "",
  demoUrl: "",
  technologies: [] as string[],
  isPublic: true,
};

/**
 * Submitting a project used to be its own full page at /projects/new — a
 * single long form. Folded into a dialog instead, launched from wherever
 * "Submit project" appears (the My Projects page, and the classroom page's
 * Project fact tile). Follows the same stepper wizard the admin catalog's
 * "New course" dialog established (CourseForm.tsx) — numbered circle steps
 * with connecting lines, a "Step X of Y — Label" caption, and the same
 * Back/Cancel-left, Next/Submit-right footer — so wizard dialogs read the
 * same across the app rather than each inventing its own progress UI.
 */
export function SubmitProjectDialog({
  open,
  onOpenChange,
  defaultEnrollmentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEnrollmentId?: string;
}) {
  const { data: enrollmentPage, isLoading: isEnrollmentsLoading } = useGetMyEnrollmentsQuery({ limit: 50 });
  const enrollments = (enrollmentPage?.enrollments ?? []).filter((enrollment) => enrollment.status !== "CANCELLED");
  const [submitProject, { isLoading: isSubmitting }] = useSubmitProjectMutation();

  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [form, setForm] = useState(EMPTY_FORM);

  // Reset to a clean first step whenever this transitions from closed to
  // open, pre-filling the course when one was passed in (e.g. from a
  // specific classroom page) — adjusted during render rather than an
  // effect, per React's guidance for "reset state when a prop changes".
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setWizardStep(1);
      setForm({ ...EMPTY_FORM, enrollmentId: defaultEnrollmentId ?? "" });
    }
  }

  const selectedEnrollment = enrollments.find((enrollment) => enrollment.id === form.enrollmentId);
  const isBasicsValid = form.enrollmentId !== "" && form.title.trim() !== "";

  const performSubmit = async () => {
    if (!selectedEnrollment) return;
    try {
      await submitProject({
        enrollmentId: selectedEnrollment.id,
        intakeId: selectedEnrollment.intakeId,
        title: form.title,
        description: form.description || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        projectUrl: form.projectUrl || undefined,
        githubUrl: form.githubUrl || undefined,
        demoUrl: form.demoUrl || undefined,
        technologies: form.technologies,
        isPublic: form.isPublic,
      }).unwrap();
      toast.success("Project submitted for review!");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to submit project."));
    }
  };

  const submitWizard = async (event: FormEvent) => {
    event.preventDefault();
    if (wizardStep < LAST_STEP) {
      setWizardStep((step) => (step + 1) as WizardStep);
      return;
    }
    await performSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Submit a project</DialogTitle>
          <DialogDescription>
            Share what you built for instructors — and the community, if you make it public — to see.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-1">
              {WIZARD_STEPS.map(({ step }, index) => (
                <Fragment key={step}>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      wizardStep === step
                        ? "bg-linear-to-r from-blue-600 to-indigo-500 text-white"
                        : wizardStep > step
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {wizardStep > step ? <Check className="size-3.5" aria-hidden="true" /> : step}
                  </span>
                  {index < WIZARD_STEPS.length - 1 ? (
                    <div className={cn("h-px min-w-3 flex-1", wizardStep > step ? "bg-primary/40" : "bg-border")} />
                  ) : null}
                </Fragment>
              ))}
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              Step {wizardStep} of {LAST_STEP} — {WIZARD_STEPS[wizardStep - 1].label}
            </p>
          </div>

          <form onSubmit={submitWizard} className="space-y-6 pt-2">
            {wizardStep === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="enrollmentId">Course</Label>
                  {isEnrollmentsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading your courses…
                    </div>
                  ) : (
                    <select
                      id="enrollmentId"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none"
                      value={form.enrollmentId}
                      onChange={(event) => setForm({ ...form, enrollmentId: event.target.value })}
                    >
                      <option value="">-- Choose a course --</option>
                      {enrollments.map((enrollment) => (
                        <option key={enrollment.id} value={enrollment.id}>
                          {enrollment.course.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Project title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., E-Commerce Dashboard"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Tell us about your project, the problems it solves, and what you learned."
                    className="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                  />
                </div>
              </div>
            ) : null}

            {wizardStep === 2 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl" className="flex items-center gap-1.5">
                      <Github className="size-3.5" /> GitHub repository
                    </Label>
                    <Input
                      id="githubUrl"
                      placeholder="https://github.com/..."
                      value={form.githubUrl}
                      onChange={(event) => setForm({ ...form, githubUrl: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demoUrl" className="flex items-center gap-1.5">
                      <Globe className="size-3.5" /> Live demo URL
                    </Label>
                    <Input
                      id="demoUrl"
                      placeholder="https://..."
                      value={form.demoUrl}
                      onChange={(event) => setForm({ ...form, demoUrl: event.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl" className="flex items-center gap-1.5">
                    <ImageIcon className="size-3.5" /> Thumbnail image URL (optional)
                  </Label>
                  <Input
                    id="thumbnailUrl"
                    placeholder="https://..."
                    value={form.thumbnailUrl}
                    onChange={(event) => setForm({ ...form, thumbnailUrl: event.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technologies">Technologies</Label>
                  <TagInput
                    id="technologies"
                    value={form.technologies}
                    onChange={(technologies) => setForm({ ...form, technologies })}
                    placeholder="React, Tailwind, Node.js…"
                  />
                </div>
              </div>
            ) : null}

            {wizardStep === 3 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-md border border-input p-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Make project public</p>
                    <p className="text-xs text-muted-foreground">
                      Public projects appear in our community showcase after approval.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="size-5 rounded border-input text-primary focus:ring-primary"
                    checked={form.isPublic}
                    onChange={(event) => setForm({ ...form, isPublic: event.target.checked })}
                  />
                </div>

                <dl className="space-y-2.5 rounded-md border border-input p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Course</dt>
                    <dd className="truncate font-medium text-foreground">
                      {selectedEnrollment?.course.title ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Title</dt>
                    <dd className="truncate font-medium text-foreground">{form.title || "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Technologies</dt>
                    <dd className="truncate font-medium text-foreground">
                      {form.technologies.length > 0 ? form.technologies.join(", ") : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  wizardStep === 1 ? onOpenChange(false) : setWizardStep((step) => (step - 1) as WizardStep)
                }
              >
                {wizardStep === 1 ? (
                  "Cancel"
                ) : (
                  <>
                    <ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Back
                  </>
                )}
              </Button>
              {wizardStep < LAST_STEP ? (
                <Button type="submit" disabled={wizardStep === 1 && !isBasicsValid}>
                  Next <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
                  Submit for review
                </Button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
