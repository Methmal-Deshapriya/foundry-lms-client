"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Archive, Clock, GripVertical, Link2, Loader2, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SequenceRiskConfirmationDialog } from "@/components/admin/SequenceRiskConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getApiErrorMessage, isNormalizedApiError } from "@/lib/api";
import { COURSE_SESSION_DELIVERY_STATUS_STYLES, SESSION_STATUS_STYLES } from "@/lib/statusColors";
import { cn } from "@/lib/utils";
import { RecordingPreview } from "./RecordingPreview";
import { ScheduleReleaseDialog } from "./ScheduleReleaseDialog";
import {
  useAttachCourseSessionMutation,
  useGetCourseCurriculumQuery,
  useGetSessionLibraryQuery,
  useRemoveCourseSessionMutation,
  useReorderCourseCurriculumMutation,
  useUpdateCourseSessionDeliveryMutation,
} from "../../sessionsApi";
import type { CourseSession, CourseSessionDeliveryStatus } from "../../sessionsTypes";

type PendingRisk =
  | { kind: "REORDER"; courseSessions: { id: string; orderIndex: number }[]; message: string; details?: unknown }
  | { kind: "DELIVERY"; courseSessionId: string; status: CourseSessionDeliveryStatus; availableAt?: string | null; message: string; details?: unknown };

const statusClass = COURSE_SESSION_DELIVERY_STATUS_STYLES;

const INTERACTIVE_SELECTOR = "input,button,a,[role=menuitem],[data-no-row-navigation]";

/**
 * One row of the active curriculum — a syllabus is a single ordered
 * sequence, not independently sortable/filterable data, so this is a
 * drag-reorderable card rather than a table row. See the 2026-09-01
 * curriculum-tab redesign: dnd-kit's KeyboardSensor makes the drag handle
 * itself keyboard-operable (focus it, Space to lift, arrow keys to move,
 * Space to drop), so there's no separate "Move up/down" control to keep.
 */
function CurriculumCard({
  item,
  position,
  readOnly,
  dimmed,
  onOpenDetail,
  onRelease,
  onSchedule,
  onWithdraw,
  onRemove,
}: {
  item: CourseSession;
  position: number;
  readOnly: boolean;
  dimmed: boolean;
  onOpenDetail: () => void;
  onRelease: () => void;
  onSchedule: () => void;
  onWithdraw: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${item.session.title}`}
      className={cn(
        "flex cursor-pointer flex-col gap-2 rounded-md border bg-card p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "relative z-10 shadow-md",
        dimmed && "opacity-40",
      )}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
        onOpenDetail();
      }}
      onKeyDown={(event) => {
        if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetail();
        }
      }}
    >
      <div className="flex items-center gap-3">
        {!readOnly ? (
          <button
            type="button"
            aria-label={`Reorder ${item.session.title}`}
            data-no-row-navigation
            className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        ) : null}
        <span className="w-6 shrink-0 text-center font-mono text-sm text-muted-foreground">{position}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold" title={item.session.title}>
            {item.session.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.session.durationMinutes ? `${item.session.durationMinutes} minutes` : "Duration not set"}
          </p>
        </div>
        {readOnly ? (
          <span className="shrink-0 text-xs text-muted-foreground">Read only</span>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${item.session.title}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {item.deliveryStatus !== "RELEASED" ? (
                <DropdownMenuItem onSelect={onRelease}>Release now</DropdownMenuItem>
              ) : null}
              {item.deliveryStatus !== "RELEASED" ? (
                <DropdownMenuItem onSelect={onSchedule}>
                  {item.deliveryStatus === "SCHEDULED" ? "Reschedule release" : "Schedule release"}
                </DropdownMenuItem>
              ) : null}
              {item.deliveryStatus === "RELEASED" || item.deliveryStatus === "SCHEDULED" ? (
                <DropdownMenuItem onSelect={onWithdraw}>Withdraw</DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                <Trash2 /> Remove from curriculum
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-9 text-xs text-muted-foreground">
        <Badge variant="outline" className={cn("shrink-0", statusClass[item.deliveryStatus])}>
          {item.deliveryStatus.replace("_", " ")}
        </Badge>
        {item.availableAt ? (
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {format(new Date(item.availableAt), "MMM d, yyyy · h:mm a")}
          </span>
        ) : null}
        <span className="shrink-0 font-mono">{item.usage.completionCount} done</span>
      </div>
    </div>
  );
}

export default function CourseCurriculumManager({
  intakeId,
  readOnly = false,
}: {
  intakeId: string;
  serviceSlug?: string;
  categoryId?: string;
  readOnly?: boolean;
}) {
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(() => new Set());
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [attachSearch, setAttachSearch] = useState("");
  const [attaching, setAttaching] = useState(false);
  const [pendingRisk, setPendingRisk] = useState<PendingRisk | null>(null);
  const [q, setQ] = useState("");
  const [detailItem, setDetailItem] = useState<CourseSession | null>(null);
  const { data, isLoading, isError } = useGetCourseCurriculumQuery({ intakeId, includeRetired: true });
  const { data: library, isFetching: libraryLoading } = useGetSessionLibraryQuery(
    { attachableIntakeId: intakeId },
    { skip: readOnly },
  );
  const [attach, attachState] = useAttachCourseSessionMutation();
  const [reorder, reorderState] = useReorderCourseCurriculumMutation();
  const [remove, removeState] = useRemoveCourseSessionMutation();
  const [updateDelivery, deliveryState] = useUpdateCourseSessionDeliveryMutation();

  const serverActive = useMemo(() => data?.curriculum.filter((item) => !item.retiredAt) ?? [], [data]);
  const retired = useMemo(() => data?.curriculum.filter((item) => item.retiredAt) ?? [], [data]);

  // Optimistic drag order: shown the instant a card is dropped, before the
  // reorder request (and any sequence-risk confirmation) has settled.
  // Ignored (falls back to server order) once the server's own order
  // catches up, so there's never a stale-vs-fresh flicker; the dialog/error
  // handlers below clear it immediately if the reorder is cancelled or
  // rejected, snapping back to the last confirmed order right away instead
  // of waiting for that natural catch-up.
  const [localOrder, setLocalOrder] = useState<CourseSession[] | null>(null);
  const active = useMemo(() => {
    if (!localOrder) return serverActive;
    const serverIds = serverActive.map((item) => item.id).join(",");
    const localIds = localOrder.map((item) => item.id).join(",");
    return serverIds === localIds ? serverActive : localOrder;
  }, [serverActive, localOrder]);
  const attachable = useMemo(() => library?.sessions ?? [], [library]);
  const attachableFiltered = useMemo(() => {
    const query = attachSearch.trim().toLowerCase();
    return query ? attachable.filter((session) => session.title.toLowerCase().includes(query)) : attachable;
  }, [attachable, attachSearch]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const toggleAttachSelect = (sessionId: string) => {
    setSelectedSessionIds((current) => {
      const next = new Set(current);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const allAttachableFilteredSelected =
    attachableFiltered.length > 0 && attachableFiltered.every((session) => selectedSessionIds.has(session.id));
  const toggleAttachSelectAll = () => {
    setSelectedSessionIds((current) => {
      if (allAttachableFilteredSelected) {
        const next = new Set(current);
        for (const session of attachableFiltered) next.delete(session.id);
        return next;
      }
      return new Set([...current, ...attachableFiltered.map((session) => session.id)]);
    });
  };

  const attachSelected = async () => {
    if (selectedSessionIds.size === 0) return;
    setAttaching(true);
    // Attached one at a time (not Promise.all) so ordering matches selection
    // order and a failure on one session doesn't affect the rest — each
    // outcome is tracked individually so only the ones that actually
    // succeeded are cleared from the selection below.
    const succeededIds = new Set<string>();
    let failure: unknown = null;
    for (const sessionId of selectedSessionIds) {
      try {
        await attach({ intakeId, sessionId }).unwrap();
        succeededIds.add(sessionId);
      } catch (error) {
        failure = error;
      }
    }
    setAttaching(false);
    setSelectedSessionIds((current) => new Set([...current].filter((id) => !succeededIds.has(id))));
    if (succeededIds.size > 0) {
      toast.success(succeededIds.size === 1 ? "Session attached as unreleased" : `${succeededIds.size} sessions attached as unreleased`);
    }
    if (failure) {
      toast.error(getApiErrorMessage(failure, "Could not attach one of the selected sessions"));
    } else {
      setAttachDialogOpen(false);
      setAttachSearch("");
    }
  };

  const submitReorder = async (
    courseSessions: { id: string; orderIndex: number }[],
    acknowledgeSequenceRisk = false,
  ) => {
    try {
      await reorder({ intakeId, courseSessions, acknowledgeSequenceRisk }).unwrap();
      setPendingRisk(null);
      toast.success("Curriculum order updated");
    } catch (error) {
      if (isNormalizedApiError(error) && error.code === "SEQUENCE_RISK_CONFIRMATION_REQUIRED" && !acknowledgeSequenceRisk) {
        setPendingRisk({ kind: "REORDER", courseSessions, message: error.message, details: error.details });
        // Keep showing the dropped-to order while the confirmation dialog is
        // up — it only snaps back if the dialog is dismissed without confirming.
      } else {
        toast.error(getApiErrorMessage(error, "Could not reorder curriculum"));
        setLocalOrder(null);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: draggedItem, over } = event;
    if (!over || draggedItem.id === over.id) return;
    const oldIndex = active.findIndex((item) => item.id === draggedItem.id);
    const newIndex = active.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(active, oldIndex, newIndex);
    setLocalOrder(reordered);
    void submitReorder(reordered.map((item, orderIndex) => ({ id: item.id, orderIndex })));
  };

  const changeDelivery = async (
    courseSessionId: string,
    status: CourseSessionDeliveryStatus,
    availableAt?: string | null,
    acknowledgeSequenceRisk = false,
  ) => {
    try {
      await updateDelivery({ intakeId, courseSessionId, status, availableAt, acknowledgeSequenceRisk }).unwrap();
      setPendingRisk(null);
      toast.success(`Session changed to ${status.toLowerCase()}`);
    } catch (error) {
      if (isNormalizedApiError(error) && error.code === "SEQUENCE_RISK_CONFIRMATION_REQUIRED" && !acknowledgeSequenceRisk) {
        setPendingRisk({ kind: "DELIVERY", courseSessionId, status, availableAt, message: error.message, details: error.details });
      } else toast.error(getApiErrorMessage(error, "Could not change session delivery"));
    }
  };

  const [scheduleTarget, setScheduleTarget] = useState<string | null>(null);

  const removeItem = async (courseSessionId: string) => {
    try {
      const result = await remove({ intakeId, courseSessionId }).unwrap();
      toast.success(result.action === "RETIRED" ? "Released history retired and preserved" : "Unused session detached");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not remove session"));
    }
  };

  if (isLoading) return <p role="status" aria-live="polite" className="py-14 text-center text-muted-foreground">Loading curriculum…</p>;
  if (isError || !data) return <p role="alert" className="rounded-md bg-destructive/10 p-5 text-destructive">Could not load the curriculum.</p>;

  const query = q.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          aria-label="Highlight sessions by title"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Highlight by session title"
          className="h-9 w-64 shrink-0"
        />
        {!readOnly ? (
          <Button className="shrink-0" onClick={() => setAttachDialogOpen(true)}>
            <Link2 /> Attach session
          </Button>
        ) : null}
      </div>

      {active.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          No sessions are attached to this intake yet.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={active.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {active.map((item, index) => (
                <CurriculumCard
                  key={item.id}
                  item={item}
                  position={index + 1}
                  readOnly={readOnly}
                  dimmed={query.length > 0 && !item.session.title.toLowerCase().includes(query)}
                  onOpenDetail={() => setDetailItem(item)}
                  onRelease={() => changeDelivery(item.id, "RELEASED")}
                  onSchedule={() => setScheduleTarget(item.id)}
                  onWithdraw={() => changeDelivery(item.id, "WITHDRAWN")}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {retired.length ? (
        <section className="mt-10 space-y-4 rounded-lg border bg-muted/40 p-4">
          <div className="flex items-start gap-2">
            <Archive className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-muted-foreground">Retired sessions</h2>
              <p className="text-sm text-muted-foreground">
                Outside the active curriculum above — preserved because they were previously exposed or completed.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {retired.map((item) => (
              <div
                key={item.id}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${item.session.title}`}
                className="flex cursor-pointer flex-col gap-2 rounded-md border bg-card p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-3"
                onClick={(event) => {
                  if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
                  setDetailItem(item);
                }}
                onKeyDown={(event) => {
                  if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setDetailItem(item);
                  }
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold" title={item.session.title}>
                    {item.session.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Historical position {item.historicalOrderIndex == null ? "—" : `#${item.historicalOrderIndex + 1}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("shrink-0", statusClass[item.deliveryStatus])}>
                    {item.deliveryStatus.replace("_", " ")}
                  </Badge>
                  <span className="shrink-0 text-right font-mono text-sm text-muted-foreground">
                    {item.usage.completionCount} done
                  </span>
                  {readOnly ? (
                    <span className="shrink-0 text-xs text-muted-foreground">Read only</span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={attachState.isLoading}
                      data-no-row-navigation
                      onClick={() =>
                        attach({ intakeId, sessionId: item.session.id })
                          .unwrap()
                          .then(() => toast.success("Session reattached as withdrawn"))
                          .catch((error) => toast.error(getApiErrorMessage(error, "Could not reattach session")))
                      }
                    >
                      <RotateCcw /> Reattach
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Dialog
        open={attachDialogOpen}
        onOpenChange={(open) => {
          setAttachDialogOpen(open);
          if (!open) {
            setSelectedSessionIds(new Set());
            setAttachSearch("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Attach sessions</DialogTitle>
            <DialogDescription>
              Attach ready Session Library resources this intake hasn&apos;t used yet. Each is added as unreleased.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              aria-label="Search sessions"
              placeholder="Search session title"
              value={attachSearch}
              onChange={(event) => setAttachSearch(event.target.value)}
            />
            {attachableFiltered.length > 0 ? (
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
                <input type="checkbox" checked={allAttachableFilteredSelected} onChange={toggleAttachSelectAll} />
                Select all{attachSearch ? " matching" : ""} ({attachableFiltered.length})
              </label>
            ) : null}
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
              {libraryLoading ? (
                <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
                </p>
              ) : attachableFiltered.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {attachable.length === 0 ? "No ready sessions available." : "No sessions match your search."}
                </p>
              ) : (
                attachableFiltered.map((session) => (
                  <label
                    key={session.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted/60"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSessionIds.has(session.id)}
                      onChange={() => toggleAttachSelect(session.id)}
                    />
                    <span>
                      <span className="block text-sm font-semibold">{session.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {session.durationMinutes ? `${session.durationMinutes} minutes` : "Duration not set"}
                        {session.tags.length > 0 ? ` · ${session.tags.join(", ")}` : ""}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
            <Button disabled={selectedSessionIds.size === 0 || attaching} onClick={attachSelected}>
              {attaching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              {selectedSessionIds.size > 1 ? `Attach ${selectedSessionIds.size} sessions` : "Attach session"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ScheduleReleaseDialog
        open={Boolean(scheduleTarget)}
        onOpenChange={(open) => { if (!open) setScheduleTarget(null); }}
        isLoading={deliveryState.isLoading}
        onConfirm={(isoDate) => {
          if (!scheduleTarget) return;
          void changeDelivery(scheduleTarget, "SCHEDULED", isoDate);
          setScheduleTarget(null);
        }}
      />

      <SequenceRiskConfirmationDialog
        open={Boolean(pendingRisk)}
        description={pendingRisk?.message ?? "Confirm this sequence exception."}
        details={pendingRisk?.details}
        isLoading={reorderState.isLoading || deliveryState.isLoading || removeState.isLoading}
        onOpenChange={(open) => {
          if (!open) {
            // Dismissed (Cancel, Escape, click outside) without confirming —
            // snap the optimistic drag order back to the last confirmed one.
            if (pendingRisk?.kind === "REORDER") setLocalOrder(null);
            setPendingRisk(null);
          }
        }}
        onConfirm={() => {
          if (!pendingRisk) return;
          if (pendingRisk.kind === "REORDER") void submitReorder(pendingRisk.courseSessions, true);
          else void changeDelivery(pendingRisk.courseSessionId, pendingRisk.status, pendingRisk.availableAt, true);
        }}
      />

      <Sheet open={Boolean(detailItem)} onOpenChange={(open) => !open && setDetailItem(null)}>
        <SheetContent className="flex flex-col sm:max-w-lg">
          {detailItem ? (
            <>
              <SheetHeader>
                <SheetTitle>{detailItem.session.title}</SheetTitle>
                <SheetDescription>
                  {detailItem.session.description || "No description provided."}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-5 overflow-y-auto px-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={statusClass[detailItem.deliveryStatus]}>
                    {detailItem.deliveryStatus.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className={SESSION_STATUS_STYLES[detailItem.session.status]}>
                    Library: {detailItem.session.status.charAt(0) + detailItem.session.status.slice(1).toLowerCase()}
                  </Badge>
                  {(detailItem.session.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <RecordingPreview url={detailItem.session.recordingUrl} />

                <div className="grid grid-cols-3 gap-2">
                  {(["materialUrl", "quizUrl", "feedbackUrl"] as const).map((field) => {
                    const label = field === "materialUrl" ? "Material" : field === "quizUrl" ? "Quiz" : "Feedback";
                    const url = detailItem.session[field];
                    return url ? (
                      <Button key={field} variant="outline" size="sm" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {label}
                        </a>
                      </Button>
                    ) : (
                      <Button key={field} variant="outline" size="sm" disabled>
                        {label}
                      </Button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">This intake</p>
                  <div className="space-y-1.5 text-sm">
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Position</span>
                      <span className="font-medium">
                        {detailItem.orderIndex != null ? `#${detailItem.orderIndex + 1}` : "Retired"}
                      </span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">
                        {detailItem.session.durationMinutes ? `${detailItem.session.durationMinutes} minutes` : "Not set"}
                      </span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Completions</span>
                      <span className="font-medium">{detailItem.usage.completionCount}</span>
                    </p>
                    {detailItem.availableAt ? (
                      <p className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Available from</span>
                        <span className="font-medium">{format(new Date(detailItem.availableAt), "MMM d, yyyy · h:mm a")}</span>
                      </p>
                    ) : null}
                    {detailItem.firstReleasedAt ? (
                      <p className="flex justify-between gap-4">
                        <span className="text-muted-foreground">First released</span>
                        <span className="font-medium">{format(new Date(detailItem.firstReleasedAt), "MMM d, yyyy · h:mm a")}</span>
                      </p>
                    ) : null}
                    {detailItem.retiredAt ? (
                      <p className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Retired</span>
                        <span className="font-medium">{format(new Date(detailItem.retiredAt), "MMM d, yyyy · h:mm a")}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
