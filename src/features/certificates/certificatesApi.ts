import { baseApi } from "@/store/baseApi";
import type {
  Certificate,
  PublicCertificateVerification,
  IssueCertificateRequest,
  RevokeCertificateRequest,
  CertificateAdminPage,
  CertificateAdminParams,
  CertificateHistoryParams,
  MyCertificatesPage,
} from "./certificatesTypes";

export const certificatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public: Verify certificate
    verifyCertificate: builder.query<PublicCertificateVerification, string>({
      query: (code) => `certificates/verify/${code}`,
    }),

    // Student: Get my certificates
    getMyCertificates: builder.query<MyCertificatesPage, CertificateHistoryParams | void>({
      query: (params) => ({ url: "certificates/my", params: params ?? {} }),
      providesTags: (result) => [
        { type: "Certificates", id: "MY" },
        ...(result ? result.certificates.map((c) => ({ type: "Certificates" as const, id: c.id })) : []),
      ],
    }),

    // Admin: Get all certificates
    getAllCertificatesAdmin: builder.query<CertificateAdminPage, CertificateAdminParams | void>({
      query: (params) => ({ url: "certificates/admin", params: params ?? {} }),
      providesTags: (result) => [
        { type: "Certificates", id: "ADMIN-LIST" },
        ...(result ? result.certificates.map((c) => ({ type: "Certificates" as const, id: c.id })) : []),
      ],
    }),

    // Admin & Student: Get certificate details
    getCertificateDetails: builder.query<Certificate, string>({
      query: (id) => `certificates/${id}`,
      providesTags: (result, error, id) => [{ type: "Certificates", id }],
    }),

    // Admin: Issue certificate
    issueCertificate: builder.mutation<Certificate, { enrollmentId: string; data: IssueCertificateRequest }>({
      query: ({ enrollmentId, data }) => ({
        url: `enrollments/${enrollmentId}/certificate`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Certificates", "Enrollments"],
    }),

    // Admin: Revoke certificate
    revokeCertificate: builder.mutation<Certificate, { id: string; data: RevokeCertificateRequest }>({
      query: ({ id, data }) => ({
        url: `certificates/${id}/revoke`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Certificates", id },
        { type: "Certificates", id: "ADMIN-LIST" },
        { type: "Certificates", id: "MY" },
      ],
    }),
  }),
});

export const {
  useVerifyCertificateQuery,
  useGetMyCertificatesQuery,
  useGetAllCertificatesAdminQuery,
  useGetCertificateDetailsQuery,
  useIssueCertificateMutation,
  useRevokeCertificateMutation,
} = certificatesApi;
