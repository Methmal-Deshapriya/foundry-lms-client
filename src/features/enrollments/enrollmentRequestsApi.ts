import { baseApi } from "@/store/baseApi";
import type { ClassRosterEntry } from "./enrollmentsTypes";
import type {
  CreateEnrollmentRequestBody,
  EnrollFromRequestBody,
  EnrollmentRequest,
  EnrollmentRequestPage,
  EnrollmentRequestParams,
  EnrollmentRequestStatus,
} from "./enrollmentRequestsTypes";

export const enrollmentRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createEnrollmentRequest: builder.mutation<
      EnrollmentRequest,
      { courseId: string; body: CreateEnrollmentRequestBody }
    >({
      query: ({ courseId, body }) => ({
        url: `/courses/${courseId}/enrollment-requests`,
        method: "POST",
        body,
      }),
    }),
    getIntakeEnrollmentRequests: builder.query<
      EnrollmentRequestPage,
      { intakeId: string } & EnrollmentRequestParams
    >({
      query: ({ intakeId, ...params }) => ({
        url: `/intakes/${intakeId}/enrollment-requests`,
        params,
      }),
      providesTags: (_result, _error, { intakeId }) => [
        { type: "EnrollmentRequests", id: `INTAKE-${intakeId}` },
      ],
    }),
    getEnrollmentRequest: builder.query<EnrollmentRequest, string>({
      query: (id) => `/enrollment-requests/${id}`,
      providesTags: (_result, _error, id) => [{ type: "EnrollmentRequests", id }],
    }),
    updateEnrollmentRequestStatus: builder.mutation<
      EnrollmentRequest,
      // PENDING reopens a Declined request rather than forcing a resubmission.
      { id: string; status: Extract<EnrollmentRequestStatus, "CONTACTED" | "DECLINED" | "PENDING"> }
    >({
      query: ({ id, status }) => ({
        url: `/enrollment-requests/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "EnrollmentRequests", id },
        "EnrollmentRequests",
      ],
    }),
    enrollFromRequest: builder.mutation<
      { request: EnrollmentRequest; enrollment: ClassRosterEntry },
      { id: string; body: EnrollFromRequestBody }
    >({
      query: ({ id, body }) => ({
        url: `/enrollment-requests/${id}/enroll`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "EnrollmentRequests", id },
        "EnrollmentRequests",
        "Enrollments",
        "Intakes",
        "Services",
        "Courses",
        "Payments",
        "Partners",
      ],
    }),
  }),
});

export const {
  useCreateEnrollmentRequestMutation,
  useGetIntakeEnrollmentRequestsQuery,
  useGetEnrollmentRequestQuery,
  useUpdateEnrollmentRequestStatusMutation,
  useEnrollFromRequestMutation,
} = enrollmentRequestsApi;
