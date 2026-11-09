import { cn } from "@/lib/utils";

/**
 * The last-resort visual for any R2-backed thumbnail (course, project, or
 * service image) that has no URL, or whose URL failed to load — e.g. an R2
 * outage. A plain dark tile with the entity's own name centered on it, so
 * the card/row still reads correctly instead of showing a broken-image icon
 * or empty space. Fills its parent's box (h-full w-full) so it can drop in
 * anywhere an <img> would have gone.
 */
export function ThumbnailFallback({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center bg-[#191919]", className)}>
      <span className="line-clamp-2 px-4 text-center text-sm font-semibold text-white">{label}</span>
    </div>
  );
}
