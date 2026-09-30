"use client";

import { DonutSkeleton } from "@/components/ui/loading-skeletons";
import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { Section } from "./StatPrimitives";

/**
 * A reserved-status donut (fixed hue per status, never a generated color) —
 * originally built for the admin dashboard's Enrollment/Payment/Certificate/
 * Project status cards (AdminDashboard.tsx), promoted here so the Service/
 * Course/Intake level summaries can show the exact same chart instead of a
 * plain stat-row list. See the 2026-09-24 hierarchical admin summaries plan.
 */
export function StatusDonutCard<TKey extends string>({
  title,
  order,
  counts,
  colors,
  isLoading,
  labels,
  className,
  bodyClassName,
}: {
  title: string;
  order: TKey[];
  counts: Partial<Record<TKey, number>> | undefined;
  colors: Record<TKey, string>;
  isLoading?: boolean;
  labels?: Partial<Record<TKey, string>>;
  className?: string;
  /** Sizes the content row below the title — e.g. matching a sibling chart's height so a row of mixed chart types lines up (the card itself, not the donut's own fixed size) instead of each sizing to its own natural (very different) content height. */
  bodyClassName?: string;
}) {
  const rows = order.map((key) => ({ key, count: counts?.[key] ?? 0 }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const chartData = total > 0 ? rows.filter((row) => row.count > 0) : [{ key: order[0], count: 1 }];
  const chartConfig = Object.fromEntries(order.map((key) => [key, { label: labels?.[key] ?? key }])) satisfies ChartConfig;

  return (
    // @container: this card's rendered width tracks whatever grid it sits
    // in, not the viewport — below 16rem the fixed 7rem chart + legend has
    // nowhere to shrink to, so the legend drops rather than stacking
    // (hovering a slice already shows label + count via the tooltip). The
    // legend is the whole point of this component (it's what actually names
    // each color), so the threshold (@3xs, not @2xs) leaves real margin
    // rather than sitting right at a callers's own chosen card width.
    <Section title={title} className={cn("@container flex flex-col", className)}>
      {isLoading ? (
        <DonutSkeleton legendRows={order.length} className={bodyClassName} />
      ) : (
        <div className={cn("flex flex-auto items-center justify-center gap-4 @3xs:justify-start", bodyClassName)}>
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-28 w-28 shrink-0">
            <PieChart>
              {total > 0 ? <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="key" />} /> : null}
              <Pie data={chartData} dataKey="count" nameKey="key" innerRadius={34} outerRadius={50} strokeWidth={2}>
                {chartData.map((row) => (
                  <Cell key={row.key} fill={total > 0 ? colors[row.key] : "var(--muted)"} stroke="var(--card)" />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="hidden min-w-0 flex-1 space-y-1.5 text-sm @3xs:block">
            {rows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 truncate text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colors[row.key] }} />
                  {labels?.[row.key] ?? row.key.charAt(0) + row.key.slice(1).toLowerCase()}
                </span>
                <span className="font-medium tabular-nums text-foreground">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
