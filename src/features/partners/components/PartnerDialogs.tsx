"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useGetIntakesQuery } from "@/features/catalog/catalogApi";
import { PaymentMethodSelect } from "@/features/payments/components/PaymentMethodSelect";
import type { PaymentMethod } from "@/features/payments/paymentsTypes";
import { ObjectUploadField } from "@/features/storage/components/ObjectUploadField";
import { getApiErrorMessage, isNormalizedApiError } from "@/lib/api";
import { formatLKR } from "@/lib/utils";
import { useCreateExpenseMutation, useCreatePayoutMutation, useCreateShareSetMutation } from "../partnersApi";
import type { ExpenseCategory, Partner } from "../partnersTypes";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ADVERTISING: "Advertising",
  INSTRUCTOR_FEES: "Instructor fees",
  SOFTWARE_HOSTING: "Software & hosting",
  VENUE: "Venue",
  EQUIPMENT: "Equipment",
  TRANSPORT: "Transport",
  OTHER: "Other",
};
const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];
const BLACK = "bg-[#191919] bg-none text-white hover:bg-[#27272A]";
const FIELD = "h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm";
const today = () => format(new Date(), "yyyy-MM-dd");

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  ) : null;
}

// ------------------------------------------------------------------ expense
const GENERAL = "General (not for one intake)";
const BUSINESS = "Business account";

export function AddExpenseDialog({ open, onOpenChange, partners }: { open: boolean; onOpenChange: (open: boolean) => void; partners: Partner[] }) {
  const [spentAt, setSpentAt] = useState(today());
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("ADVERTISING");
  const [description, setDescription] = useState("");
  const [intakeLabel, setIntakeLabel] = useState(GENERAL);
  const [paidByLabel, setPaidByLabel] = useState(BUSINESS);
  const [receiptObjectId, setReceiptObjectId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: intakes } = useGetIntakesQuery(undefined, { skip: !open });
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const intakeList = intakes?.intakes ?? [];
  const intakeOptions = [GENERAL, ...intakeList.map((intake) => `${intake.code} — ${intake.course?.title ?? ""}`)];
  const paidByOptions = [BUSINESS, ...partners.map((partner) => `${partner.name} (own money)`)];

  const reset = () => {
    setSpentAt(today());
    setAmount("");
    setCategory("ADVERTISING");
    setDescription("");
    setIntakeLabel(GENERAL);
    setPaidByLabel(BUSINESS);
    setReceiptObjectId(null);
    setErrors({});
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!(Number(amount) > 0)) next.amount = "Enter the amount.";
    if (category === "OTHER" && description.trim().length < 3) next.description = "Describe what this expense was.";
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      await createExpense({
        spentAt: new Date(`${spentAt}T12:00:00`).toISOString(),
        amount: Number(amount),
        category,
        description: description.trim() || null,
        intakeId: intakeLabel === GENERAL ? null : intakeList[intakeOptions.indexOf(intakeLabel) - 1]?.id ?? null,
        paidByPartnerId: paidByLabel === BUSINESS ? null : partners[paidByOptions.indexOf(paidByLabel) - 1]?.id ?? null,
        receiptObjectId,
      }).unwrap();
      toast.success("Expense recorded.");
      reset();
      onOpenChange(false);
    } catch (error) {
      if (isNormalizedApiError(error) && error.field) setErrors({ [error.field]: error.message });
      else toast.error(getApiErrorMessage(error, "The expense could not be recorded."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an expense</DialogTitle>
          <DialogDescription>It&apos;s split between the partners by their shares on the expense date. Expenses can&apos;t be edited later — only reversed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">
                Amount (LKR) <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Input id="expense-amount" type="number" min={1} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
              <FieldError message={errors.amount} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Date spent</Label>
              <DatePicker id="expense-date" value={spentAt} onChange={(value) => setSpentAt(value || today())} className="h-10 rounded-md" />
              <FieldError message={errors.spentAt} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-category">Category</Label>
            <Select
              id="expense-category"
              accent="black"
              value={EXPENSE_CATEGORY_LABELS[category]}
              options={CATEGORIES.map((item) => EXPENSE_CATEGORY_LABELS[item])}
              onChange={(label) => setCategory(CATEGORIES.find((item) => EXPENSE_CATEGORY_LABELS[item] === label) ?? "OTHER")}
              className={FIELD}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-description">
              Description {category === "OTHER" ? <span className="text-red-500" aria-hidden="true">*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
            </Label>
            <Input
              id="expense-description"
              maxLength={500}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={category === "OTHER" ? "What was this expense for?" : "e.g. Facebook ads for the October intake"}
            />
            <FieldError message={errors.description} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense-intake">For which intake?</Label>
              <Select id="expense-intake" accent="black" value={intakeLabel} options={intakeOptions} onChange={setIntakeLabel} className={FIELD} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-paid-by">Paid from</Label>
              <Select id="expense-paid-by" accent="black" value={paidByLabel} options={paidByOptions} onChange={setPaidByLabel} className={FIELD} />
            </div>
          </div>
          {paidByLabel !== BUSINESS ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Paid from a partner&apos;s own money: everyone still shares the cost, and that partner is owed the full amount back.
            </p>
          ) : null}
          <ObjectUploadField
            label="Receipt (optional)"
            purpose="EXPENSE_RECEIPT"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            value={receiptObjectId}
            helpText="A photo or PDF of the bill, up to 5 MB. Private."
            onChange={(id) => setReceiptObjectId(id)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isLoading} onClick={() => void submit()} className={BLACK}>
            {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Record expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------- payout
export function AddPayoutDialog({
  open,
  onOpenChange,
  partners,
  owedByPartner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners: Partner[];
  owedByPartner: Map<string, number>;
}) {
  const [partnerLabel, setPartnerLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(today());
  const [method, setMethod] = useState<PaymentMethod | null>("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createPayout, { isLoading }] = useCreatePayoutMutation();
  const partner = partners.find((item) => item.name === partnerLabel);
  const owed = partner ? owedByPartner.get(partner.id) : undefined;

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!partner) next.partnerId = "Choose the partner.";
    if (!(Number(amount) > 0)) next.amount = "Enter the amount paid out.";
    setErrors(next);
    if (Object.keys(next).length || !partner) return;
    try {
      await createPayout({
        partnerId: partner.id,
        amount: Number(amount),
        paidAt: new Date(`${paidAt}T12:00:00`).toISOString(),
        method,
        reference: reference.trim() || null,
        note: note.trim() || null,
      }).unwrap();
      toast.success(`Payout to ${partner.name} recorded.`);
      setAmount("");
      setReference("");
      setNote("");
      onOpenChange(false);
    } catch (error) {
      if (isNormalizedApiError(error) && error.field) setErrors({ [error.field]: error.message });
      else toast.error(getApiErrorMessage(error, "The payout could not be recorded."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payout</DialogTitle>
          <DialogDescription>Money actually transferred to a partner. It reduces what they&apos;re still owed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payout-partner">
              Partner <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Select id="payout-partner" accent="black" placeholder="Choose a partner" value={partnerLabel} options={partners.map((item) => item.name)} onChange={setPartnerLabel} className={FIELD} />
            {owed !== undefined ? <p className="text-xs text-muted-foreground">Currently owed: {formatLKR(owed)}</p> : null}
            <FieldError message={errors.partnerId} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payout-amount">
                Amount (LKR) <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Input id="payout-amount" type="number" min={1} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
              <FieldError message={errors.amount} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-date">Date paid</Label>
              <DatePicker id="payout-date" value={paidAt} onChange={(value) => setPaidAt(value || today())} className="h-10 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payout-method">Paid by</Label>
              <PaymentMethodSelect id="payout-method" value={method} onChange={setMethod} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-reference">Reference</Label>
              <Input id="payout-reference" maxLength={160} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Transfer reference" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payout-note">Note (optional)</Label>
            <Input id="payout-note" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isLoading} onClick={() => void submit()} className={BLACK}>
            {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Record payout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------------------- split
export function NewSplitDialog({
  open,
  onOpenChange,
  partners,
  current,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners: Partner[];
  current: Map<string, number>;
}) {
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [note, setNote] = useState("");
  const [percents, setPercents] = useState<Record<string, string>>({});
  const [createShareSet, { isLoading }] = useCreateShareSetMutation();
  const value = (partnerId: string) => percents[partnerId] ?? String(current.get(partnerId) ?? 0);
  const total = partners.reduce((sum, partner) => sum + (Number(value(partner.id)) || 0), 0);
  const valid = Math.round(total * 100) === 10000;

  const submit = async () => {
    try {
      await createShareSet({
        effectiveFrom: new Date(`${effectiveFrom}T00:00:00`).toISOString(),
        note: note.trim() || null,
        entries: partners.map((partner) => ({ partnerId: partner.id, percent: Number(value(partner.id)) || 0 })),
      }).unwrap();
      toast.success("New split saved. Past figures are unchanged.");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The new split could not be saved."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change the split</DialogTitle>
          <DialogDescription>Applies to payments and expenses from the start date onwards. Everything before it keeps the old split.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="split-from">Starts on</Label>
            <DatePicker id="split-from" value={effectiveFrom} onChange={(next) => setEffectiveFrom(next || today())} className="h-10 rounded-md" />
          </div>
          <div className="space-y-2">
            {partners.map((partner) => (
              <div key={partner.id} className="flex items-center justify-between gap-3">
                <Label htmlFor={`split-${partner.id}`} className="font-normal">
                  {partner.name}
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id={`split-${partner.id}`}
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={value(partner.id)}
                    onChange={(event) => setPercents({ ...percents, [partner.id]: event.target.value })}
                    className="h-9 w-24 text-right"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ))}
            <p className={valid ? "text-right text-xs text-muted-foreground" : "text-right text-xs font-medium text-destructive"}>
              Total {total.toFixed(2)}% {valid ? "" : "— must be exactly 100%"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="split-note">Note (optional)</Label>
            <Input id="split-note" maxLength={200} value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. New partner agreement" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!valid || isLoading} onClick={() => void submit()} className={BLACK}>
            {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Save new split
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------ reverse
export function ReverseEntryDialog({
  title,
  description,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reverse-reason">
            What was the mistake? <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Input id="reverse-reason" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={reason.trim().length < 3 || isLoading}
            onClick={() => void onConfirm(reason.trim()).then(() => setReason(""))}
            className="bg-linear-to-r from-red-600 to-rose-500 text-white"
          >
            Reverse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
