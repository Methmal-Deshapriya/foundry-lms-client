"use client";

import { useState } from "react";
import { format } from "date-fns";
import { dayOf, dayToInstant } from "@/lib/dates";
import { Download, ExternalLink, FileImage, Loader2, RotateCcw, Undo2 } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ObjectUploadField } from "@/features/storage/components/ObjectUploadField";
import { getApiErrorMessage } from "@/lib/api";
import { cn, formatLKR } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, PAYMENT_TYPE_LABELS, PAYMENT_TYPE_STYLES } from "../paymentLabels";
import { useGetPaymentQuery, useRefundPaymentMutation, useReversePaymentMutation, useUpdatePaymentDetailsMutation } from "../paymentsApi";
import type { PaymentDetail, PaymentMethod } from "../paymentsTypes";
import { downloadReceiptPdf } from "../receiptPdf";

const NO_METHOD = "Not recorded";
const METHOD_OPTIONS = [NO_METHOD, ...PAYMENT_METHODS.map((method) => PAYMENT_METHOD_LABELS[method])];
const methodFromLabel = (label: string) => PAYMENT_METHODS.find((method) => PAYMENT_METHOD_LABELS[method] === label) ?? null;
const BLACK_BUTTON = "bg-[#191919] bg-none text-white hover:bg-[#27272A]";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function RefundDialog({ payment, open, onOpenChange }: { payment: PaymentDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const alreadyRefunded = payment.corrections.filter((entry) => entry.type === "REFUND").reduce((sum, entry) => sum - entry.amount, 0);
  const refundable = Math.max(0, payment.amount - alreadyRefunded);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<string>(NO_METHOD);
  const [paidAt, setPaidAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [refund, { isLoading }] = useRefundPaymentMutation();

  const submit = async () => {
    try {
      await refund({ id: payment.id, amount: Number(amount), reason: reason.trim(), method: methodFromLabel(method), paidAt: dayToInstant(paidAt) }).unwrap();
      toast.success("Refund recorded.");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The refund could not be recorded."));
    }
  };
  const amountNumber = Number(amount);
  const valid = amountNumber > 0 && amountNumber <= refundable && reason.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund {payment.receiptNumber}</DialogTitle>
          <DialogDescription>
            Records money you&apos;ve already given back to {payment.student?.name ?? "the student"}. The original payment stays as it is; this adds a refund
            entry. Cancel the enrollment separately if the student is leaving.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refund-amount">
              Amount (up to {formatLKR(refundable)}) <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input id="refund-amount" type="number" min={1} max={refundable} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-reason">
              Reason <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input id="refund-reason" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Student withdrew in week 1" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="refund-method">Refunded by</Label>
              <Select id="refund-method" accent="black" value={method} onChange={setMethod} options={METHOD_OPTIONS} className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-date">Refund date</Label>
              <DatePicker id="refund-date" value={paidAt} onChange={setPaidAt} className="h-10 rounded-md" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!valid || isLoading} onClick={submit} className="bg-linear-to-r from-red-600 to-rose-500 text-white">
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
            Record refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReverseDialog({ payment, open, onOpenChange }: { payment: PaymentDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [reason, setReason] = useState("");
  const [reverse, { isLoading }] = useReversePaymentMutation();
  const submit = async () => {
    try {
      await reverse({ id: payment.id, reason: reason.trim() }).unwrap();
      toast.success("Entry reversed.");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The entry could not be reversed."));
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reverse {payment.receiptNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            Use this only for an entry recorded by mistake. It adds an equal and opposite entry ({formatLKR(-payment.amount)}) — nothing is deleted.
            {payment.type === "TOP_UP" ? " The enrollment goes back to “partially paid”." : " The enrollment must already be cancelled."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reverse-reason">
            What was the mistake? <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Input id="reverse-reason" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Recorded for the wrong student" />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={reason.trim().length < 3 || isLoading}
            onClick={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="bg-linear-to-r from-red-600 to-rose-500 text-white"
          >
            Reverse entry
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Full detail of one ledger entry — super admins only. */
export function PaymentDetailSheet({ paymentId, canManage, onOpenChange }: { paymentId: string | null; canManage: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: payment, isLoading } = useGetPaymentQuery(paymentId ?? "", { skip: !paymentId });
  const [updateDetails, { isLoading: isSaving }] = useUpdatePaymentDetailsMutation();
  const [refundOpen, setRefundOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);

  const isIncoming = payment ? ["FULL", "PARTIAL", "TOP_UP"].includes(payment.type) : false;
  const isReversed = payment?.corrections.some((entry) => entry.type === "REVERSAL") ?? false;
  const hasRefunds = payment?.corrections.some((entry) => entry.type === "REFUND") ?? false;

  const save = async (patch: { method?: PaymentMethod | null; paidAt?: string; externalReference?: string | null; proofObjectId?: string | null }) => {
    if (!payment) return;
    try {
      await updateDetails({ id: payment.id, ...patch }).unwrap();
      toast.success("Payment details saved.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The details could not be saved."));
    }
  };

  return (
    <Sheet open={Boolean(paymentId)} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        {isLoading || !payment ? (
          <div className="space-y-4 p-6" aria-hidden="true">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {payment.receiptNumber}
                <Badge variant="outline" className={cn("font-medium", PAYMENT_TYPE_STYLES[payment.type])}>
                  {PAYMENT_TYPE_LABELS[payment.type]}
                </Badge>
                {isReversed ? <Badge variant="outline">Reversed</Badge> : null}
              </SheetTitle>
              <SheetDescription>
                {payment.student?.name} · {payment.course.title} · {payment.intake.code}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 px-4 pb-6">
              <p className={cn("text-3xl font-bold tabular-nums", payment.amount < 0 ? "text-red-600" : "text-foreground")}>{formatLKR(payment.amount)}</p>

              <div className="grid grid-cols-2 gap-4">
                <Fact label="Student">
                  {payment.student?.name}
                  <span className="block truncate text-xs text-muted-foreground">{payment.student?.email}</span>
                </Fact>
                <Fact label="Service">{payment.course.service.title}</Fact>
                <Fact label="Discount">{payment.discountAmount > 0 ? formatLKR(payment.discountAmount) : "—"}</Fact>
                <Fact label="Recorded">
                  {format(new Date(payment.recordedAt), "MMM d, yyyy")}
                  <span className="block text-xs text-muted-foreground">by {payment.recordedBy ?? "—"}</span>
                </Fact>
                {payment.note ? (
                  <div className="col-span-2">
                    <Fact label={payment.type === "REFUND" || payment.type === "REVERSAL" ? "Reason" : "Note"}>{payment.note}</Fact>
                  </div>
                ) : null}
                {payment.corrects ? (
                  <div className="col-span-2">
                    <Fact label="Corrects">
                      {payment.corrects.receiptNumber} · {PAYMENT_TYPE_LABELS[payment.corrects.type]} · {formatLKR(payment.corrects.amount)}
                    </Fact>
                  </div>
                ) : null}
              </div>

              {payment.corrections.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Corrections</p>
                  <ul className="divide-y divide-border rounded-md border border-border">
                    {payment.corrections.map((entry) => (
                      <li key={entry.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <span>
                          {PAYMENT_TYPE_LABELS[entry.type]} · {entry.receiptNumber}
                          {entry.note ? <span className="block text-xs text-muted-foreground">{entry.note}</span> : null}
                        </span>
                        <span className="shrink-0 font-medium tabular-nums text-red-600">{formatLKR(entry.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Descriptive details — the only part of an entry that can change. */}
              <div className="space-y-4 rounded-lg border border-border p-4">
                <p className="text-sm font-semibold text-foreground">Payment details</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="payment-method">Method</Label>
                    <Select
                      id="payment-method"
                      accent="black"
                      disabled={!canManage || isSaving}
                      value={payment.method ? PAYMENT_METHOD_LABELS[payment.method] : NO_METHOD}
                      onChange={(label) => void save({ method: methodFromLabel(label) })}
                      options={METHOD_OPTIONS}
                      className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-date">Date received</Label>
                    <DatePicker
                      id="payment-date"
                      disabled={!canManage || isSaving}
                      value={dayOf(payment.paidAt)}
                      onChange={(value) => value && value !== dayOf(payment.paidAt) && void save({ paidAt: dayToInstant(value) })}
                      className="h-10 rounded-md"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-reference">Bank / transfer reference</Label>
                  <Input
                    id="payment-reference"
                    key={payment.externalReference ?? ""}
                    defaultValue={payment.externalReference ?? ""}
                    disabled={!canManage || isSaving}
                    maxLength={160}
                    placeholder="e.g. BOC-20261001-4471"
                    onBlur={(event) => {
                      const next = event.target.value.trim() || null;
                      if (next !== (payment.externalReference ?? null)) void save({ externalReference: next });
                    }}
                  />
                </div>
                {canManage ? (
                  <ObjectUploadField
                    label="Proof of payment"
                    purpose="PAYMENT_PROOF"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    value={payment.proof?.id ?? null}
                    initialObject={
                      payment.proof
                        ? { id: payment.proof.id, purpose: "PAYMENT_PROOF", scope: "PRIVATE", status: "READY", fileName: payment.proof.fileName, contentType: payment.proof.contentType, sizeBytes: payment.proof.sizeBytes, publicUrl: null, readyAt: null, createdAt: payment.recordedAt }
                        : null
                    }
                    disabled={isSaving}
                    helpText="A photo of the bank slip or a receipt (JPG, PNG, WebP or PDF, up to 5 MB). Private — only super admins can open it."
                    onChange={(id) => void save({ proofObjectId: id })}
                  />
                ) : null}
                {payment.proof?.url ? (
                  <a href={payment.proof.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline-offset-2 hover:underline">
                    <FileImage className="size-4" aria-hidden="true" />
                    Open proof
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" className={BLACK_BUTTON} onClick={() => void downloadReceiptPdf(payment)}>
                  <Download className="size-4" aria-hidden="true" />
                  {payment.amount < 0 ? "Download credit note" : "Download receipt"}
                </Button>
                {canManage && isIncoming && !isReversed ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => setRefundOpen(true)}>
                      <Undo2 className="size-4" aria-hidden="true" />
                      Refund
                    </Button>
                    {!hasRefunds ? (
                      <Button type="button" variant="outline" onClick={() => setReverseOpen(true)}>
                        <RotateCcw className="size-4" aria-hidden="true" />
                        Reverse
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            <RefundDialog payment={payment} open={refundOpen} onOpenChange={setRefundOpen} />
            <ReverseDialog payment={payment} open={reverseOpen} onOpenChange={setReverseOpen} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
