"use client";

import { Select } from "@/components/ui/select";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "../paymentLabels";
import type { PaymentMethod } from "../paymentsTypes";

const NOT_RECORDED = "Not recorded";
const OPTIONS = [NOT_RECORDED, ...PAYMENT_METHODS.map((method) => PAYMENT_METHOD_LABELS[method])];

/** "How was it paid?" — shared by every place an admin records a payment. */
export function PaymentMethodSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: PaymentMethod | null;
  onChange: (value: PaymentMethod | null) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      id={id}
      accent="black"
      disabled={disabled}
      className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
      options={OPTIONS}
      value={value ? PAYMENT_METHOD_LABELS[value] : NOT_RECORDED}
      onChange={(label) => onChange(PAYMENT_METHODS.find((method) => PAYMENT_METHOD_LABELS[method] === label) ?? null)}
    />
  );
}
