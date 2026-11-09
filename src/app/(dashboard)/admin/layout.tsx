import type { ReactNode } from "react";
import AdminOnlyRoute from "@/components/access/AdminOnlyRoute";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminOnlyRoute>{children}</AdminOnlyRoute>;
}
