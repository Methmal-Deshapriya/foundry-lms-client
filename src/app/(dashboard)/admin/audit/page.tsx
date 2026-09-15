"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useGetAuditLogsQuery } from "@/features/audit/auditApi";
import { useAppSelector } from "@/store/hooks";
import { selectAuthUser } from "@/features/auth/authSelectors";
import { canViewAuditLogs } from "@/lib/access";
import { CursorPagination } from "@/components/ui/cursor-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

const FILTER_DEBOUNCE_MS = 300;
const MIN_FILTER_LENGTH = 3;

const ACTION_OPTIONS = [
  { value: "", label: "all" },
  { value: "USER_PROMOTED", label: "user_promoted" },
  { value: "USER_DEMOTED", label: "user_demoted" },
  { value: "CATEGORY_CREATED", label: "category_created" },
  { value: "COURSE_CREATED", label: "course_created" },
  { value: "COURSE_PUBLISHED", label: "course_published" },
  { value: "COURSE_ARCHIVED", label: "course_archived" },
  { value: "STUDENT_ENROLLED", label: "student_enrolled" },
];

// Same categorization AuditLogTable used to color its status pills — kept
// as plain colored text here instead, since a pill badge doesn't fit a
// terminal line.
function actionColorClass(action: string) {
  if (action.includes("CREATED")) return "text-emerald-600";
  if (action.includes("DELETED")) return "text-destructive";
  if (action.includes("PROMOTED")) return "text-purple-600";
  return "text-primary";
}

const LIMIT = 50;

/**
 * Audit Logs — rendered as a light-mode terminal window rather than a
 * table: system activity reads naturally as a log stream (a timestamp, an
 * action, a description, an actor — one line each), which is exactly what
 * a terminal shows. No separate page title/description — the terminal IS
 * the whole page, filling the space below the top bar. The filter and
 * pagination controls live in the window's title bar and status bar so
 * the whole thing still functions like every other admin list, just
 * dressed as a terminal rather than a table.
 */
export default function AdminAuditPage() {
  const user = useAppSelector(selectAuthUser);
  const [action, setAction] = useState("");
  const [actorQuery, setActorQuery] = useState("");
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const page = cursors.length - 1;

  const debouncedActorQuery = useDebouncedValue(actorQuery.trim(), FILTER_DEBOUNCE_MS);
  const appliedActorQuery =
    debouncedActorQuery.length === 0 || debouncedActorQuery.length >= MIN_FILTER_LENGTH ? debouncedActorQuery : "";

  const { data, isLoading, isError, isFetching } = useGetAuditLogsQuery({
    limit: LIMIT,
    cursor: cursors[page],
    action: action || undefined,
    q: appliedActorQuery || undefined,
  });
  const logs = data?.logs ?? [];

  if (!canViewAuditLogs(user)) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-12 text-center">
        <h2 className="mb-2 text-2xl font-bold text-red-900">Access Restricted</h2>
        <p className="text-red-700">Only Super Administrators can view system audit logs.</p>
      </div>
    );
  }

  return (
    // Bleeds out of `main`'s p-6 padding on every side (lg only) so the
    // terminal is the whole page — reaching the top bar and every edge,
    // not a card floating with margins around it.
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm lg:h-[calc(100svh-4rem)] lg:min-h-0 lg:-m-6 lg:rounded-none lg:border-0 lg:shadow-none">
      {/* Title bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </div>
        <p className="font-mono text-xs text-muted-foreground">audit.log — system activity</p>
        <div className="ml-auto flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <label htmlFor="actor-filter">--actor=</label>
            <input
              id="actor-filter"
              type="text"
              placeholder="name or email"
              className="h-7 w-36 rounded border border-border bg-background px-1.5 font-mono text-xs text-foreground outline-hidden placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
              value={actorQuery}
              onChange={(event) => {
                setActorQuery(event.target.value);
                setCursors([undefined]);
              }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="action-filter">--action=</label>
            <select
              id="action-filter"
              className="h-7 rounded border border-border bg-background px-1.5 font-mono text-xs text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setCursors([undefined]);
              }}
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 font-mono text-sm lg:min-h-0"
        aria-busy={isLoading || isFetching}
      >
        {isLoading ? (
          <p role="status" aria-live="polite" className="text-muted-foreground">
            Loading audit.log…
          </p>
        ) : isError ? (
          <p role="alert" className="text-destructive">
            Could not load the audit logs. Please try again.
          </p>
        ) : logs.length === 0 ? (
          <p className="text-muted-foreground"># No audit events match the current filter.</p>
        ) : (
          <div className={cn("space-y-0.5", isFetching && "opacity-60")}>
            {logs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1 leading-relaxed">
                <span className="shrink-0 whitespace-nowrap text-muted-foreground/70">
                  [{format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}]
                </span>
                <span className={cn("shrink-0", actionColorClass(log.action), "font-semibold")}>{log.action}</span>
                <span className="min-w-0 wrap-break-word text-foreground">
                  {log.description || `${log.entityType}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}`}
                </span>
                <span className="text-muted-foreground/70">
                  · {log.actor.firstName} {log.actor.lastName}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 text-muted-foreground">
              <span>$</span>
              <span className="inline-block h-4 w-2 animate-pulse bg-foreground/60" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">
        <span>
          {logs.length} line{logs.length === 1 ? "" : "s"} shown
        </span>
        <CursorPagination
          page={page}
          hasMore={data?.pagination.hasMore ?? false}
          isFetching={isFetching}
          onPrevious={() => setCursors((current) => current.slice(0, -1))}
          onNext={() => {
            const nextCursor = data?.pagination.nextCursor;
            if (nextCursor) setCursors((current) => [...current, nextCursor]);
          }}
        />
      </div>
    </div>
  );
}
