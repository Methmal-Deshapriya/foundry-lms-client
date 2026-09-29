"use client";

import { Fragment, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ObjectUploadField } from "@/features/storage/components/ObjectUploadField";
import type { StoredObjectSummary } from "@/features/storage/storageApi";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  useCreateLearningServiceMutation,
  useUpdateLearningServiceMutation,
  type AdminLearningServiceSummary,
} from "../catalogApi";

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const keyify = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");

const EMPTY_PROCESS_STEPS = [
  { title: "", description: "" },
  { title: "", description: "" },
  { title: "", description: "" },
  { title: "", description: "" },
];
const EMPTY_FAQ_ITEMS = [
  { question: "", answer: "" },
  { question: "", answer: "" },
  { question: "", answer: "" },
];

const WIZARD_STEPS = [
  { step: 1 as const, label: "Basics" },
  { step: 2 as const, label: "Content" },
  { step: 3 as const, label: "Hero" },
  { step: 4 as const, label: "How it works" },
  { step: 5 as const, label: "FAQ" },
  { step: 6 as const, label: "Preview" },
];
type WizardStep = (typeof WIZARD_STEPS)[number]["step"];
const LAST_STEP: WizardStep = WIZARD_STEPS[WIZARD_STEPS.length - 1].step;

const DELIVERY_POLICY_LABELS = {
  PAID: "Paid · seasonal · admin enrollment · payment required",
  FREE: "Free · evergreen · self enrollment · no payment",
} as const;

/**
 * A learning service owns access/course-mode/enrollment/payment policy for
 * everything under it, plus every piece of content the public home page
 * card and the service's own detail page render — see the 2026-09-24
 * dynamic service content plan. Creation is a stepper wizard (identity/
 * policy → text content → hero → how-it-works steps → FAQ → preview),
 * matching CourseForm's own convention, since a service now has as many
 * mandatory fields as a course does. Editing stays a single flat form —
 * nothing here locks after creation except identity/policy (see the
 * courseCount > 0 guards below), so there's no ordering to walk through.
 */
export function LearningServiceForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: AdminLearningServiceSummary;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const isEditing = Boolean(initial);
  const [key, setKey] = useState(initial?.key ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [profile, setProfile] = useState<"PAID" | "FREE">(initial?.accessType ?? "PAID");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [heroHeadline, setHeroHeadline] = useState(initial?.heroHeadline ?? "");
  const [heroTags, setHeroTags] = useState<[string, string]>([
    initial?.heroTags[0] ?? "",
    initial?.heroTags[1] ?? "",
  ]);
  const [heroImageObjectId, setHeroImageObjectId] = useState<string | null>(initial?.heroImageObjectId ?? null);
  const [heroImageObject, setHeroImageObject] = useState<StoredObjectSummary | null>(initial?.heroImageObject ?? null);
  const [cardImageObjectId, setCardImageObjectId] = useState<string | null>(initial?.cardImageObjectId ?? null);
  const [cardImageObject, setCardImageObject] = useState<StoredObjectSummary | null>(initial?.cardImageObject ?? null);
  const [processSteps, setProcessSteps] = useState(
    initial && initial.processSteps.length === 4 ? initial.processSteps : EMPTY_PROCESS_STEPS,
  );
  const [faqItems, setFaqItems] = useState(
    initial && initial.faqItems.length > 0 ? initial.faqItems : EMPTY_FAQ_ITEMS,
  );
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [create, createState] = useCreateLearningServiceMutation();
  const [update, updateState] = useUpdateLearningServiceMutation();
  const isSaving = createState.isLoading || updateState.isLoading;
  const policyLocked = isEditing && (initial?.courseCount ?? 0) > 0;

  const isBasicsValid =
    title.trim().length >= 3 && /^[a-z0-9-]+$/.test(slug) && /^[A-Z0-9_]+$/.test(key);
  const isContentValid = description.trim().length >= 10 && summary.trim().length >= 10;
  const isHeroValid =
    heroHeadline.trim().length >= 3 &&
    heroTags[0].trim().length >= 2 &&
    heroTags[1].trim().length >= 2 &&
    Boolean(heroImageObjectId) &&
    Boolean(cardImageObjectId);
  const isStepsValid = processSteps.every((step) => step.title.trim().length >= 2 && step.description.trim().length >= 5);
  const isFaqValid =
    faqItems.length >= 3 &&
    faqItems.every((item) => item.question.trim().length >= 5 && item.answer.trim().length >= 5);

  const policy =
    profile === "FREE"
      ? { accessType: "FREE" as const, courseMode: "EVERGREEN" as const, enrollmentMode: "SELF" as const, paymentRequirement: "NOT_REQUIRED" as const }
      : { accessType: "PAID" as const, courseMode: "SEASONAL" as const, enrollmentMode: "ADMIN" as const, paymentRequirement: "REQUIRED" as const };

  const performSave = async () => {
    if (!heroImageObjectId || !cardImageObjectId) {
      toast.error("Upload both the hero image and the card image before saving.");
      return;
    }
    const content = {
      title,
      slug,
      description,
      sortOrder,
      summary,
      heroHeadline,
      heroTags,
      heroImageObjectId,
      cardImageObjectId,
      processSteps,
      faqItems,
    };
    try {
      if (isEditing && initial) {
        await update({ id: initial.id, body: { ...content, ...policy } }).unwrap();
        toast.success("Learning service updated");
      } else {
        await create({ key, ...content, ...policy }).unwrap();
        toast.success("Learning service created as draft");
      }
      onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not save learning service"));
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
      if (!isHeroValid) return;
      setWizardStep(4);
      return;
    }
    if (wizardStep === 4) {
      if (!isStepsValid) return;
      setWizardStep(5);
      return;
    }
    if (wizardStep === 5) {
      if (!isFaqValid) return;
      setWizardStep(6);
      return;
    }
    await performSave();
  };

  const updateProcessStep = (index: number, field: "title" | "description", value: string) =>
    setProcessSteps((current) => current.map((step, i) => (i === index ? { ...step, [field]: value } : step)));
  const updateFaqItem = (index: number, field: "question" | "answer", value: string) =>
    setFaqItems((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const heroTagsFields = (
    <div className="grid gap-4 sm:grid-cols-2">
      {([0, 1] as const).map((index) => (
        <div className="space-y-2" key={index}>
          <Label htmlFor={`service-hero-tag-${index}`}>
            Hero tag {index + 1} <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Input
            id={`service-hero-tag-${index}`}
            required
            minLength={2}
            maxLength={40}
            placeholder="Short badge shown next to the course count on the hero"
            value={heroTags[index]}
            onChange={(event) =>
              setHeroTags((current) => {
                const next: [string, string] = [...current];
                next[index] = event.target.value;
                return next;
              })
            }
          />
        </div>
      ))}
    </div>
  );

  const heroImagesFields = (
    <div className="grid gap-4 sm:grid-cols-2">
      <ObjectUploadField
        label="Hero image"
        purpose="SERVICE_HERO"
        accept="image/jpeg,image/png,image/webp,image/avif"
        value={heroImageObjectId}
        initialObject={heroImageObject}
        helpText="Exactly 1374×1145px. Shown beside the headline on the service's public page."
        onChange={(id, object) => {
          setHeroImageObjectId(id);
          setHeroImageObject(object);
        }}
      />
      <ObjectUploadField
        label="Card image"
        purpose="SERVICE_CARD"
        accept="image/jpeg,image/png,image/webp,image/avif"
        value={cardImageObjectId}
        initialObject={cardImageObject}
        helpText="Exactly 1672×941px. Shown on the home page “What we offer” card."
        onChange={(id, object) => {
          setCardImageObjectId(id);
          setCardImageObject(object);
        }}
      />
    </div>
  );

  const processStepsFields = (
    <div className="space-y-4">
      {processSteps.map((step, index) => (
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]" key={index}>
          <div className="space-y-2">
            <Label htmlFor={`service-step-title-${index}`}>
              Step {index + 1} title <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              id={`service-step-title-${index}`}
              required
              minLength={2}
              maxLength={60}
              value={step.title}
              onChange={(event) => updateProcessStep(index, "title", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`service-step-description-${index}`}>
              Step {index + 1} description <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              id={`service-step-description-${index}`}
              required
              minLength={5}
              maxLength={200}
              value={step.description}
              onChange={(event) => updateProcessStep(index, "description", event.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const faqFields = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">At least 3 questions.</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setFaqItems((current) => [...current, { question: "", answer: "" }])}
        >
          <Plus /> Add question
        </Button>
      </div>
      {faqItems.map((item, index) => (
        <div className="space-y-2 rounded-md border border-dashed p-3" key={index}>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`service-faq-question-${index}`}>
              Question {index + 1} <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            {faqItems.length > 3 ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Remove question ${index + 1}`}
                onClick={() => setFaqItems((current) => current.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
          <Input
            id={`service-faq-question-${index}`}
            required
            minLength={5}
            maxLength={200}
            value={item.question}
            onChange={(event) => updateFaqItem(index, "question", event.target.value)}
          />
          <Label htmlFor={`service-faq-answer-${index}`}>
            Answer {index + 1} <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <textarea
            id={`service-faq-answer-${index}`}
            required
            minLength={5}
            maxLength={800}
            className="min-h-16 w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none"
            value={item.answer}
            onChange={(event) => updateFaqItem(index, "answer", event.target.value)}
          />
        </div>
      ))}
    </div>
  );

  if (isEditing) {
    return (
      <form className="space-y-5" onSubmit={submitEditing}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="service-title">
              Title <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              id="service-title"
              required
              minLength={3}
              placeholder="Shown as the service's name everywhere on the site"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-key">Stable key</Label>
            <Input id="service-key" disabled value={key} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-slug">
            Public slug <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Input
            id="service-slug"
            required
            disabled={policyLocked}
            placeholder="Used in the service's public URL"
            value={slug}
            onChange={(event) => setSlug(slugify(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-description">
            Description{" "}
            <span className="text-xs font-normal text-muted-foreground">(admin listing + detail-page hero paragraph)</span>
          </Label>
          <textarea
            id="service-description"
            required
            minLength={10}
            placeholder="Longer text shown in the admin list and as the paragraph beside the hero image on the detail page"
            className="min-h-24 w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-summary">
            Card blurb <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <textarea
            id="service-summary"
            required
            minLength={10}
            maxLength={200}
            placeholder="Short 1-2 sentence blurb shown on the home page card"
            className="min-h-16 w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-order">Sort order</Label>
          <Input id="service-order" type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-profile">Delivery policy</Label>
          <Select
            id="service-profile"
            accent="black"
            className="h-10 w-full whitespace-nowrap rounded-md py-0 pl-3 pr-8 text-sm"
            disabled={policyLocked}
            options={[DELIVERY_POLICY_LABELS.PAID, DELIVERY_POLICY_LABELS.FREE]}
            value={DELIVERY_POLICY_LABELS[profile]}
            onChange={(label) => setProfile(label === DELIVERY_POLICY_LABELS.PAID ? "PAID" : "FREE")}
          />
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">Detail page hero</h3>
          <div className="space-y-2">
            <Label htmlFor="service-hero-headline">
              Hero headline <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              id="service-hero-headline"
              required
              minLength={3}
              maxLength={200}
              placeholder="Big headline shown next to the hero image on the detail page"
              value={heroHeadline}
              onChange={(event) => setHeroHeadline(event.target.value)}
            />
          </div>
          {heroTagsFields}
          {heroImagesFields}
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">How it works (4 steps)</h3>
          {processStepsFields}
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">Frequently asked questions</h3>
          {faqFields}
        </div>

        <div className="flex justify-end gap-2">
          {onCancel ? <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button> : null}
          <Button type="submit" disabled={isSaving} className="bg-[#191919] bg-none hover:bg-[#27272A]">
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
            Save service
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex w-full items-center">
          {WIZARD_STEPS.map(({ step }, index) => (
            <Fragment key={step}>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  wizardStep === step
                    ? "bg-[#191919] text-white"
                    : wizardStep > step
                      ? "bg-zinc-100 text-[#191919]"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {wizardStep > step ? <Check className="size-3.5" aria-hidden="true" /> : step}
              </span>
              {index < WIZARD_STEPS.length - 1 ? (
                <div className={cn("mx-1 h-px flex-1", wizardStep > step ? "bg-[#191919]/40" : "bg-border")} />
              ) : null}
            </Fragment>
          ))}
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          Step {wizardStep} of {LAST_STEP} — {WIZARD_STEPS[wizardStep - 1].label}
        </p>
      </div>

      <form onSubmit={submitWizard} className="space-y-6">
        {wizardStep === 1 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Every field in this wizard feeds the public home page card and
              the service&apos;s own detail page — the service goes live
              from this data alone.
            </p>
            <div className="space-y-2">
              <Label htmlFor="service-title">
                Title <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Input
                id="service-title"
                required
                minLength={3}
                value={title}
                onChange={(event) => {
                  const value = event.target.value;
                  setTitle(value);
                  setSlug(slugify(value));
                  setKey(keyify(value));
                }}
                placeholder="Shown as the service's name everywhere on the site"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-slug">
                  Public slug <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="service-slug"
                  required
                  pattern="[a-z0-9-]+"
                  placeholder="Used in the service's public URL"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-key">
                  Stable key <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="service-key"
                  required
                  placeholder="Internal identifier, not shown publicly"
                  value={key}
                  onChange={(event) => setKey(keyify(event.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-order">Sort order</Label>
              <Input id="service-order" type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-profile">Delivery policy</Label>
              <Select
                id="service-profile"
                accent="black"
                className="h-10 w-full whitespace-nowrap rounded-md py-0 pl-3 pr-8 text-sm"
                options={[DELIVERY_POLICY_LABELS.PAID, DELIVERY_POLICY_LABELS.FREE]}
                value={DELIVERY_POLICY_LABELS[profile]}
                onChange={(label) => setProfile(label === DELIVERY_POLICY_LABELS.PAID ? "PAID" : "FREE")}
              />
            </div>
          </div>
        ) : null}

        {wizardStep === 2 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-description">
                Description{" "}
                <span className="text-xs font-normal text-muted-foreground">(admin listing + detail-page hero paragraph)</span>{" "}
                <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <textarea
                id="service-description"
                required
                minLength={10}
                placeholder="Longer text shown in the admin list and as the paragraph beside the hero image on the detail page"
                className="min-h-24 w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-summary">
                Card blurb <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <textarea
                id="service-summary"
                required
                minLength={10}
                maxLength={200}
                placeholder="Short 1-2 sentence blurb shown on the home page card"
                className="min-h-16 w-full rounded-md border bg-background p-3 text-sm focus-visible:outline-none"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {wizardStep === 3 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-hero-headline">
                Hero headline <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Input
                id="service-hero-headline"
                required
                minLength={3}
                maxLength={200}
                placeholder="Big headline shown next to the hero image on the detail page"
                value={heroHeadline}
                onChange={(event) => setHeroHeadline(event.target.value)}
              />
            </div>
            {heroTagsFields}
            {heroImagesFields}
          </div>
        ) : null}

        {wizardStep === 4 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">The 4 steps shown under &quot;How it works&quot; on the detail page.</p>
            {processStepsFields}
          </div>
        ) : null}

        {wizardStep === 5 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Shown as the FAQ section on the detail page.</p>
            {faqFields}
          </div>
        ) : null}

        {wizardStep === 6 ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold">{title || "Untitled service"}</p>
              <p className="text-xs text-muted-foreground">/{slug || "…"} · {key || "…"}</p>
              {summary ? <p className="mt-2 text-sm text-muted-foreground">{summary}</p> : null}
            </div>
            <div className="space-y-1.5 rounded-md border bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivery policy</span>
                <span className="font-medium">{profile === "FREE" ? "Free · self enrollment" : "Paid · admin enrollment"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hero headline</span>
                <span className="max-w-64 truncate font-medium" title={heroHeadline}>{heroHeadline}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hero tags</span>
                <span className="font-medium">{heroTags.join(", ")}</span>
              </div>
            </div>
            <div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
              {(
                [
                  ["Hero image", Boolean(heroImageObjectId)],
                  ["Card image", Boolean(cardImageObjectId)],
                  [`How it works (${processSteps.length} steps)`, isStepsValid],
                  [`FAQ (${faqItems.length} questions)`, isFaqValid],
                ] as const
              ).map(([label, ready]) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  {ready ? (
                    <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <span className="size-3.5 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />
                  )}
                  <span className={ready ? "text-foreground" : "text-muted-foreground"}>{label}</span>
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
              className="bg-[#191919] bg-none hover:bg-[#27272A]"
              disabled={
                wizardStep === 1
                  ? !isBasicsValid
                  : wizardStep === 2
                    ? !isContentValid
                    : wizardStep === 3
                      ? !isHeroValid
                      : wizardStep === 4
                        ? !isStepsValid
                        : wizardStep === 5
                          ? !isFaqValid
                          : false
              }
            >
              Next <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSaving} className="bg-[#191919] bg-none hover:bg-[#27272A]">
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              Create service
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
