"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectAuthRole } from "@/features/auth/authSelectors";
import { isStudent } from "@/lib/access";

type StudentOnlyRouteProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export default function StudentOnlyRoute({
  children,
  title = "Access Restricted",
  description = "This area is available only to student accounts.",
}: StudentOnlyRouteProps) {
  const role = useAppSelector(selectAuthRole);

  if (!isStudent(role)) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card text-amber-600 shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-amber-950">{title}</h2>
        <p className="mx-auto max-w-lg text-amber-800">{description}</p>
      </div>
    );
  }

  return <>{children}</>;
}
