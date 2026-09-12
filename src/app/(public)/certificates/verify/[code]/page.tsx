"use client";

import { use, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { CircleAlert, Download, FileDown, Loader2, ShieldX } from "lucide-react";
import { useVerifyCertificateQuery } from "@/features/certificates/certificatesApi";
import CertificateTemplate from "@/features/certificates/components/CertificateTemplate";
import { Button } from "@/components/ui/button";

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
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-20">
        <p role="status" aria-live="polite" className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Verifying certificate…
        </p>
      </main>
    );
  }

  if (isError || !certificate) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-20">
        <section role="alert" className="w-full rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <CircleAlert className="mx-auto size-10 text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold">Certificate not found</h1>
          <p className="mt-2 text-muted-foreground">
            This code does not match a certificate issued by Foundry Academy.
          </p>
        </section>
      </main>
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
    <main className="mx-auto min-h-[60vh] max-w-4xl px-6 py-20">
      {!isIssued ? (
        <div
          role="status"
          className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"
        >
          <ShieldX className="size-6 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Revoked certificate</p>
            <p className="text-sm opacity-90">
              This credential is retained for verification history but is no longer valid.
            </p>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border shadow-sm" ref={certificateRef}>
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

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Certificate code: <span className="font-mono">{certificate.certificateCode}</span>
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
    </main>
  );
}
