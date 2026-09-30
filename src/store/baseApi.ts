import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/lib/constants";
import { toNormalizedApiError, type NormalizedApiError, type ApiSuccess } from "@/lib/api";

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
  tagTypes: ["Auth", "Services", "Courses", "Intakes", "Curriculum", "Enrollments", "EnrollmentRequests", "Users", "Audit", "Sessions", "Certificates", "Projects", "Storage", "Profiles"],
  endpoints: () => ({}),
});
