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
import { FilterPills, type FilterPillOption } from "@/components/ui/filter-pills";
import { Input } from "@/components/ui/input";
import { OffsetPagination } from "@/components/ui/offset-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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
  useGetReminderEmailRecipientsQuery,
  usePublishNotificationMutation,
  usePublishPromotionMutation,
} from "@/features/notifications/notificationsApi";
import type { AdminNotification, AdminPromotion, PublishStatus, PublishStatusSummary } from "@/features/notifications/notificationsTypes";
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

// ------------------------------------------------------------- list filters
// Search, status pills with live counts, and paging, the same pattern as the
// other admin tables (code review M09-10). Older notifications and
// promotions used to drop off after the newest 50.
const DEFAULT_PAGE_SIZE = 20;
const MIN_FILTER_LENGTH = 3;
const STATUS_PILLS: { key: PublishStatus | ""; label: string; countKey: keyof PublishStatusSummary; activeClassName: string }[] = [
  { key: "", label: "All", countKey: "all", activeClassName: "border-zinc-300 bg-zinc-100 text-[#191919]" },
  { key: "DRAFT", label: "Draft", countKey: "draft", activeClassName: STATUS_STYLES.Draft },
  { key: "PUBLISHED", label: "Published", countKey: "published", activeClassName: STATUS_STYLES.Live },
  { key: "ARCHIVED", label: "Archived", countKey: "archived", activeClassName: STATUS_STYLES.Archived },
];

function useListFilters() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<PublishStatus | "">("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const appliedQ = debouncedQ.length === 0 || debouncedQ.length >= MIN_FILTER_LENGTH ? debouncedQ : "";
  return {
    params: { q: appliedQ || undefined, status: status || undefined, limit: pageSize, offset },
    q,
    setQ: (value: string) => {
      setQ(value);
      setOffset(0);
    },
    status,
    setStatus: (value: PublishStatus | "") => {
      setStatus(value);
      setOffset(0);
    },
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size);
      setOffset(0);
    },
    setOffset,
  };
}

function ListToolbar({
  filters,
  summary,
  searchLabel,
  placeholder,
}: {
  filters: ReturnType<typeof useListFilters>;
  summary: PublishStatusSummary | undefined;
  searchLabel: string;
  placeholder: string;
}) {
  const options: FilterPillOption<PublishStatus | "">[] = STATUS_PILLS.map(({ key, label, countKey, activeClassName }) => ({
    key,
    label,
    count: summary?.[countKey] ?? 0,
    activeClassName,
  }));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input aria-label={searchLabel} value={filters.q} onChange={(event) => filters.setQ(event.target.value)} placeholder={placeholder} className="h-9 w-full sm:w-56 sm:shrink-0" />
      <FilterPills ariaLabel="Filter by status" options={options} active={filters.status} onChange={filters.setStatus} />
    </div>
  );
}

function ListPagination({
  id,
  filters,
  pagination,
  shownCount,
}: {
  id: string;
  filters: ReturnType<typeof useListFilters>;
  pagination: { total: number; offset: number; hasMore: boolean } | undefined;
  shownCount: number;
}) {
  if (!pagination || pagination.total === 0) return null;
  return (
    <OffsetPagination
      id={id}
      total={pagination.total}
      offset={pagination.offset}
      pageSize={filters.pageSize}
      shownCount={shownCount}
      hasMore={pagination.hasMore}
      onOffsetChange={filters.setOffset}
      onPageSizeChange={filters.setPageSize}
    />
  );
}

// ------------------------------------------------------------- publish dialog
function reminderTiming(item: { startsAt: string | null; endsAt: string | null } | null, now = Date.now()) {
  return {
    startsLater: Boolean(item?.startsAt && new Date(item.startsAt).getTime() > now),
    hasEnded: Boolean(item?.endsAt && new Date(item.endsAt).getTime() < now),
  };
}

function PublishNotificationDialog({ notification, onClose }: { notification: AdminNotification | null; onClose: () => void }) {
  const isReminder = notification?.audience === "PARTIAL_PAYERS";
  // Publishing a draft, or emailing a reminder that's already published
  // (first time, or the students missed last time — code review M09-02).
  const isEmailOnly = notification?.status === "PUBLISHED";
  // Email goes out straight away, so only while the reminder is showing
  // (code review M09-05).
  const { startsLater, hasEnded } = reminderTiming(notification);
  const canEmail = isReminder && !startsLater && !hasEnded;
  const { data: quota } = useGetEmailQuotaQuery(undefined, { skip: !canEmail });
  const { data: recipients } = useGetReminderEmailRecipientsQuery(notification?.id ?? "", { skip: !canEmail || !notification });
  const [sendEmail, setSendEmail] = useState(false);
  // The tick belongs to one notification: opening another, or cancelling,
  // starts unticked (code review M09-08).
  const [forId, setForId] = useState<string | null>(notification?.id ?? null);
  if ((notification?.id ?? null) !== forId) {
    setForId(notification?.id ?? null);
    setSendEmail(false);
  }
  const [publish, { isLoading }] = usePublishNotificationMutation();
  const emailing = canEmail && (isEmailOnly || sendEmail);
  const pending = recipients?.pending ?? 0;
  const fits = quota && recipients ? pending <= quota.availableForNotifications : false;
  const reach = notification?.reach ?? 0;
  const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

  const confirm = async () => {
    if (!notification) return;
    try {
      const result = await publish({ id: notification.id, sendEmail: emailing }).unwrap();
      const email = result.emailResult;
      if (email) {
        const failedText = email.failed ? ` ${plural(email.failed, "email")} failed. Use "Email students not yet emailed" to try them again.` : "";
        (email.failed ? toast.warning : toast.success)(`${isEmailOnly ? "Emailed" : "Published and emailed"} ${plural(email.sent, "student")}.${failedText}`);
      } else {
        toast.success("Published — students will see it in their bell.");
      }
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The notification could not be published."));
    }
  };

  const title = isEmailOnly ? `Email “${notification?.title}”?` : `Publish “${notification?.title}”?`;
  const actionLabel = isEmailOnly ? `Send ${plural(pending, "email")}` : emailing ? "Publish & email" : "Publish";

  return (
    <AlertDialog open={Boolean(notification)} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {notification ? `${AUDIENCE_LABELS[notification.audience]} · reaches ${plural(reach, "student")} in the system.` : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isReminder && !canEmail ? (
          <p className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
            {startsLater
              ? `Email goes out straight away, but this reminder only shows from ${format(new Date(notification!.startsAt!), "MMM d, HH:mm")}. Publish it now, then email it once it's showing.`
              : "This reminder has ended, so it can't be emailed."}
          </p>
        ) : null}
        {canEmail ? (
          <div className="space-y-3">
            {!isEmailOnly ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm">
                <input type="checkbox" checked={sendEmail} onChange={(event) => setSendEmail(event.target.checked)} className="mt-0.5 size-4 accent-[#191919]" />
                <span>
                  <span className="block font-medium text-foreground">Also send as email</span>
                  <span className="block text-xs text-muted-foreground">Each student gets one email listing what they still owe.</span>
                </span>
              </label>
            ) : null}
            {emailing && recipients && recipients.alreadyEmailed > 0 ? (
              <p className="text-xs text-muted-foreground">
                {plural(recipients.alreadyEmailed, "student")} already had this email and won&apos;t get it again.
              </p>
            ) : null}
            {emailing && quota && recipients ? (
              <div className={cn("rounded-lg border p-3 text-sm", fits ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800")}>
                <p className="font-semibold">
                  {pending === 0
                    ? "Everyone in this reminder has already been emailed."
                    : fits
                      ? `This will send ${plural(pending, "email")}.`
                      : `Not enough emails left for ${plural(pending, "student")}.`}
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  Free plan limit: {quota.dailyLimit} emails a day and {quota.monthlyLimit.toLocaleString()} a month — {quota.sentToday} sent today, {quota.sentThisMonth}{" "}
                  this month. {quota.reserve} a day (for today and every day left this month) are kept free for sign-in codes and password resets, so{" "}
                  {quota.availableForNotifications} can be used now.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading || (emailing && (!fits || pending === 0)) || (isEmailOnly && !canEmail)}
            onClick={(event) => {
              event.preventDefault();
              void confirm();
            }}
            className={BLACK_BUTTON}
          >
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
            {isLoading && emailing ? "Sending…" : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------- notifications tab
function NotificationsTab() {
  const filters = useListFilters();
  const { data, isLoading } = useGetAdminNotificationsQuery(filters.params);
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
      <ListToolbar filters={filters} summary={data?.summary} searchLabel="Search notifications" placeholder="Search title or message" />
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
                  {filters.params.q || filters.params.status ? "No notifications match these filters." : "No notifications yet — create one to reach your students."}
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
                      {row.reach ?? "—"} · {row.readCount}
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
                          {row.status === "DRAFT" || (row.audience === "PARTIAL_PAYERS" && row.status === "PUBLISHED") ? (
                            <DropdownMenuItem onSelect={() => setPublishing(row)}>
                              <Send /> {row.status === "DRAFT" ? "Publish" : row.emailSentAt ? "Email students not yet emailed" : "Email this reminder"}
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
      <ListPagination id="notifications-page-size" filters={filters} pagination={data?.pagination} shownCount={rows.length} />
      <NotificationEditorDialog open={editing !== null} notification={editing === "new" ? null : editing} onOpenChange={(open) => !open && setEditing(null)} />
      <PublishNotificationDialog notification={publishing} onClose={() => setPublishing(null)} />
    </div>
  );
}

// ------------------------------------------------------------- promotions tab
function PromotionsTab() {
  const filters = useListFilters();
  const { data, isLoading } = useGetAdminPromotionsQuery(filters.params);
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
      <ListToolbar filters={filters} summary={data?.summary} searchLabel="Search promotions" placeholder="Search name or headline" />
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
                  {filters.params.q || filters.params.status ? "No promotions match these filters." : "No promotions yet — design one to announce an offer on the landing page."}
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
      <ListPagination id="promotions-page-size" filters={filters} pagination={data?.pagination} shownCount={rows.length} />
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
