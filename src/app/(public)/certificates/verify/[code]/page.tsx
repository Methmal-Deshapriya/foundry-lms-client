"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { ChevronRight, CircleAlert, Download, FileDown, Loader2, ShieldX } from "lucide-react";
import { useVerifyCertificateQuery } from "@/features/certificates/certificatesApi";
import CertificateTemplate from "@/features/certificates/components/CertificateTemplate";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated } from "@/features/auth/authSelectors";

// The same soft radial-gradient wash used behind the "services"/"how it
// works"/"auth" marketing slides (see (public)/page.tsx's `slides` array) —
// reused verbatim so this page reads as part of the same site, not a
// separate one-off look.
const PAGE_GLOW =
  "radial-gradient(circle at 12% 15%, rgba(199,210,254,0.55), transparent 45%), radial-gradient(circle at 88% 85%, rgba(191,219,254,0.5), transparent 45%), radial-gradient(circle at 50% 45%, rgba(233,213,255,0.35), transparent 55%)";

// Same visual language as the public marketing/onboarding slides (see
// SlideDeck.tsx / WelcomeSlide.tsx) — this is a public-site page, not a
// dashboard one, so it uses that hand-rolled palette (#0E1116/#5B6472,
// blue-600->indigo-500 accent, font-alt) rather than the dashboard's shadcn
// tokens. The certificate itself is untouched — only this page's chrome.
export default function PublicCertificateVerificationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data: certificate, isLoading, isError } = useVerifyCertificateQuery(code);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<"png" | "pdf" | null>(null);

  const goToFoundry = () => {
    router.push(isAuthenticated ? "/dashboard" : "/");
  };

  const GoToFoundryButton = (
    <button
      type="button"
      onClick={goToFoundry}
      className="fixed bottom-4 right-3 z-50 flex items-center gap-1 font-alt text-sm text-[#5B6472] transition-colors hover:text-[#0E1116] sm:bottom-8 sm:right-8 sm:text-base"
    >
      Go to Foundry
      <ChevronRight className="h-4 w-4" />
    </button>
  );

  if (isLoading) {
    return (
      <div
        className="flex min-h-dvh w-full items-center justify-center bg-white px-3 sm:px-6"
        style={{ backgroundImage: PAGE_GLOW }}
      >
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 font-alt text-[#5B6472]"
        >
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Verifying certificate…
        </p>
        {GoToFoundryButton}
      </div>
    );
  }

  if (isError || !certificate) {
    return (
      <div
        className="flex min-h-dvh w-full items-center justify-center bg-white px-3 sm:px-6"
        style={{ backgroundImage: PAGE_GLOW }}
      >
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
        {GoToFoundryButton}
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
      const { width, height } = certificateRef.current.getBoundingClientRect();
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
    <div
      className="flex min-h-dvh w-full items-center justify-center bg-white px-3 py-16 sm:px-6"
      style={{ backgroundImage: PAGE_GLOW }}
    >
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

        <div className="overflow-hidden rounded-2xl shadow-2xl" ref={certificateRef}>
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

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
          <p className="font-alt text-sm text-[#5B6472]">
            Certificate code:{" "}
            <span className="font-mono text-[#0E1116]">{certificate.certificateCode}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPng} disabled={isExporting !== null}>
              {isExporting === "png" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Download PNG
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isExporting !== null}>
              {isExporting === "pdf" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 size-4" />
              )}
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {GoToFoundryButton}
    </div>
  );
}
