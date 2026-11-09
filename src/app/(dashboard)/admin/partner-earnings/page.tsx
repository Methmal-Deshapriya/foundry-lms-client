"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Download, Plus, RotateCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { KpiValueSkeleton, TableSkeletonRows } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import {
  AddExpenseDialog,
  AddPayoutDialog,
  EXPENSE_CATEGORY_LABELS,
  NewSplitDialog,
  ReverseEntryDialog,
} from "@/features/partners/components/PartnerDialogs";
import {
  useGetEarningsByIntakeQuery,
  useGetEarningsOverviewQuery,
  useGetExpensesQuery,
  useLazyGetExpensesQuery,
  useLazyGetPayoutsQuery,
  useGetPayoutsQuery,
  useGetSharesQuery,
  useReverseExpenseMutation,
  useReversePayoutMutation,
} from "@/features/partners/partnersApi";
import type { Expense, Partner, Payout } from "@/features/partners/partnersTypes";
import { PAYMENT_METHOD_LABELS } from "@/features/payments/paymentLabels";
import { canManagePayments, canViewPayments } from "@/lib/access";
import { getApiErrorMessage } from "@/lib/api";
import { downloadCsv, toCsv } from "@/lib/csv";
import { Icons } from "@/lib/icons";
import { cn, formatLKR } from "@/lib/utils";
import { dayEndIso, dayStartIso } from "@/lib/dates";
import { useAppSelector } from "@/store/hooks";

const BLACK = "bg-[#191919] bg-none text-white hover:bg-[#27272A]";
const day = (value: string) => format(new Date(value), "MMM d, yyyy");
const isoDay = (value: string) => format(new Date(value), "yyyy-MM-dd");
const stamp = () => format(new Date(), "yyyy-MM-dd");

function toQueryRange(range: DateRange) {
  return {
    // Local (Sri Lanka) day boundaries as real instants (M03-07).
    from: range.from ? dayStartIso(range.from) : undefined,
    to: range.to ? dayEndIso(range.to) : undefined,
  };
}

// The split in effect now: the newest one that has started (sets come
// newest first). A split saved for a future date is "Scheduled" until then,
// matching the engine's own rule (code review M03-25).
function currentShareSet<T extends { effectiveFrom: string }>(sets: T[]) {
  const now = Date.now();
  return sets.find((set) => new Date(set.effectiveFrom).getTime() <= now) ?? null;
}

function Money({ value, className }: { value: number; className?: string }) {
  return <span className={cn("tabular-nums", value < 0 && "text-red-600", className)}>{formatLKR(value || 0)}</span>;
}

// ---------------------------------------------------------------- overview
function OverviewTab({ range, shares }: { range: DateRange; shares: Map<string, number> }) {
  const { data } = useGetEarningsOverviewQuery(toQueryRange(range));
  const ranged = Boolean(range.from || range.to);

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(
      `partner-earnings-${stamp()}.csv`,
      toCsv([
        ["Partner", "Share now (%)", "Share of revenue", "Share of expenses", "Out-of-pocket paid", "Earned", "Paid out", "Still owed"],
        ...data.partners.map((row) => [row.name, shares.get(row.partnerId) ?? "", row.revenueShare, row.expenseShare, row.reimbursed, row.earned, row.paidOut, row.owed]),
        ["Total revenue", data.totals.revenue],
        ["Total expenses", data.totals.expenses],
        ["Profit", data.totals.profit],
        ["Paid out", data.totals.paidOut],
        ["Cash on hand", data.totals.cashOnHand],
      ]),
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {(data?.partners ?? [null, null, null]).map((row, index) => (
          <section key={row?.partnerId ?? index} className="space-y-4 rounded-xl border border-border bg-card p-5">
            {row ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-foreground">{row.name}</h2>
                  <Badge variant="outline">{shares.get(row.partnerId) ?? "—"}%</Badge>
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{ranged ? "Still owed (in this period)" : "Still owed"}</p>
                  <p className={cn("text-3xl font-bold tabular-nums", row.owed < 0 ? "text-red-600" : "text-foreground")}>{formatLKR(row.owed)}</p>
                  {row.owed < 0 ? <p className="text-xs text-red-600">Paid out more than earned so far.</p> : null}
                </div>
                <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
                  {[
                    ["Share of revenue", row.revenueShare],
                    ["Share of expenses", -row.expenseShare],
                    ...(row.reimbursed ? [["Out-of-pocket paid (owed back)", row.reimbursed] as [string, number]] : []),
                    ["Earned", row.earned],
                    ["Paid out", -row.paidOut],
                  ].map(([label, value]) => (
                    <div key={label as string} className={cn("flex items-center justify-between gap-3", label === "Earned" && "border-t border-border pt-1.5 font-semibold")}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd>
                        <Money value={value as number} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <div className="space-y-3" aria-hidden="true">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}
          </section>
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-5">
          {[
            ["Revenue", data?.totals.revenue],
            ["Expenses", data?.totals.expenses],
            ["Profit", data?.totals.profit],
            ["Paid out", data?.totals.paidOut],
            ["Cash on hand", data?.totals.cashOnHand],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
              {value === undefined ? <KpiValueSkeleton /> : <Money value={value as number} className="font-semibold" />}
            </div>
          ))}
        </div>
        <Button variant="outline" className="h-9 shrink-0" disabled={!data} onClick={exportCsv}>
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </Button>
      </section>
      {data ? (
        <p className={cn("flex items-start gap-2 text-xs", data.totals.balanced ? "text-muted-foreground" : "text-red-600")}>
          {data.totals.balanced ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> : <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />}
          {data.totals.balanced
            ? "Balanced: the three “still owed” amounts add up to the cash on hand (revenue − expenses paid from the business account − payouts). If your bank balance differs, something hasn't been recorded yet."
            : "Out of balance — the partners' totals don't add up to the cash on hand. Please report this."}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- by intake
function ByIntakeTab({ range }: { range: DateRange }) {
  const { data, isLoading } = useGetEarningsByIntakeQuery(toQueryRange(range));
  const partners = data?.partners ?? [];
  const rows = data?.rows ?? [];
  const total = rows.reduce(
    (sum, row) => ({ revenue: sum.revenue + row.revenue, expenses: sum.expenses + row.expenses, profit: sum.profit + row.profit }),
    { revenue: 0, expenses: 0, profit: 0 },
  );
  const partnerTotal = (partnerId: string) => rows.reduce((sum, row) => sum + (row.shares.find((share) => share.partnerId === partnerId)?.amount ?? 0), 0);

  const exportCsv = () =>
    downloadCsv(
      `partner-earnings-by-intake-${stamp()}.csv`,
      toCsv([
        ["Intake", "Course", "Revenue", "Expenses", "Profit", ...partners.map((partner) => partner.name)],
        ...rows.map((row) => [row.intakeCode ?? "General", row.courseTitle, row.revenue, row.expenses, row.profit, ...partners.map((partner) => row.shares.find((share) => share.partnerId === partner.id)?.amount ?? 0)]),
        ["Total", "", total.revenue, total.expenses, total.profit, ...partners.map((partner) => partnerTotal(partner.id))],
      ]),
    );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" className="h-9" disabled={rows.length === 0} onClick={exportCsv}>
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed min-w-4xl">
          <TableCaption className="sr-only">Profit per intake and each partner&apos;s share</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-52 pl-4">Intake</TableHead>
              <TableHead className="w-28 text-right">Revenue</TableHead>
              <TableHead className="w-28 text-right">Expenses</TableHead>
              <TableHead className="w-28 text-right">Profit</TableHead>
              {partners.map((partner) => (
                <TableHead key={partner.id} className="w-32 text-right last:pr-4">
                  {partner.name.split(" ")[0]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows columns={7} label="Loading earnings by intake…" />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4 + partners.length} className="h-24 text-center text-muted-foreground">
                  No payments or expenses in this period.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((row) => (
                  <TableRow key={row.intakeId ?? "general"}>
                    <TableCell className="max-w-0 pl-4">
                      <p className="truncate font-medium">{row.intakeCode ?? "General expenses"}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.intakeCode ? row.courseTitle : "Not tied to one intake"}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={row.revenue} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={-row.expenses} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <Money value={row.profit} />
                    </TableCell>
                    {partners.map((partner) => (
                      <TableCell key={partner.id} className="text-right last:pr-4">
                        <Money value={row.shares.find((share) => share.partnerId === partner.id)?.amount ?? 0} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-semibold hover:bg-muted/40">
                  <TableCell className="pl-4">Total</TableCell>
                  <TableCell className="text-right">
                    <Money value={total.revenue} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money value={-total.expenses} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money value={total.profit} />
                  </TableCell>
                  {partners.map((partner) => (
                    <TableCell key={partner.id} className="text-right last:pr-4">
                      <Money value={partnerTotal(partner.id)} />
                    </TableCell>
                  ))}
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Partner columns show each person&apos;s share of that intake&apos;s profit. Out-of-pocket reimbursements and payouts are on the Overview.</p>
    </div>
  );
}

// ---------------------------------------------------------------- expenses
function ExpensesTab({ range, partners, canManage }: { range: DateRange; partners: Partner[]; canManage: boolean }) {
  const [offset, setOffset] = useState(0);
  const { data, isLoading } = useGetExpensesQuery({ ...toQueryRange(range), limit: 50, offset });
  const [fetchExpenses, { isFetching: isExporting }] = useLazyGetExpensesQuery();
  const [adding, setAdding] = useState(false);
  const [reversing, setReversing] = useState<Expense | null>(null);
  const [reverseExpense, { isLoading: isReversing }] = useReverseExpenseMutation();
  const rows = data?.expenses ?? [];

  // Every page in the range, not just the visible 50 (code review M03-17).
  const exportCsv = async () => {
    const all: Expense[] = [];
    for (let pageOffset = 0; ; pageOffset += 100) {
      const page = await fetchExpenses({ ...toQueryRange(range), limit: 100, offset: pageOffset }).unwrap();
      all.push(...page.expenses);
      if (!page.pagination.hasMore) break;
    }
    downloadCsv(
      `expenses-${stamp()}.csv`,
      toCsv([
        ["Date", "Category", "Description", "Intake", "Paid from", "Amount (LKR)", "Type", "Recorded by"],
        ...all.map((row) => [isoDay(row.spentAt), EXPENSE_CATEGORY_LABELS[row.category], row.description ?? "", row.intake?.code ?? "General", row.paidBy ? row.paidBy.name : "Business account", row.amount, row.kind === "REVERSAL" ? "Reversal" : "Expense", row.recordedBy ?? ""]),
      ]),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{data ? `Total in this view: ${formatLKR(data.sum)}` : " "}</p>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9" disabled={rows.length === 0 || isExporting} onClick={exportCsv}>
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
          {canManage ? (
            <Button className={cn("h-9", BLACK)} onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Add expense
            </Button>
          ) : null}
        </div>
      </div>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed min-w-3xl">
          <TableCaption className="sr-only">Expenses</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-28 pl-4">Date</TableHead>
              <TableHead className="w-60">What</TableHead>
              <TableHead className="w-40">Intake</TableHead>
              <TableHead className="w-40">Paid from</TableHead>
              <TableHead className="w-28 text-right">Amount</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows columns={6} label="Loading expenses…" />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No expenses recorded{range.from || range.to ? " in this period" : " yet"}.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className={cn(row.reversed && "text-muted-foreground")}>
                  <TableCell className="pl-4 text-sm">{day(row.spentAt)}</TableCell>
                  <TableCell className="max-w-0">
                    <p className="flex items-center gap-1.5 font-medium">
                      <span className="truncate">{EXPENSE_CATEGORY_LABELS[row.category]}</span>
                      {row.kind === "REVERSAL" ? <Badge variant="outline">Reversal</Badge> : row.reversed ? <Badge variant="outline">Reversed</Badge> : null}
                    </p>
                    {row.description ? <p className="truncate text-xs text-muted-foreground" title={row.description}>{row.description}</p> : null}
                  </TableCell>
                  <TableCell className="max-w-0 truncate text-sm">{row.intake ? row.intake.code : "General"}</TableCell>
                  <TableCell className="max-w-0 truncate text-sm">{row.paidBy ? `${row.paidBy.name}` : "Business account"}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <Money value={row.amount} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {canManage && row.kind === "ENTRY" && !row.reversed ? (
                      <Button variant="ghost" size="sm" onClick={() => setReversing(row)}>
                        <RotateCcw className="size-3.5" aria-hidden="true" />
                        Reverse
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {data?.pagination.hasMore || offset > 0 ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!data?.pagination.hasMore} onClick={() => setOffset(offset + 50)}>
            Next
          </Button>
        </div>
      ) : null}
      <AddExpenseDialog open={adding} onOpenChange={setAdding} partners={partners} />
      <ReverseEntryDialog
        open={Boolean(reversing)}
        onOpenChange={(open) => !open && setReversing(null)}
        title="Reverse this expense?"
        description={reversing ? `Adds an equal and opposite entry (${formatLKR(-reversing.amount)}). Nothing is deleted.` : ""}
        isLoading={isReversing}
        onConfirm={async (reason) => {
          if (!reversing) return;
          try {
            await reverseExpense({ id: reversing.id, reason }).unwrap();
            toast.success("Expense reversed.");
            setReversing(null);
          } catch (error) {
            toast.error(getApiErrorMessage(error, "The expense could not be reversed."));
          }
        }}
      />
    </div>
  );
}

// ----------------------------------------------------------------- payouts
function PayoutsTab({ range, partners, canManage, owedByPartner }: { range: DateRange; partners: Partner[]; canManage: boolean; owedByPartner: Map<string, number> }) {
  const [offset, setOffset] = useState(0);
  const { data, isLoading } = useGetPayoutsQuery({ ...toQueryRange(range), limit: 50, offset });
  const [fetchPayouts, { isFetching: isExporting }] = useLazyGetPayoutsQuery();
  const [adding, setAdding] = useState(false);
  const [reversing, setReversing] = useState<Payout | null>(null);
  const [reversePayout, { isLoading: isReversing }] = useReversePayoutMutation();
  const rows = data?.payouts ?? [];

  const exportCsv = async () => {
    const all: Payout[] = [];
    for (let pageOffset = 0; ; pageOffset += 100) {
      const page = await fetchPayouts({ ...toQueryRange(range), limit: 100, offset: pageOffset }).unwrap();
      all.push(...page.payouts);
      if (!page.pagination.hasMore) break;
    }
    downloadCsv(
      `payouts-${stamp()}.csv`,
      toCsv([
        ["Date", "Partner", "Amount (LKR)", "Method", "Reference", "Note", "Type", "Recorded by"],
        ...all.map((row) => [isoDay(row.paidAt), row.partner.name, row.amount, row.method ? PAYMENT_METHOD_LABELS[row.method] : "", row.reference ?? "", row.note ?? "", row.kind === "REVERSAL" ? "Reversal" : "Payout", row.recordedBy ?? ""]),
      ]),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="h-9" disabled={rows.length === 0 || isExporting} onClick={exportCsv}>
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </Button>
        {canManage ? (
          <Button className={cn("h-9", BLACK)} onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Record payout
          </Button>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed min-w-3xl">
          <TableCaption className="sr-only">Payouts to partners</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-28 pl-4">Date</TableHead>
              <TableHead className="w-48">Partner</TableHead>
              <TableHead className="w-36">Method</TableHead>
              <TableHead className="w-56">Reference · note</TableHead>
              <TableHead className="w-28 text-right">Amount</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows columns={6} label="Loading payouts…" />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No payouts recorded{range.from || range.to ? " in this period" : " yet"}.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className={cn(row.reversed && "text-muted-foreground")}>
                  <TableCell className="pl-4 text-sm">{day(row.paidAt)}</TableCell>
                  <TableCell className="max-w-0">
                    <p className="flex items-center gap-1.5 font-medium">
                      <span className="truncate">{row.partner.name}</span>
                      {row.kind === "REVERSAL" ? <Badge variant="outline">Reversal</Badge> : row.reversed ? <Badge variant="outline">Reversed</Badge> : null}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{row.method ? PAYMENT_METHOD_LABELS[row.method] : "—"}</TableCell>
                  <TableCell className="max-w-0 truncate text-sm text-muted-foreground" title={[row.reference, row.note].filter(Boolean).join(" · ")}>
                    {[row.reference, row.note].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <Money value={row.amount} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {canManage && row.kind === "ENTRY" && !row.reversed ? (
                      <Button variant="ghost" size="sm" onClick={() => setReversing(row)}>
                        <RotateCcw className="size-3.5" aria-hidden="true" />
                        Reverse
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {data?.pagination.hasMore || offset > 0 ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!data?.pagination.hasMore} onClick={() => setOffset(offset + 50)}>
            Next
          </Button>
        </div>
      ) : null}
      <AddPayoutDialog open={adding} onOpenChange={setAdding} partners={partners} owedByPartner={owedByPartner} />
      <ReverseEntryDialog
        open={Boolean(reversing)}
        onOpenChange={(open) => !open && setReversing(null)}
        title="Reverse this payout?"
        description={reversing ? `Adds an equal and opposite entry (${formatLKR(-reversing.amount)}) for ${reversing.partner.name}. Nothing is deleted.` : ""}
        isLoading={isReversing}
        onConfirm={async (reason) => {
          if (!reversing) return;
          try {
            await reversePayout({ id: reversing.id, reason }).unwrap();
            toast.success("Payout reversed.");
            setReversing(null);
          } catch (error) {
            toast.error(getApiErrorMessage(error, "The payout could not be reversed."));
          }
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------------ shares
function SharesTab({ canManage }: { canManage: boolean }) {
  const { data, isLoading } = useGetSharesQuery();
  const [changing, setChanging] = useState(false);
  const partners = data?.partners ?? [];
  const sets = data?.shareSets ?? [];
  const currentSet = currentShareSet(sets);
  const current = new Map((currentSet?.entries ?? []).map((entry) => [entry.partnerId, entry.percent]));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Every payment and expense uses the split in effect on its own date. A change never rewrites the past.</p>
        {canManage ? (
          <Button className={cn("h-9 shrink-0", BLACK)} onClick={() => setChanging(true)} disabled={partners.length === 0}>
            Change the split
          </Button>
        ) : null}
      </div>
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <ol className="space-y-3">
          {sets.map((set) => (
            <li key={set.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-foreground">
                  From {day(set.effectiveFrom)}
                  {set.id === currentSet?.id ? (
                    <Badge className="ml-2 bg-[#191919] text-white">Current</Badge>
                  ) : new Date(set.effectiveFrom) > new Date() ? (
                    <Badge variant="outline" className="ml-2">Scheduled</Badge>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">{set.note ?? ""}{set.createdBy ? ` · by ${set.createdBy}` : ""}</p>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {set.entries.map((entry) => (
                  <div key={entry.partnerId} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <span>{entry.name}</span>
                    <span className="font-semibold tabular-nums">{entry.percent}%</span>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
      <NewSplitDialog open={changing} onOpenChange={setChanging} partners={partners} current={current} />
    </div>
  );
}

/**
 * Partner earnings — the owners' share of profit, payouts and what's still
 * owed. Super admins only, like Payments. See
 * foundry_lms_docs/2026-10-01_partner_earnings_implementation_plan.md.
 */
export default function PartnerEarningsPage() {
  const user = useAppSelector(selectAuthUser);
  const [range, setRange] = useState<DateRange>({});
  // Paged tabs remount when the range changes, so they start again at page 1.
  const rangeKey = `${range.from ?? ""}_${range.to ?? ""}`;
  const { data: sharesData } = useGetSharesQuery(undefined, { skip: !canViewPayments(user) });
  const { data: overview } = useGetEarningsOverviewQuery({}, { skip: !canViewPayments(user) });

  if (!canViewPayments(user)) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-12 text-center">
        <h2 className="mb-2 text-2xl font-bold text-red-900">Access Restricted</h2>
        <p className="text-red-700">Only Super Administrators can view partner earnings.</p>
      </div>
    );
  }
  const canManage = canManagePayments(user);
  const partners = sharesData?.partners ?? [];
  const currentShares = new Map((currentShareSet(sharesData?.shareSets ?? [])?.entries ?? []).map((entry) => [entry.partnerId, entry.percent]));
  // "Currently owed" in the payout dialog is always all-time, whatever range is shown.
  const owedByPartner = new Map((overview?.partners ?? []).map((row) => [row.partnerId, row.owed]));

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogPageHeader
        title="Partner earnings"
        description="Each owner's share of profit, what's been paid out, and what's still owed — from every recorded payment and expense."
        icon={Icons.partnerEarnings}
        action={<DateRangePicker value={range} onChange={setRange} placeholder="All time" />}
      />
      <Tabs defaultValue="overview">
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="intakes">By intake</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="shares">Shares</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview">
          <OverviewTab range={range} shares={currentShares} />
        </TabsContent>
        <TabsContent value="intakes">
          <ByIntakeTab range={range} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesTab key={rangeKey} range={range} partners={partners} canManage={canManage} />
        </TabsContent>
        <TabsContent value="payouts">
          <PayoutsTab key={rangeKey} range={range} partners={partners} canManage={canManage} owedByPartner={owedByPartner} />
        </TabsContent>
        <TabsContent value="shares">
          <SharesTab canManage={canManage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
