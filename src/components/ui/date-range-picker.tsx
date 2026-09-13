"use client";

import * as React from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export type DateRange = { from?: string; to?: string };

/**
 * A calendar-grid date-range picker, admin-styled (bg-card/border-border,
 * not the public form's hex palette) — the range-select sibling of
 * src/components/ui/date-picker.tsx, same hand-rolled date-fns calendar
 * grid rather than a new dependency (react-day-picker isn't installed;
 * this app already prefers a themed custom component over a themed
 * third-party one). First click starts the range, second click completes
 * it (swapping if it lands before the start) and closes the popover.
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = "Custom range",
  className,
}: {
  value: DateRange;
  onChange: (value: DateRange) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const today = React.useMemo(() => new Date(), []);
  const fromDate = value.from ? parseISO(value.from) : undefined;
  const toDate = value.to ? parseISO(value.to) : undefined;
  const hasRange = fromDate && isValid(fromDate) && toDate && isValid(toDate);
  const [viewMonth, setViewMonth] = React.useState<Date>(fromDate && isValid(fromDate) ? fromDate : today);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const isNextMonthDisabled = isAfter(startOfMonth(addMonths(viewMonth, 1)), today);

  const handleDayClick = (day: Date) => {
    if (!fromDate || !isValid(fromDate) || hasRange) {
      // Starting a fresh range — clears any completed one.
      onChange({ from: format(day, "yyyy-MM-dd"), to: undefined });
      return;
    }
    // Completing the range — swap if the second click lands before the first.
    const [start, end] = isBefore(day, fromDate) ? [day, fromDate] : [fromDate, day];
    onChange({ from: format(start, "yyyy-MM-dd"), to: format(end, "yyyy-MM-dd") });
    setOpen(false);
  };

  const label = hasRange
    ? `${format(fromDate!, "MMM d")} – ${format(toDate!, "MMM d, yyyy")}`
    : fromDate && isValid(fromDate)
      ? `${format(fromDate, "MMM d, yyyy")} – …`
      : placeholder;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className={cn("gap-1.5", !hasRange && !fromDate && "text-muted-foreground")}
      >
        <CalendarIcon className="size-3.5" aria-hidden="true" />
        {label}
      </Button>

      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-72 rounded-md border border-border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-foreground">{format(viewMonth, "MMMM yyyy")}</p>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              disabled={isNextMonthDisabled}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((d, i) => (
              <div key={`${d}-${i}`} className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayDisabled = isAfter(day, today);
              const inMonth = isSameMonth(day, viewMonth);
              const isStart = fromDate && isValid(fromDate) && isSameDay(day, fromDate);
              const isEnd = toDate && isValid(toDate) && isSameDay(day, toDate);
              const inRange =
                fromDate && toDate && isValid(fromDate) && isValid(toDate)
                  ? isWithinInterval(day, { start: fromDate, end: toDate })
                  : false;
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={dayDisabled}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
                    !inMonth && "text-muted-foreground/50",
                    dayDisabled && "cursor-not-allowed opacity-30",
                    inRange && !isStart && !isEnd && "rounded-none bg-primary/15 text-foreground",
                    (isStart || isEnd) && "bg-primary font-semibold text-primary-foreground",
                    !dayDisabled && !inRange && !isStart && !isEnd && "text-foreground hover:bg-muted",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex justify-end border-t border-border pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange({ from: undefined, to: undefined });
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
