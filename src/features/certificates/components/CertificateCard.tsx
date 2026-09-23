import Link from "next/link";
import type { Certificate } from "../certificatesTypes";
import CertificateTemplate from "./CertificateTemplate";
import { CertificateThumbnail } from "./CertificateThumbnail";

export function CertificateCard({ certificate }: { certificate: Certificate }) {
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/certificates/verify/${certificate.certificateCode}`
      : "";

  return (
    <Link
      href={`/certificates/verify/${certificate.certificateCode}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-lg"
    >
      <CertificateThumbnail>
        <CertificateTemplate
          studentName={certificate.studentName}
          courseName={certificate.courseName}
          description={certificate.description}
          issuedDate={certificate.issuedDate}
          certificateCode={certificate.certificateCode}
          skills={certificate.certificateData.skills}
          verifyUrl={verifyUrl}
        />
      </CertificateThumbnail>
    </Link>
  );
}
