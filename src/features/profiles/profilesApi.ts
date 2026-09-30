import { baseApi } from "@/store/baseApi";
import type {
  MyStudentProfileResponse,
  PublicStudentProfile,
  SaveStudentProfileRequest,
} from "./profilesTypes";

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<MyStudentProfileResponse, void>({
      query: () => "/profiles/me",
      providesTags: [{ type: "Profiles", id: "ME" }],
    }),
    saveMyProfile: builder.mutation<MyStudentProfileResponse, SaveStudentProfileRequest>({
      query: (body) => ({ url: "/profiles/me", method: "PUT", body }),
      // The public page and the showcase's name links read from the profile too.
      invalidatesTags: [{ type: "Profiles", id: "ME" }, "Profiles", { type: "Projects", id: "SHOWCASE" }],
    }),
    getPublicProfile: builder.query<PublicStudentProfile, string>({
      query: (slug) => `/profiles/public/${encodeURIComponent(slug)}`,
      providesTags: (_result, _error, slug) => [{ type: "Profiles", id: `PUBLIC-${slug}` }],
    }),
  }),
});

export const { useGetMyProfileQuery, useSaveMyProfileMutation, useGetPublicProfileQuery } = profilesApi;
