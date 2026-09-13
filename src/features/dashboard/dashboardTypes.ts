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

export type DistrictCount = { district: string; count: number };
export type TopCourse = { courseId: string; title: string; count: number };
export type ServiceCount = { service: string; count: number };

export type AdminDashboardSummary = {
  totalStudents: number;
  totalActiveEnrollments: number;
  pendingEnrollmentRequests: number;
  totalCertificatesIssued: number;
  pendingProjectReviews: number;
  totalRevenue: number;
  enrollmentTrend: MonthlyCount[];
  revenueTrend: MonthlyAmount[];
  enrollmentStatusBreakdown: Partial<Record<EnrollmentStatusKey, number>>;
  certificateStatusBreakdown: Partial<Record<CertificateStatusKey, number>>;
  projectStatusBreakdown: Partial<Record<ProjectStatusKey, number>>;
  districtBreakdown: DistrictCount[];
  topCourses: TopCourse[];
  serviceBreakdown: ServiceCount[];
};
