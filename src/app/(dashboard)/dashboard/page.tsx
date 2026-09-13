"use client";

import { useAppSelector } from "@/store/hooks";
import { selectAuthUser } from "@/features/auth/authSelectors";
import StudentOnlyRoute from "@/components/access/StudentOnlyRoute";
import EnrollmentIntentHandler from "@/features/enrollments/components/EnrollmentIntentHandler";
import EnrollmentRequestIntentHandler from "@/features/enrollments/components/EnrollmentRequestIntentHandler";
import StudentDashboard from "@/features/dashboard/components/StudentDashboard";

/**
 * The student dashboard — its own route now, separate from the admin one
 * at /admin/dashboard (they used to share this page, branching on role).
 * An admin/super-admin landing here sees StudentOnlyRoute's restricted
 * message rather than a student's data; see lib/access.ts's
 * getDashboardPath for where every login/redirect path now sends each
 * role instead.
 */
export default function DashboardPage() {
  const user = useAppSelector(selectAuthUser);

  return (
    <StudentOnlyRoute description="Admins have their own dashboard — see /admin/dashboard.">
      <EnrollmentIntentHandler />
      <EnrollmentRequestIntentHandler />
      <StudentDashboard firstName={user?.firstName} />
    </StudentOnlyRoute>
  );
}
