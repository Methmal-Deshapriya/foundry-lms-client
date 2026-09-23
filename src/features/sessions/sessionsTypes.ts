import type { PublicCourseCard } from "@/features/catalog/catalogTypes";
import type { EnrollmentStatus } from "@/features/enrollments/enrollmentsTypes";
import type { StoredObjectSummary } from "@/features/storage/storageApi";

export type SessionStatus = "DRAFT" | "READY" | "ARCHIVED";
export type CourseSessionDeliveryStatus =
  | "UNRELEASED"
  | "SCHEDULED"
  | "RELEASED"
  | "WITHDRAWN";

export interface SessionContent {
  title: string;
  description?: string | null;
  recordingUrl?: string | null;
  materialUrl?: string | null;
  recordingObjectId?: string | null;
  materialObjectId?: string | null;
  quizUrl?: string | null;
  feedbackUrl?: string | null;
  durationMinutes?: number | null;
  tags?: string[];
}

export interface SessionUsageCourse {
  courseSessionId: string;
  intakeId: string;
  courseId: string;
  courseTitle: string;
  intakeCode: string;
  // serviceSlug exists only to build the click-through link to the intake's
  // workspace page — not for display.
  serviceSlug: string;
  orderIndex: number | null;
  retiredAt: string | null;
  deliveryStatus: CourseSessionDeliveryStatus;
}

export interface LibrarySession extends SessionContent {
  id: string;
  status: SessionStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  recordingObject: StoredObjectSummary | null;
  materialObject: StoredObjectSummary | null;
  usage: {
    intakeCount: number;
    activeIntakeCount: number;
    courseCount: number;
    courses: SessionUsageCourse[];
  };
}

export interface BulkArchiveSessionsResult {
  results: Array<{ id: string; status: "ARCHIVED" | "FAILED"; error?: string }>;
  summary: { requested: number; archived: number; failed: number };
}

export type CreateSessionRequest = SessionContent & { status?: "DRAFT" | "READY" };
export type UpdateSessionRequest = Partial<CreateSessionRequest>;

export interface CourseSession {
  id: string;
  intakeId: string;
  orderIndex: number | null;
  deliveryStatus: CourseSessionDeliveryStatus;
  availableAt: string | null;
  firstReleasedAt: string | null;
  retiredAt: string | null;
  historicalOrderIndex: number | null;
  session: Omit<LibrarySession, "usage">;
  usage: { completionCount: number };
}

export interface CurriculumResponse {
  intake: {
    id: string;
    code: string;
    status: string;
    accessType: "FREE" | "PAID";
  };
  curriculum: CourseSession[];
}

export interface EnrollmentProgress {
  enrollmentId: string;
  courseId: string;
  intakeId: string;
  completedCount: number;
  availableSessionCount: number;
  progressPercent: number;
}

export interface ClassroomSession {
  courseSessionId: string;
  orderIndex: number | null;
  title: string;
  description: string | null;
  recordingUrl: string | null;
  materialUrl: string | null;
  quizUrl: string | null;
  feedbackUrl: string | null;
  durationMinutes: number | null;
  sessionStatus: SessionStatus;
  deliveryStatus: CourseSessionDeliveryStatus;
  availableAt: string | null;
  retired: boolean;
  completed: boolean;
  completedAt: string | null;
}

export interface ClassroomResponse {
  enrollment: {
    id: string;
    status: EnrollmentStatus;
    source: "ADMIN" | "SELF";
    deliveryMode: "PAID" | "FREE";
    enrolledAt: string;
    paymentStatus: "NOT_REQUIRED" | "PARTIAL" | "COMPLETED";
    paymentCompletedAt: string | null;
    certificate: { id: string; certificateCode: string; status: "ISSUED" | "REVOKED"; issuedDate: string } | null;
    course: PublicCourseCard & {
      description: string;
      highlights: string[];
      skills: string[];
      prerequisites: string[];
      thumbnailUrl: string | null;
      serviceTitle: string;
      intakeKey: string;
      code: string;
      instanceKind: "SEASONAL" | "EVERGREEN";
      startDate: string | null;
      expectedEndDate: string | null;
      timezone: string;
    };
  };
  sessions: ClassroomSession[];
  progress: EnrollmentProgress;
}

export interface SessionCompletionResult {
  id: string;
  enrollmentId: string;
  courseSessionId: string;
  intakeId: string;
  completedAt: string;
  created: boolean;
}
