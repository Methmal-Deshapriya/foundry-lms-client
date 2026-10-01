"use client";

import { useDeferredValue, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChecklistSkeleton } from "@/components/ui/loading-skeletons";
import { Label } from "@/components/ui/label";
import { PaymentMethodSelect } from "@/features/payments/components/PaymentMethodSelect";
import type { PaymentMethod } from "@/features/payments/paymentsTypes";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api";
import { formatLKR } from "@/lib/utils";
import {
  useBulkCreateEnrollmentsMutation,
  useCreateEnrollmentMutation,
  useGetEligibleStudentsQuery,
} from "../enrollmentsApi";
import type { PaymentStatus } from "../enrollmentsTypes";

type PaidStatus = Exclude<PaymentStatus, "NOT_REQUIRED">;

export default function ManualEnrollmentForm({
  intakeId,
  coursePrice,
  discountAmount,
  onSuccess,
  onCancel,
}: {
  intakeId: string;
  /** Full course price, before any one-time-payment discount. */
  coursePrice: number;
  /** This course's flat discount for paying the full price in one go. */
  discountAmount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [cursor, setCursor] = useState<string>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Names of everyone ever selected (the search list pages, so a selected
  // student may no longer be on screen when results come back).
  const [knownNames, setKnownNames] = useState<Record<string, string>>({});
  // After a partial bulk enrollment: who failed and why (code review M05-07).
  const [failures, setFailures] = useState<{ userId: string; name: string; error: string }[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaidStatus>("COMPLETED");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const fullAmount = coursePrice - discountAmount;
  const halfAmount = coursePrice / 2;
  const paymentOptionLabels: Record<PaidStatus, string> = {
    COMPLETED: `Full payment — ${formatLKR(fullAmount)}`,
    PARTIAL: `Partial — ${formatLKR(halfAmount)} now, ${formatLKR(halfAmount)} later`,
  };
  const paymentOptions = Object.values(paymentOptionLabels);
  const labelToStatus = (label: string): PaidStatus =>
    label === paymentOptionLabels.PARTIAL ? "PARTIAL" : "COMPLETED";
  const { data, isFetching, isError, refetch } = useGetEligibleStudentsQuery({
    intakeId,
    q: deferredSearch || undefined,
    limit: 25,
    cursor,
  });
  const students = data?.students ?? [];
  const [createEnrollment, createState] = useCreateEnrollmentMutation();
  const [bulkCreate, bulkState] = useBulkCreateEnrollmentsMutation();

  const toggle = (id: string) => {
    const student = students.find((entry) => entry.id === id);
    if (student) {
      setKnownNames((current) => ({ ...current, [id]: `${student.firstName} ${student.lastName}`.trim() || student.email }));
    }
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((value) => value !== id);
      }
      if (current.length >= 100) {
        toast.error("Bulk enrollment supports up to 100 students at a time.");
        return current;
      }
      return [...current, id];
    });
  };

  const submit = async () => {
    if (selectedIds.length === 0) return;
    const payment = {
      paymentStatus,
      paymentMethod,
      externalPaymentReference: reference.trim() || null,
      paymentNote: note.trim() || null,
    };
    try {
      if (selectedIds.length === 1) {
        await createEnrollment({ intakeId, data: { userId: selectedIds[0], ...payment } }).unwrap();
        toast.success("Student enrolled in this intake");
      } else {
        const result = await bulkCreate({
          intakeId,
          students: selectedIds.map((userId) => ({ userId, ...payment })),
        }).unwrap();
        if (result.summary.failed) {
          // Keep the form open with only the students who failed still
          // selected, each listed with the reason.
          const failed = result.results.filter((row) => row.status === "FAILED");
          setFailures(failed.map((row) => ({ userId: row.userId, name: knownNames[row.userId] ?? row.userId, error: row.error ?? "Could not be enrolled." })));
          setSelectedIds(failed.map((row) => row.userId));
          toast.warning(`${result.summary.created} enrolled; ${result.summary.failed} could not be. See the list below.`);
          return;
        }
        toast.success(`${result.summary.created} students enrolled`);
      }
      setFailures([]);
      setSelectedIds([]);
      onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Enrollment failed"));
    }
  };

  const submitting = createState.isLoading || bulkState.isLoading;
  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          aria-label="Search eligible students"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setCursor(undefined);
          }}
          placeholder="Search name or email"
          className="pl-10"
        />
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
        {students.map((student) => (
          <label key={student.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-muted/60">
            <input
              type="checkbox"
              checked={selectedIds.includes(student.id)}
              disabled={!selectedIds.includes(student.id) && selectedIds.length >= 100}
              onChange={() => toggle(student.id)}
            />
            <span><span className="block text-sm font-semibold">{student.firstName} {student.lastName}</span><span className="block text-xs text-muted-foreground">{student.email}</span></span>
          </label>
        ))}
        {isFetching ? (
          <ChecklistSkeleton rows={students.length ? 2 : 4} label={students.length ? "Loading more…" : "Searching…"} />
        ) : null}
        {!isFetching && isError ? (
          <div className="space-y-2 p-4 text-center">
            <p className="text-sm text-destructive">Could not load eligible students.</p>
            <Button type="button" size="sm" variant="outline" onClick={refetch}>
              Retry
            </Button>
          </div>
        ) : null}
        {!isFetching && !isError && students.length === 0 ? <p className="p-4 text-center text-sm text-muted-foreground">No eligible verified students found.</p> : null}
        {!isFetching && !isError && data?.pagination.hasMore && data.pagination.nextCursor ? (
          <div className="flex justify-center p-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCursor(data.pagination.nextCursor ?? undefined)}
            >
              Load more students
            </Button>
          </div>
        ) : null}
      </div>
      {failures.length ? (
        <div role="alert" className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
          <p className="font-semibold text-red-900">Not enrolled ({failures.length})</p>
          <ul className="space-y-0.5 text-red-800">
            {failures.map((failure) => (
              <li key={failure.userId}>
                <span className="font-medium">{failure.name}</span>: {failure.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {selectedIds.length} selected · up to 100 students per enrollment request
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="enrollment-payment-status">Payment</Label>
          <Select
            accent="black"
            id="enrollment-payment-status"
            className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
            options={paymentOptions}
            value={paymentOptionLabels[paymentStatus]}
            onChange={(label) => setPaymentStatus(labelToStatus(label))}
          />
          {paymentStatus === "COMPLETED" && discountAmount > 0 ? (
            <p className="text-xs text-muted-foreground">
              Includes a {formatLKR(discountAmount)} discount for paying in full.
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="enrollment-payment-method">Paid by</Label>
          <PaymentMethodSelect id="enrollment-payment-method" value={paymentMethod} onChange={setPaymentMethod} />
        </div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="enrollment-payment-reference">External payment reference</Label><Input id="enrollment-payment-reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Receipt or transfer reference" /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="enrollment-payment-note">Internal payment note</Label><textarea id="enrollment-payment-note" className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm" value={note} onChange={(event) => setNote(event.target.value)} /></div>
      <div className="flex gap-2">
        <Button
          disabled={selectedIds.length === 0 || submitting}
          onClick={submit}
          className="bg-[#191919] bg-none hover:bg-[#27272A]"
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Enroll {selectedIds.length || "selected"} student{selectedIds.length === 1 ? "" : "s"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
