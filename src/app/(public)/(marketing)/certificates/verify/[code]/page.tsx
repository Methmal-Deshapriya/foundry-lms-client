"use client";

import { use, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { CircleAlert, Download, FileDown, Loader2, ShieldX } from "lucide-react";
import { useVerifyCertificateQuery } from "@/features/certificates/certificatesApi";
import CertificateTemplate from "@/features/certificates/components/CertificateTemplate";
import { LoadingStatus } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { CertificateThumbnail } from "@/features/certificates/components/CertificateThumbnail";

const primaryButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#191919] px-4 font-alt text-sm font-medium text-white transition-colors hover:bg-[#27272A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191919] disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 font-alt text-sm font-medium text-[#191919] transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191919] disabled:cursor-not-allowed disabled:opacity-60";

// Same visual language as the public marketing/onboarding pages (see
// (public)/page.tsx / WelcomeSlide.tsx) — this is a public-site page, not a
// dashboard one, so it uses that hand-rolled palette (#0E1116/#5B6472,
// blue accent, font-alt) rather than the dashboard's shadcn tokens. The
// certificate itself is untouched — only this page's chrome.
export default function PublicCertificateVerificationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { data: certificate, isLoading, isError } = useVerifyCertificateQuery(code);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<"png" | "pdf" | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-white px-3 py-16 sm:px-6">
        <LoadingStatus label="Verifying certificate…" />
        <div className="w-full max-w-4xl" aria-hidden="true">
          <Skeleton className="aspect-[1.414] w-full rounded-2xl" />
          <div className="mt-6 flex justify-end gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !certificate) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-white px-3 sm:px-6">
        <section
          role="alert"
          className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
          <CircleAlert className="mx-auto size-10 text-red-500" aria-hidden="true" />
          <h1 className="mt-4 font-sans text-2xl font-bold text-[#0E1116]">
            Certificate not found
          </h1>
          <p className="mt-2 font-alt text-[#5B6472]">
            This code does not match a certificate issued by Foundry Academy.
          </p>
        </section>
      </div>
    );
  }

  const isIssued = certificate.status === "ISSUED";
  const verifyUrl =
    typeof window !== "undefined" ? `${window.location.origin}/certificates/verify/${code}` : "";

  const captureCertificatePng = async () => {
    if (!certificateRef.current) return null;
    // pixelRatio 3: the on-screen card is a few hundred px wide, but a
    // downloaded/printed certificate needs to hold up at a much larger
    // size — this renders at ~3x resolution before export.
    return toPng(certificateRef.current, { pixelRatio: 3, cacheBust: true });
  };

  const handleDownloadPng = async () => {
    setIsExporting("png");
    try {
      const dataUrl = await captureCertificatePng();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${certificate.certificateCode}.png`;
      link.click();
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting("pdf");
    try {
      const dataUrl = await captureCertificatePng();
      if (!dataUrl || !certificateRef.current) return;
      // offsetWidth/Height, not getBoundingClientRect(): the latter includes
      // the on-screen scale transform, so a phone would get a tiny PDF page.
      const width = certificateRef.current.offsetWidth;
      const height = certificateRef.current.offsetHeight;
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [width, height],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      pdf.save(`${certificate.certificateCode}.pdf`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-white px-3 py-16 sm:px-6">
      <div className="w-full max-w-4xl">
        {!isIssued ? (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            <ShieldX className="size-6 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-alt font-semibold">Revoked certificate</p>
              <p className="font-alt text-sm opacity-90">
                This credential is retained for verification history but is no longer valid.
              </p>
            </div>
          </div>
        ) : null}

        {/* CertificateThumbnail renders the template at its fixed design
            width and scales it to fit — its fixed rem type otherwise piles up
            and clips when squeezed onto a phone. The ref sits on the
            untransformed inner node, so exports are always the full-size
            certificate regardless of the viewer's screen width. */}
        <div className="overflow-hidden rounded-2xl shadow-2xl">
          <CertificateThumbnail>
            <div ref={certificateRef}>
              <CertificateTemplate
                studentName={certificate.studentName}
                courseName={certificate.courseName}
                description={certificate.description}
                issuedDate={certificate.issuedDate}
                certificateCode={certificate.certificateCode}
                skills={certificate.skills}
                verifyUrl={verifyUrl}
              />
            </div>
          </CertificateThumbnail>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={handleDownloadPng}
              disabled={isExporting !== null}
            >
              {isExporting === "png" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              Download PNG
            </button>
            <button
              type="button"
              className={primaryButtonClassName}
              onClick={handleDownloadPdf}
              disabled={isExporting !== null}
            >
              {isExporting === "pdf" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileDown className="size-4" aria-hidden="true" />
              )}
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
