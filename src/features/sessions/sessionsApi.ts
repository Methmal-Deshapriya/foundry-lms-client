import { baseApi } from "@/store/baseApi";
import type {
  BulkArchiveSessionsResult,
  CourseSessionDeliveryStatus,
  CourseSession,
  CreateSessionRequest,
  ClassroomResponse,
  ClassroomSession,
  CurriculumResponse,
  EnrollmentProgress,
  LibrarySession,
  SessionCompletionResult,
  SessionStatus,
  UpdateSessionRequest,
} from "./sessionsTypes";

export interface SessionLibrarySummary {
  all: number;
  ready: number;
  draft: number;
  archive: number;
}

interface SessionListResponse {
  sessions: LibrarySession[];
  summary: SessionLibrarySummary;
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessionLibrary: builder.query<
      SessionListResponse,
      {
        q?: string;
        status?: SessionStatus;
        tag?: string;
        attachableIntakeId?: string;
        limit?: number;
        offset?: number;
      } | void
    >({
      query: (params) => ({
        url: "/sessions",
        params: { limit: 20, ...(params || {}) },
      }),
      providesTags: (result) => [
        { type: "Sessions", id: "LIBRARY" },
        ...(result?.sessions.map(({ id }) => ({ type: "Sessions" as const, id })) ?? []),
      ],
    }),
    getSessionDetails: builder.query<LibrarySession, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Sessions", id }],
    }),
    createSession: builder.mutation<LibrarySession, CreateSessionRequest>({
      query: (body) => ({ url: "/sessions", method: "POST", body }),
      invalidatesTags: [{ type: "Sessions", id: "LIBRARY" }],
    }),
    updateSession: builder.mutation<LibrarySession, { id: string; data: UpdateSessionRequest }>({
      query: ({ id, data }) => ({ url: `/sessions/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Sessions", id },
        { type: "Sessions", id: "LIBRARY" },
        "Curriculum",
      ],
    }),
    archiveSession: builder.mutation<LibrarySession, string>({
      query: (id) => ({ url: `/sessions/${id}/archive`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Sessions", id },
        { type: "Sessions", id: "LIBRARY" },
        "Curriculum",
      ],
    }),
    unarchiveSession: builder.mutation<LibrarySession, string>({
      query: (id) => ({ url: `/sessions/${id}/unarchive`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Sessions", id },
        { type: "Sessions", id: "LIBRARY" },
        "Curriculum",
      ],
    }),
    deleteSession: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/sessions/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Sessions", id: "LIBRARY" }],
    }),
    duplicateSession: builder.mutation<LibrarySession, string>({
      query: (id) => ({ url: `/sessions/${id}/duplicate`, method: "POST" }),
      invalidatesTags: [{ type: "Sessions", id: "LIBRARY" }],
    }),
    bulkArchiveSessions: builder.mutation<BulkArchiveSessionsResult, string[]>({
      query: (ids) => ({ url: "/sessions/bulk-archive", method: "POST", body: { ids } }),
      invalidatesTags: (result, _error, ids) => [
        { type: "Sessions", id: "LIBRARY" },
        "Curriculum",
        ...(result?.results ?? ids.map((id) => ({ id }))).map(({ id }) => ({
          type: "Sessions" as const,
          id,
        })),
      ],
    }),
    getCourseCurriculum: builder.query<CurriculumResponse, { intakeId: string; includeRetired?: boolean }>({
      query: ({ intakeId, includeRetired }) => ({
        url: `/intakes/${intakeId}/curriculum`,
        params: { includeRetired: Boolean(includeRetired) },
      }),
      providesTags: (_result, _error, { intakeId }) => [
        { type: "Curriculum", id: intakeId },
      ],
    }),
    attachCourseSession: builder.mutation<
      { courseSession: CourseSession },
      { intakeId: string; sessionId: string; orderIndex?: number }
    >({
      query: ({ intakeId, ...body }) => ({
        url: `/intakes/${intakeId}/curriculum`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { intakeId }) => [
        { type: "Curriculum", id: intakeId },
        { type: "Sessions", id: "LIBRARY" },
        "Intakes",
      ],
    }),
    reorderCourseCurriculum: builder.mutation<
      { success: true },
      {
        intakeId: string;
        courseSessions: { id: string; orderIndex: number }[];
        acknowledgeSequenceRisk?: boolean;
      }
    >({
      query: ({ intakeId, courseSessions, acknowledgeSequenceRisk }) => ({
        url: `/intakes/${intakeId}/curriculum/reorder`,
        method: "PATCH",
        body: { courseSessions, acknowledgeSequenceRisk },
      }),
      invalidatesTags: (_result, _error, { intakeId }) => [
        { type: "Curriculum", id: intakeId },
        "Intakes",
      ],
    }),
    removeCourseSession: builder.mutation<
      { id: string; action: "DETACHED" | "RETIRED" },
      { intakeId: string; courseSessionId: string }
    >({
      query: ({ intakeId, courseSessionId }) => ({
        url: `/intakes/${intakeId}/curriculum/${courseSessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { intakeId }) => [
        { type: "Curriculum", id: intakeId },
        { type: "Sessions", id: "LIBRARY" },
        "Intakes",
      ],
    }),
    updateCourseSessionDelivery: builder.mutation<
      CourseSession,
      {
        intakeId: string;
        courseSessionId: string;
        status: CourseSessionDeliveryStatus;
        availableAt?: string | null;
        acknowledgeSequenceRisk?: boolean;
      }
    >({
      query: ({ intakeId, courseSessionId, ...body }) => ({
        url: `/intakes/${intakeId}/curriculum/${courseSessionId}/delivery`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { intakeId }) => [
        { type: "Curriculum", id: intakeId },
        "Intakes",
      ],
    }),
    getEnrollmentProgress: builder.query<EnrollmentProgress, string>({
      query: (enrollmentId) => `/enrollments/${enrollmentId}/progress`,
      providesTags: (_result, _error, enrollmentId) => [
        { type: "Enrollments", id: `PROGRESS-${enrollmentId}` },
      ],
    }),
    getClassroom: builder.query<ClassroomResponse, string>({
      query: (enrollmentId) => `/enrollments/${enrollmentId}/classroom`,
      providesTags: (_result, _error, enrollmentId) => [
        { type: "Enrollments", id: `CLASSROOM-${enrollmentId}` },
      ],
    }),
    getClassroomSession: builder.query<
      ClassroomSession,
      { enrollmentId: string; courseSessionId: string }
    >({
      query: ({ enrollmentId, courseSessionId }) =>
        `/enrollments/${enrollmentId}/sessions/${courseSessionId}`,
      providesTags: (_result, _error, { enrollmentId, courseSessionId }) => [
        { type: "Enrollments", id: `CLASSROOM-${enrollmentId}` },
        { type: "Sessions", id: courseSessionId },
      ],
    }),
    completeClassroomSession: builder.mutation<
      SessionCompletionResult,
      { enrollmentId: string; courseSessionId: string }
    >({
      query: ({ enrollmentId, courseSessionId }) => ({
        url: `/enrollments/${enrollmentId}/sessions/${courseSessionId}/complete`,
        method: "POST",
      }),
      // Bare "Enrollments" too: My Courses' progress bars come from
      // getMyEnrollments, which an id'd tag alone doesn't reach (M07-06).
      invalidatesTags: (_result, _error, { enrollmentId }) => [
        { type: "Enrollments", id: `CLASSROOM-${enrollmentId}` },
        { type: "Enrollments", id: `PROGRESS-${enrollmentId}` },
        "Enrollments",
      ],
    }),
    uncompleteClassroomSession: builder.mutation<
      { success: true; removed: boolean },
      { enrollmentId: string; courseSessionId: string }
    >({
      query: ({ enrollmentId, courseSessionId }) => ({
        url: `/enrollments/${enrollmentId}/sessions/${courseSessionId}/complete`,
        method: "DELETE",
      }),
      // Bare "Enrollments" too: My Courses' progress bars come from
      // getMyEnrollments, which an id'd tag alone doesn't reach (M07-06).
      invalidatesTags: (_result, _error, { enrollmentId }) => [
        { type: "Enrollments", id: `CLASSROOM-${enrollmentId}` },
        { type: "Enrollments", id: `PROGRESS-${enrollmentId}` },
        "Enrollments",
      ],
    }),
  }),
});

export const {
  useGetSessionLibraryQuery,
  useGetSessionDetailsQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useArchiveSessionMutation,
  useUnarchiveSessionMutation,
  useDeleteSessionMutation,
  useDuplicateSessionMutation,
  useBulkArchiveSessionsMutation,
  useGetCourseCurriculumQuery,
  useAttachCourseSessionMutation,
  useReorderCourseCurriculumMutation,
  useRemoveCourseSessionMutation,
  useUpdateCourseSessionDeliveryMutation,
  useGetEnrollmentProgressQuery,
  useGetClassroomQuery,
  useGetClassroomSessionQuery,
  useCompleteClassroomSessionMutation,
  useUncompleteClassroomSessionMutation,
} = sessionsApi;
