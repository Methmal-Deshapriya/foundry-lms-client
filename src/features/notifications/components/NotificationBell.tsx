"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Bell, CheckCheck, Pin, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { linkTarget } from "@/lib/links";
import { cn, formatLKR } from "@/lib/utils";
import {
  useDismissNotificationMutation,
  useGetMyNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "../notificationsApi";
import type { StudentNotification } from "../notificationsTypes";

export function NotificationLink({ notification, onNavigate }: { notification: StudentNotification; onNavigate?: () => void }) {
  // Only a safe in-app path or an https link is rendered (code review M09-07).
  const target = linkTarget(notification.linkUrl);
  if (!notification.linkUrl || !notification.linkLabel || !target) return null;
  const className = "inline-flex items-center gap-1 text-sm font-semibold text-foreground underline-offset-2 hover:underline";
  const content = (
    <>
      {notification.linkLabel}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </>
  );
  return target === "external" ? (
    <a href={notification.linkUrl} target="_blank" rel="noopener noreferrer" className={className} onClick={onNavigate}>
      {content}
    </a>
  ) : (
    <Link href={notification.linkUrl} className={className} onClick={onNavigate}>
      {content}
    </Link>
  );
}

/** A payment reminder's own lines: exactly what this student still owes. */
export function BalanceLines({ notification }: { notification: StudentNotification }) {
  if (notification.balances.length === 0) return null;
  return (
    <ul className="space-y-1 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
      {notification.balances.map((balance) => (
        <li key={balance.courseTitle} className="flex items-center justify-between gap-3">
          <span className="truncate">{balance.courseTitle}</span>
          <span className="shrink-0 font-semibold tabular-nums">{formatLKR(balance.owed)} due</span>
        </li>
      ))}
    </ul>
  );
}

function NotificationItem({ notification, onNavigate }: { notification: StudentNotification; onNavigate: () => void }) {
  const [markRead] = useMarkNotificationReadMutation();
  const [dismiss] = useDismissNotificationMutation();
  const isReminder = notification.audience === "PARTIAL_PAYERS";

  return (
    <li
      className={cn("relative space-y-2 border-b border-border px-5 py-4 last:border-b-0", !notification.read && "bg-muted/40")}
      onMouseEnter={() => !notification.read && void markRead(notification.id)}
      onFocus={() => !notification.read && void markRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
            isReminder ? "bg-amber-100 text-amber-800" : "bg-[#191919] text-white",
          )}
        >
          {isReminder ? <Wallet className="size-4" aria-hidden="true" /> : notification.pinned ? <Pin className="size-4" aria-hidden="true" /> : <Bell className="size-4" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {!notification.read ? <span className="size-2 shrink-0 rounded-full bg-[#E91717]" aria-label="Unread" /> : null}
            {notification.title}
          </p>
          <p className="text-sm whitespace-pre-line text-muted-foreground">{notification.message}</p>
          <p className="text-[11px] text-muted-foreground">
            {notification.scope ? `${notification.scope} · ` : ""}
            {formatDistanceToNow(new Date(notification.publishedAt), { addSuffix: true })}
          </p>
        </div>
        {notification.dismissible ? (
          <button
            type="button"
            onClick={() => void dismiss(notification.id)}
            aria-label={`Dismiss “${notification.title}”`}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className="space-y-2 pl-11">
        <BalanceLines notification={notification} />
        <NotificationLink notification={notification} onNavigate={onNavigate} />
      </div>
    </li>
  );
}

/**
 * The student's bell in the top bar: unread count, and a side panel listing
 * their notifications. Opening an item (hover/focus) marks it read.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useGetMyNotificationsQuery(undefined, { pollingInterval: 5 * 60_000 });
  const [markAllRead, { isLoading: isMarking }] = useMarkAllNotificationsReadMutation();
  const unread = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative ml-auto flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E91717] px-1 text-[10px] font-bold text-white tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>{unread > 0 ? `${unread} unread` : "You're all caught up."}</SheetDescription>
          </SheetHeader>
          {unread > 0 ? (
            <div className="border-b border-border px-5 py-2">
              <Button type="button" variant="ghost" size="sm" disabled={isMarking} onClick={() => void markAllRead()}>
                <CheckCheck className="size-4" aria-hidden="true" />
                Mark all as read
              </Button>
            </div>
          ) : null}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-5" aria-hidden="true">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bell className="size-5" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground">Class updates, offers and reminders from Foundry Academy will show up here.</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} onNavigate={() => setOpen(false)} />
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
