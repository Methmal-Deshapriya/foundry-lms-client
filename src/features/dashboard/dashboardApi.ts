import { baseApi } from "@/store/baseApi";
import type { AdminDashboardQuery, AdminDashboardSummary, StudentDashboardSummary } from "./dashboardTypes";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudentDashboard: builder.query<StudentDashboardSummary, void>({
      query: () => "/dashboard/student",
      // The bare "Enrollments" tag alone would miss updates: completing a
      // session on the classroom page only invalidates that one
      // enrollment's PROGRESS-{id}/CLASSROOM-{id} tags (see sessionsApi.ts),
      // not the generic tag — so this dashboard's own progress numbers and
      // "continue learning" pointer need to subscribe to those same
      // per-enrollment tags to stay live.
      providesTags: (result) => [
        "Enrollments",
        "Certificates",
        // recentActivity can include a project review decision — reviewProject
        // only invalidates {Projects, id} and {Projects, id:"MY"}, not a bare
        // "Projects" tag, so this needs the same scoped tag to stay live.
        { type: "Projects", id: "MY" },
        ...(result?.recentEnrollments.flatMap((enrollment) => [
          { type: "Enrollments" as const, id: `PROGRESS-${enrollment.id}` },
          { type: "Enrollments" as const, id: `CLASSROOM-${enrollment.id}` },
        ]) ?? []),
      ],
    }),
    getAdminDashboard: builder.query<AdminDashboardSummary, AdminDashboardQuery | void>({
      query: (params) => ({ url: "/dashboard/admin", params: params || undefined }),
      // pendingProjectReviews/projectStatusBreakdown need the same scoped
      // tag reviewProject actually invalidates — a bare "Projects" tag
      // would miss it, same reasoning as the student dashboard above.
      providesTags: [
        "Enrollments",
        "EnrollmentRequests",
        "Certificates",
        "Users",
        { type: "Projects", id: "ADMIN-LIST" },
      ],
    }),
  }),
});

export const { useGetStudentDashboardQuery, useGetAdminDashboardQuery } = dashboardApi;
