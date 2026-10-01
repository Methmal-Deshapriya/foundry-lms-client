"use client";

import { Fragment, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ObjectUploadField } from "@/features/storage/components/ObjectUploadField";
import { getApiErrorMessage, isNormalizedApiError } from "@/lib/api";
import { linkTarget } from "@/lib/links";
import { cn } from "@/lib/utils";
import { useCreatePromotionMutation, useUpdatePromotionMutation } from "../notificationsApi";
import type { AdminPromotion, PromotionTheme } from "../notificationsTypes";
import { PromotionBannerView } from "./PromotionBanner";

const STEPS = ["Content", "Design", "Schedule"] as const;
const THEME_OPTIONS: { value: PromotionTheme; label: string; swatch: string }[] = [
  { value: "DARK", label: "Dark", swatch: "bg-[#191919]" },
  { value: "LIGHT", label: "Light", swatch: "border border-zinc-300 bg-white" },
  { value: "RED", label: "Red", swatch: "bg-[#E91717]" },
];

type Draft = {
  internalName: string;
  headline: string;
  message: string;
  badge: string;
  theme: PromotionTheme;
  imageObjectId: string | null;
  imageUrl: string | null;
  ctaLabel: string;
  ctaUrl: string;
  showCountdown: boolean;
  startsAt: string;
  endsAt: string;
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

function initialDraft(promotion: AdminPromotion | null): Draft {
  return {
    internalName: promotion?.internalName ?? "",
    headline: promotion?.headline ?? "",
    message: promotion?.message ?? "",
    badge: promotion?.badge ?? "",
    theme: promotion?.theme ?? "DARK",
    imageObjectId: promotion?.imageObjectId ?? null,
    imageUrl: promotion?.imageUrl ?? null,
    ctaLabel: promotion?.ctaLabel ?? "",
    ctaUrl: promotion?.ctaUrl ?? "",
    showCountdown: promotion?.showCountdown ?? false,
    startsAt: toLocalInput(promotion?.startsAt ?? null),
    endsAt: toLocalInput(promotion?.endsAt ?? null),
  };
}

/** Design the landing page's floating banner, with a live preview throughout. */
export function PromotionEditorDialog({
  open,
  promotion,
  onOpenChange,
}: {
  open: boolean;
  promotion: AdminPromotion | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(promotion));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [trackedKey, setTrackedKey] = useState<string | null>(null);
  const key = open ? (promotion?.id ?? "new") : null;
  if (key !== trackedKey) {
    setTrackedKey(key);
    if (open) {
      setStep(0);
      setDraft(initialDraft(promotion));
      setErrors({});
    }
  }
  const [createPromotion, { isLoading: isCreating }] = useCreatePromotionMutation();
  const [updatePromotion, { isLoading: isUpdating }] = useUpdatePromotionMutation();
  const isSaving = isCreating || isUpdating;
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const validate = (current: number) => {
    const next: typeof errors = {};
    if (current === 0) {
      if (!draft.internalName.trim()) next.internalName = "Name this promotion (only admins see it).";
      if (draft.headline.trim().length < 3) next.headline = "The headline needs at least 3 characters.";
      if (draft.ctaUrl.trim() && !draft.ctaLabel.trim()) next.ctaLabel = "Add a label for the button.";
      if (draft.ctaUrl.trim() && !linkTarget(draft.ctaUrl)) {
        next.ctaUrl = "Use a page path like /bootcamps, or a full https:// link.";
      }
    }
    if (current === 2) {
      if (draft.showCountdown && !draft.endsAt) next.endsAt = "A countdown needs an end date.";
      if (draft.startsAt && draft.endsAt && new Date(draft.endsAt) <= new Date(draft.startsAt)) next.endsAt = "The end must be after the start.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const stepForField: Partial<Record<string, number>> = { internalName: 0, headline: 0, message: 0, badge: 0, ctaLabel: 0, ctaUrl: 0, theme: 1, imageObjectId: 1, showCountdown: 2, startsAt: 2, endsAt: 2 };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate(step)) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    const body = {
      internalName: draft.internalName.trim(),
      headline: draft.headline.trim(),
      message: draft.message.trim() || null,
      badge: draft.badge.trim() || null,
      theme: draft.theme,
      imageObjectId: draft.imageObjectId,
      ctaLabel: draft.ctaLabel.trim() || null,
      ctaUrl: draft.ctaUrl.trim() || null,
      showCountdown: draft.showCountdown,
      startsAt: fromLocalInput(draft.startsAt),
      endsAt: fromLocalInput(draft.endsAt),
    };
    try {
      if (promotion) await updatePromotion({ id: promotion.id, ...body }).unwrap();
      else await createPromotion(body).unwrap();
      toast.success(promotion ? "Promotion saved." : "Draft saved — publish it from the list to show it on the landing page.");
      onOpenChange(false);
    } catch (error) {
      if (isNormalizedApiError(error) && error.field) {
        setErrors({ [error.field]: error.message });
        setStep(stepForField[error.field] ?? 0);
      } else {
        toast.error(getApiErrorMessage(error, "The promotion could not be saved."));
      }
    }
  };

  const errorText = (field: keyof Draft) =>
    errors[field] ? (
      <p role="alert" className="text-xs font-medium text-destructive">
        {errors[field]}
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{promotion ? "Edit promotion" : "New promotion"}</DialogTitle>
          <DialogDescription>A floating banner at the top of the landing page. The preview below updates as you type.</DialogDescription>
        </DialogHeader>

        {/* Live preview, shown on a strip that looks like the top of the landing page. */}
        <div className="rounded-xl border border-border bg-[#FAFAFA] p-3">
          <p className="mb-2 font-alt text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Live preview</p>
          <PromotionBannerView
            preview
            promotion={{
              headline: draft.headline || "Your headline",
              message: draft.message || null,
              badge: draft.badge || null,
              theme: draft.theme,
              imageUrl: draft.imageUrl,
              ctaLabel: draft.ctaLabel || null,
              ctaUrl: draft.ctaUrl || (draft.ctaLabel ? "#" : null),
              showCountdown: draft.showCountdown && Boolean(draft.endsAt),
              startsAt: fromLocalInput(draft.startsAt),
              endsAt: fromLocalInput(draft.endsAt),
            }}
          />
        </div>

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

        <form onSubmit={submit} className="space-y-5">
          {step === 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="promotion-name">
                  Internal name <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Input id="promotion-name" maxLength={80} value={draft.internalName} onChange={(event) => update({ internalName: event.target.value })} placeholder="e.g. October bootcamp offer" />
                <p className="text-xs text-muted-foreground">Only admins see this.</p>
                {errorText("internalName")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="promotion-headline">
                  Headline <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Input id="promotion-headline" maxLength={90} value={draft.headline} onChange={(event) => update({ headline: event.target.value })} placeholder="e.g. 20% off every bootcamp this month" />
                {errorText("headline")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="promotion-message">Short message</Label>
                <Input id="promotion-message" maxLength={200} value={draft.message} onChange={(event) => update({ message: event.target.value })} placeholder="e.g. Enroll before October 15 to lock in the discount." />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="promotion-badge">Badge</Label>
                  <Input id="promotion-badge" maxLength={24} value={draft.badge} onChange={(event) => update({ badge: event.target.value })} placeholder="20% OFF" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promotion-cta-label">Button label</Label>
                  <Input id="promotion-cta-label" maxLength={30} value={draft.ctaLabel} onChange={(event) => update({ ctaLabel: event.target.value })} placeholder="See bootcamps" />
                  {errorText("ctaLabel")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promotion-cta-url">Button link</Label>
                  <Input id="promotion-cta-url" maxLength={300} value={draft.ctaUrl} onChange={(event) => update({ ctaUrl: event.target.value })} placeholder="/bootcamps" />
                  {errorText("ctaUrl")}
                </div>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update({ theme: option.value })}
                      aria-pressed={draft.theme === option.value}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors",
                        draft.theme === option.value ? "border-[#191919] bg-muted/40" : "border-border hover:border-zinc-300",
                      )}
                    >
                      <span className={cn("size-5 shrink-0 rounded-full", option.swatch)} aria-hidden="true" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <ObjectUploadField
                label="Image (optional)"
                purpose="PROMOTION_IMAGE"
                accept="image/jpeg,image/png,image/webp"
                value={draft.imageObjectId}
                initialObject={
                  promotion?.imageObject
                    ? { ...promotion.imageObject, purpose: "PROMOTION_IMAGE", scope: "PUBLIC", status: "READY", readyAt: null, createdAt: promotion.updatedAt }
                    : null
                }
                disabled={isSaving}
                helpText="A small square image works best (shown at 48×48 next to the headline on larger screens). JPG, PNG or WebP, up to 2 MB."
                onChange={(id, object) => update({ imageObjectId: id, imageUrl: object?.publicUrl ?? null })}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className="text-sm text-muted-foreground">Optional. Leave both empty to show it from publishing until you archive it. The newest live promotion is the one shown.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="promotion-starts">Show from</Label>
                  <Input id="promotion-starts" type="datetime-local" value={draft.startsAt} onChange={(event) => update({ startsAt: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promotion-ends">Hide after</Label>
                  <Input id="promotion-ends" type="datetime-local" value={draft.endsAt} onChange={(event) => update({ endsAt: event.target.value })} />
                  {errorText("endsAt")}
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm">
                <input type="checkbox" checked={draft.showCountdown} onChange={(event) => update({ showCountdown: event.target.checked })} className="mt-0.5 size-4 accent-[#191919]" />
                <span>
                  <span className="block font-medium text-foreground">Show a countdown</span>
                  <span className="block text-xs text-muted-foreground">Counts down to the “Hide after” time — good for limited-time offers.</span>
                </span>
              </label>
            </>
          ) : null}

          <div className="flex items-center justify-between pt-1">
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
              ) : promotion ? (
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
