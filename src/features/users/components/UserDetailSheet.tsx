"use client";

import { format } from "date-fns";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Ban,
  LogOut,
  RotateCcw,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingStatus } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useState } from "react";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { useAppSelector } from "@/store/hooks";
import { useDemoteUserMutation, useGetUserDetailQuery, usePromoteUserMutation, useSetUserAccessMutation } from "../usersApi";
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

type PendingAction = "promote" | "demote" | "revoke-sessions" | "suspend" | "reactivate";

const ACTION_COPY: Record<PendingAction, { title: (name: string) => string; description: string; confirm: string; success: (name: string) => string; destructive?: boolean }> = {
  promote: {
    title: (name) => `Promote ${name} to admin?`,
    description: "They get the admin dashboard and sign in with an emailed code from now on. Every session they have now ends.",
    confirm: "Promote to admin",
    success: (name) => `${name} has been promoted to ADMIN`,
  },
  demote: {
    title: (name) => `Demote ${name} to student?`,
    description: "They lose admin access straight away, and every session they have now ends.",
    confirm: "Demote to student",
    success: (name) => `${name} has been demoted to STUDENT`,
    destructive: true,
  },
  "revoke-sessions": {
    title: (name) => `Sign ${name} out everywhere?`,
    description: "Every browser and device they're signed in on is signed out now. They can sign in again with their password. Use this for a lost or shared device.",
    confirm: "Sign out everywhere",
    success: (name) => `${name} was signed out of every session`,
  },
  suspend: {
    title: (name) => `Suspend ${name}?`,
    description: "They're signed out everywhere and can't sign in until a super admin reactivates the account. Their courses, payments and certificates stay as they are.",
    confirm: "Suspend account",
    success: (name) => `${name}'s account is suspended`,
    destructive: true,
  },
  reactivate: {
    title: (name) => `Reactivate ${name}?`,
    description: "They can sign in again with their password.",
    confirm: "Reactivate",
    success: (name) => `${name}'s account is active again`,
  },
};

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
  const [setAccess, { isLoading: isChangingAccess }] = useSetUserAccessMutation();
  const [resendOtp, { isLoading: isSendingVerification }] = useResendOtpMutation();
  const currentUser = useAppSelector(selectAuthUser);
  // Confirmed in the page itself, never window.confirm (admin page patterns).
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const name = detail ? `${detail.firstName} ${detail.lastName}` : "";
  const isSelf = Boolean(detail && currentUser?.id === detail.id);
  const isSuspended = Boolean(detail?.disabledAt);
  const isBusy = isPromoting || isDemoting || isChangingAccess;

  const runPendingAction = async () => {
    if (!detail || !pendingAction) return;
    const copy = ACTION_COPY[pendingAction];
    try {
      if (pendingAction === "promote") await promote(detail.id).unwrap();
      else if (pendingAction === "demote") await demote(detail.id).unwrap();
      else await setAccess({ id: detail.id, action: pendingAction }).unwrap();
      toast.success(copy.success(name));
      setPendingAction(null);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "That didn't work."));
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
          <div className="flex-1 space-y-6 p-6">
            <LoadingStatus label="Loading user…" />
            <div className="flex items-center gap-4" aria-hidden="true">
              <Skeleton className="size-14 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
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
                {isSuspended ? (
                  <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                    Suspended {format(new Date(detail.disabledAt!), "MMM d, yyyy")}
                  </Badge>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  Member since {format(new Date(detail.createdAt), "MMM dd, yyyy")}
                </span>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-4">
              <div className="flex flex-wrap gap-2">
                {canManageRoles && detail.role === "STUDENT" ? (
                  <Button variant="outline" size="sm" onClick={() => setPendingAction("promote")} disabled={isBusy}>
                    <ArrowUpCircle className="size-4" aria-hidden="true" /> Promote to admin
                  </Button>
                ) : null}
                {canManageRoles && detail.role === "ADMIN" ? (
                  <Button variant="outline" size="sm" onClick={() => setPendingAction("demote")} disabled={isBusy}>
                    <ArrowDownCircle className="size-4" aria-hidden="true" /> Demote to student
                  </Button>
                ) : null}
                {canManageRoles && !isSelf ? (
                  <>
                    {!isSuspended ? (
                      <Button variant="outline" size="sm" onClick={() => setPendingAction("revoke-sessions")} disabled={isBusy}>
                        <LogOut className="size-4" aria-hidden="true" /> Sign out everywhere
                      </Button>
                    ) : null}
                    {isSuspended ? (
                      <Button variant="outline" size="sm" onClick={() => setPendingAction("reactivate")} disabled={isBusy}>
                        <RotateCcw className="size-4" aria-hidden="true" /> Reactivate
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setPendingAction("suspend")} disabled={isBusy} className="text-red-700 hover:text-red-800">
                        <Ban className="size-4" aria-hidden="true" /> Suspend
                      </Button>
                    )}
                  </>
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

              {/* Super admins only: the audit trail can describe payouts,
                  share splits and refunds (code review M10-02). */}
              {detail.auditActions ? (
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
              ) : null}
            </div>
          </>
        )}
      </SheetContent>
      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          {pendingAction ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{ACTION_COPY[pendingAction].title(name)}</AlertDialogTitle>
                <AlertDialogDescription>{ACTION_COPY[pendingAction].description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isBusy}
                  onClick={(event) => {
                    event.preventDefault();
                    void runPendingAction();
                  }}
                  className={
                    ACTION_COPY[pendingAction].destructive
                      ? "bg-linear-to-r from-red-600 to-rose-500 bg-none text-white hover:opacity-90"
                      : "bg-[#191919] bg-none text-white hover:bg-[#27272A]"
                  }
                >
                  {isBusy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
                  {ACTION_COPY[pendingAction].confirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
