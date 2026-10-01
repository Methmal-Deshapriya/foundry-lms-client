import type { PaymentMethod, PaymentType } from "./paymentsTypes";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  ONLINE: "Online",
  OTHER: "Other",
};
export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  FULL: "Full payment",
  PARTIAL: "Half payment",
  TOP_UP: "Remaining half",
  REFUND: "Refund",
  REVERSAL: "Reversal",
};

export const PAYMENT_TYPE_STYLES: Record<PaymentType, string> = {
  FULL: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PARTIAL: "border-amber-200 bg-amber-50 text-amber-700",
  TOP_UP: "border-sky-200 bg-sky-50 text-sky-700",
  REFUND: "border-red-200 bg-red-50 text-red-700",
  REVERSAL: "border-zinc-300 bg-zinc-100 text-zinc-700",
};

/** Sri Lankan local numbers (07XXXXXXXX) → the international form wa.me needs (947XXXXXXXX). */
export function toWhatsAppNumber(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (/^0\d{9}$/.test(digits)) return `94${digits.slice(1)}`;
  if (/^94\d{9}$/.test(digits)) return digits;
  return null;
}
