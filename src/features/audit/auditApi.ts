import { baseApi } from "@/store/baseApi";
import type { AuditLogsResponse, AuditLogsParams } from "./auditTypes";

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<AuditLogsResponse, AuditLogsParams>({
      query: (params) => ({
        url: "/audit/logs",
        params,
      }),
      providesTags: ["Audit"],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditApi;
