import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { toNormalizedApiError, type NormalizedApiError, type ApiSuccess } from "@/lib/api";
import { clearUser } from "@/features/auth/authSlice";

// Auth endpoints whose 401 is a normal answer the calling form handles
// itself (wrong password, wrong code) or that AuthInitializer already
// handles (/auth/me at start-up). Any other 401 means the session died.
const SESSION_401_EXEMPT = ["/auth/login", "/auth/verify-", "/auth/me", "/auth/logout"];

function requestPath(args: string | FetchArgs) {
  return typeof args === "string" ? args : args.url;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
});

/**
 * Enhanced Base Query
 * 
 * 1. Automatically unwraps successful backend responses { success: true, data: T } 
 *    to return just T to the calling hook.
 * 2. Standardizes and normalizes error responses using toNormalizedApiError.
 */
const baseQueryWithGlobalHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  NormalizedApiError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  // --- Handle Errors ---
  if (result.error) {
    const error = result.error as FetchBaseQueryError & {
      error?: string;
      data?: unknown;
    };

    // The session ended while the app was open (expired after 24 h, signed
    // out on another device, password changed or reset, role changed). The
    // server has already cleared the cookie; drop the signed-in state and
    // cached data so AuthenticatedGuard sends the user to sign in, instead
    // of leaving a dashboard where every action fails.
    const authState = (api.getState() as { auth?: { status?: string } }).auth;
    const path = requestPath(args);
    if (
      error.status === 401 &&
      authState?.status === "authenticated" &&
      !SESSION_401_EXEMPT.some((prefix) => path.startsWith(prefix))
    ) {
      api.dispatch(clearUser());
      api.dispatch(baseApi.util.resetApiState());
      toast.info("Your session has ended. Please sign in again.", { id: "session-ended" });
    }

    return {
      error: toNormalizedApiError(error.status, error.data ?? error.error),
    };
  }

  // --- Handle Success: Global Unwrapping ---
  // The backend always returns { success: true, data: T, message: string }
  const payload = result.data as ApiSuccess<unknown>;
  
  if (payload && payload.success === true && payload.data !== undefined) {
    return { data: payload.data };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithGlobalHandling,
  tagTypes: ["Auth", "Services", "Courses", "Intakes", "Curriculum", "Enrollments", "EnrollmentRequests", "Users", "Audit", "Sessions", "Certificates", "Projects", "Storage", "Profiles", "Payments", "Notifications", "Promotions", "Partners"],
  endpoints: () => ({}),
});
