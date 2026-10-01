export type NotificationAudience = "ALL_STUDENTS" | "COURSE" | "INTAKE" | "PARTIAL_PAYERS" | "COURSE_INTEREST";
export type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type PromotionTheme = "DARK" | "LIGHT" | "RED";

/** What a signed-in student sees. */
export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  audience: NotificationAudience;
  /** Course title or intake code the notification is about, if any. */
  scope: string | null;
  linkLabel: string | null;
  linkUrl: string | null;
  pinned: boolean;
  publishedAt: string;
  read: boolean;
  /** Payment reminders can't be dismissed: they stay until the balance is paid. */
  dismissible: boolean;
  /** For payment reminders: this student's own outstanding balances. */
  balances: { courseTitle: string; owed: number }[];
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  audience: NotificationAudience;
  course: { id: string; title: string } | null;
  intake: { id: string; code: string } | null;
  linkLabel: string | null;
  linkUrl: string | null;
  pinned: boolean;
  startsAt: string | null;
  endsAt: string | null;
  status: PublishStatus;
  isLive: boolean;
  publishedAt: string | null;
  emailSentCount: number;
  emailSentAt: string | null;
  createdBy: string | null;
  reach: number;
  readCount: number;
  updatedAt: string;
}

export interface SaveNotificationRequest {
  title: string;
  message: string;
  audience: NotificationAudience;
  courseId?: string | null;
  intakeId?: string | null;
  linkLabel?: string | null;
  linkUrl?: string | null;
  pinned?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface EmailQuota {
  sentToday: number;
  sentThisMonth: number;
  dailyLimit: number;
  monthlyLimit: number;
  reserve: number;
  availableForNotifications: number;
}

/** The public shape of the landing-page banner. */
export interface PublicPromotion {
  id: string;
  headline: string;
  message: string | null;
  badge: string | null;
  theme: PromotionTheme;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  showCountdown: boolean;
  startsAt: string | null;
  endsAt: string | null;
  updatedAt: string;
}

export interface AdminPromotion extends PublicPromotion {
  internalName: string;
  imageObjectId: string | null;
  imageObject: { id: string; fileName: string; contentType: string; sizeBytes: number; publicUrl: string | null } | null;
  status: PublishStatus;
  isLive: boolean;
  /** The one promotion the landing page is showing right now. */
  isShowing: boolean;
  publishedAt: string | null;
  createdBy: string | null;
}

export interface SavePromotionRequest {
  internalName: string;
  headline: string;
  message?: string | null;
  badge?: string | null;
  theme: PromotionTheme;
  imageObjectId?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  showCountdown?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}
