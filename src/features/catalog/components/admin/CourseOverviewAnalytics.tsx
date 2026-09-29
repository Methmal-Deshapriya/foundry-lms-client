"use client";

import { Loader2 } from "lucide-react";
import { Bar, BarChart, XAxis } from "recharts";
import { useGetIntakeAnalyticsQuery } from "@/features/catalog/catalogApi";
import { Section } from "@/components/dataviz/StatPrimitives";
import { StatusDonutCard } from "@/components/dataviz/StatusDonutCard";
import { ENROLLMENT_STATUS_COLORS, TREND_COLOR } from "@/components/dataviz/chartColors";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { CHART_BODY_HEIGHT, PaymentsProjectsSummary } from "./PaymentsProjectsSummary";
import { AL_STREAMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const AL_STREAM_CHART_CONFIG = {
  count: { label: "Students", color: TREND_COLOR },
} satisfies ChartConfig;

export function CourseOverviewAnalytics({ intakeId }: { intakeId: string }) {
  const { data, isLoading, isError } = useGetIntakeAnalyticsQuery(intakeId);

  if (isLoading) {
    return (
      <p role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading analytics…
      </p>
    );
  }
  if (isError || !data) {
    return <p className="py-16 text-center text-sm text-destructive">Could not load course analytics.</p>;
  }

  // Only 5 possible streams, so always list every stream — including ones
  // with zero enrolled students — rather than only the ones that happen to
  // have data.
  const alStreamCounts = new Map(data.alStreams.map((row) => [row.stream, row.count]));
  const alStreamRows = AL_STREAMS.map((stream) => ({ stream, count: alStreamCounts.get(stream) ?? 0 }));
  const alStreamTotal = alStreamRows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-4">
      {/* Grid, not flex — these 4 cards should divide the row's full width
          evenly rather than each hugging its own content size and leaving
          dead space when the row is wider than their combined natural
          widths. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusDonutCard
          title="Enrollment status"
          className="w-full"
          bodyClassName={CHART_BODY_HEIGHT}
          order={["ACTIVE", "COMPLETED", "CANCELLED"] as const}
          counts={{ ACTIVE: data.enrollments.active, COMPLETED: data.enrollments.completed, CANCELLED: data.enrollments.cancelled }}
          colors={ENROLLMENT_STATUS_COLORS}
        />
        <PaymentsProjectsSummary
          payments={data.payments}
          projects={data.projects}
          certificates={{ issued: data.successRate.certificatesIssued, eligible: data.successRate.certificateEligible }}
        />
      </div>

      {/* Session engagement first and given flex-1 — its row list only
          grows as more curriculum is attached, so it should claim the
          available width. A/L stream (a fixed 5-category chart that never
          grows) sits second, capped to its own content width; flex-wrap
          drops it to its own line below Session engagement once the row
          gets too narrow for both. */}
      <div className="flex flex-wrap items-start gap-4">
        <Section title="Session engagement" className="min-w-64 flex-1">
          {data.sessionEngagement.length > 0 ? (
            <Table>
              <TableBody>
                {data.sessionEngagement.map((row) => (
                  <TableRow key={row.courseSessionId} className="border-b-0 hover:bg-transparent">
                    <TableCell className="whitespace-normal py-2 text-foreground">{row.title}</TableCell>
                    <TableCell className="w-40 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
                          <div className="h-full rounded-full bg-[#191919]" style={{ width: `${row.pct}%` }} />
                        </div>
                        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {row.completions}/{row.eligible}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-xs text-muted-foreground">No curriculum attached yet.</p>
          )}
        </Section>

        <Section title="A/L stream" className="w-full sm:max-w-2xl">
          <p className="text-xs text-muted-foreground">
            {alStreamTotal > 0 ? `${alStreamTotal} students with a known stream.` : "No enrolled students yet."}
          </p>
          <ChartContainer config={AL_STREAM_CHART_CONFIG} className={cn(CHART_BODY_HEIGHT, "w-full")}>
            <BarChart data={alStreamRows} barCategoryGap="30%">
              <XAxis dataKey="stream" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" radius={4} maxBarSize={40} fill={TREND_COLOR} />
            </BarChart>
          </ChartContainer>
        </Section>
      </div>
    </div>
  );
}
