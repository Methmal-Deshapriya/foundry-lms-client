"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CalendarDays, FolderCode, Mail, Phone, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AccountProfileForm from "@/features/auth/components/AccountProfileForm";
import ChangePasswordForm from "@/features/auth/components/ChangePasswordForm";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { RoleBadge } from "@/features/users/components/RoleBadge";
import { VerifiedBadge } from "@/features/users/components/VerifiedBadge";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_INTERNATIONAL } from "@/lib/contact";
import { useAppSelector } from "@/store/hooks";
import { useGetMyProfileQuery } from "@/features/profiles/profilesApi";
import { ProfileSetupDialog } from "@/features/profiles/components/ProfileSetupDialog";
import { PublicProfileStatusCard } from "@/features/profiles/components/PublicProfileStatusCard";

function getInitials(firstName?: string, lastName?: string) {
  const initials = `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`;
  return initials.toUpperCase() || "U";
}

function SummaryRow({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        <div className="mt-0.5 text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

/**
 * My Account — every logged-in user's own profile: contact/personal
 * details (editable), role, and member-since. Login already requires a
 * verified email (see loginService), so reaching this page guarantees
 * emailVerified is true — the badge below is just a status confirmation,
 * not an action; actual verification happens pre-login at /verify-email.
 */
export default function AccountPage() {
  const user = useAppSelector(selectAuthUser);
  const isStudent = user?.role === "STUDENT";
  // Public profiles are a student-only feature; admins never query them.
  const { data: myProfile } = useGetMyProfileQuery(undefined, { skip: !isStudent });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  if (!user) return null;

  const memberSince = format(new Date(user.createdAt), "MMM d, yyyy");

  return (
    <div className="space-y-6 pb-20">
      {/* Profile header: a dark band carrying the house black, with the
          avatar overlapping its lower edge. */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative h-24 bg-[#191919] sm:h-28">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "18px 18px" }}
            aria-hidden="true"
          />
          <span className="absolute bottom-0 left-0 h-1 w-24 bg-[#E91717]" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-4 px-5 pt-3 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-end gap-4">
            <Avatar className="-mt-10 size-20 shrink-0 rounded-2xl ring-4 ring-card sm:-mt-12 sm:size-24">
              <AvatarFallback className="rounded-2xl bg-[#191919] text-2xl font-bold text-white">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 pb-1">
              <h1 className="text-xl font-bold text-foreground wrap-anywhere sm:text-2xl">
                {user.firstName} {user.lastName}
              </h1>
              <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate" title={user.email}>
                  {user.email}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:pb-1">
            <RoleBadge role={user.role} />
            <VerifiedBadge verified={user.emailVerified} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_20rem]">
        <section className="min-w-0 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Profile details</h2>
            <p className="text-sm text-muted-foreground">Keep these up to date so certificates and enrollments use the right details.</p>
          </div>
          <AccountProfileForm user={user} />
          <div className="pt-3">
            <h2 className="text-base font-semibold text-foreground">Security</h2>
            <p className="text-sm text-muted-foreground">Change your password any time; you&apos;ll stay signed in on this device.</p>
          </div>
          <ChangePasswordForm />
        </section>

        <aside className="space-y-4 xl:sticky xl:top-6">
          {isStudent && myProfile?.profile ? (
            <PublicProfileStatusCard data={myProfile} onEdit={() => setIsEditingProfile(true)} className="sm:flex-col sm:items-stretch" />
          ) : isStudent && myProfile ? (
            <section className="space-y-2 rounded-xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FolderCode className="size-4" aria-hidden="true" />
                Your public profile
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Submit your first project to create a public portfolio page that shows your work, certificates and links.
              </p>
              <Link href="/projects" className="inline-flex pt-1 text-sm font-semibold text-foreground underline-offset-2 hover:underline">
                Go to My Projects
              </Link>
            </section>
          ) : null}

          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Account</h2>
            <SummaryRow icon={Mail} label="Sign-in email">
              <span className="block truncate" title={user.email}>
                {user.email}
              </span>
            </SummaryRow>
            <SummaryRow icon={ShieldCheck} label="Email status">
              {user.emailVerified ? "Verified" : "Not verified"}
            </SummaryRow>
            <SummaryRow icon={CalendarDays} label="Member since">
              {memberSince}
            </SummaryRow>
          </section>

          <section className="space-y-2 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Need to change your email?</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your sign-in email can&apos;t be edited here. Call or WhatsApp our team and we&apos;ll update it for you.
            </p>
            <a
              href={`tel:+${CONTACT_PHONE_INTERNATIONAL}`}
              className="inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-foreground underline-offset-2 hover:underline"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              {CONTACT_PHONE_DISPLAY}
            </a>
          </section>
        </aside>
      </div>

      {isStudent ? <ProfileSetupDialog open={isEditingProfile} onOpenChange={setIsEditingProfile} mode="edit" /> : null}
    </div>
  );
}
