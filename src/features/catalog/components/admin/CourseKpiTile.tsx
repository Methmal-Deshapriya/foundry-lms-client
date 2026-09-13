import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The one stat-tile component for the catalog admin area — see the
// 2026-08-31 course detail page improvement plan §2: this used to have three
// slightly different hand-rolled versions across sibling pages (this one,
// AdminSummaryStrip, and an inline grid on the course detail page). Standardized
// on this one everywhere.
export function CourseKpiTile({
  label,
  value,
  secondary,
  icon: Icon,
  size = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  secondary?: ReactNode;
  icon?: LucideIcon;
  // "sm" is for rows with many tiles at once, or where a tile is meant to
  // stay a small, secondary element regardless of how much room is
  // actually available (a KPI is one number — it doesn't need to grow just
  // because the screen did). Growing it at some breakpoint is tempting but
  // risky: this component gets used inside layouts that ALSO reshuffle at
  // their own breakpoints (sidebars appearing, side panels changing width),
  // so a size jump tied to a screen-width breakpoint can land exactly where
  // a sibling's layout shift also eats the available room — more visual
  // weight demanded right as less space exists for it. Default stays the
  // existing size so every other caller is unaffected.
  size?: "default" | "sm";
  // Overrides the default min-w-40/flex-1 (which stretch a tile to fill
  // whatever row space is left) — for a row where that stretch just means
  // a lot of empty padded box around one small number, pass e.g.
  // "min-w-0 flex-none" so tiles hug their own content instead.
  className?: string;
}) {
  const isSm = size === "sm";
  return (
    <div className={cn("min-w-40 flex-1 rounded-md border border-input bg-card", isSm ? "px-3 py-2" : "px-4 py-3", className)}>
      <p
        className={cn(
          "flex items-center gap-1.5 font-medium tracking-wide text-muted-foreground uppercase",
          isSm ? "text-[11px]" : "text-xs",
        )}
      >
        {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
        {label}
      </p>
      <p className={cn("font-semibold text-foreground", isSm ? "mt-0.5 text-lg" : "mt-1 text-2xl")}>{value}</p>
      {secondary ? <p className="mt-0.5 text-xs text-muted-foreground">{secondary}</p> : null}
    </div>
  );
}
