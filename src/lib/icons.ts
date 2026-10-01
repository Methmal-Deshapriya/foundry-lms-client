import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Clock,
  Compass,
  DollarSign,
  FileText,
  FolderCode,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  HandCoins,
  Wallet,
  Layers,
  Library,
  ShieldCheck,
  Users,
} from "lucide-react";

/**
 * Central icon registry. Every icon used across the app is referenced by
 * its semantic key here rather than importing an icon component directly
 * from lucide-react (or any other icon set) in feature code. Swapping what
 * an icon looks like — or swapping the icon library entirely — then only
 * ever touches this one file.
 */
export const Icons = {
  dashboard: LayoutDashboard,
  explore: Compass,
  myCourses: BookOpen,
  certificates: Award,
  myProjects: FolderCode,
  services: ShieldCheck,
  sessionLibrary: Library,
  manageCertificates: Award,
  reviewProjects: FolderCode,
  users: Users,
  auditLogs: FileText,
  payments: Wallet,
  notifications: Megaphone,
  partnerEarnings: HandCoins,
  enrollments: GraduationCap,
  pending: Clock,
  revenue: DollarSign,
  intakes: Layers,
  attention: AlertTriangle,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof Icons;
