"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableSkeletonRows } from "@/components/ui/loading-skeletons";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { useGetAtRiskStudentsQuery, type AtRiskRow } from "@/features/enrollments/enrollmentsApi";
import { toWhatsAppNumber } from "@/features/payments/paymentLabels";
import { Icons } from "@/lib/icons";

function nudgeUrl(row: AtRiskRow) {
  const number = toWhatsAppNumber(row.student.phone);
  if (!number) return null;
  const firstName = row.student.name.split(/\s+/)[0] || row.student.name;
  const message = `Hi ${firstName}, this is Foundry Academy. We noticed you haven't joined a session in ${row.course.title} for a while — is everything okay? Your next session is waiting in your classroom, and we're happy to help if you're stuck.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Students at risk — active students in a running intake who haven't
 * completed a session in 14+ days (and still have sessions to do). Built
 * from data the system already has; the nudge goes through the admin's own
 * WhatsApp, so it costs nothing.
 */
export default function StudentsAtRiskPage() {
  const { data, isLoading } = useGetAtRiskStudentsQuery();
  const rows = data?.rows ?? [];
  const days = data?.thresholdDays ?? 14;

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogPageHeader
        title="Students at risk"
        description={`Active students who haven't completed a session in ${days}+ days, with sessions still waiting for them. A quick nudge keeps them going.`}
        icon={Icons.attention}
      />
      <p className="text-sm text-muted-foreground">
        {isLoading ? "Checking…" : rows.length === 0 ? "Nobody is falling behind right now." : `${rows.length} student${rows.length === 1 ? "" : "s"} could use a nudge.`}
      </p>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed">
          <TableCaption className="sr-only">Students with no session completed in {days} or more days</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-44 pl-4">Student</TableHead>
              <TableHead className="w-48">Course · intake</TableHead>
              <TableHead className="w-36">Progress</TableHead>
              <TableHead className="w-32">Last session done</TableHead>
              <TableHead className="w-24 text-right">Inactive</TableHead>
              <TableHead className="w-48 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows columns={6} label="Loading students at risk…" />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Everyone has completed a session in the last {days} days.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const whatsapp = nudgeUrl(row);
                return (
                  <TableRow key={row.enrollmentId}>
                    <TableCell className="max-w-0 pl-4">
                      <p className="truncate font-medium">{row.student.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.student.phone ?? row.student.email}</p>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <p className="truncate">{row.course.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.intake.code}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-blue-100">
                          <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${row.progressPercent}%` }} />
                        </div>
                        <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                          {row.completedCount}/{row.availableSessionCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.lastCompletedAt ? format(new Date(row.lastCompletedAt), "MMM d, yyyy") : "None yet"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{row.daysInactive} days</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-2">
                        {whatsapp ? (
                          <Button asChild size="sm" className="bg-[#191919] bg-none text-white hover:bg-[#27272A]">
                            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="size-3.5" aria-hidden="true" />
                              Nudge
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled title="This student has no valid phone number on file">
                            No phone
                          </Button>
                        )}
                        {row.course.serviceSlug ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/services/${row.course.serviceSlug}/courses/${row.course.id}/intakes/${row.intake.id}?tab=enrollments`}>
                              <ExternalLink className="size-3.5" aria-hidden="true" />
                              Roster
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
