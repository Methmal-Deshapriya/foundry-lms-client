"use client";

import type { ClassroomSession } from "../sessionsTypes";
import SessionItem from "./SessionItem";

interface SessionListProps {
  enrollmentId: string;
  sessions: ClassroomSession[];
  isReadOnly?: boolean;
}

export default function SessionList({
  enrollmentId,
  sessions,
  isReadOnly = false,
}: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">
          No sessions are available for you yet. New sessions will appear here
          when they are released.
        </p>
      </div>
    );
  }

  return (
    // @container: this list sits inside a section whose actual width is
    // viewport minus the dashboard sidebar and (at lg+) a sticky aside —
    // two fixed-width siblings a viewport breakpoint can't see, so the
    // column count needs to track this container's own width instead.
    <div className="@container">
      <div className="grid grid-cols-1 items-start gap-4 @sm:grid-cols-2 @xl:grid-cols-3">
        {sessions.map((session) => (
          <SessionItem
            key={session.courseSessionId}
            enrollmentId={enrollmentId}
            session={session}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    </div>
  );
}
