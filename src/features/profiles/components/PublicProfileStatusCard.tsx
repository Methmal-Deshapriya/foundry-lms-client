"use client";

import Link from "next/link";
import { ExternalLink, Pencil, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  if (!data.profile) return null;
  const href = `/students/${data.profile.slug}`;

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
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                data.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
              )}
            >
              {data.isPublished ? "Live" : "Not live yet"}
            </span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {data.isPublished ? `Anyone can view it at ${href}` : "It goes live as soon as your first project is approved."}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
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
