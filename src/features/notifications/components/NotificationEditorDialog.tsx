"use client";

import { Fragment, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Bell, BookOpen, Check, Layers, Loader2, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useGetCoursesQuery, useGetIntakesQuery } from "@/features/catalog/catalogApi";
import { getApiErrorMessage, isNormalizedApiError } from "@/lib/api";
import { linkTarget } from "@/lib/links";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCreateNotificationMutation, useGetAudienceReachQuery, useUpdateNotificationMutation } from "../notificationsApi";
import type { AdminNotification, NotificationAudience, SaveNotificationRequest } from "../notificationsTypes";

const STEPS = ["Audience", "Content", "Schedule", "Preview"] as const;

export const AUDIENCE_OPTIONS: { value: NotificationAudience; label: string; description: string; icon: typeof Users }[] = [
  { value: "ALL_STUDENTS", label: "All students", description: "Offers, news and changes for everyone.", icon: Users },
  { value: "COURSE", label: "One course", description: "Students enrolled in any intake of a course.", icon: BookOpen },
  { value: "INTAKE", label: "One intake", description: "Students in a single intake — e.g. a class time change.", icon: Layers },
  { value: "PARTIAL_PAYERS", label: "Payment reminder", description: "Students who still owe money. Each sees their own balance. Can also be emailed.", icon: Wallet },
];
// COURSE_INTEREST notices are created automatically when an intake opens
// ("Notify me"), so they're labelled here but not offered in the editor.
export const AUDIENCE_LABELS = {
  ...Object.fromEntries(AUDIENCE_OPTIONS.map((option) => [option.value, option.label])),
  COURSE_INTEREST: "Waiting for a course",
} as Record<NotificationAudience, string>;

const ALL_PAYERS = "All partial payers";
const MIN_SEARCH_LENGTH = 3;

/**
 * Picker options keyed by id, with labels made unique (code review M09-11):
 * two courses with the same title in different services can both be
 * chosen, and a label always maps back to exactly one id.
 */
function uniqueOptions<T extends { id: string }>(items: T[], labelOf: (item: T) => string) {
  const seen = new Map<string, number>();
  const options = items.map((item) => {
    const base = labelOf(item);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return { id: item.id, label: count === 1 ? base : `${base} (${count})` };
  });
  return {
    labels: options.map((option) => option.label),
    labelOf: (id: string | null) => options.find((option) => option.id === id)?.label ?? "",
    idOf: (label: string) => options.find((option) => option.label === label)?.id ?? null,
  };
}

type Draft = {
  audience: NotificationAudience;
  courseId: string | null;
  intakeId: string | null;
  title: string;
  message: string;
  linkLabel: string;
  linkUrl: string;
  pinned: boolean;
  startsAt: string;
  endsAt: string;
};

// <input type="datetime-local"> works in local time without a zone.
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

function initialDraft(notification: AdminNotification | null): Draft {
  return {
    audience: notification?.audience ?? "ALL_STUDENTS",
    courseId: notification?.course?.id ?? null,
    intakeId: notification?.intake?.id ?? null,
    title: notification?.title ?? "",
    message: notification?.message ?? "",
    linkLabel: notification?.linkLabel ?? "",
    linkUrl: notification?.linkUrl ?? "",
    pinned: notification?.pinned ?? false,
    startsAt: toLocalInput(notification?.startsAt ?? null),
    endsAt: toLocalInput(notification?.endsAt ?? null),
  };
}

/** Create or edit a notification. Publishing (and optional email) is a separate step. */
export function NotificationEditorDialog({
  open,
  notification,
  onOpenChange,
}: {
  open: boolean;
  notification: AdminNotification | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(notification));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [intakeSearch, setIntakeSearch] = useState("");
  const [trackedKey, setTrackedKey] = useState<string | null>(null);
  const key = open ? (notification?.id ?? "new") : null;
  if (key !== trackedKey) {
    setTrackedKey(key);
    if (open) {
      setStep(0);
      setDraft(initialDraft(notification));
      setErrors({});
      setIntakeSearch("");
    }
  }

  const { data: courses } = useGetCoursesQuery(undefined, { skip: !open });
  // The intake picker searches the server (newest first), so every intake
  // can be found, not just the first 100 (code review M09-11).
  const debouncedIntakeSearch = useDebouncedValue(intakeSearch.trim(), 300);
  const appliedIntakeSearch = debouncedIntakeSearch.length >= MIN_SEARCH_LENGTH ? debouncedIntakeSearch : "";
  const { data: intakes } = useGetIntakesQuery({ sort: "recent", q: appliedIntakeSearch || undefined }, { skip: !open });
  const courseList = courses?.courses ?? [];
  // The intake already chosen stays in the list even when a search hides it.
  const savedIntake = notification?.intake && notification.intake.id === draft.intakeId ? notification.intake : null;
  const fetchedIntakes = intakes?.intakes ?? [];
  const intakeList: { id: string; code: string; course?: { title: string } | null }[] =
    savedIntake && !fetchedIntakes.some((intake) => intake.id === savedIntake.id) ? [{ ...savedIntake, course: notification?.course ?? null }, ...fetchedIntakes] : fetchedIntakes;
  // Who sees a published notification can't change (code review M09-04).
  const audienceLocked = notification?.status === "PUBLISHED";
  const { data: reachData } = useGetAudienceReachQuery(
    { audience: draft.audience, courseId: draft.courseId ?? undefined, intakeId: draft.intakeId ?? undefined },
    { skip: !open || (draft.audience === "COURSE" && !draft.courseId) || (draft.audience === "INTAKE" && !draft.intakeId) },
  );
  const [createNotification, { isLoading: isCreating }] = useCreateNotificationMutation();
  const [updateNotification, { isLoading: isUpdating }] = useUpdateNotificationMutation();
  const isSaving = isCreating || isUpdating;
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const validate = (current: number) => {
    const next: typeof errors = {};
    if (current === 0) {
      if (draft.audience === "COURSE" && !draft.courseId) next.courseId = "Choose the course.";
      if (draft.audience === "INTAKE" && !draft.intakeId) next.intakeId = "Choose the intake.";
    }
    if (current === 1) {
      if (draft.title.trim().length < 3) next.title = "The title needs at least 3 characters.";
      if (!draft.message.trim()) next.message = "Write the message.";
      if (draft.linkUrl.trim() && !draft.linkLabel.trim()) next.linkLabel = "Add a label for the button.";
      if (draft.linkUrl.trim() && !linkTarget(draft.linkUrl)) {
        next.linkUrl = "Use a page path like /explore, or a full https:// link.";
      }
    }
    if (current === 2 && draft.startsAt && draft.endsAt && new Date(draft.endsAt) <= new Date(draft.startsAt)) next.endsAt = "The end must be after the start.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const stepForField: Partial<Record<string, number>> = { audience: 0, courseId: 0, intakeId: 0, title: 1, message: 1, linkLabel: 1, linkUrl: 1, startsAt: 2, endsAt: 2 };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate(step)) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    const body: SaveNotificationRequest = {
      title: draft.title.trim(),
      message: draft.message.trim(),
      audience: draft.audience,
      courseId: draft.courseId,
      intakeId: draft.intakeId,
      linkLabel: draft.linkLabel.trim() || null,
      linkUrl: draft.linkUrl.trim() || null,
      pinned: draft.pinned,
      startsAt: fromLocalInput(draft.startsAt),
      endsAt: fromLocalInput(draft.endsAt),
    };
    try {
      if (notification) await updateNotification({ id: notification.id, ...body }).unwrap();
      else await createNotification(body).unwrap();
      toast.success(notification ? "Notification saved." : "Draft saved — publish it from the list when you're ready.");
      onOpenChange(false);
    } catch (error) {
      if (isNormalizedApiError(error) && error.field) {
        setErrors({ [error.field]: error.message });
        setStep(stepForField[error.field] ?? 0);
      } else {
        toast.error(getApiErrorMessage(error, "The notification could not be saved."));
      }
    }
  };

  const errorText = (field: keyof Draft) =>
    errors[field] ? (
      <p role="alert" className="text-xs font-medium text-destructive">
        {errors[field]}
      </p>
    ) : null;

  const courseOptions = uniqueOptions(courseList, (course) => (course.service?.title ? `${course.title} · ${course.service.title}` : course.title));
  const intakeOptions = uniqueOptions(intakeList, (intake) => `${intake.code} — ${intake.course?.title ?? ""}`.trim());
  const courseLabels = courseOptions.labels;
  const intakeLabels = intakeOptions.labels;
  const selectedCourseLabel = courseOptions.labelOf(draft.courseId);
  const selectedIntakeLabel = intakeOptions.labelOf(draft.intakeId);
  const payerScopeLabels = [ALL_PAYERS, ...courseLabels.map((label) => `Course: ${label}`), ...intakeLabels.map((label) => `Intake: ${label}`)];
  const payerScopeValue = draft.intakeId ? `Intake: ${selectedIntakeLabel}` : draft.courseId ? `Course: ${selectedCourseLabel}` : ALL_PAYERS;
  const intakeSearchField = (
    <Input
      aria-label="Search intakes by code or course"
      value={intakeSearch}
      onChange={(event) => setIntakeSearch(event.target.value)}
      placeholder="Search intakes (code or course, 3+ letters)"
      className="h-9"
    />
  );

  const textareaClass = "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none";
  const reachText =
    reachData === undefined ? "Counting…" : `This will reach ${reachData.reach} student${reachData.reach === 1 ? "" : "s"}${draft.audience === "PARTIAL_PAYERS" ? " who still owe money (right now — the list updates as people pay)" : ""}.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{notification ? "Edit notification" : "New notification"}</DialogTitle>
          <DialogDescription>Shown to students in their notification bell. Nothing is sent until you publish it.</DialogDescription>
        </DialogHeader>

        <div>
          <div className="flex items-center gap-1">
            {STEPS.map((label, index) => (
              <Fragment key={label}>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    step === index ? "bg-[#191919] text-white" : step > index ? "bg-zinc-200 text-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {step > index ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
                </span>
                {index < STEPS.length - 1 ? <div className={cn("h-px min-w-3 flex-1", step > index ? "bg-[#191919]/40" : "bg-border")} /> : null}
              </Fragment>
            ))}
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5 pt-1">
          {step === 0 && audienceLocked ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">{AUDIENCE_LABELS[draft.audience]}</p>
                <p className="text-xs text-muted-foreground">{notification?.intake?.code ?? notification?.course?.title ?? "Everyone in this audience"}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Students already have this notification, so who sees it can&apos;t change. To reach a different group, archive it and create a new one. Changing the
                title or message shows it as unread again.
              </p>
            </div>
          ) : null}
          {step === 0 && !audienceLocked ? (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {AUDIENCE_OPTIONS.map(({ value, label, description, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ audience: value, courseId: null, intakeId: null })}
                    aria-pressed={draft.audience === value}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      draft.audience === value ? "border-[#191919] bg-muted/40" : "border-border hover:border-zinc-300",
                    )}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{label}</span>
                      <span className="block text-xs text-muted-foreground">{description}</span>
                    </span>
                  </button>
                ))}
              </div>
              {draft.audience === "COURSE" ? (
                <div className="space-y-2">
                  <Label htmlFor="notification-course">Course</Label>
                  <Select
                    id="notification-course"
                    accent="black"
                    placeholder="Choose a course"
                    value={selectedCourseLabel}
                    options={courseLabels}
                    onChange={(label) => update({ courseId: courseOptions.idOf(label) })}
                    className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
                  />
                  {errorText("courseId")}
                </div>
              ) : null}
              {draft.audience === "INTAKE" ? (
                <div className="space-y-2">
                  <Label htmlFor="notification-intake">Intake</Label>
                  {intakeSearchField}
                  <Select
                    id="notification-intake"
                    accent="black"
                    placeholder="Choose an intake"
                    value={selectedIntakeLabel}
                    options={intakeLabels}
                    onChange={(label) => update({ intakeId: intakeOptions.idOf(label) })}
                    className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
                  />
                  {errorText("intakeId")}
                </div>
              ) : null}
              {draft.audience === "PARTIAL_PAYERS" ? (
                <div className="space-y-2">
                  <Label htmlFor="notification-payer-scope">Which partial payers?</Label>
                  {intakeSearchField}
                  <Select
                    id="notification-payer-scope"
                    accent="black"
                    value={payerScopeValue}
                    options={payerScopeLabels}
                    onChange={(label) => {
                      if (label === ALL_PAYERS) update({ courseId: null, intakeId: null });
                      else if (label.startsWith("Course: ")) update({ courseId: courseOptions.idOf(label.slice(8)), intakeId: null });
                      else update({ intakeId: intakeOptions.idOf(label.slice(8)), courseId: null });
                    }}
                    className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
                  />
                </div>
              ) : null}
              <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground">{reachText}</p>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="notification-title">
                  Title <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Input id="notification-title" maxLength={120} value={draft.title} onChange={(event) => update({ title: event.target.value })} placeholder="e.g. Tonight's class moves to 8 pm" />
                {errorText("title")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notification-message">
                  Message <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <textarea id="notification-message" maxLength={1000} value={draft.message} onChange={(event) => update({ message: event.target.value })} className={textareaClass} />
                <p className="text-right text-[11px] text-muted-foreground tabular-nums">{draft.message.length}/1000</p>
                {errorText("message")}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="notification-link-label">Button label (optional)</Label>
                  <Input id="notification-link-label" maxLength={40} value={draft.linkLabel} onChange={(event) => update({ linkLabel: event.target.value })} placeholder="e.g. See bootcamps" />
                  {errorText("linkLabel")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-link-url">Button link</Label>
                  <Input id="notification-link-url" maxLength={300} value={draft.linkUrl} onChange={(event) => update({ linkUrl: event.target.value })} placeholder="/explore or https://…" />
                  {errorText("linkUrl")}
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm">
                <input type="checkbox" checked={draft.pinned} onChange={(event) => update({ pinned: event.target.checked })} className="mt-0.5 size-4 accent-[#191919]" />
                <span>
                  <span className="block font-medium text-foreground">Pin to the student dashboard</span>
                  <span className="block text-xs text-muted-foreground">Also shows as a card at the top of their dashboard, not just in the bell. Payment reminders always do.</span>
                </span>
              </label>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className="text-sm text-muted-foreground">Optional. Leave both empty to show it from the moment you publish until you archive it.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="notification-starts">Show from</Label>
                  <Input id="notification-starts" type="datetime-local" value={draft.startsAt} onChange={(event) => update({ startsAt: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-ends">Hide after</Label>
                  <Input id="notification-ends" type="datetime-local" value={draft.endsAt} onChange={(event) => update({ endsAt: event.target.value })} />
                  {errorText("endsAt")}
                </div>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">How it will look in a student&apos;s notification list:</p>
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    draft.audience === "PARTIAL_PAYERS" ? "bg-amber-100 text-amber-800" : "bg-[#191919] text-white",
                  )}
                >
                  {draft.audience === "PARTIAL_PAYERS" ? <Wallet className="size-4" aria-hidden="true" /> : <Bell className="size-4" aria-hidden="true" />}
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{draft.title || "Title"}</p>
                  <p className="text-sm whitespace-pre-line text-muted-foreground">{draft.message || "Message"}</p>
                  {draft.audience === "PARTIAL_PAYERS" ? (
                    <p className="rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-900">+ each student&apos;s own balance, e.g. “AI-ML: LKR 3,000 due”</p>
                  ) : null}
                  {draft.linkLabel && draft.linkUrl ? <p className="text-sm font-semibold text-foreground">{draft.linkLabel} →</p> : null}
                </div>
              </div>
              <p className="text-sm text-foreground">
                <span className="font-medium">{AUDIENCE_LABELS[draft.audience]}</span> · {reachText}
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}>
              {step === 0 ? (
                "Cancel"
              ) : (
                <>
                  <ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Back
                </>
              )}
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-[#191919] bg-none text-white hover:bg-[#27272A]">
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              {step < STEPS.length - 1 ? (
                <>
                  Next <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </>
              ) : notification ? (
                "Save changes"
              ) : (
                "Save draft"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
