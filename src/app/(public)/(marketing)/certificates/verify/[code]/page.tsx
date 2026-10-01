import { getCertificateVerification } from "@/lib/publicPages";
import { formatColomboDay } from "@/lib/dates";
import { SITE_NAME, pageMetadata } from "@/lib/seo";
import { PublicCertificateVerificationView } from "./PublicCertificateVerificationView";

type Params = { params: Promise<{ code: string }> };

// Rendered on the server for its metadata, so a certificate shared on
// LinkedIn previews the certificate (code review M08-10). Certificates are
// personal, so they are previewed but not indexed.
export async function generateMetadata({ params }: Params) {
  const { code } = await params;
  const certificate = await getCertificateVerification(code);
  if (!certificate) return { title: `Certificate verification | ${SITE_NAME}`, robots: { index: false } };
  const valid = certificate.status === "ISSUED";
  return {
    ...pageMetadata({
      title: `${certificate.courseName} certificate: ${certificate.studentName}`,
      description: valid
        ? `Verified certificate issued by ${SITE_NAME} to ${certificate.studentName} on ${formatColomboDay(certificate.issuedDate)}.`
        : `This ${SITE_NAME} certificate is no longer valid.`,
      path: `/certificates/verify/${encodeURIComponent(certificate.certificateCode)}`,
    }),
    robots: { index: false },
  };
}

export default async function PublicCertificateVerificationPage({ params }: Params) {
  const { code } = await params;
  return <PublicCertificateVerificationView code={code} />;
}
