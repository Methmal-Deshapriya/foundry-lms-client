"use client";

import { Loader2 } from "lucide-react";
import { useGetIntakeAnalyticsQuery } from "@/features/catalog/catalogApi";
import { formatLKR } from "@/lib/utils";
import { MagnitudeBar, Section, StatRow } from "@/components/dataviz/StatPrimitives";

// Status is a reserved palette, not a categorical series — reuses the exact
// colors ClassRosterTable already uses for the same three EnrollmentStatus
// values, paired with a visible label (never color alone).
const STATUS_DOT_COLOR: Record<"ACTIVE" | "COMPLETED" | "CANCELLED", string> = {
  ACTIVE: "bg-sky-500",
  COMPLETED: "bg-emerald-500",
  CANCELLED: "bg-destructive",
};

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

  const topDistrict = data.districts[0];
  const districtMax = data.districts.reduce((max, row) => Math.max(max, row.count), 0);
  const sessionMax = data.sessionEngagement.reduce((max, row) => Math.max(max, row.eligible), 0);

  return (
    // lg not md: md (768px) is exactly where the dashboard's own sidebar
    // appears, so switching to 2 columns in that same instant compounds
    // into a sharper squeeze than a graduated step-down.
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Where students are enrolling from">
        <p className="text-xs text-muted-foreground">
          {data.districts.length > 0
            ? `${data.districts.length} of 25 districts represented${topDistrict ? ` — ${topDistrict.district} leads with ${topDistrict.count}` : ""}.`
            : "No enrolled students yet."}
        </p>
        {data.districts.length > 0 ? (
          <div className="space-y-2.5">
            {data.districts.map((row) => (
              <MagnitudeBar key={row.district} label={row.district} count={row.count} max={districtMax} />
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="Enrollment status">
        <div className="space-y-2">
          <StatRow dotClassName={STATUS_DOT_COLOR.ACTIVE} label="Active" count={data.enrollments.active} />
          <StatRow dotClassName={STATUS_DOT_COLOR.COMPLETED} label="Completed" count={data.enrollments.completed} />
          <StatRow dotClassName={STATUS_DOT_COLOR.CANCELLED} label="Cancelled" count={data.enrollments.cancelled} />
        </div>
      </Section>

      <Section title="Payments collected">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Full payment</span>
            <span className="font-medium tabular-nums text-muted-foreground">
              {data.payments.full.count} · {formatLKR(data.payments.full.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Partial</span>
            <span className="font-medium tabular-nums text-muted-foreground">
              {data.payments.partial.count} · {formatLKR(data.payments.partial.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Top-up (remaining half)</span>
            <span className="font-medium tabular-nums text-muted-foreground">
              {data.payments.topUp.count} · {formatLKR(data.payments.topUp.amount)}
            </span>
          </div>
        </div>
      </Section>

      <Section title="Session engagement">
        {data.sessionEngagement.length > 0 ? (
          <div className="space-y-2.5">
            {data.sessionEngagement.map((row) => (
              <MagnitudeBar
                key={row.courseSessionId}
                label={row.title}
                count={row.completions}
                max={sessionMax}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No curriculum attached yet.</p>
        )}
      </Section>

      <Section title="Projects & certificates">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="font-semibold tabular-nums">{data.projects.pending}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="font-semibold tabular-nums">{data.projects.approved}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rejected</p>
            <p className="font-semibold tabular-nums">{data.projects.rejected}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Certificates</p>
            <p className="font-semibold tabular-nums">
              {data.successRate.certificatesIssued} / {data.successRate.certificateEligible}
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
