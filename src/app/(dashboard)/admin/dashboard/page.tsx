"use client";

import AdminDashboard from "@/features/dashboard/components/AdminDashboard";

/**
 * The admin/super-admin dashboard — split out from the student one at
 * /dashboard (they used to share a single route, branching on role).
 * Access control is inherited from admin/layout.tsx's AdminOnlyRoute, like
 * every other page under /admin.
 */
export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
