"use client";

import { format } from "date-fns";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Award,
  ClipboardList,
  CreditCard,
  FolderKanban,
  GraduationCap,
  Loader2,
  Mail,
  MailWarning,
  ScrollText,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useResendOtpMutation } from "@/features/auth/authApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getApiErrorMessage } from "@/lib/api";
import {
  CERTIFICATE_STATUS_STYLES,
  ENROLLMENT_REQUEST_STATUS_STYLES,
  ENROLLMENT_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  PROJECT_STATUS_STYLES,
} from "@/lib/statusColors";
import { formatLKR } from "@/lib/utils";
import { useDemoteUserMutation, useGetUserDetailQuery, usePromoteUserMutation } from "../usersApi";
import { RoleBadge } from "./RoleBadge";
import { VerifiedBadge } from "./VerifiedBadge";

function getInitials(firstName?: string, lastName?: string) {
  const initials = `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`;
  return initials.toUpperCase() || "U";
}

function SectionHeading({ icon: Icon, label, total }: { icon: React.ComponentType<{ className?: string }>; label: string; total: number }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      {label}
      <span className="font-normal text-muted-foreground">· {total} total</span>
    </div>
  );
}

function EmptySection({ label }: { label: string }) {
  return <p className="pl-6 text-xs text-muted-foreground">{label}</p>;
}

export default function UserDetailSheet({
  userId,
  onOpenChange,
  canManageRoles,
}: {
  userId: string | null;
  onOpenChange: (open: boolean) => void;
  canManageRoles: boolean;
}) {
  const { data: detail, isLoading, isError } = useGetUserDetailQuery(userId ?? "", { skip: !userId });
  const [promote, { isLoading: isPromoting }] = usePromoteUserMutation();
  const [demote, { isLoading: isDemoting }] = useDemoteUserMutation();
  const [resendOtp, { isLoading: isSendingVerification }] = useResendOtpMutation();

  const name = detail ? `${detail.firstName} ${detail.lastName}` : "";

  const handlePromote = async () => {
    if (!detail || !window.confirm(`Are you sure you want to promote "${name}" to ADMIN?`)) return;
    try {
      await promote(detail.id).unwrap();
      toast.success(`${name} has been promoted to ADMIN`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Promotion failed"));
    }
  };

  const handleDemote = async () => {
    if (!detail || !window.confirm(`Are you sure you want to demote "${name}" to STUDENT?`)) return;
    try {
      await demote(detail.id).unwrap();
      toast.success(`${name} has been demoted to STUDENT`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Demotion failed"));
    }
  };

  const handleSendVerification = async () => {
    if (!detail) return;
    try {
      await resendOtp({ email: detail.email }).unwrap();
      toast.success(`A verification code was sent to ${detail.email}`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Could not send a verification code"));
    }
  };

  return (
    <Sheet open={Boolean(userId)} onOpenChange={(open) => !open && onOpenChange(false)}>
      <SheetContent className="flex flex-col border-border bg-white sm:max-w-xl" style={{ backgroundImage: "none" }}>
        {isLoading ? (
          <p className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading user…
          </p>
        ) : isError || !detail ? (
          <p className="flex flex-1 items-center justify-center text-sm text-destructive" role="alert">
            Could not load this user.
          </p>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-xl">
                  <AvatarFallback className="rounded-xl bg-[#191919] text-white">
                    {getInitials(detail.firstName, detail.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <SheetTitle>{name}</SheetTitle>
                  <SheetDescription className="flex items-center gap-1.5">
                    <Mail className="size-3" aria-hidden="true" />
                    {detail.email}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <RoleBadge role={detail.role} />
                <VerifiedBadge verified={detail.emailVerified} />
                <span className="text-xs text-muted-foreground">
                  Member since {format(new Date(detail.createdAt), "MMM dd, yyyy")}
                </span>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-4">
              <div className="flex flex-wrap gap-2">
                {canManageRoles && detail.role === "STUDENT" ? (
                  <Button variant="outline" size="sm" onClick={handlePromote} disabled={isPromoting}>
                    <ArrowUpCircle className="size-4" aria-hidden="true" /> Promote to admin
                  </Button>
                ) : null}
                {canManageRoles && detail.role === "ADMIN" ? (
                  <Button variant="outline" size="sm" onClick={handleDemote} disabled={isDemoting}>
                    <ArrowDownCircle className="size-4" aria-hidden="true" /> Demote to student
                  </Button>
                ) : null}
                {!detail.emailVerified ? (
                  <Button variant="outline" size="sm" onClick={handleSendVerification} disabled={isSendingVerification}>
                    {isSendingVerification ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <MailWarning className="size-4" aria-hidden="true" />}
                    Send verification email
                  </Button>
                ) : null}
              </div>

              <section className="space-y-2">
                <p className="text-sm font-semibold">Contact & personal info</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Phone</dt>
                    <dd>{detail.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">District</dt>
                    <dd>{detail.district || "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Address</dt>
                    <dd>{detail.address || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Date of birth</dt>
                    <dd>{detail.dateOfBirth ? format(new Date(detail.dateOfBirth), "MMM dd, yyyy") : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">A/L stream</dt>
                    <dd>{detail.alStream || "—"}</dd>
                  </div>
                </dl>
              </section>

              <section className="space-y-2">
                <SectionHeading icon={GraduationCap} label="Enrollments" total={detail.enrollments.total} />
                {detail.enrollments.items.length === 0 ? (
                  <EmptySection label="Not enrolled in any course yet." />
                ) : (
                  <ul className="space-y-1.5 pl-6">
                    {detail.enrollments.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{item.course?.title ?? "—"} · {item.intake?.code ?? "—"}</span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Badge variant="outline" className={ENROLLMENT_STATUS_STYLES[item.status]}>{item.status}</Badge>
                          <Badge variant="outline" className={PAYMENT_STATUS_STYLES[item.paymentStatus]}>{item.paymentStatus.replace("_", " ")}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {detail.managedEnrollments.total > 0 ? (
                <section className="space-y-2">
                  <SectionHeading icon={ClipboardList} label="Enrollments created as admin" total={detail.managedEnrollments.total} />
                  <ul className="space-y-1.5 pl-6">
                    {detail.managedEnrollments.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{item.user?.firstName} {item.user?.lastName} → {item.course?.title ?? "—"}</span>
                        <Badge variant="outline" className={ENROLLMENT_STATUS_STYLES[item.status]}>{item.status}</Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="space-y-2">
                <SectionHeading icon={CreditCard} label="Payments made" total={detail.paymentsMade.total} />
                {detail.paymentsMade.items.length === 0 ? (
                  <EmptySection label="No payments on file." />
                ) : (
                  <ul className="space-y-1.5 pl-6">
                    {detail.paymentsMade.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{item.course?.title ?? "—"} · {item.type.replace("_", " ").toLowerCase()}</span>
                        <span className="shrink-0 font-medium">{formatLKR(Number(item.amount))}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {detail.paymentsRecorded.total > 0 ? (
                <section className="space-y-2">
                  <SectionHeading icon={CreditCard} label="Payments recorded as admin" total={detail.paymentsRecorded.total} />
                  <ul className="space-y-1.5 pl-6">
                    {detail.paymentsRecorded.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">
                          {item.enrollment?.user?.firstName} {item.enrollment?.user?.lastName} · {item.course?.title ?? "—"}
                        </span>
                        <span className="shrink-0 font-medium">{formatLKR(Number(item.amount))}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="space-y-2">
                <SectionHeading icon={Award} label="Certificates" total={detail.certificates.total} />
                {detail.certificates.items.length === 0 ? (
                  <EmptySection label="No certificates issued yet." />
                ) : (
                  <ul className="space-y-1.5 pl-6">
                    {detail.certificates.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{item.courseName}</span>
                        <Badge variant="outline" className={CERTIFICATE_STATUS_STYLES[item.status]}>{item.certificateCode}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-2">
                <SectionHeading icon={FolderKanban} label="Student projects" total={detail.studentProjects.total} />
                {detail.studentProjects.items.length === 0 ? (
                  <EmptySection label="No projects submitted yet." />
                ) : (
                  <ul className="space-y-1.5 pl-6">
                    {detail.studentProjects.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{item.title}</span>
                        <Badge variant="outline" className={PROJECT_STATUS_STYLES[item.status]}>{item.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {detail.enrollmentRequests.total > 0 ? (
                <section className="space-y-2">
                  <SectionHeading icon={UserIcon} label="Enrollment requests" total={detail.enrollmentRequests.total} />
                  <ul className="space-y-1.5 pl-6">
                    {detail.enrollmentRequests.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{item.course?.title ?? "—"} · {item.intake?.code ?? "—"}</span>
                        <Badge variant="outline" className={ENROLLMENT_REQUEST_STATUS_STYLES[item.status]}>{item.status}</Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="space-y-2">
                <SectionHeading icon={ScrollText} label="Recent account activity" total={detail.auditActions.total} />
                {detail.auditActions.items.length === 0 ? (
                  <EmptySection label="No recorded activity yet." />
                ) : (
                  <ul className="space-y-1.5 pl-6">
                    {detail.auditActions.items.map((item) => (
                      <li key={item.id} className="text-sm">
                        <span className="text-muted-foreground">{format(new Date(item.createdAt), "MMM dd, yyyy HH:mm")} · </span>
                        {item.description ?? item.action.replace(/_/g, " ").toLowerCase()}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
