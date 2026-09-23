"use client";

import type { MouseEvent } from "react";
import { CheckCircle2, Circle } from "lucide-react";

interface SessionThumbnailProps {
  title: string;
  completed: boolean;
  isReadOnly: boolean;
  isUpdating: boolean;
  onToggleComplete: (event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Shared banner for a session card. No session has its own image, so every
 * card gets the same fading brand-gradient backdrop — the same recipe as the
 * classroom page's own cover-photo band — with the title centered on it, and
 * the complete/incomplete toggle pinned to its top-right corner. Shared
 * across every SessionItem rather than duplicated per card.
 */
export default function SessionThumbnail({
  title,
  completed,
  isReadOnly,
  isUpdating,
  onToggleComplete,
}: SessionThumbnailProps) {
  return (
    <div className="relative flex aspect-video items-center justify-center bg-[#191919] px-6 text-center">
      <p className="line-clamp-2 text-sm font-bold text-white">{title}</p>

      <button
        type="button"
        onClick={onToggleComplete}
        disabled={isUpdating || isReadOnly}
        aria-label={
          isReadOnly
            ? `Session completion is locked: ${completed ? "completed" : "incomplete"}`
            : completed
              ? "Mark session incomplete"
              : "Mark session complete"
        }
        title={
          isReadOnly
            ? "Completed enrollment history is read-only"
            : completed
              ? "Mark session incomplete"
              : "Mark session complete"
        }
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-background/80"
      >
        {completed ? (
          <CheckCircle2 className="h-6 w-6 fill-green-50 text-green-500" />
        ) : (
          <Circle strokeWidth={2.25} className="h-6 w-6 text-muted-foreground/70 hover:text-blue-400" />
        )}
      </button>
    </div>
  );
}
