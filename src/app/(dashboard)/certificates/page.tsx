"use client";

import Image from "next/image";
import Link from "next/link";
import { Award } from "lucide-react";
import { useGetMyCertificatesQuery } from "@/features/certificates/certificatesApi";
import { CertificateCard } from "@/features/certificates/components/CertificateCard";
import StudentOnlyRoute from "@/components/access/StudentOnlyRoute";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CardGridSkeleton, LoadingStatus } from "@/components/ui/loading-skeletons";

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
          <div className="@container">
            <LoadingStatus label="Loading your certificates…" />
            <CardGridSkeleton
              count={4}
              imageAspect="aspect-[1584/993]"
              className="grid grid-cols-1 gap-4 @md:grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-4"
            />
          </div>
        ) : isError ? (
          <div role="alert" className="rounded-lg border border-red-100 bg-red-50 p-12 text-center">
            <h2 className="mb-2 text-base font-bold text-red-900">Something went wrong</h2>
            <p className="text-sm text-red-700">Failed to load certificates. Please try again.</p>
          </div>
        ) : certificates.length > 0 ? (
          <div className="@container">
            <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-4">
              {certificates.map((cert) => (
                <CertificateCard key={cert.id} certificate={cert} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Award}
            eyebrow="Your achievements"
            title="Earn your first certificate"
            description="Finish a certificate course and your official Foundry Academy certificate appears here, ready to download or share."
            steps={[
              { title: "Complete a course", description: "Work through its sessions until your progress reaches the end." },
              { title: "Get it issued", description: "Once you've finished, your certificate is issued in your name." },
              { title: "Share it anywhere", description: "Download it as a PNG or PDF, or share its public verification link." },
            ]}
            action={
              <Button asChild className="bg-[#191919] bg-none text-white hover:bg-[#27272A]">
                <Link href="/my-courses">Go to My Courses</Link>
              </Button>
            }
            preview={
              <Image
                src="/certificate/certificate_dummy.webp"
                alt=""
                width={1584}
                height={993}
                sizes="(min-width: 1280px) 560px, 100vw"
                className="h-auto w-full rounded-lg border border-border shadow-sm"
              />
            }
          />
        )}
      </div>
    </StudentOnlyRoute>
  );
}
