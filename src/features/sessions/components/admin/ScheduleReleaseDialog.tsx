"use client";

import { useMemo, useState } from "react";
import { DEFAULT_INTAKE_TIME_ZONE, formatInZone, wallTimeInZone, zoneLabel } from "@/lib/dates";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarClock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const YEARS_AHEAD = 5;

/**
 * Replaces window.prompt for "Schedule release" — a future-only calendar
 * (mirrors the visual language of the shared DatePicker, which is
 * deliberately past-only for date-of-birth fields, so the two don't share
 * an implementation) plus a time-of-day field, in a real Dialog rather than
 * a native browser alert. See the admin-page-patterns skill: no
 * window.prompt/confirm/alert anywhere in this app.
 */
export function ScheduleReleaseDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  timeZone = DEFAULT_INTAKE_TIME_ZONE,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (isoDate: string) => void;
  isLoading?: boolean;
  /** The intake's time zone; the picked time means this zone's clock. */
  timeZone?: string;
}) {
  // Refreshed each time `open` flips to true, rather than once at mount —
  // the parent keeps this component mounted for the page's whole lifetime,
  // so `open` (fully controlled by the parent) is the only reliable signal
  // that a new scheduling attempt has started. Adjusted during render
  // (not an effect) per React's "adjusting state when a prop changes"
  // pattern, since Radix's onOpenChange only fires on user-driven close
  // gestures (Escape/overlay), never when a controlled `open` prop flips
  // to true from outside.
  const [now, setNow] = useState(() => new Date());
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setNow(new Date());
  }
  const today = useMemo(() => startOfDay(now), [now]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [viewMonth, setViewMonth] = useState(today);

  const reset = () => {
    setSelectedDate(null);
    setTime("");
    setViewMonth(today);
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const years = useMemo(
    () => Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => today.getFullYear() + i),
    [today],
  );

  // The picked day and time are read as the intake's own clock (Sri Lanka by
  // default), not the admin's computer clock (code review M07-05).
  const combined = useMemo(() => {
    if (!selectedDate || !time) return null;
    const [hours, minutes] = time.split(":").map(Number);
    const day = new Date(selectedDate);
    return wallTimeInZone(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, timeZone);
  }, [selectedDate, time, timeZone]);

  const isInPast = combined != null && combined.getTime() <= now.getTime();
  const isPreviousMonthDisabled = !isSameMonth(viewMonth, today) && isBefore(startOfMonth(viewMonth), startOfMonth(today));

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Schedule release</DialogTitle>
          <DialogDescription>Pick when this session becomes visible to students.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="mb-1 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => setViewMonth((month) => subMonths(month, 1))}
              disabled={isPreviousMonthDisabled}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex items-center gap-1">
              <select
                value={viewMonth.getMonth()}
                onChange={(event) => setViewMonth(new Date(viewMonth.getFullYear(), Number(event.target.value), 1))}
                className="cursor-pointer rounded-md bg-transparent px-1 py-0.5 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none"
              >
                {Array.from({ length: 12 }, (_, month) => (
                  <option key={month} value={month}>
                    {format(new Date(2000, month, 1), "MMM")}
                  </option>
                ))}
              </select>
              <select
                value={viewMonth.getFullYear()}
                onChange={(event) => setViewMonth(new Date(Number(event.target.value), viewMonth.getMonth(), 1))}
                className="cursor-pointer rounded-md bg-transparent px-1 py-0.5 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setViewMonth((month) => addMonths(month, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label, index) => (
              <div key={`${label}-${index}`} className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const disabled = isBefore(day, today);
              const inMonth = isSameMonth(day, viewMonth);
              const selected = selectedDate && isSameDay(day, selectedDate);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
                    !inMonth && "text-muted-foreground/50",
                    disabled && "cursor-not-allowed opacity-30",
                    selected
                      ? "bg-[#191919] font-semibold text-white"
                      : !disabled && "text-foreground hover:bg-muted",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 pt-1">
            <Label htmlFor="schedule-time">Time</Label>
            <input
              id="schedule-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none"
            />
            <p className="text-xs text-muted-foreground">
              Times are {zoneLabel(timeZone)} ({timeZone}).
              {combined ? ` Students get it on ${formatInZone(combined, timeZone)}.` : ""}
            </p>
            {isInPast ? <p className="text-xs text-destructive">Pick a date and time in the future.</p> : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!combined || isInPast || isLoading}
            onClick={() => combined && onConfirm(combined.toISOString())}
            className="bg-[#191919] bg-none hover:bg-[#27272A]"
          >
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CalendarClock className="mr-2 size-4" />}
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
