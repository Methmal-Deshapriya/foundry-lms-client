"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useDashboardHeader } from "@/components/layout/DashboardHeaderContext";

/**
 * Mount point for PageToolbarPortal, rendered once in the dashboard layout
 * as a sibling of <main> (below DashboardHeader, above the scrolling area).
 * Empty by default — pages fill it via PageToolbarPortal. Matches <main>'s
 * own horizontal padding so portaled content lines up with the content
 * column beneath it.
 */
export function PageToolbarSlot() {
  const { setToolbarSlot } = useDashboardHeader();
  // px-6 only (no vertical padding) so this collapses to zero height and is
  // invisible on every page that doesn't use PageToolbarPortal — a page that
  // does is responsible for its own top spacing, same as <main>'s children
  // already are for bottom spacing.
  return <div ref={setToolbarSlot} className="shrink-0 px-6" />;
}

/**
 * Lets a page render "always visible, never scrolls" chrome — a title row,
 * KPI tiles, a tab strip — outside <main>'s scroll area entirely, the same
 * way the sidebar and DashboardHeader already stay put regardless of how
 * far the page content scrolls. This portals the DOM output into
 * PageToolbarSlot while keeping `children` in their original place in the
 * React tree, so context providers wrapping this (e.g. a Tabs.Root whose
 * TabsList is portaled here while its TabsContent renders normally in
 * <main>) keep working exactly as if nothing were portaled at all.
 */
export function PageToolbarPortal({ children }: { children: ReactNode }) {
  const { toolbarSlot } = useDashboardHeader();
  if (!toolbarSlot) return null;
  return createPortal(children, toolbarSlot);
}
