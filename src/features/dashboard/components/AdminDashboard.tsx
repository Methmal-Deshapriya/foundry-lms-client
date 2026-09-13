"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";
import { ArrowRight, Loader2 } from "lucide-react";
import { CourseKpiTile } from "@/features/catalog/components/admin/CourseKpiTile";
import { MagnitudeBar, Section } from "@/components/dataviz/StatPrimitives";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useAppSelector } from "@/store/hooks";
import { selectAuthRole } from "@/features/auth/authSelectors";
import { isSuperAdmin } from "@/lib/access";
import { useGetAuditLogsQuery } from "@/features/audit/auditApi";
import { Icons } from "@/lib/icons";
import { formatLKR } from "@/lib/utils";
import { useGetAdminDashboardQuery } from "../dashboardApi";
import type { CertificateStatusKey, EnrollmentStatusKey, ProjectStatusKey } from "../dashboardTypes";

const QUICK_LINKS = [
  { href: "/admin/services", label: "Manage catalog", icon: Icons.services },
  { href: "/admin/sessions", label: "Session Library", icon: Icons.sessionLibrary },
  { href: "/admin/projects", label: "Review projects", icon: Icons.reviewProjects },
  { href: "/admin/certificates", label: "Certificates", icon: Icons.certificates },
  { href: "/admin/users", label: "Manage users", icon: Icons.users },
];

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

/**
 * The admin/super-admin dashboard: platform-wide counts, trends, and
 * breakdowns from GET /dashboard/admin, plus jump-off points into the
 * admin sections. Split out from the student dashboard this session
 * (they used to share one route) — see lib/access.ts's getDashboardPath.
 * The recent-activity panel only renders for super admins, since audit-log
 * access (AUDIT_VIEW) is a super-admin-only permission.
 */
export default function AdminDashboard() {
  const role = useAppSelector(selectAuthRole);
  const { data, isLoading } = useGetAdminDashboardQuery();
  const { data: auditData, isLoading: isAuditLoading } = useGetAuditLogsQuery(
    { limit: 8 },
    { skip: !isSuperAdmin(role) },
  );

  const maxTopCourse = Math.max(1, ...(data?.topCourses.map((row) => row.count) ?? [1]));
  const maxDistrict = Math.max(1, ...(data?.districtBreakdown.map((row) => row.count) ?? [1]));
  const maxService = Math.max(1, ...(data?.serviceBreakdown.map((row) => row.count) ?? [1]));

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogPageHeader
        title="Admin overview"
        description="Platform-wide activity, trends, and analytics at a glance."
        icon={Icons.dashboard}
      />

      <div className="flex flex-wrap gap-4">
        <CourseKpiTile
          icon={Icons.users}
          label="Total students"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (data?.totalStudents ?? 0)}
        />
        <CourseKpiTile
          icon={Icons.enrollments}
          label="Active enrollments"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (data?.totalActiveEnrollments ?? 0)}
        />
        <CourseKpiTile
          icon={Icons.pending}
          label="Pending requests"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (data?.pendingEnrollmentRequests ?? 0)}
        />
        <CourseKpiTile
          icon={Icons.certificates}
          label="Certificates issued"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (data?.totalCertificatesIssued ?? 0)}
        />
        <CourseKpiTile
          icon={Icons.reviewProjects}
          label="Projects in review"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (data?.pendingProjectReviews ?? 0)}
        />
        <CourseKpiTile
          icon={Icons.revenue}
          label="Total revenue"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatLKR(data?.totalRevenue ?? 0)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Enrollments — last 6 months">
          <ChartContainer config={ENROLLMENT_CHART_CONFIG} className="h-56 w-full">
            <BarChart data={data?.enrollmentTrend ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill={TREND_COLOR} radius={4} />
            </BarChart>
          </ChartContainer>
        </Section>

        <Section title="Revenue — last 6 months">
          <ChartContainer config={REVENUE_CHART_CONFIG} className="h-56 w-full">
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
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatusDonutCard
          title="Enrollment status"
          order={["ACTIVE", "COMPLETED", "CANCELLED"]}
          counts={data?.enrollmentStatusBreakdown}
          colors={ENROLLMENT_STATUS_COLORS}
          isLoading={isLoading}
        />
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
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Top courses by enrollment">
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

        <Section title="Students by district">
          {!data || data.districtBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No district data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.districtBreakdown.map((row) => (
                <MagnitudeBar key={row.district} label={row.district} count={row.count} max={maxDistrict} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Active enrollments by service">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-bold text-foreground">Quick links</h2>
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
            className="lg:overflow-hidden"
            action={
              <Link href="/admin/audit" className="text-xs font-semibold text-primary hover:text-primary/80">
                View all
              </Link>
            }
          >
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
          </Section>
        ) : null}
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
}: {
  title: string;
  order: TKey[];
  counts: Partial<Record<TKey, number>> | undefined;
  colors: Record<TKey, string>;
  isLoading: boolean;
}) {
  const rows = order.map((key) => ({ key, count: counts?.[key] ?? 0 }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const chartData = total > 0 ? rows.filter((row) => row.count > 0) : [{ key: order[0], count: 1 }];
  const chartConfig = Object.fromEntries(order.map((key) => [key, { label: key }])) satisfies ChartConfig;

  return (
    <Section title={title}>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-28 w-28 shrink-0">
            <PieChart>
              {total > 0 ? <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="key" />} /> : null}
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="key"
                innerRadius={28}
                outerRadius={48}
                strokeWidth={2}
              >
                {chartData.map((row) => (
                  <Cell key={row.key} fill={total > 0 ? colors[row.key] : "var(--muted)"} stroke="var(--card)" />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="min-w-0 flex-1 space-y-1.5 text-sm">
            {rows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colors[row.key] }} />
                  {row.key.charAt(0) + row.key.slice(1).toLowerCase()}
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
