import { baseApi } from "@/store/baseApi";

export type StoredObjectPurpose =
  | "COURSE_THUMBNAIL"
  | "SESSION_RECORDING"
  | "SESSION_MATERIAL"
  | "PROJECT_THUMBNAIL"
  | "SERVICE_HERO"
  | "SERVICE_CARD"
  | "COURSE_EXPLAINER_VIDEO_THUMBNAIL"
  | "STUDENT_AVATAR"
  | "PAYMENT_PROOF"
  | "PROMOTION_IMAGE"
  | "EXPENSE_RECEIPT";

export interface StoredObjectSummary {
  id: string;
  purpose: StoredObjectPurpose;
  scope: "PUBLIC" | "PRIVATE";
  status: "PENDING" | "READY" | "FAILED";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  publicUrl: string | null;
  readyAt: string | null;
  createdAt: string;
}

interface UploadIntent {
  object: StoredObjectSummary;
  upload: {
    method: "PUT";
    url: string;
    headers: Record<string, string>;
    expiresAt: string;
  };
}

export interface StorageCleanupResult {
  dryRun: boolean;
  count: number;
  totalBytes: number;
  hasMore: boolean;
  deleted?: number;
  failed?: number;
  objects?: { id: string; purpose: string; status: string; fileName: string; sizeBytes: number; createdAt: string }[];
}

export const storageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createUploadIntent: builder.mutation<
      UploadIntent,
      { purpose: StoredObjectPurpose; fileName: string; contentType: string; sizeBytes: number }
    >({
      query: (body) => ({ url: "/storage/uploads", method: "POST", body }),
    }),
    runStorageCleanup: builder.mutation<StorageCleanupResult, { dryRun: boolean }>({
      query: (body) => ({ url: "/storage/cleanup", method: "POST", body }),
    }),
    completeUpload: builder.mutation<StoredObjectSummary, string>({
      query: (id) => ({ url: `/storage/uploads/${id}/complete`, method: "POST" }),
      invalidatesTags: ["Storage"],
    }),
    getStoredObjectAccess: builder.query<{ object: StoredObjectSummary; url: string }, string>({
      query: (id) => `/storage/objects/${id}/access`,
      providesTags: (_result, _error, id) => [{ type: "Storage", id }],
    }),
  }),
});

export const {
  useCreateUploadIntentMutation,
  useRunStorageCleanupMutation,
  useCompleteUploadMutation,
  useLazyGetStoredObjectAccessQuery,
} = storageApi;
