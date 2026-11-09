"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { canAccessAdminArea } from "@/lib/access";

export default function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const user = useAppSelector(selectAuthUser);

  if (!canAccessAdminArea(user)) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-12 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold">Administration access required</h1>
        <p className="mt-2 text-muted-foreground">
          Your current account does not have an administrative capability.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
