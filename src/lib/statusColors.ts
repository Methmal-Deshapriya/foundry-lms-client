import type { CatalogStatus, CourseEnrollmentStatus, IntakeStatus, LearningServiceStatus } from "@/features/catalog/catalogApi";
import type { CertificateStatus } from "@/features/certificates/certificatesTypes";
import type { EnrollmentRequestStatus } from "@/features/enrollments/enrollmentRequestsTypes";
import type { EnrollmentStatus, PaymentStatus } from "@/features/enrollments/enrollmentsTypes";
import type { ProjectStatus } from "@/features/projects/projectsTypes";
import type { CourseSessionDeliveryStatus, SessionStatus } from "@/features/sessions/sessionsTypes";

/**
 * Central status → color registry. Every status badge anywhere in the admin
 * system (services, categories, courses, sessions, curriculum delivery,
 * enrollments, payments, certificates, student projects) is colored from
 * here, not with its own one-off Tailwind classes — so the whole system's
 * status language changes in exactly one place.
 *
 * The actual colors live in `TONE`, keyed by what the color *means*, not
 * which entity it's on. Each status list below just says which tone that
 * status carries; two different entities' "ARCHIVED" or "COMPLETED" read
 * as the same color for the same reason a stop sign is red everywhere.
 */
const TONE = {
  // Not live yet / put away — quiet, not urgent.
  neutral: "border-border bg-muted text-muted-foreground",
  // A different-but-still-active phase, or a payment in progress.
  info: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  // Live, published, succeeded, approved, issued, paid in full.
  positive: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  // Needs a look — pending review, pulled back, awaiting action.
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  // Timed to happen later.
  scheduled: "border-violet-500/20 bg-violet-500/10 text-violet-700",
  // Cancelled, rejected, revoked — a bad terminal outcome.
  negative: "border-destructive/20 bg-destructive/10 text-destructive",
} as const;

function styles<T extends string>(map: Record<T, keyof typeof TONE>): Record<T, string> {
  return Object.fromEntries(
    Object.entries(map).map(([status, tone]) => [status, TONE[tone as keyof typeof TONE]]),
  ) as Record<T, string>;
}

export const CATALOG_STATUS_STYLES = styles<CatalogStatus>({
  DRAFT: "neutral",
  PUBLISHED: "positive",
  ARCHIVED: "neutral",
});

export const LEARNING_SERVICE_STATUS_STYLES = styles<LearningServiceStatus>({
  DRAFT: "neutral",
  ACTIVE: "positive",
  ARCHIVED: "neutral",
});

export const INTAKE_STATUS_STYLES = styles<IntakeStatus>({
  DRAFT: "neutral",
  OPEN_ACTIVE: "positive",
  CLOSED_ACTIVE: "info",
  COMPLETED: "positive",
  CANCELLED: "negative",
  ARCHIVED: "neutral",
});

// The course's derived, public-facing enrollment availability — see the
// rename plan §8. Distinct from IntakeStatus: this is what a visitor sees,
// not the intake's own internal lifecycle.
export const COURSE_ENROLLMENT_STATUS_STYLES = styles<CourseEnrollmentStatus>({
  COMING_SOON: "warning",
  OPEN: "positive",
  REOPENING_SOON: "info",
});

export const ENROLLMENT_REQUEST_STATUS_STYLES = styles<EnrollmentRequestStatus>({
  PENDING: "warning",
  CONTACTED: "info",
  ENROLLED: "positive",
  DECLINED: "negative",
});

export const SESSION_STATUS_STYLES = styles<SessionStatus>({
  DRAFT: "neutral",
  READY: "positive",
  ARCHIVED: "neutral",
});

export const COURSE_SESSION_DELIVERY_STATUS_STYLES = styles<CourseSessionDeliveryStatus>({
  UNRELEASED: "neutral",
  SCHEDULED: "scheduled",
  RELEASED: "positive",
  WITHDRAWN: "warning",
});

export const ENROLLMENT_STATUS_STYLES = styles<EnrollmentStatus>({
  ACTIVE: "info",
  COMPLETED: "positive",
  CANCELLED: "negative",
});

export const PAYMENT_STATUS_STYLES = styles<PaymentStatus>({
  NOT_REQUIRED: "neutral",
  PARTIAL: "info",
  COMPLETED: "positive",
});

export const CERTIFICATE_STATUS_STYLES = styles<CertificateStatus>({
  ISSUED: "positive",
  REVOKED: "negative",
});

export const PROJECT_STATUS_STYLES = styles<ProjectStatus>({
  PENDING: "warning",
  APPROVED: "positive",
  REJECTED: "negative",
});

// An unverified signup isn't itself an error state (they just haven't
// finished a step yet), so this gets the same "needs a look" amber as
// PENDING elsewhere, not the red "negative" tone.
export const EMAIL_VERIFICATION_STYLES = styles<"VERIFIED" | "UNVERIFIED">({
  VERIFIED: "positive",
  UNVERIFIED: "warning",
});
