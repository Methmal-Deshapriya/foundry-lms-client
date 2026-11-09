"use client";

import { Pin, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDismissNotificationMutation, useGetMyNotificationsQuery } from "../notificationsApi";
import { BalanceLines, NotificationLink } from "./NotificationBell";

/**
 * Student dashboard: pinned notifications and every payment reminder, as
 * cards above the page content. Renders nothing when there are none.
 */
export function PinnedNotifications() {
  const { data } = useGetMyNotificationsQuery();
  const [dismiss] = useDismissNotificationMutation();
  const items = (data?.notifications ?? []).filter((notification) => notification.pinned || notification.audience === "PARTIAL_PAYERS");
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((notification) => {
        const isReminder = notification.audience === "PARTIAL_PAYERS";
        return (
          <section
            key={notification.id}
            className={cn("flex items-start gap-3 rounded-xl border p-4", isReminder ? "border-amber-200 bg-amber-50/60" : "border-border bg-card")}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                isReminder ? "bg-amber-100 text-amber-800" : "bg-[#191919] text-white",
              )}
            >
              {isReminder ? <Wallet className="size-4" aria-hidden="true" /> : <Pin className="size-4" aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{notification.title}</h2>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{notification.message}</p>
              </div>
              <BalanceLines notification={notification} />
              <NotificationLink notification={notification} />
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
          </section>
        );
      })}
    </div>
  );
}
