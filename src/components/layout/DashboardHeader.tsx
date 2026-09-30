"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useDashboardHeader } from "@/components/layout/DashboardHeaderContext";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/explore": "Explore",
  "/my-courses": "My Courses",
  "/certificates": "Certificates",
  "/projects": "My Projects",
  "/account": "Account",
  "/admin/dashboard": "Dashboard",
  "/admin/services": "Services",
  "/admin/sessions": "Session Library",
  "/admin/certificates": "Manage Certificates",
  "/admin/projects": "Review Projects",
  "/admin/users": "Users",
  "/admin/audit": "Audit Logs",
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.keys(PAGE_TITLES).find((path) => pathname.startsWith(path));
  return match ? PAGE_TITLES[match] : "Dashboard";
}

/**
 * DashboardHeader Component
 *
 * Provides global utility actions and search for the dashboard area.
 * `SidebarTrigger` replaces the old hand-rolled collapse chevron button.
 * No real page hierarchy exists in this app to justify a multi-level
 * breadcrumb, so this just shows the current page's title instead.
 */
export default function DashboardHeader() {
  const pathname = usePathname();
  const { breadcrumbs } = useDashboardHeader();
  const activeBreadcrumbs =
    breadcrumbs?.pathname === pathname ? breadcrumbs.crumbs : null;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center gap-4 border-b border-border bg-background px-4 md:px-8">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      {activeBreadcrumbs ? (
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          {activeBreadcrumbs.map((crumb, index) => (
            <span
              key={`${crumb.label}-${index}`}
              className={cn(
                // On a narrow phone, the full chain wraps onto a second line
                // and reads as broken — only the current page matters there,
                // so every earlier crumb (and its leading "/") is hidden
                // until there's room for the whole trail again at sm+.
                "min-w-0 items-center gap-2",
                index === activeBreadcrumbs.length - 1 ? "flex" : "hidden sm:flex",
              )}
            >
              {index > 0 ? <span aria-hidden="true" className="hidden sm:inline">/</span> : null}
              {crumb.href ? (
                <Link
                  className="truncate font-medium hover:text-foreground"
                  href={crumb.href}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-semibold text-foreground">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      ) : (
        <h1 className="text-sm font-medium text-foreground">
          {getPageTitle(pathname)}
        </h1>
      )}
    </header>
  );
}
