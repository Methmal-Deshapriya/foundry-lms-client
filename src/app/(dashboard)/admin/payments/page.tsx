"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Download, ExternalLink, MessageCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { FilterPills, type FilterPillOption } from "@/components/ui/filter-pills";
import { Input } from "@/components/ui/input";
import { ChartSkeleton, KpiValueSkeleton, TableSkeletonRows } from "@/components/ui/loading-skeletons";
import { OffsetPagination } from "@/components/ui/offset-pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TREND_COLOR } from "@/components/dataviz/chartColors";
import { Section } from "@/components/dataviz/StatPrimitives";
import { CourseKpiTile } from "@/features/catalog/components/admin/CourseKpiTile";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { PaymentDetailSheet } from "@/features/payments/components/PaymentDetailSheet";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  PAYMENT_TYPE_LABELS,
  PAYMENT_TYPE_STYLES,
  toWhatsAppNumber,
} from "@/features/payments/paymentLabels";
import { useGetLedgerQuery, useGetMonthlySummaryQuery, useGetOutstandingQuery, useLazyGetLedgerQuery } from "@/features/payments/paymentsApi";
import type { LedgerFilters, OutstandingRow, PaymentType } from "@/features/payments/paymentsTypes";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { canManagePayments, canViewPayments } from "@/lib/access";
import { getApiErrorMessage } from "@/lib/api";
import { downloadCsv, toCsv } from "@/lib/csv";
import { dayEndIso, dayStartIso } from "@/lib/dates";
import { Icons } from "@/lib/icons";
import { cn, formatLKR, formatLKRCompact } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

const DEFAULT_PAGE_SIZE = 20;
const EXPORT_PAGE_SIZE = 100;
const MIN_SEARCH = 3;
const INTERACTIVE_SELECTOR = "input,button,a,[role=menuitem],[data-no-row-navigation]";
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ALL_METHODS = "All methods";
const NO_METHOD = "Not recorded";
const METHOD_FILTER_OPTIONS = [ALL_METHODS, ...PAYMENT_METHODS.map((method) => PAYMENT_METHOD_LABELS[method]), NO_METHOD];

type TypeFilter = "" | PaymentType;
const TYPE_PILLS: { key: TypeFilter; label: string }[] = [
  { key: "", label: "All" },
  { key: "FULL", label: "Full" },
  { key: "PARTIAL", label: "Half" },
  { key: "TOP_UP", label: "Remaining half" },
  { key: "REFUND", label: "Refunds" },
  { key: "REVERSAL", label: "Reversals" },
];

const NET_CHART_CONFIG = { net: { label: "Net", color: TREND_COLOR } } satisfies ChartConfig;

function localDay(date: Date) {
  return format(date, "yyyy-MM-dd");
}

// ---------------------------------------------------------------- Ledger
function LedgerTab({ canManage, onOpen }: { canManage: boolean; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [range, setRange] = useState<DateRange>({});
  const [type, setType] = useState<TypeFilter>("");
  const [methodLabel, setMethodLabel] = useState(ALL_METHODS);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [exporting, setExporting] = useState(false);

  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const appliedQ = debouncedQ.length === 0 || debouncedQ.length >= MIN_SEARCH ? debouncedQ : "";
  const method: LedgerFilters["method"] =
    methodLabel === ALL_METHODS ? undefined : methodLabel === NO_METHOD ? "NONE" : PAYMENT_METHODS.find((m) => PAYMENT_METHOD_LABELS[m] === methodLabel);

  const filters: LedgerFilters = {
    q: appliedQ || undefined,
    // Local (Sri Lanka) day boundaries as real instants (M03-07).
    from: range.from ? dayStartIso(range.from) : undefined,
    to: range.to ? dayEndIso(range.to) : undefined,
    type: type || undefined,
    method,
  };
  const { data, isLoading, isFetching } = useGetLedgerQuery({ ...filters, limit: pageSize, offset });
  const [fetchPage] = useLazyGetLedgerQuery();
  const entries = data?.entries ?? [];
  const summary = data?.summary;
  const resetPage = () => setOffset(0);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = [];
      for (let pageOffset = 0; ; pageOffset += EXPORT_PAGE_SIZE) {
        // summary=false: the export only needs rows, not the totals (M03-16).
        const page = await fetchPage({ ...filters, limit: EXPORT_PAGE_SIZE, offset: pageOffset, summary: "false" }).unwrap();
        all.push(...page.entries);
        if (!page.pagination.hasMore) break;
      }
      const rows = [
        ["Receipt", "Date received", "Student", "Email", "Service", "Course", "Intake", "Type", "Method", "Amount (LKR)", "Discount (LKR)", "Reference", "Corrects", "Note", "Recorded by"],
        ...all.map((entry) => [
          entry.receiptNumber,
          localDay(new Date(entry.paidAt)),
          entry.student?.name ?? "",
          entry.student?.email ?? "",
          entry.course.service.title,
          entry.course.title,
          entry.intake.code,
          PAYMENT_TYPE_LABELS[entry.type],
          entry.method ? PAYMENT_METHOD_LABELS[entry.method] : "",
          entry.amount.toFixed(2),
          entry.discountAmount.toFixed(2),
          entry.externalReference ?? "",
          entry.corrects?.receiptNumber ?? "",
          entry.note ?? "",
          entry.recordedBy ?? "",
        ]),
      ];
      downloadCsv(`payments-${localDay(new Date())}.csv`, toCsv(rows));
      toast.success(`Exported ${all.length} entr${all.length === 1 ? "y" : "ies"}.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The export could not be completed."));
    } finally {
      setExporting(false);
    }
  };

  const typePills: FilterPillOption<TypeFilter>[] = TYPE_PILLS.map(({ key, label }) => ({
    key,
    label,
    count: summary?.counts[key || "all"] ?? 0,
    activeClassName: key ? PAYMENT_TYPE_STYLES[key] : "border-zinc-300 bg-zinc-100 text-[#191919]",
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <CourseKpiTile size="sm" className="min-w-0" icon={Icons.revenue} label="Collected" value={summary ? formatLKRCompact(summary.collected) : <KpiValueSkeleton />} />
        <CourseKpiTile size="sm" className="min-w-0" icon={Icons.pending} label="Outstanding" value={summary ? formatLKRCompact(summary.outstanding) : <KpiValueSkeleton />} />
        <CourseKpiTile size="sm" className="min-w-0" icon={Icons.attention} label="Refunded" value={summary ? formatLKRCompact(summary.refunded) : <KpiValueSkeleton />} />
        <CourseKpiTile size="sm" className="min-w-0" icon={Icons.attention} label="Reversed" value={summary ? formatLKRCompact(summary.reversed) : <KpiValueSkeleton />} />
        <CourseKpiTile size="sm" className="col-span-2 min-w-0 lg:col-span-1" icon={Icons.payments} label="Net" value={summary ? formatLKRCompact(summary.net) : <KpiValueSkeleton />} />
      </div>
      <p className="text-xs text-muted-foreground">
        Totals follow the filters below (Outstanding is always the current total owed by partial payers). Refunds and reversals are stored as negative entries,
        so Net = Collected − Refunded − Reversed.
      </p>

      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <Input
          aria-label="Search by student, email, reference or receipt number"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            resetPage();
          }}
          placeholder="Search student, reference or receipt"
          className="h-9 w-full sm:w-64 sm:shrink-0"
        />
        <DateRangePicker
          value={range}
          onChange={(value) => {
            setRange(value);
            resetPage();
          }}
          placeholder="Any date"
        />
        <Select
          accent="black"
          value={methodLabel}
          onChange={(label) => {
            setMethodLabel(label);
            resetPage();
          }}
          options={METHOD_FILTER_OPTIONS}
          className="h-9 w-full rounded-md py-0 pl-3 pr-8 text-sm sm:w-44"
        />
        <Button variant="outline" className="h-9 w-full sm:w-auto lg:ml-auto" disabled={exporting} onClick={() => void exportCsv()}>
          <Download className="size-4" aria-hidden="true" />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>
      <FilterPills
        ariaLabel="Filter by entry type"
        options={typePills}
        active={type}
        onChange={(key) => {
          setType(key);
          resetPage();
        }}
      />

      <div className="overflow-hidden rounded-md border bg-card" aria-busy={isLoading || isFetching}>
        <Table className="table-fixed">
          <TableCaption className="sr-only">Payment ledger entries</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-32 pl-4">Receipt</TableHead>
              <TableHead className="w-24">Date</TableHead>
              <TableHead className="w-44">Student</TableHead>
              <TableHead className="w-52">Course · intake</TableHead>
              <TableHead className="w-32">Type</TableHead>
              <TableHead className="w-28">Method</TableHead>
              <TableHead className="w-32 pr-4 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isFetching && !isLoading && "opacity-60")}>
            {isLoading ? (
              <TableSkeletonRows columns={7} label="Loading payments…" />
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No payments match these filters.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  tabIndex={0}
                  className="cursor-pointer"
                  aria-label={`Open ${entry.receiptNumber}`}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return;
                    onOpen(entry.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onOpen(entry.id);
                  }}
                >
                  <TableCell className="pl-4 font-mono text-xs">{entry.receiptNumber}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(entry.paidAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="max-w-0">
                    <p className="truncate font-medium" title={entry.student?.name}>
                      {entry.student?.name ?? "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground" title={entry.student?.email}>
                      {entry.student?.email}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-0">
                    <p className="truncate" title={entry.course.title}>
                      {entry.course.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{entry.intake.code}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-medium", PAYMENT_TYPE_STYLES[entry.type])}>
                      {PAYMENT_TYPE_LABELS[entry.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.method ? PAYMENT_METHOD_LABELS[entry.method] : <span className="text-muted-foreground">Not recorded</span>}
                  </TableCell>
                  <TableCell className={cn("pr-4 text-right font-semibold tabular-nums", entry.amount < 0 && "text-red-600")}>{formatLKR(entry.amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {data ? (
        <OffsetPagination
          id="payments-ledger"
          total={data.pagination.total}
          offset={offset}
          pageSize={pageSize}
          shownCount={entries.length}
          hasMore={data.pagination.hasMore}
          onOffsetChange={setOffset}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setOffset(0);
          }}
        />
      ) : null}
      {!canManage ? <p className="text-xs text-muted-foreground">You can view the ledger but not record refunds or corrections.</p> : null}
    </div>
  );
}

// ------------------------------------------------------------ Outstanding
function reminderUrl(row: OutstandingRow) {
  const number = toWhatsAppNumber(row.student.phone);
  if (!number) return null;
  const firstName = row.student.name.split(/\s+/)[0] || row.student.name;
  const message = `Hi ${firstName}, this is Foundry Academy. A friendly reminder that ${formatLKR(row.owed)} is still due for ${row.course.title} (${row.intake.code}). Reply here if you'd like our bank details or have any questions. Thank you!`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function OutstandingTab() {
  const { data, isLoading } = useGetOutstandingQuery();
  const rows = data?.rows ?? [];

  const exportCsv = () => {
    downloadCsv(
      `outstanding-balances-${localDay(new Date())}.csv`,
      toCsv([
        ["Student", "Email", "Phone", "Course", "Intake", "Price (LKR)", "Paid (LKR)", "Owed (LKR)", "Enrolled on", "Days outstanding"],
        ...rows.map((row) => [
          row.student.name,
          row.student.email,
          row.student.phone ?? "",
          row.course.title,
          row.intake.code,
          row.price.toFixed(2),
          row.paid.toFixed(2),
          row.owed.toFixed(2),
          localDay(new Date(row.enrolledAt)),
          row.daysOutstanding,
        ]),
      ]),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading…" : rows.length === 0 ? "Nobody owes anything right now." : `${rows.length} student${rows.length === 1 ? "" : "s"} still owe a total of ${formatLKR(data?.total ?? 0)}.`}
        </p>
        <Button variant="outline" className="h-9 w-full sm:w-auto" disabled={rows.length === 0} onClick={exportCsv}>
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed">
          <TableCaption className="sr-only">Partial payers with a balance still owed</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-52 pl-4">Student</TableHead>
              <TableHead className="w-56">Course · intake</TableHead>
              <TableHead className="w-28 text-right">Paid</TableHead>
              <TableHead className="w-28 text-right">Owed</TableHead>
              <TableHead className="w-28 text-right">Waiting</TableHead>
              <TableHead className="w-56 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows columns={6} label="Loading outstanding balances…" />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No outstanding balances.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const whatsapp = reminderUrl(row);
                return (
                  <TableRow key={row.enrollmentId}>
                    <TableCell className="max-w-0 pl-4">
                      <p className="truncate font-medium">{row.student.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.student.phone ?? row.student.email}</p>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <p className="truncate">{row.course.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.intake.code}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatLKR(row.paid)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatLKR(row.owed)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground tabular-nums">{row.daysOutstanding} days</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-2">
                        {whatsapp ? (
                          <Button asChild size="sm" className="bg-[#191919] bg-none text-white hover:bg-[#27272A]">
                            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="size-3.5" aria-hidden="true" />
                              Remind
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled title="This student has no valid phone number on file">
                            No phone
                          </Button>
                        )}
                        {row.course.serviceSlug ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/services/${row.course.serviceSlug}/courses/${row.course.id}/intakes/${row.intake.id}?tab=enrollments`}>
                              <ExternalLink className="size-3.5" aria-hidden="true" />
                              Roster
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Record the remaining payment from the intake&apos;s Enrollments tab (row menu → Record remaining payment). The student then drops off this list.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- Monthly
function MonthlyTab() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data, isLoading } = useGetMonthlySummaryQuery(year);
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2].map(String);
  const chartData = (data?.months ?? []).map((month) => ({ month: MONTH_LABELS[month.month - 1], net: month.net }));

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(
      `payments-monthly-${data.year}.csv`,
      toCsv([
        ["Month", "Collected (LKR)", "Refunded (LKR)", "Reversed (LKR)", "Net (LKR)", "Entries"],
        ...data.months.map((month) => [
          `${MONTH_LABELS[month.month - 1]} ${data.year}`,
          month.collected.toFixed(2),
          month.refunded.toFixed(2),
          month.reversed.toFixed(2),
          month.net.toFixed(2),
          month.entries,
        ]),
        ["Total", data.totals.collected.toFixed(2), data.totals.refunded.toFixed(2), data.totals.reversed.toFixed(2), data.totals.net.toFixed(2), data.totals.entries],
      ]),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Select accent="black" value={String(year)} onChange={(value) => setYear(Number(value))} options={yearOptions} className="h-9 w-full rounded-md py-0 pl-3 pr-8 text-sm sm:w-32" />
        <Button variant="outline" className="h-9 w-full sm:w-auto" disabled={!data} onClick={exportCsv}>
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </Button>
      </div>
      <Section title={`Net revenue by month · ${year}`}>
        <div className="h-56">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <ChartContainer config={NET_CHART_CONFIG} className="h-full w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatLKR(Number(value))} />} />
                <Bar dataKey="net" fill={TREND_COLOR} radius={4} maxBarSize={36} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </Section>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed">
          <TableCaption className="sr-only">Monthly payment totals for {year}</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-28 pl-4">Month</TableHead>
              <TableHead className="w-32 text-right">Collected</TableHead>
              <TableHead className="w-32 text-right">Refunded</TableHead>
              <TableHead className="w-32 text-right">Reversed</TableHead>
              <TableHead className="w-32 text-right">Net</TableHead>
              <TableHead className="w-24 pr-4 text-right">Entries</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || !data ? (
              <TableSkeletonRows columns={6} rows={6} label="Loading monthly totals…" />
            ) : (
              <>
                {data.months.map((month) => (
                  <TableRow key={month.month} className={cn(month.entries === 0 && "text-muted-foreground")}>
                    <TableCell className="pl-4">{MONTH_LABELS[month.month - 1]}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatLKR(month.collected)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatLKR(month.refunded)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatLKR(month.reversed)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatLKR(month.net)}</TableCell>
                    <TableCell className="pr-4 text-right tabular-nums">{month.entries}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-semibold hover:bg-muted/40">
                  <TableCell className="pl-4">Total</TableCell>
                  <TableCell className="text-right tabular-nums">{formatLKR(data.totals.collected)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatLKR(data.totals.refunded)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatLKR(data.totals.reversed)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatLKR(data.totals.net)}</TableCell>
                  <TableCell className="pr-4 text-right tabular-nums">{data.totals.entries}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * Payments — the super-admin finance workspace over the append-only payment
 * ledger. See foundry_lms_docs/2026-10-01_next_features_implementation_plan.md §4.
 */
export default function PaymentsPage() {
  const user = useAppSelector(selectAuthUser);
  const [openPaymentId, setOpenPaymentId] = useState<string | null>(null);

  if (!canViewPayments(user)) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-12 text-center">
        <h2 className="mb-2 text-2xl font-bold text-red-900">Access Restricted</h2>
        <p className="text-red-700">Only Super Administrators can view payments.</p>
      </div>
    );
  }
  const canManage = canManagePayments(user);

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogPageHeader
        title="Payments"
        description="Every payment, refund and correction recorded in the system — nothing here is ever edited or deleted."
        icon={Icons.payments}
      />
      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="ledger">
          <LedgerTab canManage={canManage} onOpen={setOpenPaymentId} />
        </TabsContent>
        <TabsContent value="outstanding">
          <OutstandingTab />
        </TabsContent>
        <TabsContent value="monthly">
          <MonthlyTab />
        </TabsContent>
      </Tabs>
      <PaymentDetailSheet paymentId={openPaymentId} canManage={canManage} onOpenChange={(open) => !open && setOpenPaymentId(null)} />
    </div>
  );
}
