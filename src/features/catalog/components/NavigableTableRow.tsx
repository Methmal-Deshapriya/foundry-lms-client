"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const INTERACTIVE_SELECTOR =
  "a,button,input,select,textarea,[role=menuitem],[data-no-row-navigation]";

export function NavigableTableRow({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));

  const navigateFromClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (!isInteractiveTarget(event.target)) router.push(href);
  };

  const navigateFromKeyboard = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (isInteractiveTarget(event.target)) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(href);
    }
  };

  return (
    <TableRow
      tabIndex={0}
      aria-label={label}
      className={cn(
        "cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        className,
      )}
      onClick={navigateFromClick}
      onKeyDown={navigateFromKeyboard}
      onMouseEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
    >
      {children}
    </TableRow>
  );
}
