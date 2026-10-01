"use client";

import { Fragment, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, EyeOff, Github, Globe, Linkedin, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { getApiErrorMessage, isNormalizedApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { useGetMyProfileQuery, useSaveMyProfileMutation } from "../profilesApi";
import type { MyStudentProfile } from "../profilesTypes";
import { AvatarUpload } from "./AvatarUpload";

const INTEREST_SUGGESTIONS = ["Web development", "Mobile apps", "AI & machine learning", "Data science", "UI/UX design", "Cybersecurity", "Cloud & DevOps", "Game development"];
const GOAL_SUGGESTIONS = ["Frontend developer", "Backend developer", "Full-stack developer", "Data analyst", "ML engineer", "UI/UX designer", "Internship"];
const MAX_INTERESTS = 8;
const MAX_GOALS = 5;

const PROFILE_STEPS = [
  { step: 1, label: "About you" },
  { step: 2, label: "Interests" },
  { step: 3, label: "Links" },
  { step: 4, label: "Publish" },
] as const;
type ProfileStep = (typeof PROFILE_STEPS)[number]["step"];

type Draft = {
  slug: string;
  headline: string;
  bio: string;
  interests: string[];
  careerGoals: string[];
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  avatarObjectId: string | null;
  avatarUrl: string | null;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function initialDraft(profile: MyStudentProfile | null, fallbackSlug: string): Draft {
  return {
    slug: profile?.slug ?? fallbackSlug,
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    interests: profile?.interests ?? [],
    careerGoals: profile?.careerGoals ?? [],
    linkedinUrl: profile?.linkedinUrl ?? "",
    githubUrl: profile?.githubUrl ?? "",
    portfolioUrl: profile?.portfolioUrl ?? "",
    avatarObjectId: profile?.avatarObjectId ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
  };
}

// Mirrors the server's rules (profile.schema.js) so mistakes show on the
// step where they were made, not only after the final save.
function linkError(value: string, host?: string) {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return "Use a full https:// link.";
    if (host && !(url.hostname === host || url.hostname.endsWith(`.${host}`))) return `This should be a ${host} link.`;
    return null;
  } catch {
    return "Enter a full link, starting with https://";
  }
}

function slugError(slug: string) {
  if (slug.length < 3) return "Your profile link needs at least 3 characters.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "Use only lowercase letters, numbers and single hyphens.";
  return null;
}

function SuggestionChips({ options, value, max, onAdd }: { options: string[]; value: string[]; max: number; onAdd: (item: string) => void }) {
  const remaining = options.filter((option) => !value.some((item) => item.toLowerCase() === option.toLowerCase()));
  if (remaining.length === 0 || value.length >= max) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {remaining.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onAdd(option)}
          className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[#191919] hover:text-foreground"
        >
          + {option}
        </button>
      ))}
    </div>
  );
}

/**
 * Sets up (mode="setup") or edits (mode="edit") the student's public
 * profile. In setup mode it's the opening stages of project submission —
 * the stepper shows a final "Project" stage, and saving hands straight over
 * to the Submit Project dialog via onSaved. Everything but the profile link
 * is optional: new students won't have much to add yet, and the public page
 * fills itself from their approved projects and certificates.
 */
export function ProfileSetupDialog({
  open,
  onOpenChange,
  mode,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "setup" | "edit";
  onSaved?: () => void;
}) {
  const user = useAppSelector(selectAuthUser);
  const { data } = useGetMyProfileQuery(undefined, { skip: !open });
  const [saveProfile, { isLoading: isSaving }] = useSaveMyProfileMutation();
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "U";

  const [step, setStep] = useState<ProfileStep>(1);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Draft | "publishConsent", string>>>({});
  const [wasOpen, setWasOpen] = useState(open);

  // Fresh start each time the dialog opens: re-read the saved profile (or a
  // slug suggested from the student's name). Adjusted during render rather
  // than in an effect, per React's "adjusting state when a prop changes".
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStep(1);
      setDraft(null);
      setConsent(false);
      setFieldErrors({});
    }
  }
  const form = draft ?? initialDraft(data?.profile ?? null, toSlug(name) || "student");
  const update = (patch: Partial<Draft>) => setDraft({ ...form, ...patch });

  const steps = mode === "setup" ? [...PROFILE_STEPS, { step: 5, label: "Project" }] : PROFILE_STEPS;

  const validateStep = (current: ProfileStep) => {
    const errors: typeof fieldErrors = {};
    if (current === 1) {
      const error = slugError(form.slug);
      if (error) errors.slug = error;
    }
    if (current === 3) {
      const linkedin = linkError(form.linkedinUrl, "linkedin.com");
      const github = linkError(form.githubUrl, "github.com");
      const portfolio = linkError(form.portfolioUrl);
      if (linkedin) errors.linkedinUrl = linkedin;
      if (github) errors.githubUrl = github;
      if (portfolio) errors.portfolioUrl = portfolio;
    }
    if (current === 4 && !consent) errors.publishConsent = "Please agree to show this information publicly.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Which step owns a server-side field error, so we can jump back to it.
  const stepForField: Record<string, ProfileStep> = { slug: 1, headline: 1, bio: 1, avatarObjectId: 1, interests: 2, careerGoals: 2, linkedinUrl: 3, githubUrl: 3, portfolioUrl: 3, publishConsent: 4 };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateStep(step)) return;
    if (step < 4) {
      setStep((current) => (current + 1) as ProfileStep);
      return;
    }
    try {
      await saveProfile({
        slug: form.slug,
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        interests: form.interests,
        careerGoals: form.careerGoals,
        linkedinUrl: form.linkedinUrl.trim() || null,
        githubUrl: form.githubUrl.trim() || null,
        portfolioUrl: form.portfolioUrl.trim() || null,
        avatarObjectId: form.avatarObjectId,
        publishConsent: true,
      }).unwrap();
      toast.success(mode === "setup" ? "Profile saved — now tell us about your project." : "Profile updated.");
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      if (isNormalizedApiError(error) && error.field) {
        setFieldErrors({ [error.field]: error.message });
        setStep(stepForField[error.field] ?? 1);
      } else {
        toast.error(getApiErrorMessage(error, "Your profile could not be saved."));
      }
    }
  };

  const errorText = (field: keyof typeof fieldErrors) =>
    fieldErrors[field] ? (
      <p role="alert" className="text-xs font-medium text-destructive">
        {fieldErrors[field]}
      </p>
    ) : null;

  const textareaClassName =
    "min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "setup" ? "Set up your public profile" : "Edit your public profile"}</DialogTitle>
          <DialogDescription>
            {mode === "setup"
              ? "Before your first project, create the page that shows your work to the world. It only takes a minute — and you can change it any time."
              : "This is what visitors see at your public profile link."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-1">
              {steps.map(({ step: item }, index) => (
                <Fragment key={item}>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      step === item ? "bg-[#191919] text-white" : step > item ? "bg-zinc-200 text-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {step > item ? <Check className="size-3.5" aria-hidden="true" /> : item}
                  </span>
                  {index < steps.length - 1 ? <div className={cn("h-px min-w-3 flex-1", step > item ? "bg-[#191919]/40" : "bg-border")} /> : null}
                </Fragment>
              ))}
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              Step {step} of {steps.length} — {steps[step - 1].label}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5 pt-1">
            {step === 1 ? (
              <>
                <AvatarUpload
                  name={name}
                  initials={initials}
                  previewUrl={form.avatarUrl}
                  disabled={isSaving}
                  onChange={(avatarObjectId, avatarUrl) => update({ avatarObjectId, avatarUrl })}
                />
                <div className="space-y-2">
                  <Label htmlFor="profile-slug">
                    Profile link <span className="text-red-500" aria-hidden="true">*</span>
                  </Label>
                  <div className="flex h-10 items-center overflow-hidden rounded-lg border border-input bg-background text-sm">
                    <span className="shrink-0 border-r border-input bg-muted/50 px-3 py-2 text-muted-foreground">/students/</span>
                    <input
                      id="profile-slug"
                      value={form.slug}
                      onChange={(event) => update({ slug: toSlug(event.target.value.replace(/\s/g, "-")) })}
                      className="min-w-0 flex-1 bg-transparent px-3 py-2 focus-visible:outline-none"
                      autoComplete="off"
                    />
                  </div>
                  {errorText("slug")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-headline">Headline</Label>
                  <Input
                    id="profile-headline"
                    maxLength={120}
                    value={form.headline}
                    onChange={(event) => update({ headline: event.target.value })}
                    placeholder="e.g. Aspiring full-stack developer"
                  />
                  {errorText("headline")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-bio">About you</Label>
                  <textarea
                    id="profile-bio"
                    maxLength={600}
                    value={form.bio}
                    onChange={(event) => update({ bio: event.target.value })}
                    placeholder="A few lines about what you're learning and what excites you. Just starting out? That's fine — say so."
                    className={textareaClassName}
                  />
                  <p className="text-right text-[11px] text-muted-foreground tabular-nums">{form.bio.length}/600</p>
                  {errorText("bio")}
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="profile-interests">What are you interested in?</Label>
                  <TagInput
                    id="profile-interests"
                    value={form.interests}
                    onChange={(interests) => update({ interests: interests.slice(0, MAX_INTERESTS) })}
                    placeholder="Type an interest and press Enter"
                  />
                  <SuggestionChips
                    options={INTEREST_SUGGESTIONS}
                    value={form.interests}
                    max={MAX_INTERESTS}
                    onAdd={(item) => update({ interests: [...form.interests, item] })}
                  />
                  <p className="text-xs text-muted-foreground">Up to {MAX_INTERESTS}.</p>
                  {errorText("interests")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-goals">What kind of role are you working towards?</Label>
                  <TagInput
                    id="profile-goals"
                    value={form.careerGoals}
                    onChange={(careerGoals) => update({ careerGoals: careerGoals.slice(0, MAX_GOALS) })}
                    placeholder="Type a role and press Enter"
                  />
                  <SuggestionChips
                    options={GOAL_SUGGESTIONS}
                    value={form.careerGoals}
                    max={MAX_GOALS}
                    onAdd={(item) => update({ careerGoals: [...form.careerGoals, item] })}
                  />
                  <p className="text-xs text-muted-foreground">Up to {MAX_GOALS}. Not sure yet? Skip this — you can add it later.</p>
                  {errorText("careerGoals")}
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <p className="text-sm text-muted-foreground">All optional — add the ones you have. Visitors can open them from your profile.</p>
                {(
                  [
                    { key: "linkedinUrl", label: "LinkedIn", icon: Linkedin, placeholder: "https://www.linkedin.com/in/your-name" },
                    { key: "githubUrl", label: "GitHub", icon: Github, placeholder: "https://github.com/your-username" },
                    { key: "portfolioUrl", label: "Portfolio or website", icon: Globe, placeholder: "https://your-site.com" },
                  ] as const
                ).map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`profile-${key}`}>{label}</Label>
                    <div className="relative">
                      <Icon className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" aria-hidden="true" />
                      <Input
                        id={`profile-${key}`}
                        type="url"
                        inputMode="url"
                        value={form[key]}
                        onChange={(event) => update({ [key]: event.target.value })}
                        placeholder={placeholder}
                        className="pl-9"
                      />
                    </div>
                    {errorText(key)}
                  </div>
                ))}
              </>
            ) : null}

            {step === 4 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden="true" /> Shown publicly
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Your name, photo, headline, about, interests, goals and links; your approved projects and the certificates you earn, each
                      with its course name; and the month you joined (&ldquo;Learning since&rdquo;).
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <EyeOff className="size-3.5 text-muted-foreground" aria-hidden="true" /> Never shown
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Your email, phone number, address, date of birth, district, A/L stream, enrollments and payments.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your page goes live at <span className="font-medium text-foreground">/students/{form.slug}</span> once your first project is
                  approved by our instructors. Visitors who want to hire you contact Foundry Academy, and we connect you. You can hide
                  your page again at any time.
                </p>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => {
                      setConsent(event.target.checked);
                      setFieldErrors((errors) => ({ ...errors, publishConsent: undefined }));
                    }}
                    className="mt-0.5 size-4 accent-[#191919]"
                  />
                  <span>I agree to show the information above on my public Foundry Academy profile.</span>
                </label>
                {errorText("publishConsent")}
              </>
            ) : null}

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => (step === 1 ? onOpenChange(false) : setStep((current) => (current - 1) as ProfileStep))}
              >
                {step === 1 ? (
                  "Cancel"
                ) : (
                  <>
                    <ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Back
                  </>
                )}
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-[#191919] bg-none text-white hover:bg-[#27272A]">
                {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
                {step < 4 ? (
                  <>
                    Next <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </>
                ) : mode === "setup" ? (
                  <>
                    Save & add your project <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </>
                ) : (
                  "Save profile"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
