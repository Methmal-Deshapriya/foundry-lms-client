export type ApiSuccess<T> = {
  success: true;
  data?: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  code?: string;
  field?: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorResponse;

export type NormalizedApiError = {
  status: number | "FETCH_ERROR" | "PARSING_ERROR" | "TIMEOUT_ERROR" | "CUSTOM_ERROR";
  message: string;
  code?: string;
  field?: string;
  details?: unknown;
};

export function isNormalizedApiError(
  value: unknown,
): value is NormalizedApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as { message?: unknown }).message === "string"
  );
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isNormalizedApiError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "error" in value &&
    (value as { success?: boolean }).success === false
  );
}

export function toNormalizedApiError(
  status: NormalizedApiError["status"],
  data?: unknown
): NormalizedApiError {
  if (isApiErrorResponse(data)) {
    return {
      status,
      message: data.error,
      code: data.code,
      field: data.field,
      details: data.details,
    };
  }

  if (typeof data === "object" && data !== null && "error" in data) {
    const fallback = data as { error?: unknown; data?: unknown };

    return {
      status,
      message:
        typeof fallback.error === "string"
          ? fallback.error
          : "Something went wrong. Please try again.",
      details: fallback.data,
    };
  }

  return {
    status,
    message: "Something went wrong. Please try again.",
    details: data,
  };
}
