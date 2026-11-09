import { baseApi } from "@/store/baseApi";
import type { UserRecord, UsersResponse, GetUsersParams, UserDetail } from "./usersTypes";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, GetUsersParams | void>({
      query: (params?: GetUsersParams | undefined) => ({
        url: "/users",
        params,
      }),
      providesTags: ["Users"],
    }),
    getUserDetail: builder.query<UserDetail, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),
    promoteUser: builder.mutation<UserRecord, string>({
      query: (id) => ({
        url: `/users/${id}/promote`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => ["Users", { type: "Users", id }],
    }),
    demoteUser: builder.mutation<UserRecord, string>({
      query: (id) => ({
        url: `/users/${id}/demote`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => ["Users", { type: "Users", id }],
    }),
    // Super admins: end every session, suspend, reactivate (code review M10-05).
    setUserAccess: builder.mutation<UserRecord, { id: string; action: "revoke-sessions" | "suspend" | "reactivate" }>({
      query: ({ id, action }) => ({ url: `/users/${id}/${action}`, method: "POST" }),
      invalidatesTags: (_result, _error, { id }) => ["Users", { type: "Users", id }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserDetailQuery,
  usePromoteUserMutation,
  useDemoteUserMutation,
  useSetUserAccessMutation,
} = usersApi;
