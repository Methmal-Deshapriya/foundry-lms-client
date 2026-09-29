export type LearningServiceSlug = string;
export type LearningServiceType = string;
export type CourseLevel =
  "OPEN" | "FOUNDATION" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type CourseEnrollmentStatus = "COMING_SOON" | "OPEN" | "REOPENING_SOON";

export interface PublicLearningService {
  id: string;
  key: string;
  slug: string;
  title: string;
  description: string;
  accessType: "FREE" | "PAID";
  courseMode: "SEASONAL" | "EVERGREEN";
  enrollmentMode: "ADMIN" | "SELF";
  paymentRequirement: "REQUIRED" | "NOT_REQUIRED";
  sortOrder: number;
  courseCount: number;
  /** Short home-page-card blurb — falls back to `description` when empty (legacy rows only; required going forward). */
  summary: string | null;
  heroHeadline: string | null;
  /** Exactly 2 bespoke marketing tags shown on the detail-page hero, alongside the auto course-count badge. */
  heroTags: string[];
  cardImageUrl: string | null;
  heroImageUrl: string | null;
  processSteps: { title: string; description: string }[];
  faqItems: { question: string; answer: string }[];
}

export interface PublicCourseCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: CourseLevel;
  levelLabel: string;
  durationValue: number | null;
  durationUnit: string | null;
  durationLabel: string | null;
  accessType: "FREE" | "PAID";
  instanceKind: "SEASONAL" | "EVERGREEN";
  price: number;
  currency: string;
  certificateEnabled: boolean;
  /** Derived from this course's intakes — see the course-to-program rename plan §8. Drives the public CTA: OPEN shows Enroll, COMING_SOON/REOPENING_SOON show the matching waiting state. */
  enrollmentStatus: CourseEnrollmentStatus;
}

/** The course's currently OPEN_ACTIVE intake, if any — the target for Enroll/self-enroll. */
export interface PublicOpenIntake {
  id: string;
  startDate: string | null;
  expectedEndDate: string | null;
  capacity: number | null;
  /** null means unlimited capacity — distinct from 0 (full). */
  seatsRemaining: number | null;
}

export interface PublicCourseDetail extends PublicCourseCard {
  description: string;
  highlights: string[];
  skills: string[];
  prerequisites: string[];
  thumbnailUrl: string | null;
  /** "Who this course is for" — a short descriptive sentence. */
  targetAudience: string | null;
  /** "Why pursue this course" — rendered as numbered steps. */
  whyPursueSteps: { title: string; description: string }[];
  /** YouTube URL, played the same way as the landing page's AboutVideo. */
  explainerVideoUrl: string | null;
  explainerVideoThumbnailUrl: string | null;
  service: { slug: LearningServiceSlug; title: string };
  openIntake: PublicOpenIntake | null;
}

/** Level-2 public page data — every published course directly under a service (the Category layer was removed 2026-09-22). */
export interface PublicServiceCatalog {
  serviceId: string;
  serviceType: LearningServiceType;
  serviceSlug: LearningServiceSlug;
  courses: PublicCourseCard[];
}

/** A course card on the cross-service Explore page — carries its own
 * service slug/title since (unlike a single-service page) the page doesn't
 * already know which one a given card belongs to. */
export interface PublicExploreCourseCard extends PublicCourseCard {
  thumbnailUrl: string | null;
  serviceSlug: LearningServiceSlug;
  serviceTitle: string;
}

export interface PublicExplorePagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PublicExploreResponse {
  courses: PublicExploreCourseCard[];
  pagination: PublicExplorePagination;
}

export interface PublicExploreFilters {
  service?: string;
  level?: CourseLevel;
  accessType?: "FREE" | "PAID";
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  limit?: number;
  offset?: number;
}
