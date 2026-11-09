"use client";

import type { MouseEvent } from "react";
import { API_BASE_URL } from "@/lib/constants";
import {
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  Lock,
  MessageSquare,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCompleteClassroomSessionMutation,
  useUncompleteClassroomSessionMutation,
} from "../sessionsApi";
import type { ClassroomSession } from "../sessionsTypes";
import { getApiErrorMessage } from "@/lib/api";
import SessionThumbnail from "./SessionThumbnail";

interface SessionItemProps {
  enrollmentId: string;
  session: ClassroomSession;
  isReadOnly?: boolean;
}

export default function SessionItem({
  enrollmentId,
  session,
  isReadOnly = false,
}: SessionItemProps) {
  const [complete, { isLoading: isCompleting }] =
    useCompleteClassroomSessionMutation();
  const [uncomplete, { isLoading: isUncompleting }] =
    useUncompleteClassroomSessionMutation();
  const isUpdating = isCompleting || isUncompleting;

  const handleToggleComplete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isReadOnly) return;
    const input = {
      enrollmentId,
      courseSessionId: session.courseSessionId,
    };

    try {
      if (session.completed) {
        await uncomplete(input).unwrap();
        toast.success("Marked as incomplete");
      } else {
        await complete(input).unwrap();
        toast.success("Session completed!");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update progress."));
    }
  };

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-colors hover:border-zinc-400">
      <SessionThumbnail
        title={session.title}
        completed={session.completed}
        isReadOnly={isReadOnly}
        isUpdating={isUpdating}
        onToggleComplete={handleToggleComplete}
      />

      <div className="space-y-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
            {/* A retired session's old number can clash with the live
                curriculum's, so it is labelled instead (M07-02). */}
            {session.retired ? "Earlier session" : `Session ${(session.orderIndex ?? 0) + 1}`}
          </p>
          {session.durationMinutes ? (
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {session.durationMinutes}m
            </span>
          ) : null}
        </div>

        {session.description ? (
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {session.description}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-1.5 pt-1.5">
          <ResourceLink href={resolveFileHref(session.recordingUrl, session.recordingIsFile)} label="Recording" icon={Video} />
          <ResourceLink href={resolveFileHref(session.materialUrl, session.materialIsFile)} label="Materials" icon={FileText} />
          <ResourceLink href={session.quizUrl} label="Quiz" icon={HelpCircle} />
          <ResourceLink href={session.feedbackUrl} label="Feedback" icon={MessageSquare} />
        </div>
      </div>
    </article>
  );
}

// Uploaded recordings and materials come as an API path that checks access
// and redirects to a freshly signed link on every click, so a link never
// goes stale while the page is open (code review M07-01). It is resolved
// against the API's origin; with a relative API base (dev proxy) it stays
// relative to this site.
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
})();

function resolveFileHref(href: string | null | undefined, isFile?: boolean) {
  if (!href || !isFile) return href;
  return `${API_ORIGIN}${href}`;
}

// One consistent, neutral style for every resource type instead of a
// different loud color per link — the icon is enough to tell them apart.
function ResourceLink({
  href,
  label,
  icon: Icon,
}: {
  href: string | null | undefined;
  label: string;
  icon: typeof Video;
}) {
  if (!href) {
    return (
      <div
        aria-disabled="true"
        title="Not available for this session"
        className="flex items-center gap-2 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-muted-foreground/50"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate text-xs font-semibold">{label}</span>
        <Lock className="ml-auto h-3.5 w-3.5 shrink-0" />
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-[#191919]"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate text-xs font-semibold text-foreground">{label}</span>
      <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 opacity-50" />
    </a>
  );
}
