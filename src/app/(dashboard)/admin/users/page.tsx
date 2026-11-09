"use client";

import { useState } from "react";
import { useGetUsersQuery } from "@/features/users/usersApi";
import UserTable from "@/features/users/components/UserTable";
import { useAppSelector } from "@/store/hooks";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { canManageUsers, canViewUsers } from "@/lib/access";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { OffsetPagination } from "@/components/ui/offset-pagination";
import { Icons } from "@/lib/icons";
import { ROLES, type Role } from "@/lib/constants";

/**
 * Admin User Management Page
 * 
 * Allows admins to view users and super admins to manage roles.
 */
const DEFAULT_PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const user = useAppSelector(selectAuthUser);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const { data, isLoading, isError, isFetching } = useGetUsersQuery({
    limit: pageSize,
    offset,
    role: selectedRole || undefined,
  });

  // --- Security Check (Double protection) ---
  if (!canViewUsers(user)) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-12 text-center">
        <h2 className="mb-2 text-2xl font-bold text-red-900">Access Restricted</h2>
        <p className="text-red-700">You do not have permission to view platform users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogPageHeader
        title="User Management"
        description="Oversee platform users, manage access levels, and promote administrators."
        icon={Icons.users}
        action={
          <select
            aria-label="Filter by role"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none"
            value={selectedRole}
            onChange={(event) => {
              setSelectedRole(event.target.value as Role | "");
              setOffset(0);
            }}
          >
            <option value="">All roles</option>
            <option value={ROLES.STUDENT}>Students</option>
            <option value={ROLES.ADMIN}>Admins</option>
            <option value={ROLES.SUPER_ADMIN}>Super Admins</option>
          </select>
        }
      />

      <div className="space-y-6">
        <UserTable
          users={data?.users ?? []}
          canManageRoles={canManageUsers(user)}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          emptyMessage={
            selectedRole
              ? "No users match the selected role."
              : "No platform users have been registered yet."
          }
        />

        {data ? (
          <OffsetPagination
            id="users-page-size"
            total={data.pagination.total}
            offset={offset}
            pageSize={pageSize}
            shownCount={data.users.length}
            hasMore={data.pagination.hasMore}
            onOffsetChange={setOffset}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setOffset(0);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
