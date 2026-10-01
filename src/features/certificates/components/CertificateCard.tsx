import Link from "next/link";
import { format } from "date-fns";
import { Linkedin } from "lucide-react";
import { getLinkedInAddCertificationUrl } from "@/lib/linkedin";
import type { Certificate } from "../certificatesTypes";
import CertificateTemplate from "./CertificateTemplate";
import { CertificateThumbnail } from "./CertificateThumbnail";

export function CertificateCard({ certificate }: { certificate: Certificate }) {
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/certificates/verify/${certificate.certificateCode}`
      : "";
  const isIssued = certificate.status === "ISSUED";

  return (
    // Not one big link: the footer holds its own "Add to LinkedIn" link, and
    // links can't be nested. The certificate itself opens the verify page.
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:border-zinc-400 hover:shadow-lg">
      <Link href={`/certificates/verify/${certificate.certificateCode}`} aria-label={`Open ${certificate.courseName} certificate`}>
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
      <div className="flex items-center justify-between gap-3 border-t border-border p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground" title={certificate.courseName}>
            {certificate.courseName}
          </p>
          <p className="text-xs text-muted-foreground">
            {isIssued ? `Issued ${format(new Date(certificate.issuedDate), "MMM d, yyyy")}` : "Revoked"}
          </p>
        </div>
        {isIssued && verifyUrl ? (
          <a
            href={getLinkedInAddCertificationUrl({
              courseName: certificate.courseName,
              issuedDate: certificate.issuedDate,
              certificateCode: certificate.certificateCode,
              verifyUrl,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-[#0A66C2] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#004182]"
          >
            <Linkedin className="size-3.5" aria-hidden="true" />
            Add to LinkedIn
          </a>
        ) : null}
      </div>
    </div>
  );
}
