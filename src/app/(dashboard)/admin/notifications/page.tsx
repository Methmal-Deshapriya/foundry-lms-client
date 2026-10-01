"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Archive, Loader2, MoreHorizontal, Pencil, Pin, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableSkeletonRows } from "@/components/ui/loading-skeletons";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminCatalogPageHeader } from "@/features/catalog/components/AdminCatalogPageHeader";
import { AUDIENCE_LABELS, NotificationEditorDialog } from "@/features/notifications/components/NotificationEditorDialog";
import { PromotionEditorDialog } from "@/features/notifications/components/PromotionEditorDialog";
import {
  useArchiveNotificationMutation,
  useArchivePromotionMutation,
  useDeleteNotificationMutation,
  useDeletePromotionMutation,
  useGetAdminNotificationsQuery,
  useGetAdminPromotionsQuery,
  useGetEmailQuotaQuery,
  usePublishNotificationMutation,
  usePublishPromotionMutation,
} from "@/features/notifications/notificationsApi";
import type { AdminNotification, AdminPromotion, PublishStatus } from "@/features/notifications/notificationsTypes";
import { getApiErrorMessage } from "@/lib/api";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";

const BLACK_BUTTON = "bg-[#191919] bg-none text-white hover:bg-[#27272A]";

type DisplayStatus = "Draft" | "Scheduled" | "Live" | "Ended" | "Archived";
const STATUS_STYLES: Record<DisplayStatus, string> = {
  Draft: "border-zinc-300 bg-zinc-100 text-zinc-700",
  Scheduled: "border-sky-200 bg-sky-50 text-sky-700",
  Live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Ended: "border-zinc-200 bg-white text-zinc-500",
  Archived: "border-zinc-200 bg-white text-zinc-500",
};

function displayStatus(item: { status: PublishStatus; startsAt: string | null; endsAt: string | null }, now = Date.now()): DisplayStatus {
  if (item.status === "DRAFT") return "Draft";
  if (item.status === "ARCHIVED") return "Archived";
  if (item.startsAt && new Date(item.startsAt).getTime() > now) return "Scheduled";
  if (item.endsAt && new Date(item.endsAt).getTime() < now) return "Ended";
  return "Live";
}

function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status])}>
      {status}
    </Badge>
  );
}

function windowText(item: { startsAt: string | null; endsAt: string | null }) {
  if (!item.startsAt && !item.endsAt) return "Always, once published";
  const from = item.startsAt ? format(new Date(item.startsAt), "MMM d, HH:mm") : "Publish";
  const to = item.endsAt ? format(new Date(item.endsAt), "MMM d, HH:mm") : "until archived";
  return `${from} → ${to}`;
}

// ------------------------------------------------------------- publish dialog
function PublishNotificationDialog({ notification, onClose }: { notification: AdminNotification | null; onClose: () => void }) {
  const isReminder = notification?.audience === "PARTIAL_PAYERS";
  const { data: quota } = useGetEmailQuotaQuery(undefined, { skip: !isReminder });
  const [sendEmail, setSendEmail] = useState(false);
  const [publish, { isLoading }] = usePublishNotificationMutation();
  const recipients = notification?.reach ?? 0;
  const fits = quota ? recipients <= quota.availableForNotifications : false;
  const alreadyEmailed = Boolean(notification?.emailSentAt);

  const confirm = async () => {
    if (!notification) return;
    try {
      const result = await publish({ id: notification.id, sendEmail: isReminder && sendEmail }).unwrap();
      toast.success(sendEmail ? `Published and emailed ${result.emailSentCount} student(s).` : "Published — students will see it in their bell.");
      setSendEmail(false);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The notification could not be published."));
    }
  };

  return (
    <AlertDialog open={Boolean(notification)} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish “{notification?.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {notification ? `${AUDIENCE_LABELS[notification.audience]} · reaches ${recipients} student${recipients === 1 ? "" : "s"} in the system.` : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isReminder && !alreadyEmailed ? (
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm">
              <input type="checkbox" checked={sendEmail} onChange={(event) => setSendEmail(event.target.checked)} className="mt-0.5 size-4 accent-[#191919]" />
              <span>
                <span className="block font-medium text-foreground">Also send as email</span>
                <span className="block text-xs text-muted-foreground">Each student gets one email listing what they still owe.</span>
              </span>
            </label>
            {sendEmail && quota ? (
              <div className={cn("rounded-lg border p-3 text-sm", fits ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800")}>
                <p className="font-semibold">
                  {fits ? `This will send ${recipients} email${recipients === 1 ? "" : "s"}.` : `Not enough emails left today for ${recipients} student${recipients === 1 ? "" : "s"}.`}
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  Free plan limit: {quota.dailyLimit} emails a day and {quota.monthlyLimit.toLocaleString()} a month — {quota.sentToday} sent today, {quota.sentThisMonth}{" "}
                  this month. {quota.reserve} are always kept free for sign-in codes and password resets, so {quota.availableForNotifications} can be used now. Using them
                  up means those emails can&apos;t go out until tomorrow.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
        {isReminder && alreadyEmailed ? <p className="text-xs text-muted-foreground">This reminder was already emailed on {format(new Date(notification.emailSentAt!), "MMM d")}.</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading || (sendEmail && !fits)}
            onClick={(event) => {
              event.preventDefault();
              void confirm();
            }}
            className={BLACK_BUTTON}
          >
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
            {sendEmail ? "Publish & email" : "Publish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------- notifications tab
function NotificationsTab() {
  const { data, isLoading } = useGetAdminNotificationsQuery({ limit: 50 });
  const [editing, setEditing] = useState<AdminNotification | "new" | null>(null);
  const [publishing, setPublishing] = useState<AdminNotification | null>(null);
  const [archive] = useArchiveNotificationMutation();
  const [remove] = useDeleteNotificationMutation();
  const rows = data?.notifications ?? [];

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "That didn't work."));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Messages shown in students&apos; notification bell. Payment reminders can also be emailed.</p>
        <Button className={cn("w-full sm:w-auto", BLACK_BUTTON)} onClick={() => setEditing("new")}>
          <Plus className="size-4" aria-hidden="true" />
          New notification
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed">
          <TableCaption className="sr-only">Notifications</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-64 pl-4">Title</TableHead>
              <TableHead className="w-44">Audience</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-52">Shown</TableHead>
              <TableHead className="w-32 text-right">Reach · read</TableHead>
              <TableHead className="w-20 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows columns={6} label="Loading notifications…" />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No notifications yet — create one to reach your students.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const status = displayStatus(row);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-0 pl-4">
                      <p className="flex items-center gap-1.5 font-medium" title={row.title}>
                        {row.pinned ? <Pin className="size-3.5 shrink-0" aria-label="Pinned" /> : null}
                        <span className="truncate">{row.title}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.emailSentAt ? `Emailed to ${row.emailSentCount} · ` : ""}
                        by {row.createdBy ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <p className="truncate">{AUDIENCE_LABELS[row.audience]}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.intake?.code ?? row.course?.title ?? ""}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{windowText(row)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {row.reach} · {row.readCount}
                    </TableCell>
                    <TableCell className="pr-4 text-right" data-no-row-navigation>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${row.title}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {row.status !== "ARCHIVED" ? (
                            <DropdownMenuItem onSelect={() => setEditing(row)}>
                              <Pencil /> Edit
                            </DropdownMenuItem>
                          ) : null}
                          {row.status === "DRAFT" || (row.audience === "PARTIAL_PAYERS" && row.status === "PUBLISHED" && !row.emailSentAt) ? (
                            <DropdownMenuItem onSelect={() => setPublishing(row)}>
                              <Send /> {row.status === "DRAFT" ? "Publish" : "Email this reminder"}
                            </DropdownMenuItem>
                          ) : null}
                          {row.status === "PUBLISHED" ? (
                            <DropdownMenuItem onSelect={() => void run(() => archive(row.id).unwrap(), "Archived — students no longer see it.")}>
                              <Archive /> Archive
                            </DropdownMenuItem>
                          ) : null}
                          {row.status === "DRAFT" ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => void run(() => remove(row.id).unwrap(), "Draft deleted.")}>
                                <Trash2 /> Delete draft
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <NotificationEditorDialog open={editing !== null} notification={editing === "new" ? null : editing} onOpenChange={(open) => !open && setEditing(null)} />
      <PublishNotificationDialog notification={publishing} onClose={() => setPublishing(null)} />
    </div>
  );
}

// ------------------------------------------------------------- promotions tab
function PromotionsTab() {
  const { data, isLoading } = useGetAdminPromotionsQuery({ limit: 50 });
  const [editing, setEditing] = useState<AdminPromotion | "new" | null>(null);
  const [publish] = usePublishPromotionMutation();
  const [archive] = useArchivePromotionMutation();
  const [remove] = useDeletePromotionMutation();
  const rows = data?.promotions ?? [];

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "That didn't work."));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">The floating banner at the top of the landing page. Only the newest live promotion shows.</p>
        <Button className={cn("w-full sm:w-auto", BLACK_BUTTON)} onClick={() => setEditing("new")}>
          <Plus className="size-4" aria-hidden="true" />
          New promotion
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed">
          <TableCaption className="sr-only">Landing-page promotions</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-56 pl-4">Promotion</TableHead>
              <TableHead className="w-64">Headline</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="w-52">Shown</TableHead>
              <TableHead className="w-20 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows columns={5} label="Loading promotions…" />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No promotions yet — design one to announce an offer on the landing page.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-0 pl-4">
                    <p className="truncate font-medium">{row.internalName}</p>
                    <p className="truncate text-xs text-muted-foreground">by {row.createdBy ?? "—"}</p>
                  </TableCell>
                  <TableCell className="max-w-0">
                    <p className="truncate" title={row.headline}>
                      {row.badge ? <span className="mr-1.5 rounded bg-[#191919] px-1.5 py-0.5 text-[10px] font-bold text-white">{row.badge}</span> : null}
                      {row.headline}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <StatusBadge status={displayStatus(row)} />
                      {row.isShowing ? <Badge className="bg-[#191919] text-white">Showing</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{windowText(row)}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${row.internalName}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {row.status !== "ARCHIVED" ? (
                          <DropdownMenuItem onSelect={() => setEditing(row)}>
                            <Pencil /> Edit
                          </DropdownMenuItem>
                        ) : null}
                        {row.status !== "ARCHIVED" ? (
                          <DropdownMenuItem onSelect={() => void run(() => publish(row.id).unwrap(), "Published — it now shows on the landing page (within its dates).")}>
                            <Send /> {row.status === "DRAFT" ? "Publish" : "Publish again (move to front)"}
                          </DropdownMenuItem>
                        ) : null}
                        {row.status === "PUBLISHED" ? (
                          <DropdownMenuItem onSelect={() => void run(() => archive(row.id).unwrap(), "Archived — it no longer shows.")}>
                            <Archive /> Archive
                          </DropdownMenuItem>
                        ) : null}
                        {row.status === "DRAFT" ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => void run(() => remove(row.id).unwrap(), "Draft deleted.")}>
                              <Trash2 /> Delete draft
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PromotionEditorDialog open={editing !== null} promotion={editing === "new" ? null : editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  );
}

/**
 * Notifications & Promotions — every admin. In-app messages to students,
 * and the landing page's floating promotion banner. See
 * foundry_lms_docs/2026-10-01_next_features_implementation_plan.md §5.
 */
export default function NotificationsAdminPage() {
  return (
    <div className="space-y-6 pb-20">
      <AdminCatalogPageHeader
        title="Notifications"
        description="Message students inside the system, and design the promotion banner on the landing page."
        icon={Icons.notifications}
      />
      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
        </TabsList>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="promotions">
          <PromotionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
