"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  type DashboardHeaderCrumb,
  useDashboardHeader,
} from "@/components/layout/DashboardHeaderContext";

export function AdminCatalogBreadcrumbs({
  crumbs,
}: {
  crumbs: DashboardHeaderCrumb[];
}) {
  const pathname = usePathname();
  const { registerBreadcrumbs } = useDashboardHeader();
  const serializedCrumbs = JSON.stringify(crumbs);

  useEffect(() => {
    const stableCrumbs = JSON.parse(serializedCrumbs) as DashboardHeaderCrumb[];
    return registerBreadcrumbs(pathname, stableCrumbs);
  }, [pathname, registerBreadcrumbs, serializedCrumbs]);

  return null;
}
