import { baseApi } from "@/store/baseApi";

export type StoredObjectPurpose =
  | "COURSE_THUMBNAIL"
  | "SESSION_RECORDING"
  | "SESSION_MATERIAL"
  | "PROJECT_THUMBNAIL";

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

export const storageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createUploadIntent: builder.mutation<
      UploadIntent,
      { purpose: StoredObjectPurpose; fileName: string; contentType: string; sizeBytes: number }
    >({
      query: (body) => ({ url: "/storage/uploads", method: "POST", body }),
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
  useCompleteUploadMutation,
  useLazyGetStoredObjectAccessQuery,
} = storageApi;
