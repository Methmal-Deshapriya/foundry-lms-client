import { baseApi } from "@/store/baseApi";
import type {
  MyStudentProfileResponse,
  PublicStudentProfile,
  PublicStudentProfileRedirect,
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
    // Hide the public page (withdraw consent) or show it again — code review
    // M08-01. Hidden reads exactly like "doesn't exist" to the public.
    setProfilePublished: builder.mutation<MyStudentProfileResponse, boolean>({
      query: (published) => ({ url: "/profiles/me/publish", method: published ? "POST" : "DELETE" }),
      invalidatesTags: [{ type: "Profiles", id: "ME" }, "Profiles", { type: "Projects", id: "SHOWCASE" }],
    }),
    getPublicProfile: builder.query<PublicStudentProfile | PublicStudentProfileRedirect, string>({
      query: (slug) => `/profiles/public/${encodeURIComponent(slug)}`,
      providesTags: (_result, _error, slug) => [{ type: "Profiles", id: `PUBLIC-${slug}` }],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useSaveMyProfileMutation,
  useSetProfilePublishedMutation,
  useGetPublicProfileQuery,
} = profilesApi;
