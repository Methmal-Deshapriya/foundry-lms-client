import { baseApi } from "@/store/baseApi";
import type {
  LearningServiceType,
  LearningServiceSlug,
  CourseLevel,
  CourseEnrollmentStatus,
  PublicExploreFilters,
  PublicExploreResponse,
  PublicLearningService,
  PublicServiceCatalog,
} from "./catalogTypes";
import type { MyEnrollment } from "@/features/enrollments/enrollmentsTypes";
import type { StoredObjectSummary } from "@/features/storage/storageApi";

export type CatalogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type IntakeStatus =
  | "DRAFT"
  | "OPEN_ACTIVE"
  | "CLOSED_ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";
export type CourseInstanceKind = "SEASONAL" | "EVERGREEN";
export type LearningServiceStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type { CourseEnrollmentStatus };

export interface LearningService {
  id: string;
  key: LearningServiceType;
  slug: string;
  title: string;
  description: string;
  accessType: "FREE" | "PAID";
  courseMode: CourseInstanceKind;
  enrollmentMode: "ADMIN" | "SELF";
  paymentRequirement: "REQUIRED" | "NOT_REQUIRED";
  status: LearningServiceStatus;
  sortOrder: number;
  courseCount: number;
  /** Short home-page-card blurb — distinct from `description`, which is the fuller hero/admin text. Falls back to `description` when empty (legacy rows only). */
  summary: string | null;
  /** The public Level-2 page's hook headline (falls back to `title` when empty). */
  heroHeadline: string | null;
  /** Exactly 2 bespoke marketing tags shown on the detail-page hero, alongside the auto course-count badge. */
  heroTags: string[];
  /** R2-backed image for the home page "What we offer" card — fixed 1672x941px. */
  cardImageUrl: string | null;
  cardImageObjectId: string | null;
  cardImageObject: StoredObjectSummary | null;
  /** R2-backed image for the service detail page's hero — fixed 1374x1145px. */
  heroImageUrl: string | null;
  heroImageObjectId: string | null;
  heroImageObject: StoredObjectSummary | null;
  processSteps: { title: string; description: string }[];
  faqItems: { question: string; answer: string }[];
  createdAt: string;
  updatedAt: string;
}

/** The real-world program a student browses and enrolls in — see the 2026-08-30 course-to-program-intake rename plan. */
export interface AdminCourse {
  id: string;
  serviceId: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  level: CourseLevel;
  durationValue: number | null;
  durationUnit: "SESSION" | "DAY" | "WEEK" | "MONTH" | null;
  price: number;
  currency: "LKR";
  intakeCodePrefix: string;
  certificateEnabled: boolean;
  /** Flat discount for paying an intake's full price in one go, applied to every intake under this course. Set once at creation; irrelevant (0) for FREE services. */
  discountAmount: number;
  enrollmentStatus: CourseEnrollmentStatus;
  /** Publish lifecycle — Course's own Draft/Published/Archived status, taking over what Category's status used to gate (see the 2026-09-22 category layer removal plan). */
  status: CatalogStatus;
  highlights: string[];
  skills: string[];
  prerequisites: string[];
  thumbnailUrl: string | null;
  thumbnailObjectId: string | null;
  thumbnailObject: StoredObjectSummary | null;
  /** "Who this course is for" — a short descriptive sentence shown on the public course page. */
  targetAudience: string | null;
  /** "Why pursue this course" — rendered as numbered steps on the public course page. */
  whyPursueSteps: { title: string; description: string }[];
  /** YouTube URL, played the same way as the landing page's AboutVideo. */
  explainerVideoUrl: string | null;
  explainerVideoThumbnailObjectId: string | null;
  explainerVideoThumbnailObject: StoredObjectSummary | null;
  sortOrder: number;
  archivedAt: string | null;
  service: LearningService;
  intakes: AdminIntake[];
  intakeCount: number;
  createdAt: string;
  updatedAt: string;
}

/** One scheduled, enrollable run of a Course. Holds only what varies between runs. */
export interface AdminIntake {
  id: string;
  courseId: string;
  serviceId: string;
  intakeKey: string;
  code: string;
  accessType: "FREE" | "PAID";
  instanceKind: CourseInstanceKind;
  startDate: string | null;
  expectedEndDate: string | null;
  timezone: string;
  capacity: number | null;
  status: IntakeStatus;
  certificateEnabled: boolean;
  sessionCount: number;
  enrollmentCount: number;
  projectCount: number;
  service: LearningService;
  course: Omit<AdminCourse, "intakes" | "service">;
  createdAt: string;
  updatedAt: string;
}

export interface CourseInput {
  serviceId: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  level: CourseLevel;
  durationValue?: number | null;
  durationUnit?: AdminCourse["durationUnit"];
  price: number;
  highlights?: string[];
  skills?: string[];
  prerequisites?: string[];
  thumbnailUrl?: string | null;
  thumbnailObjectId?: string | null;
  targetAudience?: string | null;
  whyPursueSteps?: { title: string; description: string }[];
  explainerVideoUrl?: string | null;
  explainerVideoThumbnailObjectId?: string | null;
  sortOrder?: number;
  intakeCodePrefix: string;
  certificateEnabled: boolean;
  discountAmount?: number;
}

export type CourseUpdateInput = Partial<
  Omit<CourseInput, "serviceId" | "intakeCodePrefix" | "certificateEnabled" | "discountAmount">
>;

// Per the rename plan §3a: nearly everything about an intake is inherited
// from its Course or auto-suggested — this is deliberately a much smaller
// payload than course creation.
export interface IntakeInput {
  intakeKey?: string;
  startDate?: string | null;
  expectedEndDate?: string | null;
  timezone?: string;
  capacity?: number | null;
}

export type IntakeUpdateInput = Partial<
  Pick<AdminIntake, "startDate" | "expectedEndDate" | "timezone" | "capacity">
>;

export interface IntakeDefaults {
  intakeKey: string;
  timezone: string;
}

type List<T, K extends string> = Record<K, T[]> & {
  pagination: { total: number; limit: number; offset: number };
};

export interface PermanentDeleteResult {
  id: string;
  deletedCourses?: number;
  deletedIntakes?: number;
}

export interface CatalogDeletionImpact {
  resourceType: "COURSE" | "INTAKE";
  resourceId: string;
  resourceStatus: CatalogStatus | IntakeStatus | "ACTIVE";
  deletable: boolean;
  courses?: number;
  intakes?: number;
  history?: number;
  curriculumLinks?: number;
  enrollments?: number;
  projects?: number;
  enrollmentRequests?: number;
}

export interface CourseAnalytics {
  enrollments: { active: number; completed: number; cancelled: number; capacity: number | null };
  payments: {
    full: { count: number; amount: number };
    partial: { count: number; amount: number };
    topUp: { count: number; amount: number };
  };
  revenue: { total: number; currency: string };
  successRate: {
    /** null until at least one enrollment has completed or cancelled — an intake with only active enrollments hasn't produced an outcome yet. */
    completedPct: number | null;
    certificatesIssued: number;
    certificateEligible: number;
  };
  districts: { district: string; count: number }[];
  alStreams: { stream: string; count: number }[];
  sessionEngagement: {
    courseSessionId: string;
    title: string;
    orderIndex: number | null;
    completions: number;
    eligible: number;
    pct: number;
  }[];
  projects: { pending: number; approved: number; rejected: number };
}

/**
 * Course-level (cross-intake) rollup — same shape as CourseAnalytics minus
 * capacity/districts/sessionEngagement, which are intake-specific and don't
 * aggregate meaningfully across intakes that may run different curricula.
 * See the 2026-08-31 course detail page improvement plan §4. A/L stream is
 * a student attribute rather than a curriculum one, so it's still included.
 */
export interface CourseRollupAnalytics {
  enrollments: { active: number; completed: number; cancelled: number };
  payments: {
    full: { count: number; amount: number };
    partial: { count: number; amount: number };
    topUp: { count: number; amount: number };
  };
  revenue: { total: number; currency: string };
  successRate: {
    completedPct: number | null;
    certificatesIssued: number;
    certificateEligible: number;
  };
  alStreams: { stream: string; count: number }[];
  projects: { pending: number; approved: number; rejected: number };
}

export interface AdminLearningServiceSummary {
  id: string;
  key: LearningServiceType;
  slug: string;
  title: string;
  accessType: "FREE" | "PAID";
  courseMode: CourseInstanceKind;
  paymentRequirement: "REQUIRED" | "NOT_REQUIRED";
  status: LearningServiceStatus;
  sortOrder: number;
  courseCount: number;
  summary: string | null;
  heroHeadline: string | null;
  heroTags: string[];
  cardImageUrl: string | null;
  cardImageObjectId: string | null;
  cardImageObject: StoredObjectSummary | null;
  heroImageUrl: string | null;
  heroImageObjectId: string | null;
  heroImageObject: StoredObjectSummary | null;
  processSteps: { title: string; description: string }[];
  faqItems: { question: string; answer: string }[];
  createdAt: string;
  updatedAt: string;
  serviceType: LearningServiceType;
  serviceSlug: LearningServiceSlug;
  label: string;
  description: string;
  instanceKind: CourseInstanceKind;
  enrollmentMode: "ADMIN" | "SELF";
  /** Course's own Draft/Published/Archived lifecycle counts — formerly Category's (see the 2026-09-22 category layer removal plan). */
  courses: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  /** Intake run-lifecycle counts — named "courses" pre-2026-09-22 back when Category owned the publish-status concept. */
  intakes: {
    total: number;
    openActive: number;
    closedActive: number;
    completed: number;
    draft: number;
    archived: number;
    withoutSessions: number;
  };
  learners: {
    activeUnique: number;
    totalUnique: number;
    activeEnrollments: number;
  };
  curriculumAttachmentCount: number;
  payments: { needsAttention: number } | null;
  attentionCount: number;
  /** Same shape as AdminCourse's/Intake's own analytics — see the 2026-09-24 hierarchical admin summaries plan. */
  revenue: { total: number; currency: string };
  paymentBreakdown: {
    full: { count: number; amount: number };
    partial: { count: number; amount: number };
    topUp: { count: number; amount: number };
  };
  certificates: { issued: number; eligible: number };
  projects: { pending: number; approved: number; rejected: number };
}

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicLearningServices: builder.query<
      { services: PublicLearningService[] },
      void
    >({
      query: () => "/catalog/services",
      providesTags: ["Services"],
    }),
    getPublicCoursesForService: builder.query<PublicServiceCatalog, string>({
      query: (serviceSlug) => `/catalog/${serviceSlug}/courses`,
      providesTags: ["Courses"],
    }),
    getPublicExplore: builder.query<PublicExploreResponse, PublicExploreFilters>({
      query: (filters) => ({ url: "/catalog/explore", params: filters }),
      providesTags: ["Courses"],
    }),
    getAdminLearningServiceSummaries: builder.query<
      {
        services: AdminLearningServiceSummary[];
        pagination: { total: number; limit: number; offset: number };
      },
      void
    >({ query: () => "/services?limit=100", providesTags: ["Services"] }),
    getLearningService: builder.query<LearningService, string>({
      query: (id) => `/services/${id}`,
      providesTags: ["Services"],
    }),
    createLearningService: builder.mutation<
      LearningService,
      Pick<
        LearningService,
        | "key"
        | "slug"
        | "title"
        | "description"
        | "accessType"
        | "courseMode"
        | "enrollmentMode"
        | "paymentRequirement"
        | "sortOrder"
        | "summary"
        | "heroHeadline"
        | "heroTags"
        | "cardImageObjectId"
        | "heroImageObjectId"
        | "processSteps"
        | "faqItems"
      >
    >({
      query: (body) => ({ url: "/services", method: "POST", body }),
      invalidatesTags: ["Services"],
    }),
    updateLearningService: builder.mutation<
      LearningService,
      {
        id: string;
        body: Partial<
          Pick<
            LearningService,
            | "title"
            | "description"
            | "sortOrder"
            | "slug"
            | "accessType"
            | "courseMode"
            | "enrollmentMode"
            | "paymentRequirement"
            | "summary"
            | "heroHeadline"
            | "heroTags"
            | "cardImageObjectId"
            | "heroImageObjectId"
            | "processSteps"
            | "faqItems"
          >
        >;
      }
    >({
      query: ({ id, body }) => ({
        url: `/services/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Services", "Courses"],
    }),
    transitionLearningService: builder.mutation<
      LearningService,
      {
        id: string;
        action: "activate" | "deactivate" | "archive" | "unarchive";
        expectedStatus: LearningServiceStatus;
      }
    >({
      query: ({ id, action, expectedStatus }) => ({
        url: `/services/${id}/${action}`,
        method: "PATCH",
        body: { expectedStatus },
      }),
      invalidatesTags: ["Services", "Courses"],
    }),
    deleteLearningService: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/services/${id}`, method: "DELETE" }),
      invalidatesTags: ["Services"],
    }),

    getCourses: builder.query<
      List<AdminCourse, "courses">,
      {
        serviceId?: string;
        status?: CatalogStatus;
        level?: CourseLevel;
        enrollmentStatus?: CourseEnrollmentStatus;
        includeArchived?: boolean;
      } | void
    >({
      query: (params) => ({
        url: "/courses",
        params: { limit: 100, ...(params ?? {}) },
      }),
      providesTags: ["Courses"],
    }),
    getCourse: builder.query<AdminCourse, string>({
      query: (id) => `/courses/${id}`,
      providesTags: ["Courses"],
    }),
    getCourseDeletionImpact: builder.query<CatalogDeletionImpact, string>({
      query: (id) => `/courses/${id}/deletion-impact`,
    }),
    getCourseAnalytics: builder.query<CourseRollupAnalytics, string>({
      query: (id) => `/courses/${id}/analytics`,
      providesTags: (_result, _error, id) => [{ type: "Courses" as const, id: `ANALYTICS-${id}` }],
    }),
    createCourse: builder.mutation<AdminCourse, CourseInput>({
      query: (body) => ({ url: "/courses", method: "POST", body }),
      invalidatesTags: ["Courses", "Services"],
    }),
    updateCourse: builder.mutation<
      AdminCourse,
      { id: string; body: CourseUpdateInput }
    >({
      query: ({ id, body }) => ({
        url: `/courses/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Courses"],
    }),
    publishCourse: builder.mutation<AdminCourse, string>({
      query: (id) => ({ url: `/courses/${id}/publish`, method: "PATCH" }),
      invalidatesTags: ["Services", "Courses"],
    }),
    unpublishCourse: builder.mutation<AdminCourse, string>({
      query: (id) => ({ url: `/courses/${id}/unpublish`, method: "PATCH" }),
      invalidatesTags: ["Services", "Courses"],
    }),
    archiveCourse: builder.mutation<AdminCourse, string>({
      query: (id) => ({ url: `/courses/${id}/archive`, method: "PATCH" }),
      invalidatesTags: ["Courses", "Services"],
    }),
    unarchiveCourse: builder.mutation<AdminCourse, string>({
      query: (id) => ({ url: `/courses/${id}/unarchive`, method: "PATCH" }),
      invalidatesTags: ["Courses", "Services"],
    }),
    deleteCourse: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/courses/${id}`, method: "DELETE" }),
      invalidatesTags: ["Courses", "Services"],
    }),

    getIntakes: builder.query<
      List<AdminIntake, "intakes">,
      {
        serviceId?: string;
        courseId?: string;
        status?: IntakeStatus;
        q?: string;
      } | void
    >({
      query: (params) => ({
        url: "/intakes",
        params: { limit: 100, ...(params ?? {}) },
      }),
      providesTags: ["Intakes"],
    }),
    getCourseIntakes: builder.query<List<AdminIntake, "intakes">, string>({
      query: (courseId) => ({
        url: `/courses/${courseId}/intakes`,
        params: { limit: 100 },
      }),
      providesTags: ["Intakes"],
    }),
    getIntakeDefaults: builder.query<IntakeDefaults, string>({
      query: (courseId) => `/courses/${courseId}/intakes/defaults`,
    }),
    createIntake: builder.mutation<
      AdminIntake,
      { courseId: string; body: IntakeInput }
    >({
      query: ({ courseId, body }) => ({
        url: `/courses/${courseId}/intakes`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Courses", "Intakes", "Curriculum"],
    }),
    getIntake: builder.query<AdminIntake, string>({
      query: (id) => `/intakes/${id}`,
      providesTags: ["Intakes"],
    }),
    getIntakeDeletionImpact: builder.query<CatalogDeletionImpact, string>({
      query: (id) => `/intakes/${id}/deletion-impact`,
    }),
    getIntakeAnalytics: builder.query<CourseAnalytics, string>({
      query: (id) => `/intakes/${id}/analytics`,
      providesTags: (_result, _error, id) => [{ type: "Intakes" as const, id: `ANALYTICS-${id}` }],
    }),
    updateIntake: builder.mutation<
      AdminIntake,
      { id: string; body: IntakeUpdateInput }
    >({
      query: ({ id, body }) => ({
        url: `/intakes/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Intakes"],
    }),
    updateIntakeStatus: builder.mutation<
      AdminIntake,
      { id: string; status: IntakeStatus; expectedStatus: IntakeStatus }
    >({
      query: ({ id, status, expectedStatus }) => ({
        url: `/intakes/${id}/status`,
        method: "PATCH",
        body: { status, expectedStatus },
      }),
      invalidatesTags: ["Courses", "Intakes", "Curriculum", "Enrollments"],
    }),
    deleteIntakePermanently: builder.mutation<PermanentDeleteResult, string>({
      query: (id) => ({ url: `/intakes/${id}`, method: "DELETE" }),
      invalidatesTags: [
        "Courses",
        "Intakes",
        "Sessions",
        "Enrollments",
        "Certificates",
        "Projects",
      ],
    }),
    selfEnrollCourse: builder.mutation<MyEnrollment, string>({
      query: (intakeId) => ({
        url: `/intakes/${intakeId}/enroll`,
        method: "POST",
      }),
      invalidatesTags: ["Services", "Enrollments"],
    }),
  }),
});

export const {
  useGetPublicLearningServicesQuery,
  useGetPublicCoursesForServiceQuery,
  useGetPublicExploreQuery,
  useGetAdminLearningServiceSummariesQuery,
  useGetLearningServiceQuery,
  useCreateLearningServiceMutation,
  useUpdateLearningServiceMutation,
  useTransitionLearningServiceMutation,
  useDeleteLearningServiceMutation,
  useGetCoursesQuery,
  useGetCourseQuery,
  useLazyGetCourseDeletionImpactQuery,
  useGetCourseAnalyticsQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  usePublishCourseMutation,
  useUnpublishCourseMutation,
  useArchiveCourseMutation,
  useUnarchiveCourseMutation,
  useDeleteCourseMutation,
  useGetIntakesQuery,
  useGetCourseIntakesQuery,
  useGetIntakeDefaultsQuery,
  useCreateIntakeMutation,
  useGetIntakeQuery,
  useLazyGetIntakeDeletionImpactQuery,
  useGetIntakeAnalyticsQuery,
  useUpdateIntakeMutation,
  useUpdateIntakeStatusMutation,
  useDeleteIntakePermanentlyMutation,
  useSelfEnrollCourseMutation,
} = catalogApi;
