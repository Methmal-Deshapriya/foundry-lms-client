import type { PublicCourseCard } from "@/features/catalog/catalogTypes";
import type { User } from "@/features/auth/authTypes";

export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "NOT_REQUIRED" | "PARTIAL" | "COMPLETED";
export type EnrollmentSource = "ADMIN" | "SELF";
export type CertificateStatus = "ISSUED" | "REVOKED";

export interface EnrollmentCertificateSummary {
  id: string;
  certificateCode: string;
  status: CertificateStatus;
  issuedDate: string;
}

/** Sessions completed vs. currently visible in the classroom — see
 * classroom.service.js's progressFromRows on the server, which this mirrors. */
export interface EnrollmentProgressSummary {
  completedCount: number;
  availableSessionCount: number;
  progressPercent: number;
}

export interface MyEnrollment {
  enrolledAt: string;
  id: string;
  userId: string;
  courseId: string;
  intakeId: string;
  source: EnrollmentSource;
  status: EnrollmentStatus;
  paymentStatus: PaymentStatus;
  paymentCompletedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // The program (title, summary, price, ...) comes from Course; the run's
  // own facts (intake key, code, dates, timezone, lifecycle status) come
  // from Intake — see the rename plan §6.
  course: PublicCourseCard & {
    thumbnailUrl: string | null;
    intakeId: string;
    intakeKey: string;
    code: string;
    instanceKind: "SEASONAL" | "EVERGREEN";
    startDate: string | null;
    expectedEndDate: string | null;
    timezone: string;
    intakeStatus: string;
  };
  certificate: EnrollmentCertificateSummary | null;
  progress: EnrollmentProgressSummary | null;
}

export type SelfHistoryParams = { limit?: number; cursor?: string };

export interface MyEnrollmentsPage {
  enrollments: MyEnrollment[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}


export interface ClassRosterEntry extends MyEnrollment {
  user: User;
  enrolledBy?: User | null;
  enrolledByUserId?: string | null;
  externalPaymentReference?: string | null;
  paymentNote?: string | null;
}

export interface CreatePaidEnrollmentRequest {
  userId: string;
  paymentStatus?: Exclude<PaymentStatus, "NOT_REQUIRED">;
  externalPaymentReference?: string | null;
  paymentNote?: string | null;
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "ONLINE" | "OTHER" | null;
}

// paymentStatus is not editable here — it only ever changes via the
// ledger-aware paths (creating the enrollment, or completing its
// remaining payment through CompletePaymentRequest below), so every
// change stays backed by a Payment row.
export type UpdateEnrollmentRequest = {
  status?: EnrollmentStatus;
  externalPaymentReference?: string | null;
  paymentNote?: string | null;
};
export type EligibleStudent = Pick<User, "id" | "firstName" | "lastName" | "email">;
export type EligibleStudentsParams = {
  intakeId: string;
  q?: string;
  limit?: number;
  cursor?: string;
};
export interface EligibleStudentsPage {
  students: EligibleStudent[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface RosterSummary {
  all: number;
  active: number;
  completed: number;
  cancelled: number;
}

export interface RosterPage {
  enrollments: ClassRosterEntry[];
  summary: RosterSummary;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export type RosterParams = {
  q?: string;
  status?: EnrollmentStatus;
  limit?: number;
  offset?: number;
};

export interface BulkEnrollmentResult {
  results: Array<{
    userId: string;
    status: "CREATED" | "FAILED";
    enrollment?: ClassRosterEntry;
    code?: string;
    error?: string;
  }>;
  summary: { requested: number; created: number; failed: number };
}
