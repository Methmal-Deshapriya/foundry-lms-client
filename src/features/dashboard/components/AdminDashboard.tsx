"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { CourseKpiTile } from "@/features/catalog/components/admin/CourseKpiTile";
import { MagnitudeBar, Section } from "@/components/dataviz/StatPrimitives";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { useAppSelector } from "@/store/hooks";
import { selectAuthRole } from "@/features/auth/authSelectors";
import { isSuperAdmin } from "@/lib/access";
import { useGetAuditLogsQuery } from "@/features/audit/auditApi";
import type { AuditLogsResponse } from "@/features/audit/auditTypes";
import { Icons } from "@/lib/icons";
import { cn, formatLKR, formatLKRCompact } from "@/lib/utils";
import type { Role } from "@/lib/constants";
import { useGetAdminDashboardQuery } from "../dashboardApi";
import type {
  AdminDashboardSummary,
  CertificateStatusKey,
  EnrollmentStatusKey,
  PaymentStatusKey,
  ProjectStatusKey,
} from "../dashboardTypes";
import { SriLankaDistrictMap } from "./SriLankaDistrictMap";

const QUICK_LINKS = [
  { href: "/admin/services", label: "Manage catalog", icon: Icons.services },
  { href: "/admin/sessions", label: "Session Library", icon: Icons.sessionLibrary },
  { href: "/admin/projects", label: "Review projects", icon: Icons.reviewProjects },
  { href: "/admin/certificates", label: "Certificates", icon: Icons.certificates },
  { href: "/admin/users", label: "Manage users", icon: Icons.users },
];

const MONTH_PRESETS = [3, 6, 12] as const;

// A single hue per trend, matching the app's existing "one hue, magnitude
// only" convention (MagnitudeBar, the heatmap) rather than an arbitrary
// color per chart.
const TREND_COLOR = "#2563eb"; // primary (blue-600)

const ENROLLMENT_CHART_CONFIG = {
  count: { label: "Enrollments", color: TREND_COLOR },
} satisfies ChartConfig;

const REVENUE_CHART_CONFIG = {
  amount: { label: "Revenue", color: TREND_COLOR },
} satisfies ChartConfig;

// Reserved status palettes — the same colors these statuses already wear
// everywhere else in the app (badges, roster cells, the project donut on
// the student dashboard), not a fresh categorical assignment.
const ENROLLMENT_STATUS_COLORS: Record<EnrollmentStatusKey, string> = {
  ACTIVE: "#0ea5e9",
  COMPLETED: "#10b981",
  CANCELLED: "#f43f5e",
};
const CERTIFICATE_STATUS_COLORS: Record<CertificateStatusKey, string> = {
  ISSUED: "#10b981",
  REVOKED: "#f43f5e",
};
const PROJECT_STATUS_COLORS: Record<ProjectStatusKey, string> = {
  PENDING: "#f59e0b",
  APPROVED: "#10b981",
  REJECTED: "#f43f5e",
};
const PAYMENT_STATUS_COLORS: Record<PaymentStatusKey, string> = {
  COMPLETED: "#10b981",
  PARTIAL: "#f59e0b",
};

type TrendFilter = { mode: "preset"; months: number } | { mode: "custom"; from: string; to: string };

/**
 * The admin/super-admin dashboard: platform-wide counts, trends, and
 * breakdowns from GET /dashboard/admin, plus jump-off points into the
 * admin sections. Split out from the student dashboard this session
 * (they used to share one route) — see lib/access.ts's getDashboardPath.
 *
 * Two pages instead of one long scroll (per the 2026-09-19 sketch): page 1
 * is the trend/financial view (KPIs, enrollment+revenue trends, the status
 * donuts and map that sit alongside them, the payment/revenue summary);
 * page 2 holds everything else that was already here (certificate/project
 * status, top courses, service breakdown, quick links, recent activity).
 * The whole shell is a fixed height at desktop width — no page scroll,
 * only page-switching — matching the rest of this session's admin pages.
 */
export default function AdminDashboard() {
  const role = useAppSelector(selectAuthRole);
  const [page, setPage] = useState<1 | 2>(1);
  const [trendFilter, setTrendFilter] = useState<TrendFilter>({ mode: "preset", months: 6 });
  const [customRange, setCustomRange] = useState<DateRange>({});

  const { data, isLoading } = useGetAdminDashboardQuery(
    trendFilter.mode === "preset" ? { months: trendFilter.months } : { from: trendFilter.from, to: trendFilter.to },
  );
  const { data: auditData, isLoading: isAuditLoading } = useGetAuditLogsQuery(
    { limit: 8 },
    { skip: !isSuperAdmin(role) || page !== 2 },
  );

  const maxTopCourse = Math.max(1, ...(data?.topCourses.map((row) => row.count) ?? [1]));
  const maxService = Math.max(1, ...(data?.serviceBreakdown.map((row) => row.count) ?? [1]));

  const handlePreset = (months: number) => {
    setCustomRange({});
    setTrendFilter({ mode: "preset", months });
  };

  const handleRangeChange = (range: DateRange) => {
    setCustomRange(range);
    if (range.from && range.to) {
      setTrendFilter({ mode: "custom", from: range.from, to: range.to });
    } else if (!range.from && !range.to) {
      setTrendFilter({ mode: "preset", months: 6 });
    }
  };

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100svh-7rem)]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <AdminCatalogPageHeader
          title="Admin overview"
          description="Platform-wide activity, trends, and analytics at a glance."
          icon={Icons.dashboard}
        />

        <div className="flex flex-wrap items-center gap-2">
          {page === 1 ? (
            <>
              <div className="flex items-center gap-1 rounded-md border border-input p-1">
                {MONTH_PRESETS.map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => handlePreset(months)}
                    className={cn(
                      "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                      trendFilter.mode === "preset" && trendFilter.months === months
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {months}mo
                  </button>
                ))}
              </div>
              <DateRangePicker value={customRange} onChange={handleRangeChange} />
            </>
          ) : null}

          <div className="flex items-center gap-1 rounded-md border border-input p-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              aria-label="Page 1"
              aria-current={page === 1}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-xs font-semibold transition-colors",
                page === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => setPage(2)}
              aria-label="Page 2"
              aria-current={page === 2}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-xs font-semibold transition-colors",
                page === 2 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              2
            </button>
          </div>
        </div>
      </div>

      {page === 1 ? (
        <AdminDashboardPageOne data={data} isLoading={isLoading} />
      ) : (
        <AdminDashboardPageTwo
          data={data}
          isLoading={isLoading}
          role={role}
          auditData={auditData}
          isAuditLoading={isAuditLoading}
          maxTopCourse={maxTopCourse}
          maxService={maxService}
        />
      )}

      <div className="flex shrink-0 items-center justify-center gap-3 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
          <ChevronLeft className="size-4" /> Page 1
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPage(2)} disabled={page === 2}>
          Page 2 <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function AdminDashboardPageOne({
  data,
  isLoading,
}: {
  data: AdminDashboardSummary | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 lg:min-h-0">
      <div className="flex shrink-0 flex-wrap gap-4">
        <CourseKpiTile
          size="sm"
          icon={Icons.users}
          label="Total students"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (data?.totalStudents ?? 0)}
        />
        <CourseKpiTile
          size="sm"
          icon={Icons.enrollments}
          label="Active enrollments"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (data?.totalActiveEnrollments ?? 0)}
        />
        <CourseKpiTile
          size="sm"
          icon={Icons.pending}
          label="Pending requests"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (data?.pendingEnrollmentRequests ?? 0)}
        />
        <CourseKpiTile
          size="sm"
          icon={Icons.certificates}
          label="Certificates issued"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (data?.totalCertificatesIssued ?? 0)}
        />
        <CourseKpiTile
          size="sm"
          icon={Icons.reviewProjects}
          label="Projects in review"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (data?.pendingProjectReviews ?? 0)}
        />
        <CourseKpiTile
          size="sm"
          icon={Icons.revenue}
          label="Total revenue"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatLKRCompact(data?.totalRevenue ?? 0)}
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 lg:min-h-0 lg:flex-row">
        {/* Left: the three trend/financial rows, stacked */}
        <div className="flex flex-1 flex-col gap-4 lg:min-h-0">
          <div className="grid flex-1 grid-cols-1 gap-4 lg:min-h-0 lg:grid-cols-6">
            <Section title="Enrollments" className="flex flex-col lg:col-span-4 lg:min-h-0">
              <div className="min-h-40 flex-1 lg:min-h-0">
                <ChartContainer config={ENROLLMENT_CHART_CONFIG} className="h-full w-full">
                  <BarChart data={data?.enrollmentTrend ?? []}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill={TREND_COLOR} radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>
            </Section>

            <StatusDonutCard
              className="lg:col-span-2"
              title="Enrollment status"
              order={["ACTIVE", "COMPLETED", "CANCELLED"]}
              counts={data?.enrollmentStatusBreakdown}
              colors={ENROLLMENT_STATUS_COLORS}
              isLoading={isLoading}
            />
          </div>

          <Section title="Revenue" className="flex flex-1 flex-col lg:min-h-0">
            <div className="min-h-40 flex-1 lg:min-h-0">
              <ChartContainer config={REVENUE_CHART_CONFIG} className="h-full w-full">
                <AreaChart data={data?.revenueTrend ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatLKR(Number(value))} />} />
                  <Area
                    dataKey="amount"
                    type="monotone"
                    fill={TREND_COLOR}
                    fillOpacity={0.15}
                    stroke={TREND_COLOR}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </Section>

          <div className="grid flex-1 grid-cols-1 gap-4 lg:min-h-0 lg:grid-cols-5">
            <StatusDonutCard
              className="lg:col-span-2"
              title="Payment status"
              order={["COMPLETED", "PARTIAL"]}
              labels={{ COMPLETED: "Fully paid", PARTIAL: "Partially paid" }}
              counts={data?.paymentStatusBreakdown}
              colors={PAYMENT_STATUS_COLORS}
              isLoading={isLoading}
            />

            <Section title="Revenue summary" className="flex flex-col lg:col-span-3 lg:min-h-0">
              {isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <RevenueSummaryBody
                  fullPotentialRevenue={data?.fullPotentialRevenue ?? 0}
                  availableRevenue={data?.totalRevenue ?? 0}
                  revenueToCome={data?.revenueToCome ?? 0}
                />
              )}
            </Section>
          </div>
        </div>

        {/* Right: the district map, full height — a fixed width rather than
            a fraction of the row, since Sri Lanka's own outline is much
            taller than it is wide and a proportional column just left
            whitespace on either side of the map. No Section/title header —
            the map is self-explanatory and card chrome (border/bg/radius)
            is dropped at lg so this reads as a plain panel rather than a
            boxed card, matching the audit terminal/profile-rail de-carding
            treatment elsewhere in the app. */}
        <div className="flex shrink-0 flex-col rounded-md border border-input bg-card p-4 lg:w-104 lg:min-h-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
          {!data || data.districtBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No district data yet.</p>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center pt-10 lg:min-h-0 lg:overflow-y-auto">
              <SriLankaDistrictMap data={data.districtBreakdown} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDashboardPageTwo({
  data,
  isLoading,
  role,
  auditData,
  isAuditLoading,
  maxTopCourse,
  maxService,
}: {
  data: AdminDashboardSummary | undefined;
  isLoading: boolean;
  role: Role | null;
  auditData: AuditLogsResponse | undefined;
  isAuditLoading: boolean;
  maxTopCourse: number;
  maxService: number;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 lg:min-h-0">
      <div className="grid flex-1 grid-cols-1 gap-4 lg:min-h-0 lg:grid-cols-4">
        <StatusDonutCard
          title="Certificate status"
          order={["ISSUED", "REVOKED"]}
          counts={data?.certificateStatusBreakdown}
          colors={CERTIFICATE_STATUS_COLORS}
          isLoading={isLoading}
        />
        <StatusDonutCard
          title="Project status"
          order={["PENDING", "APPROVED", "REJECTED"]}
          counts={data?.projectStatusBreakdown}
          colors={PROJECT_STATUS_COLORS}
          isLoading={isLoading}
        />

        <Section title="Top courses by enrollment" className="flex flex-col lg:min-h-0 lg:overflow-y-auto">
          {!data || data.topCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enrollments yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.topCourses.map((row) => (
                <MagnitudeBar key={row.courseId} label={row.title} count={row.count} max={maxTopCourse} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Active enrollments by service" className="flex flex-col lg:min-h-0 lg:overflow-y-auto">
          {!data || data.serviceBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active enrollments yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.serviceBreakdown.map((row) => (
                <MagnitudeBar key={row.service} label={row.service} count={row.count} max={maxService} />
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:min-h-0 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2 lg:min-h-0 lg:overflow-y-auto">
          <h2 className="shrink-0 text-lg font-bold text-foreground">Quick links</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm hover:bg-muted/50"
              >
                <span className="flex items-center gap-3 font-medium text-foreground">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  {label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        {isSuperAdmin(role) ? (
          <Section
            title="Recent activity"
            className="flex flex-col lg:min-h-0"
            action={
              <Link href="/admin/audit" className="text-xs font-semibold text-primary hover:text-primary/80">
                View all
              </Link>
            }
          >
            <div className="flex-1 lg:min-h-0 lg:overflow-y-auto">
              {isAuditLoading ? (
                <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </p>
              ) : !auditData || auditData.logs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No recent activity yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {auditData.logs.map((log) => (
                    <li key={log.id} className="py-3 text-sm first:pt-0 last:pb-0">
                      <p className="text-foreground">{log.description ?? log.action.replace(/_/g, " ").toLowerCase()}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {log.actor.firstName} {log.actor.lastName} · {format(new Date(log.createdAt), "MMM dd, HH:mm")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

// Same green/amber pair as PAYMENT_STATUS_COLORS (COMPLETED/PARTIAL) —
// "available" and "to come" are that same collected-vs-outstanding split,
// just expressed in money instead of enrollment counts, so the identity
// colors carry across the two cards on this page rather than diverging.
const AVAILABLE_COLOR = PAYMENT_STATUS_COLORS.COMPLETED;
const TO_COME_COLOR = PAYMENT_STATUS_COLORS.PARTIAL;

function RevenueSummaryBody({
  fullPotentialRevenue,
  availableRevenue,
  revenueToCome,
}: {
  fullPotentialRevenue: number;
  availableRevenue: number;
  revenueToCome: number;
}) {
  const collectedPct = fullPotentialRevenue > 0 ? Math.min(100, (availableRevenue / fullPotentialRevenue) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{fullPotentialRevenue > 0 ? `${Math.round(collectedPct)}% collected` : "No revenue yet"}</span>
          <span className="tabular-nums">{formatLKRCompact(fullPotentialRevenue)} full potential</span>
        </div>
        {fullPotentialRevenue > 0 ? (
          <div className="mt-1.5 flex h-2.5 w-full gap-0.5" role="img" aria-label={`${Math.round(collectedPct)}% of potential revenue collected`}>
            <div className="h-full rounded-full" style={{ width: `${collectedPct}%`, backgroundColor: AVAILABLE_COLOR }} />
            <div className="h-full rounded-full" style={{ width: `${100 - collectedPct}%`, backgroundColor: TO_COME_COLOR }} />
          </div>
        ) : (
          <div className="mt-1.5 h-2.5 w-full rounded-full bg-muted" />
        )}
      </div>

      {/* Plain stat row, divider-separated rather than three nested boxes —
          this already lives inside the "Revenue summary" card, so a card
          within a card read as visual clutter. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:divide-x sm:divide-border">
        <div className="flex-1 sm:pr-4">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Full revenue</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{formatLKRCompact(fullPotentialRevenue)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Every paid enrollment, in full</p>
        </div>
        <div className="flex-1 sm:px-4">
          <p className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: AVAILABLE_COLOR }} aria-hidden="true" />
            Available revenue
          </p>
          <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{formatLKRCompact(availableRevenue)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Actually collected so far</p>
        </div>
        <div className="flex-1 sm:pl-4">
          <p className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: TO_COME_COLOR }} aria-hidden="true" />
            Revenue to come
          </p>
          <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{formatLKRCompact(revenueToCome)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Owed by partial payers</p>
        </div>
      </div>
    </div>
  );
}

function StatusDonutCard<TKey extends string>({
  title,
  order,
  counts,
  colors,
  isLoading,
  labels,
  className,
}: {
  title: string;
  order: TKey[];
  counts: Partial<Record<TKey, number>> | undefined;
  colors: Record<TKey, string>;
  isLoading: boolean;
  labels?: Partial<Record<TKey, string>>;
  className?: string;
}) {
  const rows = order.map((key) => ({ key, count: counts?.[key] ?? 0 }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const chartData = total > 0 ? rows.filter((row) => row.count > 0) : [{ key: order[0], count: 1 }];
  const chartConfig = Object.fromEntries(order.map((key) => [key, { label: labels?.[key] ?? key }])) satisfies ChartConfig;

  return (
    <Section title={title} className={cn("flex flex-col lg:min-h-0", className)}>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-4">
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

          <div className="min-w-0 flex-1 space-y-1.5 text-sm">
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
