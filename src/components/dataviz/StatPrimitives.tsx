import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Shared dataviz building blocks — originally local to the catalog admin's
// CourseOverviewAnalytics, promoted here once the student dashboard needed
// the same "meter"/status-row/bordered-section conventions. Keep this file
// as the one source for these three; don't re-fork them per feature.

// A ranked, length-encoded bar — one hue, magnitude only (no categorical
// color needed since there's exactly one series). Follows the dataviz
// skill's "meter" spec: accent fill, unfilled track a lighter step of the
// same ramp, value labeled at the tip rather than inside the bar.
export function MagnitudeBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-foreground">{label}</span>
        <span className="shrink-0 font-medium tabular-nums text-muted-foreground">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-primary/15">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatRow({ dotClassName, label, count }: { dotClassName?: string; label: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-foreground">
        {dotClassName ? <span className={`size-2 shrink-0 rounded-full ${dotClassName}`} aria-hidden="true" /> : null}
        {label}
      </span>
      <span className="font-medium tabular-nums text-muted-foreground">{count}</span>
    </div>
  );
}

export function Section({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-3 rounded-md border border-input bg-card p-4", className)}>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
