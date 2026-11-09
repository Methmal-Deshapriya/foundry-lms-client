import { baseApi } from "@/store/baseApi";
import type {
  User,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  LoginResult,
  VerifyLoginChallengeRequest,
} from "./authTypes";
import { setUser, clearUser } from "./authSlice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => "/auth/me",
      providesTags: ["Auth"],
    }),
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({
        url: "/users/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    login: builder.mutation<LoginResult, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (!("requiresMfa" in data)) dispatch(setUser(data));
        } catch {
          // Error is handled by normalized error middleware and components
        }
      },
      invalidatesTags: ["Auth"],
    }),
    verifyLoginChallenge: builder.mutation<User, VerifyLoginChallengeRequest>({
      query: (body) => ({
        url: "/auth/verify-login-challenge",
        method: "POST",
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch {
          // Error is rendered by the verification form.
        }
      },
      invalidatesTags: ["Auth"],
    }),
    register: builder.mutation<User, RegisterRequest>({
      // Registering does NOT log the user in — no cookie is set until
      // they verify their email via OTP (see verifyOtp below), so this
      // deliberately does not dispatch setUser.
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearUser());
          dispatch(baseApi.util.resetApiState());
        } catch {
          // Logout failure is rare but we clear user anyway for safety
          dispatch(clearUser());
          dispatch(baseApi.util.resetApiState());
        }
      },
      invalidatesTags: ["Auth"],
    }),
    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),
    changePassword: builder.mutation<User, ChangePasswordRequest>({
      // The server ends every other session and re-issues this browser's
      // cookie, so the user stays signed in here.
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch {
          // Error is handled by the form
        }
      },
    }),
    verifyOtp: builder.mutation<User, VerifyOtpRequest>({
      // This is the real login moment for a newly registered user —
      // the server sets the auth cookie on success, so we mirror
      // login/register's original behavior and dispatch setUser here.
      query: (body) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch {
          // Error is handled by normalized error middleware and components
        }
      },
      invalidatesTags: ["Auth"],
    }),
    resendOtp: builder.mutation<{ message: string }, ResendOtpRequest>({
      query: (body) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateProfileMutation,
  useLoginMutation,
  useVerifyLoginChallengeMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
} = authApi;
