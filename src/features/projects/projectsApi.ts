import { baseApi } from "@/store/baseApi";
import type {
  ProjectStatus,
  StudentProject,
  SubmitProjectRequest,
  UpdateProjectRequest,
  ReviewProjectRequest,
} from "./projectsTypes";

export type ProjectPage = {
  projects: StudentProject[];
  nextCursor: string | null;
};

export interface ProjectAdminSummary {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

// Same dual-mode shape as certificates: cursor mode (nextCursor set,
// pagination absent) for the global admin page, or offset mode
// (pagination set, nextCursor absent) for the course workspace's
// Projects tab — selected by which params the caller sends.
export type ProjectAdminPage = {
  projects: StudentProject[];
  summary: ProjectAdminSummary;
  nextCursor?: string | null;
  pagination?: { total: number; limit: number; offset: number; hasMore: boolean };
};

export type ProjectPageQuery = { cursor?: string; limit?: number };
export type ProjectAdminPageQuery = ProjectPageQuery & {
  q?: string;
  intakeId?: string;
  status?: ProjectStatus;
  offset?: number;
};

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public: Get showcase projects
    getPublicShowcase: builder.query<ProjectPage, ProjectPageQuery | void>({
      query: (params) => ({ url: "projects/showcase", params: params || undefined }),
      providesTags: (result) => [
        { type: "Projects", id: "SHOWCASE" },
        ...(result ? result.projects.map((p) => ({ type: "Projects" as const, id: p.id })) : []),
      ],
    }),

    // Student: Get my projects
    getMyProjects: builder.query<ProjectPage, ProjectPageQuery | void>({
      query: (params) => ({ url: "projects/my", params: params || undefined }),
      providesTags: (result) => [
        { type: "Projects", id: "MY" },
        ...(result ? result.projects.map((p) => ({ type: "Projects" as const, id: p.id })) : []),
      ],
    }),

    // Admin: Get all projects
    getAllProjectsAdmin: builder.query<ProjectAdminPage, ProjectAdminPageQuery | void>({
      query: (params) => ({ url: "projects/admin/all", params: params || undefined }),
      providesTags: (result) => [
        { type: "Projects", id: "ADMIN-LIST" },
        ...(result ? result.projects.map((p) => ({ type: "Projects" as const, id: p.id })) : []),
      ],
    }),

    // Admin, Student, Public: Get project details
    getProjectDetails: builder.query<StudentProject, string>({
      query: (id) => `projects/${id}`,
      providesTags: (result, error, id) => [{ type: "Projects", id }],
    }),

    // Public: Get showcase project details
    getPublicProjectDetails: builder.query<StudentProject, string>({
      query: (id) => `projects/showcase/${id}`,
      providesTags: (result, error, id) => [{ type: "Projects", id }],
    }),

    // Student: Submit project
    submitProject: builder.mutation<StudentProject, SubmitProjectRequest>({
      query: (data) => ({
        url: "projects",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Projects", id: "MY" }, { type: "Projects", id: "ADMIN-LIST" }],
    }),

    // Student: Update project
    updateProject: builder.mutation<StudentProject, { id: string; data: UpdateProjectRequest }>({
      query: ({ id, data }) => ({
        url: `projects/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Projects", id },
        { type: "Projects", id: "MY" },
        { type: "Projects", id: "ADMIN-LIST" },
      ],
    }),

    // Student: show or hide one of their own projects on the showcase and
    // their public profile, in any status (code review M08-01).
    setProjectVisibility: builder.mutation<StudentProject, { id: string; isPublic: boolean }>({
      query: ({ id, isPublic }) => ({
        url: `projects/${id}/visibility`,
        method: "PATCH",
        body: { isPublic },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Projects", id },
        { type: "Projects", id: "MY" },
        { type: "Projects", id: "ADMIN-LIST" },
        { type: "Projects", id: "SHOWCASE" },
        // The public profile lists approved public projects, and goes live
        // or offline with them.
        "Profiles",
      ],
    }),

    // Admin: Review project
    reviewProject: builder.mutation<StudentProject, { id: string; data: ReviewProjectRequest }>({
      query: ({ id, data }) => ({
        url: `projects/${id}/review`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Projects", id },
        { type: "Projects", id: "MY" },
        { type: "Projects", id: "ADMIN-LIST" },
        { type: "Projects", id: "SHOWCASE" },
      ],
    }),
  }),
});

export const {
  useGetPublicShowcaseQuery,
  useGetMyProjectsQuery,
  useGetAllProjectsAdminQuery,
  useGetProjectDetailsQuery,
  useGetPublicProjectDetailsQuery,
  useSubmitProjectMutation,
  useUpdateProjectMutation,
  useSetProjectVisibilityMutation,
  useReviewProjectMutation,
} = projectsApi;
