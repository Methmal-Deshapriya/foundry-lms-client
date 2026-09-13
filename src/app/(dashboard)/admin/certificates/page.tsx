"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Award, ExternalLink, Loader2, MoreHorizontal, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterPills, type FilterPillOption } from "@/components/ui/filter-pills";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CursorPagination } from "@/components/ui/cursor-pagination";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetAllCertificatesAdminQuery, useRevokeCertificateMutation } from "@/features/certificates/certificatesApi";
import type { Certificate, CertificateAdminSummary, CertificateStatus } from "@/features/certificates/certificatesTypes";
import { getApiErrorMessage } from "@/lib/api";
import { CERTIFICATE_STATUS_STYLES } from "@/lib/statusColors";

const STATUS_PILLS: { key: CertificateStatus | ""; label: string; countKey: keyof CertificateAdminSummary }[] = [
  { key: "", label: "All", countKey: "all" },
  { key: "ISSUED", label: "Issued", countKey: "issued" },
  { key: "REVOKED", label: "Revoked", countKey: "revoked" },
];
const PILL_ACTIVE_CLASS: Record<CertificateStatus | "", string> = {
  "": "border-primary bg-primary/10 text-primary",
  ISSUED: CERTIFICATE_STATUS_STYLES.ISSUED,
  REVOKED: CERTIFICATE_STATUS_STYLES.REVOKED,
};

const FILTER_DEBOUNCE_MS = 300;
const MIN_FILTER_LENGTH = 3;
const INTERACTIVE_SELECTOR = "input,button,a,[role=menuitem],[data-no-row-navigation]";

/**
 * The global, cross-course certificate registry. Deliberately mirrors
 * CourseCertificatesTab.tsx (the course workspace's per-intake Certificates
 * tab) — same search/FilterPills/Badge/Dialog-revoke/Sheet-detail shape —
 * just cursor-paginated instead of offset-paginated (this list spans every
 * course, so there's no cheap total to page against) and with an extra
 * Course column since rows aren't already scoped to one intake.
 */
export default function AdminCertificatesPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | "">("");
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const page = cursors.length - 1;

  const debouncedQ = useDebouncedValue(q.trim(), FILTER_DEBOUNCE_MS);
  const appliedQ = debouncedQ.length === 0 || debouncedQ.length >= MIN_FILTER_LENGTH ? debouncedQ : "";

  const { data, isLoading, isFetching, isError } = useGetAllCertificatesAdminQuery({
    q: appliedQ || undefined,
    status: statusFilter || undefined,
    cursor: cursors[page],
    limit: 50,
  });
  const [revokeCertificate, { isLoading: isRevoking }] = useRevokeCertificateMutation();
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null);
  const [detailCertificate, setDetailCertificate] = useState<Certificate | null>(null);
  const [reason, setReason] = useState("");
  const certificates = data?.certificates ?? [];

  const resetToFirstPage = () => setCursors([undefined]);

  const confirmRevoke = async () => {
    if (!revokeTarget || reason.trim().length < 5) return;
    try {
      await revokeCertificate({ id: revokeTarget.id, data: { revocationReason: reason.trim() } }).unwrap();
      toast.success("Certificate revoked");
      setRevokeTarget(null);
      setReason("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to revoke certificate"));
    }
  };

  const pillOptions: FilterPillOption<CertificateStatus | "">[] = STATUS_PILLS.map(({ key, label, countKey }) => ({
    key,
    label,
    count: data?.summary?.[countKey] ?? 0,
    activeClassName: PILL_ACTIVE_CLASS[key],
  }));

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogPageHeader
        title="Certificates"
        description="View issued certificates across every course and manage their validity."
        icon={Award}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Search certificates by code, student, or course"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            resetToFirstPage();
          }}
          placeholder="Search code, student, or course"
          className="h-9 w-64 shrink-0"
        />
        <FilterPills
          ariaLabel="Filter by certificate status"
          options={pillOptions}
          active={statusFilter}
          onChange={(key) => {
            setStatusFilter(key);
            resetToFirstPage();
          }}
        />
      </div>

      <div className="overflow-hidden rounded-md border bg-card" aria-busy={isLoading || isFetching}>
        <Table>
          <TableCaption className="sr-only">Issued and revoked certificates</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="px-4">Certificate code</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading certificates…
                  </span>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-destructive">
                  <span role="alert">Failed to load certificates. Please try again.</span>
                </TableCell>
              </TableRow>
            ) : certificates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {appliedQ || statusFilter ? "No certificates match your filters." : "No certificates have been issued yet."}
                </TableCell>
              </TableRow>
            ) : (
              certificates.map((certificate) => (
                <TableRow
                  key={certificate.id}
                  tabIndex={0}
                  aria-label={`View details for certificate ${certificate.certificateCode}`}
                  className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  onClick={(event) => {
                    if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
                    setDetailCertificate(certificate);
                  }}
                  onKeyDown={(event) => {
                    if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setDetailCertificate(certificate);
                    }
                  }}
                >
                  <TableCell className="px-4 py-4 font-mono">{certificate.certificateCode}</TableCell>
                  <TableCell className="font-medium">{certificate.studentName}</TableCell>
                  <TableCell className="max-w-xs truncate">{certificate.courseName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={CERTIFICATE_STATUS_STYLES[certificate.status]}>
                      {certificate.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(certificate.issuedDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="pr-4 text-right" data-no-row-navigation>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for certificate ${certificate.certificateCode}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/certificates/verify/${certificate.certificateCode}`} target="_blank">
                            <ExternalLink /> Open verification
                          </Link>
                        </DropdownMenuItem>
                        {certificate.status === "ISSUED" ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                              setReason("");
                              setRevokeTarget(certificate);
                            }}
                          >
                            <XCircle /> Revoke certificate
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CursorPagination
        page={page}
        hasMore={data?.pagination.hasMore ?? false}
        isFetching={isFetching}
        onPrevious={() => setCursors((current) => current.slice(0, -1))}
        onNext={() => {
          const nextCursor = data?.pagination.nextCursor;
          if (nextCursor) setCursors((current) => [...current, nextCursor]);
        }}
      />

      <Dialog open={Boolean(revokeTarget)} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke certificate?</DialogTitle>
            <DialogDescription>
              Revoke {revokeTarget?.certificateCode} for {revokeTarget?.studentName}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="revoke-reason">
              Reason{" "}
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            </Label>
            <textarea
              id="revoke-reason"
              className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="At least 5 characters"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={reason.trim().length < 5 || isRevoking}
              onClick={confirmRevoke}
            >
              {isRevoking ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              Revoke certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={Boolean(detailCertificate)} onOpenChange={(open) => !open && setDetailCertificate(null)}>
        <SheetContent className="flex flex-col sm:max-w-lg">
          {detailCertificate ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{detailCertificate.certificateCode}</SheetTitle>
                <SheetDescription>{detailCertificate.studentName}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-5 overflow-y-auto px-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={CERTIFICATE_STATUS_STYLES[detailCertificate.status]}>
                    {detailCertificate.status}
                  </Badge>
                </div>
                {detailCertificate.description ? (
                  <p className="text-sm text-muted-foreground">{detailCertificate.description}</p>
                ) : null}
                <div className="space-y-1.5 text-sm">
                  <p className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Course</span>
                    <span className="max-w-[60%] truncate text-right font-medium" title={detailCertificate.courseName}>
                      {detailCertificate.courseName}
                    </span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Issued</span>
                    <span className="font-medium">{format(new Date(detailCertificate.issuedDate), "MMM dd, yyyy")}</span>
                  </p>
                  {detailCertificate.status === "REVOKED" ? (
                    <>
                      {detailCertificate.revokedAt ? (
                        <p className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Revoked</span>
                          <span className="font-medium">
                            {format(new Date(detailCertificate.revokedAt), "MMM dd, yyyy")}
                          </span>
                        </p>
                      ) : null}
                      {detailCertificate.revocationReason ? (
                        <p className="text-muted-foreground">{detailCertificate.revocationReason}</p>
                      ) : null}
                    </>
                  ) : null}
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/certificates/verify/${detailCertificate.certificateCode}`} target="_blank">
                    <ExternalLink className="mr-2 size-4" aria-hidden="true" /> Open public verification
                  </Link>
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
