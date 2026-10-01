import { baseApi } from "@/store/baseApi";
import type {
  BulkEnrollmentResult,
  ClassRosterEntry,
  CreatePaidEnrollmentRequest,
  EligibleStudentsPage,
  EligibleStudentsParams,
  MyEnrollmentsPage,
  RosterPage,
  RosterParams,
  UpdateEnrollmentRequest,
  SelfHistoryParams,
} from "./enrollmentsTypes";

/** A student who hasn't completed a session in the at-risk threshold (14 days). */
export interface AtRiskRow {
  enrollmentId: string;
  student: { id: string; name: string; email: string; phone: string | null };
  course: { id: string; title: string; serviceSlug: string | null };
  intake: { id: string; code: string };
  enrolledAt: string;
  lastCompletedAt: string | null;
  daysInactive: number;
  completedCount: number;
  availableSessionCount: number;
  progressPercent: number;
}

export const enrollmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyEnrollments: builder.query<MyEnrollmentsPage, SelfHistoryParams | void>({
      query: (params) => ({ url: "/enrollments/my", params: params ?? {} }),
      providesTags: ["Enrollments"],
    }),
    getCourseRoster: builder.query<RosterPage, { intakeId: string } & RosterParams>({
      query: ({ intakeId, ...params }) => ({
        url: `/intakes/${intakeId}/enrollments`,
        params,
      }),
      providesTags: (_result, _error, { intakeId }) => [
        { type: "Enrollments", id: `INTAKE-${intakeId}` },
      ],
    }),
    getEligibleStudents: builder.query<EligibleStudentsPage, EligibleStudentsParams>({
      query: ({ intakeId, q, limit = 25, cursor }) => ({
        url: `/intakes/${intakeId}/eligible-students`,
        params: { q, limit, cursor },
      }),
      serializeQueryArgs: ({ endpointName, queryArgs: { intakeId, q } }) =>
        `${endpointName}:${intakeId}:${q ?? ""}`,
      merge: (currentCache, incoming, { arg }) => {
        if (!arg.cursor) return incoming;
        const existingIds = new Set(currentCache.students.map(({ id }) => id));
        currentCache.students.push(
          ...incoming.students.filter(({ id }) => !existingIds.has(id)),
        );
        currentCache.pagination = incoming.pagination;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor,
      providesTags: (_result, _error, { intakeId }) => [
        { type: "Enrollments", id: `ELIGIBLE-${intakeId}` },
      ],
    }),
    createEnrollment: builder.mutation<
      ClassRosterEntry,
      { intakeId: string; data: CreatePaidEnrollmentRequest }
    >({
      query: ({ intakeId, data }) => ({
        url: `/intakes/${intakeId}/enrollments`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { intakeId }) => [
        { type: "Enrollments", id: `INTAKE-${intakeId}` },
        { type: "Enrollments", id: `ELIGIBLE-${intakeId}` },
        "Intakes",
        "Services",
        "Courses",
        // A paid enrollment writes a ledger row (code review M03-19).
        "Payments",
        "Partners",
      ],
    }),
    bulkCreateEnrollments: builder.mutation<
      BulkEnrollmentResult,
      { intakeId: string; students: CreatePaidEnrollmentRequest[] }
    >({
      query: ({ intakeId, students }) => ({
        url: `/intakes/${intakeId}/enrollments/bulk`,
        method: "POST",
        body: { students },
      }),
      invalidatesTags: (_result, _error, { intakeId }) => [
        { type: "Enrollments", id: `INTAKE-${intakeId}` },
        { type: "Enrollments", id: `ELIGIBLE-${intakeId}` },
        "Intakes",
        "Services",
        "Courses",
        // A paid enrollment writes a ledger row (code review M03-19).
        "Payments",
        "Partners",
      ],
    }),
    updateEnrollment: builder.mutation<
      ClassRosterEntry,
      { id: string; data: UpdateEnrollmentRequest }
    >({
      query: ({ id, data }) => ({ url: `/enrollments/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Enrollments", id },
        "Enrollments",
        "Services",
        "Courses",
        // Reactivation can move a refunded enrollment back to "still owes".
        "Payments",
      ],
    }),
    getAtRiskStudents: builder.query<{ thresholdDays: number; rows: AtRiskRow[]; truncated?: boolean }, void>({
      query: () => "/enrollments/at-risk",
      providesTags: ["Enrollments"],
    }),
    completePayment: builder.mutation<
      ClassRosterEntry,
      { id: string; paymentMethod?: "CASH" | "BANK_TRANSFER" | "ONLINE" | "OTHER" | null; externalReference?: string | null }
    >({
      query: ({ id, ...body }) => ({ url: `/enrollments/${id}/complete-payment`, method: "POST", body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Enrollments", id },
        "Enrollments",
        "Courses",
        "Payments",
        "Partners",
      ],
    }),
  }),
});

export const {
  useGetMyEnrollmentsQuery,
  useLazyGetMyEnrollmentsQuery,
  useGetAtRiskStudentsQuery,
  useGetCourseRosterQuery,
  useLazyGetCourseRosterQuery,
  useGetEligibleStudentsQuery,
  useCreateEnrollmentMutation,
  useBulkCreateEnrollmentsMutation,
  useUpdateEnrollmentMutation,
  useCompletePaymentMutation,
} = enrollmentsApi;
