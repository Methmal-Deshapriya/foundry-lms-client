import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The system only ever prices in Sri Lankan Rupees — no multi-currency
// support exists anywhere, so this doesn't take a currency argument.
const lkrFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

export function formatLKR(amount: number) {
  return lkrFormatter.format(amount);
}

// Same currency, abbreviated ("LKR 200K", "LKR 1.5M") once the figure is big
// enough that the full grouped form gets hard to scan at a glance — dashboard
// aggregates (total/summary revenue) can run into the hundreds of thousands,
// while most other amounts in the app (a single course price, a payment row)
// stay small enough that showing the exact figure matters more than brevity,
// so this is opt-in per call site rather than a change to formatLKR itself.
const lkrCompactFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatLKRCompact(amount: number) {
  return Math.abs(amount) >= 100_000 ? lkrCompactFormatter.format(amount) : formatLKR(amount);
}
