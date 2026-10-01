import { baseApi } from "@/store/baseApi";
import type {
  AdminNotification,
  AdminPromotion,
  EmailQuota,
  NotificationAudience,
  PublicPromotion,
  PublishStatus,
  SaveNotificationRequest,
  SavePromotionRequest,
  StudentNotification,
} from "./notificationsTypes";

type Pagination = { total: number; limit: number; offset: number; hasMore: boolean };
type ListParams = { status?: PublishStatus; q?: string; limit?: number; offset?: number };

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ---- student
    getMyNotifications: builder.query<{ notifications: StudentNotification[]; unreadCount: number }, void>({
      query: () => "/notifications/me",
      providesTags: [{ type: "Notifications", id: "ME" }],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/me/${id}/read`, method: "POST" }),
      invalidatesTags: [{ type: "Notifications", id: "ME" }],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: "/notifications/me/read-all", method: "POST" }),
      invalidatesTags: [{ type: "Notifications", id: "ME" }],
    }),
    dismissNotification: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/me/${id}/dismiss`, method: "POST" }),
      invalidatesTags: [{ type: "Notifications", id: "ME" }],
    }),

    // ---- admin: notifications
    getAdminNotifications: builder.query<{ notifications: AdminNotification[]; pagination: Pagination }, ListParams>({
      query: (params) => ({ url: "/notifications/admin", params }),
      providesTags: ["Notifications"],
    }),
    getAudienceReach: builder.query<{ reach: number }, { audience: NotificationAudience; courseId?: string; intakeId?: string }>({
      query: (params) => ({ url: "/notifications/admin/reach", params }),
    }),
    getEmailQuota: builder.query<EmailQuota, void>({
      query: () => "/notifications/admin/email-quota",
      providesTags: [{ type: "Notifications", id: "QUOTA" }],
    }),
    createNotification: builder.mutation<AdminNotification, SaveNotificationRequest>({
      query: (body) => ({ url: "/notifications/admin", method: "POST", body }),
      invalidatesTags: ["Notifications"],
    }),
    updateNotification: builder.mutation<AdminNotification, { id: string } & SaveNotificationRequest>({
      query: ({ id, ...body }) => ({ url: `/notifications/admin/${id}`, method: "PUT", body }),
      invalidatesTags: ["Notifications"],
    }),
    publishNotification: builder.mutation<AdminNotification, { id: string; sendEmail?: boolean }>({
      query: ({ id, sendEmail }) => ({ url: `/notifications/admin/${id}/publish`, method: "POST", body: { sendEmail: Boolean(sendEmail) } }),
      invalidatesTags: ["Notifications"],
    }),
    archiveNotification: builder.mutation<AdminNotification, string>({
      query: (id) => ({ url: `/notifications/admin/${id}/archive`, method: "POST" }),
      invalidatesTags: ["Notifications"],
    }),
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/admin/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notifications"],
    }),

    // ---- "Notify me when it opens"
    getCourseInterest: builder.query<{ interested: boolean }, string>({
      query: (courseId) => `/notifications/interests/${courseId}`,
      providesTags: (_result, _error, courseId) => [{ type: "Notifications", id: `INTEREST-${courseId}` }],
    }),
    setCourseInterest: builder.mutation<{ interested: boolean }, { courseId: string; interested: boolean }>({
      query: ({ courseId, interested }) => ({ url: `/notifications/interests/${courseId}`, method: interested ? "POST" : "DELETE" }),
      invalidatesTags: (_result, _error, { courseId }) => [{ type: "Notifications", id: `INTEREST-${courseId}` }],
    }),
    getCourseInterestCount: builder.query<{ count: number }, string>({
      query: (courseId) => `/notifications/admin/interests/${courseId}`,
    }),

    // ---- promotions
    getActivePromotion: builder.query<PublicPromotion | null, void>({
      query: () => "/notifications/promotions/active",
      // With no live promotion the server sends no `data`, and baseApi then
      // passes the whole { success, message } envelope through — treat
      // anything that isn't a promotion as "none".
      transformResponse: (response: unknown) =>
        response && typeof response === "object" && "headline" in response ? (response as PublicPromotion) : null,
      providesTags: [{ type: "Promotions", id: "ACTIVE" }],
    }),
    getAdminPromotions: builder.query<{ promotions: AdminPromotion[]; pagination: Pagination }, ListParams>({
      query: (params) => ({ url: "/notifications/admin/promotions", params }),
      providesTags: ["Promotions"],
    }),
    createPromotion: builder.mutation<AdminPromotion, SavePromotionRequest>({
      query: (body) => ({ url: "/notifications/admin/promotions", method: "POST", body }),
      invalidatesTags: ["Promotions"],
    }),
    updatePromotion: builder.mutation<AdminPromotion, { id: string } & SavePromotionRequest>({
      query: ({ id, ...body }) => ({ url: `/notifications/admin/promotions/${id}`, method: "PUT", body }),
      invalidatesTags: ["Promotions"],
    }),
    publishPromotion: builder.mutation<AdminPromotion, string>({
      query: (id) => ({ url: `/notifications/admin/promotions/${id}/publish`, method: "POST" }),
      invalidatesTags: ["Promotions"],
    }),
    archivePromotion: builder.mutation<AdminPromotion, string>({
      query: (id) => ({ url: `/notifications/admin/promotions/${id}/archive`, method: "POST" }),
      invalidatesTags: ["Promotions"],
    }),
    deletePromotion: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/admin/promotions/${id}`, method: "DELETE" }),
      invalidatesTags: ["Promotions"],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDismissNotificationMutation,
  useGetAdminNotificationsQuery,
  useGetAudienceReachQuery,
  useGetEmailQuotaQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  usePublishNotificationMutation,
  useArchiveNotificationMutation,
  useDeleteNotificationMutation,
  useGetCourseInterestQuery,
  useSetCourseInterestMutation,
  useGetCourseInterestCountQuery,
  useGetActivePromotionQuery,
  useGetAdminPromotionsQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  usePublishPromotionMutation,
  useArchivePromotionMutation,
  useDeletePromotionMutation,
} = notificationsApi;
