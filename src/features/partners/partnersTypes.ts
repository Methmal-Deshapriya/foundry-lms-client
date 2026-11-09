import type { PaymentMethod } from "@/features/payments/paymentsTypes";

export type ExpenseCategory = "ADVERTISING" | "INSTRUCTOR_FEES" | "SOFTWARE_HOSTING" | "VENUE" | "EQUIPMENT" | "TRANSPORT" | "OTHER";
export type EntryKind = "ENTRY" | "REVERSAL";

export interface Partner {
  id: string;
  name: string;
  displayOrder: number;
}

export interface PartnerTotals {
  partnerId: string;
  name: string;
  revenueShare: number;
  expenseShare: number;
  /** Out-of-pocket expenses this partner paid, owed back to them in full. */
  reimbursed: number;
  earned: number;
  paidOut: number;
  owed: number;
}

export interface EarningsOverview {
  range: { from?: string; to?: string };
  partners: PartnerTotals[];
  totals: { revenue: number; expenses: number; profit: number; paidOut: number; cashOnHand: number; balanced: boolean };
}

export interface IntakeEarningsRow {
  intakeId: string | null;
  intakeCode: string | null;
  courseTitle: string;
  revenue: number;
  expenses: number;
  profit: number;
  shares: { partnerId: string; amount: number }[];
}

export interface ShareSet {
  id: string;
  effectiveFrom: string;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  entries: { partnerId: string; name: string; percent: number }[];
}

export interface Expense {
  id: string;
  spentAt: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string | null;
  intake: { id: string; code: string; courseTitle: string } | null;
  paidBy: { id: string; name: string } | null;
  kind: EntryKind;
  reversed: boolean;
  corrects: { id: string; amount: number; category: ExpenseCategory; spentAt: string } | null;
  hasReceipt: boolean;
  recordedBy: string | null;
  recordedAt: string;
  receipt?: { fileName: string; contentType: string; url: string | null } | null;
}

export interface Payout {
  id: string;
  partner: { id: string; name: string };
  amount: number;
  currency: string;
  paidAt: string;
  method: PaymentMethod | null;
  reference: string | null;
  note: string | null;
  kind: EntryKind;
  reversed: boolean;
  corrects: { id: string; amount: number; paidAt: string } | null;
  recordedBy: string | null;
  recordedAt: string;
}

export type Pagination = { total: number; limit: number; offset: number; hasMore: boolean };
