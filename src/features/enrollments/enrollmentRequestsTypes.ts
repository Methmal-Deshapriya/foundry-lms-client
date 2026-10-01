export type EnrollmentRequestStatus = "PENDING" | "CONTACTED" | "ENROLLED" | "DECLINED";

export interface EnrollmentRequest {
  id: string;
  courseId: string;
  intakeId: string;
  status: EnrollmentRequestStatus;
  contactPhone: string;
  contactedAt: string | null;
  enrollmentId: string | null;
  createdAt: string;
  updatedAt: string;
  course: { id: string; title: string; slug: string } | null;
  intake: { id: string; code: string; status: string } | null;
  student: { id: string; firstName: string; lastName: string; email: string; phone: string | null } | null;
  contactedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface EnrollmentRequestSummary {
  all: number;
  PENDING: number;
  CONTACTED: number;
  ENROLLED: number;
  DECLINED: number;
}

export interface EnrollmentRequestPage {
  requests: EnrollmentRequest[];
  summary: EnrollmentRequestSummary;
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

export type EnrollmentRequestParams = {
  q?: string;
  status?: EnrollmentRequestStatus;
  limit?: number;
  offset?: number;
};

export type CreateEnrollmentRequestBody = { contactPhone: string };

// Same payment-details shape the direct search-and-enroll flow uses — the
// student and intake are already fixed by the request itself.
export type EnrollFromRequestBody = {
  paymentStatus?: "PARTIAL" | "COMPLETED";
  externalPaymentReference?: string | null;
  paymentNote?: string | null;
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "ONLINE" | "OTHER" | null;
};
