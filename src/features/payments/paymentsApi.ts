import { baseApi } from "@/store/baseApi";
import type { LedgerFilters, LedgerPage, MonthlySummary, OutstandingRow, PaymentDetail, PaymentMethod } from "./paymentsTypes";

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLedger: builder.query<LedgerPage, LedgerFilters>({
      query: (params) => ({ url: "/payments", params }),
      providesTags: ["Payments"],
    }),
    getOutstanding: builder.query<{ rows: OutstandingRow[]; total: number }, void>({
      query: () => "/payments/outstanding",
      providesTags: ["Payments"],
    }),
    getMonthlySummary: builder.query<MonthlySummary, number>({
      query: (year) => ({ url: "/payments/summary/monthly", params: { year } }),
      providesTags: ["Payments"],
    }),
    getPayment: builder.query<PaymentDetail, string>({
      query: (id) => `/payments/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Payments", id }],
    }),
    refundPayment: builder.mutation<PaymentDetail, { id: string; amount: number; reason: string; method?: PaymentMethod | null; paidAt?: string }>({
      query: ({ id, ...body }) => ({ url: `/payments/${id}/refund`, method: "POST", body }),
      // Revenue figures elsewhere (dashboards, course analytics) read the same ledger.
      invalidatesTags: ["Payments", "Enrollments", "Courses", "Intakes"],
    }),
    reversePayment: builder.mutation<PaymentDetail, { id: string; reason: string }>({
      query: ({ id, ...body }) => ({ url: `/payments/${id}/reverse`, method: "POST", body }),
      invalidatesTags: ["Payments", "Enrollments", "Courses", "Intakes"],
    }),
    updatePaymentDetails: builder.mutation<
      PaymentDetail,
      { id: string; method?: PaymentMethod | null; paidAt?: string; externalReference?: string | null; proofObjectId?: string | null }
    >({
      query: ({ id, ...body }) => ({ url: `/payments/${id}/details`, method: "PATCH", body }),
      invalidatesTags: ["Payments"],
    }),
  }),
});

export const {
  useGetLedgerQuery,
  useLazyGetLedgerQuery,
  useGetOutstandingQuery,
  useGetMonthlySummaryQuery,
  useGetPaymentQuery,
  useRefundPaymentMutation,
  useReversePaymentMutation,
  useUpdatePaymentDetailsMutation,
} = paymentsApi;
