import type { MyEnrollment } from "./enrollmentsTypes";

// Whether a student's enrollment opens the classroom, and if not, why. A
// plain module (no React) so it is unit-tested; must match the server's
// enrollmentAccessPolicy.js.

const accessibleCourseStatuses = new Set([
  "OPEN_ACTIVE",
  "CLOSED_ACTIVE",
  "COMPLETED",
  "ARCHIVED",
]);

export function getAccessMessage(enrollment: Pick<MyEnrollment, "status" | "source" | "paymentStatus"> & { course: Pick<MyEnrollment["course"], "intakeStatus"> }) {
  if (enrollment.status === "CANCELLED") {
    return "This enrollment was cancelled. Contact support if this is unexpected.";
  }
  // Same rule as the server's hasSufficientPayment: paying half (PARTIAL)
  // already opens the classroom; only "nothing paid yet" is locked
  // (code review M05-01).
  if (enrollment.source === "ADMIN" && enrollment.paymentStatus !== "COMPLETED" && enrollment.paymentStatus !== "PARTIAL") {
    return "Classroom access opens after an admin confirms your payment.";
  }
  if (!accessibleCourseStatuses.has(enrollment.course.intakeStatus)) {
    return "This intake is not currently available for learning.";
  }
  return null;
}
