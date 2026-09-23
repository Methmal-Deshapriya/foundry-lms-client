"use client";

import Link from "next/link";
import { Award, Loader2 } from "lucide-react";
import { useGetMyCertificatesQuery } from "@/features/certificates/certificatesApi";
import { CertificateCard } from "@/features/certificates/components/CertificateCard";
import StudentOnlyRoute from "@/components/access/StudentOnlyRoute";
import { Button } from "@/components/ui/button";

export default function MyCertificatesPage() {
  const { data, isLoading, isError } = useGetMyCertificatesQuery({ limit: 20 });
  const certificates = data?.certificates ?? [];

  return (
    <StudentOnlyRoute description="Admins no longer need the student certificate page. Use the admin certificate management screen for issued records.">
      <div className="space-y-6 pb-20">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Certificates</h1>
          <p className="text-sm text-muted-foreground">
            Your official course completion certificates.
          </p>
        </div>

        {isLoading ? (
          <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#191919]" aria-hidden="true" />
            <p className="font-medium text-muted-foreground">Loading your certificates...</p>
          </div>
        ) : isError ? (
          <div role="alert" className="rounded-lg border border-red-100 bg-red-50 p-12 text-center">
            <h2 className="mb-2 text-base font-bold text-red-900">Something went wrong</h2>
            <p className="text-sm text-red-700">Failed to load certificates. Please try again.</p>
          </div>
        ) : certificates.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {certificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background">
              <Award className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mb-1 text-base font-bold text-foreground">No certificates yet</h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
              Complete your enrolled courses and your certificates will appear here once issued.
            </p>
            <Button asChild size="sm">
              <Link href="/my-courses">Go to My Courses</Link>
            </Button>
          </div>
        )}
      </div>
    </StudentOnlyRoute>
  );
}
