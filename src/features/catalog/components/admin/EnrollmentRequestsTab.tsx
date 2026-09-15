"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, Copy, Loader2, RotateCcw, UserCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterPills, type FilterPillOption } from "@/components/ui/filter-pills";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OffsetPagination } from "@/components/ui/offset-pagination";
import { Select } from "@/components/ui/select";
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
import { formatLKR } from "@/lib/utils";
import { ENROLLMENT_REQUEST_STATUS_STYLES } from "@/lib/statusColors";
import {
  useEnrollFromRequestMutation,
  useGetIntakeEnrollmentRequestsQuery,
  useUpdateEnrollmentRequestStatusMutation,
} from "@/features/enrollments/enrollmentRequestsApi";
import type {
  EnrollmentRequest,
  EnrollmentRequestStatus,
  EnrollmentRequestSummary,
} from "@/features/enrollments/enrollmentRequestsTypes";
import type { PaymentStatus } from "@/features/enrollments/enrollmentsTypes";

type PaidStatus = Exclude<PaymentStatus, "NOT_REQUIRED">;

const STATUS_PILLS: { key: EnrollmentRequestStatus | ""; label: string; countKey: keyof EnrollmentRequestSummary }[] = [
  { key: "", label: "All", countKey: "all" },
  { key: "PENDING", label: "Pending", countKey: "PENDING" },
  { key: "CONTACTED", label: "Contacted", countKey: "CONTACTED" },
  { key: "ENROLLED", label: "Enrolled", countKey: "ENROLLED" },
  { key: "DECLINED", label: "Declined", countKey: "DECLINED" },
];
const PILL_ACTIVE_CLASS: Record<EnrollmentRequestStatus | "", string> = {
  "": "border-primary bg-primary/10 text-primary",
  PENDING: ENROLLMENT_REQUEST_STATUS_STYLES.PENDING,
  CONTACTED: ENROLLMENT_REQUEST_STATUS_STYLES.CONTACTED,
  ENROLLED: ENROLLMENT_REQUEST_STATUS_STYLES.ENROLLED,
  DECLINED: ENROLLMENT_REQUEST_STATUS_STYLES.DECLINED,
};

const DEFAULT_PAGE_SIZE = 20;
const FILTER_DEBOUNCE_MS = 300;
const MIN_FILTER_LENGTH = 3;
const INTERACTIVE_SELECTOR = "input,button,a,[role=menuitem],[data-no-row-navigation]";

/**
 * The missing link between a PAID course's public "Enroll" button and the
 * admin-mediated payment process — see the 2026-08-30 rename plan §8a.
 * Request → admin contacts the student → admin converts it into a real
 * Enrollment + Payment through the same enroll mutation the direct
 * search-and-enroll flow (the Enrollments tab) uses.
 */
export function EnrollmentRequestsTab({
  intakeId,
  coursePrice,
  discountAmount,
  initialRequestId,
}: {
  intakeId: string;
  coursePrice: number;
  discountAmount: number;
  initialRequestId?: string;
}) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnrollmentRequestStatus | "">("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);

  const debouncedQ = useDebouncedValue(q.trim(), FILTER_DEBOUNCE_MS);
  const appliedQ = debouncedQ.length === 0 || debouncedQ.length >= MIN_FILTER_LENGTH ? debouncedQ : "";

  const { data, isLoading, isFetching } = useGetIntakeEnrollmentRequestsQuery({
    intakeId,
    q: appliedQ || undefined,
    status: statusFilter || undefined,
    limit: pageSize,
    offset,
  });
  const requests = data?.requests ?? [];

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateEnrollmentRequestStatusMutation();
  const [enrollFromRequest, { isLoading: isEnrolling }] = useEnrollFromRequestMutation();

  const [detailRequest, setDetailRequest] = useState<EnrollmentRequest | null>(
    () => (initialRequestId ? requests.find((request) => request.id === initialRequestId) ?? null : null),
  );
  const [enrollTarget, setEnrollTarget] = useState<EnrollmentRequest | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaidStatus>("COMPLETED");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const fullAmount = coursePrice - discountAmount;
  const halfAmount = coursePrice / 2;
  const paymentOptionLabels: Record<PaidStatus, string> = {
    COMPLETED:
      discountAmount > 0
        ? `Full payment — ${formatLKR(fullAmount)} (${formatLKR(discountAmount)} discount applied)`
        : `Full payment — ${formatLKR(fullAmount)}`,
    PARTIAL: `Partial — ${formatLKR(halfAmount)} now, ${formatLKR(halfAmount)} later`,
  };
  const paymentOptions = Object.values(paymentOptionLabels);
  const labelToStatus = (label: string): PaidStatus => (label === paymentOptionLabels.PARTIAL ? "PARTIAL" : "COMPLETED");

  const markContacted = async (request: EnrollmentRequest) => {
    try {
      await updateStatus({ id: request.id, status: "CONTACTED" }).unwrap();
      toast.success("Marked as contacted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update the request"));
    }
  };

  const decline = async (request: EnrollmentRequest) => {
    try {
      await updateStatus({ id: request.id, status: "DECLINED" }).unwrap();
      toast.success("Request declined");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update the request"));
    }
  };

  // Reopens a Declined request back to Pending instead of forcing the
  // student to resubmit — keeps their original contactPhone and history.
  const reopen = async (request: EnrollmentRequest) => {
    try {
      await updateStatus({ id: request.id, status: "PENDING" }).unwrap();
      toast.success("Request reopened");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not reopen the request"));
    }
  };

  const openEnroll = (request: EnrollmentRequest) => {
    setPaymentStatus("COMPLETED");
    setReference("");
    setNote("");
    setEnrollTarget(request);
  };

  const confirmEnroll = async () => {
    if (!enrollTarget) return;
    try {
      await enrollFromRequest({
        id: enrollTarget.id,
        body: {
          paymentStatus,
          externalPaymentReference: reference.trim() || null,
          paymentNote: note.trim() || null,
        },
      }).unwrap();
      toast.success("Student enrolled from this request");
      setEnrollTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not enroll from this request"));
    }
  };

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success("Phone number copied");
    } catch {
      toast.error("Could not copy phone number");
    }
  };

  const pillOptions: FilterPillOption<EnrollmentRequestStatus | "">[] = STATUS_PILLS.map(({ key, label, countKey }) => ({
    key,
    label,
    count: data?.summary?.[countKey] ?? 0,
    activeClassName: PILL_ACTIVE_CLASS[key],
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Search requests by student name or email"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setOffset(0);
          }}
          placeholder="Search name or email"
          className="h-9 w-56 shrink-0"
        />
        <FilterPills
          ariaLabel="Filter by request status"
          options={pillOptions}
          active={statusFilter}
          onChange={(key) => {
            setStatusFilter(key);
            setOffset(0);
          }}
        />
      </div>

      <div className="overflow-hidden rounded-md border bg-card" aria-busy={isLoading || isFetching}>
        <Table className="table-fixed">
          <TableCaption className="sr-only">Enrollment requests submitted for this intake</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="px-4">Student</TableHead>
              <TableHead className="w-40">Phone</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-28">Requested</TableHead>
              <TableHead className="w-28 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  <span role="status" aria-live="polite">Loading requests…</span>
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 whitespace-normal text-center text-muted-foreground">
                  {q || statusFilter ? "No requests match your filters." : "No enrollment requests for this intake yet."}
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow
                  key={request.id}
                  tabIndex={0}
                  aria-label={`View details for ${request.student?.firstName} ${request.student?.lastName}`}
                  className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  onClick={(event) => {
                    if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
                    setDetailRequest(request);
                  }}
                  onKeyDown={(event) => {
                    if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setDetailRequest(request);
                    }
                  }}
                >
                  <TableCell className="max-w-0 px-4 py-4">
                    <p className="truncate font-semibold" title={`${request.student?.firstName} ${request.student?.lastName}`}>
                      {request.student?.firstName} {request.student?.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground" title={request.student?.email}>
                      {request.student?.email}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{request.contactPhone}</span>
                      <Button
                        aria-label="Copy phone number"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        onClick={() => copyPhone(request.contactPhone)}
                      >
                        <Copy className="size-3" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ENROLLMENT_REQUEST_STATUS_STYLES[request.status]}>
                      {request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(request.createdAt), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="pr-4 text-right" data-no-row-navigation>
                    <div className="flex items-center justify-end gap-2">
                      {request.status === "PENDING" ? (
                        <Button
                          aria-label="Mark as contacted"
                          variant="ghost"
                          size="icon"
                          disabled={isUpdatingStatus}
                          onClick={() => markContacted(request)}
                        >
                          <Check className="size-4 text-sky-600" aria-hidden="true" />
                        </Button>
                      ) : null}
                      {["PENDING", "CONTACTED"].includes(request.status) ? (
                        <>
                          <Button
                            aria-label="Enroll this student"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEnroll(request)}
                          >
                            <UserCheck className="size-4 text-emerald-600" aria-hidden="true" />
                          </Button>
                          <Button
                            aria-label="Decline this request"
                            variant="ghost"
                            size="icon"
                            disabled={isUpdatingStatus}
                            onClick={() => decline(request)}
                          >
                            <XCircle className="size-4 text-destructive" aria-hidden="true" />
                          </Button>
                        </>
                      ) : null}
                      {request.status === "DECLINED" ? (
                        <Button
                          aria-label="Reopen this request"
                          variant="ghost"
                          size="icon"
                          disabled={isUpdatingStatus}
                          onClick={() => reopen(request)}
                        >
                          <RotateCcw className="size-4 text-sky-600" aria-hidden="true" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.pagination.total > 0 ? (
        <OffsetPagination
          id="enrollment-requests-page-size"
          total={data.pagination.total}
          offset={offset}
          pageSize={pageSize}
          shownCount={requests.length}
          hasMore={data.pagination.hasMore}
          onOffsetChange={setOffset}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setOffset(0);
          }}
        />
      ) : null}

      <Dialog open={Boolean(enrollTarget)} onOpenChange={(open) => !open && setEnrollTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll {enrollTarget?.student?.firstName} {enrollTarget?.student?.lastName}?</DialogTitle>
            <DialogDescription>
              Record their payment. This goes through the same enroll flow as the Enrollments tab and converts this request permanently.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request-payment-status">Payment</Label>
              <Select
                id="request-payment-status"
                className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
                options={paymentOptions}
                value={paymentOptionLabels[paymentStatus]}
                onChange={(label) => setPaymentStatus(labelToStatus(label))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-payment-reference">External payment reference</Label>
              <Input id="request-payment-reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Receipt or transfer reference" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-payment-note">Internal payment note</Label>
              <textarea id="request-payment-note" className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEnrollTarget(null)}>Cancel</Button>
            <Button type="button" disabled={isEnrolling} onClick={confirmEnroll}>
              {isEnrolling ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              Enroll student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={Boolean(detailRequest)} onOpenChange={(open) => !open && setDetailRequest(null)}>
        <SheetContent className="flex flex-col sm:max-w-lg">
          {detailRequest ? (
            <>
              <SheetHeader>
                <SheetTitle>
                  {detailRequest.student?.firstName} {detailRequest.student?.lastName}
                </SheetTitle>
                <SheetDescription>{detailRequest.student?.email}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-5 overflow-y-auto px-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={ENROLLMENT_REQUEST_STATUS_STYLES[detailRequest.status]}>
                    {detailRequest.status.charAt(0) + detailRequest.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-mono font-medium">{detailRequest.contactPhone}</span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Requested</span>
                    <span className="font-medium">{new Date(detailRequest.createdAt).toLocaleDateString()}</span>
                  </p>
                  {detailRequest.contactedAt ? (
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Contacted</span>
                      <span className="font-medium">{new Date(detailRequest.contactedAt).toLocaleDateString()}</span>
                    </p>
                  ) : null}
                  {detailRequest.contactedBy ? (
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Contacted by</span>
                      <span className="font-medium">{detailRequest.contactedBy.firstName} {detailRequest.contactedBy.lastName}</span>
                    </p>
                  ) : null}
                </div>
                {["PENDING", "CONTACTED"].includes(detailRequest.status) ? (
                  <div className="flex flex-wrap gap-2">
                    {detailRequest.status === "PENDING" ? (
                      <Button size="sm" variant="outline" onClick={() => markContacted(detailRequest)} disabled={isUpdatingStatus}>
                        <Check className="mr-2 size-4" aria-hidden="true" /> Mark contacted
                      </Button>
                    ) : null}
                    <Button size="sm" onClick={() => openEnroll(detailRequest)}>
                      <UserCheck className="mr-2 size-4" aria-hidden="true" /> Enroll
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decline(detailRequest)} disabled={isUpdatingStatus}>
                      <XCircle className="mr-2 size-4" aria-hidden="true" /> Decline
                    </Button>
                  </div>
                ) : detailRequest.status === "DECLINED" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => reopen(detailRequest)} disabled={isUpdatingStatus}>
                      <RotateCcw className="mr-2 size-4" aria-hidden="true" /> Reopen
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
