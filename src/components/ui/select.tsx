"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly string[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** Selected-option highlight color — "blue" (default) matches the public/auth primary; "black" matches the admin section's house black. */
  accent?: "blue" | "black";
}

const ACCENT_SELECTED_CLASSES: Record<NonNullable<SelectProps["accent"]>, string> = {
  blue: "bg-blue-50 font-medium text-blue-600",
  black: "bg-zinc-100 font-medium text-[#191919]",
};

/**
 * Custom dropdown matching the app's Input styling (rounded-xl, muted
 * background, leading icon) — no native <select> chrome, so it looks
 * consistent across browsers/OSes. The option list caps at max-h-64 and
 * scrolls internally, which matters for the 25-entry district list.
 *
 * The open option list is portaled to document.body and positioned with
 * `fixed` coordinates measured from the trigger button, rather than
 * rendered inline with `position: absolute`. An absolutely-positioned
 * descendant still contributes to its nearest scrollable ancestor's
 * scrollable-overflow area even though it's out of normal flow — inside a
 * scrollable Dialog body, a long option list would silently force the
 * dialog itself to grow a scrollbar just from being open. Portaling out to
 * body sidesteps that entirely.
 */
export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, onChange, onBlur, options, placeholder = "Select...", icon: Icon, error, disabled, className, id, accent = "blue" },
  ref
) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const listboxRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

  const updateCoords = React.useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 8, left: rect.left, width: rect.width });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    updateCoords();
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        listboxRef.current && !listboxRef.current.contains(target)
      ) {
        setOpen(false);
        onBlur?.();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open, onBlur, updateCoords]);

  return (
    <div ref={containerRef} className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-3.5 z-10 h-4 w-4 text-muted-foreground" />
      )}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center overflow-hidden rounded-xl border border-input bg-muted/50 pl-10 pr-10 py-2 text-left text-sm text-ellipsis whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          error && "border-red-500 focus-visible:border-red-500",
          className
        )}
      >
        {value || placeholder}
      </button>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-muted-foreground transition-transform",
          open && "rotate-180"
        )}
      />
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={listboxRef}
              role="listbox"
              // A Dialog (Radix) dismisses itself on any pointerdown it deems
              // "outside" its own DOM subtree — checked via a raw
              // document-level listener, not React's synthetic tree, so a
              // portaled-to-body listbox reads as outside even though it's a
              // React descendant of the Select that's rendered inside the
              // dialog. Stopping propagation here keeps that pointerdown
              // from ever reaching document, so the dialog never sees it and
              // never closes out from under the option the user is clicking.
              onPointerDown={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              // A modal Radix Dialog sets document.body's pointer-events to
              // "none" while open (to block interaction with anything behind
              // it) and only re-enables it for nodes registered in its own
              // internal layer stack. This listbox isn't one of those nodes
              // once portaled to body, so it silently inherits that
              // pointer-events: none and becomes unclickable unless
              // explicitly opted back in here.
              style={{ top: coords.top, left: coords.left, minWidth: coords.width, pointerEvents: "auto" }}
              className="catalog-scrollbar fixed z-50 max-h-64 w-max overflow-y-auto rounded-xl border border-input bg-white p-1.5 shadow-lg"
            >
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    value === option ? ACCENT_SELECTED_CLASSES[accent] : "text-[#0E1116]"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
});
