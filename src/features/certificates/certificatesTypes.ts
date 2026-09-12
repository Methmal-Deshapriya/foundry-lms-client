export type CertificateStatus = "ISSUED" | "REVOKED";

export type Certificate = {
  id: string;
  enrollmentId: string;
  certificateCode: string;
  studentName: string;
  courseName: string;
  description?: string | null;
  issuedDate: string;
  status: CertificateStatus;
  revokedAt?: string | null;
  revokedBy?: string | null;
  revocationReason?: string | null;
  certificateData: {
    skills: string[];
    studentEmail: string;
    courseSlug: string;
  };
  snapshotUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicCertificateVerification = {
  studentName: string;
  courseName: string;
  description?: string | null;
  issuedDate: string;
  certificateCode: string;
  status: CertificateStatus;
  skills: string[];
};

export type IssueCertificateRequest = {
  description?: string | null;
  issuedDate?: string;
};

export type RevokeCertificateRequest = {
  revocationReason: string;
};

export interface CertificateAdminSummary {
  all: number;
  issued: number;
  revoked: number;
}

// The same endpoint serves two pagination modes (see certificate.repository.js):
// cursor (nextCursor set, total/offset absent) for the global admin page, or
// offset (total/offset set, nextCursor absent) for the course workspace's
// Certificates tab — selected by which params the caller sends.
export type CertificateAdminPage = {
  certificates: Certificate[];
  summary: CertificateAdminSummary;
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string | null;
    total?: number;
    offset?: number;
  };
};

export type CertificateAdminParams = {
  q?: string;
  status?: CertificateStatus;
  intakeId?: string;
  limit?: number;
  cursor?: string;
  offset?: number;
};

export type MyCertificatesPage = {
  certificates: Certificate[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
};

export type CertificateHistoryParams = { limit?: number; cursor?: string };
