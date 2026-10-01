"use client";

import { useState } from "react";
import {
  Award,
  Ban,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Mail,
  MoreHorizontal,
  RotateCcw,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterPills, type FilterPillOption } from "@/components/ui/filter-pills";
import { Input } from "@/components/ui/input";
import { PaymentMethodSelect } from "@/features/payments/components/PaymentMethodSelect";
import type { PaymentMethod } from "@/features/payments/paymentsTypes";
import { Label } from "@/components/ui/label";
import { OffsetPagination } from "@/components/ui/offset-pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api";
import { downloadCsv, toCsv } from "@/lib/csv";
import {
  CERTIFICATE_STATUS_STYLES,
  ENROLLMENT_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
} from "@/lib/statusColors";
import { useIssueCertificateMutation } from "@/features/certificates/certificatesApi";
import {
  useCompletePaymentMutation,
  useGetCourseRosterQuery,
  useLazyGetCourseRosterQuery,
  useUpdateEnrollmentMutation,
} from "../enrollmentsApi";
import type { ClassRosterEntry, EnrollmentStatus, RosterSummary } from "../enrollmentsTypes";

const statusStyles = ENROLLMENT_STATUS_STYLES;
const paymentStyles = PAYMENT_STATUS_STYLES;
const certificateStyles = CERTIFICATE_STATUS_STYLES;

const STATUS_PILLS: { key: EnrollmentStatus | ""; label: string; countKey: keyof RosterSummary }[] = [
  { key: "", label: "All", countKey: "all" },
  { key: "ACTIVE", label: "Active", countKey: "active" },
  { key: "COMPLETED", label: "Completed", countKey: "completed" },
  { key: "CANCELLED", label: "Cancelled", countKey: "cancelled" },
];
const PILL_ACTIVE_CLASS: Record<EnrollmentStatus | "", string> = {
  "": "border-zinc-300 bg-zinc-100 text-[#191919]",
  ACTIVE: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  CANCELLED: "border-destructive/20 bg-destructive/10 text-destructive",
};

const DEFAULT_PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;
const MIN_FILTER_LENGTH = 3;
const INTERACTIVE_SELECTOR = "input,button,a,[role=menuitem],[data-no-row-navigation]";

const enrollmentStatusOptions: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  ACTIVE: ["ACTIVE", "COMPLETED", "CANCELLED"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED", "ACTIVE"],
};

const STATUS_ACTION_LABEL: Record<EnrollmentStatus, string> = {
  COMPLETED: "Mark completed",
  CANCELLED: "Cancel enrollment",
  ACTIVE: "Reactivate enrollment",
};
const STATUS_ACTION_ICON: Record<EnrollmentStatus, typeof CheckCircle2> = {
  COMPLETED: CheckCircle2,
  CANCELLED: Ban,
  ACTIVE: RotateCcw,
};

// Certificates only ever apply to a COMPLETED, cert-enabled enrollment — the
// other two states cover why one hasn't been issued: not eligible yet
// (wrong status), or the course doesn't offer one at all.
const CERTIFICATE_CELL_STYLES = {
  NOT_OFFERED: "border-border bg-muted text-muted-foreground",
  NOT_QUALIFIED: "border-border bg-muted text-muted-foreground",
  NOT_ISSUED: "border-amber-500/20 bg-amber-500/10 text-amber-700",
} as const;

function certificateCellState(entry: ClassRosterEntry, certificateEnabled: boolean) {
  if (!certificateEnabled) return { label: "Not offered", className: CERTIFICATE_CELL_STYLES.NOT_OFFERED };
  if (entry.status !== "COMPLETED") return { label: "Not qualified", className: CERTIFICATE_CELL_STYLES.NOT_QUALIFIED };
  if (entry.certificate?.status === "ISSUED") return { label: "Issued", className: certificateStyles.ISSUED };
  if (entry.certificate?.status === "REVOKED") return { label: "Revoked", className: certificateStyles.REVOKED };
  return { label: "Not issued", className: CERTIFICATE_CELL_STYLES.NOT_ISSUED };
}

function label(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace("_", " ");
}

// Shared between the desktop table row and the narrow-screen card below.
function RosterActionsMenu({
  entry,
  nextStatuses,
  canRecordPayment,
  canIssueCertificate,
  isIssuing,
  onChangeStatus,
  onRecordPayment,
  onIssueCertificate,
}: {
  entry: ClassRosterEntry;
  nextStatuses: EnrollmentStatus[];
  canRecordPayment: boolean;
  canIssueCertificate: boolean;
  isIssuing: boolean;
  onChangeStatus: (status: EnrollmentStatus) => void;
  onRecordPayment: () => void;
  onIssueCertificate: () => void;
}) {
  const hasActions = nextStatuses.length > 0 || canRecordPayment || canIssueCertificate;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${entry.user?.firstName} ${entry.user?.lastName}`}
          data-no-row-navigation
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasActions ? (
          <>
            {nextStatuses.map((status) => {
              const Icon = STATUS_ACTION_ICON[status];
              return (
                <DropdownMenuItem
                  key={status}
                  variant={status === "CANCELLED" ? "destructive" : "default"}
                  onSelect={() => onChangeStatus(status)}
                >
                  <Icon /> {STATUS_ACTION_LABEL[status]}
                </DropdownMenuItem>
              );
            })}
            {nextStatuses.length > 0 && (canRecordPayment || canIssueCertificate) ? <DropdownMenuSeparator /> : null}
            {canRecordPayment ? (
              <DropdownMenuItem onSelect={onRecordPayment}>
                <Wallet /> Record remaining payment
              </DropdownMenuItem>
            ) : null}
            {canIssueCertificate ? (
              <DropdownMenuItem onSelect={onIssueCertificate} disabled={isIssuing}>
                <Award /> Issue certificate
              </DropdownMenuItem>
            ) : null}
          </>
        ) : (
          <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const EXPORT_PAGE_SIZE = 100; // the roster endpoint's max page size

// yyyy-MM-dd in the admin's own timezone (toISOString would give the UTC date).
function localDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function ClassRosterTable({
  intakeId,
  deliveryMode,
  certificateEnabled,
  exportName,
}: {
  intakeId: string;
  deliveryMode: "PAID" | "FREE";
  certificateEnabled: boolean;
  /** Used for the export's file name, e.g. the intake code. */
  exportName?: string;
}) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "">("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);

  const debouncedQ = useDebouncedValue(q.trim(), FILTER_DEBOUNCE_MS);
  const appliedQ = debouncedQ.length === 0 || debouncedQ.length >= MIN_FILTER_LENGTH ? debouncedQ : "";

  const { data, isLoading, isFetching } = useGetCourseRosterQuery({
    intakeId,
    q: appliedQ || undefined,
    status: statusFilter || undefined,
    limit: pageSize,
    offset,
  });
  const entries = data?.enrollments ?? [];

  // Export always covers the WHOLE intake roster — every status, ignoring
  // the table's current search/filter/page — since its main use is sharing
  // Google Drive video folders with every enrolled student's email.
  const [fetchRosterPage] = useLazyGetCourseRosterQuery();
  const [isExporting, setIsExporting] = useState(false);
  const fetchWholeRoster = async () => {
    const all: ClassRosterEntry[] = [];
    for (let pageOffset = 0; ; pageOffset += EXPORT_PAGE_SIZE) {
      const page = await fetchRosterPage({ intakeId, limit: EXPORT_PAGE_SIZE, offset: pageOffset }).unwrap();
      all.push(...page.enrollments);
      if (!page.pagination.hasMore) return all;
    }
  };
  const runExport = async (kind: "csv" | "emails") => {
    setIsExporting(true);
    try {
      const roster = await fetchWholeRoster();
      if (roster.length === 0) {
        toast.info("There are no enrollments to export yet.");
        return;
      }
      if (kind === "emails") {
        // Active + completed only: a cancelled student shouldn't be given
        // access to course material.
        const emails = [...new Set(roster.filter((entry) => entry.status !== "CANCELLED").map((entry) => entry.user.email))];
        await navigator.clipboard.writeText(emails.join(", "));
        toast.success(`Copied ${emails.length} email${emails.length === 1 ? "" : "s"} — paste them into Google Drive's Share box.`);
        return;
      }
      const rows = [
        ["First name", "Last name", "Email", "Status", "Payment", "Enrolled on", "Enrolled via"],
        ...roster.map((entry) => [
          entry.user.firstName,
          entry.user.lastName,
          entry.user.email,
          entry.status,
          entry.paymentStatus,
          entry.enrolledAt ? localDate(new Date(entry.enrolledAt)) : "",
          entry.source === "SELF" ? "Self-enrolled" : "Admin",
        ]),
      ];
      const stamp = localDate(new Date());
      downloadCsv(`${exportName ?? "enrollments"}-enrollments-${stamp}.csv`, toCsv(rows));
      toast.success(`Exported ${roster.length} enrollment${roster.length === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The export could not be completed."));
    } finally {
      setIsExporting(false);
    }
  };

  const [updateEnrollment, { isLoading: isUpdating }] = useUpdateEnrollmentMutation();
  const [issueCertificate, { isLoading: isIssuing }] = useIssueCertificateMutation();
  const [completePayment, { isLoading: isCompletingPayment }] = useCompletePaymentMutation();

  const [certificateTarget, setCertificateTarget] = useState<ClassRosterEntry | null>(null);
  const [completePaymentTarget, setCompletePaymentTarget] = useState<ClassRosterEntry | null>(null);
  const [topUpDraft, setTopUpDraft] = useState<{ method: PaymentMethod | null; reference: string }>({ method: null, reference: "" });
  const [detailEntry, setDetailEntry] = useState<ClassRosterEntry | null>(null);
  // Completing (permanent) and cancelling (removes access at once) are
  // confirmed first; reactivating runs straight away (code review M05-03).
  const [statusTarget, setStatusTarget] = useState<{ entry: ClassRosterEntry; status: EnrollmentStatus } | null>(null);
  const [evidenceDraft, setEvidenceDraft] = useState({ reference: "", note: "" });

  // Keep the sheet showing live data (status/payment can change from the row
  // dropdown while it's open) rather than the stale snapshot it was opened with.
  const liveDetailEntry = detailEntry ? (entries.find((e) => e.id === detailEntry.id) ?? detailEntry) : null;

  const openDetail = (entry: ClassRosterEntry) => {
    setDetailEntry(entry);
    setEvidenceDraft({ reference: entry.externalPaymentReference ?? "", note: entry.paymentNote ?? "" });
  };

  const changeStatus = async (entry: ClassRosterEntry, status: EnrollmentStatus) => {
    try {
      await updateEnrollment({ id: entry.id, data: { status } }).unwrap();
      toast.success(`Enrollment ${label(status).toLowerCase()}`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update enrollment status"));
    }
  };

  const saveEvidence = async () => {
    if (!detailEntry) return;
    try {
      await updateEnrollment({
        id: detailEntry.id,
        data: {
          externalPaymentReference: evidenceDraft.reference.trim() || null,
          paymentNote: evidenceDraft.note.trim() || null,
        },
      }).unwrap();
      toast.success("Payment evidence updated");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update payment evidence"));
    }
  };

  const confirmIssueCertificate = async () => {
    if (!certificateTarget) return;
    try {
      await issueCertificate({
        enrollmentId: certificateTarget.id,
        data: { description: "Successfully completed the course." },
      }).unwrap();
      toast.success("Certificate issued successfully!");
      setCertificateTarget(null);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to issue certificate"));
    }
  };

  const confirmCompletePayment = async () => {
    if (!completePaymentTarget) return;
    try {
      await completePayment({ id: completePaymentTarget.id, paymentMethod: topUpDraft.method, externalReference: topUpDraft.reference.trim() || null }).unwrap();
      setTopUpDraft({ method: null, reference: "" });
      toast.success("Remaining payment recorded; enrollment is now fully paid");
      setCompletePaymentTarget(null);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to record the remaining payment"));
    }
  };

  const pillOptions: FilterPillOption<EnrollmentStatus | "">[] = STATUS_PILLS.map(({ key, label: pillLabel, countKey }) => ({
    key,
    label: pillLabel,
    count: data?.summary?.[countKey] ?? 0,
    activeClassName: PILL_ACTIVE_CLASS[key],
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Search students by name or email"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setOffset(0);
          }}
          placeholder="Search name or email"
          className="h-9 w-full sm:w-56 sm:shrink-0"
        />
        <FilterPills
          ariaLabel="Filter by enrollment status"
          options={pillOptions}
          active={statusFilter}
          onChange={(key) => {
            setStatusFilter(key);
            setOffset(0);
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 w-full sm:ml-auto sm:w-auto" disabled={isExporting}>
              {isExporting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => void runExport("csv")}>
              <Download /> Download spreadsheet (.csv)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void runExport("emails")}>
              <Copy /> Copy all student emails
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-md border bg-card" aria-busy={isLoading || isFetching}>
        <Table className="table-fixed">
          <TableCaption className="sr-only">
            {deliveryMode === "PAID"
              ? "Enrolled students in this course intake"
              : "Students enrolled in this Free Learning course"}
          </TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-40 px-4">Student</TableHead>
              <TableHead className="w-36">Enrollment status</TableHead>
              <TableHead className="w-28">Payment</TableHead>
              <TableHead className="w-28">Certificate</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  <span role="status" aria-live="polite">
                    Loading roster…
                  </span>
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 whitespace-normal text-center text-muted-foreground"
                >
                  {q || statusFilter ? "No enrollments match your filters." : "No learners enrolled in this course yet."}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const nextStatuses = (
                  deliveryMode === "FREE" && entry.status === "CANCELLED"
                    ? []
                    : enrollmentStatusOptions[entry.status]
                ).filter((status) => status !== entry.status);
                const canRecordPayment = deliveryMode === "PAID" && entry.paymentStatus === "PARTIAL";
                const canIssueCertificate =
                  entry.status === "COMPLETED" &&
                  certificateEnabled &&
                  (entry.paymentStatus === "COMPLETED" || entry.paymentStatus === "NOT_REQUIRED") &&
                  entry.certificate?.status !== "ISSUED";
                const certificateCell = certificateCellState(entry, certificateEnabled);

                return (
                  <TableRow
                    key={entry.id}
                    tabIndex={0}
                    aria-label={`View details for ${entry.user?.firstName} ${entry.user?.lastName}`}
                    className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    onClick={(event) => {
                      if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
                      openDetail(entry);
                    }}
                    onKeyDown={(event) => {
                      if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDetail(entry);
                      }
                    }}
                  >
                    <TableCell className="w-40 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[#191919]">
                          <User className="size-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold" title={`${entry.user?.firstName} ${entry.user?.lastName}`}>
                            {entry.user?.firstName} {entry.user?.lastName}
                          </p>
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground" title={entry.user?.email}>
                            <Mail className="size-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{entry.user?.email}</span>
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={statusStyles[entry.status]}>
                        {label(entry.status)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={deliveryMode === "FREE" ? paymentStyles.NOT_REQUIRED : paymentStyles[entry.paymentStatus]}
                      >
                        {deliveryMode === "FREE" ? "Not applicable" : label(entry.paymentStatus)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={certificateCell.className}>
                        {certificateCell.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="pr-4 text-right" data-no-row-navigation>
                      <RosterActionsMenu
                        entry={entry}
                        nextStatuses={nextStatuses}
                        canRecordPayment={canRecordPayment}
                        canIssueCertificate={canIssueCertificate}
                        isIssuing={isIssuing}
                        onChangeStatus={(status) =>
                          status === "COMPLETED" || status === "CANCELLED" ? setStatusTarget({ entry, status }) : void changeStatus(entry, status)
                        }
                        onRecordPayment={() => setCompletePaymentTarget(entry)}
                        onIssueCertificate={() => setCertificateTarget(entry)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>


      {data && data.pagination.total > 0 ? (
        <OffsetPagination
          id="roster-page-size"
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

      <AlertDialog open={Boolean(statusTarget)} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusTarget?.status === "COMPLETED" ? "Mark this enrollment completed?" : "Cancel this enrollment?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.status === "COMPLETED"
                ? `${statusTarget.entry.user?.firstName ?? ""} ${statusTarget.entry.user?.lastName ?? ""} will be marked as having finished this intake. Every released session is marked done and their progress history becomes read-only. This can't be undone.`
                : `${statusTarget?.entry.user?.firstName ?? ""} ${statusTarget?.entry.user?.lastName ?? ""} loses classroom access immediately. You can reactivate the enrollment later while the intake is open.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep as is</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (statusTarget) void changeStatus(statusTarget.entry, statusTarget.status);
                setStatusTarget(null);
              }}
              className={statusTarget?.status === "CANCELLED" ? "bg-linear-to-r from-red-600 to-rose-500 bg-none text-white hover:opacity-90" : "bg-[#191919] bg-none hover:bg-[#27272A]"}
            >
              {statusTarget?.status === "COMPLETED" ? "Mark completed" : "Cancel enrollment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(certificateTarget)} onOpenChange={(open) => !open && setCertificateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Issue certificate?</AlertDialogTitle>
            <AlertDialogDescription>
              Issue a certificate for {certificateTarget?.user?.firstName} {certificateTarget?.user?.lastName}? This cannot be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmIssueCertificate}
              disabled={isIssuing}
              className="bg-[#191919] bg-none hover:bg-[#27272A]"
            >
              {isIssuing ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              Issue certificate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(completePaymentTarget)} onOpenChange={(open) => !open && setCompletePaymentTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record remaining payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirms {completePaymentTarget?.user?.firstName} {completePaymentTarget?.user?.lastName} has now paid the rest of the price they enrolled at (normally the second half). This marks payment as fully complete and enables certificate issuance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="topup-payment-method">Paid by</Label>
              <PaymentMethodSelect id="topup-payment-method" value={topUpDraft.method} onChange={(method) => setTopUpDraft({ ...topUpDraft, method })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topup-payment-reference">Reference</Label>
              <Input
                id="topup-payment-reference"
                value={topUpDraft.reference}
                maxLength={160}
                onChange={(event) => setTopUpDraft({ ...topUpDraft, reference: event.target.value })}
                placeholder="Receipt or transfer reference"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCompletePayment}
              disabled={isCompletingPayment}
              className="bg-[#191919] bg-none hover:bg-[#27272A]"
            >
              {isCompletingPayment ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              Record payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={Boolean(detailEntry)} onOpenChange={(open) => !open && setDetailEntry(null)}>
        <SheetContent className="flex flex-col border-border bg-white sm:max-w-lg" style={{ backgroundImage: "none" }}>
          {liveDetailEntry ? (
            <>
              <SheetHeader>
                <SheetTitle>
                  {liveDetailEntry.user?.firstName} {liveDetailEntry.user?.lastName}
                </SheetTitle>
                <SheetDescription>{liveDetailEntry.user?.email}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-5 overflow-y-auto px-4">
                <div className="space-y-1.5 text-sm">
                  <p className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Enrollment status</span>
                    <Badge variant="outline" className={statusStyles[liveDetailEntry.status]}>
                      {label(liveDetailEntry.status)}
                    </Badge>
                  </p>
                  <p className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Payment</span>
                    <Badge
                      variant="outline"
                      className={deliveryMode === "FREE" ? paymentStyles.NOT_REQUIRED : paymentStyles[liveDetailEntry.paymentStatus]}
                    >
                      {deliveryMode === "FREE" ? "Not applicable" : label(liveDetailEntry.paymentStatus)}
                    </Badge>
                  </p>
                  <p className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Certificate</span>
                    {liveDetailEntry.certificate?.status === "ISSUED" || liveDetailEntry.certificate?.status === "REVOKED" ? (
                      <Badge variant="outline" className={certificateStyles[liveDetailEntry.certificate.status]}>
                        {liveDetailEntry.certificate.certificateCode}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={certificateCellState(liveDetailEntry, certificateEnabled).className}
                      >
                        {certificateCellState(liveDetailEntry, certificateEnabled).label}
                      </Badge>
                    )}
                  </p>
                </div>

                {deliveryMode === "PAID" ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Payment evidence</p>
                    {/* A note on the enrollment only: the payment ledger keeps its own
                        reference, edited from Payments (code review M05-08). */}
                    <p className="text-xs text-muted-foreground">
                      An internal note on this enrollment. It doesn&apos;t change the recorded payment or its receipt; a super admin edits those in Payments.
                    </p>
                    <Input
                      aria-label="External payment reference"
                      value={evidenceDraft.reference}
                      disabled={liveDetailEntry.status === "COMPLETED"}
                      onChange={(event) => setEvidenceDraft({ ...evidenceDraft, reference: event.target.value })}
                      placeholder="External reference"
                    />
                    <Input
                      aria-label="Internal payment note"
                      value={evidenceDraft.note}
                      disabled={liveDetailEntry.status === "COMPLETED"}
                      onChange={(event) => setEvidenceDraft({ ...evidenceDraft, note: event.target.value })}
                      placeholder="Internal note"
                    />
                    {liveDetailEntry.status === "COMPLETED" ? (
                      <p className="text-xs text-muted-foreground">Locked once the enrollment is completed.</p>
                    ) : (
                      <Button
                        size="sm"
                        onClick={saveEvidence}
                        disabled={isUpdating}
                        className="bg-[#191919] bg-none hover:bg-[#27272A]"
                      >
                        {isUpdating ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
                        Save evidence
                      </Button>
                    )}
                  </div>
                ) : null}

                <div className="space-y-1.5 text-sm">
                  <p className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">{liveDetailEntry.source === "ADMIN" ? "Enrolled by admin" : "Self-enrolled"}</span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Enrolled</span>
                    <span className="font-medium">{new Date(liveDetailEntry.enrolledAt).toLocaleDateString()}</span>
                  </p>
                  {liveDetailEntry.completedAt ? (
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium">{new Date(liveDetailEntry.completedAt).toLocaleDateString()}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
