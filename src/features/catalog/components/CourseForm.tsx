"use client";

import { Fragment, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { cn, formatLKR } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";
import {
  useCreateCourseMutation,
  useUpdateCourseMutation,
  type AdminCategory,
  type AdminCourse,
  type CourseInput,
} from "../catalogApi";

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const prefixify = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

const LEVEL_OPTIONS = ["OPEN", "FOUNDATION", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const DURATION_UNIT_OPTIONS = ["SESSION", "DAY", "WEEK", "MONTH"] as const;
const CERTIFICATE_LABELS = {
  true: "Every intake issues certificates",
  false: "Intakes do not issue certificates",
} as const;

const WIZARD_STEPS = [
  { step: 1 as const, label: "Basics" },
  { step: 2 as const, label: "Content" },
  { step: 3 as const, label: "Policy" },
  { step: 4 as const, label: "Highlights" },
  { step: 5 as const, label: "Skills" },
  { step: 6 as const, label: "Prerequisites" },
  { step: 7 as const, label: "Preview" },
];
type WizardStep = (typeof WIZARD_STEPS)[number]["step"];
const LAST_STEP: WizardStep = WIZARD_STEPS[WIZARD_STEPS.length - 1].step;

/**
 * The real-world program a student browses and enrolls in. Everything here
 * is content shared by every intake this course will ever have — see the
 * 2026-08-30 course-to-program-intake rename plan.
 *
 * Creation is a stepper wizard (identity → public content, incl. price →
 * immutable policy, incl. the discount off that price → optional marketing
 * lists → preview) — price is set before the discount is asked for, since
 * a discount is meaningless without knowing the price first. Editing stays
 * a single flat form since only a handful of fields remain editable once a
 * course exists.
 */
export function CourseForm({
  category,
  initial,
  onSuccess,
  onCancel,
}: {
  category: AdminCategory;
  initial?: AdminCourse;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const isFree = category.service.accessType === "FREE";
  const isEditing = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [intakeCodePrefix, setIntakeCodePrefix] = useState(initial?.intakeCodePrefix ?? "");
  const [certificateEnabled, setCertificateEnabled] = useState<boolean | null>(
    initial ? initial.certificateEnabled : null,
  );
  const [discountAmount, setDiscountAmount] = useState(initial?.discountAmount?.toString() ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [level, setLevel] = useState<AdminCourse["level"]>(initial?.level ?? (isFree ? "OPEN" : "BEGINNER"));
  const [durationValue, setDurationValue] = useState(initial?.durationValue?.toString() ?? "");
  const [durationUnit, setDurationUnit] = useState<NonNullable<AdminCourse["durationUnit"]>>(
    initial?.durationUnit ?? (isFree ? "SESSION" : "WEEK"),
  );
  const [price, setPrice] = useState(initial ? initial.price.toString() : isFree ? "0" : "");
  const [highlights, setHighlights] = useState<string[]>(initial?.highlights ?? []);
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);
  const [prerequisites, setPrerequisites] = useState<string[]>(initial?.prerequisites ?? []);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [create, createState] = useCreateCourseMutation();
  const [update, updateState] = useUpdateCourseMutation();

  const isBasicsValid = title.trim().length >= 3 && /^[a-z0-9-]+$/.test(slug) && /^[A-Z0-9-]+$/.test(intakeCodePrefix);
  const isContentValid =
    summary.trim().length >= 10 && description.trim().length >= 20 && (isFree || Number(price) > 0);
  const isPolicyValid = certificateEnabled !== null;

  const performSave = async () => {
    const content = {
      title,
      slug,
      summary,
      description,
      level,
      durationValue: durationValue ? Number(durationValue) : null,
      durationUnit: durationValue ? durationUnit : null,
      price: isFree ? 0 : Number(price),
      highlights,
      skills,
      prerequisites,
      thumbnailUrl: null,
      sortOrder: 0,
    };
    try {
      if (initial) {
        await update({ id: initial.id, body: content }).unwrap();
        toast.success("Course updated");
      } else {
        const body: CourseInput = {
          categoryId: category.id,
          intakeCodePrefix,
          certificateEnabled: certificateEnabled as boolean,
          ...(category.service.accessType === "PAID" ? { discountAmount: Number(discountAmount) || 0 } : {}),
          ...content,
        };
        await create(body).unwrap();
        toast.success("Course created. Add its first intake next.");
      }
      onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not save course"));
    }
  };

  const submitEditing = async (event: FormEvent) => {
    event.preventDefault();
    await performSave();
  };

  const submitWizard = async (event: FormEvent) => {
    event.preventDefault();
    if (wizardStep === 1) {
      if (!isBasicsValid) return;
      setWizardStep(2);
      return;
    }
    if (wizardStep === 2) {
      if (!isContentValid) return;
      setWizardStep(3);
      return;
    }
    if (wizardStep === 3) {
      if (!isPolicyValid) return;
      setWizardStep(4);
      return;
    }
    if (wizardStep < LAST_STEP) {
      setWizardStep((step) => (step + 1) as WizardStep);
      return;
    }
    await performSave();
  };

  const isSaving = createState.isLoading || updateState.isLoading;
  const durationLabel = durationValue ? `${durationValue} ${durationUnit.toLowerCase()}${Number(durationValue) === 1 ? "" : "s"}` : null;

  if (isEditing) {
    return (
      <form className="space-y-5" onSubmit={submitEditing}>
        <p className="text-sm text-muted-foreground">
          This is the real-world program students browse and click Enroll on. It
          never varies between intakes — dates, timezone, and capacity are set
          per intake instead.
        </p>

        <div className="space-y-2">
          <Label htmlFor="course-title">
            Title <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Input id="course-title" required minLength={3} value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course-slug">Stable public slug</Label>
          <Input id="course-slug" required disabled value={slug} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course-summary">
            Public summary <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Input id="course-summary" required minLength={10} value={summary} onChange={(event) => setSummary(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-description">
            Public description <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <textarea
            id="course-description"
            required
            minLength={20}
            className="min-h-28 w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="course-level">Level</Label>
            <Select
              id="course-level"
              className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
              options={LEVEL_OPTIONS}
              value={level}
              onChange={(value) => setLevel(value as AdminCourse["level"])}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input id="duration" type="number" min={1} value={durationValue} onChange={(event) => setDurationValue(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration-unit">Unit</Label>
            <Select
              id="duration-unit"
              className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
              options={DURATION_UNIT_OPTIONS}
              value={durationUnit}
              onChange={(value) => setDurationUnit(value as NonNullable<AdminCourse["durationUnit"]>)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">
              Price (LKR) {!isFree ? <span className="text-red-500" aria-hidden="true">*</span> : null}
            </Label>
            <Input
              id="price"
              required={!isFree}
              disabled={isFree}
              type="number"
              min={isFree ? 0 : 1}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Highlights</Label>
          <TagInput value={highlights} onChange={setHighlights} placeholder="e.g. Build and train your first neural network" />
        </div>
        <div className="space-y-2">
          <Label>Skills</Label>
          <TagInput value={skills} onChange={setSkills} placeholder="e.g. PyTorch" />
        </div>
        <div className="space-y-2">
          <Label>Prerequisites</Label>
          <TagInput value={prerequisites} onChange={setPrerequisites} placeholder="e.g. Basic Python" />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
            Save course
          </Button>
          {onCancel ? <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button> : null}
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex w-max items-center gap-1">
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
                  <div className={cn("h-px w-8 shrink-0", wizardStep > step ? "bg-primary/40" : "bg-border")} />
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm font-medium text-foreground">
          Step {wizardStep} of {LAST_STEP} — {WIZARD_STEPS[wizardStep - 1].label}
        </p>
      </div>

      <form onSubmit={submitWizard} className="space-y-6 pt-2">
        {wizardStep === 1 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This is the real-world program students browse and click
              Enroll on. It never varies between intakes — dates, timezone,
              and capacity are set per intake instead.
            </p>
            <div className="space-y-2">
              <Label htmlFor="course-title">
                Title <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Input
                id="course-title"
                required
                minLength={3}
                value={title}
                onChange={(event) => {
                  const value = event.target.value;
                  setTitle(value);
                  setSlug(slugify(value));
                  setIntakeCodePrefix(prefixify(value));
                }}
                placeholder="AI/ML Ignition Program"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="course-slug">
                  Stable public slug <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Input id="course-slug" required pattern="[a-z0-9-]+" value={slug} onChange={(event) => setSlug(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-prefix">
                  Intake code prefix <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="course-prefix"
                  required
                  pattern="[A-Z0-9-]+"
                  value={intakeCodePrefix}
                  onChange={(event) => setIntakeCodePrefix(event.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>
        ) : null}

        {wizardStep === 2 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-summary">
                Public summary <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Input id="course-summary" required minLength={10} value={summary} onChange={(event) => setSummary(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-description">
                Public description <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <textarea
                id="course-description"
                required
                minLength={20}
                className="min-h-28 w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="course-level">Level</Label>
                <Select
                  id="course-level"
                  className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
                  options={LEVEL_OPTIONS}
                  value={level}
                  onChange={(value) => setLevel(value as AdminCourse["level"])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input id="duration" type="number" min={1} value={durationValue} onChange={(event) => setDurationValue(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration-unit">Unit</Label>
                <Select
                  id="duration-unit"
                  className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
                  options={DURATION_UNIT_OPTIONS}
                  value={durationUnit}
                  onChange={(value) => setDurationUnit(value as NonNullable<AdminCourse["durationUnit"]>)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (LKR) {!isFree ? <span className="text-red-500" aria-hidden="true">*</span> : null}
                </Label>
                <Input
                  id="price"
                  required={!isFree}
                  disabled={isFree}
                  type="number"
                  min={isFree ? 0 : 1}
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </div>
            </div>
          </div>
        ) : null}

        {wizardStep === 3 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              These two settings are locked the moment the course is created
              — every current and future intake inherits them.
            </p>
            <div className="space-y-2">
              <Label htmlFor="course-certificate-policy">
                Certificate policy <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Select
                id="course-certificate-policy"
                className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
                options={[CERTIFICATE_LABELS.true, CERTIFICATE_LABELS.false]}
                placeholder="Select once"
                value={certificateEnabled == null ? undefined : CERTIFICATE_LABELS[String(certificateEnabled) as "true" | "false"]}
                onChange={(label) => setCertificateEnabled(label === CERTIFICATE_LABELS.true)}
              />
              <p className="text-xs text-muted-foreground">Cannot be changed after creation.</p>
            </div>
            {category.service.accessType === "PAID" ? (
              <div className="space-y-2">
                <Label htmlFor="course-discount-amount">
                  One-time-payment discount (LKR) off the {formatLKR(Number(price) || 0)} price
                </Label>
                <Input
                  id="course-discount-amount"
                  type="number"
                  min={0}
                  step={1}
                  value={discountAmount}
                  onChange={(event) => setDiscountAmount(event.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Students who pay an intake&apos;s full price in one go get this much off. Paying in two halves never gets a discount. Applies to every intake and cannot be changed later.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {wizardStep === 4 ? (
          <div className="space-y-4">
            <div>
              <Label>Highlights</Label>
              <p className="text-xs text-muted-foreground">
                What a student walks away with — shown as &quot;What you&apos;ll cover&quot; on the public page. Optional, can be changed later.
              </p>
            </div>
            <TagInput value={highlights} onChange={setHighlights} placeholder="e.g. Build and train your first neural network" />
          </div>
        ) : null}

        {wizardStep === 5 ? (
          <div className="space-y-4">
            <div>
              <Label>Skills</Label>
              <p className="text-xs text-muted-foreground">
                The specific tools, technologies, or competencies this course teaches. Optional, can be changed later.
              </p>
            </div>
            <TagInput value={skills} onChange={setSkills} placeholder="e.g. PyTorch" />
          </div>
        ) : null}

        {wizardStep === 6 ? (
          <div className="space-y-4">
            <div>
              <Label>Prerequisites</Label>
              <p className="text-xs text-muted-foreground">
                What a student should already know or have before enrolling. Optional, can be changed later.
              </p>
            </div>
            <TagInput value={prerequisites} onChange={setPrerequisites} placeholder="e.g. Basic Python" />
          </div>
        ) : null}

        {wizardStep === 7 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">{category.service.accessType === "FREE" ? "Free" : "Paid"}</Badge>
              <Badge variant="outline" className="text-xs">{level}</Badge>
              {durationLabel ? <span className="text-xs text-muted-foreground">{durationLabel}</span> : null}
            </div>
            <div>
              <p className="text-sm font-semibold">{title || "Untitled course"}</p>
              <p className="text-xs text-muted-foreground">/{category.slug}/{slug || "…"} · {intakeCodePrefix || "…"}-{"{intake key}"}</p>
              {summary ? <p className="mt-2 text-sm text-muted-foreground">{summary}</p> : null}
            </div>
            <div className="space-y-1.5 rounded-md border bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">{isFree ? "Free" : `LKR ${price || 0}`}</span>
              </div>
              {category.service.accessType === "PAID" && Number(discountAmount) > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Full-payment discount</span>
                  <span className="font-medium">LKR {discountAmount}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Certificate policy</span>
                <span className="font-medium">{certificateEnabled ? "Issues certificates" : "No certificates"}</span>
              </div>
            </div>
            <div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
              {(
                [
                  ["Highlights", highlights],
                  ["Skills", skills],
                  ["Prerequisites", prerequisites],
                ] as const
              ).map(([label, list]) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  {list.length > 0 ? (
                    <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <span className="size-3.5 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />
                  )}
                  <span className={list.length > 0 ? "text-foreground" : "text-muted-foreground"}>
                    {label} {list.length > 0 ? `(${list.length})` : "— none"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => (wizardStep === 1 ? onCancel?.() : setWizardStep((step) => (step - 1) as WizardStep))}
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
            <Button
              type="submit"
              disabled={wizardStep === 1 ? !isBasicsValid : wizardStep === 2 ? !isContentValid : wizardStep === 3 ? !isPolicyValid : false}
            >
              Next <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              Create course
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
