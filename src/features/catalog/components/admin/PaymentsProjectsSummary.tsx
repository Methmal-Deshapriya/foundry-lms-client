import { Fragment } from "react";
import { Bar, BarChart, Cell, XAxis } from "recharts";
import { Section } from "@/components/dataviz/StatPrimitives";
import { StatusDonutCard } from "@/components/dataviz/StatusDonutCard";
import { CERTIFICATE_ISSUANCE_COLORS, PAYMENT_TYPE_COLORS, PROJECT_STATUS_COLORS } from "@/components/dataviz/chartColors";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn, formatLKR } from "@/lib/utils";

type PaymentTypeBreakdown = { count: number; amount: number };

// Short enough to sit as x-axis tick labels without wrapping or colliding —
// the "Payments collected" section title already supplies the context a
// fuller "Full payment" label would otherwise add.
const PAYMENT_TYPE_LABELS = { full: "Full", partial: "Partial", topUp: "Top-up" } as const;
const PAYMENT_ROW_COLORS = { full: PAYMENT_TYPE_COLORS.FULL, partial: PAYMENT_TYPE_COLORS.PARTIAL, topUp: PAYMENT_TYPE_COLORS.TOP_UP } as const;

const PAYMENT_CHART_CONFIG = {
  full: { label: PAYMENT_TYPE_LABELS.full, color: PAYMENT_ROW_COLORS.full },
  partial: { label: PAYMENT_TYPE_LABELS.partial, color: PAYMENT_ROW_COLORS.partial },
  topUp: { label: PAYMENT_TYPE_LABELS.topUp, color: PAYMENT_ROW_COLORS.topUp },
} satisfies ChartConfig;

// The single source of truth for every summary card's content-area height —
// the bar chart is the one with an intrinsic size (its axis + bars need
// this much room), so Projects/Certificates key off the same class rather
// than each guessing their own. Exported so the Enrollment status donut
// callers render alongside (Course/Intake pages) can match it too, rather
// than defaulting to its own shorter natural height and standing out as
// the one mismatched card in the row.
export const CHART_BODY_HEIGHT = "h-40";

/**
 * The "Payments collected" / "Projects" / "Certificates" summary — originally
 * plain stat-card text (counts and a "X / Y" ratio), rebuilt as charts per
 * the user's request: a bar chart for payment amounts (one axis — amount,
 * the primary magnitude; count rides along in the tooltip), a reserved-
 * status donut for project outcomes (matching the admin dashboard's own
 * Project status card), and the same donut treatment for certificates
 * issued vs. still-eligible (an Issued/Not-yet-issued pair rather than a
 * status set — see CERTIFICATE_ISSUANCE_COLORS) so all three cards read as
 * one visual family instead of the certificates one standing out as a
 * progress bar. See the 2026-09-24 hierarchical admin summaries plan.
 *
 * Renders as sibling Sections (a Fragment, not its own wrapper), each
 * `w-full` so it fills whatever cell the caller's grid gives it — the
 * caller supplies a shared `grid grid-cols-2 lg:grid-cols-4 gap-4` around
 * this (and the Enrollment status donut that sits alongside it) so all 4
 * cards divide the row's full width evenly instead of each hugging its own
 * content size and leaving dead space.
 */
export function PaymentsProjectsSummary({
  payments,
  projects,
  certificates,
}: {
  payments: { full: PaymentTypeBreakdown; partial: PaymentTypeBreakdown; topUp: PaymentTypeBreakdown };
  projects: { pending: number; approved: number; rejected: number };
  certificates: { issued: number; eligible: number };
}) {
  const paymentRows = [
    { type: "full" as const, label: PAYMENT_TYPE_LABELS.full, ...payments.full },
    { type: "partial" as const, label: PAYMENT_TYPE_LABELS.partial, ...payments.partial },
    { type: "topUp" as const, label: PAYMENT_TYPE_LABELS.topUp, ...payments.topUp },
  ];
  const hasPayments = paymentRows.some((row) => row.count > 0);
  const notYetIssued = Math.max(0, certificates.eligible - certificates.issued);

  return (
    <Fragment>
      <Section title="Payments collected" className="w-full">
        {hasPayments ? (
          <ChartContainer config={PAYMENT_CHART_CONFIG} className={cn(CHART_BODY_HEIGHT, "w-full")}>
            <BarChart data={paymentRows} barCategoryGap="30%">
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, _item, _index, rawRow) => {
                      const row = rawRow as unknown as (typeof paymentRows)[number];
                      return (
                        <div className="flex w-full items-center justify-between gap-3">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="font-medium tabular-nums text-foreground">
                            {formatLKR(Number(value))} · {row.count}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey="amount" radius={4} maxBarSize={40}>
                {paymentRows.map((row) => (
                  <Cell key={row.type} fill={PAYMENT_ROW_COLORS[row.type]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <p className={cn(CHART_BODY_HEIGHT, "flex items-center justify-center text-sm text-muted-foreground")}>
            No payments recorded yet.
          </p>
        )}
      </Section>

      <StatusDonutCard
        title="Projects"
        className="w-full"
        bodyClassName={CHART_BODY_HEIGHT}
        order={["PENDING", "APPROVED", "REJECTED"] as const}
        counts={{ PENDING: projects.pending, APPROVED: projects.approved, REJECTED: projects.rejected }}
        colors={PROJECT_STATUS_COLORS}
      />

      <StatusDonutCard
        title="Certificates"
        className="w-full"
        bodyClassName={CHART_BODY_HEIGHT}
        order={["ISSUED", "NOT_ISSUED"] as const}
        counts={{ ISSUED: certificates.issued, NOT_ISSUED: notYetIssued }}
        colors={CERTIFICATE_ISSUANCE_COLORS}
        labels={{ ISSUED: "Issued", NOT_ISSUED: "Not yet issued" }}
      />
    </Fragment>
  );
}
