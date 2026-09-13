"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Icons } from "@/lib/icons";
import { useAppSelector } from "@/store/hooks";
import { selectAuthUser } from "@/features/auth/authSelectors";
import {
  isStudent,
  canAccessAdminArea,
  canViewUsers,
  canViewAuditLogs,
  getDashboardPath,
} from "@/lib/access";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * DashboardNavMain
 *
 * Flat, role-gated navigation list — ported from the previous hand-rolled
 * sidebar's navItems array. No nested sub-items exist in this app's IA, so
 * this renders as simple SidebarMenuButtons rather than stock nav-main's
 * Collapsible sub-menu pattern.
 */
export function DashboardNavMain() {
  const pathname = usePathname();
  const user = useAppSelector(selectAuthUser);
  const role = user?.role ?? null;
  const dashboardPath = getDashboardPath(role);

  const overviewItems: NavItem[] = [
    { label: "Dashboard", href: dashboardPath, icon: Icons.dashboard },
    ...(isStudent(role)
      ? [
          { label: "Explore", href: "/explore", icon: Icons.explore },
          { label: "My Courses", href: "/my-courses", icon: Icons.myCourses },
          { label: "Certificates", href: "/certificates", icon: Icons.certificates },
          { label: "My Projects", href: "/projects", icon: Icons.myProjects },
        ]
      : []),
  ];

  const adminItems: NavItem[] = canAccessAdminArea(user)
    ? [
        { label: "Services", href: "/admin/services", icon: Icons.services },
        { label: "Session Library", href: "/admin/sessions", icon: Icons.sessionLibrary },
        { label: "Manage Certificates", href: "/admin/certificates", icon: Icons.manageCertificates },
        { label: "Review Projects", href: "/admin/projects", icon: Icons.reviewProjects },
      ]
    : [];

  const superAdminItems: NavItem[] = [
    ...(canViewUsers(user) ? [{ label: "Users", href: "/admin/users", icon: Icons.users }] : []),
    ...(canViewAuditLogs(user) ? [{ label: "Audit Logs", href: "/admin/audit", icon: Icons.auditLogs }] : []),
  ];

  const isItemActive = (href: string) =>
    href === dashboardPath ? pathname === href : pathname.startsWith(href);

  const renderGroup = (label: string, items: NavItem[]) => {
    if (items.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isItemActive(item.href)} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  };

  return (
    <>
      {renderGroup("Overview", overviewItems)}
      {renderGroup("Administration", [...adminItems, ...superAdminItems])}
    </>
  );
}
