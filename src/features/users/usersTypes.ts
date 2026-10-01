import type { Role } from "@/lib/constants";
import type { CertificateStatus } from "@/features/certificates/certificatesTypes";
import type { EnrollmentRequestStatus } from "@/features/enrollments/enrollmentRequestsTypes";
import type { EnrollmentStatus, PaymentStatus } from "@/features/enrollments/enrollmentsTypes";
import type { ProjectStatus } from "@/features/projects/projectsTypes";

export type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  /** Set while a super admin has suspended the account (code review M10-05). */
  disabledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UsersPagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type UsersResponse = {
  users: UserRecord[];
  pagination: UsersPagination;
};

export type GetUsersParams = {
  role?: Role;
  limit?: number;
  offset?: number;
};

// --- User detail (admin) ---------------------------------------------

export type UserActivitySection<T> = { total: number; items: T[] };

type CourseRef = { id: string; title: string } | null;
type IntakeRef = { id: string; code: string } | null;
type UserRef = { id: string; firstName: string; lastName: string; email: string } | null;

export type UserEnrollmentActivity = {
  id: string;
  status: EnrollmentStatus;
  paymentStatus: PaymentStatus;
  source: string;
  createdAt: string;
  completedAt: string | null;
  course: CourseRef;
  intake: IntakeRef;
  certificates?: { id: string; certificateCode: string; status: CertificateStatus }[];
};

export type UserManagedEnrollmentActivity = {
  id: string;
  status: EnrollmentStatus;
  createdAt: string;
  user: UserRef;
  course: CourseRef;
  intake: IntakeRef;
};

export type UserPaymentActivity = {
  id: string;
  amount: string;
  discountAmount: string;
  currency: string;
  type: "FULL" | "PARTIAL" | "TOP_UP";
  createdAt: string;
  course: CourseRef;
  intake: IntakeRef;
  enrollment?: { user: UserRef };
};

export type UserCertificateActivity = {
  id: string;
  certificateCode: string;
  status: CertificateStatus;
  issuedDate: string;
  courseName: string;
};

export type UserProjectActivity = {
  id: string;
  title: string;
  status: ProjectStatus;
  createdAt: string;
  isPublic: boolean;
};

export type UserEnrollmentRequestActivity = {
  id: string;
  status: EnrollmentRequestStatus;
  createdAt: string;
  course: CourseRef;
  intake: IntakeRef;
};

export type UserAuditActivity = {
  id: string;
  action: string;
  entityType: string;
  description: string | null;
  createdAt: string;
};

export type UserDetail = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  phone: string | null;
  address: string | null;
  district: string | null;
  dateOfBirth: string | null;
  alStream: string | null;
  emailVerified: boolean;
  disabledAt: string | null;
  createdAt: string;
  updatedAt: string;
  enrollments: UserActivitySection<UserEnrollmentActivity>;
  managedEnrollments: UserActivitySection<UserManagedEnrollmentActivity>;
  paymentsRecorded: UserActivitySection<UserPaymentActivity>;
  paymentsMade: UserActivitySection<UserPaymentActivity>;
  certificates: UserActivitySection<UserCertificateActivity>;
  studentProjects: UserActivitySection<UserProjectActivity>;
  enrollmentRequests: UserActivitySection<UserEnrollmentRequestActivity>;
  /** Null unless the viewer can read the audit log (super admins) — code review M10-02. */
  auditActions: UserActivitySection<UserAuditActivity> | null;
};
