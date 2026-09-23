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
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="bg-[#FAFAFA]">
          <DashboardHeaderProvider>
            <DashboardHeader />
            <PageToolbarSlot />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </DashboardHeaderProvider>
        </SidebarInset>
      </SidebarProvider>
    </AuthenticatedGuard>
  );
}
