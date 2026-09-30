import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Content-shaped loading placeholders built on shadcn's Skeleton. The app
// never shows a bare spinner for content that's loading — each block below
// mirrors the rough shape of what it stands in for, so the page doesn't jump
// when data arrives. (A spinner inside a button while an action runs —
// saving, signing in — is different: that's action feedback, and stays.)

/**
 * Placeholder rows for a table body. `columns` must match the header's
 * column count; `label` is announced to screen readers (the rows themselves
 * are hidden from assistive tech).
 */
export function TableSkeletonRows({ columns, rows = 5, label }: { columns: number; rows?: number; label?: string }) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <TableRow key={row} className="hover:bg-transparent">
          {Array.from({ length: columns }, (_, column) => (
            <TableCell key={column} className="py-4">
              {row === 0 && column === 0 && label ? <LoadingStatus label={label} /> : null}
              <Skeleton
                aria-hidden="true"
                className={cn("h-4", column === 0 ? "w-3/4" : column === columns - 1 ? "ml-auto w-8" : "w-2/3")}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// Fixed, varied heights so the placeholder reads as "a bar chart" rather
// than a uniform block — deterministic (no Math.random) so server and
// client render the same markup.
const BAR_HEIGHTS = ["45%", "70%", "55%", "85%", "60%", "95%"];

/** Stand-in for a trend chart (bar or area) that fills its container. */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full w-full flex-col gap-2", className)} aria-hidden="true">
      <div className="flex flex-1 items-end gap-3 px-2">
        {BAR_HEIGHTS.map((height, index) => (
          <Skeleton key={index} className="flex-1 rounded-t-md rounded-b-none" style={{ height }} />
        ))}
      </div>
      <div className="flex gap-3 px-2">
        {BAR_HEIGHTS.map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
    </div>
  );
}

/** Stand-in for a donut/pie card body: the ring plus its legend rows. */
export function DonutSkeleton({ legendRows = 3, className }: { legendRows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-auto items-center gap-4", className)} aria-hidden="true">
      <div className="relative size-28 shrink-0">
        <Skeleton className="size-28 rounded-full" />
        <div className="absolute inset-[22px] rounded-full bg-card" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {Array.from({ length: legendRows }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stand-in for a divided list of two-line rows (activity feeds, jump-off lists). */
export function ListSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <ul className={cn("divide-y divide-border", className)} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="space-y-2 py-3 first:pt-0 last:pb-0">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </li>
      ))}
    </ul>
  );
}

/** Stand-in for a checkbox pick-list (attach sessions/intakes, pick students). */
export function ChecklistSkeleton({ rows = 4, label }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-1">
      {label ? <LoadingStatus label={label} /> : null}
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 p-2" aria-hidden="true">
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * A single KPI number placeholder, sized to the tile's value text. A <span>
 * (not Skeleton's <div>) because tiles render their value inside a <p>, and
 * a <div> there is invalid HTML and a hydration error.
 */
export function KpiValueSkeleton() {
  return (
    <span data-slot="skeleton" className="mt-1 block h-6 w-14 animate-pulse rounded-md bg-zinc-200/70" aria-hidden="true" />
  );
}

/** Stand-in for a grid of image-topped cards (courses, projects, certificates). */
export function CardGridSkeleton({
  count = 6,
  className,
  imageAspect = "aspect-video",
}: {
  count?: number;
  className?: string;
  imageAspect?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
          <Skeleton className={cn("w-full rounded-none", imageAspect)} />
          <div className="space-y-2.5 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Screen-reader-only status text that accompanies a skeleton, so loading is still announced. */
export function LoadingStatus({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}
