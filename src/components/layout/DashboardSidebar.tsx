"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { DashboardNavMain } from "./DashboardNavMain";
import { DashboardNavUser } from "./DashboardNavUser";

/**
 * DashboardSidebar
 *
 * Built on shadcn's `sidebar-07` block (Sidebar/SidebarProvider primitives,
 * collapsible="icon", mobile Sheet fallback, cookie-persisted collapse
 * state) instead of the previous hand-rolled <aside>. The stock block's
 * TeamSwitcher (no multi-team concept in this app) is replaced with a
 * static branded header; nav/user content is real, role-gated app data —
 * see DashboardNavMain / DashboardNavUser.
 */
export default function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-[#191919]">
                  <span className="text-sm font-extrabold">F</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-extrabold tracking-tight text-[#191919]">FoundryAcademy</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <DashboardNavMain />
      </SidebarContent>
      <SidebarFooter>
        <DashboardNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
