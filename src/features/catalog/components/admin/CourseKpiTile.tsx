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
}: {
  label: string;
  value: ReactNode;
  secondary?: ReactNode;
  icon?: LucideIcon;
  // "sm" is for rows with many tiles at once (the admin dashboard's 6-tile
  // row) where the default size crowds out room for the charts below it —
  // default stays the existing size so every other caller is unaffected.
  size?: "default" | "sm";
}) {
  const isSm = size === "sm";
  return (
    <div className={cn("min-w-40 flex-1 rounded-md border border-input bg-card", isSm ? "px-3 py-2" : "px-4 py-3")}>
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
