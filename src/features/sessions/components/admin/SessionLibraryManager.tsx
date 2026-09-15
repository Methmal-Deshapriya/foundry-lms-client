"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Archive,
  ArchiveRestore,
  Check,
  CheckCircle2,
  Copy,
  FileCheck2,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { useGetIntakesQuery } from "@/features/catalog/catalogApi";
import { RecordingPreview } from "./RecordingPreview";
import { getApiErrorMessage, isNormalizedApiError } from "@/lib/api";
import { hasPermission, PERMISSIONS } from "@/lib/access";
import { SESSION_STATUS_STYLES } from "@/lib/statusColors";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import {
  useArchiveSessionMutation,
  useAttachCourseSessionMutation,
  useBulkArchiveSessionsMutation,
  useCreateSessionMutation,
  useDeleteSessionMutation,
  useDuplicateSessionMutation,
  useGetSessionLibraryQuery,
  useUnarchiveSessionMutation,
  useUpdateSessionMutation,
} from "../../sessionsApi";
import type { SessionLibrarySummary } from "../../sessionsApi";
import type {
  CreateSessionRequest,
  LibrarySession,
  SessionStatus,
} from "../../sessionsTypes";

const STATUS_PILLS: {
  key: SessionStatus | "";
  label: string;
  countKey: keyof SessionLibrarySummary;
  activeClassName: string;
}[] = [
  { key: "", label: "All", countKey: "all", activeClassName: "border-primary bg-primary/10 text-primary" },
  {
    key: "READY",
    label: "Ready",
    countKey: "ready",
    activeClassName: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  },
  {
    key: "DRAFT",
    label: "Draft",
    countKey: "draft",
    activeClassName: "border-muted-foreground/30 bg-muted text-foreground",
  },
  {
    key: "ARCHIVED",
    label: "Archived",
    countKey: "archive",
    activeClassName: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  },
];

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const PAGE_SIZE_LABELS = PAGE_SIZE_OPTIONS.map((size) => `${size} / page`);
const FILTER_DEBOUNCE_MS = 300;
const MIN_FILTER_LENGTH = 3;
const REQUIRED_DELETE_TEXT = "DELETE";

const WIZARD_STEPS = [
  { step: 1 as const, label: "Details" },
  { step: 2 as const, label: "Links" },
  { step: 3 as const, label: "Preview" },
];

const STATUS_SELECT_LABELS = { DRAFT: "Draft", READY: "Ready" } as const;
function statusFromLabel(label: string): "DRAFT" | "READY" {
  return label === "Ready" ? "READY" : "DRAFT";
}

const emptyForm: CreateSessionRequest = {
  title: "",
  description: "",
  recordingUrl: "",
  materialUrl: "",
  quizUrl: "",
  feedbackUrl: "",
  durationMinutes: null,
  status: "DRAFT",
  tags: [],
};

const statusStyles = SESSION_STATUS_STYLES;

const eligibleAttachStatuses = new Set(["DRAFT", "OPEN_ACTIVE", "CLOSED_ACTIVE"]);

const INTERACTIVE_SELECTOR = "input,button,a,[role=menuitem],[data-no-row-navigation]";

function clean(form: CreateSessionRequest, tags: string[]): CreateSessionRequest {
  return {
    ...form,
    description: form.description || null,
    recordingUrl: form.recordingUrl || null,
    materialUrl: form.materialUrl || null,
    quizUrl: form.quizUrl || null,
    feedbackUrl: form.feedbackUrl || null,
    durationMinutes: form.durationMinutes || null,
    tags,
  };
}

// Detects a true no-op save (payload identical to the session being edited)
// so we neither call the update mutation nor show the "active use" prompt
// for a form that was opened and re-saved without changing anything.
function hasChanges(session: LibrarySession, payload: CreateSessionRequest): boolean {
  const normalize = (value: string | number | null | undefined) => value ?? null;
  const fields: Exclude<keyof CreateSessionRequest, "tags" | "status">[] = [
    "title",
    "description",
    "recordingUrl",
    "materialUrl",
    "quizUrl",
    "feedbackUrl",
    "durationMinutes",
  ];
  if (fields.some((field) => normalize(payload[field]) !== normalize(session[field]))) return true;
  if ((payload.status ?? session.status) !== session.status) return true;
  const nextTags = payload.tags ?? [];
  const prevTags = session.tags ?? [];
  return (
    nextTags.length !== prevTags.length || nextTags.some((tag, index) => tag !== prevTags[index])
  );
}

function formatUpdatedAt(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

// A recording lives wherever an admin puts it (Drive today, maybe a
// streaming host later) and most of those sources can't give us a real,
// permission-aware thumbnail without a storage/proxy pipeline we don't want.
// This is a deliberate generic placeholder, not a preview of the actual
// content — it just signals "this session has a recording attached."
function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export default function SessionLibraryManager() {
  const user = useAppSelector(selectAuthUser);
  const canManage = hasPermission(user, PERMISSIONS.SESSIONS_MANAGE_LIBRARY);
  const canDelete = hasPermission(user, PERMISSIONS.SESSIONS_DELETE_PERMANENTLY);

  const [q, setQ] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "">("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);

  const debouncedQ = useDebouncedValue(q.trim(), FILTER_DEBOUNCE_MS);
  const debouncedTag = useDebouncedValue(tagFilter.trim(), FILTER_DEBOUNCE_MS);
  // Debounce alone still fires a request for a single keystroke once the
  // user pauses — a minimum length keeps us from querying on 1-2 characters
  // that can't narrow the results down anyway. Below the threshold we just
  // hold off (params stay unchanged, so no extra request goes out) until
  // either enough letters are typed or the field is cleared entirely.
  const appliedQ = debouncedQ.length === 0 || debouncedQ.length >= MIN_FILTER_LENGTH ? debouncedQ : "";
  const appliedTag = debouncedTag.length === 0 || debouncedTag.length >= MIN_FILTER_LENGTH ? debouncedTag : "";

  const { data, isLoading, isError } = useGetSessionLibraryQuery({
    q: appliedQ || undefined,
    status: statusFilter || undefined,
    tag: appliedTag || undefined,
    limit: pageSize,
    offset,
  });

  const hasActiveFilters = Boolean(appliedQ || statusFilter || appliedTag);

  const [form, setForm] = useState<CreateSessionRequest>(emptyForm);
  const [tagsInput, setTagsInput] = useState("");
  const [editing, setEditing] = useState<LibrarySession | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [createSession, createState] = useCreateSessionMutation();
  const [updateSession, updateState] = useUpdateSessionMutation();
  const [archiveSession, archiveState] = useArchiveSessionMutation();
  const [unarchiveSession] = useUnarchiveSessionMutation();
  const [deleteSession, deleteState] = useDeleteSessionMutation();
  const [duplicateSession] = useDuplicateSessionMutation();
  const [bulkArchiveSessions, bulkArchiveState] = useBulkArchiveSessionsMutation();
  const [attachCourseSession] = useAttachCourseSessionMutation();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [detailSession, setDetailSession] = useState<LibrarySession | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<LibrarySession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibrarySession | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [bulkArchiveConfirmOpen, setBulkArchiveConfirmOpen] = useState(false);
  const [attachTarget, setAttachTarget] = useState<LibrarySession | null>(null);
  const [attachCourseIds, setAttachCourseIds] = useState<Set<string>>(new Set());
  const [attachCourseSearch, setAttachCourseSearch] = useState("");
  const [attaching, setAttaching] = useState(false);
  const [pendingSave, setPendingSave] = useState<CreateSessionRequest | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  const { data: intakesData, isFetching: isIntakesFetching } = useGetIntakesQuery(
    undefined,
    { skip: !attachTarget },
  );

  const reset = () => {
    setForm(emptyForm);
    setTagsInput("");
    setEditing(null);
    setFormOpen(false);
    setFieldErrors({});
    setPendingSave(null);
    setWizardStep(1);
  };

  const edit = (session: LibrarySession) => {
    setEditing(session);
    setForm({
      title: session.title,
      description: session.description ?? "",
      recordingUrl: session.recordingUrl ?? "",
      materialUrl: session.materialUrl ?? "",
      quizUrl: session.quizUrl ?? "",
      feedbackUrl: session.feedbackUrl ?? "",
      durationMinutes: session.durationMinutes,
      status: session.status === "ARCHIVED" ? "DRAFT" : session.status,
      tags: session.tags ?? [],
    });
    setTagsInput((session.tags ?? []).join(", "));
    setFieldErrors({});
    setWizardStep(1);
    setFormOpen(true);
  };

  const isEditingUsed = Boolean(editing?.usage.courseCount);
  const requiresRecording = form.status === "READY";
  const isStep1Valid = form.title.trim().length >= 3;
  const isStep2Valid = !requiresRecording || Boolean(form.recordingUrl?.trim());

  const performSave = async (payload: CreateSessionRequest) => {
    try {
      if (editing) {
        await updateSession({ id: editing.id, data: payload }).unwrap();
        toast.success("Session resource updated everywhere it is used");
      } else {
        await createSession(payload).unwrap();
        toast.success("Session resource created");
      }
      reset();
    } catch (error) {
      if (isNormalizedApiError(error) && error.field) {
        setFieldErrors({ [error.field]: error.message });
      } else {
        toast.error(getApiErrorMessage(error, "Could not save the session"));
      }
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (wizardStep === 1) {
      if (!isStep1Valid) return;
      setWizardStep(2);
      return;
    }
    if (wizardStep === 2) {
      if (!isStep2Valid) return;
      setWizardStep(3);
      return;
    }

    setFieldErrors({});
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const payload = clean(form, tags);

    if (editing && !hasChanges(editing, payload)) {
      reset();
      return;
    }

    if (isEditingUsed) {
      setPendingSave(payload);
      return;
    }
    await performSave(payload);
  };

  const confirmPendingSave = async () => {
    if (!pendingSave) return;
    await performSave(pendingSave);
    setPendingSave(null);
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveSession(archiveTarget.id).unwrap();
      toast.success("Session archived; existing delivery remains available");
      setArchiveTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not archive session"));
    }
  };

  const restore = async (session: LibrarySession) => {
    try {
      const restored = await unarchiveSession(session.id).unwrap();
      toast.success(
        restored.status === "READY"
          ? "Used session restored and kept ready"
          : "Unused session restored as a draft",
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not restore session"));
    }
  };

  const markReady = async (session: LibrarySession) => {
    try {
      await updateSession({ id: session.id, data: { status: "READY" } }).unwrap();
      toast.success("Session marked Ready");
    } catch (error) {
      if (isNormalizedApiError(error) && error.field === "recordingUrl") {
        toast.error("Add a recording URL before marking this session Ready");
      } else {
        toast.error(getApiErrorMessage(error, "Could not mark session Ready"));
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSession(deleteTarget.id).unwrap();
      toast.success("Unused session permanently deleted");
      setDeleteTarget(null);
      setDeleteConfirmation("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Permanent deletion failed"));
    }
  };

  const duplicate = async (session: LibrarySession) => {
    try {
      const created = await duplicateSession(session.id).unwrap();
      toast.success(`Duplicated as "${created.title}" — saved as a draft`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not duplicate the session"));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pageIds = data?.sessions.map(({ id }) => id) ?? [];
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      if (pageIds.every((id) => current.has(id))) return new Set();
      return new Set(pageIds);
    });
  };

  const confirmBulkArchive = async () => {
    try {
      const result = await bulkArchiveSessions([...selectedIds]).unwrap();
      if (result.summary.failed) {
        toast.warning(
          `${result.summary.archived} archived; ${result.summary.failed} failed. Some may already be in use elsewhere.`,
        );
      } else {
        toast.success(`${result.summary.archived} session(s) archived`);
      }
      setSelectedIds(new Set());
      setBulkArchiveConfirmOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Bulk archive failed"));
    }
  };

  const eligibleAttachIntakes = useMemo(() => {
    if (!attachTarget) return [];
    const usedIntakeIds = new Set(attachTarget.usage.courses.map((c) => c.intakeId));
    const search = attachCourseSearch.trim().toLowerCase();
    return (intakesData?.intakes ?? []).filter(
      (intake) =>
        !usedIntakeIds.has(intake.id) &&
        eligibleAttachStatuses.has(intake.status) &&
        (!search ||
          `${intake.course.title} ${intake.code}`.toLowerCase().includes(search)),
    );
  }, [attachTarget, intakesData, attachCourseSearch]);

  const toggleAttachCourseSelect = (intakeId: string) => {
    setAttachCourseIds((current) => {
      const next = new Set(current);
      if (next.has(intakeId)) next.delete(intakeId);
      else next.add(intakeId);
      return next;
    });
  };

  const allEligibleAttachIntakesSelected =
    eligibleAttachIntakes.length > 0 &&
    eligibleAttachIntakes.every((intake) => attachCourseIds.has(intake.id));
  const toggleAttachCourseSelectAll = () => {
    setAttachCourseIds((current) => {
      if (allEligibleAttachIntakesSelected) {
        const next = new Set(current);
        for (const intake of eligibleAttachIntakes) next.delete(intake.id);
        return next;
      }
      return new Set([...current, ...eligibleAttachIntakes.map((intake) => intake.id)]);
    });
  };

  const confirmAttach = async () => {
    if (!attachTarget || attachCourseIds.size === 0) return;
    setAttaching(true);
    // Attached one at a time (not Promise.all) so a failure on one intake
    // doesn't affect the rest — only the ones that actually succeeded are
    // cleared from the selection below.
    const succeededIds = new Set<string>();
    let failure: unknown = null;
    for (const intakeId of attachCourseIds) {
      try {
        await attachCourseSession({ intakeId, sessionId: attachTarget.id }).unwrap();
        succeededIds.add(intakeId);
      } catch (error) {
        failure = error;
      }
    }
    setAttaching(false);
    setAttachCourseIds((current) => new Set([...current].filter((id) => !succeededIds.has(id))));
    if (succeededIds.size > 0) {
      toast.success(
        succeededIds.size === 1
          ? "Session attached to the intake curriculum"
          : `Session attached to ${succeededIds.size} intake curricula`,
      );
    }
    if (failure) {
      toast.error(getApiErrorMessage(failure, "Could not attach to one of the selected intakes"));
    } else {
      setAttachTarget(null);
      setAttachCourseSearch("");
    }
  };

  const openDetail = (session: LibrarySession) => setDetailSession(session);
  const rowInteraction = (session: LibrarySession) => ({
    tabIndex: 0,
    "aria-label": `View details for ${session.title}`,
    className:
      "cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    onClick: (event: React.MouseEvent<HTMLTableRowElement>) => {
      if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
      openDetail(session);
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDetail(session);
      }
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.pagination.total / pageSize)) : 1;
  const currentPage = Math.floor(offset / pageSize) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1">
          <Input
            aria-label="Search Session Library"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setOffset(0);
            }}
            placeholder="Search title or description"
            className="h-9 w-56 shrink-0"
          />
          <Input
            aria-label="Filter by tag"
            value={tagFilter}
            onChange={(event) => {
              setTagFilter(event.target.value);
              setOffset(0);
            }}
            placeholder="Filter by tag"
            className="h-9 w-40 shrink-0"
          />
          <div className="flex shrink-0 gap-2" role="group" aria-label="Filter by status">
            {STATUS_PILLS.map(({ key, label, countKey, activeClassName }) => {
              const active = statusFilter === key;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setStatusFilter(key);
                    setOffset(0);
                  }}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? activeClassName
                      : "border-input text-muted-foreground hover:bg-muted",
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                      active ? "bg-background/60" : "bg-muted",
                    )}
                  >
                    {data?.summary?.[countKey] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {canManage ? (
          <Button className="shrink-0" onClick={() => { reset(); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New session resource
          </Button>
        ) : null}
      </div>

      {canManage && selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-4 py-2">
          <p className="text-sm font-medium">{selectedIds.size} selected</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkArchiveConfirmOpen(true)}
            >
              <Archive className="mr-2 h-4 w-4" /> Archive selected
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Clear selection
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border bg-card">
        <Table className="table-fixed">
          <TableCaption className="sr-only">Session Library resources</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              {canManage ? (
                <TableHead className="w-10 px-4" data-no-row-navigation>
                  <input
                    type="checkbox"
                    aria-label="Select all sessions on this page"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              ) : null}
              <TableHead className="w-auto">Resource</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="hidden w-20 sm:table-cell">Duration</TableHead>
              <TableHead className="hidden w-32 md:table-cell">Tags</TableHead>
              <TableHead className="hidden w-24 md:table-cell">Usage</TableHead>
              <TableHead className="hidden w-24 lg:table-cell">Updated</TableHead>
              <TableHead className="w-28 pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading library…
                  </span>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <p role="alert" className="text-sm text-destructive">
                    Could not load the Session Library.
                  </p>
                </TableCell>
              </TableRow>
            ) : data?.sessions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 whitespace-normal text-center text-muted-foreground"
                >
                  {hasActiveFilters
                    ? "No library sessions match these filters."
                    : "No library sessions yet. Create your first session resource above."}
                </TableCell>
              </TableRow>
            ) : (
              data?.sessions.map((session) => {
                const duration = formatDuration(session.durationMinutes);
                const tags = session.tags ?? [];

                return (
                  <TableRow key={session.id} {...rowInteraction(session)}>
                    {canManage ? (
                      <TableCell className="px-4" data-no-row-navigation>
                        <input
                          type="checkbox"
                          aria-label={`Select ${session.title}`}
                          checked={selectedIds.has(session.id)}
                          onChange={() => toggleSelect(session.id)}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell className="max-w-0 py-4">
                      <p className="truncate font-semibold" title={session.title}>
                        {session.title}
                      </p>
                      {session.description ? (
                        <p
                          className="mt-0.5 truncate text-xs text-muted-foreground"
                          title={session.description}
                        >
                          {session.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[session.status]}>
                        {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {duration ?? "—"}
                    </TableCell>
                    <TableCell className="hidden max-w-40 md:table-cell">
                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {session.usage.courseCount > 0
                        ? `${session.usage.courseCount} course(s)`
                        : "Unused"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {formatUpdatedAt(session.updatedAt)}
                    </TableCell>
                    <TableCell className="pr-6 text-right" data-no-row-navigation>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${session.title}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canManage && session.status !== "ARCHIVED" ? (
                            <DropdownMenuItem onSelect={() => edit(session)}>
                              <Pencil /> Edit
                            </DropdownMenuItem>
                          ) : null}
                          {canManage ? (
                            <DropdownMenuItem onSelect={() => duplicate(session)}>
                              <Copy /> Duplicate
                            </DropdownMenuItem>
                          ) : null}
                          {canManage ? <DropdownMenuSeparator /> : null}
                          {canManage && session.status === "DRAFT" ? (
                            <DropdownMenuItem onSelect={() => markReady(session)}>
                              <CheckCircle2 /> Mark Ready
                            </DropdownMenuItem>
                          ) : null}
                          {canManage && session.status !== "ARCHIVED" ? (
                            <DropdownMenuItem onSelect={() => setArchiveTarget(session)}>
                              <Archive /> Archive
                            </DropdownMenuItem>
                          ) : null}
                          {canManage && session.status === "ARCHIVED" ? (
                            <DropdownMenuItem onSelect={() => restore(session)}>
                              <ArchiveRestore /> Restore
                            </DropdownMenuItem>
                          ) : null}
                          {canDelete && session.status === "ARCHIVED" && session.usage.courseCount === 0 ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => {
                                setDeleteConfirmation("");
                                setDeleteTarget(session);
                              }}
                            >
                              <Trash2 /> Delete permanently
                            </DropdownMenuItem>
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

      {data && data.pagination.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <p>
              Showing {Math.min(offset + 1, data.pagination.total)}–
              {Math.min(offset + data.sessions.length, data.pagination.total)} of{" "}
              {data.pagination.total}
            </p>
            <Label htmlFor="session-page-size" className="sr-only">
              Rows per page
            </Label>
            <Select
              id="session-page-size"
              className="h-9 w-28 rounded-md py-0 pl-3 pr-8 text-sm"
              options={PAGE_SIZE_LABELS}
              value={`${pageSize} / page`}
              onChange={(label) => {
                setPageSize(Number(label.split(" ")[0]));
                setOffset(0);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={offset === 0}
              onClick={() => setOffset((value) => Math.max(0, value - pageSize))}
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={!data.pagination.hasMore}
              onClick={() => setOffset((value) => value + pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <Sheet open={Boolean(detailSession)} onOpenChange={(open) => !open && setDetailSession(null)}>
        <SheetContent className="flex flex-col sm:max-w-lg">
          {detailSession ? (
            <>
              <SheetHeader>
                <SheetTitle>{detailSession.title}</SheetTitle>
                <SheetDescription>
                  {detailSession.description || "No description provided."}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-5 overflow-y-auto px-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={statusStyles[detailSession.status]}>
                    {detailSession.status.charAt(0) + detailSession.status.slice(1).toLowerCase()}
                  </Badge>
                  {(detailSession.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <RecordingPreview url={detailSession.recordingUrl} />

                <div className="grid grid-cols-3 gap-2">
                  {(["materialUrl", "quizUrl", "feedbackUrl"] as const).map((field) => {
                    const label =
                      field === "materialUrl" ? "Material" : field === "quizUrl" ? "Quiz" : "Feedback";
                    const url = detailSession[field];
                    return url ? (
                      <Button
                        key={field}
                        variant="outline"
                        size="sm"
                        className="h-auto whitespace-normal py-1.5 text-center leading-tight"
                        asChild
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {label}
                        </a>
                      </Button>
                    ) : (
                      <Button
                        key={field}
                        variant="outline"
                        size="sm"
                        className="h-auto whitespace-normal py-1.5 text-center leading-tight"
                        disabled
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>

                {canManage && detailSession.status === "READY" ? (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setAttachTarget(detailSession);
                      setDetailSession(null);
                    }}
                  >
                    <Link2 className="mr-2 h-4 w-4" /> Attach to a course
                  </Button>
                ) : canDelete && detailSession.status === "ARCHIVED" && detailSession.usage.courseCount === 0 ? (
                  <Button
                    className="w-full bg-linear-to-r from-red-600 to-rose-500 text-white hover:opacity-90"
                    onClick={() => {
                      setDeleteConfirmation("");
                      setDeleteTarget(detailSession);
                      setDetailSession(null);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete permanently
                  </Button>
                ) : null}

                <div className="space-y-2">
                  <p className="text-sm font-semibold">
                    Used in ({detailSession.usage.intakeCount})
                  </p>
                  {detailSession.usage.courses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Not attached to any intake yet.</p>
                  ) : (
                    <div className="max-h-56 space-y-2 overflow-y-auto">
                      {detailSession.usage.courses.map((usage) => {
                        const meta = (
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{usage.courseTitle}</p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {usage.intakeCode}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {usage.deliveryStatus}
                              </Badge>
                              {usage.retiredAt ? (
                                <span className="text-xs text-muted-foreground">Retired</span>
                              ) : null}
                            </div>
                          </div>
                        );
                        return usage.serviceSlug ? (
                          <a
                            key={usage.courseSessionId}
                            href={`/admin/services/${usage.serviceSlug}/categories/${usage.categoryId}/courses/${usage.courseId}/intakes/${usage.intakeId}`}
                            className="block rounded-md border p-3 text-sm transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {meta}
                          </a>
                        ) : (
                          <div key={usage.courseSessionId} className="rounded-md border p-3 text-sm">
                            {meta}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : reset())}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit library resource" : "Create library resource"}</DialogTitle>
            <DialogDescription>
              Recording, material, quiz, and feedback URLs stay on this reusable resource.
            </DialogDescription>
            <div className="flex items-center gap-2 pt-4">
              {WIZARD_STEPS.map(({ step, label }, index) => (
                <Fragment key={step}>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                        wizardStep === step
                          ? "bg-linear-to-r from-blue-600 to-indigo-500 text-white"
                          : wizardStep > step
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {wizardStep > step ? <Check className="size-3.5" aria-hidden="true" /> : step}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        wizardStep === step ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                  {index < WIZARD_STEPS.length - 1 ? (
                    <div className={cn("h-px flex-1", wizardStep > step ? "bg-primary/40" : "bg-border")} />
                  ) : null}
                </Fragment>
              ))}
            </div>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-6 pt-2">
            {wizardStep === 1 ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="session-title">
                      Title <span className="text-red-500" aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="session-title"
                      required
                      value={form.title}
                      onChange={(event) => setForm({ ...form, title: event.target.value })}
                    />
                    {fieldErrors.title ? (
                      <p className="text-xs font-medium text-destructive" role="alert">{fieldErrors.title}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-duration">Duration (minutes)</Label>
                    <Input
                      id="session-duration"
                      type="number"
                      min={1}
                      value={form.durationMinutes ?? ""}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          durationMinutes: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                    />
                    {fieldErrors.durationMinutes ? (
                      <p className="text-xs font-medium text-destructive" role="alert">{fieldErrors.durationMinutes}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-status">Status</Label>
                    <Select
                      id="session-status"
                      className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"
                      options={isEditingUsed ? [STATUS_SELECT_LABELS.READY] : [STATUS_SELECT_LABELS.DRAFT, STATUS_SELECT_LABELS.READY]}
                      value={STATUS_SELECT_LABELS[form.status as "DRAFT" | "READY"]}
                      onChange={(label) => setForm({ ...form, status: statusFromLabel(label) })}
                    />
                    {isEditingUsed ? (
                      <p className="text-xs text-muted-foreground">
                        Used by a course, so this resource can&apos;t return to Draft — archive it instead to stop new use.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-tags">Tags (comma-separated)</Label>
                    <Input
                      id="session-tags"
                      value={tagsInput}
                      onChange={(event) => setTagsInput(event.target.value)}
                      placeholder="javascript, intro, week-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-description">Description</Label>
                  <textarea
                    id="session-description"
                    className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none"
                    value={form.description ?? ""}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                  />
                </div>
              </div>
            ) : null}

            {wizardStep === 2 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {(["recordingUrl", "materialUrl", "quizUrl", "feedbackUrl"] as const).map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={`session-${field}`}>
                      {field.replace("Url", " URL")}{" "}
                      {field === "recordingUrl" && requiresRecording ? (
                        <span className="text-red-500" aria-hidden="true">*</span>
                      ) : null}
                    </Label>
                    <Input
                      id={`session-${field}`}
                      type="url"
                      value={form[field] ?? ""}
                      onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                      placeholder="https://"
                    />
                    {fieldErrors[field] ? (
                      <p className="text-xs font-medium text-destructive" role="alert">{fieldErrors[field]}</p>
                    ) : null}
                  </div>
                ))}
                {requiresRecording && !form.recordingUrl?.trim() ? (
                  <p className="text-xs text-muted-foreground md:col-span-2">
                    A recording URL is required to mark this resource Ready.
                  </p>
                ) : null}
              </div>
            ) : null}

            {wizardStep === 3 ? (
              <div className="space-y-4">
                <RecordingPreview url={form.recordingUrl} />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs", statusStyles[form.status as SessionStatus])}>
                    {STATUS_SELECT_LABELS[form.status as "DRAFT" | "READY"]}
                  </Badge>
                  {formatDuration(form.durationMinutes) ? (
                    <span className="text-xs text-muted-foreground">{formatDuration(form.durationMinutes)}</span>
                  ) : null}
                </div>
                <div>
                  <p className="text-sm font-semibold">{form.title || "Untitled resource"}</p>
                  {form.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>
                  ) : null}
                </div>
                {tagsInput.trim() ? (
                  <div className="flex flex-wrap gap-1">
                    {tagsInput
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                  </div>
                ) : null}
                <div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
                  {(["recordingUrl", "materialUrl", "quizUrl", "feedbackUrl"] as const).map((field) => (
                    <div key={field} className="flex items-center gap-2 text-sm">
                      {form[field] ? (
                        <FileCheck2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <span className="size-3.5 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />
                      )}
                      <span className={form[field] ? "text-foreground" : "text-muted-foreground"}>
                        {field.replace("Url", " URL")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => (wizardStep === 1 ? reset() : setWizardStep((step) => (step - 1) as 1 | 2 | 3))}
              >
                {wizardStep === 1 ? (
                  "Cancel"
                ) : (
                  <>
                    <ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Back
                  </>
                )}
              </Button>
              {wizardStep < 3 ? (
                <Button type="submit" disabled={wizardStep === 1 ? !isStep1Valid : !isStep2Valid}>
                  Next <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button disabled={createState.isLoading || updateState.isLoading} type="submit">
                  {(createState.isLoading || updateState.isLoading) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save resource
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(archiveTarget)} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive session?</AlertDialogTitle>
            <AlertDialogDescription>
              Archive &quot;{archiveTarget?.title}&quot;? Existing learner access is preserved; it just stops new use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={archiveState.isLoading} onClick={confirmArchive}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(pendingSave)} onOpenChange={(open) => !open && setPendingSave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update a resource in active use?</AlertDialogTitle>
            <AlertDialogDescription>
              This resource is used by {editing?.usage.intakeCount} intake(s) across{" "}
              {editing?.usage.courseCount} course(s). Saving changes updates every
              authorized learner view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateState.isLoading}
              onClick={() => void confirmPendingSave()}
            >
              {updateState.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkArchiveConfirmOpen} onOpenChange={setBulkArchiveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {selectedIds.size} session(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Existing learner access is preserved for any that are in use; each is archived independently, so a failure on one won&apos;t block the rest.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={bulkArchiveState.isLoading} onClick={confirmBulkArchive}>
              Archive selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteConfirmation("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{deleteTarget?.title}&quot; from the database. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="session-delete-confirmation">
              Type <span className="font-mono">{REQUIRED_DELETE_TEXT}</span> to confirm
            </Label>
            <Input
              id="session-delete-confirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteState.isLoading || deleteConfirmation !== REQUIRED_DELETE_TEXT}
              onClick={confirmDelete}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(attachTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setAttachTarget(null);
            setAttachCourseIds(new Set());
            setAttachCourseSearch("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Attach to intake</DialogTitle>
            <DialogDescription>
              Attach &quot;{attachTarget?.title}&quot; to one or more intakes that haven&apos;t used it yet. To
              restore a retired attachment instead, use that intake&apos;s curriculum page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              aria-label="Search intakes"
              placeholder="Search by course title or intake code"
              value={attachCourseSearch}
              onChange={(event) => setAttachCourseSearch(event.target.value)}
            />
            {eligibleAttachIntakes.length > 0 ? (
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={allEligibleAttachIntakesSelected}
                  onChange={toggleAttachCourseSelectAll}
                />
                Select all{attachCourseSearch ? " matching" : ""} ({eligibleAttachIntakes.length})
              </label>
            ) : null}
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
              {isIntakesFetching ? (
                <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading intakes…
                </p>
              ) : eligibleAttachIntakes.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No eligible intakes found.
                </p>
              ) : (
                eligibleAttachIntakes.map((intake) => (
                  <label
                    key={intake.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted/60"
                  >
                    <input
                      type="checkbox"
                      checked={attachCourseIds.has(intake.id)}
                      onChange={() => toggleAttachCourseSelect(intake.id)}
                    />
                    <span>
                      <span className="block text-sm font-semibold">{intake.course.title}</span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {intake.code} · {intake.category.title}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
            <Button disabled={attachCourseIds.size === 0 || attaching} onClick={confirmAttach}>
              {attaching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              {attachCourseIds.size > 1 ? `Attach to ${attachCourseIds.size} intakes` : "Attach session"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
