import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function AdminCatalogPageHeader({
  title,
  description,
  icon: Icon,
  badge,
  action,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  /** A status badge (or similar) rendered inline right after the title. */
  badge?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="flex flex-wrap items-center gap-2 font-sans text-xl font-semibold tracking-tight text-foreground">
          {Icon ? <Icon className="size-4 text-[#191919]" aria-hidden="true" /> : null}
          {title}
          {badge}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
