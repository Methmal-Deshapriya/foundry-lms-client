import { ROLES, type Role } from "@/lib/constants";

export const PERMISSIONS = {
  USERS_VIEW: "USERS_VIEW",
  USERS_MANAGE_ROLES: "USERS_MANAGE_ROLES",
  CATALOG_VIEW_ADMIN: "CATALOG_VIEW_ADMIN",
  CATALOG_EDIT_DRAFTS: "CATALOG_EDIT_DRAFTS",
  CATALOG_PUBLISH: "CATALOG_PUBLISH",
  CATALOG_DELETE_PERMANENTLY: "CATALOG_DELETE_PERMANENTLY",
  LEARNING_SERVICES_VIEW: "LEARNING_SERVICES_VIEW",
  LEARNING_SERVICES_MANAGE: "LEARNING_SERVICES_MANAGE",
  LEARNING_SERVICES_PUBLISH: "LEARNING_SERVICES_PUBLISH",
  LEARNING_SERVICES_DELETE_PERMANENTLY: "LEARNING_SERVICES_DELETE_PERMANENTLY",
  COURSES_SELF_ENROLL: "COURSES_SELF_ENROLL",
  PROJECTS_SUBMIT: "PROJECTS_SUBMIT",
  PROJECTS_VIEW_OWN: "PROJECTS_VIEW_OWN",
  PROJECTS_EDIT_OWN: "PROJECTS_EDIT_OWN",
  SESSIONS_VIEW_LIBRARY: "SESSIONS_VIEW_LIBRARY",
  SESSIONS_MANAGE_LIBRARY: "SESSIONS_MANAGE_LIBRARY",
  SESSIONS_DELETE_PERMANENTLY: "SESSIONS_DELETE_PERMANENTLY",
  COURSE_CURRICULUM_MANAGE: "COURSE_CURRICULUM_MANAGE",
  ENROLLMENTS_MANAGE: "ENROLLMENTS_MANAGE",
  CERTIFICATES_MANAGE: "CERTIFICATES_MANAGE",
  PROJECTS_REVIEW: "PROJECTS_REVIEW",
  AUDIT_VIEW: "AUDIT_VIEW",
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type AuthorizationSubject = {
  permissions?: readonly Permission[];
} | null | undefined;

export function hasPermission(subject: AuthorizationSubject, permission: Permission) {
  return Boolean(subject?.permissions?.includes(permission));
}
export function hasRole(role: Role | null | undefined, allowed: readonly Role[]) { return Boolean(role && allowed.includes(role)); }
export const isStudent = (role: Role | null | undefined) => role === ROLES.STUDENT;
export const isAdmin = (role: Role | null | undefined) => role === ROLES.ADMIN;
export const isSuperAdmin = (role: Role | null | undefined) => role === ROLES.SUPER_ADMIN;
export const canAccessAdminArea = (subject: AuthorizationSubject) => hasPermission(subject, PERMISSIONS.CATALOG_VIEW_ADMIN);
export const canManageUsers = (subject: AuthorizationSubject) => hasPermission(subject, PERMISSIONS.USERS_MANAGE_ROLES);
export const canViewUsers = (subject: AuthorizationSubject) => hasPermission(subject, PERMISSIONS.USERS_VIEW);
export const canViewAuditLogs = (subject: AuthorizationSubject) => hasPermission(subject, PERMISSIONS.AUDIT_VIEW);

// The one place that decides where a logged-in user's "home" is — students
// and admins now have entirely separate dashboards (/dashboard vs.
// /admin/dashboard), so every post-login/verification redirect and the
// sidebar's own Dashboard link all resolve through this instead of each
// hardcoding the split.
export const getDashboardPath = (role: Role | null | undefined) => (isStudent(role) ? "/dashboard" : "/admin/dashboard");
