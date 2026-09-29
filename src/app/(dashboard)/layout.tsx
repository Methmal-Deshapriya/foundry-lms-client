import React from "react";
import AuthenticatedGuard from "@/features/auth/components/AuthenticatedGuard";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { DashboardHeaderProvider } from "@/components/layout/DashboardHeaderContext";
import { PageToolbarSlot } from "@/components/layout/PageToolbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthenticatedGuard>
      {/* Pinned to the viewport edges rather than sized with the primitive's
          default h-svh: svh can resolve shorter than the visible viewport
          (a collapsed mobile URL bar, and Chrome DevTools device mode, which
          measures it against the real docked window), leaving the white body
          showing under a too-short shell. `main` below scrolls internally, so
          the document itself never needs to. */}
      <SidebarProvider className="fixed inset-0 h-auto">
        <DashboardSidebar />
        {/* min-w-0: a flex item defaults to min-width:auto (never narrower
            than its content), so one wide table would otherwise force this
            whole column past the viewport's right edge. Capped here, wide
            content scrolls inside its own container (e.g. the shared
            Table's horizontal scroll) instead. */}
        <SidebarInset className="min-w-0 bg-[#FAFAFA]">
          <DashboardHeaderProvider>
            <DashboardHeader />
            <PageToolbarSlot />
            {/* overflow-x-hidden: overflow-y-auto alone computes overflow-x
                to auto too (per the CSS overflow spec's paired-value rule),
                which would let this whole region scroll sideways as one
                unit whenever anything inside is too wide — dragging the
                page's header/buttons/filters along with it instead of just
                the one wide widget (e.g. a table) that actually needs to
                scroll. Explicit here so wide content is always contained by
                its own nearer scroll wrapper (min-w-0 up the tree makes
                that possible) rather than by the whole page. */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
              {children}
            </main>
          </DashboardHeaderProvider>
        </SidebarInset>
      </SidebarProvider>
    </AuthenticatedGuard>
  );
}
