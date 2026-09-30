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
      ],
    }),
    completePayment: builder.mutation<ClassRosterEntry, string>({
      query: (id) => ({ url: `/enrollments/${id}/complete-payment`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Enrollments", id },
        "Enrollments",
        "Courses",
      ],
    }),
  }),
});

export const {
  useGetMyEnrollmentsQuery,
  useGetCourseRosterQuery,
  useLazyGetCourseRosterQuery,
  useGetEligibleStudentsQuery,
  useCreateEnrollmentMutation,
  useBulkCreateEnrollmentsMutation,
  useUpdateEnrollmentMutation,
  useCompletePaymentMutation,
} = enrollmentsApi;
