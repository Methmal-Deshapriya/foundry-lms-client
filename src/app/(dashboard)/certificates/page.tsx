"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useGetMyCertificatesQuery } from "@/features/certificates/certificatesApi";
import StudentOnlyRoute from "@/components/access/StudentOnlyRoute";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  ISSUED: "bg-emerald-50 text-emerald-700",
  REVOKED: "bg-red-50 text-red-700",
};

export default function MyCertificatesPage() {
  const router = useRouter();
  const [cursor, setCursor] = useState<string | undefined>();
  const [history, setHistory] = useState<Array<string | undefined>>([]);
  const { data, isLoading, isError, isFetching } = useGetMyCertificatesQuery({
    limit: 20,
    cursor,
  });
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
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" aria-hidden="true" />
            <p className="font-medium text-muted-foreground">Loading your certificates...</p>
          </div>
        ) : isError ? (
          <div role="alert" className="rounded-lg border border-red-100 bg-red-50 p-12 text-center">
            <h2 className="mb-2 text-base font-bold text-red-900">Something went wrong</h2>
            <p className="text-sm text-red-700">Failed to load certificates. Please try again.</p>
          </div>
        ) : certificates.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="px-4">Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead className="pr-4">Certificate Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow
                      key={cert.id}
                      className="cursor-pointer hover:bg-muted/50"
                      tabIndex={0}
                      onClick={() => router.push(`/certificates/verify/${cert.certificateCode}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          router.push(`/certificates/verify/${cert.certificateCode}`);
                        }
                      }}
                    >
                      <TableCell className="px-4 font-medium text-foreground">
                        {cert.courseName}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                            STATUS_STYLES[cert.status],
                          )}
                        >
                          {cert.status === "ISSUED" ? (
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ShieldX className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {cert.status === "ISSUED" ? "Valid" : "Revoked"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(cert.issuedDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="pr-4 font-mono text-xs text-muted-foreground">
                        {cert.certificateCode}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={history.length === 0 || isFetching}
                onClick={() => {
                  setCursor(history.at(-1));
                  setHistory((items) => items.slice(0, -1));
                }}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data?.pagination.hasMore || !data.pagination.nextCursor || isFetching}
                onClick={() => {
                  setHistory((items) => [...items, cursor]);
                  setCursor(data?.pagination.nextCursor ?? undefined);
                }}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
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
