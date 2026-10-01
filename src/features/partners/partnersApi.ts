import { baseApi } from "@/store/baseApi";
import type { PaymentMethod } from "@/features/payments/paymentsTypes";
import type { EarningsOverview, Expense, ExpenseCategory, IntakeEarningsRow, Pagination, Partner, Payout, ShareSet } from "./partnersTypes";

type Range = { from?: string; to?: string };

export const partnersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEarningsOverview: builder.query<EarningsOverview, Range>({
      query: (params) => ({ url: "/partner-earnings/overview", params }),
      providesTags: ["Partners"],
    }),
    getEarningsByIntake: builder.query<{ partners: Partner[]; rows: IntakeEarningsRow[] }, Range>({
      query: (params) => ({ url: "/partner-earnings/by-intake", params }),
      providesTags: ["Partners"],
    }),
    getShares: builder.query<{ partners: Partner[]; shareSets: ShareSet[] }, void>({
      query: () => "/partner-earnings/shares",
      providesTags: ["Partners"],
    }),
    createShareSet: builder.mutation<{ partners: Partner[]; shareSets: ShareSet[] }, { effectiveFrom: string; note?: string | null; entries: { partnerId: string; percent: number }[] }>({
      query: (body) => ({ url: "/partner-earnings/shares", method: "POST", body }),
      invalidatesTags: ["Partners"],
    }),
    getExpenses: builder.query<{ expenses: Expense[]; sum: number; pagination: Pagination }, Range & { category?: ExpenseCategory; intakeId?: string; limit?: number; offset?: number }>({
      query: (params) => ({ url: "/partner-earnings/expenses", params }),
      providesTags: ["Partners"],
    }),
    getExpense: builder.query<Expense, string>({
      query: (id) => `/partner-earnings/expenses/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Partners", id }],
    }),
    createExpense: builder.mutation<
      Expense,
      { spentAt: string; amount: number; category: ExpenseCategory; description?: string | null; intakeId?: string | null; paidByPartnerId?: string | null; receiptObjectId?: string | null }
    >({
      query: (body) => ({ url: "/partner-earnings/expenses", method: "POST", body }),
      invalidatesTags: ["Partners"],
    }),
    reverseExpense: builder.mutation<Expense, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/partner-earnings/expenses/${id}/reverse`, method: "POST", body: { reason } }),
      invalidatesTags: ["Partners"],
    }),
    getPayouts: builder.query<{ payouts: Payout[]; pagination: Pagination }, Range & { partnerId?: string; limit?: number; offset?: number }>({
      query: (params) => ({ url: "/partner-earnings/payouts", params }),
      providesTags: ["Partners"],
    }),
    createPayout: builder.mutation<{ id: string }, { partnerId: string; amount: number; paidAt: string; method?: PaymentMethod | null; reference?: string | null; note?: string | null }>({
      query: (body) => ({ url: "/partner-earnings/payouts", method: "POST", body }),
      invalidatesTags: ["Partners"],
    }),
    reversePayout: builder.mutation<{ id: string }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/partner-earnings/payouts/${id}/reverse`, method: "POST", body: { reason } }),
      invalidatesTags: ["Partners"],
    }),
  }),
});

export const {
  useGetEarningsOverviewQuery,
  useGetEarningsByIntakeQuery,
  useGetSharesQuery,
  useCreateShareSetMutation,
  useGetExpensesQuery,
  useLazyGetExpensesQuery,
  useGetExpenseQuery,
  useCreateExpenseMutation,
  useReverseExpenseMutation,
  useGetPayoutsQuery,
  useCreatePayoutMutation,
  useReversePayoutMutation,
} = partnersApi;
