export type PaymentType = "FULL" | "PARTIAL" | "TOP_UP" | "REFUND" | "REVERSAL";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "ONLINE" | "OTHER";

export interface PaymentEntrySummary {
  id: string;
  type: PaymentType;
  amount: number;
  receiptNumber: string;
  paidAt: string;
  note?: string | null;
}

export interface LedgerEntry {
  id: string;
  receiptNumber: string;
  type: PaymentType;
  method: PaymentMethod | null;
  /** Negative for REFUND / REVERSAL. */
  amount: number;
  discountAmount: number;
  currency: string;
  paidAt: string;
  recordedAt: string;
  externalReference: string | null;
  note: string | null;
  recordedBy: string | null;
  student: { id: string; name: string; email: string; phone: string | null } | null;
  enrollment: { id: string; status: string; paymentStatus: string };
  course: { id: string; title: string; price: number; service: { id: string; title: string } };
  intake: { id: string; code: string };
  hasProof: boolean;
  corrects: PaymentEntrySummary | null;
  corrections: PaymentEntrySummary[];
}

export interface PaymentDetail extends LedgerEntry {
  proof: { id: string; fileName: string; contentType: string; sizeBytes: number; url: string | null } | null;
}

export interface LedgerSummary {
  collected: number;
  refunded: number;
  reversed: number;
  net: number;
  outstanding: number;
  /** Entry counts for the type pills — every filter except the type itself. */
  counts: Record<"all" | PaymentType, number>;
}

export interface LedgerPage {
  entries: LedgerEntry[];
  /** null when requested with summary=false (CSV export). */
  summary: LedgerSummary | null;
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

export interface LedgerFilters {
  from?: string;
  to?: string;
  method?: PaymentMethod | "NONE";
  type?: PaymentType;
  q?: string;
  limit?: number;
  offset?: number;
  /** "false" skips the totals (used by the CSV export). */
  summary?: "true" | "false";
}

export interface OutstandingRow {
  enrollmentId: string;
  enrolledAt: string;
  daysOutstanding: number;
  student: { id: string; name: string; email: string; phone: string | null };
  course: { id: string; title: string; serviceSlug: string | null };
  intake: { id: string; code: string };
  currency: string;
  price: number;
  paid: number;
  owed: number;
}

export interface MonthlySummary {
  year: number;
  months: { month: number; collected: number; refunded: number; reversed: number; net: number; entries: number }[];
  totals: { collected: number; refunded: number; reversed: number; net: number; entries: number };
}
