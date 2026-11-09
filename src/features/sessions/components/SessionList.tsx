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

  // The live curriculum, then earlier (retired) sessions the learner still
  // has, in their own labelled group (code review M07-02).
  const live = sessions.filter((session) => !session.retired);
  const earlier = sessions.filter((session) => session.retired);
  const grid = (items: ClassroomSession[]) => (
    <div className="grid grid-cols-1 items-start gap-4 @lg:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4">
      {items.map((session) => (
        <SessionItem key={session.courseSessionId} enrollmentId={enrollmentId} session={session} isReadOnly={isReadOnly} />
      ))}
    </div>
  );

  return (
    // @container: this list sits inside a section whose actual width is
    // viewport minus the dashboard sidebar and (at lg+) a sticky aside —
    // two fixed-width siblings a viewport breakpoint can't see, so the
    // column count needs to track this container's own width instead.
    <div className="@container space-y-6">
      {grid(live)}
      {earlier.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Earlier sessions</h3>
          {grid(earlier)}
        </div>
      ) : null}
    </div>
  );
}
