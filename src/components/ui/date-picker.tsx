"use client";

import * as React from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Custom calendar dropdown matching the app's Input styling, replacing the
 * native <input type="date"> whose browser-native picker can't be themed
 * to match the rest of the design. Value/onChange use the same
 * yyyy-MM-dd string the form schema already expects.
 */
export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(
  { value, onChange, onBlur, placeholder = "Select date", error, disabled, className, id },
  ref
) {
  const [open, setOpen] = React.useState(false);
  const today = React.useMemo(() => new Date(), []);
  const selectedDate = value ? parseISO(value) : undefined;
  const hasSelection = selectedDate && isValid(selectedDate);
  const [viewMonth, setViewMonth] = React.useState<Date>(hasSelection ? selectedDate! : today);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onBlur]);

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const years = React.useMemo(() => {
    const currentYear = today.getFullYear();
    return Array.from({ length: 100 }, (_, i) => currentYear - i);
  }, [today]);

  const isNextMonthDisabled = isAfter(startOfMonth(addMonths(viewMonth, 1)), today);

  return (
    <div ref={containerRef} className="relative">
      <Calendar className="pointer-events-none absolute left-3 top-3.5 z-10 h-4 w-4 text-muted-foreground" />
      <button
        ref={ref}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center rounded-xl border border-input bg-muted/50 pl-10 pr-4 py-2 text-left text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
          !hasSelection && "text-muted-foreground",
          error && "border-red-500 focus-visible:border-red-500",
          className
        )}
      >
        {hasSelection ? format(selectedDate!, "MMM d, yyyy") : placeholder}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-input bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#0E1116] transition-colors hover:bg-muted"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              <select
                value={viewMonth.getMonth()}
                onChange={(e) =>
                  setViewMonth(new Date(viewMonth.getFullYear(), Number(e.target.value), 1))
                }
                className="cursor-pointer rounded-md bg-transparent px-1 py-0.5 font-alt text-sm font-semibold text-[#0E1116] hover:bg-muted focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, m) => (
                  <option key={m} value={m}>
                    {format(new Date(2000, m, 1), "MMM")}
                  </option>
                ))}
              </select>
              <select
                value={viewMonth.getFullYear()}
                onChange={(e) =>
                  setViewMonth(new Date(Number(e.target.value), viewMonth.getMonth(), 1))
                }
                className="cursor-pointer rounded-md bg-transparent px-1 py-0.5 font-alt text-sm font-semibold text-[#0E1116] hover:bg-muted focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              disabled={isNextMonthDisabled}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#0E1116] transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((d, i) => (
              <div
                key={`${d}-${i}`}
                className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayDisabled = isAfter(day, today);
              const inMonth = isSameMonth(day, viewMonth);
              const selected = hasSelection && isSameDay(day, selectedDate!);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={dayDisabled}
                  onClick={() => {
                    onChange(format(day, "yyyy-MM-dd"));
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
                    !inMonth && "text-muted-foreground/50",
                    dayDisabled && "cursor-not-allowed opacity-30",
                    selected
                      ? "bg-linear-to-r from-blue-600 to-indigo-500 font-semibold text-white"
                      : !dayDisabled && "text-[#0E1116] hover:bg-muted"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
