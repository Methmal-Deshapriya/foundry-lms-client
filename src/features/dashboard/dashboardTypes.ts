import type { IntakeStatus } from "@/features/catalog/catalogApi";
import type { EnrollmentRequestStatus } from "@/features/enrollments/enrollmentRequestsTypes";

export type RecentEnrollmentSummary = {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  updatedAt: string;
  courseTitle: string | null;
  thumbnailUrl: string | null;
  categoryVisualKey: string | null;
  intakeCode: string | null;
  progress: { completedCount: number; availableSessionCount: number; progressPercent: number } | null;
};

/** Next not-yet-completed session for the student's most recently active
 * enrollment — null once that enrollment has no incomplete session left,
 * or isn't currently ACTIVE (see dashboard.repository.js). */
export type ContinueLearningPointer = {
  enrollmentId: string;
  courseTitle: string | null;
  sessionTitle: string;
  orderIndex: number | null;
};

/** One day's session-completion count, last 12 weeks, sparse (missing days
 * are implicitly 0) — see dashboard.repository.js's HEATMAP_DAYS query. */
export type HeatmapDay = { date: string; count: number };

/** A cheap, derived "what happened recently" feed — not a real notifications
 * system (no read state, no triggers), just the top few events from data
 * already on hand: certificate issuance, project review decisions, and
 * course completions. */
export type ActivityItem = {
  type: "CERTIFICATE_ISSUED" | "PROJECT_APPROVED" | "PROJECT_REJECTED" | "COURSE_COMPLETED";
  occurredAt: string;
  title: string | null;
};

export type StudentDashboardSummary = {
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  continueLearning: ContinueLearningPointer | null;
  heatmap: HeatmapDay[];
  recentActivity: ActivityItem[];
  recentEnrollments: RecentEnrollmentSummary[];
};

export type MonthlyCount = { month: string; count: number };
export type MonthlyAmount = { month: string; amount: number };

export type EnrollmentStatusKey = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type CertificateStatusKey = "ISSUED" | "REVOKED";
export type ProjectStatusKey = "PENDING" | "APPROVED" | "REJECTED";
export type PaymentStatusKey = "PARTIAL" | "COMPLETED";

export type DistrictCount = { district: string; count: number };
export type TopCourse = { courseId: string; title: string; count: number };
export type ServiceCount = { service: string; count: number };

/** One intake/cohort card for the "services delivered" side of the admin
 * dashboard (page 2) — `serviceSlug`/`categoryId`/`courseId` aren't shown,
 * they exist only to build the 4-segment admin intake workspace URL
 * (/admin/services/{serviceSlug}/categories/{categoryId}/courses/{courseId}
 * /intakes/{id}) directly from this card, skipping the normal
 * service → category → course click-through. See dashboard.repository.js's
 * INTAKE_CARD_SELECT/mapIntakeRow. */
export type DashboardIntakeCard = {
  id: string;
  code: string;
  courseId: string;
  categoryId: string;
  serviceSlug: string | null;
  title: string;
  status: IntakeStatus;
  startDate: string | null;
  expectedEndDate: string | null;
  capacity: number | null;
  enrolledCount: number;
  /** Current (non-retired) curriculum size for this intake. */
  totalSessions: number;
  /** How many of those sessions a student would actually see right now —
   * same "released, or scheduled-and-due" rule the classroom itself uses. */
  releasedSessions: number;
  /** releasedSessions / totalSessions, 0-100 — null when totalSessions is 0
   * (no curriculum attached yet), not 0, so the UI can tell "nothing to
   * release" apart from "none released yet". */
  releaseProgressPct: number | null;
  /** Completions / (releasedSessions × active enrollments), 0-100 — null
   * when that denominator is 0 (no released content, or no active
   * enrollments), for the same reason. */
  completionPct: number | null;
};

/** One pending enrollment request for the "services delivered" side of the
 * admin dashboard (page 2) — `categoryId`/`serviceSlug` exist only to build
 * the intake workspace URL this request is worked from
 * (/admin/services/{serviceSlug}/categories/{categoryId}/courses/{courseId}
 * /intakes/{intakeId}?tab=enrollment-requests&requestId={id}), same reasoning
 * as DashboardIntakeCard. See dashboard.repository.js's
 * ENROLLMENT_REQUEST_CARD_SELECT/mapEnrollmentRequestRow. */
export type DashboardEnrollmentRequest = {
  id: string;
  intakeId: string;
  courseId: string;
  categoryId: string | null;
  serviceSlug: string | null;
  courseTitle: string;
  studentName: string;
  studentEmail: string | null;
  contactPhone: string;
  status: EnrollmentRequestStatus;
  createdAt: string;
};

/** Either a preset lookback (`months`: 3/6/12) or an explicit custom range
 * (`from`/`to`, ISO date strings) for the enrollment/revenue trend charts —
 * see dashboard.repository.js's resolveTrendWindow. Every other field on
 * AdminDashboardSummary is an all-time snapshot and ignores this. */
export type AdminDashboardQuery = { months?: number; from?: string; to?: string };

export type AdminDashboardSummary = {
  totalStudents: number;
  totalActiveEnrollments: number;
  pendingEnrollmentRequests: number;
  totalCertificatesIssued: number;
  pendingProjectReviews: number;
  totalRevenue: number;
  fullPotentialRevenue: number;
  revenueToCome: number;
  enrollmentTrend: MonthlyCount[];
  revenueTrend: MonthlyAmount[];
  enrollmentStatusBreakdown: Partial<Record<EnrollmentStatusKey, number>>;
  certificateStatusBreakdown: Partial<Record<CertificateStatusKey, number>>;
  projectStatusBreakdown: Partial<Record<ProjectStatusKey, number>>;
  paymentStatusBreakdown: Partial<Record<PaymentStatusKey, number>>;
  districtBreakdown: DistrictCount[];
  topCourses: TopCourse[];
  serviceBreakdown: ServiceCount[];
  runningIntakes: DashboardIntakeCard[];
  upcomingIntakes: DashboardIntakeCard[];
  overdueIntakes: DashboardIntakeCard[];
  enrollmentRequestsList: DashboardEnrollmentRequest[];
};
