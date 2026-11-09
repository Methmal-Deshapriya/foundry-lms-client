"use client";

import Link from "next/link";
import { BellRing, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { selectAuthRole, selectIsAuthenticated } from "@/features/auth/authSelectors";
import { getApiErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { useGetCourseInterestQuery, useSetCourseInterestMutation } from "../notificationsApi";

const OUTLINE =
  "flex h-12 w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-6 font-alt text-sm font-semibold text-[#191919] transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60";

/**
 * "Notify me when it opens" on a course that isn't enrolling yet. Signed-in
 * students get an in-app notification when an intake opens; visitors are
 * asked to sign up first (so there's no loose email list to maintain or pay
 * to email). Admins don't see it.
 */
export function NotifyMeButton({ courseId }: { courseId: string }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isStudent = useAppSelector(selectAuthRole) === "STUDENT";
  const { data, isLoading } = useGetCourseInterestQuery(courseId, { skip: !isStudent });
  const [setInterest, { isLoading: isSaving }] = useSetCourseInterestMutation();

  if (isAuthenticated && !isStudent) return null;
  if (!isAuthenticated) {
    return (
      <Link href="/sign-up" className={OUTLINE}>
        <BellRing className="size-4" aria-hidden="true" />
        Sign up to get notified
      </Link>
    );
  }

  const interested = data?.interested ?? false;
  const toggle = async () => {
    try {
      await setInterest({ courseId, interested: !interested }).unwrap();
      toast.success(interested ? "Okay — we won't notify you about this course." : "Done — we'll notify you here when enrollment opens.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "That didn't work — please try again."));
    }
  };

  return (
    <div className="space-y-1.5">
      <button type="button" onClick={() => void toggle()} disabled={isLoading || isSaving} className={OUTLINE} aria-pressed={interested}>
        {isSaving ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : interested ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <BellRing className="size-4" aria-hidden="true" />
        )}
        {interested ? "You'll be notified" : "Notify me when it opens"}
      </button>
      {interested ? <p className="text-center font-alt text-xs text-[#71717A]">Tap again to stop notifications for this course.</p> : null}
    </div>
  );
}
