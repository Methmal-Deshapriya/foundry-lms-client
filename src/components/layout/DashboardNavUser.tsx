"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ChevronsUpDown, UserCircle } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectAuthUser, selectAuthRole } from "@/features/auth/authSelectors";
import { useLogoutMutation } from "@/features/auth/authApi";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

function getInitials(firstName?: string, lastName?: string) {
  const initials = `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`;
  return initials.toUpperCase() || "U";
}

/**
 * DashboardNavUser
 *
 * Real account data, a "My Account" link, and a working Sign Out action —
 * replaces stock nav-user's fake user object and Upgrade/Billing/
 * Notifications items (none of which have corresponding pages in this app).
 */
export function DashboardNavUser() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const user = useAppSelector(selectAuthUser);
  const role = useAppSelector(selectAuthRole);
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Signed out successfully");
      router.push("/");
    } catch {
      toast.error("Logout failed");
      router.push("/");
    }
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const initials = getInitials(user?.firstName, user?.lastName);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg border border-zinc-200 bg-white text-[#191919]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{fullName}</span>
                <span className="truncate text-xs uppercase tracking-wide">{role}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg border border-zinc-200 bg-white text-[#191919]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{fullName}</span>
                  <span className="truncate text-xs text-muted-foreground uppercase tracking-wide">
                    {role}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account">
                <UserCircle />
                My Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
