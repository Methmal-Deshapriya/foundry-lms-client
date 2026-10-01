"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Eye, EyeOff, Pencil, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSetProfilePublishedMutation } from "../profilesApi";
import type { MyStudentProfileResponse } from "../profilesTypes";

/**
 * The student's own "is my public profile live?" summary — shown on My
 * Projects and on the Account page. `data.profile` must exist (callers
 * render something else before a profile is set up).
 */
export function PublicProfileStatusCard({
  data,
  onEdit,
  className,
}: {
  data: MyStudentProfileResponse;
  onEdit: () => void;
  className?: string;
}) {
  const [setPublished, { isLoading: isChanging }] = useSetProfilePublishedMutation();
  if (!data.profile) return null;
  const href = `/students/${data.profile.slug}`;
  // The student can take the page down (and put it back) at any time —
  // code review M08-01.
  const isHidden = !data.profile.publishConsentAt;
  const badge = isHidden
    ? { label: "Hidden", className: "bg-zinc-100 text-zinc-600" }
    : data.isPublished
      ? { label: "Live", className: "bg-emerald-50 text-emerald-700" }
      : { label: "Not live yet", className: "bg-amber-50 text-amber-700" };
  const note = isHidden
    ? "Only you can see it. Show it again whenever you like."
    : data.isPublished
      ? `Anyone can view it at ${href}`
      : "It goes live as soon as your first project is approved.";

  const toggle = async () => {
    try {
      await setPublished(isHidden).unwrap();
      toast.success(isHidden ? "Your public profile is visible again" : "Your public profile is hidden");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not change your profile's visibility."));
    }
  };

  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#191919] text-white">
          {data.profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- R2 public URL, same reasoning as ThumbnailImage
            <img src={data.profile.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <UserRound className="size-5" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            Your public profile
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", badge.className)}>{badge.label}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">{note}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={isChanging} onClick={() => void toggle()}>
          {isHidden ? <Eye className="size-3.5" aria-hidden="true" /> : <EyeOff className="size-3.5" aria-hidden="true" />}
          {isHidden ? "Show" : "Hide"}
        </Button>
        {data.isPublished ? (
          <Button asChild size="sm" className="bg-[#191919] bg-none text-white hover:bg-[#27272A]">
            <Link href={href} target="_blank">
              <ExternalLink className="size-3.5" aria-hidden="true" />
              View
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
